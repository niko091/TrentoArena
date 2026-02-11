import express, { Request, Response } from "express";
import Sport from "../models/Sport";
import { adminAuth } from "../middleware/adminAuth";

const router = express.Router();

// GET /api/sports - Retrieve all sports
router.get("/", async (req: Request, res: Response) => {
  try {
    const sports = await Sport.find();
    res.json(sports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// POST /api/sports - Create a new sport
router.post("/", adminAuth, async (req: Request, res: Response) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Please provide a name" });
  }

  try {
    const newSport = new Sport({ name });
    const sport = await newSport.save();
    res.status(201).json(sport);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

export default router;
