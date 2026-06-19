import { useState, useEffect } from 'react'

const VERDICTS = [
  { min: 0,  max: 3,  text: 'Keep watching' },
  { min: 4,  max: 6,  text: 'Not bad'        },
  { min: 7,  max: 9,  text: 'Real fan'        },
  { min: 10, max: 10, text: 'Superfan'        },
]

function getVerdict(score, total) {
  if (score === total) return VERDICTS[3].text
  const pct = score / total
  if (pct >= 0.7) return VERDICTS[2].text
  if (pct >= 0.4) return VERDICTS[1].text
  return VERDICTS[0].text
}

function ScoreBlock({ isCorrect, index }) {
  return (
    <div
      className={`score-block ${isCorrect ? 'correct' : 'wrong'}`}
      style={{ animationDelay: `${0.35 + index * 0.04}s` }}
    />
  )
}

function getDisplayBlocks(results) {
  if (results.length <= 10) return results.map(r => ({ isCorrect: r.isCorrect }))
  return Array.from({ length: 10 }, (_, i) => {
    const start = Math.floor(i * results.length / 10)
    const end = Math.floor((i + 1) * results.length / 10)
    const chunk = results.slice(start, end)
    const correct = chunk.filter(r => r.isCorrect).length
    return { isCorrect: correct > chunk.length / 2 }
  })
}

export default function ResultScreen({ score, total, results = [], onPlayAgain, onChangeSettings }) {
  const [displayed, setDisplayed] = useState(0)
  const [email, setEmail] = useState('')
  const [subState, setSubState] = useState('idle')

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

  async function handleSubscribe(e) {
    e.preventDefault()
    if (!email || subState !== 'idle') return
    setSubState('loading')
    try {
      await fetch(import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, site: 'wnba-guessr' }),
      })
    } catch {}
    setSubState('done')
  }

  return (
    <div className="result">

      <div className="result-score-panel">
        <div className="result-score-inner">
          <p className="result-eyebrow">Final Score</p>
          <div className="result-score-wrap">
            <span className="result-score-num">{displayed}</span>
            <div className="result-score-denom">
              <span className="result-score-slash">/</span>
              <span className="result-score-total">{total}</span>
            </div>
          </div>
          <p className="result-verdict">{verdict}</p>
        </div>
      </div>

      {results.length > 0 && (
        <div className="result-breakdown">
          {getDisplayBlocks(results).map((block, i) => (
            <ScoreBlock key={i} isCorrect={block.isCorrect} index={i} />
          ))}
        </div>
      )}

      <div className="result-side-panel">
        <div className="result-subscribe">
          <p className="subscribe-eyebrow">Every Thursday</p>
          <p className="subscribe-heading">A new WNBA experience</p>
          <p className="subscribe-sub">Data visualizations, minigames, 3D interactive trophy shelves — a new drop every week. Don't miss it.</p>
          {subState === 'done' ? (
            <p className="subscribe-success">You're in — we'll be in touch.</p>
          ) : (
            <form className="subscribe-form" onSubmit={handleSubscribe}>
              <input
                type="email"
                className="subscribe-input"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <button type="submit" className="subscribe-btn" disabled={subState === 'loading'}>
                {subState === 'loading' ? '…' : 'Notify Me'}
              </button>
            </form>
          )}
        </div>

        <div className="result-actions">
          <button className="btn-primary" onClick={onPlayAgain}>Play Again</button>
          <button className="btn-secondary" onClick={onChangeSettings}>Change Settings</button>
        </div>
      </div>

    </div>
  )
}
