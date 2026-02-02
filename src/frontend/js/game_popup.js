class GameDetailsPopup {
    constructor() {
        this.overlay = null;
        this.currentUser = null;
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

    async show(gameData) {
        if (!gameData) {
            console.error('No game data provided to GameDetailsPopup');
            return;
        }

        // Fetch current user if not already fetched
        if (!this.currentUser) {
            try {
                const response = await fetch('/auth/current_user');
                if (response.ok) {
                    this.currentUser = await response.json();
                }
            } catch (error) {
                console.error('Error fetching current user:', error);
            }
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
                <span class="game-popup-value">${gameData.creator.username || gameData.creator}</span>
            </div>
            
            <div class="game-popup-row">
                <span class="game-popup-label">Participants:</span>
                <span class="game-popup-value">${gameData.participants ? gameData.participants.length : 0} / ${gameData.maxParticipants || '?'}</span>
            </div>

            ${gameData.participants && gameData.participants.length > 0 ? `
            <div class="game-popup-section">
                <h4 class="game-popup-subtitle">Players</h4>
                <div class="game-popup-participants-list">
                    ${gameData.participants.map(p => {
            const user = p.user;
            const username = user.username || 'Unknown';
            const pic = user.profilePicture || '/images/utenteDefault.png';
            return `
                        <div class="participant-item" title="${username}">
                            <img src="${pic}" alt="${username}" class="participant-avatar">
                            <span class="participant-name">${username}</span>
                            ${p.winner ? '<span class="participant-winner">🏆</span>' : ''}
                        </div>
                        `;
        }).join('')}
                </div>
            </div>
            ` : ''}

            ${gameData.note ? `
            <div class="game-popup-note">
                <strong>Note:</strong> ${gameData.note}
            </div>` : ''}

            ${this.getActionButtonHTML(gameData)}
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

    getActionButtonHTML(gameData) {
        const isFull = gameData.participants && gameData.maxParticipants && gameData.participants.length >= gameData.maxParticipants;
        const isFinished = gameData.isFinished;
        // Robust check for participation
        const isParticipant = this.currentUser && gameData.participants && gameData.participants.some(p => {
            const pId = p.user._id || p.user;
            return pId === this.currentUser._id;
        });

        if (this.currentUser && !isFinished && !isFull && !isParticipant) {
            return `
                <div class="game-popup-actions" style="text-align: center; margin-top: 15px;">
                    <button class="btn btn-success" onclick="window.GameDetailsPopup.joinGame('${gameData._id}')">Join Game</button>
                </div>
             `;
        } else if (isParticipant) {
            return `
                <div class="game-popup-actions" style="text-align: center; margin-top: 15px;">
                    <span class="badge bg-success" style="font-size: 1rem;">You are a participant</span>
                </div>
             `;
        } else if (isFull) {
            return `
                <div class="game-popup-actions" style="text-align: center; margin-top: 15px;">
                    <span class="badge bg-danger" style="font-size: 1rem;">Game Full</span>
                </div>
             `;
        } else if (isFinished) {
            return `
                <div class="game-popup-actions" style="text-align: center; margin-top: 15px;">
                    <span class="badge bg-secondary" style="font-size: 1rem;">Game Finished</span>
                </div>
             `;
        }
        return '';
    }

    async joinGame(gameId) {
        try {
            const response = await fetch(`/api/games/${gameId}/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                alert('Successfully joined the game!');
                this.hide();
                // Refresh logic would go here
            } else {
                const error = await response.json();
                alert('Error joining game: ' + (error.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error joining game:', error);
            alert('Failed to connect to server.');
        }
    }
}

// Make it available globally
window.GameDetailsPopup = new GameDetailsPopup();
