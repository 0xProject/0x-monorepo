"""Tests of zero_ex.order_utils.signature_utils."""

import pytest
from web3 import Web3

from zero_ex.order_utils import is_valid_signature


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
    (is_valid, reason) = is_valid_signature(
        Web3.HTTPProvider("http://127.0.0.1:8545"),
        "0x6927e990021d23b1eb7b8789f6a6feaf98fe104bb0cf8259421b79f9a34222b0",
        "0x1B61a3ed31b43c8780e905a260a35faefcc527be7516aa11c0256729b5b351bc334"
        + "0349190569279751135161d22529dc25add4f6069af05be04cacbda2ace2254ff",
        "0x5409ed021d9299bf6814279a6a1411a7e866a631",
    )
    assert is_valid is False
    assert reason == "SIGNATURE_UNSUPPORTED"
