"""
app.py  –  Moodtunes Backend API
- sp.recommendations() was removed by Spotify Nov 2024
- sp.audio_features()  was also restricted Nov 2024 for new apps (returns 403)
- We therefore rely on sp.search() with randomized queries + random offset
  so every refresh returns DIFFERENT songs for the same mood.
- ML model still classifies mood from audio features when they ARE available.
"""
import os, json, pickle, random
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
        auth_manager=SpotifyClientCredentials(
            client_id=cid, client_secret=secret
        ),
        requests_timeout=10,
    )

sp = make_spotify()

# ── ML model ──────────────────────────────────────────────────────────────────
HERE  = os.path.dirname(os.path.abspath(__file__))
MODEL = os.path.join(HERE, "..", "model")

def load_model():
    with open(os.path.join(MODEL, "mood_classifier.pkl"), "rb") as f: clf     = pickle.load(f)
    with open(os.path.join(MODEL, "scaler.pkl"),          "rb") as f: scaler  = pickle.load(f)
    with open(os.path.join(MODEL, "label_encoder.pkl"),   "rb") as f: le      = pickle.load(f)
    with open(os.path.join(MODEL, "metrics.json"))            as f: metrics = json.load(f)
    return clf, scaler, le, metrics

try:
    clf, scaler, le, metrics = load_model()
    print("✅  ML model loaded")
except Exception as e:
    clf = scaler = le = metrics = None
    print(f"⚠️  Model not loaded: {e}  →  run: python model/train_model.py")

FEATURES = ["valence", "energy", "danceability", "tempo", "acousticness", "loudness"]

# ── Mood config: large query pool so every refresh feels fresh ────────────────
# NOTE: sp.recommendations() and sp.audio_features() were removed/restricted by
# Spotify in Nov 2024 for new apps. We rely on randomized search queries +
# random offset to surface different tracks on every call.
# Typical audio-feature targets per mood (0–1 except tempo BPM, loudness dB).
# Used when Spotify does not return per-track audio features (403) so the UI
# still shows a coherent profile; optional request params override these.
MOOD_DEFAULT_FEATURES = {
    "Happy": {
        "valence": 0.75, "energy": 0.72, "danceability": 0.68,
        "tempo": 118.0, "acousticness": 0.12, "loudness": -5.5,
    },
    "Sad": {
        "valence": 0.28, "energy": 0.32, "danceability": 0.35,
        "tempo": 82.0, "acousticness": 0.58, "loudness": -9.0,
    },
    "Energetic": {
        "valence": 0.62, "energy": 0.88, "danceability": 0.72,
        "tempo": 132.0, "acousticness": 0.08, "loudness": -4.0,
    },
    "Calm": {
        "valence": 0.48, "energy": 0.22, "danceability": 0.28,
        "tempo": 88.0, "acousticness": 0.52, "loudness": -12.0,
    },
}

MOOD_CONFIG = {
    "Happy": {
        "queries": [
            "happy pop hits", "feel good songs", "upbeat pop", "positive vibes",
            "summer hits", "dance pop", "cheerful indie", "sunshine pop",
            "good mood playlist", "happy hip hop", "uplifting songs",
            "party anthems", "happy 2024", "happy 2023", "happy 2022",
        ],
        "filter": lambda af: (
            af.get("valence", 0) > 0.55 and
            af.get("energy",  0) > 0.55
        ),
    },
    "Sad": {
        "queries": [
            "sad songs", "emotional acoustic", "heartbreak songs",
            "melancholic indie", "slow ballads", "lonely songs",
            "crying songs", "sad pop", "sad indie", "breakup songs",
            "sad rnb", "sad piano", "rainy day music", "depressed playlist",
            "sad 2024", "sad 2023",
        ],
        "filter": lambda af: (
            af.get("valence", 0) < 0.45 and
            af.get("energy",  0) < 0.50
        ),
    },
    "Energetic": {
        "queries": [
            "workout music", "high energy hip hop", "pump up songs",
            "energetic rock", "gym playlist", "running music", "edm bangers",
            "house music", "trap bangers", "festival anthems", "cardio mix",
            "hype songs", "metal workout", "rap workout",
            "energetic 2024", "energetic 2023",
        ],
        "filter": lambda af: (
            af.get("energy", 0) > 0.70 and
            af.get("tempo",  0) > 110
        ),
    },
    "Calm": {
        "queries": [
            "calm relaxing music", "peaceful acoustic", "ambient study music",
            "lofi chill beats", "sleep music", "meditation music",
            "soft piano", "chill indie", "coffee shop music", "jazz chill",
            "bossa nova", "rainy day acoustic", "deep focus",
            "calm 2024", "calm 2023",
        ],
        "filter": lambda af: (
            af.get("energy",       0) < 0.40 and
            af.get("acousticness", 0) > 0.25
        ),
    },
}

