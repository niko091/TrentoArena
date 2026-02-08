window.cachedGames = {}; 

document.addEventListener('DOMContentLoaded', async () => {
    if (!window.ProfileAPI || !window.ProfileUI) {
        console.error("ERRORE CRITICO: I file profile-api.js o profile-ui.js non sono stati caricati correttamente.");
        alert("Errore caricamento pagina. Controlla la console.");
        return;
    }

    const ProfileAPI = window.ProfileAPI;
    const ProfileUI = window.ProfileUI;

    const currentUser = await ProfileAPI.getCurrentUser();
    if (!currentUser) {
        window.location.href = '/login'; 
        return;
    }

    const pathParts = window.location.pathname.split('/');
    const urlUsername = pathParts.includes('user') ? pathParts[pathParts.length - 1] : null;
    
    const urlParams = new URLSearchParams(window.location.search);
    const queryId = urlParams.get('id');

    let targetUser = null;
    let isOwnProfile = false;

    try {
        if (urlUsername && urlUsername.toLowerCase() !== currentUser.username.toLowerCase()) {
            const publicInfo = await ProfileAPI.getUserByUsername(urlUsername);
            targetUser = await ProfileAPI.getUserById(publicInfo._id);
            isOwnProfile = false;

        } else if (queryId && queryId !== currentUser._id) {
            targetUser = await ProfileAPI.getUserById(queryId);
            isOwnProfile = false;

        } else {
        
            targetUser = await ProfileAPI.getUserById(currentUser._id);
            isOwnProfile = true;
        }
    } catch (err) {
        console.error("Errore recupero utente target:", err);
        targetUser = currentUser;
        isOwnProfile = true;
    }

    ProfileUI.renderHeader(targetUser, isOwnProfile, currentUser);
    ProfileUI.renderFriendsList(targetUser.friends);
    ProfileUI.renderEloStats(targetUser);

    if (isOwnProfile) setupImageUpload(targetUser._id);

    loadUserGames(targetUser._id);
});

async function loadUserGames(userId) {
    const active = await window.ProfileAPI.getGames(userId, false);
    const finished = await window.ProfileAPI.getGames(userId, true);

    [...active, ...finished].forEach(g => window.cachedGames[g._id] = g);

    window.ProfileUI.renderGamesList(active, 'myGamesList', false, userId);
    window.ProfileUI.renderGamesList(finished, 'myPastGamesList', true, userId);
    window.ProfileUI.renderActivityCalendar(finished);
}

function setupImageUpload(userId) {
    const fileInput = document.getElementById('fileInput');
    const removeBtn = document.getElementById('removePicBtn');

    if (fileInput) {
        fileInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const formData = new FormData();
            formData.append('profilePicture', file);
            try {
                const res = await window.ProfileAPI.uploadProfilePicture(userId, formData);
                if (res.ok) window.location.reload();
            } catch(e) { console.error(e); }
        };
    }

    if (removeBtn) {
        removeBtn.onclick = async () => {
            if(!confirm("Rimuovere foto profilo?")) return;
            try {
                const res = await window.ProfileAPI.deleteProfilePicture(userId);
                if(res.ok) window.location.reload();
            } catch(e) { console.error(e); }
        };
    }
}

window.openGameDetails = function(gameId) {
    const game = window.cachedGames[gameId];
    if (game && window.GameDetailsPopup) {
        window.GameDetailsPopup.show(game);
    }
};

window.handleSendRequest = async function(targetId) {
    try { await window.ProfileAPI.sendFriendRequest(targetId); window.location.reload(); } catch(e) { alert("Errore"); }
};
window.handleAcceptFriend = async function(reqId) {
    try { await window.ProfileAPI.acceptFriendRequest(reqId); window.location.reload(); } catch(e) { alert("Errore"); }
};
window.handleRemoveFriend = async function(fid) {
    if(confirm("Rimuovere amico?")) {
        try { await window.ProfileAPI.removeFriend(fid); window.location.reload(); } catch(e) { alert("Errore"); }
    }
};
window.openReportModal = function(targetId) {
    const modalEl = document.getElementById('reportModal');
    const modal = new bootstrap.Modal(modalEl);
    const btn = document.getElementById('submitReportBtn');
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    
    newBtn.onclick = async () => {
        const mot = document.getElementById('reportMotivation').value;
        if(!mot) return alert("Inserisci motivazione");
        const me = await window.ProfileAPI.getCurrentUser();
        if(me) {
            await window.ProfileAPI.sendReport(me._id, targetId, mot);
            alert("Inviato"); modal.hide();
        }
    };
    modal.show();
};