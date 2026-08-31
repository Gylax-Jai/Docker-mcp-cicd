import React, { useState } from 'react';
import './App.css';
import FavoriteForm from './FavoriteForm';
import SubmissionList from './SubmissionList';

function App() {
  const [newEntry, setNewEntry] = useState(null);

  const handleNewSubmission = (entry) => {
    setNewEntry(entry);
    // Reset after a tick so useEffect triggers on each new entry
    setTimeout(() => setNewEntry(null), 100);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <span className="app-logo">🎨</span>
        <h1>My Favorites Hub</h1>
        <p>A fun little app to capture what you love most</p>
        <span className="badge">React + Node.js · Docker Ready</span>
      </header>

      <main className="app-main">
        <section className="panel" aria-label="Submit your favorites">
          <FavoriteForm onSubmitSuccess={handleNewSubmission} />
        </section>

        <section className="panel" aria-label="All submissions">
          <SubmissionList newEntry={newEntry} />
        </section>
      </main>
    </div>
  );
}

export default App;
