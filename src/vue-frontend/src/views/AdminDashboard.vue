<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import * as bootstrap from "bootstrap";

const { t } = useI18n();
const router = useRouter();

// State

const places = ref<any[]>([]);
const sports = ref<any[]>([]);
const reports = ref<any[]>([]);
const bannedUsers = ref<any[]>([]);

// Forms
const addPlaceForm = reactive({
  name: "",
  sport: "",
  lat: "",
  lng: "",
});

const addSportName = ref("");

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

// Loading states
const loading = ref({
  places: true,
  sports: true,
  reports: true,
  bannedUsers: true,
});

// Modals
let editPlaceModal: bootstrap.Modal | null = null;
let banUserModal: bootstrap.Modal | null = null;

onMounted(() => {
  fetchPlaces();
  fetchSports();
  fetchReports();
  fetchBannedUsers();

  const editModalEl = document.getElementById("editPlaceModal");
  if (editModalEl) editPlaceModal = new bootstrap.Modal(editModalEl);

  const banModalEl = document.getElementById("banUserModal");
  if (banModalEl) banUserModal = new bootstrap.Modal(banModalEl);
});

const getAuthHeaders = (): HeadersInit => {
  const auth = localStorage.getItem("admin_auth");
  if (!auth) {
    router.push("/admin/login");
    return {};
  }
  return {
    Authorization: `Basic ${auth}`,
    "Content-Type": "application/json",
  };
};

const handleAuthError = (response: Response) => {
  if (response.status === 401) {
    localStorage.removeItem("admin_auth");
    router.push("/admin/login");
    return true;
  }
  return false;
};

const logout = () => {
  localStorage.removeItem("admin_auth");
  router.push("/admin/login");
};

// Fetch Functions

const fetchPlaces = async () => {
  loading.value.places = true;
  try {
    const response = await fetch("/api/places");
    if (response.ok) {
      places.value = await response.json();
    }
  } catch (error) {
    console.error("Error loading places:", error);
  } finally {
    loading.value.places = false;
  }
};

const fetchSports = async () => {
  loading.value.sports = true;
  try {
    const response = await fetch("/api/sports");
    if (response.ok) {
      sports.value = await response.json();
    }
  } catch (error) {
    console.error("Error fetching sports:", error);
  } finally {
    loading.value.sports = false;
  }
};

const fetchReports = async () => {
  loading.value.reports = true;
  try {
    const response = await fetch("/api/reports", {
      headers: getAuthHeaders(),
    });
    if (handleAuthError(response)) return;

    if (response.ok) {
      reports.value = await response.json();
    }
  } catch (error) {
    console.error("Error loading reports:", error);
  } finally {
    loading.value.reports = false;
  }
};

const fetchBannedUsers = async () => {
  loading.value.bannedUsers = true;
  try {
    const response = await fetch("/api/admin/banned-users", {
      headers: getAuthHeaders(),
    });
    if (handleAuthError(response)) return;

    if (response.ok) {
      bannedUsers.value = await response.json();
    }
  } catch (error) {
    console.error("Error fetching banned users:", error);
  } finally {
    loading.value.bannedUsers = false;
  }
};

// Actions
const addPlace = async () => {
  const formData = {
    name: addPlaceForm.name,
    sport: addPlaceForm.sport,
    position: {
      lat: parseFloat(addPlaceForm.lat),
      lng: parseFloat(addPlaceForm.lng),
    },
  };

  try {
    const response = await fetch("/api/places", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(formData),
    });
    if (handleAuthError(response)) return;

    if (response.ok) {
      alert(t("admin.js.place_added"));
      addPlaceForm.name = "";
      addPlaceForm.sport = "";
      addPlaceForm.lat = "";
      addPlaceForm.lng = "";
      fetchPlaces();
    } else {
      const data = await response.json();
      alert(`Error adding place: ${data.message}`);
    }
  } catch (error) {
    console.error("Error adding place:", error);
    alert("Error adding place");
  }
};

