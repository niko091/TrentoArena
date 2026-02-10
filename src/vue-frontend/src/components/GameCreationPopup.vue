<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const emit = defineEmits(['close', 'created']);
const { t } = useI18n();

const isActive = ref(false);
const sports = ref<any[]>([]);
const places = ref<any[]>([]);
const filteredPlaces = ref<any[]>([]);

const form = ref({
    sportId: 'Choose...',
    placeId: 'Choose...',
    date: '',
    time: '',
    note: '',
    maxParticipants: 10
});

// Load Sports
const loadSports = async () => {
    try {
        const response = await fetch('/api/sports');
        if (!response.ok) throw new Error('Failed to fetch sports');
        sports.value = await response.json();
    } catch (error) {
        console.error('Error loading sports:', error);
    }
};

// Load Places
const loadPlaces = async () => {
    try {
        const response = await fetch('/api/places');
        if (!response.ok) throw new Error('Failed to fetch places');
        places.value = await response.json();
        filteredPlaces.value = places.value;
    } catch (error) {
        console.error('Error loading places:', error);
    }
};

// Filter Places
const filterPlacesBySport = () => {
    if (form.value.sportId === 'Choose...') {
        filteredPlaces.value = places.value;
    } else {
        filteredPlaces.value = places.value.filter(place => 
            place.sport && place.sport._id === form.value.sportId
        );
    }
    // Reset to Choose... if the current place is not in the filtered list
    const isCurrentPlaceInList = filteredPlaces.value.some(p => p._id === form.value.placeId);
    if (!isCurrentPlaceInList) {
        form.value.placeId = 'Choose...';
    }
};

watch(() => form.value.sportId, filterPlacesBySport);

// Create Game
const createGame = async () => {
    if (form.value.sportId === 'Choose...' || !form.value.sportId) {
        alert(t('game_creation.error_sport'));
        return;
    }
    if (form.value.placeId === 'Choose...' || !form.value.placeId) {
        alert(t('game_creation.error_place'));
        return;
    }
    if (!form.value.date) {
        alert(t('game_creation.error_date'));
        return;
    }
    if (!form.value.time) {
        alert(t('game_creation.error_time'));
        return;
    }
    if (!form.value.maxParticipants || form.value.maxParticipants < 2) {
        alert(t('game_creation.error_participants'));
        return;
    }

    const payload = {
        sportId: form.value.sportId,
        placeId: form.value.placeId,
        date: form.value.date,
        time: form.value.time,
        note: form.value.note,
        maxParticipants: parseInt(form.value.maxParticipants as any)
    };

    try {
        const response = await fetch('/api/games', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert(t('game_creation.success'));
            closePopup();
            emit('created');
        } else {
            const error = await response.json();
            alert(t('common.error_generic') + ': ' + (error.message || 'Unknown error'));
        }
    } catch (err) {
        console.error('Network error:', err);
        alert(t('game_popup.connection_error'));
    }
};

const closePopup = () => {
    isActive.value = false;
    setTimeout(() => {
        emit('close');
    }, 300);
};

onMounted(async () => {
    // Add active class after mount for transition
    setTimeout(() => {
        isActive.value = true;
    }, 10);

    await loadSports();
    await loadPlaces();
});

</script>

