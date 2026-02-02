class GameDetailsPopup {
    constructor() {
        this.overlay = null;
        this.init();
    }

    init() {
        // Check if popup already exists
        if (document.querySelector('.game-popup-overlay')) {
            this.overlay = document.querySelector('.game-popup-overlay');
            return;
        }

        // Create popup DOM structure
        this.overlay = document.createElement('div');
        this.overlay.className = 'game-popup-overlay';
        this.overlay.innerHTML = `
            <div class="game-popup-content">
                <button class="game-popup-close">&times;</button>
                <div class="game-popup-header">
                    <h2 class="game-popup-title">Game Details</h2>
                </div>
                <div class="game-popup-body">
                    <!-- Dynamic content will be injected here -->
                </div>
            </div>
        `;

        document.body.appendChild(this.overlay);

        // Event listeners
        this.overlay.querySelector('.game-popup-close').addEventListener('click', () => this.hide());
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.hide();
            }
        });
    }

    show(gameData) {
        if (!gameData) {
            console.error('No game data provided to GameDetailsPopup');
            return;
        }

        const formattedDate = new Date(gameData.date).toLocaleDateString();
        const formattedTime = new Date(gameData.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const bodyContent = `
            <div class="game-popup-row">
                <span class="game-popup-label">Sport:</span>
                <span class="game-popup-value">${gameData.sport}</span>
            </div>
            <div class="game-popup-row">
                <span class="game-popup-label">Place:</span>
                <span class="game-popup-value">${gameData.place}</span>
            </div>
            <div class="game-popup-row">
                <span class="game-popup-label">Date:</span>
                <span class="game-popup-value">${formattedDate}</span>
            </div>
            <div class="game-popup-row">
                <span class="game-popup-label">Time:</span>
                <span class="game-popup-value">${formattedTime}</span>
            </div>
            <div class="game-popup-row">
                <span class="game-popup-label">Creator:</span>
                <span class="game-popup-value">${gameData.creator}</span>
            </div>
            ${gameData.note ? `
            <div class="game-popup-note">
                <strong>Note:</strong> ${gameData.note}
            </div>` : ''}
        `;

        this.overlay.querySelector('.game-popup-body').innerHTML = bodyContent;

        // Timeout to allow DOM to update before adding active class for animation
        setTimeout(() => {
            this.overlay.classList.add('active');
        }, 10);
    }

    hide() {
        this.overlay.classList.remove('active');
    }
}

// Make it available globally
window.GameDetailsPopup = new GameDetailsPopup();
