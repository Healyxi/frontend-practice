const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05070f);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 24, 52);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);

const ambient = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambient);

const sunLight = new THREE.PointLight(0xffe066, 1.2);
scene.add(sunLight);

const starPositions = [];
for (let i = 0; i < 800; i++) {
  const dir = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
  const r = 140 + Math.random() * 140;
  starPositions.push(dir.x * r, dir.y * r, dir.z * r);
}

const starGeometry = new THREE.BufferGeometry();
starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));

const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0xffffff, size: 0.8 }));
scene.add(stars);

const sun = new THREE.Mesh(
  new THREE.SphereGeometry(3, 32, 32),
  new THREE.MeshBasicMaterial({ color: 0xffcc33 })
);
scene.add(sun);

const planetData = [
  { size: 0.45, distance: 6.5, color: 0x9e9e9e, speed: 0.9 },                //水星
  { size: 0.68, distance: 8.5, color: 0xe8c98a, speed: 0.7 },                //金星
  { size: 0.70, distance: 11, color: 0x4fc3f7, speed: 0.55, moon: true },    //地球
  { size: 0.55, distance: 13.5, color: 0xc1440e, speed: 0.45 },              //火星
  { size: 1.60, distance: 18, color: 0xd9a066, speed: 0.35 },                //木星
  { size: 1.40, distance: 21.5, color: 0xd7c9a3, speed: 0.28, ring: true },  //土星
  { size: 1.10, distance: 25, color: 0x8fd6d6, speed: 0.22 },                //天王星
  { size: 1.05, distance: 28, color: 0x4a6fe0, speed: 0.18 }                 //海王星
];

const planets = [];

planetData.forEach((data, i) => {
  const orbit = new THREE.Mesh(
    new THREE.RingGeometry(data.distance - 0.04, data.distance + 0.04, 96),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2, side: THREE.DoubleSide })
  );
  orbit.rotation.x = -Math.PI / 2;
  scene.add(orbit);

  const pivot = new THREE.Group();
  pivot.rotation.y = i * Math.PI / 4;
  scene.add(pivot);

  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(data.size, 24, 24),
    new THREE.MeshStandardMaterial({ color: data.color })
  );
  planet.position.set(data.distance, 0, 0);
  pivot.add(planet);

  const entry = { planet, pivot, speed: data.speed, moonPivot: null };

  if (data.ring) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(data.size * 1.5, data.size * 2.4, 48),
      new THREE.MeshStandardMaterial({ color: 0xd7c9a3, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    planet.add(ring);
  }

  if (data.moon) {
    const moonPivot = new THREE.Group();

    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xcfd8dc })
    );
    moon.position.set(2, 0, 0);
    moonPivot.add(moon);

    planet.add(moonPivot);
    entry.moonPivot = moonPivot;
  }

  planets.push(entry);
});

//小行星带
const asteroidBelt = new THREE.Group();
const rockMat = new THREE.MeshStandardMaterial({ color: 0x9e9e9e });

for (let i = 0; i < 180; i++) {
  const angle = Math.random() * Math.PI * 2;
  const r = 15.5 + Math.random() * 1.5;

  const rock = new THREE.Mesh(new THREE.SphereGeometry(0.06 + Math.random() * 0.06, 6, 6), rockMat);
  rock.position.set(Math.cos(angle) * r, (Math.random() - 0.5) * 0.8, Math.sin(angle) * r);
  asteroidBelt.add(rock);
}

scene.add(asteroidBelt);

const clock = new THREE.Clock();
let paused = false;

const animate = () => {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();

  if (!paused) {
    planets.forEach(({ pivot, planet, speed, moonPivot }) => {
      pivot.rotation.y += speed * dt;
      planet.rotation.y += 1.5 * dt;
      if (moonPivot) moonPivot.rotation.y += 3 * dt;
    });

    stars.rotation.y += 0.03 * dt;
    asteroidBelt.rotation.y += 0.05 * dt;
  }

  controls.update();
  renderer.render(scene, camera);
};
animate();

//空格键暂停/继续功能的实现
window.addEventListener('keydown', (event) => {
  if (event.code !== 'Space') return;
  event.preventDefault();
  paused = !paused;
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});