<template>
  <v-footer class="d-flex flex-column pa-8" color="surfaceVariant">
    <v-row>
      <v-col cols="auto" class="mt-4">
        <section class="rounded-lg px-6 py-3" :class="'bg-primary'">
          <p class="text-h5 text-weight-bold text-onPrimary">
            todolist
            <v-icon class="icon todolist-logo text-onPrimary"
              >mdi-checkbox-marked-circle-auto-outline</v-icon
            >
          </p>
        </section>
      </v-col>
    </v-row>
    <article class="mt-4 text-center text-onSurfaceVariant">
      <p>A simple and efficient web application to manage your daily tasks.</p>
    </article>
    <v-row class="mt-4 w-auto d-flex justify-space-between">
      <v-col cols="auto" md="4">
        <h5 class="text-h6 text-weight-bold text-onSurface">ABOUT ME</h5>
        <v-divider class="mb-4"></v-divider>
        <p class="text-onSurfaceVariant">
          Developed by César, a web developer passionate about crafting elegant and efficient web
          applications using Vue.js, Vuetify, and Firebase.
        </p>
      </v-col>
      <v-col cols="auto" md="4">
        <h5 class="text-h6 text-weight-bold text-onSurface">CONTACT INFO</h5>
        <v-divider class="mb-4"></v-divider>
        <p class="text-onSurfaceVariant">
          <v-icon start color="primary">mdi-map-marker</v-icon> Your Address
        </p>
        <p class="text-onSurfaceVariant">
          <v-icon start color="primary">mdi-email</v-icon> info@yourdomain.com
        </p>
        <p class="text-onSurfaceVariant">
          <v-icon start color="primary">mdi-phone</v-icon> +1 555-123-4567
        </p>
        <p class="text-onSurfaceVariant">
          <v-icon start color="primary">mdi-whatsapp</v-icon> +1 555-123-4567
        </p>
        <p class="text-onSurfaceVariant">
          <v-icon start color="primary">mdi-linkedin</v-icon> @yourdomain
        </p>
        <p class="text-onSurfaceVariant">
          <v-icon start color="primary">mdi-github</v-icon> @yourdomain
        </p>
      </v-col>
    </v-row>
    <v-row class="mt-4">
      <v-col cols="12" class="text-center">
        <p class="text-onSurfaceVariant">&copy; {{ new Date().getFullYear() }} by César Conte.</p>
      </v-col>
    </v-row>
  </v-footer>
</template>
