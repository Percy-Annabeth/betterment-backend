// src/routes/leaderboard.js
import express from 'express';
import { LeaderboardService } from '../services/leaderboardService.js';
import { verifyToken } from '../middleware/auth.js';
import { db } from '../config/firebase.js';

const router = express.Router();
const leaderboardService = new LeaderboardService();

// GET /api/leaderboard/top - Get top users (NEW - for Flutter app)
router.get('/top', verifyToken, async (req, res, next) => {
  try {
    const { limit = 50 } = req.query;
    const limitNum = parseInt(limit);

    const snapshot = await db
      .collection('users')
      .orderBy('totalPoints', 'desc')
      .limit(limitNum)
      .get();

    const users = snapshot.docs.map(doc => ({
      uid: doc.id,
      id: doc.id,
      ...doc.data(),
    }));

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Get top users error:', error);
    next(error);
  }
});

// GET /api/leaderboard/rank/:userId - Get user's rank (NEW - for Flutter app)
router.get('/rank/:userId', verifyToken, async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Get user's total points
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const userData = userDoc.data();
    const userPoints = userData.totalPoints || 0;

    // Count users with more points
    const higherRankSnapshot = await db
      .collection('users')
      .where('totalPoints', '>', userPoints)
      .get();

    const rank = higherRankSnapshot.size + 1;

    // Get total users count
    const totalUsersSnapshot = await db.collection('users').get();
    const totalUsers = totalUsersSnapshot.size;

    res.json({
      success: true,
      data: {
        rank,
        totalUsers,
        points: userPoints,
      },
    });
  } catch (error) {
    console.error('Get user rank error:', error);
    next(error);
  }
});

// GET /api/leaderboard/:type - Your existing route
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

// POST /api/leaderboard/refresh - Your existing route
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