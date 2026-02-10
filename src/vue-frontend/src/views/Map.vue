<script setup lang="ts">
import { 
    ref, 
    onMounted, 
    onUnmounted, 
    shallowRef, 
    nextTick, 
    h, 
    render, 
    getCurrentInstance 
} from 'vue';
import { useI18n } from 'vue-i18n';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import '@/assets/css/map.css';
import GamePopup from '../components/GamePopup.vue';
import MapMarkerPopup from '../components/MapMarkerPopup.vue';
import { IUserShared } from '@shared/types/User';
import { IPlaceShared } from '@shared/types/Place';

type Place = IPlaceShared;


const mapContainer = ref<HTMLElement | null>(null);
const map = shallowRef<L.Map | null>(null);
const markersLayer = shallowRef<L.LayerGroup | null>(null);
const allPlaces = ref<Place[]>([]);
const currentUser = ref<IUserShared | null>(null);
const appInstance = getCurrentInstance();
const selectedGame = ref<any>(null);
const showGamePopup = ref(false);
const { t } = useI18n();

let resizeObserver: ResizeObserver | null = null;

const orangeIcon = L.icon({
    iconUrl: "/images/OrangeMarker.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});


async function fetchCurrentUser() {
    try {
        const res = await fetch('/auth/current_user');
        if (res.ok) currentUser.value = await res.json();
    } catch (e) {
        console.error("Error fetching user:", e);
    }
}

async function fetchPlaces() {
    try {
        const response = await fetch('/api/places');
        if (!response.ok) throw new Error('Failed to fetch places');
        allPlaces.value = await response.json();
        
        renderMarkers(allPlaces.value);
        updateSportFilter(allPlaces.value);
        
        const urlParams = new URLSearchParams(window.location.search);
        const placeId = urlParams.get('placeId');

        if (placeId && map.value) {
            const place = allPlaces.value.find(p => p._id === placeId);
            if (place && place.position) {
                map.value.setView([place.position.lat, place.position.lng], 16);
                setTimeout(() => {
                    markersLayer.value?.eachLayer((layer: any) => {
                        if (layer.placeId === placeId) layer.openPopup();
                    });
                }, 100);
            }
        }
    } catch (error) {
        console.error('Error fetching places:', error);
    }
}


function renderMarkers(places: Place[]) {
    if (!markersLayer.value || !map.value) return;
    markersLayer.value.clearLayers();

    places.forEach(place => {
        if (place.position?.lat && place.position?.lng) {
            let marker = L.marker([place.position.lat, place.position.lng], { icon: orangeIcon });
            (marker as any).placeId = place._id;

            const popupDiv = document.createElement('div');
            const vnode = h(MapMarkerPopup, {
                place: place,
                onSelectGame: (game: any) => {
                    selectedGame.value = game;
                    showGamePopup.value = true;
                }
            });

            if (appInstance) vnode.appContext = appInstance.appContext;

            render(vnode, popupDiv);

            marker.bindPopup(popupDiv, {
                minWidth: 240,
                className: 'custom-vue-popup'
            });

            marker.addTo(markersLayer.value as any);
        }
    });
}

function initFilterControl() {
    if (!map.value) return;

    const FilterControl = L.Control.extend({
        onAdd: function() {
            const div = L.DomUtil.create('div', 'filter-control-wrapper');
            L.DomEvent.disableClickPropagation(div);
            L.DomEvent.disableScrollPropagation(div);
            div.innerHTML = `
                <select id="sportFilter" class="form-select form-select-sm shadow-sm" style="width: auto; min-width: 160px; cursor: pointer;">
                    <option value="">${t('map.all_sports')}</option>
                </select>
            `;
            return div;
        }
    });

    const filterControl = new FilterControl({ position: 'topright' });
    filterControl.addTo(map.value as any);
}

function updateSportFilter(places: Place[]) {
    nextTick(() => {
        const filter = document.getElementById('sportFilter') as HTMLSelectElement;
        if (!filter) return;

        const sports = new Set<string>();
        places.forEach(place => {
            if (place.sport && place.sport.name) sports.add(place.sport.name);
        });

        const currentVal = filter.value;
        while (filter.options.length > 1) filter.remove(1);

        sports.forEach(sport => {
            const option = document.createElement('option');
            option.value = sport;
            option.textContent = sport;
            filter.appendChild(option);
        });

        if (currentVal && sports.has(currentVal)) filter.value = currentVal;

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
    });
}


onMounted(() => {
    fetchCurrentUser();

    if (mapContainer.value) {
        map.value = L.map(mapContainer.value, { zoomControl: false }).setView([46.0697, 11.1211], 13);
        L.control.zoom({ position: 'bottomright' }).addTo(map.value as any);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap'
        }).addTo(map.value as any);

        markersLayer.value = L.layerGroup().addTo(map.value as any);

        resizeObserver = new ResizeObserver(() => {
            if (map.value) map.value.invalidateSize();
        });
        resizeObserver.observe(mapContainer.value);

        initFilterControl();
        fetchPlaces();
    }
});

onUnmounted(() => {
    if (resizeObserver && mapContainer.value) resizeObserver.unobserve(mapContainer.value);
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
    <div class="page-container">
        <div id="map" ref="mapContainer"></div>
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