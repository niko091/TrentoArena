window.ProfileUI = {
    renderHeader(user, isOwnProfile, currentUser) {
        const usernameEl = document.getElementById('username');
        const picEl = document.getElementById('profilePic');
        
        if (usernameEl) usernameEl.textContent = user.username;
        if (picEl) picEl.src = user.profilePicture || '/images/utenteDefault.png';

       const setDisplay = (id, val) => { const el = document.getElementById(id); if(el) el.style.display = val; };

        if (isOwnProfile) {
            setDisplay('editControls', 'block');
            setDisplay('privateActions', 'block');
            setDisplay('publicActions', 'none');
            setDisplay('email', 'block');
            const emailEl = document.getElementById('email');
            if(emailEl) emailEl.textContent = user.email;
            
            if (user.profilePicture) setDisplay('removePicBtn', 'block');
            else setDisplay('removePicBtn', 'none');

        } else {
            setDisplay('editControls', 'none');
            setDisplay('privateActions', 'none');
            setDisplay('publicActions', 'flex');
            setDisplay('email', 'none');

            if (user.isBanned && usernameEl) {
                const badge = document.createElement('span');
                badge.className = 'badge bg-danger fs-6 align-middle ms-2';
                badge.textContent = 'BANNED';
                usernameEl.appendChild(badge);
            }
            
            this.setupPublicActionButtons(user, currentUser);
        }
    },

    // Bottoni Amicizia
    setupPublicActionButtons(targetUser, currentUser) {
        const friendBtn = document.getElementById('addFriendBtn');
        if (!friendBtn || !currentUser) return;

        const newBtn = friendBtn.cloneNode(true);
        friendBtn.parentNode.replaceChild(newBtn, friendBtn);
        const btn = document.getElementById('addFriendBtn');

        const friends = targetUser.friends || [];
        const friendReqs = targetUser.friendRequests || [];
        const myReqs = currentUser.friendRequests || [];

        const isFriend = friends.some(f => (f._id || f) === currentUser._id);
        const requestSentByMe = friendReqs.some(r => (r._id || r) === currentUser._id);
        const requestReceivedByMe = myReqs.some(r => (r._id || r) === targetUser._id);

        if (isFriend) {
            btn.textContent = "Remove Friend";
            btn.className = "btn btn-danger";
            btn.onclick = () => window.handleRemoveFriend(targetUser._id);
        } else if (requestSentByMe) {
            btn.textContent = "Request Sent";
            btn.className = "btn btn-secondary";
            btn.disabled = true;
        } else if (requestReceivedByMe) {
            btn.textContent = "Accept Request";
            btn.className = "btn btn-success";
            btn.onclick = () => window.handleAcceptFriend(targetUser._id);
        } else {
            btn.textContent = "Add Friend";
            btn.className = "btn btn-primary";
            btn.onclick = () => window.handleSendRequest(targetUser._id);
        }

        const reportBtn = document.getElementById('reportUserBtn');
        if(reportBtn) {
            reportBtn.onclick = () => window.openReportModal(targetUser._id);
        }
    },

    // Lista Amici
    renderFriendsList(friends) {
        const container = document.getElementById('friendsList');
        if(!container) return;
        container.innerHTML = '';

        if (!friends || friends.length === 0) {
            container.innerHTML = '<span class="text-muted">No friends yet.</span>';
            return;
        }

        friends.forEach(friend => {
            const img = document.createElement('img');
            img.src = friend.profilePicture || '/images/utenteDefault.png';
            img.className = 'rounded-circle shadow-sm border me-2 mb-2';
            img.style.width = '50px'; img.style.height = '50px'; img.style.cursor = 'pointer';
            img.style.objectFit = 'cover';
            
            const username = friend.username || 'unknown';
            img.onclick = () => window.location.href = `/user/${username}`;
            img.title = username;
            
            container.appendChild(img);
        });
    },

    // Lista Partite
    renderGamesList(games, containerId, isFinished, userId) {
        const container = document.getElementById(containerId);
        if(!container) return;
        
        container.innerHTML = '';
        if (!games || games.length === 0) {
            const msg = isFinished ? 'No past games.' : 'No upcoming games.';
            container.innerHTML = `<div class="col-12 text-muted">${msg}</div>`;
            return;
        }

        games.sort((a, b) => isFinished ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date));

        games.forEach(game => {
            const dateStr = new Date(game.date).toLocaleDateString('it-IT');
            const timeStr = new Date(game.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            let cardClass = isFinished ? 'opacity-75' : '';
            let badgeHtml = '';

            if (isFinished) {
                badgeHtml = '<span class="badge bg-secondary">Finished</span>';
                const participant = game.participants.find(p => {
                    const pId = p.user._id || p.user; 
                    return pId.toString() === userId.toString();
                });
                if (participant) {
                    if (participant.winner) {
                        cardClass += ' border-success border-2'; 
                        badgeHtml = '<span class="badge bg-success">Won</span>';
                    } else {
                        cardClass += ' border-secondary';
                    }
                }
            } else {
                const current = game.participants.length;
                const max = game.maxParticipants || 10;
                let badgeClass = 'bg-success';
                if (current >= max) badgeClass = 'bg-danger';
                else if (current / max >= 0.75) badgeClass = 'bg-warning text-dark';
                
                badgeHtml = `<span class="badge ${badgeClass}"><i class="bi bi-people-fill me-1"></i>${current}/${max}</span>`;
            }

            const col = document.createElement('div');
            col.className = 'col-md-6 col-lg-4';
            col.innerHTML = `
                <div class="card h-100 shadow-sm ${cardClass}" style="cursor: pointer;" onclick="openGameDetails('${game._id}')">
                    <div class="card-body">
                        <div class="d-flex justify-content-between mb-2">
                            <h5 class="card-title fw-bold text-primary">${game.sport?.name || 'Sport'}</h5>
                            ${badgeHtml}
                        </div>
                        <h6 class="text-muted">${game.place?.name || 'Place'}</h6>
                        <p class="card-text mb-0"><small>📅 ${dateStr} at ${timeStr}</small></p>
                    </div>
                </div>
            `;
            container.appendChild(col);
        });
    },

    // Calendario attività
    renderActivityCalendar(games) {
        const container = document.getElementById('dotsContainer');
        if (!container) return;
        container.innerHTML = '';

        const matchCounts = {};
        games.forEach(g => {
            const d = new Date(g.date).toISOString().split('T')[0];
            matchCounts[d] = (matchCounts[d] || 0) + 1;
        });

        const today = new Date();
        const currentDayOfWeek = today.getDay();
        const distanceToSunday = currentDayOfWeek === 0 ? 0 : 7 - currentDayOfWeek;
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + distanceToSunday);
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 27); 

        for (let i = 0; i < 28; i++) {
            const d = new Date(startDate);
            d.setDate(d.getDate() + i);
            const dateStr = d.toISOString().split('T')[0];
            const count = matchCounts[dateStr] || 0;

            const dot = document.createElement('div');
            dot.style.borderRadius = '50%';
            dot.style.transition = 'all 0.2s ease';

            if (count === 0) {
                dot.style.width = '6px'; dot.style.height = '6px';
                dot.style.backgroundColor = '#e9ecef';
                dot.title = d.toLocaleDateString('it-IT');
            } else {
                const size = Math.min(12 + (count - 1) * 4, 24);
                dot.style.width = `${size}px`; dot.style.height = `${size}px`;
                dot.style.backgroundColor = '#fd7e14';
                dot.title = `${count} games on ${d.toLocaleDateString('it-IT')}`;
            }
            container.appendChild(dot);
        }
    },

    // Grafico ELO
    renderEloStats(user) {
        const eloContainer = document.getElementById('eloStatsContainer');
        if(!eloContainer) return;

        if (!user.sportsElo || user.sportsElo.length === 0) {
            eloContainer.style.display = 'none';
            return;
        }
        eloContainer.style.display = 'block';
        const select = document.getElementById('eloSportSelect');
        const canvas = document.getElementById('eloChart');
        const placeholder = document.getElementById('eloPlaceholder');
        
        select.innerHTML = '<option selected disabled value="">Select a sport...</option>';
        
        user.sportsElo.forEach((stat, idx) => {
            const opt = document.createElement('option');
            opt.value = idx;
            opt.textContent = stat.sport?.name || 'Unknown Sport';
            select.appendChild(opt);
        });

        select.onchange = () => {
            const stat = user.sportsElo[select.value];
            if(!stat) return;
            const labels = [], data = [];
            
            if (stat.history && stat.history.length > 0) {
                const history = [...stat.history].sort((a,b) => new Date(a.date) - new Date(b.date));
                history.forEach(h => {
                    labels.push(new Date(h.date).toLocaleDateString());
                    data.push(h.elo);
                });
            } else {
                labels.push('Start'); data.push(stat.elo);
            }

            if(placeholder) placeholder.style.display = 'none';
            if(canvas) canvas.style.display = 'block';

            if (window.myEloChart) window.myEloChart.destroy();
            window.myEloChart = new Chart(canvas, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'ELO Rating',
                        data: data,
                        borderColor: '#fd7e14',
                        backgroundColor: 'rgba(253, 126, 20, 0.1)',
                        tension: 0.3,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: false } }
                }
            });
        };

        if(user.sportsElo.length > 0) {
            select.selectedIndex = 1;
            select.dispatchEvent(new Event('change'));
        }
    }
};