
import mongoose from 'mongoose';
import '../src/backend/models/Sport'; // Register Sport model
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

describe('User API Tests', () => {
    const TEST_USER = {
        username: 'test_user_api',
        email: 'test_user_api@example.com',
        password: 'password123'
    };

    let userId: string;

    before(async () => {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/trentoarena');
        }
        await User.deleteMany({ email: TEST_USER.email });
        await User.deleteMany({ email: 'friend@example.com' });
    });

    after(async () => {
        await User.deleteMany({ email: TEST_USER.email });
        await User.deleteMany({ email: 'friend@example.com' });
    });

    it('Step 1: Should register a user', async () => {
        const res = await request(app)
            .post('/auth/register')
            .send(TEST_USER)
            .expect(201);

        userId = res.body.user._id;
        if (!userId) throw new Error('User ID missing');
    });

    it('Step 2: Should fetch user info', async () => {
        const res = await request(app)
            .get(`/api/users/${userId}`)
            .expect(200);

        if (res.body.password) throw new Error('Password returned in API');
        if (res.body.username !== TEST_USER.username) throw new Error('Username mismatch');
    });

    it('Step 3: Should handle friend requests', async () => {
        // Create Requester
        const FRIEND_USER = {
            username: 'friend_user',
            email: 'friend@example.com',
            password: 'password123'
        };

        const regRes = await request(app)
            .post('/auth/register')
            .send(FRIEND_USER)
            .expect(201);
        const requesterId = regRes.body.user._id;

        // Send request
        await request(app)
            .post(`/api/users/${userId}/friend-requests`)
            .send({ requesterId: requesterId })
            .expect(200);

        // Verify received
        const userRes = await request(app)
            .get(`/api/users/${userId}`)
            .expect(200);

        if (userRes.body.friendRequests[0].username !== FRIEND_USER.username) {
            throw new Error('Friend request not received');
        }

        // Accept
        await request(app)
            .post(`/api/users/${userId}/friends/accept`)
            .send({ requesterId: requesterId })
            .expect(200);

        // Verify accepted
        const finalUserRes = await request(app)
            .get(`/api/users/${userId}`)
            .expect(200);

        if (finalUserRes.body.friends[0].username !== FRIEND_USER.username) {
            throw new Error('Friend not added');
        }
        if (finalUserRes.body.friendRequests.length !== 0) {
            throw new Error('Friend request not removed');
        }
    });

    it('Step 4: Should remove a friend', async () => {

        // Re-fetch user to get the friend ID
        const userRes = await request(app).get(`/api/users/${userId}`);
        const friendId = userRes.body.friends[0]._id;

        await request(app)
            .delete(`/api/users/${userId}/friends/${friendId}`)
            .expect(200);

        // Verify removal
        const finalUserRes = await request(app).get(`/api/users/${userId}`);
        if (finalUserRes.body.friends.length !== 0) {
            throw new Error('Friend not removed from user');
        }

        const finalFriendRes = await request(app).get(`/api/users/${friendId}`);
        if (finalFriendRes.body.friends.length !== 0) {
            throw new Error('User not removed from friend\'s list');
        }
    });

});
