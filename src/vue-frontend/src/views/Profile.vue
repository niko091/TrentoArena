<script setup lang="ts">
import { ref, onMounted, watch, nextTick, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import Chart from "chart.js/auto";
import * as bootstrap from "bootstrap";
import { IUserShared as User } from "@shared/types/User";
import { ProfileAPI } from "../api/profile";
import GamePopup from "../components/GamePopup.vue";

const route = useRoute();
const router = useRouter();
const currentUser = ref<User | null>(null);
const profileUser = ref<User | null>(null);
const loading = ref(true);
const error = ref("");
const { t } = useI18n();

const friends = ref<any[]>([]);
const upcomingGames = ref<any[]>([]);
const pastGames = ref<any[]>([]);
const eloChartInstance = ref<Chart | null>(null);
const selectedSportIndex = ref<number | null>(null);

const selectedGame = ref<any | null>(null);

const isOwnProfile = computed(() => {
  if (!currentUser.value || !profileUser.value) return false;
  return currentUser.value._id === profileUser.value._id;
});

const calendarDots = computed(() => {
  const matchCounts: Record<string, number> = {};
  pastGames.value.forEach((g) => {
    const d = new Date(g.date).toISOString().split("T")[0];
    matchCounts[d] = (matchCounts[d] || 0) + 1;
  });

  const today = new Date();
  const currentDayOfWeek = today.getDay(); // 0 = Sunday

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

    let size, color;
    if (count === 0) {
      size = 6;
      color = "#e9ecef";
    } else {
      size = Math.min(12 + (count - 1) * 4, 24);
      color = "#fd7e14";
    }

    dots.push({
      date: d.toLocaleDateString("it-IT"),
      count,
      size,
      color,
    });
  }
  return dots;
});

let reportModal: bootstrap.Modal | null = null;
const reportMotivation = ref("");

onMounted(async () => {
  await init();
});

watch(loading, (isLoading) => {
  if (!isLoading && profileUser.value) {
    nextTick(() => {
      renderEloChart();

      const modalEl = document.getElementById("reportModal");
      if (modalEl) {
        reportModal = new bootstrap.Modal(modalEl);
      }
    });
  }
});

watch(
  () => route.params,
  async () => {
    await init();
  },
);

async function init() {
  loading.value = true;
  error.value = "";

  try {
    currentUser.value = await ProfileAPI.getCurrentUser();
    if (!currentUser.value) {
      window.location.href = "/login";
      return;
    }

    const routeUsername = route.params.username as string;
    const routeId = route.query.id as string;

    if (
      routeUsername &&
      routeUsername.toLowerCase() !== currentUser.value.username.toLowerCase()
    ) {
      const publicInfo = await ProfileAPI.getUserByUsername(routeUsername);
      profileUser.value = await ProfileAPI.getUserById(publicInfo._id);
    } else if (routeId && routeId !== currentUser.value._id) {
      profileUser.value = await ProfileAPI.getUserById(routeId);
    } else {
      profileUser.value = await ProfileAPI.getUserById(currentUser.value._id);
    }

    if (!profileUser.value) throw new Error("User not found");

    friends.value = profileUser.value.friends || [];

    upcomingGames.value = await ProfileAPI.getGames(
      profileUser.value._id,
      false,
    );
    pastGames.value = await ProfileAPI.getGames(profileUser.value._id, true);

    upcomingGames.value.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    pastGames.value.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  } catch (e) {
    console.error(e);
    error.value = "Errore nel caricamento del profilo.";
  } finally {
    loading.value = false;
  }
}

// --- Actions ---

function openGameDetails(game: any) {
  selectedGame.value = game;
}

// Friend Actions
async function handleSendRequest() {
  if (!profileUser.value || !currentUser.value) return;
  try {
    await ProfileAPI.sendFriendRequest(
      profileUser.value._id,
      currentUser.value._id,
    );
    window.location.reload();
  } catch (e) {
    alert("Errore generico");
  }
}

async function handleAcceptRequest() {
  if (!profileUser.value || !currentUser.value) return;
  try {
    await ProfileAPI.acceptFriendRequest(
      profileUser.value._id,
      currentUser.value._id,
    );
    window.location.reload();
  } catch (e) {
    alert("Errore generico");
  }
}

