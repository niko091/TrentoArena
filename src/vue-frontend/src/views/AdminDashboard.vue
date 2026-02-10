<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import * as bootstrap from 'bootstrap';

const { t } = useI18n();
const router = useRouter();

// State
const games = ref<any[]>([]);
const places = ref<any[]>([]);
const sports = ref<any[]>([]);
const reports = ref<any[]>([]);
const bannedUsers = ref<any[]>([]);

// Forms
const addPlaceForm = reactive({
    name: '',
    sport: '',
    lat: '',
    lng: ''
});

const addSportName = ref('');

const editPlaceForm = reactive({
    id: '',
    name: '',
    sport: '',
    lat: '',
    lng: ''
});

const banUserForm = reactive({
    id: '',
    username: '',
    duration: '1d',
    reason: ''
});

// Loading states
const loading = ref({
    games: true,
    places: true,
    sports: true,
    reports: true,
    bannedUsers: true
});

// Modals
let editPlaceModal: bootstrap.Modal | null = null;
let banUserModal: bootstrap.Modal | null = null;

onMounted(() => {
    fetchGames();
    fetchPlaces();
    fetchSports();
    fetchReports();
    fetchBannedUsers();

    const editModalEl = document.getElementById('editPlaceModal');
    if (editModalEl) editPlaceModal = new bootstrap.Modal(editModalEl);

    const banModalEl = document.getElementById('banUserModal');
    if (banModalEl) banUserModal = new bootstrap.Modal(banModalEl);
});

const getAuthHeaders = (): HeadersInit => {
    const auth = localStorage.getItem('admin_auth');
    if (!auth) {
        router.push('/admin/login');
        return {};
    }
    return {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
    };
};

const handleAuthError = (response: Response) => {
    if (response.status === 401) {
        localStorage.removeItem('admin_auth');
        router.push('/admin/login');
        return true;
    }
    return false;
};

const logout = () => {
    localStorage.removeItem('admin_auth');
    router.push('/admin/login');
};

// Fetch Functions
const fetchGames = async () => {
    loading.value.games = true;
    try {
        const response = await fetch('/api/games');
        if (response.ok) {
            games.value = await response.json();
        }
    } catch (error) {
        console.error('Error loading games:', error);
    } finally {
        loading.value.games = false;
    }
};

const fetchPlaces = async () => {
    loading.value.places = true;
    try {
        const response = await fetch('/api/places');
        if (response.ok) {
            places.value = await response.json();
        }
    } catch (error) {
        console.error('Error loading places:', error);
    } finally {
        loading.value.places = false;
    }
};

const fetchSports = async () => {
    loading.value.sports = true;
    try {
        const response = await fetch('/api/sports');
        if (response.ok) {
            sports.value = await response.json();
        }
    } catch (error) {
        console.error('Error fetching sports:', error);
    } finally {
        loading.value.sports = false;
    }
};

const fetchReports = async () => {
    loading.value.reports = true;
    try {
        const response = await fetch('/api/reports', {
            headers: getAuthHeaders()
        });
        if (handleAuthError(response)) return;

        if (response.ok) {
            reports.value = await response.json();
        }
    } catch (error) {
        console.error('Error loading reports:', error);
    } finally {
        loading.value.reports = false;
    }
};

const fetchBannedUsers = async () => {
    loading.value.bannedUsers = true;
    try {
        const response = await fetch('/api/admin/banned-users', {
            headers: getAuthHeaders()
        });
        if (handleAuthError(response)) return;

        if (response.ok) {
            bannedUsers.value = await response.json();
        }
    } catch (error) {
        console.error('Error fetching banned users:', error);
    } finally {
        loading.value.bannedUsers = false;
    }
};

// Actions
const addPlace = async () => {
    const formData = {
        name: addPlaceForm.name,
        sport: addPlaceForm.sport,
        position: {
            lat: parseFloat(addPlaceForm.lat),
            lng: parseFloat(addPlaceForm.lng)
        }
    };

    try {
        const response = await fetch('/api/places', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(formData)
        });
        if (handleAuthError(response)) return;

        if (response.ok) {
            alert(t('admin.js.place_added'));
            addPlaceForm.name = '';
            addPlaceForm.sport = '';
            addPlaceForm.lat = '';
            addPlaceForm.lng = '';
            fetchPlaces();
        } else {
            const data = await response.json();
            alert(`Error adding place: ${data.message}`);
        }
    } catch (error) {
        console.error('Error adding place:', error);
        alert('Error adding place');
    }
};

