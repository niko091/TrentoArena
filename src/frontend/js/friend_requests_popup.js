class FriendRequestsPopup {
    constructor() {
        this.overlay = null;
        this.currentUserId = null;
        this.init();
    }

    init() {
        if (document.querySelector('.friend-requests-popup-overlay')) {
            this.overlay = document.querySelector('.friend-requests-popup-overlay');
            return;
        }

        this.overlay = document.createElement('div');
        this.overlay.className = 'friend-requests-popup-overlay';
        this.overlay.innerHTML = `
            <div class="friend-requests-popup-content">
                <button class="friend-requests-popup-close">&times;</button>
                <h2 class="friend-requests-popup-title">Richieste di Amicizia</h2>
                <div class="friend-requests-body">
                    <p class="text-center text-muted">Caricamento...</p>
                </div>
            </div>
        `;

        document.body.appendChild(this.overlay);

        this.overlay.querySelector('.friend-requests-popup-close').addEventListener('click', () => this.hide());
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.hide();
            }
        });
    }

    async show() {
        setTimeout(() => {
            this.overlay.classList.add('active');
        }, 10);
        await this.loadRequests();
    }

    hide() {
        this.overlay.classList.remove('active');
    }

    async loadRequests() {
        const container = this.overlay.querySelector('.friend-requests-body');
        container.innerHTML = '<p class="text-center text-muted">Caricamento...</p>';

        try {
            const response = await fetch('/api/users/' + this.currentUserId); // Need current user ID first.
            // Better approach: fetch /auth/current_user to be sure, or store it. 
            // The profile page usually fetches current_user. Let's assume we fetch it again or pass it.
            // But to be robust, let's fetch /auth/current_user.

            const authResp = await fetch('/auth/current_user');
            if (!authResp.ok) throw new Error('Not logged in');
            const currentUser = await authResp.json();
            this.currentUserId = currentUser._id;

            // Now get full user data to see friend requests populated
            const userResp = await fetch(`/api/users/${this.currentUserId}`);
            if (!userResp.ok) throw new Error('Failed to fetch user details');
            const user = await userResp.json();

            if (!user.friendRequests || user.friendRequests.length === 0) {
                container.innerHTML = '<p class="text-center text-muted">Nessuna richiesta di amicizia.</p>';
                return;
            }

            const ul = document.createElement('ul');
            ul.className = 'friend-requests-list';

            user.friendRequests.forEach(requester => {
                const li = document.createElement('li');
                li.className = 'friend-request-item';

                // Requester might be populated object or ID string depending on backend.
                // Endpoint /api/users/:id populates friendRequests with 'username email'.
                const username = requester.username || 'Unknown';
                const id = requester._id || requester;

                li.innerHTML = `
                    <div class="request-info">
                        <span class="request-username">${username}</span>
                    </div>
                    <div class="request-actions">
                        <button class="btn btn-sm btn-success accept-btn" data-id="${id}">Accetta</button>
                        <button class="btn btn-sm btn-danger decline-btn" data-id="${id}">Rifiuta</button>
                    </div>
                `;
                ul.appendChild(li);
            });

            container.innerHTML = '';
            container.appendChild(ul);

            // Add listeners
            container.querySelectorAll('.accept-btn').forEach(btn => {
                btn.addEventListener('click', (e) => this.respond(e.target.dataset.id, 'accept'));
            });
            container.querySelectorAll('.decline-btn').forEach(btn => {
                btn.addEventListener('click', (e) => this.respond(e.target.dataset.id, 'decline'));
            });

        } catch (error) {
            console.error(error);
            container.innerHTML = '<p class="text-center text-danger">Errore nel caricamento delle richieste.</p>';
        }
    }

    async respond(requesterId, action) {
        try {
            const response = await fetch(`/api/users/${this.currentUserId}/friends/${action}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requesterId })
            });

            if (response.ok) {
                // Refresh list
                await this.loadRequests();
                // Optionally refresh main profile page counters if needed
                if (window.location.reload) {
                    // A full reload might be jarring, maybe just dispatch an event?
                    // For now, simplicity: just reload requests list.
                    // The user can refresh page to see updated friend count.
                }
            } else {
                alert('Errore durante l\'operazione');
            }
        } catch (error) {
            console.error(error);
            alert('Errore di connessione');
        }
    }
}

window.FriendRequestsPopup = new FriendRequestsPopup();
