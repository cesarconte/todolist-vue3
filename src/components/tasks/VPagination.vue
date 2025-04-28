<!-- VPagination.vue -->

<script setup>
import { useDisplay } from 'vuetify'

/************************************
 * Props
 ************************************/
const props = defineProps({
  currentPage: {
    type: Number,
    required: true
  },
  totalPages: {
    type: Number,
    required: true
  },
  hasPrevPage: {
    type: Boolean,
    required: true
  },
  hasNextPage: {
    type: Boolean,
    required: true
  }
})

/************************************
 * Emits
 ************************************/
const emits = defineEmits(['prev-page', 'next-page', 'first-page', 'last-page'])

/************************************
 * Methods / Functions
 ************************************/
const prevPage = () => {
  emits('prev-page')
}

const nextPage = () => {
  emits('next-page')
}

const firstPage = () => {
  emits('first-page')
}

const lastPage = () => {
  emits('last-page')
}

// Usamos todos los breakpoints disponibles para una mejor responsividad
const { xs, sm } = useDisplay()
</script>

<template>
  <v-row :class="xs ? 'pa-2' : sm ? 'pa-4' : 'pa-6'" class="d-flex">
    <div
      class="container-tasks-title d-flex mx-auto w-100"
      :class="xs ? 'justify-center' : 'justify-space-between'"
    >
      <v-spacer v-if="!xs"></v-spacer>
      <v-btn
        icon
        :class="xs ? 'me-1' : 'me-2'"
        class="align-self-center"
        variant="tonal"
        color="primary"
        @click="firstPage"
        :disabled="currentPage === 1"
        :size="xs ? 'x-small' : 'small'"
        aria-label="Go to first page"
      >
        <v-icon :size="xs ? 16 : 20">mdi-skip-backward</v-icon>
        <v-tooltip activator="parent" location="bottom" class="first-page-tooltip">
          First page
        </v-tooltip>
      </v-btn>
      <v-btn
        icon
        :class="xs ? 'me-1' : 'me-2'"
        class="align-self-center"
        variant="tonal"
        color="primary"
        @click="prevPage"
        :disabled="!props.hasPrevPage"
        :size="xs ? 'x-small' : 'small'"
        aria-label="Go to previous page"
      >
        <v-icon :size="xs ? 16 : 20"> mdi-chevron-left </v-icon>
        <v-tooltip activator="parent" location="bottom" class="previous-page-tooltip">
          Previous page
        </v-tooltip>
      </v-btn>
      <span
        class="page-indicator font-weight-semibold d-flex align-items-center rounded-lg bg-surface-variant text-on-surface-variant"
        :class="
          xs ? 'text-caption px-2 py-2 mx-1' : sm ? 'text-body-2 px-3 py-2 mx-2' : 'pa-3 me-2'
        "
      >
        <slot>
          <span v-if="xs">{{ currentPage }}/{{ totalPages }}</span>
          <span v-else>Page {{ currentPage }} of {{ totalPages }}</span>
        </slot>
      </span>
      <v-btn
        icon
        :class="xs ? 'me-1' : 'me-2'"
        class="align-self-center"
        variant="tonal"
        color="primary"
        @click="nextPage"
        :disabled="!props.hasNextPage"
        :size="xs ? 'x-small' : 'small'"
        aria-label="Go to next page"
      >
        <v-icon :size="xs ? 16 : 20"> mdi-chevron-right </v-icon>
        <v-tooltip activator="parent" location="bottom" class="next-page-tooltip">
          Next page
        </v-tooltip>
      </v-btn>
      <v-btn
        icon
        :class="xs ? 'me-1' : 'me-2'"
        class="align-self-center"
        variant="tonal"
        color="primary"
        @click="lastPage"
        :disabled="currentPage === totalPages || totalPages === 0"
        :size="xs ? 'x-small' : 'small'"
        aria-label="Go to last page"
      >
        <v-icon :size="xs ? 16 : 20">mdi-skip-forward</v-icon>
        <v-tooltip activator="parent" location="bottom" class="last-page-tooltip">
          Last page
        </v-tooltip>
      </v-btn>
    </div>
  </v-row>
</template>
