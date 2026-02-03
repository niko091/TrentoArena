import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/backend/server';
import User from '../src/backend/models/User';
import Game from '../src/backend/models/Game';
import Sport from '../src/backend/models/Sport';
import Place from '../src/backend/models/Place';
import dotenv from 'dotenv';

dotenv.config();

const ELO_TEST_PREFIX = 'ELO_TEST';

describe('ELO System Tests', () => {

    let sportId: string;
    let placeId: string;

    before(async () => {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/trentoArena');
        }

        // Cleanup
        await User.deleteMany({ username: new RegExp(ELO_TEST_PREFIX) });
        await Game.deleteMany({ note: ELO_TEST_PREFIX });

        let sport = await Sport.findOne({ name: 'Chess' });
        if (!sport) sport = await Sport.create({ name: 'Chess' });
        sportId = sport._id.toString();

        let place = await Place.findOne();
        if (!place) place = await Place.create({ name: 'Park', sport: sportId, position: { lat: 0, lng: 0 } });
        placeId = place._id.toString();
    });

    after(async () => {
        await User.deleteMany({ username: new RegExp(ELO_TEST_PREFIX) });
        await Game.deleteMany({ note: ELO_TEST_PREFIX });
    });

    it('Step 1: Should update ELOs correctly after a game', async () => {
        // Create 2 users
        const winner = { username: `${ELO_TEST_PREFIX}_Winner`, email: 'winner@elo.com', password: 'password' };
        const loser = { username: `${ELO_TEST_PREFIX}_Loser`, email: 'loser@elo.com', password: 'password' };

        const agentW = request.agent(app);
        const agentL = request.agent(app);

        const resW = await agentW.post('/auth/register').send(winner).expect(201);
        const resL = await agentL.post('/auth/register').send(loser).expect(201);

        const winnerId = resW.body.user._id;
        const loserId = resL.body.user._id;

        // Create Game (Winner is creator)
        const gameRes = await agentW.post('/api/games').send({
            sportId, placeId, date: '2026-12-12', time: '10:00',
            note: ELO_TEST_PREFIX, maxParticipants: 2
        }).expect(201);
        const gameId = gameRes.body._id;

        // Loser joins
        await agentL.post(`/api/games/${gameId}/join`).expect(200);

        // Verify initial ELOs (should be empty or undefined, logic defaults to 1200)
        let wUser = await User.findById(winnerId);
        let lUser = await User.findById(loserId);
        // Note: sportsElo is initialized empty usually

        // Finish Game
        await agentW.patch(`/api/games/${gameId}/finish`).send({
            winnerIds: [winnerId]
        }).expect(200);

        // Verify ELO updates
        wUser = await User.findById(winnerId);
        lUser = await User.findById(loserId);

        if (!wUser || !lUser) throw new Error('Users not found');

        const wEloEntry = wUser.sportsElo?.find(e => e.sport.toString() === sportId);
        const lEloEntry = lUser.sportsElo?.find(e => e.sport.toString() === sportId);

        if (!wEloEntry || !lEloEntry) throw new Error('ELO entries not created');

        console.log(`Winner ELO: ${wEloEntry.elo}, Loser ELO: ${lEloEntry.elo}`);

        // Default was 1200. Winner should gain, Loser should lose.
        // K=32, Expected=0.5. Win=1. Change = +16.
        // Winner ~ 1216, Loser ~ 1184

        if (wEloEntry.elo <= 1200) throw new Error('Winner ELO did not increase');
        if (lEloEntry.elo >= 1200) throw new Error('Loser ELO did not decrease');

        // Verify History
        if (!wEloEntry.history || wEloEntry.history.length === 0) throw new Error('Winner History not created');
        if (!lEloEntry.history || lEloEntry.history.length === 0) throw new Error('Loser History not created');

        const wHist = wEloEntry.history[0];
        if (wHist.elo !== wEloEntry.elo) throw new Error('Winner History ELO mismatch');
        if (wHist.change <= 0) throw new Error('Winner History Change incorrect');
    });

});
