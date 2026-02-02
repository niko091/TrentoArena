import mongoose, { Document, Schema } from 'mongoose';

export interface IGame extends Document {
    sport: mongoose.Types.ObjectId | string;
    place: mongoose.Types.ObjectId | string;
    creator: mongoose.Types.ObjectId | string;
    date: Date;
    note?: string;
}

const GameSchema: Schema = new Schema({
    sport: {
        type: Schema.Types.ObjectId,
        ref: 'Sport',
        required: true,
    },
    place: {
        type: Schema.Types.ObjectId,
        ref: 'Place',
        required: true,
    },
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    note: {
        type: String,
        default: '',
    },
});

export default mongoose.model<IGame>('Game', GameSchema);
