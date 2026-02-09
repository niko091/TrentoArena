import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const fixIndexes = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/trentoArena');
        console.log('MongoDB Connected');

        // Access the underlying MongoDB driver collection
        const collection = mongoose.connection.collection('users');

        // Check if index exists
        const indexes = await collection.indexes();
        const googleIdIndex = indexes.find((index) => index.key.googleId);

        if (googleIdIndex) {
            console.log('Found googleId index:', googleIdIndex);
            // Drop the index so it can be recreated with sparse: true
            await collection.dropIndex('googleId_1');
            console.log('Dropped googleId index');
        } else {
            console.log('googleId index not found');
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

fixIndexes();
