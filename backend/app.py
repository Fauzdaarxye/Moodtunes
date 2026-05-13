"""
app.py – Moodspot Backend API  (upgraded)

Key changes vs original:
  1. NEARBY MATCHING – songs do not need exact audio-feature percentages.
     They must sit inside a reasonable nearby band, then are ranked by
     closeness to the requested profile.
  2. POPULARITY-FIRST – Spotify `popularity` (0-100) is used as a primary
     sort signal so well-known, listenable tracks surface before obscure ones.
  3. RARE MODE (?rare=true / POST body) – inverts the popularity sort so
     low-popularity, niche tracks are preferred. Lets users intentionally
     discover hidden gems.
  4. IMPROVED QUERY POOLS – more genre-diverse, era-diverse queries per mood
     to increase the variety and quality of fetched tracks.
  5. SCORE BLENDING – final rank = 0.45 * mood_fit + 0.55 * popularity_norm
     (or inverted popularity in rare mode), so the best-fit AND most popular
     tracks float to the top naturally.

sp.recommendations() and sp.audio_features() were removed/restricted by
Spotify in Nov 2024.  We rely on sp.search() + random offsets + soft scoring.
"""

import os, json, pickle, random, math
import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials

# ── bootstrap ─────────────────────────────────────────────────────────────────
load_dotenv()
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# ── Spotify client ────────────────────────────────────────────────────────────
def make_spotify():
    cid    = os.environ.get("SPOTIFY_CLIENT_ID", "")
    secret = os.environ.get("SPOTIFY_CLIENT_SECRET", "")
    if not cid or not secret:
        print("⚠️  SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET not set in .env")
        return None
    return spotipy.Spotify(
        auth_manager=SpotifyClientCredentials(client_id=cid, client_secret=secret),
        requests_timeout=10,
    )

sp = make_spotify()

# ── ML model ──────────────────────────────────────────────────────────────────
HERE  = os.path.dirname(os.path.abspath(__file__))
MODEL = os.path.join(HERE, "..", "model")

def load_model():
    with open(os.path.join(MODEL, "mood_classifier.pkl"),  "rb") as f: clf     = pickle.load(f)
    with open(os.path.join(MODEL, "scaler.pkl"),           "rb") as f: scaler  = pickle.load(f)
    with open(os.path.join(MODEL, "label_encoder.pkl"),    "rb") as f: le      = pickle.load(f)
    with open(os.path.join(MODEL, "metrics.json"))              as f: metrics = json.load(f)
    return clf, scaler, le, metrics

try:
    clf, scaler, le, metrics = load_model()
    print("✅ ML model loaded")
except Exception as e:
    clf = scaler = le = metrics = None
    print(f"⚠️  Model not loaded: {e}  →  run: python model/train_model.py")

FEATURES = ["valence", "energy", "danceability", "tempo", "acousticness", "loudness"]

# ── Mood config ───────────────────────────────────────────────────────────────
# Default audio-feature targets per mood.
MOOD_DEFAULT_FEATURES = {
    "Happy": {
        "valence": 0.75, "energy": 0.72, "danceability": 0.68,
        "tempo": 118.0,  "acousticness": 0.12, "loudness": -5.5,
    },
    "Sad": {
        "valence": 0.28, "energy": 0.32, "danceability": 0.35,
        "tempo": 82.0,   "acousticness": 0.58, "loudness": -9.0,
    },
    "Energetic": {
        "valence": 0.62, "energy": 0.88, "danceability": 0.72,
        "tempo": 132.0,  "acousticness": 0.08, "loudness": -4.0,
    },
    "Calm": {
        "valence": 0.48, "energy": 0.22, "danceability": 0.28,
        "tempo": 88.0,   "acousticness": 0.52, "loudness": -12.0,
    },
}

# ── SOFT-SCORING tolerances ───────────────────────────────────────────────────
# A song inside target ± tolerance receives full marks for that feature.
# Beyond that band, the score decays smoothly instead of failing immediately.
FEATURE_TOLERANCES = {
    "valence":      0.16,
    "energy":       0.16,
    "danceability": 0.18,
    "tempo":        22.0,
    "acousticness": 0.24,
    "loudness":     4.0,
}

