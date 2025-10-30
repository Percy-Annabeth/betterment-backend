import express from 'express';
import { EventService } from '../services/eventService.js';
import { verifyToken } from '../middleware/auth.js';
import { validateEventData } from '../middleware/validator.js';
import { db } from '../config/firebase.js';

const router = express.Router();
const eventService = new EventService();






// Add this BEFORE your other routes (at the top after router declaration)

// TEST ENDPOINT - NO AUTH REQUIRED (Remove in production!)
router.get('/test', async (req, res, next) => {
  try {
    const eventsSnapshot = await db.collection('events').limit(10).get();
    const events = eventsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      success: true,
      message: 'Test endpoint - no auth required',
      count: events.length,
      data: events,
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    next(error);
  }
});








// GET /api/events
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const { status, category, limit } = req.query;
    
    const filters = {};
    if (status) filters.status = status;
    if (category) filters.category = category;
    if (limit) filters.limit = parseInt(limit);

    const events = await eventService.getAllEvents(filters);

    res.json({
      success: true,
      data: events,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/events/:id
router.get('/:id', verifyToken, async (req, res, next) => {
  try {
    const event = await eventService.getEventById(req.params.id);

    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/events
router.post('/', verifyToken, validateEventData, async (req, res, next) => {
  try {
    const event = await eventService.createEvent(req.body, req.user.uid);

    res.status(201).json({
      success: true,
      data: event,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/events/:id
router.put('/:id', verifyToken, async (req, res, next) => {
  try {
    const event = await eventService.updateEvent(
      req.params.id,
      req.body,
      req.user.uid
    );

    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/events/:id
router.delete('/:id', verifyToken, async (req, res, next) => {
  try {
    await eventService.deleteEvent(req.params.id, req.user.uid);

    res.json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;