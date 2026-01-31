import mongoose, { Document, Schema } from 'mongoose';

export interface IPlace extends Document {
    name: string;
    position: {
        lat: number;
        lng: number;
    };
    sport: string;
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
        type: String,
        required: true,
    },
});

export default mongoose.model<IPlace>('Place', PlaceSchema);
