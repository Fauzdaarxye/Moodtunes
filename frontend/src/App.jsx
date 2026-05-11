import React, { useState } from 'react';
import Navbar      from './components/Navbar';
import HomePage    from './pages/HomePage';
import MoodPage    from './pages/MoodPage';
import ResultsPage from './pages/ResultsPage';
import AnalyticsPage from './pages/AnalyticsPage';

export default function App() {
  const [page,         setPage]         = useState('home');
  const [selectedMood, setSelectedMood] = useState(null);
  const [songs,        setSongs]        = useState([]);
  const [audioFeaturesProfile, setAudioFeaturesProfile] = useState(null);

  const navigate = (to, data = {}) => {
    if (to === 'home') {
      setAudioFeaturesProfile(null);
    } else if (to === 'mood' && !('audioFeaturesProfile' in data)) {
      setAudioFeaturesProfile(null);
    }
    if (data.mood)  setSelectedMood(data.mood);
    if (data.songs) setSongs(data.songs);
    if ('audioFeaturesProfile' in data) {
      setAudioFeaturesProfile(data.audioFeaturesProfile ?? null);
    }
    setPage(to);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar page={page} navigate={navigate} />
      <main>
        {page === 'home'      && <HomePage      navigate={navigate} />}
        {page === 'mood'      && <MoodPage      navigate={navigate} />}
        {page === 'results'   && (
          <ResultsPage
            mood={selectedMood}
            songs={songs}
            audioFeaturesProfile={audioFeaturesProfile}
            navigate={navigate}
          />
        )}
        {page === 'analytics' && <AnalyticsPage />}
      </main>
    </div>
  );
}
