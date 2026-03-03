




// src/services/eventService.js
import { db, FieldValue, Timestamp } from '../config/firebase.js';

export class EventService {
  constructor() {
    this.collection = db.collection('events');
  }


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

  // /**
  //  * Create a new event
  //  */
  // async createEvent(data, creatorId) {
  //   try {
  //     // Validate and normalize data
  //     const eventData = {
  //       title: data.title,
  //       description: data.description,
  //       category: data.category || data.priority || 'general',
  //       priority: data.priority || data.category || 'medium',
  //       status: data.status || 'active',
        
  //       // Location
  //       location: data.location || null,
        
  //       // Date and time
  //       date: data.date ? Timestamp.fromDate(new Date(data.date)) : FieldValue.serverTimestamp(),
  //       timeReqToInvest: data.timeReqToInvest || 60,
        
  //       // Points and rewards
  //       points: data.points || data.reward || 0,
  //       reward: data.reward || data.points || 0,
        
  //       // Participants
  //       participants: [],
  //       verifiedParticipants: [],
        
  //       // Engagement
  //       likes: [],
  //       dislikes: [],
  //       likeCount: 0,
  //       dislikeCount: 0,
  //       views: 0,
  //       reportedBy: [],
        
  //       // Donations
  //       donatedAmount: 0,
  //       totalDonation: data.totalDonation || 0,
  //       donations: [],
        
  //       // Tags and metadata
  //       tags: data.tags || [],
  //       imageUrl: data.imageUrl || '',
        
  //       // Poll (if exists)
  //       poll: data.poll || null,
        
  //       // References
  //       createdBy: db.doc(`users/${creatorId}`),
  //       groupId: data.groupId || null,
        
  //       // Timestamps
  //       createdAt: FieldValue.serverTimestamp(),
  //       updatedAt: FieldValue.serverTimestamp(),
  //     };

  //     const docRef = await this.collection.add(eventData);

  //     // Update user's pointsPosted
  //     await db.collection('users').doc(creatorId).update({
  //       pointsPosted: FieldValue.increment(1),
  //     });

  //     console.log(`✅ Event created: ${docRef.id}`);

  //     return {
  //       id: docRef.id,
  //       ...eventData,
  //     };
  //   } catch (error) {
  //     console.error('Error creating event:', error);
  //     throw new Error('Failed to create event');
  //   }
  // }

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

  // /**
  //  * Delete an event
  //  */
  // async deleteEvent(eventId, userId) {
  //   try {
  //     const eventRef = this.collection.doc(eventId);
  //     const eventDoc = await eventRef.get();

  //     if (!eventDoc.exists) {
  //       throw new Error('Event not found');
  //     }

  //     const eventData = eventDoc.data();

  //     // Check if user is the creator
  //     if (eventData.createdBy.id !== userId) {
  //       throw new Error('Only the creator can delete this event');
  //     }

  //     // Remove event from group if it belongs to one
  //     if (eventData.groupId) {
  //       await eventData.groupId.update({
  //         events: FieldValue.arrayRemove(eventRef),
  //       });
  //     }

  //     // Delete the event
  //     await eventRef.delete();

  //     // Update user's pointsPosted
  //     await db.collection('users').doc(userId).update({
  //       pointsPosted: FieldValue.increment(-1),
  //     });

  //     return { success: true };
  //   } catch (error) {
  //     console.error('Error deleting event:', error);
  //     throw error;
  //   }
  // }

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



  async createEvent(data, creatorId) {
    const creatorRef = db.doc(`users/${creatorId}`);
    const groupIds = Array.isArray(data.groupId) ? data.groupId : [];

    return await db.runTransaction(async (transaction) => {
      const eventRef = this.collection.doc();

      // Convert groupIds to references
      const groupRefs = groupIds.map(id => db.doc(`groups/${id}`));

      // Validate groups exist
      for (const groupRef of groupRefs) {
        const groupSnap = await transaction.get(groupRef);
        if (!groupSnap.exists) {
          throw new Error(`Group not found: ${groupRef.id}`);
        }
      }

      const eventData = {
        title: data.title,
        description: data.description,

        category: data.category || data.priority || 'general',
        priority: data.priority || data.category || 'medium',

        status: 'active',

        location: data.location || null,

        date: data.date
          ? Timestamp.fromDate(new Date(data.date))
          : FieldValue.serverTimestamp(),

        timeReqToInvest: data.timeReqToInvest || 60,

        points: data.points ?? data.reward ?? 0,
        reward: data.reward ?? data.points ?? 0,

        participants: [],
        unsureParticipants: [],
        verifiedParticipants: [],

        likes: [],
        dislikes: [],
        likeCount: 0,
        dislikeCount: 0,
        views: 0,
        reportedBy: [],

        donatedAmount: 0,
        totalDonation: data.totalDonation || 0,
        donations: {}, // Map format (industry correct)

        tags: data.tags || [],
        imageUrl: data.imageUrl || '',

        poll: null,

        createdBy: creatorRef,
        groupId: groupRefs,

        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      transaction.set(eventRef, eventData);

      // Add event to each group
      for (const groupRef of groupRefs) {
        transaction.update(groupRef, {
          events: FieldValue.arrayUnion(eventRef),
          postsCount: FieldValue.increment(1),
        });
      }

      // Increment user counter
      transaction.update(creatorRef, {
        pointsPosted: FieldValue.increment(1),
      });

      return { id: eventRef.id, ...eventData };
    });
  }

  async deleteEvent(eventId, userId) {
    const eventRef = this.collection.doc(eventId);

    return await db.runTransaction(async (transaction) => {
      const eventSnap = await transaction.get(eventRef);
      if (!eventSnap.exists) throw new Error('Event not found');

      const eventData = eventSnap.data();

      if (eventData.createdBy.id !== userId) {
        throw new Error('Only creator can delete');
      }

      // Remove from groups
      const groupRefs = eventData.groupId || [];
      for (const groupRef of groupRefs) {
        transaction.update(groupRef, {
          events: FieldValue.arrayRemove(eventRef),
          postsCount: FieldValue.increment(-1),
        });
      }

      transaction.delete(eventRef);

      transaction.update(db.doc(`users/${userId}`), {
        pointsPosted: FieldValue.increment(-1),
      });

      return { success: true };
    });
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