# Maximum nearby distance allowed before a track is excluded. This keeps the
# list bounded by the user's percentages while still accepting natural variance.
FEATURE_MATCH_LIMITS = {
    "valence":      0.34,
    "energy":       0.34,
    "danceability": 0.36,
    "tempo":        55.0,
    "acousticness": 0.48,
    "loudness":     10.0,
}

# Weight of each feature in the mood-fit score (must sum to 1).
FEATURE_WEIGHTS = {
    "valence":      0.30,
    "energy":       0.28,
    "danceability": 0.16,
    "tempo":        0.12,
    "acousticness": 0.10,
    "loudness":     0.04,
}

POPULARITY_FIT_WEIGHT = 0.45
POPULARITY_RANK_WEIGHT = 0.55
POPULAR_MODE_MIN_POPULARITY = 35
POPULAR_MODE_STRONG_POPULARITY = 50
SEARCH_ONLY_MIN_POPULARITY = 55
SEARCH_ONLY_RELAXED_POPULARITY = 40

LOW_QUALITY_TERMS = (
    "karaoke", "tribute", "cover version", "made famous by", "sound alike",
    "instrumental version", "workout remix", "8d audio", "sped up", "slowed",
)

MOOD_BLOCK_TERMS = {
    "Energetic": ("meditation", "yoga", "sleep", "study", "relaxing", "calm"),
    "Happy": ("sad", "sleep", "meditation"),
    "Sad": ("workout", "party anthem", "club mix"),
    "Calm": ("workout", "pump up", "party anthem"),
}

# ── Expanded query pools ──────────────────────────────────────────────────────
# More genre-diverse queries → higher quality songs, not just niche unknowns.
MOOD_CONFIG = {
    "Happy": {
        "queries": [
            # Pop hits / mainstream
            "happy pop hits 2024", "feel good pop 2023", "upbeat pop anthems",
            "summer bops 2024", "dance pop hits", "positive vibes playlist",
            # Genre diversity
            "happy hip hop beats", "cheerful indie pop", "uplifting soul",
            "feel good funk", "happy r&b 2023", "sunshine reggae",
            # Era diversity
            "happy 2000s hits", "feel good 90s pop", "upbeat 80s classics",
            # Trending / chart
            "hot 100 happy songs", "viral feel good songs", "tiktok happy songs",
            "pop hits summer", "party anthems",
        ],
        "popular_queries": [
            "feel good hits", "happy pop hits", "upbeat pop hits",
            "summer hits", "dance pop hits", "good mood songs",
        ],
    },
    "Sad": {
        "queries": [
            # Pop / mainstream sad
            "sad pop songs 2024", "heartbreak pop 2023", "emotional pop ballads",
            "breakup songs playlist", "crying songs hits",
            # Genre diversity
            "sad indie folk", "melancholic rnb", "sad alternative",
            "emotional hip hop", "sad piano songs", "melancholy ballads",
            "acoustic heartbreak songs", "sad ambient",
            # Era diversity
            "sad 90s songs", "emotional 2000s ballads", "sad 2010s hits",
            # Trending
            "viral sad songs tiktok", "sad songs trending", "rainy day music",
        ],
        "popular_queries": [
            "sad pop hits", "breakup hits", "heartbreak songs",
            "emotional pop songs", "sad acoustic hits", "sad songs",
        ],
    },
    "Energetic": {
        "queries": [
            # Pop / mainstream energetic
            "workout pop hits 2024", "pump up songs 2023", "high energy pop",
            "gym playlist hits", "running music 2024",
            # Genre diversity
            "edm bangers 2024", "house music hits", "energetic hip hop",
            "trap bangers", "rock workout songs", "energetic k-pop",
            "latin dance hits", "afrobeats workout",
            # Era diversity
            "90s dance hits", "2000s club bangers", "80s workout classics",
            # Trending
            "tiktok workout songs", "viral dance songs 2024", "festival anthems",
        ],
        "popular_queries": [
            "workout hits", "gym hits", "pump up songs", "party hits",
            "dance hits", "edm hits", "running songs", "club hits",
            "hip hop workout hits", "pop dance hits",
        ],
    },
    "Calm": {
        "queries": [
            # Pop / mainstream calm
            "calm pop songs 2024", "relaxing pop 2023", "soft pop hits",
            "peaceful songs playlist",
            # Genre diversity
            "lofi hip hop chill", "acoustic indie chill", "ambient study music",
            "jazz chill playlist", "bossa nova relaxing", "soft piano music",
            "meditation music", "sleep music 2024",
            # Era diversity
            "calm 90s songs", "mellow 2000s", "relaxing 2010s hits",
            # Trending
            "viral chill songs", "coffee shop music", "focus music trending",
            "calm bedroom pop",
        ],
        "popular_queries": [
            "calm pop hits", "chill hits", "relaxing songs",
            "soft pop hits", "acoustic hits", "mellow songs",
        ],
    },
}

