const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const livesContainer = document.getElementById('lives');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreElement = document.getElementById('finalScore');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');

// Configurações do Jogo
const TILE_SIZE = 24;
const ROWS = 21;
const COLS = 19;
canvas.width = COLS * TILE_SIZE;
canvas.height = ROWS * TILE_SIZE;

// Cores
const COLORS = {
    WALL: '#1a1a2e',
    WALL_BORDER: '#4d4dff',
    PELLET: '#ffffff',
    POWER_PELLET: '#ffff00',
    PLAYER: '#ff00ff',
    PLAYER_VISOR: '#00ffff',
    GHOSTS: ['#ff4d4d', '#4dff4d', '#4d4dff', '#ffb347'],
    SCARED_GHOST: '#ffffff'
};

// Mapa do Labirinto (0: Pelota, 1: Parede, 2: Vazio, 3: Power Pellet)
const MAP = [
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
];

let score = 0;
let lives = 3;
let pelletsRemaining = 0;
let powerMode = false;
let powerTimer = null;
let gameRunning = false;

class Entity {
    constructor(x, y, color) {
        this.x = x * TILE_SIZE;
        this.y = y * TILE_SIZE;
        this.baseX = x;
        this.baseY = y;
        this.color = color;
        this.radius = TILE_SIZE / 2 - 2;
        this.dir = { x: 0, y: 0 };
        this.nextDir = { x: 0, y: 0 };
        this.speed = 2;
    }

    getMapPos() {
        return {
            x: Math.floor((this.x + TILE_SIZE / 2) / TILE_SIZE),
            y: Math.floor((this.y + TILE_SIZE / 2) / TILE_SIZE)
        };
    }

    canMove(dx, dy) {
        const nextX = Math.floor((this.x + dx * this.speed + TILE_SIZE / 2 + dx * (TILE_SIZE / 2)) / TILE_SIZE);
        const nextY = Math.floor((this.y + dy * this.speed + TILE_SIZE / 2 + dy * (TILE_SIZE / 2)) / TILE_SIZE);
        
        if (nextY < 0 || nextY >= ROWS || nextX < 0 || nextX >= COLS) return false;
        return MAP[nextY][nextX] !== 1;
    }

    isAtIntersection() {
        return this.x % TILE_SIZE === 0 && this.y % TILE_SIZE === 0;
    }
}

class Player extends Entity {
    constructor(x, y) {
        super(x, y, COLORS.PLAYER);
        this.animationFrame = 0;
    }

    draw() {
        this.animationFrame += 0.1;
        const bounce = Math.sin(this.animationFrame) * 2;
        
        ctx.save();
        ctx.translate(this.x + TILE_SIZE/2, this.y + TILE_SIZE/2);
        
        // Glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;

        // Corpo (Chibi Head)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, bounce, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Orelhinhas de gato/robô
        ctx.beginPath();
        ctx.moveTo(-this.radius, bounce - 5);
        ctx.lineTo(-this.radius - 4, bounce - 12);
        ctx.lineTo(-this.radius + 8, bounce - 5);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(this.radius, bounce - 5);
        ctx.lineTo(this.radius + 4, bounce - 12);
        ctx.lineTo(this.radius - 8, bounce - 5);
        ctx.fill();

        // Visor Neon
        ctx.shadowColor = COLORS.PLAYER_VISOR;
        ctx.fillStyle = COLORS.PLAYER_VISOR;
        ctx.fillRect(-8, bounce - 2, 16, 4);
        
        // Brilho no visor
        ctx.fillStyle = '#fff';
        ctx.fillRect(2, bounce - 1, 4, 1);

        ctx.restore();
    }

    update() {
        if (this.isAtIntersection()) {
            if (this.canMove(this.nextDir.x, this.nextDir.y)) {
                this.dir = { ...this.nextDir };
            } else if (!this.canMove(this.dir.x, this.dir.y)) {
                this.dir = { x: 0, y: 0 };
            }
        }

        this.x += this.dir.x * this.speed;
        this.y += this.dir.y * this.speed;

        // Teletransporte nas bordas (opcional para esse mapa)
        if (this.x < 0) this.x = (COLS - 1) * TILE_SIZE;
        if (this.x >= COLS * TILE_SIZE) this.x = 0;

        // Coletar itens
        const pos = this.getMapPos();
        if (MAP[pos.y][pos.x] === 0) {
            MAP[pos.y][pos.x] = 2;
            score += 10;
            pelletsRemaining--;
            updateUI();
        } else if (MAP[pos.y][pos.x] === 3) {
            MAP[pos.y][pos.x] = 2;
            score += 50;
            activatePowerMode();
            updateUI();
        }
    }
}