# ── helpers ───────────────────────────────────────────────────────────────────
def _parse_feature_overrides(raw: dict) -> dict:
    """Parse valence, energy, danceability, acousticness (0–1), tempo (BPM), loudness (dB)."""
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
    """Returns (mood_label, confidence_pct) using the ML model."""
    if clf is None:
        return "Unknown", 0.0
    vec   = np.array([[af.get(f, 0) for f in FEATURES]])
    vec_s = scaler.transform(vec)
    idx   = clf.predict(vec_s)[0]
    proba = clf.predict_proba(vec_s)[0]
    return le.inverse_transform([idx])[0], round(float(proba.max()) * 100, 1)

# Spotify deprecated /audio-features for new apps in Nov 2024 → it returns 403.
# We try ONCE per process; if it 403s we flip this flag and stop calling it
# entirely (saves latency and avoids log spam on every request).
_AUDIO_FEATURES_AVAILABLE = True

def bulk_audio_features(track_ids: list) -> dict:
    """Fetch audio features for up to 100 tracks at once; returns {id: features}.
    Silently returns {} once Spotify is known to have revoked access."""
    global _AUDIO_FEATURES_AVAILABLE
    if not track_ids or sp is None or not _AUDIO_FEATURES_AVAILABLE:
        return {}
    try:
        feats = sp.audio_features(track_ids[:100])
        return {f["id"]: f for f in feats if f}
    except spotipy.exceptions.SpotifyException as e:
        if getattr(e, "http_status", None) in (401, 403):
            _AUDIO_FEATURES_AVAILABLE = False
            print("⚠️  Spotify audio-features endpoint not accessible "
                  "(403). Falling back to search-only mode.")
        else:
            print(f"audio_features error: {e}")
        return {}
    except Exception as e:
        print(f"audio_features error: {e}")
        return {}

def format_track(track: dict, af: dict, mood: str, confidence: float = 0, profile_af=None):
    """If Spotify `af` is empty, paint `profile_af` so the UI still shows metrics."""
    images = track.get("album", {}).get("images", [])
    if af:
        src, feature_source = af, "spotify"
    elif profile_af:
        src, feature_source = profile_af, "profile"
    else:
        src, feature_source = {}, "none"
    return {
        "id":           track["id"],
        "track_name":   track["name"],
        "artists":      ", ".join(a["name"] for a in track.get("artists", [])),
        "album":        track.get("album", {}).get("name", ""),
        "image":        images[0]["url"] if images else None,
        "preview_url":  track.get("preview_url"),
        "spotify_url":  track.get("external_urls", {}).get("spotify"),
        "popularity":   track.get("popularity", 0),
        "mood":         mood,
        "confidence":   confidence,
        "valence":      round(src.get("valence",      0), 3),
        "energy":       round(src.get("energy",       0), 3),
        "danceability": round(src.get("danceability", 0), 3),
        "tempo":        round(src.get("tempo",        0), 1),
        "acousticness": round(src.get("acousticness", 0), 3),
        "loudness":     round(src.get("loudness",     0), 2),
        "feature_source": feature_source,
    }

