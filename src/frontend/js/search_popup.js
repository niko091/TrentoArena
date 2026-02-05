class SearchPopup extends BasePopup {
    constructor() {
        super('search-popup');
        this.input = null;
        this.resultsContainer = null;
        this.debounceTimer = null;
    }

    init() {
        super.init();
        this.setTitle('Cerca');

        this.setBody(`
            <div class="search-input-container">
                <img src="/images/search.png" class="search-icon" alt="Search">
                <input type="text" id="popupSearchInput" class="popup-input search-input" placeholder="Cerca persone o luoghi..." autofocus>
            </div>

            <div class="search-results-section" id="popupSearchResults">
                <div class="no-results">Inizia a digitare per cercare...</div>
            </div>
        `);

        this.input = document.getElementById('popupSearchInput');
        this.resultsContainer = document.getElementById('popupSearchResults');

        if (this.input) {
            this.input.addEventListener('input', (e) => {
                this.handleInput(e.target.value);
            });
        }
    }

    show() {
        super.open();

        if (!this.input) this.input = document.getElementById('popupSearchInput');
        if (!this.resultsContainer) this.resultsContainer = document.getElementById('popupSearchResults');

        if (this.input) {
            this.input.value = '';
            // Focus with a small delay to handle transition
            setTimeout(() => this.input.focus(), 50);
        }

        if (this.resultsContainer) {
            this.resultsContainer.innerHTML = '<div class="no-results">Inizia a digitare per cercare...</div>';
        }
    }

    handleInput(query) {
        clearTimeout(this.debounceTimer);

        if (!this.resultsContainer) this.resultsContainer = document.getElementById('popupSearchResults');

        if (!this.resultsContainer) {
            console.error('SearchPopup: resultsContainer missing');
            return;
        }

        if (query.trim().length < 2) {
            this.resultsContainer.innerHTML = '<div class="no-results">Digita almeno 2 caratteri...</div>';
            return;
        }

        this.debounceTimer = setTimeout(() => this.performSearch(query.trim()), 300);
    }

    async performSearch(query) {
        if (!this.resultsContainer) return;

        this.resultsContainer.innerHTML = '<div class="text-center py-3"><div class="spinner-border text-primary" role="status"></div></div>';

        try {
            const [usersRes, placesRes] = await Promise.all([
                fetch(`/api/users/search?query=${encodeURIComponent(query)}`),
                fetch(`/api/places/search?query=${encodeURIComponent(query)}`)
            ]);

            const users = await usersRes.json();
            const places = await placesRes.json();

            this.renderResults(users, places);
        } catch (err) {
            console.error(err);
            this.resultsContainer.innerHTML = '<div class="text-danger text-center">Errore durante la ricerca</div>';
        }
    }

    renderResults(users, places) {
        if (!this.resultsContainer) return;

        if ((!users || users.length === 0) && (!places || places.length === 0)) {
            this.resultsContainer.innerHTML = '<div class="no-results">Nessun risultato trovato</div>';
            return;
        }

        let html = '';

        if (users && users.length > 0) {
            html += '<div class="section-title">Utenti</div>';
            users.forEach(user => {
                const pic = user.profilePicture ? user.profilePicture : '/images/utenteDefault.png';
                html += `
                    <a href="/user/${user.username}" class="result-item">
                        <img src="${pic}" class="result-img" alt="${user.username}">
                        <div class="result-info">
                            <span class="result-name">${user.username}</span>
                        </div>
                    </a>
                `;
            });
        }

        if (places && places.length > 0) {
            html += '<div class="section-title">Luoghi</div>';
            places.forEach(place => {
                const sportName = place.sport ? place.sport.name : '';
                html += `
                    <a href="/map?placeId=${place._id}" class="result-item">
                        <img src="/images/map.png" class="result-img" style="padding: 8px; background: #eee;" alt="${place.name}">
                        <div class="result-info">
                            <span class="result-name">${place.name}</span>
                            <span class="result-sub">${sportName}</span>
                        </div>
                    </a>
                `;
            });
        }

        this.resultsContainer.innerHTML = html;
    }
}

window.SearchPopupInstance = new SearchPopup();
