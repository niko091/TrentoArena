<script setup lang="ts">
import { useI18n } from "vue-i18n";

const props = defineProps<{ places: any[]; loading: boolean }>();
const emit = defineEmits(["refresh", "edit"]);
const { t } = useI18n();

const deletePlace = async (id: string) => {
  if (!confirm(t("admin.js.confirm_delete_place"))) return;
  try {
    const res = await fetch(`/api/places/${id}`, { method: "DELETE" });
    if (res.ok) {
      alert(t("admin.js.place_deleted"));
      emit("refresh");
    } else {
      const data = await res.json();
      alert(`Error: ${data.message}`);
    }
  } catch (e) {
    console.error(e);
  }
};
</script>

<template>
  <div class="card">
    <div class="card-header py-3">
      <h2 class="h6 mb-0 text-brand">
        {{ t("admin.existing_places") }}
      </h2>
    </div>
    
    <div class="card-body p-0">
      <div class="table-responsive">
        <table class="table table-hover mb-0 align-middle">
          <thead class="table-light">
            <tr>
              <th>{{ t("admin.table_name") }}</th>
              <th>{{ t("admin.table_sport") }}</th>
              <th>{{ t("admin.table_lat") }}</th>
              <th>{{ t("admin.table_lng") }}</th>
              <th class="text-end pe-4">{{ t("admin.table_actions") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="5" class="text-center py-4 text-secondary">
                {{ t("common.loading") }}
              </td>
            </tr>
            
            <tr v-else-if="!places || places.length === 0">
              <td colspan="5" class="text-center py-4 text-secondary">
                {{ t("admin.no_places_found") || "No places found" }}
              </td>
            </tr>

            <tr v-for="place in places" :key="place._id">
              <td class="fw-medium">{{ place.name }}</td>
              <td>
                <span class="badge badge-sport">{{
                  place.sport?.name || t("admin.js.unknown")
                }}</span>
              </td>
              <td class="text-secondary small">{{ place.position.lat }}</td>
              <td class="text-secondary small">{{ place.position.lng }}</td>
              <td class="text-end pe-3">
                <button
                  @click="$emit('edit', place)"
                  class="btn btn-outline-primary-custom btn-sm me-2"
                >
                  {{ t("common.edit") }}
                </button>
                <button
                  @click="deletePlace(place._id)"
                  class="btn btn-outline-danger btn-sm"
                >
                  {{ t("common.delete") }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
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