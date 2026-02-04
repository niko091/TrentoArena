class SearchPopup {
    constructor() {
        this.overlay = null;
        this.input = null;
        this.resultsContainer = null;
        this.debounceTimer = null;
    }

    create() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'search-popup-overlay';
        this.overlay.onclick = (e) => {
            if (e.target === this.overlay) this.close();
        };

        this.overlay.innerHTML = `
            <div class="search-popup-content">
                <div class="search-popup-header">
                    <h2>Cerca</h2>
                    <button type="button" class="btn-close" onclick="window.SearchPopupInstance.close()"></button>
                </div>
                
                <div class="search-input-container">
                    <img src="/images/search.png" class="search-icon" alt="">
                    <input type="text" class="search-input" placeholder="Cerca persone o luoghi..." autofocus>
                </div>

                <div class="search-results-section" id="searchResults">
                    <div class="no-results">Inizia a digitare per cercare...</div>
                </div>
            </div>
        `;

        document.body.appendChild(this.overlay);

        this.input = this.overlay.querySelector('.search-input');
        this.resultsContainer = this.overlay.querySelector('#searchResults');

        this.input.addEventListener('input', (e) => this.handleInput(e.target.value));
    }

    show() {
        if (!this.overlay) {
            this.create();
        }
        this.overlay.style.display = 'flex';
        this.input.value = '';
        this.resultsContainer.innerHTML = '<div class="no-results">Inizia a digitare per cercare...</div>';
        setTimeout(() => this.input.focus(), 50);
    }

    close() {
        if (this.overlay) {
            this.overlay.style.display = 'none';
        }
    }

    handleInput(query) {
        clearTimeout(this.debounceTimer);

        if (query.length < 2) {
            this.resultsContainer.innerHTML = '<div class="no-results">Digita almeno 2 caratteri...</div>';
            return;
        }

        this.debounceTimer = setTimeout(() => this.performSearch(query), 300);
    }

    async performSearch(query) {
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
        if ((!users || users.length === 0) && (!places || places.length === 0)) {
            this.resultsContainer.innerHTML = '<div class="no-results">Nessun risultato trovato</div>';
            return;
        }

        let html = '';

        if (users && users.length > 0) {
            html += '<div class="section-title">Utenti</div>';
            users.forEach(user => {
                const pic = user.profilePicture || '/images/utenteDefault.png';
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
                const icon = '/images/map.png'; // Generic map icon for places
                html += `
                    <div class="result-item" style="cursor: default;">
                        <img src="${icon}" class="result-img" style="padding: 8px; background: #eee;" alt="${place.name}">
                        <div class="result-info">
                            <span class="result-name">${place.name}</span>
                            <span class="result-sub">${place.sport ? place.sport.name : ''}</span>
                        </div>
                    </div>
                `;
            });
        }

        this.resultsContainer.innerHTML = html;
    }
}

// Singleton instance
window.SearchPopupInstance = new SearchPopup();
