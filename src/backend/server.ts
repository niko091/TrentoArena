import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import connectDB from './config/db';
import passport from 'passport';
import session from 'express-session';
import './config/passport'; // Passport config
import authRoutes from './routes/auth';
import placeRoutes from './routes/places';
import sportRoutes from './routes/sports';
import gameRoutes from './routes/games';
import userRoutes from './routes/users';
import reportRoutes from './routes/reports'; // Import report routes
import basicAuth from 'express-basic-auth';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
// Connect to MongoDB
connectDB();

// Ensure uploads directory exists
import fs from 'fs';
const uploadDir = path.join(__dirname, '../frontend/uploads/profile_pictures');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Middleware
app.use(express.json());
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'secret',
        resave: false,
        saveUninitialized: false,
    })
);
app.use(passport.initialize());
app.use(passport.session());

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
    res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

app.get('/dashboard', (req, res) => {
    if (req.isAuthenticated()) {
        res.sendFile(path.join(__dirname, '../frontend/dashboard.html'));
    } else {
        res.redirect('/login');
    }
});

app.use(express.static(path.join(__dirname, '../frontend')));

// Routes
app.use('/auth', authRoutes);
app.use('/api/places', placeRoutes);
app.use('/api/sports', sportRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes); // Register report routes

// Admin Dashboard Route
app.use('/admin', basicAuth({
    users: { [process.env.ADMIN_USERNAME || 'admin']: process.env.ADMIN_PASSWORD || 'admin123' },
    challenge: true
}), (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/admin_dashboard.html'));
});



app.get('/registration', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/registrazione.html'));
});

app.get('/map', (req, res) => {
    if (req.isAuthenticated()) {
        res.sendFile(path.join(__dirname, '../frontend/map.html'));
    } else {
        res.redirect('/login');
    }
});

app.get('/profile', (req, res) => {
    if (req.isAuthenticated()) {
        res.sendFile(path.join(__dirname, '../frontend/profile.html'));
    } else {
        res.redirect('/login');
    }
});

app.get('/user/:username', (req, res) => {
    if (req.isAuthenticated()) {
        res.sendFile(path.join(__dirname, '../frontend/user_profile.html'));
    } else {
        res.redirect('/login');
    }
});

// Routes (Placeholder)
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

export default app;
