import express, { Request, Response } from 'express';
import Game from '../models/Game';
import mongoose from 'mongoose';

const router = express.Router();

// GET /api/stats/chart-data
// Query: type ('sport' | 'place'), id (ObjectId)
router.get('/chart-data', async (req: Request, res: Response) => {
    try {
        const { type, id } = req.query;

        if (!type || !id) {
            return res.status(400).json({ message: 'Missing type or id' });
        }

        const matchStage: any = { isFinished: true };
        if (type === 'sport') {
            matchStage.sport = new mongoose.Types.ObjectId(id as string);
        } else if (type === 'place') {
            matchStage.place = new mongoose.Types.ObjectId(id as string);
        } else {
            return res.status(400).json({ message: 'Invalid type' });
        }

        const stats = await Game.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const result: Record<string, number> = {};
        stats.forEach((item: any) => {
            const [year, month, day] = item._id.split('-');
            const formattedDate = `${day}/${month}/${year}`;
            result[formattedDate] = item.count;
        });

        res.json(result);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// GET /api/stats/top-entities
// Query: type ('sport' | 'place'), period ('year' | 'month' | 'all')
router.get('/top-entities', async (req: Request, res: Response) => {
    try {
        const { type, period } = req.query;

        if (!type) {
            return res.status(400).json({ message: 'Missing type' });
        }

        const matchStage: any = { isFinished: true };

        // Time Filtering
        const now = new Date();
        if (period === 'year') {
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(now.getFullYear() - 1);
            matchStage.date = { $gte: oneYearAgo };
        } else if (period === 'month') {
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(now.getMonth() - 1);
            matchStage.date = { $gte: oneMonthAgo };
        }

        let groupField = '';
        let lookupCollection = '';
        let projectField = '';

        if (type === 'sport') {
            groupField = '$sport';
            lookupCollection = 'sports';
            projectField = 'name';
        } else if (type === 'place') {
            groupField = '$place';
            lookupCollection = 'places';
            projectField = 'name';
        } else {
            return res.status(400).json({ message: 'Invalid type' });
        }

        const stats = await Game.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: groupField,
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: lookupCollection,
                    localField: '_id',
                    foreignField: '_id',
                    as: 'entity'
                }
            },
            { $unwind: '$entity' },
            {
                $project: {
                    name: '$entity.name',
                    count: 1
                }
            }
        ]);

        res.json(stats);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
