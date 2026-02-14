<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { ILeaderboardEntry } from "@shared/types/User";

const props = defineProps<{
  users: ILeaderboardEntry[];
  loading: boolean;
  error: string;
  sportSelected: boolean;
}>();

const { t } = useI18n();
const router = useRouter();

const navigateToUser = (username: string) => {
  router.push(`/user/${username}`);
};
</script>

<template>
  <div class="leaderboard-table-container">
    <table class="leaderboard-table">
      <thead>
        <tr>
          <th scope="col" class="text-center rank-col">#</th>
          <th scope="col">{{ t("leaderboard.col_player") }}</th>
          <th scope="col" class="text-end pe-4">{{ "Elo" }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td colspan="3" class="text-center py-5">
            <div class="spinner-border brand-spinner" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </td>
        </tr>

        <tr v-else-if="error">
          <td colspan="3" class="text-center py-5 error-text fw-bold">
            <i class="bi bi-exclamation-triangle me-2"></i> {{ error }}
          </td>
        </tr>

        <tr v-else-if="!sportSelected">
          <td colspan="3" class="text-center py-5 muted-text">
            {{ t("leaderboard.select_sport_prompt") }}
          </td>
        </tr>

        <tr v-else-if="users.length === 0">
          <td colspan="3" class="text-center py-5 muted-text">
            {{ t("leaderboard.none_found") }}
          </td>
        </tr>

        <tr
          v-else
          v-for="(user, index) in users"
          :key="user._id"
          class="leaderboard-row"
          @click="navigateToUser(user.username)"
        >
          <td class="text-center align-middle">
            <div
              class="rank-badge"
              :class="{
                'rank-1': index === 0,
                'rank-2': index === 1,
                'rank-3': index === 2,
                'rank-other': index > 2,
              }"
            >
              {{ index + 1 }}
            </div>
          </td>

          <td class="align-middle">
            <div class="d-flex align-items-center">
              <img
                :src="user.profilePicture || '/images/utenteDefault.png'"
                :alt="user.username"
                class="player-avatar"
              />
              <span class="fw-bold username-text">{{ user.username }}</span>
            </div>
          </td>

          <td class="text-end pe-4 align-middle">
            <span class="elo-text">{{ user.elo }}</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
@import "@/assets/css/leaderboard.css";

.brand-spinner {
  color: var(--brand-primary);
}

.error-text {
  color: var(--status-danger);
}

.muted-text {
  color: var(--text-muted);
}

.username-text {
  color: var(--text-primary);
}

.rank-col {
  width: 80px;
}

.text-center {
  text-align: center;
}
.text-end {
  text-align: right;
}
.align-middle {
  vertical-align: middle;
}
.pe-4 {
  padding-right: 1.5rem;
}
.py-5 {
  padding-top: 3rem;
  padding-bottom: 3rem;
}
.d-flex {
  display: flex;
}
.align-items-center {
  align-items: center;
}
.fw-bold {
  font-weight: 700;
}
.me-2 {
  margin-right: 0.5rem;
}
</style>
