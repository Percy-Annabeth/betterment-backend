import { db, FieldValue } from '../config/firebase.js';
import { BADGES, POINTS_CONFIG, TRANSACTION_TYPES } from '../config/constants.js';
import { logger } from '../utils/logger.js';

export class BadgeService {
  async checkAndAwardBadges(userId) {
    try {
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      const currentBadges = userData.badges || [];
      const newBadges = [];

      // Check each badge
      for (const [key, badge] of Object.entries(BADGES)) {
        if (!currentBadges.includes(badge.name)) {
          const fieldValue = userData[badge.field] || 0;
          
          if (fieldValue >= badge.threshold) {
            newBadges.push(badge.name);
          }
        }
      }

      // Award new badges
      if (newBadges.length > 0) {
        await userRef.update({
          badges: FieldValue.arrayUnion(...newBadges),
        });

        // Create badge award transactions
        const batch = db.batch();
        for (const badgeName of newBadges) {
          const txRef = db.collection('transactions').doc();
          batch.set(txRef, {
            userId,
            amount: 0,
            points: POINTS_CONFIG.BADGE_AWARD,
            type: TRANSACTION_TYPES.BADGE_AWARDED,
            badgeName,
            status: 'completed',
            createdAt: FieldValue.serverTimestamp(),
          });
        }
        await batch.commit();

        logger.info(`Awarded badges to user ${userId}:`, newBadges);
      }

      return newBadges;
    } catch (error) {
      logger.error('Error checking badges:', error);
      throw error;
    }
  }
}