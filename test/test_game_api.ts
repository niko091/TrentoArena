
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/backend/server';
import User from '../src/backend/models/User';
import Game from '../src/backend/models/Game';
import Sport from '../src/backend/models/Sport';
import Place from '../src/backend/models/Place';
import dotenv from 'dotenv';

dotenv.config();

const API_TEST_USER = {
    username: 'api_game_test_user',
    email: 'api_game_test@example.com',
    password: 'password123'
};

describe('Game API Tests', () => {

    let sportId: string;
    let placeId: string;

    before(async () => {
        // Connect if not connected
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/trentoArena');
        }

        // Cleanup
        await User.deleteMany({ email: API_TEST_USER.email });
        await Game.deleteMany({ note: 'API_TEST_GAME' });

        // Get dependencies or create them
        let sport = await Sport.findOne();
        if (!sport) {
            sport = await Sport.create({ name: 'Football' });
        }

        let place = await Place.findOne();
        if (!place) {
            place = await Place.create({
                name: 'Test Place Game API',
                sport: sport._id,
                position: { lat: 46.0, lng: 11.0 }
            });
        }

        sportId = sport._id.toString();
        placeId = place._id.toString();
    });

    after(async () => {
        await User.deleteMany({ email: API_TEST_USER.email });
        await Game.deleteMany({ note: 'API_TEST_GAME' });
        // await mongoose.connection.close(); 
    });

    const agent = request.agent(app);

    it('Step 1: Should REGISTER and LOGIN', async () => {
        await agent
            .post('/auth/register')
            .send(API_TEST_USER)
            .expect(201);
    });

    it('Step 2: Should FAIL to create game without required fields', async () => {
        await agent
            .post('/api/games')
            .send({
                sportId,
                // Missing placeId, date, time
            })
            .expect(400); // Bad Request
    });

    it('Step 3: Should CREATE a new game', async () => {
        const res = await agent
            .post('/api/games')
            .send({
                sportId,
                placeId,
                date: '2026-10-10',
                time: '18:00',
                note: 'API_TEST_GAME'
            })
            .expect(201);

        if (!res.body._id) throw new Error('Game ID missing');
        if (res.body.note !== 'API_TEST_GAME') throw new Error('Note mismatch');

        // Verify DB
        const game = await Game.findById(res.body._id);
        if (!game) throw new Error('Game not found in DB');
        if (game.creator.toString() === '') throw new Error('Creator missing');
    });

    it('Step 4: Should FAIL if unauthenticated', async () => {
        const anon = request.agent(app);
        await anon
            .post('/api/games')
            .send({
                sportId,
                placeId,
                date: '2026-10-10',
                time: '18:00'
            })
            .expect(401);
    });

});
