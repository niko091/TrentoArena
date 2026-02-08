function updateNotificationBadge(count) {
    const badge = document.getElementById('requests-badge');
    

    if (!badge) {
        setTimeout(() => updateNotificationBadge(count), 500);
        return;
    }

    if (count <= 0) {
        badge.style.display = 'none';
        badge.innerText = '0';
    } else {
        badge.style.display = 'flex';
        badge.innerText = count > 9 ? '9+' : count.toString();
    }
}

async function checkNotifications() {
    try {

        const authResponse = await fetch('/auth/current_user');
        if (!authResponse.ok) return; 
        
        const currentUser = await authResponse.json();
        
        const userResponse = await fetch(`/api/users/${currentUser._id}`);
        if (!userResponse.ok) return;
        
        const userData = await userResponse.json();
        
        const requestCount = userData.friendRequests ? userData.friendRequests.length : 0;
        
        updateNotificationBadge(requestCount);

    } catch (error) {
        console.error("Errore caricamento notifiche:", error);
    }
}


document.addEventListener('DOMContentLoaded', () => {
    checkNotifications();
        setInterval(checkNotifications, 60000);
});

window.checkNotifications = checkNotifications;