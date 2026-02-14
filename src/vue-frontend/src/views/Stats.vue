<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import Chart from "chart.js/auto";

const router = useRouter();
const { t } = useI18n();

const sports = ref<any[]>([]);
const places = ref<any[]>([]);
const selectedSport = ref("");
const selectedPlace = ref("");
const topSportsPeriod = ref("year");
const topPlacesPeriod = ref("year");
const topSportsList = ref<any[]>([]);
const topPlacesList = ref<any[]>([]);

let sportChartInstance: Chart | null = null;
let placeChartInstance: Chart | null = null;

const sportCanvas = ref<HTMLCanvasElement | null>(null);
const placeCanvas = ref<HTMLCanvasElement | null>(null);

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

const init = async () => {
  const fetchedSports = await fetchData("/api/sports");
  if (fetchedSports) sports.value = fetchedSports;

  const fetchedPlaces = await fetchData("/api/places");
  if (fetchedPlaces) places.value = fetchedPlaces;

  await updateTopSports();
  await updateTopPlaces();
};

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
          borderColor: "#fd7e14",
          backgroundColor: "rgba(253, 126, 20, 0.5)",
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } },
      },
      plugins: {
        legend: {
          labels: {
            color: window.matchMedia("(prefers-color-scheme: dark)").matches
              ? "#e0e0e0"
              : "#666",
          },
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
          borderColor: "#fd7e14",
          backgroundColor: "rgba(253, 126, 20, 0.5)",
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } },
      },
      plugins: {
        legend: {
          labels: {
            color: window.matchMedia("(prefers-color-scheme: dark)").matches
              ? "#e0e0e0"
              : "#666",
          },
        },
      },
    },
  });
};

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
    <div class="stats-header-strip">
      <div
        class="container h-100 d-flex justify-content-between align-items-center"
      >
        <div class="d-flex align-items-center">
          <img
            src="/images/logo_TrentoArena.png"
            alt="TrentoArena"
            class="me-3 stats-logo"
          />
          <h1 class="h3 mb-0 fw-bold title-text">{{ t("stats.title") }}</h1>
        </div>

        <button @click="logout" class="btn-logout">
          <span>{{ t("admin.logout") }}</span>
        </button>
      </div>
    </div>

    <div class="container pb-4">
      <div class="row g-4 mb-5">
        <div class="col-lg-8">
          <div class="card h-100">
            <div
              class="card-header d-flex justify-content-between align-items-center"
            >
              <h2>{{ t("stats.games_by_sport") }}</h2>
              <select
                v-model="selectedSport"
                @change="updateSportChart"
                class="form-select w-auto"
              >
                <option value="" disabled>{{ t("stats.select_sport") }}</option>
                <option
                  v-for="sport in sports"
                  :key="sport._id"
                  :value="sport._id"
                >
                  {{ sport.name }}
                </option>
              </select>
            </div>
            <div class="card-body">
              <canvas ref="sportCanvas"></canvas>
            </div>
          </div>
        </div>

        <div class="col-lg-4">
          <div class="card h-100">
            <div
              class="card-header d-flex justify-content-between align-items-center"
            >
              <h2>{{ t("stats.top_sports") }}</h2>
              <select
                v-model="topSportsPeriod"
                @change="updateTopSports"
                class="form-select w-auto"
              >
                <option value="year">{{ t("stats.period_year") }}</option>
                <option value="month">{{ t("stats.period_month") }}</option>
                <option value="all">{{ t("stats.period_all") }}</option>
              </select>
            </div>
            <ul class="list-group list-group-flush">
              <li
                v-for="(item, index) in topSportsList"
                :key="index"
                class="list-group-item d-flex justify-content-between align-items-center px-4 py-3"
              >
                <div class="d-flex align-items-center">
                  <span class="rank-badge me-3">{{ index + 1 }}</span>
                  <span class="fw-medium">{{ item.name }}</span>
                </div>
                <span class="badge bg-primary rounded-pill">{{
                  item.count
                }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="row g-4">
        <div class="col-lg-8">
          <div class="card h-100">
            <div
              class="card-header d-flex justify-content-between align-items-center"
            >
              <h2>{{ t("stats.games_by_place") }}</h2>
              <select
                v-model="selectedPlace"
                @change="updatePlaceChart"
                class="form-select w-auto"
              >
                <option value="" disabled>{{ t("stats.select_place") }}</option>
                <option
                  v-for="place in places"
                  :key="place._id"
                  :value="place._id"
                >
                  {{ place.name }}
                </option>
              </select>
            </div>
            <div class="card-body">
              <canvas ref="placeCanvas"></canvas>
            </div>
          </div>
        </div>

        <div class="col-lg-4">
          <div class="card h-100">
            <div
              class="card-header d-flex justify-content-between align-items-center"
            >
              <h2>{{ t("stats.top_places") }}</h2>
              <select
                v-model="topPlacesPeriod"
                @change="updateTopPlaces"
                class="form-select w-auto"
              >
                <option value="year">{{ t("stats.period_year") }}</option>
                <option value="month">{{ t("stats.period_month") }}</option>
                <option value="all">{{ t("stats.period_all") }}</option>
              </select>
            </div>
            <ul class="list-group list-group-flush">
              <li
                v-for="(item, index) in topPlacesList"
                :key="index"
                class="list-group-item d-flex justify-content-between align-items-center px-4 py-3"
              >
                <div class="d-flex align-items-center">
                  <span class="rank-badge me-3">{{ index + 1 }}</span>
                  <span class="fw-medium">{{ item.name }}</span>
                </div>
                <span class="badge bg-success rounded-pill">{{
                  item.count
                }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style src="@/assets/css/stats.css"></style>
