import { CacheService } from '../../src/services/cache.service';

describe('CacheService', () => {
  let cache: CacheService;

  beforeEach(() => {
    cache = CacheService.getInstance();
    cache.clear();
  });

  afterAll(() => {
    cache.stopCleanupTask();
  });

  describe('Basic Operations', () => {
    it('should set and get a value', () => {
      cache.set('test-key', 'test-value');
      const value = cache.get('test-key');
      expect(value).toBe('test-value');
    });

    it('should return null for non-existent key', () => {
      const value = cache.get('non-existent');
      expect(value).toBeNull();
    });

    it('should delete a value', () => {
      cache.set('test-key', 'test-value');
      const deleted = cache.delete('test-key');
      expect(deleted).toBe(true);
      expect(cache.get('test-key')).toBeNull();
    });

    it('should check if key exists', () => {
      cache.set('test-key', 'test-value');
      expect(cache.has('test-key')).toBe(true);
      expect(cache.has('non-existent')).toBe(false);
    });

    it('should clear all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should expire entries after TTL', async () => {
      cache.set('test-key', 'test-value', 100); // 100ms TTL
      expect(cache.get('test-key')).toBe('test-value');

      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(cache.get('test-key')).toBeNull();
    });

    it('should not return expired entries', async () => {
      cache.set('test-key', 'test-value', 50);
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(cache.has('test-key')).toBe(false);
      expect(cache.get('test-key')).toBeNull();
    });
  });

  describe('Pattern Deletion', () => {
    it('should delete entries matching pattern', () => {
      cache.set('user:1:data', 'data1');
      cache.set('user:2:data', 'data2');
      cache.set('product:1:data', 'product1');

      const count = cache.deletePattern('user:.*');
      expect(count).toBe(2);
      expect(cache.get('user:1:data')).toBeNull();
      expect(cache.get('user:2:data')).toBeNull();
      expect(cache.get('product:1:data')).toBe('product1');
    });
  });

  describe('Statistics', () => {
    it('should return cache statistics', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      const stats = cache.getStats();
      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBeGreaterThan(0);
    });
  });

  describe('Key Generation', () => {
    it('should generate expenses list key', () => {
      const key = CacheService.generateExpensesKey(123, {
        category: 'Food',
        limit: 10,
      });
      expect(key).toContain('expenses:user:123');
      expect(key).toContain('category=Food');
      expect(key).toContain('limit=10');
    });

    it('should generate expense by ID key', () => {
      const key = CacheService.generateExpenseKey(456);
      expect(key).toBe('expense:456');
    });

    it('should generate category stats key', () => {
      const key = CacheService.generateCategoryStatsKey(789, '2024-01-01', '2024-12-31');
      expect(key).toBe('stats:category:user:789:2024-01-01:2024-12-31');
    });
  });

  describe('User Cache Invalidation', () => {
    it('should invalidate all user-related caches', () => {
      cache.set('expenses:user:123:category=Food', []);
      cache.set('expenses:user:123:category=Transport', []);
      cache.set('stats:category:user:123:::', {});
      cache.set('expense:456', {});

      CacheService.invalidateUserCache(cache, 123);

      expect(cache.get('expenses:user:123:category=Food')).toBeNull();
      expect(cache.get('expenses:user:123:category=Transport')).toBeNull();
      expect(cache.get('stats:category:user:123:::')).toBeNull();
      expect(cache.get('expense:456')).not.toBeNull(); // Should not be affected
    });
  });

  describe('Complex Data Types', () => {
    it('should handle objects', () => {
      const obj = { id: 1, name: 'Test', data: [1, 2, 3] };
      cache.set('object-key', obj);
      const retrieved = cache.get('object-key');
      expect(retrieved).toEqual(obj);
    });

    it('should handle arrays', () => {
      const arr = [1, 2, 3, 4, 5];
      cache.set('array-key', arr);
      const retrieved = cache.get('array-key');
      expect(retrieved).toEqual(arr);
    });
  });
});
