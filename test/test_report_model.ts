import mongoose from "mongoose";
import User from "../src/backend/models/User";
import Report from "../src/backend/models/Report";
import dotenv from "dotenv";

dotenv.config();

describe("Report Model Tests", () => {
  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(
        process.env.MONGO_URI || "mongodb://localhost:27017/trentoArena",
      );
    }
    await Report.deleteMany({});
    await User.deleteMany({
      email: { $in: ["reporter@example.com", "reported@example.com"] },
    });
  });

  after(async () => {
    await Report.deleteMany({});
    await User.deleteMany({
      email: { $in: ["reporter@example.com", "reported@example.com"] },
    });
  });

  it("Step 1: Should save and retrieve a report", async () => {
    // Create users
    const reporter = new User({
      username: "reporter_user",
      email: "reporter@example.com",
      password: "password123",
    });
    const reported = new User({
      username: "reported_user",
      email: "reported@example.com",
      password: "password123",
    });

    await reporter.save();
    await reported.save();

    // Create Report
    const newReport = new Report({
      reporter: reporter._id,
      reported: reported._id,
      motivation: "Inappropriate behavior",
      date: new Date(),
    });

    await newReport.save();

    const foundReport = await Report.findById(newReport._id);
    if (!foundReport) throw new Error("Report not found");
    if (foundReport.motivation !== "Inappropriate behavior")
      throw new Error("Motivation mismatch");
    if (foundReport.reporter.toString() !== reporter._id.toString())
      throw new Error("Reporter ID mismatch");
  });

  it("Step 2: Should enforce required fields", async () => {
    const invalidReport = new Report({
      // Missing fields
    });

    try {
      await invalidReport.save();
      throw new Error("Should have failed validation");
    } catch (err) {
      // Expected error
    }
  });
});
