<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { useRouter } from 'vue-router'

// 使用 useRouter 获取路由实例
const router = useRouter()

// 跳转方法
const handleEdit = () => {
  router.push({
    path: '/admindataChart/index'
  })
}

let renderer, scene, camera, controls
let trees = [] // 存储多个树木
let flowers = [] // 存储花朵
let particles = null // 当前活动的粒子系统
let seasonText = null
// 浇水施肥提示词
const tips = ref('')
// 季节颜色
const seasonColors = {
  spring: { tree: 0x3c8f3c, ground: 0x80c780 },
  summer: { tree: 0x2d702d, ground: 0x70a770 },
  autumn: { tree: 0xdc4224, ground: 0xb59b73 },
  winter: { tree: 0xaaaaaa, ground: 0xffffff }
}
const elementColors = {
  stone: 0x808080,
  mushroomCap: 0xff6666,
  mushroomStem: 0xffffff
}
let currentSeason = 'spring'

// 在全局变量中添加
// let infoText = null
// 初始化场景
function initScene() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xa0d0f0)

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
  camera.position.set(10, 10, 15)

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance'
  })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.shadowMap.enabled = true
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.2
  renderer.setSize(window.innerWidth, window.innerHeight)
  document.querySelector('.page').appendChild(renderer.domElement)

  controls = new OrbitControls(camera, renderer.domElement)

  // 增强光照系统
  const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444422, 0.6)
  hemisphereLight.position.set(0, 20, 0)
  scene.add(hemisphereLight)

  const dirLight = new THREE.DirectionalLight(0xffffff, 1)
  dirLight.position.set(10, 20, 10)
  dirLight.castShadow = true
  dirLight.shadow.mapSize.set(2048, 2048)
  scene.add(dirLight)

  // 添加填充光
  const fillLight = new THREE.DirectionalLight(0xccffff, 0.3)
  fillLight.position.set(-10, 10, 10)
  scene.add(fillLight)
}

// 添加提示词显示函数
function showTip(message) {
  tips.value = message
  setTimeout(() => (tips.value = ''), 2000)
}

// 创建带叶子的树木
function createTree(position, scale = 1) {
  const tree = new THREE.Group()
  tree.userData = { originalScale: scale, leaves: [] }

  // 树干
  const trunkGeometry = new THREE.CylinderGeometry(0.3 * scale, 0.5 * scale, 3 * scale, 8)
  const trunkMaterial = new THREE.MeshStandardMaterial({
    color: 0x4d3225,
    metalness: 0.1,
    roughness: 0.8,
    normalScale: new THREE.Vector2(0.8, 0.8)
  })
  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial)
  trunk.castShadow = true
  trunk.position.y = 1.5 * scale
  tree.add(trunk)

  // 树冠
  const crown = new THREE.Group()
  const levels = 3
  for (let i = 0; i < levels; i++) {
    const geometry = new THREE.ConeGeometry((1.5 - i * 0.4) * scale, 2 * scale, 8)
    const material = new THREE.MeshPhongMaterial({
      color: seasonColors[currentSeason].tree,
      transparent: true,
      opacity: 0.8
    })
    const cone = new THREE.Mesh(geometry, material)
    cone.position.y = (3 + i * 1.5) * scale
    cone.rotation.x = Math.PI
    cone.castShadow = true
    crown.add(cone)
  }
  tree.add(crown)

  // 初始树叶
  addLeaves(tree, 30 * scale)

  tree.position.copy(position)
  return tree
}

// 添加石头创建函数
function createStone(position) {
  const stone = new THREE.Group()
  const geometry = new THREE.SphereGeometry(0.5 + Math.random() * 0.3)
  const material = new THREE.MeshPhongMaterial({
    color: elementColors.stone,
    bumpScale: 0.05
  })
  const main = new THREE.Mesh(geometry, material)
  main.castShadow = true
  stone.add(main)
  stone.position.copy(position)
  return stone
}

// 添加蘑菇创建函数
function createMushroom(position) {
  const mushroom = new THREE.Group()

  // 菌柄
  const stemGeometry = new THREE.CylinderGeometry(0.1, 0.08, 0.5)
  const stemMaterial = new THREE.MeshPhongMaterial({ color: elementColors.mushroomStem })
  const stem = new THREE.Mesh(stemGeometry, stemMaterial)
  stem.position.y = 0.25
  mushroom.add(stem)

  // 菌盖
  const capGeometry = new THREE.SphereGeometry(0.2, 32, 16, 0, Math.PI)
  const capMaterial = new THREE.MeshPhongMaterial({ color: elementColors.mushroomCap })
  const cap = new THREE.Mesh(capGeometry, capMaterial)
  cap.position.y = 0.5
  mushroom.add(cap)

  mushroom.position.copy(position)
  return mushroom
}

