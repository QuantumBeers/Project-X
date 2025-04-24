import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// ──────────────────────────────────────────────────────────────────────
// 1) SCENE SETUP
// ──────────────────────────────────────────────────────────────────────
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(0, 100, 200);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Orbit Controls
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
controls.update();

// A wireframe cube to act as a container
const cubeSize = 100;
const cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
cube.position.y = 100;
scene.add(cube);

// ──────────────────────────────────────────────────────────────────────
// 2) PARTICLE SETUP
// ──────────────────────────────────────────────────────────────────────
const numParticles = 500;       // free-floating in the scene
const numCubeParticles = 1000;   // inside the cube
const particleRadius = 1;
const boundarySize = 10;        // collision boundary distance
const neighborRadius = 8;       // how close neighbors must be for smoothing
const friction = 0.9;          // mild friction
const gravity = new THREE.Vector3(0, -0.2, 0);

// Create a Points geometry/material for free-floating particles
const particleGeometry = new THREE.BufferGeometry();
const positions = new Float32Array(numParticles * 3);
const velocities = new Float32Array(numParticles * 3).fill(0);

for (let i = 0; i < numParticles; i++) {
  positions[i * 3]     = (Math.random() - 0.5) * cubeSize;
  positions[i * 3 + 1] = Math.random() * 50 + 50; // start above ground
  positions[i * 3 + 2] = (Math.random() - 0.5) * cubeSize;
}

// A watery material (blueish), optionally semi-transparent:
const particleMaterial = new THREE.PointsMaterial({
  color: 0x00aaff,
  size: particleRadius,
  // transparent: true,
  // opacity: 0.7
});

particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const particles = new THREE.Points(particleGeometry, particleMaterial);
scene.add(particles);

// Create a Points geometry/material for the cube-bound particles
const cubeParticleGeometry = new THREE.BufferGeometry();
const cubePositions = new Float32Array(numCubeParticles * 3);
const cubeVelocities = new Float32Array(numCubeParticles * 3).fill(0);

for (let i = 0; i < numCubeParticles; i++) {
  cubePositions[i * 3]     = (Math.random() - 0.5) * cubeSize * 0.8;
  cubePositions[i * 3 + 1] = (Math.random() - 0.5) * cubeSize * 0.8;
  cubePositions[i * 3 + 2] = (Math.random() - 0.5) * cubeSize * 0.8;
}

const cubeParticleMaterial = new THREE.PointsMaterial({
  color: 0x00aaff,
  size: particleRadius,
  // transparent: true,
  // opacity: 0.7
});
cubeParticleGeometry.setAttribute('position', new THREE.BufferAttribute(cubePositions, 3));
const cubeParticles = new THREE.Points(cubeParticleGeometry, cubeParticleMaterial);
cube.add(cubeParticles);

// We'll store neighbor relationships each frame
const neighborMapFree = Array.from({ length: numParticles }, () => []);
const neighborMapCube = Array.from({ length: numCubeParticles }, () => []);

// ──────────────────────────────────────────────────────────────────────
// 3) UTILITIES
// ──────────────────────────────────────────────────────────────────────
function lengthSq(dx, dy, dz) {
  return dx * dx + dy * dy + dz * dz;
}

// Naive O(n^2) neighbor search (you could optimize with a grid)
function findNeighbors(posArray, neighborMap, count, radius) {
  for (let i = 0; i < count; i++) {
    neighborMap[i].length = 0;
  }
  const r2 = radius * radius;
  for (let i = 0; i < count; i++) {
    const ix = i * 3;
    for (let j = i + 1; j < count; j++) {
      const jx = j * 3;
      const dx = posArray[ix]   - posArray[jx];
      const dy = posArray[ix+1] - posArray[jx+1];
      const dz = posArray[ix+2] - posArray[jx+2];
      const dist2 = lengthSq(dx, dy, dz);
      if (dist2 < r2) {
        neighborMap[i].push(j);
        neighborMap[j].push(i);
      }
    }
  }
}

