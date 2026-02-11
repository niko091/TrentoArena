import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User";
import Game from "../models/Game";

dotenv.config();

const resetDb = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in .env file");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    console.log("Deleting all games...");
    const gameResult = await Game.deleteMany({});
    console.log(`Deleted ${gameResult.deletedCount} games.`);

    console.log("Deleting all users...");
    const userResult = await User.deleteMany({});
    console.log(`Deleted ${userResult.deletedCount} users.`);

    console.log("DB Reset Complete.");
  } catch (error) {
    console.error("Error resetting DB:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

resetDb();
