function BasketballIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="26" fill="#FF5C00"/>
      <path d="M2.5 28h51" stroke="white" strokeWidth="1.6" strokeOpacity="0.55"/>
      <path d="M28 2.5v51" stroke="white" strokeWidth="1.6" strokeOpacity="0.55"/>
      <path d="M13 4.5C20 17 20 39 13 51.5" stroke="white" strokeWidth="1.6" strokeOpacity="0.55" fill="none"/>
      <path d="M43 4.5C36 17 36 39 43 51.5" stroke="white" strokeWidth="1.6" strokeOpacity="0.55" fill="none"/>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M13.5 8.5A5.5 5.5 0 1 1 7.5 3a4 4 0 0 0 6 5.5z" fill="currentColor"/>
    </svg>
  )
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="3" fill="currentColor"/>
      <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}

export default function HomeScreen({ gameMode, setGameMode, difficulty, setDifficulty, onPlay, hasPlayers, isDark, toggleTheme }) {
  return (
    <div className="home">
      <button className="home-theme-toggle" onClick={toggleTheme} aria-label="Toggle dark mode">
        {isDark ? <SunIcon /> : <MoonIcon />}
      </button>

      <div className="home-logo-section">
        <div className="home-logo-icon">
          <BasketballIcon />
        </div>
        <h1 className="home-wordmark">Guess The Player</h1>
        <p className="home-hook">Are you smarter than a commentator?</p>
      </div>

      <div className="home-controls">
        <div className="control-group">
          <div className="control-label">Mode</div>
          <div className="toggle-group">
            {[
              { id: 'quick',    label: 'Quick Play' },
              { id: 'allstars', label: 'All-Stars' },
              { id: 'all',      label: 'All Players' },
            ].map(({ id, label }) => (
              <button
                key={id}
                className={`toggle-btn${gameMode === id ? ' active' : ''}`}
                onClick={() => setGameMode(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="control-group">
          <div className="control-label">Difficulty</div>
          <div className="toggle-group">
            {[
              { id: 'easy',   label: 'Easy' },
              { id: 'medium', label: 'Medium' },
              { id: 'hard',   label: 'Hard' },
            ].map(({ id, label }) => (
              <button
                key={id}
                className={`toggle-btn${difficulty === id ? ' active' : ''}`}
                onClick={() => setDifficulty(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {hasPlayers ? (
          <button className="btn-play" onClick={onPlay}>Play</button>
        ) : (
          <div className="empty-state">
            <h2>No Players Found</h2>
            <p>Run the scrape script to populate the player roster:</p>
            <code>npm run scrape</code>
          </div>
        )}
      </div>

      <p className="home-disclaimer">
        Guess The Player is an independent project and is not affiliated with, endorsed by, or sponsored by the Women's National Basketball Association.
      </p>
    </div>
  )
}
