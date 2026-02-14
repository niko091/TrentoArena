const request = require("supertest");
import mongoose from "mongoose";
const app = require("../src/backend/server").default;
const User = require("../src/backend/models/User").default;
const Game = require("../src/backend/models/Game").default;
const Sport = require("../src/backend/models/Sport").default;
const Place = require("../src/backend/models/Place").default;
import dotenv from "dotenv";
require("../src/backend/config/passport");

dotenv.config();

const API_TEST_USER = {
  username: "api_stats_test_user",
  email: "api_stats_test@example.com",
  password: "password123",
};

describe("Stats API Tests", function () {
  this.timeout(10000);

  let sportId1: string;
  let sportId2: string;
  let placeId1: string;
  let placeId2: string;
  let creatorId: string;

  before(async () => {
    // Connect to TEST DB
    if (mongoose.connection.readyState === 0) {
      const testUri =
        process.env.MONGO_TEST_URI ||
        process.env.MONGO_URI ||
        "mongodb://localhost:27017/trentoArena";
      await mongoose.connect(testUri);
    }

    // Cleanup
    await User.deleteMany({ email: API_TEST_USER.email });
    await Game.deleteMany({ note: "API_STATS_TEST" });
    await Sport.deleteMany({
      name: { $in: ["Stats_Sport_1", "Stats_Sport_2"] },
    });
    await Place.deleteMany({
      name: { $in: ["Stats_Place_1", "Stats_Place_2"] },
    });

    // Create User
    const user = await User.create(API_TEST_USER);
    creatorId = user._id.toString();

    // Create Sports
    const s1 = await Sport.create({ name: "Stats_Sport_1" });
    const s2 = await Sport.create({ name: "Stats_Sport_2" });
    sportId1 = s1._id.toString();
    sportId2 = s2._id.toString();

    // Create Places
    const p1 = await Place.create({
      name: "Stats_Place_1",
      sport: s1._id,
      position: { lat: 0, lng: 0 },
    });
    const p2 = await Place.create({
      name: "Stats_Place_2",
      sport: s2._id,
      position: { lat: 0, lng: 0 },
    });
    placeId1 = p1._id.toString();
    placeId2 = p2._id.toString();

    // Create Games (Finished)
    const g1 = new Game({
      sport: sportId1,
      place: placeId1,
      creator: creatorId,
      date: new Date("2023-01-01T10:00:00Z"),
      note: "API_STATS_TEST",
      isFinished: true,
      maxParticipants: 2,
    });
    const g2 = new Game({
      sport: sportId1,
      place: placeId1,
      creator: creatorId,
      date: new Date("2023-01-01T12:00:00Z"),
      note: "API_STATS_TEST",
      isFinished: true,
      maxParticipants: 2,
    });
    const g3 = new Game({
      sport: sportId1,
      place: placeId2,
      creator: creatorId,
      date: new Date("2023-01-02T10:00:00Z"),
      note: "API_STATS_TEST",
      isFinished: true,
      maxParticipants: 2,
    });
    const g4 = new Game({
      sport: sportId2,
      place: placeId2,
      creator: creatorId,
      date: new Date("2023-02-01T10:00:00Z"),
      note: "API_STATS_TEST",
      isFinished: true,
      maxParticipants: 2,
    });
    // Unfinished game (should be ignored)
    const g5 = new Game({
      sport: sportId1,
      place: placeId1,
      creator: creatorId,
      date: new Date(),
      note: "API_STATS_TEST",
      isFinished: false,
      maxParticipants: 2,
    });

    await Promise.all([g1.save(), g2.save(), g3.save(), g4.save(), g5.save()]);
  });

  after(async () => {
    await User.deleteMany({ email: API_TEST_USER.email });
    await Game.deleteMany({ note: "API_STATS_TEST" });
    await Sport.deleteMany({
      name: { $in: ["Stats_Sport_1", "Stats_Sport_2"] },
    });
    await Place.deleteMany({
      name: { $in: ["Stats_Place_1", "Stats_Place_2"] },
    });
  });

  it("GET /api/stats/chart-data - Should return counts by date for SPORT", async () => {
    const res = await request(app)
      .get(`/api/stats/chart-data?type=sport&id=${sportId1}`)
      .auth(
        process.env.STATS_USERNAME || "stats",
        process.env.STATS_PASSWORD || "stats123",
      )
      .expect(200);

    // Sport 1 games: g1 (Jan 1), g2 (Jan 1), g3 (Jan 2)
    // Expected: { "01/01/2023": 2, "02/01/2023": 1 }
    if (res.body["01/01/2023"] !== 2)
      throw new Error(
        `Expected 2 games on 01/01/2023, got ${res.body["01/01/2023"]}`,
      );
    if (res.body["02/01/2023"] !== 1)
      throw new Error(
        `Expected 1 game on 02/01/2023, got ${res.body["02/01/2023"]}`,
      );
    if (Object.keys(res.body).length !== 2)
      throw new Error("Expected 2 date entries");
  });

  it("GET /api/stats/chart-data - Should return counts by date for PLACE", async () => {
    const res = await request(app)
      .get(`/api/stats/chart-data?type=place&id=${placeId2}`)
      .auth(
        process.env.STATS_USERNAME || "stats",
        process.env.STATS_PASSWORD || "stats123",
      )
      .expect(200);

    // Place 2 games: g3 (Jan 2), g4 (Feb 1)
    // Expected: { "02/01/2023": 1, "01/02/2023": 1 }
    if (res.body["02/01/2023"] !== 1)
      throw new Error(
        `Expected 1 game on 02/01/2023, got ${res.body["02/01/2023"]}`,
      );
    if (res.body["01/02/2023"] !== 1)
      throw new Error(
        `Expected 1 game on 01/02/2023, got ${res.body["01/02/2023"]}`,
      );
  });

  it("GET /api/stats/top-entities - Should return top SPORTS", async () => {
    const res = await request(app)
      .get("/api/stats/top-entities?type=sport&period=all")
      .auth(
        process.env.STATS_USERNAME || "stats",
        process.env.STATS_PASSWORD || "stats123",
      )
      .expect(200);

    // Sport 1: 3 games
    // Sport 2: 1 game
    const s1 = res.body.find((s: any) => s.name === "Stats_Sport_1");
    const s2 = res.body.find((s: any) => s.name === "Stats_Sport_2");

    if (!s1 || s1.count !== 3)
      throw new Error("Stats_Sport_1 count should be 3");
    if (!s2 || s2.count !== 1)
      throw new Error("Stats_Sport_2 count should be 1");
  });

  it("GET /api/stats/top-entities - Should return top PLACES", async () => {
    const res = await request(app)
      .get("/api/stats/top-entities?type=place&period=all")
      .auth(
        process.env.STATS_USERNAME || "stats",
        process.env.STATS_PASSWORD || "stats123",
      )
      .expect(200);

    console.log("Top Places Response:", JSON.stringify(res.body, null, 2));

    // Place 1: 2 games
    // Place 2: 2 games
    const p1 = res.body.find((p: any) => p.name === "Stats_Place_1");
    const p2 = res.body.find((p: any) => p.name === "Stats_Place_2");

    if (!p1 || p1.count !== 2)
      throw new Error(
        `Stats_Place_1 count should be 2, got ${p1 ? p1.count : "undefined"}`,
      );
    if (!p2 || p2.count !== 2)
      throw new Error(
        `Stats_Place_2 count should be 2, got ${p2 ? p2.count : "undefined"}`,
      );
  });
});
