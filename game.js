const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const path = [
    {x: 50, y: 550},
    {x: 50, y: 300},
    {x: 300, y: 300},
    {x: 300, y: 100},
    {x: 550, y: 100},
    {x: 550, y: 300},
    {x: 750, y: 300},
    {x: 750, y: 50},
];

function drawMap() {
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
    }
    ctx.lineWidth = 40;
    ctx.strokeStyle = '#D2B48C'; // Lys brun
    ctx.stroke();
}

function drawPath() {
    // Ikke tegne den røde stien
}

let draggingTower = null;
const towers = [];

function drawTowers() {
    towers.forEach(tower => {
        ctx.fillStyle = tower.color;
        ctx.fillRect(tower.x - 15, tower.y - 15, 30, 30);

        // Tegn usynlig rekkevidde sirkel
        ctx.globalAlpha = 0; // Usynlig
        ctx.beginPath();
        ctx.arc(tower.x, tower.y, tower.range, 0, 2 * Math.PI);
        ctx.fillStyle = 'blue'; // Farge på rekkevidde sirkel (kan endres)
        ctx.fill();
        ctx.globalAlpha = 1; // Tilbakestill gjennomsiktighet
    });
}

class Enemy {
    constructor() {
        this.position = {x: path[0].x, y: path[0].y};
        this.pathIndex = 0;
        this.speed = 1;
        this.health = 5;
    }

    move() {
        if (this.pathIndex < path.length - 1) {
            const nextPoint = path[this.pathIndex + 1];
            const dx = nextPoint.x - this.position.x;
            const dy = nextPoint.y - this.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.speed) {
                this.position = {x: nextPoint.x, y: nextPoint.y};
                this.pathIndex++;
            } else {
                this.position.x += (dx / distance) * this.speed;
                this.position.y += (dy / distance) * this.speed;
            }
        }
    }

    draw() {
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.ellipse(this.position.x, this.position.y, 10, 15, 0, 0, 2 * Math.PI);
        ctx.fill();
    }
}

const enemies = [];
const projectiles = [];

function spawnEnemy() {
    enemies.push(new Enemy());
}

function drawEnemies() {
    enemies.forEach((enemy, index) => {
        enemy.move();
        enemy.draw();

        if (enemy.health <= 0) {
            enemies.splice(index, 1);
        }
    });

    if (enemies.length > 0 && enemies[0].pathIndex >= path.length - 1) {
        enemies.shift();
    }
}

class Projectile {
    constructor(x, y, target, type) {
        this.position = {x: x, y: y};
        this.target = target;
        this.speed = type === 'monkey' ? 5 : 3;
        this.color = type === 'monkey' ? 'black' : 'gray';
        this.size = type === 'monkey' ? 5 : 10;
        this.damage = type === 'monkey' ? 1 : 3;
        this.type = type;
    }

    move() {
        const dx = this.target.position.x - this.position.x;
        const dy = this.target.position.y - this.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.speed) {
            this.position = {x: this.target.position.x, y: this.target.position.y};
            this.target.health -= this.damage;
        } else {
            this.position.x += (dx / distance) * this.speed;
            this.position.y += (dy / distance) * this.speed;
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.position.x - this.size / 2, this.position.y - this.size / 2, this.size, this.size);
    }
}

function shootProjectiles() {
    towers.forEach(tower => {
        const now = Date.now();
        if (tower.lastShotTime === undefined) {
            tower.lastShotTime = 0;
        }

        const timeSinceLastShot = now - tower.lastShotTime;
        const shootInterval = tower.type === 'monkey' ? 500 : 1000;

        if (timeSinceLastShot >= shootInterval) {
            if (enemies.length > 0) {
                const target = enemies[0];
                if (isWithinRange(tower, target)) {
                    projectiles.push(new Projectile(tower.x, tower.y, target, tower.type));
                    tower.lastShotTime = now;
                }
            }
        }
    });

    projectiles.forEach((projectile, index) => {
        projectile.move();
        projectile.draw();

        if (projectile.position.x === projectile.target.position.x &&
            projectile.position.y === projectile.target.position.y) {
            projectiles.splice(index, 1);
        }
    });
}

function isWithinRange(tower, enemy) {
    const dx = tower.x - enemy.position.x;
    const dy = tower.y - enemy.position.y;
    const distanceSquared = dx * dx + dy * dy;
    const rangeSquared = tower.range * tower.range;
    return distanceSquared <= rangeSquared;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMap();
    drawTowers();
    drawEnemies();
    shootProjectiles();
}

document.getElementById('startButton').addEventListener('click', () => {
    document.getElementById('startScreen').style.display = 'none';
    canvas.style.display = 'block';
    document.getElementById('panel').style.display = 'block';
});

document.getElementById('togglePanel').addEventListener('click', () => {
    const panelContent = document.getElementById('panelContent');
    panelContent.style.display = panelContent.style.display === 'none' ? 'block' : 'none';
});

const draggableItems = document.querySelectorAll('.item');
draggableItems.forEach(item => {
    item.addEventListener('dragstart', (event) => {
        draggingTower = {
            type: event.target.id,
            color: event.target.querySelector('.icon').style.backgroundColor,
            range: 100 // Sett rekkevidde her (endres etter behov)
        };
    });
});

canvas.addEventListener('dragover', (event) => {
    event.preventDefault();
});

canvas.addEventListener('drop', (event) => {
    if (draggingTower) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        console.log(`Placing ${draggingTower.type} at (${x}, ${y})`);

        if (x >= 0 && x <= canvas.width && y >= 0 && y <= canvas.height) {
            towers.push({x, y, type: draggingTower.type, color: draggingTower.color, range: draggingTower.range});
            draggingTower = null;
        } else {
            console.log('Drop was outside the canvas bounds.');
        }
    }
});

setInterval(draw, 2500 / 60);
setInterval(spawnEnemy, 2000); // Spawn a new enemy every 4 seconds




