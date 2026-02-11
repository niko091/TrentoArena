import mongoose, { Document, Schema } from "mongoose";

import { IPlaceShared } from "../../shared/types/Place";

export interface IPlace extends Document, Omit<IPlaceShared, "_id" | "sport"> {
  sport: mongoose.Types.ObjectId | string;
}

const PlaceSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
  },
  position: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  sport: {
    type: Schema.Types.ObjectId,
    ref: "Sport",
    required: true,
  },
});

export default mongoose.model<IPlace>("Place", PlaceSchema);
