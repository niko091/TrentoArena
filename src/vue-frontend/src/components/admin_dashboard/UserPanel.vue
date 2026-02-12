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
  if (!confirm(t("admin.js.confirm_unban", { username }))) return;
  try {
    const res = await fetch("/api/admin/unban", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    if (res.ok) {
      alert(t("admin.js.user_unbanned", { username }));
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
  const diff = new Date(expiry).getTime() - new Date().getTime();
  if (diff <= 0) return t("admin.js.expired");
  const days = Math.floor(diff / 86400000);
  return `${days}d`;
};
</script>

<template>
  <div class="row g-4 mt-1">
    <div class="col-lg-6">
      <div class="card h-100 border-0 shadow-sm">
        <div class="card-header bg-white py-3">
          <h2 class="h5 mb-0 text-primary-custom">
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
                  <td colspan="4" class="text-center py-4">
                    {{ t("common.loading") }}
                  </td>
                </tr>
                <tr v-for="report in reports" :key="report._id">
                  <td class="small">{{ formatDateTime(report.date) }}</td>
                  <td>
                    {{ report.reporter?.username || t("admin.js.unknown") }}
                  </td>
                  <td>
                    <div class="fw-bold">
                      {{ report.reported?.username || t("admin.js.unknown") }}
                    </div>
                    <small
                      class="text-muted text-truncate d-block"
                      style="max-width: 150px"
                      >{{ report.motivation }}</small
                    >
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
      <div class="card h-100 border-0 shadow-sm">
        <div class="card-header bg-white py-3">
          <h2 class="h5 mb-0 text-primary-custom">
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
                  <th>{{ t("admin.table_actions") }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loadingBanned">
                  <td colspan="3" class="text-center py-4">
                    {{ t("common.loading") }}
                  </td>
                </tr>
                <tr v-for="user in bannedUsers" :key="user._id">
                  <td>
                    <div class="fw-bold">{{ user.username }}</div>
                    <small class="text-muted">{{
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
                    <div class="text-danger">
                      {{
                        user.banExpiresAt
                          ? calculateRemainingTime(user.banExpiresAt)
                          : ""
                      }}
                    </div>
                  </td>
                  <td>
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

<style src="@/assets/css/admin_dashboard.css"></style>
