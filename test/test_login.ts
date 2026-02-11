import request from "supertest";
import mongoose from "mongoose";
import app from "../src/backend/server";
import User from "../src/backend/models/User";
import dotenv from "dotenv";

dotenv.config();

describe("Login API", () => {
  const API_TEST_USER = {
    username: "login_test_user",
    email: "login_test@example.com",
    password: "password123",
  };

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(
        process.env.MONGO_TEST_URI ||
        process.env.MONGO_URI ||
        "mongodb://localhost:27017/trentoArena",
      );
    }
    await User.deleteMany({ email: API_TEST_USER.email });
  });

  after(async () => {
    await User.deleteMany({ email: API_TEST_USER.email });
  });

  it("Step 1: Should register user", async () => {
    await request(app).post("/auth/register").send(API_TEST_USER).expect(201);
  });

  it("Step 2: Should login with Email", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({
        email: API_TEST_USER.email,
        password: API_TEST_USER.password,
      })
      .expect(200);

    if (res.body.user.email !== API_TEST_USER.email)
      throw new Error("Email login mismatch");
  });

  it("Step 3: Should login with Username", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({
        email: API_TEST_USER.username,
        password: API_TEST_USER.password,
      })
      .expect(200);

    if (res.body.user.username !== API_TEST_USER.username)
      throw new Error("Username login mismatch");
  });

  it("Step 4: Should reject invalid login", async () => {
    await request(app)
      .post("/auth/login")
      .send({
        email: "wrong_user",
        password: "password123",
      })
      .expect(400); // Expecting 400 as per previous test
  });
});
