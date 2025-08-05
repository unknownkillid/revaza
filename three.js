const container = document.getElementById('threeScene');

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.fog = new THREE.FogExp2(0x000000, 0.08);

// Camera
const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.set(0, 0.2, 3);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
container.appendChild(renderer.domElement);
renderer.shadowMap.enabled = true;
renderer.physicallyCorrectLights = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.4;
renderer.outputEncoding = THREE.sRGBEncoding;

// =========================
// Lighting
// =========================
const keyLight = new THREE.SpotLight(0xffffff, 3);
keyLight.position.set(2, 4, 5);
keyLight.castShadow = true;
keyLight.angle = Math.PI / 6;
keyLight.penumbra = 0.4;
scene.add(keyLight);
scene.add(keyLight.target);

const rimLight = new THREE.DirectionalLight(0xff0000, 2);
rimLight.position.set(-3, 2, -5);
scene.add(rimLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 5);
fillLight.position.set(-1.5, 1.5, 3);
scene.add(fillLight);

const topLight = new THREE.PointLight(0xffffff, 1.5, 10);
topLight.position.set(0, 3, 0);
scene.add(topLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.15);
scene.add(ambientLight);

// =========================
// Dust Particles
// =========================
const dustGeometry = new THREE.BufferGeometry();
const dustCount = 120;
const dustPositions = [];
for (let i = 0; i < dustCount; i++) {
    dustPositions.push((Math.random() - 0.5) * 10);
    dustPositions.push((Math.random() - 0.5) * 5);
    dustPositions.push((Math.random() - 0.5) * 10);
}
dustGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dustPositions, 3));
const dustMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.02, transparent: true, opacity: 0.25 });
const dustParticles = new THREE.Points(dustGeometry, dustMaterial);
scene.add(dustParticles);

// =========================
// Load HDRI, then Model
// =========================
let model;
const rgbeLoader = new THREE.RGBELoader();
rgbeLoader.setPath('./assets/'); // Change to your HDRI folder
rgbeLoader.load('studio_small_03_4k.hdr', function (texture) {
    texture.mapping = THREE.EquirectangularReflectionMapping;

    // Keep black background but still use HDRI for reflections
    scene.environment = texture;

    // Now load the model
    const loader = new THREE.GLTFLoader();
    loader.load('./assets/desert_eagle/scene.gltf', 
        (gltf) => {
            model = gltf.scene;

            // Center model
            const box = new THREE.Box3().setFromObject(model);
            const center = new THREE.Vector3();
            box.getCenter(center);
            model.position.sub(center);
            model.scale.set(2.2, 2.2, 2.2);
            model.position.y = -1;
            model.rotation.y = 0.8;

            // Apply shadows & envMap
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    if (child.material && 'envMap' in child.material) {
                        child.material.envMapIntensity = 0;
                        child.material.needsUpdate = true;
                    }
                }
            });

            scene.add(model);
        },
        undefined,
        (error) => console.error('Error loading model:', error)
    );
});

// =========================
// Post-processing
// =========================
const composer = new THREE.EffectComposer(renderer);
composer.addPass(new THREE.RenderPass(scene, camera));

const bloomPass = new THREE.UnrealBloomPass(
    new THREE.Vector2(container.clientWidth, container.clientHeight).multiplyScalar(0.6),
    0.7,
    0.3,
    0.8
);
composer.addPass(bloomPass);

const bokehPass = new THREE.BokehPass(scene, camera, {
    focus: 3.0,
    aperture: 0.00012,
    maxblur: 0.006
});
composer.addPass(bokehPass);

// =========================
// Interaction
// =========================
let mouseX = 0, mouseY = 0;
document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (event.clientY / window.innerHeight - 0.5) * 2;
});

// =========================
// - Animation Loop
// =========================
function animate() {
    requestAnimationFrame(animate);

    // Flicker rim light
    rimLight.intensity = 1.5 + Math.sin(Date.now() * 0.005) * 0.5;

    // Smooth camera follow
    camera.position.lerp(new THREE.Vector3(mouseX * 0.5, -mouseY * 0.2, 3), 0.08);
    camera.lookAt(0, 0, 0);

    // Gentle model sway (only if loaded)
    if (model) {
        model.rotation.y += 0.0005;
        model.rotation.x = Math.sin(Date.now() * 0.0006) * 0.015;
        model.position.y = -1 + Math.sin(Date.now() * 0.0004) * 0.005;
    }

    // Move dust slowly
    dustParticles.rotation.y += 0.0005;

    composer.render();
}
animate();

// =========================
// Resize Handling
// =========================
window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
    composer.setSize(container.clientWidth, container.clientHeight);
});
