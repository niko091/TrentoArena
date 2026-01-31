import mongoose, { Document, Schema } from 'mongoose';

export interface ISport extends Document {
    name: string;
}

const SportSchema: Schema = new Schema({
    name: {
        type: String,
        required: true,
    },
});

export default mongoose.model<ISport>('Sport', SportSchema);
