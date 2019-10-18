"""Utilities to convert between JSON and Python-native objects."""

from copy import copy
from typing import cast, Dict

from eth_utils import remove_0x_prefix

from zero_ex.json_schemas import assert_valid
from zero_ex.contract_wrappers.exchange.types import Order


def order_to_jsdict(
    order: Order,
    exchange_address="0x0000000000000000000000000000000000000000",
    signature: str = None,
) -> dict:
    """Convert a Web3-compatible order struct to a JSON-schema-compatible dict.

    More specifically, do explicit decoding for the `bytes`:code: fields, and
    convert numerics to strings.

    >>> import pprint
    >>> pprint.pprint(order_to_jsdict(
    ...     {
    ...         'makerAddress': "0x0000000000000000000000000000000000000000",
    ...         'takerAddress': "0x0000000000000000000000000000000000000000",
    ...         'feeRecipientAddress':
    ...             "0x0000000000000000000000000000000000000000",
    ...         'senderAddress': "0x0000000000000000000000000000000000000000",
    ...         'makerAssetAmount': 1,
    ...         'takerAssetAmount': 1,
    ...         'makerFee': 0,
    ...         'takerFee': 0,
    ...         'expirationTimeSeconds': 1,
    ...         'salt': 1,
    ...         'makerAssetData': (0).to_bytes(1, byteorder='big') * 20,
    ...         'takerAssetData': (0).to_bytes(1, byteorder='big') * 20,
    ...     },
    ... ))
    {'exchangeAddress': '0x0000000000000000000000000000000000000000',
     'expirationTimeSeconds': '1',
     'feeRecipientAddress': '0x0000000000000000000000000000000000000000',
     'makerAddress': '0x0000000000000000000000000000000000000000',
     'makerAssetAmount': '1',
     'makerAssetData': '0x0000000000000000000000000000000000000000',
     'makerFee': '0',
     'salt': '1',
     'senderAddress': '0x0000000000000000000000000000000000000000',
     'takerAddress': '0x0000000000000000000000000000000000000000',
     'takerAssetAmount': '1',
     'takerAssetData': '0x0000000000000000000000000000000000000000',
     'takerFee': '0'}
    """
    jsdict = cast(Dict, copy(order))

    # encode bytes fields
    jsdict["makerAssetData"] = "0x" + order["makerAssetData"].hex()
    jsdict["takerAssetData"] = "0x" + order["takerAssetData"].hex()

    jsdict["exchangeAddress"] = exchange_address

    jsdict["expirationTimeSeconds"] = str(order["expirationTimeSeconds"])

    jsdict["makerAssetAmount"] = str(order["makerAssetAmount"])
    jsdict["takerAssetAmount"] = str(order["takerAssetAmount"])

    jsdict["makerFee"] = str(order["makerFee"])
    jsdict["takerFee"] = str(order["takerFee"])

    jsdict["salt"] = str(order["salt"])

    if signature is not None:
        jsdict["signature"] = signature

    assert_valid(jsdict, "/orderSchema")

    return jsdict


def jsdict_to_order(jsdict: dict) -> Order:
    r"""Convert a JSON-schema-compatible dict order to a Web3-compatible struct.

    More specifically, do explicit encoding of the `bytes`:code: fields, and
    parse integers from strings.

    >>> import pprint
    >>> pprint.pprint(jsdict_to_order(
    ...     {
    ...         'makerAddress': "0x0000000000000000000000000000000000000000",
    ...         'takerAddress': "0x0000000000000000000000000000000000000000",
    ...         'feeRecipientAddress': "0x0000000000000000000000000000000000000000",
    ...         'senderAddress': "0x0000000000000000000000000000000000000000",
    ...         'makerAssetAmount': "1000000000000000000",
    ...         'takerAssetAmount': "1000000000000000000",
    ...         'makerFee': "0",
    ...         'takerFee': "0",
    ...         'expirationTimeSeconds': "12345",
    ...         'salt': "12345",
    ...         'makerAssetData': "0x0000000000000000000000000000000000000000",
    ...         'takerAssetData': "0x0000000000000000000000000000000000000000",
    ...         'exchangeAddress': "0x0000000000000000000000000000000000000000",
    ...     },
    ... ))
    {'expirationTimeSeconds': 12345,
     'feeRecipientAddress': '0x0000000000000000000000000000000000000000',
     'makerAddress': '0x0000000000000000000000000000000000000000',
     'makerAssetAmount': 1000000000000000000,
     'makerAssetData': b'\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00'
                       b'\x00\x00\x00\x00\x00\x00\x00\x00',
     'makerFee': 0,
     'salt': 12345,
     'senderAddress': '0x0000000000000000000000000000000000000000',
     'takerAddress': '0x0000000000000000000000000000000000000000',
     'takerAssetAmount': 1000000000000000000,
     'takerAssetData': b'\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00'
                       b'\x00\x00\x00\x00\x00\x00\x00\x00',
     'takerFee': 0}
    """  # noqa: E501 (line too long)
    assert_valid(jsdict, "/orderSchema")

    order = cast(Order, copy(jsdict))

    order["makerAssetData"] = bytes.fromhex(
        remove_0x_prefix(jsdict["makerAssetData"])
    )
    order["takerAssetData"] = bytes.fromhex(
        remove_0x_prefix(jsdict["takerAssetData"])
    )

    order["makerAssetAmount"] = int(jsdict["makerAssetAmount"])
    order["takerAssetAmount"] = int(jsdict["takerAssetAmount"])

    order["makerFee"] = int(jsdict["makerFee"])
    order["takerFee"] = int(jsdict["takerFee"])

    order["expirationTimeSeconds"] = int(jsdict["expirationTimeSeconds"])

    order["salt"] = int(jsdict["salt"])

    del order["exchangeAddress"]  # type: ignore
    # silence mypy pending release of
    # https://github.com/python/mypy/issues/3550

    return order