# ── helpers ───────────────────────────────────────────────────────────────────
def _parse_feature_overrides(raw: dict) -> dict:
    out = {}
    if not raw:
        return out
    for key in ("valence", "energy", "danceability", "acousticness"):
        if key not in raw or raw[key] is None or raw[key] == "":
            continue
        try:
            out[key] = max(0.0, min(1.0, float(raw[key])))
        except (TypeError, ValueError):
            pass
    if raw.get("tempo") not in (None, ""):
        try:
            out["tempo"] = max(40.0, min(220.0, float(raw["tempo"])))
        except (TypeError, ValueError):
            pass
    if raw.get("loudness") not in (None, ""):
        try:
            out["loudness"] = max(-60.0, min(0.0, float(raw["loudness"])))
        except (TypeError, ValueError):
            pass
    return out

def merged_feature_targets(mood: str, overrides: dict) -> dict:
    base = dict(MOOD_DEFAULT_FEATURES.get(mood, MOOD_DEFAULT_FEATURES["Happy"]))
    base.update(overrides)
    return base

def predict_mood(af: dict) -> tuple:
    if clf is None:
        return "Unknown", 0.0
    vec   = np.array([[af.get(f, 0) for f in FEATURES]])
    vec_s = scaler.transform(vec)
    idx   = clf.predict(vec_s)[0]
    proba = clf.predict_proba(vec_s)[0]
    return le.inverse_transform([idx])[0], round(float(proba.max()) * 100, 1)

def matches_nearby_profile(af: dict, targets: dict) -> bool:
    """
    True when a track is close enough to the requested feature percentages.
    Missing optional fields are ignored, but valence/energy/danceability/tempo
    must be present when Spotify returns audio features.
    """
    for feat in ("valence", "energy", "danceability", "tempo"):
        if af.get(feat) is None or targets.get(feat) is None:
            return False

    for feat, max_diff in FEATURE_MATCH_LIMITS.items():
        target = targets.get(feat)
        actual = af.get(feat)
        if target is None or actual is None:
            continue
        if abs(actual - target) > max_diff:
            return False
    return True

# ── SOFT MOOD-FIT SCORE ───────────────────────────────────────────────────────
def mood_fit_score(af: dict, targets: dict, mood: str) -> float:
    """
    Returns a float in [0, 1] representing how well `af` fits the mood targets.
    Uses full credit inside the tolerance band and smooth decay outside it.
    """
    if not matches_nearby_profile(af, targets):
        return 0.0

    total_weight = 0.0
    weighted_score = 0.0
    for feat, weight in FEATURE_WEIGHTS.items():
        target = targets.get(feat)
        actual = af.get(feat)
        if target is None or actual is None:
            continue
        tol = FEATURE_TOLERANCES[feat]
        diff = abs(actual - target)
        if diff <= tol:
            score = 1.0
        else:
            score = math.exp(-(((diff - tol) / tol) ** 2))
        weighted_score += weight * score
        total_weight   += weight

    return (weighted_score / total_weight) if total_weight > 0 else 0.0

