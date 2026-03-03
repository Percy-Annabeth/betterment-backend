

// src/services/groupService.js
import { db, FieldValue } from '../config/firebase.js';
import { logger } from '../utils/logger.js';

export class GroupService {
  async createGroup(groupData, userId) {
    try {
      const groupRef = db.collection('groups').doc();
      
      const group = {
        name: groupData.name,
        description: groupData.description,
        groupTitle: groupData.groupTitle || '',
        groupImage: groupData.groupImage || null,
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
        groupRules: groupData.groupRules || [],
      };

      await groupRef.set(group);
      logger.info(`Group created: ${groupRef.id} by user ${userId}`);

      return { id: groupRef.id, ...group };
    } catch (error) {
      logger.error('Error creating group:', error);
      throw error;
    }
  }

  async updateGroup(groupId, updateData, userId) {
    try {
      const groupRef = db.collection('groups').doc(groupId);
      const groupDoc = await groupRef.get();

      if (!groupDoc.exists) {
        throw new Error('Group not found');
      }

      const groupData = groupDoc.data();
      
      // Check if user is admin
      const isAdmin = groupData.admins.some(ref => ref.id === userId);
      if (!isAdmin) {
        throw new Error('Unauthorized: Only admins can update group');
      }

      const allowedUpdates = {
        name: updateData.name,
        description: updateData.description,
        groupTitle: updateData.groupTitle,
        groupImage: updateData.groupImage,
        tags: updateData.tags,
        groupRules: updateData.groupRules,
      };

      // Remove undefined values
      Object.keys(allowedUpdates).forEach(key => 
        allowedUpdates[key] === undefined && delete allowedUpdates[key]
      );

      await groupRef.update({
        ...allowedUpdates,
        updatedAt: FieldValue.serverTimestamp(),
      });

      logger.info(`Group ${groupId} updated by user ${userId}`);

      return { id: groupId, ...groupData, ...allowedUpdates };
    } catch (error) {
      logger.error('Error updating group:', error);
      throw error;
    }
  }

  async joinGroup(groupId, userId) {
    try {
      const groupRef = db.collection('groups').doc(groupId);
      const userRef = db.doc(`users/${userId}`);

      // Check if already a member
      const groupDoc = await groupRef.get();
      if (!groupDoc.exists) {
        throw new Error('Group not found');
      }

      const groupData = groupDoc.data();
      const isMember = groupData.members.some(ref => ref.id === userId);
      
      if (isMember) {
        throw new Error('User is already a member');
      }

      await groupRef.update({
        members: FieldValue.arrayUnion(userRef),
      });

      logger.info(`User ${userId} joined group ${groupId}`);

      return { success: true, message: 'Successfully joined group' };
    } catch (error) {
      logger.error('Error joining group:', error);
      throw error;
    }
  }

  // ✅ UPDATED: Enhanced leave group with transfer option
  async leaveGroup(groupId, userId, options = {}) {
    try {
      const groupRef = db.collection('groups').doc(groupId);
      const userRef = db.doc(`users/${userId}`);
      
      const groupDoc = await groupRef.get();
      if (!groupDoc.exists) {
        throw new Error('Group not found');
      }

      const groupData = groupDoc.data();
      const isCreator = groupData.createdBy.id === userId;
      const isAdmin = groupData.admins.some(ref => ref.id === userId);

      // Option 1: Creator leaving and transferring ownership
      if (isCreator && options.transferTo) {
        const newCreatorRef = db.doc(`users/${options.transferTo}`);
        
        // Verify new creator is a member
        const isNewCreatorMember = groupData.members.some(ref => ref.id === options.transferTo);
        if (!isNewCreatorMember) {
          throw new Error('New creator must be a group member');
        }

        // Transfer ownership
        await groupRef.update({
          createdBy: newCreatorRef,
          admins: FieldValue.arrayUnion(newCreatorRef), // Make sure new creator is admin
          members: FieldValue.arrayRemove(userRef), // Remove current user from members
          updatedAt: FieldValue.serverTimestamp(),
        });

        // If old creator was admin, remove them
        if (isAdmin) {
          await groupRef.update({
            admins: FieldValue.arrayRemove(userRef),
          });
        }

        logger.info(`User ${userId} left group ${groupId} and transferred ownership to ${options.transferTo}`);

        return { 
          success: true, 
          message: 'Successfully left group and transferred ownership',
          transferred: true 
        };
      }

      // Option 2: Creator leaving without transferring (stays as creator but not member)
      if (isCreator && !options.transferTo) {
        await groupRef.update({
          members: FieldValue.arrayRemove(userRef),
          // Keep createdBy as is - creator remains but not a member
          admins: FieldValue.arrayRemove(userRef), // Remove from admins
          updatedAt: FieldValue.serverTimestamp(),
        });

        logger.info(`Creator ${userId} left group ${groupId} without transferring ownership`);

        return { 
          success: true, 
          message: 'Successfully left group. You remain as creator.',
          creatorLeft: true 
        };
      }

      // Option 3: Regular member or admin leaving
      await groupRef.update({
        members: FieldValue.arrayRemove(userRef),
        admins: FieldValue.arrayRemove(userRef), // Also remove from admins if applicable
        updatedAt: FieldValue.serverTimestamp(),
      });

      logger.info(`User ${userId} left group ${groupId}`);

      return { success: true, message: 'Successfully left group' };
    } catch (error) {
      logger.error('Error leaving group:', error);
      throw error;
    }
  }

