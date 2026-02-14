<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { IUserShared } from "@shared/types/User";

const props = defineProps<{
  user: IUserShared | null;
  gamesCount: number;
}>();

const { t } = useI18n();

const friendCount = computed(() => props.user?.friends?.length || 0);
const displayAvatar = computed(
  () => props.user?.profilePicture || "/images/utenteDefault.png",
);
</script>

<template>
  <div class="user-profile-box">
    <div class="avatar-wrapper">
      <img
        :src="displayAvatar"
        :alt="t('common.avatar')"
        class="wireframe-avatar"
      />
    </div>
    <h3 class="user-name">
      {{ user ? user.username : t("common.loading") }}
    </h3>
    <p class="user-role">{{ t("dashboard.player_role") }}</p>

    <div class="stats-container" v-if="user">
      <div class="stat-box">
        <span class="stat-number">{{ gamesCount }}</span>
        <span class="stat-label">{{ t("dashboard.games") }}</span>
      </div>
      <div class="stat-box">
        <span class="stat-number">{{ friendCount }}</span>
        <span class="stat-label">{{ t("common.friends") }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped src="@/assets/css/user_widget.css"></style>
