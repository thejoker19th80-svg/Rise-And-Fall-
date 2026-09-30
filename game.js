const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Player
let player = { x: 50, y: 180, size: 25, color: "#00ffcc", speed: 4, hp: 100 };

// Dark AI Enemy (Aggressive Chase)
let aiEnemy = { x: 520, y: 180, size: 25, color: "#ff0055", speed: 2.2, hp: 100 };

// Movement Keys
let keys = {};
document.addEventListener("keydown", (e) => keys[e.key] = true);
document.addEventListener("keyup", (e) => keys[e.key] = false);

function update() {
    // Player Controls (Arrow Keys)
    if (keys["ArrowUp"] && player.y > 0) player.y -= player.speed;
    if (keys["ArrowDown"] && player.y < canvas.height - player.size) player.y += player.speed;
    if (keys["ArrowLeft"] && player.x > 0) player.x -= player.speed;
    if (keys["ArrowRight"] && player.x < canvas.width - player.size) player.x += player.speed;

    // AI Enemy Intelligence (Player ko Target Karke Attack Position Me Aana)
    let dx = player.x - aiEnemy.x;
    let dy = player.y - aiEnemy.y;
    let distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 5) {
        aiEnemy.x += (dx / distance) * aiEnemy.speed;
        aiEnemy.y += (dy / distance) * aiEnemy.speed;
    }
}

function draw() {
    // Dark Background
    ctx.fillStyle = "#0d0d0d";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Player
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.size, player.size);

    // Draw AI Enemy
    ctx.fillStyle = aiEnemy.color;
    ctx.fillRect(aiEnemy.x, aiEnemy.y, aiEnemy.size, aiEnemy.size);
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
  
