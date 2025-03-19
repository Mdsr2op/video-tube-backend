import { createClient } from 'redis';

const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => {
    console.log('Redis Client Error', err);
});

redisClient.on('connect', () => {
    console.log('Redis Client Connected');
});

await redisClient.connect();

// Helper functions for caching
export const setCache = async (key, value, expiry = 3600) => {
    try {
        await redisClient.setEx(key, expiry, JSON.stringify(value));
    } catch (error) {
        console.error('Redis Set Error:', error);
    }
};

export const getCache = async (key) => {
    try {
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Redis Get Error:', error);
        return null;
    }
};

export const deleteCache = async (key) => {
    try {
        await redisClient.del(key);
    } catch (error) {
        console.error('Redis Delete Error:', error);
    }
};

export const clearCache = async () => {
    try {
        await redisClient.flushAll();
    } catch (error) {
        console.error('Redis Clear Error:', error);
    }
};

export default redisClient; 