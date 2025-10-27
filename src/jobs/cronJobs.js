import cron from 'node-cron';
import { LeaderboardService } from '../services/leaderboardService.js';
import { logger } from '../utils/logger.js';

const leaderboardService = new LeaderboardService();

// Update leaderboard cache every hour
export const startCronJobs = () => {
  // Cron format: minute hour day month weekday
  // '0 * * * *' = Every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    try {
      logger.info('Running scheduled leaderboard update...');
      await leaderboardService.updateCache();
      logger.info('Scheduled leaderboard update completed');
    } catch (error) {
      logger.error('Error in scheduled leaderboard update:', error);
    }
  });

  logger.info('Cron jobs started');
};