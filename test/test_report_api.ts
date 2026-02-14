import request from "supertest";
import mongoose from "mongoose";
import app from "../src/backend/server";
import User from "../src/backend/models/User";
import Report from "../src/backend/models/Report";
import dotenv from "dotenv";
import "../src/backend/config/passport";

dotenv.config();

describe("Report API Tests", () => {
  let reporterId: string;
  let reportedId: string;

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(
        process.env.MONGO_TEST_URI ||
          process.env.MONGO_URI ||
          "mongodb://localhost:27017/trentoArena",
      );
    }
    await Report.deleteMany({});
    await User.deleteMany({
      email: { $in: ["api_reporter@example.com", "api_reported@example.com"] },
    });

    // Create Users
    const reporter = new User({
      username: "api_reporter",
      email: "api_reporter@example.com",
      password: "password123",
    });
    const reported = new User({
      username: "api_reported",
      email: "api_reported@example.com",
      password: "password123",
    });

    await reporter.save();
    await reported.save();

    reporterId = reporter._id.toString();
    reportedId = reported._id.toString();
  });

  after(async () => {
    await Report.deleteMany({});
    await User.deleteMany({
      email: { $in: ["api_reporter@example.com", "api_reported@example.com"] },
    });
  });

  it("Step 1: Should create a new report", async () => {
    const res = await request(app)
      .post("/api/reports")
      .send({
        reporterId: reporterId,
        reportedId: reportedId,
        motivation: "Spamming in chat",
      })
      .expect(201);

    if (!res.body.report) throw new Error("Report not returned");
    if (res.body.report.motivation !== "Spamming in chat")
      throw new Error("Incorrect motivation");
  });

  it("Step 2: Should fail with missing fields", async () => {
    await request(app)
      .post("/api/reports")
      .send({
        reporterId: reporterId,
        // Missing reportedId and motivation
      })
      .expect(400);
  });

  it("Step 3: Should fail with invalid user IDs", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    await request(app)
      .post("/api/reports")
      .send({
        reporterId: fakeId,
        reportedId: fakeId,
        motivation: "Test",
      })
      .expect(404);
  });

  it("Step 4: Should fetch all reports", async () => {
    const res = await request(app).get("/api/reports").expect(200);

    if (!Array.isArray(res.body)) throw new Error("Response is not an array");
    if (res.body.length === 0) throw new Error("No reports found");
    if (!res.body[0].reporter.username)
      throw new Error("Reporter not populated");
  });
});
