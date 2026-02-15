<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from "vue";
import Chart from "chart.js/auto";
import { useI18n } from "vue-i18n";
import { IUserShared } from "@shared/types/User";

const props = defineProps<{
  user: IUserShared;
}>();

const { t } = useI18n();
const chartCanvas = ref<HTMLCanvasElement | null>(null);
const chartInstance = ref<Chart | null>(null);
const selectedSportIndex = ref(0);

const hasStats = () => props.user.sportsElo && props.user.sportsElo.length > 0;

const renderChart = () => {
  if (!chartCanvas.value || !hasStats()) return;

  const stat = props.user.sportsElo![selectedSportIndex.value];
  if (!stat) return;

  if (chartInstance.value) chartInstance.value.destroy();

  const labels: string[] = [];
  const data: number[] = [];

  if (stat.history && stat.history.length > 0) {
    const sorted = [...stat.history].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    sorted.forEach((h) => {
      labels.push(new Date(h.date).toLocaleDateString());
      data.push(h.elo);
    });
  } else {
    labels.push("Start");
    data.push(stat.elo);
  }

  chartInstance.value = new Chart(chartCanvas.value, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "ELO",
          data,
          borderColor: "#fd7e14",
          backgroundColor: "rgba(253, 126, 20, 0.1)",
          tension: 0.3,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
    },
  });
};

watch(
  () => props.user,
  () => {
    selectedSportIndex.value = 0;
    nextTick(renderChart);
  },
  { deep: true },
);

watch(selectedSportIndex, renderChart);

onMounted(renderChart);
</script>

<template>
  <div v-if="hasStats()" class="mb-5">
    <h5 class="fw-bold mb-3 text-center text-lg-start">
      {{ t("profile.elo_stats") }}
    </h5>

    <select v-model="selectedSportIndex" class="form-select mb-3">
      <option v-for="(stat, idx) in user.sportsElo" :key="idx" :value="idx">
        {{ stat.sport?.name || "Unknown" }}
      </option>
    </select>

    <div class="elo-chart-container">
      <canvas ref="chartCanvas"></canvas>
    </div>
  </div>
</template>

<style scoped src="@/assets/css/profile.css"></style>
