import mongoose, { Document, Schema } from "mongoose";

import { ISportShared } from "../../shared/types/Sport";

export interface ISport extends Document, Omit<ISportShared, "_id"> {
  name: string;
}

const SportSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
  },
});

export default mongoose.model<ISport>("Sport", SportSchema);
