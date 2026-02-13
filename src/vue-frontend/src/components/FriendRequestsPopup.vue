<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { RouterLink } from "vue-router";

const emit = defineEmits(["close", "request-handled"]);
const { t } = useI18n();

const isActive = ref(false);
const requests = ref<any[]>([]);
const loading = ref(true);
const error = ref("");
const currentUserId = ref<string | null>(null);

const closePopup = () => {
  isActive.value = false;
  setTimeout(() => {
    emit("close");
  }, 300);
};

const loadRequests = async () => {
  loading.value = true;
  error.value = "";
  try {
    const authResp = await fetch("/auth/current_user");
    if (!authResp.ok) throw new Error("Not logged in");
    const currentUser = await authResp.json();
    currentUserId.value = currentUser._id;

    const userResp = await fetch(`/api/users/${currentUserId.value}`);
    if (!userResp.ok) throw new Error("Failed");
    const user = await userResp.json();
    requests.value = user.friendRequests || [];
  } catch (err) {
    console.error(err);
    error.value = t("common.error_generic");
  } finally {
    loading.value = false;
  }
};

const respond = async (requesterId: string, action: "accept" | "decline") => {
  if (!currentUserId.value) return;
  try {
    const originalRequests = [...requests.value];
    requests.value = requests.value.filter((r) => r._id !== requesterId);

    const response = await fetch(
      `/api/users/${currentUserId.value}/friends/${action}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId }),
      }
    );

    if (response.ok) {
      emit("request-handled");
      if ((window as any).checkNotifications) (window as any).checkNotifications();
    } else {
      requests.value = originalRequests;
    }
  } catch (e) { console.error(e); }
};

onMounted(() => {
  setTimeout(() => isActive.value = true, 50);
  loadRequests();
});
</script>

<template>
  <div class="modal-overlay" :class="{ active: isActive }" @click.self="closePopup">
    <div class="modal-content">
      
      <div class="modal-header">
        <h2 class="modal-title">{{ t("friends_popup.title") }}</h2>
        <button class="modal-close-btn" @click="closePopup">&times;</button>
      </div>

      <div class="modal-body">
        <p v-if="loading" class="text-center text-muted">{{ t("common.loading") }}</p>
        <p v-else-if="error" class="text-center text-danger">{{ error }}</p>
        <p v-else-if="requests.length === 0" class="text-center text-muted">
          {{ t("friends_popup.no_requests") }}
        </p>

        <ul v-else class="friend-requests-list">
          <li v-for="req in requests" :key="req._id" class="friend-request-item">
            <div class="request-info">
              <img :src="req.profilePicture || '/images/utenteDefault.png'" :alt="req.username" class="request-profile-pic" />
              
              <RouterLink 
                :to="`/user/${req.username}`" 
                class="request-username"
                @click="closePopup"
              >
                {{ req.username }}
              </RouterLink>
            </div>
            
            <div class="request-actions">
              <button class="btn-action btn-accept" @click="respond(req._id, 'accept')">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/></svg>
              </button>
              <button class="btn-action btn-reject" @click="respond(req._id, 'decline')">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>
              </button>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
  
<style scoped src="@/assets/css/popup_shared.css"></style>
<style scoped src="@/assets/css/friend_requests_popup.css"></style>
<style scoped src="@/assets/css/style.css"></style>

