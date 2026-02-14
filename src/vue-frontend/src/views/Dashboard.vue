<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import GameCard from "../components/GameCard.vue";
import GamePopup from "../components/GamePopup.vue";
import UserWidget from "../components/UserWidget.vue";
import { ISportShared } from "@shared/types/Sport";
import { IPlaceShared } from "@shared/types/Place";
import { IUserShared } from "@shared/types/User";

const router = useRouter();
const { t } = useI18n();
const games = ref<any[]>([]);
const userGamesCount = ref(0);
const currentUser = ref<IUserShared | null>(null);
const selectedGame = ref<any>(null);
const filterStatus = ref("all");
const selectedSport = ref("");
const selectedPlace = ref("");
const isDropdownOpen = ref(false);
const sports = ref<ISportShared[]>([]);
const places = ref<IPlaceShared[]>([]);
const loading = ref(true);

const filteredPlaces = computed(() => {
  if (!selectedSport.value) return places.value;
  return places.value.filter((p) => {
    const pSportId =
      typeof p.sport === "object" && p.sport !== null
        ? (p.sport as any)._id
        : p.sport;
    return pSportId === selectedSport.value;
  });
});

const filterLabel = computed(() => {
  const parts = [];
  if (filterStatus.value === "active") parts.push(t("dashboard.filter_active"));
  else if (filterStatus.value === "finished")
    parts.push(t("dashboard.filter_finished"));

  if (selectedSport.value) {
    const s = sports.value.find((s) => s._id === selectedSport.value);
    if (s) parts.push(s.name);
  }

  if (selectedPlace.value) {
    const p = places.value.find((p) => p._id === selectedPlace.value);
    if (p) parts.push(p.name);
  }

  return parts.length === 0 ? t("dashboard.filter_all") : parts.join(" • ");
});

const emptyMessage = computed(() =>
  games.value.length === 0
    ? t("dashboard.empty_filtered")
    : t("dashboard.empty_all"),
);

const fetchFilterOptions = async () => {
  try {
    const [sportsRes, placesRes] = await Promise.all([
      fetch("/api/sports"),
      fetch("/api/places"),
    ]);

    if (sportsRes.ok) sports.value = await sportsRes.json();
    if (placesRes.ok) places.value = await placesRes.json();
  } catch (error) {
    console.error("Error fetching filter options:", error);
  }
};

const loadDashboardData = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams();
    params.append("limit", "30");
    params.append("sort", "-1");

    if (filterStatus.value === "active") params.append("isFinished", "false");
    else if (filterStatus.value === "finished")
      params.append("isFinished", "true");

    if (selectedSport.value) params.append("sportId", selectedSport.value);
    if (selectedPlace.value) params.append("placeId", selectedPlace.value);

    const [authRes, gamesRes] = await Promise.all([
      fetch("/auth/current_user"),
      fetch(`/api/games?${params.toString()}`),
    ]);

    if (!authRes.ok) {
      router.push("/login");
      return;
    }

    const authContentType = authRes.headers.get("content-type");
    if (authContentType && authContentType.includes("application/json")) {
      currentUser.value = await authRes.json();
    } else {
      loading.value = false;
      return;
    }

    if (gamesRes.ok) {
      games.value = await gamesRes.json();
    }

    if (currentUser.value) {
      try {
        const countRes = await fetch(
          `/api/games?participantId=${currentUser.value._id}&count=true`,
        );
        if (countRes.ok) {
          const countData = await countRes.json();
          userGamesCount.value = countData.count;
        }
      } catch (e) {
        console.error("Failed to fetch game count", e);
      }
    }
  } catch (error) {
    console.error("Error loading dashboard data:", error);
  } finally {
    loading.value = false;
  }
};

const resetFilters = () => {
  selectedSport.value = "";
  selectedPlace.value = "";
  filterStatus.value = "all";
  loadDashboardData();
};

const toggleDropdown = () => (isDropdownOpen.value = !isDropdownOpen.value);
const closeDropdown = () => (isDropdownOpen.value = false);

function handleOutsideClick(event: MouseEvent) {
  const dropdown = document.querySelector(".dropdown");
  if (dropdown && !dropdown.contains(event.target as Node)) {
    isDropdownOpen.value = false;
  }
}

watch(selectedSport, () => {
  selectedPlace.value = "";
  loadDashboardData();
});

watch([selectedPlace, filterStatus], () => {
  loadDashboardData();
});

onMounted(async () => {
  await fetchFilterOptions();
  await loadDashboardData();
  window.addEventListener("click", handleOutsideClick);
});

onUnmounted(() => {
  window.removeEventListener("click", handleOutsideClick);
});
</script>

