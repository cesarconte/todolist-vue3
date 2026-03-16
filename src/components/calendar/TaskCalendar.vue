<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectStore } from '@/stores/projectStore'

const props = defineProps({
  events: {
    type: Array,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  weekdays: {
    type: Array,
    required: true
  },
  modelValue: {
    type: Date,
    required: true
  }
})

const emit = defineEmits(['event-click', 'update:modelValue'])

const router = useRouter()
const projectStore = useProjectStore()

const calendarDate = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const handleEventClick = (payload) => {
  const task = payload.event || payload
  if (task && task.id) {
    router.push({ name: 'task-detail', params: { taskId: task.id } })
  }
}
</script>

<template>
  <v-row justify="center" class="ma-0">
    <v-col cols="12" class="pa-4">
      <v-calendar
        v-model="calendarDate"
        :events="events"
        :type="type"
        :weekdays="weekdays"
        class="task-calendar"
        style="height: 600px"
        aria-label="Tasks Calendar"
        @click:event="handleEventClick"
      >
        <template #event="{ event }">
          <v-sheet
            color="transparent"
            class="px-1 text-white font-weight-bold w-100 h-100 d-flex align-center"
            :class="{
              'text-decoration-line-through opacity-60 font-weight-regular': event.completed
            }"
            style="
              font-size: 14px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              cursor: pointer;
            "
            @click.stop="handleEventClick(event)"
          >
            <v-icon v-if="event.completed" size="x-small" class="me-1">mdi-check-circle</v-icon>
            <v-icon v-else size="x-small" class="me-1">
              {{
                event.projectId
                  ? projectStore.projects.find((p) => p.id === event.projectId)?.icon
                  : 'mdi-circle-outline'
              }}
            </v-icon>
            {{ event.name }}
          </v-sheet>
        </template>
      </v-calendar>
    </v-col>
  </v-row>
</template>

<style scoped>
.task-calendar {
  /* Add any specific calendar styles here if needed */
}
</style>
