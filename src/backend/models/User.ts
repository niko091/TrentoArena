import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
    username: string;
    email: string;
    googleId?: string;
    password?: string;
    friends: string[] | IUser[];
    friendRequests: string[] | IUser[];
    profilePicture?: string;
    isBanned?: boolean;
    banExpiresAt?: Date;
    banReason?: string;
    sportsElo: {
        sport: mongoose.Types.ObjectId | string,
        elo: number,
        history: { elo: number, date: Date, change: number }[]
    }[];
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
        sparse: true, // Allows multiple null values
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
        default: false
    },
    banExpiresAt: {
        type: Date
    },
    banReason: {
        type: String
    },
    friends: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    friendRequests: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    sportsElo: [{
        sport: {
            type: Schema.Types.ObjectId,
            ref: 'Sport',
            required: true
        },
        elo: {
            type: Number,
            default: 1200
        },
        history: [{
            elo: { type: Number, required: true },
            date: { type: Date, default: Date.now },
            change: { type: Number, required: true }
        }]
    }]
});

export default mongoose.model<IUser>('User', UserSchema);
