"""Order utilities for 0x applications.

Some methods require the caller to pass in a `Web3.BaseProvider`:code: object.
For local testing one may construct such a provider pointing at an instance of
`ganache-cli <https://www.npmjs.com/package/ganache-cli>`_ which has the 0x
contracts deployed on it.  For convenience, a docker container is provided for
just this purpose.  To start it:
`docker run -d -p 8545:8545 0xorg/ganache-cli:2.2.2`:code:.
"""

from copy import copy
from enum import auto, Enum
import json
from typing import cast, Dict, NamedTuple, Tuple
from pkg_resources import resource_string

from mypy_extensions import TypedDict

from eth_utils import keccak, remove_0x_prefix, to_bytes, to_checksum_address
from web3 import Web3
import web3.exceptions
from web3.providers.base import BaseProvider
from web3.utils import datatypes

from zero_ex.contract_addresses import NETWORK_TO_ADDRESSES, NetworkId
import zero_ex.contract_artifacts
from zero_ex.dev_utils.type_assertions import (
    assert_is_address,
    assert_is_hex_string,
    assert_is_provider,
)
from zero_ex.json_schemas import assert_valid


class _Constants:
    """Static data used by order utilities."""

    null_address = "0x0000000000000000000000000000000000000000"

    eip191_header = b"\x19\x01"

    eip712_domain_separator_schema_hash = keccak(
        b"EIP712Domain(string name,string version,address verifyingContract)"
    )

    eip712_domain_struct_header = (
        eip712_domain_separator_schema_hash
        + keccak(b"0x Protocol")
        + keccak(b"2")
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

    class SignatureType(Enum):
        """Enumeration of known signature types."""

        ILLEGAL = 0
        INVALID = auto()
        EIP712 = auto()
        ETH_SIGN = auto()
        WALLET = auto()
        VALIDATOR = auto()
        PRE_SIGNED = auto()
        N_SIGNATURE_TYPES = auto()


class Order(TypedDict):  # pylint: disable=too-many-instance-attributes
    """A Web3-compatible representation of the Exchange.Order struct."""

    makerAddress: str
    """Address that created the order."""

    takerAddress: str
    """Address that is allowed to fill the order.

    If set to 0, any address is allowed to fill the order.
    """

    feeRecipientAddress: str
    """Address that will recieve fees when order is filled."""

    senderAddress: str
    """Address that is allowed to call Exchange contract methods that affect
    this order. If set to 0, any address is allowed to call these methods.
    """

    makerAssetAmount: int
    """Amount of makerAsset being offered by maker. Must be greater than 0."""

    takerAssetAmount: int
    """Amount of takerAsset being bid on by maker. Must be greater than 0."""

    makerFee: int
    """Amount of ZRX paid to feeRecipient by maker when order is filled.  If
    set to 0, no transfer of ZRX from maker to feeRecipient will be attempted.
    """

    takerFee: int
    """Amount of ZRX paid to feeRecipient by taker when order is filled.  If
    set to 0, no transfer of ZRX from taker to feeRecipient will be attempted.
    """

    expirationTimeSeconds: int
    """Timestamp in seconds at which order expires."""

    salt: int
    """Arbitrary number to facilitate uniqueness of the order's hash."""

    makerAssetData: bytes
    """Encoded data that can be decoded by a specified proxy contract when
    transferring makerAsset. The last byte references the id of this proxy.
    """

    takerAssetData: bytes
    """Encoded data that can be decoded by a specified proxy contract when
    transferring takerAsset. The last byte references the id of this proxy.
    """


def make_empty_order() -> Order:
    """Construct an empty order.

    Initializes all strings to "0x0000000000000000000000000000000000000000",
    all numbers to 0, and all bytes to nulls.
    """
    return {
        "makerAddress": _Constants.null_address,
        "takerAddress": _Constants.null_address,
        "senderAddress": _Constants.null_address,
        "feeRecipientAddress": _Constants.null_address,
        "makerAssetData": (b"\x00") * 20,
        "takerAssetData": (b"\x00") * 20,
        "salt": 0,
        "makerFee": 0,
        "takerFee": 0,
        "makerAssetAmount": 0,
        "takerAssetAmount": 0,
        "expirationTimeSeconds": 0,
    }


def order_to_jsdict(
    order: Order, exchange_address="0x0000000000000000000000000000000000000000"
) -> dict:
    """Convert a Web3-compatible order struct to a JSON-schema-compatible dict.

    More specifically, do explicit decoding for the `bytes`:code: fields.

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
     'expirationTimeSeconds': 1,
     'feeRecipientAddress': '0x0000000000000000000000000000000000000000',
     'makerAddress': '0x0000000000000000000000000000000000000000',
     'makerAssetAmount': 1,
     'makerAssetData': '0x0000000000000000000000000000000000000000',
     'makerFee': 0,
     'salt': 1,
     'senderAddress': '0x0000000000000000000000000000000000000000',
     'takerAddress': '0x0000000000000000000000000000000000000000',
     'takerAssetAmount': 1,
     'takerAssetData': '0x0000000000000000000000000000000000000000',
     'takerFee': 0}
    """
    jsdict = cast(Dict, copy(order))

    # encode bytes fields
    jsdict["makerAssetData"] = "0x" + order["makerAssetData"].hex()
    jsdict["takerAssetData"] = "0x" + order["takerAssetData"].hex()

    jsdict["exchangeAddress"] = exchange_address

    assert_valid(jsdict, "/orderSchema")

    return jsdict


def jsdict_order_to_struct(jsdict: dict) -> Order:
    r"""Convert a JSON-schema-compatible dict order to a Web3-compatible struct.

    More specifically, do explicit encoding of the `bytes`:code: fields.

    >>> import pprint
    >>> pprint.pprint(jsdict_order_to_struct(
    ...     {
    ...         'makerAddress': "0x0000000000000000000000000000000000000000",
    ...         'takerAddress': "0x0000000000000000000000000000000000000000",
    ...         'feeRecipientAddress': "0x0000000000000000000000000000000000000000",
    ...         'senderAddress': "0x0000000000000000000000000000000000000000",
    ...         'makerAssetAmount': 1000000000000000000,
    ...         'takerAssetAmount': 1000000000000000000,
    ...         'makerFee': 0,
    ...         'takerFee': 0,
    ...         'expirationTimeSeconds': 12345,
    ...         'salt': 12345,
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

    del order["exchangeAddress"]  # type: ignore
    # silence mypy pending release of
    # https://github.com/python/mypy/issues/3550

    return order


def generate_order_hash_hex(order: Order, exchange_address: str) -> str:
    """Calculate the hash of the given order as a hexadecimal string.

    :param order: The order to be hashed.  Must conform to `the 0x order JSON schema <https://github.com/0xProject/0x-monorepo/blob/development/packages/json-schemas/schemas/order_schema.json>`_.
    :param exchange_address: The address to which the 0x Exchange smart
        contract has been deployed.
    :returns: A string, of ASCII hex digits, representing the order hash.

    >>> generate_order_hash_hex(
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
    ...         'makerAssetData': (0).to_bytes(1, byteorder='big') * 20,
    ...         'takerAssetData': (0).to_bytes(1, byteorder='big') * 20,
    ...     },
    ...     exchange_address="0x0000000000000000000000000000000000000000",
    ... )
    '55eaa6ec02f3224d30873577e9ddd069a288c16d6fb407210eecbc501fa76692'
    """  # noqa: E501 (line too long)
    assert_is_address(exchange_address, "exchange_address")
    assert_valid(order_to_jsdict(order, exchange_address), "/orderSchema")

    def pad_20_bytes_to_32(twenty_bytes: bytes):
        return bytes(12) + twenty_bytes

    def int_to_32_big_endian_bytes(i: int):
        return i.to_bytes(32, byteorder="big")

    eip712_domain_struct_hash = keccak(
        _Constants.eip712_domain_struct_header
        + pad_20_bytes_to_32(to_bytes(hexstr=exchange_address))
    )

    eip712_order_struct_hash = keccak(
        _Constants.eip712_order_schema_hash
        + pad_20_bytes_to_32(to_bytes(hexstr=order["makerAddress"]))
        + pad_20_bytes_to_32(to_bytes(hexstr=order["takerAddress"]))
        + pad_20_bytes_to_32(to_bytes(hexstr=order["feeRecipientAddress"]))
        + pad_20_bytes_to_32(to_bytes(hexstr=order["senderAddress"]))
        + int_to_32_big_endian_bytes(int(order["makerAssetAmount"]))
        + int_to_32_big_endian_bytes(int(order["takerAssetAmount"]))
        + int_to_32_big_endian_bytes(int(order["makerFee"]))
        + int_to_32_big_endian_bytes(int(order["takerFee"]))
        + int_to_32_big_endian_bytes(int(order["expirationTimeSeconds"]))
        + int_to_32_big_endian_bytes(int(order["salt"]))
        + keccak(to_bytes(hexstr=order["makerAssetData"].hex()))
        + keccak(to_bytes(hexstr=order["takerAssetData"].hex()))
    )

    return keccak(
        _Constants.eip191_header
        + eip712_domain_struct_hash
        + eip712_order_struct_hash
    ).hex()


class OrderInfo(NamedTuple):
    """A Web3-compatible representation of the Exchange.OrderInfo struct."""

    order_status: str
    """A `str`:code: describing the order's validity and fillability."""

    order_hash: bytes
    """A `bytes`:code: object representing the EIP712 hash of the order."""

    order_taker_asset_filled_amount: int
    """An `int`:code: indicating the amount that has already been filled."""


