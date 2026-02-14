<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";

const emit = defineEmits(["close", "created"]);
const { t } = useI18n();

const isActive = ref(false);
const sports = ref<any[]>([]);
const places = ref<any[]>([]);
const filteredPlaces = ref<any[]>([]);

const form = ref({
  sportId: "Choose...",
  placeId: "Choose...",
  date: "",
  time: "",
  note: "",
  maxParticipants: 10,
});

const loadSports = async () => {
  try {
    const response = await fetch("/api/sports");
    if (!response.ok) throw new Error("Failed to fetch sports");
    sports.value = await response.json();
  } catch (error) {
    console.error("Error loading sports:", error);
  }
};

const loadPlaces = async () => {
  try {
    const response = await fetch("/api/places");
    if (!response.ok) throw new Error("Failed to fetch places");
    places.value = await response.json();
    filteredPlaces.value = places.value;
  } catch (error) {
    console.error("Error loading places:", error);
  }
};

const filterPlacesBySport = () => {
  if (form.value.sportId === "Choose...") {
    filteredPlaces.value = places.value;
  } else {
    filteredPlaces.value = places.value.filter(
      (place) => place.sport && place.sport._id === form.value.sportId,
    );
  }
  const isCurrentPlaceInList = filteredPlaces.value.some(
    (p) => p._id === form.value.placeId,
  );
  if (!isCurrentPlaceInList) {
    form.value.placeId = "Choose...";
  }
};

watch(() => form.value.sportId, filterPlacesBySport);

const createGame = async () => {
  if (form.value.sportId === "Choose..." || !form.value.sportId) {
    alert(t("game_creation.error_sport"));
    return;
  }
  if (form.value.placeId === "Choose..." || !form.value.placeId) {
    alert(t("game_creation.error_place"));
    return;
  }
  if (!form.value.date) {
    alert(t("game_creation.error_date"));
    return;
  }
  if (!form.value.time) {
    alert(t("game_creation.error_time"));
    return;
  }
  if (!form.value.maxParticipants || form.value.maxParticipants < 2) {
    alert(t("game_creation.error_participants"));
    return;
  }

  const payload = {
    sportId: form.value.sportId,
    placeId: form.value.placeId,
    date: form.value.date,
    time: form.value.time,
    note: form.value.note,
    maxParticipants: parseInt(form.value.maxParticipants as any),
  };

  try {
    const response = await fetch("/api/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      alert(t("game_creation.success"));
      closePopup();
      emit("created");
    } else {
      const error = await response.json();
      alert(
        t("common.error_generic") + ": " + (error.message || "Unknown error"),
      );
    }
  } catch (err) {
    console.error("Network error:", err);
    alert(t("game_popup.connection_error"));
  }
};

const closePopup = () => {
  isActive.value = false;
  setTimeout(() => {
    emit("close");
  }, 300);
};

onMounted(async () => {
  setTimeout(() => {
    isActive.value = true;
  }, 10);
  await loadSports();
  await loadPlaces();
});
</script>

<template>
  <div
    class="modal-overlay"
    :class="{ active: isActive }"
    @click.self="closePopup"
  >
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="modal-title">{{ t("game_creation.title") }}</h2>
        <button class="modal-close-btn" @click="closePopup" aria-label="Close">
          &times;
        </button>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <label class="popup-label" for="popupInputSport">{{
            t("admin.sport")
          }}</label>
          <select
            id="popupInputSport"
            class="form-control"
            v-model="form.sportId"
          >
            <option selected>Choose...</option>
            <option v-for="sport in sports" :key="sport._id" :value="sport._id">
              {{ sport.name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label class="popup-label" for="popupInputMap">{{
            t("game_popup.place")
          }}</label>
          <select
            id="popupInputMap"
            class="form-control"
            v-model="form.placeId"
          >
            <option selected>Choose...</option>
            <option
              v-for="place in filteredPlaces"
              :key="place._id"
              :value="place._id"
            >
              {{ place.name }}
            </option>
          </select>
        </div>

        <div class="containerTimeInput">
          <div class="form-group">
            <label class="popup-label" for="popupDateInput">{{
              t("admin.table_date")
            }}</label>
            <input
              type="date"
              class="form-control"
              id="popupDateInput"
              v-model="form.date"
            />
          </div>

          <div class="form-group">
            <label class="popup-label" for="popupTimeInput">{{
              t("admin.table_time")
            }}</label>
            <input
              type="time"
              class="form-control"
              id="popupTimeInput"
              v-model="form.time"
            />
          </div>
        </div>

        <div class="form-group">
          <label class="popup-label" for="popupInputNote">{{
            t("admin.table_note")
          }}</label>
          <textarea
            class="form-control"
            id="popupInputNote"
            rows="3"
            v-model="form.note"
          ></textarea>
        </div>

        <div class="form-group">
          <label class="popup-label" for="popupMaxParticipants">{{
            t("game_creation.max_participants")
          }}</label>
          <input
            type="number"
            class="form-control"
            id="popupMaxParticipants"
            v-model="form.maxParticipants"
            min="2"
          />
        </div>

        <div class="popup-actions">
          <button type="button" class="btn btn-primary" @click="createGame">
            {{ t("game_creation.submit") }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped src="@/assets/css/popup_shared.css"></style>
<style scoped src="@/assets/css/game_creation_popup.css"></style>
<style scoped src="@/assets/css/style.css"></style>
