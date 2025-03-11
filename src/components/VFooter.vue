<template>
  <v-footer class="d-flex flex-column bg-grey-lighten-4">
    <v-row>
      <v-col cols="auto" class="mt-4">
        <section class="rounded-pill bg-red-darken-2 px-6 py-3">
          <p class="text-h5 text-weight-bold text-grey-lighten-4">
            todolist
            <v-icon class="icon todolist-logo">mdi-checkbox-marked-circle-auto-outline</v-icon>
          </p>
        </section>
      </v-col>
    </v-row>
    <article class="mt-4 text-center">
      <p>A simple and efficient web application to manage your daily tasks.</p>
    </article>
    <v-row class="mt-4 w-auto d-flex justify-space-between">
      <v-col cols="auto" md="4">
        <h5 class="text-h6 text-weight-bold">ABOUT ME</h5>
        <v-divider class="mb-4"></v-divider>
        <p>
          Developed by César, a web developer passionate about crafting elegant and efficient web
          applications using Vue.js, Vuetify, and Firebase.
        </p>
      </v-col>
      <v-col cols="auto" md="4">
        <h5 class="text-h6 text-weight-bold">CONTACT INFO</h5>
        <v-divider class="mb-4"></v-divider>
        <p><v-icon start>mdi-map-marker</v-icon> Your Address</p>
        <p><v-icon start>mdi-email</v-icon> info@yourdomain.com</p>
        <p><v-icon start>mdi-phone</v-icon> +1 555-123-4567</p>
        <p><v-icon start>mdi-whatsapp</v-icon> +1 555-123-4567</p>
        <p><v-icon start>mdi-linkedin</v-icon> @yourdomain</p>
        <p><v-icon start>mdi-github</v-icon> @yourdomain</p>
      </v-col>
    </v-row>
    <v-row class="mt-4">
      <v-col cols="12" class="text-center">
        <p class="text-muted">&copy; {{ new Date().getFullYear() }} by César Conte.</p>
      </v-col>
    </v-row>
  </v-footer>
</template>