# Minimum fit threshold – songs below this are excluded even in soft mode.
# Songs must be near the requested profile, then popularity decides among them.
MIN_FIT_SCORE = 0.58

# ── Spotify audio_features flag ───────────────────────────────────────────────
_AUDIO_FEATURES_AVAILABLE = True

def bulk_audio_features(track_ids: list) -> dict:
    global _AUDIO_FEATURES_AVAILABLE
    if not track_ids or sp is None or not _AUDIO_FEATURES_AVAILABLE:
        return {}
    try:
        feats = sp.audio_features(track_ids[:100])
        return {f["id"]: f for f in feats if f}
    except spotipy.exceptions.SpotifyException as e:
        if getattr(e, "http_status", None) in (401, 403):
            _AUDIO_FEATURES_AVAILABLE = False
            print("⚠️  Spotify audio-features endpoint not accessible (403). "
                  "Falling back to search-only mode.")
        else:
            print(f"audio_features error: {e}")
        return {}
    except Exception as e:
        print(f"audio_features error: {e}")
        return {}

def _lower_track_text(track: dict) -> str:
    artist_names = " ".join(a.get("name", "") for a in track.get("artists", []))
    album_name = track.get("album", {}).get("name", "")
    return f"{track.get('name', '')} {artist_names} {album_name}".lower()

def is_listenable_search_result(track: dict, mood: str, relaxed: bool = False) -> bool:
    popularity = track.get("popularity", 0)
    min_popularity = SEARCH_ONLY_RELAXED_POPULARITY if relaxed else SEARCH_ONLY_MIN_POPULARITY
    if popularity < min_popularity:
        return False

    text = _lower_track_text(track)
    if any(term in text for term in LOW_QUALITY_TERMS):
        return False
    if any(term in text for term in MOOD_BLOCK_TERMS.get(mood, ())):
        return False
    if "various artists" in text and popularity < POPULAR_MODE_STRONG_POPULARITY:
        return False
    return True

# ── format_track ─────────────────────────────────────────────────────────────
def format_track(track: dict, af: dict, mood: str, confidence: float = 0,
                 profile_af=None, fit_score: float = 0.0):
    images = track.get("album", {}).get("images", [])
    if af:
        src, feature_source = af, "spotify"
    elif profile_af:
        src, feature_source = profile_af, "profile"
    else:
        src, feature_source = {}, "none"

    return {
        "id":             track["id"],
        "track_name":     track["name"],
        "artists":        ", ".join(a["name"] for a in track.get("artists", [])),
        "album":          track.get("album", {}).get("name", ""),
        "image":          images[0]["url"] if images else None,
        "preview_url":    track.get("preview_url"),
        "spotify_url":    track.get("external_urls", {}).get("spotify"),
        "popularity":     track.get("popularity", 0),
        "mood":           mood,
        "confidence":     confidence,
        "fit_score":      round(fit_score * 100, 1),   # percentage for UI
        "valence":        round(src.get("valence",      0), 3),
        "energy":         round(src.get("energy",       0), 3),
        "danceability":   round(src.get("danceability", 0), 3),
        "tempo":          round(src.get("tempo",        0), 1),
        "acousticness":   round(src.get("acousticness", 0), 3),
        "loudness":       round(src.get("loudness",     0), 2),
        "feature_source": feature_source,
    }

# ── Spotify search helpers ────────────────────────────────────────────────────
SPOTIFY_MAX_OFFSET = 950
SPOTIFY_POPULAR_MAX_OFFSET = 40
SPOTIFY_PAGE_SIZE  = 10
MAX_SEARCH_PAGES   = 14   # fetch more pages so we have a richer pool to rank

