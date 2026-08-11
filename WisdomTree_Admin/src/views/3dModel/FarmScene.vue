<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import FarmHotspot from '@/components/3d/FarmHotspot.vue'

// ─── Farm Element Data ────────────────────────────────────────────────
const farmElements = [
  // Fields (2 rows × 3 columns)
  { id: 'field-a', name: '水稻田 A区', type: 'field', crop: '水稻', status: 'growing', stage: '生长期', desc: '种植优质杂交水稻，长势喜人，预计45天后收获', pos: { x: -5, z: -2 } },
  { id: 'field-b', name: '玉米地 A区', type: 'field', crop: '玉米', status: 'mature', stage: '成熟期', desc: '甜玉米已成熟，可安排游客采摘体验活动', pos: { x: -1, z: -2 } },
  { id: 'field-c', name: '蔬菜园 A区', type: 'field', crop: '番茄', status: 'harvest', stage: '收获期', desc: '有机番茄喜迎丰收，预计产量500kg，供应当地市场', pos: { x: 3, z: -2 } },
  { id: 'field-d', name: '小麦田 A区', type: 'field', crop: '小麦', status: 'seedling', stage: '幼苗期', desc: '冬小麦新品种试验田，采用智能灌溉系统', pos: { x: -5, z: 2 } },
  { id: 'field-e', name: '果园 A区', type: 'field', crop: '苹果', status: 'growing', stage: '生长期', desc: '矮化密植苹果园，明年进入盛果期', pos: { x: -1, z: 2 } },
  { id: 'field-f', name: '蔬菜园 B区', type: 'field', crop: '黄瓜', status: 'growing', stage: '生长期', desc: '大棚黄瓜，采用绿色有机种植方式', pos: { x: 3, z: 2 } },
  // Buildings
  { id: 'farmhouse', name: '乡间农舍', type: 'building', status: 'active', desc: '农场主住所及游客接待中心，设有农产品展厅与茶室', pos: { x: -9.5, z: -8 } },
  { id: 'storage', name: '农资仓库', type: 'building', status: 'normal', desc: '农具存放与农产品暂存，配备冷藏设施', pos: { x: -9.5, z: -11.5 } },
  // Greenhouse
  { id: 'greenhouse', name: '智能温室', type: 'greenhouse', crop: '草莓', status: 'growing', stage: '生长期', desc: '全自动温控大棚，全年种植草莓、花卉与珍稀药材', pos: { x: 7.5, z: -6 } },
  // Pond
  { id: 'pond', name: '生态鱼塘', type: 'pond', status: 'full', desc: '放养鲤鱼、草鱼、鲫鱼，配套垂钓体验与水上活动', pos: { x: -7, z: 7 } },
]

const FILED_SIZE = { w: 3.6, d: 3.6 }

// ─── Crop colour map ──────────────────────────────────────────────────
const CROP_COLORS = {
  seedling: 0x8bc34a,   // light green
  growing:  0x43a047,   // green
  mature:   0x2e7d32,   // dark green
  harvest:  0xfdd835,   // yellow-gold
}

const CROP_EMISSIVE = {
  seedling: 0x334411,
  growing:  0x112211,
  mature:   0x112211,
  harvest:  0x554422,
}

// ─── Three.js refs ────────────────────────────────────────────────────
let scene, camera, renderer, controls
let animationId = null
const pointer = new THREE.Vector2()
const raycaster = new THREE.Raycaster()
const clickableObjects = []

// ─── Hotspot state ────────────────────────────────────────────────────
const hotspot = reactive({
  visible: false,
  name: '',
  type: '',
  status: '',
  stage: '',
  description: '',
  crop: '',
  position: { x: 0, y: 0 },
})
let selectedFarmData = null  // currently selected element data

// ─── Scene helpers ────────────────────────────────────────────────────

/** Walk parent chain to find farmData */
function getFarmData(object) {
  let cur = object
  while (cur) {
    if (cur.userData && cur.userData.farmData) return cur.userData.farmData
    cur = cur.parent
  }
  return null
}

