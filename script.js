class Planet {
    constructor(game) {
        this.game = game;
        this.image = planetImg;
        this.x = this.game.width * 0.5;
        this.y = this.game.height * 0.5;
        this.radius = 80;
    }
    draw(ctx) {
        ctx.drawImage(this.image, this.x - 100, this.y - 100);
        if (this.game.debug) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}

class Player {
    constructor(game) {
        this.game = game;
        this.image = playerImg;
        this.x = this.game.width * 0.5;
        this.y = this.game.height * 0.5;
        this.radius = 40;
        this.aim;
        this.angle = 0;
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.drawImage(this.image, -this.radius, -this.radius);
        if (this.game.debug) {
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();
    }
    update() {
        this.aim = this.game.calcAim(this.game.planet, this.game.mouse);
        this.x =
            this.game.planet.x +
            (this.radius + this.game.planet.radius) * this.aim[0];
        this.y =
            this.game.planet.y +
            (this.radius + this.game.planet.radius) * this.aim[1];
        // dy/dx
        this.angle = Math.atan2(this.aim[3], this.aim[2]);
    }
    shoot() {
        const projectile = this.game.getProjectile();
        if (projectile)
            projectile.start(
                this.x + this.radius * this.aim[0],
                this.y + this.radius * this.aim[1],
                this.aim[0],
                this.aim[1]
            );
    }
}

class Projectile {
    constructor(game) {
        this.game = game;
        this.x;
        this.y;
        this.speedX;
        this.speedY;
        this.radius = 5;
        this.speedModifier = 3;
        this.free = true;
    }
    start(x, y, speedX, speedY) {
        this.x = x;
        this.y = y;
        this.speedX = speedX * this.speedModifier;
        this.speedY = speedY * this.speedModifier;
        this.free = false;
    }
    reset() {
        this.free = true;
    }
    draw(ctx) {
        if (!this.free) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = "gold";
            ctx.fill();
            ctx.restore();
        }
    }
    update() {
        if (!this.free) {
            this.x += this.speedX;
            this.y += this.speedY;
        }
        // projectile outside the screen, then reset it is available
        if (
            this.x + this.radius < 0 ||
            this.x - this.radius > this.game.width ||
            this.y + this.radius < 0 ||
            this.y - this.radius > this.game.height
        ) {
            this.reset();
        }
    }
}

class Enemy {
    constructor(game) {
        this.game = game;
        this.x;
        this.y;
        this.speedX = 1;
        this.speedY = 1;
        this.radius = 40;
        this.width = this.radius * 2;
        this.height = this.radius * 2;
        this.free = true;
        this.angle = 0;
        this.collided = false;
        this.speedModifier = Math.random() * 0.7 + 0.1;
    }
    start() {
        this.collided = false;
        this.frameX = 0;
        this.frameY = Math.floor(Math.random() * 4);
        this.lives = this.maxLives;
        if (Math.random() < 0.5) {
            this.x =
                Math.random() < 0.5
                    ? 0 - this.radius
                    : this.game.width + this.radius;
            this.y = Math.random() * this.game.height;
        } else {
            this.x = Math.random() * this.game.width;
            this.y =
                Math.random() < 0.5
                    ? -this.radius
                    : this.game.height + this.radius;
        }

        const aim = this.game.calcAim(this, this.game.planet);
        this.speedX = aim[0] * this.speedModifier;
        this.speedY = aim[1] * this.speedModifier;
        this.angle = Math.atan2(aim[3], aim[2]) + Math.PI * 0.5;
        this.free = false;
    }
    reset() {
        this.free = true;
    }
    draw(ctx) {
        if (!this.free) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            ctx.drawImage(
                this.image,
                this.frameX * this.width,
                this.frameY * this.height,
                this.width,
                this.height,
                -this.radius,
                -this.radius,
                this.width,
                this.height
            );
            if (this.game.debug) {
                ctx.beginPath();
                ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.fillText(this.lives, 0, 0);
            }
            ctx.restore();
        }
    }
    hit(damage) {
        this.lives -= damage;
        if (this.lives >= 1) this.frameX++;
    }
    update() {
        if (!this.free) {
            this.x += this.speedX;
            this.y += this.speedY;
            // check collision enemy / planet                                                                                                                                                              // projectile outside the screen, then reset it is available
        }
    }
    update() {
        if (!this.free) {
            this.x += this.speedX;
            this.y += this.speedY;
            // check collision enemy / planet
            if (this.game.checkCollision(this, this.game.planet)) {
                this.lives = 0;
                this.speedX = 0;
                this.speedY = 0;
                this.collided = true;
                this.game.lives--;
            }
            // check collision enemy / player
            if (this.game.checkCollision(this, this.game.player)) {
                this.lives = 0;
                this.collided = true;
                this.game.lives--;
            }
            // check collision enemy / projectile
            this.game.projectilePool.forEach((pro) => {
                if (
                    !pro.free &&
                    this.game.checkCollision(this, pro) &&
                    this.lives >= 1
                ) {
                    pro.reset();
                    this.hit(1);
                }
            });
            if (this.lives < 1 && this.game.spriteUpdate) {
                if (this.frameX < this.maxFrame) {
                    this.frameX++;
                } else {
                    this.reset();
                    if (!this.collided) this.game.score += this.maxLives;
                }
            }
        }
        // projectile outside the screen, then reset it is available
        if (
            this.x + this.radius < 0 ||
            this.x - this.radius > this.game.width ||
            this.y + this.radius < 0 ||
            this.y - this.radius > this.game.height
        ) {
            this.reset();
        }
    }
}

