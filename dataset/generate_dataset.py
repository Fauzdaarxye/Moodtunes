"""
generate_dataset.py  –  synthetic Spotify-style audio feature dataset
Run:  python dataset/generate_dataset.py
"""
import numpy as np
import pandas as pd
import os

np.random.seed(42)
N = 300  # samples per mood class

def gen(mood, n):
    if mood == "Happy":
        return dict(
            valence      = np.clip(np.random.normal(0.75, 0.10, n), 0.5,  1.0),
            energy       = np.clip(np.random.normal(0.72, 0.10, n), 0.5,  1.0),
            danceability = np.clip(np.random.normal(0.70, 0.10, n), 0.4,  1.0),
            tempo        = np.clip(np.random.normal(120,  15,   n), 90,   160),
            acousticness = np.clip(np.random.normal(0.20, 0.10, n), 0.0,  0.6),
            loudness     = np.clip(np.random.normal(-5,    2,   n), -12,  0),
        )
    elif mood == "Sad":
        return dict(
            valence      = np.clip(np.random.normal(0.25, 0.10, n), 0.0,  0.45),
            energy       = np.clip(np.random.normal(0.30, 0.10, n), 0.0,  0.50),
            danceability = np.clip(np.random.normal(0.35, 0.10, n), 0.1,  0.6),
            tempo        = np.clip(np.random.normal(75,   12,   n), 50,   110),
            acousticness = np.clip(np.random.normal(0.65, 0.15, n), 0.3,  1.0),
            loudness     = np.clip(np.random.normal(-12,   3,   n), -20, -5),
        )
    elif mood == "Energetic":
        return dict(
            valence      = np.clip(np.random.normal(0.60, 0.12, n), 0.35, 1.0),
            energy       = np.clip(np.random.normal(0.88, 0.07, n), 0.70, 1.0),
            danceability = np.clip(np.random.normal(0.75, 0.10, n), 0.5,  1.0),
            tempo        = np.clip(np.random.normal(140,  15,   n), 110,  180),
            acousticness = np.clip(np.random.normal(0.10, 0.08, n), 0.0,  0.35),
            loudness     = np.clip(np.random.normal(-3,    2,   n), -8,   0),
        )
    else:  # Calm
        return dict(
            valence      = np.clip(np.random.normal(0.50, 0.12, n), 0.25, 0.75),
            energy       = np.clip(np.random.normal(0.25, 0.08, n), 0.0,  0.40),
            danceability = np.clip(np.random.normal(0.40, 0.10, n), 0.15, 0.65),
            tempo        = np.clip(np.random.normal(85,   12,   n), 55,   115),
            acousticness = np.clip(np.random.normal(0.70, 0.15, n), 0.35, 1.0),
            loudness     = np.clip(np.random.normal(-14,   3,   n), -22, -6),
        )

rows = []
for mood in ["Happy", "Sad", "Energetic", "Calm"]:
    d = gen(mood, N)
    for i in range(N):
        rows.append({k: round(float(v[i]), 4) for k, v in d.items()} | {"mood": mood})

df = pd.DataFrame(rows).sample(frac=1, random_state=42).reset_index(drop=True)
out = os.path.join(os.path.dirname(__file__), "mood_dataset.csv")
df.to_csv(out, index=False)
print(f"✅  Dataset → {out}  ({len(df)} rows)")
