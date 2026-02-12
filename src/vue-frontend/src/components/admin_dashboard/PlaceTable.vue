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
  <div class="card border-0 shadow-sm mt-4">
    <div class="card-header bg-white py-3">
      <h2 class="h5 mb-0 text-primary-custom">
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
              <th>{{ t("admin.table_actions") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="5" class="text-center py-4">
                {{ t("common.loading") }}
              </td>
            </tr>
            <tr v-for="place in places" :key="place._id">
              <td class="fw-medium">{{ place.name }}</td>
              <td>
                <span class="badge badge-sport">{{
                  place.sport?.name || t("admin.js.unknown")
                }}</span>
              </td>
              <td class="text-muted small">{{ place.position.lat }}</td>
              <td class="text-muted small">{{ place.position.lng }}</td>
              <td>
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

<style src="@/assets/css/admin_dashboard.css"></style>
