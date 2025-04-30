import * as THREE from './js/three.module.js';
import { OrbitControls } from './js/OrbitControls.js';

// --------------------------------------------------------------------------------
//  Basic Scene, Camera, Renderer
// --------------------------------------------------------------------------------
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  200000 // Make far plane large enough for outer planets
);
camera.position.set(0, 300, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const textureLoader = new THREE.TextureLoader();

// --------------------------------------------------------------------------------
//  OrbitControls
// --------------------------------------------------------------------------------
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.autoRotate = false;
controls.autoRotateSpeed = 0.2;
controls.update();

// --------------------------------------------------------------------------------
//  Sun at the Origin
// --------------------------------------------------------------------------------
const sunGeometry = new THREE.SphereGeometry(50, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sunMesh);

// --------------------------------------------------------------------------------
//  Lighting (PointLight at the Sun)
// --------------------------------------------------------------------------------
const pointLight = new THREE.PointLight(0xffffff, 2, 999999);
pointLight.position.set(0, 0, 0);
scene.add(pointLight);

// --------------------------------------------------------------------------------
//  Physics / Scaling Setup
// --------------------------------------------------------------------------------
const G = 39.47841760435743;
const solarMass = 1;

let previousTime = performance.now();
const timeScale = 200;
const distanceScale = 200;
const planetSizeScale = 2;

// --------------------------------------------------------------------------------
//  Planet Data
// --------------------------------------------------------------------------------
const planetData = [
  { name: 'Mercury', a: 0.39, e: 0.2056, color: 0xaaaaaa, radius: 2440, inclination: 7.0, texture: 'assets.solar_system.planets.mercury.8k_mercury.jpg' },
  { name: 'Venus', a: 0.723, e: 0.0068, color: 0xffff99, radius: 6052, inclination: 3.39, texture: 'assets.solar_system.planets.venus.8k_venus_surface.jpg' },
  { name: 'Earth', a: 1.0, e: 0.0167, color: 0x0055ff, radius: 6371, inclination: 0.0, texture: 'assets.solar_system.planets.earth.8081_earthmap10k.jpg' },
  { name: 'Mars', a: 1.524, e: 0.0934, color: 0xff3300, radius: 3390, inclination: 1.85, texture: 'assets.solar_system.planets.mars.8k_mars.jpg' },
  { name: 'Jupiter', a: 5.203, e: 0.0489, color: 0xff9933, radius: 69911, inclination: 1.303, texture: 'assets.solar_system.planets.jupiter.8k_jupiter.jpg' },
  { name: 'Saturn', a: 9.537, e: 0.0539, color: 0xffff33, radius: 58232, inclination: 2.488, texture: 'assets.solar_system.planets.saturn.8k_saturn.jpg' },
  { name: 'Uranus', a: 19.191, e: 0.0473, color: 0x99ffff, radius: 25362, inclination: 0.77, texture: 'assets.solar_system.planets.uranus.2k_uranus.jpg' },
  { name: 'Neptune', a: 30.069, e: 0.0086, color: 0x3399ff, radius: 24622, inclination: 1.77, texture: 'assets.solar_system.planets.neptune.2k_neptune.jpg' },
];

// --------------------------------------------------------------------------------
//  Create Each Planet & Orbit Visualization
// --------------------------------------------------------------------------------
const planets = [];

planetData.forEach((p) => {
  const orbitGroup = new THREE.Group();
  scene.add(orbitGroup);

  const planetRadius = (p.radius / 6371) * planetSizeScale;
  const geom = new THREE.SphereGeometry(planetRadius, 32, 32);
  let mat;

  if (p.texture) {
    function resolveTexturePath(dotPath) {
      const parts = dotPath.split('.');
      const ext = parts.pop();
      const filename = parts.pop();
      const path = parts.join('/');
      return `${path}/${filename}.${ext}`;
    }

    const resolvedPath = resolveTexturePath(p.texture);
    const tex = textureLoader.load(resolvedPath);

    mat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 1,
      metalness: 0,
    });
  } else {
    mat = new THREE.MeshStandardMaterial({ color: p.color });
  }

  const mesh = new THREE.Mesh(geom, mat);
  orbitGroup.add(mesh);

  const incRad = THREE.MathUtils.degToRad(p.inclination);
  orbitGroup.rotation.x = incRad;

  const initialAngle = Math.random() * Math.PI * 2;
  const r0 = (p.a * (1 - p.e ** 2)) / (1 + p.e * Math.cos(initialAngle));
  const x0 = r0 * distanceScale * Math.cos(initialAngle);
  const z0 = r0 * distanceScale * Math.sin(initialAngle);

  mesh.position.set(x0, 0, z0);

  const orbitRing = createOrbitRing(p.a, p.e, distanceScale);
  orbitGroup.add(orbitRing);

  planets.push({
    name: p.name,
    a: p.a,
    e: p.e,
    inclination: incRad,
    orbitAngle: initialAngle,
    mesh,
  });
});

