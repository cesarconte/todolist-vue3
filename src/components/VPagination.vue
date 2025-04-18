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

const { mobile } = useDisplay()
</script>

<template>
  <v-row class="pa-3 d-flex">
    <div
      class="container-tasks-title d-flex mx-auto w-100"
      :class="mobile ? 'justify-center' : 'justify-space-between'"
    >
      <v-spacer v-if="!mobile"></v-spacer>
      <v-btn
        icon
        class="me-2 align-self-center"
        variant="elevated"
        color="red-accent-2"
        @click="firstPage"
        :disabled="currentPage === 1"
        size="small"
      >
        <v-icon>mdi-skip-backward</v-icon>
        <v-tooltip
          activator="parent"
          location="bottom"
          color="red-accent-2"
          class="first-page-tooltip"
        >
          First page
        </v-tooltip>
      </v-btn>
      <v-btn
        icon
        class="me-2 align-self-center"
        variant="elevated"
        color="red-accent-2"
        @click="prevPage"
        :disabled="!props.hasPrevPage"
        size="small"
      >
        <v-icon> mdi-chevron-left </v-icon>
        <v-tooltip
          activator="parent"
          location="bottom"
          color="red-accent-2"
          class="previous-page-tooltip"
        >
          Previous page
        </v-tooltip>
      </v-btn>
      <span class="page-indicator me-2 font-weight-semibold pa-3">
        <slot> Page {{ currentPage }} of {{ totalPages }} </slot>
      </span>
      <v-btn
        icon
        class="me-2 align-self-center"
        variant="elevated"
        color="red-accent-2"
        @click="nextPage"
        :disabled="!props.hasNextPage"
        size="small"
      >
        <v-icon> mdi-chevron-right </v-icon>
        <v-tooltip activator="parent" location="bottom" color="primary" class="next-page-tooltip">
          Next page
        </v-tooltip>
      </v-btn>
      <v-btn
        icon
        class="me-2 align-self-center"
        variant="elevated"
        color="red-accent-2"
        @click="lastPage"
        :disabled="currentPage === totalPages || totalPages === 0"
        size="small"
      >
        <v-icon>mdi-skip-forward</v-icon>
        <v-tooltip
          activator="parent"
          location="bottom"
          color="red-accent-2"
          class="last-page-tooltip"
        >
          Last page
        </v-tooltip>
      </v-btn>
    </div>
  </v-row>
</template>
