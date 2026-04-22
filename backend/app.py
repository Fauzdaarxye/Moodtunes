"""
app.py  –  Mood-Based Music Recommender API
Run:  python app.py
"""
import os, json, pickle
import pandas as pd
import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS

# ── App setup ─────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)

BASE    = os.path.dirname(__file__)
MODEL   = os.path.join(BASE, "..", "model")
DATA    = os.path.join(BASE, "spotify_mood_dataset.csv")

# ── Load artefacts once ───────────────────────────────────────────────────────
def load_artefacts():
    with open(os.path.join(MODEL, "mood_classifier.pkl"), "rb") as f:
        clf = pickle.load(f)
    with open(os.path.join(MODEL, "scaler.pkl"), "rb") as f:
        scaler = pickle.load(f)
    with open(os.path.join(MODEL, "label_encoder.pkl"), "rb") as f:
        le = pickle.load(f)
    with open(os.path.join(MODEL, "metrics.json")) as f:
        metrics = json.load(f)
    df = pd.read_csv(DATA)
    return clf, scaler, le, metrics, df

try:
    clf, scaler, le, metrics, df = load_artefacts()
    print("✅ Model artefacts loaded")
except Exception as e:
    clf = scaler = le = metrics = df = None
    print(f"⚠️  Could not load artefacts: {e} — run train_model.py first")

FEATURES = ["valence", "energy", "danceability", "tempo",
            "acousticness", "loudness"]

MOOD_DEFAULTS = {
    "Happy":    {"valence": 0.82, "energy": 0.80, "danceability": 0.77,
                 "tempo": 128, "acousticness": 0.12, "loudness": -4.0},
    "Sad":      {"valence": 0.18, "energy": 0.28, "danceability": 0.35,
                 "tempo": 78,  "acousticness": 0.58, "loudness": -13.0},
    "Energetic":{"valence": 0.60, "energy": 0.92, "danceability": 0.85,
                 "tempo": 150, "acousticness": 0.04, "loudness": -2.0},
    "Calm":     {"valence": 0.48, "energy": 0.22, "danceability": 0.38,
                 "tempo": 70,  "acousticness": 0.76, "loudness": -17.0},
}

# ── Helpers ───────────────────────────────────────────────────────────────────
def get_recommendations(mood: str, n: int = 10):
    """Return n songs matching the requested mood."""
    mood = mood.capitalize()
    pool = df[df["mood"] == mood].copy()
    if pool.empty:
        return []
    sample = pool.sample(min(n, len(pool)), random_state=None)
    return sample[["track_name", "artists", "mood",
                   "valence", "energy", "danceability", "tempo",
                   "acousticness", "loudness"]].to_dict(orient="records")

# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/", methods=["GET"])
def root():
    return jsonify({"message": "🎵 Mood Music API is running", "status": "ok"})


@app.route("/recommend", methods=["GET", "POST"])
def recommend():
    """
    GET  /recommend?mood=Happy&limit=10
    POST /recommend  body: {"mood": "Happy", "limit": 10}
         or          body: {"features": {"valence":0.9,"energy":0.8,...}}
    """
    if request.method == "POST":
        data   = request.get_json(silent=True) or {}
        mood   = data.get("mood")
        limit  = int(data.get("limit", 10))
        features = data.get("features")

        # Predict mood from raw audio features
        if features and clf is not None:
            vec = np.array([[features.get(f, 0) for f in FEATURES]])
            vec = scaler.transform(vec)
            pred_idx = clf.predict(vec)[0]
            mood = le.inverse_transform([pred_idx])[0]
    else:
        mood  = request.args.get("mood", "Happy")
        limit = int(request.args.get("limit", 10))

    if not mood:
        return jsonify({"error": "mood parameter required"}), 400

    songs = get_recommendations(mood, limit)
    return jsonify({
        "mood": mood,
        "count": len(songs),
        "songs": songs,
    })


@app.route("/analytics", methods=["GET"])
def analytics():
    """Returns all chart data for the Analytics Dashboard."""
    if metrics is None:
        return jsonify({"error": "Model not trained. Run train_model.py first."}), 503

    mood_dist = df["mood"].value_counts().to_dict()

    # Feature averages per mood
    feat_avg = (
        df.groupby("mood")[FEATURES].mean().round(3).to_dict(orient="index")
    )

    # Correlation matrix (numeric cols)
    corr = df[FEATURES].corr().round(3).to_dict()

    return jsonify({
        "accuracy":           metrics["accuracy"],
        "model_name":         metrics["model_name"],
        "model_comparison":   metrics["model_comparison"],
        "confusion_matrix":   metrics["confusion_matrix"],
        "class_labels":       metrics["class_labels"],
        "classification_report": metrics["classification_report"],
        "feature_importances":metrics.get("feature_importances", {}),
        "mood_distribution":  mood_dist,
        "feature_averages":   feat_avg,
        "correlation":        corr,
    })


@app.route("/moods", methods=["GET"])
def moods():
    """Returns list of available moods."""
    available = sorted(df["mood"].unique().tolist()) if df is not None else \
                list(MOOD_DEFAULTS.keys())
    return jsonify({"moods": available})


@app.route("/train", methods=["POST"])
def train():
    """Re-trains the model on demand."""
    import subprocess, sys
    train_script = os.path.join(MODEL, "..", "model", "train_model.py")
    result = subprocess.run(
        [sys.executable, train_script],
        capture_output=True, text=True, cwd=os.path.dirname(train_script)
    )
    if result.returncode == 0:
        global clf, scaler, le, metrics
        clf, scaler, le, metrics, _ = load_artefacts()
        return jsonify({"message": "Model retrained successfully",
                        "accuracy": metrics["accuracy"]})
    return jsonify({"error": result.stderr}), 500


@app.route("/search", methods=["GET"])
def search():
    """Search songs by name or artist."""
    q = request.args.get("q", "").lower()
    mood = request.args.get("mood", "")
    if not q and not mood:
        return jsonify({"songs": []})

    mask = pd.Series([True] * len(df))
    if q:
        mask &= (df["track_name"].str.lower().str.contains(q) |
                 df["artists"].str.lower().str.contains(q))
    if mood:
        mask &= df["mood"].str.lower() == mood.lower()

    results = df[mask].head(20).copy()
    return jsonify({"songs": results[["track_name", "artists", "mood",
                                       "valence", "energy", "danceability",
                                       "tempo", "acousticness", "loudness"]]
                    .to_dict(orient="records")})


if __name__ == "__main__":
    app.run(debug=True, port=5003)
