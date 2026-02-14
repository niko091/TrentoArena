<script setup lang="ts">
import { useI18n } from "vue-i18n";

const props = defineProps<{
  reports: any[];
  bannedUsers: any[];
  loadingReports: boolean;
  loadingBanned: boolean;
}>();
const emit = defineEmits(["refresh-users", "open-ban-modal"]);
const { t } = useI18n();

const unbanUser = async (userId: string, username: string) => {
  if (!confirm(t("admin.js.confirm_unban", { username: username }))) return;
  try {
    const res = await fetch("/api/admin/unban", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    if (res.ok) {
      alert(t("admin.js.user_unbanned", { username: username }));
      emit("refresh-users");
    } else {
      const data = await res.json();
      alert(`Error: ${data.message}`);
    }
  } catch (e) {
    console.error(e);
  }
};

const formatDateTime = (d: string) => new Date(d).toLocaleString("it-IT");

const calculateRemainingTime = (expiry: string) => {
  if (!expiry) return "";
  const diff = new Date(expiry).getTime() - new Date().getTime();
  if (diff <= 0) return t("admin.js.expired");
  const days = Math.floor(diff / 86400000);
  if (days < 1) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}h`;
  }
  return `${days}d`;
};
</script>

<template>
  <div class="row g-4 mt-1 align-items-start">
    <div class="col-lg-6">
      <div class="card h-100">
        <div class="card-header py-3">
          <h2 class="h6 mb-0 text-brand">
            {{ t("admin.user_reports") }}
          </h2>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover mb-0 align-middle">
              <thead class="table-light">
                <tr>
                  <th>{{ t("admin.table_date") }}</th>
                  <th>{{ t("admin.table_reporter") }}</th>
                  <th>{{ t("admin.table_reported_user") }}</th>
                  <th>{{ t("admin.table_actions") }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loadingReports">
                  <td colspan="4" class="text-center py-4 text-secondary">
                    {{ t("common.loading") }}
                  </td>
                </tr>
                <tr v-else-if="reports.length === 0">
                  <td colspan="4" class="text-center py-4 text-secondary">
                    {{ t("admin.no_reports") || "No reports" }}
                  </td>
                </tr>
                <tr v-for="report in reports" :key="report._id">
                  <td class="small text-secondary">
                    {{ formatDateTime(report.date) }}
                  </td>
                  <td>
                    {{ report.reporter?.username || t("admin.js.unknown") }}
                  </td>
                  <td>
                    <div class="fw-bold">
                      {{ report.reported?.username || t("admin.js.unknown") }}
                    </div>
                    <small
                      class="text-secondary text-truncate d-block"
                      style="max-width: 150px"
                      :title="report.motivation"
                    >
                      {{ report.motivation }}
                    </small>
                  </td>
                  <td>
                    <button
                      v-if="report.reported?.isBanned"
                      class="btn btn-secondary btn-sm"
                      disabled
                    >
                      Banned
                    </button>
                    <button
                      v-else-if="report.reported"
                      @click="$emit('open-ban-modal', report.reported)"
                      class="btn btn-outline-danger btn-sm"
                    >
                      Ban
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <div class="col-lg-6">
      <div class="card h-100">
        <div class="card-header py-3">
          <h2 class="h6 mb-0 text-brand">
            {{ t("admin.banned_users") }}
          </h2>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover mb-0 align-middle">
              <thead class="table-light">
                <tr>
                  <th>{{ t("admin.table_username") }}</th>
                  <th>{{ t("admin.table_ban_expiry") }}</th>
                  <th class="text-end pe-4">{{ t("admin.table_actions") }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loadingBanned">
                  <td colspan="3" class="text-center py-4 text-secondary">
                    {{ t("common.loading") }}
                  </td>
                </tr>
                <tr v-else-if="bannedUsers.length === 0">
                  <td colspan="3" class="text-center py-4 text-secondary">
                    {{ t("admin.no_banned_users") || "No banned users" }}
                  </td>
                </tr>
                <tr v-for="user in bannedUsers" :key="user._id">
                  <td>
                    <div class="fw-bold">{{ user.username }}</div>
                    <small class="text-secondary">{{
                      user.banReason || "No reason"
                    }}</small>
                  </td>
                  <td class="small">
                    <div>
                      {{
                        user.banExpiresAt
                          ? new Date(user.banExpiresAt).toLocaleDateString()
                          : t("admin.js.forever")
                      }}
                    </div>
                    <div class="text-danger fw-bold">
                      {{
                        user.banExpiresAt
                          ? calculateRemainingTime(user.banExpiresAt)
                          : ""
                      }}
                    </div>
                  </td>
                  <td class="text-end pe-3">
                    <button
                      @click="unbanUser(user._id, user.username)"
                      class="btn btn-outline-success btn-sm"
                    >
                      Unban
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped src="@/assets/css/admin_dashboard.css"></style>

<style scoped>
.text-brand {
  color: var(--brand-primary);
  font-weight: 600;
}

.text-secondary {
  color: var(--text-secondary) !important;
}
.card-body {
  overflow: hidden;
  border-radius: 0 0 var(--radius-md) var(--radius-md);
}
</style>
