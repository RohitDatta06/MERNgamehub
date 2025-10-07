import express from 'express';
import { Game } from '../models/Game';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const games = await Game.find();
    res.json({ games });
  } catch (error) {
    next(error);
  }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const game = await Game.findOne({ slug: req.params.slug });
    if (!game) {
      return res.status(404).json({ error: { message: 'Game not found', code: 'GAME_NOT_FOUND' } });
    }
    res.json({ game });
  } catch (error) {
    next(error);
  }
});

router.post('/seed', async (_req, res, next) => {
  try {
    const preset = [
      { slug: 'snake', title: 'Snake' },
      { slug: 'tetris', title: 'Tetris' },
      { slug: 'flappy-bird', title: 'Flappy Bird' },
      { slug: 'minesweeper', title: 'Minesweeper' },
      { slug: 'cross-the-road', title: 'Cross The Road' },
      { slug: 'pong', title: 'Pong' },
    ];
    await Promise.all(
      preset.map(g =>
        Game.updateOne({ slug: g.slug }, { $setOnInsert: g }, { upsert: true })
      )
    );
    res.json({ ok: true, count: preset.length });
  } catch (e) { next(e); }
});

export default router;