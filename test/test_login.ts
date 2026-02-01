import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/backend/server';
import User from '../src/backend/models/User';
import dotenv from 'dotenv';

dotenv.config();

const API_TEST_USER = {
    username: 'login_test_user',
    email: 'login_test@example.com',
    password: 'password123'
};

const run = async () => {
    try {
        console.log('\n--- TEST: Login API ---');

        // Step 1: Connect to DB
        console.log('Step 1: Connecting to DB...');
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/trentoArena');
        }

        // Cleanup before start
        await User.deleteMany({ email: API_TEST_USER.email });

        // Step 2: Register User
        console.log('Step 2: Registering User...');
        await request(app)
            .post('/auth/register')
            .send(API_TEST_USER)
            .expect(201);

        // Step 3: Login with Email
        console.log('Step 3: Login with Email...');
        const resEmail = await request(app)
            .post('/auth/login')
            .send({
                email: API_TEST_USER.email,
                password: API_TEST_USER.password
            })
            .expect(200);

        if (resEmail.body.user.email === API_TEST_USER.email) {
            console.log('[PASS] Login with Email success');
        } else {
            throw new Error('[FAIL] Login with Email failed to return user');
        }

        // logout (optional, but good practice if session persists, though supertest agents usually don't persist cookies unless configured)

        // Step 4: Login with Username
        console.log('Step 4: Login with Username...');
        const resUsername = await request(app)
            .post('/auth/login')
            .send({
                email: API_TEST_USER.username, // We send username in the 'email' field as per logic
                password: API_TEST_USER.password
            })
            .expect(200);

        if (resUsername.body.user.username === API_TEST_USER.username) {
            console.log('[PASS] Login with Username success');
        } else {
            throw new Error('[FAIL] Login with Username failed to return user');
        }

        // Step 5: Invalid Login
        console.log('Step 5: Invalid Login...');
        await request(app)
            .post('/auth/login')
            .send({
                email: 'wrong_user',
                password: 'password123'
            })
            .expect(400); // Or 401 depending on passport config, but usually 400/401
        console.log('[PASS] Invalid login rejected');

        // Cleanup
        await User.deleteMany({ email: API_TEST_USER.email });
        console.log('[PASS] Cleaned up.');

        process.exit(0);

    } catch (err) {
        console.error('\n[FAIL] Test Failed:', err);
        process.exit(1);
    }
};

run();
