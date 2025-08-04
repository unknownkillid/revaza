const container = document.getElementById('threeScene');

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000); // black background for drama

// Camera
const camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
);
camera.position.set(0, 0.1, 3);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);
renderer.shadowMap.enabled = true;

// Realistic rendering settings
renderer.physicallyCorrectLights = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.6; // brighter overall
renderer.outputEncoding = THREE.sRGBEncoding;

// ----------------
// Lighting Setup
// ----------------

// White main light (spotlight for focus)
const keyLight = new THREE.SpotLight(0xffffff, 3);
keyLight.position.set(2, 4, 5);
keyLight.castShadow = true;
keyLight.angle = Math.PI / 6;
keyLight.penumbra = 0.4;
scene.add(keyLight);
scene.add(keyLight.target);
keyLight.target.position.set(0, 0, 0);

// Red rim light (from behind, for cinematic look)
const rimLight = new THREE.DirectionalLight(0xff0000,0.01);
rimLight.position.set(-3, 2, -5);
scene.add(rimLight);

// Fill light (cooler white, reduces harsh contrast)
const fillLight = new THREE.DirectionalLight(0xffffff, 3);
fillLight.position.set(-1.5, 1.5, 3);
scene.add(fillLight);

// Soft top light for gentle highlights
const topLight = new THREE.PointLight(0xffffff, 1.5, 10);
topLight.position.set(0, 3, 0);
scene.add(topLight);

// Minimal ambient (keeps shadows deep)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.15);
scene.add(ambientLight);

// ----------------
// GLTF Loader
// ----------------
let model;
const loader = new THREE.GLTFLoader();
loader.load('./assets/desert_eagle/scene.gltf', (gltf) => {
    model = gltf.scene;

    // Center model
    const box = new THREE.Box3().setFromObject(model);
    const center = new THREE.Vector3();
    box.getCenter(center);

    model.position.sub(center);
    model.scale.set(2.2, 2.2, 2.2);
    model.position.y = -1;
    model.rotation.y = 0.8;

    model.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    scene.add(model);
}, undefined, (error) => {
    console.error('Error loading model:', error);
});

// ----------------
// Resize Handling
// ----------------
window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
});

// ----------------
// Animation Loop
// ----------------
function animate() {
    requestAnimationFrame(animate);

    // Rotate for showcase
    if (model) {
        model.rotation.y += 0.004;
    }

    renderer.render(scene, camera);
}
animate();