def is_valid_signature(
    provider: BaseProvider, data: str, signature: str, signer_address: str
) -> Tuple[bool, str]:
    """Check the validity of the supplied signature.

    Check if the supplied `signature`:code: corresponds to signing `data`:code:
    with the private key corresponding to `signer_address`:code:.

    :param provider: A Web3 provider able to access the 0x Exchange contract.
    :param data: The hex encoded data signed by the supplied signature.
    :param signature: The hex encoded signature.
    :param signer_address: The hex encoded address that signed the data to
        produce the supplied signature.
    :returns: Tuple consisting of a boolean and a string.  Boolean is true if
        valid, false otherwise.  If false, the string describes the reason.

    >>> is_valid_signature(
    ...     Web3.HTTPProvider("http://127.0.0.1:8545"),
    ...     '0x6927e990021d23b1eb7b8789f6a6feaf98fe104bb0cf8259421b79f9a34222b0',
    ...     '0x1B61a3ed31b43c8780e905a260a35faefcc527be7516aa11c0256729b5b351bc3340349190569279751135161d22529dc25add4f6069af05be04cacbda2ace225403',
    ...     '0x5409ed021d9299bf6814279a6a1411a7e866a631',
    ... )
    (True, '')
    """  # noqa: E501 (line too long)
    assert_is_provider(provider, "provider")
    assert_is_hex_string(data, "data")
    assert_is_hex_string(signature, "signature")
    assert_is_address(signer_address, "signer_address")

    web3_instance = Web3(provider)
    # false positive from pylint: disable=no-member
    contract_address = NETWORK_TO_ADDRESSES[
        NetworkId(int(web3_instance.net.version))
    ].exchange
    # false positive from pylint: disable=no-member
    contract: datatypes.Contract = web3_instance.eth.contract(
        address=to_checksum_address(contract_address),
        abi=zero_ex.contract_artifacts.abi_by_name("Exchange"),
    )
    try:
        return (
            contract.call().isValidSignature(
                data, to_checksum_address(signer_address), signature
            ),
            "",
        )
    except web3.exceptions.BadFunctionCallOutput as exception:
        known_revert_reasons = [
            "LENGTH_GREATER_THAN_0_REQUIRED",
            "SIGNATURE_ILLEGAL",
            "SIGNATURE_UNSUPPORTED",
            "LENGTH_0_REQUIRED",
            "LENGTH_65_REQUIRED",
        ]
        for known_revert_reason in known_revert_reasons:
            if known_revert_reason in str(exception):
                return (False, known_revert_reason)
        return (False, f"Unknown: {exception}")


