import mongoose from 'mongoose';
import User from '../src/backend/models/User';
import dotenv from 'dotenv';

dotenv.config();

describe('User Model Tests', () => {

    before(async () => {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/trentoArena');
        }
        await User.deleteMany({ username: 'testuser' });
    });

    after(async () => {
        await User.deleteMany({ username: 'testuser' });
    });

    it('Step 1: Should save and retrieve a user', async () => {
        const newUser = new User({
            username: 'testuser',
            email: 'test@example.com',
            googleId: '123456789'
        });

        await newUser.save();

        const foundUser = await User.findOne({ username: 'testuser' });
        if (!foundUser) throw new Error('User not found');
        if (foundUser.email !== 'test@example.com') throw new Error('Email mismatch');
    });
});
