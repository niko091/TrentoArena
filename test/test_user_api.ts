
import mongoose from 'mongoose';
import User from '../src/backend/models/User';
import dotenv from 'dotenv';
import express from 'express';
import passport from 'passport';
import session from 'express-session';
import userRoutes from '../src/backend/routes/users';
import authRoutes from '../src/backend/routes/auth';
import request from 'supertest';
import '../src/backend/config/passport'; // Ensure passport config is loaded

dotenv.config();

const app = express();
app.use(express.json());
app.use(session({
    secret: 'testdoc',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', authRoutes);
app.use('/api/users', userRoutes);

const TEST_USER = {
    username: 'test_user_api',
    email: 'test_user_api@example.com',
    password: 'password123'
};

async function run() {
    console.log('\n--- User API Test ---');

    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/trentoarena');
    await User.deleteMany({ email: TEST_USER.email });

    try {
        // 1. Register User
        console.log('1. Registering User...');
        const registerRes = await request(app)
            .post('/auth/register')
            .send(TEST_USER)
            .expect(201);

        const userId = registerRes.body.user._id;
        console.log(`   User registered with ID: ${userId}`);

        // 2. Fetch User Info
        console.log('2. Fetching User Info...');
        const userRes = await request(app)
            .get(`/api/users/${userId}`)
            .expect(200);

        console.log('   User retrieved:', userRes.body);

        // 3. Verify Data
        if (userRes.body.password) {
            throw new Error('FAILED: Password should not be returned');
        }
        if (userRes.body.username !== TEST_USER.username) {
            throw new Error(`FAILED: Expected username ${TEST_USER.username}, got ${userRes.body.username}`);
        }

        // 4. Test Friend Request Logic
        console.log('3. Testing Friend Request Logic...');

        // Create a second user (Requester)
        const FRIEND_USER = {
            username: 'friend_user',
            email: 'friend@example.com',
            password: 'password123'
        };

        const friendRegRes = await request(app)
            .post('/auth/register')
            .send(FRIEND_USER)
            .expect(201);
        const requesterId = friendRegRes.body.user._id;

        // Step 4a: Send Friend Request (Requester -> Test User)
        console.log('   Sending request...');
        await request(app)
            .post(`/api/users/${userId}/friend-requests`)
            .send({ requesterId: requesterId })
            .expect(200);

        // Verify request received
        const userWithReqRes = await request(app)
            .get(`/api/users/${userId}`)
            .expect(200);

        const requests = userWithReqRes.body.friendRequests;
        if (!requests || requests.length === 0 || requests[0].username !== FRIEND_USER.username) {
            throw new Error('FAILED: Friend request not received');
        }

        // Step 4b: Accept Friend Request
        console.log('   Accepting request...');
        await request(app)
            .post(`/api/users/${userId}/friends/accept`)
            .send({ requesterId: requesterId })
            .expect(200);

        // Verify Friend Added (Mutual Check)
        const userWithFriendRes = await request(app)
            .get(`/api/users/${userId}`)
            .expect(200);

        const friends = userWithFriendRes.body.friends;
        if (!Array.isArray(friends) || friends.length === 0) {
            throw new Error('FAILED: Friends list is empty');
        }
        if (friends[0].username !== FRIEND_USER.username) {
            throw new Error(`FAILED: Expected friend ${FRIEND_USER.username}, got ${friends[0].username}`);
        }

        // Verify Request Removed
        if (userWithFriendRes.body.friendRequests.length !== 0) {
            throw new Error('FAILED: Friend request was not removed after acceptance');
        }

        console.log('PASSED: Friend Request Flow verification successful');

    } catch (error) {
        console.error('FAILED:', error);
        process.exit(1);
    } finally {
        await User.deleteMany({ email: TEST_USER.email });
        await User.deleteMany({ email: 'friend@example.com' }); // Cleanup friend
        await mongoose.disconnect();
    }
}

run();
