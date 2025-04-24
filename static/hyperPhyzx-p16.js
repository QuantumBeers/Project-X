import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
/****************************************************
 * 1) SCENE SETUP
 ****************************************************/
const scene = new THREE.Scene();
// a slightly darker background
scene.background = new THREE.Color(0x202020);

const camera = new THREE.PerspectiveCamera(
  75, window.innerWidth / window.innerHeight, 0.1, 1000
);
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

/****************************************************
 * 2) ROTATING CONTAINER
 ****************************************************/
const cubeSize = 100;
const containerGeo = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
// A tinted wireframe
const containerMat = new THREE.MeshBasicMaterial({
  wireframe: true,
  color: 0xffffff
});
const rotatingCube = new THREE.Mesh(containerGeo, containerMat);
rotatingCube.position.y = 100;
scene.add(rotatingCube);

/****************************************************
 * 3) PARTICLE SETUP
 ****************************************************/
// We'll have free-floating + inside-cube again
const numParticles = 50;         // free-floating
const numCubeParticles = 1000;    // inside the cube
const particleRadius = 8;
const boundarySize = 8;          // collision boundary
const neighborRadius = 7;         // smoothing radius
const friction = 1            // mild friction
const gravity = new THREE.Vector3(0, -0.2, 0);

// (A) Free-floating
const freeGeo = new THREE.BufferGeometry();
const freePositions = new Float32Array(numParticles * 3);
const freeVelocities = new Float32Array(numParticles * 3).fill(0);
// We'll also store a color array so we can do dynamic hue shifting
const freeColors = new Float32Array(numParticles * 3);

for (let i = 0; i < numParticles; i++) {
  const ix = i * 3;
  // random spawn above ground
  freePositions[ix]     = (Math.random() - 0.5) * cubeSize;
  freePositions[ix + 1] = Math.random() * 50 + 50;
  freePositions[ix + 2] = (Math.random() - 0.5) * cubeSize;

  // default color is a mild teal
  freeColors[ix]     = 0.0;
  freeColors[ix + 1] = 0.8;
  freeColors[ix + 2] = 1.0;
}

freeGeo.setAttribute('position', new THREE.BufferAttribute(freePositions, 3));
freeGeo.setAttribute('color', new THREE.BufferAttribute(freeColors, 3));
// We'll do a PointsMaterial with vertexColors = true
const freeMat = new THREE.PointsMaterial({
  vertexColors: true,
  size: particleRadius,
  // so the points are round discs:
  alphaTest: 0.5
});
const freeParticles = new THREE.Points(freeGeo, freeMat);
scene.add(freeParticles);

// (B) Inside-cube
const cubeGeo = new THREE.BufferGeometry();
const cubePositions = new Float32Array(numCubeParticles * 3);
const cubeVelocities = new Float32Array(numCubeParticles * 3).fill(0);
const cubeColors = new Float32Array(numCubeParticles * 3);

for (let i = 0; i < numCubeParticles; i++) {
  const ix = i * 3;
  cubePositions[ix]     = (Math.random() - 0.5) * cubeSize * 0.8;
  cubePositions[ix + 1] = (Math.random() - 0.5) * cubeSize * 0.8;
  cubePositions[ix + 2] = (Math.random() - 0.5) * cubeSize * 0.8;

  // default color is also tealish
  cubeColors[ix]   = 0.0;
  cubeColors[ix+1] = 0.8;
  cubeColors[ix+2] = 1.0;
}

cubeGeo.setAttribute('position', new THREE.BufferAttribute(cubePositions, 3));
cubeGeo.setAttribute('color', new THREE.BufferAttribute(cubeColors, 3));

const cubeMat = new THREE.PointsMaterial({
  vertexColors: true,
  size: particleRadius,
  alphaTest: 0.5
});




const cubeParticles = new THREE.Points(cubeGeo, freeMat);
rotatingCube.add(cubeParticles);

// neighbor maps
const neighborMapFree = Array.from({ length: numParticles }, () => []);
const neighborMapCube = Array.from({ length: numCubeParticles }, () => []);

/****************************************************
 * 4) UTILITIES
 ****************************************************/
function lengthSq(dx, dy, dz) {
  return dx*dx + dy*dy + dz*dz;
}

function findNeighbors(posArray, neighborMap, count, radius) {
  for (let i = 0; i < count; i++) {
    neighborMap[i].length = 0;
  }
  const r2 = radius * radius;
  for (let i = 0; i < count; i++) {
    const ix = i*3;
    for (let j = i+1; j < count; j++) {
      const jx = j*3;
      const dx = posArray[ix]   - posArray[jx];
      const dy = posArray[ix+1] - posArray[jx+1];
      const dz = posArray[ix+2] - posArray[jx+2];
      const dist2 = lengthSq(dx, dy, dz);
      if(dist2 < r2) {
        neighborMap[i].push(j);
        neighborMap[j].push(i);
      }
    }
  }
}

