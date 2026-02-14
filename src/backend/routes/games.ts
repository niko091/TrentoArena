import express, { Request, Response } from "express";
import Game from "../models/Game";
import User from "../models/User";

const router = express.Router();

// POST /api/games - Create a new game
router.post("/", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { sportId, placeId, date, time, note, maxParticipants } = req.body;

    if (!sportId || !placeId || !date || !time || !maxParticipants) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }

    if (maxParticipants < 2) {
      return res
        .status(400)
        .json({ message: "Max participants must be at least 2" });
    }

    const gameDate = new Date(`${date}T${time}`);
    const creatorId = (req.user as any)._id;

    const newGame = new Game({
      sport: sportId,
      place: placeId,
      creator: creatorId,
      date: gameDate,
      note: note || "",
      participants: [{ user: creatorId, winner: false }],
      maxParticipants: maxParticipants,
    });

    const savedGame = await newGame.save();
    res.status(201).json(savedGame);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// GET /api/games - Retrieve games with filtering
router.get("/", async (req: Request, res: Response) => {
  try {
    const {
      startDate,
      endDate,
      sportId,
      placeId,
      creatorId,
      isFinished,
      participantId,
      count,
      sort,
    } = req.query;

    const query: any = {};

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate as string);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate as string);
      }
    }

    if (sportId) query.sport = sportId;
    if (placeId) query.place = placeId;
    if (creatorId) query.creator = creatorId;
    if (participantId) query["participants.user"] = participantId;

    if (isFinished !== undefined) {
      query.isFinished = isFinished === "true";
    }

    if (count === "true") {
      const total = await Game.countDocuments(query);
      return res.json({ count: total });
    }

    const limit = parseInt(req.query.limit as string) || 0;
    const sortOrder = sort === "-1" ? -1 : 1;

    const games = await Game.find(query)
      .sort({ date: sortOrder })
      .limit(limit)
      .populate("sport")
      .populate("place")
      .populate("creator", "-password")
      .populate("participants.user", "username profilePicture email")
      .lean();

    res.json(games);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// PATCH /api/games/:id/finish
router.patch("/:id/finish", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const game = await Game.findById(req.params.id);

    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }

    if (game.creator.toString() !== (req.user as any)._id.toString()) {
      return res
        .status(403)
        .json({ message: "Only the creator can finish this game" });
    }

    if (new Date() < new Date(game.date)) {
      return res
        .status(400)
        .json({ message: "Cannot finish a game before it has started" });
    }

    const { winnerIds } = req.body;

    game.isFinished = true;

    if (winnerIds && Array.isArray(winnerIds)) {
      const winners: string[] = [];
      const losers: string[] = [];

      game.participants.forEach((participant) => {
        if (winnerIds.includes(participant.user.toString())) {
          participant.winner = true;
          winners.push(participant.user.toString());
        } else {
          participant.winner = false;
          losers.push(participant.user.toString());
        }
      });

      if (winners.length > 0 && losers.length > 0) {
        const sportId = game.sport.toString();

        const winnerUsers = await User.find({ _id: { $in: winners } });
        const loserUsers = await User.find({ _id: { $in: losers } });

        const getEloValue = (u: any, sId: string) => {
          const entry = u.sportsElo?.find(
            (e: any) => e.sport.toString() === sId,
          );
          return entry ? entry.elo : 1200;
        };

        const avgWinnerElo =
          winnerUsers.reduce((sum, u) => sum + getEloValue(u, sportId), 0) /
          winnerUsers.length;
        const avgLoserElo =
          loserUsers.reduce((sum, u) => sum + getEloValue(u, sportId), 0) /
          loserUsers.length;

        const expectedScoreWinner =
          1 / (1 + Math.pow(10, (avgLoserElo - avgWinnerElo) / 400));
        const expectedScoreLoser = 1 - expectedScoreWinner;

        const getKFactor = (historyLength: number) => {
          return historyLength < 10 ? 80 : 32;
        };

        const updateEloForUsers = async (
          users: any[],
          actualScore: number,
          probability: number,
        ) => {
          return Promise.all(
            users.map(async (user) => {
              if (!user.sportsElo) user.sportsElo = [];

              let entry = user.sportsElo.find(
                (e: any) => e.sport.toString() === sportId,
              );

              if (!entry) {
                user.sportsElo.push({ sport: sportId, elo: 1200, history: [] });
                entry = user.sportsElo.find(
                  (e: any) => e.sport.toString() === sportId,
                );
              }

              if (entry) {
                const oldElo = entry.elo;
                const gamesPlayed = entry.history ? entry.history.length : 0;
                const K = getKFactor(gamesPlayed);
                const newElo = Math.round(
                  oldElo + K * (actualScore - probability),
                );
                const change = newElo - oldElo;

                entry.elo = newElo;

                if (!entry.history) entry.history = [];
                entry.history.push({
                  elo: newElo,
                  date: new Date(),
                  change: change,
                });
              }
              await user.save();
            }),
          );
        };

        await updateEloForUsers(winnerUsers, 1, expectedScoreWinner);
        await updateEloForUsers(loserUsers, 0, expectedScoreLoser);
      }
    }

    await Game.updateOne(
      { _id: game._id },
      {
        $set: {
          isFinished: true,
          participants: game.participants,
        },
      },
    );

    res.json({ message: "Game marked as finished", game });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// POST /api/games/:id/join - Join a game
router.post("/:id/join", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const game = await Game.findById(req.params.id);

    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }

    if (game.isFinished) {
      return res.status(400).json({ message: "Cannot join a finished game" });
    }

    const userId = (req.user as any)._id;

    const isParticipant = game.participants.some(
      (p) => p.user.toString() === userId.toString(),
    );
    if (isParticipant) {
      return res.status(400).json({ message: "User already joined this game" });
    }

    if (game.participants.length >= game.maxParticipants) {
      return res.status(400).json({ message: "Game is full" });
    }

    game.participants.push({ user: userId, winner: false });
    await game.save();

    res.json(game);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// DELETE /api/games/:id - Delete a game
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const game = await Game.findById(req.params.id);

    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }

    if (game.creator.toString() !== (req.user as any)._id.toString()) {
      return res
        .status(403)
        .json({ message: "Only the creator can delete this game" });
    }

    await game.deleteOne();

    res.json({ message: "Game deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

export default router;