// 添加树叶
function addLeaves(tree, count = 10) {
  const leafTexture = new THREE.TextureLoader().load('/images/yezi.png')
  const leafMaterial = new THREE.MeshPhongMaterial({
    map: leafTexture,
    alphaTest: 0.5,
    transparent: true,
    color: seasonColors[currentSeason].tree
  })

  for (let i = 0; i < count; i++) {
    const leaf = createLeaf(leafMaterial, tree.userData.originalScale)
    tree.userData.leaves.push(leaf)
    tree.add(leaf)
  }
}

// 创建单个树叶
function createLeaf(material, scale) {
  const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.5 * scale, 0.5 * scale), material)
  leaf.position.set(
    (Math.random() - 0.5) * 3 * scale,
    3 + Math.random() * 4 * scale,
    (Math.random() - 0.5) * 3 * scale
  )
  leaf.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI)
  leaf.castShadow = true
  return leaf
}

// 创建花朵
function createFlower(position) {
  const flower = new THREE.Group()

  // 茎
  const stemGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1)
  const stemMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 })
  const stem = new THREE.Mesh(stemGeometry, stemMaterial)
  stem.castShadow = true
  flower.add(stem)

  // 花蕊
  const centerGeometry = new THREE.SphereGeometry(0.2)
  const centerMaterial = new THREE.MeshPhongMaterial({ color: 0xffd700 })
  const center = new THREE.Mesh(centerGeometry, centerMaterial)
  center.position.y = 1
  flower.add(center)

  // 花瓣
  const petalGeometry = new THREE.ConeGeometry(0.3, 0.1, 4)
  const petalMaterial = new THREE.MeshPhongMaterial({ color: 0xff69b4 })
  for (let i = 0; i < 6; i++) {
    const petal = new THREE.Mesh(petalGeometry, petalMaterial)
    petal.rotation.z = (i * Math.PI) / 3
    petal.position.y = 1
    flower.add(petal)
  }

  flower.position.copy(position)
  return flower
}

// 创建灌木丛
function createBush(position) {
  const bush = new THREE.Group()
  const geometry = new THREE.SphereGeometry(1, 8, 8)
  const material = new THREE.MeshPhongMaterial({ color: 0x2d702d })

  for (let i = 0; i < 3; i++) {
    const part = new THREE.Mesh(geometry, material)
    part.position.set((Math.random() - 0.5) * 0.5, i * 0.3, (Math.random() - 0.5) * 0.5)
    part.castShadow = true
    bush.add(part)
  }

  bush.position.copy(position)
  return bush
}

// 创建地面
function createGround() {
  const groundGeometry = new THREE.PlaneGeometry(40, 40)
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x80c780,
    roughness: 0.9,
    metalness: 0.1,
    normalScale: new THREE.Vector2(0.5, 0.5)
  })
  const ground = new THREE.Mesh(groundGeometry, groundMaterial)
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)
}

// 浇水动画
function waterAnimation() {
  showTip('💧 浇水成功，树叶正在增加！')
  clearParticles()

  const geometry = new THREE.BufferGeometry()
  const positions = []
  const particleCount = 800

  for (let i = 0; i < particleCount; i++) {
    positions.push((Math.random() - 0.5) * 40, 8 + Math.random() * 3, (Math.random() - 0.5) * 40)
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))

  const material = new THREE.PointsMaterial({
    color: 0x3399ff,
    size: 0.08,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0.8,
    sizeAttenuation: true
  })

  particles = new THREE.Points(geometry, material)
  scene.add(particles)

  // 添加树叶生长效果
  trees.forEach((tree) => {
    addLeaves(tree, 15) // 增加更多树叶
    tree.children[1].children.forEach((cone) => {
      cone.material.color.set(seasonColors[currentSeason].tree).convertSRGBToLinear()
    })
  })
}

