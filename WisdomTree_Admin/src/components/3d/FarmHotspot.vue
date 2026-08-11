<script setup>
import { computed } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  name: { type: String, default: '' },
  type: { type: String, default: '' },
  status: { type: String, default: '' },
  stage: { type: String, default: '' },
  description: { type: String, default: '' },
  crop: { type: String, default: '' },
  /** { x: number, y: number } – screen pixel coords */
  position: { type: Object, default: () => ({ x: 0, y: 0 }) }
})

const emit = defineEmits(['close'])

const typeLabel = computed(() => {
  const map = {
    field: '农田',
    building: '建筑',
    greenhouse: '温室',
    pond: '鱼塘',
    tree: '树木'
  }
  return map[props.type] || props.type
})

const statusColor = computed(() => {
  const map = {
    seedling: '#8bc34a',
    growing: '#4caf50',
    mature: '#2e7d32',
    harvest: '#ffeb3b',
    active: '#4caf50',
    full: '#2196f3',
    normal: '#ff9800'
  }
  return map[props.status] || '#999'
})

const statusLabel = computed(() => {
  const map = {
    seedling: '幼苗期',
    growing: '生长期',
    mature: '成熟期',
    harvest: '可收获',
    active: '使用中',
    full: '已满',
    normal: '正常'
  }
  return map[props.status] || props.status
})
</script>

<template>
  <transition name="hotspot-fade">
    <div
      v-if="visible"
      class="farm-hotspot"
      :style="{ left: position.x + 'px', top: position.y + 'px' }"
    >
      <div class="hotspot-header">
        <span class="hotspot-type" :style="{ background: statusColor }">{{ typeLabel }}</span>
        <button class="hotspot-close" @click="emit('close')">✕</button>
      </div>
      <h3 class="hotspot-name">{{ name }}</h3>
      <div class="hotspot-body">
        <div class="hotspot-row" v-if="crop">
          <span class="row-label">作物</span>
          <span class="row-value">{{ crop }}</span>
        </div>
        <div class="hotspot-row" v-if="stage">
          <span class="row-label">阶段</span>
          <span class="row-value">{{ stage }}</span>
        </div>
        <div class="hotspot-row">
          <span class="row-label">状态</span>
          <span class="row-value">
            <span class="status-dot" :style="{ background: statusColor }"></span>
            {{ statusLabel }}
          </span>
        </div>
        <div class="hotspot-desc" v-if="description">
          {{ description }}
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.farm-hotspot {
  position: fixed;
  z-index: 2000;
  min-width: 220px;
  max-width: 300px;
  background: rgba(20, 30, 20, 0.92);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 14px;
  padding: 0;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(255, 255, 255, 0.05) inset,
    0 0 20px rgba(76, 175, 80, 0.15);
  transform: translate(-50%, -100%) translateY(-16px);
  pointer-events: auto;
  overflow: hidden;
}

/* arrow pointing down to the 3D object */
.farm-hotspot::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid rgba(30, 50, 30, 0.95);
}

.hotspot-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px 6px;
}

.hotspot-type {
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  padding: 2px 10px;
  border-radius: 20px;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.hotspot-close {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  font-size: 16px;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
  transition: color 0.2s;
}

.hotspot-close:hover {
  color: #fff;
}

.hotspot-name {
  margin: 0;
  padding: 2px 14px 8px;
  font-size: 17px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.5px;
}

.hotspot-body {
  padding: 0 14px 14px;
}

.hotspot-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 13px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.hotspot-row:last-of-type {
  border-bottom: none;
}

.row-label {
  color: rgba(255, 255, 255, 0.5);
  font-weight: 500;
}

.row-value {
  color: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.hotspot-desc {
  margin-top: 8px;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.5;
}

/* transition */
.hotspot-fade-enter-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.hotspot-fade-leave-active {
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.hotspot-fade-enter-from,
.hotspot-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -100%) translateY(-8px) scale(0.92);
}
</style>
