<script setup lang="ts">
import { useI18n } from "vue-i18n";

const props = defineProps<{
  title: string;
  games: any[];
  profileUserId: string;
  isPast?: boolean;
}>();

const emit = defineEmits(["open-game"]);
const { t } = useI18n();
const getBorderClass = (game: any) => {
  if (!props.isPast) return "";

  const userParticipation = game.participants.find(
    (p: any) => (p.user._id || p.user) === props.profileUserId,
  );

  return userParticipation?.winner
    ? "border-success border-2"
    : "border-danger border-2";
};

const getBadgeClass = (game: any) => {
  const current = game.participants.length;
  const max = game.maxParticipants || 10;
  const ratio = current / max;

  if (ratio >= 1) return "bg-danger";
  if (ratio >= 0.75) return "bg-warning text-dark";
  return "bg-success";
};
</script>

<template>
  <div class="mt-4 mt-lg-5">
    <h2 class="fw-bold mb-4 border-bottom pb-2">{{ title }}</h2>

    <div class="row g-3">
      <div v-if="games.length === 0" class="col-12">
        <span class="text-muted">{{
          isPast ? t("profile.no_past_games") : t("profile.no_upcoming_games")
        }}</span>
      </div>

      <div v-for="game in games" :key="game._id" class="col-md-6 col-lg-4">
        <div
          class="card h-100 shadow-sm wireframe-card"
          :class="[getBorderClass(game), { 'opacity-75': isPast }]"
          style="cursor: pointer"
          @click="$emit('open-game', game)"
        >
          <div class="card-body">
            <div class="d-flex justify-content-between mb-2">
              <h5 class="card-title fw-bold text-primary">
                {{ game.sport?.name || "Sport" }}
              </h5>

              <template v-if="isPast">
                <span
                  v-if="getBorderClass(game).includes('success')"
                  class="badge bg-success"
                >
                  {{ t("profile.won") }}
                </span>
                <span v-else class="badge bg-secondary">
                  {{ t("profile.finished") }}
                </span>
              </template>

              <template v-else>
                <span class="badge" :class="getBadgeClass(game)">
                  <i class="bi bi-people-fill me-1"></i>
                  {{ game.participants.length }}/{{
                    game.maxParticipants || 10
                  }}
                </span>
              </template>
            </div>

            <h6 class="text-muted">{{ game.place?.name || "Place" }}</h6>
            <p class="card-text mb-0">
              <small>
                📅 {{ new Date(game.date).toLocaleDateString("it-IT") }} at
                {{
                  new Date(game.date).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                }}
              </small>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wireframe-card {
  border: 2px solid #000000;
  border-radius: 12px;
  background-color: #fff;
  transition: transform 0.2s;
}
.wireframe-card:hover {
  transform: translateY(-3px);
  box-shadow: 4px 4px 0px #000000;
}
</style>
