import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType;

export const initializeRedis = async (): Promise<RedisClientType> => {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 1000),
      },
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('🔗 Redis Client connected');
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis Client ready');
    });

    redisClient.on('reconnecting', () => {
      console.log('🔄 Redis Client reconnecting...');
    });

    await redisClient.connect();
  }

  return redisClient;
};

export const getRedisClient = (): RedisClientType => {
  if (!redisClient) {
    throw new Error('Redis not initialized. Call initializeRedis first.');
  }
  return redisClient;
};

export const closeRedis = async (): Promise<void> => {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    console.log('🔌 Redis connection closed');
  }
};

// Cache utilities
export class CacheService {
  private static instance: CacheService;
  private redis: RedisClientType;

  private constructor(redis: RedisClientType) {
    this.redis = redis;
  }

  static getInstance(redis?: RedisClientType): CacheService {
    if (!CacheService.instance) {
      if (!redis) {
        throw new Error('Redis client must be provided for first initialization');
      }
      CacheService.instance = new CacheService(redis);
    }
    return CacheService.instance;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.redis.setEx(key, ttlSeconds, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  // Proposal-specific cache methods
  async cacheProposal(proposalId: string, proposal: any, ttlSeconds = 300): Promise<void> {
    await this.set(`proposal:${proposalId}`, proposal, ttlSeconds);
  }

  async getCachedProposal(proposalId: string): Promise<any | null> {
    return await this.get(`proposal:${proposalId}`);
  }

  async invalidateProposal(proposalId: string): Promise<void> {
    await this.del(`proposal:${proposalId}`);
  }

  // Content generation cache
  async cacheGeneratedContent(
    sectionId: string, 
    prompt: string, 
    content: string, 
    ttlSeconds = 3600
  ): Promise<void> {
    const key = this.generateContentCacheKey(sectionId, prompt);
    await this.set(key, content, ttlSeconds);
  }

  async getCachedGeneratedContent(sectionId: string, prompt: string): Promise<string | null> {
    const key = this.generateContentCacheKey(sectionId, prompt);
    return await this.get(key);
  }

  private generateContentCacheKey(sectionId: string, prompt: string): string {
    const promptHash = Buffer.from(prompt).toString('base64').slice(0, 32);
    return `content:${sectionId}:${promptHash}`;
  }

  // Collaboration cache (user presence, cursors)
  async setUserPresence(proposalId: string, userId: string, data: any, ttlSeconds = 30): Promise<void> {
    await this.set(`presence:${proposalId}:${userId}`, data, ttlSeconds);
  }

  async getUserPresence(proposalId: string, userId: string): Promise<any | null> {
    return await this.get(`presence:${proposalId}:${userId}`);
  }

  async getAllUserPresence(proposalId: string): Promise<Record<string, any>> {
    try {
      const pattern = `presence:${proposalId}:*`;
      const keys = await this.redis.keys(pattern);
      const presence: Record<string, any> = {};
      
      for (const key of keys) {
        const userId = key.split(':')[2];
        const data = await this.get(key);
        if (data) {
          presence[userId] = data;
        }
      }
      
      return presence;
    } catch (error) {
      console.error(`Error getting all user presence for proposal ${proposalId}:`, error);
      return {};
    }
  }

  async removeUserPresence(proposalId: string, userId: string): Promise<void> {
    await this.del(`presence:${proposalId}:${userId}`);
  }
}