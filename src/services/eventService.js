
// // backend/services/eventService.js
// import { db, FieldValue, Timestamp } from '../config/firebase.js';
// import admin from 'firebase-admin'; // ✅ CRITICAL: Import admin for GeoPoint
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
      
//       // ✅ FIX: Properly parse location to GeoPoint
//       let location = null;
//       if (eventData.location) {
//         if (eventData.location._latitude !== undefined || eventData.location.latitude !== undefined) {
//           // It's already a GeoPoint-like object or has coordinates
//           const lat = eventData.location._latitude || eventData.location.latitude;
//           const lng = eventData.location._longitude || eventData.location.longitude;
//           location = new admin.firestore.GeoPoint(
//             parseFloat(lat),
//             parseFloat(lng)
//           );
//         }
//       }

//       // ✅ FIX: Properly parse date to Timestamp
//       let eventDate = null;
//       if (eventData.date) {
//         if (typeof eventData.date === 'string') {
//           eventDate = Timestamp.fromDate(new Date(eventData.date));
//         } else if (eventData.date instanceof Date) {
//           eventDate = Timestamp.fromDate(eventData.date);
//         } else if (eventData.date._seconds !== undefined) {
//           // Already a Timestamp
//           eventDate = eventData.date;
//         }
//       }

//       if (!eventDate) {
//         eventDate = Timestamp.now();
//       }

//       const event = {
//         title: eventData.title,
//         description: eventData.description,
//         category: eventData.category || eventData.priority || 'medium',
//         priority: eventData.priority || eventData.category || 'medium',
//         points: eventData.points || eventData.reward || 0,
//         reward: eventData.reward || eventData.points || 0,
//         date: eventDate,
//         location: location,
//         createdBy: userId,
//         status: eventData.status || 'active',
//         tags: eventData.tags || [],
//         imageUrl: eventData.imageUrl || null, // ✅ Explicit null if empty
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
//           points: POINTS_CONFIG?.EVENT_POST || 10,
//           type: TRANSACTION_TYPES?.EVENT_POSTED || 'event_posted',
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
//               points: eventData.points || eventData.reward || POINTS_CONFIG?.EVENT_SOLVE || 20,
//               type: TRANSACTION_TYPES?.EVENT_SOLVED || 'event_solved',
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








// src/services/eventService.js
import { db, FieldValue, Timestamp } from '../config/firebase.js';

export class EventService {
  constructor() {
    this.collection = db.collection('events');
  }

