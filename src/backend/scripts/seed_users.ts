import mongoose from "mongoose";
import dotenv from "dotenv";
import { faker } from "@faker-js/faker";
import bcrypt from "bcrypt";
import User from "../models/User";

dotenv.config();

const seedUsers = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in .env file");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");
    console.log("Generating users...");
    const userPromises = [];
    const hashedPassword = await bcrypt.hash("1234", 10);

    for (let i = 0; i < 200; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const username =
        faker.internet.username({ firstName, lastName }) +
        Math.floor(Math.random() * 1000);
      const email = faker.internet.email({ firstName, lastName });

      userPromises.push({
        username,
        email,
        password: hashedPassword,
        profilePicture: faker.image.avatar(),
        isBanned: false,
        friends: [],
        friendRequests: [],
        sportsElo: [],
      });
    }

    let createdUsersCount = 0;
    for (const userData of userPromises) {
      try {
        const exists = await User.findOne({
          $or: [{ username: userData.username }, { email: userData.email }],
        });

        if (!exists) {
          await User.create(userData);
          console.log("username: " + userData.username);
          createdUsersCount++;
        }
      } catch (error) {
        console.error(`Failed to create user ${userData.username}:`, error);
      }
    }

    console.log(`Created ${createdUsersCount} new users.`);

    console.log("Generating friendships...");
    const allUsers = await User.find();

    if (allUsers.length < 2) {
      console.log("Not enough users to create friendships.");
      return;
    }

    for (const user of allUsers) {
      if (Math.random() > 0.7) continue;

      const numFriendsToAdd = faker.number.int({ min: 1, max: 3 });

      const currentFriendIds = user.friends.map((id) => id.toString());
      const potentialFriends = allUsers.filter(
        (u) =>
          u._id.toString() !== user._id.toString() &&
          !currentFriendIds.includes(u._id.toString()),
      );

      const selectedFriends = faker.helpers.arrayElements(
        potentialFriends,
        Math.min(numFriendsToAdd, potentialFriends.length),
      );

      for (const friend of selectedFriends) {
        await User.updateOne(
          { _id: user._id },
          { $addToSet: { friends: friend._id } },
        );
        await User.updateOne(
          { _id: friend._id },
          { $addToSet: { friends: user._id } },
        );
      }
    }
    console.log("Friendships generated.");
  } catch (error) {
    console.error("Error seeding users:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

seedUsers();