/** Project a 3D position to screen coordinates */
function toScreenPos(worldPos) {
  const vec = worldPos.clone().project(camera)
  return {
    x: (vec.x * 0.5 + 0.5) * window.innerWidth,
    y: (-vec.y * 0.5 + 0.5) * window.innerHeight,
  }
}

/** Register a mesh (and its children) as clickable */
function makeClickable(group, data) {
  group.userData.farmData = data
  group.traverse((child) => {
    if (child.isMesh) {
      clickableObjects.push(child)
    }
  })
  return group
}

// ─── Ground ────────────────────────────────────────────────────────────
function createGround() {
  const geo = new THREE.PlaneGeometry(36, 36)
  const mat = new THREE.MeshStandardMaterial({
    color: 0x5a8f4a,
    roughness: 0.9,
    metalness: 0.0,
  })
  const ground = new THREE.Mesh(geo, mat)
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -0.05
  ground.receiveShadow = true
  scene.add(ground)

  // Grid lines for field divisions
  const gridHelper = new THREE.GridHelper(36, 12, 0x3d6b30, 0x4a7a3a)
  gridHelper.position.y = 0.01
  scene.add(gridHelper)

  // Dirt paths (simple rectangles on the ground)
  const pathMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 1 })
  const positions = [
    { x: 0, z: 0, w: 22, d: 0.3 },   // horizontal main path
    { x: -9.5, z: -9.8, w: 0.3, d: 6 }, // path to buildings
  ]
  for (const p of positions) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(p.w, p.d), pathMat)
    mesh.rotation.x = -Math.PI / 2
    mesh.position.set(p.x, 0.005, p.z)
    scene.add(mesh)
  }
}

// ─── Field with crop rows ──────────────────────────────────────────────
function createField(data) {
  const group = new THREE.Group()
  const color = CROP_COLORS[data.status] || 0x43a047
  const emissive = CROP_EMISSIVE[data.status] || 0x112211

  // Field bed – slightly raised earth
  const bedMat = new THREE.MeshStandardMaterial({
    color: 0x6d4c2a,
    roughness: 0.95,
  })
  const bed = new THREE.Mesh(new THREE.PlaneGeometry(FILED_SIZE.w, FILED_SIZE.d), bedMat)
  bed.rotation.x = -Math.PI / 2
  bed.position.y = 0.02
  group.add(bed)

  // Field border
  const borderMat = new THREE.MeshStandardMaterial({ color: 0x5d3e1a })
  const border = new THREE.Mesh(new THREE.EdgesGeometry(new THREE.BoxGeometry(FILED_SIZE.w, 0.04, FILED_SIZE.d)), borderMat)
  border.position.y = 0.04
  group.add(border)

  // Crop rows – small boxes arranged in rows/cols
  const rows = 5
  const cols = 5
  const spacingX = FILED_SIZE.w / (cols + 0.5)
  const spacingZ = FILED_SIZE.d / (rows + 0.5)
  const plantMat = new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: 0.15,
    roughness: 0.6,
  })

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const h = data.status === 'seedling' ? 0.2
        : data.status === 'harvest' ? 0.25 + Math.random() * 0.15
        : 0.15 + Math.random() * 0.2
      const plant = new THREE.Mesh(new THREE.BoxGeometry(0.18, h, 0.18), plantMat)
      const px = -FILED_SIZE.w / 2 + spacingX * (c + 0.5) + (Math.random() - 0.5) * 0.08
      const pz = -FILED_SIZE.d / 2 + spacingZ * (r + 0.5) + (Math.random() - 0.5) * 0.08
      plant.position.set(px, 0.04 + h / 2, pz)
      plant.castShadow = true
      group.add(plant)
    }
  }

  // Add a small label flag for harvest-ready fields
  if (data.status === 'harvest') {
    const poleMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 4), poleMat)
    pole.position.set(0, 0.35, FILED_SIZE.d / 2 + 0.2)
    group.add(pole)
    const flagMat = new THREE.MeshBasicMaterial({ color: 0xfdd835, side: THREE.DoubleSide })
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.2), flagMat)
    flag.position.set(0.15, 0.65, FILED_SIZE.d / 2 + 0.2)
    group.add(flag)
  }

  group.position.set(data.pos.x, 0, data.pos.z)
  return makeClickable(group, data)
}

