import express, { Request, Response } from 'express';
import User from '../models/User';

const router = express.Router();

// GET /api/users/:id - Get user by ID (excluding password, populating friends)
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password')
            .populate('friends', 'username email')
            .populate('friendRequests', 'username email');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// POST /api/users/:id/friend-requests - Send a friend request
router.post('/:id/friend-requests', async (req: Request, res: Response) => {
    const { requesterId } = req.body; // In a real app, this comes from req.user
    const targetUserId = req.params.id;

    if (!requesterId) return res.status(400).json({ message: 'Requester ID required' });

    try {
        const targetUser = await User.findById(targetUserId);
        if (!targetUser) return res.status(404).json({ message: 'User not found' });

        if (targetUser.friends.includes(requesterId)) {
            return res.status(400).json({ message: 'Already friends' });
        }
        if (targetUser.friendRequests.includes(requesterId)) {
            return res.status(400).json({ message: 'Request already sent' });
        }

        (targetUser.friendRequests as any[]).push(requesterId);
        await targetUser.save();

        res.status(200).json({ message: 'Friend request sent' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// POST /api/users/:id/friends/accept - Accept a friend request
router.post('/:id/friends/accept', async (req: Request, res: Response) => {
    const { requesterId } = req.body;
    const userId = req.params.id;

    try {
        const user = await User.findById(userId);
        const requester = await User.findById(requesterId);

        if (!user || !requester) return res.status(404).json({ message: 'User not found' });

        // Check if request exists
        if (!user.friendRequests.includes(requesterId)) {
            return res.status(400).json({ message: 'No friend request from this user' });
        }

        // Add to both friends lists
        (user.friends as any[]).push(requesterId);
        (requester.friends as any[]).push(userId);

        // Remove from requests
        user.friendRequests = (user.friendRequests as any[]).filter(id => id.toString() !== requesterId);

        await user.save();
        await requester.save();

        res.status(200).json({ message: 'Friend request accepted', friends: user.friends });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
