<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

// State
const email = ref('');
const username = ref('');
const password = ref('');
const repeatPassword = ref('');
const loading = ref(false);
const error = ref('');

const router = useRouter();

const { t } = useI18n();

// Actions
const handleRegister = async () => {
    if (password.value !== repeatPassword.value) {
        alert(t('register.error_password_mismatch'));
        return;
    }

    loading.value = true;
    error.value = '';

    try {
        const response = await fetch('/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email.value,
                username: username.value,
                password: password.value
            })
        });

        const data = await response.json();

        if (response.ok) {
            router.push('/dashboard');
        } else {
            alert(data.msg || t('register.error_generic'));
            error.value = data.msg || t('register.error_generic');
        }
    } catch (err) {
        console.error('Error:', err);
        alert(t('register.error_connection'));
        error.value = t('register.error_connection');
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <div class="bg-light d-flex align-items-center justify-content-center vh-100">
        <div class="d-flex justify-content-center align-items-center min-vh-100 w-100">
            <div class="card loginregistrazione-card shadow-lg">
                <div class="card-body p-4">
                    <h2 class="card-title text-center mb-4" style="color: rgb(223, 103, 5);">
                        {{ t('register.title') }}
                    </h2>
                    
                    <form @submit.prevent="handleRegister">
                        <div class="mb-3">
                            <label for="InputEmail" class="form-label">{{ t('register.email') }}</label>
                            <input type="email" class="form-control" id="InputEmail" v-model="email" required>
                        </div>
                        <div class="mb-3">
                            <label for="InputName" class="form-label">{{ t('register.username') }}</label>
                            <input type="text" class="form-control" id="InputName" v-model="username" required>
                        </div>
                        <div class="mb-3">
                            <label for="InputPassword" class="form-label">{{ t('register.password') }}</label>
                            <input type="password" class="form-control" id="InputPassword" v-model="password" required>
                        </div>
                        <div class="mb-3">
                            <label for="InputRepeatPassword" class="form-label">{{ t('register.repeat_password') }}</label>
                            <input type="password" class="form-control" id="InputRepeatPassword" v-model="repeatPassword" required>
                        </div>
                        
                        <div class="text-center mt-4">
                            <button type="submit" class="btn btn-light border" style="color: #ff6347; font-weight: bold;" :disabled="loading">
                                <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                {{ t('register.submit') }}
                            </button>
                        </div>
                    </form>

                    <div v-if="error" class="alert alert-danger mt-3 text-center" role="alert">
                        {{ error }}
                    </div>

                    <hr class="my-4">
                    
                    <div class="text-center">
                        <form action="/auth/google" method="GET">
                            <button type="submit" class="btn btn-light border google-btn" style="color: #ff6347;">
                                <img src="/images/google-logo.png" width="24" height="24" class="me-2">
                                {{ t('register.google') }}
                            </button>
                        </form>
                    </div>

                    <!-- Link to Login -->
                    <div class="text-center mt-3">
                        <router-link to="/login" class="text-decoration-none">
                            Hai già un account? Accedi qui
                        </router-link>
                    </div>

                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Scoped styles to match original layout */
.loginregistrazione-card {
    width: 100%;
    max-width: 400px;
    border-radius: 12px;
    background-color: white;
}

.vh-100 {
    min-height: 100vh;
}

.google-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
}
</style>
