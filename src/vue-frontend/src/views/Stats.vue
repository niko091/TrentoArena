<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Chart from 'chart.js/auto';

const router = useRouter();
const { t } = useI18n();

// State
const sports = ref<any[]>([]);
const places = ref<any[]>([]);
const selectedSport = ref('');
const selectedPlace = ref('');
const topSportsPeriod = ref('year');
const topPlacesPeriod = ref('year');
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
    const auth = localStorage.getItem('stats_auth');
    if (!auth) {
        router.push('/stats/login');
        return {};
    }
    return {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
    };
};

const handleAuthError = (response: Response) => {
    if (response.status === 401) {
        localStorage.removeItem('stats_auth');
        router.push('/stats/login');
        return true;
    }
    return false;
};

const logout = () => {
    localStorage.removeItem('stats_auth');
    router.push('/stats/login');
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
    const fetchedSports = await fetchData('/api/sports');
    if (fetchedSports) sports.value = fetchedSports;

    const fetchedPlaces = await fetchData('/api/places');
    if (fetchedPlaces) places.value = fetchedPlaces;

    await updateTopSports();
    await updateTopPlaces();
};

// Update Charts
const updateSportChart = async () => {
    if (!selectedSport.value || !sportCanvas.value) return;

    const dataMap = await fetchData(`/api/stats/chart-data?type=sport&id=${selectedSport.value}`);
    if (!dataMap) return;

    const labels = Object.keys(dataMap);
    const dataPoints = Object.values(dataMap);

    if (sportChartInstance) sportChartInstance.destroy();

    const sportName = sports.value.find(s => s._id === selectedSport.value)?.name || 'Sport';

    sportChartInstance = new Chart(sportCanvas.value, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: `Games Played: ${sportName}`,
                data: dataPoints as number[],
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.4)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            }
        }
    });
};

const updatePlaceChart = async () => {
    if (!selectedPlace.value || !placeCanvas.value) return;

    const dataMap = await fetchData(`/api/stats/chart-data?type=place&id=${selectedPlace.value}`);
    if (!dataMap) return;

    const labels = Object.keys(dataMap);
    const dataPoints = Object.values(dataMap);

    if (placeChartInstance) placeChartInstance.destroy();

    const placeName = places.value.find(p => p._id === selectedPlace.value)?.name || 'Place';

    placeChartInstance = new Chart(placeCanvas.value, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: `Games Played at: ${placeName}`,
                data: dataPoints as number[],
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: 'rgba(54, 162, 235, 0.4)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            }
        }
    });
};

// Update Leaderboards
const updateTopSports = async () => {
    const data = await fetchData(`/api/stats/top-entities?type=sport&period=${topSportsPeriod.value}`);
    if (data) topSportsList.value = data;
};

const updateTopPlaces = async () => {
    const data = await fetchData(`/api/stats/top-entities?type=place&period=${topPlacesPeriod.value}`);
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
    <div class="container stats-container mt-5">
        <div class="text-center mb-4 position-relative">
            <img src="/images/logo_TrentoArena.png" alt="TrentoArena Logo" style="width: 250px;">
            <button @click="logout" class="btn btn-outline-danger position-absolute top-0 end-0">Logout</button>
        </div>
        <h1 class="text-center mb-5">{{ t('stats.title') }}</h1>

        <div class="row mb-5">
            <!-- Games by Sport -->
            <div class="col-md-7">
                <div class="card h-100 shadow-sm">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h2 class="mb-0 h5">{{ t('stats.games_by_sport') }}</h2>
                            <select v-model="selectedSport" @change="updateSportChart" class="form-select w-auto">
                                <option value="" disabled>{{ t('stats.select_sport') }}</option>
                                <option v-for="sport in sports" :key="sport._id" :value="sport._id">
                                    {{ sport.name }}
                                </option>
                            </select>
                        </div>
                        <canvas ref="sportCanvas"></canvas>
                    </div>
                </div>
            </div>

            <!-- Top Sports -->
            <div class="col-md-5">
                <div class="card h-100 shadow-sm">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h2 class="mb-0 h5">{{ t('stats.top_sports') }}</h2>
                            <select v-model="topSportsPeriod" @change="updateTopSports" class="form-select w-auto">
                                <option value="year">{{ t('stats.period_year') }}</option>
                                <option value="month">{{ t('stats.period_month') }}</option>
                                <option value="all">{{ t('stats.period_all') }}</option>
                            </select>
                        </div>
                        <ul class="list-group list-group-flush">
                            <li v-for="(item, index) in topSportsList" :key="index" class="list-group-item d-flex justify-content-between align-items-center">
                                <span><strong>#{{ index + 1 }}</strong> {{ item.name }}</span>
                                <span class="badge bg-primary rounded-pill">{{ item.count }}</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>

        <div class="row">
            <!-- Games by Place -->
            <div class="col-md-7">
                <div class="card h-100 shadow-sm">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h2 class="mb-0 h5">{{ t('stats.games_by_place') }}</h2>
                            <select v-model="selectedPlace" @change="updatePlaceChart" class="form-select w-auto">
                                <option value="" disabled>{{ t('stats.select_place') }}</option>
                                <option v-for="place in places" :key="place._id" :value="place._id">
                                    {{ place.name }}
                                </option>
                            </select>
                        </div>
                        <canvas ref="placeCanvas"></canvas>
                    </div>
                </div>
            </div>

            <!-- Top Places -->
            <div class="col-md-5">
                <div class="card h-100 shadow-sm">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h2 class="mb-0 h5">{{ t('stats.top_places') }}</h2>
                            <select v-model="topPlacesPeriod" @change="updateTopPlaces" class="form-select w-auto">
                                <option value="year">{{ t('stats.period_year') }}</option>
                                <option value="month">{{ t('stats.period_month') }}</option>
                                <option value="all">{{ t('stats.period_all') }}</option>
                            </select>
                        </div>
                        <ul class="list-group list-group-flush">
                            <li v-for="(item, index) in topPlacesList" :key="index" class="list-group-item d-flex justify-content-between align-items-center">
                                <span><strong>#{{ index + 1 }}</strong> {{ item.name }}</span>
                                <span class="badge bg-primary rounded-pill">{{ item.count }}</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.stats-container {
    padding-bottom: 50px;
}
</style>
