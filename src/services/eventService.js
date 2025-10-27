import { db, FieldValue, Timestamp } from '../config/firebase.js';
import { POINTS_CONFIG, TRANSACTION_TYPES } from '../config/constants.js';
import { TransactionService } from './transactionService.js';
import { logger } from '../utils/logger.js';

export class EventService {
  constructor() {
    this.transactionService = new TransactionService();
  }

  async createEvent(eventData, userId) {
    try {
      const eventRef = db.collection('events').doc();
      
      const event = {
        ...eventData,
        createdBy: userId,
        status: 'open',
        createdAt: FieldValue.serverTimestamp(),
      };

      await eventRef.set(event);

      // Award points for posting event
      await this.transactionService.createTransaction({
        userId,
        amount: 0,
        points: POINTS_CONFIG.EVENT_POST,
        type: TRANSACTION_TYPES.EVENT_POSTED,
        relatedEventId: eventRef.id,
      });

      logger.info(`Event created: ${eventRef.id} by user ${userId}`);

      return { id: eventRef.id, ...event };
    } catch (error) {
      logger.error('Error creating event:', error);
      throw error;
    }
  }

  async updateEvent(eventId, updateData, userId) {
    try {
      const eventRef = db.collection('events').doc(eventId);
      const eventDoc = await eventRef.get();

      if (!eventDoc.exists) {
        throw new Error('Event not found');
      }

      const eventData = eventDoc.data();

      // Check if event status changed to 'completed'
      if (eventData.status !== 'completed' && updateData.status === 'completed') {
        // Award points to solver
        if (updateData.solvedBy) {
          await this.transactionService.createTransaction({
            userId: updateData.solvedBy,
            amount: 0,
            points: eventData.points || POINTS_CONFIG.EVENT_SOLVE,
            type: TRANSACTION_TYPES.EVENT_SOLVED,
            relatedEventId: eventId,
          });

          logger.info(`Event ${eventId} solved by user ${updateData.solvedBy}`);
        }
      }

      await eventRef.update({
        ...updateData,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return { id: eventId, ...eventData, ...updateData };
    } catch (error) {
      logger.error('Error updating event:', error);
      throw error;
    }
  }

  async deleteEvent(eventId, userId) {
    try {
      const eventRef = db.collection('events').doc(eventId);
      const eventDoc = await eventRef.get();

      if (!eventDoc.exists) {
        throw new Error('Event not found');
      }

      const eventData = eventDoc.data();

      // Only creator can delete
      if (eventData.createdBy !== userId) {
        throw new Error('Unauthorized: Only event creator can delete');
      }

      await eventRef.delete();
      logger.info(`Event deleted: ${eventId}`);

      return { success: true };
    } catch (error) {
      logger.error('Error deleting event:', error);
      throw error;
    }
  }

  async getEventById(eventId) {
    try {
      const eventDoc = await db.collection('events').doc(eventId).get();

      if (!eventDoc.exists) {
        throw new Error('Event not found');
      }

      return { id: eventDoc.id, ...eventDoc.data() };
    } catch (error) {
      logger.error('Error fetching event:', error);
      throw error;
    }
  }

  async getAllEvents(filters = {}) {
    try {
      let query = db.collection('events').orderBy('createdAt', 'desc');

      if (filters.status) {
        query = query.where('status', '==', filters.status);
      }

      if (filters.category) {
        query = query.where('category', '==', filters.category);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      logger.error('Error fetching events:', error);
      throw error;
    }
  }
}