def _search_random_page(query: str, market: str = "US", popular_bias: bool = True) -> list:
    if sp is None:
        return []
    if popular_bias:
        offset = random.choice([0, 0, 0, 10, 10, 20, 30, SPOTIFY_POPULAR_MAX_OFFSET])
    else:
        offset = random.randint(0, SPOTIFY_MAX_OFFSET)
    try:
        results = sp.search(
            q=query, type="track",
            limit=SPOTIFY_PAGE_SIZE, offset=offset, market=market,
        )
        return results.get("tracks", {}).get("items", []) or []
    except spotipy.exceptions.SpotifyException as e:
        if getattr(e, "http_status", None) == 400:
            try:
                results = sp.search(
                    q=query, type="track",
                    limit=SPOTIFY_PAGE_SIZE, offset=0, market=market,
                )
                return results.get("tracks", {}).get("items", []) or []
            except Exception as e2:
                print(f"search retry failed '{query}': {e2}")
                return []
        print(f"search error '{query}' (offset={offset}): {e}")
        return []
    except Exception as e:
        print(f"search error '{query}' (offset={offset}): {e}")
        return []

# ── MAIN FETCH FUNCTION (with soft scoring + popularity ranking) ──────────────
def fetch_songs_for_mood(mood: str, limit: int, feature_targets=None,
                          rare: bool = False) -> list:
    """
    Fetch and rank songs for a mood.

    Ranking formula (when audio features available):
        final_score = 0.45 * fit_score + 0.55 * popularity_norm

    In rare mode:
        final_score = 0.45 * fit_score + 0.55 * (1 - popularity_norm)

    When audio features are unavailable (Spotify 403 fallback):
        Rank by popularity only (or inverse for rare mode).
    """
    if sp is None:
        return []

    profile = feature_targets or MOOD_DEFAULT_FEATURES.get(
        mood, MOOD_DEFAULT_FEATURES["Happy"]
    )

    query_key = "popular_queries" if (not rare and not _AUDIO_FEATURES_AVAILABLE) else "queries"
    queries = list(MOOD_CONFIG[mood].get(query_key, MOOD_CONFIG[mood]["queries"]))
    random.shuffle(queries)

    seen_ids    = set()
    raw_pool        = []   # list of (track_dict, popularity)
    relaxed_raw_pool = []  # backup search-only candidates
    af_pool         = []   # list of (track_dict, af_dict, fit_score, popularity)
    relaxed_af_pool = []   # backup candidates when popular tracks are sparse

    pages_done  = 0
    query_iter  = iter(queries)

    # Collect tracks until we have enough candidates or exhaust queries
    while pages_done < MAX_SEARCH_PAGES:
        try:
            query = next(query_iter)
        except StopIteration:
            break

        tracks = _search_random_page(query, popular_bias=(not rare))
        pages_done += 1

        fresh = [t for t in tracks if t and t.get("id") and t["id"] not in seen_ids]
        if not fresh:
            continue
        seen_ids.update(t["id"] for t in fresh)

        # Try audio-feature soft scoring
        af_map = bulk_audio_features([t["id"] for t in fresh])
        for t in fresh:
            pop = t.get("popularity", 0)
            af  = af_map.get(t["id"], {})
            if af:
                fit = mood_fit_score(af, profile, mood)
                if fit >= MIN_FIT_SCORE:
                    pred, conf = predict_mood(af)
                    candidate = (t, af, fit, pop, pred, conf)
                    if rare or pop >= POPULAR_MODE_MIN_POPULARITY:
                        af_pool.append(candidate)
                    else:
                        relaxed_af_pool.append(candidate)
            else:
                if rare:
                    raw_pool.append((t, pop))
                elif is_listenable_search_result(t, mood):
                    raw_pool.append((t, pop))
                elif is_listenable_search_result(t, mood, relaxed=True):
                    relaxed_raw_pool.append((t, pop))

        # Stop early once we have plenty of audio-feature candidates
        if len(af_pool) >= limit * 5:
            break

    # ── Build results ─────────────────────────────────────────────────────────
    if len(af_pool) < limit and relaxed_af_pool:
        relaxed_af_pool.sort(key=lambda item: item[3], reverse=True)
        af_pool.extend(relaxed_af_pool[:limit - len(af_pool)])

    if af_pool:
        # Normalise popularity to [0,1]
        max_pop = 100
        def blended_score(item):
            _, _, fit, pop, _, _ = item
            pop_norm = pop / max_pop
            if rare:
                return POPULARITY_FIT_WEIGHT * fit + POPULARITY_RANK_WEIGHT * (1.0 - pop_norm)

            strong_pop_bonus = 0.05 if pop >= POPULAR_MODE_STRONG_POPULARITY else 0.0
            return POPULARITY_FIT_WEIGHT * fit + POPULARITY_RANK_WEIGHT * pop_norm + strong_pop_bonus

        af_pool.sort(key=blended_score, reverse=True)

        results = []
        for t, af, fit, pop, pred, conf in af_pool[:limit]:
            results.append(format_track(t, af, mood, conf,
                                        profile_af=profile, fit_score=fit))
        return results

    # ── Fallback: no audio features from Spotify ──────────────────────────────
    # Rank by popularity only
    if len(raw_pool) < limit and relaxed_raw_pool:
        relaxed_raw_pool.sort(key=lambda x: x[1], reverse=True)
        raw_pool.extend(relaxed_raw_pool[:limit - len(raw_pool)])

    raw_pool.sort(key=lambda x: x[1], reverse=(not rare))
    out = []
    for t, _ in raw_pool[:limit]:
        out.append(format_track(t, {}, mood, 0, profile_af=None, fit_score=0.0))
    return out

