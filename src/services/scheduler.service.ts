import cron from 'node-cron';
import prisma from '../db/prisma';
import { logger } from '../helpers/Logger';

export class SchedulerService {
  static initialize(): void {
    logger.info('Scheduler service: Initializing scheduled jobs');

    // Delete expired reset codes once a week (every Sunday at 2:00 AM)
    cron.schedule('0 2 * * 0', async () => {
      try {
        logger.info('Scheduler service: Starting cleanup of expired reset codes');

        const result = await prisma.resetCode.deleteMany({
          where: {
            expiresAt: {
              lt: new Date(), // Less than current time (expired)
            },
          },
        });

        logger.info('Scheduler service: Expired reset codes cleanup completed', {
          deletedCount: result.count,
        });
      } catch (error) {
        logger.error('Scheduler service: Error cleaning up expired reset codes', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // Delete expired refresh tokens once a week (every Sunday at 3:00 AM)
    cron.schedule('0 3 * * 0', async () => {
      try {
        logger.info('Scheduler service: Starting cleanup of expired refresh tokens');

        const result = await prisma.refreshToken.deleteMany({
          where: {
            expiresAt: {
              lt: new Date(), // Less than current time (expired)
            },
          },
        });

        logger.info('Scheduler service: Expired refresh tokens cleanup completed', {
          deletedCount: result.count,
        });
      } catch (error) {
        logger.error('Scheduler service: Error cleaning up expired refresh tokens', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    logger.info('Scheduler service: All scheduled jobs initialized successfully');
  }

  static async cleanupExpiredResetCodes(): Promise<number> {
    try {
      logger.info('Scheduler service: Manual cleanup of expired reset codes triggered');

      const result = await prisma.resetCode.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(), // Less than current time (expired)
          },
        },
      });

      logger.info('Scheduler service: Manual cleanup completed', {
        deletedCount: result.count,
      });

      return result.count;
    } catch (error) {
      logger.error('Scheduler service: Error in manual cleanup of expired reset codes', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  static async cleanupExpiredRefreshTokens(): Promise<number> {
    try {
      logger.info('Scheduler service: Manual cleanup of expired refresh tokens triggered');

      const result = await prisma.refreshToken.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(), // Less than current time (expired)
          },
        },
      });

      logger.info('Scheduler service: Manual refresh tokens cleanup completed', {
        deletedCount: result.count,
      });

      return result.count;
    } catch (error) {
      logger.error('Scheduler service: Error in manual cleanup of expired refresh tokens', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}
