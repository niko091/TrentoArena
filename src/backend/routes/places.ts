import express, { Request, Response } from 'express';
import Place from '../models/Place';

const router = express.Router();

// GET /api/places/search - Search places by name
router.get('/search', async (req: Request, res: Response) => {
    const { query } = req.query;

    if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: 'Query parameter is required' });
    }

    try {
        const places = await Place.find({
            name: { $regex: query, $options: 'i' }
        }).populate('sport');

        res.json(places);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// GET /api/places - Retrieve all places
router.get('/', async (req: Request, res: Response) => {
    try {
        const places = await Place.find().populate('sport');
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

// DELETE /api/places/:id - Delete a place
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const place = await Place.findByIdAndDelete(req.params.id);

        if (!place) {
            return res.status(404).json({ message: 'Place not found' });
        }

        res.json({ message: 'Place removed' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
