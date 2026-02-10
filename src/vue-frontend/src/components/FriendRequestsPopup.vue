<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

const emit = defineEmits(['close', 'request-handled']);

// State
const isActive = ref(false);
const requests = ref<any[]>([]);
const loading = ref(true);
const error = ref('');
const currentUserId = ref<string | null>(null);
const { t } = useI18n();

// Actions
const closePopup = () => {
    isActive.value = false;
    setTimeout(() => {
        emit('close');
    }, 300);
};

const loadRequests = async () => {
    loading.value = true;
    error.value = '';
    
    try {
        // Get Current User ID
        const authResp = await fetch('/auth/current_user');
        if (!authResp.ok) throw new Error('Not logged in');
        const currentUser = await authResp.json();
        currentUserId.value = currentUser._id;

        // Get Full User Data (including friendRequests)
        const userResp = await fetch(`/api/users/${currentUserId.value}`);
        if (!userResp.ok) throw new Error('Failed to fetch user details');
        const user = await userResp.json();

        requests.value = user.friendRequests || [];

    } catch (err) {
        console.error(err);
        console.error(err);
        error.value = t('common.error_generic');
    } finally {
        loading.value = false;
    }
};

const respond = async (requesterId: string, action: 'accept' | 'decline') => {
    if (!currentUserId.value) return;

    try {
        const response = await fetch(`/api/users/${currentUserId.value}/friends/${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requesterId })
        });

        if (response.ok) {
            // Remove request from local list immediately for better UX
            requests.value = requests.value.filter(r => r._id !== requesterId);
            
            // Emit event to update parent (e.g. badge count)
            emit('request-handled');

            // Trigger global notification update if available (legacy support)
            if ((window as any).checkNotifications) {
                (window as any).checkNotifications();
            }
        } else {
            alert(t('common.error_generic'));
        }
    } catch (error) {
        console.error(error);
        alert(t('game_popup.connection_error'));
    }
};


onMounted(async () => {
    // Add active class after mount for transition
    setTimeout(() => {
        isActive.value = true;
    }, 10);
    
    await loadRequests();
});

</script>

<template>
    <div class="friend-requests-popup-overlay" :class="{ 'active': isActive }" @click.self="closePopup">
        <div class="friend-requests-popup-content">
            <button class="friend-requests-popup-close" aria-label="Close" @click="closePopup">&times;</button>
            
            <h2 class="friend-requests-popup-title">{{ t('friends_popup.title') }}</h2>

            <div class="popup-body">
                <!-- Loading -->
                <p v-if="loading" class="text-center text-muted">{{ t('common.loading') }}</p>

                <!-- Error -->
                <p v-else-if="error" class="text-center text-danger">{{ error }}</p>

                <!-- Empty -->
                <p v-else-if="requests.length === 0" class="text-center text-muted">{{ t('friends_popup.no_requests') }}</p>

                <!-- List -->
                <ul v-else class="friend-requests-list">
                    <li v-for="req in requests" :key="req._id" class="friend-request-item">
                        <div class="request-info">
                            <img :src="req.profilePicture || '/images/utenteDefault.png'" 
                                 :alt="req.username" 
                                 class="request-profile-pic">
                            <a :href="`/user/${req.username}`" class="request-username">{{ req.username }}</a>
                        </div>
                        <div class="request-actions">
                            <button class="btn btn-sm btn-success accept-btn" @click="respond(req._id, 'accept')">{{ t('friends_popup.accept') }}</button>
                            <button class="btn btn-sm btn-danger decline-btn" @click="respond(req._id, 'decline')">{{ t('friends_popup.refuse') }}</button>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Friend Requests Popup Styles - Ported */

.friend-requests-popup-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: var(--overlay-bg, rgba(0, 0, 0, 0.5));
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s ease, visibility 0.3s ease;
    backdrop-filter: blur(5px);
}

.friend-requests-popup-overlay.active {
    opacity: 1;
    visibility: visible;
}

.friend-requests-popup-content {
    background: var(--bg-secondary, #fff);
    color: var(--text-primary, #000);
    padding: 30px;
    border-radius: 12px;
    width: 90%;
    max-width: 500px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    position: relative;
    max-height: 80vh;
    overflow-y: auto;
}

.friend-requests-popup-close {
    position: absolute;
    top: 15px;
    right: 20px;
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: var(--text-secondary, #666);
    transition: color 0.2s;
}

.friend-requests-popup-close:hover {
    color: var(--text-primary, #000);
}

.friend-requests-popup-title {
    margin-top: 0;
    margin-bottom: 20px;
    text-align: center;
    color: var(--text-primary, #000);
}

.friend-requests-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.friend-request-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 0;
    border-bottom: 1px solid var(--border-color-light, #eee);
}

.friend-request-item:last-child {
    border-bottom: none;
}

.request-info {
    display: flex;
    align-items: center;
    gap: 15px;
}

.request-profile-pic {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid var(--bg-secondary, #fff);
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
}

.request-username {
    font-weight: bold;
    font-size: 1.1rem;
    text-decoration: none;
    color: inherit;
}

.request-actions {
    display: flex;
    gap: 10px;
}

/* Button styles handled by global bootstrap or similar, but adding scoped overrides if needed */
.btn-sm {
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
    border-radius: 0.2rem;
}
</style>
