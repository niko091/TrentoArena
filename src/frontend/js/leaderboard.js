document.addEventListener('DOMContentLoaded', () => {
    const sportFilter = document.getElementById('sportFilter');
    const tableBody = document.getElementById('leaderboardTableBody');

    // Load Sports
    fetch('/api/sports')
        .then(res => res.json())
        .then(sports => {
            sportFilter.innerHTML = '<option value="" disabled selected>Scegli uno sport...</option>';
            sports.forEach(sport => {
                const option = document.createElement('option');
                option.value = sport._id;
                option.textContent = sport.name;
                sportFilter.appendChild(option);
            });

            // Automatically load first sport if available, or restore selection if logic needed
            if (sports.length > 0) {
                sportFilter.value = sports[0]._id;
                loadLeaderboard(sports[0]._id);
            }
        })
        .catch(err => {
            console.error('Error loading sports:', err);
            sportFilter.innerHTML = '<option value="" disabled>Errore caricamento sport</option>';
        });

    // Handle Change
    sportFilter.addEventListener('change', (e) => {
        loadLeaderboard(e.target.value);
    });

    function loadLeaderboard(sportId) {
        tableBody.innerHTML = '<tr><td colspan="3" class="text-center py-4">Caricamento...</td></tr>';

        fetch(`/api/users/leaderboard?sportId=${sportId}`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch leaderboard');
                return res.json();
            })
            .then(users => {
                if (users.length === 0) {
                    tableBody.innerHTML = '<tr><td colspan="3" class="text-center py-4 text-muted">Nessun giocatore trovato per questo sport.</td></tr>';
                    return;
                }

                tableBody.innerHTML = '';
                users.forEach((user, index) => {
                    const row = document.createElement('tr');

                    // Rank styling
                    let rankDisplay = `<strong>#${index + 1}</strong>`;
                    if (index === 0) rankDisplay = `<span class="badge bg-warning text-dark fs-6">🥇 1</span>`;
                    else if (index === 1) rankDisplay = `<span class="badge bg-secondary fs-6">🥈 2</span>`;
                    else if (index === 2) rankDisplay = `<span class="badge text-bg-custom-bronze fs-6" style="background-color: #cd7f32; color: white;">🥉 3</span>`;

                    const profilePic = user.profilePicture || '/images/utenteDefault.png';

                    row.innerHTML = `
                        <td class="align-middle">${rankDisplay}</td>
                        <td class="align-middle">
                            <div class="d-flex align-items-center">
                                <img src="${profilePic}" alt="${user.username}" class="leaderboard-img shadow-sm">
                                <a href="/user/${user.username}" class="text-decoration-none fw-semibold text-dark">${user.username}</a>
                            </div>
                        </td>
                        <td class="align-middle text-end fw-bold font-monospace fs-5" style="color: rgb(223, 103, 5);">${user.elo}</td>
                    `;

                    tableBody.appendChild(row);
                });
            })
            .catch(err => {
                console.error('Error loading leaderboard:', err);
                tableBody.innerHTML = '<tr><td colspan="3" class="text-center py-4 text-danger">Errore caricamento classifica.</td></tr>';
            });
    }
});
