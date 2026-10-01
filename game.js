// Rise And Fall - Gun-Fu Action (Muzzle Flash + Executions)

let scene, camera, renderer, player, floor;
let moveJoystick = { active: false, startX: 0, startY: 0, moveX: 0, moveY: 0 };
let bullets = [];
let enemies = [];
let particles = [];
let score = 0;
let muzzleLight;

function init() {
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050508, 0.04);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 14, 12);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // Ambient & Neon Lighting
    const ambientLight = new THREE.AmbientLight(0x1a1a24, 0.8);
    scene.add(ambientLight);

    const cyanNeon = new THREE.PointLight(0x00ffff, 3, 25);
    cyanNeon.position.set(-6, 4, 3);
    scene.add(cyanNeon);

    const pinkNeon = new THREE.PointLight(0xff0055, 4, 25);
    pinkNeon.position.set(6, 5, -3);
    scene.add(pinkNeon);

    // Dynamic Muzzle Flash Light
    muzzleLight = new THREE.PointLight(0xffffaa, 0, 10);
    scene.add(muzzleLight);

    // Reflective Floor & Grid
    const floorGeo = new THREE.PlaneGeometry(50, 50);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0f, roughness: 0.2, metalness: 0.8 });
    floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    const grid = new THREE.GridHelper(50, 25, 0xff0055, 0x222233);
    grid.position.y = 0.01;
    scene.add(grid);

    // Raven Character Base Mesh
    const playerGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.8, 16);
    const playerMat = new THREE.MeshStandardMaterial({ color: 0xff0055, emissive: 0x44001a, roughness: 0.3 });
    player = new THREE.Mesh(playerGeo, playerMat);
    player.position.y = 0.9;
    scene.add(player);

    createMobileUI();

    setInterval(spawnEnemy, 2200);

    window.addEventListener('resize', onWindowResize, false);
    animate();
}

function createMobileUI() {
    const ui = document.createElement('div');
    ui.innerHTML = `
        <div id="score-card" style="position: absolute; top: 50px; left: 15px; color: #ff0055; text-shadow: 0 0 8px #ff0055; font-size: 20px; font-weight: bold; font-family: sans-serif;">KILLS: <span id="score">0</span></div>
        <div id="joystick-zone" style="position: absolute; bottom: 30px; left: 30px; width: 120px; height: 120px; border: 2px solid rgba(0,255,255,0.4); border-radius: 50%; touch-action: none;">
            <div id="joystick-stick" style="position: absolute; top: 35px; left: 35px; width: 50px; height: 50px; background: rgba(0,255,255,0.6); border-radius: 50%;"></div>
        </div>
        <div style="position: absolute; bottom: 30px; right: 30px; display: flex; gap: 12px;">
            <button id="btn-shoot" style="width: 65px; height: 65px; border-radius: 50%; background: #ff0055; color: white; font-weight: bold; border: none; box-shadow: 0 0 12px #ff0055; touch-action: manipulation;">FIRE</button>
            <button id="btn-execute" style="width: 65px; height: 65px; border-radius: 50%; background: #ffff00; color: black; font-weight: bold; border: none; box-shadow: 0 0 12px #ffff00; touch-action: manipulation;">TAKEDOWN</button>
            <button id="btn-dodge" style="width: 55px; height: 55px; border-radius: 50%; background: #00ffff; color: black; font-weight: bold; border: none; box-shadow: 0 0 12px #00ffff; touch-action: manipulation;">DODGE</button>
        </div>
    `;
    document.body.appendChild(ui);

    const zone = document.getElementById('joystick-zone');
    const stick = document.getElementById('joystick-stick');

    zone.addEventListener('touchstart', (e) => {
        moveJoystick.active = true;
        moveJoystick.startX = e.touches[0].clientX;
        moveJoystick.startY = e.touches[0].clientY;
    });

    window.addEventListener('touchmove', (e) => {
        if (!moveJoystick.active) return;
        let dx = e.touches[0].clientX - moveJoystick.startX;
        let dy = e.touches[0].clientY - moveJoystick.startY;
        let dist = Math.min(Math.hypot(dx, dy), 40);
        let angle = Math.atan2(dy, dx);
        
        moveJoystick.moveX = Math.cos(angle) * (dist / 40);
        moveJoystick.moveY = Math.sin(angle) * (dist / 40);
        stick.style.transform = `translate(${moveJoystick.moveX * 30}px, ${moveJoystick.moveY * 30}px)`;
    });

    window.addEventListener('touchend', () => {
        moveJoystick.active = false;
        moveJoystick.moveX = 0;
        moveJoystick.moveY = 0;
        stick.style.transform = `translate(0px, 0px)`;
    });

    document.getElementById('btn-shoot').addEventListener('click', shootBullet);
    document.getElementById('btn-execute').addEventListener('click', performTakedown);
    document.getElementById('btn-dodge').addEventListener('click', dodgeRoll);
}

