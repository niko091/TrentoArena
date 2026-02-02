class GameCreationPopup {
    constructor() {
        this.overlay = null;
        this.allPlaces = [];
        this.init();
    }

    init() {
        // Check if popup already exists
        if (document.querySelector('.game-creation-popup-overlay')) {
            this.overlay = document.querySelector('.game-creation-popup-overlay');
            return;
        }

        // Create popup DOM structure
        this.overlay = document.createElement('div');
        this.overlay.className = 'game-creation-popup-overlay';
        this.overlay.innerHTML = `
            <div class="game-creation-popup-content">
                <button class="game-creation-popup-close">&times;</button>
                <div class="game-creation-popup-header">
                    <h2 class="game-creation-popup-title">Crea Partita</h2>
                </div>
                <div class="game-creation-popup-body">
                    <div class="form-group">
                        <strong for="popupInputSport">Sport</strong>
                        <select id="popupInputSport" class="form-control">
                            <option selected>Choose...</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <strong for="popupInputMap">Luogo</strong>
                        <select id="popupInputMap" class="form-control">
                            <option selected>Choose...</option>
                        </select>
                    </div>

                    <div class="containerTimeInput">
                        <div class="form-group">
                            <strong for="popupDateInput">Data</strong>
                            <input type="date" class="form-control" id="popupDateInput">
                        </div>

                        <div class="form-group">
                            <strong for="popupTimeInput">Orario</strong>
                            <input type="time" class="form-control" id="popupTimeInput">
                        </div>
                    </div>

                    <div class="form-group">
                        <strong for="popupInputNote">Note</strong>
                        <textarea class="form-control" id="popupInputNote" rows="3"></textarea>
                    </div>

                    <div class="form-group mt-4" style="text-align: center;">
                        <button type="button" class="btn btn-primary" id="popupCreateBtn">Create Game</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.overlay);

        // Event listeners
        this.overlay.querySelector('.game-creation-popup-close').addEventListener('click', () => this.hide());
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.hide();
            }
        });

        this.overlay.querySelector('#popupInputSport').addEventListener('change', (e) => this.filterPlacesBySport(e));
        this.overlay.querySelector('#popupCreateBtn').addEventListener('click', () => this.createGame());
    }

    async show() {
        // Load data if empty
        const sportSelect = document.getElementById('popupInputSport');
        if (sportSelect.options.length <= 1) { // Only "Choose..."
            await this.loadSports();
        }

        if (this.allPlaces.length === 0) {
            await this.loadPlaces();
        }

        // Timeout to allow DOM to update before adding active class for animation
        setTimeout(() => {
            this.overlay.classList.add('active');
        }, 10);
    }

    hide() {
        this.overlay.classList.remove('active');
        // Optional: clear form
    }

    async loadSports() {
        try {
            const response = await fetch('/api/sports');
            if (!response.ok) throw new Error('Failed to fetch sports');
            const sports = await response.json();

            const sportSelect = document.getElementById('popupInputSport');
            sportSelect.innerHTML = '<option selected>Choose...</option>';

            sports.forEach(sport => {
                const option = document.createElement('option');
                option.value = sport._id;
                option.textContent = sport.name;
                sportSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading sports:', error);
        }
    }

    async loadPlaces() {
        try {
            const response = await fetch('/api/places');
            if (!response.ok) throw new Error('Failed to fetch places');
            this.allPlaces = await response.json();
            this.renderPlaces(this.allPlaces);
        } catch (error) {
            console.error('Error loading places:', error);
        }
    }

    renderPlaces(places) {
        const placeSelect = document.getElementById('popupInputMap');
        placeSelect.innerHTML = '<option selected>Choose...</option>';

        places.forEach(place => {
            const option = document.createElement('option');
            option.value = place._id;
            option.textContent = place.name;
            placeSelect.appendChild(option);
        });
    }

    filterPlacesBySport(event) {
        const selectedSportId = event.target.value;

        if (selectedSportId === 'Choose...') {
            this.renderPlaces(this.allPlaces);
        } else {
            const filteredPlaces = this.allPlaces.filter(place =>
                place.sport && place.sport._id === selectedSportId
            );
            this.renderPlaces(filteredPlaces);
        }
    }

    async createGame() {
        const sportId = document.getElementById('popupInputSport').value;
        const placeId = document.getElementById('popupInputMap').value;
        const date = document.getElementById('popupDateInput').value;
        const time = document.getElementById('popupTimeInput').value;
        const note = document.getElementById('popupInputNote').value;

        if (sportId === 'Choose...' || !sportId) {
            alert('Please select a Sport.');
            return;
        }
        if (placeId === 'Choose...' || !placeId) {
            alert('Please select a Place.');
            return;
        }
        if (!date) {
            alert('Please select a Date.');
            return;
        }
        if (!time) {
            alert('Please select a Time.');
            return;
        }

        const payload = {
            sportId,
            placeId,
            date,
            time,
            note
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
                alert('Game created successfully!');
                this.hide();
                // Optional: Trigger a refresh of games on the map if possible
                // e.g. window.dispatchEvent(new CustomEvent('gameCreated'));
            } else {
                const error = await response.json();
                alert('Error creating game: ' + (error.message || 'Unknown error'));
            }
        } catch (err) {
            console.error('Network error:', err);
            alert('Failed to connect to server.');
        }
    }
}

// Make it available globally
window.GameCreationPopup = new GameCreationPopup();
