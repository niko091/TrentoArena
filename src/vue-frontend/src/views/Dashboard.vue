<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import GameCard from "../components/GameCard.vue";
import GamePopup from "../components/GamePopup.vue";
import { useRouter } from "vue-router";

const router = useRouter();
const games = ref<any[]>([]);
const userGamesCount = ref(0);
const currentUser = ref<any>(null);
const selectedGame = ref<any>(null);
const filter = ref("all");
const loading = ref(true);
const isDropdownOpen = ref(false);

const { t } = useI18n();

const filterLabel = computed(() => {
  if (filter.value === "active") return t("dashboard.filter_active");
  if (filter.value === "finished") return t("dashboard.filter_finished");
  return t("dashboard.filter_all");
});

const emptyMessage = computed(() => {
  if (filter.value === "active") return t("dashboard.empty_active");
  if (filter.value === "finished") return t("dashboard.empty_finished");
  return t("dashboard.empty_all");
});

const loadDashboardData = async () => {
  loading.value = true;
  try {
    let gamesUrl = "/api/games?limit=30&sort=-1";
    if (filter.value === "active") gamesUrl += "&isFinished=false";
    else if (filter.value === "finished") gamesUrl += "&isFinished=true";

    const fetchPromises: Promise<any>[] = [
      fetch("/auth/current_user"),
      fetch(gamesUrl),
    ];

    if (currentUser.value) {
      fetchPromises.push(
        fetch(`/api/games?participantId=${currentUser.value._id}&count=true`),
      );
    }

    const responses = await Promise.all(fetchPromises);
    const authRes = responses[0];
    const gamesRes = responses[1];
    let countRes = responses[2];

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
      const gamesContentType = gamesRes.headers.get("content-type");
      if (gamesContentType && gamesContentType.includes("application/json")) {
        games.value = await gamesRes.json();
      }
    }

    if (currentUser.value && !countRes) {
      countRes = await fetch(
        `/api/games?participantId=${currentUser.value._id}&count=true`,
      );
    }

    if (countRes && countRes.ok) {
      const countData = await countRes.json();
      userGamesCount.value = countData.count;
    }
  } catch (error) {
    console.error("Error loading dashboard data:", error);
  } finally {
    loading.value = false;
  }
};

function handleOutsideClick(event: MouseEvent) {
  const dropdown = document.querySelector(".dropdown");
  if (dropdown && !dropdown.contains(event.target as Node)) {
    isDropdownOpen.value = false;
  }
}

onMounted(() => {
  loadDashboardData();
  window.addEventListener("click", handleOutsideClick);
});

onUnmounted(() => {
  window.removeEventListener("click", handleOutsideClick);
});

const filteredGames = computed(() => {
  const isFull = (g: any) =>
    (g.participants?.length || 0) >= (g.maxParticipants || 100);

  if (filter.value === "active") {
    return games.value.filter((g) => !isFull(g));
  } else if (filter.value === "finished") {
    return games.value;
  }
  return games.value.filter((g) => g.isFinished || !isFull(g));
});

watch(filter, () => {
  loadDashboardData();
});

function switchFilter(newFilter: string) {
  filter.value = newFilter;
  isDropdownOpen.value = false;
}

function toggleDropdown() {
  isDropdownOpen.value = !isDropdownOpen.value;
}

function openGame(game: any) {
  selectedGame.value = game;
}
</script>

<template>
  <div class="container py-5">
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
          <div class="user-profile-box">
            <div class="avatar-wrapper">
              <img
                :src="
                  currentUser?.profilePicture || '/images/utenteDefault.png'
                "
                :alt="t('common.avatar')"
                class="wireframe-avatar"
              />
            </div>

            <h3 class="user-name">
              {{ currentUser ? currentUser.username : t("common.loading") }}
            </h3>
            <p class="user-role">{{ t("dashboard.player_role") }}</p>

            <div class="stats-container" v-if="currentUser">
              <div class="stat-box">
                <span class="stat-number">{{ userGamesCount }}</span>
                <span class="stat-label">{{ t("dashboard.games") }}</span>
              </div>

              <div class="stat-box">
                <span class="stat-number">{{
                  currentUser.friends?.length || 0
                }}</span>
                <span class="stat-label">{{ t("common.friends") }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-8">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h3 class="fw-bold mb-0">{{ t("dashboard.recent_activity") }}</h3>

          <div class="dropdown">
            <button
              class="btn btn-outline-secondary btn-sm rounded-pill px-3 shadow-sm dropdown-toggle d-flex align-items-center gap-2"
              type="button"
              @click.stop="toggleDropdown"
              :aria-expanded="isDropdownOpen"
            >
              <i class="bi bi-funnel"></i>
              <span>{{ filterLabel }}</span>
            </button>
            <ul
              class="dropdown-menu dropdown-menu-end border-0 shadow custom-dropdown-pos"
              :class="{ show: isDropdownOpen }"
            >
              <li>
                <a
                  class="dropdown-item"
                  :class="{ active: filter === 'all' }"
                  href="#"
                  @click.prevent="switchFilter('all')"
                  >{{ t("dashboard.filter_all") }}</a
                >
              </li>
              <li>
                <a
                  class="dropdown-item"
                  :class="{ active: filter === 'active' }"
                  href="#"
                  @click.prevent="switchFilter('active')"
                  >{{ t("dashboard.filter_active") }}</a
                >
              </li>
              <li>
                <a
                  class="dropdown-item"
                  :class="{ active: filter === 'finished' }"
                  href="#"
                  @click.prevent="switchFilter('finished')"
                  >{{ t("dashboard.filter_finished") }}</a
                >
              </li>
            </ul>
          </div>
        </div>

        <div class="d-flex flex-column gap-3">
          <div v-if="loading" class="text-center py-5 text-muted">
            {{ t("dashboard.feed_loading") }}
          </div>

          <div
            v-for="game in filteredGames"
            :key="game._id"
            class="wireframe-card activity-card"
            @click="openGame(game)"
          >
            <GameCard :game="game" class="border-0 bg-transparent" />
          </div>

          <div
            v-if="!loading && filteredGames.length === 0"
            class="text-center py-5 text-muted"
          >
            {{ emptyMessage }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style src="@/assets/css/dashboard.css"></style>
