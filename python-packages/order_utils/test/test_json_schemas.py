"""Tests of zero_ex.json_schemas"""


from zero_ex.order_utils import make_empty_order
from zero_ex.json_schemas import _LOCAL_RESOLVER, assert_valid


def test_assert_valid_caches_resources():
    """Test that the JSON ref resolver in `assert_valid()` caches resources

    In order to test the cache we much access the private class of
    `json_schemas` and reset the LRU cache on `_LocalRefResolver`.
    For this to happen, we need to disable errror `W0212`
    on _LOCAL_RESOLVER
    """
    _LOCAL_RESOLVER._remote_cache.cache_clear()  # pylint: disable=W0212

    assert_valid(make_empty_order(), "/orderSchema")
    cache_info = (
        _LOCAL_RESOLVER._remote_cache.cache_info()  # pylint: disable=W0212
    )
    assert cache_info.currsize == 4
    assert cache_info.hits == 10
