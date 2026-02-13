import express, { Request, Response } from "express";
import mongoose from "mongoose";
import User from "../models/User";
import upload from "../config/uploadConfig";
import cloudinary from "../config/cloudinary";

const router = express.Router();

// GET /api/users/search - Search users by username
router.get("/search", async (req: Request, res: Response) => {
  const { query } = req.query;

  if (!query || typeof query !== "string") {
    return res.status(400).json({ message: "Query parameter is required" });
  }

  try {
    const users = await User.find({
      username: { $regex: query, $options: "i" },
    })
      .select("username profilePicture")
      .limit(10); 

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// GET /api/users/leaderboard - Get leaderboard for a sport
router.get("/leaderboard", async (req: Request, res: Response) => {
  const { sportId } = req.query;

  if (!sportId) {
    return res.status(400).json({ message: "Sport ID is required" });
  }

  try {
    const limitStr = req.query.limit as string;
    const limit = limitStr ? parseInt(limitStr) : 50;

    const leaderboard = await User.aggregate([
      { $unwind: "$sportsElo" },
      {
        $match: {
          "sportsElo.sport": new mongoose.Types.ObjectId(sportId as string),
        },
      },
      { $sort: { "sportsElo.elo": -1 } },
      { $limit: limit },
      {
        $project: {
          username: 1,
          profilePicture: 1,
          elo: "$sportsElo.elo",
          sport: "$sportsElo.sport",
        },
      },
    ]);

    res.json(leaderboard);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// GET /api/users/:id - Get user by ID (excluding password, populating friends)
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("friends", "username email profilePicture")
      .populate("friendRequests", "username email profilePicture")
      .populate("sportsElo.sport", "name");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// GET /api/users/username/:username - Get user by username (public info)
router.get("/username/:username", async (req: Request, res: Response) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select("username friends profilePicture isBanned") 
      .populate("friends", "username profilePicture"); 

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// POST /api/users/:id/friend-requests - Send a friend request
router.post("/:id/friend-requests", async (req: Request, res: Response) => {
  const { requesterId } = req.body; 
  const targetUserId = req.params.id;

  if (!requesterId)
    return res.status(400).json({ message: "Requester ID required" });

  try {
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) return res.status(404).json({ message: "User not found" });

    if (targetUser.friends.includes(requesterId)) {
      return res.status(400).json({ message: "Already friends" });
    }
    if (targetUser.friendRequests.includes(requesterId)) {
      return res.status(400).json({ message: "Request already sent" });
    }

    (targetUser.friendRequests as any[]).push(requesterId);
    await targetUser.save();

    res.status(200).json({ message: "Friend request sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// POST /api/users/:id/friends/accept - Accept a friend request
router.post("/:id/friends/accept", async (req: Request, res: Response) => {
  const { requesterId } = req.body;
  const userId = req.params.id;

  try {
    const user = await User.findById(userId);
    const requester = await User.findById(requesterId);

    if (!user || !requester)
      return res.status(404).json({ message: "User not found" });

    if (!user.friendRequests.includes(requesterId)) {
      return res
        .status(400)
        .json({ message: "No friend request from this user" });
    }
    (user.friends as any[]).push(requesterId);
    (requester.friends as any[]).push(userId);

    user.friendRequests = (user.friendRequests as any[]).filter(
      (id) => id.toString() !== requesterId,
    );

    await user.save();
    await requester.save();

    res
      .status(200)
      .json({ message: "Friend request accepted", friends: user.friends });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// POST /api/users/:id/friends/decline - Decline a friend request
router.post("/:id/friends/decline", async (req: Request, res: Response) => {
  const { requesterId } = req.body;
  const userId = req.params.id;

  try {
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: "User not found" });


    if (!user.friendRequests.includes(requesterId)) {
      return res
        .status(400)
        .json({ message: "No friend request from this user" });
    }

    user.friendRequests = (user.friendRequests as any[]).filter(
      (id) => id.toString() !== requesterId,
    );

    await user.save();

    res.status(200).json({ message: "Friend request declined" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// DELETE /api/users/:id/friends/:friendId - Remove a friend
router.delete("/:id/friends/:friendId", async (req: Request, res: Response) => {
  const userId = req.params.id;
  const friendId = req.params.friendId;

  try {
    const user = await User.findById(userId);
    const friend = await User.findById(friendId);

    if (!user || !friend) {
      return res.status(404).json({ message: "User or friend not found" });
    }

    if (!user.friends.includes(friendId as any)) {
      return res.status(400).json({ message: "Users are not friends" });
    }

    user.friends = (user.friends as any[]).filter(
      (id) => id.toString() !== friendId,
    );
    friend.friends = (friend.friends as any[]).filter(
      (id) => id.toString() !== userId,
    );

    await user.save();
    await friend.save();

    res.json({ message: "Friend removed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// POST /api/users/:id/profile-picture - Upload profile picture
router.post(
  "/:id/profile-picture",
  upload.single("profilePicture"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const result = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "trento_arena_avatars",
            width: 200,
            height: 200,
            crop: "thumb",
            quality: "auto",
            fetch_format: "auto",
          },

          (error: any, result: any) => {
            if (error) reject(error);
            else resolve(result);
          },
        );
        stream.end(req.file!.buffer);
      });

      user.profilePicture = result.secure_url;
      await user.save();

      res.json({
        message: "Profile picture updated",
        profilePicture: user.profilePicture,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server Error" });
    }
  },
);

// DELETE /api/users/:id/profile-picture - Remove profile picture
router.delete("/:id/profile-picture", async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.profilePicture = undefined;
    await user.save();

    res.json({ message: "Profile picture removed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

export default router;
