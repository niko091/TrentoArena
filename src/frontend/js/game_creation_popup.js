class GameCreationPopup extends BasePopup {
    constructor() {
        super('game-creation-popup');
        this.allPlaces = [];
    }

    init() {
        super.init();
        this.setTitle('Crea Partita');

        this.setBody(`
            <div class="popup-form-group">
                <label class="popup-label" for="popupInputSport">Sport</label>
                <select id="popupInputSport" class="popup-select">
                    <option selected>Choose...</option>
                </select>
            </div>

            <div class="popup-form-group">
                <label class="popup-label" for="popupInputMap">Luogo</label>
                <select id="popupInputMap" class="popup-select">
                    <option selected>Choose...</option>
                </select>
            </div>

            <div style="display: flex; gap: 1rem;">
                <div class="popup-form-group" style="flex: 1;">
                    <label class="popup-label" for="popupDateInput">Data</label>
                    <input type="date" class="popup-input" id="popupDateInput">
                </div>

                <div class="popup-form-group" style="flex: 1;">
                    <label class="popup-label" for="popupTimeInput">Orario</label>
                    <input type="time" class="popup-input" id="popupTimeInput">
                </div>
            </div>

            <div class="popup-form-group">
                <label class="popup-label" for="popupInputNote">Note</label>
                <textarea class="popup-textarea" id="popupInputNote" rows="3"></textarea>
            </div>

            <div class="popup-form-group">
                <label class="popup-label" for="popupMaxParticipants">Max Partecipanti</label>
                <input type="number" class="popup-input" id="popupMaxParticipants" value="10" min="2">
            </div>

            <div class="popup-actions" style="justify-content: center; margin-top: 1.5rem;">
                <button type="button" class="btn btn-primary" id="popupCreateBtn" style="padding: 10px 30px;">Create Game</button>
            </div>
        `);

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

        this.open();
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
        const maxParticipants = document.getElementById('popupMaxParticipants').value;

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
        if (!maxParticipants || maxParticipants < 2) {
            alert('Max participants must be at least 2.');
            return;
        }

        const payload = {
            sportId,
            placeId,
            date,
            time,
            note,
            maxParticipants: parseInt(maxParticipants)
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
                this.close();
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
