<template>
  <v-footer class="d-flex flex-column pa-8" color="surface-variant">
    <v-row>
      <v-col cols="auto" class="mt-4">
        <section class="rounded-lg px-6 py-3" :class="'bg-primary'">
          <p class="text-h5 text-weight-bold text-on-primary">
            todolist
            <v-icon class="icon todolist-logo text-on-primary"
              >mdi-checkbox-marked-circle-auto-outline</v-icon
            >
          </p>
        </section>
      </v-col>
    </v-row>
    <article class="mt-4 text-center text-on-surface-variant">
      <p>A simple and efficient web application to manage your daily tasks.</p>
    </article>
    <v-row class="mt-4 w-auto d-flex justify-space-between">
      <v-col cols="auto" md="4">
        <h5 class="text-h6 text-weight-bold text-on-surface">ABOUT ME</h5>
        <v-divider class="mb-4"></v-divider>
        <p class="text-on-surface-variant">
          Developed by César, a web developer passionate about crafting elegant and efficient web
          applications using Vue.js, Vuetify, and Firebase.
        </p>
      </v-col>
      <v-col cols="auto" md="4">
        <h5 class="text-h6 text-weight-bold text-on-surface">CONTACT INFO</h5>
        <v-divider class="mb-4"></v-divider>
        <p class="text-on-surface-variant">
          <v-icon start color="primary">mdi-map-marker</v-icon> Your Address
        </p>
        <p class="text-on-surface-variant">
          <v-icon start color="primary">mdi-email</v-icon> info@yourdomain.com
        </p>
        <p class="text-on-surface-variant">
          <v-icon start color="primary">mdi-phone</v-icon> +1 555-123-4567
        </p>
        <p class="text-on-surface-variant">
          <v-icon start color="primary">mdi-whatsapp</v-icon> +1 555-123-4567
        </p>
        <p class="text-on-surface-variant">
          <v-icon start color="primary">mdi-linkedin</v-icon> @yourdomain
        </p>
        <p class="text-on-surface-variant">
          <v-icon start color="primary">mdi-github</v-icon> @yourdomain
        </p>
      </v-col>
    </v-row>
    <v-row class="mt-4">
      <v-col cols="12" class="text-center">
        <p class="text-on-surface-variant">&copy; {{ new Date().getFullYear() }} by César Conte.</p>
      </v-col>
    </v-row>
  </v-footer>
</template>
