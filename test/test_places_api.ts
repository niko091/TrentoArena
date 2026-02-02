import request from 'supertest';
import mongoose from 'mongoose';
import express from 'express';
import placeRoutes from '../src/backend/routes/places';
import sportRoutes from '../src/backend/routes/sports';
import Place from '../src/backend/models/Place';
import Sport from '../src/backend/models/Sport';
import dotenv from 'dotenv';
import passport from 'passport';

dotenv.config();

const app = express();
app.use(express.json());
app.use(passport.initialize()); // Initializes passport, though not strictly used if bypassing authn in this specific test file or if assuming open routes.
// However, looking at the original test, it just mounted routes directly.
// The real app verifies authentication. If these routes require auth, we need to mock it or user login.
// The original test didn't seem to login, implying these routes MIGHT be open or the test was bypassing auth.
// Checking routes/places.ts: It does NOT seem to look for `req.user` in the snippets I saw before.
// But wait, server.ts protects routes? No, only some pages.
// Let's check `src/backend/routes/places.ts`. It seems open in the snippet I saw.

app.use('/api/places', placeRoutes);
app.use('/api/sports', sportRoutes);

describe('Places API', () => {
    const API_TEST_PLACE = {
        name: 'Test Place',
        position: {
            lat: 46.0697,
            lng: 11.1211
        },
        sport: 'Football'
    };

    before(async () => {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/trentoArena');
        }
        await Place.deleteMany({ name: API_TEST_PLACE.name });
        await Sport.deleteMany({ name: 'Test Sport' });
    });

    after(async () => {
        await Place.deleteMany({ name: API_TEST_PLACE.name });
        await Sport.deleteMany({ name: 'Test Sport' });
    });

    it('Step 1: Should create a Place linked to a Sport', async () => {
        // 1. Create a Sport
        const sportRes = await request(app)
            .post('/api/sports')
            .send({ name: 'Test Sport' })
            .expect(201);

        const sportId = sportRes.body._id;

        // 2. Create a Place
        const newPlace = {
            name: 'Test Place',
            sport: sportId,
            position: { lat: 46.0, lng: 11.0 }
        };

        const res = await request(app)
            .post('/api/places')
            .send(newPlace)
            .expect(201);

        if (res.body.name !== newPlace.name) throw new Error('Name mismatch');
    });

    it('Step 2: Should retrieve places', async () => {
        const res = await request(app)
            .get('/api/places')
            .expect(200);

        if (!Array.isArray(res.body)) throw new Error('Response is not an array');
        const found = res.body.find((p: any) => p.name === API_TEST_PLACE.name);
        if (!found) throw new Error('Created place not found');
    });

    it('Step 3: Should reject invalid input', async () => {
        await request(app)
            .post('/api/places')
            .send({ name: 'Incomplete Place' })
            .expect(400);
    });
});
