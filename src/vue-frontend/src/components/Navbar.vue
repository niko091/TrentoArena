<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import GameCreationPopup from './GameCreationPopup.vue'
import SearchPopup from './SearchPopup.vue'
import FriendRequestsPopup from './FriendRequestsPopup.vue'

// --- Logic remains the same ---
const showCreateGame = ref(false)
const showSearch = ref(false)
const showRequests = ref(false)
const requestsCount = ref(0)
const { t } = useI18n()

// Mobile State
const isMenuOpen = ref(false)

const toggleMenu = () => {
    isMenuOpen.value = !isMenuOpen.value
}

const closeMenu = () => {
    isMenuOpen.value = false
}

const openCreateGame = () => {
    showCreateGame.value = true
    closeMenu()
}

const closeCreateGame = () => {
    showCreateGame.value = false
}

const openSearch = () => {
    showSearch.value = true
    closeMenu()
}

const closeSearch = () => {
    showSearch.value = false
}

const openRequests = () => {
    showRequests.value = true
    closeMenu()
}

const closeRequests = () => {
    showRequests.value = false
}

const updateRequestsCount = async () => {
    try {
        const authResp = await fetch('/auth/current_user')
        if (!authResp.ok) return
        const contentType = authResp.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) return;
        
        const currentUser = await authResp.json()
        const userResp = await fetch(`/api/users/${currentUser._id}`)
        if (userResp.ok) {
            const user = await userResp.json()
            requestsCount.value = user.friendRequests ? user.friendRequests.length : 0
        }
    } catch (e) {
        console.error("Failed to update requests count", e)
    }
}

onMounted(() => {
    updateRequestsCount();
    (window as any).checkNotifications = updateRequestsCount;
})
</script>

<template>
  <div id="navbar">
      <nav class="navbar">
        <RouterLink to="/dashboard" class="nav-brand" @click="closeMenu">
          <img src="/images/logo_TrentoArena.png" alt="TrentoArena" class="nav-logo">
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
          
          <a class="nav-link" href="#" @click.prevent="openSearch">
            <img src="/images/search.png" :alt="t('navbar.search')">
            <span>{{ t('navbar.search') }}</span>
          </a>

          <a class="nav-link" href="#" @click.prevent="openCreateGame">
             <img src="/images/add.png" :alt="t('navbar.create')">
             <span>{{ t('navbar.create') }}</span>
          </a>

          <RouterLink class="nav-link" to="/map" @click="closeMenu">
            <img src="/images/map.png" :alt="t('navbar.map')">
            <span>{{ t('navbar.map') }}</span>
          </RouterLink>

          <RouterLink class="nav-link" to="/leaderboard" @click="closeMenu">
             <img src="/images/trophy.png" :alt="t('navbar.leaderboard')">
             <span>{{ t('navbar.leaderboard') }}</span>
          </RouterLink>

          <a class="nav-link" href="#" @click.prevent="openRequests">
             <div class="icon-wrapper">
                <img src="/images/bell.png" :alt="t('navbar.requests')">
                <span id="requests-badge" 
                      class="notification-badge" 
                      :style="{ display: requestsCount > 0 ? 'flex' : 'none' }">
                    {{ requestsCount }}
                </span>
             </div>
             <span>{{ t('navbar.requests') }}</span>
          </a>

          <RouterLink class="nav-link" to="/profile" @click="closeMenu">
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
/* NOTA: Molti stili (colori, font, ombre) sono ereditati da style.css globalmente.
   Qui gestiamo solo il layout specifico responsive e l'hamburger.
*/

/* --- HAMBURGER (Mobile Trigger) --- */
.hamburger {
    display: none;
    flex-direction: column;
    justify-content: space-between;
    height: 20px;
    width: 28px;
    padding: 0;
    z-index: 1003;
    /* Spinge a destra su mobile */
    margin-left: auto; 
}

.hamburger .bar {
    width: 100%;
    height: 3px;
    /* USA LA VARIABILE GLOBALE: Così cambia colore in Dark Mode se necessario */
    background-color: var(--text-inverse); 
    border-radius: 4px;
    transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

/* --- MOBILE RESPONSIVE (< 768px) --- */
@media screen and (max-width: 768px) {
    .hamburger {
        display: flex;
    }

    /* 1. CENTRATURA LOGO MOBILE */
    /* Usiamo !important solo se necessario per sovrascrivere flex del desktop */
    .nav-brand {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        width: max-content;
        margin-right: 0; /* Reset del margin desktop */
    }
    
    .nav-logo {
        height: 45px; /* Un po' più piccolo per stare nella barra mobile */
    }

    /* 2. MENU A TENDINA */
    .nav-items {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: auto;
        
        /* USA LE VARIABILI GLOBALI */
        background-color: var(--accent-primary);
        
        flex-direction: column; /* Sovrascrive il row del css globale */
        align-items: flex-start;
        padding: 90px 25px 30px 25px;
        gap: 0; /* Reset del gap globale */
        
        box-shadow: var(--shadow-lg);
        
        /* Animazione */
        transform: translateY(-100%);
        opacity: 0;
        transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s;
        z-index: 1001; 
        pointer-events: none;
    }

    .nav-items.mobile-open {
        transform: translateY(0);
        opacity: 1;
        pointer-events: all;
    }

    /* Animazione Hamburger X */
    .hamburger.is-active .bar:nth-child(1) { transform: translateY(8.5px) rotate(45deg); }
    .hamburger.is-active .bar:nth-child(2) { opacity: 0; }
    .hamburger.is-active .bar:nth-child(3) { transform: translateY(-8.5px) rotate(-45deg); }

    /* 3. STILE LINK MOBILE */
    /* Dobbiamo forzare il layout orizzontale perché il global css li mette in colonna */
    .nav-link {
        width: 100%;
        flex-direction: row; /* Icona a sinistra, testo a destra */
        align-items: center;
        padding: 15px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.15); /* Separatore leggero */
        transform: none !important; /* Disabilita l'animazione hover desktop */
    }
    
    .nav-link:last-child {
        border-bottom: none;
    }

    .nav-link img {
        margin-bottom: 0; /* Reset del margin globale */
        margin-right: 15px; /* Spazio a destra dell'icona */
        /* I filtri colore sono gestiti interamente da style.css ora */
    }
    
    .nav-link span {
        font-size: 1.1rem;
    }
}
</style>