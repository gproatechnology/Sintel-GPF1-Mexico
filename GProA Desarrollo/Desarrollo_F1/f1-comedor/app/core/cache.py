"""Cache module for frequently accessed data

Supports both in-memory cache (local dev) and Redis (production)
"""
import os
import time
import json
import logging
from typing import Any, Dict, Optional, Callable
from functools import wraps

logger = logging.getLogger(__name__)

# Try to import redis, fallback to in-memory if not available
try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False


class Cache:
    """Cache with Redis backend and in-memory fallback"""
    
    def __init__(self):
        self._memory_cache: Dict[str, tuple[Any, float]] = {}
        self._redis = None
        self._use_redis = False
        
        # Try to connect to Redis if URL is provided
        redis_url = os.getenv("REDIS_URL")
        if REDIS_AVAILABLE and redis_url:
            try:
                self._redis = redis.from_url(redis_url, decode_responses=True)
                self._redis.ping()
                self._use_redis = True
                logger.info("Redis cache initialized")
            except Exception as e:
                logger.warning(f"Redis connection failed, using in-memory cache: {e}")
                self._use_redis = False
        else:
            logger.info("Using in-memory cache")
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        if self._use_redis and self._redis:
            try:
                value = self._redis.get(key)
                if value:
                    return json.loads(value)
            except Exception as e:
                logger.error(f"Redis get error: {e}")
        
        # Fallback to memory cache
        if key in self._memory_cache:
            value, expiry = self._memory_cache[key]
            if time.time() < expiry:
                return value
            else:
                del self._memory_cache[key]
        return None
    
    def set(self, key: str, value: Any, ttl: int = 60):
        """Set value in cache with TTL in seconds"""
        if self._use_redis and self._redis:
            try:
                self._redis.setex(key, ttl, json.dumps(value))
                return
            except Exception as e:
                logger.error(f"Redis set error: {e}")
        
        # Fallback to memory cache
        expiry = time.time() + ttl
        self._memory_cache[key] = (value, expiry)
    
    def delete(self, key: str):
        """Delete value from cache"""
        if self._use_redis and self._redis:
            try:
                self._redis.delete(key)
            except Exception as e:
                logger.error(f"Redis delete error: {e}")
        
        if key in self._memory_cache:
            del self._memory_cache[key]
    
    def clear(self):
        """Clear all cache"""
        if self._use_redis and self._redis:
            try:
                self._redis.flushdb()
            except Exception as e:
                logger.error(f"Redis clear error: {e}")
        
        self._memory_cache.clear()
    
    def invalidate_pattern(self, pattern: str):
        """Invalidate keys matching pattern"""
        if self._use_redis and self._redis:
            try:
                keys = self._redis.keys(pattern)
                if keys:
                    self._redis.delete(*keys)
            except Exception as e:
                logger.error(f"Redis pattern delete error: {e}")
        
        # Also clear from memory
        keys_to_delete = [k for k in self._memory_cache.keys() if pattern in k]
        for key in keys_to_delete:
            del self._memory_cache[key]


# Global cache instance
cache = Cache()


def cached(ttl: int = 60, key_builder: Optional[Callable] = None):
    """Decorator to cache function results"""
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Build cache key
            if key_builder:
                cache_key = key_builder(*args, **kwargs)
            else:
                cache_key = f"{func.__module__}.{func.__name__}:{str(args)}:{str(kwargs)}"
            
            # Try to get from cache
            cached_value = cache.get(cache_key)
            if cached_value is not None:
                return cached_value
            
            # Call function and cache result
            result = func(*args, **kwargs)
            cache.set(cache_key, result, ttl)
            return result
        return wrapper
    return decorator


def invalidate_cache(pattern: str = None):
    """Invalidate cache entries matching pattern or all if pattern is None"""
    if pattern is None:
        cache.clear()
    else:
        cache.invalidate_pattern(pattern)
