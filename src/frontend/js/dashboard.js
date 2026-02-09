const DashboardApp = {
    data: {
        allGames: [],
        visibleGames: [],
        currentFilter: 'all',
        currentUser: null
    },


    async init() {
        await this.loadCurrentUser();
        await this.loadFeed();
    },

    async loadCurrentUser() {
        try {
            const response = await fetch('/auth/current_user');
            if (response.ok) {
                this.data.currentUser = await response.json();
                this.updateUserWidget();
            }
        } catch (err) { console.error("Errore auth:", err); }
    },

    updateUserWidget() {
        const user = this.data.currentUser;
        if (!user) return;

        document.getElementById('user-name').textContent = user.username;
        document.getElementById('friendsCount').textContent = user.friends ? user.friends.length : 0;
        if (user.profilePicture) document.getElementById('dashboardProfilePic').src = user.profilePicture;

        fetch(`/api/games?participantId=${user._id}`)
            .then(res => res.json())
            .then(games => document.getElementById('gamesCount').textContent = games.length)
            .catch(() => document.getElementById('gamesCount').textContent = "0");
    },

    async loadFeed() {
        const container = document.getElementById('feed-container');
        container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div></div>';

        try {
            const res = await fetch('/api/games');
            if (!res.ok) throw new Error("Errore API");

            this.data.allGames = await res.json();

            window.dashboardGames = this.data.allGames;

            this.renderFeed('all');

        } catch (error) {
            console.error(error);
            container.innerHTML = `<div class="text-center py-5 text-danger">${window.i18n.t('dashboard.feed_error')}</div>`;
        }
    },

    switchFilter(type, element) {
        this.data.currentFilter = type;
        document.getElementById('filterLabel').textContent = element.textContent;
        document.querySelectorAll('.dropdown-item').forEach(el => el.classList.remove('active'));
        element.classList.add('active');

        this.renderFeed(type);
    },

    renderFeed(type) {
        const container = document.getElementById('feed-container');

        let games = this.filterGames(this.data.allGames, type);

        games = this.sortGames(games, type);
        games = games.slice(0, 100);

        if (games.length === 0) {
            container.innerHTML = `<div class="text-center py-5 text-muted">${this.getEmptyMessage(type)}</div>`;
            return;
        }

        container.innerHTML = games.map(game => this.createGameCardHTML(game)).join('');
    },

    filterGames(games, type) {
        const isFull = (g) => (g.participants?.length || 0) >= (g.maxParticipants || 100);

        if (type === 'all') {

            return games.filter(g => g.isFinished || !isFull(g));
        } else if (type === 'active') {

            return games.filter(g => !g.isFinished && !isFull(g));
        } else if (type === 'finished') {
            return games.filter(g => g.isFinished);
        }
        return games;
    },

    sortGames(games, type) {
        return games.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return type === 'active' ? dateA - dateB : dateB - dateA;
        });
    },

    getEmptyMessage(type) {
        switch (type) {
            case 'active': return window.i18n.t('dashboard.empty_active');
            case 'finished': return window.i18n.t('dashboard.empty_finished');
            default: return window.i18n.t('dashboard.empty_all');
        }
    },


    createGameCardHTML(game) {
        const evt = this.mapGameToEventData(game);
        return `
                <div class="card event-card-pro shadow-sm border-0 mb-0" onclick="DashboardApp.openGamePopup('${game._id}')">
                    <div class="card-body d-flex align-items-center gap-3 py-4">
                        <div class="event-icon-wrapper rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 ${evt.color}" style="width: 50px; height: 50px;">
                            <i class="bi ${evt.icon} fs-4"></i>
                        </div>
                        <div class="event-text flex-grow-1">
                            <span class="fs-5 text-dark">${evt.text}</span>
                            <div class="text-muted small mt-1">${evt.timeAgo}</div>
                        </div>
                        <div class="text-muted ms-auto">
                            <i class="bi bi-chevron-right"></i>
                        </div>
                    </div>
                </div>`;
    },

    mapGameToEventData(game) {
        const creatorName = game.creator?.username || "Sconosciuto";
        const sportName = game.sport?.name || "Sport";
        const placeName = game.place?.name || "un luogo";
        const timeAgo = this.getTimeAgo(new Date(game.date));

        if (game.isFinished) {
            const winners = (game.participants || [])
                .filter(p => p.winner)
                .map(p => p.user.username);

            const text = winners.length > 0
                ? window.i18n.t('dashboard.game_won', { winners: `<strong>${winners.join(', ')}</strong>`, sport: `<strong>${sportName}</strong>` })
                : window.i18n.t('dashboard.game_ended', { sport: `<strong>${sportName}</strong>` });

            return { text, icon: "bi-trophy-fill", color: "bg-warning-subtle text-warning", timeAgo };
        } else {
            return {
                text: window.i18n.t('dashboard.game_organized', { creator: `<strong>${creatorName}</strong>`, sport: `<strong>${sportName}</strong>`, place: `<strong>${placeName}</strong>` }),
                icon: "bi-calendar-plus",
                color: "bg-primary-subtle text-primary",
                timeAgo: new Date(game.date).toLocaleDateString() + ' ' + new Date(game.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
        }
    },

    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        if (seconds < 0) return window.i18n.t('dashboard.time_future');

        const intervals = { y: 31536000, m: 2592000, d: 86400, h: 3600, min: 60 };
        for (const [unit, value] of Object.entries(intervals)) {
            const count = Math.floor(seconds / value);
            if (count >= 1) {
                const unitLabel = window.i18n.t(`dashboard.time_units.${unit}`);
                const suffix = window.i18n.t('dashboard.time_ago_suffix');
                return `${count} ${unitLabel} ${suffix}`;
            }
        }
        return window.i18n.t('dashboard.time_just_now');
    },

    openGamePopup(gameId) {
        const game = this.data.allGames.find(g => g._id === gameId);
        if (game && window.GameDetailsPopup) {
            window.GameDetailsPopup.show(game);
        }
    }
};
document.addEventListener('DOMContentLoaded', () => DashboardApp.init());
window.switchFilter = (t, e) => DashboardApp.switchFilter(t, e);