import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Game from '../src/backend/models/Game';
import Sport from '../src/backend/models/Sport';
import Place from '../src/backend/models/Place';
import User from '../src/backend/models/User';

dotenv.config();

const run = async () => {
    try {
        console.log('\n--- TEST: Game Model ---');
        console.log('Step 1: Connecting to DB...');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/trentoArena');
        console.log('[PASS] Connected.');

        // 1. Fetch dependencies
        const sport = await Sport.findOne();
        const place = await Place.findOne();

        // Ensure a user exists
        let user = await User.findOne({ email: 'testgame_model@example.com' });
        if (!user) {
            user = await User.create({
                username: 'testuser_game_model',
                email: 'testgame_model@example.com',
                password: 'password123'
            });
        }

        if (!sport || !place || !user) {
            console.error('[FAIL] Missing dependencies: Sport, Place, or User not found.');
            process.exit(1);
        }

        console.log('[PASS] Dependencies found/created.');

        // 2. Create a Game
        console.log('Step 2: Creating Game...');
        const newGame = new Game({
            sport: sport._id,
            place: place._id,
            creator: user._id,
            date: new Date(),
            note: 'This is a test game for verification.',
        });

        // 3. Save Game
        const savedGame = await newGame.save();
        if (savedGame) {
            console.log(`[PASS] Game saved successfully with ID: ${savedGame._id}`);
        } else {
            throw new Error('Game was not saved.');
        }

        // 4. Verify fetch (optional populate)
        console.log('Step 3: Verifying Game Fetch...');
        const fetchedGame = await Game.findById(savedGame._id)
            .populate('sport')
            .populate('place')
            .populate('creator');

        if (fetchedGame && fetchedGame.note === 'This is a test game for verification.') {
            console.log('[PASS] Game fetched and verified.');
        } else {
            throw new Error('Game fetch failed or data mismatch.');
        }

        // 5. Clean up
        console.log('Step 4: Cleaning up...');
        await Game.findByIdAndDelete(savedGame._id);
        await User.deleteOne({ email: 'testgame_model@example.com' });
        console.log('[PASS] Test game and user deleted.');

        process.exit(0);
    } catch (error) {
        console.error('\n[FAIL] Test Failed:', error);
        process.exit(1);
    }
};

run();
