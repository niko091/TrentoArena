import mongoose from "mongoose";
import dotenv from "dotenv";
import { faker } from "@faker-js/faker";
import User, { IUser } from "../models/User";
import Game from "../models/Game";
import Sport from "../models/Sport";
import Place from "../models/Place";

dotenv.config();

const GAMES_TO_SIMULATE = 3000;
const K = 32;
const INITIAL_ELO = 1200;

const getElo = (user: IUser, sportId: string): number => {
  const entry = user.sportsElo?.find(
    (e: any) => e.sport.toString() === sportId,
  );
  return entry ? entry.elo : INITIAL_ELO;
};

const updateElo = (
  user: IUser,
  sportId: string,
  newElo: number,
  date: Date,
  change: number,
) => {
  if (!user.sportsElo) user.sportsElo = [];
  let entry = user.sportsElo.find((e: any) => e.sport.toString() === sportId);

  if (!entry) {
    user.sportsElo.push({ sport: sportId, elo: INITIAL_ELO, history: [] });
    entry = user.sportsElo.find((e: any) => e.sport.toString() === sportId);
  }

  if (entry) {
    entry.elo = newElo;
    if (!entry.history) entry.history = [];
    entry.history.push({
      elo: newElo,
      date: date,
      change: change,
    });
  }
};

const seedGames = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in .env file");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const users = await User.find();
    const sports = await Sport.find();
    const places = await Place.find();

    if (users.length < 2)
      throw new Error("Not enough users to simulate games.");
    if (sports.length === 0) throw new Error("No sports found.");
    if (places.length === 0) throw new Error("No places found.");

    console.log(
      `Found ${users.length} users, ${sports.length} sports, ${places.length} places.`,
    );

    console.log(`Generating ${GAMES_TO_SIMULATE} games...`);
    const gamesToProcess: any[] = [];

    for (let i = 0; i < GAMES_TO_SIMULATE; i++) {
      const sport = faker.helpers.arrayElement(sports);

      const sportPlaces = places.filter(
        (p) => p.sport.toString() === sport._id.toString(),
      );

      if (sportPlaces.length === 0) continue;

      const place = faker.helpers.arrayElement(sportPlaces);
      const date = faker.date.recent({ days: 60 });
      const participants = faker.helpers.arrayElements(users, 2);
      const winner = faker.helpers.arrayElement(participants);

      gamesToProcess.push({
        sport,
        place,
        date,
        participants,
        winner,
      });
    }

    gamesToProcess.sort((a, b) => a.date.getTime() - b.date.getTime());
    console.log("Games sorted. Starting simulation...");

    let processedCount = 0;

    for (const gameData of gamesToProcess) {
      const p1 = users.find(
        (u) => u._id.toString() === gameData.participants[0]._id.toString(),
      );
      const p2 = users.find(
        (u) => u._id.toString() === gameData.participants[1]._id.toString(),
      );

      if (!p1 || !p2) continue;

      const sportId = gameData.sport._id.toString();
      const elo1 = getElo(p1, sportId);
      const elo2 = getElo(p2, sportId);

      const isP1Winner = gameData.winner._id.toString() === p1._id.toString();
      const winnerUser = isP1Winner ? p1 : p2;
      const loserUser = isP1Winner ? p2 : p1;

      const winnerElo = isP1Winner ? elo1 : elo2;
      const loserElo = isP1Winner ? elo2 : elo1;

      const expectedScoreWinner =
        1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
      const expectedScoreLoser =
        1 / (1 + Math.pow(10, (winnerElo - loserElo) / 400));

      const newWinnerElo = Math.round(
        winnerElo + K * (1 - expectedScoreWinner) + 30,
      );
      const newLoserElo = Math.round(loserElo + K * (0 - expectedScoreLoser));

      updateElo(
        winnerUser,
        sportId,
        newWinnerElo,
        gameData.date,
        newWinnerElo - winnerElo,
      );
      updateElo(
        loserUser,
        sportId,
        newLoserElo,
        gameData.date,
        newLoserElo - loserElo,
      );

      await Game.create({
        sport: gameData.sport._id,
        place: gameData.place._id,
        creator: winnerUser._id,
        date: gameData.date,
        note: "Simulation",
        isFinished: true,
        maxParticipants: 2,
        participants: [
          { user: p1._id, winner: isP1Winner },
          { user: p2._id, winner: !isP1Winner },
        ],
      });

      await p1.save();
      await p2.save();

      processedCount++;
      if (processedCount % 50 === 0)
        console.log(`Processed ${processedCount} games...`);
    }

    console.log("Simulation complete.");
  } catch (error) {
    console.error("Error seeding games:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

seedGames();
