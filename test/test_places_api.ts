import request from "supertest";
import mongoose from "mongoose";
import express from "express";
import placeRoutes from "../src/backend/routes/places";
import sportRoutes from "../src/backend/routes/sports";
import Place from "../src/backend/models/Place";
import Sport from "../src/backend/models/Sport";
import dotenv from "dotenv";
import passport from "passport";

dotenv.config();

const app = express();
app.use(express.json());
app.use(passport.initialize());

app.use("/api/places", placeRoutes);
app.use("/api/sports", sportRoutes);

describe("Places API", function () {
  this.timeout(10000);
  const API_TEST_PLACE = {
    name: "Test Place",
    position: {
      lat: 46.0697,
      lng: 11.1211,
    },
    sport: "Test Sport",
  };

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(
        process.env.MONGO_TEST_URI ||
        process.env.MONGO_URI ||
        "mongodb://localhost:27017/trentoArena",
      );
    }
    await Place.deleteMany({ name: API_TEST_PLACE.name });
    await Sport.deleteMany({ name: "Test Sport" });
  });

  after(async () => {
    await Place.deleteMany({ name: API_TEST_PLACE.name });
    await Sport.deleteMany({ name: "Test Sport" });
  });

  it("Step 1: Should create a Place linked to a Sport", async () => {
    // 1. Create a Sport
    const sportRes = await request(app)
      .post("/api/sports")
      .auth(process.env.ADMIN_USERNAME || "admin", process.env.ADMIN_PASSWORD || "admin123")
      .send({ name: "Test Sport" })
      .expect(201);

    const sportId = sportRes.body._id;

    // 2. Create a Place
    const newPlace = {
      name: "Test Place",
      sport: sportId,
      position: { lat: 46.0, lng: 11.0 },
    };

    const res = await request(app)
      .post("/api/places")
      .auth(process.env.ADMIN_USERNAME || "admin", process.env.ADMIN_PASSWORD || "admin123")
      .send(newPlace)
      .expect(201);

    if (res.body.name !== newPlace.name) throw new Error("Name mismatch");
  });

  it("Step 2: Should retrieve places", async () => {
    const res = await request(app).get("/api/places").expect(200);

    if (!Array.isArray(res.body)) throw new Error("Response is not an array");
    const found = res.body.find((p: any) => p.name === API_TEST_PLACE.name);
    if (!found) throw new Error("Created place not found");
  });

  it("Step 3: Should reject invalid input", async () => {
    await request(app)
      .post("/api/places")
      .auth(process.env.ADMIN_USERNAME || "admin", process.env.ADMIN_PASSWORD || "admin123")
      .send({ name: "Incomplete Place" })
      .expect(400);
  });
});
