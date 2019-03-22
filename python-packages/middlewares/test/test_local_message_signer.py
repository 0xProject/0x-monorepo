"""Tests of 0x.middlewares.local_message_signer."""

from eth_utils import to_checksum_address
from web3 import Web3
from zero_ex.contract_addresses import NETWORK_TO_ADDRESSES, NetworkId
from zero_ex.middlewares.local_message_signer import (
    construct_local_message_signer,
)
from zero_ex.order_utils import (
    generate_order_hash_hex,
    is_valid_signature,
    make_empty_order,
    sign_hash,
)


def test_local_message_signer__sign_order():
    """Test signing order with the local_message_signer middleware"""
    expected_signature = (
        "0x1b82b9f8ba6cc687077f49ce8b2d375037d44ce4004eac01636676c6d9317b753"
        "f1235764ba702a9c93fc1c2dd06aeb467af6ccc284f37d61e18d66d2e4ad49c5d03"
    )
    address = "0x5409ED021D9299bf6814279A6A1411A7e866A631"
    exchange = NETWORK_TO_ADDRESSES[NetworkId.KOVAN].exchange
    private_key = (
        "f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e0164837257d"
    )
    web3_rpc_url = "http://127.0.0.1:8545"
    web3_instance = Web3.HTTPProvider(web3_rpc_url)
    web3_instance.middlewares.add(construct_local_message_signer(private_key))
    order = make_empty_order()
    order_hash = generate_order_hash_hex(order, exchange)
    signature = sign_hash(
        web3_instance, to_checksum_address(address), order_hash
    )
    assert signature == expected_signature
    is_valid = is_valid_signature(
        web3_instance, order_hash, signature, address
    )[0]
    assert is_valid is True
