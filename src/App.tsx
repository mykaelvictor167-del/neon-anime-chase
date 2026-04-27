import { useState, useCallback } from 'react'
import styles from './App.module.css'
import { GameHeader } from './components/GameHeader/GameHeader'
import { GameCanvas } from './components/GameCanvas/GameCanvas'
import { GameOverlay } from './components/GameOverlay/GameOverlay'

/**
 * Componente principal da aplicação que gerencia o estado global do jogo.
 */
export function App() {
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [gameStatus, setGameStatus] = useState<'start' | 'playing' | 'gameover'>('start')

  const startGame = useCallback(() => {
    setScore(0)
    setLives(3)
    setGameStatus('playing')
  }, [])

  const handleGameOver = useCallback((finalScore: number) => {
    setGameStatus('gameover')
    console.log('Game Over! Final Score:', finalScore)
  }, [])

  return (
    <div className={styles.appContainer}>
      <GameHeader score={score} lives={lives} />

      <main className={styles.gameArea}>
        <GameCanvas 
          onScoreUpdate={setScore} 
          onLivesUpdate={setLives}
          onGameOver={handleGameOver}
          isPaused={gameStatus !== 'playing'}
        />

        {gameStatus === 'start' && (
          <GameOverlay type="start" onAction={startGame} />
        )}

        {gameStatus === 'gameover' && (
          <GameOverlay type="gameover" finalScore={score} onAction={startGame} />
        )}
      </main>

      <footer className={styles.footer}>
        <p>Inspirado em Pac-Man • Estética Anime Cyberpunk • Desenvolvido com React</p>
      </footer>
    </div>
  )
}