class Ghost extends Entity {
    constructor(x, y, color) {
        super(x, y, color);
        this.scared = false;
        this.speed = 1.5;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x + TILE_SIZE/2, this.y + TILE_SIZE/2);
        
        const floatY = Math.sin(Date.now() / 200) * 3;
        
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.scared ? COLORS.SCARED_GHOST : this.color;
        ctx.fillStyle = this.scared ? COLORS.SCARED_GHOST : this.color;

        // Corpo do Yokai (Chama/Espírito)
        ctx.beginPath();
        ctx.arc(0, floatY, this.radius, Math.PI, 0);
        ctx.lineTo(this.radius, floatY + this.radius);
        // Base ondulada
        for (let i = 0; i < 3; i++) {
            ctx.quadraticCurveTo(
                this.radius - (i * 2 + 1) * (this.radius / 3 * 2), 
                floatY + this.radius + (i % 2 === 0 ? 5 : -5),
                this.radius - (i + 1) * (this.radius / 3 * 2), 
                floatY + this.radius
            );
        }
        ctx.lineTo(-this.radius, floatY);
        ctx.fill();

        // Olhos
        ctx.fillStyle = this.scared ? '#000' : '#fff';
        ctx.beginPath();
        ctx.arc(-4, floatY - 2, 3, 0, Math.PI * 2);
        ctx.arc(4, floatY - 2, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    update() {
        if (this.isAtIntersection()) {
            const directions = [
                { x: 0, y: -1 }, { x: 0, y: 1 },
                { x: -1, y: 0 }, { x: 1, y: 0 }
            ];
            
            // Filtra direções possíveis (não pode voltar e não pode bater na parede)
            const possibleDirs = directions.filter(d => {
                if (this.dir.x === -d.x && this.dir.y === -d.y) return false;
                return this.canMove(d.x, d.y);
            });

            if (possibleDirs.length > 0) {
                // Inteligência básica: persegue o jogador ou foge
                let chosenDir;
                if (this.scared) {
                    // Foge (escolhe a direção que mais afasta do player)
                    chosenDir = possibleDirs.sort((a, b) => {
                        const distA = Math.hypot((this.x + a.x * TILE_SIZE) - player.x, (this.y + a.y * TILE_SIZE) - player.y);
                        const distB = Math.hypot((this.x + b.x * TILE_SIZE) - player.x, (this.y + b.y * TILE_SIZE) - player.y);
                        return distB - distA;
                    })[0];
                } else {
                    // Persegue (escolhe a direção que mais aproxima do player)
                    chosenDir = possibleDirs.sort((a, b) => {
                        const distA = Math.hypot((this.x + a.x * TILE_SIZE) - player.x, (this.y + a.y * TILE_SIZE) - player.y);
                        const distB = Math.hypot((this.x + b.x * TILE_SIZE) - player.x, (this.y + b.y * TILE_SIZE) - player.y);
                        return distA - distB;
                    })[0];
                }
                this.dir = chosenDir;
            } else {
                // Se não tem pra onde ir a não ser voltar
                this.dir = { x: -this.dir.x, y: -this.dir.y };
            }
        }

        this.x += this.dir.x * this.speed;
        this.y += this.dir.y * this.speed;
    }
}

let player;
let ghosts = [];

function init() {
    score = 0;
    lives = 3;
    pelletsRemaining = 0;
    
    // Contar pelotas e resetar mapa (seria bom copiar o mapa original se houvesse vários níveis)
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (MAP[y][x] === 0 || MAP[y][x] === 3) pelletsRemaining++;
        }
    }

    player = new Player(9, 15);
    ghosts = [
        new Ghost(9, 7, COLORS.GHOSTS[0]),
        new Ghost(9, 9, COLORS.GHOSTS[1]),
        new Ghost(8, 9, COLORS.GHOSTS[2]),
        new Ghost(10, 9, COLORS.GHOSTS[3])
    ];

    updateUI();
}

