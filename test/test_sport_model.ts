import mongoose from 'mongoose';
import Sport from '../src/backend/models/Sport';
import dotenv from 'dotenv';

dotenv.config();

describe('Sport Model Tests', () => {

    before(async () => {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/trentoarena');
        }
        await Sport.deleteMany({ name: 'Test Sport Logic' });
    });

    after(async () => {
        // Cleanup if needed, but test logic usually cleans up or we leave it for seed
        // The original script deleted everything?
        // await Sport.deleteMany({}); 
        // Better to verify create/read and clean up specific item.
        await Sport.deleteMany({ name: 'Test Sport Logic' });
    });

    it('Step 1: Should save and retrieve a sport', async () => {
        const sport = new Sport({ name: 'Test Sport Logic' });
        await sport.save();

        const foundSport = await Sport.findById(sport._id);
        if (!foundSport) throw new Error('Sport not found');
        if (foundSport.name !== 'Test Sport Logic') throw new Error('Sport name mismatch');
    });
});
