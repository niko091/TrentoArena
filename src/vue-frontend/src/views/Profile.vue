<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { IUserShared as User } from "@shared/types/User";
import { ProfileAPI } from "../api/profile";
import GamePopup from "../components/GamePopup.vue";
import ReportPopup from "../components/profile/ReportPopup.vue";
import EloChart from "../components/profile/EloChart.vue";
import Calendar from "../components/profile/Calendar.vue";
import GameList from "../components/profile/GameList.vue";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const currentUser = ref<User | null>(null);
const profileUser = ref<User | null>(null);
const loading = ref(true);
const friends = ref<any[]>([]);
const upcomingGames = ref<any[]>([]);
const pastGames = ref<any[]>([]);
const selectedGame = ref<any | null>(null);
const showReportModal = ref(false);

const isOwnProfile = computed(
  () => currentUser.value?._id === profileUser.value?._id,
);

const friendStatus = computed(() => {
  if (!currentUser.value || !profileUser.value) return "none";
  const friends = profileUser.value.friends || [];
  if (friends.some((f: any) => (f._id || f) === currentUser.value?._id))
    return "friend";

  const theirReqs = profileUser.value.friendRequests || [];
  if (theirReqs.some((r: any) => (r._id || r) === currentUser.value?._id))
    return "sent";

  const myReqs = currentUser.value.friendRequests || [];
  if (myReqs.some((r: any) => (r._id || r) === profileUser.value?._id))
    return "received";

  return "none";
});

onMounted(async () => {
  await init();
});

watch(() => route.params, init);

async function init() {
  loading.value = true;
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

    const [up, past] = await Promise.all([
      ProfileAPI.getGames(profileUser.value._id, false),
      ProfileAPI.getGames(profileUser.value._id, true),
    ]);

    upcomingGames.value = up.sort(
      (a: any, b: any) =>
        new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    pastGames.value = past.sort(
      (a: any, b: any) =>
        new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

const reload = () => window.location.reload();

async function handleAction(action: Function, ...args: any[]) {
  try {
    await action(...args);
    reload();
  } catch {
    alert("Error");
  }
}

const handleSendRequest = () =>
  handleAction(
    ProfileAPI.sendFriendRequest,
    profileUser.value!._id,
    currentUser.value!._id,
  );
const handleAcceptRequest = () =>
  handleAction(
    ProfileAPI.acceptFriendRequest,
    profileUser.value!._id,
    currentUser.value!._id,
  );
const handleRemoveFriend = () =>
  confirm("Remove friend?") &&
  handleAction(
    ProfileAPI.removeFriend,
    profileUser.value!._id,
    currentUser.value!._id,
  );
const handleRemovePic = () =>
  confirm("Remove pic?") &&
  handleAction(ProfileAPI.deleteProfilePicture, profileUser.value!._id);

async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files?.[0])
    handleAction(
      ProfileAPI.uploadProfilePicture,
      profileUser.value!._id,
      input.files[0],
    );
}

function submitReport(motivation: string) {
  if (!currentUser.value || !profileUser.value) return;

  ProfileAPI.sendReport(
    currentUser.value._id,
    profileUser.value._id,
    motivation,
  )
    .then(() => {
      alert(t("profile.report_success") || "Segnalazione inviata");
      showReportModal.value = false;
    })
    .catch((e) => {
      console.error(e);
      alert("Errore nell'invio della segnalazione");
    });
}
</script>

<template>
  <div v-if="!loading && profileUser" class="container mt-4 mt-lg-5">
    <div class="profile-header-container">
      <div class="profile-avatar-section">
        <div class="avatar-container">
          <img
            :src="profileUser.profilePicture || '/images/utenteDefault.png'"
            class="rounded-circle profile-pic-responsive"
          />

          <div v-if="isOwnProfile">
            <label
              for="fileInput"
              class="btn rounded-circle shadow edit-btn upload"
            >
              <i class="bi bi-pencil-fill" style="font-size: 0.8rem">+</i>
            </label>
            <button
              v-if="profileUser.profilePicture"
              @click="handleRemovePic"
              class="btn rounded-circle shadow edit-btn delete"
            >
              x
            </button>
            <input
              type="file"
              id="fileInput"
              class="d-none"
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

        <div v-if="!isOwnProfile" class="gap-2 mt-3">
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
            @click="showReportModal = true"
          >
            {{ t("profile.report_user") }}
          </button>
        </div>

        <div v-if="isOwnProfile" class="mt-3">
          <a href="/auth/logout" class="btn btn-outline-danger btn-lg px-5">{{
            t("profile.logout")
          }}</a>
        </div>
      </div>

      <div class="profile-stats-section">
        <EloChart :user="profileUser" />
      </div>

      <div class="profile-sidebar-section">
        <h4 class="fw-bold mb-3 border-bottom pb-2 text-center text-lg-start">
          {{ t("common.friends") }}
        </h4>
        <div
          class="d-flex flex-wrap gap-2 justify-content-center justify-content-lg-start mb-5"
        >
          <span v-if="friends.length === 0" class="text-muted">{{
            t("profile.no_friends")
          }}</span>
          <img
            v-for="friend in friends"
            :key="friend._id || friend"
            :src="friend.profilePicture || '/images/utenteDefault.png'"
            :title="friend.username"
            @click="router.push(`/user/${friend.username}`)"
            class="rounded-circle shadow-sm friend-avatar"
          />
        </div>

        <Calendar :games="pastGames" />
      </div>
    </div>

    <GameList
      :title="t('profile.upcoming_games')"
      :games="upcomingGames"
      :profile-user-id="profileUser._id"
      @open-game="selectedGame = $event"
    />

    <GameList
      :title="t('profile.past_games')"
      :games="pastGames"
      :profile-user-id="profileUser._id"
      :is-past="true"
      @open-game="selectedGame = $event"
    />
  </div>

  <div v-else-if="loading" class="text-center mt-5">
    <div class="spinner-border" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>
  </div>

  <ReportPopup
    v-if="profileUser"
    :is-open="showReportModal"
    :username="profileUser.username"
    @close="showReportModal = false"
    @submit="submitReport"
  />

  <GamePopup
    v-if="selectedGame"
    :game="selectedGame"
    :currentUser="currentUser"
    @close="selectedGame = null"
    @refresh="init"
  />
</template>

<style scoped src="@/assets/css/profile.css"></style>