async function handleRemoveFriend() {
  if (!profileUser.value || !currentUser.value) return;
  if (confirm("Sei sicuro di voler rimuovere questo amico?")) {
    try {
      await ProfileAPI.removeFriend(
        profileUser.value._id,
        currentUser.value._id,
      );
      window.location.reload();
    } catch (e) {
      alert("Errore generico");
    }
  }
}

// Image Actions
async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0] && profileUser.value) {
    try {
      await ProfileAPI.uploadProfilePicture(
        profileUser.value._id,
        input.files[0],
      );
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
  }
}

async function handleRemovePic() {
  if (!profileUser.value) return;
  if (!confirm("Rimuovere la foto profilo?")) return;
  try {
    await ProfileAPI.deleteProfilePicture(profileUser.value._id);
    window.location.reload();
  } catch (e) {
    console.error(e);
  }
}

// Report
function openReportModal() {
  reportMotivation.value = "";
  reportModal?.show();
}

async function submitReport() {
  if (!reportMotivation.value) return alert("Inserisci una motivazione");
  if (!currentUser.value || !profileUser.value) return;

  try {
    await ProfileAPI.sendReport(
      currentUser.value._id,
      profileUser.value._id,
      reportMotivation.value,
    );
    alert("Segnalazione inviata");
    reportModal?.hide();
  } catch (e) {
    console.error(e);
  }
}

// Navigation
function goToUser(username: string) {
  router.push(`/user/${username}`);
}

// --- Helpers ---
const friendStatus = computed(() => {
  if (!currentUser.value || !profileUser.value) return "none";

  // Check if friends
  const friends = profileUser.value.friends || []; // these are objects or IDs
  const isFriend = friends.some(
    (f: any) => (f._id || f) === currentUser.value?._id,
  );
  if (isFriend) return "friend";

  // Check requests
  const theirReqs = profileUser.value.friendRequests || [];
  const myReqs = currentUser.value.friendRequests || [];

  const sent = theirReqs.some(
    (r: any) => (r._id || r) === currentUser.value?._id,
  );
  const received = myReqs.some(
    (r: any) => (r._id || r) === profileUser.value?._id,
  );

  if (sent) return "sent";
  if (received) return "received";

  return "none";
});

// Charts
function renderEloChart() {
  if (!profileUser.value?.sportsElo || profileUser.value.sportsElo.length === 0)
    return;

  if (selectedSportIndex.value === null) selectedSportIndex.value = 0;

  updateChart();
}

