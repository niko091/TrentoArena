import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import User, { IUser } from '../models/User';
import dotenv from 'dotenv';

dotenv.config();

passport.use(
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
        try {
            // Match user
            const user = await User.findOne({
                $or: [
                    { email: email },
                    { username: email }
                ]
            });
            if (!user) {
                return done(null, false, { message: 'Email or Username not registered' });
            }

            // Match password
            if (!user.password) {
                return done(null, false, { message: 'Please log in with Google' });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (isMatch) {
                return done(null, user);
            } else {
                return done(null, false, { message: 'Password incorrect' });
            }
        } catch (err) {
            return done(err);
        }
    })
);

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID || 'place_holder_id',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'place_holder_secret',
            callbackURL: '/auth/google/callback',
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                let user = await User.findOne({ googleId: profile.id });

                if (user) {
                    return done(null, user);
                }

                user = await User.create({
                    username: await generateUniqueUsername(profile.displayName),
                    email: profile.emails?.[0].value,
                    googleId: profile.id,
                });

                done(null, user);
            } catch (err) {
                done(err as Error, undefined);
            }
        }
    )
);

// Helper to generate unique username
const generateUniqueUsername = async (baseName: string): Promise<string> => {
    let username = baseName;
    let userExists = await User.findOne({ username });

    while (userExists) {
        const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4 digit random number
        username = `${baseName} ${randomSuffix}`;
        userExists = await User.findOne({ username });
    }

    return username;
};

passport.serializeUser((user: any, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});
