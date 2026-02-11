<script setup lang="ts">
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import { IUserShared } from "@shared/types/User";

const props = defineProps<{
  game: any;
  currentUser: IUserShared | null;
}>();

const emit = defineEmits(["close", "refresh"]);

// I18n helper
// I18n helper
const { t } = useI18n();

const selectedWinners = ref<string[]>([]);
const loadingAction = ref(false);

const isCreator = computed(() => {
  return (
    props.currentUser &&
    (props.game.creator._id || props.game.creator) === props.currentUser._id
  );
});

const isParticipant = computed(() => {
  return (
    props.currentUser &&
    props.game.participants &&
    props.game.participants.some((p: any) => {
      const pId = p.user._id || p.user;
      return pId === props.currentUser?._id;
    })
  );
});

const isFinished = computed(() => props.game.isFinished);
const isFull = computed(
  () =>
    props.game.participants &&
    props.game.maxParticipants &&
    props.game.participants.length >= props.game.maxParticipants,
);
const isGameTimePassed = computed(
  () => new Date() >= new Date(props.game.date),
);

const formattedDate = computed(() =>
  new Date(props.game.date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }),
);
const formattedTime = computed(() =>
  new Date(props.game.date).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }),
);

// Actions
async function joinGame() {
  if (loadingAction.value) return;
  loadingAction.value = true;
  try {
    const res = await fetch(`/api/games/${props.game._id}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      alert(t("game_popup.joined_success"));
      emit("refresh");
      emit("close");
    } else {
      const err = await res.json();
      alert(t("game_popup.error_join") + ": " + (err.message || "Sconosciuto"));
    }
  } catch (e) {
    console.error(e);
    alert(t("game_popup.connection_error"));
  } finally {
    loadingAction.value = false;
  }
}

async function finishGame() {
  if (loadingAction.value) return;
  if (!confirm(t("game_popup.confirm_finish"))) return;

  loadingAction.value = true;
  try {
    const res = await fetch(`/api/games/${props.game._id}/finish`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ winnerIds: selectedWinners.value }),
    });
    if (res.ok) {
      alert(t("game_popup.finish_success"));
      emit("refresh");
      emit("close");
    } else {
      const err = await res.json();
      alert(
        t("game_popup.error_finish") + ": " + (err.message || "Sconosciuto"),
      );
    }
  } catch (e) {
    console.error(e);
    alert(t("game_popup.connection_error"));
  } finally {
    loadingAction.value = false;
  }
}

async function deleteGame() {
  if (loadingAction.value) return;
  if (!confirm(t("game_popup.confirm_delete"))) return;

  loadingAction.value = true;
  try {
    const res = await fetch(`/api/games/${props.game._id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      alert(t("game_popup.delete_success"));
      emit("refresh");
      emit("close");
    } else {
      const err = await res.json();
      alert(
        t("game_popup.error_delete") + ": " + (err.message || "Sconosciuto"),
      );
    }
  } catch (e) {
    console.error(e);
    alert(t("game_popup.connection_error"));
  } finally {
    loadingAction.value = false;
  }
}

function toggleWinner(userId: string) {
  if (selectedWinners.value.includes(userId)) {
    selectedWinners.value = selectedWinners.value.filter((id) => id !== userId);
  } else {
    selectedWinners.value.push(userId);
  }
}
</script>

<template>
  <div class="game-popup-overlay active" @click.self="$emit('close')">
    <div class="game-popup-content">
      <button class="game-popup-close" @click="$emit('close')">&times;</button>

      <div class="game-popup-header">
        <h3 class="game-popup-title">{{ t("game_popup.title") }}</h3>
      </div>

      <div class="game-popup-body">
        <!-- Details -->
        <div class="game-popup-row">
          <span class="game-popup-label">{{ t("game_popup.sport") }}</span>
          <span class="game-popup-value">{{
            game.sport?.name || t("common.sport")
          }}</span>
        </div>
        <div class="game-popup-row">
          <span class="game-popup-label">{{ t("game_popup.place") }}</span>
          <span class="game-popup-value">
            <!-- Using simple link or text for now since router-link might be needed if using vue router, 
                             but popup usually just shows text or basic link. Keeping simple text with underline as per original. -->
            <a
              v-if="game.place"
              :href="`/map?placeId=${game.place._id}`"
              class="text-inherit"
              >{{ game.place.name }}</a
            >
            <span v-else>{{ t("common.place") }}</span>
          </span>
        </div>
        <div class="game-popup-row">
          <span class="game-popup-label">{{ t("game_popup.date") }}</span>
          <span class="game-popup-value">{{ formattedDate }}</span>
        </div>
        <div class="game-popup-row">
          <span class="game-popup-label">{{ t("game_popup.time") }}</span>
          <span class="game-popup-value">{{ formattedTime }}</span>
        </div>
        <div class="game-popup-row">
          <span class="game-popup-label">{{ t("game_popup.creator") }}</span>
          <span class="game-popup-value">
            <a
              v-if="game.creator"
              :href="`/user/${game.creator.username}`"
              class="text-inherit"
              >{{ game.creator.username }}</a
            >
            <span v-else>{{ t("common.unknown") }}</span>
          </span>
        </div>
        <div class="game-popup-row">
          <span class="game-popup-label">{{
            t("game_popup.participants")
          }}</span>
          <span class="game-popup-value"
            >{{ game.participants ? game.participants.length : 0 }} /
            {{ game.maxParticipants || "?" }}</span
          >
        </div>

        <!-- Participants List -->
        <div
          v-if="game.participants && game.participants.length > 0"
          class="game-popup-section"
        >
          <h4 class="game-popup-subtitle">
            {{ t("game_popup.players") }}
            <small
              v-if="isCreator && !isFinished"
              class="fw-normal text-muted ms-2"
              style="font-size: 0.7em"
              >({{ t("game_popup.check_winners") }})</small
            >
          </h4>
          <div class="game-popup-participants-list">
            <div
              v-for="p in game.participants"
              :key="p.user._id || p.user"
              class="participant-item"
              :title="p.user.username"
            >
              <!-- Winner Checkbox (Creator & Active) -->
              <input
                v-if="isCreator && !isFinished"
                type="checkbox"
                class="winner-checkbox me-2"
                :value="p.user._id || p.user"
                @change="toggleWinner(p.user._id || p.user)"
              />

              <!-- Winner Trophy (Finished) -->
              <span v-else-if="p.winner" class="participant-winner me-1"
                >🏆</span
              >

              <img
                :src="p.user.profilePicture || '/images/utenteDefault.png'"
                class="participant-avatar me-2"
              />

              <a
                :href="`/user/${p.user.username}`"
                class="participant-name text-inherit"
                >{{ p.user.username }}</a
              >
            </div>
          </div>
        </div>

        <!-- Note -->
        <div v-if="game.note" class="game-popup-note">
          <strong>{{ t("game_popup.note") }}:</strong> {{ game.note }}
        </div>

        <!-- Actions -->
        <div
          class="popup-actions mt-4 d-flex justify-content-center flex-column gap-2"
        >
          <!-- Join Button -->
          <button
            v-if="currentUser && !isFinished && !isFull && !isParticipant"
            class="btn btn-success w-100"
            @click="joinGame"
            :disabled="loadingAction"
          >
            {{ t("game_popup.join") }}
          </button>

          <!-- Creator Actions -->
          <template v-if="isCreator && !isFinished">
            <button
              v-if="isGameTimePassed"
              class="btn btn-warning w-100"
              @click="finishGame"
              :disabled="loadingAction"
            >
              {{ t("game_popup.finish") }}
            </button>
            <button v-else class="btn btn-secondary w-100" disabled>
              {{ t("game_popup.not_started") }}
            </button>
          </template>

          <!-- Status Badges for Participant -->
          <div v-if="isParticipant" class="text-center">
            <span class="badge bg-success py-2 fs-6">{{
              t("game_popup.is_participant")
            }}</span>
          </div>
          <div v-else-if="isFinished" class="text-center">
            <span class="badge bg-secondary py-2 fs-6">{{
              t("game_popup.finished")
            }}</span>
          </div>
          <div v-else-if="isFull" class="text-center">
            <span class="badge bg-danger py-2 fs-6">{{
              t("game_popup.full")
            }}</span>
          </div>

          <!-- Delete Button (Creator) -->
          <button
            v-if="isCreator"
            class="btn btn-outline-danger w-100 mt-2"
            @click="deleteGame"
            :disabled="loadingAction"
          >
            {{ t("game_popup.delete") }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Imported styles from game_popup.css */
.game-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--overlay-bg, rgba(0, 0, 0, 0.5));
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 0.3s ease,
    visibility 0.3s ease;
  backdrop-filter: blur(5px);
}

