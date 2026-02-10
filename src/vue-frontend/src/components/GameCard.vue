<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  game: any
}>();

const emit = defineEmits(['click']);

const displayImage = computed(() => {
    if (!props.game) return '/images/utenteDefault.png';

    if (props.game.isFinished && props.game.participants) {
        const winner = props.game.participants.find((p: any) => p.winner);
        if (winner?.user?.profilePicture) {
            return winner.user.profilePicture;
        }
    }

    if (props.game.creator?.profilePicture) {
        return props.game.creator.profilePicture;
    }

    return '/images/utenteDefault.png';
});

const t = (key: string, params: Record<string, string> = {}) => {
    if ((window as any).i18n) return (window as any).i18n.t(key, params);
    
    let text = key;
    const defaults: Record<string, string> = {
        'dashboard.game_won': '{winners} ha vinto una partita a {sport}',
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

    return { text, timeAgo };
  } else {
    return {
      text: t('dashboard.game_organized', { 
          creator: `<strong>${creatorName}</strong>`, 
          sport: `<strong>${sportName}</strong>`, 
          place: `<strong>${placeName}</strong>` 
      }),
      timeAgo: getTimeAgo(new Date(game.date))
    };
  }
});

function getTimeAgo(date: Date) {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 0) return t('dashboard.time_future');
    const intervals: {[key: string]: number} = { y: 31536000, m: 2592000, d: 86400, h: 3600, min: 60 };
    for (const [unit, value] of Object.entries(intervals)) {
        const count = Math.floor(seconds / value);
        if (count >= 1) return `${count} ${t(`dashboard.time_units.${unit}`)} ${t('dashboard.time_ago_suffix')}`;
    }
    return t('dashboard.time_just_now');
}
</script>

<template>
  <div class="card h-100 border-0 bg-transparent" @click="$emit('click', game)">
    
    <div class="card-body d-flex align-items-center gap-3 py-3 px-3">
      
      <div class="flex-shrink-0">
         <img :src="displayImage" alt="User" class="activity-list-avatar">
      </div>

      <div class="event-text flex-grow-1">
        <span class="text-body" style="font-size: 0.95rem; line-height: 1.4;" v-html="eventData.text"></span>
        <div class="text-muted small mt-1">{{ eventData.timeAgo }}</div>
      </div>

      <div class="text-muted ms-auto">
        <i class="bi bi-chevron-right"></i>
      </div>

    </div>
  </div>
</template>

<style src="@/assets/css/dashboard.css"></style>