// A simple collision pass that includes gravity, ground bounce, pairwise push-out
function collisionPass(posArray, velArray, count, boundary, applyGround = true) {
  // 1) gravity + integrate
  for (let i = 0; i < count; i++) {
    const ix = i * 3;
    velArray[ix]     += gravity.x;
    velArray[ix + 1] += gravity.y;
    velArray[ix + 2] += gravity.z;

    posArray[ix]     += velArray[ix];
    posArray[ix + 1] += velArray[ix + 1];
    posArray[ix + 2] += velArray[ix + 2];

    // ground bounce
    if (applyGround && posArray[ix + 1] < 0) {
      posArray[ix + 1] = 0;
      velArray[ix + 1] *= -0.5;
    }
  }

  // 2) pairwise collision
  const boundarySq = boundary * boundary;
  for (let i = 0; i < count; i++) {
    const ix = i * 3;
    for (let j = i + 1; j < count; j++) {
      const jx = j * 3;
      const dx = posArray[ix]   - posArray[jx];
      const dy = posArray[ix+1] - posArray[jx+1];
      const dz = posArray[ix+2] - posArray[jx+2];
      const dist2 = dx*dx + dy*dy + dz*dz;
      if (dist2 < boundarySq && dist2 > 0.000001) {
        const dist = Math.sqrt(dist2);
        const overlap = boundary - dist;
        const nx = dx / dist;
        const ny = dy / dist;
        const nz = dz / dist;

        // push out
        const push = 0.5 * overlap;
        posArray[ix]   += nx * push;
        posArray[ix+1] += ny * push;
        posArray[ix+2] += nz * push;

        posArray[jx]   -= nx * push;
        posArray[jx+1] -= ny * push;
        posArray[jx+2] -= nz * push;

        // friction
        velArray[ix]   *= friction;
        velArray[ix+1] *= friction;
        velArray[ix+2] *= friction;

        velArray[jx]   *= friction;
        velArray[jx+1] *= friction;
        velArray[jx+2] *= friction;
      }
    }
  }
}

// If inside cube, clamp the positions so they don't escape
function clampInsideCube(posArray, velArray, count, radius) {
  const half = cubeSize * 0.5;
  for (let i = 0; i < count; i++) {
    const ix = i * 3;
    for (let c = 0; c < 3; c++) {
      const idx = ix + c;
      if (posArray[idx] > half - radius) {
        posArray[idx] = half - radius;
        velArray[idx] *= -0.5;
      } else if (posArray[idx] < -half + radius) {
        posArray[idx] = -half + radius;
        velArray[idx] *= -0.5;
      }
    }
  }
}

// ──────────────────────────────────────────────────────────────────────
// 4) SMOOTHING STEP (the "watery" trick)
// ──────────────────────────────────────────────────────────────────────
// We move each particle a little toward the average position of its neighbors.
function neighborSmooth(posArray, velArray, neighborMap, count, smoothFactor) {
  // We'll store new positions in a temp array so we don't affect the averaging mid-pass.
  const newPositions = new Float32Array(posArray.length);
  newPositions.set(posArray);

  for (let i = 0; i < count; i++) {
    const neighs = neighborMap[i];
    if (neighs.length === 0) continue; // no neighbors, skip
    const ix = i * 3;

    let avgx = 0, avgy = 0, avgz = 0;
    for (let n of neighs) {
      const jx = n * 3;
      avgx += posArray[jx];
      avgy += posArray[jx + 1];
      avgz += posArray[jx + 2];
    }
    avgx /= neighs.length;
    avgy /= neighs.length;
    avgz /= neighs.length;

    // Lerp from current position -> neighbor avg
    newPositions[ix]     = THREE.MathUtils.lerp(posArray[ix],     avgx, smoothFactor);
    newPositions[ix + 1] = THREE.MathUtils.lerp(posArray[ix + 1], avgy, smoothFactor);
    newPositions[ix + 2] = THREE.MathUtils.lerp(posArray[ix + 2], avgz, smoothFactor);

    // (Optional) If you want the velocity to reflect the smoothing, you might:
    // velArray[ix]   += (newPositions[ix]   - posArray[ix]);
    // velArray[ix+1] += (newPositions[ix+1] - posArray[ix+1]);
    // velArray[ix+2] += (newPositions[ix+2] - posArray[ix+2]);
  }
  // Copy back
  posArray.set(newPositions);
}

