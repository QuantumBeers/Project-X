import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// 🌍 Core Scene Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 🎮 Camera Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 50;
controls.maxDistance = 500;
controls.autoRotate = false;
controls.enablePan = false;
controls.mouseButtons = {
  LEFT: THREE.MOUSE.LEFT,
  MIDDLE: THREE.MOUSE.MIDDLE,
  RIGHT: THREE.MOUSE.RIGHT
};
camera.position.set(0, 100, 200);
controls.update();

// 🔲 Create Cube Container
const cubeSize = 100;
const cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0x444444, wireframe: true });
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
cube.position.y = 100; // Elevate above ground
scene.add(cube);

// 🌌 Particle System (World-Space, dispersing)
const numParticles = 500;
const particleRadius = 1;
const boundarySize = 10; // collision distance between "free" particles
const particleGeometry = new THREE.BufferGeometry();
const positions = new Float32Array(numParticles * 3);
const velocities = new Float32Array(numParticles * 3).fill(0);
const gravity = new THREE.Vector3(0, -0.2, 0); // constant gravity in world space

for (let i = 0; i < numParticles; i++) {
  positions[i * 3] = (Math.random() - 0.5) * cubeSize;
  positions[i * 3 + 1] = (Math.random() - 0.5) * cubeSize;
  positions[i * 3 + 2] = (Math.random() - 0.5) * cubeSize;
}

particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const particleMaterial = new THREE.PointsMaterial({ color: 0x00aaff, size: particleRadius });
const particles = new THREE.Points(particleGeometry, particleMaterial);
scene.add(particles);

// 🌌 Particle System (Inside the Cube)
const numCubeParticles = 500;
const cubeParticleGeometry = new THREE.BufferGeometry();
const cubePositions = new Float32Array(numCubeParticles * 3);
const cubeVelocities = new Float32Array(numCubeParticles * 3).fill(0);

for (let i = 0; i < numCubeParticles; i++) {
  cubePositions[i * 3] = (Math.random() - 0.5) * cubeSize;
  cubePositions[i * 3 + 1] = (Math.random() - 0.5) * cubeSize;
  cubePositions[i * 3 + 2] = (Math.random() - 0.5) * cubeSize;
}

cubeParticleGeometry.setAttribute('position', new THREE.BufferAttribute(cubePositions, 3));
const cubeParticleMaterial = new THREE.PointsMaterial({ color: 0xff0000, size: particleRadius });
const cubeParticles = new THREE.Points(cubeParticleGeometry, cubeParticleMaterial);
cube.add(cubeParticles);

