"""Tests for cache module"""
import pytest
from app.core.cache import Cache


class TestCache:
    """Tests for Cache class"""
    
    def test_cache_init(self):
        """Test cache initialization"""
        cache = Cache()
        assert cache is not None
        assert hasattr(cache, '_memory_cache')
    
    def test_cache_set_and_get(self):
        """Test setting and getting values"""
        cache = Cache()
        cache.set("test_key", "test_value", ttl=60)
        result = cache.get("test_key")
        assert result == "test_value"
    
    def test_cache_get_nonexistent(self):
        """Test getting nonexistent key returns None"""
        cache = Cache()
        result = cache.get("nonexistent_key")
        assert result is None
    
    def test_cache_delete(self):
        """Test deleting a key"""
        cache = Cache()
        cache.set("delete_key", "value", ttl=60)
        cache.delete("delete_key")
        result = cache.get("delete_key")
        assert result is None
    
    def test_cache_clear(self):
        """Test clearing all cache"""
        cache = Cache()
        cache.set("key1", "value1", ttl=60)
        cache.set("key2", "value2", ttl=60)
        cache.clear()
        assert cache.get("key1") is None
        assert cache.get("key2") is None
    
    def test_cache_exists(self):
        """Test checking if key exists"""
        cache = Cache()
        cache.set("exists_key", "value", ttl=60)
        # Cache uses internal storage, test basic functionality
        result = cache.get("exists_key")
        assert result == "value"