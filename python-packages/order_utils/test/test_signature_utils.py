"""Tests of 0x.order_utils.signature_utils.*."""

from zero_ex.order_utils.signature_utils import ec_sign_order_hash


def test_ec_sign_order_hash():
    """Test the signing of order hashes."""
    assert ec_sign_order_hash() == "stub return value"
