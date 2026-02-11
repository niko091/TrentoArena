<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

const router = useRouter();
const { t } = useI18n();

const username = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);

const handleLogin = async () => {
  error.value = "";
  loading.value = true;

  try {
    const response = await fetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: username.value,
        password: password.value,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      router.push("/dashboard");
    } else {
      error.value = data.msg || data.message || t("login.error_generic");
    }
  } catch (err) {
    console.error("Login error:", err);
    error.value =
      t("login.error_connection") || "Errore di connessione al server";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="bg d-flex align-items-center justify-content-center vh-100">
      <div class="d-flex justify-content-center align-items-center min-vh-100 w-100">
          <div class="card shadow-sm" style="max-width: 400px; width: 100%;">
              <div class="card-body p-4">
                  <h2 class="card-title text-center mb-4" style="color: #fd7e14;">{{ t('login.title') }}</h2>
                  
                  <div v-if="error" class="alert alert-danger text-center" role="alert">
                      {{ error }}
                  </div>

                  <form @submit.prevent="handleLogin">
                      <div class="mb-3">
                          <label class="form-label fw-bold">{{ t('login.email') }}</label>
                          <input type="text" class="login-input" v-model="username" required>
                      </div>
                      <div class="mb-3">
                          <label class="form-label fw-bold">{{ t('login.password_placeholder') }}</label>
                          <input type="password" class="login-input" v-model="password" required>
                      </div>
                      
                      <div class="d-grid gap-2 mt-4">
                          <button type="submit" class="btn btn-primary" style="background-color: #fd7e14; border: none;" :disabled="loading">
                              <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              {{ t('login.login_button') }}
                          </button>
                      </div>

                      <div class="text-center mt-3">
                          <small>
                              <span>{{ t('login.not_registered') }}</span> 
                              <span>{{ " "}}</span> 
                              <a style="color: #fd7e14; font-weight: bold;" href="/register">{{ t('login.register_link') }}</a>
                          </small>
                      </div>
                  </form>
                  
                  <hr class="my-4">
                  
                  <div class="text-center">
                      <a href="/auth/google" class="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center">
                          <img src="/images/google-logo.png" width="20" height="20" class="me-2">
                          {{ t('login.google_login') }}
                      </a>
                  </div>
              </div>
          </div>
      </div>
  </div>
</template>

<style scoped>
.login-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #eee;
  border-radius: 8px;
  font-size: 16px;
  background-color: #f9f9f9;
  color: #333;
  transition: all 0.2s;
  outline: none;
}

.login-input:focus {
  border-color: #fd7e14;
  background-color: #fff;
  box-shadow: 0 0 0 4px rgba(253, 126, 20, 0.1);
}

.btn-primary:hover {
  background-color: #e36209 !important;
}
</style>