function activatePowerMode() {
    powerMode = true;
    ghosts.forEach(g => g.scared = true);
    if (powerTimer) clearTimeout(powerTimer);
    powerTimer = setTimeout(() => {
        powerMode = false;
        ghosts.forEach(g => g.scared = false);
    }, 8000);
}

function updateUI() {
    scoreElement.innerText = score.toString().padStart(5, '0');
    livesContainer.innerHTML = '';
    for (let i = 0; i < lives; i++) {
        const div = document.createElement('div');
        div.className = 'life-icon';
        livesContainer.appendChild(div);
    }
}

function drawMaze() {
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            const val = MAP[y][x];
            if (val === 1) {
                ctx.fillStyle = COLORS.WALL;
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                
                // Desenhar bordas neon
                ctx.strokeStyle = COLORS.WALL_BORDER;
                ctx.lineWidth = 1;
                ctx.strokeRect(x * TILE_SIZE + 2, y * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            } else if (val === 0) {
                ctx.fillStyle = COLORS.PELLET;
                ctx.beginPath();
                ctx.arc(x * TILE_SIZE + TILE_SIZE/2, y * TILE_SIZE + TILE_SIZE/2, 2, 0, Math.PI * 2);
                ctx.fill();
            } else if (val === 3) {
                ctx.fillStyle = COLORS.POWER_PELLET;
                ctx.shadowBlur = 10;
                ctx.shadowColor = COLORS.POWER_PELLET;
                ctx.beginPath();
                ctx.arc(x * TILE_SIZE + TILE_SIZE/2, y * TILE_SIZE + TILE_SIZE/2, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }
    }
}

function checkCollisions() {
    ghosts.forEach(ghost => {
        const dist = Math.hypot(player.x - ghost.x, player.y - ghost.y);
        if (dist < TILE_SIZE * 0.8) {
            if (ghost.scared) {
                // Ghost morre e volta pra base
                ghost.x = 9 * TILE_SIZE;
                ghost.y = 9 * TILE_SIZE;
                ghost.scared = false;
                score += 200;
            } else {
                // Jogador morre
                lives--;
                updateUI();
                if (lives <= 0) {
                    gameOver();
                } else {
                    resetPositions();
                }
            }
        }
    });
}

function resetPositions() {
    player.x = 9 * TILE_SIZE;
    player.y = 15 * TILE_SIZE;
    player.dir = { x: 0, y: 0 };
    player.nextDir = { x: 0, y: 0 };
    ghosts.forEach((g, i) => {
        g.x = (8 + i % 3) * TILE_SIZE;
        g.y = 9 * TILE_SIZE;
        g.scared = false;
    });
}

function gameOver() {
    gameRunning = false;
    finalScoreElement.innerText = score;
    gameOverScreen.classList.remove('hidden');
}

function loop() {
    if (!gameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawMaze();
    player.update();
    player.draw();
    
    ghosts.forEach(ghost => {
        ghost.update();
        ghost.draw();
    });

    checkCollisions();

    if (pelletsRemaining <= 0) {
        // Vitória! (Poderia carregar outro nível ou apenas resetar)
        alert('Parabéns! Missão Cumprida!');
        location.reload();
    }

    requestAnimationFrame(loop);
}

// Controles
window.addEventListener('keydown', (e) => {
    switch(e.key.toLowerCase()) {
        case 'arrowup': case 'w': player.nextDir = { x: 0, y: -1 }; break;
        case 'arrowdown': case 's': player.nextDir = { x: 0, y: 1 }; break;
        case 'arrowleft': case 'a': player.nextDir = { x: -1, y: 0 }; break;
        case 'arrowright': case 'd': player.nextDir = { x: 1, y: 0 }; break;
    }
});

startBtn.addEventListener('click', () => {
    startScreen.classList.add('hidden');
    init();
    gameRunning = true;
    loop();
});

restartBtn.addEventListener('click', () => {
    location.reload();
});