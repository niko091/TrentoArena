document.addEventListener('DOMContentLoaded', async () => {
    const topSportsPeriod = document.getElementById('topSportsPeriod');
    const topSportsList = document.getElementById('topSportsList');
    const topPlacesPeriod = document.getElementById('topPlacesPeriod');
    const topPlacesList = document.getElementById('topPlacesList');
    const sportSelect = document.getElementById('sportSelect');
    const placeSelect = document.getElementById('placeSelect');
    const sportCanvas = document.getElementById('sportChart');
    const placeCanvas = document.getElementById('placeChart');

    let sportChartInstance = null;
    let placeChartInstance = null;

    // Helper: Fetch JSON
    async function fetchData(url) {
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Failed to fetch ${url}`);
            return await res.json();
        } catch (err) {
            console.error(err);
            return [];
        }
    }

    // Initialize Dropdowns
    async function init() {
        const sports = await fetchData('/api/sports');
        sports.forEach(sport => {
            const option = document.createElement('option');
            option.value = sport._id;
            option.textContent = sport.name;
            sportSelect.appendChild(option);
        });

        const places = await fetchData('/api/places');
        places.forEach(place => {
            const option = document.createElement('option');
            option.value = place._id;
            option.textContent = place.name;
            placeSelect.appendChild(option);
        });

        // Listeners for Charts
        sportSelect.addEventListener('change', updateSportChart);
        placeSelect.addEventListener('change', updatePlaceChart);

        // Listeners for Leaderboards
        topSportsPeriod.addEventListener('change', updateTopSports);
        topPlacesPeriod.addEventListener('change', updateTopPlaces);

        // Trigger updates if values are already selected (e.g. on refresh)
        if (sportSelect.value) updateSportChart();
        if (placeSelect.value) updatePlaceChart();

        // Initial Leaderboard updates
        updateTopSports();
        updateTopPlaces();
    }

    // Update Sport Chart
    async function updateSportChart() {
        const sportId = sportSelect.value;
        if (!sportId) return;

        const dataMap = await fetchData(`/api/stats/chart-data?type=sport&id=${sportId}`);
        const labels = Object.keys(dataMap);
        const dataPoints = Object.values(dataMap);

        if (sportChartInstance) {
            sportChartInstance.destroy();
        }

        const sportName = sportSelect.options[sportSelect.selectedIndex].text;

        sportChartInstance = new Chart(sportCanvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: `Games Played: ${sportName}`,
                    data: dataPoints,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.4)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    // Update Place Chart
    async function updatePlaceChart() {
        const placeId = placeSelect.value;
        if (!placeId) return;

        const dataMap = await fetchData(`/api/stats/chart-data?type=place&id=${placeId}`);
        const labels = Object.keys(dataMap);
        const dataPoints = Object.values(dataMap);

        if (placeChartInstance) {
            placeChartInstance.destroy();
        }

        const placeName = placeSelect.options[placeSelect.selectedIndex].text;

        placeChartInstance = new Chart(placeCanvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: `Games Played at: ${placeName}`,
                    data: dataPoints,
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 0.4)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    // Update Top Sports Leaderboard
    async function updateTopSports() {
        const period = topSportsPeriod.value;
        const topSports = await fetchData(`/api/stats/top-entities?type=sport&period=${period}`);

        topSportsList.innerHTML = '';
        topSports.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            li.innerHTML = `
                <span><strong>#${index + 1}</strong> ${item.name}</span>
                <span class="badge bg-primary rounded-pill">${item.count}</span>
            `;
            topSportsList.appendChild(li);
        });
    }

    // Update Top Places Leaderboard
    async function updateTopPlaces() {
        const period = topPlacesPeriod.value;
        const topPlaces = await fetchData(`/api/stats/top-entities?type=place&period=${period}`);

        topPlacesList.innerHTML = '';
        topPlaces.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            li.innerHTML = `
                <span><strong>#${index + 1}</strong> ${item.name}</span>
                <span class="badge bg-primary rounded-pill">${item.count}</span>
            `;
            topPlacesList.appendChild(li);
        });
    }

    init();
});
