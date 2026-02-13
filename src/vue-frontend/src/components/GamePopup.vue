<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { RouterLink } from "vue-router"; 
import { IUserShared } from "@shared/types/User";

const props = defineProps<{
  game: any;
  currentUser: IUserShared | null;
}>();

const emit = defineEmits(["close", "refresh"]);
const { t } = useI18n();
const selectedWinners = ref<string[]>([]);
const loadingAction = ref(false);
const isActive = ref(false); 


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

const closePopup = () => {
  isActive.value = false;
  setTimeout(() => {
    emit("close");
  }, 300);
};

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
      closePopup();
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
      closePopup();
    } else {
      const err = await res.json();
      alert(t("game_popup.error_finish") + ": " + (err.message || "Sconosciuto"));
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
      closePopup();
    } else {
      const err = await res.json();
      alert(t("game_popup.error_delete") + ": " + (err.message || "Sconosciuto"));
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

onMounted(() => {
  setTimeout(() => isActive.value = true, 50);
});
</script>

<template>
  <div class="modal-overlay" :class="{ active: isActive }" @click.self="closePopup">
    
    <div class="modal-content">
      
      <div class="modal-header">
        <h3 class="modal-title">{{ t("game_popup.title") }}</h3>
        <button class="modal-close-btn" @click="closePopup">&times;</button>
      </div>

      <div class="modal-body">
        
        <div class="game-popup-row">
          <span class="game-popup-label">{{ t("game_popup.sport") }}</span>
          <span class="game-popup-value">{{ game.sport?.name || t("common.sport") }}</span>
        </div>
        
        <div class="game-popup-row">
          <span class="game-popup-label">{{ t("game_popup.place") }}</span>
          <span class="game-popup-value">
            <RouterLink
              v-if="game.place"
              :to="`/map?placeId=${game.place._id}`"
              @click="closePopup"
            >
              {{ game.place.name }}
            </RouterLink>
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
            <RouterLink
              v-if="game.creator"
              :to="`/user/${game.creator.username}`"
              @click="closePopup"
            >
              {{ game.creator.username }}
            </RouterLink>
            <span v-else>{{ t("common.unknown") }}</span>
          </span>
        </div>
        
        <div class="game-popup-row">
          <span class="game-popup-label">{{ t("game_popup.participants") }}</span>
          <span class="game-popup-value">
            {{ game.participants ? game.participants.length : 0 }} /
            {{ game.maxParticipants || "?" }}
          </span>
        </div>

        <div
          v-if="game.participants && game.participants.length > 0"
          class="game-popup-section"
        >
          <h4 class="game-popup-subtitle">
            {{ t("game_popup.players") }}
            <small
              v-if="isCreator && !isFinished"
              class="text-muted ms-2 fw-normal"
              style="font-size: 0.8em"
            >
              ({{ t("game_popup.check_winners") }})
            </small>
          </h4>
          
          <div class="game-popup-participants-list">
            <div
              v-for="p in game.participants"
              :key="p.user._id || p.user"
              class="participant-item"
              :title="p.user.username"
            >
              <input
                v-if="isCreator && !isFinished"
                type="checkbox"
                class="winner-checkbox me-2"
                :value="p.user._id || p.user"
                @change="toggleWinner(p.user._id || p.user)"
              />
              <span v-else-if="p.winner" class="participant-winner me-1">🏆</span>

              <img
                :src="p.user.profilePicture || '/images/utenteDefault.png'"
                class="participant-avatar me-2"
              />

              <RouterLink
                :to="`/user/${p.user.username}`"
                class="participant-name"
                @click="closePopup"
              >
                {{ p.user.username }}
              </RouterLink>
            </div>
          </div>
        </div>

        <div v-if="game.note" class="game-popup-note">
          <strong>{{ t("game_popup.note") }}:</strong> {{ game.note }}
        </div>

        <div class="modal-footer" style="flex-direction: column; align-items: stretch; gap: 0.5rem;">
          
          <button
            v-if="currentUser && !isFinished && !isFull && !isParticipant"
            class="btn btn-success"
            @click="joinGame"
            :disabled="loadingAction"
          >
            {{ t("game_popup.join") }}
          </button>
          
          <template v-if="isCreator && !isFinished">
            <button
              v-if="isGameTimePassed"
              class="btn btn-warning"
              style="background-color: #ffc107; color: #000;"
              @click="finishGame"
              :disabled="loadingAction"
            >
              {{ t("game_popup.finish") }}
            </button>
            <button v-else class="btn btn-secondary" disabled>
              {{ t("game_popup.not_started") }}
            </button>
          </template>

          <div v-if="isParticipant" class="text-center">
            <span class="badge bg-success py-2 fs-6 d-block w-100">{{ t("game_popup.is_participant") }}</span>
          </div>
          <div v-else-if="isFinished" class="text-center">
            <span class="badge bg-secondary py-2 fs-6 d-block w-100">{{ t("game_popup.finished") }}</span>
          </div>
          <div v-else-if="isFull" class="text-center">
            <span class="badge bg-danger py-2 fs-6 d-block w-100">{{ t("game_popup.full") }}</span>
          </div>

          <button
            v-if="isCreator"
            class="btn btn-outline-danger mt-2"
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

<style scoped src="@/assets/css/popup_shared.css"></style>
<style scoped src="@/assets/css/game_popup.css"></style>
<style scoped src="@/assets/css/game_popup_participants.css"></style>
<style scoped src="@/assets/css/style.css"></style>