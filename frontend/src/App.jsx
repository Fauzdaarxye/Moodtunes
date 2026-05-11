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

  const navigate = (to, data = {}) => {
    if (data.mood)  setSelectedMood(data.mood);
    if (data.songs) setSongs(data.songs);
    setPage(to);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar page={page} navigate={navigate} />
      <main>
        {page === 'home'      && <HomePage      navigate={navigate} />}
        {page === 'mood'      && <MoodPage      navigate={navigate} />}
        {page === 'results'   && <ResultsPage   mood={selectedMood} songs={songs} navigate={navigate} />}
        {page === 'analytics' && <AnalyticsPage />}
      </main>
    </div>
  );
}
