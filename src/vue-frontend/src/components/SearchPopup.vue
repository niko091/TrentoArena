<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from "vue";
import { useI18n } from "vue-i18n";

const emit = defineEmits(["close"]);

const isActive = ref(false);
const searchQuery = ref("");
const resultsUsers = ref<any[]>([]);
const resultsPlaces = ref<any[]>([]);
const isLoading = ref(false);
const hasSearched = ref(false);
const searchInput = ref<HTMLInputElement | null>(null);

// i18n helper
// i18n helper
const { t } = useI18n();

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const handleInput = () => {
  if (debounceTimer) clearTimeout(debounceTimer);

  const query = searchQuery.value.trim();

  if (query.length < 2) {
    resultsUsers.value = [];
    resultsPlaces.value = [];
    hasSearched.value = false; // Reset to show initial state or "type more"
    return;
  }

  debounceTimer = setTimeout(() => {
    performSearch(query);
  }, 300);
};

const performSearch = async (query: string) => {
  isLoading.value = true;
  hasSearched.value = true;
  try {
    const [usersRes, placesRes] = await Promise.all([
      fetch(`/api/users/search?query=${encodeURIComponent(query)}`),
      fetch(`/api/places/search?query=${encodeURIComponent(query)}`),
    ]);

    if (usersRes.ok) resultsUsers.value = await usersRes.json();
    else resultsUsers.value = [];

    if (placesRes.ok) resultsPlaces.value = await placesRes.json();
    else resultsPlaces.value = [];
  } catch (error) {
    console.error("Search error:", error);
    resultsUsers.value = [];
    resultsPlaces.value = [];
  } finally {
    isLoading.value = false;
  }
};

const closePopup = () => {
  isActive.value = false;
  setTimeout(() => {
    emit("close");
  }, 300);
};

onMounted(async () => {
  // Add active class after mount for transition
  setTimeout(() => {
    isActive.value = true;
  }, 10);

  await nextTick();
  if (searchInput.value) {
    searchInput.value.focus();
  }
});

watch(searchQuery, handleInput);
</script>

<template>
  <div
    class="search-popup-overlay"
    :class="{ active: isActive }"
    @click.self="closePopup"
  >
    <div class="search-popup-content">
      <div class="search-popup-header">
        <h2>{{ t("search_popup.title") }}</h2>
        <button class="close-btn" @click="closePopup" aria-label="Close">
          &times;
        </button>
      </div>

      <div class="search-input-container">
        <img src="/images/search.png" class="search-icon" alt="Search" />
        <input
          type="text"
          class="search-input"
          :placeholder="t('search_popup.placeholder')"
          v-model="searchQuery"
          ref="searchInput"
          autofocus
        />
      </div>

      <div class="search-results-section">
        <!-- Initial State -->
        <div
          v-if="!hasSearched && searchQuery.trim().length === 0"
          class="no-results"
        >
          {{ t("search_popup.start_typing") }}
        </div>

        <!-- Type More State -->
        <div
          v-if="
            !hasSearched &&
            searchQuery.trim().length > 0 &&
            searchQuery.trim().length < 2
          "
          class="no-results"
        >
          {{ t("search_popup.type_more") }}
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="text-center py-3">
          <div class="spinner-border text-primary" role="status"></div>
        </div>

        <!-- Results -->
        <div v-else-if="hasSearched">
          <div
            v-if="resultsUsers.length === 0 && resultsPlaces.length === 0"
            class="no-results"
          >
            {{ t("search_popup.no_results") }}
          </div>

          <div v-if="resultsUsers.length > 0">
            <div class="section-title">{{ t("search_popup.users") }}</div>
            <a
              v-for="user in resultsUsers"
              :key="user.username"
              :href="`/user/${user.username}`"
              class="result-item"
            >
              <img
                :src="user.profilePicture || '/images/utenteDefault.png'"
                class="result-img"
                :alt="user.username"
              />
              <div class="result-info">
                <span class="result-name">{{ user.username }}</span>
              </div>
            </a>
          </div>

          <div v-if="resultsPlaces.length > 0">
            <div class="section-title">{{ t("search_popup.places") }}</div>
            <a
              v-for="place in resultsPlaces"
              :key="place._id"
              :href="`/map?placeId=${place._id}`"
              class="result-item"
            >
              <img
                src="/images/map.png"
                class="result-img"
                style="padding: 8px; background: #eee"
                :alt="place.name"
              />
              <div class="result-info">
                <span class="result-name">{{ place.name }}</span>
                <span class="result-sub">{{
                  place.sport ? place.sport.name : ""
                }}</span>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Search Popup Styles - Ported */

.search-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--overlay-bg, rgba(0, 0, 0, 0.5));
  z-index: 1050;
  display: none; /* Initially hidden, controlled by active class ? No, Vue controls rendering, wait.. original used display:none then flex. Here we use v-if in parent or display:flex here */
  /* Using display: flex directly as v-if controls mounting */
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 100px;
  backdrop-filter: blur(5px);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.search-popup-overlay.active {
  opacity: 1;
}

.search-popup-content {
  background: var(--bg-secondary, #fff);
  color: var(--text-primary, #000);
  padding: 24px;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  /* Animation handled by overlay opacity + transform here? */
  transform: translateY(-20px);
  transition: transform 0.3s ease-out;
}

.search-popup-overlay.active .search-popup-content {
  transform: translateY(0);
}

.search-popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.search-popup-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--text-primary, #000);
  font-weight: 700;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary, #666);
}

.search-input-container {
  position: relative;
  margin-bottom: 20px;
}

.search-input {
  width: 100%;
  padding: 12px 16px 12px 40px;
  border: 2px solid var(--border-color-light, #eee);
  border-radius: 12px;
  font-size: 16px;
  background-color: var(--input-bg, #f9f9f9);
  color: var(--text-primary, #000);
  transition: border-color 0.2s;
  outline: none;
}

.search-input:focus {
  border-color: var(--accent-primary, #fd7e14);
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  opacity: 0.5;
  filter: invert(var(--icon-invert, 0));
}

.search-results-section {
  margin-top: 10px;
  max-height: 400px;
  overflow-y: auto;
}

.section-title {
  font-size: 0.85rem;
  text-transform: uppercase;
  color: var(--text-muted, #6c757d);
  font-weight: 600;
  margin-bottom: 8px;
  margin-top: 16px;
}

.result-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: 8px;
  text-decoration: none;
  color: inherit;
  transition: background-color 0.2s;
  margin-bottom: 4px;
}

.result-item:hover {
  background-color: var(--bg-primary, #f8f9fa);
}

.result-img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 12px;
  object-fit: cover;
  border: 2px solid var(--border-color-light, #eee);
}

.result-info {
  flex-grow: 1;
}

.result-name {
  font-weight: 600;
  color: var(--text-primary, #000);
  display: block;
}

.result-sub {
  font-size: 0.85rem;
  color: var(--text-secondary, #666);
}

.no-results {
  text-align: center;
  color: var(--text-muted, #6c757d);
  padding: 20px;
  font-style: italic;
}

.text-center {
  text-align: center;
}
.py-3 {
  padding-top: 1rem;
  padding-bottom: 1rem;
}
.spinner-border {
  display: inline-block;
  width: 2rem;
  height: 2rem;
  vertical-align: text-bottom;
  border: 0.25em solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spinner-border 0.75s linear infinite;
  color: var(--accent-primary, #fd7e14);
}

@keyframes spinner-border {
  to {
    transform: rotate(360deg);
  }
}
</style>
