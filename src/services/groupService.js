import { db, FieldValue } from '../config/firebase.js';
import { logger } from '../utils/logger.js';

export class GroupService {
  async createGroup(groupData, userId) {
    try {
      const groupRef = db.collection('groups').doc();
      
      const group = {
        name: groupData.name,
        description: groupData.description,
        createdBy: db.doc(`users/${userId}`),
        createdAt: FieldValue.serverTimestamp(),
        admins: [db.doc(`users/${userId}`)],
        members: [db.doc(`users/${userId}`)],
        providerMembers: [],
        events: [],
        services: [],
        tags: groupData.tags || [],
        postsCount: 0,
        solvedCount: 0,
      };

      await groupRef.set(group);
      logger.info(`Group created: ${groupRef.id} by user ${userId}`);

      return { id: groupRef.id, ...group };
    } catch (error) {
      logger.error('Error creating group:', error);
      throw error;
    }
  }

  async joinGroup(groupId, userId) {
    try {
      const groupRef = db.collection('groups').doc(groupId);
      const userRef = db.doc(`users/${userId}`);

      await groupRef.update({
        members: FieldValue.arrayUnion(userRef),
      });

      logger.info(`User ${userId} joined group ${groupId}`);

      return { success: true };
    } catch (error) {
      logger.error('Error joining group:', error);
      throw error;
    }
  }

  async leaveGroup(groupId, userId) {
    try {
      const groupRef = db.collection('groups').doc(groupId);
      const userRef = db.doc(`users/${userId}`);

      await groupRef.update({
        members: FieldValue.arrayRemove(userRef),
      });

      logger.info(`User ${userId} left group ${groupId}`);

      return { success: true };
    } catch (error) {
      logger.error('Error leaving group:', error);
      throw error;
    }
  }

  async getGroupById(groupId) {
    try {
      const groupDoc = await db.collection('groups').doc(groupId).get();

      if (!groupDoc.exists) {
        throw new Error('Group not found');
      }

      return { id: groupDoc.id, ...groupDoc.data() };
    } catch (error) {
      logger.error('Error fetching group:', error);
      throw error;
    }
  }
}