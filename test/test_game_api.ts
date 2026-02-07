
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
                date: '2026-01-01',
                time: '18:00',
                note: 'API_TEST_GAME',
                maxParticipants: 10
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
                date: '2026-01-01',
                time: '18:00'
            })
            .expect(401);
    });

    it('Step 5: Should FAIL to delete someone else\'s game', async () => {
        // Create another user
        const otherUser = {
            username: 'other_user',
            email: 'other_user@example.com',
            password: 'password123'
        };

        const agent2 = request.agent(app);
        await agent2.post('/auth/register').send(otherUser).expect(201);

        // Find the game created by the first user
        const game = await Game.findOne({ note: 'API_TEST_GAME' });
        if (!game) throw new Error('Game not found');

        // Try to delete as otherUser
        await agent2
            .delete(`/api/games/${game._id}`)
            .expect(403);

        await User.deleteOne({ email: 'other_user@example.com' });
    });

    it('Step 7: Should FINISH a game and SET WINNERS', async () => {
        // 1. Create a second user to be a participant
        const winnerUser = {
            username: 'winner_user',
            email: 'winner_user@example.com',
            password: 'password123'
        };
        const agentWin = request.agent(app);
        const winRes = await agentWin.post('/auth/register').send(winnerUser).expect(201);
        const winnerId = winRes.body.user._id;

        // 2. Get the game (assuming it's not deleted yet - we insert this BEFORE Step 6)
        const game = await Game.findOne({ note: 'API_TEST_GAME' });
        if (!game) throw new Error('Game not found');

        // 3. Join the game with second user
        await agentWin.post(`/api/games/${game._id}/join`).expect(200);

        // 4. Finish the game and set winner (Agent 1 is creator)
        await agent
            .patch(`/api/games/${game._id}/finish`)
            .send({ winnerIds: [winnerId] })
            .expect(200);

        // 5. Verify winners
        const finishedGame = await Game.findById(game._id);
        if (!finishedGame) throw new Error('Game not found after finish');
        if (!finishedGame.isFinished) throw new Error('Game not finished');

        const winnerParticipant = finishedGame.participants.find(p => p.user.toString() === winnerId);
        const loserParticipant = finishedGame.participants.find(p => p.user.toString() !== winnerId); // Creator

        if (!winnerParticipant) throw new Error('Winner participant not found');
        if (!loserParticipant) throw new Error('Loser participant not found');

        if (!winnerParticipant.winner) throw new Error('Winner not set correctly');
        if (loserParticipant.winner) throw new Error('Loser incorrectly marked as winner');

        // Cleanup user
        await User.deleteOne({ email: 'winner_user@example.com' });
    });

    it('Step 6: Should DELETE a game', async () => {
        const game = await Game.findOne({ note: 'API_TEST_GAME' });
        if (!game) throw new Error('Game not found');

        await agent
            .delete(`/api/games/${game._id}`)
            .expect(200);

        const checkedGame = await Game.findById(game._id);
        if (checkedGame) throw new Error('Game still exists');
    });
});
