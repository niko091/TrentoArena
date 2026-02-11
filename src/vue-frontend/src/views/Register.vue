<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

// State
const email = ref("");
const username = ref("");
const password = ref("");
const repeatPassword = ref("");
const loading = ref(false);
const error = ref("");

const router = useRouter();
const { t } = useI18n();

// Actions
const handleRegister = async () => {
  if (password.value !== repeatPassword.value) {
    alert(t("register.error_password_mismatch"));
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    const response = await fetch("/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
      // Use logic similar to login for error display consistency
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
  <div class="bg d-flex align-items-center justify-content-center vh-100">
    <div class="d-flex justify-content-center align-items-center min-vh-100 w-100">
      
      <div class="card shadow-sm" style="max-width: 400px; width: 100%;">
        <div class="card-body p-4">
          
          <h2 class="card-title text-center mb-4" style="color: #fd7e14;">
            {{ t("register.title") }}
          </h2>

          <div v-if="error" class="alert alert-danger text-center" role="alert">
            {{ error }}
          </div>

          <form @submit.prevent="handleRegister">
            <div class="mb-3">
              <label for="InputEmail" class="form-label fw-bold">{{ t("register.email") }}</label>
              <input
                type="email"
                class="register-input"
                id="InputEmail"
                v-model="email"
                required
              />
            </div>

            <div class="mb-3">
              <label for="InputName" class="form-label fw-bold">{{ t("register.username") }}</label>
              <input
                type="text"
                class="register-input"
                id="InputName"
                v-model="username"
                required
              />
            </div>

            <div class="mb-3">
              <label for="InputPassword" class="form-label fw-bold">{{ t("register.password") }}</label>
              <input
                type="password"
                class="register-input"
                id="InputPassword"
                v-model="password"
                required
              />
            </div>

            <div class="mb-3">
              <label for="InputRepeatPassword" class="form-label fw-bold">{{ t("register.repeat_password") }}</label>
              <input
                type="password"
                class="register-input"
                id="InputRepeatPassword"
                v-model="repeatPassword"
                required
              />
            </div>

            <div class="d-grid gap-2 mt-4">
              <button 
                type="submit" 
                class="btn btn-primary" 
                style="background-color: #fd7e14; border: none;" 
                :disabled="loading"
              >
                <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                {{ t('register.submit') }}
              </button>
            </div>
          </form>

          <hr class="my-4" />

          <div class="text-center">
            <a href="/auth/google" class="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center">
              <img src="/images/google-logo.png" width="20" height="20" class="me-2">
              {{ t('register.google') }}
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-input {
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

.register-input:focus {
  border-color: #fd7e14;
  background-color: #fff;
  box-shadow: 0 0 0 4px rgba(253, 126, 20, 0.1);
}

.btn-primary:hover {
  background-color: #e36209 !important;
}

.vh-100 {
  min-height: 100vh;
}
</style>