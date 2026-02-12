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
    error.value = t("login.error_connection") || "Errore di connessione al server";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="auth-wrapper">
    <div class="auth-card">
      
      <h2 class="auth-title">{{ t('login.title') }}</h2>
      
      <div v-if="error" class="alert alert-danger text-center mb-3" role="alert">
        {{ error }}
      </div>

      <form @submit.prevent="handleLogin">
        <div class="mb-3">
          <label class="form-label">{{ t('login.email') }}</label>
          <input type="text" class="auth-input" v-model="username" required>
        </div>
        <div class="mb-3">
          <label class="form-label">{{ t('login.password_placeholder') }}</label>
          <input type="password" class="auth-input" v-model="password" required>
        </div>
        
        <button type="submit" class="btn-auth-primary" :disabled="loading">
          <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          {{ t('login.login_button') }}
        </button>

        <div class="auth-footer">
          <span>{{ t('login.not_registered') }} </span> 
          <a href="/register" class="auth-link">{{ t('login.register_link') }}</a>
        </div>
      </form>
      
      <a href="/auth/google" class="btn-google">
        <img src="/images/google-logo.png" width="20" height="20" class="me-2" alt="Google">
        {{ t('login.google_login') }}
      </a>

    </div>
  </div>
</template>

<style src="@/assets/css/auth.css"></style>