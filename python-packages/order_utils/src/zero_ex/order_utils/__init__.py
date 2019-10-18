"""Order utilities for 0x applications.

Setup
-----

Install the package with pip::

    pip install 0x-order-utils

Some methods require the caller to pass in a `Web3.BaseProvider`:code: object.
For local testing one may construct such a provider pointing at an instance of
`ganache-cli <https://www.npmjs.com/package/ganache-cli>`_ which has the 0x
contracts deployed on it.  For convenience, a docker container is provided for
just this purpose.  To start it:
`docker run -d -p 8545:8545 0xorg/ganache-cli:2.2.2`:code:.

"""

from enum import auto, Enum
import json
from typing import Tuple
from pkg_resources import resource_string

from mypy_extensions import TypedDict

from eth_utils import keccak, remove_0x_prefix, to_bytes, to_checksum_address
from web3 import Web3
import web3.exceptions
from web3.providers.base import BaseProvider
from web3.contract import Contract

from zero_ex.contract_addresses import NETWORK_TO_ADDRESSES, NetworkId
import zero_ex.contract_artifacts
from zero_ex.contract_wrappers.order_conversions import order_to_jsdict
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


def generate_order_hash_hex(order: Order, exchange_address: str) -> str:
    """Calculate the hash of the given order as a hexadecimal string.

    :param order: The order to be hashed.  Must conform to `the 0x order JSON schema <https://github.com/0xProject/0x-monorepo/blob/development/packages/json-schemas/schemas/order_schema.json>`_.
    :param exchange_address: The address to which the 0x Exchange smart
        contract has been deployed.
    :returns: A string, of ASCII hex digits, representing the order hash.

    >>> generate_order_hash_hex(
    ...     Order(
    ...         makerAddress="0x0000000000000000000000000000000000000000",
    ...         takerAddress="0x0000000000000000000000000000000000000000",
    ...         feeRecipientAddress="0x0000000000000000000000000000000000000000",
    ...         senderAddress="0x0000000000000000000000000000000000000000",
    ...         makerAssetAmount="1000000000000000000",
    ...         takerAssetAmount="1000000000000000000",
    ...         makerFee="0",
    ...         takerFee="0",
    ...         expirationTimeSeconds="12345",
    ...         salt="12345",
    ...         makerAssetData=((0).to_bytes(1, byteorder='big') * 20),
    ...         takerAssetData=((0).to_bytes(1, byteorder='big') * 20),
    ...     ),
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
    contract: Contract = web3_instance.eth.contract(
        address=to_checksum_address(contract_address),
        abi=zero_ex.contract_artifacts.abi_by_name("Exchange"),
    )
    try:
        return (
            contract.functions.isValidSignature(
                data, to_checksum_address(signer_address), signature
            ).call(),
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
    ...     Web3(provider).geth.personal.listAccounts()[0],
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


def sign_hash_to_bytes(
    provider: BaseProvider, signer_address: str, hash_hex: str
) -> bytes:
    """Sign a message with the given hash, and return the signature.

    >>> provider = Web3.HTTPProvider("http://127.0.0.1:8545")
    >>> sign_hash_to_bytes(
    ...     provider,
    ...     Web3(provider).geth.personal.listAccounts()[0],
    ...     '0x34decbedc118904df65f379a175bb39ca18209d6ce41d5ed549d54e6e0a95004',
    ... ).decode(encoding='utf_8')
    '1b117902c86dfb95fe0d1badd983ee166ad259b27acb220174cbb4460d872871137feabdfe76e05924b484789f79af4ee7fa29ec006cedce1bbf369320d034e10b03'
    """  # noqa: E501 (line too long)
    return remove_0x_prefix(
        sign_hash(provider, signer_address, hash_hex)
    ).encode(encoding="utf_8")
