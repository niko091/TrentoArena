
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/backend/server';
import User from '../src/backend/models/User';
import Game from '../src/backend/models/Game';
import Sport from '../src/backend/models/Sport';
import Place from '../src/backend/models/Place';
import dotenv from 'dotenv';

dotenv.config();

describe('Game Retrieval API Tests', function () {
    this.timeout(10000);

    let sport1: any, sport2: any;
    let place1: any, place2: any;
    let user1: any, user2: any;

    before(async () => {
        // Connection Check similar to test_api.ts
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/trentoArena');
        } else {
            let retries = 20;
            while (mongoose.connection.readyState !== 1 && retries > 0) {
                await new Promise(resolve => setTimeout(resolve, 200));
                retries--;
            }
        }

        // Cleanup
        await User.deleteMany({ email: { $in: ['retrieval1@example.com', 'retrieval2@example.com'] } });
        await Game.deleteMany({ note: { $regex: 'RETRIEVAL_TEST' } });
        // We do NOT delete Sports/Places here to avoid breaking other tests, we assume they exist or we create specific ones.
        // Actually, let's create specific ones for reliable filtering.
        await Sport.deleteMany({ name: { $in: ['RetrievalSportA', 'RetrievalSportB'] } });
        await Place.deleteMany({ name: { $in: ['RetrievalPlaceA', 'RetrievalPlaceB'] } });


        // Setup Data
        sport1 = await Sport.create({ name: 'RetrievalSportA' });
        sport2 = await Sport.create({ name: 'RetrievalSportB' });

        place1 = await Place.create({ name: 'RetrievalPlaceA', sport: sport1._id, position: { lat: 0, lng: 0 } });
        place2 = await Place.create({ name: 'RetrievalPlaceB', sport: sport2._id, position: { lat: 0, lng: 0 } });

        user1 = await User.create({ username: 'retrieval1', email: 'retrieval1@example.com', password: 'pass', googleId: 'g1' });
        user2 = await User.create({ username: 'retrieval2', email: 'retrieval2@example.com', password: 'pass', googleId: 'g2' });

        // Create Games
        // Game 1: Sport1, Place1, User1, Past
        await Game.create({
            sport: sport1._id,
            place: place1._id,
            creator: user1._id,
            date: new Date('2023-01-01T10:00:00Z'),
            note: 'RETRIEVAL_TEST_1'
        });

        // Game 2: Sport1, Place1, User2, Future
        await Game.create({
            sport: sport1._id,
            place: place1._id,
            creator: user2._id,
            date: new Date('2030-01-01T10:00:00Z'),
            note: 'RETRIEVAL_TEST_2'
        });

        // Game 3: Sport2, Place2, User1, Future
        await Game.create({
            sport: sport2._id,
            place: place2._id,
            creator: user1._id,
            date: new Date('2030-02-01T10:00:00Z'),
            note: 'RETRIEVAL_TEST_3'
        });
    });

    after(async () => {
        await User.deleteMany({ email: { $in: ['retrieval1@example.com', 'retrieval2@example.com'] } });
        await Game.deleteMany({ note: { $regex: 'RETRIEVAL_TEST' } });
        await Sport.deleteMany({ name: { $in: ['RetrievalSportA', 'RetrievalSportB'] } });
        await Place.deleteMany({ name: { $in: ['RetrievalPlaceA', 'RetrievalPlaceB'] } });
    });

    it('Step 1: Should retrieve ALL games', async () => {
        const res = await request(app).get('/api/games').expect(200);
        // We expect at least the 3 we created
        const relevantGames = res.body.filter((g: any) => g.note && g.note.includes('RETRIEVAL_TEST'));
        if (relevantGames.length !== 3) throw new Error(`Expected 3 test games, got ${relevantGames.length}`);
    });

    it('Step 2: Should filter by SPORT', async () => {
        const res = await request(app).get(`/api/games?sportId=${sport1._id}`).expect(200);
        const relevantGames = res.body.filter((g: any) => g.note && g.note.includes('RETRIEVAL_TEST'));

        // Games 1 and 2 are Sport1
        if (relevantGames.length !== 2) throw new Error(`Expected 2 games for SportA, got ${relevantGames.length}`);
        if (relevantGames.some((g: any) => g.sport._id !== sport1._id.toString())) throw new Error('Got game with wrong sport');
    });

    it('Step 3: Should filter by CREATOR', async () => {
        const res = await request(app).get(`/api/games?creatorId=${user1._id}`).expect(200);
        const relevantGames = res.body.filter((g: any) => g.note && g.note.includes('RETRIEVAL_TEST'));

        // Games 1 and 3 are User1
        if (relevantGames.length !== 2) throw new Error(`Expected 2 games for User1, got ${relevantGames.length}`);
    });

    it('Step 4: Should filter by DATE RANGE', async () => {
        // Filter for future games (Game 2 and 3)
        // From 2029 to 2031
        const res = await request(app)
            .get('/api/games?startDate=2029-01-01&endDate=2031-01-01')
            .expect(200);

        const relevantGames = res.body.filter((g: any) => g.note && g.note.includes('RETRIEVAL_TEST'));

        if (relevantGames.length !== 2) throw new Error(`Expected 2 future games, got ${relevantGames.length}`);

        // Verify Past game NOT included
        if (relevantGames.find((g: any) => g.note === 'RETRIEVAL_TEST_1')) throw new Error('Found past game in future filter');
    });

    it('Step 5: Should combine filters (Sport + Date)', async () => {
        // Sport1 AND Future (Should be only Game 2)
        const res = await request(app)
            .get(`/api/games?sportId=${sport1._id}&startDate=2029-01-01`)
            .expect(200);

        const relevantGames = res.body.filter((g: any) => g.note && g.note.includes('RETRIEVAL_TEST'));

        if (relevantGames.length !== 1) throw new Error(`Expected 1 specific game, got ${relevantGames.length}`);
        if (relevantGames[0].note !== 'RETRIEVAL_TEST_2') throw new Error('Wrong game identified');
    });

    it('Step 6: Should not leak User Passwords', async () => {
        const res = await request(app).get('/api/games').expect(200);
        const game = res.body.find((g: any) => g.note === 'RETRIEVAL_TEST_1');
        if (game.creator.password) throw new Error('Password leaked in creator population');
    });

});
