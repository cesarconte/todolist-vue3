<template>
  <v-fade-transition>
    <div 
      v-if="isVisible"
      class="v-back-btn-wrapper"
      :class="{ 'is-xs': xs }"
      :style="wrapperStyle"
    >
      <v-btn
        variant="elevated"
        color="surface"
        class="v-back-btn d-inline-flex align-center"
        rounded="pill"
        :size="xs ? 'default' : 'large'"
        prepend-icon="mdi-chevron-left"
        elevation="6"
        v-bind="$attrs"
        @click="handleClick"
      >
        <slot>{{ label }}</slot>
      </v-btn>
    </div>
  </v-fade-transition>
</template>

<script>
export default {
  inheritAttrs: false
}
</script>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useDisplay } from 'vuetify'
import { useRouter } from 'vue-router'

const { xs } = useDisplay()
const router = useRouter()

const props = defineProps({
  label: {
    type: String,
    default: 'Back'
  },
  to: {
    type: String,
    default: '/'
  },
  threshold: {
    type: Number,
    default: 150
  }
})

const isVisible = ref(false)
const bottomOffset = ref(xs.value ? 24 : 32)

const handleClick = () => {
  if (props.to) {
    router.push(props.to)
  } else {
    router.back()
  }
}

const handleScroll = () => {
  const scrollY = window.scrollY
  const windowHeight = window.innerHeight
  const documentHeight = document.documentElement.scrollHeight
  
  isVisible.value = scrollY > 150

  const footerElement = document.querySelector('.v-footer')
  const footerHeight = footerElement ? footerElement.offsetHeight : 0
  const distanceFromBottom = documentHeight - (scrollY + windowHeight)
  
  const baseBottom = xs.value ? 24 : 32
  
  if (distanceFromBottom < footerHeight) {
    bottomOffset.value = baseBottom + (footerHeight - distanceFromBottom)
  } else {
    bottomOffset.value = baseBottom
  }
}

const wrapperStyle = computed(() => ({
  bottom: `${bottomOffset.value}px`
}))

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.v-back-btn-wrapper {
  position: fixed;
  right: 32px;
  z-index: 1000;
  transition: bottom 0.1s ease-out; /* Suavizamos el movimiento de subida */
}

.v-back-btn {
  font-weight: 700;
  letter-spacing: 0.5px;
  min-width: 100px;
  text-transform: none;
  border: 1px solid rgba(var(--v-border-color), 0.12);
}

.is-xs.v-back-btn-wrapper {
  right: 16px;
}

.v-back-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 16px rgba(0,0,0,0.2) !important;
}
</style>