class Asteroid extends Enemy {
    constructor(game) {
        super(game);
        this.image = asteroidImg;
        this.frameX = 0;
        this.maxFrame = 7;
        this.frameY = Math.floor(Math.random() * 4);
        this.lives = 1;
        this.maxLives = this.lives;
    }
}

class Lobstermorph extends Enemy {
    constructor(game) {
        super(game);
        this.image = lobstermorphImg;
        this.frameX = 0;
        this.maxFrame = 14;
        this.frameY = Math.floor(Math.random() * 4);
        this.lives = 8;
        this.maxLives = this.lives;
    }
}

class Beetlemorph extends Enemy {
    constructor(game) {
        super(game);
        this.image = beetlemorphImg;
        this.frameX = 0;
        this.frameY = Math.floor(Math.random() * 4);
        this.maxFrame = 3;
        this.lives = 1;
        this.maxLives = this.lives;
    }
}
class Rhinomorph extends Enemy {
    constructor(game) {
        super(game);
        this.image = rhinomorphImg;
        this.frameX = 0;
        this.frameY = Math.floor(Math.random() * 4);
        this.maxFrame = 6;
        this.lives = 4;
        this.maxLives = this.lives;
    }
}

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.planet = new Planet(this);
        this.player = new Player(this);
        this.debug = true;
        this.numberOfProjectiles = 30;
        this.projectilePool = [];
        this.enemyPool = [];
        this.numberOfEnemies = 5;
        this.createProjectilePool();
        this.createEnemyPool();
        this.enemyTimer = 0;
        this.enemyInterval = 1000;
        this.spriteUpdate = false;
        this.spriteTimer = 0;
        this.spriteInterval = 150;
        this.score = 0;
        this.winningScore = 10;
        this.gameOver = false;
        this.lives = 5;

        this.mouse = { x: this.width / 2, y: this.height / 2 };

        window.addEventListener("mousemove", (e) => {
            this.mouse.x = e.offsetX;
            this.mouse.y = e.offsetY;
        });
        window.addEventListener("keydown", (e) => {
            if (e.key === "d") this.debug = !this.debug;
            else if (e.key === " ") this.player.shoot();
        });
        // player shoot
        window.addEventListener("mousedown", (e) => {
            this.player.shoot();
        });
    }
    drawTextStatus(ctx) {
        ctx.save();
        ctx.font = "30px Impact";
        ctx.fillStyle = "white";
        ctx.textAlign = "left";
        ctx.fillText(`Score: ${this.score}`, 20, 30);
        for (let i = 0; i < this.lives; i++) {
            ctx.fillRect(20 + i * 15, 60, 10, 30);
        }
        if (this.gameOver) {
            ctx.textAlign = "center";
            let message1;
            let message2;
            if (this.checkWin()) {
                message1 = "You win!";
                message2 = `Your score is: ${this.score}!`;
            } else {
                message1 = "You lose!";
                message2 = `Try again!`;
            }
            ctx.font = "100px Impact";
            ctx.fillText(message1, this.width * 0.5, 200);
            ctx.font = "50px Impact";
            ctx.fillText(message2, this.width * 0.5, 550);
        }
        ctx.restore();
    }
    checkWin() {
        return this.score >= this.winningScore;
    }
    render(ctx, deltaTime) {
        this.planet.draw(ctx);
        this.drawTextStatus(ctx);
        this.player.draw(ctx);
        this.player.update();
        this.projectilePool.forEach((pro) => {
            pro.draw(ctx);
            pro.update();
        });
        this.enemyPool.forEach((enemy) => {
            enemy.draw(ctx);
            enemy.update();
        });

        // enemy appearances
        if (!this.gameOver) {
            if (this.enemyTimer > this.enemyInterval) {
                const enemy = this.getEnemy();
                if (enemy) enemy.start();
                this.enemyTimer = 0;
            } else {
                this.enemyTimer += deltaTime;
            }
        }

        if (this.spriteTimer > this.spriteInterval) {
            this.spriteUpdate = true;
            this.spriteTimer = 0;
        } else {
            this.spriteTimer += deltaTime;
            this.spriteUpdate = false;
        }

        //win/lose condition
        if (this.checkWin() && this.lives < 1) {
            this.gameOver = true;
        }
    }
    calcAim(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distance = Math.hypot(dx, dy);
        const aimX = (dx / distance) * -1;
        const aimY = (dy / distance) * -1;
        return [aimX, aimY, dx, dy];
    }
    getProjectile() {
        return this.projectilePool.find((pro) => pro.free);
    }
    createProjectilePool() {
        for (let i = 0; i < this.numberOfProjectiles; i++) {
            this.projectilePool.push(new Projectile(this));
        }
    }
    getEnemy() {
        return this.enemyPool.find((enemy) => enemy.free);
    }
    createEnemyPool() {
        for (let i = 0; i < this.numberOfEnemies; i++) {
            const randomize = Math.random();
            if (randomize < 0.25) {
                this.enemyPool.push(new Asteroid(this));
            } else if (randomize < 0.5) {
                this.enemyPool.push(new Rhinomorph(this));
            } else if (randomize < 0.75) {
                this.enemyPool.push(new Beetlemorph(this));
            } else {
                this.enemyPool.push(new Lobstermorph(this));
            }
        }
    }
    checkCollision(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distance = Math.hypot(dx, dy);
        const sumOfRadius = a.radius + b.radius;
        return distance <= sumOfRadius;
    }
}

window.addEventListener("load", () => {
    const ctx = canvas.getContext("2d");
    canvas.width = 800;
    canvas.height = 800;
    ctx.strokeStyle = "white";
    ctx.fillStyle = "white";
    ctx.font = "30px Helvetica";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 3;

    const game = new Game(canvas);
    let lastTime = 0;
    function animate(timeStamp) {
        const deltaTime = timeStamp - lastTime;
        lastTime = timeStamp;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        game.render(ctx, deltaTime);
        requestAnimationFrame(animate);
    }
    animate(0);
});
