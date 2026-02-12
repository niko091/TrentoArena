<script setup lang="ts">
import { ref, reactive } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps<{ sports: any[]; loading: boolean }>();
const emit = defineEmits(["refresh-places", "refresh-sports"]);
const { t } = useI18n();

const addPlaceForm = reactive({ name: "", sport: "", lat: "", lng: "" });
const addSportName = ref("");

const addPlace = async () => {
  try {
    const res = await fetch("/api/places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: addPlaceForm.name,
        sport: addPlaceForm.sport,
        position: {
          lat: parseFloat(addPlaceForm.lat),
          lng: parseFloat(addPlaceForm.lng),
        },
      }),
    });

    if (res.ok) {
      alert(t("admin.js.place_added"));
      Object.assign(addPlaceForm, { name: "", sport: "", lat: "", lng: "" });
      emit("refresh-places");
    } else {
      const data = await res.json();
      alert(`Error: ${data.message}`);
    }
  } catch (e) {
    console.error(e);
  }
};

const addSport = async () => {
  try {
    const res = await fetch("/api/sports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: addSportName.value }),
    });

    if (res.ok) {
      alert(t("admin.js.sport_added"));
      addSportName.value = "";
      emit("refresh-sports");
    } else {
      const data = await res.json();
      alert(`Error: ${data.message}`);
    }
  } catch (e) {
    console.error(e);
  }
};
</script>

<template>
  <div class="row g-4">
    <div class="col-lg-6">
      <div class="card h-100 border-0 shadow-sm">
        <div class="card-header bg-white py-3">
          <h2 class="h5 mb-0 text-primary-custom">
            {{ t("admin.add_place") }}
          </h2>
        </div>
        <div class="card-body">
          <form @submit.prevent="addPlace">
            <div class="mb-3">
              <label class="form-label">{{ t("admin.name") }}</label>
              <input
                type="text"
                v-model="addPlaceForm.name"
                class="form-control"
                required
              />
            </div>
            <div class="mb-3">
              <label class="form-label">{{ t("admin.sport") }}</label>
              <select v-model="addPlaceForm.sport" class="form-select" required>
                <option value="" disabled>
                  {{ t("profile.select_sport") }}
                </option>
                <option
                  v-for="sport in sports"
                  :key="sport._id"
                  :value="sport._id"
                >
                  {{ sport.name }}
                </option>
              </select>
            </div>
            <div class="row">
              <div class="col-md-6 mb-3">
                <label class="form-label">{{ t("admin.lat") }}</label>
                <input
                  type="number"
                  v-model="addPlaceForm.lat"
                  step="any"
                  class="form-control"
                  placeholder="46.0..."
                  required
                />
              </div>
              <div class="col-md-6 mb-3">
                <label class="form-label">{{ t("admin.lng") }}</label>
                <input
                  type="number"
                  v-model="addPlaceForm.lng"
                  step="any"
                  class="form-control"
                  placeholder="11.1..."
                  required
                />
              </div>
            </div>
            <button type="submit" class="btn btn-primary-custom w-100 fw-bold">
              {{ t("admin.add_place_btn") }}
            </button>
          </form>
        </div>
      </div>
    </div>

    <div class="col-lg-6">
      <div class="card h-100 border-0 shadow-sm">
        <div class="card-header bg-white py-3">
          <h2 class="h5 mb-0 text-primary-custom">
            {{ t("admin.existing_sports") }}
          </h2>
        </div>
        <div class="card-body">
          <div class="mb-4">
            <label class="form-label">{{ t("admin.add_new_sport") }}</label>
            <form @submit.prevent="addSport" class="d-flex gap-2">
              <input
                type="text"
                v-model="addSportName"
                class="form-control"
                :placeholder="t('admin.sport_name_placeholder')"
                required
              />
              <button type="submit" class="btn btn-primary-custom">
                {{ t("admin.add_btn") }}
              </button>
            </form>
          </div>
          <div>
            <h3 class="h6 text-muted mb-3">{{ t("admin.existing_sports") }}</h3>
            <div class="list-group-scrollable">
              <ul class="list-group list-group-flush">
                <li
                  v-if="loading"
                  class="list-group-item text-center text-muted"
                >
                  {{ t("common.loading") }}
                </li>
                <li
                  v-for="sport in sports"
                  :key="sport._id"
                  class="list-group-item"
                >
                  {{ sport.name }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style src="@/assets/css/admin_dashboard.css"></style>
