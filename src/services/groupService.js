// // import { db, FieldValue, admin } from '../config/firebase.js';
// import { db, FieldValue } from '../config/firebase.js';

// import { logger } from '../utils/logger.js';

// export class GroupService {
//   async createGroup(groupData, userId) {
//     try {
//       const groupRef = db.collection('groups').doc();
      
//       const group = {
//         name: groupData.name,
//         description: groupData.description,
//         groupTitle: groupData.groupTitle || '',
//         groupImage: groupData.groupImage || null,
//         createdBy: db.doc(`users/${userId}`),
//         createdAt: FieldValue.serverTimestamp(),
//         admins: [db.doc(`users/${userId}`)],
//         members: [db.doc(`users/${userId}`)],
//         providerMembers: [],
//         events: [],
//         services: [],
//         tags: groupData.tags || [],
//         postsCount: 0,
//         solvedCount: 0,
//         groupRules: groupData.groupRules || [],
//       };

//       await groupRef.set(group);
//       logger.info(`Group created: ${groupRef.id} by user ${userId}`);

//       return { id: groupRef.id, ...group };
//     } catch (error) {
//       logger.error('Error creating group:', error);
//       throw error;
//     }
//   }

//   async updateGroup(groupId, updateData, userId) {
//     try {
//       const groupRef = db.collection('groups').doc(groupId);
//       const groupDoc = await groupRef.get();

//       if (!groupDoc.exists) {
//         throw new Error('Group not found');
//       }

//       const groupData = groupDoc.data();
      
//       // Check if user is admin
//       const isAdmin = groupData.admins.some(ref => ref.id === userId);
//       if (!isAdmin) {
//         throw new Error('Unauthorized: Only admins can update group');
//       }

//       const allowedUpdates = {
//         name: updateData.name,
//         description: updateData.description,
//         groupTitle: updateData.groupTitle,
//         groupImage: updateData.groupImage,
//         tags: updateData.tags,
//         groupRules: updateData.groupRules,
//       };

//       // Remove undefined values
//       Object.keys(allowedUpdates).forEach(key => 
//         allowedUpdates[key] === undefined && delete allowedUpdates[key]
//       );

//       await groupRef.update({
//         ...allowedUpdates,
//         updatedAt: FieldValue.serverTimestamp(),
//       });

//       logger.info(`Group ${groupId} updated by user ${userId}`);

//       return { id: groupId, ...groupData, ...allowedUpdates };
//     } catch (error) {
//       logger.error('Error updating group:', error);
//       throw error;
//     }
//   }

//   async joinGroup(groupId, userId) {
//     try {
//       const groupRef = db.collection('groups').doc(groupId);
//       const userRef = db.doc(`users/${userId}`);

//       // Check if already a member
//       const groupDoc = await groupRef.get();
//       if (!groupDoc.exists) {
//         throw new Error('Group not found');
//       }

//       const groupData = groupDoc.data();
//       const isMember = groupData.members.some(ref => ref.id === userId);
      
//       if (isMember) {
//         throw new Error('User is already a member');
//       }

//       await groupRef.update({
//         members: FieldValue.arrayUnion(userRef),
//       });

//       logger.info(`User ${userId} joined group ${groupId}`);

//       return { success: true, message: 'Successfully joined group' };
//     } catch (error) {
//       logger.error('Error joining group:', error);
//       throw error;
//     }
//   }

//   async leaveGroup(groupId, userId) {
//     try {
//       const groupRef = db.collection('groups').doc(groupId);
//       const userRef = db.doc(`users/${userId}`);
      
//       const groupDoc = await groupRef.get();
//       if (!groupDoc.exists) {
//         throw new Error('Group not found');
//       }

//       const groupData = groupDoc.data();
      
//       // Don't allow creator to leave
//       if (groupData.createdBy.id === userId) {
//         throw new Error('Group creator cannot leave the group');
//       }

//       await groupRef.update({
//         members: FieldValue.arrayRemove(userRef),
//         admins: FieldValue.arrayRemove(userRef), // Also remove from admins if applicable
//       });

//       logger.info(`User ${userId} left group ${groupId}`);

//       return { success: true, message: 'Successfully left group' };
//     } catch (error) {
//       logger.error('Error leaving group:', error);
//       throw error;
//     }
//   }

//   async getGroupById(groupId) {
//     try {
//       const groupDoc = await db.collection('groups').doc(groupId).get();

//       if (!groupDoc.exists) {
//         throw new Error('Group not found');
//       }

//       return { id: groupDoc.id, ...groupDoc.data() };
//     } catch (error) {
//       logger.error('Error fetching group:', error);
//       throw error;
//     }
//   }

//   async getAllGroups(filters = {}) {
//     try {
//       let query = db.collection('groups').orderBy('createdAt', 'desc');

//       if (filters.tag) {
//         query = query.where('tags', 'array-contains', filters.tag);
//       }

//       if (filters.limit) {
//         query = query.limit(filters.limit);
//       }

//       const snapshot = await query.get();
//       const groups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

//       // Sort by filters if specified
//       if (filters.sort === 'members') {
//         groups.sort((a, b) => (b.members?.length || 0) - (a.members?.length || 0));
//       } else if (filters.sort === 'events') {
//         groups.sort((a, b) => (b.events?.length || 0) - (a.events?.length || 0));
//       }

//       return groups;
//     } catch (error) {
//       logger.error('Error fetching groups:', error);
//       throw error;
//     }
//   }

//   async addEventToGroup(groupId, eventId, userId) {
//     try {
//       const groupRef = db.collection('groups').doc(groupId);
//       const eventRef = db.doc(`events/${eventId}`);
      
//       const groupDoc = await groupRef.get();
//       if (!groupDoc.exists) {
//         throw new Error('Group not found');
//       }

//       const groupData = groupDoc.data();
//       const isMember = groupData.members.some(ref => ref.id === userId);
      
//       if (!isMember) {
//         throw new Error('Only group members can add events');
//       }

//       await groupRef.update({
//         events: FieldValue.arrayUnion(eventRef),
//         postsCount: FieldValue.increment(1),
//       });

//       logger.info(`Event ${eventId} added to group ${groupId} by user ${userId}`);

//       return { success: true };
//     } catch (error) {
//       logger.error('Error adding event to group:', error);
//       throw error;
//     }
//   }

//   async uploadGroupImage(groupId, imageUrl, userId) {
//     try {
//       const groupRef = db.collection('groups').doc(groupId);
//       const groupDoc = await groupRef.get();

//       if (!groupDoc.exists) {
//         throw new Error('Group not found');
//       }

//       const groupData = groupDoc.data();
//       const isAdmin = groupData.admins.some(ref => ref.id === userId);
      
//       if (!isAdmin) {
//         throw new Error('Unauthorized: Only admins can update group image');
//       }

//       await groupRef.update({
//         groupImage: imageUrl,
//         updatedAt: FieldValue.serverTimestamp(),
//       });

//       logger.info(`Group ${groupId} image updated by user ${userId}`);

//       return { success: true, imageUrl };
//     } catch (error) {
//       logger.error('Error uploading group image:', error);
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