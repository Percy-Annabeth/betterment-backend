import { db, FieldValue, Timestamp } from '../config/firebase.js';
import { TRANSACTION_TYPES } from '../config/constants.js';
import { BadgeService } from './badgeService.js';
import { logger } from '../utils/logger.js';

export class TransactionService {
  constructor() {
    this.badgeService = new BadgeService();
  }

  async createTransaction(transactionData) {
    try {
      const txRef = db.collection('transactions').doc();
      
      const transaction = {
        ...transactionData,
        status: 'pending',
        createdAt: FieldValue.serverTimestamp(),
      };

      await txRef.set(transaction);

      // Process the transaction
      await this.processTransaction(txRef.id, transaction);

      logger.info(`Transaction created: ${txRef.id} for user ${transactionData.userId}`);

      return { id: txRef.id, ...transaction };
    } catch (error) {
      logger.error('Error creating transaction:', error);
      throw error;
    }
  }

  async processTransaction(txId, transaction) {
    try {
      const { userId, points, amount, type } = transaction;
      const userRef = db.collection('users').doc(userId);

      await db.runTransaction(async (t) => {
        const userDoc = await t.get(userRef);

        if (!userDoc.exists) {
          throw new Error('User not found');
        }

        const userData = userDoc.data();
        const updates = {
          totalPoints: (userData.totalPoints || 0) + points,
          walletBalance: (userData.walletBalance || 0) + amount,
        };

        // Update specific counters
        if (type === TRANSACTION_TYPES.EVENT_POSTED) {
          updates.pointsPosted = (userData.pointsPosted || 0) + points;
        } else if (type === TRANSACTION_TYPES.EVENT_SOLVED) {
          updates.pointsSolved = (userData.pointsSolved || 0) + points;
        }

        t.update(userRef, updates);
        t.update(db.collection('transactions').doc(txId), { 
          status: 'completed',
          completedAt: FieldValue.serverTimestamp(),
        });
      });

      // Check for badge awards
      await this.badgeService.checkAndAwardBadges(userId);

      logger.info(`Transaction ${txId} processed successfully`);
    } catch (error) {
      logger.error(`Error processing transaction ${txId}:`, error);
      
      // Mark transaction as failed
      await db.collection('transactions').doc(txId).update({
        status: 'failed',
        error: error.message,
      });
      
      throw error;
    }
  }

  async getUserTransactions(userId, limit = 50) {
    try {
      const snapshot = await db.collection('transactions')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      logger.error('Error fetching user transactions:', error);
      throw error;
    }
  }
}