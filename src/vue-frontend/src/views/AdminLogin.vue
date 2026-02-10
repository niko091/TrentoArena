<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const username = ref('');
const password = ref('');
const error = ref('');

const login = async () => {
    error.value = '';
    const credentials = btoa(`${username.value}:${password.value}`);

    try {
        // We test the credentials by hitting a protected endpoint
        // using the credentials we just entered.
        const response = await fetch('/api/admin/banned-users', {
            headers: {
                'Authorization': `Basic ${credentials}`
            }
        });

        if (response.ok) {
            localStorage.setItem('admin_auth', credentials);
            router.push('/admin');
        } else {
            error.value = 'Invalid credentials';
        }
    } catch (e) {
        console.error("Login error:", e);
        error.value = 'An error occurred';
    }
};
</script>

<template>
    <div class="container d-flex justify-content-center align-items-center vh-100">
        <div class="card shadow p-4" style="max-width: 400px; width: 100%;">
            <h2 class="text-center mb-4">Admin Login</h2>
            <form @submit.prevent="login">
                <div class="mb-3">
                    <label for="username" class="form-label">Username</label>
                    <input type="text" id="username" v-model="username" class="form-control" required>
                </div>
                <div class="mb-3">
                    <label for="password" class="form-label">Password</label>
                    <input type="password" id="password" v-model="password" class="form-control" required>
                </div>
                <div v-if="error" class="alert alert-danger">{{ error }}</div>
                <button type="submit" class="btn btn-primary w-100">Login</button>
            </form>
        </div>
    </div>
</template>
