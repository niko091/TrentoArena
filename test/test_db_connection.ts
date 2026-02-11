import mongoose from "mongoose";
import User from "../src/backend/models/User";
import dotenv from "dotenv";

dotenv.config();

describe("DB Connection & Basic CRUD", () => {
  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(
        process.env.MONGO_URI || "mongodb://localhost:27017/trentoArena",
      );
    }
  });

  after(async () => {
    // await mongoose.disconnect();
  });

  it("Step 1: Should perform basic CRUD operations", async () => {
    const testUser = {
      username: "db_test_user",
      email: "db_test@example.com",
      googleId: "db_test_id_123",
    };

    // Clean up
    await User.deleteOne({ googleId: testUser.googleId });

    // Create
    const user = await User.create(testUser);
    if (!user) throw new Error("User creation failed");

    // Find
    const found = await User.findById(user._id);
    if (!found) throw new Error("User not found");
    if (found.username !== testUser.username)
      throw new Error("Username mismatch");

    // Clean up
    await User.deleteOne({ _id: user._id });
  });
});
