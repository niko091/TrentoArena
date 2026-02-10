
<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import GameCreationPopup from './GameCreationPopup.vue'
import SearchPopup from './SearchPopup.vue'
import FriendRequestsPopup from './FriendRequestsPopup.vue'

const showCreateGame = ref(false)
const showSearch = ref(false)
const showRequests = ref(false)
const requestsCount = ref(0)
const { t } = useI18n()

const openCreateGame = () => {
    showCreateGame.value = true
}

const closeCreateGame = () => {
    showCreateGame.value = false
}

const openSearch = () => {
    showSearch.value = true
}

const closeSearch = () => {
    showSearch.value = false
}

const openRequests = () => {
    showRequests.value = true
}

const closeRequests = () => {
    showRequests.value = false
}

const updateRequestsCount = async () => {
    try {
        const authResp = await fetch('/auth/current_user')
        if (!authResp.ok) return
        
        const contentType = authResp.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.error('Auth response is not JSON');
            return;
        }
        const currentUser = await authResp.json()
        
        // Get full data
        const userResp = await fetch(`/api/users/${currentUser._id}`)
        if (userResp.ok) {
            const userContentType = userResp.headers.get('content-type');
            if (userContentType && userContentType.includes('application/json')) {
                const user = await userResp.json()
                requestsCount.value = user.friendRequests ? user.friendRequests.length : 0
            } else {
                 console.error('User API response is not JSON');
            }
        }
    } catch (e) {
        console.error("Failed to update requests count", e)
    }
}

onMounted(() => {
    updateRequestsCount();
    // Expose for legacy support if needed, or just rely on component events
    (window as any).checkNotifications = updateRequestsCount;
})
</script>

<template>
  <div id="navbar">
      <nav class="navbar">
        <RouterLink to="/dashboard" class="nav-brand" style="display: flex; align-items: center; text-decoration: none; color: inherit; margin-right: auto;">
          <img src="/images/logo_TrentoArena.png" alt="TrentoArena" class="nav-logo">
        </RouterLink>

        <div class="nav-items">
          <!-- Search -->
          <a class="nav-link" href="#" @click.prevent="openSearch">
            <img src="/images/search.png" :alt="t('navbar.search')">
            <span>{{ t('navbar.search') }}</span>
          </a>

          <!-- Create Game -->
          <a class="nav-link" href="#" @click.prevent="openCreateGame">
             <img src="/images/add.png" :alt="t('navbar.create')">
             <span>{{ t('navbar.create') }}</span>
          </a>

          <!-- Map -->
          <RouterLink class="nav-link" to="/map">
            <img src="/images/map.png" :alt="t('navbar.map')">
            <span>{{ t('navbar.map') }}</span>
          </RouterLink>

          <!-- Leaderboard -->
          <RouterLink class="nav-link" to="/leaderboard">
             <img src="/images/trophy.png" :alt="t('navbar.leaderboard')">
             <span>{{ t('navbar.leaderboard') }}</span>
          </RouterLink>

          <!-- Requests -->
          <a class="nav-link" href="#" @click.prevent="openRequests">
             <div class="icon-wrapper">
                <img src="/images/bell.png" :alt="t('navbar.requests')">
                <span id="requests-badge" 
                      class="notification-badge" 
                      style="display: none;" 
                      :style="{ display: requestsCount > 0 ? 'flex' : 'none' }">
                    {{ requestsCount }}
                </span>
             </div>
             <span>{{ t('navbar.requests') }}</span>
          </a>

          <!-- Profile -->
          <RouterLink class="nav-link" to="/profile">
             <img src="/images/account.png" :alt="t('navbar.profile')">
             <span>{{ t('navbar.profile') }}</span>
          </RouterLink>
        </div>
      </nav>

      <Teleport to="body">
        <GameCreationPopup v-if="showCreateGame" @close="closeCreateGame" @created="closeCreateGame" />
        <SearchPopup v-if="showSearch" @close="closeSearch" />
        <FriendRequestsPopup v-if="showRequests" @close="closeRequests" @request-handled="updateRequestsCount" />
      </Teleport>
  </div>
</template>

<style scoped>
/* Scoped styles if needed, but relying on global style.css for now */
</style>