// ─── Greenhouse ────────────────────────────────────────────────────────
function createGreenhouse(data) {
  const group = new THREE.Group()

  // Glass walls
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xaaddff,
    transparent: true,
    opacity: 0.25,
    roughness: 0.05,
    metalness: 0.0,
    side: THREE.DoubleSide,
    envMapIntensity: 0.4,
  })
  const walls = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.8, 2.8), glassMat)
  walls.position.y = 0.9
  walls.castShadow = true
  group.add(walls)

  // Frame edges (white lines)
  const frameMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 })
  const frameGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(3.2, 1.8, 2.8))
  const frame = new THREE.LineSegments(frameGeo, frameMat)
  frame.position.y = 0.9
  group.add(frame)

  // Peaked roof – A-frame using BufferGeometry
  const roofMat = new THREE.MeshPhysicalMaterial({
    color: 0xccddff,
    transparent: true,
    opacity: 0.35,
    roughness: 0.1,
    metalness: 0.0,
    side: THREE.DoubleSide,
  })
  const rw = 1.8, rh = 1.0, rd = 1.6
  const verts = new Float32Array([
    // front
    -rw, 1.8, -rd,   rw, 1.8, -rd,   0, 1.8 + rh, -rd,
    // back
    -rw, 1.8,  rd,   rw, 1.8,  rd,   0, 1.8 + rh,  rd,
    // left
    -rw, 1.8, -rd,   0, 1.8 + rh, -rd,  0, 1.8 + rh, rd,
    -rw, 1.8, -rd,   0, 1.8 + rh,  rd, -rw, 1.8,   rd,
    // right
     rw, 1.8, -rd,   0, 1.8 + rh, -rd,  0, 1.8 + rh, rd,
     rw, 1.8, -rd,   0, 1.8 + rh,  rd,  rw, 1.8,   rd,
  ])
  const roofGeo = new THREE.BufferGeometry()
  roofGeo.setAttribute('position', new THREE.BufferAttribute(verts, 3))
  roofGeo.computeVertexNormals()
  const roof = new THREE.Mesh(roofGeo, roofMat)
  group.add(roof)

  // Roof ridge line
  const ridgeMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 })
  const ridgePoints = [new THREE.Vector3(0, 1.8 + rh, -rd), new THREE.Vector3(0, 1.8 + rh, rd)]
  const ridge = new THREE.Line(new THREE.BufferGeometry().setFromPoints(ridgePoints), ridgeMat)
  group.add(ridge)

  // Small plants inside (visible through glass)
  const plantMat = new THREE.MeshStandardMaterial({ color: 0x4caf50, roughness: 0.7 })
  for (let i = 0; i < 12; i++) {
    const plant = new THREE.Mesh(new THREE.SphereGeometry(0.1 + Math.random() * 0.12, 6), plantMat)
    plant.position.set(
      (Math.random() - 0.5) * 2.4,
      0.1 + Math.random() * 0.2,
      (Math.random() - 0.5) * 2.0,
    )
    group.add(plant)
  }

  group.position.set(data.pos.x, 0, data.pos.z)
  return makeClickable(group, data)
}

