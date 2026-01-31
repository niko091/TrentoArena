import express, { Request, Response } from 'express';
import Place from '../models/Place';

const router = express.Router();

// GET /api/places - Retrieve all places
router.get('/', async (req: Request, res: Response) => {
    try {
        const places = await Place.find();
        res.json(places);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// POST /api/places - Insert a new place
router.post('/', async (req: Request, res: Response) => {
    const { name, position, sport } = req.body;

    if (!name || !position || !position.lat || !position.lng || !sport) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }

    try {
        const newPlace = new Place({
            name,
            position,
            sport,
        });

        const place = await newPlace.save();
        res.status(201).json(place);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
