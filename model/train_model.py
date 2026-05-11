"""
train_model.py  –  trains and saves the mood classifier
Run:  python model/train_model.py
Outputs (saved to model/):
  mood_classifier.pkl
  scaler.pkl
  label_encoder.pkl
  metrics.json
"""
import os, sys, json, pickle
import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, confusion_matrix

# ── paths ─────────────────────────────────────────────────────────────────────
HERE    = os.path.dirname(os.path.abspath(__file__))
DATASET = os.path.join(HERE, "..", "dataset", "mood_dataset.csv")

# If dataset does not exist yet, generate it on the fly
if not os.path.exists(DATASET):
    print("Dataset not found — generating...")
    sys.path.insert(0, os.path.join(HERE, "..", "dataset"))
    import generate_dataset  # runs the file

FEATURES = ["valence", "energy", "danceability", "tempo", "acousticness", "loudness"]

# ── load data ─────────────────────────────────────────────────────────────────
df = pd.read_csv(DATASET)
X  = df[FEATURES].values
le = LabelEncoder()
y  = le.fit_transform(df["mood"].values)

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

scaler  = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_test  = scaler.transform(X_test)

# ── train both models, pick best ──────────────────────────────────────────────
lr  = LogisticRegression(max_iter=1000, random_state=42)
rf  = RandomForestClassifier(n_estimators=100, random_state=42)

lr.fit(X_train, y_train)
rf.fit(X_train, y_train)

lr_acc = round(accuracy_score(y_test, lr.predict(X_test)) * 100, 2)
rf_acc = round(accuracy_score(y_test, rf.predict(X_test)) * 100, 2)

print(f"Logistic Regression: {lr_acc}%")
print(f"Random Forest:       {rf_acc}%")

best_clf  = rf  if rf_acc >= lr_acc else lr
best_name = "Random Forest" if rf_acc >= lr_acc else "Logistic Regression"
best_acc  = max(lr_acc, rf_acc)

# ── confusion matrix ──────────────────────────────────────────────────────────
cm      = confusion_matrix(y_test, best_clf.predict(X_test))
classes = list(le.classes_)

# ── feature averages per mood (for radar chart) ───────────────────────────────
feature_avgs = {}
for mood in classes:
    mask  = df["mood"] == mood
    avgs  = {}
    for f in FEATURES:
        val = df.loc[mask, f].mean()
        # normalise tempo 0-1 for display
        if f == "tempo":
            val = (val - 50) / (180 - 50)
        elif f == "loudness":
            val = (val + 25) / 25   # loudness is negative
        avgs[f] = round(float(np.clip(val, 0, 1)), 3)
    feature_avgs[mood] = avgs

# ── feature importances (Random Forest only) ─────────────────────────────────
fi = {}
if best_name == "Random Forest":
    for feat, imp in zip(FEATURES, best_clf.feature_importances_):
        fi[feat] = round(float(imp), 4)

# ── mood distribution ─────────────────────────────────────────────────────────
mood_dist = df["mood"].value_counts().to_dict()

# ── save artifacts ────────────────────────────────────────────────────────────
with open(os.path.join(HERE, "mood_classifier.pkl"), "wb") as f: pickle.dump(best_clf, f)
with open(os.path.join(HERE, "scaler.pkl"),          "wb") as f: pickle.dump(scaler,   f)
with open(os.path.join(HERE, "label_encoder.pkl"),   "wb") as f: pickle.dump(le,       f)

metrics = {
    "accuracy":          best_acc,
    "model_name":        best_name,
    "model_comparison":  {"Logistic Regression": lr_acc, "Random Forest": rf_acc},
    "confusion_matrix":  cm.tolist(),
    "class_labels":      classes,
    "feature_averages":  feature_avgs,
    "feature_importances": fi,
    "mood_distribution": mood_dist,
}
with open(os.path.join(HERE, "metrics.json"), "w") as f:
    json.dump(metrics, f, indent=2)

print(f"✅  Best model: {best_name} ({best_acc}%)")
print(f"✅  Artifacts saved to {HERE}/")
