<template>
  <div
    class="empty-state-container text-center d-flex flex-column align-center justify-center py-8"
  >    <v-icon :size="iconSize" :color="iconColor" class="empty-icon mb-4">{{ icon }}</v-icon>
    <p class="text-h6 font-weight-medium mt-4 mb-2" :class="textColor">{{ title }}</p>
    <span class="text-body-2 mb-4" :class="textColor">{{ subtitle }}</span>
    <slot />
  </div>
</template>

<script setup>
import { toRefs } from 'vue'

const props = defineProps({
  icon: { type: String, default: 'mdi-magnify' },
  iconSize: { type: [String, Number], default: 80 },
  iconColor: { type: String, default: 'on-surface' },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  textColor: { type: String, default: 'on-surface' }
})

// Desestructuramos props para que sean reactivas en el template
const { icon, iconSize, iconColor, title, subtitle, textColor } = toRefs(props)
</script>

<style scoped>
.empty-state-container {
  min-height: 30vh;
  transition: all 0.3s ease;
}
.empty-icon {
  transform: translateY(-5px);
  animation: float 3s ease-in-out infinite;
}
@keyframes float {
  0%,
  100% {
    transform: translateY(-5px);
  }
  50% {
    transform: translateY(5px);
  }
}
</style>
