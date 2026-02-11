import mongoose, { Document, Schema } from "mongoose";

export interface IReport extends Document {
  reporter: mongoose.Types.ObjectId;
  reported: mongoose.Types.ObjectId;
  motivation: string;
  date: Date;
}

const ReportSchema: Schema = new Schema({
  reporter: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  reported: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  motivation: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model<IReport>("Report", ReportSchema);
