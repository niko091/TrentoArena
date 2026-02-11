<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const status = ref<"loading" | "success" | "error">("loading");
const message = ref("");

onMounted(async () => {
  const token = route.query.token;

  if (!token) {
    status.value = "error";
    message.value = "Link non valido (Token mancante).";
    return;
  }

  try {
    const res = await fetch("/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    const data = await res.json();

    if (res.ok) {
      status.value = "success";
    } else {
      status.value = "error";
      message.value = data.msg || "Verifica fallita.";
    }
  } catch (e) {
    status.value = "error";
    message.value = "Errore di connessione col server.";
  }
});
</script>

<template>
  <div class="d-flex justify-content-center align-items-center vh-100 bg-light">
    <div
      class="card p-5 text-center shadow"
      style="max-width: 500px; width: 100%"
    >
      <div v-if="status === 'loading'">
        <div class="spinner-border text-primary mb-3" role="status"></div>
        <h4>Verifica in corso...</h4>
        <p class="text-muted">Stiamo controllando il tuo token.</p>
      </div>

      <div v-else-if="status === 'success'">
        <div class="mb-3" style="font-size: 4rem">✅</div>
        <h2 class="text-success fw-bold">Account Attivato!</h2>
        <p class="text-muted">La tua email è stata confermata correttamente.</p>
        <a href="/login" class="btn btn-primary w-100 mt-3 btn-lg"
          >Vai al Login</a
        >
      </div>

      <div v-else>
        <div class="mb-3" style="font-size: 4rem">❌</div>
        <h3 class="text-danger">Errore</h3>
        <p class="lead">{{ message }}</p>
        <a href="/register" class="btn btn-outline-secondary mt-3"
          >Torna alla registrazione</a
        >
      </div>
    </div>
  </div>
</template>

<style scoped></style>
