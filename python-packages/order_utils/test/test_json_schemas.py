"""Tests of zero_ex.json_schemas"""


from zero_ex.order_utils import make_empty_order
from zero_ex.json_schemas import LOCAL_RESOLVER, assert_valid


def test_assert_valid_caches_resources():
    """Test that the JSON ref resolver in `assert_valid()` caches resources"""
    LOCAL_RESOLVER._remote_cache.cache_clear()

    assert_valid(make_empty_order(), "/orderSchema")
    cache_info = LOCAL_RESOLVER._remote_cache.cache_info()
    assert cache_info.currsize == 4
    assert cache_info.hits == 10