# Spotify search: offset + limit ≤ 1000. As of 2025 the API rejects limit > 10
# for track search (400 Invalid limit); use 10 and paginate elsewhere.
SPOTIFY_MAX_OFFSET = 990           # 990 + SPOTIFY_PAGE_SIZE ≤ 1000
SPOTIFY_PAGE_SIZE  = 10            # max page size accepted by Search API
MAX_SEARCH_PAGES   = 8             # more smaller pages to compensate for limit=10


def _search_random_page(query: str, market: str = "US") -> list:
    """sp.search with a random offset → returns track list (may be empty)."""
    if sp is None:
        return []
    offset = random.randint(0, SPOTIFY_MAX_OFFSET)
    try:
        results = sp.search(
            q=query, type="track",
            limit=SPOTIFY_PAGE_SIZE, offset=offset, market=market,
        )
        return results.get("tracks", {}).get("items", []) or []
    except spotipy.exceptions.SpotifyException as e:
        # offset too large for this query → retry once at offset 0
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


def fetch_songs_for_mood(mood: str, limit: int, feature_targets=None) -> list:
    """Return `limit` mood-appropriate tracks. Randomized on every call so a
    refresh from the frontend produces fresh songs.
    `feature_targets` merged mood defaults + client overrides; used on tracks
    when Spotify does not return audio features."""
    if sp is None:
        return []

    profile = feature_targets or MOOD_DEFAULT_FEATURES.get(
        mood, MOOD_DEFAULT_FEATURES["Happy"]
    )

    config    = MOOD_CONFIG[mood]
    af_filter = config["filter"]
    queries   = list(config["queries"])
    random.shuffle(queries)                       # random query order each call

    seen_ids   = set()
    candidates = []          # (track, af, mood, confidence) passing the filter
    pool       = []          # every unique track we saw, used as fallback

    pages = 0
    for query in queries:
        if pages >= MAX_SEARCH_PAGES and len(candidates) >= limit:
            break
        tracks = _search_random_page(query)
        pages += 1

        fresh = [t for t in tracks if t and t.get("id") and t["id"] not in seen_ids]
        if not fresh:
            continue
        seen_ids.update(t["id"] for t in fresh)
        pool.extend(fresh)

        # Try audio-feature filtering (only works for older Spotify apps)
        af_map = bulk_audio_features([t["id"] for t in fresh])
        for t in fresh:
            af = af_map.get(t["id"], {})
            if af and af_filter(af):
                pred, conf = predict_mood(af)
                candidates.append((t, af, pred, conf))

    # If audio_features is unavailable (new Spotify apps → 403) candidates will
    # be empty. Fall back to the raw search pool — still randomized per call.
    if not candidates:
        random.shuffle(pool)
        out = []
        for t in pool[: limit * 2]:
            # Without audio features we can't ML-classify; tag with requested mood
            out.append(format_track(t, {}, mood, 0, profile_af=profile))
            if len(out) >= limit:
                break
        return out

    random.shuffle(candidates)
    return [
        format_track(t, af, m, c)
        for t, af, m, c in candidates[:limit]
    ]


# ── routes ────────────────────────────────────────────────────────────────────

@app.route("/")
def root():
    return jsonify({
        "app":     "Moodtunes API",
        "status":  "running",
        "model":   metrics["model_name"] if metrics else "not loaded",
        "accuracy": metrics["accuracy"]  if metrics else None,
        "endpoints": [
            "/recommend (optional: valence, energy, danceability, tempo, acousticness, loudness)",
            "/search", "/classify", "/trending", "/analytics", "/moods",
        ],
    })


