// VLoginCard.vue
<script setup>
import { useDisplay } from 'vuetify'
import { useUserStore } from '@/stores/userStore'

/************************************
 * Props
 ************************************/
defineProps({
  title: {
    type: String,
    default: 'todolist'
  },
  heading: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  nextRoute: {
    type: String,
    required: true
  }
})

/************************************
 * Stores
 ************************************/
const userStore = useUserStore() // Accesses the user store

/************************************
 * Vuetify Display
 ************************************/
const { xs } = useDisplay() // Accesses display breakpoints from Vuetify
</script>

<template>
  <v-card class="rounded-xl pa-8">
    <v-row>
      <v-col cols="auto">
        <div class="rounded-pill bg-red-darken-2 px-8 py-8 d-flex">
          <template v-if="!xs">
            <h3 class="text-h5 text-weight-bold text-grey-lighten-4 mr-8">{{ title }}</h3>
          </template>
          <v-icon class="icon align-self-center" size="x-large"
            >mdi-checkbox-marked-circle-auto-outline</v-icon
          >
        </div>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" md="6" class="pr-8">
        <h2 class="text-h4 mb-8">{{ heading }}</h2>
        <p class="mt-8 text-body-1">
          {{ description }}
          <v-icon class="icon" color="red-darken-2">mdi-chevron-right</v-icon>
        </p>
      </v-col>
      <v-col cols="12" md="6" class="pl-8">
        <slot name="form"></slot>
      </v-col>
      <v-col cols="12" class="text-right pa-8 mt-8">
        <v-btn
          class="rounded-pill text-none text-subtitle-2 px-8"
          :class="xs ? 'mb-8' : 'mr-8'"
          variant="text"
          color="red-darken-2"
          :href="'https://accounts.google.com/signin/v2/usernamerecovery?continue=https%3A%2F%2Faccounts.google.com%2F&ddm=0&flowEntry=ServiceLogin&flowName=GlifWebSignIn&followup=https%3A%2F%2Faccounts.google.com%2F&ifkv=Ab5oB3opUM5VLl_Gw1DaVxkZJm5NtYwh3AqkS-QMpVSmtRnnHgvjzNVkGpaPhqDJcLWWAPrJCFWt'"
          target="_blank"
          >Forgot email?</v-btn
        >
        <v-btn
          class="rounded-pill text-none text-subtitle-2 px-8"
          :class="xs ? 'mb-8' : 'mr-8'"
          variant="text"
          color="red-darken-2"
          :href="'https://accounts.google.com/v3/signin/challenge/pk/presend?TL=AKeb6mye_XcbyjuJt93WjRp0qje0nO_i5v7UyX_JFxzP_lbLW8gASdjfiGyljtK-&checkConnection=youtube%3A221&checkedDomains=youtube&cid=2&continue=https%3A%2F%2Faccounts.google.com%2F&ddm=0&flowEntry=ServiceLogin&flowName=GlifWebSignIn&followup=https%3A%2F%2Faccounts.google.com%2F&ifkv=Ab5oB3rpnQ7URyFyvLrnfOLuSWuQJJManup-Q_JZriOqIDiekby3KZcuNuA5Iemv-Ve8--jhoFVK3Q&pstMsg=1'"
          target="_blank"
          >Forgot password?</v-btn
        >
        <v-btn
          color="red-darken-2"
          variant="flat"
          class="rounded-pill text-none text-subtitle-2 px-8"
          @click="userStore.logInWithGoogle('signup')"
        >
          Sign in
        </v-btn>
      </v-col>
    </v-row>
  </v-card>
</template>
