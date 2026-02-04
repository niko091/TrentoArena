import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/backend/server';
import User from '../src/backend/models/User';
import Place from '../src/backend/models/Place';
import Sport from '../src/backend/models/Sport';
import dotenv from 'dotenv';
import assert from 'assert';

dotenv.config();

const SEARCH_PREFIX = 'SEARCH_TEST_';

describe('Search API Tests', () => {

    let sportId: string;
    const SEARCH_SPORT_NAME = 'FakeSportForSearchTest';

    before(async () => {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/trentoArena');
        }

        // Cleanup
        await User.deleteMany({ username: new RegExp(SEARCH_PREFIX) });
        await Place.deleteMany({ name: new RegExp(SEARCH_PREFIX) });
        await Sport.deleteOne({ name: SEARCH_SPORT_NAME });

        // Setup Data
        let sport = await Sport.create({ name: SEARCH_SPORT_NAME });
        sportId = sport._id.toString();

        await User.create({
            username: `${SEARCH_PREFIX}Giorgio`,
            email: `giorgio@search.com`,
            password: 'password'
        });

        await User.create({
            username: `${SEARCH_PREFIX}Mario`,
            email: `mario@search.com`,
            password: 'password'
        });

        await Place.create({
            name: `${SEARCH_PREFIX}CentralPark`,
            sport: sportId,
            position: { lat: 0, lng: 0 }
        });
    });

    after(async () => {
        await User.deleteMany({ username: new RegExp(SEARCH_PREFIX) });
        await Place.deleteMany({ name: new RegExp(SEARCH_PREFIX) });
        await Sport.deleteOne({ _id: sportId });
    });

    it('Should search users by username', async () => {
        const res = await request(app).get(`/api/users/search?query=${SEARCH_PREFIX}Gio`).expect(200);

        assert(res.body.length > 0);
        assert.strictEqual(res.body[0].username, `${SEARCH_PREFIX}Giorgio`);
    });

    it('Should search places by name', async () => {
        const res = await request(app).get(`/api/places/search?query=${SEARCH_PREFIX}Central`).expect(200);

        assert(res.body.length > 0);
        assert.strictEqual(res.body[0].name, `${SEARCH_PREFIX}CentralPark`);
    });

    it('Should return 400 if query is missing', async () => {
        await request(app).get('/api/users/search').expect(400);
        await request(app).get('/api/places/search').expect(400);
    });
});
