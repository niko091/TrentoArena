import mongoose, { Document, Schema } from "mongoose";
import { IUserShared } from "../../shared/types/User";

export interface IUser extends Document, Omit<IUserShared, "_id"> {
  friends: string[] | IUser[];
  friendRequests: string[] | IUser[];

  sportsElo: {
    sport: mongoose.Types.ObjectId | string;
    elo: number;
    history: { elo: number; date: Date; change: number }[];
  }[];
  isVerified: boolean;
  verificationToken?: string;
  verificationTokenExpires?: Date;
}

const UserSchema: Schema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  googleId: {
    type: String,
    required: false,
    unique: true,
    sparse: true, 
  },
  password: {
    type: String,
    required: false,
  },
  profilePicture: {
    type: String,
    required: false,
  },
  isBanned: {
    type: Boolean,
    default: false,
  },
  banExpiresAt: {
    type: Date,
  },
  banReason: {
    type: String,
  },
  friends: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  friendRequests: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  sportsElo: [
    {
      sport: {
        type: Schema.Types.ObjectId,
        ref: "Sport",
        required: true,
      },
      elo: {
        type: Number,
        default: 1200,
      },
      history: [
        {
          elo: { type: Number, required: true },
          date: { type: Date, default: Date.now },
          change: { type: Number, required: true },
        },
      ],
    },
  ],
  isVerified: { type: Boolean, default: process.env.NODE_ENV === "test" },
  verificationToken: { type: String },
  verificationTokenExpires: { type: Date },
});

export default mongoose.model<IUser>("User", UserSchema);
