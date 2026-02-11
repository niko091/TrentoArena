import mongoose from "mongoose";
import dotenv from "dotenv";
import { faker } from "@faker-js/faker";
import User from "../models/User";
import Game from "../models/Game";
import Sport from "../models/Sport";
import Place from "../models/Place";

dotenv.config();

const GAMES_TO_SIMULATE = 1000;

const seedGames = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in .env file");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Fetch Resources
    const users = await User.find();
    const sports = await Sport.find();
    const places = await Place.find();

    if (users.length < 10)
      throw new Error(
        "Not enough users to simulate games with up to 10 participants.",
      );
    if (sports.length === 0) throw new Error("No sports found.");
    if (places.length === 0) throw new Error("No places found.");

    console.log(
      `Found ${users.length} users, ${sports.length} sports, ${places.length} places.`,
    );

    // Generate Games (In Memory)
    console.log(`Generating ${GAMES_TO_SIMULATE} future not-full games...`);
    const gamesToProcess: any[] = [];

    for (let i = 0; i < GAMES_TO_SIMULATE; i++) {
      const sport = faker.helpers.arrayElement(sports);

      // Filter places for this sport
      const sportPlaces = places.filter(
        (p) => p.sport.toString() === sport._id.toString(),
      );

      if (sportPlaces.length === 0) continue;

      const place = faker.helpers.arrayElement(sportPlaces);
      const date = faker.date.between({
        from: "2026-02-26",
        to: "2026-03-20",
      });

      // Random max participants between 4 and 10
      const maxParticipants = faker.number.int({ min: 4, max: 10 });
      // Random number of participants between 1 and maxParticipants - 1
      const numParticipants = faker.number.int({
        min: 1,
        max: maxParticipants,
      });

      // Select numParticipants unique participants
      const participants = faker.helpers.arrayElements(users, numParticipants);

      gamesToProcess.push({
        sport,
        place,
        date,
        participants,
        maxParticipants,
      });
    }

    // Process Games
    let processedCount = 0;

    for (const gameData of gamesToProcess) {
      const creator = gameData.participants[0];

      if (!creator) continue;

      // Save Game
      await Game.create({
        sport: gameData.sport._id,
        place: gameData.place._id,
        creator: creator._id,
        date: gameData.date,
        note: "Simulation Not Full",
        isFinished: false,
        maxParticipants: gameData.maxParticipants,
        participants: gameData.participants.map((u: any) => ({
          user: u._id,
          winner: false,
        })),
      });

      processedCount++;
      if (processedCount % 10 === 0)
        console.log(`Processed ${processedCount} games...`);
    }

    console.log(`Simulation complete. Created ${processedCount} games.`);
  } catch (error) {
    console.error("Error seeding games:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

seedGames();