// ─── Pond ──────────────────────────────────────────────────────────────
function createPond(data) {
  const group = new THREE.Group()

  // Water surface
  const waterMat = new THREE.MeshPhysicalMaterial({
    color: 0x2196f3,
    transparent: true,
    opacity: 0.75,
    roughness: 0.1,
    metalness: 0.3,
    envMapIntensity: 0.6,
  })
  const water = new THREE.Mesh(new THREE.CircleGeometry(2.2, 32), waterMat)
  water.rotation.x = -Math.PI / 2
  water.position.y = 0.02
  group.add(water)

  // Bank ring
  const bankMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 1 })
  const bank = new THREE.Mesh(new THREE.RingGeometry(2.2, 2.6, 32), bankMat)
  bank.rotation.x = -Math.PI / 2
  bank.position.y = 0.01
  group.add(bank)

  // Small decorative rocks
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9 })
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + Math.random() * 0.3
    const r = 2.0 + Math.random() * 0.5
    const rock = new THREE.Mesh(new THREE.SphereGeometry(0.06 + Math.random() * 0.06, 6), rockMat)
    rock.position.set(Math.cos(angle) * r, 0.05, Math.sin(angle) * r)
    group.add(rock)
  }

  group.position.set(data.pos.x, 0, data.pos.z)
  return makeClickable(group, data)
}

// ─── Farmhouse ─────────────────────────────────────────────────────────
function createFarmhouse(data) {
  const group = new THREE.Group()

  // Body
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xf5e6d0, roughness: 0.8 })
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.0, 2.8), wallMat)
  body.position.y = 1.0
  body.castShadow = true
  group.add(body)

  // Roof (peaked, using BufferGeometry)
  const roofMat = new THREE.MeshStandardMaterial({
    color: 0x8d3e1a,
    roughness: 0.85,
    metalness: 0.05,
  })
  const rw = 1.8, rh = 1.0, rd = 1.6
  const verts = new Float32Array([
    -rw, 2.0, -rd,   rw, 2.0, -rd,   0, 2.0 + rh, -rd,
    -rw, 2.0,  rd,   rw, 2.0,  rd,   0, 2.0 + rh,  rd,
    -rw, 2.0, -rd,   0, 2.0 + rh, -rd,  0, 2.0 + rh, rd,
    -rw, 2.0, -rd,   0, 2.0 + rh,  rd, -rw, 2.0,   rd,
     rw, 2.0, -rd,   0, 2.0 + rh, -rd,  0, 2.0 + rh, rd,
     rw, 2.0, -rd,   0, 2.0 + rh,  rd,  rw, 2.0,   rd,
  ])
  const roofGeo = new THREE.BufferGeometry()
  roofGeo.setAttribute('position', new THREE.BufferAttribute(verts, 3))
  roofGeo.computeVertexNormals()
  const roof = new THREE.Mesh(roofGeo, roofMat)
  group.add(roof)

  // Door
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x5d3e1a })
  const door = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.9), doorMat)
  door.position.set(0, 0.5, 1.41)
  group.add(door)

  // Windows
  const windowMat = new THREE.MeshPhysicalMaterial({
    color: 0x88ccff,
    transparent: true,
    opacity: 0.4,
    roughness: 0,
    metalness: 0,
  })
  for (const wx of [-0.7, 0.7]) {
    const win = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.35), windowMat)
    win.position.set(wx, 1.0, 1.41)
    group.add(win)
  }

  group.position.set(data.pos.x, 0, data.pos.z)
  return makeClickable(group, data)
}

// ─── Storage building ──────────────────────────────────────────────────
function createStorage(data) {
  const group = new THREE.Group()

  const wallMat = new THREE.MeshStandardMaterial({ color: 0x9e9e9e, roughness: 0.9 })
  const body = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.6, 2.4), wallMat)
  body.position.y = 0.8
  body.castShadow = true
  group.add(body)

  // Roof – flat-ish with slight angle
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x616161, roughness: 0.8 })
  const roof = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.15, 2.6), roofMat)
  roof.position.y = 1.6
  group.add(roof)

  // Door
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a })
  const door = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.0), doorMat)
  door.position.set(0, 0.6, 1.21)
  group.add(door)

  group.position.set(data.pos.x, 0, data.pos.z)
  return makeClickable(group, data)
}

