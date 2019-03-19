"""Tests of 0x.local_key_provider."""

from eth_utils import to_checksum_address
from zero_ex import local_key_http_provider, order_utils
from zero_ex.contract_addresses import NETWORK_TO_ADDRESSES, NetworkId


def test_local_key_provider__sign_order():
    """Test signing order with local_key_provider"""
    PRIVATE_KEY = "f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e0164837257d"
    WEB3_RPC_URL = 'https://kovan.infura.io/v3/e2c067d9717e492091d1f1d7a2ec55aa'

    exchange = NETWORK_TO_ADDRESSES[NetworkId.KOVAN].exchange
    order = order_utils.make_empty_order()
    order_hash = order_utils.generate_order_hash_hex(order, exchange)
    provider = local_key_http_provider(WEB3_RPC_URL, PRIVATE_KEY)
    order_utils.assert_is_provider(provider, "provider")
    signature = order_utils.sign_hash(
        provider, to_checksum_address(provider.account), order_hash)
    order_utils.assert_is_hex_string(signature, "signature")
    order_utils.is_valid_signature(
        provider, order_hash, signature, provider.account)