function spawnEnemy() {
    if (enemies.length >= 8) return;
    const geo = new THREE.BoxGeometry(0.8, 1.8, 0.8);
    const mat = new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.5 });
    const enemy = new THREE.Mesh(geo, mat);
    
    const angle = Math.random() * Math.PI * 2;
    enemy.position.x = player.position.x + Math.cos(angle) * 15;
    enemy.position.z = player.position.z + Math.sin(angle) * 15;
    enemy.position.y = 0.9;
    
    scene.add(enemy);
    enemies.push(enemy);
}

function createHitParticles(pos, count = 8, color = 0xff0033) {
    for (let i = 0; i < count; i++) {
        const pGeo = new THREE.SphereGeometry(0.08, 4, 4);
        const pMat = new THREE.MeshBasicMaterial({ color: color });
        const particle = new THREE.Mesh(pGeo, pMat);
        particle.position.copy(pos);
        particle.userData = {
            vel: new THREE.Vector3(
                (Math.random() - 0.5) * 0.4,
                Math.random() * 0.3,
                (Math.random() - 0.5) * 0.4
            ),
            life: 25
        };
        scene.add(particle);
        particles.push(particle);
    }
}

function triggerMuzzleFlash() {
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(player.quaternion);
    muzzleLight.position.copy(player.position).add(dir.multiplyScalar(0.8));
    muzzleLight.intensity = 8;
}

function shootBullet() {
    triggerMuzzleFlash();

    const geo = new THREE.SphereGeometry(0.15, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const bullet = new THREE.Mesh(geo, mat);
    bullet.position.copy(player.position);
    
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(player.quaternion);
    bullet.userData = { velocity: dir.multiplyScalar(0.7) };
    
    scene.add(bullet);
    bullets.push(bullet);
}

function performTakedown() {
    enemies.forEach((e, idx) => {
        if (player.position.distanceTo(e.position) < 2.5) {
            triggerMuzzleFlash();
            createHitParticles(e.position, 20, 0xffff00);
            scene.remove(e);
            enemies.splice(idx, 1);
            score += 2;
            document.getElementById('score').innerText = score;
        }
    });
}

function dodgeRoll() {
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(player.quaternion);
    player.position.add(dir.multiplyScalar(2.8));
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    if (muzzleLight.intensity > 0) {
        muzzleLight.intensity -= 0.8;
    }

    if (moveJoystick.active) {
        let speed = 0.12;
        player.position.x += moveJoystick.moveX * speed;
        player.position.z += moveJoystick.moveY * speed;
        player.rotation.y = Math.atan2(moveJoystick.moveX, moveJoystick.moveY);
    }

    camera.position.x = player.position.x;
    camera.position.z = player.position.z + 12;

    bullets.forEach((b, bIdx) => {
        b.position.add(b.userData.velocity);
        
        enemies.forEach((e, eIdx) => {
            if (b.position.distanceTo(e.position) < 0.8) {
                createHitParticles(e.position);
                scene.remove(e);
                scene.remove(b);
                enemies.splice(eIdx, 1);
                bullets.splice(bIdx, 1);
                score += 1;
                document.getElementById('score').innerText = score;
            }
        });

        if (b.position.distanceTo(player.position) > 30) {
            scene.remove(b);
            bullets.splice(bIdx, 1);
        }
    });

    enemies.forEach((e) => {
        const dir = new THREE.Vector3().subVectors(player.position, e.position).normalize();
        e.position.add(dir.multiplyScalar(0.04));
        e.lookAt(player.position);
    });

    particles.forEach((p, pIdx) => {
        p.position.add(p.userData.vel);
        p.userData.life--;
        if (p.userData.life <= 0) {
            scene.remove(p);
            particles.splice(pIdx, 1);
        }
    });

    renderer.render(scene, camera);
}

window.onload = init;
                          