// ──────────────────────────────────────────────────────────────────────
// 5) ANIMATION LOOP
// ──────────────────────────────────────────────────────────────────────
function animate() {
  requestAnimationFrame(animate);
  controls.update();

  // FREE-FLOATING PARTICLES
  const freePos = particleGeometry.attributes.position.array;
  collisionPass(freePos, velocities, numParticles, boundarySize, true);
  findNeighbors(freePos, neighborMapFree, numParticles, neighborRadius);

  // "Water smoothing": gently move each particle toward average of its neighbors
  neighborSmooth(freePos, velocities, neighborMapFree, numParticles, 0.1);

  // update position buffer
  particleGeometry.attributes.position.needsUpdate = true;

  // INSIDE-CUBE PARTICLES
  const cubePos = cubeParticleGeometry.attributes.position.array;

  // Apply local gravity (relative to the cube's rotation)
  const localGravity = gravity.clone().applyQuaternion(cube.quaternion.clone().invert());
  for (let i = 0; i < numCubeParticles; i++) {
    const ix = i * 3;
    cubeVelocities[ix]     += localGravity.x;
    cubeVelocities[ix + 1] += localGravity.y;
    cubeVelocities[ix + 2] += localGravity.z;

    // integrate
    cubePos[ix]     += cubeVelocities[ix];
    cubePos[ix + 1] += cubeVelocities[ix + 1];
    cubePos[ix + 2] += cubeVelocities[ix + 2];
  }

  // clamp inside the cube
  clampInsideCube(cubePos, cubeVelocities, numCubeParticles, particleRadius);

  // collision among themselves
  findNeighbors(cubePos, neighborMapCube, numCubeParticles, neighborRadius);
  // For "collision inside cube," do a simpler pass:
  // we won't do ground bounce, but we do push-out
  for (let i = 0; i < numCubeParticles; i++) {
    for (let j = i + 1; j < numCubeParticles; j++) {
      const ix = i * 3;
      const jx = j * 3;
      const dx = cubePos[ix]   - cubePos[jx];
      const dy = cubePos[ix+1] - cubePos[jx+1];
      const dz = cubePos[ix+2] - cubePos[jx+2];
      const dist2 = dx*dx + dy*dy + dz*dz;
      if (dist2 < boundarySize*boundarySize && dist2 > 0) {
        const dist = Math.sqrt(dist2);
        const overlap = boundarySize - dist;
        const nx = dx / dist;
        const ny = dy / dist;
        const nz = dz / dist;
        const push = 0.5 * overlap;

        cubePos[ix]   += nx * push;
        cubePos[ix+1] += ny * push;
        cubePos[ix+2] += nz * push;

        cubePos[jx]   -= nx * push;
        cubePos[jx+1] -= ny * push;
        cubePos[jx+2] -= nz * push;

        // friction
        cubeVelocities[ix]   *= friction;
        cubeVelocities[ix+1] *= friction;
        cubeVelocities[ix+2] *= friction;
        cubeVelocities[jx]   *= friction;
        cubeVelocities[jx+1] *= friction;
        cubeVelocities[jx+2] *= friction;
      }
    }
  }

  // "Water smoothing" for inside-cube
  neighborSmooth(cubePos, cubeVelocities, neighborMapCube, numCubeParticles, 0.1);

  cubeParticleGeometry.attributes.position.needsUpdate = true;

  // RENDER
  renderer.render(scene, camera);
}
animate();

// ──────────────────────────────────────────────────────────────────────
// 6) RESIZE & DRAG-ROTATE
// ──────────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Dragging the cube
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let isDragging = false;
let prevMouseX = 0;
let prevMouseY = 0;
const rotationSpeed = 0.01;

function onPointerDown(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
  
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(cube, false);
  if (intersects.length > 0) {
    isDragging = true;
    prevMouseX = event.clientX;
    prevMouseY = event.clientY;
    controls.enabled = false;
  }
}

function onPointerMove(event) {
  if (!isDragging) return;
  const deltaX = event.clientX - prevMouseX;
  const deltaY = event.clientY - prevMouseY;

  cube.rotation.y += deltaX * rotationSpeed;
  cube.rotation.x += deltaY * rotationSpeed;

  prevMouseX = event.clientX;
  prevMouseY = event.clientY;
}

function onPointerUp() {
  isDragging = false;
  controls.enabled = true;
}

window.addEventListener('pointerdown', onPointerDown);
window.addEventListener('pointermove', onPointerMove);
window.addEventListener('pointerup', onPointerUp);
