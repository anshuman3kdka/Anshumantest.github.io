/**
 * Modern Warfare Tower Defense
 * Main Game Logic
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Level Data
const LEVELS = [
    {
        path: [[180, 0], [180, 150], [50, 150], [50, 300], [310, 300], [310, 450], [180, 450], [180, 640]],
        startMoney: 500,
        startHealth: 20
    },
    {
        path: [[50, 0], [50, 500], [310, 500], [310, 100], [180, 100], [180, 640]],
        startMoney: 450,
        startHealth: 20
    },
    {
        path: [[180, 0], [180, 50], [50, 50], [50, 550], [310, 550], [310, 100], [120, 100], [120, 640]],
        startMoney: 400,
        startHealth: 15
    },
    {
        path: [[50, 0], [50, 100], [310, 100], [310, 200], [50, 200], [50, 300], [310, 300], [310, 400], [50, 400], [50, 500], [310, 500], [310, 640]],
        startMoney: 400,
        startHealth: 15
    },
    {
        path: [[180, 0], [50, 50], [310, 150], [50, 250], [310, 350], [50, 450], [310, 550], [180, 640]],
        startMoney: 350,
        startHealth: 10
    }
];

// Game State
const state = {
    screen: 'MENU', // MENU, MAP_SELECT, PLAYING, GAMEOVER, VICTORY
    levelIndex: 0,
    money: 500,
    health: 20,
    wave: 0,
    maxWaves: 10,
    enemies: [],
    towers: [],
    projectiles: [],
    particles: [],
    isPaused: false,
    speedMultiplier: 1,
    buildPhase: true,
    selectedTowerType: null,
    selectedTowerInstance: null,
    waveInProgress: false,
    spawnQueue: [],
    lastMousePos: {x: 0, y: 0},
    waveTextTimer: 0
};

const TOWER_TYPES = {
    MACHINE_GUN: {
        name: 'MG NEST',
        cost: 100,
        range: 120,
        damage: 10,
        fireRate: 400,
        draw: (x, y, a) => Graphics.drawMachineGun(x, y, a)
    },
    SNIPER: {
        name: 'SNIPER',
        cost: 200,
        range: 250,
        damage: 50,
        fireRate: 1500,
        draw: (x, y, a) => Graphics.drawSniper(x, y, a)
    },
    ARTILLERY: {
        name: 'ARTILLERY',
        cost: 300,
        range: 180,
        damage: 40,
        fireRate: 2000,
        isAoE: true,
        aoeRadius: 50,
        draw: (x, y, a) => Graphics.drawArtillery(x, y, a)
    },
    SAM: {
        name: 'SAM',
        cost: 250,
        range: 200,
        damage: 30,
        fireRate: 1000,
        draw: (x, y, a) => Graphics.drawSAM(x, y, a)
    },
    SLOW: {
        name: 'OIL TRAP',
        cost: 150,
        range: 80,
        damage: 0,
        fireRate: 100,
        slowEffect: 0.5,
        draw: (x, y, a) => Graphics.drawSlowTrap(x, y)
    }
};

const ENEMY_TYPES = {
    INFANTRY: {
        hp: 50,
        speed: 1,
        reward: 15,
        draw: (x, y, a) => Graphics.drawInfantry(x, y, a)
    },
    TANK: {
        hp: 200,
        speed: 0.6,
        reward: 40,
        draw: (x, y, a) => Graphics.drawTank(x, y, a)
    },
    DRONE: {
        hp: 40,
        speed: 1.8,
        reward: 20,
        draw: (x, y, a) => Graphics.drawInfantry(x, y, a, '#3498db')
    },
    BOSS: {
        hp: 1000,
        speed: 0.4,
        reward: 200,
        draw: (x, y, a) => Graphics.drawTank(x, y, a, '#c0392b')
    }
};

const GAME_WIDTH = 360;
const GAME_HEIGHT = 640;

function resize() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const windowRatio = windowWidth / windowHeight;
    const targetRatio = GAME_WIDTH / GAME_HEIGHT;

    if (windowRatio < targetRatio) {
        canvas.width = windowWidth;
        canvas.height = windowWidth / targetRatio;
    } else {
        canvas.height = windowHeight;
        canvas.width = windowHeight * targetRatio;
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(canvas.width / GAME_WIDTH, canvas.height / GAME_HEIGHT);
}
window.addEventListener('resize', resize);
resize();

const Graphics = {
    drawPixelRect(x, y, w, h, color) {
        ctx.fillStyle = color;
        ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
    },
    drawTank(x, y, angle, color = '#556b2f') {
        ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
        this.drawPixelRect(-12, -8, 24, 16, color);
        this.drawPixelRect(-14, -10, 28, 4, '#222');
        this.drawPixelRect(-14, 6, 28, 4, '#222');
        this.drawPixelRect(-6, -6, 12, 12, color);
        ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.strokeRect(-6, -6, 12, 12);
        this.drawPixelRect(4, -2, 12, 4, color);
        ctx.restore();
    },
    drawInfantry(x, y, angle, color = '#8b4513') {
        ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
        this.drawPixelRect(-4, -4, 8, 8, color);
        this.drawPixelRect(-2, -2, 4, 4, '#deb887');
        this.drawPixelRect(2, 0, 6, 2, '#333');
        ctx.restore();
    },
    drawTowerBase(x, y, color = '#777') {
        this.drawPixelRect(x - 16, y - 16, 32, 32, '#444');
        this.drawPixelRect(x - 14, y - 14, 28, 28, color);
    },
    drawMachineGun(x, y, angle) {
        this.drawTowerBase(x, y, '#666');
        ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
        this.drawPixelRect(-4, -4, 8, 8, '#333');
        this.drawPixelRect(0, -2, 14, 4, '#222');
        ctx.restore();
    },
    drawSniper(x, y, angle) {
        this.drawTowerBase(x, y, '#555');
        ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
        this.drawPixelRect(-3, -3, 6, 6, '#222');
        this.drawPixelRect(0, -1, 20, 2, '#111');
        ctx.restore();
    },
    drawArtillery(x, y, angle) {
        this.drawTowerBase(x, y, '#444');
        ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
        this.drawPixelRect(-6, -6, 12, 12, '#333');
        this.drawPixelRect(0, -3, 18, 6, '#222');
        ctx.restore();
    },
    drawSAM(x, y, angle) {
        this.drawTowerBase(x, y, '#556b2f');
        ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
        this.drawPixelRect(-7, -7, 14, 14, '#333');
        this.drawPixelRect(2, -5, 8, 2, '#eee');
        this.drawPixelRect(2, -2, 8, 2, '#eee');
        this.drawPixelRect(2, 1, 8, 2, '#eee');
        this.drawPixelRect(2, 4, 8, 2, '#eee');
        ctx.restore();
    },
    drawSlowTrap(x, y) {
        this.drawTowerBase(x, y, '#1e90ff');
        this.drawPixelRect(x - 10, y - 10, 20, 20, 'rgba(0, 191, 255, 0.5)');
    }
};

class Enemy {
    constructor(type, path) {
        this.type = type; this.path = path;
        this.x = path[0][0]; this.y = path[0][1];
        this.waypointIndex = 1; this.hp = type.hp; this.maxHp = type.hp;
        this.speed = type.speed; this.reward = type.reward;
        this.angle = 0; this.slowTimer = 0; this.isDead = false;
    }
    update(dt) {
        if (this.waypointIndex >= this.path.length) {
            state.health--; this.isDead = true; return;
        }
        const target = this.path[this.waypointIndex];
        const dx = target[0] - this.x; const dy = target[1] - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        this.angle = Math.atan2(dy, dx);

        const frameFactor = dt / (1000 / 60);
        let currentSpeed = this.speed * state.speedMultiplier * frameFactor;

        if (this.slowTimer > 0) { currentSpeed *= 0.5; this.slowTimer -= frameFactor; }
        if (dist < currentSpeed) {
            this.x = target[0]; this.y = target[1]; this.waypointIndex++;
        } else {
            this.x += Math.cos(this.angle) * currentSpeed;
            this.y += Math.sin(this.angle) * currentSpeed;
        }
    }
    draw() {
        this.type.draw(this.x, this.y, this.angle);
        const barWidth = 20;
        ctx.fillStyle = '#ff0000'; ctx.fillRect(this.x - barWidth/2, this.y - 15, barWidth, 3);
        ctx.fillStyle = '#00ff00'; ctx.fillRect(this.x - barWidth/2, this.y - 15, barWidth * (this.hp / this.maxHp), 3);
    }
}

class Tower {
    constructor(type, x, y) {
        this.type = type; this.x = x; this.y = y;
        this.angle = 0; this.lastFireTime = 0; this.target = null;
        this.level = 0;
    }
    getRange() {
        return this.type.range + this.level * 20;
    }
    update(enemies, dt) {
        const now = Date.now();
        const range = this.getRange();

        if (!this.target || this.target.isDead || this.getDist(this.target) > range) {
            this.target = null; let minDist = Infinity;
            for (let enemy of enemies) {
                const d = this.getDist(enemy);
                if (d <= range && d < minDist) { minDist = d; this.target = enemy; }
            }
        }
        if (this.target) {
            const dx = this.target.x - this.x; const dy = this.target.y - this.y;
            this.angle = Math.atan2(dy, dx);
            const fireRate = this.type.fireRate * Math.pow(0.9, this.level);
            if (now - this.lastFireTime > fireRate / state.speedMultiplier) {
                this.fire(); this.lastFireTime = now;
            }
        }
    }
    getDist(enemy) {
        return Math.sqrt((enemy.x - this.x)**2 + (enemy.y - this.y)**2);
    }
    fire() {
        let damage = this.type.damage + this.level * 5;
        if (this.type === TOWER_TYPES.SAM && this.target.type === ENEMY_TYPES.DRONE) {
            damage *= 2;
        }
        if (this.type === TOWER_TYPES.SLOW) { this.target.slowTimer = 60 + this.level * 20; return; }
        state.projectiles.push(new Projectile(this.x, this.y, this.target, damage, this.type.isAoE ? this.type.aoeRadius + this.level * 5 : 0));
    }
    draw() {
        this.type.draw(this.x, this.y, this.angle);
        if (state.selectedTowerInstance === this) {
            ctx.strokeStyle = '#fff';
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.getRange(), 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
    upgrade() {
        const cost = Math.floor(this.type.cost * 0.7);
        if (state.money >= cost) {
            state.money -= cost;
            this.level++;
        }
    }
}

class Projectile {
    constructor(x, y, target, damage, aoeRadius) {
        this.x = x; this.y = y; this.target = target; this.damage = damage;
        this.aoeRadius = aoeRadius; this.speed = 5; this.isDead = false;
    }
    update(dt) {
        const dx = this.target.x - this.x; const dy = this.target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const frameFactor = dt / (1000 / 60);
        const currentSpeed = this.speed * state.speedMultiplier * frameFactor;
        if (dist < currentSpeed) { this.hit(); }
        else { this.x += (dx / dist) * currentSpeed; this.y += (dy / dist) * currentSpeed; }
        if (this.target.isDead) this.isDead = true;
    }
    hit() {
        if (this.aoeRadius > 0) {
            for (let enemy of state.enemies) {
                if (Math.sqrt((enemy.x - this.x)**2 + (enemy.y - this.y)**2) < this.aoeRadius) { enemy.hp -= this.damage; }
            }
            state.particles.push({x: this.x, y: this.y, r: this.aoeRadius, life: 10});
        } else { this.target.hp -= this.damage; }
        this.isDead = true;
    }
    draw() {
        ctx.fillStyle = '#f1c40f'; ctx.beginPath(); ctx.arc(this.x, this.y, 3, 0, Math.PI * 2); ctx.fill();
    }
}

function update(dt) {
    if (state.screen === 'PLAYING' && !state.isPaused) {
        if (state.waveInProgress) {
            if (state.spawnQueue.length > 0) {
                const now = Date.now();
                if (!state.lastSpawnTime || now - state.lastSpawnTime > 1000 / state.speedMultiplier) {
                    const type = state.spawnQueue.shift();
                    state.enemies.push(new Enemy(type, LEVELS[state.levelIndex].path));
                    state.lastSpawnTime = now;
                }
            }
            state.enemies.forEach(e => e.update(dt));
            state.towers.forEach(t => t.update(state.enemies, dt));
            state.projectiles.forEach(p => p.update(dt));
            state.enemies = state.enemies.filter(e => {
                if (e.hp <= 0) { state.money += e.reward; return false; }
                return !e.isDead;
            });
            state.projectiles = state.projectiles.filter(p => !p.isDead);
            state.particles.forEach(p => p.life--);
            state.particles = state.particles.filter(p => p.life > 0);
            if (state.spawnQueue.length === 0 && state.enemies.length === 0) {
                state.waveInProgress = false; state.buildPhase = true;
                if (state.wave >= state.maxWaves) state.screen = 'VICTORY';
            }
            if (state.health <= 0) state.screen = 'GAMEOVER';
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    switch(state.screen) {
        case 'MENU': drawMenu(); break;
        case 'MAP_SELECT': drawMapSelect(); break;
        case 'PLAYING': drawGame(); break;
        case 'GAMEOVER': drawGameOver(); break;
        case 'VICTORY': drawVictory(); break;
    }
}

function drawMenu() {
    ctx.fillStyle = '#2d3436'; ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 32px Courier New'; ctx.textAlign = 'center';
    ctx.fillText('MODERN', GAME_WIDTH / 2, 120); ctx.fillText('WARFARE TD', GAME_WIDTH / 2, 160);
    ctx.fillStyle = '#2ecc71'; ctx.fillRect(80, 300, 200, 60);
    ctx.fillStyle = '#fff'; ctx.font = '24px Courier New'; ctx.fillText('PLAY', GAME_WIDTH / 2, 340);
}

function drawMapSelect() {
    ctx.fillStyle = '#2d3436'; ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    ctx.fillStyle = '#fff'; ctx.font = '28px Courier New'; ctx.textAlign = 'center';
    ctx.fillText('SELECT MISSION', GAME_WIDTH / 2, 80);
    for (let i = 0; i < LEVELS.length; i++) {
        ctx.fillStyle = '#34495e'; ctx.fillRect(50, 150 + i * 70, 260, 50);
        ctx.fillStyle = '#fff'; ctx.font = '20px Courier New'; ctx.fillText(`MISSION ${i + 1}`, GAME_WIDTH / 2, 182 + i * 70);
    }
}

function initLevel(index) {
    const level = LEVELS[index];
    state.levelIndex = index; state.money = level.startMoney; state.health = level.startHealth;
    state.wave = 0; state.maxWaves = 10; state.enemies = []; state.towers = [];
    state.projectiles = []; state.particles = []; state.buildPhase = true;
    state.waveInProgress = false; state.screen = 'PLAYING';
    state.selectedTowerType = null; state.selectedTowerInstance = null; state.speedMultiplier = 1;
    state.waveTextTimer = 0;
}

function startWave() {
    if (state.waveInProgress) return;
    state.wave++; state.buildPhase = false; state.waveInProgress = true; state.spawnQueue = [];
    state.waveTextTimer = 120;
    const infantryCount = 5 + state.wave * 2;
    const tankCount = Math.floor(state.wave / 2);
    const droneCount = Math.floor(state.wave / 3);
    for (let i = 0; i < infantryCount; i++) state.spawnQueue.push(ENEMY_TYPES.INFANTRY);
    for (let i = 0; i < tankCount; i++) state.spawnQueue.push(ENEMY_TYPES.TANK);
    for (let i = 0; i < droneCount; i++) state.spawnQueue.push(ENEMY_TYPES.DRONE);
    if (state.wave === state.maxWaves) state.spawnQueue.push(ENEMY_TYPES.BOSS);
    state.spawnQueue.sort(() => Math.random() - 0.5);
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    ctx.fillStyle = '#ff4757'; ctx.font = '40px Courier New'; ctx.textAlign = 'center';
    ctx.fillText('MISSION FAILED', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50);
    ctx.fillStyle = '#fff'; ctx.font = '20px Courier New'; ctx.fillText('TAP TO RETURN TO MENU', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50);
}

function drawVictory() {
    ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    ctx.fillStyle = '#2ed573'; ctx.font = '40px Courier New'; ctx.textAlign = 'center';
    ctx.fillText('MISSION COMPLETE', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50);
    ctx.fillStyle = '#fff'; ctx.font = '20px Courier New'; ctx.fillText('TAP TO RETURN TO MENU', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50);
}

function drawGame() {
    const level = LEVELS[state.levelIndex];
    ctx.fillStyle = '#3d4a3d'; ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    ctx.strokeStyle = '#576574'; ctx.lineWidth = 40; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(level.path[0][0], level.path[0][1]);
    for (let i = 1; i < level.path.length; i++) ctx.lineTo(level.path[i][0], level.path[i][1]);
    ctx.stroke(); ctx.strokeStyle = '#8395a7'; ctx.lineWidth = 36; ctx.stroke();
    state.towers.forEach(t => t.draw());
    state.enemies.forEach(e => e.draw());
    state.projectiles.forEach(p => p.draw());
    state.particles.forEach(p => {
        ctx.fillStyle = `rgba(255, 165, 0, ${p.life / 10})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 - p.life / 10), 0, Math.PI * 2); ctx.fill();
    });
    drawHUD();

    if (state.waveTextTimer > 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.font = 'bold 40px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(`WAVE ${state.wave}`, GAME_WIDTH / 2, GAME_HEIGHT / 2);
        state.waveTextTimer--;
    }
}

function drawHUD() {
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, GAME_WIDTH, 40);
    ctx.fillStyle = '#fff'; ctx.font = '16px Courier New'; ctx.textAlign = 'left';
    ctx.fillText(`HP: ${state.health}`, 10, 25); ctx.textAlign = 'center';
    ctx.fillText(`WAVE: ${state.wave}/${state.maxWaves}`, GAME_WIDTH / 2, 25);
    ctx.textAlign = 'right'; ctx.fillText(`$: ${state.money}`, GAME_WIDTH - 10, 25);
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, GAME_HEIGHT - 100, GAME_WIDTH, 100);
    const towerKeys = Object.keys(TOWER_TYPES); const itemWidth = GAME_WIDTH / towerKeys.length;
    towerKeys.forEach((key, i) => {
        const type = TOWER_TYPES[key]; const x = i * itemWidth + itemWidth / 2; const y = GAME_HEIGHT - 50;
        if (state.selectedTowerType === type) { ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'; ctx.fillRect(i * itemWidth, GAME_HEIGHT - 100, itemWidth, 100); }
        type.draw(x, y - 10, 0); ctx.fillStyle = '#fff'; ctx.font = '10px Courier New'; ctx.textAlign = 'center';
        ctx.fillText(type.name, x, y + 25); ctx.fillStyle = state.money >= type.cost ? '#2ecc71' : '#ff4757';
        ctx.fillText(`$${type.cost}`, x, y + 40);
    });
    if (state.buildPhase && !state.waveInProgress) {
        ctx.fillStyle = '#2ecc71'; ctx.fillRect(GAME_WIDTH - 80, 50, 70, 30);
        ctx.fillStyle = '#fff'; ctx.font = '14px Courier New'; ctx.textAlign = 'center'; ctx.fillText('START', GAME_WIDTH - 45, 70);
    } else {
        ctx.fillStyle = state.speedMultiplier > 1 ? '#f1c40f' : '#fff'; ctx.fillRect(GAME_WIDTH - 80, 50, 70, 30);
        ctx.fillStyle = '#000'; ctx.font = '14px Courier New'; ctx.textAlign = 'center'; ctx.fillText(state.speedMultiplier > 1 ? '>>' : '>', GAME_WIDTH - 45, 70);
    }
    if (state.selectedTowerType && state.lastMousePos) {
        const {x, y} = state.lastMousePos; ctx.beginPath(); ctx.arc(x, y, state.selectedTowerType.range, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.stroke();
    }
    if (state.selectedTowerInstance) {
        const t = state.selectedTowerInstance; const cost = Math.floor(t.type.cost * 0.7);
        ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(GAME_WIDTH / 2 - 70, 50, 140, 60);
        ctx.fillStyle = '#fff'; ctx.font = '12px Courier New'; ctx.textAlign = 'center';
        ctx.fillText(`${t.type.name} LVL ${t.level || 0}`, GAME_WIDTH / 2, 65);
        ctx.fillStyle = state.money >= cost ? '#2ecc71' : '#ff4757'; ctx.fillRect(GAME_WIDTH / 2 - 50, 75, 100, 25);
        ctx.fillStyle = '#fff'; ctx.fillText(`UPGRADE $${cost}`, GAME_WIDTH / 2, 92);
    }
}

let lastTime = 0;
function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime; lastTime = timestamp;
    update(dt); draw(); requestAnimationFrame(loop);
}

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    state.lastMousePos = { x: (e.clientX - rect.left) * (GAME_WIDTH / rect.width), y: (e.clientY - rect.top) * (GAME_HEIGHT / rect.height) };
});

const handleInput = (x, y) => {
    if (state.screen === 'MENU') {
        if (x > 80 && x < 280 && y > 300 && y < 360) state.screen = 'MAP_SELECT';
    } else if (state.screen === 'MAP_SELECT') {
        for (let i = 0; i < LEVELS.length; i++) {
            if (x > 50 && x < 310 && y > 150 + i * 70 && y < 200 + i * 70) initLevel(i);
        }
    } else if (state.screen === 'PLAYING') {
        if (state.selectedTowerInstance) {
            if (x > GAME_WIDTH / 2 - 50 && x < GAME_WIDTH / 2 + 50 && y > 75 && y < 100) { state.selectedTowerInstance.upgrade(); return; }
        }
        if (y > GAME_HEIGHT - 100) {
            const towerKeys = Object.keys(TOWER_TYPES); const itemWidth = GAME_WIDTH / towerKeys.length;
            const index = Math.floor(x / itemWidth); state.selectedTowerType = TOWER_TYPES[towerKeys[index]]; state.selectedTowerInstance = null; return;
        }
        if (x > GAME_WIDTH - 80 && x < GAME_WIDTH - 10 && y > 50 && y < 80) {
            if (state.buildPhase && !state.waveInProgress) startWave(); else state.speedMultiplier = state.speedMultiplier > 1 ? 1 : 2; return;
        }
        let clickedTower = null;
        for (let t of state.towers) { if (Math.sqrt((t.x - x)**2 + (t.y - y)**2) < 20) { clickedTower = t; break; } }
        if (clickedTower) { state.selectedTowerInstance = clickedTower; state.selectedTowerType = null; return; }
        if (state.selectedTowerType && state.money >= state.selectedTowerType.cost) {
            const level = LEVELS[state.levelIndex]; let blocked = false;
            for (let i = 0; i < level.path.length - 1; i++) {
                if (distToSegment({x, y}, {x: level.path[i][0], y: level.path[i][1]}, {x: level.path[i+1][0], y: level.path[i+1][1]}) < 30) { blocked = true; break; }
            }
            for (let t of state.towers) { if (Math.sqrt((t.x - x)**2 + (t.y - y)**2) < 30) { blocked = true; break; } }
            if (!blocked) { state.towers.push(new Tower(state.selectedTowerType, x, y)); state.money -= state.selectedTowerType.cost; }
        } else { state.selectedTowerInstance = null; }
    } else if (state.screen === 'GAMEOVER' || state.screen === 'VICTORY') { state.screen = 'MENU'; }
};

canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    handleInput((e.clientX - rect.left) * (GAME_WIDTH / rect.width), (e.clientY - rect.top) * (GAME_HEIGHT / rect.height));
});
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    handleInput((e.touches[0].clientX - rect.left) * (GAME_WIDTH / rect.width), (e.touches[0].clientY - rect.top) * (GAME_HEIGHT / rect.height));
});

function distToSegment(p, v, w) {
    const l2 = (v.x - w.x)**2 + (v.y - w.y)**2; if (l2 == 0) return Math.sqrt((p.x - v.x)**2 + (p.y - v.y)**2);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.sqrt((p.x - (v.x + t * (w.x - v.x)))**2 + (p.y - (v.y + t * (w.y - v.y)))**2);
}

requestAnimationFrame(loop);
