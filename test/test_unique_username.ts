import mongoose from "mongoose";
import User from "../src/backend/models/User";
import dotenv from "dotenv";

dotenv.config();

const generateUniqueUsername = async (baseName: string): Promise<string> => {
  let username = baseName;
  let userExists = await User.findOne({ username });

  while (userExists) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    username = `${baseName} ${randomSuffix}`;
    userExists = await User.findOne({ username });
  }

  return username;
};

describe("Unique Username Logic", () => {
  const baseName = "UniqueUserTest";

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(
        process.env.MONGO_URI || "mongodb://localhost:27017/trentoArena",
      );
    }
    await User.deleteMany({ username: { $regex: new RegExp(`^${baseName}`) } });
  });

  after(async () => {
    await User.deleteMany({ username: { $regex: new RegExp(`^${baseName}`) } });
  });

  it("Step 1: Should create unique usernames", async () => {
    // Create first user
    const user1 = await User.create({
      username: await generateUniqueUsername(baseName),
      email: "test1@example.com",
      googleId: "test_id_1",
    });

    // Create second user with SAME base name
    const user2 = await User.create({
      username: await generateUniqueUsername(baseName),
      email: "test2@example.com",
      googleId: "test_id_2",
    });

    if (user1.username === user2.username) {
      throw new Error("Usernames are identical!");
    }

    if (!user2.username.startsWith(baseName) || user2.username === baseName) {
      throw new Error(`User 2 username "${user2.username}" format unexpected.`);
    }
  });
});
