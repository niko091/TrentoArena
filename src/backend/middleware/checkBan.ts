import { Request, Response, NextFunction } from "express";
import User from "../models/User";

export const checkBan = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.isAuthenticated() && req.user) {
    const user = req.user as any;

    if (user.isBanned) {
      if (user.banExpiresAt && new Date() > new Date(user.banExpiresAt)) {
        try {
          await User.findByIdAndUpdate(user._id, {
            isBanned: false,
            $unset: { banExpiresAt: "", banReason: "" },
          });
          return next();
        } catch (err) {
          console.error("Error unbanning user:", err);
          return res
            .status(500)
            .json({ message: "Server Error checking ban status" });
        }
      }
      req.logout((err) => {
        if (err) console.error("Logout error:", err);
        return res.status(403).json({
          message: "You have been banned.",
          reason: user.banReason,
          expiresAt: user.banExpiresAt,
          isBanned: true,
        });
      });
      return;
    }
  }
  next();
};
