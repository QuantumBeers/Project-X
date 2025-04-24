import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// ───────────── Minimal 3D k-d Tree ─────────────
// (Same as the earlier snippet, but truncated or replaced with your kd-tree library)
class KDTree3D {
  constructor(points = []) {
    this.root = this.buildTree(points, 0);
  }
  buildTree(points, depth) {
    if (!points.length) return null;
    const axis = depth % 3;
    points.sort((a, b) => (axis===0? a.x-b.x : axis===1? a.y-b.y : a.z-b.z));
    const mid = Math.floor(points.length/2);
    return {
      point: points[mid],
      axis,
      left: this.buildTree(points.slice(0, mid), depth+1),
      right: this.buildTree(points.slice(mid+1), depth+1),
    };
  }
  neighborsWithin(node, target, radiusSq, result) {
    if (!node) return;
    const axis = node.axis;
    const valN = axis===0? node.point.x : axis===1? node.point.y : node.point.z;
    const valT = axis===0? target.x       : axis===1? target.y       : target.z;
    const dx = node.point.x - target.x;
    const dy = node.point.y - target.y;
    const dz = node.point.z - target.z;
    const distSq = dx*dx + dy*dy + dz*dz;
    if (distSq < radiusSq) result.push(node.point.index);
    const diff = valT - valN;
    const primary = diff < 0 ? node.left : node.right;
    const secondary = diff < 0 ? node.right: node.left;
    this.neighborsWithin(primary, target, radiusSq, result);
    if (diff*diff < radiusSq) {
      this.neighborsWithin(secondary, target, radiusSq, result);
    }
  }
  query(x, y, z, r2) {
    const out = [];
    this.neighborsWithin(this.root, {x, y, z}, r2, out);
    return out;
  }
}

// ───────────── SCENE SETUP ─────────────
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0, 150, 300);

const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.update();

// A rotating cube container
const cubeSize = 50;  // bigger container
const cubeGeo = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
const cubeMat = new THREE.MeshBasicMaterial({ color: 0x888888, wireframe: true });
const cube = new THREE.Mesh(cubeGeo, cubeMat);
cube.position.y = 0;
scene.add(cube);

// ───────────── PARTICLES + SHADER ─────────────
const numParticles = 800;
const positions = new Float32Array(numParticles * 3);
const velocities = new Float32Array(numParticles * 3).fill(0);
const temperatures = new Float32Array(numParticles);

// Random init
for (let i=0; i<numParticles; i++) {
  const ix = i*3;
  // start inside ±cubeSize/2
  positions[ix  ] = (Math.random()-0.5)*cubeSize*0.8;
  positions[ix+1] = (Math.random()-0.5)*cubeSize*0.8;
  positions[ix+2] = (Math.random()-0.5)*cubeSize*0.8;
  temperatures[i] = Math.random()*100;  // 0..100
}

// Buffers
const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setAttribute('aTemperature', new THREE.BufferAttribute(temperatures, 1));

const vertexShader = `
  attribute float aTemperature;
  varying float vTemperature;
  void main(){
    vTemperature = aTemperature;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = 5.0; 
  }
`;
const fragmentShader = `
  varying float vTemperature;
  void main(){
    float t = clamp(vTemperature / 100.0, 0.0, 1.0);
    // basic blue->red
    vec3 coldColor = vec3(0.0,0.0,1.0);
    vec3 hotColor  = vec3(1.0,0.0,0.0);
    vec3 color = mix(coldColor, hotColor, t);

    // round disc
    float dist = length(gl_PointCoord - vec2(0.5));
    if(dist>0.5) discard;

    gl_FragColor = vec4(color,1.0);
  }
`;
const mat = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader
});
const pointCloud = new THREE.Points(geometry, mat);
cube.add(pointCloud); // attach to the cube => positions are in cube-local space!

// ───────────── SIM PARAMS ─────────────
const friction = 0.8;
const collisionDistance = 3.0;
const neighborRadius = 8.0;
const gravity = new THREE.Vector3(0, -0.1, 0); // "world" down
const smoothingFactor = 0.1;
const buoyancyScale = 0.01; 
const midTemp = 50.0;  // above => rises, below => sinks

// ───────────── KD TREE UTILS ─────────────
let kdTree = null;
function buildKDTree() {
  const pts = [];
  for (let i=0; i<numParticles; i++){
    const ix = i*3;
    pts.push({ 
      x: positions[ix], 
      y: positions[ix+1], 
      z: positions[ix+2], 
      index:i 
    });
  }
  kdTree = new KDTree3D(pts);
}

// ───────────── MOUSE DRAG ROTATION ON CUBE ─────────────
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isDragging = false;
let prevMouseX=0, prevMouseY=0;
const rotSpeed = 0.01;

