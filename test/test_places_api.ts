import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/backend/server';
import Place from '../src/backend/models/Place';
import dotenv from 'dotenv';

dotenv.config();

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
        console.log('[PASS] Connected.');

        // Cleanup
        await Place.deleteMany({ name: API_TEST_PLACE.name });

        // Step 2: Create Place
        console.log('Step 2: Testing POST /api/places...');
        const resPost = await request(app)
            .post('/api/places')
            .send(API_TEST_PLACE)
            .expect(201);

        if (resPost.body.name === API_TEST_PLACE.name && resPost.body.sport === API_TEST_PLACE.sport) {
            console.log(`[PASS] Place created: ${resPost.body.name}`);
        } else {
            throw new Error(`[FAIL] Expected name ${API_TEST_PLACE.name}, got ${resPost.body.name}`);
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
        console.log('[PASS] Cleaned up.');

        process.exit(0);

    } catch (err) {
        console.error('\n[FAIL] Test Failed:', err);
        process.exit(1);
    }
};

run();
