"""Tests of zero_ex.order_utils.signature_utils."""

import pytest
from web3 import Web3

from zero_ex.contract_wrappers.exchange.exceptions import (
    SignatureError,
    SignatureErrorCodes,
)
from zero_ex.order_utils import is_valid_signature, sign_hash_to_bytes


def test_is_valid_signature__provider_wrong_type():
    """Test that giving a non-HTTPProvider raises a TypeError."""
    with pytest.raises(TypeError):
        is_valid_signature(
            123,
            "0x6927e990021d23b1eb7b8789f6a6feaf98fe104bb0cf8259421b79f9a34222b"
            + "0",
            "0x1B61a3ed31b43c8780e905a260a35faefcc527be7516aa11c0256729b5b351b"
            + "c3340349190569279751135161d22529dc25add4f6069af05be04cacbda2ace"
            + "225403",
            "0x5409ed021d9299bf6814279a6a1411a7e866a631",
        )


def test_is_valid_signature__data_not_string():
    """Test that giving non-string `data` raises a TypeError."""
    with pytest.raises(TypeError):
        is_valid_signature(
            Web3.HTTPProvider("http://127.0.0.1:8545"),
            123,
            "0x1B61a3ed31b43c8780e905a260a35faefcc527be7516aa11c0256729b5b351b"
            + "c3340349190569279751135161d22529dc25add4f6069af05be04cacbda2ace"
            + "225403",
            "0x5409ed021d9299bf6814279a6a1411a7e866a631",
        )


def test_is_valid_signature__data_not_hex_string():
    """Test that giving non-hex-string `data` raises a ValueError."""
    with pytest.raises(ValueError):
        is_valid_signature(
            Web3.HTTPProvider("http://127.0.0.1:8545"),
            "jjj",
            "0x1B61a3ed31b43c8780e905a260a35faefcc527be7516aa11c0256729b5b351b"
            + "c3340349190569279751135161d22529dc25add4f6069af05be04cacbda2ace"
            + "225403",
            "0x5409ed021d9299bf6814279a6a1411a7e866a631",
        )


def test_is_valid_signature__signature_not_string():
    """Test that passng a non-string signature raises a TypeError."""
    with pytest.raises(TypeError):
        is_valid_signature(
            Web3.HTTPProvider("http://127.0.0.1:8545"),
            "0x6927e990021d23b1eb7b8789f6a6feaf98fe104bb0cf8259421b79f9a34222b"
            + "0",
            123,
            "0x5409ed021d9299bf6814279a6a1411a7e866a631",
        )


def test_is_valid_signature__signature_not_hex_string():
    """Test that passing a non-hex-string signature raises a ValueError."""
    with pytest.raises(ValueError):
        is_valid_signature(
            Web3.HTTPProvider("http://127.0.0.1:8545"),
            "0x6927e990021d23b1eb7b8789f6a6feaf98fe104bb0cf8259421b79f9a34222b"
            + "0",
            "jjj",
            "0x5409ed021d9299bf6814279a6a1411a7e866a631",
        )


def test_is_valid_signature__signer_address_not_string():
    """Test that giving a non-address `signer_address` raises a ValueError."""
    with pytest.raises(TypeError):
        is_valid_signature(
            Web3.HTTPProvider("http://127.0.0.1:8545"),
            "0x6927e990021d23b1eb7b8789f6a6feaf98fe104bb0cf8259421b79f9a34222b"
            + "0",
            "0x1B61a3ed31b43c8780e905a260a35faefcc527be7516aa11c0256729b5b351b"
            + "c3340349190569279751135161d22529dc25add4f6069af05be04cacbda2ace"
            + "225403",
            123,
        )


def test_is_valid_signature__signer_address_not_hex_string():
    """Test that giving a non-hex-str `signer_address` raises a ValueError."""
    with pytest.raises(ValueError):
        is_valid_signature(
            Web3.HTTPProvider("http://127.0.0.1:8545"),
            "0x6927e990021d23b1eb7b8789f6a6feaf98fe104bb0cf8259421b79f9a34222b"
            + "0",
            "0x1B61a3ed31b43c8780e905a260a35faefcc527be7516aa11c0256729b5b351b"
            + "c3340349190569279751135161d22529dc25add4f6069af05be04cacbda2ace"
            + "225403",
            "jjj",
        )


def test_is_valid_signature__signer_address_not_valid_address():
    """Test that giving a non-address for `signer_address` raises an error."""
    with pytest.raises(ValueError):
        is_valid_signature(
            Web3.HTTPProvider("http://127.0.0.1:8545"),
            "0x6927e990021d23b1eb7b8789f6a6feaf98fe104bb0cf8259421b79f9a34222b"
            + "0",
            "0x1B61a3ed31b43c8780e905a260a35faefcc527be7516aa11c0256729b5b351b"
            + "c3340349190569279751135161d22529dc25add4f6069af05be04cacbda2ace"
            + "225403",
            "0xff",
        )


def test_is_valid_signature__unsupported_sig_types():
    """Test that passing in a sig w/invalid type raises error.

    To induce this error, the last byte of the signature is tweaked from 03 to
    ff."""
    try:
        is_valid_signature(
            Web3.HTTPProvider("http://127.0.0.1:8545"),
            "0x6927e990021d23b1eb7b8789f6a6feaf98fe104bb0cf8259421b79f9a34222"
            + "b0",
            "0x1B61a3ed31b43c8780e905a260a35faefcc527be7516aa11c0256729b5b351b"
            + "c3340349190569279751135161d22529dc25add4f6069af05be04cacbda2ace"
            + "225401",
            "0x5409ed021d9299bf6814279a6a1411a7e866a631",
        )
    except SignatureError as signature_error:
        assert (
            signature_error.errorCode
            == SignatureErrorCodes.INVALID_LENGTH.value
        )
    else:
        pytest.fail("Expected exception")


def test_sign_hash_to_bytes_and_validate__golden_path():
    """Test the happy path through sign_hash_to_bytes()."""
    provider = Web3.HTTPProvider("http://127.0.0.1:8545")

    signing_address = Web3(  # pylint: disable=no-member
        provider
    ).geth.personal.listAccounts()[0]

    order_hash_hex = (
        "0x34decbedc118904df65f379a175bb39ca18209d6ce41d5ed549d54e6e0a95004"
    )

    signature = sign_hash_to_bytes(provider, signing_address, order_hash_hex)

    assert (
        signature
        == b"1b117902c86dfb95fe0d1badd983ee166ad259b27acb220174cbb4460d872871137feabdfe76e05924b484789f79af4ee7fa29ec006cedce1bbf369320d034e10b03"  # noqa: E501 (line too long)
    )

    is_valid = is_valid_signature(
        Web3.HTTPProvider("http://127.0.0.1:8545"),
        order_hash_hex,
        signature.decode("utf-8"),
        signing_address,
    )

    assert is_valid is True
