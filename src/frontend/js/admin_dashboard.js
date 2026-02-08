// Fetch and display games
        async function fetchGames() {
            try {
                const response = await fetch('/api/games');
                if (!response.ok) {
                    throw new Error('Failed to fetch games');
                }
                const games = await response.json();
                const tableBody = document.getElementById('games-table-body');
                tableBody.innerHTML = '';

                games.forEach(game => {
                    const row = document.createElement('tr');

                    const sportName = game.sport ? game.sport.name : 'Unknown';
                    const placeName = game.place ? game.place.name : 'Unknown';
                    const creatorName = game.creator ? game.creator.username : 'Unknown';
                    const dateObj = new Date(game.date);
                    const formattedDate = dateObj.toLocaleDateString('it-IT');
                    const formattedTime = dateObj.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

                    row.innerHTML = `
                        <td>${sportName}</td>
                        <td>${placeName}</td>
                        <td>${formattedDate}</td>
                        <td>${formattedTime}</td>
                        <td>${creatorName}</td>
                        <td>${game.isFinished ? 'Yes' : 'No'}</td>
                        <td>${game.participants ? game.participants.length : 0} / ${game.maxParticipants || '?'}</td>
                        <td>${game.note}</td>
                    `;
                    tableBody.appendChild(row);
                });
            } catch (error) {
                console.error('Error loading games:', error);
            }
        }

        async function fetchPlaces() {
            try {
                const response = await fetch('/api/places');
                if (!response.ok) {
                    throw new Error('Failed to fetch places');
                }
                const places = await response.json();
                const tableBody = document.getElementById('places-table-body');

                tableBody.innerHTML = ''; 

                places.forEach(place => {
                    const row = document.createElement('tr');
                    // Handle populated sport object or potential missing data
                    const sportName = place.sport && place.sport.name ? place.sport.name : 'Unknown';

                    row.innerHTML = `
                        <td>${place.name}</td>
                        <td>${sportName}</td>
                        <td>${place.position.lat}</td>
                        <td>${place.position.lng}</td>
                        <td>
                            <button onclick="openEditModal('${place._id}')" class="btn btn-warning me-2">Edit</button>
                            <button onclick="deletePlace('${place._id}')" class="btn btn-danger">Delete</button>
                        </td>
                    `;
                    tableBody.appendChild(row);
                });
            } catch (error) {
                console.error('Error loading places:', error);
                alert('Error loading places. See console for details.');
            }
        }

        async function deletePlace(id) {
            if (!confirm('Are you sure you want to delete this place?')) {
                return;
            }

            try {
                const response = await fetch(`/api/places/${id}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    alert('Place deleted successfully');
                    fetchPlaces(); // Refresh table
                } else {
                    const errorData = await response.json();
                    alert(`Error deleting place: ${errorData.message}`);
                }
            } catch (error) {
                console.error('Error deleting place:', error);
                alert('Error deleting place. See console for details.');
            }
        }


        // Fetch and populate sports dropdown and list
        async function fetchSports() {
            try {
                const response = await fetch('/api/sports');
                const sports = await response.json();

                // Populate Dropdown
                const select = document.getElementById('sport');
                select.innerHTML = '<option value="" disabled selected>Select a sport</option>';

                // Populate List
                const list = document.getElementById('sports-list');
                list.innerHTML = '';

                sports.forEach(sport => {
                    // Dropdown
                    const option = document.createElement('option');
                    option.value = sport._id;
                    option.textContent = sport.name;
                    select.appendChild(option);

                    // List
                    const listItem = document.createElement('li');
                    listItem.textContent = sport.name;
                    listItem.className = 'list-item';
                    list.appendChild(listItem);
                });
            } catch (error) {
                console.error('Error fetching sports:', error);
            }
        }

        async function fetchReports() {
            try {
                const response = await fetch('/api/reports');
                if (!response.ok) throw new Error('Failed to fetch reports');
                const reports = await response.json();
                const tableBody = document.getElementById('reports-table-body');
                tableBody.innerHTML = '';

                reports.forEach(report => {
                    const row = document.createElement('tr');
                    const dateStr = new Date(report.date).toLocaleDateString('it-IT') + ' ' + new Date(report.date).toLocaleTimeString();
                    const reporterName = report.reporter ? report.reporter.username : 'Unknown';
                    const reportedName = report.reported ? report.reported.username : 'Unknown';
                    const reportedId = report.reported ? report.reported._id : null;

                    let actionButtons = '';
                    if (reportedId) {
                        if (report.reported.isBanned) {
                            actionButtons = `<button class="btn btn-secondary btn-sm" disabled>Banned</button>`;
                        } else {
                            const safeUsername = reportedName.replace(/'/g, "\\'");
                            actionButtons = `<button class="btn btn-danger btn-sm" onclick="openBanModal('${reportedId}', '${safeUsername}')">Ban</button>`;
                        }
                    }

                    row.innerHTML = `
                        <td>${dateStr}</td>
                        <td>${reporterName}</td>
                        <td>${reportedName}</td>
                        <td>${report.motivation}</td>
                        <td>${actionButtons}</td>
                    `;
                    tableBody.appendChild(row);
                });
            } catch (error) {
                console.error('Error loading reports:', error);
            }
        }

        // Open Ban Modal
        window.openBanModal = function (id, username) {
            document.getElementById('ban-user-id').value = id;
            document.getElementById('ban-username-display').textContent = username;
            document.getElementById('ban-reason').value = ''; // Reset reason

            const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('banUserModal'));
            modal.show();
        };

        // Ban User Form Handler
        document.addEventListener('DOMContentLoaded', () => {
            const banForm = document.getElementById('ban-user-form');
            if (banForm) {
                banForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const userId = document.getElementById('ban-user-id').value;
                    const duration = document.getElementById('ban-duration').value;
                    const reason = document.getElementById('ban-reason').value;

                    try {
                        const response = await fetch('/api/admin/ban', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId, duration, reason })
                        });

                        if (response.ok) {
                            alert('User has been banned successfully.');
                            const modalElement = document.getElementById('banUserModal');
                            const modal = bootstrap.Modal.getInstance(modalElement);
                            modal.hide();
                            fetchReports(); // Refresh
                            fetchBannedUsers();
                        } else {
                            const data = await response.json();
                            alert(`Error banning user: ${data.message}`);
                        }
                    } catch (error) {
                        console.error('Error banning user:', error);
                        alert('Error banning user');
                    }
                });
            }
        });


        async function fetchBannedUsers() {
            try {
                const response = await fetch('/api/admin/banned-users');
                if (!response.ok) throw new Error('Failed to fetch banned users');
                const users = await response.json();
                const tableBody = document.getElementById('banned-users-table-body');
                tableBody.innerHTML = '';

                users.forEach(user => {
                    const row = document.createElement('tr');

                    let expiryDisplay = 'Forever';
                    let remainingDisplay = 'Forever';

                    if (user.banExpiresAt) {
                        const expiryDate = new Date(user.banExpiresAt);
                        expiryDisplay = expiryDate.toLocaleString();

                        const now = new Date();
                        const diffMs = expiryDate - now;

                        if (diffMs > 0) {
                            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                            const diffHrs = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                            const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                            remainingDisplay = `${diffDays}d ${diffHrs}h ${diffMins}m`;
                        } else {
                            remainingDisplay = 'Expired';
                        }
                    }

                    row.innerHTML = `
                        <td>${user.username}</td>
                        <td>${user.banReason || 'No reason'}</td>
                        <td>${expiryDisplay}</td>
                        <td>${remainingDisplay}</td>
                        <td>
                             <button onclick="unbanUser('${user._id}', '${user.username}')" class="btn btn-success btn-sm">Unban</button>
                        </td>
                    `;
                    tableBody.appendChild(row);
                });
            } catch (error) {
                console.error('Error fetching banned users:', error);
            }
        }

        async function unbanUser(userId, username) {
            if (!confirm(`Are you sure you want to unban ${username}?`)) return;

            try {
                const response = await fetch('/api/admin/unban', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId })
                });

                if (response.ok) {
                    alert(`${username} has been unbanned.`);
                    fetchBannedUsers();
                } else {
                    const data = await response.json();
                    alert(`Error unbanning user: ${data.message}`);
                }
            } catch (error) {
                console.error('Error unbanning user:', error);
                alert('Error unbanning user');
            }
        }

        document.addEventListener('DOMContentLoaded', async () => {
            fetchPlaces();
            fetchSports();
            fetchGames();
            fetchReports();
            fetchBannedUsers();

            const form = document.getElementById('add-place-form');
            form.addEventListener('submit', async (e) => {
                e.preventDefault();

                const formData = {
                    name: document.getElementById('name').value,
                    sport: document.getElementById('sport').value,
                    position: {
                        lat: parseFloat(document.getElementById('lat').value),
                        lng: parseFloat(document.getElementById('lng').value)
                    }
                };

                try {
                    const response = await fetch('/api/places', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(formData)
                    });

                    if (response.ok) {
                        alert('Place added successfully!');
                        form.reset();
                        fetchPlaces(); // Refresh table
                    } else {
                        const errorData = await response.json();
                        alert(`Error adding place: ${errorData.message}`);
                    }
                } catch (error) {
                    console.error('Error adding place:', error);
                    alert('Error adding place. See console for details.');
                }
            });

            // Add Sport Form Handler
            const sportForm = document.getElementById('add-sport-form');
            sportForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const name = document.getElementById('sport-name').value;

                try {
                    const response = await fetch('/api/sports', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name })
                    });

                    if (response.ok) {
                        alert('Sport added successfully!');
                        sportForm.reset();
                        fetchSports(); // Refresh list and dropdown
                    } else {
                        const data = await response.json();
                        alert(`Error adding sport: ${data.message}`);
                    }
                } catch (error) {
                    console.error('Error adding sport:', error);
                    alert('Error adding sport');
                }
            });

            // Edit Place Handler
            const editForm = document.getElementById('edit-place-form');
            editForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const id = document.getElementById('edit-place-id').value;
                const formData = {
                    name: document.getElementById('edit-name').value,
                    sport: document.getElementById('edit-sport').value,
                    position: {
                        lat: parseFloat(document.getElementById('edit-lat').value),
                        lng: parseFloat(document.getElementById('edit-lng').value)
                    }
                };

                try {
                    const response = await fetch(`/api/places/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(formData)
                    });

                    if (response.ok) {
                        alert('Place updated successfully!');
                        const modalElement = document.getElementById('editPlaceModal');
                        const modal = bootstrap.Modal.getInstance(modalElement);
                        modal.hide();
                        fetchPlaces();
                    } else {
                        const data = await response.json();
                        alert(`Error updating place: ${data.message}`);
                    }
                } catch (error) {
                    console.error('Error updating place:', error);
                    alert('Error updating place');
                }
            });
        });

        // Open Edit Modal
        window.openEditModal = async function (id) {
            try {
                const sportsRes = await fetch('/api/sports');
                const sports = await sportsRes.json();

                const sportSelect = document.getElementById('edit-sport');
                sportSelect.innerHTML = '<option value="" disabled>Select a sport</option>';
                sports.forEach(s => {
                    const option = document.createElement('option');
                    option.value = s._id;
                    option.textContent = s.name;
                    sportSelect.appendChild(option);
                });

                const placesRes = await fetch('/api/places');
                const places = await placesRes.json();
                const place = places.find(p => p._id === id);

                if (!place) {
                    alert('Place not found');
                    return;
                }

                document.getElementById('edit-place-id').value = place._id;
                document.getElementById('edit-name').value = place.name;
                document.getElementById('edit-lat').value = place.position.lat;
                document.getElementById('edit-lng').value = place.position.lng;

                // Select sport
                if (place.sport) {
                    // sport might be populated object or ID
                    const sportId = place.sport._id || place.sport;
                    sportSelect.value = sportId;
                }

                const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('editPlaceModal'));
                modal.show();

            } catch (err) {
                console.error("Error opening edit modal", err);
                alert("Failed to load edit modal");
            }
        };