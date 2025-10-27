import express from 'express';
import { GroupService } from '../services/groupService.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();
const groupService = new GroupService();

// GET /api/groups/:id
router.get('/:id', verifyToken, async (req, res, next) => {
  try {
    const group = await groupService.getGroupById(req.params.id);

    res.json({
      success: true,
      data: group,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/groups
router.post('/', verifyToken, async (req, res, next) => {
  try {
    const { name, description, tags } = req.body;

    if (!name || !description) {
      return res.status(400).json({
        success: false,
        error: 'Name and description are required',
      });
    }

    const group = await groupService.createGroup(
      { name, description, tags },
      req.user.uid
    );

    res.status(201).json({
      success: true,
      data: group,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/groups/:id/join
router.post('/:id/join', verifyToken, async (req, res, next) => {
  try {
    await groupService.joinGroup(req.params.id, req.user.uid);

    res.json({
      success: true,
      message: 'Successfully joined group',
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/groups/:id/leave
router.post('/:id/leave', verifyToken, async (req, res, next) => {
  try {
    await groupService.leaveGroup(req.params.id, req.user.uid);

    res.json({
      success: true,
      message: 'Successfully left group',
    });
  } catch (error) {
    next(error);
  }
});

export default router;