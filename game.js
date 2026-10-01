// Rise And Fall - 3D Gun-Fu Engine (Three.js)

let scene, camera, renderer, player, floor;

function init() {
    // 1. Scene Setup
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050508, 0.05);

    // 2. Camera Setup (Isometric Action View)
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 12, 12);
    camera.lookAt(0, 0, 0);

    // 3. WebGL Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // 4. Neon Lights (John Wick Atmospheric Style)
    const ambientLight = new THREE.AmbientLight(0x222233, 0.5);
    scene.add(ambientLight);

    const cyanNeon = new THREE.PointLight(0x00ffff, 2, 20);
    cyanNeon.position.set(-5, 4, 2);
    scene.add(cyanNeon);

    const pinkNeon = new THREE.PointLight(0xff0055, 3, 20);
    pinkNeon.position.set(5, 5, -2);
    scene.add(pinkNeon);

    // 5. Environment (Reflective Dark Floor)
    const floorGeo = new THREE.PlaneGeometry(30, 30);
    const floorMat = new THREE.MeshStandardMaterial({ 
        color: 0x111116, 
        roughness: 0.2, 
        metalness: 0.8 
    });
    floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // 6. Player Placeholder Mesh (Raven's 3D Rig Anchor)
    const playerGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.8, 16);
    const playerMat = new THREE.MeshStandardMaterial({ 
        color: 0xff0055, 
        emissive: 0x330011, 
        roughness: 0.3 
    });
    player = new THREE.Mesh(playerGeo, playerMat);
    player.position.y = 0.9;
    scene.add(player);

    // Responsive Resize
    window.addEventListener('resize', onWindowResize, false);

    animate();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    
    // Slight idle animation for testing
    if (player) {
        player.rotation.y += 0.01;
    }

    renderer.render(scene, camera);
}

window.onload = init;
