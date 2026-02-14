import express, { Request, Response, NextFunction } from "express";
import passport from "passport";
import bcrypt from "bcrypt";
import crypto from "crypto";
import User from "../models/User";
import { sendVerificationEmail } from "../services/email";

const router = express.Router();

// @desc    Register user
// @route   POST /auth/register
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ msg: "Please enter all fields" });
    }

    // Check for existing user by email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: "User already exists" });
    }

    // Handle username collision
    let newUsername = username;
    let userWithUsername = await User.findOne({ username: newUsername });
    while (userWithUsername) {
      const randomNum = Math.floor(Math.random() * 1000);
      newUsername = `${username}${randomNum}`;
      userWithUsername = await User.findOne({ username: newUsername });
    }

    // Genera Token
    const emailToken = crypto.randomBytes(32).toString("hex");

    const isVerified = process.env.NODE_ENV === "test";

    // Crea Utente
    const newUser = new User({
      username: newUsername,
      email,
      password,
      isVerified: isVerified,
      verificationToken: isVerified ? undefined : emailToken,
    });

    const salt = await bcrypt.genSalt(10);
    newUser.password = await bcrypt.hash(password, salt);

    await newUser.save();

    try {
      if (!isVerified) {
        await sendVerificationEmail(newUser.email, emailToken);
      }
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
    }

    const responseUser = {
      _id: newUser._id,
      username: newUser.username,
      email: newUser.email,
    };

    if (isVerified) {
      req.logIn(newUser, (err) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Login failed after registration");
        }
        res.status(201).json({
          msg: "User registered and logged in successfully",
          user: responseUser,
        });
      });
    } else {
      res.status(201).json({
        msg: "Registration successful! Please check your email to verify your account.",
        user: responseUser,
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// @desc    Verify Account
// @route   POST /auth/verify
router.post("/verify", async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ msg: "Token mancante" });
    }

    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({ msg: "Token non valido o scaduto" });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.status(200).json({
      msg: "Account verificato con successo! Ora puoi fare il login.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error during verification" });
  }
});

// @route   POST /auth/login
router.post("/login", (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate("local", (err: Error, user: any, info: any) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res
        .status(400)
        .json({ msg: info.message || "Credenziali non valide" });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        msg: "Devi verificare la tua email prima di accedere. Controlla la tua casella di posta.",
      });
    }

    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      return res.json({ msg: "Logged in successfully", user });
    });
  })(req, res, next);
});

// @route   GET /auth/google
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

// @route   GET /auth/google/callback
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req: Request, res: Response) => {
    res.redirect("/");
  },
);

// @route   GET /auth/current_user
router.get("/current_user", (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ msg: "Not authenticated" });
  res.json(req.user);
});

// @route   GET /auth/logout
router.get("/logout", (req: Request, res: Response, next: NextFunction) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

export default router;