const addSport = async () => {
  try {
    const response = await fetch("/api/sports", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ name: addSportName.value }),
    });
    if (handleAuthError(response)) return;

    if (response.ok) {
      alert(t("admin.js.sport_added"));
      addSportName.value = "";
      fetchSports();
    } else {
      const data = await response.json();
      alert(`Error adding sport: ${data.message}`);
    }
  } catch (error) {
    console.error("Error adding sport:", error);
    alert("Error adding sport");
  }
};

const deletePlace = async (id: string) => {
  if (!confirm(t("admin.js.confirm_delete_place"))) return;

  try {
    const response = await fetch(`/api/places/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (handleAuthError(response)) return;

    if (response.ok) {
      alert(t("admin.js.place_deleted"));
      fetchPlaces();
    } else {
      const data = await response.json();
      alert(`Error deleting place: ${data.message}`);
    }
  } catch (error) {
    console.error("Error deleting place:", error);
    alert("Error deleting place");
  }
};

const openEditModal = (place: any) => {
  editPlaceForm.id = place._id;
  editPlaceForm.name = place.name;
  editPlaceForm.lat = place.position.lat;
  editPlaceForm.lng = place.position.lng;
  editPlaceForm.sport = place.sport ? place.sport._id || place.sport : "";
  editPlaceModal?.show();
};

const updatePlace = async () => {
  const formData = {
    name: editPlaceForm.name,
    sport: editPlaceForm.sport,
    position: {
      lat: parseFloat(editPlaceForm.lat),
      lng: parseFloat(editPlaceForm.lng),
    },
  };

  try {
    const response = await fetch(`/api/places/${editPlaceForm.id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(formData),
    });
    if (handleAuthError(response)) return;

    if (response.ok) {
      alert(t("admin.js.place_updated"));
      editPlaceModal?.hide();
      fetchPlaces();
    } else {
      const data = await response.json();
      alert(`Error updating place: ${data.message}`);
    }
  } catch (error) {
    console.error("Error updating place:", error);
    alert("Error updating place");
  }
};

const openBanModal = (userId: string, username: string) => {
  banUserForm.id = userId;
  banUserForm.username = username;
  banUserForm.reason = "";
  banUserForm.duration = "1d";
  banUserModal?.show();
};

const banUser = async () => {
  try {
    const response = await fetch("/api/admin/ban", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        userId: banUserForm.id,
        duration: banUserForm.duration,
        reason: banUserForm.reason,
      }),
    });
    if (handleAuthError(response)) return;

    if (response.ok) {
      alert("User has been banned successfully.");
      banUserModal?.hide();
      fetchReports();
      fetchBannedUsers();
    } else {
      const data = await response.json();
      alert(`Error banning user: ${data.message}`);
    }
  } catch (error) {
    console.error("Error banning user:", error);
    alert("Error banning user");
  }
};

const unbanUser = async (userId: string, username: string) => {
  if (!confirm(t("admin.js.confirm_unban", { username }))) return;

  try {
    const response = await fetch("/api/admin/unban", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId }),
    });
    if (handleAuthError(response)) return;

    if (response.ok) {
      alert(t("admin.js.user_unbanned", { username }));
      fetchBannedUsers();
    } else {
      const data = await response.json();
      alert(`Error unbanning user: ${data.message}`);
    }
  } catch (error) {
    console.error("Error unbanning user:", error);
    alert("Error unbanning user");
  }
};

// Utils

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString("it-IT");
};