// 施肥动画
function fertilizerAnimation() {
  showTip('🌳 施肥成功，树木正在生长！')
  clearParticles()

  const geometry = new THREE.BufferGeometry()
  const positions = []
  const particleCount = 600

  for (let i = 0; i < particleCount; i++) {
    positions.push((Math.random() - 0.5) * 40, 6 + Math.random() * 3, (Math.random() - 0.5) * 40)
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))

  const material = new THREE.PointsMaterial({
    color: 0x8b4513,
    size: 0.1,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0.8,
    sizeAttenuation: true
  })

  particles = new THREE.Points(geometry, material)
  scene.add(particles)

  // 所有树木生长效果
  trees.forEach((tree) => {
    tree.children[1].children.forEach((cone) => {
      cone.scale.y *= 1.05
      cone.scale.x *= 1.02
      cone.scale.z *= 1.02
    })
    addLeaves(tree, 5) // 施肥也增加叶子
  })
}

// 切换季节
function changeSeason() {
  const seasons = Object.keys(seasonColors)
  currentSeason = seasons[(seasons.indexOf(currentSeason) + 1) % seasons.length]

  // 更新季节文字
  showSeasonText(currentSeason)

  // 更新树木颜色
  trees.forEach((tree) => {
    tree.children[1].children.forEach((cone) => {
      cone.material.color.set(seasonColors[currentSeason].tree)
    })
    // 更新树叶颜色
    tree.userData.leaves.forEach((leaf) => {
      leaf.material.color.set(seasonColors[currentSeason].tree)
    })
  })

  // 更新地面颜色
  scene.children
    .find((child) => child.type === 'Mesh')
    .material.color.set(seasonColors[currentSeason].ground)
}

// 显示季节文字
function showSeasonText(season) {
  // 先移除现有文字（如果有且仍然在DOM中）
  if (seasonText && document.body.contains(seasonText)) {
    document.body.removeChild(seasonText)
    seasonText = null
  }

  // 创建新文字元素
  const newSeasonText = document.createElement('div')
  newSeasonText.className = 'season-text'
  newSeasonText.textContent = season.charAt(0).toUpperCase() + season.slice(1)

  // 正确设置新元素的样式（修改这里）
  newSeasonText.style.position = 'fixed'
  newSeasonText.style.top = '50%'
  newSeasonText.style.left = '50%'
  newSeasonText.style.transform = 'translate(-50%, -50%)'
  newSeasonText.style.color = '#ffffff'
  newSeasonText.style.fontSize = '48px'
  newSeasonText.style.fontWeight = 'bold'
  newSeasonText.style.textShadow = '0 0 10px rgba(255,255,255,0.8)'
  newSeasonText.style.pointerEvents = 'none'
  // 内联动画：scoped CSS 无法作用到动态创建的 DOM 节点，必须内联才能触发 animationend
  newSeasonText.style.animation = 'fadeOut 2s ease-in forwards'

  // 添加元素到DOM
  document.body.appendChild(newSeasonText)
  seasonText = newSeasonText

  // 自动移除逻辑（双保险：animationend 事件 + setTimeout 兜底）
  const removeHandler = () => {
    if (document.body.contains(newSeasonText)) {
      document.body.removeChild(newSeasonText)
    }
    if (seasonText === newSeasonText) seasonText = null
    newSeasonText.removeEventListener('animationend', removeHandler)
  }

  // 监听动画结束事件
  newSeasonText.addEventListener('animationend', removeHandler)
  // 兜底：即使动画因任何原因未触发，2.5s 后强制删除
  setTimeout(removeHandler, 2500)
}

// 重置场景
function resetScene() {
  clearParticles()

  // 重置树木状态
  trees.forEach((tree) => {
    // 重置缩放
    tree.children[1].children.forEach((cone) => {
      cone.scale.set(1, 1, 1)
    })

    // 重置叶子数量
    const originalCount = tree.userData.originalScale * 30
    const currentCount = tree.userData.leaves.length
    if (currentCount > originalCount) {
      tree.userData.leaves.splice(originalCount).forEach((leaf) => {
        tree.remove(leaf)
      })
    }

    // 重置颜色
    tree.children[1].children.forEach((cone) => {
      cone.material.color.set(seasonColors[currentSeason].tree)
    })
  })

  // 重置地面颜色
  scene.children
    .find((child) => child.type === 'Mesh')
    .material.color.set(seasonColors[currentSeason].ground)
}

// 清除粒子
function clearParticles() {
  if (particles) {
    scene.remove(particles)
    particles = null
  }
}

