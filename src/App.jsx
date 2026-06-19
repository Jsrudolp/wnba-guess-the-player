import { useState, useCallback, useEffect } from 'react'
import HomeScreen from './components/HomeScreen.jsx'
import GameScreen from './components/GameScreen.jsx'
import ResultScreen from './components/ResultScreen.jsx'
import AdminScreen from './components/AdminScreen.jsx'
import playersData from './data/players.json'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildGame(gameMode, allPlayers) {
  const pool =
    gameMode === 'allstars'
      ? allPlayers.filter(p => p.allStar)
      : allPlayers

  const shuffledPool = shuffle(pool)
  const gamePlayers = gameMode === 'quick'
    ? shuffledPool.slice(0, Math.min(10, shuffledPool.length))
    : shuffledPool

  const allStars = allPlayers.filter(p => p.allStar)

  const questions = gamePlayers.map((player) => {
    let wrongs
    if (gameMode === 'allstars') {
      wrongs = shuffle(allStars.filter(p => p.id !== player.id)).slice(0, 3)
    } else {
      wrongs = shuffle(allPlayers.filter(p => p.id !== player.id)).slice(0, 3)
    }
    const choices = shuffle([player, ...wrongs])
    return { player, choices }
  })

  return questions
}


function GameApp({ isDark, toggleTheme }) {
  const allPlayers = playersData

  const [screen, setScreen] = useState('home')
  const [gameMode, setGameMode] = useState('quick')
  const [difficulty, setDifficulty] = useState('easy')
  const [answerMode, setAnswerMode] = useState('casual')
  const [completions, setCompletions] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('wnba-completions')) ?? {}
    } catch { return {} }
  })
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [results, setResults] = useState([])
  const pixelSize = 24

  useEffect(() => {
    document.documentElement.style.setProperty('--medium-blur', '18px')
  }, [])

  const startGame = useCallback(() => {
    if (allPlayers.length < 4) return
    const qs = buildGame(gameMode, allPlayers)
    setQuestions(qs)
    setCurrentIndex(0)
    setScore(0)
    setResults([])
    setScreen('game')
  }, [gameMode, allPlayers])

  const handleNext = useCallback((isCorrect) => {
    const newScore = score + (isCorrect ? 1 : 0)
    setScore(newScore)
    setResults(prev => [...prev, { player: questions[currentIndex].player, isCorrect }])
    if (currentIndex >= questions.length - 1) {
      const total = questions.length
      const required = gameMode === 'quick' ? total : Math.ceil(total * 0.8)
      if (newScore >= required) {
        setCompletions(prev => {
          const key = `${gameMode}:${difficulty}`
          if (prev[key]) return prev
          const updated = { ...prev, [key]: true }
          localStorage.setItem('wnba-completions', JSON.stringify(updated))
          return updated
        })
      }
      setScreen('result')
    } else {
      setCurrentIndex(i => i + 1)
    }
  }, [score, currentIndex, questions])

  const playAgain = useCallback(() => {
    const qs = buildGame(gameMode, allPlayers)
    setQuestions(qs)
    setCurrentIndex(0)
    setScore(0)
    setResults([])
    setScreen('game')
  }, [gameMode, allPlayers])

  const changeSettings = useCallback(() => {
    setScreen('home')
  }, [])

  return (
    <div className="app">
      {screen === 'home' && (
        <HomeScreen
          gameMode={gameMode}
          setGameMode={setGameMode}
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          poolCounts={{
            quick: 10,
            allstars: allPlayers.filter(p => p.allStar).length,
            all: allPlayers.length,
          }}
          completions={completions}
          onPlay={startGame}
          hasPlayers={allPlayers.length >= 4}
          isDark={isDark}
          toggleTheme={toggleTheme}
        />
      )}
      {screen === 'game' && questions.length > 0 && (
        <GameScreen
          question={questions[currentIndex]}
          nextImage={questions[currentIndex + 1]?.player?.image}
          questionIndex={currentIndex}
          total={questions.length}
          difficulty={difficulty}
          answerMode={answerMode}
          setAnswerMode={setAnswerMode}
          allPlayers={allPlayers}
          pixelSize={pixelSize}
          onNext={handleNext}
          onBack={changeSettings}
        />
      )}
      {screen === 'result' && (
        <ResultScreen
          score={score}
          total={questions.length}
          results={results}
          onPlayAgain={playAgain}
          onChangeSettings={changeSettings}
        />
      )}

    </div>
  )
}

export default function App() {
  const [hash, setHash] = useState(() => window.location.hash)
  const [isDark, setIsDark] = useState(() => {
    const h = window.location.hash
    if (h === '#dark' || h === '#admin') return true
    return localStorage.getItem('theme') === 'dark'
  })

  useEffect(() => {
    const onHash = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    const theme = hash === '#admin' ? 'dark' : (isDark ? 'dark' : 'light')
    document.documentElement.setAttribute('data-theme', theme)
    document.querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#0A0A0B' : '#F8F6F3')
  }, [isDark, hash])

  const toggleTheme = useCallback(() => {
    setIsDark(prev => {
      const next = !prev
      localStorage.setItem('theme', next ? 'dark' : 'light')
      window.history.replaceState(null, '', next ? '#dark' : window.location.pathname)
      return next
    })
  }, [])

  if (hash === '#admin') return <AdminScreen />
  return <GameApp isDark={isDark} toggleTheme={toggleTheme} />
}