class ECSignature(TypedDict):
    """Object representation of an elliptic curve signature's parameters."""

    v: int
    r: str
    s: str


def _parse_signature_hex_as_vrs(signature_hex: str) -> ECSignature:
    """Parse signature hex as a concatentation of EC parameters ordered V, R, S.

    >>> _parse_signature_hex_as_vrs('0x1b117902c86dfb95fe0d1badd983ee166ad259b27acb220174cbb4460d872871137feabdfe76e05924b484789f79af4ee7fa29ec006cedce1bbf369320d034e10b03')
    {'v': 27, 'r': '117902c86dfb95fe0d1badd983ee166ad259b27acb220174cbb4460d87287113', 's': '7feabdfe76e05924b484789f79af4ee7fa29ec006cedce1bbf369320d034e10b'}
    """  # noqa: E501 (line too long)
    signature: ECSignature = {
        "v": int(signature_hex[2:4], 16),
        "r": signature_hex[4:68],
        "s": signature_hex[68:132],
    }
    if signature["v"] == 0 or signature["v"] == 1:
        signature["v"] = signature["v"] + 27
    return signature


def _parse_signature_hex_as_rsv(signature_hex: str) -> ECSignature:
    """Parse signature hex as a concatentation of EC parameters ordered R, S, V.

    >>> _parse_signature_hex_as_rsv('0x117902c86dfb95fe0d1badd983ee166ad259b27acb220174cbb4460d872871137feabdfe76e05924b484789f79af4ee7fa29ec006cedce1bbf369320d034e10b00')
    {'r': '117902c86dfb95fe0d1badd983ee166ad259b27acb220174cbb4460d87287113', 's': '7feabdfe76e05924b484789f79af4ee7fa29ec006cedce1bbf369320d034e10b', 'v': 27}
    """  # noqa: E501 (line too long)
    signature: ECSignature = {
        "r": signature_hex[2:66],
        "s": signature_hex[66:130],
        "v": int(signature_hex[130:132], 16),
    }
    if signature["v"] == 0 or signature["v"] == 1:
        signature["v"] = signature["v"] + 27
    return signature