// 动画循环
function animate() {
  requestAnimationFrame(animate)

  // 树木摆动
  trees.forEach((tree) => {
    tree.rotation.y += 0.002
    tree.children[1].children.forEach((cone, i) => {
      cone.rotation.z = Math.sin(Date.now() * 0.001 + i) * 0.1
    })
  })

  // 花朵旋转
  flowers.forEach((flower) => {
    flower.rotation.y += 0.01
  })

  // 粒子动画
  if (particles) {
    const positions = particles.geometry.attributes.position.array
    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 1] -= 0.08
      if (positions[i + 1] < 0) positions[i + 1] = 6 + Math.random() * 3
    }
    particles.geometry.attributes.position.needsUpdate = true
  }

  // 更新 OrbitControls 状态
  controls.update()
  renderer.render(scene, camera)
}

// 初始化场景和模型
function initModels() {
  // 创建多棵树
  const treePositions = [
    new THREE.Vector3(-5, 0, -5),
    new THREE.Vector3(8, 0, 3),
    new THREE.Vector3(-3, 0, 6),
    new THREE.Vector3(5, 0, -3),
    new THREE.Vector3(-8, 0, -3),
    new THREE.Vector3(3, 0, -8)
  ]
  trees = treePositions.map((pos) => {
    const tree = createTree(pos, 0.8 + Math.random() * 0.4)
    scene.add(tree)
    return tree
  })

  // 创建花朵
  for (let i = 0; i < 20; i++) {
    const flower = createFlower(
      new THREE.Vector3((Math.random() - 0.5) * 30, 0, (Math.random() - 0.5) * 30)
    )
    flowers.push(flower)
    scene.add(flower)
  }

  // 添加石头
  for (let i = 0; i < 10; i++) {
    const stone = createStone(
      new THREE.Vector3((Math.random() - 0.5) * 35, 0, (Math.random() - 0.5) * 35)
    )
    scene.add(stone)
  }

  // 添加蘑菇
  for (let i = 0; i < 20; i++) {
    const mushroom = createMushroom(
      new THREE.Vector3((Math.random() - 0.5) * 35, 0, (Math.random() - 0.5) * 35)
    )
    scene.add(mushroom)
  }

  // 创建灌木丛
  const bushPositions = [
    new THREE.Vector3(2, 0, 2),
    new THREE.Vector3(-4, 0, -2),
    new THREE.Vector3(3, 0, -6),
    new THREE.Vector3(-2, 0, 4),
    new THREE.Vector3(2, 0, -3),
    new THREE.Vector3(-3, 0, 10)
  ]
  bushPositions.forEach((pos) => {
    scene.add(createBush(pos))
  })

  // 创建3D文字
  // const loader = new FontLoader()
  // loader.load('../../../public/font/FangSong_Regular.json', (font) => {
  //   // 确保字体文件放在public/fonts目录
  //   const textGeometry = new TextGeometry('3D树木模型养护演示', {
  //     font: font,
  //     size: 1.5,
  //     // 添加文字厚度
  //     bevelEnabled: true, // 启用倒角
  //     bevelThickness: 0.02, // 倒角厚度
  //     bevelSize: 0.05, // 倒角大小
  //     curveSegments: 12 // 曲线分段数
  //   })

  //   textGeometry.center()

  //   const textMaterial = new THREE.MeshPhongMaterial({
  //     color: 0x4caf50
  //   })
  //   infoText = new THREE.Mesh(textGeometry, textMaterial)
  //   infoText.position.set(0, 15, 0)
  //   scene.add(infoText)
  // })
}

onMounted(() => {
  initScene()
  createGround()
  initModels()
  animate()
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animate)
  if (renderer) renderer.dispose()
  // 清理残留的季节文字（防止退出后文字仍停留在页面上）
  if (seasonText && document.body.contains(seasonText)) {
    document.body.removeChild(seasonText)
  }
  seasonText = null
})
</script>

<template>
  <!-- 标题介绍 -->
  <div class="title">3D树木模型养护演示</div>
  <!-- 控制按钮 -->
  <div class="controls">
    <button @click="waterAnimation">浇水</button>
    <button @click="fertilizerAnimation">施肥</button>
    <button @click="changeSeason">切换季节</button>
    <button @click="resetScene">重置</button>
    <button @click="handleEdit" class="back-button">返回</button>
  </div>
  <div class="page"></div>
  <div v-if="tips" class="tips-container">{{ tips }}</div>
</template>

<style scoped>
@import url('../../assets/css/TreeModel.css');
</style>
