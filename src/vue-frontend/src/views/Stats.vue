<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import Chart from "chart.js/auto";

const router = useRouter();
const { t } = useI18n();

// State
const sports = ref<any[]>([]);
const places = ref<any[]>([]);
const selectedSport = ref("");
const selectedPlace = ref("");
const topSportsPeriod = ref("year");
const topPlacesPeriod = ref("year");
const topSportsList = ref<any[]>([]);
const topPlacesList = ref<any[]>([]);

// Chart Instances
let sportChartInstance: Chart | null = null;
let placeChartInstance: Chart | null = null;

// Refs for Canvas
const sportCanvas = ref<HTMLCanvasElement | null>(null);
const placeCanvas = ref<HTMLCanvasElement | null>(null);

// Auth Helper
const getAuthHeaders = (): HeadersInit => {
  const auth = localStorage.getItem("stats_auth");
  if (!auth) {
    router.push("/stats/login");
    return {};
  }
  return {
    Authorization: `Basic ${auth}`,
    "Content-Type": "application/json",
  };
};

const handleAuthError = (response: Response) => {
  if (response.status === 401) {
    localStorage.removeItem("stats_auth");
    router.push("/stats/login");
    return true;
  }
  return false;
};

const logout = () => {
  localStorage.removeItem("stats_auth");
  router.push("/stats/login");
};

// Fetch Helper
const fetchData = async (url: string) => {
  try {
    const response = await fetch(url, { headers: getAuthHeaders() });
    if (handleAuthError(response)) return null;
    if (!response.ok) throw new Error(`Failed to fetch ${url}`);
    return await response.json();
  } catch (err) {
    console.error(err);
    return null;
  }
};

// Initialization
const init = async () => {
  const fetchedSports = await fetchData("/api/sports");
  if (fetchedSports) sports.value = fetchedSports;

  const fetchedPlaces = await fetchData("/api/places");
  if (fetchedPlaces) places.value = fetchedPlaces;

  await updateTopSports();
  await updateTopPlaces();
};

// Update Charts
const updateSportChart = async () => {
  if (!selectedSport.value || !sportCanvas.value) return;

  const dataMap = await fetchData(
    `/api/stats/chart-data?type=sport&id=${selectedSport.value}`,
  );
  if (!dataMap) return;

  const labels = Object.keys(dataMap);
  const dataPoints = Object.values(dataMap);

  if (sportChartInstance) sportChartInstance.destroy();

  const sportName =
    sports.value.find((s) => s._id === selectedSport.value)?.name || "Sport";

  sportChartInstance = new Chart(sportCanvas.value, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: `Games Played: ${sportName}`,
          data: dataPoints as number[],
          borderColor: "rgba(255, 99, 132, 1)",
          backgroundColor: "rgba(255, 99, 132, 0.4)",
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 },
        },
      },
    },
  });
};

const updatePlaceChart = async () => {
  if (!selectedPlace.value || !placeCanvas.value) return;

  const dataMap = await fetchData(
    `/api/stats/chart-data?type=place&id=${selectedPlace.value}`,
  );
  if (!dataMap) return;

  const labels = Object.keys(dataMap);
  const dataPoints = Object.values(dataMap);

  if (placeChartInstance) placeChartInstance.destroy();

  const placeName =
    places.value.find((p) => p._id === selectedPlace.value)?.name || "Place";

  placeChartInstance = new Chart(placeCanvas.value, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: `Games Played at: ${placeName}`,
          data: dataPoints as number[],
          borderColor: "rgba(54, 162, 235, 1)",
          backgroundColor: "rgba(54, 162, 235, 0.4)",
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 },
        },
      },
    },
  });
};

// Update Leaderboards
const updateTopSports = async () => {
  const data = await fetchData(
    `/api/stats/top-entities?type=sport&period=${topSportsPeriod.value}`,
  );
  if (data) topSportsList.value = data;
};

const updateTopPlaces = async () => {
  const data = await fetchData(
    `/api/stats/top-entities?type=place&period=${topPlacesPeriod.value}`,
  );
  if (data) topPlacesList.value = data;
};

onMounted(() => {
  init();
});

onUnmounted(() => {
  if (sportChartInstance) sportChartInstance.destroy();
  if (placeChartInstance) placeChartInstance.destroy();
});
</script>

