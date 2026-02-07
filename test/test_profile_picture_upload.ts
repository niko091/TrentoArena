
import mongoose from 'mongoose';
import '../src/backend/models/Sport';
import User from '../src/backend/models/User';
import dotenv from 'dotenv';
import express from 'express';
import passport from 'passport';
import session from 'express-session';
import userRoutes from '../src/backend/routes/users';
import authRoutes from '../src/backend/routes/auth';
import request from 'supertest';
import '../src/backend/config/passport';

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

describe('Profile Picture Upload Tests', () => {
    const TEST_USER = {
        username: 'test_upload_user',
        email: 'test_upload@example.com',
        password: 'password123'
    };

    let userId: string;
    let uploadedFilePath: string | undefined;

    before(async () => {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/trentoarena');
        }
        await User.deleteMany({ email: TEST_USER.email });
    });

    after(async () => {
        await User.deleteMany({ email: TEST_USER.email });
    });

    it('Should register a user', async () => {
        const res = await request(app)
            .post('/auth/register')
            .send(TEST_USER)
            .expect(201);
        userId = res.body.user._id;
    });

    it('Should upload and resize a profile picture', async () => {
        // 1x1 pixel red PNG
        const pngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

        const res = await request(app)
            .post(`/api/users/${userId}/profile-picture`)
            .attach('profilePicture', pngBuffer, 'test.png')
            .expect(200);

        uploadedFilePath = res.body.profilePicture;
        if (!uploadedFilePath) throw new Error('No profile picture path returned');
    });
});
