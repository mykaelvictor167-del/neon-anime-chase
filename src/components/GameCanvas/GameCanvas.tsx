import { useEffect, useRef } from 'react'
import styles from './GameCanvas.module.css'

interface Props {
  onScoreUpdate: (score: number) => void;
  onLivesUpdate: (lives: number) => void;
  onGameOver: (finalScore: number) => void;
  isPaused: boolean;
}

/**
 * Componente principal do Canvas onde a lógica do jogo reside.
 * Gerencia o loop de animação e as colisões.
 */
export function GameCanvas({ onScoreUpdate, onLivesUpdate, onGameOver, isPaused }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isPausedRef = useRef(isPaused)
  
  // Atualiza o ref do pause sempre que a prop mudar
  useEffect(() => {
    isPausedRef.current = isPaused
  }, [isPaused])

  // Constantes do Jogo
  const TILE_SIZE = 24
  const ROWS = 21
  const COLS = 19
  
  const COLORS = {
    WALL: '#1a1a2e',
    WALL_BORDER: '#4d4dff',
    PELLET: '#ffffff',
    POWER_PELLET: '#ffff00',
    PLAYER: '#ff00ff',
    PLAYER_VISOR: '#00ffff',
    GHOSTS: ['#ff4d4d', '#4dff4d', '#4d4dff', '#ffb347'],
    SCARED_GHOST: '#ffffff'
  }

  const MAP_TEMPLATE = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
    [1,3,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,3,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,0,1],
    [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
    [1,1,1,1,0,1,1,1,2,1,2,1,1,1,0,1,1,1,1],
    [2,2,2,1,0,1,2,2,2,2,2,2,2,1,0,1,2,2,2],
    [1,1,1,1,0,1,2,1,1,2,1,1,2,1,0,1,1,1,1],
    [2,2,2,2,0,2,2,1,2,2,2,1,2,2,0,2,2,2,2],
    [1,1,1,1,0,1,2,1,1,1,1,1,2,1,0,1,1,1,1],
    [2,2,2,1,0,1,2,2,2,2,2,2,2,1,0,1,2,2,2],
    [1,1,1,1,0,1,2,1,1,1,1,1,2,1,0,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
    [1,3,0,1,0,0,0,0,0,2,0,0,0,0,0,1,0,3,1],
    [1,1,0,1,0,1,0,1,1,1,1,1,0,1,0,1,0,1,1],
    [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
    [1,0,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
  ]

  const gameState = useRef({
    score: 0,
    lives: 3,
    map: MAP_TEMPLATE.map(row => [...row]),
    nextDir: { x: 0, y: 0 },
    lastUpdateScore: -1,
    lastUpdateLives: -1
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = COLS * TILE_SIZE
    canvas.height = ROWS * TILE_SIZE

    const player = {
      x: 9 * TILE_SIZE,
      y: 15 * TILE_SIZE,
      dir: { x: 0, y: 0 },
      radius: TILE_SIZE / 2 - 2,
      speed: 2
    }

    const ghosts = [
      { x: 9 * TILE_SIZE, y: 7 * TILE_SIZE, color: COLORS.GHOSTS[0], dir: {x:0, y:0} },
      { x: 9 * TILE_SIZE, y: 9 * TILE_SIZE, color: COLORS.GHOSTS[1], dir: {x:0, y:0} },
      { x: 8 * TILE_SIZE, y: 9 * TILE_SIZE, color: COLORS.GHOSTS[2], dir: {x:0, y:0} },
      { x: 10 * TILE_SIZE, y: 9 * TILE_SIZE, color: COLORS.GHOSTS[3], dir: {x:0, y:0} }
    ]

    const handleKeyDown = (e: KeyboardEvent) => {
      switch(e.key.toLowerCase()) {
        case 'arrowup': case 'w': gameState.current.nextDir = { x: 0, y: -1 }; break;
        case 'arrowdown': case 's': gameState.current.nextDir = { x: 0, y: 1 }; break;
        case 'arrowleft': case 'a': gameState.current.nextDir = { x: -1, y: 0 }; break;
        case 'arrowright': case 'd': gameState.current.nextDir = { x: 1, y: 0 }; break;
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    let animationId: number

    const canMove = (x: number, y: number, dx: number, dy: number) => {
      if (dx === 0 && dy === 0) return true
      const nextX = Math.floor((x + dx * 2 + TILE_SIZE / 2 + dx * (TILE_SIZE / 2)) / TILE_SIZE)
      const nextY = Math.floor((y + dy * 2 + TILE_SIZE / 2 + dy * (TILE_SIZE / 2)) / TILE_SIZE)
      if (nextY < 0 || nextY >= ROWS || nextX < 0 || nextX >= COLS) return false
      return gameState.current.map[nextY][nextX] !== 1
    }

    const gameLoop = () => {
      if (!isPausedRef.current) {
        // LÓGICA DE ATUALIZAÇÃO
        
        // 1. Jogador
        if (player.x % TILE_SIZE === 0 && player.y % TILE_SIZE === 0) {
          if (canMove(player.x, player.y, gameState.current.nextDir.x, gameState.current.nextDir.y)) {
            player.dir = { ...gameState.current.nextDir }
          } else if (!canMove(player.x, player.y, player.dir.x, player.dir.y)) {
            player.dir = { x: 0, y: 0 }
          }
        }
        player.x += player.dir.x * player.speed
        player.y += player.dir.y * player.speed

        // 2. Colisão com itens
        const pMapX = Math.floor((player.x + TILE_SIZE / 2) / TILE_SIZE)
        const pMapY = Math.floor((player.y + TILE_SIZE / 2) / TILE_SIZE)
        if (gameState.current.map[pMapY][pMapX] === 0) {
          gameState.current.map[pMapY][pMapX] = 2
          gameState.current.score += 10
        } else if (gameState.current.map[pMapY][pMapX] === 3) {
          gameState.current.map[pMapY][pMapX] = 2
          gameState.current.score += 50
        }

        // 3. Fantasmas
        ghosts.forEach(ghost => {
          if (ghost.x % TILE_SIZE === 0 && ghost.y % TILE_SIZE === 0) {
            const dirs = [{x:1, y:0}, {x:-1, y:0}, {x:0, y:1}, {x:0, y:-1}]
            const possible = dirs.filter(d => canMove(ghost.x, ghost.y, d.x, d.y))
            if (possible.length > 0) {
              ghost.dir = possible[Math.floor(Math.random() * possible.length)]
            }
          }
          ghost.x += ghost.dir.x * 2
          ghost.y += ghost.dir.y * 2

          // Colisão Player-Ghost
          const dist = Math.hypot(player.x - ghost.x, player.y - ghost.y)
          if (dist < TILE_SIZE * 0.8) {
            gameState.current.lives--
            player.x = 9 * TILE_SIZE; player.y = 15 * TILE_SIZE
            player.dir = {x:0, y:0}
          }
        })

        // 4. Sincronizar UI (apenas se mudou)
        if (gameState.current.score !== gameState.current.lastUpdateScore) {
          onScoreUpdate(gameState.current.score)
          gameState.current.lastUpdateScore = gameState.current.score
        }
        if (gameState.current.lives !== gameState.current.lastUpdateLives) {
          onLivesUpdate(gameState.current.lives)
          gameState.current.lastUpdateLives = gameState.current.lives
          if (gameState.current.lives <= 0) {
            onGameOver(gameState.current.score)
          }
        }

        // DESENHO
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        
        // Labirinto
        gameState.current.map.forEach((row, y) => {
          row.forEach((val, x) => {
            if (val === 1) {
              ctx.fillStyle = COLORS.WALL
              ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE)
              ctx.strokeStyle = COLORS.WALL_BORDER
              ctx.strokeRect(x * TILE_SIZE + 2, y * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4)
            } else if (val === 0) {
              ctx.fillStyle = COLORS.PELLET
              ctx.beginPath(); ctx.arc(x * TILE_SIZE + 12, y * TILE_SIZE + 12, 2, 0, Math.PI * 2); ctx.fill()
            } else if (val === 3) {
              ctx.fillStyle = COLORS.POWER_PELLET
              ctx.beginPath(); ctx.arc(x * TILE_SIZE + 12, y * TILE_SIZE + 12, 5, 0, Math.PI * 2); ctx.fill()
            }
          })
        })

        // Jogador
        ctx.fillStyle = COLORS.PLAYER
        ctx.beginPath(); ctx.arc(player.x + 12, player.y + 12, player.radius, 0, Math.PI * 2); ctx.fill()
        
        // Fantasmas
        ghosts.forEach(ghost => {
          ctx.fillStyle = ghost.color
          ctx.beginPath(); ctx.arc(ghost.x + 12, ghost.y + 12, player.radius, 0, Math.PI * 2); ctx.fill()
        })
      }

      animationId = requestAnimationFrame(gameLoop)
    }

    animationId = requestAnimationFrame(gameLoop)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      cancelAnimationFrame(animationId)
    }
  }, [onScoreUpdate, onLivesUpdate, onGameOver]) // Dependências estáveis agora

  return (
    <div className={styles.canvasWrapper}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  )
}
