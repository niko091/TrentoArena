window.ProfileAPI = {
    // Ottiene l'utente loggato
    async getCurrentUser() {
        try {
            const res = await fetch('/auth/current_user');
            if (!res.ok) throw new Error('Auth error');
            return await res.json();
        } catch (e) {
            console.warn("Nessun utente loggato o errore auth:", e);
            return null;
        }
    },

    // Ottiene info pubbliche di un utente dato lo username
    async getUserByUsername(username) {
        const res = await fetch(`/api/users/username/${username}`);
        if (!res.ok) throw new Error('User not found');
        return await res.json();
    },

    // Ottiene il profilo completo dato l'ID
    async getUserById(id) {
        const res = await fetch(`/api/users/${id}`);
        if (!res.ok) throw new Error('User fetch error');
        return await res.json();
    },

    // Ottiene le partite
    async getGames(participantId, isFinished) {
        try {
            const res = await fetch(`/api/games?participantId=${participantId}&isFinished=${isFinished}`);
            return res.ok ? await res.json() : [];
        } catch (e) {
            console.error("Errore recupero partite:", e);
            return [];
        }
    },

    // Invia richiesta di amicizia
    async sendFriendRequest(targetId) {
        return await fetch(`/api/users/${targetId}/friend-requests`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
    },

    // Accetta richiesta di amicizia
    async acceptFriendRequest(requesterId) {
        const currentUser = await this.getCurrentUser();
        if(!currentUser) throw new Error("Not logged in");
        
        return await fetch(`/api/users/${currentUser._id}/friends/accept`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requesterId: requesterId })
        });
    },

    // Rimuove un amico
    async removeFriend(friendId) {
        const currentUser = await this.getCurrentUser();
        if(!currentUser) throw new Error("Not logged in");

        return await fetch(`/api/users/${currentUser._id}/friends/${friendId}`, {
            method: 'DELETE'
        });
    },

    // Invia un report
    async sendReport(reporterId, reportedId, motivation) {
        return await fetch('/api/reports', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reporterId, reportedId, motivation })
        });
    },

    // Upload foto profilo
    async uploadProfilePicture(userId, formData) {
        return await fetch(`/api/users/${userId}/profile-picture`, {
            method: 'POST',
            body: formData
        });
    },

    // Delete foto profilo
    async deleteProfilePicture(userId) {
        return await fetch(`/api/users/${userId}/profile-picture`, {
            method: 'DELETE'
        });
    }
};