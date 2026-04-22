# 🎵 Moodtunes — AI-Powered Mood-Based Music Recommender

A full-stack machine learning web app that recommends songs based on your current emotional state.

---

## 🗂 Project Structure

```
mood-music/
├── frontend/               # React + Vite frontend
│   ├── src/
│   │   ├── pages/          # HomePage, MoodPage, ResultsPage, AnalyticsPage
│   │   ├── components/     # Navbar, SongCard
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── app.py              # Flask REST API
│   ├── requirements.txt
│   └── spotify_mood_dataset.csv
│
├── model/
│   ├── train_model.py      # ML training script
│   ├── mood_classifier.pkl # (generated)
│   ├── scaler.pkl          # (generated)
│   ├── label_encoder.pkl   # (generated)
│   └── metrics.json        # (generated)
│
├── dataset/
│   ├── generate_dataset.py
│   └── spotify_mood_dataset.csv
│
├── render.yaml             # Render deployment config
└── README.md
```

---

## ⚡ Quick Start (Local)

### Prerequisites
- Python 3.9+
- Node.js 18+

---

### Step 1 — Generate Dataset (optional, already included)

```bash
cd dataset
pip install pandas numpy
python generate_dataset.py
```

---

### Step 2 — Train the ML Model

```bash
cd model
pip install scikit-learn pandas numpy
python train_model.py
```

Expected output:
```
✅ Best model: Logistic Regression (99.5%)
All artefacts saved to model/
```

---

### Step 3 — Start the Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
```

Backend runs at: `http://localhost:5000`

**Test it:**
```bash
curl "http://localhost:5000/recommend?mood=Happy&limit=5"
curl "http://localhost:5000/analytics"
curl "http://localhost:5000/moods"
```

---

### Step 4 — Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:3000`

---

## 🌐 API Endpoints

| Method | Endpoint      | Description                              |
|--------|---------------|------------------------------------------|
| GET    | `/`           | Health check                             |
| GET    | `/recommend`  | `?mood=Happy&limit=10` — get songs       |
| POST   | `/recommend`  | Body: `{"mood":"Calm","limit":8}`        |
| POST   | `/recommend`  | Body: `{"features":{...}}` — predict    |
| GET    | `/analytics`  | All chart data + model metrics           |
| GET    | `/moods`      | List available moods                     |
| GET    | `/search`     | `?q=adele&mood=Sad` — search songs       |
| POST   | `/train`      | Retrain model on demand                  |

---

## 🤖 Machine Learning

### Dataset Features
| Feature       | Description                          |
|---------------|--------------------------------------|
| valence       | Musical positivity (0–1)             |
| energy        | Intensity and activity (0–1)         |
| danceability  | How suitable for dancing (0–1)       |
| tempo         | Beats per minute                     |
| acousticness  | Acoustic instrument confidence (0–1) |
| loudness      | Overall loudness in dB               |

### Mood Labelling Rules
```
High valence + high energy   → Happy
Low valence + low energy     → Sad
High energy + fast tempo     → Energetic
Low energy + acoustic        → Calm
```

### Models Evaluated
- **Logistic Regression** — best performer at ~99.5%
- **Random Forest** — ~99% accuracy

---

## 🚀 Deployment

### Backend → Render

1. Push code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your repo, set Root Dir = `backend`
4. Build command: `pip install -r requirements.txt && python ../model/train_model.py`
5. Start command: `gunicorn app:app --bind 0.0.0.0:$PORT`

### Frontend → Vercel / Netlify

1. Go to [vercel.com](https://vercel.com) → New Project
2. Connect your GitHub repo
3. Set Root Directory = `frontend`
4. Add Environment Variable:
   ```
   VITE_API_URL = https://your-render-backend.onrender.com
   ```
5. Deploy!

---

## 📊 Analytics Dashboard Features

- **Mood Distribution** — horizontal bar chart
- **Model Comparison** — accuracy of RF vs LR
- **Feature Profile Radar** — per-mood audio feature averages
- **Confusion Matrix** — heatmap of classification results
- **Feature Importances** — which features drive predictions most

---

## 🛠 Tech Stack

| Layer      | Technology                         |
|------------|------------------------------------|
| Frontend   | React 18, Vite, CSS Variables      |
| Styling    | Custom CSS (Spotify-dark theme)    |
| Charts     | Pure SVG / CSS                     |
| Backend    | Python 3, Flask, Flask-CORS        |
| ML         | scikit-learn, pandas, numpy        |
| Deploy FE  | Vercel / Netlify                   |
| Deploy BE  | Render / Railway                   |

---

## 📝 License

MIT — free to use, modify, and distribute.
