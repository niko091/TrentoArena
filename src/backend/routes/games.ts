import express, { Request, Response } from 'express';
import Game from '../models/Game';

const router = express.Router();

// POST /api/games - Create a new game
router.post('/', async (req: Request, res: Response) => {
    try {
        if (!req.isAuthenticated() || !req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { sportId, placeId, date, time, note } = req.body;

        if (!sportId || !placeId || !date || !time) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        // Combine date and time into a single Date object
        const gameDate = new Date(`${date}T${time}`);

        const newGame = new Game({
            sport: sportId,
            place: placeId,
            creator: (req.user as any)._id,
            date: gameDate,
            note: note || ''
        });

        const savedGame = await newGame.save();
        res.status(201).json(savedGame);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// GET /api/games - Retrieve games with filtering
router.get('/', async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, sportId, placeId, creatorId } = req.query;

        const query: any = {};

        // Date Filter
        if (startDate || endDate) {
            query.date = {};
            if (startDate) {
                query.date.$gte = new Date(startDate as string);
            }
            if (endDate) {
                query.date.$lte = new Date(endDate as string);
            }
        }

        // Sport Filter
        if (sportId) {
            query.sport = sportId;
        }

        // Place Filter
        if (placeId) {
            query.place = placeId;
        }

        // Creator Filter
        if (creatorId) {
            query.creator = creatorId;
        }

        const games = await Game.find(query)
            .populate('sport')
            .populate('place')
            .populate('creator', '-password'); // Exclude password from creator

        res.json(games);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
