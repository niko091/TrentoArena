<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import { useI18n } from "vue-i18n";

// Types
import { IUserShared, ILeaderboardEntry } from "@shared/types/User";
import { ISportShared } from "@shared/types/Sport";

// Use shared types
type User = IUserShared;
type Sport = ISportShared;
type LeaderboardEntry = ILeaderboardEntry;

// State
const currentUser = ref<User | null>(null);
const sports = ref<Sport[]>([]);
const selectedSportId = ref<string>("");
const filterType = ref<"global" | "friends">("global");
const leaderboardData = ref<LeaderboardEntry[]>([]);
const loading = ref(false);
const error = ref("");
const loadingSports = ref(true);

// i18n Helper
const { t } = useI18n();

// Actions
const fetchCurrentUser = async () => {
  try {
    const res = await fetch("/auth/current_user");
    if (res.ok) {
      currentUser.value = await res.json();
    }
  } catch (e) {
    console.error("Auth check failed:", e);
  }
};

const fetchSports = async () => {
  loadingSports.value = true;
  try {
    const res = await fetch("/api/sports");
    if (res.ok) {
      sports.value = await res.json();
      if (sports.value.length > 0) {
        selectedSportId.value = sports.value[0]._id;
      }
    } else {
      console.error("Failed to fetch sports");
    }
  } catch (e) {
    console.error("Error loading sports:", e);
  } finally {
    loadingSports.value = false;
  }
};

const fetchLeaderboard = async () => {
  if (!selectedSportId.value) return;

  loading.value = true;
  leaderboardData.value = []; // Clear for loading state
  error.value = "";

  try {
    const res = await fetch(
      `/api/users/leaderboard?sportId=${selectedSportId.value}&limit=100`,
    );
    if (res.ok) {
      leaderboardData.value = await res.json();
    } else {
      throw new Error("Failed to fetch leaderboard");
    }
  } catch (e) {
    console.error("Error loading leaderboard:", e);
    error.value = t("leaderboard.list_load_error");
  } finally {
    loading.value = false;
  }
};

// Computed
const displayedUsers = computed(() => {
  if (filterType.value === "friends" && currentUser.value) {
    const friendIds = (currentUser.value.friends || []).map(
      (f: any) => f._id || f,
    );
    return leaderboardData.value.filter(
      (u) => u._id === currentUser.value?._id || friendIds.includes(u._id),
    );
  }
  return leaderboardData.value;
});

// Watchers
watch(selectedSportId, () => {
  fetchLeaderboard();
});

// Lifecycle
onMounted(async () => {
  await fetchCurrentUser();
  await fetchSports();
});
</script>

<template>
  <div class="container mt-5">
    <div class="row justify-content-center">
      <div class="col-md-8">
        <div class="card shadow-sm border-0">
          <div class="card-body p-4">
            <h2
              class="text-center fw-bold mb-4"
              style="color: rgb(223, 103, 5)"
            >
              {{ t("leaderboard.title") }}
            </h2>

            <div class="d-flex justify-content-center mb-4">
              <div class="btn-group" role="group" aria-label="Leaderboard Type">
                <input
                  type="radio"
                  class="btn-check"
                  name="lbType"
                  id="lbGlobal"
                  autocomplete="off"
                  value="global"
                  v-model="filterType"
                />
                <label class="btn btn-outline-primary" for="lbGlobal">
                  {{ t("leaderboard.global") }}
                </label>

                <input
                  type="radio"
                  class="btn-check"
                  name="lbType"
                  id="lbFriends"
                  autocomplete="off"
                  value="friends"
                  v-model="filterType"
                  :disabled="!currentUser"
                />
                <label
                  class="btn btn-outline-primary"
                  for="lbFriends"
                  :title="!currentUser ? t('leaderboard.login_tooltip') : ''"
                  :class="{ disabled: !currentUser }"
                >
                  {{ t("leaderboard.friends") }}
                </label>
              </div>
            </div>

            <div class="mb-4">
              <label for="sportFilter" class="form-label fw-bold">
                {{ t("leaderboard.select_sport") }}
              </label>
              <select
                id="sportFilter"
                class="form-select"
                v-model="selectedSportId"
              >
                <option value="" disabled v-if="loadingSports">
                  {{ t("leaderboard.loading_sports") }}
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

            <div class="table-responsive">
              <table class="table table-hover align-middle">
                <thead class="">
                  <tr>
                    <th scope="col" style="width: 10%">#</th>
                    <th scope="col" style="width: 70%">
                      {{ t("leaderboard.col_player") }}
                    </th>
                    <th scope="col" style="width: 20%" class="text-end">
                      {{ t("leaderboard.col_elo") }}
                    </th>
                  </tr>
                </thead>
                <tbody id="leaderboardTableBody">
                  <!-- Loading State -->
                  <tr v-if="loading">
                    <td colspan="3" class="text-center py-4">
                      {{ t("common.loading") }}
                    </td>
                  </tr>

                  <!-- Error State -->
                  <tr v-else-if="error">
                    <td colspan="3" class="text-center py-4 text-danger">
                      {{ error }}
                    </td>
                  </tr>

                  <!-- Empty State (No sport selected or no results) -->
                  <tr v-else-if="!selectedSportId">
                    <td colspan="3" class="text-center py-4 text-muted">
                      {{ t("leaderboard.select_sport_prompt") }}
                    </td>
                  </tr>
                  <tr v-else-if="displayedUsers.length === 0">
                    <td colspan="3" class="text-center py-4 text-muted">
                      {{ t("leaderboard.none_found") }}
                    </td>
                  </tr>

                  <!-- Results -->
                  <tr
                    v-else
                    v-for="(user, index) in displayedUsers"
                    :key="user._id"
                  >
                    <!-- Rank -->
                    <td class="align-middle" v-if="index === 0">
                      <span class="badge bg-warning text-dark fs-6">🥇 1</span>
                    </td>
                    <td class="align-middle" v-else-if="index === 1">
                      <span class="badge bg-secondary fs-6">🥈 2</span>
                    </td>
                    <td class="align-middle" v-else-if="index === 2">
                      <span
                        class="badge text-bg-custom-bronze fs-6"
                        style="background-color: #cd7f32; color: white"
                        >🥉 3</span
                      >
                    </td>
                    <td class="align-middle" v-else>
                      <strong>#{{ index + 1 }}</strong>
                    </td>

                    <!-- Player -->
                    <td class="align-middle">
                      <div class="d-flex align-items-center">
                        <img
                          :src="
                            user.profilePicture || '/images/utenteDefault.png'
                          "
                          :alt="user.username"
                          class="leaderboard-img shadow-sm"
                        />
                        <router-link
                          :to="`/user/${user.username}`"
                          class="text-decoration-none fw-semibold"
                          style="color: inherit"
                        >
                          {{ user.username }}
                        </router-link>
                      </div>
                    </td>

                    <!-- ELO -->
                    <td
                      class="align-middle text-end fw-bold font-monospace fs-5"
                      style="color: var(--accent-primary, #fd7e14)"
                    >
                      {{ user.elo }}
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
</template>

<style scoped>
.leaderboard-img {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 50%;
  margin-right: 10px;
}
</style>
