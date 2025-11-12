// backend/services/eventService.js
// import { db, FieldValue, Timestamp } from '../config/firebase.js';
// import { POINTS_CONFIG, TRANSACTION_TYPES } from '../config/constants.js';
// import { TransactionService } from './transactionService.js';
// import { logger } from '../utils/logger.js';

// export class EventService {
//   constructor() {
//     this.transactionService = new TransactionService();
//   }

//   async createEvent(eventData, userId) {
//     try {
//       const eventRef = db.collection('events').doc();
      
//       // Parse location if it comes as object
//       let location = eventData.location;
//       if (location && typeof location === 'object' && location.latitude !== undefined) {
//         // Convert to GeoPoint if needed
//         const admin = await import('firebase-admin');
//         location = new admin.firestore.GeoPoint(
//           location.latitude,
//           location.longitude
//         );
//       }

//       // Parse date if it comes as string
//       let eventDate = eventData.date;
//       if (typeof eventDate === 'string') {
//         eventDate = Timestamp.fromDate(new Date(eventDate));
//       } else if (eventDate instanceof Date) {
//         eventDate = Timestamp.fromDate(eventDate);
//       }

//       const event = {
//         title: eventData.title,
//         description: eventData.description,
//         category: eventData.category || eventData.priority || 'medium',
//         priority: eventData.priority || eventData.category || 'medium',
//         points: eventData.points || eventData.reward || 0,
//         reward: eventData.reward || eventData.points || 0,
//         date: eventDate || FieldValue.serverTimestamp(),
//         location: location || null,
//         createdBy: userId,
//         status: eventData.status || 'active',
//         tags: eventData.tags || [],
//         imageUrl: eventData.imageUrl || null,
//         timeReqToInvest: eventData.timeReqToInvest || 0,
//         totalDonation: eventData.totalDonation || 0,
//         donatedAmount: 0,
//         participants: [],
//         unsureParticipants: [],
//         likes: [],
//         dislikes: [],
//         views: 0,
//         verifiedParticipants: [],
//         reportedBy: [],
//         donation: [],
//         createdAt: FieldValue.serverTimestamp(),
//       };

//       await eventRef.set(event);

//       // Award points for posting event
//       try {
//         await this.transactionService.createTransaction({
//           userId,
//           amount: 0,
//           points: POINTS_CONFIG.EVENT_POST || 10,
//           type: TRANSACTION_TYPES.EVENT_POSTED || 'event_posted',
//           relatedEventId: eventRef.id,
//         });
//       } catch (txError) {
//         logger.warn(`Transaction creation failed for event ${eventRef.id}:`, txError);
//         // Don't fail the event creation if transaction fails
//       }

//       logger.info(`Event created: ${eventRef.id} by user ${userId}`);

//       return { id: eventRef.id, ...event };
//     } catch (error) {
//       logger.error('Error creating event:', error);
//       throw error;
//     }
//   }

//   async updateEvent(eventId, updateData, userId) {
//     try {
//       const eventRef = db.collection('events').doc(eventId);
//       const eventDoc = await eventRef.get();

//       if (!eventDoc.exists) {
//         throw new Error('Event not found');
//       }

//       const eventData = eventDoc.data();

//       // Check if event status changed to 'completed'
//       if (eventData.status !== 'completed' && updateData.status === 'completed') {
//         // Award points to solver
//         if (updateData.solvedBy) {
//           try {
//             await this.transactionService.createTransaction({
//               userId: updateData.solvedBy,
//               amount: 0,
//               points: eventData.points || eventData.reward || POINTS_CONFIG.EVENT_SOLVE || 20,
//               type: TRANSACTION_TYPES.EVENT_SOLVED || 'event_solved',
//               relatedEventId: eventId,
//             });
//           } catch (txError) {
//             logger.warn(`Transaction creation failed for event completion ${eventId}:`, txError);
//           }

//           logger.info(`Event ${eventId} solved by user ${updateData.solvedBy}`);
//         }
//       }

//       await eventRef.update({
//         ...updateData,
//         updatedAt: FieldValue.serverTimestamp(),
//       });

//       return { id: eventId, ...eventData, ...updateData };
//     } catch (error) {
//       logger.error('Error updating event:', error);
//       throw error;
//     }
//   }

//   async deleteEvent(eventId, userId) {
//     try {
//       const eventRef = db.collection('events').doc(eventId);
//       const eventDoc = await eventRef.get();

//       if (!eventDoc.exists) {
//         throw new Error('Event not found');
//       }

