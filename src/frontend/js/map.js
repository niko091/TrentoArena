// Center on Trento
const map = L.map('map').setView([46.0697, 11.1211], 13);
const markersLayer = L.layerGroup().addTo(map);
let allPlaces = [];

const orangeIcon = L.icon({
    iconUrl: "./images/OrangeMarker.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
})

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// Add Filter Control
const filterControl = L.control({ position: 'topright' });
filterControl.onAdd = function (map) {
    const div = L.DomUtil.create('div', 'filter-control');
    div.innerHTML = `
                <select id="sportFilter" class="form-select">
                    <option value="">${window.i18n.t('map.all_sports')}</option>
                </select>
            `;
    // Prevent map clicks when interacting with the sort control
    L.DomEvent.disableClickPropagation(div);
    return div;
};
filterControl.addTo(map);

// Render markers
function renderMarkers(places) {
    markersLayer.clearLayers();
    places.forEach(place => {
        if (place.position && place.position.lat && place.position.lng) {
            const sportName = place.sport && place.sport.name ? place.sport.name : 'Unknown';
            const marker = L.marker([place.position.lat, place.position.lng], { icon: orangeIcon });
            marker.placeId = place._id; // Attach ID for lookup

            const popupContent = `
                        <div style="min-width: 200px;">
                            <h5 style="margin-bottom: 5px;">${place.name}</h5>
                            <p style="margin-bottom: 10px; color: #666;">Sport: <strong>${sportName}</strong></p>
                            <hr style="margin: 5px 0;">
                            <h6>${window.i18n.t('map.upcoming_games')}</h6>
                            <div id="games-list-${place._id}">
                                <small>${window.i18n.t('common.loading')}</small>
                            </div>
                        </div>
                    `;

            marker.bindPopup(popupContent);

            marker.on('popupopen', () => {
                fetchGamesForPlace(place._id);
            });

            marker.addTo(markersLayer);
        }
    });
}

async function fetchGamesForPlace(placeId) {
    const container = document.getElementById(`games-list-${placeId}`);
    if (!container) return;
    try {
        const today = new Date().toISOString();
        const response = await fetch(`/api/games?placeId=${placeId}&startDate=${today}&isFinished=false`);
        if (!response.ok) throw new Error('Failed to fetch games');

        const games = await response.json();

        if (games.length === 0) {
            container.innerHTML = `<small>${window.i18n.t('map.no_upcoming')}</small>`;
            return;
        }

        let html = '<ul style="padding-left: 20px; margin-bottom: 0;">';
        games.forEach(game => {
            const date = new Date(game.date);
            const dateStr = date.toLocaleDateString('it-IT');
            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const gameDataStr = JSON.stringify({
                sport: game.sport ? game.sport : 'Unknown',
                place: game.place ? game.place : 'Unknown',
                date: game.date,
                creator: game.creator,
                note: game.note,
                participants: game.participants,
                maxParticipants: game.maxParticipants,
                _id: game._id,
                isFinished: game.isFinished
            }).replace(/"/g, '&quot;'); // Escape quotes for HTML attribute

            html += `<li style="margin-bottom: 4px; cursor: pointer; color: #007bff;" 
                                 onclick="window.GameDetailsPopup.show(${gameDataStr})">
                        <span style="text-decoration: underline;"><strong>${dateStr}</strong> at ${timeStr}</span>
                    </li>`;
        });
        html += '</ul>';
        container.innerHTML = html;

    } catch (error) {
        console.error('Error fetching games:', error);
        container.innerHTML = `<small style="color: red;">${window.i18n.t('map.error_loading')}</small>`;
    }
}

//  </script>
//   <script>
// Populate filter options
function updateSportFilter(places) {
    const sports = new Set();
    places.forEach(place => {
        if (place.sport && place.sport.name) {
            sports.add(place.sport.name);
        }
    });

    const filter = document.getElementById('sportFilter');
    sports.forEach(sport => {
        const option = document.createElement('option');
        option.value = sport;
        option.textContent = sport;
        filter.appendChild(option);
    });

    // Add event listener
    filter.addEventListener('change', (e) => {
        const selectedSport = e.target.value;
        if (selectedSport) {
            const filteredPlaces = allPlaces.filter(p => p.sport && p.sport.name === selectedSport);
            renderMarkers(filteredPlaces);
        } else {
            renderMarkers(allPlaces);
        }
    });
}

// Fetch places and add markers
fetch('/api/places')
    .then(response => response.json())
    .then(places => {
        allPlaces = places;
        renderMarkers(allPlaces);
        updateSportFilter(allPlaces);

        // Check for placeId in URL
        const urlParams = new URLSearchParams(window.location.search);
        const placeId = urlParams.get('placeId');

        if (placeId) {
            const place = allPlaces.find(p => p._id === placeId);
            if (place && place.position) {
                map.setView([place.position.lat, place.position.lng], 16);
                markersLayer.eachLayer(layer => {
                    if (layer.placeId === placeId) {
                        layer.openPopup();
                    }
                });
            }
        }
    })
    .catch(error => console.error('Error fetching places:', error));