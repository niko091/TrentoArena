import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/backend/server';
import Place from '../src/backend/models/Place';
import Sport from '../src/backend/models/Sport';
import dotenv from 'dotenv';
import express from 'express'; // Added express import
import placeRoutes from '../src/backend/routes/places'; // Added placeRoutes import
import sportRoutes from '../src/backend/routes/sports'; // Added sportRoutes import

dotenv.config();

// The original `app` import from '../src/backend/server' is replaced
// with a new Express app instance created here for testing purposes,
// and routes are registered directly in the test file.
const testApp = express();
testApp.use(express.json());
testApp.use('/api/places', placeRoutes);
testApp.use('/api/sports', sportRoutes);

const API_TEST_PLACE = {
    name: 'Test Place',
    position: {
        lat: 46.0697,
        lng: 11.1211
    },
    sport: 'Football'
};

const run = async () => {
    try {
        console.log('\n--- TEST: Places API ---');

        // Step 1: Connect to DB
        console.log('Step 1: Connecting to DB...');
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/trentoArena');
        }
        // 1. Create a Sport first (since Place requires a valid Sport ID)
        console.log('Step 2a: Creating a Sport...');
        const sportRes = await request(app)
            .post('/api/sports')
            .send({ name: 'Test Sport' })
            .expect(201);

        const sportId = sportRes.body._id;

        // 2. Create a Place
        console.log('Step 2b: Testing POST /api/places...');
        const newPlace = {
            name: 'Test Place',
            sport: sportId, // Use the ID
            position: { lat: 46.0, lng: 11.0 }
        };

        const res = await request(app)
            .post('/api/places')
            .send(newPlace)
            .expect(201);

        if (res.body.name === newPlace.name && res.body.sport === newPlace.sport) {
            console.log(`[PASS] Place created: ${res.body.name}`);
        } else {
            throw new Error(`[FAIL] Expected name ${newPlace.name}, got ${res.body.name}`);
        }

        // Step 3: Retrieve Places
        console.log('Step 3: Testing GET /api/places...');
        const resGet = await request(app)
            .get('/api/places')
            .expect(200);

        if (!Array.isArray(resGet.body)) {
            throw new Error('[FAIL] Expected response to be an array');
        }

        const found = resGet.body.find((p: any) => p.name === API_TEST_PLACE.name);
        if (found) {
            console.log(`[PASS] Created place found in list.`);
        } else {
            throw new Error('[FAIL] Created place not found in the list');
        }

        // Step 4: Test Invalid Input
        console.log('Step 4: Testing POST /api/places with missing fields...');
        await request(app)
            .post('/api/places')
            .send({ name: 'Incomplete Place' })
            .expect(400);
        console.log('[PASS] correctly rejected invalid input.');

        // Cleanup
        await Place.deleteMany({ name: API_TEST_PLACE.name });
        await Sport.deleteMany({ name: 'Test Sport' });
        console.log('[PASS] Cleaned up.');

        process.exit(0);

    } catch (err) {
        console.error('\n[FAIL] Test Failed:', err);
        process.exit(1);
    }
};

run();
