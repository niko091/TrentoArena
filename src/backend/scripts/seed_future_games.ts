import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { faker } from '@faker-js/faker';
import User, { IUser } from '../models/User';
import Game from '../models/Game';
import Sport from '../models/Sport';
import Place from '../models/Place';

dotenv.config();

const GAMES_TO_SIMULATE = 1000;

const seedGames = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI is not defined in .env file');
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // 1. Fetch Resources
        const users = await User.find();
        const sports = await Sport.find();
        const places = await Place.find();

        if (users.length < 2) throw new Error('Not enough users to simulate games.');
        if (sports.length === 0) throw new Error('No sports found.');
        if (places.length === 0) throw new Error('No places found.');

        console.log(`Found ${users.length} users, ${sports.length} sports, ${places.length} places.`);

        // 2. Generate Games (In Memory)
        console.log(`Generating ${GAMES_TO_SIMULATE} games...`);
        const gamesToProcess: any[] = [];

        for (let i = 0; i < GAMES_TO_SIMULATE; i++) {
            const sport = faker.helpers.arrayElement(sports);

            // Filter places for this sport
            const sportPlaces = places.filter(p => p.sport.toString() === sport._id.toString());

            if (sportPlaces.length === 0) continue;

            const place = faker.helpers.arrayElement(sportPlaces);
            const date = faker.date.between({
                from: '2026-02-26',
                to: '2026-03-20'
            });

            // Select 2 unique participants
            const participants = faker.helpers.arrayElements(users, 2);
            const winner = faker.helpers.arrayElement(participants);

            gamesToProcess.push({
                sport,
                place,
                date,
                participants,
                winner
            });
        }

        // 3. Process Games
        let processedCount = 0;

        for (const gameData of gamesToProcess) {
            const p1 = users.find(u => u._id.toString() === gameData.participants[0]._id.toString());
            const p2 = users.find(u => u._id.toString() === gameData.participants[1]._id.toString());

            if (!p1 || !p2) continue;

            // Save Game
            await Game.create({
                sport: gameData.sport._id,
                place: gameData.place._id,
                creator: p1._id,
                date: gameData.date,
                note: 'Simulation',
                isFinished: false,
                maxParticipants: 2,
                participants: [
                    { user: p1._id, winner: false },
                    { user: p2._id, winner: false }
                ]
            });

            processedCount++;
            if (processedCount % 50 === 0) console.log(`Processed ${processedCount} games...`);
        }

        console.log('Simulation complete.');

    } catch (error) {
        console.error('Error seeding games:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
};

seedGames();
