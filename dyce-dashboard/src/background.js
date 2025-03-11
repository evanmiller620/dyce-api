import * as THREE from 'three';
import Delaunator from 'delaunator';

const xSize = 9;
const ySize = 7;
const springStrength = 0.00001;
const restLength = 1;
const damping = 0;
const mouseStrength = 0;
const scrollSpeed = 0;
const colorLow = new THREE.Color(0x9e9e9e);
const colorHigh = new THREE.Color(0xffffff);
// const colorLow = new THREE.Color(0x70a7ff);
// const colorHigh = new THREE.Color(0xabe6ff);

const points = []
for (let y = 0; y <= ySize; y++) {
    for (let x = 0; x <= xSize; x++) {
        points.push([x - xSize / 2, y - ySize / 2]);
    }
}

const velocities = points.map(() => ({
    x: (Math.random() - 0.5) * springStrength,
    y: (Math.random() - 0.5) * springStrength,
}));

const geometry = new THREE.BufferGeometry();

const material = new THREE.MeshBasicMaterial({
    side: THREE.DoubleSide,
    vertexColors: true
});
const mesh = new THREE.Mesh(geometry, material);

const scene = new THREE.Scene();
scene.add(mesh);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
scene.add(ambientLight);

const aspectRatio = window.innerWidth / window.innerHeight;
const frustumSize = 4;
const camera = new THREE.OrthographicCamera(
    -frustumSize * aspectRatio / 2, // left
    frustumSize * aspectRatio / 2,  // right
    frustumSize / 2,                // top
    -frustumSize / 2,               // bottom
    1,                              // near
    3                               // far
);
camera.position.z = 2;

const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#bg')
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const sphereGeometry = new THREE.SphereGeometry(0.01, 8, 8);
const sphereMaterial = new THREE.MeshBasicMaterial({color:0x000000, visible:false});
const mousePointer = new THREE.Mesh(sphereGeometry, sphereMaterial);
scene.add(mousePointer);

function updateGeometry(selectedFaceIndex) {
    const delaunay = Delaunator.from(points);
    const triangles = delaunay.triangles;

    const vertices = [];
    const colors = [];

    for (let i = 0; i < triangles.length; i += 3) {
        const aIdx = triangles[i];
        const bIdx = triangles[i + 1];
        const cIdx = triangles[i + 2];

        const a = points[aIdx];
        const b = points[bIdx];
        const c = points[cIdx];

        vertices.push(a[0], a[1], 0);
        vertices.push(b[0], b[1], 0);
        vertices.push(c[0], c[1], 0);

        const t = ((a[1] + b[1] + c[1]) / 3 + ySize / 2) / ySize;
        const color = colorLow.clone().lerp(colorHigh, t);

        colors.push(color.r, color.g, color.b);
        colors.push(color.r, color.g, color.b);
        colors.push(color.r, color.g, color.b);

        const [fxab, fyab] = getSpringForce(a, b);
        const [fxac, fyac] = getSpringForce(a, c);
        const [fxbc, fybc] = getSpringForce(b, c);

        const [fxam, fyam] = getMouseForce(a);
        const [fxbm, fybm] = getMouseForce(b);
        const [fxcm, fycm] = getMouseForce(c);

        velocities[aIdx].x +=  fxab + fxac + fxam;
        velocities[bIdx].x += -fxab + fxbc + fxbm;
        velocities[cIdx].x += -fxac - fxbc + fxcm;
        velocities[aIdx].y +=  fyab + fyac + fyam;
        velocities[bIdx].y += -fyab + fybc + fybm;
        velocities[cIdx].y += -fyac - fybc + fycm;

        checkBoundsAndCorrect(a, velocities[aIdx]);
        checkBoundsAndCorrect(b, velocities[bIdx]);
        checkBoundsAndCorrect(c, velocities[cIdx]);
    }

    geometry.setAttribute(
        'position', new THREE.Float32BufferAttribute(vertices, 3)
    );
    geometry.setAttribute(
        'color',  new THREE.Float32BufferAttribute(colors, 3)
    );
}

function getSpringForce(a, b) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const distance = Math.sqrt(dx * dx + dy * dy);
    const displacement = distance - restLength;

    const forceMagnitude = springStrength * displacement;
    const fx = forceMagnitude * (dx / distance);
    const fy = forceMagnitude * (dy / distance);
    return [fx, fy];
}

function getMouseForce(point) {
    if (!clicking) return [0, 0];
    const dx = point[0] - mousePointer.position.x;
    const dy = point[1] - mousePointer.position.y;
    const distanceSquared = dx * dx + dy * dy;
    const distance = Math.sqrt(distanceSquared);
    if (distance < 0.1) return [0, 0]

    const forceMagnitude = mouseStrength / distanceSquared;
    const fx = forceMagnitude * (dx / distance);
    const fy = forceMagnitude * (dy / distance);
    return [fx, fy]
}

function checkBoundsAndCorrect(point, velocity) {
    if (point[0] < -xSize / 2 || point[0] > xSize / 2) {
        velocity.x *= -1;
        point[0] = Math.max(-xSize / 2, Math.min(xSize / 2, point[0]));
    }
    if (point[1] < -ySize / 2 || point[1] > ySize / 2) {
        velocity.y *= -1;
        point[1] = Math.max(-ySize / 2, Math.min(ySize / 2, point[1]));
    }
}

function onPointerMove(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x =  ((event.clientX - rect.left) / (rect.width )) * 2 - 1;
    pointer.y = -((event.clientY - rect.top ) / (rect.height)) * 2 + 1;
}

let clicking = false;
function onPointerDown(event) {
    clicking = true;
}
function onPointerUp(event) {
    clicking = false;
}

function highlightFace(selectedFaceIndex) {
    if (selectedFaceIndex < 0) return;
    const colorArray = geometry.attributes.color.array;
    for (let i = selectedFaceIndex * 9; i < selectedFaceIndex * 9 + 9; i += 3) {
        colorArray[i + 0] *= 1;
        colorArray[i + 1] *= 1;
        colorArray[i + 2] *= 1;
    }
    geometry.attributes.color.needsUpdate = true;
}

function onScroll() {
    const t = document.body.getBoundingClientRect().top;
    camera.position.y = t * scrollSpeed;
}

window.addEventListener('pointermove', onPointerMove);
window.addEventListener('pointerdown', onPointerDown);
window.addEventListener('pointerup', onPointerUp);
window.addEventListener('scroll', onScroll);

function animate() {

    for (let i = 0; i < points.length; i++) {
        if (i < xSize + 1) continue;
        if (i > (xSize + 1) * ySize) continue;
        if (i % (xSize + 1) == 0) continue;
        if (i % (xSize + 1) == xSize) continue;

        points[i][0] += velocities[i].x;
        points[i][1] += velocities[i].y;

        velocities[i].x *= 1 - damping;
        velocities[i].y *= 1 - damping;
    }
    
    updateGeometry();
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
    geometry.computeBoundingSphere();

    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObject(mesh);

    let faceIndex = -1;
    if (intersects.length > 0) {
        faceIndex = intersects[0].faceIndex;
        mousePointer.position.copy(intersects[0].point);
    }
    highlightFace(faceIndex);

    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate();