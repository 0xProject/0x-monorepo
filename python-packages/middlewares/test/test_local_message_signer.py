"""Tests of 0x.middlewares.local_message_signer."""

from eth_utils import to_checksum_address
from web3 import Web3, HTTPProvider

from zero_ex.contract_addresses import chain_to_addresses, ChainId
from zero_ex.middlewares.local_message_signer import (
    construct_local_message_signer,
)
from zero_ex.order_utils import generate_order_hash_hex, sign_hash


def test_local_message_signer__sign_order():
    """Test signing order with the local_message_signer middleware"""
    expected_signature = (
        "0x1c8bdfbb3ce3ed0f38c5a358a7f49ad5f21ea9857224c2fe98c458f2fa25551d4"
        "d6db0157d9dfe9f9fadb8dedabb7786352843357f4ec8d0fbcbeeb619b1091f5803"
    )
    address = "0x5409ED021D9299bf6814279A6A1411A7e866A631"
    exchange = chain_to_addresses(ChainId.GANACHE).exchange
    private_key = (
        "f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e0164837257d"
    )
    ganache = HTTPProvider("http://127.0.0.1:8545")
    web3_instance = Web3(ganache)
    web3_instance.middleware_onion.add(
        construct_local_message_signer(private_key)
    )
    order = {
        "makerAddress": "0x0000000000000000000000000000000000000000",
        "takerAddress": "0x0000000000000000000000000000000000000000",
        "senderAddress": "0x0000000000000000000000000000000000000000",
        "feeRecipientAddress": "0x0000000000000000000000000000000000000000",
        "makerAssetData": (b"\x00") * 20,
        "makerFeeAssetData": (b"\x00") * 20,
        "takerAssetData": (b"\x00") * 20,
        "takerFeeAssetData": (b"\x00") * 20,
        "salt": 0,
        "makerFee": 0,
        "takerFee": 0,
        "makerAssetAmount": 0,
        "takerAssetAmount": 0,
        "expirationTimeSeconds": 0,
    }
    assert (
        sign_hash(
            web3_instance,
            to_checksum_address(address),
            generate_order_hash_hex(order, exchange, chain_id=1337),
        )
        == expected_signature
    )
