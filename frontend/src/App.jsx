import React, { useState } from 'react';
import Navbar      from './components/Navbar';
import HomePage    from './pages/HomePage';
import MoodPage    from './pages/MoodPage';
import ResultsPage from './pages/ResultsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import LoginPage from './pages/LoginPage';

const loadSavedUser = () => {
  try {
    return JSON.parse(localStorage.getItem('moodtunes-user')) || null;
  } catch {
    return null;
  }
};

export default function App() {
  const [page,         setPage]         = useState('home');
  const [selectedMood, setSelectedMood] = useState(null);
  const [songs,        setSongs]        = useState([]);
  const [audioFeaturesProfile, setAudioFeaturesProfile] = useState(null);
  const [user, setUser] = useState(loadSavedUser);
  /** Last mood-page request size; refresh on results must not shrink to current list length. */
  const [recommendLimit, setRecommendLimit] = useState(10);
  const [rareMode, setRareMode] = useState(false);

  const navigate = (to, data = {}) => {
    if (to === 'home') {
      setAudioFeaturesProfile(null);
    } else if (to === 'mood' && !('audioFeaturesProfile' in data)) {
      setAudioFeaturesProfile(null);
    }
    if (data.mood)  setSelectedMood(data.mood);
    if (data.songs) setSongs(data.songs);
    if (data.recommendLimit != null && data.recommendLimit !== '') {
      const n = parseInt(String(data.recommendLimit), 10);
      if (!Number.isNaN(n)) setRecommendLimit(Math.max(1, Math.min(30, n)));
    }
    if ('rare' in data) {
      setRareMode(Boolean(data.rare));
    }
    // ignore popularityThreshold changes — revert to original behaviour
    if ('audioFeaturesProfile' in data) {
      setAudioFeaturesProfile(data.audioFeaturesProfile ?? null);
    }
    setPage(to);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuth = (account) => {
    const nextUser = {
      name: account.name || account.email.split('@')[0],
      email: account.email,
      provider: account.provider || 'gmail',
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem('moodtunes-user', JSON.stringify(nextUser));
    setUser(nextUser);
    navigate('mood');
  };

  const handleSignOut = () => {
    localStorage.removeItem('moodtunes-user');
    setUser(null);
    navigate('home');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar page={page} navigate={navigate} user={user} onSignOut={handleSignOut} />
      <main>
        {page === 'home'      && <HomePage      navigate={navigate} />}
        {page === 'mood'      && <MoodPage      navigate={navigate} />}
        {page === 'results'   && (
          <ResultsPage
            mood={selectedMood}
            songs={songs}
            audioFeaturesProfile={audioFeaturesProfile}
            recommendLimit={recommendLimit}
            rare={rareMode}
            navigate={navigate}
          />
        )}
        {page === 'analytics' && <AnalyticsPage />}
        {page === 'login' && <LoginPage onAuth={handleAuth} navigate={navigate} />}
      </main>
    </div>
  );
}
