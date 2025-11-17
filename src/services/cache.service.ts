/**
 * Simple In-Memory Cache Service
 *
 * Provides a lightweight caching layer for frequently accessed data.
 * Uses LRU (Least Recently Used) eviction strategy.
 * For production, consider using Redis or Memcached.
 */

import { logger } from '../helpers/Logger';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
}

export class CacheService {
  private static instance: CacheService;
  private cache: Map<string, CacheEntry<unknown>>;
  private maxSize: number;
  private defaultTTL: number; // in milliseconds
  private cleanupInterval: NodeJS.Timeout | null;

  private constructor(maxSize: number = 1000, defaultTTL: number = 5 * 60 * 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    this.cleanupInterval = null;
    this.startCleanupTask();
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Set a value in cache
   */
  public set<T>(key: string, value: T, ttl?: number): void {
    try {
      // Evict LRU items if cache is full
      if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
        this.evictLRU();
      }

      const expiresAt = Date.now() + (ttl || this.defaultTTL);
      this.cache.set(key, {
        value,
        expiresAt,
        accessCount: 0,
        lastAccessed: Date.now(),
      });

      logger.debug('CacheService: Value set', { key, ttl: ttl || this.defaultTTL });
    } catch (error) {
      logger.error('CacheService: Error setting value', { error, key });
    }
  }

  /**
   * Get a value from cache
   */
  public get<T>(key: string): T | null {
    try {
      const entry = this.cache.get(key);

      if (!entry) {
        logger.debug('CacheService: Cache miss', { key });
        return null;
      }

      // Check if expired
      if (Date.now() > entry.expiresAt) {
        logger.debug('CacheService: Cache expired', { key });
        this.cache.delete(key);
        return null;
      }

      // Update access statistics
      entry.accessCount++;
      entry.lastAccessed = Date.now();

      logger.debug('CacheService: Cache hit', { key, accessCount: entry.accessCount });
      return entry.value as T;
    } catch (error) {
      logger.error('CacheService: Error getting value', { error, key });
      return null;
    }
  }

  /**
   * Delete a value from cache
   */
  public delete(key: string): boolean {
    const result = this.cache.delete(key);
    if (result) {
      logger.debug('CacheService: Value deleted', { key });
    }
    return result;
  }

  /**
   * Delete all cache entries matching a pattern
   */
  public deletePattern(pattern: string): number {
    let count = 0;
    const regex = new RegExp(pattern);

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    if (count > 0) {
      logger.info('CacheService: Deleted entries by pattern', { pattern, count });
    }

    return count;
  }

  /**
   * Clear all cache entries
   */
  public clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    logger.info('CacheService: Cache cleared', { entriesRemoved: size });
  }

  /**
   * Get cache statistics
   */
  public getStats(): {
    size: number;
    maxSize: number;
    hitRate?: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }

  /**
   * Check if a key exists in cache
   */
  public has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Evict least recently used item
   */
  private evictLRU(): void {
    let lruKey: string | null = null;
    let lruTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
      logger.debug('CacheService: Evicted LRU entry', { key: lruKey });
    }
  }

  /**
   * Clean up expired entries periodically
   */
  private startCleanupTask(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      let removed = 0;

      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expiresAt) {
          this.cache.delete(key);
          removed++;
        }
      }

      if (removed > 0) {
        logger.debug('CacheService: Cleanup task completed', { removed });
      }
    }, 60000); // Run every minute
  }

  /**
   * Stop cleanup task (for graceful shutdown)
   */
  public stopCleanupTask(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      logger.info('CacheService: Cleanup task stopped');
    }
  }

  /**
   * Generate cache key for expenses list
   */
  public static generateExpensesKey(userId: number, options?: Record<string, unknown>): string {
    const params = new URLSearchParams();
    if (options?.category) params.append('category', String(options.category));
    if (options?.fromDate) params.append('fromDate', String(options.fromDate));
    if (options?.toDate) params.append('toDate', String(options.toDate));
    if (options?.limit) params.append('limit', String(options.limit));
    if (options?.offset) params.append('offset', String(options.offset));

    return `expenses:user:${userId}:${params.toString()}`;
  }

  /**
   * Generate cache key for expense by ID
   */
  public static generateExpenseKey(id: number): string {
    return `expense:${id}`;
  }

  /**
   * Generate cache key for category stats
   */
  public static generateCategoryStatsKey(
    userId: number,
    fromDate?: string,
    toDate?: string
  ): string {
    return `stats:category:user:${userId}:${fromDate || ''}:${toDate || ''}`;
  }

  /**
   * Invalidate user-related caches
   */
  public static invalidateUserCache(cacheService: CacheService, userId: number): void {
    cacheService.deletePattern(`expenses:user:${userId}`);
    cacheService.deletePattern(`stats:category:user:${userId}`);
    logger.info('CacheService: Invalidated user cache', { userId });
  }
}

// Export singleton instance
export const cacheService = CacheService.getInstance();