def _convert_ec_signature_to_vrs_hex(signature: ECSignature) -> str:
    """Convert elliptic curve signature object to hex hash string.

    >>> _convert_ec_signature_to_vrs_hex(
    ...     {
    ...         'r': '117902c86dfb95fe0d1badd983ee166ad259b27acb220174cbb4460d87287113',
    ...         's': '7feabdfe76e05924b484789f79af4ee7fa29ec006cedce1bbf369320d034e10b',
    ...         'v': 27
    ...     }
    ... )
    '0x1b117902c86dfb95fe0d1badd983ee166ad259b27acb220174cbb4460d872871137feabdfe76e05924b484789f79af4ee7fa29ec006cedce1bbf369320d034e10b'
    """  # noqa: E501 (line too long)
    return (
        "0x"
        + signature["v"].to_bytes(1, byteorder="big").hex()
        + signature["r"]
        + signature["s"]
    )


def sign_hash(
    provider: BaseProvider, signer_address: str, hash_hex: str
) -> str:
    """Sign a message with the given hash, and return the signature.

    :param provider: A Web3 provider.
    :param signer_address: The address of the signing account.
    :param hash_hex: A hex string representing the hash, like that returned
        from `generate_order_hash_hex()`:code:.
    :returns: A string, of ASCII hex digits, representing the signature.

    >>> provider = Web3.HTTPProvider("http://127.0.0.1:8545")
    >>> sign_hash(
    ...     provider,
    ...     Web3(provider).personal.listAccounts[0],
    ...     '0x34decbedc118904df65f379a175bb39ca18209d6ce41d5ed549d54e6e0a95004',
    ... )
    '0x1b117902c86dfb95fe0d1badd983ee166ad259b27acb220174cbb4460d872871137feabdfe76e05924b484789f79af4ee7fa29ec006cedce1bbf369320d034e10b03'
    """  # noqa: E501 (line too long)
    assert_is_provider(provider, "provider")
    assert_is_address(signer_address, "signer_address")
    assert_is_hex_string(hash_hex, "hash_hex")

    web3_instance = Web3(provider)
    # false positive from pylint: disable=no-member
    signature = web3_instance.eth.sign(  # type: ignore
        signer_address, hexstr=hash_hex.replace("0x", "")
    ).hex()

    valid_v_param_values = [27, 28]

    # HACK: There is no consensus on whether the signatureHex string should be
    # formatted as v + r + s OR r + s + v, and different clients (even
    # different versions of the same client) return the signature params in
    # different orders. In order to support all client implementations, we
    # parse the signature in both ways, and evaluate if either one is a valid
    # signature.  r + s + v is the most prevalent format from eth_sign, so we
    # attempt this first.

    ec_signature = _parse_signature_hex_as_rsv(signature)
    if ec_signature["v"] in valid_v_param_values:
        signature_as_vrst_hex = (
            _convert_ec_signature_to_vrs_hex(ec_signature)
            + _Constants.SignatureType.ETH_SIGN.value.to_bytes(
                1, byteorder="big"
            ).hex()
        )

        (valid, _) = is_valid_signature(
            provider, hash_hex, signature_as_vrst_hex, signer_address
        )

        if valid is True:
            return signature_as_vrst_hex

    ec_signature = _parse_signature_hex_as_vrs(signature)
    if ec_signature["v"] in valid_v_param_values:
        signature_as_vrst_hex = (
            _convert_ec_signature_to_vrs_hex(ec_signature)
            + _Constants.SignatureType.ETH_SIGN.value.to_bytes(
                1, byteorder="big"
            ).hex()
        )
        (valid, _) = is_valid_signature(
            provider, hash_hex, signature_as_vrst_hex, signer_address
        )

        if valid is True:
            return signature_as_vrst_hex

    raise RuntimeError(
        "Signature returned from web3 provider is in an unknown format."
        + " Attempted to parse as RSV and as VRS."
    )
