"""
train_model.py
Trains a Random Forest classifier on the Spotify mood dataset.
Saves: model/mood_classifier.pkl, model/scaler.pkl, model/label_encoder.pkl
Also outputs evaluation metrics and plots.
"""
import pandas as pd
import numpy as np
import pickle, os, json
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import (accuracy_score, classification_report,
                              confusion_matrix)

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE   = os.path.dirname(__file__)
DATA   = os.path.join(BASE, "spotify_mood_dataset.csv")
OUT    = os.path.join(BASE, "..", "model")
os.makedirs(OUT, exist_ok=True)

# ── 1. Load & inspect ─────────────────────────────────────────────────────────
df = pd.read_csv(DATA)
print(f"Loaded {len(df)} rows  |  columns: {list(df.columns)}")

FEATURES = ["valence", "energy", "danceability", "tempo",
            "acousticness", "loudness"]
TARGET   = "mood"

# ── 2. Create mood labels if missing ──────────────────────────────────────────
if TARGET not in df.columns:
    print("No 'mood' column found – deriving from audio features …")
    def label_mood(row):
        if row.valence > 0.6 and row.energy > 0.6:   return "Happy"
        if row.valence < 0.4 and row.energy < 0.4:   return "Sad"
        if row.energy > 0.75 and row.tempo > 120:     return "Energetic"
        return "Calm"
    df[TARGET] = df.apply(label_mood, axis=1)

print("Mood distribution:\n", df[TARGET].value_counts())

# ── 3. Pre-process ────────────────────────────────────────────────────────────
X = df[FEATURES].fillna(df[FEATURES].median())
le = LabelEncoder()
y  = le.fit_transform(df[TARGET])

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y, test_size=0.2, random_state=42, stratify=y)

# ── 4. Train models & compare ─────────────────────────────────────────────────
models = {
    "Random Forest":    RandomForestClassifier(n_estimators=200, random_state=42),
    "Logistic Regression": LogisticRegression(max_iter=1000, random_state=42),
}
results = {}
for name, clf in models.items():
    clf.fit(X_train, y_train)
    acc = accuracy_score(y_test, clf.predict(X_test))
    results[name] = round(acc * 100, 2)
    print(f"  {name}: {acc:.4f}")

best_name = max(results, key=results.get)
best_clf  = models[best_name]
print(f"\n✅ Best model: {best_name} ({results[best_name]}%)")

# ── 5. Evaluate best model ────────────────────────────────────────────────────
y_pred = best_clf.predict(X_test)
cm     = confusion_matrix(y_test, y_pred)
report = classification_report(y_test, y_pred,
                                target_names=le.classes_, output_dict=True)

print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=le.classes_))
print("Confusion Matrix:\n", cm)

# ── 6. Persist artefacts ──────────────────────────────────────────────────────
with open(os.path.join(OUT, "mood_classifier.pkl"), "wb") as f:
    pickle.dump(best_clf, f)
with open(os.path.join(OUT, "scaler.pkl"), "wb") as f:
    pickle.dump(scaler, f)
with open(os.path.join(OUT, "label_encoder.pkl"), "wb") as f:
    pickle.dump(le, f)

# Save metrics as JSON (consumed by /analytics endpoint)
metrics = {
    "model_name": best_name,
    "accuracy": results[best_name],
    "model_comparison": results,
    "confusion_matrix": cm.tolist(),
    "class_labels": list(le.classes_),
    "classification_report": report,
    "feature_importances": (
        dict(zip(FEATURES, best_clf.feature_importances_.tolist()))
        if hasattr(best_clf, "feature_importances_") else {}
    ),
    "mood_distribution": df[TARGET].value_counts().to_dict(),
}
with open(os.path.join(OUT, "metrics.json"), "w") as f:
    json.dump(metrics, f, indent=2)

print(f"\nAll artefacts saved to {OUT}/")
print("Done ✅")
