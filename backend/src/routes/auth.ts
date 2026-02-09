import express from 'express';
import passport from 'passport';
import bcrypt from 'bcrypt';
import User from '../models/User';

const router = express.Router();

// @desc    Register user
// @route   POST /auth/register
router.post('/register', async (req, res) => {
    try {
        const { email, username, password } = req.body;

        if (!email || !username || !password) {
            return res.status(400).json({ msg: 'Please enter all fields' });
        }

        // Check for existing user by email
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        // Handle username collision
        let newUsername = username;
        let userWithUsername = await User.findOne({ username: newUsername });
        while (userWithUsername) {
            // Append random number to username
            const randomNum = Math.floor(Math.random() * 1000); // 0-999
            newUsername = `${username}${randomNum}`;
            userWithUsername = await User.findOne({ username: newUsername });
        }

        const newUser = new User({
            username: newUsername,
            email,
            password,
        });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        newUser.password = await bcrypt.hash(password, salt);

        await newUser.save();

        req.login(newUser, (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ msg: 'Registration successful, but login failed' });
            }
            return res.status(201).json({ msg: 'User registered and logged in successfully', user: newUser });
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @desc    Login user
// @route   POST /auth/login
router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err: Error, user: any, info: any) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.status(400).json({ msg: info.message });
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            return res.json({ msg: 'Logged in successfully', user });
        });
    })(req, res, next);
});

// @desc    Auth with Google
// @route   GET /auth/google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// @desc    Google auth callback
// @route   GET /auth/google/callback
router.get(
    '/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        res.redirect('/');
    }
);

// @desc    Get current user
// @route   GET /auth/current_user
router.get('/current_user', (req, res) => {
    res.json(req.user);
});

// @desc    Logout user
// @route   GET /auth/logout
router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.redirect('/');
    });
});

export default router;
