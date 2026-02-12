<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

const email = ref("");
const username = ref("");
const password = ref("");
const repeatPassword = ref("");
const loading = ref(false);
const error = ref("");
const router = useRouter();
const { t } = useI18n();

const handleRegister = async () => {
  if (password.value !== repeatPassword.value) {
    error.value = t("register.error_password_mismatch"); 
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    const response = await fetch("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.value,
        username: username.value,
        password: password.value,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      router.push("/dashboard");
    } else {
      error.value = data.msg || t("register.error_generic");
    }
  } catch (err) {
    console.error("Error:", err);
    error.value = t("register.error_connection");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="auth-wrapper">
    <div class="auth-card">
      
      <h2 class="auth-title">{{ t("register.title") }}</h2>

      <div v-if="error" class="alert alert-danger text-center mb-3" role="alert">
        {{ error }}
      </div>

      <form @submit.prevent="handleRegister">
        <div class="mb-3">
          <label for="InputEmail" class="form-label">{{ t("register.email") }}</label>
          <input type="email" class="auth-input" id="InputEmail" v-model="email" required />
        </div>

        <div class="mb-3">
          <label for="InputName" class="form-label">{{ t("register.username") }}</label>
          <input type="text" class="auth-input" id="InputName" v-model="username" required />
        </div>

        <div class="mb-3">
          <label for="InputPassword" class="form-label">{{ t("register.password") }}</label>
          <input type="password" class="auth-input" id="InputPassword" v-model="password" required />
        </div>
        
        <div class="mb-3">
          <label for="InputRepeatPassword" class="form-label">{{ t("register.repeat_password") }}</label>
          <input type="password" class="auth-input" id="InputRepeatPassword" v-model="repeatPassword" required />
        </div>

        <button type="submit" class="btn-auth-primary" :disabled="loading">
          <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          {{ t('register.submit') }}
        </button>
        
      </form>

      <a href="/auth/google" class="btn-google">
        <img src="/images/google-logo.png" width="20" height="20" class="me-2" alt="Google">
        {{ t('register.google') }}
      </a>

    </div>
  </div>
</template>

<style src="@/assets/css/auth.css"></style>