function onPointerDown(e){
  mouse.x = (e.clientX / window.innerWidth)*2-1;
  mouse.y = -(e.clientY / window.innerHeight)*2+1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(cube, false);
  if(intersects.length>0) {
    isDragging = true;
    prevMouseX = e.clientX;
    prevMouseY = e.clientY;
    controls.enabled = false;
  }
}
function onPointerMove(e){
  if(!isDragging) return;
  const dx = e.clientX - prevMouseX;
  const dy = e.clientY - prevMouseY;
  cube.rotation.y += dx*rotSpeed;
  cube.rotation.x += dy*rotSpeed;
  prevMouseX = e.clientX;
  prevMouseY = e.clientY;
}
function onPointerUp(){
  isDragging = false;
  controls.enabled = true;
}
window.addEventListener('pointerdown', onPointerDown);
window.addEventListener('pointermove', onPointerMove);
window.addEventListener('pointerup', onPointerUp);

// ───────────── ANIMATION LOOP ─────────────
function animate(){
  requestAnimationFrame(animate);
  controls.update();

  // 1) Build k-d tree
  buildKDTree();

  // 2) Compute local gravity
  // (We invert the cube's rotation so "down" is in the cube's local coords)
  const localG = gravity.clone().applyQuaternion(cube.quaternion.clone().invert());

  // 3) Physics update
  // For each particle:
  for(let i=0; i<numParticles; i++){
    const ix = i*3;
    // buoyancy
    const t = temperatures[i];
    const buoy = (t - midTemp)*buoyancyScale;  // positive => goes up, negative => down
    velocities[ix  ] += localG.x;
    velocities[ix+1 ] += localG.y + buoy; 
    velocities[ix+2 ] += localG.z;

    // integrate
    positions[ix  ] += velocities[ix  ];
    positions[ix+1 ] += velocities[ix+1 ];
    positions[ix+2 ] += velocities[ix+2 ];

    // clamp inside ±cubeSize/2
    for(let c=0; c<3; c++){
      const half = cubeSize*0.5;
      if(positions[ix+c] > half){
        positions[ix+c] = half;
        velocities[ix+c]*=-0.3;
      }
      if(positions[ix+c] < -half){
        positions[ix+c] = -half;
        velocities[ix+c]*=-0.3;
      }
    }

    // friction
    velocities[ix  ]*= friction;
    velocities[ix+1 ]*= friction;
    velocities[ix+2 ]*= friction;
  }

  // 4) Collisions via k-d tree
  for(let i=0; i<numParticles; i++){
    const ix = i*3;
    const x = positions[ix];
    const y = positions[ix+1];
    const z = positions[ix+2];
    const near = kdTree.query(x,y,z, collisionDistance*collisionDistance);
    for(let j of near){
      if(j===i) continue;
      const jx = j*3;
      const dx = x - positions[jx];
      const dy = y - positions[jx+1];
      const dz = z - positions[jx+2];
      const dist2 = dx*dx + dy*dy + dz*dz;
      if(dist2>1e-8 && dist2<(collisionDistance*collisionDistance)){
        const dist = Math.sqrt(dist2);
        const overlap = collisionDistance - dist;
        const nx = dx/dist;
        const ny = dy/dist;
        const nz = dz/dist;
        const push = 0.5*overlap;

        positions[ix  ] += nx*push;
        positions[ix+1 ] += ny*push;
        positions[ix+2 ] += nz*push;
        positions[jx  ] -= nx*push;
        positions[jx+1 ] -= ny*push;
        positions[jx+2 ] -= nz*push;

        // damp velocities
        velocities[ix  ]*=friction;
        velocities[ix+1 ]*=friction;
        velocities[ix+2 ]*=friction;
        velocities[jx  ]*=friction;
        velocities[jx+1 ]*=friction;
        velocities[jx+2 ]*=friction;
      }
    }
  }

  // 5) Smoothing pass (fluid-like)
  const newPositions = new Float32Array(positions);
  for(let i=0; i<numParticles; i++){
    const ix = i*3;
    const x = positions[ix];
    const y = positions[ix+1];
    const z = positions[ix+2];
    const neigh = kdTree.query(x,y,z, neighborRadius*neighborRadius);
    if(neigh.length<=1) continue;
    let sumx=0, sumy=0, sumz=0;
    for(let n of neigh){
      sumx += positions[n*3];
      sumy += positions[n*3+1];
      sumz += positions[n*3+2];
    }
    sumx/= neigh.length; 
    sumy/= neigh.length; 
    sumz/= neigh.length;
    newPositions[ix  ] = THREE.MathUtils.lerp(x, sumx, smoothingFactor);
    newPositions[ix+1 ] = THREE.MathUtils.lerp(y, sumy, smoothingFactor);
    newPositions[ix+2 ] = THREE.MathUtils.lerp(z, sumz, smoothingFactor);
  }
  positions.set(newPositions);

  // 6) Update GPU buffers
  geometry.attributes.position.needsUpdate = true;

  // Render
  renderer.render(scene, camera);
}
animate();

// Resizing
window.addEventListener('resize', ()=>{
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
