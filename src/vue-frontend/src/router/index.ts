
import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Dashboard from '../views/Dashboard.vue'
import Profile from '../views/Profile.vue'
import Map from '../views/Map.vue'
import Register from '../views/Register.vue'
import Leaderboard from '../views/Leaderboard.vue'
import AdminDashboard from '../views/AdminDashboard.vue'
import AdminLogin from '../views/AdminLogin.vue'
import Stats from '../views/Stats.vue'
import StatsLogin from '../views/StatsLogin.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/login',
            name: 'login',
            component: Login,
            meta: { guest: true }
        },
                {
            path: '/register',
            name: 'register',
            component: Register,
            meta: { guest: true }
        },
        {
            path: '/dashboard',
            name: 'dashboard',
            component: Dashboard,
            meta: { requiresAuth: true }
        },
        {
            path: '/profile',
            name: 'profile',
            component: Profile,
            meta: { requiresAuth: true }
        },
        {
            path: '/user/:username',
            name: 'user-profile',
            component: Profile,
            meta: { requiresAuth: true }
        },
        {
            path: '/map',
            name: 'map',
            component: Map,
            meta: { requiresAuth: true }
        },
        {
            path: '/leaderboard',
            name: 'leaderboard',
            component: Leaderboard,
            meta: { requiresAuth: true }
        },
        {
            path: '/admin',
            name: 'admin-dashboard',
            component: AdminDashboard,
            meta: { requiresAuth: true, requiresAdmin: true, hideNavbar: true }
        },
        {
            path: '/admin/login',
            name: 'admin-login',
            component: AdminLogin,
            meta: { hideNavbar: true }
        },
        {
            path: '/stats',
            name: 'stats',
            component: Stats,
            meta: { requiresAuth: true, requiresStats: true, hideNavbar: true }
        },
        {
            path: '/stats/login',
            name: 'stats-login',
            component: StatsLogin,
            meta: { hideNavbar: true }
        },
        {
            path: '/',
            redirect: '/dashboard'
        }
    ]
})

router.beforeEach(async (to, _from, next) => {
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
    const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin);
    const requiresStats = to.matched.some(record => record.meta.requiresStats);
    const isGuest = to.matched.some(record => record.meta.guest);

    if (requiresAdmin) {
        const adminAuth = localStorage.getItem('admin_auth');
        if (!adminAuth) {
            next('/admin/login');
            return;
        }
    }

    if (requiresStats) {
        const statsAuth = localStorage.getItem('stats_auth');
        if (!statsAuth) {
            next('/stats/login');
            return;
        }
    }

    try {
        const res = await fetch('/auth/current_user');
        const isAuthenticated = res.ok;

        if (requiresAuth && !isAuthenticated) {
            next('/login');
        } else if (isGuest && isAuthenticated) {
            next('/dashboard');
        } else {
            next();
        }
    } catch (e) {
        if (requiresAuth) next('/login');
        else next();
    }
});

export default router
