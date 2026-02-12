import express, { Request, Response } from "express";
import User from "../models/User";

const router = express.Router();

// POST /api/admin/ban - Ban a user
router.post("/ban", async (req: Request, res: Response) => {
  const { userId, duration, reason } = req.body;

  if (!userId || !duration) {
    return res
      .status(400)
      .json({ message: "User ID and duration are required" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let banExpiresAt: Date | undefined;
    if (duration !== "forever") {
      const now = new Date();
      if (duration === "1d") now.setDate(now.getDate() + 1);
      else if (duration === "1w") now.setDate(now.getDate() + 7);
      else if (duration === "1m") now.setMonth(now.getMonth() + 1);
      else {
        const hours = parseInt(duration);
        if (!isNaN(hours)) {
          now.setHours(now.getHours() + hours);
        } else {
          return res.status(400).json({
            message:
              "Invalid duration format. Use 1d, 1w, 1m, or number of hours.",
          });
        }
      }
      banExpiresAt = now;
    }

    user.isBanned = true;
    user.banExpiresAt = banExpiresAt;
    user.banReason = reason;

    await user.save();

    res.json({
      message: `User ${user.username} has been banned`,
      banExpiresAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// POST /api/admin/unban - Unban a user
router.post("/unban", async (req: Request, res: Response) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isBanned = false;
    user.banExpiresAt = undefined;
    user.banReason = undefined;

    await user.save();

    res.json({ message: `User ${user.username} has been unbanned` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// GET /api/admin/banned-users - Get list of banned users
router.get("/banned-users", async (req: Request, res: Response) => {
  try {
    const bannedUsers = await User.find({ isBanned: true }).select(
      "username banExpiresAt banReason",
    );
    res.json(bannedUsers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

export default router;
