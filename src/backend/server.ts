import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import connectDB from './config/db';
import passport from 'passport';
import session from 'express-session';
import './config/passport'; // Passport config
import './config/cloudinary';
import authRoutes from './routes/auth';
import placeRoutes from './routes/places';
import sportRoutes from './routes/sports';
import gameRoutes from './routes/games';
import userRoutes from './routes/users';
import reportRoutes from './routes/reports'; // Import report routes
import adminRoutes from './routes/admin';
import statsRoutes from './routes/stats';
import { checkBan } from './middleware/checkBan';
import basicAuth from 'express-basic-auth';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
import { frontendPath, uploadDir } from './config/paths';

// Connect to MongoDB
if (process.env.NODE_ENV !== 'test') {
    connectDB();
}

// Ensure uploads directory exists
import fs from 'fs';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

import MongoStore from 'connect-mongo';

// Middleware
app.use(express.json());

// Content Security Policy
app.use((req, res, next) => {
    res.setHeader(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com; img-src 'self' data: https: blob: https://tile.openstreetmap.org; font-src 'self' data: https:; connect-src 'self' https:;"
    );
    next();
});

// Favicon handler
app.get('/favicon.ico', (req, res) => res.status(204).end());

app.use(
    session({
        secret: process.env.SESSION_SECRET || 'secret',
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: process.env.MONGO_URI || 'mongodb://localhost:27017/trentoarena'
        })
    })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(checkBan);

app.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect('/dashboard.html');
    } else {
        res.redirect('/login');
    }
});

app.get('/login', (req, res) => {
    if (req.isAuthenticated()) {
        return res.redirect('/dashboard.html');
    }
    res.sendFile(path.join(frontendPath, '/login.html'));
});

app.get('/dashboard', (req, res) => {
    if (req.isAuthenticated()) {
        res.sendFile(path.join(frontendPath, '/dashboard.html'));
    } else {
        res.redirect('/login');
    }
});

app.get('/leaderboard', (req, res) => {
    if (req.isAuthenticated()) {
        res.sendFile(path.join(frontendPath, '/leaderboard.html'));
    } else {
        res.redirect('/login');
    }
});

app.use(express.static(frontendPath));

// Routes
app.use('/auth', authRoutes);
app.use('/api/places', placeRoutes);
app.use('/api/sports', sportRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes); // Register report routes
app.use('/api/stats', statsRoutes);

// Admin API Routes
app.use('/api/admin', basicAuth({
    users: { [process.env.ADMIN_USERNAME || 'admin']: process.env.ADMIN_PASSWORD || 'admin123' },
    challenge: true
}), adminRoutes);

// Admin Dashboard Route
app.use('/admin', basicAuth({
    users: { [process.env.ADMIN_USERNAME || 'admin']: process.env.ADMIN_PASSWORD || 'admin123' },
    challenge: true
}), (req, res) => {
    res.sendFile(path.join(frontendPath, '/admin_dashboard.html'));
});

// Stats Route
app.use('/stats', basicAuth({
    users: { [process.env.STATS_USERNAME || 'stats']: process.env.STATS_PASSWORD || 'stats123' },
    challenge: true
}), (req, res) => {
    res.sendFile(path.join(frontendPath, '/stats.html'));
});


app.get('/registration', (req, res) => {
    res.sendFile(path.join(frontendPath, '/registrazione.html'));
});

app.get('/map', (req, res) => {
    if (req.isAuthenticated()) {
        res.sendFile(path.join(frontendPath, '/map.html'));
    } else {
        res.redirect('/login');
    }
});

app.get('/profile', (req, res) => {
    if (req.isAuthenticated()) {
        res.sendFile(path.join(frontendPath, '/profile.html'));
    } else {
        res.redirect('/login');
    }
});

app.get('/user/:username', (req, res) => {
    if (req.isAuthenticated()) {
        res.sendFile(path.join(frontendPath, '/profile.html'));
    } else {
        res.redirect('/login');
    }
});

// Routes (Placeholder)
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

if (require.main === module) {
    app.listen(Number(PORT), '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
    });
}

export default app;