// ─── Decorative trees ──────────────────────────────────────────────────
function createDecorativeTrees() {
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.8 })
  const crownColors = [0x4caf50, 0x388e3c, 0x66bb6a, 0x2e7d32]
  const positions = [
    { x: -14, z: -10 }, { x: -14, z: 6 }, { x: -13, z: 12 },
    { x: 13, z: -12 }, { x: 14, z: 0 }, { x: 13, z: 10 },
    { x: -10, z: -14 }, { x: 5, z: -14 }, { x: 0, z: 13 },
  ]

  for (const pos of positions) {
    const group = new THREE.Group()
    const scale = 0.6 + Math.random() * 0.5

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * scale, 0.12 * scale, 0.8 * scale, 5), trunkMat)
    trunk.position.y = 0.4 * scale
    trunk.castShadow = true
    group.add(trunk)

    const crownMat = new THREE.MeshStandardMaterial({
      color: crownColors[Math.floor(Math.random() * crownColors.length)],
      roughness: 0.7,
    })
    const crown = new THREE.Mesh(new THREE.SphereGeometry(0.5 * scale, 6), crownMat)
    crown.position.y = 1.0 * scale + 0.3 * scale
    crown.castShadow = true
    group.add(crown)

    group.position.set(pos.x, 0, pos.z)
    scene.add(group)
  }
}

// ─── Fence posts along field borders ───────────────────────────────────
function createFencePosts() {
  const postMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.9 })
  // Along the main field row dividers
  for (let x = -7; x <= 5; x += 1.2) {
    for (const z of [-4, 0, 4]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.3, 4), postMat)
      post.position.set(x, 0.15, z)
      scene.add(post)
    }
  }
  for (let z = -4; z <= 4; z += 1.2) {
    for (const x of [-7, 5]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.3, 4), postMat)
      post.position.set(x, 0.15, z)
      scene.add(post)
    }
  }
}

// ─── Scene initialisation ──────────────────────────────────────────────
function initScene() {
  // Scene
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x87ceeb)
  scene.fog = new THREE.Fog(0x87ceeb, 30, 50)

  // Camera
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100)
  camera.position.set(12, 16, 18)
  camera.lookAt(0, 0, 0)

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.0
  document.querySelector('.farm-canvas-container').appendChild(renderer.domElement)

  // Lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.5)
  scene.add(ambient)

  const hemi = new THREE.HemisphereLight(0x87ceeb, 0x3d6b30, 0.6)
  scene.add(hemi)

  const sun = new THREE.DirectionalLight(0xffeedd, 1.2)
  sun.position.set(15, 25, 10)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  sun.shadow.camera.near = 0.1
  sun.shadow.camera.far = 60
  sun.shadow.camera.left = -20
  sun.shadow.camera.right = 20
  sun.shadow.camera.top = 20
  sun.shadow.camera.bottom = -20
  scene.add(sun)

  const fill = new THREE.DirectionalLight(0xaaccff, 0.3)
  fill.position.set(-10, 10, -10)
  scene.add(fill)

  // Controls
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.maxPolarAngle = Math.PI / 2.1
  controls.minDistance = 4
  controls.maxDistance = 40
  controls.target.set(0, 0, 0)

  // Build scene
  createGround()
  createDecorativeTrees()
  createFencePosts()

  // Farm interactive elements
  for (const el of farmElements) {
    let group
    switch (el.type) {
      case 'field':
        group = createField(el)
        break
      case 'greenhouse':
        group = createGreenhouse(el)
        break
      case 'pond':
        group = createPond(el)
        break
      case 'building':
        group = el.id === 'farmhouse' ? createFarmhouse(el) : createStorage(el)
        break
    }
    if (group) scene.add(group)
  }

  // Resize handler
  window.addEventListener('resize', onResize)
}

