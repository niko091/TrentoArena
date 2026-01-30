import mongoose from 'mongoose';
import User from '../src/backend/models/User';
import dotenv from 'dotenv';

dotenv.config();

// Re-implementing the logic here for testing purposes since it's not exported from passport.ts
// In a real scenario, we might export the helper or test via the auth flow.
const generateUniqueUsername = async (baseName: string): Promise<string> => {
    let username = baseName;
    let userExists = await User.findOne({ username });

    while (userExists) {
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        username = `${baseName} ${randomSuffix}`;
        userExists = await User.findOne({ username });
    }

    return username;
};

const run = async () => {
    try {
        console.log('\n--- TEST: Unique Username Logic ---');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/trentoArena');
        console.log('[PASS] Connected to DB');

        const baseName = 'UniqueUserTest';

        // Cleanup
        await User.deleteMany({ username: { $regex: new RegExp(`^${baseName}`) } });

        // Create first user
        console.log('Step 1: Creating first user...');
        const user1 = await User.create({
            username: await generateUniqueUsername(baseName),
            email: 'test1@example.com',
            googleId: 'test_id_1'
        });
        console.log(`[PASS] User 1 created: ${user1.username}`);

        // Create second user with SAME base name
        console.log('Step 2: Creating second user with same base name...');
        const user2 = await User.create({
            username: await generateUniqueUsername(baseName),
            email: 'test2@example.com',
            googleId: 'test_id_2'
        });
        console.log(`[PASS] User 2 created: ${user2.username}`);

        console.log('Step 3: Verifying uniqueness...');
        if (user1.username === user2.username) {
            console.error('[FAIL] Usernames are identical!');
            process.exit(1);
        }

        if (user2.username.startsWith(baseName) && user2.username !== baseName) {
            console.log('[PASS] User 2 has a modified unique username.');
        } else {
            console.error(`[FAIL] User 2 username "${user2.username}" format unexpected.`);
            process.exit(1);
        }

        // Cleanup
        await User.deleteMany({ username: { $regex: new RegExp(`^${baseName}`) } });
        process.exit(0);

    } catch (err) {
        console.error('\n[FAIL] Test Failed:', err);
        process.exit(1);
    }
};

run();
