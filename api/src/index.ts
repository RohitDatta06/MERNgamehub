
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import gamesRoutes from './routes/games';
import scoresRoutes from './routes/scores';
import { Game } from './models/Game';


dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 4000;

// Connect to MongoDB
connectDB();

(async () => {
  const count = await Game.countDocuments();
  if (count === 0) {
    await Game.insertMany([
      { slug: 'snake', title: 'Snake', description: 'Classic snake game where you eat food and grow longer' },
      { slug: 'tetris', title: 'Tetris', description: 'Stack blocks and clear lines to score points' },
      { slug: 'flappy-bird', title: 'Flappy Bird', description: 'Fly through pipes without crashing' },
      { slug: 'minesweeper', title: 'Minesweeper', description: 'Clear the minefield without hitting a mine' },
      { slug: 'cross-the-road', title: 'Cross The Road', description: 'Dodge cars and reach the other side' },
      { slug: 'pong', title: 'Pong', description: 'Classic paddle game - keep the ball in play' }
    ]);
    console.log('✅ Auto-seeded 6 games');
  }
})();


// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '256kb' }));
app.use(cookieParser());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/auth', authRoutes);
app.use('/games', gamesRoutes);
app.use('/scores', scoresRoutes);

(async () => {
  try {
    const count = await Game.countDocuments();
    if (count === 0) {
      await Game.insertMany([
        { slug: 'snake', title: 'Snake', description: 'Classic snake game where you eat food and grow longer' },
        { slug: 'tetris', title: 'Tetris', description: 'Stack blocks and clear lines to score points' },
        { slug: 'flappy-bird', title: 'Flappy Bird', description: 'Fly through pipes without crashing' },
        { slug: 'minesweeper', title: 'Minesweeper', description: 'Clear the minefield without hitting a mine' },
        { slug: 'cross-the-road', title: 'Cross The Road', description: 'Dodge cars and reach the other side' },
        { slug: 'pong', title: 'Pong', description: 'Classic paddle game - keep the ball in play' }
      ]);
      console.log('✅ Auto-seeded 6 games');
    } else {
      console.log(`ℹ️  Games already seeded (${count} games found)`);
    }
  } catch (error) {
    console.error('❌ Auto-seed error:', error);
  }
})();

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});