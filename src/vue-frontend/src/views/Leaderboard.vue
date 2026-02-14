<script setup lang="ts">
import { ref, onMounted, computed, watch, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
import { IUserShared, ILeaderboardEntry } from "@shared/types/User";
import { ISportShared } from "@shared/types/Sport";
import LeaderboardTable from "../components/LeaderboardTable.vue";

const currentUser = ref<IUserShared | null>(null);
const sports = ref<ISportShared[]>([]);
const selectedSportId = ref<string>("");
const filterType = ref<"global" | "friends">("global");
const leaderboardData = ref<ILeaderboardEntry[]>([]);
const loading = ref(false);
const error = ref("");
const loadingSports = ref(true);

let abortController: AbortController | null = null;

const { t } = useI18n();

const displayedUsers = computed(() => {
  if (filterType.value !== "friends" || !currentUser.value) {
    return leaderboardData.value;
  }

  const currentUserId = String(currentUser.value._id);

  const friendIdsSet = new Set(
    (currentUser.value.friends || []).map((f: any) => {
      const id = (typeof f === 'object' && f !== null && f._id) ? f._id : f;
      return String(id);
    })
  );

  return leaderboardData.value.filter((u) => {
    const userId = String(u._id);
    return userId === currentUserId || friendIdsSet.has(userId);
  });
});

const fetchCurrentUser = async () => {
  try {
    const res = await fetch("/auth/current_user");
    if (res.ok) currentUser.value = await res.json();
  } catch (e) { console.error("Auth check failed:", e); }
};

const fetchSports = async () => {
  loadingSports.value = true;
  try {
    const res = await fetch("/api/sports");
    if (res.ok) {
      sports.value = await res.json();
      if (sports.value.length > 0 && !selectedSportId.value) {
        selectedSportId.value = sports.value[0]._id;
      }
    }
  } catch (e) { console.error("Error loading sports:", e); } 
  finally { loadingSports.value = false; }
};

const fetchLeaderboard = async () => {
  if (!selectedSportId.value) return;
  if (abortController) {
    abortController.abort();
  }
  abortController = new AbortController();

  loading.value = true;
  error.value = "";

  try {
    const res = await fetch(
      `/api/users/leaderboard?sportId=${selectedSportId.value}&limit=100`, 
      { signal: abortController.signal } 
    );

    if (res.ok) {
      leaderboardData.value = await res.json();
    } else {
      throw new Error("Failed to fetch");
    }
  } catch (e: any) {
    if (e.name === 'AbortError') {
      console.log('Fetch aborted due to quick switch');
      return; 
    }
    error.value = t("leaderboard.list_load_error");
    leaderboardData.value = []; 
  } finally {
    if (!abortController?.signal.aborted) {
      loading.value = false;
    }
  }
};

watch(selectedSportId, fetchLeaderboard);

onMounted(async () => {
  await fetchCurrentUser();
  await fetchSports();
});

onUnmounted(() => {
  if (abortController) abortController.abort();
});
</script>

<template>
  <div class="container mt-4 mt-md-5">
    <div class="row justify-content-center">
      <div class="col-12 col-lg-10 col-xl-8">
        <div class="leaderboard-card">     
          <div class="controls-container">
            <h2 class="leaderboard-title text-center mb-4">
              <i class="bi bi-trophy text-warning me-2"></i>
              {{ t("leaderboard.title") }}
            </h2>

            <div class="row g-3 align-items-center">   
              <div class="col-md-6 text-center text-md-start">
                <div class="btn-group" role="group">
                  <input type="radio" class="btn-check" name="lbType" id="lbGlobal" value="global" v-model="filterType" />
                  <label class="btn btn-outline-dark" for="lbGlobal">{{ t("leaderboard.global") }}</label>

                  <input type="radio" class="btn-check" name="lbType" id="lbFriends" value="friends" v-model="filterType" :disabled="!currentUser" />
                  <label class="btn btn-outline-dark" for="lbFriends" :class="{ disabled: !currentUser }">
                    {{ t("leaderboard.friends") }}
                    <i v-if="!currentUser" class="bi bi-lock-fill ms-1"></i>
                  </label>
                </div>
              </div>

              <div class="col-md-6">
                <select class="form-select custom-select" v-model="selectedSportId">
                  <option value="" disabled v-if="loadingSports">{{ t("leaderboard.loading_sports") }}</option>
                  <option v-for="sport in sports" :key="sport._id" :value="sport._id">
                    {{ sport.name }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <LeaderboardTable 
            :users="displayedUsers" 
            :loading="loading" 
            :error="error"
            :sport-selected="!!selectedSportId"
          /> 
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped src="../assets/css/leaderboard.css"></style>