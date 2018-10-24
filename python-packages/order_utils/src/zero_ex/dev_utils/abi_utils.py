"""Ethereum ABI utilities.

Builds on the eth-abi package, adding some convenience methods like those found
in npmjs.com/package/ethereumjs-abi.  Ideally, all of this code should be
pushed upstream into eth-abi.
"""

import re
from typing import Any, List

from mypy_extensions import TypedDict

from eth_abi import encode_abi
from web3 import Web3

from .type_assertions import assert_is_string, assert_is_list


class MethodSignature(TypedDict, total=False):
    """Object interface to an ABI method signature."""

    method: str
    args: List[str]


def parse_signature(signature: str) -> MethodSignature:
    """Parse a method signature into its constituent parts.

    >>> parse_signature("ERC20Token(address)")
    {'method': 'ERC20Token', 'args': ['address']}
    """
    assert_is_string(signature, "signature")

    matches = re.match(r"^(\w+)\((.+)\)$", signature)
    if matches is None:
        raise ValueError(f"Invalid method signature {signature}")
    return {"method": matches[1], "args": matches[2].split(",")}


def elementary_name(name: str) -> str:
    """Convert from short to canonical names; barely implemented.

    Modeled after ethereumjs-abi's ABI.elementaryName(), but only implemented
    to support our particular use case and a few other simple ones.

    >>> elementary_name("address")
    'address'
    >>> elementary_name("uint")
    'uint256'
    """
    assert_is_string(name, "name")

    return {
        "int": "int256",
        "uint": "uint256",
        "fixed": "fixed128x128",
        "ufixed": "ufixed128x128",
    }.get(name, name)


def event_id(name: str, types: List[str]) -> str:
    """Return the Keccak-256 hash of the given method.

    >>> event_id("ERC20Token", ["address"])
    '0xf47261b06eedbfce68afd46d0f3c27c60b03faad319eaf33103611cf8f6456ad'
    """
    assert_is_string(name, "name")
    assert_is_list(types, "types")

    signature = f"{name}({','.join(list(map(elementary_name, types)))})"
    return Web3.sha3(text=signature).hex()


def method_id(name: str, types: List[str]) -> str:
    """Return the 4-byte method identifier.

    >>> method_id("ERC20Token", ["address"])
    '0xf47261b0'
    """
    assert_is_string(name, "name")
    assert_is_list(types, "types")

    return event_id(name, types)[0:10]


def simple_encode(method: str, *args: Any) -> bytes:
    # docstring considered all one line by pylint: disable=line-too-long
    r"""Encode a method ABI.

    >>> simple_encode("ERC20Token(address)", "0x1dc4c1cefef38a777b15aa20260a54e584b16c48")
    b'\xf4ra\xb0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x1d\xc4\xc1\xce\xfe\xf3\x8aw{\x15\xaa &\nT\xe5\x84\xb1lH'
    """  # noqa: E501 (line too long)
    assert_is_string(method, "method")

    signature: MethodSignature = parse_signature(method)

    return bytes.fromhex(
        (
            method_id(signature["method"], signature["args"])
            + encode_abi(signature["args"], args).hex()
        )[2:]
    )
