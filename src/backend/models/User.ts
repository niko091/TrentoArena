import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
    username: string;
    email: string;
    googleId?: string;
    password?: string;
    friends: string[] | IUser[];
    friendRequests: string[] | IUser[];
    profilePicture?: string;
    sportsElo: { sport: mongoose.Types.ObjectId | string, elo: number }[];
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
        }
    }]
});

export default mongoose.model<IUser>('User', UserSchema);
