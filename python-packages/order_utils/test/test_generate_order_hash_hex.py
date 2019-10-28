"""Test zero_ex.order_utils.get_order_hash_hex()."""

from zero_ex.order_utils import generate_order_hash_hex


def test_get_order_hash_hex__empty_order():
    """Test the hashing of an uninitialized order."""
    expected_hash_hex = (
        "331cb7e07a757bae130702da6646c26531798c92bcfaf671817268fd2c188531"
    )
    actual_hash_hex = generate_order_hash_hex(
        {
            "makerAddress": "0x0000000000000000000000000000000000000000",
            "takerAddress": "0x0000000000000000000000000000000000000000",
            "senderAddress": "0x0000000000000000000000000000000000000000",
            "feeRecipientAddress": (
                "0x0000000000000000000000000000000000000000"
            ),
            "makerAssetData": (b"\x00") * 20,
            "takerAssetData": (b"\x00") * 20,
            "makerFeeAssetData": (b"\x00") * 20,
            "takerFeeAssetData": (b"\x00") * 20,
            "salt": 0,
            "makerFee": 0,
            "takerFee": 0,
            "makerAssetAmount": 0,
            "takerAssetAmount": 0,
            "expirationTimeSeconds": 0,
        },
        "0x1dc4c1cefef38a777b15aa20260a54e584b16c48",
        50,
    )
    assert actual_hash_hex == expected_hash_hex
