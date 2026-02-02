import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Game from '../src/backend/models/Game';
import Sport from '../src/backend/models/Sport';
import Place from '../src/backend/models/Place';
import User from '../src/backend/models/User';

dotenv.config();

describe('Game Model Tests', () => {

    let sport: any;
    let place: any;
    let user: any;

    before(async () => {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/trentoArena');
        }

        // Ensure dependencies exist
        sport = await Sport.findOne();
        if (!sport) {
            sport = await Sport.create({ name: 'Football' });
        }

        place = await Place.findOne();
        if (!place) {
            place = await Place.create({
                name: 'Test Place Game Model',
                sport: sport._id,
                position: { lat: 46.0, lng: 11.0 }
            });
        }

        user = await User.findOne({ email: 'testgame_model@example.com' });
        if (!user) {
            user = await User.create({
                username: 'testuser_game_model',
                email: 'testgame_model@example.com',
                password: 'password123'
            });
        }

        if (!sport || !place || !user) {
            throw new Error('Dependencies missing (Sport/Place/User)');
        }
    });

    after(async () => {
        await Game.deleteMany({ note: 'This is a test game for verification.' });
        await User.deleteOne({ email: 'testgame_model@example.com' });
    });

    it('Step 1: Should create and save a game', async () => {
        const newGame = new Game({
            sport: sport._id,
            place: place._id,
            creator: user._id,
            date: new Date(),
            note: 'This is a test game for verification.',
        });

        const savedGame = await newGame.save();
        if (!savedGame) throw new Error('Game not saved');

        const fetchedGame = await Game.findById(savedGame._id)
            .populate('sport')
            .populate('place')
            .populate('creator');

        if (!fetchedGame) throw new Error('Game not fetched');
        if (fetchedGame.note !== 'This is a test game for verification.') throw new Error('Note mismatch');
    });
});
