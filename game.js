// --- Variáveis de Inicialização 3D ---
let scene, camera, renderer;
let playerMesh;
const container = document.getElementById('game-container');
const mainMenu = document.getElementById('main-menu');
const leftJoystick = document.getElementById('joystick-left');
const cameraArea = document.getElementById('camera-area');
const jumpButton = document.getElementById('jump-button');
const crosshair = document.getElementById('crosshair'); 

let gameRunning = false;
let move = { x: 0, z: 0 }; 

// Controles de Seta e Pulo (Para Desktop)
const keys = { 
    up: false, down: false, left: false, right: false, space: false  
};

let playerSpeed = 5.0; 
let cameraRotationSpeed = 0.003; 
const WORLD_BOUNDS = 10; 

// --- Variáveis de Física (Pulo) ---
let playerVelocityY = 0;
const GRAVITY = 9.8; 
const JUMP_POWER = 6.0;
let isOnGround = true;

animate.lastTime = performance.now(); 

let isRotating = false;
let lastTouchX = 0;

const CAMERA_DISTANCE = 3; 
const CAMERA_HEIGHT = 1.5; 

// Texturas
const PLAYER_TEXTURE_URL = 'https://threejs.org/examples/textures/crate.gif'; 
const GRASS_TEXTURE_URL = 'https://threejs.org/examples/textures/crate.gif';
const SOLID_GREEN_COLOR = 0x6AA84F; 

// --- DETECÇÃO DE DISPOSITIVO MÓVEL ---
function isMobileDevice() {
    const toMatch = [
        /Android/i, /webOS/i, /iPhone/i, /iPad/i, /iPod/i, 
        /BlackBerry/i, /Windows Phone/i, 
        /Mobi/i 
    ];
    
    return toMatch.some((toMatchItem) => {
        return navigator.userAgent.match(toMatchItem);
    });
}

// --- Funções de Menu e Estado ---

function startGame() {
    mainMenu.style.display = 'none';
    
    // LÓGICA DE VISIBILIDADE DOS BOTÕES (CORRIGIDA)
    if (isMobileDevice()) {
         leftJoystick.style.display = 'flex'; // Joystick de MOVIMENTO
         jumpButton.style.display = 'flex';   // Botão PULAR
         cameraArea.style.display = 'block';  // Área de rotação da câmera (toque)
    } else {
         // Desktop: Esconde botões de toque
         leftJoystick.style.display = 'none';
         jumpButton.style.display = 'none';
         cameraArea.style.display = 'none';
    }
    
    crosshair.style.display = 'block'; 
    
    // Adiciona Listeners
    jumpButton.addEventListener('pointerdown', handleJumpButton, false);
    cameraArea.addEventListener('touchstart', handleTouchStart, false);
    cameraArea.addEventListener('touchmove', handleTouchMove, false);
    cameraArea.addEventListener('touchend', handleTouchEnd, false);

    gameRunning = true;
    animate(0); 
}

function showOptions() { alert("Configurações: Sensibilidade de Mira, Volume, etc."); }
function exitGame() { alert("Sair do jogo."); }

// --- Controle de Pulo ---
function handleJumpButton(event) {
     if (gameRunning && isOnGround) {
        playerVelocityY = JUMP_POWER;
        isOnGround = false;
     }
     event.preventDefault(); 
}

// --- Controle de Câmera por Toque (Mobile) ---
function handleTouchStart(event) {
    if (!gameRunning) return;
    isRotating = true;
    lastTouchX = event.touches[0].clientX;
    event.preventDefault(); 
}

function handleTouchMove(event) {
    if (!gameRunning || !isRotating) return;
    
    const currentX = event.touches[0].clientX;
    const deltaX = currentX - lastTouchX;
    
    playerMesh.rotation.y -= deltaX * cameraRotationSpeed; 
    
    lastTouchX = currentX;
    event.preventDefault();
}

function handleTouchEnd(event) {
    if (!gameRunning) return;
    isRotating = false;
    event.preventDefault();
}