<template>
  <div class="stats-page">
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
          <h1 class="h3 mb-0" style="color: #fd7e14">{{ t("stats.title") }}</h1>
        </div>
        <button
          @click="logout"
          class="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2"
        >
          <i class="bi bi-box-arrow-right"></i> {{ t("admin.logout") }}
        </button>
      </div>

      <div class="row g-4 mb-4">
        <!-- Games by Sport -->
        <div class="col-lg-8">
          <div class="card h-100 border-0 shadow-sm">
            <div class="card-header bg-white py-3">
              <div class="d-flex justify-content-between align-items-center">
                <h2 class="h5 mb-0 text-secondary">
                  {{ t("stats.games_by_sport") }}
                </h2>
                <select
                  v-model="selectedSport"
                  @change="updateSportChart"
                  class="form-select form-select-sm w-auto"
                >
                  <option value="" disabled>
                    {{ t("stats.select_sport") }}
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
            </div>
            <div class="card-body">
              <canvas ref="sportCanvas"></canvas>
            </div>
          </div>
        </div>

        <!-- Top Sports -->
        <div class="col-lg-4">
          <div class="card h-100 border-0 shadow-sm">
            <div class="card-header bg-white py-3">
              <div class="d-flex justify-content-between align-items-center">
                <h2 class="h5 mb-0 text-secondary">
                  {{ t("stats.top_sports") }}
                </h2>
                <select
                  v-model="topSportsPeriod"
                  @change="updateTopSports"
                  class="form-select form-select-sm w-auto"
                >
                  <option value="year">{{ t("stats.period_year") }}</option>
                  <option value="month">{{ t("stats.period_month") }}</option>
                  <option value="all">{{ t("stats.period_all") }}</option>
                </select>
              </div>
            </div>
            <ul class="list-group list-group-flush">
              <li
                v-for="(item, index) in topSportsList"
                :key="index"
                class="list-group-item d-flex justify-content-between align-items-center px-4 py-3"
              >
                <div class="d-flex align-items-center">
                  <span
                    class="badge bg-light text-dark me-3 rounded-circle p-2"
                    style="
                      width: 32px;
                      height: 32px;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                    "
                    >{{ index + 1 }}</span
                  >
                  <span class="fw-medium">{{ item.name }}</span>
                </div>
                <span
                  class="badge bg-primary-subtle text-primary rounded-pill"
                  >{{ item.count }}</span
                >
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="row g-4">
        <!-- Games by Place -->
        <div class="col-lg-8">
          <div class="card h-100 border-0 shadow-sm">
            <div class="card-header bg-white py-3">
              <div class="d-flex justify-content-between align-items-center">
                <h2 class="h5 mb-0 text-secondary">
                  {{ t("stats.games_by_place") }}
                </h2>
                <select
                  v-model="selectedPlace"
                  @change="updatePlaceChart"
                  class="form-select form-select-sm w-auto"
                >
                  <option value="" disabled>
                    {{ t("stats.select_place") }}
                  </option>
                  <option
                    v-for="place in places"
                    :key="place._id"
                    :value="place._id"
                  >
                    {{ place.name }}
                  </option>
                </select>
              </div>
            </div>
            <div class="card-body">
              <canvas ref="placeCanvas"></canvas>
            </div>
          </div>
        </div>

        <!-- Top Places -->
        <div class="col-lg-4">
          <div class="card h-100 border-0 shadow-sm">
            <div class="card-header bg-white py-3">
              <div class="d-flex justify-content-between align-items-center">
                <h2 class="h5 mb-0 text-secondary">
                  {{ t("stats.top_places") }}
                </h2>
                <select
                  v-model="topPlacesPeriod"
                  @change="updateTopPlaces"
                  class="form-select form-select-sm w-auto"
                >
                  <option value="year">{{ t("stats.period_year") }}</option>
                  <option value="month">{{ t("stats.period_month") }}</option>
                  <option value="all">{{ t("stats.period_all") }}</option>
                </select>
              </div>
            </div>
            <ul class="list-group list-group-flush">
              <li
                v-for="(item, index) in topPlacesList"
                :key="index"
                class="list-group-item d-flex justify-content-between align-items-center px-4 py-3"
              >
                <div class="d-flex align-items-center">
                  <span
                    class="badge bg-light text-dark me-3 rounded-circle p-2"
                    style="
                      width: 32px;
                      height: 32px;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                    "
                    >{{ index + 1 }}</span
                  >
                  <span class="fw-medium">{{ item.name }}</span>
                </div>
                <span
                  class="badge bg-success-subtle text-success rounded-pill"
                  >{{ item.count }}</span
                >
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stats-page {
  background-color: #f8f9fa;
  min-height: 100vh;
}
.card {
  transition: transform 0.2s;
}

@media (prefers-color-scheme: dark) {
  .stats-page {
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

  .list-group-item {
    background-color: #1e1e1e;
    border-color: #495057;
    color: #e0e0e0;
  }

  .badge.bg-light {
    background-color: #2d2d2d !important;
    color: #e0e0e0 !important;
  }

  .form-select {
    background-color: #2d2d2d;
    border-color: #495057;
    color: #e0e0e0;
  }
}
</style>