<template>
    <div class="game-creation-popup-overlay" :class="{ 'active': isActive }" @click.self="closePopup">
        <div class="game-creation-popup-content">
            <button class="game-creation-popup-close" aria-label="Close" @click="closePopup">&times;</button>
            
            <div class="game-creation-popup-header">
                <h2 class="game-creation-popup-title">{{ t('game_creation.title') }}</h2>
            </div>

            <div class="game-creation-popup-body">
                <div class="popup-form-group form-group">
                    <label class="popup-label" for="popupInputSport">{{ t('admin.sport') }}</label>
                    <select id="popupInputSport" class="popup-select form-control" v-model="form.sportId">
                        <option selected>Choose...</option>
                        <option v-for="sport in sports" :key="sport._id" :value="sport._id">{{ sport.name }}</option>
                    </select>
                </div>

                <div class="popup-form-group form-group">
                    <label class="popup-label" for="popupInputMap">{{ t('game_popup.place') }}</label>
                    <select id="popupInputMap" class="popup-select form-control" v-model="form.placeId">
                        <option selected>Choose...</option>
                        <option v-for="place in filteredPlaces" :key="place._id" :value="place._id">{{ place.name }}</option>
                    </select>
                </div>

                <div style="display: flex; gap: 1rem;" class="containerTimeInput">
                    <div class="popup-form-group form-group" style="flex: 1;">
                        <label class="popup-label" for="popupDateInput">{{ t('admin.table_date') }}</label>
                        <input type="date" class="popup-input form-control" id="popupDateInput" v-model="form.date">
                    </div>

                    <div class="popup-form-group form-group" style="flex: 1;">
                        <label class="popup-label" for="popupTimeInput">{{ t('admin.table_time') }}</label>
                        <input type="time" class="popup-input form-control" id="popupTimeInput" v-model="form.time">
                    </div>
                </div>

                <div class="popup-form-group form-group">
                    <label class="popup-label" for="popupInputNote">{{ t('admin.table_note') }}</label>
                    <textarea class="popup-textarea form-control" id="popupInputNote" rows="3" v-model="form.note"></textarea>
                </div>

                <div class="popup-form-group form-group">
                    <label class="popup-label" for="popupMaxParticipants">{{ t('game_creation.max_participants') }}</label>
                    <input type="number" class="popup-input form-control" id="popupMaxParticipants" v-model="form.maxParticipants" min="2">
                </div>

                <div class="popup-actions" style="justify-content: center; margin-top: 1.5rem; display: flex;">
                    <button type="button" class="btn btn-primary" id="popupCreateBtn" style="padding: 10px 30px;" @click="createGame">{{ t('game_creation.submit') }}</button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Game Creation Popup Styles - Ported */

.game-creation-popup-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: var(--overlay-bg, rgba(0, 0, 0, 0.5));
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s ease, visibility 0.3s ease;
    backdrop-filter: blur(5px);
}

.game-creation-popup-overlay.active {
    opacity: 1;
    visibility: visible;
}

.game-creation-popup-content {
    background: var(--bg-secondary, #fff);
    color: var(--text-primary, #000);
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    width: 90%;
    max-width: 600px;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
    transform: translateY(20px);
    transition: transform 0.3s ease;
}

.game-creation-popup-overlay.active .game-creation-popup-content {
    transform: translateY(0);
}

.game-creation-popup-close {
    position: absolute;
    top: 15px;
    right: 15px;
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--text-secondary, #666);
    transition: color 0.2s;
}

.game-creation-popup-close:hover {
    color: var(--text-primary, #000);
}

.game-creation-popup-header {
    margin-bottom: 1.5rem;
    border-bottom: 1px solid var(--border-color-light, #eee);
    padding-bottom: 1rem;
}

.game-creation-popup-title {
    font-size: 1.5rem;
    font-weight: bold;
    color: var(--text-primary, #000);
    margin: 0;
}

.game-creation-popup-body {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

/* Form Styles */
.form-group {
    margin-bottom: 1rem;
}

/* Match original CSS - .form-group strong selector was in original, but labels here use label tag */
/* Using .popup-label to match intent if not exact selector */
.popup-label {
    display: block;
    margin-bottom: 0.5rem;
    color: var(--text-secondary, #666);
    font-weight: bold;
}

.form-control {
    width: 100%;
    padding: 0.375rem 0.75rem;
    font-size: 1rem;
    font-weight: 400;
    line-height: 1.5;
    color: var(--text-primary, #000);
    background-color: var(--input-bg, #fff);
    background-clip: padding-box;
    border: 1px solid var(--input-border, #ccc);
    border-radius: 0.375rem;
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-control:focus {
    color: var(--text-primary, #000);
    background-color: var(--input-bg, #fff);
    border-color: var(--input-focus-border, #80bdff);
    outline: 0;
    box-shadow: 0 0 0 0.25rem var(--input-focus-shadow, rgba(0, 123, 255, 0.25));
}

.containerTimeInput {
    display: flex;
    gap: 1rem;
    /* Better gap handling */
}

.containerTimeInput .form-group {
    flex: 1;
}

.btn-primary {
    color: var(--text-inverse, #fff);
    background-color: var(--accent-primary, #fd7e14);
    /* Orange to match navbar */
    border-color: var(--accent-primary, #fd7e14);
    display: inline-block;
    font-weight: 400;
    line-height: 1.5;
    text-align: center;
    text-decoration: none;
    vertical-align: middle;
    cursor: pointer;
    user-select: none;
    padding: 0.375rem 0.75rem;
    font-size: 1rem;
    border-radius: 0.375rem;
    transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
    border-style: solid;
    border-width: 1px;
}

.btn-primary:hover {
    background-color: var(--accent-secondary, #e67012);
    /* Darker orange for hover */
    border-color: var(--accent-secondary, #e67012);
}

/* Dark mode support if variables are not set globally */

</style>
