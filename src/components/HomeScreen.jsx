import { useEffect, useRef } from 'react'

function PixelPreview({ src }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    const PIXEL = 20

    const img = new Image()
    img.onload = () => {
      const lowW = Math.round(W / PIXEL)
      const lowH = Math.round(H / PIXEL)
      const { naturalWidth: iW, naturalHeight: iH } = img
      const aspect = W / H
      let sx, sy, sw, sh
      if (iW / iH > aspect) {
        sh = iH; sw = iH * aspect; sx = (iW - sw) / 2; sy = 0
      } else {
        sw = iW; sh = iW / aspect; sx = 0; sy = 0
      }
      ctx.imageSmoothingEnabled = true
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, lowW, lowH)
      const tmp = document.createElement('canvas')
      tmp.width = lowW; tmp.height = lowH
      tmp.getContext('2d').drawImage(canvas, 0, 0)
      ctx.clearRect(0, 0, W, H)
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(tmp, 0, 0, W, H)
    }
    img.src = src
  }, [src])

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={160}
      style={{ width: '100%', height: 'auto', display: 'block' }}
    />
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

const DIFFICULTY_ORDER = ['easy', 'medium', 'hard', 'impossible']
const PREV_LABEL = { medium: 'Normal', hard: 'Blur', impossible: 'Pixel' }

function unlockRequirement(gameMode) {
  return gameMode === 'quick' ? 'Score 10/10' : 'Score 80%'
}

function LockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="4" y="9" width="12" height="9" rx="2" fill="currentColor"/>
      <path d="M7 9V6a3 3 0 0 1 6 0v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

export default function HomeScreen({ gameMode, setGameMode, difficulty, setDifficulty, poolCounts = {}, completions = {}, onPlay, hasPlayers, isDark, toggleTheme }) {
  function isLocked(id) {
    const idx = DIFFICULTY_ORDER.indexOf(id)
    if (idx === 0) return false
    return !completions[`${gameMode}:${DIFFICULTY_ORDER[idx - 1]}`]
  }
  return (
    <div className="home">
      <button className="home-theme-toggle" onClick={toggleTheme} aria-label="Toggle dark mode">
        {isDark ? <SunIcon /> : <MoonIcon />}
      </button>

      <div className="home-logo-section">
        <div className="home-logo-icon">
          <img src="/wnba-guessr-logo.svg" alt="WNBA Guessr" className="home-logo-img" />
        </div>
        <h1 className="home-wordmark">Guess The Player</h1>
      </div>

      <div className="home-controls">
        <div className="control-group">
          <div className="control-label">Pool</div>
          <div className="toggle-group">
            {[
              { id: 'quick',    label: 'Quick Play', sub: `${poolCounts.quick ?? 10} players` },
              { id: 'allstars', label: 'All-Stars',  sub: `${poolCounts.allstars ?? 0} players` },
              { id: 'all',      label: 'All Players', sub: `${poolCounts.all ?? 0} players` },
            ].map(({ id, label, sub }) => (
              <button
                key={id}
                className={`toggle-btn${gameMode === id ? ' active' : ''}`}
                onClick={() => setGameMode(id)}
              >
                <span className="toggle-btn-label">{label}</span>
                <span className="toggle-btn-sub">{sub}</span>
              </button>
            ))}
          </div>
        </div>


        <div className="control-group">
          <div className="control-label">Mode</div>
          <div className="difficulty-cards">
            {[
              { id: 'easy',       label: 'Normal',     filter: 'none' },
              { id: 'medium',     label: 'Blur',       filter: 'blur(10px)' },
              { id: 'hard',       label: 'Pixel',      filter: null },
              { id: 'impossible', label: 'Silhouette', filter: null },
            ].map(({ id, label, filter }) => {
              const locked = isLocked(id)
              return (
                <div key={id} className={`difficulty-card-wrap${locked ? ' locked' : ''}`}>
                  <button
                    className={`difficulty-card${difficulty === id && !locked ? ' active' : ''}${locked ? ' locked' : ''}`}
                    onClick={() => !locked && setDifficulty(id)}
                  >
                    <div className={`difficulty-card-img-wrap${id === 'hard' || id === 'impossible' ? ` ${id}` : ''}`}>
                      {id === 'hard'
                        ? <PixelPreview src="/players/aja-wilson.jpg" />
                        : <img src="/players/aja-wilson.jpg" alt="" style={filter ? { filter } : undefined} draggable={false} />
                      }
                    </div>
                    {locked && (
                      <div className="lock-overlay">
                        <LockIcon />
                      </div>
                    )}
                    <span className="difficulty-card-label">{label}</span>
                  </button>
                  {locked && (
                    <div className="lock-tooltip">
                      {unlockRequirement(gameMode)} on {PREV_LABEL[id]} to unlock
                    </div>
                  )}
                </div>
              )
            })}
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
