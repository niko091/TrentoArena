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
        position: { lat: parseFloat(addPlaceForm.lat), lng: parseFloat(addPlaceForm.lng) },
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
  } catch (e) { console.error(e); }
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
  } catch (e) { console.error(e); }
};
</script>

<template>
  <div class="row g-3"> 
    
    <div class="col-lg-6">
      <div class="card compact-card h-100">
        <div class="card-header py-2">
          <h2 class="h6 mb-0 text-brand">{{ t("admin.add_place") }}</h2>
        </div>
        <div class="card-body">
          <form @submit.prevent="addPlace">
            <div class="mb-2">
              <label class="form-label small mb-1">{{ t("admin.name") }}</label>
              <input type="text" v-model="addPlaceForm.name" class="form-control form-control-sm" required />
            </div>
            <div class="mb-2">
              <label class="form-label small mb-1">{{ t("admin.sport") }}</label>
              <select v-model="addPlaceForm.sport" class="form-select form-select-sm" required>
                <option value="" disabled>{{ t("profile.select_sport") }}</option>
                <option v-for="sport in sports" :key="sport._id" :value="sport._id">{{ sport.name }}</option>
              </select>
            </div>
            <div class="row g-2">
              <div class="col-md-6 mb-2">
                <label class="form-label small mb-1">{{ t("admin.lat") }}</label>
                <input type="number" v-model="addPlaceForm.lat" step="any" class="form-control form-control-sm" placeholder="46.0..." required />
              </div>
              <div class="col-md-6 mb-2">
                <label class="form-label small mb-1">{{ t("admin.lng") }}</label>
                <input type="number" v-model="addPlaceForm.lng" step="any" class="form-control form-control-sm" placeholder="11.1..." required />
              </div>
            </div>
            <button type="submit" class="btn btn-primary-custom btn-sm w-100 fw-bold mt-2">
              {{ t("admin.add_place_btn") }}
            </button>
          </form>
        </div>
      </div>
    </div>

    <div class="col-lg-6">
      <div class="card compact-card h-100">
        <div class="card-header py-2">
          <h2 class="h6 mb-0 text-brand">{{ t("admin.existing_sports") }}</h2>
        </div>
        <div class="card-body d-flex flex-column">
          <div class="mb-3">
            <label class="form-label small mb-1">{{ t("admin.add_new_sport") }}</label>
            <form @submit.prevent="addSport" class="d-flex gap-2">
              <input type="text" v-model="addSportName" class="form-control form-control-sm" :placeholder="t('admin.sport_name_placeholder')" required />
              <button type="submit" class="btn btn-primary-custom btn-sm">{{ t("admin.add_btn") }}</button>
            </form>
          </div>
          
          <div class="d-flex flex-column flex-grow-1" style="min-height: 0;">
            <h3 class="h6 text-secondary small mb-2">{{ t("admin.existing_sports") }}</h3>
            <div class="list-group-scrollable flex-grow-1">
              <ul class="list-group list-group-flush">
                <li v-if="loading" class="list-group-item text-center text-secondary py-1 small">{{ t("common.loading") }}</li>
                <li v-for="sport in sports" :key="sport._id" class="list-group-item py-1 small">{{ sport.name }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped src="@/assets/css/admin_dashboard.css"></style>

<style scoped>
.text-brand { color: var(--brand-primary); font-weight: 600; }
.text-secondary { color: var(--text-secondary) !important; }

.list-group-scrollable {
  overflow-y: auto;
  height: 100%; 
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
}

.form-label { color: var(--text-primary); font-weight: 600; }
.compact-card .card-body { padding: 1rem; }
</style>