
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { t } = useI18n()
const username = ref('')
const password = ref('')
const error = ref('')

const handleLogin = async () => {
  try {
    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: username.value, password: password.value })
    });

    if (response.ok) {
      router.push('/dashboard');
    } else {
      const data = await response.json();
      error.value = data.message || 'Login failed';
    }
  } catch (err) {
    console.error('Login error:', err);
    error.value = 'An error occurred during login';
  }
}
</script>

<template>
  <div class="bg-light d-flex align-items-center justify-content-center vh-100">
      <div class="d-flex justify-content-center align-items-center min-vh-100 w-100">
          <div class="card loginregistrazione-card">
              <div class="card-body">
                  <h2 class="card-title text-center">{{ t('login.title') }}</h2>
                  
                  <div v-if="error" class="alert alert-danger">{{ error }}</div>

                  <form @submit.prevent="handleLogin">
                      <div class="mb-3">
                          <p class="form-label">{{ t('register.email') }}</p>
                          <input type="text" class="form-control" v-model="username" required>
                      </div>
                      <div class="mb-3">
                          <p class="form-label">{{ t('login.password_placeholder') }}</p>
                          <input type="password" class="form-control" v-model="password" required>
                      </div>
                      <div class="text-center">
                          <button type="submit" class="btn btn-light" style="color: #ff6347;">{{ t('login.login_button') }}</button>
                          <p class="mt-2">
                              <small>
                                  <span>{{ t('login.not_registered') }}</span> 
                                  <a style="color: white;" href="/register">{{ t('login.register_link') }}</a>
                              </small>
                          </p>
                      </div>
                  </form>
                  <hr>
                  <div class="text-center">
                      <a href="/auth/google" class="btn btn-light" style="color: #ff6347; text-decoration: none;">
                          <img src="/images/google-logo.png" width="24" height="24" class="me-2">
                          {{ t('login.google_login') }}
                      </a>
                  </div>
              </div>
          </div>
      </div>
  </div>
</template>

<style scoped>
/* Specific overrides if necessary */
</style>