  /**
   * Get all events with optional filters
   */
  async getAllEvents(filters = {}) {
    try {
      let query = this.collection;

      // Apply filters
      if (filters.status) {
        query = query.where('status', '==', filters.status);
      }

      if (filters.category) {
        query = query.where('category', '==', filters.category);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      // Order by date
      query = query.orderBy('date', 'desc');

      const snapshot = await query.get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Error getting events:', error);
      throw new Error('Failed to fetch events');
    }
  }

  /**
   * Get event by ID
   */
  async getEventById(eventId) {
    try {
      const doc = await this.collection.doc(eventId).get();

      if (!doc.exists) {
        throw new Error('Event not found');
      }

      return {
        id: doc.id,
        ...doc.data(),
      };
    } catch (error) {
      console.error('Error getting event:', error);
      throw error;
    }
  }

  /**
   * Create a new event
   */
  async createEvent(data, creatorId) {
    try {
      // Validate and normalize data
      const eventData = {
        title: data.title,
        description: data.description,
        category: data.category || data.priority || 'general',
        priority: data.priority || data.category || 'medium',
        status: data.status || 'active',
        
        // Location
        location: data.location || null,
        
        // Date and time
        date: data.date ? Timestamp.fromDate(new Date(data.date)) : FieldValue.serverTimestamp(),
        timeReqToInvest: data.timeReqToInvest || 60,
        
        // Points and rewards
        points: data.points || data.reward || 0,
        reward: data.reward || data.points || 0,
        
        // Participants
        participants: [],
        verifiedParticipants: [],
        
        // Engagement
        likes: [],
        dislikes: [],
        likeCount: 0,
        dislikeCount: 0,
        views: 0,
        reportedBy: [],
        
        // Donations
        donatedAmount: 0,
        totalDonation: data.totalDonation || 0,
        donations: [],
        
        // Tags and metadata
        tags: data.tags || [],
        imageUrl: data.imageUrl || '',
        
        // Poll (if exists)
        poll: data.poll || null,
        
        // References
        createdBy: db.doc(`users/${creatorId}`),
        groupId: data.groupId || null,
        
        // Timestamps
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      const docRef = await this.collection.add(eventData);

      // Update user's pointsPosted
      await db.collection('users').doc(creatorId).update({
        pointsPosted: FieldValue.increment(1),
      });

      console.log(`✅ Event created: ${docRef.id}`);

      return {
        id: docRef.id,
        ...eventData,
      };
    } catch (error) {
      console.error('Error creating event:', error);
      throw new Error('Failed to create event');
    }
  }

  /**
   * Update an event
   */
  async updateEvent(eventId, data, userId) {
    try {
      const eventRef = this.collection.doc(eventId);
      const eventDoc = await eventRef.get();

      if (!eventDoc.exists) {
        throw new Error('Event not found');
      }

      const eventData = eventDoc.data();

      // Check if user is the creator
      if (eventData.createdBy.id !== userId) {
        throw new Error('Only the creator can update this event');
      }

      const updateData = {
        ...data,
        updatedAt: FieldValue.serverTimestamp(),
      };

      // Convert date if provided
      if (data.date) {
        updateData.date = Timestamp.fromDate(new Date(data.date));
      }

      await eventRef.update(updateData);

      return {
        id: eventId,
        ...eventData,
        ...updateData,
      };
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }

  /**
   * Delete an event
   */
  async deleteEvent(eventId, userId) {
    try {
      const eventRef = this.collection.doc(eventId);
      const eventDoc = await eventRef.get();

      if (!eventDoc.exists) {
        throw new Error('Event not found');
      }

      const eventData = eventDoc.data();

      // Check if user is the creator
      if (eventData.createdBy.id !== userId) {
        throw new Error('Only the creator can delete this event');
      }

      // Remove event from group if it belongs to one
      if (eventData.groupId) {
        await eventData.groupId.update({
          events: FieldValue.arrayRemove(eventRef),
        });
      }

      // Delete the event
      await eventRef.delete();

      // Update user's pointsPosted
      await db.collection('users').doc(userId).update({
        pointsPosted: FieldValue.increment(-1),
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }

  /**
   * Join an event
   */
  async joinEvent(eventId, userId) {
    try {
      const eventRef = this.collection.doc(eventId);
      const userRef = db.doc(`users/${userId}`);

      await eventRef.update({
        participants: FieldValue.arrayUnion(userRef),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return { success: true };
    } catch (error) {
      console.error('Error joining event:', error);
      throw error;
    }
  }

  /**
   * Leave an event
   */
  async leaveEvent(eventId, userId) {
    try {
      const eventRef = this.collection.doc(eventId);
      const userRef = db.doc(`users/${userId}`);

      await eventRef.update({
        participants: FieldValue.arrayRemove(userRef),
        verifiedParticipants: FieldValue.arrayRemove(userId),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return { success: true };
    } catch (error) {
      console.error('Error leaving event:', error);
      throw error;
    }
  }

  /**
   * Like an event
   */
  async likeEvent(eventId, userId) {
    try {
      const eventRef = this.collection.doc(eventId);
      const eventDoc = await eventRef.get();
      const eventData = eventDoc.data();

      // Remove from dislikes if exists
      const updates = {
        likes: FieldValue.arrayUnion(userId),
        likeCount: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (eventData.dislikes.includes(userId)) {
        updates.dislikes = FieldValue.arrayRemove(userId);
        updates.dislikeCount = FieldValue.increment(-1);
      }

      await eventRef.update(updates);

      return { success: true };
    } catch (error) {
      console.error('Error liking event:', error);
      throw error;
    }
  }

  /**
   * Dislike an event
   */
  async dislikeEvent(eventId, userId) {
    try {
      const eventRef = this.collection.doc(eventId);
      const eventDoc = await eventRef.get();
      const eventData = eventDoc.data();

      // Remove from likes if exists
      const updates = {
        dislikes: FieldValue.arrayUnion(userId),
        dislikeCount: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (eventData.likes.includes(userId)) {
        updates.likes = FieldValue.arrayRemove(userId);
        updates.likeCount = FieldValue.increment(-1);
      }

      await eventRef.update(updates);

      return { success: true };
    } catch (error) {
      console.error('Error disliking event:', error);
      throw error;
    }
  }

  /**
   * Check in at event location
   */
  async checkInAtEvent(eventId, userId) {
    try {
      const eventRef = this.collection.doc(eventId);

      await eventRef.update({
        verifiedParticipants: FieldValue.arrayUnion(userId),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return { success: true };
    } catch (error) {
      console.error('Error checking in:', error);
      throw error;
    }
  }

  /**
   * Add donation to event
   */
  async addDonation(eventId, donationData) {
    try {
      const eventRef = this.collection.doc(eventId);

      await eventRef.update({
        donations: FieldValue.arrayUnion(donationData),
        donatedAmount: FieldValue.increment(donationData.amount),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return { success: true };
    } catch (error) {
      console.error('Error adding donation:', error);
      throw error;
    }
  }

  /**
   * Increment view count
   */
  async incrementViews(eventId) {
    try {
      await this.collection.doc(eventId).update({
        views: FieldValue.increment(1),
      });

      return { success: true };
    } catch (error) {
      console.error('Error incrementing views:', error);
      throw error;
    }
  }
}