const calculateRemainingTime = (expiryDateString: string) => {
  const expiryDate = new Date(expiryDateString);
  const now = new Date();
  const diffMs = expiryDate.getTime() - now.getTime();

  if (diffMs > 0) {
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHrs = Math.floor(
      (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffDays}d ${diffHrs}h ${diffMins}m`;
  } else {
    return t("admin.js.expired");
  }
};
</script>

<template>
  <div class="admin-page">
    <div class="container py-4">
      <!-- Header Section -->
      <div
        class="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom"
      >
        <div class="d-flex align-items-center">
          <img
            src="/images/logo_TrentoArena.png"
            alt="TrentoArena Logo"
            style="height: 50px; width: auto"
            class="me-3"
          />
          <h1 class="h3 mb-0 text-primary">{{ t("admin.title") }}</h1>
        </div>
        <button
          @click="logout"
          class="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2"
        >
          <i class="bi bi-box-arrow-right"></i> {{ t("admin.logout") }}
        </button>
      </div>

      <div class="row g-4">
        <!-- Add Place Card -->
        <div class="col-lg-6">
          <div class="card h-100 border-0 shadow-sm">
            <div class="card-header bg-white py-3">
              <h2 class="h5 mb-0 text-primary">{{ t("admin.add_place") }}</h2>
            </div>
            <div class="card-body">
              <form @submit.prevent="addPlace">
                <div class="mb-3">
                  <label for="name" class="form-label">{{
                    t("admin.name")
                  }}</label>
                  <input
                    type="text"
                    id="name"
                    v-model="addPlaceForm.name"
                    class="form-control"
                    required
                  />
                </div>
                <div class="mb-3">
                  <label for="sport" class="form-label">{{
                    t("admin.sport")
                  }}</label>
                  <select
                    id="sport"
                    v-model="addPlaceForm.sport"
                    class="form-select"
                    required
                  >
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
                    <label for="lat" class="form-label">{{
                      t("admin.lat")
                    }}</label>
                    <input
                      type="number"
                      id="lat"
                      v-model="addPlaceForm.lat"
                      step="any"
                      class="form-control"
                      placeholder="46.0..."
                      required
                    />
                  </div>
                  <div class="col-md-6 mb-3">
                    <label for="lng" class="form-label">{{
                      t("admin.lng")
                    }}</label>
                    <input
                      type="number"
                      id="lng"
                      v-model="addPlaceForm.lng"
                      step="any"
                      class="form-control"
                      placeholder="11.1..."
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  class="btn btn-success w-100 text-white fw-bold"
                >
                  {{ t("admin.add_place_btn") }}
                </button>
              </form>
            </div>
          </div>
        </div>

        <!-- Sports Management Card -->
        <div class="col-lg-6">
          <div class="card h-100 border-0 shadow-sm">
            <div class="card-header bg-white py-3">
              <h2 class="h5 mb-0 text-primary">
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
                  <button type="submit" class="btn btn-primary text-white">
                    {{ t("admin.add_btn") }}
                  </button>
                </form>
              </div>

              <div>
                <h3 class="h6 text-secondary mb-3">
                  {{ t("admin.existing_sports") }}
                </h3>
                <div class="list-group-container">
                  <ul class="list-group list-group-flush">
                    <li
                      v-if="loading.sports"
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

        <!-- Existing Places -->
        <div class="col-12">
          <div class="card border-0 shadow-sm">
            <div class="card-header bg-white py-3">
              <h2 class="h5 mb-0 text-primary">
                {{ t("admin.existing_places") }}
              </h2>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-hover mb-0 align-middle">
                  <thead class="table-light">
                    <tr>
                      <th>{{ t("admin.table_name") }}</th>
                      <th>{{ t("admin.table_sport") }}</th>
                      <th>{{ t("admin.table_lat") }}</th>
                      <th>{{ t("admin.table_lng") }}</th>
                      <th>{{ t("admin.table_actions") }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="loading.places">
                      <td colspan="5" class="text-center py-4">
                        {{ t("common.loading") }}
                      </td>
                    </tr>
                    <tr v-for="place in places" :key="place._id">
                      <td class="fw-medium">{{ place.name }}</td>
                      <td>
                        <span
                          class="badge bg-secondary-subtle text-secondary-emphasis"
                          >{{
                            place.sport?.name || t("admin.js.unknown")
                          }}</span
                        >
                      </td>
                      <td class="text-muted small">{{ place.position.lat }}</td>
                      <td class="text-muted small">{{ place.position.lng }}</td>
                      <td>
                        <button
                          @click="openEditModal(place)"
                          class="btn btn-outline-primary btn-sm me-2"
                        >
                          {{ t("common.edit") }}
                        </button>
                        <button
                          @click="deletePlace(place._id)"
                          class="btn btn-outline-danger btn-sm"
                        >
                          {{ t("common.delete") }}
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- User Reports -->
        <div class="col-lg-6">
          <div class="card h-100 border-0 shadow-sm">
            <div class="card-header bg-white py-3">
              <h2 class="h5 mb-0 text-primary">
                {{ t("admin.user_reports") }}
              </h2>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-hover mb-0 align-middle">
                  <thead class="table-light">
                    <tr>
                      <th>{{ t("admin.table_date") }}</th>
                      <th>{{ t("admin.table_reporter") }}</th>
                      <th>{{ t("admin.table_reported_user") }}</th>
                      <th>{{ t("admin.table_actions") }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="loading.reports">
                      <td colspan="4" class="text-center py-4">
                        {{ t("common.loading") }}
                      </td>
                    </tr>
                    <tr v-for="report in reports" :key="report._id">
                      <td class="small">{{ formatDateTime(report.date) }}</td>
                      <td>
                        {{ report.reporter?.username || t("admin.js.unknown") }}
                      </td>
                      <td>
                        <div class="fw-bold">
                          {{
                            report.reported?.username || t("admin.js.unknown")
                          }}
                        </div>
                        <small
                          class="text-muted d-block text-truncate"
                          style="max-width: 150px"
                          >{{ report.motivation }}</small
                        >
                      </td>
                      <td>
                        <button
                          v-if="report.reported?.isBanned"
                          class="btn btn-secondary btn-sm"
                          disabled
                        >
                          Banned
                        </button>
                        <button
                          v-else-if="report.reported"
                          @click="
                            openBanModal(
                              report.reported._id,
                              report.reported.username,
                            )
                          "
                          class="btn btn-outline-danger btn-sm"
                        >
                          Ban
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Banned Users -->
        <div class="col-lg-6">
          <div class="card h-100 border-0 shadow-sm">
            <div class="card-header bg-white py-3">
              <h2 class="h5 mb-0 text-primary">
                {{ t("admin.banned_users") }}
              </h2>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-hover mb-0 align-middle">
                  <thead class="table-light">
                    <tr>
                      <th>{{ t("admin.table_username") }}</th>
                      <th>{{ t("admin.table_ban_expiry") }}</th>
                      <th>{{ t("admin.table_actions") }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="loading.bannedUsers">
                      <td colspan="3" class="text-center py-4">
                        {{ t("common.loading") }}
                      </td>
                    </tr>
                    <tr v-for="user in bannedUsers" :key="user._id">
                      <td>
                        <div class="fw-bold">{{ user.username }}</div>
                        <small class="text-muted">{{
                          user.banReason || "No reason"
                        }}</small>
                      </td>
                      <td class="small">
                        <div>
                          {{
                            user.banExpiresAt
                              ? new Date(user.banExpiresAt).toLocaleDateString()
                              : t("admin.js.forever")
                          }}
                        </div>
                        <div class="text-danger">
                          {{
                            user.banExpiresAt
                              ? calculateRemainingTime(user.banExpiresAt)
                              : ""
                          }}
                        </div>
                      </td>
                      <td>
                        <button
                          @click="unbanUser(user._id, user.username)"
                          class="btn btn-outline-success btn-sm"
                        >
                          Unban
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Edit Place Modal -->
  <div class="modal fade" id="editPlaceModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">{{ t("admin.edit_place_title") }}</h5>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="updatePlace">
            <div class="mb-3">
              <label for="edit-name" class="form-label">{{
                t("admin.name")
              }}</label>
              <input
                type="text"
                class="form-control"
                id="edit-name"
                v-model="editPlaceForm.name"
                required
              />
            </div>
            <div class="mb-3">
              <label for="edit-sport" class="form-label">{{
                t("admin.sport")
              }}</label>
              <select
                class="form-select"
                id="edit-sport"
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
                <label for="edit-lat" class="form-label">{{
                  t("admin.lat")
                }}</label>
                <input
                  type="number"
                  class="form-control"
                  id="edit-lat"
                  step="any"
                  v-model="editPlaceForm.lat"
                  required
                />
              </div>
              <div class="col-6 mb-3">
                <label for="edit-lng" class="form-label">{{
                  t("admin.lng")
                }}</label>
                <input
                  type="number"
                  class="form-control"
                  id="edit-lng"
                  step="any"
                  v-model="editPlaceForm.lng"
                  required
                />
              </div>
            </div>
            <button type="submit" class="btn btn-primary w-100 text-white">
              {{ t("admin.save_changes") }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>

  <!-- Ban User Modal -->
  <div class="modal fade" id="banUserModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">{{ t("admin.ban_user_title") }}</h5>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="banUser">
            <p>
              Banning user: <strong>{{ banUserForm.username }}</strong>
            </p>
            <div class="mb-3">
              <label for="ban-duration" class="form-label">{{
                t("admin.ban_duration")
              }}</label>
              <select
                class="form-select"
                id="ban-duration"
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
              <label for="ban-reason" class="form-label">{{
                t("admin.ban_reason")
              }}</label>
              <input
                type="text"
                class="form-control"
                id="ban-reason"
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

<style scoped>
.admin-page {
  background-color: #f8f9fa;
  min-height: 100vh;
}

.text-primary {
  color: #fd7e14 !important;
}

.btn-primary {
  background-color: #fd7e14;
  border-color: #fd7e14;
}

.btn-primary:hover {
  background-color: #e36209;
  border-color: #e36209;
}

.badge.bg-primary-subtle {
  background-color: #fff4e5 !important;
  color: #fd7e14 !important;
}

.btn-outline-primary {
  color: #fd7e14;
  border-color: #fd7e14;
}

.btn-outline-primary:hover {
  background-color: #fd7e14;
  color: white;
}

.list-group-container {
  max-height: 200px;
  overflow-y: auto;
}

/* Dark Mode Overrides */
@media (prefers-color-scheme: dark) {
  .admin-page {
    background-color: #121212 !important;
  }

  .card {
    background-color: #1e1e1e;
    border-color: #495057;
  }

  .card-header {
    background-color: #1e1e1e !important;
    border-bottom-color: #495057 !important;
  }

  .text-secondary {
    color: #b0b0b0 !important;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    color: #e0e0e0;
  }

  .form-control,
  .form-select {
    background-color: #2d2d2d;
    border-color: #495057;
    color: #e0e0e0;
  }

  .form-control::placeholder {
    color: #6c757d;
  }

  .table {
    color: #e0e0e0;
  }

  .table-light tr th {
    background-color: #2d2d2d;
    color: #e0e0e0;
    border-color: #495057;
  }

  .table-hover tbody tr:hover {
    background-color: #2d2d2d;
  }

  td,
  th {
    border-color: #495057;
  }

  .list-group-item {
    background-color: #1e1e1e;
    border-color: #495057;
    color: #e0e0e0;
  }

  .modal-content {
    background-color: #1e1e1e;
    color: #e0e0e0;
    border-color: #495057;
  }

  .modal-header,
  .modal-footer {
    border-color: #495057;
  }

  .btn-close {
    filter: invert(1);
  }

  .badge.bg-secondary-subtle {
    background-color: #2d2d2d !important;
    color: #b0b0b0 !important;
  }
}
</style>
