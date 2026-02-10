import dotenv from 'dotenv';
import express from 'express';
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
import { adminAuth } from './middleware/adminAuth';
import { statsAuth } from './middleware/statsAuth';
import { distDir } from './config/paths';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
if (process.env.NODE_ENV !== 'test') {
    connectDB();
}

import MongoStore from 'connect-mongo';

// Middleware
app.use(express.json());

// Request logging
app.use((req, res, next) => {
    console.log(`[Backend] ${req.method} ${req.url}`);
    next();
});

// Content Security Policy
app.use((req, res, next) => {
    res.setHeader(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com; img-src 'self' data: https: blob: https://tile.openstreetmap.org; font-src 'self' data: https:; connect-src 'self' https:;"
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

// Serve Vue App static files
const frontendDir = path.join(__dirname, '../../dist/frontend');
console.log('Serving static files from:', frontendDir);
app.use(express.static(frontendDir));

// Routes
app.use('/auth', authRoutes);
app.use('/api/places', placeRoutes);
app.use('/api/sports', sportRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes); // Register report routes
app.use('/api/stats', statsAuth, statsRoutes);

// Admin API Routes
// Admin API Routes
app.use('/api/admin', adminAuth, adminRoutes);

// Routes (Placeholder)
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// All other routes serve the Vue App
app.get(/.*/, (req, res) => {
    // Return 404 for missing API/Auth routes regarding of Accept header
    if (req.url.startsWith('/api') || req.url.startsWith('/auth')) {
        return res.status(404).json({ message: 'API Route Not Found' });
    }
    const indexPath = path.join(__dirname, '../../dist/frontend/index.html');
    console.log('Serving index.html from:', indexPath);
    res.sendFile(indexPath, (err) => {
        if (err) {
            console.error('Error serving index.html:', err);
            res.status(500).send('Error serving frontend');
        }
    });
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
