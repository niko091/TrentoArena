<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { IPlaceShared } from "@shared/types/Place";

const props = defineProps<{
  place: IPlaceShared;
}>();

const emit = defineEmits<{
  (e: "select-game", game: any): void;
}>();

const { t } = useI18n();
const games = ref<any[]>([]);
const loading = ref(true);
const error = ref(false);

onMounted(async () => {
  try {
    const today = new Date().toISOString();
    const res = await fetch(
      `/api/games?placeId=${props.place._id}&startDate=${today}&isFinished=false&limit=5`,
    );
    if (!res.ok) throw new Error();
    games.value = await res.json();
  } catch (e) {
    error.value = true;
  } finally {
    loading.value = false;
  }
});

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.toLocaleDateString()} - ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}
</script>

<template>
  <div class="popup-content">
    <h5 class="popup-title">{{ place.name }}</h5>
    <p class="popup-sport">{{ place.sport?.name || "Sport" }}</p>

    <div class="popup-divider"></div>

    <div v-if="loading" class="state-msg">{{ t("common.loading") }}...</div>
    <div v-else-if="error" class="state-msg error">
      {{ t("map.error_loading") }}
    </div>
    <div v-else-if="games.length === 0" class="state-msg">
      {{ t("map.no_upcoming") }}
    </div>

    <ul v-else class="games-list">
      <li
        v-for="game in games"
        :key="game._id"
        @click="$emit('select-game', game)"
      >
        <span>{{ formatDate(game.date) }}</span>
        <span class="arrow">→</span>
      </li>
    </ul>
  </div>
</template>
