import mongoose, { Document, Schema } from "mongoose";

export interface IGame extends Document {
  sport: mongoose.Types.ObjectId | string;
  place: mongoose.Types.ObjectId | string;
  creator: mongoose.Types.ObjectId | string;
  date: Date;
  note?: string;
  isFinished: boolean;
  participants: { user: mongoose.Types.ObjectId | string; winner: boolean }[];
  maxParticipants: number;
}

const GameSchema: Schema = new Schema({
  sport: {
    type: Schema.Types.ObjectId,
    ref: "Sport",
    required: true,
  },
  place: {
    type: Schema.Types.ObjectId,
    ref: "Place",
    required: true,
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  note: {
    type: String,
    default: "",
  },
  isFinished: {
    type: Boolean,
    default: false,
  },
  participants: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      winner: {
        type: Boolean,
        default: false,
      },
    },
  ],
  maxParticipants: {
    type: Number,
    required: true,
    min: 2,
  },
});

export default mongoose.model<IGame>("Game", GameSchema);
