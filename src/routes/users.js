import express from 'express';
import { db } from '../config/firebase.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/users/me
router.get('/me', verifyToken, async (req, res, next) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: { id: userDoc.id, ...userDoc.data() },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/:id
router.get('/:id', verifyToken, async (req, res, next) => {
  try {
    const userDoc = await db.collection('users').doc(req.params.id).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: { id: userDoc.id, ...userDoc.data() },
    });
  } catch (error) {
    next(error);
  }
});

export default router;