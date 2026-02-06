import express, { Request, Response } from 'express';
import Report from '../models/Report';
import User from '../models/User';

const router = express.Router();

// POST /api/reports - Create a new report
router.post('/', async (req: Request, res: Response) => {
    const { reporterId, reportedId, motivation } = req.body;

    if (!reporterId || !reportedId || !motivation) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        const reporter = await User.findById(reporterId);
        const reported = await User.findById(reportedId);

        if (!reporter || !reported) {
            return res.status(404).json({ message: 'User not found' });
        }

        const newReport = new Report({
            reporter: reporterId,
            reported: reportedId,
            motivation
        });

        await newReport.save();

        res.status(201).json({ message: 'Report created successfully', report: newReport });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// GET /api/reports - Get all reports
router.get('/', async (req: Request, res: Response) => {
    try {
        const reports = await Report.find()
            .populate('reporter', 'username email')
            .populate('reported', 'username email isBanned')
            .sort({ date: -1 });
        res.json(reports);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
