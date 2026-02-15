<script setup lang="ts">
import { useI18n } from "vue-i18n";

interface Report {
  _id: string;
  date: string;
  motivation: string;
  reporter?: {
    username: string;
  };
  reported?: {
    _id: string;
    username: string;
    isBanned?: boolean;
  };
}

interface BannedUser {
  _id: string;
  username: string;
  banReason?: string;
  banExpiresAt?: string;
}

const props = defineProps<{
  reports: Report[];
  bannedUsers: BannedUser[];
  loadingReports: boolean;
  loadingBanned: boolean;
}>();

const emit = defineEmits<{
  (e: "refresh-users"): void;
  (e: "open-ban-modal", user: any): void;
}>();

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

const calculateRemainingTime = (expiry?: string) => {
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
  <div class="row g-4 mt-1">
    <div class="col-12">
      <div class="card shadow-sm h-100">
        <div class="card-header py-3 bg-transparent border-bottom">
          <h2 class="h6 mb-0 text-brand">
            {{ t("admin.user_reports") }}
          </h2>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover mb-0 align-middle">
              <thead>
                <tr>
                  <th style="width: 15%">{{ t("admin.table_date") }}</th>
                  <th style="width: 20%">{{ t("admin.table_reporter") }}</th>
                  <th style="width: 45%">
                    {{ t("admin.table_reported_user") }}
                  </th>
                  <th style="width: 20%" class="text-end pe-4">
                    {{ t("admin.table_actions") }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loadingReports">
                  <td colspan="4" class="text-center py-4 text-secondary">
                    <div
                      class="spinner-border spinner-border-sm me-2"
                      role="status"
                    ></div>
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
                    <div class="d-flex flex-column">
                      <span class="fw-bold">
                        {{ report.reported?.username || t("admin.js.unknown") }}
                      </span>
                      <small class="text-muted mt-1">
                        <i class="bi bi-chat-quote me-1"></i>
                        {{ report.motivation }}
                      </small>
                    </div>
                  </td>
                  <td class="text-end pe-3">
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

    <div class="col-12">
      <div class="card shadow-sm h-100">
        <div class="card-header py-3 bg-transparent border-bottom">
          <h2 class="h6 mb-0 text-brand">
            {{ t("admin.banned_users") }}
          </h2>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover mb-0 align-middle">
              <thead>
                <tr>
                  <th style="width: 40%">{{ t("admin.table_username") }}</th>
                  <th style="width: 40%">{{ t("admin.table_ban_expiry") }}</th>
                  <th style="width: 20%" class="text-end pe-4">
                    {{ t("admin.table_actions") }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loadingBanned">
                  <td colspan="3" class="text-center py-4 text-secondary">
                    <div
                      class="spinner-border spinner-border-sm me-2"
                      role="status"
                    ></div>
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
                    <small class="text-secondary fst-italic">{{
                      user.banReason || "No reason specified"
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

.card {
  border: 1px solid #e9ecef;
}

.card-body {
  overflow: hidden;
  border-radius: 0 0 var(--radius-md) var(--radius-md);
}

.text-muted {
  color: #6c757d !important;
  display: block;
  white-space: normal;
}
</style>
