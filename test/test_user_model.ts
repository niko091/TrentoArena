import mongoose from 'mongoose';
import User from '../src/backend/models/User';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const run = async () => {
    try {
        console.log('\n--- TEST: User Model ---');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/trentoArena');
        console.log('[PASS] Connected to DB');

        // Cleanup previous test data
        await User.deleteMany({ username: 'testuser' });

        console.log('Step 1: Creating new user...');
        const newUser = new User({
            username: 'testuser',
            email: 'test@example.com',
            googleId: '123456789'
        });

        await newUser.save();
        console.log('[PASS] User saved successfully');

        console.log('Step 2: Retrieving user...');
        const foundUser = await User.findOne({ username: 'testuser' });
        if (foundUser) {
            console.log('[PASS] User found correctly');
        } else {
            console.error('[FAIL] User not found');
            process.exit(1);
        }

        process.exit(0);
    } catch (err) {
        console.error('\n[FAIL] Test Failed:', err);
        process.exit(1);
    }
};

run();
