"""Tests of zero_ex.json_schemas"""


from zero_ex.json_schemas import _LOCAL_RESOLVER, assert_valid


NULL_ADDRESS = "0x0000000000000000000000000000000000000000"

EMPTY_ORDER = {
    "makerAddress": NULL_ADDRESS,
    "takerAddress": NULL_ADDRESS,
    "senderAddress": NULL_ADDRESS,
    "feeRecipientAddress": NULL_ADDRESS,
    "makerAssetData": NULL_ADDRESS,
    "takerAssetData": NULL_ADDRESS,
    "salt": "0",
    "makerFee": "0",
    "makerFeeAssetData": NULL_ADDRESS,
    "takerFee": "0",
    "takerFeeAssetData": NULL_ADDRESS,
    "makerAssetAmount": "0",
    "takerAssetAmount": "0",
    "expirationTimeSeconds": "0",
    "exchangeAddress": NULL_ADDRESS,
    "chainId": 50,
}


def test_assert_valid_caches_resources():
    """Test that the JSON ref resolver in `assert_valid()` caches resources

    In order to test the cache we much access the private class of
    `json_schemas` and reset the LRU cache on `_LocalRefResolver`.
    For this to happen, we need to disable errror `W0212`
    on _LOCAL_RESOLVER
    """
    _LOCAL_RESOLVER._remote_cache.cache_clear()  # pylint: disable=W0212

    assert_valid(EMPTY_ORDER, "/orderSchema")
    cache_info = (
        _LOCAL_RESOLVER._remote_cache.cache_info()  # pylint: disable=W0212
    )
    assert cache_info.currsize == 4
    assert cache_info.hits > 0
