import { getCache, setCache } from "../config/redis.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const cacheMiddleware = (duration = 3600) => {
    return async (req, res, next) => {
        // Skip caching for non-GET requests
        if (req.method !== 'GET') {
            return next();
        }

        const key = `cache:${req.originalUrl || req.url}`;
        
        try {
            const cachedData = await getCache(key);
            
            if (cachedData) {
                return res.json(new ApiResponse(200, JSON.parse(cachedData), "Data retrieved from cache"));
            }

            // Modify res.json to cache the response before sending
            const originalJson = res.json;
            res.json = function(body) {
                if (body?.statusCode === 200) {
                    setCache(key, JSON.stringify(body.data), duration);
                }
                return originalJson.call(this, body);
            };

            next();
        } catch (error) {
            console.error('Cache Middleware Error:', error);
            next();
        }
    };
}; 