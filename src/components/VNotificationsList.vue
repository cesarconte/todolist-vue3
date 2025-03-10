<script setup>
import { useNotificationsStore } from '@/stores/notificationsStore'

const props = defineProps({
  items: {
    type: Array,
    required: true
  }
})

const notificationsStore = useNotificationsStore()

const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleCheckboxChange = (item) => {
  notificationsStore.markAsRead(item.id)
}
</script>

<template>
  <v-list density="compact" class="notification-list">
    <v-list-item
      v-for="item in props.items"
      :key="item.id"
      :title="item.message"
      :subtitle="formatDate(item.timestamp)"
    >
      <template v-slot:prepend>
        <v-checkbox
          :model-value="item.read"
          @click.stop="handleCheckboxChange(item)"
          color="red-darken-2"
          hide-details
        />
      </template>
      
      <template v-slot:append>
        <v-icon
          :icon="item.read ? 'mdi-bell-off' : 'mdi-bell-alert'"
          :color="item.read ? 'grey' : 'red-darken-2'"
        />
      </template>
    </v-list-item>
  </v-list>
</template>