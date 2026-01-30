import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import connectDB from './config/db';
import passport from 'passport';
import session from 'express-session';
import './config/passport'; // Passport config
import authRoutes from './routes/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

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
        res.redirect('/success.html');
    } else {
        res.redirect('/login');
    }
});

app.get('/login', (req, res) => {
    if (req.isAuthenticated()) {
        return res.redirect('/success.html');
    }
    res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

app.use(express.static(path.join(__dirname, '../frontend')));

// Routes
app.use('/auth', authRoutes);

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