/****************************************************
 * 5) BASIC COLLISION PASS
 ****************************************************/
function collisionPass(posArray, velArray, count, boundary, ground = true) {
  // gravity + integrate
  for (let i=0; i<count; i++) {
    const ix=i*3;
    velArray[ix]   += gravity.x;
    velArray[ix+1] += gravity.y;
    velArray[ix+2] += gravity.z;
    posArray[ix]   += velArray[ix];
    posArray[ix+1] += velArray[ix+1];
    posArray[ix+2] += velArray[ix+2];

    if(ground && posArray[ix+1]<0){
      posArray[ix+1] = 0;
      velArray[ix+1]*= -0.5;
    }
  }

  // pairwise push-out
  const b2= boundary*boundary;
  for(let i=0; i<count; i++){
    const ix=i*3;
    for(let j=i+1; j<count; j++){
      const jx=j*3;
      const dx= posArray[ix]   - posArray[jx];
      const dy= posArray[ix+1] - posArray[jx+1];
      const dz= posArray[ix+2] - posArray[jx+2];
      const dist2= dx*dx + dy*dy + dz*dz;
      if(dist2< b2 && dist2>1e-8){
        const dist= Math.sqrt(dist2);
        const overlap= boundary- dist;
        const nx= dx/dist, ny= dy/dist, nz= dz/dist;
        const push= 0.5* overlap;
        posArray[ix]   += nx* push;
        posArray[ix+1] += ny* push;
        posArray[ix+2] += nz* push;
        posArray[jx]   -= nx* push;
        posArray[jx+1] -= ny* push;
        posArray[jx+2] -= nz* push;

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

// clamp inside the local cube
function clampInsideCube(posArray, velArray, count, radius) {
  const half= cubeSize*0.5;
  for(let i=0; i<count; i++){
    const ix=i*3;
    for(let c=0; c<3; c++){
      const idx= ix+c;
      if(posArray[idx]> half-radius){
        posArray[idx]= half-radius;
        velArray[idx]*=-0.5;
      } else if(posArray[idx]< -half+radius){
        posArray[idx]= -half+radius;
        velArray[idx]*=-0.5;
      }
    }
  }
}

/****************************************************
 * 6) NEIGHBOR SMOOTH
 ****************************************************/
function neighborSmooth(posArray, velArray, neighborMap, count, factor) {
  const newPos= new Float32Array(posArray.length);
  newPos.set(posArray);

  for(let i=0; i<count; i++){
    const neigh= neighborMap[i];
    if(neigh.length===0) continue;
    const ix= i*3;
    let sumx=0, sumy=0, sumz=0;
    for(let n of neigh){
      const nx= n*3;
      sumx+= posArray[nx];
      sumy+= posArray[nx+1];
      sumz+= posArray[nx+2];
    }
    sumx/= neigh.length;
    sumy/= neigh.length;
    sumz/= neigh.length;

    newPos[ix]   = THREE.MathUtils.lerp(posArray[ix],   sumx, factor);
    newPos[ix+1] = THREE.MathUtils.lerp(posArray[ix+1], sumy, factor);
    newPos[ix+2] = THREE.MathUtils.lerp(posArray[ix+2], sumz, factor);

    // optional velocity changes
    // velArray[ix]   += (newPos[ix]   - posArray[ix]);
    // velArray[ix+1] += (newPos[ix+1] - posArray[ix+1]);
    // velArray[ix+2] += (newPos[ix+2] - posArray[ix+2]);
  }
  posArray.set(newPos);
}

/****************************************************
 * 7) DYNAMIC COLOR SHIFT
 *    Let color reflect local density: more neighbors => deeper color
 ****************************************************/
function colorByDensity(posArray, colorArray, neighborMap, count) {
  // For each particle, the number of neighbors => a measure of local density
  // We'll map neighborCount from [0..(some max)] => hue shift or color intensity
  // e.g. if neighborCount> 15 => very high => shift color
  for(let i=0; i<count; i++){
    const dens= neighborMap[i].length;
    const factor= Math.min(dens/20, 1); // clamp to 1 if dens >=20
    // We can do a teal => dark-blue shift
    const baseR= 0.0, baseG= 0.8, baseB= 1.0; // teal
    const targetR= 0.0, targetG= 0.2, targetB= 1.0; // deeper blue
    // lerp
    const r= THREE.MathUtils.lerp(baseR, targetR, factor);
    const g= THREE.MathUtils.lerp(baseG, targetG, factor);
    const b= THREE.MathUtils.lerp(baseB, targetB, factor);

    const ix= i*3;
    colorArray[ix]   = r;
    colorArray[ix+1] = g;
    colorArray[ix+2] = b;
  }
}

/****************************************************
 * 8) ANIMATION LOOP
 ****************************************************/
function animate() {
  requestAnimationFrame(animate);
  controls.update();

  // auto-rotate the container
  //rotatingCube.rotation.y += 0.005;
  //rotatingCube.rotation.x += 0.002;

  // (A) free-floating
  const freePos= freeGeo.attributes.position.array;
  collisionPass(freePos, freeVelocities, numParticles, boundarySize, true);
  findNeighbors(freePos, neighborMapFree, numParticles, neighborRadius);
  neighborSmooth(freePos, freeVelocities, neighborMapFree, numParticles, 0.1);
  colorByDensity(freePos, freeColors, neighborMapFree, numParticles);
  freeGeo.attributes.position.needsUpdate= true;
  freeGeo.attributes.color.needsUpdate= true;

  // (B) inside-cube
  const cubePos= cubeGeo.attributes.position.array;
  // local gravity
  const localG= gravity.clone().applyQuaternion(rotatingCube.quaternion.clone().invert());
  for(let i=0; i<numCubeParticles; i++){
    const ix=i*3;
    cubeVelocities[ix]   += localG.x;
    cubeVelocities[ix+1] += localG.y;
    cubeVelocities[ix+2] += localG.z;
    // integrate
    cubePos[ix]   += cubeVelocities[ix];
    cubePos[ix+1] += cubeVelocities[ix+1];
    cubePos[ix+2] += cubeVelocities[ix+2];
  }
  clampInsideCube(cubePos, cubeVelocities, numCubeParticles, particleRadius);
  findNeighbors(cubePos, neighborMapCube, numCubeParticles, neighborRadius);
  // collision among themselves
  const b2= boundarySize*boundarySize;
  for(let i=0; i<numCubeParticles; i++){
    const ix= i*3;
    for(let j=i+1; j<numCubeParticles; j++){
      const jx= j*3;
      const dx= cubePos[ix]   - cubePos[jx];
      const dy= cubePos[ix+1] - cubePos[jx+1];
      const dz= cubePos[ix+2] - cubePos[jx+2];
      const dist2= dx*dx+ dy*dy+ dz*dz;
      if(dist2< b2 && dist2>1e-8){
        const dist= Math.sqrt(dist2);
        const overlap= boundarySize - dist;
        const nx= dx/dist, ny= dy/dist, nz= dz/dist;
        const push= 0.5* overlap;
        cubePos[ix]   += nx* push;
        cubePos[ix+1] += ny* push;
        cubePos[ix+2] += nz* push;
        cubePos[jx]   -= nx* push;
        cubePos[jx+1] -= ny* push;
        cubePos[jx+2] -= nz* push;
        cubeVelocities[ix]   *= friction;
        cubeVelocities[ix+1] *= friction;
        cubeVelocities[ix+2] *= friction;
        cubeVelocities[jx]   *= friction;
        cubeVelocities[jx+1] *= friction;
        cubeVelocities[jx+2] *= friction;
      }
    }
  }
  neighborSmooth(cubePos, cubeVelocities, neighborMapCube, numCubeParticles, 0.1);
  // color by local density
  colorByDensity(cubePos, cubeColors, neighborMapCube, numCubeParticles);

  cubeGeo.attributes.position.needsUpdate= true;
  cubeGeo.attributes.color.needsUpdate= true;

  renderer.render(scene, camera);
}
animate();

/****************************************************
 * 9) RESIZE & DRAG-ROTATE
 ****************************************************/
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const raycaster= new THREE.Raycaster();
const mouse= new THREE.Vector2();
let isDragging= false;
let prevMouseX= 0, prevMouseY= 0;
const rotationSpeed= 0.01;

function onPointerDown(e){
  mouse.x= (e.clientX/window.innerWidth)*2-1;
  mouse.y= -(e.clientY/window.innerHeight)*2+1;
  raycaster.setFromCamera(mouse, camera);
  const intersects= raycaster.intersectObject(rotatingCube, false);
  if(intersects.length>0){
    isDragging= true;
    prevMouseX= e.clientX;
    prevMouseY= e.clientY;
    controls.enabled= false;
  }
}
function onPointerMove(e){
  if(!isDragging) return;
  const dx= e.clientX- prevMouseX;
  const dy= e.clientY- prevMouseY;
  rotatingCube.rotation.y+= dx* rotationSpeed;
  rotatingCube.rotation.x+= dy* rotationSpeed;
  prevMouseX= e.clientX;
  prevMouseY= e.clientY;
}
function onPointerUp(){
  isDragging= false;
  controls.enabled= true;
}
window.addEventListener('pointerdown', onPointerDown);
window.addEventListener('pointermove', onPointerMove);
window.addEventListener('pointerup', onPointerUp);