// --- Funções de Inicialização 3D ---

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);

    const aspectRatio = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
    camera.position.set(0, CAMERA_HEIGHT, CAMERA_DISTANCE); 

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // 1. CHÃO
    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const textureLoader = new THREE.TextureLoader();
    
    const floorMaterial = new THREE.MeshStandardMaterial({ color: SOLID_GREEN_COLOR, side: THREE.DoubleSide });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = Math.PI / 2;
    scene.add(floor);
    
    textureLoader.load(GRASS_TEXTURE_URL, texture => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(5, 5);
        floor.material = new THREE.MeshStandardMaterial({ map: texture, side: THREE.DoubleSide });
    });


    // 2. PERSONAGEM (Caixa)
    const playerGeometry = new THREE.BoxGeometry(0.8, 1.6, 0.8); 
    playerMesh = new THREE.Mesh(playerGeometry, new THREE.MeshStandardMaterial({ color: 0x00ff00 }));
    playerMesh.position.set(0, 0.8, 0); 
    scene.add(playerMesh);

    textureLoader.load(
        PLAYER_TEXTURE_URL, 
        texture => {
            playerMesh.material = new THREE.MeshStandardMaterial({ map: texture });
        },
        undefined,
        err => {
            console.warn(`[AVISO] Falha ao carregar a textura. Usando o cubo verde padrão.`);
        }
    );

    // 3. INIMIGO
    const enemyGeometry = new THREE.BoxGeometry(1, 1, 1);
    const enemyMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const enemyMesh = new THREE.Mesh(enemyGeometry, enemyMaterial);
    enemyMesh.position.set(5, 0.5, -5);
    scene.add(enemyMesh);

    window.addEventListener('resize', onWindowResize);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    joystick("joystick-left", v => move = { x: v.x, z: v.y });
    
    document.addEventListener('mousemove', handleMouseMove, false);
}

// --- Rotação de Câmera/Jogador para Desktop (Mouse) ---
function handleMouseMove(event) {
    if (!gameRunning || isMobileDevice()) return; 
    
    const deltaX = event.movementX || 0;
    playerMesh.rotation.y -= deltaX * cameraRotationSpeed; 
}

// --- Funções de Jogo 3D (Update com Controles e Física) ---

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function updatePlayer(deltaTime) {
    let dx = 0, dz = 0;
    const rotationAngle = playerMesh.rotation.y;
    
    // 1. COMBINAÇÃO DE INPUTS 
    
    // Input Horizontal (Setas + Joystick X)
    let inputX = (keys.right ? 1 : 0) - (keys.left ? 1 : 0) + move.x;
    
    // Input Vertical (Setas + Joystick Z)
    let inputZ = (keys.up ? 1 : 0) - (keys.down ? 1 : 0) + move.z; 
    
    inputX = parseFloat(inputX) || 0;
    inputZ = parseFloat(inputZ) || 0;
    
    // Normaliza o vetor de movimento
    const mag = Math.sqrt(inputX * inputX + inputZ * inputZ);
    
    if (mag > 0.001 && !isNaN(mag)) { 
        inputX /= mag;
        inputZ /= mag;
    } else {
        inputX = 0;
        inputZ = 0;
    }

    // 2. ROTAÇÃO DO MOVIMENTO (MOVIMENTO CORRIGIDO)
    const forwardInput = -inputZ; 
    const sideInput = inputX;

    dx = sideInput * Math.cos(rotationAngle) - forwardInput * Math.sin(rotationAngle);
    dz = sideInput * Math.sin(rotationAngle) + forwardInput * Math.cos(rotationAngle);
    
    const speed = isNaN(playerSpeed) ? 5.0 : playerSpeed; 
    const safeDeltaTime = Math.min(deltaTime, 0.1); 

    // Aplica o movimento horizontal
    playerMesh.position.x += dx * speed * safeDeltaTime;
    playerMesh.position.z += dz * speed * safeDeltaTime;

    // 3. FÍSICA (Gravidade e Pulo)
    if (keys.space && isOnGround) {
        playerVelocityY = JUMP_POWER;
        isOnGround = false;
    }

    if (!isOnGround) {
        playerVelocityY -= GRAVITY * safeDeltaTime;
        playerMesh.position.y += playerVelocityY * safeDeltaTime;
    }

    const groundLevel = 0.8;
    if (playerMesh.position.y < groundLevel) {
        playerVelocityY = 0;
        playerMesh.position.y = groundLevel;
        isOnGround = true;
    }

    // Limites de Tela
    playerMesh.position.x = Math.min(Math.max(playerMesh.position.x, -WORLD_BOUNDS), WORLD_BOUNDS);
    playerMesh.position.z = Math.min(Math.max(playerMesh.position.z, -WORLD_BOUNDS), WORLD_BOUNDS);
    
    // 4. LÓGICA DA CÂMERA
    const targetX = playerMesh.position.x - Math.sin(rotationAngle) * CAMERA_DISTANCE;
    const targetZ = playerMesh.position.z - Math.cos(rotationAngle) * CAMERA_DISTANCE;
    
    const smoothingFactor = 0.5; 
    
    camera.position.x += (targetX - camera.position.x) * smoothingFactor;
    camera.position.z += (targetZ - camera.position.z) * smoothingFactor;
    camera.position.y = playerMesh.position.y + CAMERA_HEIGHT; 

    // A câmera sempre olha para a frente do jogador
    camera.lookAt(playerMesh.position.x, playerMesh.position.y + 0.5, playerMesh.position.z);
}

