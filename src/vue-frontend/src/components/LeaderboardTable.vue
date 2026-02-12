<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { ILeaderboardEntry } from "@shared/types/User";

const props = defineProps<{
  users: ILeaderboardEntry[];
  loading: boolean;
  error: string;
  sportSelected: boolean;
}>();

const { t } = useI18n();
</script>

<template>
  <div class="leaderboard-table-container">
    <table class="table leaderboard-table">
      <thead>
        <tr>
          <th scope="col" class="text-center" style="width: 80px">#</th>
          <th scope="col">{{ t("leaderboard.col_player") }}</th>
          <th scope="col" class="text-end pe-4">{{ "Elo" }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td colspan="3" class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </td>
        </tr>
        <tr v-else-if="error">
          <td colspan="3" class="text-center py-5 text-danger fw-bold">
            <i class="bi bi-exclamation-triangle me-2"></i> {{ error }}
          </td>
        </tr>
        <tr v-else-if="!sportSelected">
          <td colspan="3" class="text-center py-5 text-muted">
            {{ t("leaderboard.select_sport_prompt") }}
          </td>
        </tr>
        <tr v-else-if="users.length === 0">
          <td colspan="3" class="text-center py-5 text-muted">
            {{ t("leaderboard.none_found") }}
          </td>
        </tr>
        <tr
          v-else
          v-for="(user, index) in users"
          :key="user._id"
          class="leaderboard-row"
          @click="$router.push(`/user/${user.username}`)"
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
              <span class="fw-bold">{{ user.username }}</span>
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

<style scoped src="@/assets/css/leaderboard.css"></style>
