class GameDetailsPopup extends BasePopup {
    constructor() {
        super('game-details-popup');
        this.currentUser = null;
    }

    init() {
        super.init();
        this.setTitle('Game Details');
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

        // Determine isCreator status early
        const creatorId = gameData.creator._id;
        const isCreator = this.currentUser && creatorId === this.currentUser._id;
        const isFinished = gameData.isFinished;

        const formattedDate = new Date(gameData.date).toLocaleDateString();
        const formattedTime = new Date(gameData.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const bodyContent = `
            <div class="popup-form-group" style="display: flex; justify-content: space-between;">
                <span class="popup-label" style="display: inline;">Sport:</span>
                <span class="popup-value" style="font-weight: 500;">${gameData.sport.name}</span>
            </div>
            <div class="popup-form-group" style="display: flex; justify-content: space-between;">
                <span class="popup-label" style="display: inline;">Place:</span>
                <span class="popup-value" style="font-weight: 500;">
                    <a href="/map?placeId=${gameData.place._id}" style="text-decoration: underline; color: inherit;">${gameData.place.name}</a>
                </span>
            </div>
            <div class="popup-form-group" style="display: flex; justify-content: space-between;">
                <span class="popup-label" style="display: inline;">Date:</span>
                <span class="popup-value" style="font-weight: 500;">${formattedDate}</span>
            </div>
            <div class="popup-form-group" style="display: flex; justify-content: space-between;">
                <span class="popup-label" style="display: inline;">Time:</span>
                <span class="popup-value" style="font-weight: 500;">${formattedTime}</span>
            </div>
            <div class="popup-form-group" style="display: flex; justify-content: space-between;">
                <span class="popup-label" style="display: inline;">Creator:</span>
                <span class="popup-value" style="font-weight: 500;">
                    <a href="/user/${gameData.creator.username}" style="text-decoration: underline; color: inherit;">${gameData.creator.username}</a>
                </span>
            </div>
            
            <div class="popup-form-group" style="display: flex; justify-content: space-between;">
                <span class="popup-label" style="display: inline;">Participants:</span>
                <span class="popup-value" style="font-weight: 500;">${gameData.participants ? gameData.participants.length : 0} / ${gameData.maxParticipants || '?'}</span>
            </div>

            ${gameData.participants && gameData.participants.length > 0 ? `
            <div class="popup-section" style="margin-top: 15px;">
                <h4 style="font-size: 1rem; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 10px;">Players ${isCreator && !isFinished ? '<small style="font-size: 0.7em; font-weight: normal;">(Check winners)</small>' : ''}</h4>
                <div class="game-popup-participants-list" style="max-height: 150px; overflow-y: auto;">
                    ${gameData.participants.map(p => {
            const user = p.user;
            const username = user.username || 'Unknown';
            const pic = user.profilePicture || '/images/utenteDefault.png';
            const userId = user._id || user;

            let extraHtml = '';
            if (isCreator && !isFinished) {
                extraHtml = `<input type="checkbox" class="winner-checkbox" value="${userId}" style="margin-right: 10px;">`;
            } else if (p.winner) {
                extraHtml = '<span class="participant-winner">🏆</span>';
            }

            return `
                        <div class="participant-item" title="${username}" style="display: flex; align-items: center; padding: 5px 0;">
                            ${extraHtml}
                            <img src="${pic}" alt="${username}" class="participant-avatar" style="width: 30px; height: 30px; border-radius: 50%; margin-right: 8px;">
                            <span class="participant-name">
                                <a href="/user/${username}" style="text-decoration: none; color: inherit;">${username}</a>
                            </span>
                        </div>
                        `;
        }).join('')}
                </div>
            </div>
            ` : ''}

            ${gameData.note ? `
            <div class="game-popup-note" style="margin-top: 1rem; padding: 10px; background: #f9f9f9; border-radius: 8px; font-style: italic; color: #666;">
                <strong>Note:</strong> ${gameData.note}
            </div>` : ''}

            ${this.getActionButtonHTML(gameData)}
        `;

        this.setBody(bodyContent);
        this.open();
    }

    getActionButtonHTML(gameData) {
        const isFull = gameData.participants && gameData.maxParticipants && gameData.participants.length >= gameData.maxParticipants;
        const isFinished = gameData.isFinished;
        // Robust check for participation
        const isParticipant = this.currentUser && gameData.participants && gameData.participants.some(p => {
            const pId = p.user._id || p.user;
            return pId === this.currentUser._id;
        });

        // Check if creator
        const creatorId = gameData.creator._id || gameData.creator;
        const isCreator = this.currentUser && creatorId === this.currentUser._id;

        let actionHtml = '';

        if (this.currentUser && !isFinished && !isFull && !isParticipant) {
            actionHtml = `
                <div class="popup-actions" style="justify-content: center;">
                    <button class="btn btn-success" onclick="window.GameDetailsPopup.joinGame('${gameData._id}')">Join Game</button>
                </div>
             `;
        } else if (isCreator && !isFinished) {
            // If creator and active, show Finish Game button
            actionHtml = `
                <div class="popup-actions" style="justify-content: center;">
                    <button class="btn btn-warning text-dark" onclick="window.GameDetailsPopup.finishGame('${gameData._id}')">Finish Game</button>
                </div>
             `;
        } else if (isParticipant) {
            actionHtml = `
                <div class="popup-actions" style="justify-content: center;">
                    <span class="badge bg-success" style="font-size: 1rem;">You are a participant</span>
                </div>
             `;
        } else if (isFull) {
            actionHtml = `
                <div class="popup-actions" style="justify-content: center;">
                    <span class="badge bg-danger" style="font-size: 1rem;">Game Full</span>
                </div>
             `;
        } else if (isFinished) {
            actionHtml = `
                <div class="popup-actions" style="justify-content: center;">
                    <span class="badge bg-secondary" style="font-size: 1rem;">Game Finished</span>
                </div>
             `;
        }

        if (isCreator) {
            actionHtml += `
                <div class="popup-actions" style="justify-content: center; margin-top: 10px;">
                    <button class="btn btn-danger" onclick="window.GameDetailsPopup.deleteGame('${gameData._id}')">Delete Game</button>
                </div>
            `;
        }

        return actionHtml;
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
                this.close();
                window.location.reload(); // Reload to update UI
            } else {
                const error = await response.json();
                alert('Error joining game: ' + (error.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error joining game:', error);
            alert('Failed to connect to server.');
        }
    }

    async finishGame(gameId) {
        if (!confirm('Are you sure you want to finish this game?')) {
            return;
        }

        const checkboxes = this.overlay.querySelectorAll('.winner-checkbox:checked');
        const winnerIds = Array.from(checkboxes).map(cb => cb.value);

        try {
            const response = await fetch(`/api/games/${gameId}/finish`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ winnerIds })
            });

            if (response.ok) {
                alert('Game finished successfully!');
                this.close();
                window.location.reload();
            } else {
                const error = await response.json();
                alert('Error finishing game: ' + (error.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error finishing game:', error);
            alert('Failed to connect to server.');
        }
    }

    async deleteGame(gameId) {
        if (!confirm('Are you sure you want to delete this game? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`/api/games/${gameId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                alert('Game deleted successfully');
                this.close();
                window.location.reload(); // Reload to remove game from view
            } else {
                const error = await response.json();
                alert('Error deleting game: ' + (error.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error deleting game:', error);
            alert('Failed to connect to server.');
        }
    }
}

// Make it available globally
window.GameDetailsPopup = new GameDetailsPopup();
