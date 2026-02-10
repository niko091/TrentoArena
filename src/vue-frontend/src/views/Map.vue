<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import GamePopup from '../components/GamePopup.vue';
import { IUserShared } from '@shared/types/User';

// Define interface for Place (matching backend/frontend structure)
import { IPlaceShared } from '@shared/types/Place';

// Use shared type instead
type Place = IPlaceShared;

// State
const mapContainer = ref<HTMLElement | null>(null);
const map = ref<L.Map | null>(null);
const markersLayer = ref<L.LayerGroup | null>(null);
// const filterControl = ref<L.Control | null>(null); // We'll create this via L.control
const allPlaces = ref<Place[]>([]);
const currentUser = ref<IUserShared | null>(null);

// Game Popup State
const selectedGame = ref<any>(null);
const showGamePopup = ref(false);

const orangeIcon = L.icon({
    iconUrl: "/images/OrangeMarker.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});


// Helper to get translations
// Helper to get translations
const { t } = useI18n();

// Fetch current user (needed for GamePopup logic)
async function fetchCurrentUser() {
    try {
        const res = await fetch('/auth/current_user');
        if (res.ok) {
            currentUser.value = await res.json();
        }
    } catch (e) {
        console.error("Error fetching user:", e);
    }
}

// Fetch places
async function fetchPlaces() {
    try {
        const response = await fetch('/api/places');
        if (!response.ok) throw new Error('Failed to fetch places');
        allPlaces.value = await response.json();
        renderMarkers(allPlaces.value);
        updateSportFilter(allPlaces.value);
        
        // Check for placeId in URL
        const urlParams = new URLSearchParams(window.location.search);
        const placeId = urlParams.get('placeId');

        if (placeId && map.value) {
            const place = allPlaces.value.find(p => p._id === placeId);
            if (place && place.position) {
                map.value.setView([place.position.lat, place.position.lng], 16);
                markersLayer.value?.eachLayer((layer: any) => {
                    if (layer.placeId === placeId) {
                        layer.openPopup();
                    }
                });
            }
        }

    } catch (error) {
        console.error('Error fetching places:', error);
    }
}

// Render markers
function renderMarkers(places: Place[]) {
    if (!markersLayer.value || !map.value) return;
    markersLayer.value.clearLayers();

    places.forEach(place => {
        if (place.position && place.position.lat && place.position.lng) {
            const sportName = place.sport && place.sport.name ? place.sport.name : 'Unknown';
            const marker = L.marker([place.position.lat, place.position.lng], { icon: orangeIcon });
            (marker as any).placeId = place._id; // Attach ID for lookup

             const popupContent = `
                        <div style="min-width: 200px;">
                            <h5 style="margin-bottom: 5px;">${place.name}</h5>
                            <p style="margin-bottom: 10px; color: #666;">Sport: <strong>${sportName}</strong></p>
                            <hr style="margin: 5px 0;">
                            <h6>${t('map.upcoming_games')}</h6>
                            <div id="games-list-${place._id}">
                                <small>${t('common.loading')}</small>
                            </div>
                        </div>
                    `;

            marker.bindPopup(popupContent);

            marker.on('popupopen', () => {
                fetchGamesForPlace(place._id);
            });

            marker.addTo(markersLayer.value as any);
        }
    });
}

// Fetch games for a place (triggered when popup opens)
async function fetchGamesForPlace(placeId: string) {
    const container = document.getElementById(`games-list-${placeId}`);
    if (!container) return; // Should not happen if popup is open

    try {
        const today = new Date().toISOString();
        const response = await fetch(`/api/games?placeId=${placeId}&startDate=${today}&isFinished=false`);
        if (!response.ok) throw new Error('Failed to fetch games');

        const games = await response.json();

        if (games.length === 0) {
            container.innerHTML = `<small>${t('map.no_upcoming')}</small>`;
            return;
        }

        let html = '<ul style="padding-left: 20px; margin-bottom: 0;">';
        games.forEach((game: any) => {
            const date = new Date(game.date);
            const dateStr = date.toLocaleDateString('it-IT');
            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            // We need to pass the game ID to open the popup.
            // Since we can't easily pass complex objects via string in onclick to a global function without escaping hell,
            // we'll store the game temporarily or just pass the ID and fetch it? 
            // Actually, the original code passed the whole game object. 
            // Let's attach the game data to a global registry or just pass the ID and let Vue handle it.
            // BETTER APPROACH: Use a data attribute and a global click handler.
            // BUT simpler for now to match original: call a global function with the game object stringified.
            
            // To avoid escaping issues, let's just use the ID and fetch details? No, we have the details here.
            // Let's use the same approach as original: stringify
            const gameDataStr = JSON.stringify(game).replace(/"/g, '&quot;');
            
            html += `<li style="margin-bottom: 4px; cursor: pointer; color: #007bff;" 
                                 onclick="window.openGamePopup(${gameDataStr})">
                        <span style="text-decoration: underline;"><strong>${dateStr}</strong> at ${timeStr}</span>
                    </li>`;
        });
        html += '</ul>';
        container.innerHTML = html;

    } catch (error) {
        console.error('Error fetching games:', error);
        container.innerHTML = `<small style="color: red;">${t('map.error_loading')}</small>`;
    }
}

// Initialize Custom Filter Control
function initFilterControl() {
    if (!map.value) return;

    const FilterControl = L.Control.extend({
        onAdd: function() {
            const div = L.DomUtil.create('div', 'filter-control');
            div.innerHTML = `
                <select id="sportFilter" class="form-select">
                    <option value="">${t('map.all_sports')}</option>
                </select>
            `;
            L.DomEvent.disableClickPropagation(div);
            return div;
        }
    });

    const filterControl = new FilterControl({ position: 'topright' });
    filterControl.addTo(map.value as any);
}

// Populate filter options
function updateSportFilter(places: Place[]) {
    const sports = new Set<string>();
    places.forEach(place => {
        if (place.sport && place.sport.name) {
            sports.add(place.sport.name);
        }
    });

    const filter = document.getElementById('sportFilter') as HTMLSelectElement;
    if (!filter) return; // Might happen if map control not yet added or DOM issue
    
    // Clear existing options except first
    while (filter.options.length > 1) {
        filter.remove(1);
    }

    sports.forEach(sport => {
        const option = document.createElement('option');
        option.value = sport;
        option.textContent = sport;
        filter.appendChild(option);
    });

    // Re-attach event listener (or just ensure it's handled - but since we recreate innerHTML...)
    // Actually we recreated innerHTML in onAdd, updateSportFilter should attach listener if not present?
    // It's safer to attach it here if we can find the element.
    
    filter.onchange = (e: Event) => {
        const target = e.target as HTMLSelectElement;
        const selectedSport = target.value;
        if (selectedSport) {
            const filteredPlaces = allPlaces.value.filter(p => p.sport && p.sport.name === selectedSport);
            renderMarkers(filteredPlaces);
        } else {
            renderMarkers(allPlaces.value);
        }
    };
}


// Setup global function for popup
onMounted(() => {
    fetchCurrentUser();

    if (mapContainer.value) {
        // Initialize Map
        map.value = L.map(mapContainer.value).setView([46.0697, 11.1211], 13);
        
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map.value as any);

        markersLayer.value = L.layerGroup().addTo(map.value as any);

        initFilterControl();
        fetchPlaces();
    }

    // Expose openGamePopup to window
    (window as any).openGamePopup = (game: any) => {
        selectedGame.value = game;
        showGamePopup.value = true;
    };
});

onUnmounted(() => {
    delete (window as any).openGamePopup; // Clean up
    if (map.value) {
        map.value.remove();
        map.value = null;
    }
});

function handlePopupClose() {
    showGamePopup.value = false;
    selectedGame.value = null;
}

function handlePopupRefresh() {
    fetchPlaces();
}

</script>

<template>
    <div class="map-container">
        <div id="map" ref="mapContainer"></div>
        
        <!-- Game Details Popup -->
        <Teleport to="body">
            <GamePopup 
                v-if="showGamePopup" 
                :game="selectedGame" 
                :currentUser="currentUser"
                @close="handlePopupClose"
                @refresh="handlePopupRefresh"
            />
        </Teleport>
    </div>
</template>

<style>
/* Global styles for Leaflet map elements */
#map {
    height: 100vh;
    width: 100%;
}

.filter-control {
    background-color: var(--card-bg, #fff);
    color: var(--text-primary, #000);
    padding: 10px;
    border-radius: 5px;
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
    min-width: 200px;
}

/* Dark mode overrides for filter control */
[data-bs-theme="dark"] .filter-control {
    background-color: #2b3035;
    color: #fff;
}
</style>
