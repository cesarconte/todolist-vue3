<script setup>
// import { useDisplay } from 'vuetify'
import LoginCard from '@/components/VLoginCard.vue'

// const { xs } = useDisplay()
</script>

<template>
  <v-container fluid heigth="100vh">
    <v-responsive height="100vh">
      <v-row justify="center" align="center" class="card-row-login">
        <v-col cols="12" sm="10" md="9" lg="8" xl="7">
          <LoginCard
            heading="Sign In"
            description="Use your Google Account"
            nextRoute="/login-password/password/:password"
            handleRoute="/signin/name/:name"
          >
            <template #form>
              <p class="mt-10 text-body-2">
                Not your computer? Use Guest Mode to sign in privately.
                <a
                  href="https://support.google.com/chrome/answer/6130773?hl=en"
                  target="_blank"
                  class="text-decoration-none text-red-darken-2"
                  >Learn more about Guest Mode</a
                >
              </p>
            </template>
          </LoginCard>
        </v-col>
      </v-row>
    </v-responsive>
  </v-container>
</template>

<style scoped>
.card-row-login {
  height: 100vh;
}
</style>
