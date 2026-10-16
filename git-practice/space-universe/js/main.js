const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05070f);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 14, 34);

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
  const r = 60 + Math.random() * 80;
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
  { size: 0.7, distance: 7, color: 0x8d9aa8, speed: 0.9 },                 // 水星
  { size: 1.0, distance: 11, color: 0x4fc3f7, speed: 0.6, moon: true },    // 地球
  { size: 1.4, distance: 15, color: 0xffb74d, speed: 0.4 },                // 木星
  { size: 1.0, distance: 19, color: 0xd7c9a3, speed: 0.3, ring: true }     // 土星
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
  pivot.rotation.y = i * 1.4;
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

const animate = () => {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
};
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});