// ─── Resize ────────────────────────────────────────────────────────────
function onResize() {
  if (!camera || !renderer) return
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

// ─── Animation loop ────────────────────────────────────────────────────
function animate() {
  animationId = requestAnimationFrame(animate)
  controls.update()

  // Simple hover tooltip via pointer position
  raycaster.setFromCamera(pointer, camera)
  const hits = raycaster.intersectObjects(clickableObjects, false)

  if (hits.length > 0) {
    const data = getFarmData(hits[0].object)
    if (data && !selectedFarmData) {
      document.body.style.cursor = 'pointer'
    }
  } else {
    if (!selectedFarmData) document.body.style.cursor = 'auto'
  }

  renderer.render(scene, camera)
}

// ─── Click handler ─────────────────────────────────────────────────────
function onClick(event) {
  // Only handle clicks directly on the 3D canvas
  if (event.target !== renderer.domElement) return

  const rect = renderer.domElement.getBoundingClientRect()
  const mx = ((event.clientX - rect.left) / rect.width) * 2 - 1
  const my = -((event.clientY - rect.top) / rect.height) * 2 + 1

  const clickPointer = new THREE.Vector2(mx, my)
  raycaster.setFromCamera(clickPointer, camera)
  const hits = raycaster.intersectObjects(clickableObjects, false)

  if (hits.length > 0) {
    const data = getFarmData(hits[0].object)
    if (data) {
      selectedFarmData = data
      const worldPos = new THREE.Vector3()
      hits[0].object.getWorldPosition(worldPos)
      worldPos.y += 4  // offset hotspot above
      const screen = toScreenPos(worldPos)

      hotspot.visible = true
      hotspot.name = data.name
      hotspot.type = data.type
      hotspot.status = data.status || ''
      hotspot.stage = data.stage || ''
      hotspot.description = data.desc || ''
      hotspot.crop = data.crop || ''
      hotspot.position = screen
      return
    }
  }

  // Clicked empty space → close hotspot
  selectedFarmData = null
  closeHotspot()
}

function closeHotspot() {
  hotspot.visible = false
  selectedFarmData = null
  document.body.style.cursor = 'auto'
}

// ─── Pointer move (for hover) ──────────────────────────────────────────
function onPointerMove(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1
}

// ─── Lifecycle ─────────────────────────────────────────────────────────
onMounted(async () => {
  await nextTick()
  initScene()
  animate()
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('click', onClick)
})

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)

  if (renderer) {
    if (renderer.domElement && renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement)
    }
    renderer.dispose()
    renderer.forceContextLoss()
    renderer = null
  }

  window.removeEventListener('resize', onResize)
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('click', onClick)
})
</script>

<template>
  <div class="farm-page">
    <div class="farm-title">🌾 AgriTourism 3D 农场</div>
    <button class="farm-back" @click="$router.push('/admindataChart')">← 返回</button>

    <div class="farm-canvas-container"></div>

    <!-- Legend -->
    <div class="farm-legend">
      <h4>作物状态</h4>
      <div class="legend-item">
        <span class="legend-color" style="background:#8bc34a"></span>
        <span class="legend-label">幼苗期</span>
      </div>
      <div class="legend-item">
        <span class="legend-color" style="background:#43a047"></span>
        <span class="legend-label">生长期</span>
      </div>
      <div class="legend-item">
        <span class="legend-color" style="background:#2e7d32"></span>
        <span class="legend-label">成熟期</span>
      </div>
      <div class="legend-item">
        <span class="legend-color" style="background:#fdd835"></span>
        <span class="legend-label">可收获</span>
      </div>
    </div>

    <!-- Clickable info hotspot -->
    <FarmHotspot
      :visible="hotspot.visible"
      :name="hotspot.name"
      :type="hotspot.type"
      :status="hotspot.status"
      :stage="hotspot.stage"
      :description="hotspot.description"
      :crop="hotspot.crop"
      :position="hotspot.position"
      @close="closeHotspot"
    />
  </div>
</template>

<style scoped>
@import url('../../assets/css/FarmScene.css');
</style>
