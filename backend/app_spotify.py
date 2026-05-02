"""
app.py  –  Mood-Based Music Recommender API (Spotify Edition)
Run:  python app.py

Requires:
  pip install flask flask-cors spotipy python-dotenv scikit-learn pandas numpy

Set environment variables (or create a .env file):
  SPOTIFY_CLIENT_ID=d08df51fc4c04646b10bc36f1a3b19cd
  SPOTIFY_CLIENT_SECRET=8b22349604bc499a89139e7fdef6acb6
"""
import os, json, pickle
import numpy as np
from flask import Flask, jsonify, request, redirect, session, url_for
from flask_cors import CORS
from dotenv import load_dotenv
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials, SpotifyOAuth

load_dotenv()
print("CLIENT ID:", os.getenv("SPOTIFY_CLIENT_ID"))
print("CLIENT SECRET:", os.getenv("SPOTIFY_CLIENT_SECRET"))

app = Flask(__name__)
app.secret_key = os.urandom(24)
CORS(app, supports_credentials=True)

# ── Spotify client (Client Credentials – no user login needed) ────────────────
sp = spotipy.Spotify(auth_manager=SpotifyClientCredentials(
    client_id=os.getenv("SPOTIFY_CLIENT_ID"),
client_secret=os.getenv("SPOTIFY_CLIENT_SECRET"),
))

# ── Load our trained ML model ─────────────────────────────────────────────────
BASE  = os.path.dirname(__file__)
MODEL = os.path.join(BASE, "..", "model")

def load_model():
    with open(os.path.join(MODEL, "mood_classifier.pkl"), "rb") as f:
        clf = pickle.load(f)
    with open(os.path.join(MODEL, "scaler.pkl"), "rb") as f:
        scaler = pickle.load(f)
    with open(os.path.join(MODEL, "label_encoder.pkl"), "rb") as f:
        le = pickle.load(f)
    with open(os.path.join(MODEL, "metrics.json")) as f:
        metrics = json.load(f)
    return clf, scaler, le, metrics

try:
    clf, scaler, le, metrics = load_model()
    print("✅ ML model loaded")
except Exception as e:
    clf = scaler = le = metrics = None
    print(f"⚠️  Model not loaded: {e} — run model/train_model.py first")

FEATURES = ["valence", "energy", "danceability", "tempo", "acousticness", "loudness"]

# ── Mood → Spotify search params ──────────────────────────────────────────────
# These seed the Spotify Recommendations API with ideal target values
MOOD_SEEDS = {
    "Happy": {
        "seed_genres": ["pop", "dance", "happy"],
        "target_valence": 0.85, "min_valence": 0.6,
        "target_energy":  0.80, "min_energy":  0.6,
        "target_danceability": 0.75,
        "target_tempo": 120,
    },
    "Sad": {
        "seed_genres": ["acoustic", "piano"],
        "target_valence": 0.20, "max_valence": 0.4,
        "target_energy":  0.25, "max_energy":  0.45,
        "target_acousticness": 0.70,
        "target_tempo": 80,
    },
    "Energetic": {
        "seed_genres": ["work-out", "hip-hop", "rock"],
        "target_energy":  0.92, "min_energy":  0.75,
        "target_tempo":   150,  "min_tempo":   120,
        "target_danceability": 0.80,
        "min_loudness": -6,
    },
    "Calm": {
        "seed_genres": ["ambient", "classical", "chill"],
        "target_energy":  0.18, "max_energy":  0.35,
        "target_valence": 0.45,
        "target_acousticness": 0.80,
        "target_tempo": 70,
    },
}

# ── Helpers ───────────────────────────────────────────────────────────────────
def predict_mood(features: dict) -> str:
    """Use the ML model to classify a track's mood from its audio features."""
    if clf is None:
        return "Unknown"
    vec = np.array([[features.get(f, 0) for f in FEATURES]])
    vec = scaler.transform(vec)
    idx = clf.predict(vec)[0]
    return le.inverse_transform([idx])[0]

def format_track(track, audio_features, predicted_mood=None):
    """Normalise a Spotify track + audio features into our response shape."""
    af = audio_features or {}
    mood = predicted_mood or predict_mood(af)
    return {
        "id":           track["id"],
        "track_name":   track["name"],
        "artists":      ", ".join(a["name"] for a in track["artists"]),
        "album":        track["album"]["name"],
        "preview_url":  track.get("preview_url"),
        "spotify_url":  track["external_urls"].get("spotify"),
        "image":        track["album"]["images"][0]["url"] if track["album"]["images"] else None,
        "mood":         mood,
        "valence":      round(af.get("valence", 0), 3),
        "energy":       round(af.get("energy", 0), 3),
        "danceability": round(af.get("danceability", 0), 3),
        "tempo":        round(af.get("tempo", 0), 1),
        "acousticness": round(af.get("acousticness", 0), 3),
        "loudness":     round(af.get("loudness", 0), 2),
        "popularity":   track.get("popularity", 0),
    }

