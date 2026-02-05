
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
import path from 'path';
import fs from 'fs';
import { frontendPath } from '../src/backend/config/paths';

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
        if (uploadedFilePath) {
            const fullPath = path.join(frontendPath, uploadedFilePath);
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
            }
        }
    });

    it('Should register a user', async () => {
        const res = await request(app)
            .post('/auth/register')
            .send(TEST_USER)
            .expect(201);
        userId = res.body.user._id;
    });

    it('Should upload and resize a profile picture', async () => {
        // Create a large dummy image buffer (approx 1MB of zeroes, header simulated)
        // Actually, sharp needs a valid image. Let's create a real minimal JPEG or PNG buffer manually 
        // or just use a small fixture if possible.
        // Better: use a simple 1x1 valid PNG buffer.

        // 1x1 pixel red PNG
        const pngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

        const res = await request(app)
            .post(`/api/users/${userId}/profile-picture`)
            .attach('profilePicture', pngBuffer, 'test.png')
            .expect(200);

        uploadedFilePath = res.body.profilePicture;
        if (!uploadedFilePath) throw new Error('No profile picture path returned');

        const fullPath = path.join(frontendPath, uploadedFilePath);
        if (!fs.existsSync(fullPath)) {
            throw new Error('File was not saved to disk');
        }

        // Check if it was converted to JPEG (our code enforces jpeg)
        if (!uploadedFilePath.endsWith('.jpeg')) {
            throw new Error('File extension is not .jpeg');
        }

        const stats = fs.statSync(fullPath);
        if (stats.size === 0) throw new Error('File is empty');

        console.log('Uploaded file size:', stats.size, 'bytes');
    });
});
