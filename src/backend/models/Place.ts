import mongoose, { Document, Schema } from 'mongoose';

export interface IPlace extends Document {
    name: string;
    position: {
        lat: number;
        lng: number;
    };
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
        ref: 'Sport',
        required: true,
    },
});

export default mongoose.model<IPlace>('Place', PlaceSchema);
