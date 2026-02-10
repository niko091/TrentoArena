
<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  game: any
}>();

const emit = defineEmits(['click']);

// I18n helper
const t = (key: string, params: Record<string, string> = {}) => {
    if ((window as any).i18n) return (window as any).i18n.t(key, params);
    
    let text = key;
    const defaults: Record<string, string> = {
        'dashboard.game_won': 'Vinto da {winners} a {sport}',
        'dashboard.game_ended': 'Partita di {sport} terminata',
        'dashboard.game_organized': '{creator} ha organizzato una partita di {sport} a {place}',
        'dashboard.time_future': 'Nel futuro',
        'dashboard.time_units.y': 'anni',
        'dashboard.time_units.m': 'mesi',
        'dashboard.time_units.d': 'giorni',
        'dashboard.time_units.h': 'ore',
        'dashboard.time_units.min': 'minuti',
        'dashboard.time_ago_suffix': 'fa',
        'dashboard.time_just_now': 'Appena adesso'
    };
    
    if (defaults[key]) text = defaults[key];

    for (const [param, value] of Object.entries(params)) {
        text = text.replace(`{${param}}`, value);
    }
    return text;
};

const eventData = computed(() => {
  const game = props.game;
  const creatorName = game.creator?.username || "Sconosciuto";
  const sportName = game.sport?.name || "Sport";
  const placeName = game.place?.name || "un luogo";
  
  const timeAgo = getTimeAgo(new Date(game.date));

  if (game.isFinished) {
    const winners = (game.participants || [])
      .filter((p: any) => p.winner)
      .map((p: any) => p.user.username);

    const text = winners.length > 0
      ? t('dashboard.game_won', { winners: `<strong>${winners.join(', ')}</strong>`, sport: `<strong>${sportName}</strong>` })
      : t('dashboard.game_ended', { sport: `<strong>${sportName}</strong>` });

      // Simplified mapping to match original classes
    return { text, icon: "bi-trophy-fill", color: "bg-warning-subtle text-warning", timeAgo };
  } else {
    return {
      text: t('dashboard.game_organized', { 
          creator: `<strong>${creatorName}</strong>`, 
          sport: `<strong>${sportName}</strong>`, 
          place: `<strong>${placeName}</strong>` 
      }),
      icon: "bi-calendar-plus",
      color: "bg-primary-subtle text-primary", 
      timeAgo: new Date(game.date).toLocaleDateString() + ' ' + new Date(game.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }
});

function getTimeAgo(date: Date) {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 0) return t('dashboard.time_future');

    const intervals: {[key: string]: number} = { y: 31536000, m: 2592000, d: 86400, h: 3600, min: 60 };
    for (const [unit, value] of Object.entries(intervals)) {
        const count = Math.floor(seconds / value);
        if (count >= 1) {
            const unitLabel = t(`dashboard.time_units.${unit}`);
            const suffix = t('dashboard.time_ago_suffix');
            return `${count} ${unitLabel} ${suffix}`;
        }
    }
    return t('dashboard.time_just_now');
}
</script>

<template>
  <div class="card event-card-pro shadow-sm border-0 mb-0" @click="$emit('click', game)">
    <div class="card-body d-flex align-items-center gap-3 py-4">
      <div class="event-icon-wrapper rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" :class="eventData.color" style="width: 50px; height: 50px;">
        <i class="bi" :class="eventData.icon + ' fs-4'"></i>
      </div>
      <div class="event-text flex-grow-1">
        <span class="fs-5 text-dark" v-html="eventData.text"></span>
        <div class="text-muted small mt-1">{{ eventData.timeAgo }}</div>
      </div>
      <div class="text-muted ms-auto">
        <i class="bi bi-chevron-right"></i>
      </div>
    </div>
  </div>
</template>

<style scoped src="@/assets/css/dashboard.css"></style>
