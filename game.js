// Rise And Fall - 3D Gun-Fu Action Engine with Touch Controls

let scene, camera, renderer, player, floor;
let moveJoystick = { active: false, startX: 0, startY: 0, moveX: 0, moveY: 0 };
let bullets = [];
let keys = {};

function init() {
    // 1. Scene & Fog Setup
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050508, 0.04);

    // 2. Camera Setup
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 14, 12);
    camera.lookAt(0, 0, 0);

    // 3. WebGL Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // 4. John Wick Neon Lights
    const ambientLight = new THREE.AmbientLight(0x1a1a24, 0.8);
    scene.add(ambientLight);

    const cyanNeon = new THREE.PointLight(0x00ffff, 3, 25);
    cyanNeon.position.set(-6, 4, 3);
    scene.add(cyanNeon);

    const pinkNeon = new THREE.PointLight(0xff0055, 4, 25);
    pinkNeon.position.set(6, 5, -3);
    scene.add(pinkNeon);

    // 5. Dark Reflective Ground
    const floorGeo = new THREE.PlaneGeometry(40, 40);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0f, roughness: 0.2, metalness: 0.8 });
    floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Grid Floor Overlay for Depth
    const grid = new THREE.GridHelper(40, 20, 0xff0055, 0x222233);
    grid.position.y = 0.01;
    scene.add(grid);

    // 6. Character Base (Raven Placeholder)
    const playerGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.8, 16);
    const playerMat = new THREE.MeshStandardMaterial({ color: 0xff0055, emissive: 0x44001a, roughness: 0.3 });
    player = new THREE.Mesh(playerGeo, playerMat);
    player.position.y = 0.9;
    scene.add(player);

    // Create On-Screen Mobile Touch UI
    createMobileUI();

    // Responsive Window Resize
    window.addEventListener('resize', onWindowResize, false);

    animate();
}

function createMobileUI() {
    const ui = document.createElement('div');
    ui.innerHTML = `
        <div id="joystick-zone" style="position: absolute; bottom: 30px; left: 30px; width: 120px; height: 120px; border: 2px solid rgba(0,255,255,0.4); border-radius: 50%; touch-action: none;">
            <div id="joystick-stick" style="position: absolute; top: 35px; left: 35px; width: 50px; height: 50px; background: rgba(0,255,255,0.6); border-radius: 50%;"></div>
        </div>
        <div style="position: absolute; bottom: 30px; right: 30px; display: flex; gap: 15px;">
            <button id="btn-shoot" style="width: 70px; height: 70px; border-radius: 50%; background: #ff0055; color: white; font-weight: bold; border: none; box-shadow: 0 0 12px #ff0055; touch-action: manipulation;">FIRE</button>
            <button id="btn-dodge" style="width: 60px; height: 60px; border-radius: 50%; background: #00ffff; color: black; font-weight: bold; border: none; box-shadow: 0 0 12px #00ffff; touch-action: manipulation;">DODGE</button>
        </div>
    `;
    document.body.appendChild(ui);

    // Touch Joystick Events
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

    // Action Buttons
    document.getElementById('btn-shoot').addEventListener('click', shootBullet);
    document.getElementById('btn-dodge').addEventListener('click', dodgeRoll);
}

function shootBullet() {
    const geo = new THREE.SphereGeometry(0.15, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const bullet = new THREE.Mesh(geo, mat);
    bullet.position.copy(player.position);
    
    // Calculate direction player is facing
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(player.quaternion);
    bullet.userData = { velocity: dir.multiplyScalar(0.6) };
    
    scene.add(bullet);
    bullets.push(bullet);
}

function dodgeRoll() {
    // Fast Gun-Fu dash
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(player.quaternion);
    player.position.add(dir.multiplyScalar(2.5));
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    // Joystick Movement logic
    if (moveJoystick.active) {
        let speed = 0.12;
        player.position.x += moveJoystick.moveX * speed;
        player.position.z += moveJoystick.moveY * speed;

        // Rotate character towards movement
        let angle = Math.atan2(moveJoystick.moveX, moveJoystick.moveY);
        player.rotation.y = angle;
    }

    // Camera Smooth Follow
    camera.position.x = player.position.x;
    camera.position.z = player.position.z + 12;

    // Bullet Trajectory Update
    bullets.forEach((b, idx) => {
        b.position.add(b.userData.velocity);
        if (b.position.distanceTo(player.position) > 30) {
            scene.remove(b);
            bullets.splice(idx, 1);
        }
    });

    renderer.render(scene, camera);
}

window.onload = init;