function updateChart() {
  const canvas = document.getElementById("eloChart") as HTMLCanvasElement;
  if (!canvas || selectedSportIndex.value === null || !profileUser.value)
    return;

  const stat = profileUser.value.sportsElo[selectedSportIndex.value];
  if (!stat) return;

  if (eloChartInstance.value) eloChartInstance.value.destroy();

  const labels: string[] = [];
  const data: number[] = [];

  if (stat.history && stat.history.length > 0) {
    const sortedHistory = [...stat.history].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    sortedHistory.forEach((h) => {
      labels.push(new Date(h.date).toLocaleDateString());
      data.push(h.elo);
    });
  } else {
    labels.push("Start");
    data.push(stat.elo);
  }

  eloChartInstance.value = new Chart(canvas, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "ELO",
          data: data,
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
}
</script>

<template>
  <div class="container mt-5" v-if="!loading && profileUser">
    <div
      class="d-flex flex-column flex-lg-row align-items-start justify-content-center p-4 gap-5"
    >
      <div class="flex-shrink-0 text-center">
        <div style="position: relative; display: inline-block">
          <img
            :src="profileUser.profilePicture || '/images/utenteDefault.png'"
            alt="Profile Picture"
            class="rounded-circle"
            style="
              width: 250px;
              height: 250px;
              object-fit: cover;
              box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
            "
          />

          <div v-if="isOwnProfile" id="editControls">
            <label
              for="fileInput"
              class="btn btn-primary rounded-circle shadow"
              style="
                position: absolute;
                bottom: 10px;
                right: 10px;
                width: 40px;
                height: 40px;
                padding: 4px 0;
                font-size: 1.2rem;
                cursor: pointer;
              "
              >+</label
            >
            <button
              v-if="profileUser.profilePicture"
              @click="handleRemovePic"
              class="btn btn-danger rounded-circle shadow"
              style="
                position: absolute;
                bottom: 10px;
                left: 10px;
                width: 40px;
                height: 40px;
                padding: 4px 0;
                font-size: 1.2rem;
              "
            >
              x
            </button>
            <input
              type="file"
              id="fileInput"
              style="display: none"
              accept="image/*"
              @change="handleFileChange"
            />
          </div>
        </div>

        <h1 class="fw-bold mt-4 mb-2 display-6">
          {{ profileUser.username }}
          <span
            v-if="profileUser.isBanned"
            class="badge bg-danger fs-6 align-middle ms-2"
            >BANNED</span
          >
        </h1>
        <p v-if="isOwnProfile" class="text-muted mb-4">
          {{ profileUser.email }}
        </p>

        <div
          v-if="!isOwnProfile"
          id="publicActions"
          class="d-flex justify-content-center gap-2 mt-3"
        >
          <button
            v-if="friendStatus === 'none'"
            class="btn btn-primary"
            @click="handleSendRequest"
          >
            {{ t("profile.add_friend") }}
          </button>
          <button
            v-else-if="friendStatus === 'sent'"
            class="btn btn-secondary"
            disabled
          >
            {{ t("profile.request_sent") }}
          </button>
          <button
            v-else-if="friendStatus === 'received'"
            class="btn btn-success"
            @click="handleAcceptRequest"
          >
            {{ t("profile.accept_request") }}
          </button>
          <button
            v-else-if="friendStatus === 'friend'"
            class="btn btn-danger"
            @click="handleRemoveFriend"
          >
            {{ t("profile.remove_friend") }}
          </button>

          <button
            class="btn btn-outline-danger btn-sm"
            @click="openReportModal"
          >
            {{ t("profile.report_user") }}
          </button>
        </div>

        <div v-if="isOwnProfile" id="privateActions" class="mt-3">
          <a
            href="/auth/logout"
            class="btn btn-outline-danger btn-lg px-5 w-100"
            >{{ t("profile.logout") }}</a
          >
        </div>
      </div>

      <div class="flex-grow-1">
        <div
          v-if="profileUser.sportsElo && profileUser.sportsElo.length > 0"
          id="eloStatsContainer"
          class="mb-5"
        >
          <h5 class="fw-bold mb-3">{{ t("profile.elo_stats") }}</h5>
          <select
            v-model="selectedSportIndex"
            @change="updateChart"
            class="form-select mb-3"
          >
            <option
              v-for="(stat, idx) in profileUser.sportsElo"
              :key="idx"
              :value="idx"
            >
              {{ stat.sport?.name || "Unknown" }}
            </option>
          </select>
          <div
            id="eloDisplay"
            style="
              position: relative;
              height: 400px;
              width: 100%;
              border: none !important;
              margin: 0;
              padding: 0;
            "
          >
            <canvas id="eloChart"></canvas>
          </div>
        </div>
      </div>

      <div class="flex-shrink-0" style="width: 300px">
        <h4 class="fw-bold mb-3 border-bottom pb-2">
          {{ t("common.friends") }}
        </h4>
        <div
          id="friendsList"
          class="d-flex flex-wrap gap-2 justify-content-start mb-5"
        >
          <span v-if="friends.length === 0" class="text-muted">{{
            t("profile.no_friends")
          }}</span>
          <img
            v-for="friend in friends"
            :key="friend._id || friend"
            :src="friend.profilePicture || '/images/utenteDefault.png'"
            :title="friend.username"
            @click="goToUser(friend.username)"
            class="rounded-circle shadow-sm border me-2 mb-2"
            style="
              width: 50px;
              height: 50px;
              cursor: pointer;
              object-fit: cover;
            "
          />
        </div>

        <h4 class="fw-bold mb-3 border-bottom pb-2 mt-5">
          {{ t("profile.calendar") }}
        </h4>
        <div class="card shadow-sm border-0">
          <div class="card-body p-3">
            <div
              class="d-flex justify-content-between mb-3 text-muted fw-bold small text-center px-1"
            >
              <span>M</span><span>T</span><span>W</span><span>T</span
              ><span>F</span><span>S</span><span>S</span>
            </div>
            <div
              id="dotsContainer"
              style="
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                gap: 8px;
                justify-items: center;
                align-items: center;
              "
            >
              <div
                v-for="(dot, i) in calendarDots"
                :key="i"
                :style="{
                  width: dot.size + 'px',
                  height: dot.size + 'px',
                  backgroundColor: dot.color,
                  borderRadius: '50%',
                  transition: 'all 0.2s ease',
                }"
                :title="
                  dot.count > 0 ? `${dot.count} games on ${dot.date}` : dot.date
                "
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-5">
      <h2 class="fw-bold mb-4 border-bottom pb-2">
        {{ t("profile.upcoming_games") }}
      </h2>
      <div class="row g-3">
        <div v-if="upcomingGames.length === 0" class="col-12">
          <span class="text-muted">{{ t("profile.no_upcoming_games") }}</span>
        </div>
        <div
          v-for="game in upcomingGames"
          :key="game._id"
          class="col-md-6 col-lg-4"
        >
          <div
            class="card h-100 shadow-sm"
            style="cursor: pointer"
            @click="openGameDetails(game)"
          >
            <div class="card-body">
              <div class="d-flex justify-content-between mb-2">
                <h5 class="card-title fw-bold text-primary">
                  {{ game.sport?.name || "Sport" }}
                </h5>
                <span
                  class="badge"
                  :class="{
                    'bg-danger':
                      game.participants.length >= (game.maxParticipants || 10),
                    'bg-warning text-dark':
                      game.participants.length / (game.maxParticipants || 10) >=
                        0.75 &&
                      game.participants.length < (game.maxParticipants || 10),
                    'bg-success':
                      game.participants.length / (game.maxParticipants || 10) <
                      0.75,
                  }"
                >
                  <i class="bi bi-people-fill me-1"></i
                  >{{ game.participants.length }}/{{
                    game.maxParticipants || 10
                  }}
                </span>
              </div>
              <h6 class="text-muted">{{ game.place?.name || "Place" }}</h6>
              <p class="card-text mb-0">
                <small
                  >📅 {{ new Date(game.date).toLocaleDateString("it-IT") }} at
                  {{
                    new Date(game.date).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  }}</small
                >
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-5 mb-5">
      <h2 class="fw-bold mb-4 border-bottom pb-2">
        {{ t("profile.past_games") }}
      </h2>
      <div class="row g-3">
        <div v-if="pastGames.length === 0" class="col-12">
          <span class="text-muted">{{ t("profile.no_past_games") }}</span>
        </div>
        <div
          v-for="game in pastGames"
          :key="game._id"
          class="col-md-6 col-lg-4"
        >
          <div
            class="card h-100 shadow-sm opacity-75"
            :class="{
              'border-success border-2': game.participants.some(
                (p: any) =>
                  (p.user._id || p.user) === profileUser?._id && p.winner,
              ),
              'border-danger border-2': !game.participants.some(
                (p: any) =>
                  (p.user._id || p.user) === profileUser?._id && p.winner,
              ),
            }"
            style="cursor: pointer"
            @click="openGameDetails(game)"
          >
            <div class="card-body">
              <div class="d-flex justify-content-between mb-2">
                <h5 class="card-title fw-bold text-primary">
                  {{ game.sport?.name || "Sport" }}
                </h5>
                <span
                  v-if="
                    game.participants.some(
                      (p: any) =>
                        (p.user._id || p.user) === profileUser?._id && p.winner,
                    )
                  "
                  class="badge bg-success"
                  >{{ t("profile.won") }}</span
                >
                <span v-else class="badge bg-secondary">{{
                  t("profile.finished")
                }}</span>
              </div>
              <h6 class="text-muted">{{ game.place?.name || "Place" }}</h6>
              <p class="card-text mb-0">
                <small
                  >📅 {{ new Date(game.date).toLocaleDateString("it-IT") }} at
                  {{
                    new Date(game.date).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  }}</small
                >
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else-if="loading" class="text-center mt-5">
    <div class="spinner-border" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>
  </div>

  <div class="modal fade" id="reportModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">{{ t("profile.report_modal_title") }}</h5>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
          ></button>
        </div>
        <div class="modal-body">
          <textarea
            v-model="reportMotivation"
            class="form-control"
            rows="3"
            :placeholder="t('profile.report_reason')"
          ></textarea>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-danger" @click="submitReport">
            {{ t("profile.report_submit") }}
          </button>
        </div>
      </div>
    </div>
  </div>

  <GamePopup
    v-if="selectedGame"
    :game="selectedGame"
    :currentUser="currentUser"
    @close="selectedGame = null"
    @refresh="init"
  />
</template>
