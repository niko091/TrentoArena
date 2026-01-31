import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
    username: string;
    email: string;
    googleId?: string;
    password?: string;
    friends: string[] | IUser[];
    friendRequests: string[] | IUser[];
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
    friends: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    friendRequests: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }]
});

export default mongoose.model<IUser>('User', UserSchema);
