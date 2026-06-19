import { useState, useEffect, useRef, useCallback, useMemo } from 'react'


// Canvas: 28×40px, 7 cols × 10 rows of 4×4px blocks
// Each block: luminance-mapped orange tint + 1px bevel for 3D raised look
function FaceIcon({ src }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!src) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width   // 28
    const H = canvas.height  // 40
    const COLS = 7
    const ROWS = 10
    const BW = W / COLS      // 4
    const BH = H / ROWS      // 4
    const BEVEL = 1

    const sample = document.createElement('canvas')
    sample.width = COLS
    sample.height = ROWS
    const sCtx = sample.getContext('2d')

    const img = new Image()
    img.onload = () => {
      const { naturalWidth: iW, naturalHeight: iH } = img
      const aspect = COLS / ROWS
      let sx, sy, sw, sh
      if (iW / iH > aspect) {
        sh = iH; sw = iH * aspect; sx = (iW - sw) / 2; sy = 0
      } else {
        sw = iW; sh = iW / aspect; sx = 0; sy = 0
      }
      sCtx.drawImage(img, sx, sy, sw, sh, 0, 0, COLS, ROWS)
      const px = sCtx.getImageData(0, 0, COLS, ROWS).data

      ctx.clearRect(0, 0, W, H)

      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const i = (row * COLS + col) * 4
          const r = px[i], g = px[i + 1], b = px[i + 2]
          const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255

          // Map luminance to orange palette: dark brown → orange → cream
          let cr, cg, cb
          if (lum < 0.5) {
            const t = lum * 2
            cr = Math.round(80 + (255 - 80) * t)
            cg = Math.round(28 + (92 - 28) * t)
            cb = 0
          } else {
            const t = (lum - 0.5) * 2
            cr = 255
            cg = Math.round(92 + (200 - 92) * t)
            cb = Math.round(0 + 120 * t)
          }

          const x = col * BW
          const y = row * BH

          // Block face
          ctx.fillStyle = `rgb(${cr},${cg},${cb})`
          ctx.fillRect(x, y, BW, BH)

          // Top + left highlight (light from top-left)
          const hr = Math.min(255, cr + 70)
          const hg = Math.min(255, cg + 70)
          const hb = Math.min(255, cb + 70)
          ctx.fillStyle = `rgb(${hr},${hg},${hb})`
          ctx.fillRect(x, y, BW, BEVEL)
          ctx.fillRect(x, y, BEVEL, BH)

          // Bottom + right shadow
          const sr = Math.max(0, cr - 55)
          const sg = Math.max(0, cg - 55)
          const sb = Math.max(0, cb - 55)
          ctx.fillStyle = `rgb(${sr},${sg},${sb})`
          ctx.fillRect(x, y + BH - BEVEL, BW, BEVEL)
          ctx.fillRect(x + BW - BEVEL, y, BEVEL, BH)
        }
      }
    }
    img.src = src
  }, [src])

  return <canvas ref={canvasRef} width={28} height={40} className="topbar-face-canvas" />
}

function PixelCanvas({ src, pixelSize = 10, onError }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const W = canvas.clientWidth
    const H = canvas.clientHeight
    if (!W || !H) return

    canvas.width = W
    canvas.height = H

    const ctx = canvas.getContext('2d')
    const PIXEL = pixelSize

    const img = new Image()
    img.onload = () => {
      const lowW = Math.max(1, Math.round(W / PIXEL))
      const lowH = Math.max(1, Math.round(H / PIXEL))
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
    img.onerror = onError
    img.src = src
  }, [src, pixelSize, onError])

  return (
    <canvas
      ref={canvasRef}
      className="player-img"
      data-difficulty="hard"
    />
  )
}

const TEAM_ABBR = {
  'Atlanta Dream': 'ATL',
  'Chicago Sky': 'CHI',
  'Connecticut Sun': 'CON',
  'Dallas Wings': 'DAL',
  'Golden State Valkyries': 'GSV',
  'Indiana Fever': 'IND',
  'Las Vegas Aces': 'LVA',
  'Los Angeles Sparks': 'LAS',
  'Minnesota Lynx': 'MIN',
  'New York Liberty': 'NYL',
  'Phoenix Mercury': 'PHX',
  'Portland Fire': 'PDX',
  'Seattle Storm': 'SEA',
  'Toronto Tempo': 'TOR',
  'Washington Mystics': 'WAS',
}

