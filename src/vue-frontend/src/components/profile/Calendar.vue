<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  games: any[]; 
}>();

const { t } = useI18n();

const calendarDots = computed(() => {
  const matchCounts: Record<string, number> = {};
  
  if (!props.games) return [];

  props.games.forEach((g) => {
    const d = new Date(g.date).toISOString().split("T")[0];
    matchCounts[d] = (matchCounts[d] || 0) + 1;
  });

  const today = new Date();
  const currentDayOfWeek = today.getDay(); 
  const distanceToSunday = currentDayOfWeek === 0 ? 0 : 7 - currentDayOfWeek;
  
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + distanceToSunday);

  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 27); 

  const dots = [];
  for (let i = 0; i < 28; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    const count = matchCounts[dateStr] || 0;

    let size = count === 0 ? 6 : Math.min(12 + (count - 1) * 4, 24);
    let color = count === 0 ? "#e9ecef" : "#fd7e14";

    dots.push({
      date: d.toLocaleDateString("it-IT"),
      count,
      size,
      color,
    });
  }
  return dots;
});
</script>

<template>
  <div class="mt-5">
    <h4 class="fw-bold mb-3 border-bottom pb-2 text-center text-lg-start">
      {{ t("profile.calendar") }}
    </h4>
    <div class="card wireframe-card w-100 p-3">
      <div class="d-flex justify-content-between mb-3 text-muted fw-bold small text-center px-1">
        <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
      </div>
      <div class="calendar-grid">
        <div
          v-for="(dot, i) in calendarDots"
          :key="i"
          class="calendar-dot"
          :style="{
            width: dot.size + 'px',
            height: dot.size + 'px',
            backgroundColor: dot.color,
          }"
          :title="dot.count > 0 ? `${dot.count} games on ${dot.date}` : dot.date"
        ></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wireframe-card {
  background: #fff;
  border: 2px solid #000;
  border-radius: 12px;
}
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  justify-items: center;
  align-items: center;
}
.calendar-dot {
  border-radius: 50%;
  transition: all 0.2s ease;
}
</style>