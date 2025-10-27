import { db, Timestamp } from '../config/firebase.js';
import { logger } from '../utils/logger.js';

export class LeaderboardService {
  async updateCache() {
    try {
      logger.info('Starting leaderboard cache update...');

      // Fetch top users by different criteria (these don't need composite indexes)
      const [topPointsSnap, topPostersSnap, topSolversSnap] = await Promise.all([
        db.collection('users').orderBy('totalPoints', 'desc').limit(100).get(),
        db.collection('users').orderBy('pointsPosted', 'desc').limit(100).get(),
        db.collection('users').orderBy('pointsSolved', 'desc').limit(100).get(),
      ]);

      // Rising stars: Fetch all users and filter in-memory (NO INDEX NEEDED)
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const allUsersSnap = await db.collection('users').get();
      const risingStarsData = allUsersSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => {
          if (!user.createdAt) return false;
          const createdDate = user.createdAt.toDate();
          return createdDate >= startOfMonth;
        })
        .sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0))
        .slice(0, 100);

      // Store in cache
      const batch = db.batch();
      const timestamp = Timestamp.now();

      const cacheData = {
        topPoints: topPointsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        topPosters: topPostersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        topSolvers: topSolversSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        risingStars: risingStarsData,
      };

      for (const [key, data] of Object.entries(cacheData)) {
        batch.set(db.collection('leaderboard_cache').doc(key), {
          data,
          updatedAt: timestamp,
        });
      }

      await batch.commit();
      logger.info('Leaderboard cache updated successfully');

      return cacheData;
    } catch (error) {
      logger.error('Error updating leaderboard cache:', error);
      throw error;
    }
  }

  async getLeaderboard(type, userId) {
    try {
      const cacheDoc = await db.collection('leaderboard_cache').doc(type).get();

      if (!cacheDoc.exists) {
        // If cache doesn't exist, create it
        logger.info(`Cache for ${type} not found, creating...`);
        await this.updateCache();
        const newCacheDoc = await db.collection('leaderboard_cache').doc(type).get();
        if (!newCacheDoc.exists) {
          throw new Error('Failed to create leaderboard cache');
        }
        return this.formatLeaderboardResponse(newCacheDoc.data(), userId);
      }

      return this.formatLeaderboardResponse(cacheDoc.data(), userId);
    } catch (error) {
      logger.error('Error fetching leaderboard:', error);
      throw error;
    }
  }

  formatLeaderboardResponse(cachedData, userId) {
    const userRank = cachedData.data.findIndex(user => user.id === userId) + 1;

    return {
      leaderboard: cachedData.data.slice(0, 50),
      userRank: userRank > 0 ? userRank : null,
      updatedAt: cachedData.updatedAt,
      totalUsers: cachedData.data.length,
    };
  }
}