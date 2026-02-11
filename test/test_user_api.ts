const request = require("supertest");
import mongoose from "mongoose";
const app = require("../src/backend/server").default;
const User = require("../src/backend/models/User").default;
import dotenv from "dotenv";
require("../src/backend/config/passport"); // Ensure passport config is loaded

dotenv.config();

describe("User API Tests", function () {
  this.timeout(10000);
  const TEST_USER = {
    username: "test_user_api",
    email: "test_user_api@example.com",
    password: "password123",
  };

  let userId: string;
  let agent: any;

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(
        process.env.MONGO_URI || "mongodb://localhost:27017/trentoarena",
      );
    }
    await User.deleteMany({ email: TEST_USER.email });
    await User.deleteMany({ email: "friend@example.com" });

    agent = request.agent(app);
  });

  after(async () => {
    await User.deleteMany({ email: TEST_USER.email });
    await User.deleteMany({ email: "friend@example.com" });
  });

  it("Step 1: Should register a user", async () => {
    const res = await agent.post("/auth/register").send(TEST_USER).expect(201);

    userId = res.body.user._id;
    if (!userId) throw new Error("User ID missing");
  });

  it("Step 2: Should fetch user info", async () => {
    const res = await agent.get(`/api/users/${userId}`).expect(200);

    if (res.body.password) throw new Error("Password returned in API");
    if (res.body.username !== TEST_USER.username)
      throw new Error("Username mismatch");
  });

  it("Step 3: Should handle friend requests", async () => {
    // Create Requester using a separate agent
    const FRIEND_USER = {
      username: "friend_user",
      email: "friend@example.com",
      password: "password123",
    };

    const friendAgent = request.agent(app);
    const regRes = await friendAgent
      .post("/auth/register")
      .send(FRIEND_USER)
      .expect(201);
    const requesterId = regRes.body.user._id;

    // Send request (from friend to user)
    await friendAgent
      .post(`/api/users/${userId}/friend-requests`)
      .send({ requesterId: requesterId })
      .expect(200);

    // Verify received (as the original user)
    const userRes = await agent.get(`/api/users/${userId}`).expect(200);

    if (
      !userRes.body.friendRequests ||
      userRes.body.friendRequests.length === 0
    ) {
      throw new Error("Friend request not received");
    }
    // Check if the request is from the friend
    const foundRequest = userRes.body.friendRequests.find(
      (r: any) =>
        r.username === FRIEND_USER.username || r._id.toString() === requesterId,
    );

    if (!foundRequest) {
      throw new Error("Friend request from specific user not found");
    }

    // Accept (as the original user)
    await agent
      .post(`/api/users/${userId}/friends/accept`)
      .send({ requesterId: requesterId })
      .expect(200);

    // Verify accepted
    const finalUserRes = await agent.get(`/api/users/${userId}`).expect(200);

    const friend = finalUserRes.body.friends.find(
      (f: any) =>
        f.username === FRIEND_USER.username || f._id.toString() === requesterId,
    );

    if (!friend) {
      throw new Error("Friend not added");
    }
    if (finalUserRes.body.friendRequests.length !== 0) {
      throw new Error("Friend request not removed");
    }
  });

  it("Step 4: Should remove a friend", async () => {
    // Re-fetch user to get the friend ID
    const userRes = await agent.get(`/api/users/${userId}`);
    const friendId = userRes.body.friends[0]._id || userRes.body.friends[0]; // Handle populated or ID

    await agent.delete(`/api/users/${userId}/friends/${friendId}`).expect(200);

    // Verify removal
    const finalUserRes = await agent.get(`/api/users/${userId}`);
    if (finalUserRes.body.friends.length !== 0) {
      throw new Error("Friend not removed from user");
    }

    // Check the friend's list
    const friendUser = await User.findById(friendId);
    if (friendUser && friendUser.friends.includes(userId)) {
      throw new Error("User not removed from friend's list");
    }
  });
});
