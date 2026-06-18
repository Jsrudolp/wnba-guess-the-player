import { useState, useEffect, useRef } from 'react'

export default function GameScreen({ question, questionIndex, total, difficulty, onNext }) {
  const { player, choices } = question
  const [answered, setAnswered] = useState(null)
  const [revealing, setRevealing] = useState(false)
  const [imgError, setImgError] = useState(false)
  const timerRef = useRef(null)
  const frameRef = useRef(null)

  useEffect(() => {
    setAnswered(null)
    setRevealing(false)
    setImgError(false)
    return () => clearTimeout(timerRef.current)
  }, [questionIndex])

  function exitAndAdvance(isCorrect) {
    const el = frameRef.current
    if (el) {
      el.style.transition = 'opacity 0.14s ease, transform 0.14s ease'
      el.style.opacity = '0'
      el.style.transform = 'translateY(-10px)'
    }
    setTimeout(() => onNext(isCorrect), 150)
  }

  function handleChoice(chosenPlayer) {
    if (answered) return
    const isCorrect = chosenPlayer.id === player.id
    setAnswered({ chosenId: chosenPlayer.id, isCorrect })

    if (navigator.vibrate) {
      navigator.vibrate(isCorrect ? [40] : [30, 60, 30])
    }

    if (difficulty === 'medium') {
      setRevealing(true)
      timerRef.current = setTimeout(() => exitAndAdvance(isCorrect), 700)
    } else if (difficulty === 'hard') {
      setRevealing(true)
      timerRef.current = setTimeout(() => exitAndAdvance(isCorrect), 900)
    } else {
      timerRef.current = setTimeout(() => exitAndAdvance(isCorrect), 800)
    }
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
        <span className={`difficulty-badge ${difficulty}`}>{difficulty}</span>
        <span className="game-counter">
          <strong>{questionIndex + 1}</strong> / {total}
        </span>
      </div>

      {/* key remounts this div each question → re-triggers CSS entry animation */}
      <div key={questionIndex} ref={frameRef} className="question-frame">
        <div
          className={`player-image-wrap${revealing ? ' revealing' : ''}`}
          data-difficulty={difficulty}
        >
          {!imgError ? (
            <img
              key={`${questionIndex}-${difficulty}`}
              className={`player-img${revealing ? ' revealing' : ''}`}
              src={player.image}
              alt=""
              data-difficulty={difficulty}
              onError={() => setImgError(true)}
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
      </div>
    </div>
  )
}