<template>
  <div class="container-fluid dashboard-wrapper py-5">
    <GamePopup
      v-if="selectedGame"
      :game="selectedGame"
      :current-user="currentUser"
      @close="selectedGame = null"
      @refresh="loadDashboardData"
    />

    <div class="row g-5 justify-content-center">
      <div class="col-xl-4 col-lg-4">
        <div class="sticky-widget">
          <UserWidget :user="currentUser" :games-count="userGamesCount" />
        </div>
      </div>

      <div class="col-xl-6 col-lg-8 offset-xl-1">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h3 class="fw-bold mb-0">{{ t("dashboard.recent_activity") }}</h3>

          <div class="dropdown" ref="dropdownRef">
            <button
              class="btn btn-outline-secondary btn-sm rounded-pill px-3 shadow-sm dropdown-toggle d-flex align-items-center gap-2"
              type="button"
              @click.stop="toggleDropdown"
              :aria-expanded="isDropdownOpen"
              style="min-width: 140px; justify-content: space-between"
            >
              <div
                class="d-flex align-items-center gap-2 text-truncate"
                style="max-width: 250px"
              >
                <i class="bi bi-funnel"></i>
                <span>{{ filterLabel }}</span>
              </div>
            </button>

            <div
              class="dropdown-menu dropdown-menu-end border-0 shadow custom-filter-dropdown"
              :class="{ show: isDropdownOpen }"
              @click.stop
            >
              <h6 class="dropdown-header text-uppercase small fw-bold mb-2">
                {{ t("dashboard.status") || "Stato" }}
              </h6>

              <div class="btn-group w-100 mb-3" role="group">
                <button
                  type="button"
                  class="btn btn-sm btn-outline-primary"
                  :class="{ active: filterStatus === 'all' }"
                  @click="filterStatus = 'all'"
                >
                  {{ t("dashboard.filter_all") }}
                </button>
                <button
                  type="button"
                  class="btn btn-sm btn-outline-primary"
                  :class="{ active: filterStatus === 'active' }"
                  @click="filterStatus = 'active'"
                >
                  {{ t("dashboard.filter_active") }}
                </button>
                <button
                  type="button"
                  class="btn btn-sm btn-outline-primary"
                  :class="{ active: filterStatus === 'finished' }"
                  @click="filterStatus = 'finished'"
                >
                  {{ t("dashboard.filter_finished") }}
                </button>
              </div>

              <h6 class="dropdown-header text-uppercase small fw-bold mb-2">
                {{ t("dashboard.sport") || "Sport" }}
              </h6>
              <select
                class="form-select form-select-sm mb-3"
                v-model="selectedSport"
              >
                <option value="">
                  {{ t("dashboard.all_sports") || "Tutti gli sport" }}
                </option>
                <option
                  v-for="sport in sports"
                  :key="sport._id"
                  :value="sport._id"
                >
                  {{ sport.name }}
                </option>
              </select>

              <h6 class="dropdown-header text-uppercase small fw-bold mb-2">
                {{ t("dashboard.place") || "Luogo" }}
              </h6>
              <select
                class="form-select form-select-sm mb-3"
                v-model="selectedPlace"
                :disabled="filteredPlaces.length === 0 && selectedSport !== ''"
              >
                <option value="">
                  {{
                    selectedSport && filteredPlaces.length === 0
                      ? "Nessun luogo disponibile"
                      : t("dashboard.all_places") || "Tutti i luoghi"
                  }}
                </option>
                <option
                  v-for="place in filteredPlaces"
                  :key="place._id"
                  :value="place._id"
                >
                  {{ place.name }}
                </option>
              </select>

              <hr class="dropdown-divider my-2" />

              <div
                class="d-flex justify-content-between align-items-center mt-3"
              >
                <button
                  class="btn btn-link btn-sm text-danger p-0"
                  @click="resetFilters"
                >
                  Reset
                </button>
                <button
                  class="btn btn-sm btn-primary px-3"
                  @click="closeDropdown"
                >
                  {{ t("common.close") || "Chiudi" }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="d-flex flex-column gap-3">
          <div v-if="loading" class="text-center py-5 text-muted">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <div class="mt-2">{{ t("dashboard.feed_loading") }}</div>
          </div>

          <div
            v-else
            v-for="game in games"
            :key="game._id"
            class="wireframe-card"
            @click="selectedGame = game"
          >
            <GameCard :game="game" class="border-0 bg-transparent" />
          </div>

          <div
            v-if="!loading && games.length === 0"
            class="text-center py-5 text-muted"
          >
            <i class="bi bi-inbox fs-1 d-block mb-3 opacity-50"></i>
            {{ emptyMessage }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style src="@/assets/css/dashboard.css"></style>
