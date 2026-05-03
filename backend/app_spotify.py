import os, json, pickle
import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials

# Load env variables
load_dotenv()

app = Flask(__name__)
app.secret_key = os.urandom(24)
CORS(app)

# 🔥 Spotify Client (CORRECT AUTH)
sp = spotipy.Spotify(
    auth_manager=SpotifyClientCredentials(
        client_id=os.getenv("SPOTIFY_CLIENT_ID"),
        client_secret=os.getenv("SPOTIFY_CLIENT_SECRET")
    )
)

# ─────────────────────────────────────────────
# Load ML Model
# ─────────────────────────────────────────────
BASE = os.path.dirname(__file__)
MODEL = os.path.join(BASE, "..", "model")

def load_model():
    with open(os.path.join(MODEL, "mood_classifier.pkl"), "rb") as f:
        clf = pickle.load(f)
    with open(os.path.join(MODEL, "scaler.pkl"), "rb") as f:
        scaler = pickle.load(f)
    with open(os.path.join(MODEL, "label_encoder.pkl"), "rb") as f:
        le = pickle.load(f)
    return clf, scaler, le

try:
    clf, scaler, le = load_model()
    print("✅ ML model loaded")
except:
    clf = scaler = le = None
    print("⚠️ ML model not found")

FEATURES = ["valence", "energy", "danceability", "tempo", "acousticness", "loudness"]

# ─────────────────────────────────────────────
# SAFE MOOD CONFIG (ONLY VALID GENRES)
# ─────────────────────────────────────────────
MOOD_SEEDS = {
    "Happy": ["pop"],
    "Sad": ["acoustic"],
    "Energetic": ["edm"],
    "Calm": ["classical"]
}

# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────
def predict_mood(features):
    if clf is None:
        return "Unknown"
    vec = np.array([[features.get(f, 0) for f in FEATURES]])
    vec = scaler.transform(vec)
    idx = clf.predict(vec)[0]
    return le.inverse_transform([idx])[0]

def get_audio_features(track_ids):
    if not track_ids:
        return {}
    feats = sp.audio_features(track_ids)
    return {f["id"]: f for f in feats if f}

def format_track(track, af, mood):
    return {
        "id": track["id"],
        "track_name": track["name"],
        "artist": track["artists"][0]["name"],
        "album": track["album"]["name"],
        "image": track["album"]["images"][0]["url"] if track["album"]["images"] else None,
        "spotify_url": track["external_urls"]["spotify"],
        "preview": track.get("preview_url"),
        "mood": mood,
        "energy": af.get("energy", 0),
        "valence": af.get("valence", 0)
    }

# ─────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────

@app.route("/")
def home():
    return jsonify({"status": "API running"})

@app.route("/recommend")
def recommend():
    try:
        mood = request.args.get("mood", "Happy").capitalize()
        limit = int(request.args.get("limit", 10))

        if mood not in MOOD_SEEDS:
            return jsonify({"error": "Invalid mood"}), 400

        genres = MOOD_SEEDS[mood]  # ✅ LIST (no join, no string)

        # 🔥 CLEAN SPOTIFY CALL (THIS FIXES EVERYTHING)
        recs = sp.recommendations(
            seed_genres=genres,
            limit=min(limit, 50)
        )

        tracks = recs.get("tracks", [])

        if not tracks:
            return jsonify({"error": "No tracks found"}), 404

        ids = [t["id"] for t in tracks]
        af_map = get_audio_features(ids)

        songs = [
            format_track(t, af_map.get(t["id"], {}), mood)
            for t in tracks
        ]

        return jsonify({
            "mood": mood,
            "count": len(songs),
            "songs": songs
        })

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"error": str(e)}), 500


@app.route("/moods")
def moods():
    return jsonify({"moods": list(MOOD_SEEDS.keys())})


# ─────────────────────────────────────────────
# Run
# ─────────────────────────────────────────────
if __name__ == "__main__":
    app.run(debug=True, port=5000)