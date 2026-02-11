import request from "supertest";
import mongoose from "mongoose";
import app from "../src/backend/server";
import User from "../src/backend/models/User";
import dotenv from "dotenv";

dotenv.config();

const API_TEST_USER = {
  username: "api_test_user",
  email: "api_test@example.com",
  password: "password123",
};

describe("API Integration Tests", function () {
  this.timeout(10000); // Increase timeout to 10 seconds

  before(async () => {
    console.log("\n--- SETUP: Connecting to DB ---");
    // Ensure we are connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(
        process.env.MONGO_TEST_URI ||
        process.env.MONGO_URI ||
        "mongodb://localhost:27017/trentoArena",
      );
    } else {
      // connection might be connecting (2) or disconnecting (3). Wait for (1).
      let retries = 20;
      while (mongoose.connection.readyState !== 1 && retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        retries--;
      }
    }
    // Cleanup potentially stale data
    await User.deleteMany({ email: API_TEST_USER.email });
  });

  after(async () => {
    console.log("\n--- TEARDOWN: Cleaning up ---");
    await User.deleteMany({ email: API_TEST_USER.email });
    // Close connection to prevent hanging
    // await mongoose.connection.close(); // Optional: keeps connection open for other tests
  });

  let agent = request.agent(app); // persist cookies

  it("Step 1: Should REGISTER a new user", async () => {
    const res = await agent
      .post("/auth/register")
      .send(API_TEST_USER)
      .expect(201); // Created

    // Verify response
    if (res.body.msg !== "User registered and logged in successfully") {
      throw new Error(`Unexpected message: ${JSON.stringify(res.body)}`);
    }

    // Verify DB
    const user = await User.findOne({ email: API_TEST_USER.email });
    if (!user) throw new Error("User was not created in DB");
  });

  it("Step 2: Should LOGIN with the new user", async () => {
    // First, create a NEW agent to simulate a fresh browser without cookies
    const loginAgent = request.agent(app);

    const res = await loginAgent
      .post("/auth/login")
      .send({
        email: API_TEST_USER.email,
        password: API_TEST_USER.password,
      })
      .expect(200);

    if (res.body.msg !== "Logged in successfully") {
      throw new Error(`Login failed: ${JSON.stringify(res.body)}`);
    }
  });

  it("Step 3: Should serve SPA shell for /map", async () => {
    const anonAgent = request.agent(app);
    await anonAgent
      .get("/map")
      .expect(200); // SPA shell is served; redirect happens on frontend
  });

  it("Step 4: Should ALLOW authenticated access to /map", async () => {
    // 'agent' reused from Step 1 (registration logs us in)

    await agent.get("/map").expect(200); // OK
  });
});
