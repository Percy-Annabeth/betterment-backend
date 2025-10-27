import express from 'express';
import { LeaderboardService } from '../services/leaderboardService.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();
const leaderboardService = new LeaderboardService();

// GET /api/leaderboard/:type
router.get('/:type', verifyToken, async (req, res, next) => {
  try {
    const { type } = req.params;
    const userId = req.user.uid;

    const validTypes = ['topPoints', 'topPosters', 'topSolvers', 'risingStars'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid leaderboard type',
      });
    }

    const result = await leaderboardService.getLeaderboard(type, userId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/leaderboard/refresh (Admin only or manual trigger)
router.post('/refresh', verifyToken, async (req, res, next) => {
  try {
    await leaderboardService.updateCache();

    res.json({
      success: true,
      message: 'Leaderboard cache updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;