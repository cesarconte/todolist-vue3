<script setup>
import { useUserStore } from '../stores/userStore.js'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'

const userStore = useUserStore()
const router = useRouter()

const openSettings = () => {
  console.log('Open settings')
}

const openAddTeam = () => {
  console.log('Open add team')
}

const openPrint = () => {
  console.log('Open print')
}

const openUpgradeToPro = () => {
  console.log('Open upgrade to pro')
}

const synchronize = () => {
  console.log('Synchronize')
}

const handleLogout = async () => {
  if (userStore.isLoggedIn) {
    try {
      // Log out the user logic here (e.g., using the router, clear localStorage, user data from the store, etc.)
      await userStore.logOut()
      router.push('/')
    } catch (error) {
      // Handle logout errors
      console.error('Error during logout:', error)
      alert('An error occurred during logout. Please try again.')
    }
  }
}

const { xs, sm, md, lg, xl } = useDisplay()
</script>

<template>
  <v-container fluid class="profile-view my-6">
    <v-responsive
      :max-width="xs ? '100vw' : sm ? 600 : md ? 840 : lg ? 1140 : xl ? 1440 : 1600"
      class="card-container-profile mx-auto"
    >
      <v-row justify="center" align="center" class="card-row-profile">
        <v-col cols="12" sm="11" md="10" lg="9" xl="8" class="card-col-profile">
          <v-card class="settings ma-8 pa-8" color="surfaceVariant">
            <v-card-item>
              <v-card-title class="text-h5 text-onSurface">{{ userStore.userName }}</v-card-title>
              <v-divider></v-divider>
            </v-card-item>
            <v-card-text>
              <v-list>
                <v-list-item @click="openSettings">
                  <template v-slot:prepend>
                    <v-icon color="primary">mdi-cog-outline</v-icon>
                  </template>
                  <v-list-item-title class="text-onSurface">Settings</v-list-item-title>
                </v-list-item>
                <v-list-item @click="openAddTeam">
                  <template v-slot:prepend>
                    <v-icon color="primary">mdi-plus</v-icon>
                  </template>
                  <v-list-item-title class="text-onSurface">Add a team</v-list-item-title>
                </v-list-item>
                <v-list-item @click="openPrint">
                  <template v-slot:prepend>
                    <v-icon color="primary">mdi-printer-outline</v-icon>
                  </template>
                  <v-list-item-title class="text-onSurface">Print</v-list-item-title>
                </v-list-item>
                <v-list-item @click="openUpgradeToPro">
                  <template v-slot:prepend>
                    <v-icon color="warning">mdi-star-outline</v-icon>
                  </template>
                  <v-list-item-title class="text-onSurface">Upgrade to Pro</v-list-item-title>
                </v-list-item>
                <v-list-item @click="synchronize">
                  <template v-slot:prepend>
                    <v-icon color="primary">mdi-refresh</v-icon>
                  </template>
                  <v-list-item-title class="text-onSurface">Sinchronize</v-list-item-title>
                </v-list-item>
                <v-list-item @click="handleLogout">
                  <template v-slot:prepend>
                    <v-icon color="error">mdi-logout</v-icon>
                  </template>
                  <v-list-item-title class="text-onSurface">Log out</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-responsive>
  </v-container>
</template>