function animate(time) {
    if (!gameRunning) return; 

    requestAnimationFrame(animate);

    const currentTime = performance.now();
    const lastTime = animate.lastTime || currentTime; 
    const deltaTime = (currentTime - lastTime) / 1000; 
    
    animate.lastTime = currentTime;
    
    const clampedDeltaTime = Math.min(deltaTime, 0.1);

    updatePlayer(clampedDeltaTime);

    renderer.render(scene, camera);
}

// --- Funções de Controle (Setas e Pulo) ---

function onKeyDown(e) {
    if (!gameRunning) return; 
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        if (e.key === 'ArrowUp') keys.up = true;
        if (e.key === 'ArrowDown') keys.down = true;
        if (e.key === 'ArrowLeft') keys.left = true;
        if (e.key === 'ArrowRight') keys.right = true;
        
        if (e.key === ' ' || e.key === 'Spacebar') keys.space = true;
    }
}
function onKeyUp(e) {
    if (!gameRunning) return; 
    if (e.key === 'ArrowUp') keys.up = false;
    if (e.key === 'ArrowDown') keys.down = false;
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
    
    if (e.key === ' ' || e.key === 'Spacebar') keys.space = false;
}

// --- Funções do Joystick (Mobile) ---

function joystick(id, callback) {
    const stick = document.getElementById(id);
    const inner = document.getElementById(id + '-inner');
    let rect = stick.getBoundingClientRect();
    let center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    let active = false;

    const resetStick = () => {
        active = false; 
        callback({ x: 0, z: 0 }); 
        inner.style.transform = `translate(0px, 0px)`; 
        stick.classList.remove('active'); 
    };
    
    stick.addEventListener("pointerdown", e => { 
        if (!gameRunning) return;
        e.preventDefault(); 
        active = true; 
        stick.classList.add('active'); 
        rect = stick.getBoundingClientRect(); 
        center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }, false);
    
    stick.addEventListener("pointerup", resetStick, false);
    stick.addEventListener("pointerleave", resetStick, false); 
    
    stick.addEventListener("pointermove", e => {
        if (!active) return;
        e.preventDefault();
        let dx = e.clientX - center.x;
        let dy = e.clientY - center.y;
        const mag = Math.sqrt(dx * dx + dy * dy);
        const maxRadius = 50; 
        
        if (mag > maxRadius) { 
            dx = (dx / mag) * maxRadius; 
            dy = (dy / mag) * maxRadius; 
        }
        
        // Z (Frente/Trás) é o eixo Y da tela, invertido (-dy/maxRadius)
        callback({ x: dx / maxRadius, z: -dy / maxRadius }); 
        inner.style.transform = `translate(${dx}px, ${dy}px)`;
    }, false);
    
    window.addEventListener("resize", () => {
        rect = stick.getBoundingClientRect();
        center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    });
}

// Inicia o ambiente 3D quando a página carrega
init();
