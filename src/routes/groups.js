
import express from 'express';
import { GroupService } from '../services/groupService.js';
import { verifyToken } from '../middleware/auth.js';
import { validateEventData } from '../middleware/validator.js';

const router = express.Router();
const groupService = new GroupService();

// GET /api/groups (Get all groups)
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const groups = await groupService.getAllGroups();

    res.json({
      success: true,
      data: groups,
    });
  } catch (error) {
    next(error);
  }
});

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

// ✅ NEW: GET /api/groups/:id/role (Check user's role in group)
router.get('/:id/role', verifyToken, async (req, res, next) => {
  try {
    const role = await groupService.getUserRoleInGroup(
      req.params.id,
      req.user.uid
    );

    res.json({
      success: true,
      data: role,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/groups (Create new group)
router.post('/', verifyToken, async (req, res, next) => {
  try {
    const { name, description, tags, groupTitle, groupRules, groupImage } = req.body;

    if (!name || !description) {
      return res.status(400).json({
        success: false,
        error: 'Name and description are required',
      });
    }

    const group = await groupService.createGroup(
      { 
        name, 
        description, 
        tags,
        groupTitle: groupTitle || '',
        groupRules: groupRules || [],
        groupImage: groupImage || '',
      },
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

// PUT /api/groups/:id (Update group)
router.put('/:id', verifyToken, async (req, res, next) => {
  try {
    const group = await groupService.updateGroup(
      req.params.id,
      req.body,
      req.user.uid
    );

    res.json({
      success: true,
      data: group,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/groups/:id (Delete group)
router.delete('/:id', verifyToken, async (req, res, next) => {
  try {
    await groupService.deleteGroup(req.params.id, req.user.uid);

    res.json({
      success: true,
      message: 'Group deleted successfully',
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

// ✅ UPDATED: POST /api/groups/:id/leave (with optional transfer)
router.post('/:id/leave', verifyToken, async (req, res, next) => {
  try {
    const { transferTo } = req.body; // Optional: userId to transfer ownership to

    const result = await groupService.leaveGroup(
      req.params.id, 
      req.user.uid,
      { transferTo }
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
});

// // POST /api/groups/:id/events (Add event to group)
// router.post('/:id/events', verifyToken, async (req, res, next) => {
//   try {
//     const groupId = req.params.id;
//     const userId = req.user.uid;
//     const eventData = req.body;

//     const event = await groupService.addEventToGroup(groupId, eventData, userId);

//     res.status(201).json({
//       success: true,
//       message: 'Event added to group successfully',
//       data: event,
//     });
//   } catch (error) {
//     console.error('❌ Add event to group error:', error);
//     next(error);
//   }
// });

// GET /api/groups/:id/events (Get all events in a group)
router.get('/:id/events', verifyToken, async (req, res, next) => {
  try {
    const events = await groupService.getGroupEvents(req.params.id);

    res.json({
      success: true,
      data: events,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/groups/:groupId/events/:eventId (Remove event from group)
router.delete('/:groupId/events/:eventId', verifyToken, async (req, res, next) => {
  try {
    await groupService.removeEventFromGroup(
      req.params.groupId,
      req.params.eventId,
      req.user.uid
    );

    res.json({
      success: true,
      message: 'Event removed from group successfully',
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/groups/:id/members (Get all members in a group)
router.get('/:id/members', verifyToken, async (req, res, next) => {
  try {
    const members = await groupService.getGroupMembers(req.params.id);

    res.json({
      success: true,
      data: members,
    });
  } catch (error) {
    next(error);
  }
});

export default router;