.game-popup-overlay.active {
  opacity: 1;
  visibility: visible;
}

.game-popup-content {
  background: var(--bg-secondary, #fff);
  color: var(--text-primary, #212529);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 500px;
  position: relative;
  transform: translateY(20px);
  transition: transform 0.3s ease;
  max-height: 90vh;
  overflow-y: auto;
}

.game-popup-overlay.active .game-popup-content {
  transform: translateY(0);
}

.game-popup-close {
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary, #6c757d);
  transition: color 0.2s;
}

.game-popup-close:hover {
  color: var(--text-primary, #000);
}

.game-popup-header {
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color-light, #dee2e6);
  padding-bottom: 1rem;
}

.game-popup-title {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--text-primary, #212529);
  margin: 0;
  text-align: center;
}

.game-popup-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.game-popup-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.game-popup-label {
  font-weight: 600;
  color: var(--text-secondary, #6c757d);
  min-width: 80px;
}

.game-popup-value {
  color: var(--text-primary, #212529);
  text-align: right;
  font-weight: 500;
}

.game-popup-note {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--bg-tertiary, #f8f9fa);
  border-radius: 8px;
  font-style: italic;
  color: var(--text-secondary, #6c757d);
}

/* Imported styles from game_popup_participants.css */
.game-popup-section {
  margin-top: 15px;
  border-top: 1px solid var(--border-color-light, #dee2e6);
  padding-top: 10px;
}

.game-popup-subtitle {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 10px;
  color: var(--text-primary, #212529);
}

.game-popup-participants-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.participant-item {
  display: flex;
  align-items: center;
  gap: 5px;
  background: var(--bg-primary, #e9ecef);
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 0.9rem;
  color: var(--text-primary, #212529);
}

.participant-avatar {
  width: 25px;
  height: 25px;
  border-radius: 50%;
  object-fit: cover;
}

.participant-winner {
  margin-left: 5px;
}

.text-inherit {
  color: inherit;
  text-decoration: none;
}
.text-inherit:hover {
  text-decoration: underline;
}

/* Dark mode compatibility */
[data-bs-theme="dark"] .game-popup-content {
  background: #2b3035;
  color: #fff;
}
[data-bs-theme="dark"] .game-popup-close {
  color: #adb5bd;
}
[data-bs-theme="dark"] .game-popup-close:hover {
  color: #fff;
}
[data-bs-theme="dark"] .game-popup-label {
  color: #adb5bd;
}
[data-bs-theme="dark"] .game-popup-value {
  color: #fff;
}
[data-bs-theme="dark"] .game-popup-title {
  color: #fff;
}
[data-bs-theme="dark"] .game-popup-note {
  background: #343a40;
  color: #adb5bd;
}
[data-bs-theme="dark"] .participant-item {
  background: #343a40;
  color: #fff;
}
</style>