  // ✅ NEW: Check user's role in group
  async getUserRoleInGroup(groupId, userId) {
    try {
      const groupDoc = await db.collection('groups').doc(groupId).get();

      if (!groupDoc.exists) {
        throw new Error('Group not found');
      }

      const groupData = groupDoc.data();
      const isCreator = groupData.createdBy.id === userId;
      const isAdmin = groupData.admins.some(ref => ref.id === userId);
      const isMember = groupData.members.some(ref => ref.id === userId);

      return {
        isCreator,
        isAdmin,
        isMember,
        canTransfer: isCreator && groupData.members.length > 1, // Can only transfer if there are other members
      };
    } catch (error) {
      logger.error('Error checking user role:', error);
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

  async getAllGroups(filters = {}) {
    try {
      let query = db.collection('groups').orderBy('createdAt', 'desc');

      if (filters.tag) {
        query = query.where('tags', 'array-contains', filters.tag);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const snapshot = await query.get();
      const groups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Sort by filters if specified
      if (filters.sort === 'members') {
        groups.sort((a, b) => (b.members?.length || 0) - (a.members?.length || 0));
      } else if (filters.sort === 'events') {
        groups.sort((a, b) => (b.events?.length || 0) - (a.events?.length || 0));
      }

      return groups;
    } catch (error) {
      logger.error('Error fetching groups:', error);
      throw error;
    }
  }

  // async addEventToGroup(groupId, eventId, userId) {
  //   try {
  //     const groupRef = db.collection('groups').doc(groupId);
  //     const eventRef = db.doc(`events/${eventId}`);
      
  //     const groupDoc = await groupRef.get();
  //     if (!groupDoc.exists) {
  //       throw new Error('Group not found');
  //     }

  //     const groupData = groupDoc.data();
  //     const isMember = groupData.members.some(ref => ref.id === userId);
      
  //     if (!isMember) {
  //       throw new Error('Only group members can add events');
  //     }

  //     await groupRef.update({
  //       events: FieldValue.arrayUnion(eventRef),
  //       postsCount: FieldValue.increment(1),
  //     });

  //     logger.info(`Event ${eventId} added to group ${groupId} by user ${userId}`);

  //     return { success: true };
  //   } catch (error) {
  //     logger.error('Error adding event to group:', error);
  //     throw error;
  //   }
  // }

  async uploadGroupImage(groupId, imageUrl, userId) {
    try {
      const groupRef = db.collection('groups').doc(groupId);
      const groupDoc = await groupRef.get();

      if (!groupDoc.exists) {
        throw new Error('Group not found');
      }

      const groupData = groupDoc.data();
      const isAdmin = groupData.admins.some(ref => ref.id === userId);
      
      if (!isAdmin) {
        throw new Error('Unauthorized: Only admins can update group image');
      }

      await groupRef.update({
        groupImage: imageUrl,
        updatedAt: FieldValue.serverTimestamp(),
      });

      logger.info(`Group ${groupId} image updated by user ${userId}`);

      return { success: true, imageUrl };
    } catch (error) {
      logger.error('Error uploading group image:', error);
      throw error;
    }
  }
}