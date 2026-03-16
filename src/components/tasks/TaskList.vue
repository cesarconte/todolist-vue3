<script setup>
import CardTask from '@/components/tasks/CardTask.vue'
import EmptyState from '@/components/tasks/EmptyState.vue'

defineProps({
  tasks: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  emptyMessage: {
    type: String,
    default: 'No tasks found'
  }
})

const emit = defineEmits(['delete-task', 'edit-task', 'complete-task'])

const handleDelete = (projectId, taskId) => emit('delete-task', projectId, taskId)
const handleEdit = (projectId, taskId) => emit('edit-task', projectId, taskId)
const handleComplete = (projectId, taskId) => emit('complete-task', projectId, taskId)
</script>

<template>
  <v-row v-if="loading" justify="center" class="ma-4">
    <v-progress-circular indeterminate color="primary" size="64" />
  </v-row>

  <v-row v-else-if="tasks.length === 0" justify="center" class="ma-4">
    <EmptyState :message="emptyMessage" />
  </v-row>

  <v-row v-else class="ma-0 ga-4">
    <v-col v-for="task in tasks" :key="task.id" cols="12">
      <CardTask
        v-bind="task"
        @delete-task="handleDelete"
        @edit-task="handleEdit"
        @complete-task="handleComplete"
      />
    </v-col>
  </v-row>
</template>