def get_audio_features_bulk(track_ids: list) -> dict:
    """Fetch audio features for up to 100 tracks at once."""
    if not track_ids:
        return {}
    features = sp.audio_features(track_ids)
    return {f["id"]: f for f in features if f}

# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/")
def root():
    return jsonify({"message": "🎵 Moodtunes Spotify API is running", "status": "ok"})


@app.route("/recommend", methods=["GET", "POST"])
def recommend():
    """
    GET  /recommend?mood=Happy&limit=10
    POST /recommend  body: {"mood": "Happy", "limit": 10}
    POST /recommend  body: {"features": {...}}  → predicts mood then recommends
    """
    if request.method == "POST":
        data     = request.get_json(silent=True) or {}
        mood     = data.get("mood")
        limit    = int(data.get("limit", 10))
        features = data.get("features")
        if features and clf:
            mood = predict_mood(features)
    else:
        mood  = request.args.get("mood", "Happy")
        limit = int(request.args.get("limit", 10))

    mood = mood.capitalize()
    if mood not in MOOD_SEEDS:
        return jsonify({"error": f"Unknown mood '{mood}'. Choose: {list(MOOD_SEEDS.keys())}"}), 400

    params = {**MOOD_SEEDS[mood], "limit": min(limit, 50)}

    #fix incorrected format of seed_genres, which should be a list not a string

    if isinstance(params.get("seed_genres"), str):
        params["seed_genres"] = params["seed_genres"].split(",")

    print("FINAL PARAMS:", params)
    recs   = sp.recommendations(**params)


    track_ids = [t["id"] for t in recs["tracks"]]
    af_map    = get_audio_features_bulk(track_ids)

    songs = [
        format_track(t, af_map.get(t["id"], {}), mood)
        for t in recs["tracks"]
    ]

    return jsonify({"mood": mood, "count": len(songs), "songs": songs})


@app.route("/search", methods=["GET"])
def search():
    """
    GET /search?q=adele&mood=Sad&limit=10
    Searches Spotify then classifies each result with the ML model.
    """
    q     = request.args.get("q", "")
    mood  = request.args.get("mood", "")
    limit = int(request.args.get("limit", 10))

    if not q:
        return jsonify({"songs": []})

    query = q
    if mood:
        query += f" genre:{mood.lower()}"

    results   = sp.search(q=query, type="track", limit=min(limit, 50))
    tracks    = results["tracks"]["items"]
    track_ids = [t["id"] for t in tracks]
    af_map    = get_audio_features_bulk(track_ids)

    songs = []
    for t in tracks:
        af = af_map.get(t["id"], {})
        predicted = predict_mood(af) if af else "Unknown"
        if mood and predicted.lower() != mood.lower():
            continue
        songs.append(format_track(t, af, predicted))

    return jsonify({"songs": songs, "query": q})


@app.route("/track/<track_id>", methods=["GET"])
def track_details(track_id):
    """Get full details + mood prediction for a single track."""
    track = sp.track(track_id)
    af    = sp.audio_features([track_id])[0] or {}
    mood  = predict_mood(af)
    return jsonify(format_track(track, af, mood))


@app.route("/classify", methods=["POST"])
def classify():
    """
    POST /classify  body: {"valence":0.9,"energy":0.8,...}
    Returns mood prediction + confidence probabilities.
    """
    if clf is None:
        return jsonify({"error": "Model not loaded"}), 503
    data = request.get_json(silent=True) or {}
    vec  = np.array([[data.get(f, 0) for f in FEATURES]])
    vec_scaled = scaler.transform(vec)
    pred_idx   = clf.predict(vec_scaled)[0]
    mood       = le.inverse_transform([pred_idx])[0]
    proba      = clf.predict_proba(vec_scaled)[0]
    return jsonify({
        "mood": mood,
        "confidence": round(float(proba.max()) * 100, 1),
        "probabilities": {
            le.classes_[i]: round(float(p) * 100, 1)
            for i, p in enumerate(proba)
        }
    })


@app.route("/analytics", methods=["GET"])
def analytics():
    """Returns model metrics (unchanged — from training on our dataset)."""
    if metrics is None:
        return jsonify({"error": "Model not trained. Run model/train_model.py"}), 503
    return jsonify(metrics)


@app.route("/moods", methods=["GET"])
def moods():
    return jsonify({"moods": list(MOOD_SEEDS.keys())})


@app.route("/trending", methods=["GET"])
def trending():
    """Returns currently trending tracks on Spotify, classified by mood."""
    results   = sp.search(q="year:2024-2025", type="track", limit=20, market="US")
    tracks    = results["tracks"]["items"]
    track_ids = [t["id"] for t in tracks]
    af_map    = get_audio_features_bulk(track_ids)
    songs     = [format_track(t, af_map.get(t["id"], {})) for t in tracks]
    return jsonify({"songs": songs})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
