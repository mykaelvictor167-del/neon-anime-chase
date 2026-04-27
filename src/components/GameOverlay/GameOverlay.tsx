import styles from './GameOverlay.module.css'

interface Props {
  type: 'start' | 'gameover';
  finalScore?: number;
  onAction: () => void;
}

/**
 * Exibe telas de sobreposição para início ou fim de jogo.
 */
export function GameOverlay({ type, finalScore, onAction }: Props) {
  return (
    <div className={styles.overlay}>
      <div className={styles.overlayContent}>
        {type === 'start' ? (
          <>
            <h1 className={styles.title}>NEON CHASE</h1>
            <p className={styles.description}>Ajude Astro-Chan a coletar as esferas de energia!</p>
            <button className={styles.primaryBtn} onClick={onAction}>
              INICIAR MISSÃO
            </button>
            <div className={styles.controlsHint}>
              <span>Use as setas ou WASD</span>
            </div>
          </>
        ) : (
          <>
            <h2 className={`${styles.title} ${styles.dangerText}`}>MISSÃO FALHOU</h2>
            <div className={styles.finalScore}>
              <span>Pontuação Final:</span>
              <span className={styles.scoreValue}>{finalScore}</span>
            </div>
            <button className={styles.primaryBtn} onClick={onAction}>
              TENTAR NOVAMENTE
            </button>
          </>
        )}
      </div>
    </div>
  )
}
