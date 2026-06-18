import { useState, useEffect } from 'react'

const VERDICTS = [
  { min: 0,  max: 3,  text: 'Keep watching' },
  { min: 4,  max: 6,  text: 'Not bad'        },
  { min: 7,  max: 9,  text: 'Real fan'        },
  { min: 10, max: 10, text: "You're a superfan" },
]

function getVerdict(score, total) {
  if (score === total) return VERDICTS[3].text
  const pct = score / total
  if (pct >= 0.7) return VERDICTS[2].text
  if (pct >= 0.4) return VERDICTS[1].text
  return VERDICTS[0].text
}

function BreakdownItem({ result, index }) {
  const [imgErr, setImgErr] = useState(false)
  const delay = `${0.6 + index * 0.05}s`

  return (
    <div
      className={`breakdown-item ${result.isCorrect ? 'correct' : 'wrong'}`}
      style={{ animationDelay: delay }}
    >
      <div className="breakdown-thumb-wrap">
        {result.player.image && !imgErr ? (
          <img
            src={result.player.image}
            alt={result.player.name}
            className="breakdown-thumb"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="breakdown-thumb-empty">
            <svg width="16" height="16" viewBox="0 0 36 36" fill="none">
              <circle cx="18" cy="12" r="7" fill="currentColor"/>
              <path d="M4 32c0-7.7 6.3-14 14-14s14 6.3 14 14" fill="currentColor"/>
            </svg>
          </div>
        )}
        <div className={`breakdown-badge ${result.isCorrect ? 'correct' : 'wrong'}`}>
          {result.isCorrect ? '✓' : '✗'}
        </div>
      </div>
      <p className="breakdown-name">{result.player.name.split(' ').slice(-1)[0]}</p>
    </div>
  )
}

export default function ResultScreen({ score, total, results = [], onPlayAgain, onChangeSettings }) {
  const [displayed, setDisplayed] = useState(0)

  useEffect(() => {
    const start = performance.now()
    const duration = 900
    const tick = (now) => {
      const elapsed = Math.min(now - start, duration)
      const progress = 1 - Math.pow(1 - elapsed / duration, 3)
      setDisplayed(Math.round(progress * score))
      if (elapsed < duration) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [score])

  const verdict = getVerdict(score, total)

  return (
    <div className="result">
      <p className="result-eyebrow">Final Score</p>

      <div className="result-score-wrap">
        <span className="result-score-num">{displayed}</span>
        <div className="result-score-denom">
          <span className="result-score-slash">/</span>
          <span className="result-score-total">{total}</span>
        </div>
      </div>

      <p className="result-verdict">{verdict}</p>

      {results.length > 0 && (
        <div className="result-breakdown">
          {results.map((result, i) => (
            <BreakdownItem key={i} result={result} index={i} />
          ))}
        </div>
      )}

      <div className="result-actions">
        <button className="btn-primary" onClick={onPlayAgain}>Play Again</button>
        <button className="btn-secondary" onClick={onChangeSettings}>Change Settings</button>
      </div>
    </div>
  )
}
