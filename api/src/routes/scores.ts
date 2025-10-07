import express from 'express';
import { z } from 'zod';
import { Score } from '../models/Score';
import { authenticate, AuthRequest } from '../middleware/auth';
import { scoreLimiter } from '../middleware/rateLimiter';
import mongoose from 'mongoose';

const router = express.Router();

const submitScoreSchema = z.object({
  value: z.number().min(0),
  meta: z.record(z.any()).optional()
});

router.post('/:slug', authenticate, scoreLimiter, async (req: AuthRequest, res, next) => {
  try {
    const { value, meta } = submitScoreSchema.parse(req.body);
    const score = await Score.create({
      userId: req.userId,
      gameSlug: req.params.slug,
      value,
      meta
    });
    res.status(201).json({ score });
  } catch (error) {
    next(error);
  }
});

router.get('/:slug/leaderboard', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
    const scores = await Score.find({ gameSlug: req.params.slug })
      .sort({ value: -1 })
      .limit(limit)
      .populate('userId', 'username avatarUrl');
    res.json({ scores });
  } catch (error) {
    next(error);
  }
});

router.get('/me/:slug', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const scores = await Score.find({
      userId: req.userId,
      gameSlug: req.params.slug
    }).sort({ value: -1 }).limit(10);
    res.json({ scores });
  } catch (error) {
    next(error);
  }
});

router.get('/stats/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(req.userId);
{ $match: { userId: userObjectId } }
    const stats = await Score.aggregate([
      { $match: { userId: userObjectId } },
      { $group: { _id: '$gameSlug', bestScore: { $max: '$value' }, totalPlays: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    res.json({ stats });
  } catch (error) {
    next(error);
  }
});

export default router;