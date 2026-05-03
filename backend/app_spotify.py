import os, json, pickle
import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials

load_dotenv()

app = Flask(__name__)
app.secret_key = os.urandom(24)
CORS(app, supports_credentials=True)

# Spotify Client
sp = spotipy.Spotify(
    auth_manager=SpotifyClientCredentials(
        client_id=os.environ.get("SPOTIFY_CLIENT_ID"),
        client_secret=os.environ.get("SPOTIFY_CLIENT_SECRET")
    )
)

# Load ML Model
BASE = os.path.dirname(__file__)
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
    print(f"⚠️ Model not loaded: {e}")

FEATURES = ["valence", "energy", "danceability", "tempo", "acousticness", "loudness"]

# ✅ CLEAN MOOD CONFIG (ONLY VALID GENRES)
MOOD_SEEDS = {
    "Happy": {"seed_genres": ["pop"]},
    "Sad": {"seed_genres": ["acoustic"]},
    "Energetic": {"seed_genres": ["edm"]},
    "Calm": {"seed_genres": ["classical"]},
}

# Helpers
def predict_mood(features):
    if clf is None:
        return "Unknown"
    vec = np.array([[features.get(f, 0) for f in FEATURES]])
    vec = scaler.transform(vec)
    idx = clf.predict(vec)[0]
    return le.inverse_transform([idx])[0]

def format_track(track, af, mood=None):
    af = af or {}
    mood = mood or predict_mood(af)
    return {
        "id": track["id"],
        "track_name": track["name"],
        "artists": ", ".join(a["name"] for a in track["artists"]),
        "album": track["album"]["name"],
        "preview_url": track.get("preview_url"),
        "spotify_url": track["external_urls"]["spotify"],
        "image": track["album"]["images"][0]["url"] if track["album"]["images"] else None,
        "mood": mood,
        "valence": af.get("valence", 0),
        "energy": af.get("energy", 0),
        "danceability": af.get("danceability", 0),
        "tempo": af.get("tempo", 0),
    }

def get_audio_features_bulk(track_ids):
    if not track_ids:
        return {}
    features = sp.audio_features(track_ids)
    return {f["id"]: f for f in features if f}

# Routes
@app.route("/")
def root():
    return jsonify({"message": "API running"})

@app.route("/recommend", methods=["GET", "POST"])
def recommend():
    try:
        if request.method == "POST":
            data = request.get_json(silent=True) or {}
            mood = data.get("mood", "Happy")
            limit = int(data.get("limit", 10))
        else:
            mood = request.args.get("mood", "Happy")
            limit = int(request.args.get("limit", 10))

        mood = mood.capitalize()

        if mood not in MOOD_SEEDS:
            return jsonify({"error": "Invalid mood"}), 400

        genres = MOOD_SEEDS[mood]["seed_genres"]
        genres_str = ",".join(genres)

        recs = sp.recommendations(
            seed_genres=genres_str,
            limit=min(limit, 50)
        )

        tracks = recs.get("tracks", [])
        track_ids = [t["id"] for t in tracks]
        af_map = get_audio_features_bulk(track_ids)

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


if __name__ == "__main__":
    app.run(debug=True)