# ── routes ────────────────────────────────────────────────────────────────────
@app.route("/")
def root():
    return jsonify({
        "app":       "Moodspot API",
        "status":    "running",
        "model":     metrics["model_name"] if metrics else "not loaded",
        "accuracy":  metrics["accuracy"]   if metrics else None,
        "endpoints": [
            "/recommend  (mood, limit, valence, energy, danceability, tempo, "
            "acousticness, loudness, rare)",
            "/search", "/classify", "/trending", "/analytics", "/moods",
        ],
    })

@app.route("/recommend", methods=["GET", "POST"])
def recommend():
    """
    GET  /recommend?mood=Happy&limit=10&rare=false
    POST /recommend {"mood":"Happy","limit":10,"rare":true}

    Optional audio-feature overrides: valence, energy, danceability,
    tempo, acousticness, loudness

    `rare=true`  →  surface low-popularity / niche tracks
    `rare=false` →  surface popular / trending tracks first (default)
    """
    blend = {}
    if request.method == "POST":
        body  = request.get_json(silent=True) or {}
        mood  = body.get("mood")
        limit = int(body.get("limit", 10))
        rare  = str(body.get("rare", "false")).lower() in ("true", "1", "yes")
        if not mood and body.get("features"):
            mood, _ = predict_mood(body["features"])
        feat = body.get("features")
        if isinstance(feat, dict):
            blend.update(feat)
        for k, v in body.items():
            if k not in ("features", "mood", "limit", "rare"):
                blend[k] = v
        overrides = _parse_feature_overrides(blend)
    else:
        mood  = request.args.get("mood", "Happy")
        limit = int(request.args.get("limit", 10))
        rare  = request.args.get("rare", "false").lower() in ("true", "1", "yes")
        overrides = _parse_feature_overrides(request.args.to_dict())

    mood  = (mood or "Happy").strip().capitalize()
    limit = max(1, min(limit, 30))

    if mood not in MOOD_CONFIG:
        return jsonify({"error": f"Unknown mood '{mood}'. Valid: {list(MOOD_CONFIG.keys())}"}), 400
    if sp is None:
        return jsonify({"error": "Spotify credentials not configured. Check your .env file."}), 503

    targets = merged_feature_targets(mood, overrides)
    try:
        songs = fetch_songs_for_mood(mood, limit, feature_targets=targets, rare=rare)
        return jsonify({
            "mood":                  mood,
            "count":                 len(songs),
            "rare":                  rare,
            "songs":                 songs,
            "audio_features_profile": targets,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/search")
def search():
    """GET /search?q=adele&mood=Sad&limit=10"""
    q     = request.args.get("q", "").strip()
    mood  = request.args.get("mood", "").strip().capitalize()
    limit = min(int(request.args.get("limit", 10)), 50)
    if not q:
        return jsonify({"songs": [], "query": ""})
    if sp is None:
        return jsonify({"error": "Spotify not configured"}), 503

    try:
        tracks = []
        off    = 0
        while len(tracks) < 50:
            page  = sp.search(q=q, type="track", limit=SPOTIFY_PAGE_SIZE,
                              offset=off, market="US")
            batch = page["tracks"]["items"]
            if not batch:
                break
            tracks.extend(batch)
            off += len(batch)
            if len(batch) < SPOTIFY_PAGE_SIZE:
                break

        af_map = bulk_audio_features([t["id"] for t in tracks])
        songs  = []
        for t in tracks:
            af        = af_map.get(t["id"], {})
            pred, conf = predict_mood(af) if af else ("Unknown", 0)
            if mood and mood in MOOD_CONFIG and pred not in ("Unknown", mood):
                continue
            fit = mood_fit_score(af, MOOD_DEFAULT_FEATURES.get(pred, {}), pred) if af else 0.0
            songs.append(format_track(t, af, pred, conf, fit_score=fit))
            if len(songs) >= limit:
                break

        # Sort search results by popularity descending
        songs.sort(key=lambda s: s.get("popularity", 0), reverse=True)
        return jsonify({"songs": songs, "query": q, "count": len(songs)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/classify", methods=["POST"])
def classify():
    """POST /classify  {valence, energy, danceability, tempo, acousticness, loudness}"""
    if clf is None:
        return jsonify({"error": "Model not loaded. Run: python model/train_model.py"}), 503
    data      = request.get_json(silent=True) or {}
    mood, conf = predict_mood(data)
    vec        = np.array([[data.get(f, 0) for f in FEATURES]])
    proba      = clf.predict_proba(scaler.transform(vec))[0]
    return jsonify({
        "mood":          mood,
        "confidence":    conf,
        "probabilities": {le.classes_[i]: round(float(p) * 100, 1)
                          for i, p in enumerate(proba)},
    })

@app.route("/trending")
def trending():
    """Returns recent popular tracks, each classified by mood."""
    if sp is None:
        return jsonify({"error": "Spotify not configured"}), 503
    try:
        tracks = []
        off    = 0
        for _ in range(3):   # 3 pages = 30 tracks
            page  = sp.search(q="year:2024-2025", type="track",
                              limit=SPOTIFY_PAGE_SIZE, offset=off, market="US")
            batch = page["tracks"]["items"]
            if not batch:
                break
            tracks.extend(batch)
            off += len(batch)

        af_map = bulk_audio_features([t["id"] for t in tracks])
        songs  = []
        for t in tracks:
            af         = af_map.get(t["id"], {})
            pred, conf = predict_mood(af) if af else ("Unknown", 0)
            fit        = mood_fit_score(af, MOOD_DEFAULT_FEATURES.get(pred, {}), pred) if af else 0.0
            songs.append(format_track(t, af, pred, conf, fit_score=fit))

        # Sort trending by popularity
        songs.sort(key=lambda s: s.get("popularity", 0), reverse=True)
        return jsonify({"songs": songs, "count": len(songs)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/analytics")
def analytics():
    if metrics is None:
        return jsonify({"error": "Model not trained. Run: python model/train_model.py"}), 503
    return jsonify(metrics)

@app.route("/moods")
def moods():
    return jsonify({
        "moods":                  list(MOOD_CONFIG.keys()),
        "default_audio_features": MOOD_DEFAULT_FEATURES,
    })

if __name__ == "__main__":
    print("🎵 Moodspot API starting on http://localhost:5000")
    app.run(debug=True, port=5000, host="0.0.0.0")
