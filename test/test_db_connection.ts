import mongoose from 'mongoose';
import User from '../src/backend/models/User';
import dotenv from 'dotenv';

dotenv.config();

const run = async () => {
    try {
        console.log('\n--- TEST: DB Connection & Basic CRUD ---');
        console.log('Step 1: Connecting to DB...');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/trentoArena');
        console.log('[PASS] Connected.');

        const testUser = {
            username: 'db_test_user',
            email: 'db_test@example.com',
            googleId: 'db_test_id_123'
        };

        // Clean up
        await User.deleteOne({ googleId: testUser.googleId });

        // Create
        console.log('Step 2: Creating user...');
        const user = await User.create(testUser);
        console.log(`[PASS] User created: ${user.username}`);

        // Find
        console.log('Step 3: Finding user...');
        const found = await User.findById(user._id);
        if (found) {
            console.log(`[PASS] User found: ${found.username}`);
        } else {
            console.error('[FAIL] User NOT found!');
            process.exit(1);
        }

        // Clean up
        console.log('Step 4: Cleaning up...');
        await User.deleteOne({ _id: user._id });
        console.log('[PASS] Cleaned up.');

        process.exit(0);
    } catch (err) {
        console.error('\n[FAIL] Test Failed:', err);
        process.exit(1);
    }
};

run();