const PAGE_SIZE = 4

function ExpertInput({ allPlayers, player, answered, onAnswer }) {
  const [query, setQuery] = useState('')
  const [teamFilter, setTeamFilter] = useState(null)
  const [page, setPage] = useState(0)

  const teams = useMemo(() => [...new Set(allPlayers.map(p => p.team))].sort(), [allPlayers])

  const filtered = useMemo(() => {
    let result = allPlayers
    if (teamFilter) result = result.filter(p => p.team === teamFilter)
    const q = query.trim().toLowerCase()
    if (q) result = result.filter(p => p.name.toLowerCase().includes(q))
    return result
  }, [allPlayers, teamFilter, query])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const pageItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  useEffect(() => { setPage(0) }, [query, teamFilter])

  function handleSelect(chosen) {
    setQuery(chosen.name)
    onAnswer(chosen)
  }

  const hasResults = filtered.length > 0
  const showPrompt = !teamFilter && !query.trim()
  const verdictClass = answered ? (answered.isCorrect ? 'correct' : 'wrong') : ''

  return (
    <div className="expert-panel">
      <div className="expert-search-row">
        <div className={`expert-input-wrap${verdictClass ? ` ${verdictClass}` : ''}`}>
          <input
            type="text"
            className="expert-input"
            placeholder="Search by name…"
            value={query}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="words"
            onChange={e => { if (!answered) setQuery(e.target.value) }}
            readOnly={!!answered}
          />
          {answered && (
            <span className="expert-input-verdict">
              {answered.isCorrect ? '✓' : '✗'}
            </span>
          )}
        </div>
      </div>

      <div className="expert-teams-row">
        <button
          className={`team-chip${!teamFilter ? ' active' : ''}`}
          onMouseDown={() => setTeamFilter(null)}
        >
          All
        </button>
        {teams.map(t => (
          <button
            key={t}
            className={`team-chip${teamFilter === t ? ' active' : ''}`}
            onMouseDown={() => setTeamFilter(prev => prev === t ? null : t)}
          >
            {TEAM_ABBR[t] ?? t.slice(0, 3).toUpperCase()}
          </button>
        ))}
      </div>

      <div className="expert-results">
        <ul className="expert-result-list">
          {showPrompt || !hasResults ? (
            <li className="expert-empty">
              {showPrompt ? 'Pick a team or type a name' : 'No players found'}
            </li>
          ) : pageItems.map(p => (
            <li
              key={p.id}
              className="expert-result-item"
              onMouseDown={() => !answered && handleSelect(p)}
              style={answered ? { cursor: 'default' } : undefined}
            >
              <span className="expert-result-name">{p.name}</span>
              <span className="expert-result-team">{TEAM_ABBR[p.team] ?? p.team}</span>
            </li>
          ))}
        </ul>
        <div className="expert-pagination">
          <button
            className="expert-page-btn"
            onMouseDown={() => setPage(p => Math.max(0, p - 1))}
            style={{ visibility: page > 0 ? 'visible' : 'hidden' }}
          >‹</button>
          <span className="expert-page-label">
            {totalPages > 1 ? `${page + 1} / ${totalPages}` : ''}
          </span>
          <button
            className="expert-page-btn"
            onMouseDown={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            style={{ visibility: page < totalPages - 1 ? 'visible' : 'hidden' }}
          >›</button>
        </div>
      </div>
    </div>
  )
}

export default function GameScreen({ question, questionIndex, total, difficulty, answerMode = 'casual', setAnswerMode, allPlayers = [], pixelSize = 10, onNext }) {
  const { player, choices } = question
  const [answered, setAnswered] = useState(null)
  const [revealing, setRevealing] = useState(false)
  const [imgError, setImgError] = useState(false)
  const timerRef = useRef(null)
  const frameRef = useRef(null)
  const onErrorCb = useCallback(() => setImgError(true), [])

  useEffect(() => {
    setAnswered(null)
    setRevealing(false)
    setImgError(false)
    return () => clearTimeout(timerRef.current)
  }, [questionIndex, pixelSize])

  function exitAndAdvance(isCorrect) {
    const el = frameRef.current
    if (el) {
      el.style.transition = 'opacity 0.14s ease, transform 0.14s ease'
      el.style.opacity = '0'
      el.style.transform = 'translateY(-10px)'
    }
    setTimeout(() => onNext(isCorrect), 150)
  }

  function commit(chosenPlayer) {
    if (answered) return
    const isCorrect = chosenPlayer.id === player.id
    setAnswered({ chosenId: chosenPlayer.id, isCorrect })
    if (navigator.vibrate) navigator.vibrate(isCorrect ? [40] : [30, 60, 30])
    setRevealing(true)
    timerRef.current = setTimeout(() => exitAndAdvance(isCorrect), 750)
  }

  function handleChoice(chosenPlayer) {
    if (answered) return
    const isCorrect = chosenPlayer.id === player.id
    setAnswered({ chosenId: chosenPlayer.id, isCorrect })

    if (navigator.vibrate) {
      navigator.vibrate(isCorrect ? [40] : [30, 60, 30])
    }

    setRevealing(true)
    timerRef.current = setTimeout(() => exitAndAdvance(isCorrect), 750)
  }

  function getButtonClass(choice) {
    if (!answered) return 'answer-btn'
    if (choice.id === player.id) {
      return answered.chosenId === player.id ? 'answer-btn correct' : 'answer-btn reveal-correct'
    }
    if (choice.id === answered.chosenId) return 'answer-btn wrong'
    return 'answer-btn'
  }

  return (
    <div className="game">
      <div className="game-topbar">
        <div className="topbar-left">
          <img src="/wnba-guessr-logo.svg" alt="" className="topbar-logo" />
          <span className="game-counter">
            <strong>{questionIndex + 1}</strong> / {total}
          </span>
        </div>
        <div className="topbar-answer-mode">
          {['casual', 'expert'].map(mode => (
            <button
              key={mode}
              className={`topbar-mode-btn${answerMode === mode ? ' active' : ''}`}
              onClick={() => setAnswerMode?.(mode)}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="question-frame">
        <div
          key={questionIndex}
          ref={frameRef}
          className={`player-image-wrap${revealing ? ' revealing' : ''}`}
          data-difficulty={difficulty}
        >
          {difficulty === 'hard' && !imgError ? (
            revealing ? (
              <img
                key={`${questionIndex}-hard-reveal`}
                className="player-img revealing"
                src={player.image}
                alt=""
                data-difficulty="hard"
                onError={onErrorCb}
                draggable={false}
              />
            ) : (
              <PixelCanvas
                key={`${questionIndex}-hard-${pixelSize}`}
                src={player.image}
                pixelSize={pixelSize}
                onError={onErrorCb}
              />
            )
          ) : !imgError ? (
            <img
              key={`${questionIndex}-${difficulty}`}
              className={`player-img${revealing ? ' revealing' : ''}`}
              src={player.image}
              alt=""
              data-difficulty={difficulty}
              onError={onErrorCb}
              draggable={false}
            />
          ) : (
            <div className="player-placeholder">
              <div className="player-placeholder-icon">
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                  <circle cx="18" cy="12" r="7" fill="white"/>
                  <path d="M4 32c0-7.7 6.3-14 14-14s14 6.3 14 14" fill="white"/>
                </svg>
              </div>
            </div>
          )}
        </div>

        <div className="answer-area">
          {answerMode === 'expert' ? (
            <ExpertInput
              key={questionIndex}
              allPlayers={allPlayers}
              player={player}
              answered={answered}
              onAnswer={commit}
            />
          ) : (
            <div className="game-answers">
              {choices.map((choice) => (
                <button
                  key={choice.id}
                  className={getButtonClass(choice)}
                  onClick={() => handleChoice(choice)}
                  disabled={!!answered}
                >
                  {choice.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