const addSport = async () => {
    try {
        const response = await fetch('/api/sports', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ name: addSportName.value })
        });
        if (handleAuthError(response)) return;

        if (response.ok) {
            alert(t('admin.js.sport_added'));
            addSportName.value = '';
            fetchSports();
        } else {
            const data = await response.json();
            alert(`Error adding sport: ${data.message}`);
        }
    } catch (error) {
        console.error('Error adding sport:', error);
        alert('Error adding sport');
    }
};

const deletePlace = async (id: string) => {
    if (!confirm(t('admin.js.confirm_delete_place'))) return;

    try {
        const response = await fetch(`/api/places/${id}`, { 
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (handleAuthError(response)) return;

        if (response.ok) {
            alert(t('admin.js.place_deleted'));
            fetchPlaces();
        } else {
            const data = await response.json();
            alert(`Error deleting place: ${data.message}`);
        }
    } catch (error) {
        console.error('Error deleting place:', error);
        alert('Error deleting place');
    }
};

const openEditModal = (place: any) => {
    editPlaceForm.id = place._id;
    editPlaceForm.name = place.name;
    editPlaceForm.lat = place.position.lat;
    editPlaceForm.lng = place.position.lng;
    editPlaceForm.sport = place.sport ? (place.sport._id || place.sport) : '';
    editPlaceModal?.show();
};

const updatePlace = async () => {
    const formData = {
        name: editPlaceForm.name,
        sport: editPlaceForm.sport,
        position: {
            lat: parseFloat(editPlaceForm.lat),
            lng: parseFloat(editPlaceForm.lng)
        }
    };

    try {
        const response = await fetch(`/api/places/${editPlaceForm.id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(formData)
        });
        if (handleAuthError(response)) return;

        if (response.ok) {
            alert(t('admin.js.place_updated'));
            editPlaceModal?.hide();
            fetchPlaces();
        } else {
            const data = await response.json();
            alert(`Error updating place: ${data.message}`);
        }
    } catch (error) {
        console.error('Error updating place:', error);
        alert('Error updating place');
    }
};

const openBanModal = (userId: string, username: string) => {
    banUserForm.id = userId;
    banUserForm.username = username;
    banUserForm.reason = '';
    banUserForm.duration = '1d';
    banUserModal?.show();
};

const banUser = async () => {
    try {
        const response = await fetch('/api/admin/ban', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                userId: banUserForm.id,
                duration: banUserForm.duration,
                reason: banUserForm.reason
            })
        });
        if (handleAuthError(response)) return;

        if (response.ok) {
            alert('User has been banned successfully.');
            banUserModal?.hide();
            fetchReports();
            fetchBannedUsers();
        } else {
            const data = await response.json();
            alert(`Error banning user: ${data.message}`);
        }
    } catch (error) {
        console.error('Error banning user:', error);
        alert('Error banning user');
    }
};

const unbanUser = async (userId: string, username: string) => {
    if (!confirm(t('admin.js.confirm_unban', { username }))) return;

    try {
        const response = await fetch('/api/admin/unban', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ userId })
        });
        if (handleAuthError(response)) return;

        if (response.ok) {
            alert(t('admin.js.user_unbanned', { username }));
            fetchBannedUsers();
        } else {
            const data = await response.json();
            alert(`Error unbanning user: ${data.message}`);
        }
    } catch (error) {
        console.error('Error unbanning user:', error);
        alert('Error unbanning user');
    }
};

// Utils
const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT');
};

const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
};

const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('it-IT');
};

const calculateRemainingTime = (expiryDateString: string) => {
    const expiryDate = new Date(expiryDateString);
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();

    if (diffMs > 0) {
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHrs = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${diffDays}d ${diffHrs}h ${diffMins}m`;
    } else {
        return t('admin.js.expired');
    }
};


</script>

<template>
    <div class="container my-5">
        <div class="dashboard-header mb-4 d-flex justify-content-between align-items-center">
            <h1>{{ t('admin.title') }}</h1>
            <button @click="logout" class="btn btn-outline-danger">{{ t('admin.logout') }}</button>
        </div>

        <div class="dashboard-grid">
            <!-- Add Place Card -->
            <section class="dashboard-card">
                <h2>{{ t('admin.add_place') }}</h2>
                <form @submit.prevent="addPlace">
                    <div class="form-group mb-3">
                        <label for="name">{{ t('admin.name') }}</label>
                        <input type="text" id="name" v-model="addPlaceForm.name" class="form-control" required>
                    </div>
                    <div class="form-group mb-3">
                        <label for="sport">{{ t('admin.sport') }}</label>
                        <select id="sport" v-model="addPlaceForm.sport" class="form-control" required>
                            <option value="" disabled>{{ t('profile.select_sport') }}</option>
                            <option v-for="sport in sports" :key="sport._id" :value="sport._id">
                                {{ sport.name }}
                            </option>
                        </select>
                    </div>
                    <div class="form-group mb-3">
                        <label for="lat">{{ t('admin.lat') }}</label>
                        <input type="number" id="lat" v-model="addPlaceForm.lat" step="any" class="form-control"
                            placeholder="46.0..." required>
                    </div>
                    <div class="form-group mb-3">
                        <label for="lng">{{ t('admin.lng') }}</label>
                        <input type="number" id="lng" v-model="addPlaceForm.lng" step="any" class="form-control"
                            placeholder="11.1..." required>
                    </div>
                    <button type="submit" class="btn btn-success w-100">{{ t('admin.add_place_btn') }}</button>
                </form>
            </section>

            <!-- Sports Management Card -->
            <section class="dashboard-card">
                <h2>{{ t('admin.existing_sports') }}</h2>

                <div class="mb-4">
                    <h3>{{ t('admin.add_new_sport') }}</h3>
                    <form @submit.prevent="addSport" class="d-flex gap-2">
                        <input type="text" v-model="addSportName" class="form-control"
                             :placeholder="t('admin.sport_name_placeholder')" required>
                        <button type="submit" class="btn btn-primary">{{ t('admin.add_btn') }}</button>
                    </form>
                </div>

                <div>
                    <h3>{{ t('admin.existing_sports') }}</h3>
                    <ul class="list-group">
                        <li v-if="loading.sports" class="list-item text-center text-muted">{{ t('common.loading') }}</li>
                        <li v-for="sport in sports" :key="sport._id" class="list-item">
                            {{ sport.name }}
                        </li>
                    </ul>
                </div>
            </section>
        </div>

        <!-- Existing Places -->
        <section class="dashboard-card mt-4">
            <h2>{{ t('admin.existing_places') }}</h2>
            <div class="table-container">
                <table class="data-table table table-striped">
                    <thead>
                        <tr>
                            <th>{{ t('admin.table_name') }}</th>
                            <th>{{ t('admin.table_sport') }}</th>
                            <th>{{ t('admin.table_lat') }}</th>
                            <th>{{ t('admin.table_lng') }}</th>
                            <th>{{ t('admin.table_actions') }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="loading.places">
                            <td colspan="5" class="text-center">{{ t('common.loading') }}</td>
                        </tr>
                        <tr v-for="place in places" :key="place._id">
                            <td>{{ place.name }}</td>
                            <td>{{ place.sport?.name || t('admin.js.unknown') }}</td>
                            <td>{{ place.position.lat }}</td>
                            <td>{{ place.position.lng }}</td>
                            <td>
                                <button @click="openEditModal(place)" class="btn btn-warning btn-sm me-2">Edit</button>
                                <button @click="deletePlace(place._id)" class="btn btn-danger btn-sm">Delete</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>

        <!-- Games List -->
        <section class="dashboard-card mt-4">
            <h2>{{ t('admin.games_list') }}</h2>
            <div class="table-container">
                <table class="data-table table table-striped">
                    <thead>
                        <tr>
                            <th>{{ t('admin.table_sport') }}</th>
                            <th>{{ t('admin.table_name') }}</th>
                            <th>{{ t('admin.table_date') }}</th>
                            <th>{{ t('admin.table_time') }}</th>
                            <th>{{ t('admin.table_creator') }}</th>
                            <th>{{ t('admin.table_finished') }}</th>
                            <th>{{ t('admin.table_participants') }}</th>
                            <th>{{ t('admin.table_note') }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="loading.games">
                            <td colspan="8" class="text-center">{{ t('common.loading') }}</td>
                        </tr>
                        <tr v-for="game in games" :key="game._id">
                            <td>{{ game.sport?.name || t('admin.js.unknown') }}</td>
                            <td>{{ game.place?.name || t('admin.js.unknown') }}</td>
                            <td>{{ formatDate(game.date) }}</td>
                            <td>{{ formatTime(game.date) }}</td>
                            <td>{{ game.creator?.username || t('admin.js.unknown') }}</td>
                            <td>{{ game.isFinished ? t('admin.js.yes') : t('admin.js.no') }}</td>
                            <td>{{ game.participants?.length || 0 }} / {{ game.maxParticipants || '?' }}</td>
                            <td>{{ game.note }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>

        <!-- User Reports -->
        <section class="dashboard-card mt-4">
            <h2>{{ t('admin.user_reports') }}</h2>
            <div class="table-container">
                <table class="data-table table table-striped">
                    <thead>
                        <tr>
                            <th>{{ t('admin.table_date') }}</th>
                            <th>{{ t('admin.table_reporter') }}</th>
                            <th>{{ t('admin.table_reported_user') }}</th>
                            <th>{{ t('admin.table_motivation') }}</th>
                            <th>{{ t('admin.table_actions') }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="loading.reports">
                            <td colspan="5" class="text-center">{{ t('common.loading') }}</td>
                        </tr>
                        <tr v-for="report in reports" :key="report._id">
                            <td>{{ formatDateTime(report.date) }}</td>
                            <td>{{ report.reporter?.username || t('admin.js.unknown') }}</td>
                            <td>{{ report.reported?.username || t('admin.js.unknown') }}</td>
                            <td>{{ report.motivation }}</td>
                            <td>
                                <button v-if="report.reported?.isBanned" class="btn btn-secondary btn-sm" disabled>Banned</button>
                                <button v-else-if="report.reported" 
                                        @click="openBanModal(report.reported._id, report.reported.username)" 
                                        class="btn btn-danger btn-sm">Ban</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>

        <!-- Banned Users -->
        <section class="dashboard-card mt-4">
            <h2>{{ t('admin.banned_users') }}</h2>
            <div class="table-container">
                <table class="data-table table table-striped">
                    <thead>
                        <tr>
                            <th>{{ t('admin.table_username') }}</th>
                            <th>{{ t('admin.table_motivation') }}</th>
                            <th>{{ t('admin.table_ban_expiry') }}</th>
                            <th>{{ t('admin.table_remaining') }}</th>
                            <th>{{ t('admin.table_actions') }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="loading.bannedUsers">
                            <td colspan="5" class="text-center">{{ t('common.loading') }}</td>
                        </tr>
                        <tr v-for="user in bannedUsers" :key="user._id">
                            <td>{{ user.username }}</td>
                            <td>{{ user.banReason || 'No reason' }}</td>
                            <td>{{ user.banExpiresAt ? new Date(user.banExpiresAt).toLocaleString() : t('admin.js.forever') }}</td>
                            <td>{{ user.banExpiresAt ? calculateRemainingTime(user.banExpiresAt) : t('admin.js.forever') }}</td>
                            <td>
                                <button @click="unbanUser(user._id, user.username)" class="btn btn-success btn-sm">Unban</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>
    </div>

    <!-- Edit Place Modal -->
    <div class="modal fade" id="editPlaceModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">{{ t('admin.edit_place_title') }}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form @submit.prevent="updatePlace">
                        <div class="mb-3">
                            <label for="edit-name" class="form-label">{{ t('admin.name') }}</label>
                            <input type="text" class="form-control" id="edit-name" v-model="editPlaceForm.name" required>
                        </div>
                        <div class="mb-3">
                            <label for="edit-sport" class="form-label">{{ t('admin.sport') }}</label>
                            <select class="form-control" id="edit-sport" v-model="editPlaceForm.sport" required>
                                <option v-for="sport in sports" :key="sport._id" :value="sport._id">
                                    {{ sport.name }}
                                </option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label for="edit-lat" class="form-label">{{ t('admin.lat') }}</label>
                            <input type="number" class="form-control" id="edit-lat" step="any" v-model="editPlaceForm.lat" required>
                        </div>
                        <div class="mb-3">
                            <label for="edit-lng" class="form-label">{{ t('admin.lng') }}</label>
                            <input type="number" class="form-control" id="edit-lng" step="any" v-model="editPlaceForm.lng" required>
                        </div>
                        <button type="submit" class="btn btn-primary w-100">{{ t('admin.save_changes') }}</button>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <!-- Ban User Modal -->
    <div class="modal fade" id="banUserModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">{{ t('admin.ban_user_title') }}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form @submit.prevent="banUser">
                        <p>Banning user: <strong>{{ banUserForm.username }}</strong></p>
                        <div class="mb-3">
                            <label for="ban-duration" class="form-label">{{ t('admin.ban_duration') }}</label>
                            <select class="form-control" id="ban-duration" v-model="banUserForm.duration" required>
                                <option value="1d">1 Day</option>
                                <option value="1w">1 Week</option>
                                <option value="1m">1 Month</option>
                                <option value="forever">Forever</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label for="ban-reason" class="form-label">{{ t('admin.ban_reason') }}</label>
                            <input type="text" class="form-control" id="ban-reason" v-model="banUserForm.reason" required>
                        </div>
                        <button type="submit" class="btn btn-danger w-100">{{ t('admin.ban_confirm') }}</button>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped src="@/assets/css/style.css"></style>
