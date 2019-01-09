"""Test zero_ex.order_utils.get_order_hash_hex()."""

from zero_ex.order_utils import generate_order_hash_hex, make_empty_order


def test_get_order_hash_hex__empty_order():
    """Test the hashing of an uninitialized order."""
    expected_hash_hex = (
        "faa49b35faeb9197e9c3ba7a52075e6dad19739549f153b77dfcf59408a4b422"
    )
    actual_hash_hex = generate_order_hash_hex(
        make_empty_order(), "0x0000000000000000000000000000000000000000"
    )
    assert actual_hash_hex == expected_hash_hex
