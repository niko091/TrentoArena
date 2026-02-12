<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import * as bootstrap from "bootstrap";
import AdminContentPanel from "@/components/admin_dashboard/ContentPanel.vue";
import AdminPlacesTable from "@/components/admin_dashboard/PlaceTable.vue";
import AdminUserPanel from "@/components/admin_dashboard/UserPanel.vue";

const { t } = useI18n();
const router = useRouter();

const places = ref<any[]>([]);
const sports = ref<any[]>([]);
const reports = ref<any[]>([]);
const bannedUsers = ref<any[]>([]);

const loading = reactive({
  places: true,
  sports: true,
  reports: true,
  bannedUsers: true,
});

const editPlaceForm = reactive({
  id: "",
  name: "",
  sport: "",
  lat: "",
  lng: "",
});
const banUserForm = reactive({
  id: "",
  username: "",
  duration: "1d",
  reason: "",
});

let editPlaceModal: bootstrap.Modal | null = null;
let banUserModal: bootstrap.Modal | null = null;

onMounted(() => {
  loadAllData();

  const editEl = document.getElementById("editPlaceModal");
  if (editEl) editPlaceModal = new bootstrap.Modal(editEl);

  const banEl = document.getElementById("banUserModal");
  if (banEl) banUserModal = new bootstrap.Modal(banEl);
});

const loadAllData = () => {
  fetchPlaces();
  fetchSports();
  fetchReports();
  fetchBannedUsers();
};

const logout = () => {
  localStorage.removeItem("admin_auth");
  router.push("/admin/login");
};

const fetchPlaces = async () => {
  loading.places = true;
  try {
    const res = await fetch("/api/places");
    if (res.ok) places.value = await res.json();
  } catch (e) {
    console.error(e);
  } finally {
    loading.places = false;
  }
};

const fetchSports = async () => {
  loading.sports = true;
  try {
    const res = await fetch("/api/sports");
    if (res.ok) sports.value = await res.json();
  } catch (e) {
    console.error(e);
  } finally {
    loading.sports = false;
  }
};

const fetchReports = async () => {
  loading.reports = true;
  try {
    const res = await fetch("/api/reports");
    if (res.ok) reports.value = await res.json();
  } catch (e) {
    console.error(e);
  } finally {
    loading.reports = false;
  }
};

const fetchBannedUsers = async () => {
  loading.bannedUsers = true;
  try {
    const res = await fetch("/api/admin/banned-users");
    if (res.ok) bannedUsers.value = await res.json();
  } catch (e) {
    console.error(e);
  } finally {
    loading.bannedUsers = false;
  }
};

const openEditModal = (place: any) => {
  Object.assign(editPlaceForm, {
    id: place._id,
    name: place.name,
    lat: place.position.lat,
    lng: place.position.lng,
    sport: place.sport ? place.sport._id || place.sport : "",
  });
  editPlaceModal?.show();
};

const updatePlace = async () => {
  try {
    const res = await fetch(`/api/places/${editPlaceForm.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editPlaceForm.name,
        sport: editPlaceForm.sport,
        position: {
          lat: parseFloat(editPlaceForm.lat),
          lng: parseFloat(editPlaceForm.lng),
        },
      }),
    });

    if (res.ok) {
      alert(t("admin.js.place_updated"));
      editPlaceModal?.hide();
      fetchPlaces();
    } else {
      const data = await res.json();
      alert(`Error: ${data.message}`);
    }
  } catch (e) {
    console.error(e);
  }
};

const openBanModal = (user: any) => {
  Object.assign(banUserForm, {
    id: user._id,
    username: user.username,
    reason: "",
    duration: "1d",
  });
  banUserModal?.show();
};

const banUser = async () => {
  try {
    const res = await fetch("/api/admin/ban", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: banUserForm.id,
        duration: banUserForm.duration,
        reason: banUserForm.reason,
      }),
    });

    if (res.ok) {
      alert("User banned.");
      banUserModal?.hide();
      fetchReports();
      fetchBannedUsers();
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
  <div class="admin-page">
    <div class="admin-header-strip">
      <div
        class="container h-100 d-flex justify-content-between align-items-center"
      >
        <div class="d-flex align-items-center">
          <img
            src="/images/logo_TrentoArena.png"
            alt="TrentoArena"
            class="me-3 admin-logo"
          />
          <h1 class="h3 mb-0 fw-bold title-text">{{ t("admin.title") }}</h1>
        </div>

        <button @click="logout" class="btn-logout">
          <span>{{ t("admin.logout") }}</span>
        </button>
      </div>
    </div>

    <div class="container pb-4">
      <AdminContentPanel
        :sports="sports"
        :loading="loading.sports"
        @refresh-places="fetchPlaces"
        @refresh-sports="fetchSports"
      />

      <AdminPlacesTable
        :places="places"
        :loading="loading.places"
        @refresh="fetchPlaces"
        @edit="openEditModal"
      />

      <AdminUserPanel
        :reports="reports"
        :bannedUsers="bannedUsers"
        :loadingReports="loading.reports"
        :loadingBanned="loading.bannedUsers"
        @refresh-users="
          () => {
            fetchReports();
            fetchBannedUsers();
          }
        "
        @open-ban-modal="openBanModal"
      />
    </div>
  </div>

  <div class="modal fade" id="editPlaceModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">{{ t("admin.edit_place_title") }}</h5>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
          ></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="updatePlace">
            <div class="mb-3">
              <label class="form-label">{{ t("admin.name") }}</label>
              <input
                type="text"
                class="form-control"
                v-model="editPlaceForm.name"
                required
              />
            </div>
            <div class="mb-3">
              <label class="form-label">{{ t("admin.sport") }}</label>
              <select
                class="form-select"
                v-model="editPlaceForm.sport"
                required
              >
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
              <div class="col-6 mb-3">
                <label class="form-label">{{ t("admin.lat") }}</label>
                <input
                  type="number"
                  class="form-control"
                  step="any"
                  v-model="editPlaceForm.lat"
                  required
                />
              </div>
              <div class="col-6 mb-3">
                <label class="form-label">{{ t("admin.lng") }}</label>
                <input
                  type="number"
                  class="form-control"
                  step="any"
                  v-model="editPlaceForm.lng"
                  required
                />
              </div>
            </div>
            <button type="submit" class="btn btn-primary-custom w-100">
              {{ t("admin.save_changes") }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>

  <div class="modal fade" id="banUserModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">{{ t("admin.ban_user_title") }}</h5>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
          ></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="banUser">
            <p>
              Banning user: <strong>{{ banUserForm.username }}</strong>
            </p>
            <div class="mb-3">
              <label class="form-label">{{ t("admin.ban_duration") }}</label>
              <select
                class="form-select"
                v-model="banUserForm.duration"
                required
              >
                <option value="1d">1 Day</option>
                <option value="1w">1 Week</option>
                <option value="1m">1 Month</option>
                <option value="forever">Forever</option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label">{{ t("admin.ban_reason") }}</label>
              <input
                type="text"
                class="form-control"
                v-model="banUserForm.reason"
                required
              />
            </div>
            <button type="submit" class="btn btn-danger w-100">
              {{ t("admin.ban_confirm") }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style src="@/assets/css/admin_dashboard.css"></style>