//       const eventData = eventDoc.data();

//       // Only creator can delete
//       if (eventData.createdBy !== userId) {
//         throw new Error('Unauthorized: Only event creator can delete');
//       }

//       await eventRef.delete();
//       logger.info(`Event deleted: ${eventId}`);

//       return { success: true };
//     } catch (error) {
//       logger.error('Error deleting event:', error);
//       throw error;
//     }
//   }

//   async getEventById(eventId) {
//     try {
//       const eventDoc = await db.collection('events').doc(eventId).get();

//       if (!eventDoc.exists) {
//         throw new Error('Event not found');
//       }

//       return { id: eventDoc.id, ...eventDoc.data() };
//     } catch (error) {
//       logger.error('Error fetching event:', error);
//       throw error;
//     }
//   }

//   async getAllEvents(filters = {}) {
//     try {
//       let query = db.collection('events').orderBy('createdAt', 'desc');

//       if (filters.status) {
//         query = query.where('status', '==', filters.status);
//       }

//       if (filters.category) {
//         query = query.where('category', '==', filters.category);
//       }

//       if (filters.limit) {
//         query = query.limit(filters.limit);
//       }

//       const snapshot = await query.get();
//       return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//     } catch (error) {
//       logger.error('Error fetching events:', error);
//       throw error;
//     }
//   }
// }











// backend/services/eventService.js
import { db, FieldValue, Timestamp } from '../config/firebase.js';
import admin from 'firebase-admin'; // ✅ CRITICAL: Import admin for GeoPoint
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
      
      // ✅ FIX: Properly parse location to GeoPoint
      let location = null;
      if (eventData.location) {
        if (eventData.location._latitude !== undefined || eventData.location.latitude !== undefined) {
          // It's already a GeoPoint-like object or has coordinates
          const lat = eventData.location._latitude || eventData.location.latitude;
          const lng = eventData.location._longitude || eventData.location.longitude;
          location = new admin.firestore.GeoPoint(
            parseFloat(lat),
            parseFloat(lng)
          );
        }
      }

      // ✅ FIX: Properly parse date to Timestamp
      let eventDate = null;
      if (eventData.date) {
        if (typeof eventData.date === 'string') {
          eventDate = Timestamp.fromDate(new Date(eventData.date));
        } else if (eventData.date instanceof Date) {
          eventDate = Timestamp.fromDate(eventData.date);
        } else if (eventData.date._seconds !== undefined) {
          // Already a Timestamp
          eventDate = eventData.date;
        }
      }

      if (!eventDate) {
        eventDate = Timestamp.now();
      }

      const event = {
        title: eventData.title,
        description: eventData.description,
        category: eventData.category || eventData.priority || 'medium',
        priority: eventData.priority || eventData.category || 'medium',
        points: eventData.points || eventData.reward || 0,
        reward: eventData.reward || eventData.points || 0,
        date: eventDate,
        location: location,
        createdBy: userId,
        status: eventData.status || 'active',
        tags: eventData.tags || [],
        imageUrl: eventData.imageUrl || null, // ✅ Explicit null if empty
        timeReqToInvest: eventData.timeReqToInvest || 0,
        totalDonation: eventData.totalDonation || 0,
        donatedAmount: 0,
        participants: [],
        unsureParticipants: [],
        likes: [],
        dislikes: [],
        views: 0,
        verifiedParticipants: [],
        reportedBy: [],
        donation: [],
        createdAt: FieldValue.serverTimestamp(),
      };

      await eventRef.set(event);

      // Award points for posting event
      try {
        await this.transactionService.createTransaction({
          userId,
          amount: 0,
          points: POINTS_CONFIG?.EVENT_POST || 10,
          type: TRANSACTION_TYPES?.EVENT_POSTED || 'event_posted',
          relatedEventId: eventRef.id,
        });
      } catch (txError) {
        logger.warn(`Transaction creation failed for event ${eventRef.id}:`, txError);
        // Don't fail the event creation if transaction fails
      }

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
          try {
            await this.transactionService.createTransaction({
              userId: updateData.solvedBy,
              amount: 0,
              points: eventData.points || eventData.reward || POINTS_CONFIG?.EVENT_SOLVE || 20,
              type: TRANSACTION_TYPES?.EVENT_SOLVED || 'event_solved',
              relatedEventId: eventId,
            });
          } catch (txError) {
            logger.warn(`Transaction creation failed for event completion ${eventId}:`, txError);
          }

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