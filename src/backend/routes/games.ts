import express, { Request, Response } from 'express';
import Game from '../models/Game';

const router = express.Router();

// POST /api/games - Create a new game
router.post('/', async (req: Request, res: Response) => {
    try {
        if (!req.isAuthenticated() || !req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { sportId, placeId, date, time, note, maxParticipants } = req.body;

        if (!sportId || !placeId || !date || !time || !maxParticipants) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        if (maxParticipants < 2) {
            return res.status(400).json({ message: 'Max participants must be at least 2' });
        }

        // Combine date and time into a single Date object
        const gameDate = new Date(`${date}T${time}`);
        const creatorId = (req.user as any)._id;

        const newGame = new Game({
            sport: sportId,
            place: placeId,
            creator: creatorId,
            date: gameDate,
            note: note || '',
            participants: [{ user: creatorId, winner: false }],
            maxParticipants: maxParticipants
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
        const { startDate, endDate, sportId, placeId, creatorId, isFinished, participantId } = req.query;

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

        // Participant Filter
        if (participantId) {
            query['participants.user'] = participantId;
        }

        // isFinished Filter
        if (isFinished !== undefined) {
            query.isFinished = isFinished === 'true';
        }

        const games = await Game.find(query)
            .populate('sport')
            .populate('place')
            .populate('creator', '-password') // Exclude password from creator
            .populate('participants.user', 'username profilePicture email'); // Populate participants info

        res.json(games);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// PATCH /api/games/:id/finish - Mark a game as finished
router.patch('/:id/finish', async (req: Request, res: Response) => {
    try {
        if (!req.isAuthenticated() || !req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const game = await Game.findById(req.params.id);

        if (!game) {
            return res.status(404).json({ message: 'Game not found' });
        }

        // Check if the current user is the creator
        if (game.creator.toString() !== (req.user as any)._id.toString()) {
            return res.status(403).json({ message: 'Only the creator can finish this game' });
        }

        game.isFinished = true;
        await game.save();

        res.json({ message: 'Game marked as finished', game });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// POST /api/games/:id/join - Join a game
router.post('/:id/join', async (req: Request, res: Response) => {
    try {
        if (!req.isAuthenticated() || !req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const game = await Game.findById(req.params.id);

        if (!game) {
            return res.status(404).json({ message: 'Game not found' });
        }

        if (game.isFinished) {
            return res.status(400).json({ message: 'Cannot join a finished game' });
        }

        const userId = (req.user as any)._id;

        // Check if user is already a participant
        const isParticipant = game.participants.some(p => p.user.toString() === userId.toString());
        if (isParticipant) {
            return res.status(400).json({ message: 'User already joined this game' });
        }

        // Check max participants
        if (game.participants.length >= game.maxParticipants) {
            return res.status(400).json({ message: 'Game is full' });
        }

        // Add user to participants
        game.participants.push({ user: userId, winner: false });
        await game.save();

        res.json(game);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// DELETE /api/games/:id - Delete a game
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        if (!req.isAuthenticated() || !req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const game = await Game.findById(req.params.id);

        if (!game) {
            return res.status(404).json({ message: 'Game not found' });
        }

        // Check if the current user is the creator
        if (game.creator.toString() !== (req.user as any)._id.toString()) {
            return res.status(403).json({ message: 'Only the creator can delete this game' });
        }

        await game.deleteOne();

        res.json({ message: 'Game deleted successfully' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});
export default router;
