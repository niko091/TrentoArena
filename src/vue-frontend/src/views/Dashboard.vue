
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import GameCard from '../components/GameCard.vue';
import GamePopup from '../components/GamePopup.vue';
import { useRouter } from 'vue-router';

// Define filtered games logic...
const router = useRouter();
const games = ref<any[]>([]);
const userGamesCount = ref(0);
const currentUser = ref<any>(null);
const selectedGame = ref<any>(null);
const filter = ref('all');
const loading = ref(true);

const { t } = useI18n();

const filterLabel = computed(() => {
    if (filter.value === 'active') return t('dashboard.filter_active');
    if (filter.value === 'finished') return t('dashboard.filter_finished');
    return t('dashboard.filter_all');
});

const emptyMessage = computed(() => {
    if (filter.value === 'active') return t('dashboard.empty_active');
    if (filter.value === 'finished') return t('dashboard.empty_finished');
    return t('dashboard.empty_all');
});

const loadDashboardData = async () => {
    loading.value = true;
    try {
        const authRes = await fetch('/auth/current_user');
        if (!authRes.ok) {
            router.push('/login');
            return;
        }
        const contentType = authRes.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            currentUser.value = await authRes.json();
        } else {
             console.error('Expected JSON for auth, got:', contentType);
             return;
        }

        // Fetch user's games count
        try {
            const userGamesRes = await fetch(`/api/games?participantId=${currentUser.value._id}`);
            if (userGamesRes.ok) {
                const contentType = userGamesRes.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const userGames = await userGamesRes.json();
                    userGamesCount.value = userGames.length;
                } else {
                    console.error('Expected JSON for user games, got:', contentType);
                }
            }
        } catch (e) {
            console.error("Error loading user games:", e);
        }

        const gamesRes = await fetch('/api/games');
        if (gamesRes.ok) {
            const contentType = gamesRes.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                games.value = await gamesRes.json();
            } else {
                console.error('Expected JSON for games, got:', contentType);
                const text = await gamesRes.text();
                if (text.includes('<!DOCTYPE html>')) {
                    console.error('Received HTML (likely SPA fallback). Is the backend running?');
                }
            }
        }
    } catch (error) {
        console.error("Error loading dashboard data:", error);
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    loadDashboardData();
});

const filteredGames = computed(() => {
    // ... same logic ...
  const isFull = (g: any) => (g.participants?.length || 0) >= (g.maxParticipants || 100);
  
  if (filter.value === 'active') {
    return games.value.filter(g => !g.isFinished && !isFull(g));
  } else if (filter.value === 'finished') {
    return games.value.filter(g => g.isFinished);
  }
  return games.value.filter(g => g.isFinished || !isFull(g));
});

function switchFilter(newFilter: string) {
    filter.value = newFilter;
}

function openGame(game: any) {
  selectedGame.value = game;
}
</script>

<template>
  <div class="container py-5">
        <!-- Game Popup -->
        <GamePopup 
            v-if="selectedGame" 
            :game="selectedGame" 
            :current-user="currentUser" 
            @close="selectedGame = null" 
            @refresh="loadDashboardData" 
        />

        <div class="row g-5">

            <div class="col-lg-4">
                <div class="sticky-widget">
                    <div class="card user-card-pro shadow-sm border-0 mx-auto">
                        <div class="card-body text-center pt-0">
                            <div class="avatar-container">
                                <img :src="currentUser?.profilePicture || '/images/utenteDefault.png'" alt="Avatar"
                                    class="img-fluid rounded-circle avatar-pro">
                            </div>

                            <h3 class="fw-bold mt-4 mb-1">{{ currentUser ? currentUser.username : t('common.loading') }}</h3>
                            <p class="text-muted small mb-4">{{ t('dashboard.player_role') }}</p>

                            <div class="row mt-4 px-3" v-if="currentUser">
                                <div class="col-6 border-end">
                                    <h5 class="fw-bold mb-0">{{ userGamesCount }}</h5> <!-- Correct user games count -->
                                    <small class="text-uppercase text-muted fw-semibold" style="font-size: 0.8rem;">{{ t('dashboard.games') }}</small>
                                </div>
                                <div class="col-6">
                                    <h5 class="fw-bold mb-0">{{ currentUser.friends?.length || 0 }}</h5>
                                    <small class="text-uppercase text-muted fw-semibold"
                                        style="font-size: 0.8rem;">{{ t('common.friends') }}</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-lg-8">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h3 class="fw-bold mb-0">{{ t('dashboard.recent_activity') }}</h3>

                    <div class="dropdown">
                        <button
                            class="btn btn-outline-secondary btn-sm bg-white rounded-pill px-3 shadow-sm dropdown-toggle d-flex align-items-center gap-2"
                            type="button" data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="bi bi-funnel"></i>
                            <span>{{ filterLabel }}</span>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end border-0 shadow">
                            <li><a class="dropdown-item" :class="{active: filter === 'all'}" href="#" @click.prevent="switchFilter('all')">{{ t('dashboard.filter_all') }}</a></li>
                            <li><a class="dropdown-item" :class="{active: filter === 'active'}" href="#" @click.prevent="switchFilter('active')">{{ t('dashboard.filter_active') }}</a></li>
                            <li><a class="dropdown-item" :class="{active: filter === 'finished'}" href="#" @click.prevent="switchFilter('finished')">{{ t('dashboard.filter_finished') }}</a></li>
                        </ul>
                    </div>
                </div>

                <div class="d-flex flex-column gap-3">
                    <div v-if="loading" class="text-center py-5 text-muted">{{ t('dashboard.feed_loading') }}</div>
                    
                    <GameCard 
                        v-for="game in filteredGames" 
                        :key="game._id" 
                        :game="game" 
                        @click="openGame" 
                    />
                    
                    <div v-if="!loading && filteredGames.length === 0" class="text-center py-5 text-muted">
                        {{ emptyMessage }}
                    </div>
                </div>
            </div>

        </div>
    </div>
</template>

<style scoped src="@/assets/css/dashboard.css"></style>