@app.route("/recommend", methods=["GET", "POST"])
def recommend():
    """
    GET  /recommend?mood=Happy&limit=10
         Optional query: valence, energy, danceability, tempo, acousticness, loudness
    POST /recommend  {"mood":"Happy","limit":10, "valence":0.3, "tempo":85, ...}
    POST /recommend  {"features":{...}}   → auto-detect mood then recommend
    """
    blend = {}
    if request.method == "POST":
        body  = request.get_json(silent=True) or {}
        mood  = body.get("mood")
        limit = int(body.get("limit", 10))
        if not mood and body.get("features"):
            mood, _ = predict_mood(body["features"])
        feat = body.get("features")
        if isinstance(feat, dict):
            blend.update(feat)
        for k, v in body.items():
            if k not in ("features", "mood", "limit"):
                blend[k] = v
        overrides = _parse_feature_overrides(blend)
    else:
        mood  = request.args.get("mood", "Happy")
        limit = int(request.args.get("limit", 10))
        overrides = _parse_feature_overrides(request.args.to_dict())

    mood  = (mood or "Happy").strip().capitalize()
    limit = max(1, min(limit, 30))

    if mood not in MOOD_CONFIG:
        return jsonify({"error": f"Unknown mood '{mood}'. Valid: {list(MOOD_CONFIG.keys())}"}), 400

    if sp is None:
        return jsonify({"error": "Spotify credentials not configured. Check your .env file."}), 503

    targets = merged_feature_targets(mood, overrides)

    try:
        songs = fetch_songs_for_mood(mood, limit, feature_targets=targets)
        return jsonify({
            "mood": mood,
            "count": len(songs),
            "songs": songs,
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
        off = 0
        while len(tracks) < 50:
            page = sp.search(
                q=q, type="track", limit=SPOTIFY_PAGE_SIZE,
                offset=off, market="US",
            )
            batch = page["tracks"]["items"]
            if not batch:
                break
            tracks.extend(batch)
            off += len(batch)
            if len(batch) < SPOTIFY_PAGE_SIZE:
                break
        af_map  = bulk_audio_features([t["id"] for t in tracks])
        songs   = []
        for t in tracks:
            af        = af_map.get(t["id"], {})
            pred, conf = predict_mood(af) if af else ("Unknown", 0)
            if mood and pred != mood:
                continue
            songs.append(format_track(t, af, pred, conf))
            if len(songs) >= limit:
                break
        return jsonify({"songs": songs, "query": q, "count": len(songs)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/classify", methods=["POST"])
def classify():
    """POST /classify  body: {valence:0.9, energy:0.8, danceability:0.7, tempo:120, acousticness:0.1, loudness:-5}"""
    if clf is None:
        return jsonify({"error": "Model not loaded. Run: python model/train_model.py"}), 503
    data       = request.get_json(silent=True) or {}
    mood, conf = predict_mood(data)
    vec        = np.array([[data.get(f, 0) for f in FEATURES]])
    proba      = clf.predict_proba(scaler.transform(vec))[0]
    return jsonify({
        "mood":            mood,
        "confidence":      conf,
        "probabilities":   {le.classes_[i]: round(float(p) * 100, 1) for i, p in enumerate(proba)},
    })


@app.route("/trending")
def trending():
    """Returns recent popular tracks, each classified by mood."""
    if sp is None:
        return jsonify({"error": "Spotify not configured"}), 503
    try:
        tracks = []
        off = 0
        for _ in range(2):
            page = sp.search(
                q="year:2024-2025", type="track",
                limit=SPOTIFY_PAGE_SIZE, offset=off, market="US",
            )
            batch = page["tracks"]["items"]
            if not batch:
                break
            tracks.extend(batch)
            off += len(batch)
        af_map  = bulk_audio_features([t["id"] for t in tracks])
        songs   = []
        for t in tracks:
            af        = af_map.get(t["id"], {})
            pred, conf = predict_mood(af) if af else ("Unknown", 0)
            songs.append(format_track(t, af, pred, conf))
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
        "moods": list(MOOD_CONFIG.keys()),
        "default_audio_features": MOOD_DEFAULT_FEATURES,
    })


if __name__ == "__main__":
    print("🎵  Moodtunes API starting on http://localhost:5000")
    app.run(debug=True, port=5000, host="0.0.0.0")
