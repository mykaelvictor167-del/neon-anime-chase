import styles from './GameHeader.module.css'

interface Props {
  score: number;
  lives: number;
}

/**
 * Componente que exibe o cabeçalho do jogo com pontuação e vidas.
 */
export function GameHeader({ score, lives }: Props) {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <span className={styles.neonText}>NEON</span>
        <span className={styles.animeText}>ANIME</span>
      </div>
      <div className={styles.statsBar}>
        <div className={styles.statItem}>
          <span className={styles.label}>SCORE</span>
          <span className={styles.value}>{score.toString().padStart(5, '0')}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.label}>LIVES</span>
          <div className={styles.livesContainer}>
            {Array.from({ length: lives }).map((_, i) => (
              <div key={i} className={styles.lifeIcon}></div>
            ))}
          </div>
        </div>
      </div>
    </header>
  )
}
