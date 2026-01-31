import mongoose from 'mongoose';
import Sport from '../src/backend/models/Sport';
import dotenv from 'dotenv';

dotenv.config();

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/trentoarena');
    console.log('Connected to MongoDB');

    const sport = new Sport({ name: 'Football' });
    await sport.save();
    console.log('Sport saved:', sport);

    const foundSport = await Sport.findById(sport._id);
    console.log('Sport found:', foundSport);

    await Sport.deleteMany({}); // Clean up
    console.log('Cleaned up');

    await mongoose.disconnect();
};

run().catch(console.error);
