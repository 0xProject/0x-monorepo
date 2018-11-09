"""Order utilities for 0x applications.

Some methods require the caller to pass in a `Web3.HTTPProvider` object.  For
local testing one may construct such a provider pointing at an instance of
`ganache-cli <https://www.npmjs.com/package/ganache-cli>`_ which has the 0x
contracts deployed on it.  For convenience, a docker container is provided for
just this purpose.  To start it: ``docker run -d -p 8545:8545 0xorg/ganache-cli
--gasLimit 10000000 --db /snapshot --noVMErrorsOnRPCResponse -p 8545
--networkId 50 -m "concert load couple harbor equip island argue ramp clarify
fence smart topic"``.
"""

import json
from typing import Dict
from pkg_resources import resource_string

from mypy_extensions import TypedDict

from eth_utils import is_address, keccak, to_checksum_address, to_bytes
from web3 import Web3
from web3.utils import datatypes
import web3.exceptions


EXCHANGE_ABI = json.loads(
    resource_string("zero_ex.contract_artifacts", "artifacts/Exchange.json")
)["compilerOutput"]["abi"]

NETWORK_TO_EXCHANGE_ADDR: Dict[str, str] = {
    "1": "0x4f833a24e1f95d70f028921e27040ca56e09ab0b",
    "3": "0x4530c0483a1633c7a1c97d2c53721caff2caaaaf",
    "42": "0x35dd2932454449b14cee11a94d3674a936d5d7b2",
    "50": "0x48bacb9266a570d521063ef5dd96e61686dbe788",
}

NULL_ADDRESS = "0x0000000000000000000000000000000000000000"


class Order(TypedDict):  # pylint: disable=too-many-instance-attributes
    """Object representation of a 0x order."""

    maker_address: str
    taker_address: str
    fee_recipient_address: str
    sender_address: str
    maker_asset_amount: int
    taker_asset_amount: int
    maker_fee: int
    taker_fee: int
    expiration_time_seconds: int
    salt: int
    maker_asset_data: str
    taker_asset_data: str


def make_empty_order() -> Order:
    """Construct an empty order."""
    return {
        "maker_address": NULL_ADDRESS,
        "taker_address": NULL_ADDRESS,
        "sender_address": NULL_ADDRESS,
        "fee_recipient_address": NULL_ADDRESS,
        "maker_asset_data": NULL_ADDRESS,
        "taker_asset_data": NULL_ADDRESS,
        "salt": 0,
        "maker_fee": 0,
        "taker_fee": 0,
        "maker_asset_amount": 0,
        "taker_asset_amount": 0,
        "expiration_time_seconds": 0,
    }


def generate_order_hash_hex(order: Order, exchange_address: str) -> str:
    # docstring considered all one line by pylint: disable=line-too-long
    """Calculate the hash of the given order as a hexadecimal string.

    >>> generate_order_hash_hex(
    ...     {
    ...         'maker_address': "0x0000000000000000000000000000000000000000",
    ...         'taker_address': "0x0000000000000000000000000000000000000000",
    ...         'fee_recipient_address': "0x0000000000000000000000000000000000000000",
    ...         'sender_address': "0x0000000000000000000000000000000000000000",
    ...         'maker_asset_amount': 1000000000000000000,
    ...         'taker_asset_amount': 1000000000000000000,
    ...         'maker_fee': 0,
    ...         'taker_fee': 0,
    ...         'expiration_time_seconds': 12345,
    ...         'salt': 12345,
    ...         'maker_asset_data': "0000000000000000000000000000000000000000",
    ...         'taker_asset_data': "0000000000000000000000000000000000000000",
    ...     },
    ...     exchange_address="0x0000000000000000000000000000000000000000",
    ... )
    '55eaa6ec02f3224d30873577e9ddd069a288c16d6fb407210eecbc501fa76692'
    """  # noqa: E501 (line too long)
    # TODO: use JSON schema validation to validate order. pylint: disable=fixme
    eip191_header = b"\x19\x01"

    eip712_domain_separator_schema_hash = keccak(
        b"EIP712Domain(string name,string version,address verifyingContract)"
    )

    eip712_domain_struct_hash = keccak(
        eip712_domain_separator_schema_hash
        + keccak(b"0x Protocol")
        + keccak(b"2")
        + bytes(12)
        + to_bytes(hexstr=exchange_address)
    )

    eip712_order_schema_hash = keccak(
        b"Order("
        + b"address makerAddress,"
        + b"address takerAddress,"
        + b"address feeRecipientAddress,"
        + b"address senderAddress,"
        + b"uint256 makerAssetAmount,"
        + b"uint256 takerAssetAmount,"
        + b"uint256 makerFee,"
        + b"uint256 takerFee,"
        + b"uint256 expirationTimeSeconds,"
        + b"uint256 salt,"
        + b"bytes makerAssetData,"
        + b"bytes takerAssetData"
        + b")"
    )

    def pad_20_bytes_to_32(twenty_bytes: bytes):
        return bytes(12) + twenty_bytes

    def int_to_32_big_endian_bytes(i: int):
        return i.to_bytes(32, byteorder="big")

    eip712_order_struct_hash = keccak(
        eip712_order_schema_hash
        + pad_20_bytes_to_32(to_bytes(hexstr=order["maker_address"]))
        + pad_20_bytes_to_32(to_bytes(hexstr=order["taker_address"]))
        + pad_20_bytes_to_32(to_bytes(hexstr=order["fee_recipient_address"]))
        + pad_20_bytes_to_32(to_bytes(hexstr=order["sender_address"]))
        + int_to_32_big_endian_bytes(order["maker_asset_amount"])
        + int_to_32_big_endian_bytes(order["taker_asset_amount"])
        + int_to_32_big_endian_bytes(order["maker_fee"])
        + int_to_32_big_endian_bytes(order["taker_fee"])
        + int_to_32_big_endian_bytes(order["expiration_time_seconds"])
        + int_to_32_big_endian_bytes(order["salt"])
        + keccak(to_bytes(hexstr=order["maker_asset_data"]))
        + keccak(to_bytes(hexstr=order["taker_asset_data"]))
    )

    return keccak(
        eip191_header + eip712_domain_struct_hash + eip712_order_struct_hash
    ).hex()
