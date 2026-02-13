<script setup lang="ts">
import { RouterLink } from "vue-router";
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import GameCreationPopup from "./GameCreationPopup.vue";
import SearchPopup from "./SearchPopup.vue";
import FriendRequestsPopup from "./FriendRequestsPopup.vue";

const showCreateGame = ref(false);
const showSearch = ref(false);
const showRequests = ref(false);
const requestsCount = ref(0);
const { t } = useI18n();
const isMenuOpen = ref(false);
const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
  if (isMenuOpen.value) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
};

const closeMenu = () => {
  isMenuOpen.value = false;
  document.body.style.overflow = '';
};

const openCreateGame = () => {
  showCreateGame.value = true;
  closeMenu();
};
const closeCreateGame = () => {
  showCreateGame.value = false;
};

const openSearch = () => {
  showSearch.value = true;
  closeMenu();
};
const closeSearch = () => {
  showSearch.value = false;
};

const openRequests = () => {
  showRequests.value = true;
  closeMenu();
};
const closeRequests = () => {
  showRequests.value = false;
};

const updateRequestsCount = async () => {
  try {
    const authResp = await fetch("/auth/current_user");
    if (!authResp.ok) return;
        const contentType = authResp.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) return;

    const currentUser = await authResp.json();
    const userResp = await fetch(`/api/users/${currentUser._id}`);
    
    if (userResp.ok) {
      const user = await userResp.json();
      requestsCount.value = user.friendRequests ? user.friendRequests.length : 0;
    }
  } catch (e) {
    console.error("Failed to update requests count", e);
  }
};

onMounted(() => {
  updateRequestsCount();
  (window as any).checkNotifications = updateRequestsCount;
});
</script>

<template>
  <div id="navbar">
    <nav class="navbar">
      <RouterLink to="/dashboard" class="nav-brand" @click="closeMenu">
        <img
          src="/images/logo_TrentoArena.png"
          alt="TrentoArena"
          class="nav-logo"
        />
      </RouterLink>

      <button
        class="hamburger"
        :class="{ 'is-active': isMenuOpen }"
        @click="toggleMenu"
        aria-label="Menu"
        :aria-expanded="isMenuOpen"
      >
        <span class="bar"></span>
        <span class="bar"></span>
        <span class="bar"></span>
      </button>

      <div class="nav-items" :class="{ 'mobile-open': isMenuOpen }">
        
        <div class="mobile-menu-logo">
           <RouterLink to="/dashboard" @click="closeMenu">
            <img 
              src="/images/logo_TrentoArena.png" 
              alt="TrentoArena" 
              class="nav-logo"
            />
           </RouterLink>
        </div>

        <a class="nav-link" href="#" @click.prevent="openSearch">
          <img src="/images/search.png" :alt="t('navbar.search')" />
          <span>{{ t("navbar.search") }}</span>
        </a>

        <a class="nav-link" href="#" @click.prevent="openCreateGame">
          <img src="/images/add.png" :alt="t('navbar.create')" />
          <span>{{ t("navbar.create") }}</span>
        </a>

        <RouterLink class="nav-link" to="/map" @click="closeMenu">
          <img src="/images/map.png" :alt="t('navbar.map')" />
          <span>{{ t("navbar.map") }}</span>
        </RouterLink>

        <RouterLink class="nav-link" to="/leaderboard" @click="closeMenu">
          <img src="/images/trophy.png" :alt="t('navbar.leaderboard')" />
          <span>{{ t("navbar.leaderboard") }}</span>
        </RouterLink>

        <a class="nav-link" href="#" @click.prevent="openRequests">
          <div class="icon-wrapper">
            <img src="/images/bell.png" :alt="t('navbar.requests')" />
            <span
              v-if="requestsCount > 0"
              class="notification-badge"
            >
              {{ requestsCount }}
            </span>
          </div>
          <span>{{ t("navbar.requests") }}</span>
        </a>

        <RouterLink class="nav-link" to="/profile" @click="closeMenu">
          <img src="/images/account.png" :alt="t('navbar.profile')" />
          <span>{{ t("navbar.profile") }}</span>
        </RouterLink>
      </div>
    </nav>

    <Teleport to="body">
      <GameCreationPopup
        v-if="showCreateGame"
        @close="closeCreateGame"
        @created="closeCreateGame"
      />
      <SearchPopup v-if="showSearch" @close="closeSearch" />
      <FriendRequestsPopup
        v-if="showRequests"
        @close="closeRequests"
        @request-handled="updateRequestsCount"
      />
    </Teleport>
  </div>
</template>

<style scoped src="@/assets/css/navbar.css"></style>
<style scoped src="@/assets/css/style.css"></style>