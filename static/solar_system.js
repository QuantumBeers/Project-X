import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

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

/**
 * G ~ 39.478... in units of:
 *    AU (distance), years (time), solar masses (mass)
 *
 * We'll scale 1 AU -> ~300 "scene units" so everything fits on-screen nicely.
 */
const G = 39.47841760435743;
const solarMass = 1;

let previousTime = performance.now();
// Increase timeScale if you want faster orbits
const timeScale = 200;

// 1 AU => 300 "scene units"
const distanceScale = 200;
// Artificially enlarge planets so they're visible
const planetSizeScale = 2;

// --------------------------------------------------------------------------------
//  Planet Data
//  "inclination" is the tilt (in degrees) relative to Earth's orbital plane (~0°).
//   Approximations from NASA data (some rounding).
// --------------------------------------------------------------------------------
const planetData = [
  // name,   semi-major axis (AU), eccentricity, color,    radius(km), inclination(deg)
  { name: 'Mercury', a: 0.39,   e: 0.2056, color: 0xaaaaaa, radius: 2440,  inclination: 7.0 },
  { name: 'Venus',   a: 0.723,  e: 0.0068, color: 0xffff99, radius: 6052,  inclination: 3.39 },
  { name: 'Earth',   a: 1.0,    e: 0.0167, color: 0x0055ff, radius: 6371,  inclination: 0.0 , texture: 'assets.solar_system.planets.8081_earthmap10k.jpg'},
  { name: 'Mars',    a: 1.524,  e: 0.0934, color: 0xff3300, radius: 3390,  inclination: 1.85 },
  { name: 'Jupiter', a: 5.203,  e: 0.0489, color: 0xff9933, radius: 69911, inclination: 1.303 },
  { name: 'Saturn',  a: 9.537,  e: 0.0539, color: 0xffff33, radius: 58232, inclination: 2.488 },
  { name: 'Uranus',  a: 19.191, e: 0.0473, color: 0x99ffff, radius: 25362, inclination: 0.77 },
  { name: 'Neptune', a: 30.069, e: 0.0086, color: 0x3399ff, radius: 24622, inclination: 1.77 },
];

// --------------------------------------------------------------------------------
//  Create Each Planet & Orbit Visualization
// --------------------------------------------------------------------------------
const planets = [];

planetData.forEach((p) => {
  // Orbit group (centered on the Sun) – contains the planet mesh & orbit ring
  const orbitGroup = new THREE.Group();
  scene.add(orbitGroup);

  // Planet sphere
  const planetRadius = (p.radius / 6371) * planetSizeScale; 
  const geom = new THREE.SphereGeometry(planetRadius, 32, 32);
  let mat;

  if (p.texture) {
        // Convert "assets.solar_system.planets.8081_earthmap10k.jpg" to "assets/solar_system/planets/8081_earthmap10k.jpg"
    function resolveTexturePath(dotPath) {
      const parts = dotPath.split('.');
      const ext = parts.pop(); // e.g., 'jpg'
      const filename = parts.pop(); // e.g., '8081_earthmap10k'
      const path = parts.join('/'); // folder path
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

  // Convert inclination to radians and rotate the entire orbit group
  const incRad = THREE.MathUtils.degToRad(p.inclination);
  orbitGroup.rotation.x = incRad;

  // Start at some random angle so they aren't all aligned
  const initialAngle = Math.random() * Math.PI * 2;

  // Compute the planet’s initial distance r(θ) for that angle
  const r0 = (p.a * (1 - p.e ** 2)) / (1 + p.e * Math.cos(initialAngle));
  const x0 = r0 * distanceScale * Math.cos(initialAngle);
  const z0 = r0 * distanceScale * Math.sin(initialAngle);

  // Place the planet in local XZ-plane (remember the group is rotated)
  mesh.position.set(x0, 0, z0);

  // Create a faint orbit ring so you can see the path
  const orbitRing = createOrbitRing(p.a, p.e, distanceScale);
  // The ring is drawn in the group's local XZ-plane
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

/**
 * Creates a simple elliptical ring for the orbit in the local XZ-plane.
 * We'll place it in orbitGroup's local coordinates, then orbitGroup.rotation.x
 * tilts it so it appears inclined in world space.
 */
function createOrbitRing(a, e, distanceScale) {
  const segments = 256;
  const points = [];

  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * 2 * Math.PI;
    // r(θ) = a(1 - e^2) / [1 + e cos(θ)]
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
  // r(θ) = a(1-e^2)/(1 + e cos θ)
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

  // Convert deltaMs -> fraction of a year, applying our timeScale
  const deltaYears = (deltaMs / 31557600) * timeScale;

  // Update each planet's orbital angle
  for (const planet of planets) {
    const v = getOrbitalVelocity(planet.orbitAngle, planet.a, planet.e); // AU/year
    // distance from the sun at the current angle
    const r = (planet.a * (1 - planet.e ** 2)) / (1 + planet.e * Math.cos(planet.orbitAngle));
    // dθ = (v / r) * dt
    planet.orbitAngle += (v / r) * deltaYears;

    // Recompute local XZ coords
    const scaledR = r * distanceScale;
    const x = scaledR * Math.cos(planet.orbitAngle);
    const z = scaledR * Math.sin(planet.orbitAngle);

    // Move planet (in orbitGroup local coords)
    planet.mesh.position.set(x, 0, z);

    // Spin the planet a bit on its axis
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
  
  // 1) Create a simple <select> in the DOM
  const select = document.createElement('select');
  select.style.position = 'absolute';
  select.style.top = '10px';
  select.style.left = '10px';
  
  // Add an option for the Sun
  let option = document.createElement('option');
  option.value = 'Sun';
  option.textContent = 'Sun';
  select.appendChild(option);
  
  // Add an option for each planet
  for (const p of planets) {
    option = document.createElement('option');
    option.value = p.name;
    option.textContent = p.name;
    select.appendChild(option);
  }
  
  // When user changes selection, focus on that planet
  select.addEventListener('change', () => {
    focusOnBody(select.value);
  });
  
  document.body.appendChild(select);
  
  /**
   * Focus camera/controls on the chosen celestial body by name.
   * - If "Sun" is chosen, we point controls.target at (0,0,0).
   * - If a planet is chosen, we get its world position and update `controls.target`.
   * - We optionally reposition camera to keep a nice distance from the target.
   */
  function focusOnBody(name) {
    if (name === 'Sun') {
      // Reset to Sun at origin
      controls.target.set(0, 0, 0);
  
      // Optionally reposition camera a bit
      camera.position.set(0, 300, 1000);
    } else {
      // Find that planet
      const planet = planets.find((p) => p.name === name);
      if (!planet) return;
  
      // We need the planet's world position, which is the orbitGroup's global transform
      // plus the planet mesh local position. We can get it via getWorldPosition().
      const worldPos = new THREE.Vector3();
      planet.mesh.getWorldPosition(worldPos);
  
      // Move controls target to that position
      controls.target.copy(worldPos);
  
      // Optionally offset the camera so we're not inside the planet
      // e.g., just move the camera "back" some distance from the target.
      const offset = 200; // or planet radius * 10, etc.
      camera.position.set(
        worldPos.x + offset,
        worldPos.y + offset,
        worldPos.z + offset
      );
    }
  
    // Without this, controls won't immediately update
    controls.update();
  }