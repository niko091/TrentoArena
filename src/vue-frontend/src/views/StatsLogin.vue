<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const username = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);

const login = async () => {
  error.value = "";
  loading.value = true;
  const credentials = btoa(`${username.value}:${password.value}`);

  try {
    const response = await fetch(
      "/api/stats/top-entities?type=sport&period=all",
      {
        headers: {
          Authorization: `Basic ${credentials}`,
        },
      },
    );

    if (response.ok) {
      localStorage.setItem("stats_auth", credentials);
      router.push("/stats");
    } else {
      error.value = "Invalid stats credentials";
    }
  } catch (e) {
    console.error("Login error:", e);
    error.value = "An error occurred";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="auth-wrapper">
    <div class="auth-card">
      <h2 class="auth-title">Stats Login</h2>

      <div
        v-if="error"
        class="alert alert-danger text-center mb-3"
        role="alert"
      >
        {{ error }}
      </div>

      <form @submit.prevent="login">
        <div class="mb-3">
          <label for="username" class="form-label">Username</label>
          <input
            type="text"
            id="username"
            v-model="username"
            class="auth-input"
            required
          />
        </div>

        <div class="mb-3">
          <label for="password" class="form-label">Password</label>
          <input
            type="password"
            id="password"
            v-model="password"
            class="auth-input"
            required
          />
        </div>

        <button type="submit" class="btn-auth-primary" :disabled="loading">
          <span
            v-if="loading"
            class="spinner-border spinner-border-sm me-2"
            role="status"
            aria-hidden="true"
          ></span>
          Login
        </button>
      </form>
    </div>
  </div>
</template>

<style src="@/assets/css/auth.css"></style>
