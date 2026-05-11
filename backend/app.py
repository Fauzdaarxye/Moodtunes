"""
app.py  –  Moodtunes Backend API
- Uses sp.search() + audio feature filtering (sp.recommendations() was removed by Spotify Nov 2024)
- ML model classifies mood from audio features
- All CORS headers set correctly
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

# ── Mood config: search queries + audio-feature filter ────────────────────────
# NOTE: sp.recommendations() was REMOVED by Spotify in Nov 2024.
# We search instead and filter results by audio features ourselves.
MOOD_CONFIG = {
    "Happy": {
        "queries": [
            "happy pop hits",
            "feel good songs",
            "upbeat pop 2024",
            "positive vibes music",
        ],
        "filter": lambda af: (
            af.get("valence", 0) > 0.55 and
            af.get("energy",  0) > 0.55
        ),
    },
    "Sad": {
        "queries": [
            "sad songs",
            "emotional acoustic",
            "heartbreak songs",
            "melancholic indie",
        ],
        "filter": lambda af: (
            af.get("valence", 0) < 0.45 and
            af.get("energy",  0) < 0.50
        ),
    },
    "Energetic": {
        "queries": [
            "workout music",
            "high energy hip hop",
            "pump up songs",
            "energetic rock",
        ],
        "filter": lambda af: (
            af.get("energy", 0) > 0.70 and
            af.get("tempo",  0) > 110
        ),
    },
    "Calm": {
        "queries": [
            "calm relaxing music",
            "peaceful acoustic",
            "ambient study music",
            "lofi chill beats",
        ],
        "filter": lambda af: (
            af.get("energy",       0) < 0.40 and
            af.get("acousticness", 0) > 0.25
        ),
    },
}

# ── helpers ───────────────────────────────────────────────────────────────────
def predict_mood(af: dict) -> tuple:
    """Returns (mood_label, confidence_pct) using the ML model."""
    if clf is None:
        return "Unknown", 0.0
    vec   = np.array([[af.get(f, 0) for f in FEATURES]])
    vec_s = scaler.transform(vec)
    idx   = clf.predict(vec_s)[0]
    proba = clf.predict_proba(vec_s)[0]
    return le.inverse_transform([idx])[0], round(float(proba.max()) * 100, 1)

def bulk_audio_features(track_ids: list) -> dict:
    """Fetch audio features for up to 100 tracks at once; returns {id: features}."""
    if not track_ids or sp is None:
        return {}
    try:
        feats = sp.audio_features(track_ids[:100])
        return {f["id"]: f for f in feats if f}
    except Exception as e:
        print(f"audio_features error: {e}")
        return {}

def format_track(track: dict, af: dict, mood: str, confidence: float = 0) -> dict:
    images = track.get("album", {}).get("images", [])
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
        "valence":      round(af.get("valence",      0), 3),
        "energy":       round(af.get("energy",       0), 3),
        "danceability": round(af.get("danceability", 0), 3),
        "tempo":        round(af.get("tempo",        0), 1),
        "acousticness": round(af.get("acousticness", 0), 3),
        "loudness":     round(af.get("loudness",     0), 2),
    }

def fetch_songs_for_mood(mood: str, limit: int) -> list:
    """Search Spotify → filter by audio features → return up to `limit` tracks."""
    if sp is None:
        return []

    config    = MOOD_CONFIG[mood]
    af_filter = config["filter"]
    seen_ids  = set()
    candidates = []   # list of (track, af, mood, confidence)

    for query in config["queries"]:
        if len(candidates) >= limit * 4:
            break
        try:
            results = sp.search(q=query, type="track", limit=50, market="US")
            tracks  = results["tracks"]["items"]
        except Exception as e:
            print(f"search error '{query}': {e}")
            continue

        fresh = [t for t in tracks if t["id"] not in seen_ids and t.get("id")]
        if not fresh:
            continue
        seen_ids.update(t["id"] for t in fresh)

        af_map = bulk_audio_features([t["id"] for t in fresh])
        for t in fresh:
            af = af_map.get(t["id"], {})
            if not af:
                continue
            if af_filter(af):
                predicted_mood, conf = predict_mood(af)
                candidates.append((t, af, predicted_mood, conf))

    random.shuffle(candidates)
    if len(candidates) == 0:
        print("⚠️ No filtered songs found, using fallback")
    
        fallback = []
        for query in config["queries"]:
            try:
                 results = sp.search(q=query, type="track", limit=limit, market="US")
                 tracks = results["tracks"]["items"]
                 for t in tracks:
                   af = bulk_audio_features([t["id"]]).get(t["id"], {})
                   pred, conf = predict_mood(af) if af else ("Unknown", 0)
                   fallback.append(format_track(t, af, pred, conf))
                 if len(fallback) >= limit:
                    return fallback
            except Exception as e:
             print("fallback error:", e)

        return fallback
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
        "endpoints": ["/recommend", "/search", "/classify", "/trending", "/analytics", "/moods"],
    })


@app.route("/recommend", methods=["GET", "POST"])
def recommend():
    """
    GET  /recommend?mood=Happy&limit=10
    POST /recommend  {"mood":"Happy","limit":10}
    POST /recommend  {"features":{...}}   → auto-detect mood then recommend
    """
    if request.method == "POST":
        body  = request.get_json(silent=True) or {}
        mood  = body.get("mood")
        limit = int(body.get("limit", 10))
        if not mood and body.get("features"):
            mood, _ = predict_mood(body["features"])
    else:
        mood  = request.args.get("mood", "Happy")
        limit = int(request.args.get("limit", 10))

    mood  = (mood or "Happy").strip().capitalize()
    limit = max(1, min(limit, 30))

    if mood not in MOOD_CONFIG:
        return jsonify({"error": f"Unknown mood '{mood}'. Valid: {list(MOOD_CONFIG.keys())}"}), 400

    if sp is None:
        return jsonify({"error": "Spotify credentials not configured. Check your .env file."}), 503

    try:
        songs = fetch_songs_for_mood(mood, limit)
        return jsonify({"mood": mood, "count": len(songs), "songs": songs})
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
        results = sp.search(q=q, type="track", limit=50, market="US")
        tracks  = results["tracks"]["items"]
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
        results = sp.search(q="year:2024-2025", type="track", limit=20, market="US")
        tracks  = results["tracks"]["items"]
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
    return jsonify({"moods": list(MOOD_CONFIG.keys())})


if __name__ == "__main__":
    print("🎵  Moodtunes API starting on http://localhost:5000")
    app.run(debug=True, port=5000, host="0.0.0.0")
