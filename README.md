# 🎵 Moodspot — Mood-Based Music Recommender

ML-powered music recommender using a Random Forest classifier + live Spotify API.

---

## Tech Stack

| Layer    | Tech                              |
|----------|-----------------------------------|
| Frontend | React 18 + Vite                   |
| Backend  | Flask + Flask-CORS                |
| ML       | scikit-learn (Random Forest)      |
| Music    | Spotify Web API via spotipy       |
| Deploy   | Backend → Render · Frontend → Vercel |

---

## Local Setup

### 1. Clone & enter project
```bash
git clone <your-repo-url>
cd Moodtunes
```

### 2. Backend setup
```bash
cd backend
cp .env.example .env
# Edit .env — add your Spotify credentials (https://developer.spotify.com/dashboard)

pip install -r requirements.txt

# Train the ML model (only needed once)
cd ..
python dataset/generate_dataset.py
python model/train_model.py
cd backend

# Start Flask
python app.py
# → running on http://localhost:5000
```

### 3. Frontend setup (new terminal)
```bash
cd frontend
npm install
npm run dev
# → running on http://localhost:3000
```

Open http://localhost:3000 — the Vite proxy forwards `/recommend`, `/analytics` etc. to Flask automatically.

---

## Spotify Credentials

1. Go to https://developer.spotify.com/dashboard
2. Create an app
3. Copy Client ID and Client Secret into `backend/.env`:
```
SPOTIFY_CLIENT_ID=your_id
SPOTIFY_CLIENT_SECRET=your_secret
```

> ⚠️ `sp.recommendations()` was **removed by Spotify in November 2024**.  
> This app uses `sp.search()` + audio-feature filtering instead — no deprecated endpoints.

---

## Deploy

### Backend → Render
1. Push code to GitHub (backend/.env is gitignored — set env vars in Render dashboard)
2. Connect repo to Render
3. Set **Root Directory** = `backend`
4. **Build command**: `pip install -r requirements.txt && cd .. && python dataset/generate_dataset.py && python model/train_model.py`
5. **Start command**: `gunicorn app:app --bind 0.0.0.0:$PORT`
6. Add env vars: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`

### Frontend → Vercel
1. Connect repo to Vercel
2. Set **Root Directory** = `frontend`
3. Add environment variable: `VITE_API_URL` = `https://your-render-backend.onrender.com`
4. Deploy

---

## API Endpoints

| Method | Endpoint       | Description                          |
|--------|---------------|--------------------------------------|
| GET    | `/`           | Health check + model info            |
| GET    | `/recommend`  | `?mood=Happy&limit=10` → songs       |
| POST   | `/recommend`  | `{"mood":"Sad","limit":10}`          |
| GET    | `/search`     | `?q=adele&mood=Sad`                  |
| POST   | `/classify`   | Predict mood from audio features     |
| GET    | `/trending`   | Recent popular songs + mood labels   |
| GET    | `/analytics`  | ML metrics, confusion matrix, etc.   |
| GET    | `/moods`      | List of available moods              |

---

## Project Structure

```
Moodtunes/
├── backend/
│   ├── app.py              ← Flask API (main entry point)
│   ├── requirements.txt
│   ├── runtime.txt
│   └── .env.example
├── dataset/
│   └── generate_dataset.py ← synthetic training data generator
├── model/
│   └── train_model.py      ← trains Random Forest + saves artifacts
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── index.css
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   └── SongCard.jsx
│   │   └── pages/
│   │       ├── HomePage.jsx
│   │       ├── MoodPage.jsx
│   │       ├── ResultsPage.jsx
│   │       └── AnalyticsPage.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   ├── .env               ← local dev (localhost:5000)
│   └── .env.production    ← update with Render URL before deploying
├── render.yaml
├── .gitignore
└── README.md
```
