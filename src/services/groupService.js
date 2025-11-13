// src/services/groupService.js
import { db, FieldValue, Timestamp } from '../config/firebase.js';
import { EventService } from './eventService.js';

export class GroupService {
  constructor() {
    this.collection = db.collection('groups');
    this.eventService = new EventService();
  }

  /**
   * Get all groups
   */
  async getAllGroups() {
    try {
      const snapshot = await this.collection.get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Error getting all groups:', error);
      throw new Error('Failed to fetch groups');
    }
  }

  /**
   * Get group by ID
   */
  async getGroupById(groupId) {
    try {
      const doc = await this.collection.doc(groupId).get();

      if (!doc.exists) {
        throw new Error('Group not found');
      }

      return {
        id: doc.id,
        ...doc.data(),
      };
    } catch (error) {
      console.error('Error getting group:', error);
      throw error;
    }
  }

  /**
   * Create a new group
   */
  async createGroup(data, creatorId) {
    try {
      const groupData = {
        name: data.name,
        description: data.description,
        groupTitle: data.groupTitle || '',
        groupImage: data.groupImage || '',
        tags: data.tags || [],
        groupRules: data.groupRules || [],
        members: [db.doc(`users/${creatorId}`)],
        admins: [db.doc(`users/${creatorId}`)],
        events: [],
        postsCount: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      const docRef = await this.collection.add(groupData);

      // Add group to user's joinedGroups
      await db.collection('users').doc(creatorId).update({
        joinedGroups: FieldValue.arrayUnion(docRef),
      });

      return {
        id: docRef.id,
        ...groupData,
      };
    } catch (error) {
      console.error('Error creating group:', error);
      throw new Error('Failed to create group');
    }
  }

  /**
   * Update a group
   */
  async updateGroup(groupId, data, userId) {
    try {
      const groupRef = this.collection.doc(groupId);
      const groupDoc = await groupRef.get();

      if (!groupDoc.exists) {
        throw new Error('Group not found');
      }

      const groupData = groupDoc.data();

      // Check if user is admin
      const isAdmin = groupData.admins.some(ref => ref.id === userId);
      if (!isAdmin) {
        throw new Error('Only admins can update the group');
      }

      const updateData = {
        ...data,
        updatedAt: FieldValue.serverTimestamp(),
      };

      await groupRef.update(updateData);

      return {
        id: groupId,
        ...groupData,
        ...updateData,
      };
    } catch (error) {
      console.error('Error updating group:', error);
      throw error;
    }
  }

  /**
   * Delete a group
   */
  async deleteGroup(groupId, userId) {
    try {
      const groupRef = this.collection.doc(groupId);
      const groupDoc = await groupRef.get();

      if (!groupDoc.exists) {
        throw new Error('Group not found');
      }

      const groupData = groupDoc.data();

      // Check if user is admin
      const isAdmin = groupData.admins.some(ref => ref.id === userId);
      if (!isAdmin) {
        throw new Error('Only admins can delete the group');
      }

      // Remove group from all members' joinedGroups
      const batch = db.batch();
      groupData.members.forEach(memberRef => {
        batch.update(memberRef, {
          joinedGroups: FieldValue.arrayRemove(groupRef),
        });
      });

      // Delete the group
      batch.delete(groupRef);
      await batch.commit();

      return { success: true };
    } catch (error) {
      console.error('Error deleting group:', error);
      throw error;
    }
  }

  /**
   * Join a group
   */
  async joinGroup(groupId, userId) {
    try {
      const groupRef = this.collection.doc(groupId);
      const userRef = db.doc(`users/${userId}`);

      const groupDoc = await groupRef.get();
      if (!groupDoc.exists) {
        throw new Error('Group not found');
      }

      const groupData = groupDoc.data();

      // Check if already a member
      const isMember = groupData.members.some(ref => ref.id === userId);
      if (isMember) {
        throw new Error('Already a member of this group');
      }

      // Add user to group members
      await groupRef.update({
        members: FieldValue.arrayUnion(userRef),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Add group to user's joinedGroups
      await db.collection('users').doc(userId).update({
        joinedGroups: FieldValue.arrayUnion(groupRef),
      });

      return { success: true };
    } catch (error) {
      console.error('Error joining group:', error);
      throw error;
    }
  }

  /**
   * Leave a group
   */
  async leaveGroup(groupId, userId) {
    try {
      const groupRef = this.collection.doc(groupId);
      const userRef = db.doc(`users/${userId}`);

      const groupDoc = await groupRef.get();
      if (!groupDoc.exists) {
        throw new Error('Group not found');
      }

      const groupData = groupDoc.data();

      // Check if user is a member
      const isMember = groupData.members.some(ref => ref.id === userId);
      if (!isMember) {
        throw new Error('Not a member of this group');
      }

      // Check if user is the only admin
      const isAdmin = groupData.admins.some(ref => ref.id === userId);
      if (isAdmin && groupData.admins.length === 1) {
        throw new Error('Cannot leave: You are the only admin. Please appoint another admin first.');
      }

      // Remove user from group members and admins
      await groupRef.update({
        members: FieldValue.arrayRemove(userRef),
        admins: FieldValue.arrayRemove(userRef),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Remove group from user's joinedGroups
      await db.collection('users').doc(userId).update({
        joinedGroups: FieldValue.arrayRemove(groupRef),
      });

      return { success: true };
    } catch (error) {
      console.error('Error leaving group:', error);
      throw error;
    }
  }

  /**
   * ✅ NEW: Add an event to a group
   */
  async addEventToGroup(groupId, eventData, userId) {
    try {
      const groupRef = this.collection.doc(groupId);
      const groupDoc = await groupRef.get();

      if (!groupDoc.exists) {
        throw new Error('Group not found');
      }

      const groupData = groupDoc.data();

      // Check if user is a member
      const isMember = groupData.members.some(ref => ref.id === userId);
      if (!isMember) {
        throw new Error('Only group members can create events');
      }

      // Create the event using EventService
      const event = await this.eventService.createEvent(eventData, userId);

      // Add event reference to group
      const eventRef = db.doc(`events/${event.id}`);
      await groupRef.update({
        events: FieldValue.arrayUnion(eventRef),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Update the event with group reference
      await db.collection('events').doc(event.id).update({
        groupId: groupRef,
      });

      console.log(`✅ Event ${event.id} added to group ${groupId}`);

      return event;
    } catch (error) {
      console.error('Error adding event to group:', error);
      throw error;
    }
  }

  /**
   * ✅ NEW: Get all events in a group
   */
  async getGroupEvents(groupId) {
    try {
      const groupDoc = await this.collection.doc(groupId).get();

      if (!groupDoc.exists) {
        throw new Error('Group not found');
      }

      const groupData = groupDoc.data();
      const eventRefs = groupData.events || [];

      if (eventRefs.length === 0) {
        return [];
      }

      // Fetch all events
      const eventPromises = eventRefs.map(ref => ref.get());
      const eventDocs = await Promise.all(eventPromises);

      return eventDocs
        .filter(doc => doc.exists)
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
    } catch (error) {
      console.error('Error getting group events:', error);
      throw error;
    }
  }

  /**
   * ✅ NEW: Remove an event from a group
   */
  async removeEventFromGroup(groupId, eventId, userId) {
    try {
      const groupRef = this.collection.doc(groupId);
      const groupDoc = await groupRef.get();

      if (!groupDoc.exists) {
        throw new Error('Group not found');
      }

      const groupData = groupDoc.data();

      // Check if user is admin
      const isAdmin = groupData.admins.some(ref => ref.id === userId);
      if (!isAdmin) {
        throw new Error('Only admins can remove events from the group');
      }

      const eventRef = db.doc(`events/${eventId}`);

      // Remove event from group
      await groupRef.update({
        events: FieldValue.arrayRemove(eventRef),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Optionally: Remove group reference from event
      await db.collection('events').doc(eventId).update({
        groupId: FieldValue.delete(),
      });

      return { success: true };
    } catch (error) {
      console.error('Error removing event from group:', error);
      throw error;
    }
  }

  /**
   * ✅ NEW: Get all members of a group
   */
  async getGroupMembers(groupId) {
    try {
      const groupDoc = await this.collection.doc(groupId).get();

      if (!groupDoc.exists) {
        throw new Error('Group not found');
      }

      const groupData = groupDoc.data();
      const memberRefs = groupData.members || [];

      if (memberRefs.length === 0) {
        return [];
      }

      // Fetch all members
      const memberPromises = memberRefs.map(ref => ref.get());
      const memberDocs = await Promise.all(memberPromises);

      return memberDocs
        .filter(doc => doc.exists)
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
    } catch (error) {
      console.error('Error getting group members:', error);
      throw error;
    }
  }

  /**
   * Make a user an admin
   */
  async makeAdmin(groupId, userId, requestingUserId) {
    try {
      const groupRef = this.collection.doc(groupId);
      const groupDoc = await groupRef.get();

      if (!groupDoc.exists) {
        throw new Error('Group not found');
      }

      const groupData = groupDoc.data();

      // Check if requesting user is admin
      const isAdmin = groupData.admins.some(ref => ref.id === requestingUserId);
      if (!isAdmin) {
        throw new Error('Only admins can promote other members');
      }

      // Check if user is a member
      const isMember = groupData.members.some(ref => ref.id === userId);
      if (!isMember) {
        throw new Error('User is not a member of this group');
      }

      const userRef = db.doc(`users/${userId}`);

      // Add user to admins
      await groupRef.update({
        admins: FieldValue.arrayUnion(userRef),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return { success: true };
    } catch (error) {
      console.error('Error making user admin:', error);
      throw error;
    }
  }
}