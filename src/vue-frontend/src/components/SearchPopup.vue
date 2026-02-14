<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import { RouterLink } from "vue-router";

const emit = defineEmits(["close"]);
const { t } = useI18n();

const isActive = ref(false);
const searchQuery = ref("");
const typeSearch = ref("");
const resultsUsers = ref<any[]>([]);
const resultsPlaces = ref<any[]>([]);
const isLoading = ref(false);
const hasSearched = ref(false);
const searchInput = ref<HTMLInputElement | null>(null);

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const handleInput = () => {
  if (debounceTimer) clearTimeout(debounceTimer);

  const query = searchQuery.value.trim();

  if (query.length < 2) {
    resultsUsers.value = [];
    resultsPlaces.value = [];
    hasSearched.value = false;
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
    const type = typeSearch.value.trim();

    const [usersRes, placesRes] = await Promise.all([
        fetch(`/api/users/search?query=${encodeURIComponent(query)}`),
        fetch(`/api/places/search?query=${encodeURIComponent(query)}`)
    ]);

    if (usersRes.ok) resultsUsers.value = await usersRes.json();
    else resultsUsers.value = [];

    if (placesRes.ok) resultsPlaces.value = await placesRes.json();
    else resultsPlaces.value = [];

    if(type=='user'){
      resultsPlaces.value = [];
    }else if(type=="place"){
      resultsUsers.value = [];
    }

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
  setTimeout(() => {
    isActive.value = true;
  }, 10);

  await nextTick();
  if (searchInput.value) {
    searchInput.value.focus();
  }
});

watch(searchQuery, handleInput);
watch(typeSearch, handleInput);
</script>

<template>
  <div
    class="modal-overlay"
    :class="{ active: isActive }"
    @click.self="closePopup"
  >
    <div class="modal-content">
      
      <div class="modal-header">
        <h2 class="modal-title">{{ t("search_popup.title") }}</h2>
        <button class="modal-close-btn" @click="closePopup" aria-label="Close">
          &times;
        </button>
      </div>

      <div class="modal-body">
        
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

        <div>
          <strong>{{ t("search_popup.placeholder") }}</strong>
           <select class="search-type form-select form-select-sm shadow-sm" v-model="typeSearch">
              <option value="all">{{ t("search_popup.all") }}</option>
              <option value="place">{{ t("search_popup.places") }}</option>
              <option value="user">{{ t("search_popup.users") }}</option>
          </select>
        </div>

        <div class="search-results-section">
          <div
            v-if="!hasSearched && searchQuery.trim().length === 0"
            class="no-results"
          >
            {{ t("search_popup.start_typing") }}
          </div>

          <div
            v-if="!hasSearched && searchQuery.trim().length > 0 && searchQuery.trim().length < 2"
            class="no-results"
          >
            {{ t("search_popup.type_more") }}
          </div>

          <div v-if="isLoading" class="text-center py-3">
            <div class="spinner-border text-primary" role="status"></div>
          </div>

          <div v-else-if="hasSearched">
            <div
              v-if="resultsUsers.length === 0 && resultsPlaces.length === 0"
              class="no-results"
            >
              {{ t("search_popup.no_results") }}
            </div>

            <div v-if="resultsUsers.length > 0">
              <div class="section-title">{{ t("search_popup.users") }}</div>
              <RouterLink
                v-for="user in resultsUsers"
                :key="user.username"
                :to="`/user/${user.username}`"
                class="result-item"
                @click="closePopup"
              >
                <img
                  :src="user.profilePicture || '/images/utenteDefault.png'"
                  class="result-img"
                  :alt="user.username"
                />
                <div class="result-info">
                  <span class="result-name">{{ user.username }}</span>
                </div>
              </RouterLink>
            </div>

            <div v-if="resultsPlaces.length > 0">
              <div class="section-title">{{ t("search_popup.places") }}</div>
              <RouterLink
                v-for="place in resultsPlaces"
                :key="place._id"
                :to="`/map?placeId=${place._id}`"
                class="result-item"
                @click="closePopup"
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
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  </div>
</template>

<style scoped src="@/assets/css/popup_shared.css"></style>
<style scoped src="@/assets/css/search_popup.css"></style>
<style scoped src="@/assets/css/style.css"></style>