<script setup lang="ts">
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  isOpen: boolean;
  username: string;
}>();

const emit = defineEmits(["close", "submit"]);
const { t } = useI18n();
const motivation = ref("");

watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) motivation.value = "";
  },
);

const submit = () => {
  if (!motivation.value.trim()) return;
  emit("submit", motivation.value);
};
</script>

<template>
  <div
    class="modal-overlay"
    :class="{ active: isOpen }"
    @click="$emit('close')"
  >
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">
          {{ t("profile.report_modal_title") }}
        </h3>
        <button class="modal-close-btn" @click="$emit('close')">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>

      <div class="modal-body">
        <p class="mb-3 text-description">
          Segnalazione utente: <strong>{{ username }}</strong>
        </p>
        <textarea
          v-model="motivation"
          class="form-control custom-textarea"
          rows="4"
          :placeholder="t('profile.report_reason')"
        ></textarea>
      </div>

      <div class="modal-footer-custom">
        <button class="btn btn-outline-secondary" @click="$emit('close')">
          {{ t("common.cancel") || "Cancel" }}
        </button>
        <button
          class="btn btn-danger btn-submit-custom"
          @click="submit"
          :disabled="!motivation.trim()"
        >
          {{ t("profile.report_submit") }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped src="@/assets/css/profile.css"></style>
