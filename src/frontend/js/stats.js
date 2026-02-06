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
    let allGames = [];

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

        allGames = await fetchData('/api/games?isFinished=true');

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

    // Filter games by relative time period
    function filterGamesByPeriod(games, period) {
        const now = new Date();
        return games.filter(game => {
            const gameDate = new Date(game.date);
            if (period === 'year') {
                const oneYearAgo = new Date();
                oneYearAgo.setFullYear(now.getFullYear() - 1);
                return gameDate >= oneYearAgo;
            } else if (period === 'month') {
                const oneMonthAgo = new Date();
                oneMonthAgo.setMonth(now.getMonth() - 1);
                return gameDate >= oneMonthAgo;
            }
            return true; // 'all'
        });
    }

    // Process Data for Charts
    function getGamesCountByDate(games, filterType, filterValue) {
        // Filter games
        const filtered = games.filter(g => {
            if (filterType === 'sport') {
                const sId = g.sport._id;
                return sId === filterValue;
            } else if (filterType === 'place') {
                const pId = g.place._id;
                return pId === filterValue;
            }
            return false;
        });

        // Sort by date ascending
        filtered.sort((a, b) => new Date(a.date) - new Date(b.date));

        const counts = {};
        filtered.forEach(g => {
            const dateObj = new Date(g.date);
            const dateStr = dateObj.toLocaleDateString('en-GB'); // DD/MM/YYYY
            counts[dateStr] = (counts[dateStr] || 0) + 1;
        });

        return counts;
    }

    // Update Sport Chart
    function updateSportChart() {
        const sportId = sportSelect.value;
        if (!sportId) return;

        const dataMap = getGamesCountByDate(allGames, 'sport', sportId);
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
    function updatePlaceChart() {
        const placeId = placeSelect.value;
        if (!placeId) return;

        const dataMap = getGamesCountByDate(allGames, 'place', placeId);
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
    function updateTopSports() {
        const period = topSportsPeriod.value;
        const filteredGames = filterGamesByPeriod(allGames, period);

        const counts = {};
        filteredGames.forEach(game => {
            const sportName = game.sport.name;
            counts[sportName] = (counts[sportName] || 0) + 1;
        });

        // Convert to array and sort
        const sortedSports = Object.entries(counts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10);

        topSportsList.innerHTML = '';
        sortedSports.forEach(([name, count], index) => {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            li.innerHTML = `
                <span><strong>#${index + 1}</strong> ${name}</span>
                <span class="badge bg-primary rounded-pill">${count}</span>
            `;
            topSportsList.appendChild(li);
        });
    }

    // Update Top Places Leaderboard
    function updateTopPlaces() {
        const period = topPlacesPeriod.value;
        const filteredGames = filterGamesByPeriod(allGames, period);

        const counts = {};
        filteredGames.forEach(game => {
            const placeName = game.place.name;
            counts[placeName] = (counts[placeName] || 0) + 1;
        });

        // Convert to array and sort
        const sortedPlaces = Object.entries(counts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10);

        topPlacesList.innerHTML = '';
        sortedPlaces.forEach(([name, count], index) => {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            li.innerHTML = `
                <span><strong>#${index + 1}</strong> ${name}</span>
                <span class="badge bg-primary rounded-pill">${count}</span>
            `;
            topPlacesList.appendChild(li);
        });
    }

    init();
});