function createOrbitRing(a, e, distanceScale) {
  const segments = 256;
  const points = [];

  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * 2 * Math.PI;
    const r = (a * (1 - e * e)) / (1 + e * Math.cos(theta));
    const x = r * distanceScale * Math.cos(theta);
    const z = r * distanceScale * Math.sin(theta);
    points.push(new THREE.Vector3(x, 0, z));
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color: 0xffffff,
    opacity: 0.3,
    transparent: true,
  });
  return new THREE.LineLoop(geometry, material);
}

// --------------------------------------------------------------------------------
//  Vis-Viva: v(θ) = sqrt( G * M_sun * (2/r - 1/a) )
// --------------------------------------------------------------------------------
function getOrbitalVelocity(angle, a, e) {
  const r = (a * (1 - e * e)) / (1 + e * Math.cos(angle));
  return Math.sqrt(G * solarMass * (2 / r - 1 / a));
}

// --------------------------------------------------------------------------------
//  Animation Loop
// --------------------------------------------------------------------------------
function animate() {
  requestAnimationFrame(animate);

  const currentTime = performance.now();
  const deltaMs = currentTime - previousTime;
  previousTime = currentTime;

  const deltaYears = (deltaMs / 31557600) * timeScale;

  for (const planet of planets) {
    const v = getOrbitalVelocity(planet.orbitAngle, planet.a, planet.e);
    const r = (planet.a * (1 - planet.e ** 2)) / (1 + planet.e * Math.cos(planet.orbitAngle));
    planet.orbitAngle += (v / r) * deltaYears;

    const scaledR = r * distanceScale;
    const x = scaledR * Math.cos(planet.orbitAngle);
    const z = scaledR * Math.sin(planet.orbitAngle);

    planet.mesh.position.set(x, 0, z);
    planet.mesh.rotation.y += 0.02;
  }

  controls.update();
  renderer.render(scene, camera);
}
animate();

// --------------------------------------------------------------------------------
//  Handle Window Resize
// --------------------------------------------------------------------------------
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --------------------------------------------------------------------------------
//  UI: Dropdown to focus camera on a chosen planet or the Sun
// --------------------------------------------------------------------------------
const select = document.createElement('select');
select.style.position = 'absolute';
select.style.top = '10px';
select.style.left = '10px';

let option = document.createElement('option');
option.value = 'Sun';
option.textContent = 'Sun';
select.appendChild(option);

for (const p of planets) {
  option = document.createElement('option');
  option.value = p.name;
  option.textContent = p.name;
  select.appendChild(option);
}

select.addEventListener('change', () => {
  focusOnBody(select.value);
});

document.body.appendChild(select);

function focusOnBody(name) {
  if (name === 'Sun') {
    controls.target.set(0, 0, 0);
    camera.position.set(0, 300, 1000);
  } else {
    const planet = planets.find((p) => p.name === name);
    if (!planet) return;

    const worldPos = new THREE.Vector3();
    planet.mesh.getWorldPosition(worldPos);

    controls.target.copy(worldPos);

    const offset = 200;
    camera.position.set(
      worldPos.x + offset,
      worldPos.y + offset,
      worldPos.z + offset
    );
  }

  controls.update();
}