// 🎬 Animation Loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();

  // (1) Update free particles (world space)
  const positionsArray = particleGeometry.attributes.position.array;
  for (let i = 0; i < numParticles; i++) {
    const index = i * 3;

    // Gravity
    velocities[index]     += gravity.x;
    velocities[index + 1] += gravity.y;
    velocities[index + 2] += gravity.z;

    positionsArray[index]     += velocities[index];
    positionsArray[index + 1] += velocities[index + 1];
    positionsArray[index + 2] += velocities[index + 2];

    // Ground collision
    if (positionsArray[index + 1] < 0) {
      positionsArray[index + 1] = 0;
      velocities[index + 1] *= -0.5;
    }

    // Particle-particle collision
    for (let k = 0; k < numParticles; k++) {
      if (k === i) continue;
      const kIndex = k * 3;
      const dx = positionsArray[index] - positionsArray[kIndex];
      const dy = positionsArray[index + 1] - positionsArray[kIndex + 1];
      const dz = positionsArray[index + 2] - positionsArray[kIndex + 2];
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (distance < boundarySize) {
        const overlap = boundarySize - distance;
        const direction = new THREE.Vector3(dx, dy, dz).normalize();
        positionsArray[index]     += (direction.x * overlap) / 2;
        positionsArray[index + 1] += (direction.y * overlap) / 2;
        positionsArray[index + 2] += (direction.z * overlap) / 2;
        positionsArray[kIndex]     -= (direction.x * overlap) / 2;
        positionsArray[kIndex + 1] -= (direction.y * overlap) / 2;
        positionsArray[kIndex + 2] -= (direction.z * overlap) / 2;
      }
    }
  }
  particleGeometry.attributes.position.needsUpdate = true;

  // (2) Update particles inside the cube (local space)
  const cubePositionsArray = cubeParticleGeometry.attributes.position.array;
  // Gravity in cube's local space:
  const transformedGravity = gravity.clone().applyQuaternion(cube.quaternion.clone().invert());

  for (let i = 0; i < numCubeParticles; i++) {
    const index = i * 3;

    cubeVelocities[index]     += transformedGravity.x;
    cubeVelocities[index + 1] += transformedGravity.y;
    cubeVelocities[index + 2] += transformedGravity.z;

    cubePositionsArray[index]     += cubeVelocities[index];
    cubePositionsArray[index + 1] += cubeVelocities[index + 1];
    cubePositionsArray[index + 2] += cubeVelocities[index + 2];

    // Collision with local cube boundaries
    for (let j = 0; j < 3; j++) {
      if (cubePositionsArray[index + j] > cubeSize / 2 - particleRadius) {
        cubePositionsArray[index + j] = cubeSize / 2 - particleRadius;
        cubeVelocities[index + j] *= -0.5;
      }
      if (cubePositionsArray[index + j] < -cubeSize / 2 + particleRadius) {
        cubePositionsArray[index + j] = -cubeSize / 2 + particleRadius;
        cubeVelocities[index + j] *= -0.5;
      }
    }

    // Particle-particle collision (inside cube)
    for (let k = 0; k < numCubeParticles; k++) {
      if (k === i) continue;
      const kIndex = k * 3;
      const dx = cubePositionsArray[index] - cubePositionsArray[kIndex];
      const dy = cubePositionsArray[index + 1] - cubePositionsArray[kIndex + 1];
      const dz = cubePositionsArray[index + 2] - cubePositionsArray[kIndex + 2];
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (distance < boundarySize) {
        const overlap = boundarySize - distance;
        const direction = new THREE.Vector3(dx, dy, dz).normalize();
        cubePositionsArray[index]     += (direction.x * overlap) / 2;
        cubePositionsArray[index + 1] += (direction.y * overlap) / 2;
        cubePositionsArray[index + 2] += (direction.z * overlap) / 2;
        cubePositionsArray[kIndex]     -= (direction.x * overlap) / 2;
        cubePositionsArray[kIndex + 1] -= (direction.y * overlap) / 2;
        cubePositionsArray[kIndex + 2] -= (direction.z * overlap) / 2;
      }
    }
  }
  cubeParticleGeometry.attributes.position.needsUpdate = true;

  renderer.render(scene, camera);
}
animate();

// 📏 Resize Handler
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// 🎯 Raycaster Setup + Pointer Events
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let isDragging = false;
let prevMouseX = 0;
let prevMouseY = 0;
// If you want to scale rotation speed, tweak this:
const rotationSpeed = 0.01;

// 🖱️ onPointerDown: Check if the click is on the cube
function onPointerDown(event) {
  // Convert to normalized device coords: [-1,1]
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
  
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(cube, false);

  if (intersects.length > 0) {
    // The user clicked on the cube
    isDragging = true;
    prevMouseX = event.clientX;
    prevMouseY = event.clientY;
    
    // Optionally disable OrbitControls while dragging
    controls.enabled = false;
  }
}

// 🏃 onPointerMove: Rotate the cube if dragging
function onPointerMove(event) {
  if (!isDragging) return;

  const deltaX = event.clientX - prevMouseX;
  const deltaY = event.clientY - prevMouseY;

  // Rotate the cube:
  cube.rotation.y += deltaX * rotationSpeed;
  cube.rotation.x += deltaY * rotationSpeed;

  // Track the new last position
  prevMouseX = event.clientX;
  prevMouseY = event.clientY;
}

// 🖐️ onPointerUp: Release drag
function onPointerUp() {
  isDragging = false;
  controls.enabled = true; // re-enable OrbitControls
}

// Add event listeners
window.addEventListener('pointerdown', onPointerDown);
window.addEventListener('pointermove', onPointerMove);
window.addEventListener('pointerup', onPointerUp);
