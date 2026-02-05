class FriendRequestsPopup extends BasePopup {
    constructor() {
        super('friend-requests-popup');
        this.currentUserId = null;
    }

    init() {
        super.init();
        this.setTitle('Richieste di Amicizia');
        this.setBody('<p class="text-center text-muted">Caricamento...</p>');
    }

    async show() {
        this.open();
        await this.loadRequests();
    }

    async loadRequests() {
        const container = this.overlay.querySelector('.popup-body');
        if (!container) return;

        container.innerHTML = '<p class="text-center text-muted">Caricamento...</p>';

        try {
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
            ul.style.listStyle = 'none';
            ul.style.padding = '0';
            ul.style.margin = '0';

            user.friendRequests.forEach(requester => {
                const li = document.createElement('li');
                li.className = 'friend-request-item';
                li.style.display = 'flex';
                li.style.justifyContent = 'space-between';
                li.style.alignItems = 'center';
                li.style.padding = '10px 0';
                li.style.borderBottom = '1px solid #f0f0f0';

                const username = requester.username || 'Unknown';
                const id = requester._id;

                const profilePic = requester.profilePicture || '/images/utenteDefault.png';

                li.innerHTML = `
                    <div class="request-info" style="display: flex; align-items: center;">
                        <img src="${profilePic}" alt="${username}" class="request-profile-pic" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 12px; object-fit: cover;">
                        <a href="/user/${username}" class="request-username" style="text-decoration: none; color: #333; font-weight: 600;">${username}</a>
                    </div>
                    <div class="request-actions" style="display: flex; gap: 8px;">
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
