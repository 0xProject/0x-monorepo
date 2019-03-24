"""Demonstration of creating and validating orders."""


def create_order():
    """Create a 0x order.

    >>> import pprint
    >>> from zero_ex.order_utils import asset_data_utils, Order
    >>> NULL_ADDRESS = "0x0000000000000000000000000000000000000000"
    >>> my_address = "0x5409ed021d9299bf6814279a6a1411a7e866a631"
    >>> exchange_address = "0x4f833a24e1f95d70f028921e27040ca56e09ab0b"
    >>> weth_address = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
    >>> zrx_address = "0xe41d2489571d322189246dafa5ebde1f4699f498"
    >>> maker_asset_data = (
    ...     asset_data_utils.encode_erc20_asset_data(weth_address))
    >>> taker_asset_data = (
    ...     asset_data_utils.encode_erc20_asset_data(zrx_address))
    >>> example_order: Order = {
    ...     "makerAddress": my_address,
    ...     "takerAddress": NULL_ADDRESS,
    ...     "exchangeAddress": exchange_address,
    ...     "senderAddress": NULL_ADDRESS,
    ...     "feeRecipientAddress": NULL_ADDRESS,
    ...     "makerAssetData": maker_asset_data,
    ...     "takerAssetData": taker_asset_data,
    ...     "salt": 123456789,
    ...     "makerFee": 0,
    ...     "takerFee": 0,
    ...     "makerAssetAmount": 1 * 10 ** 18,
    ...     "takerAssetAmount": 500 * 10 ** 18,
    ...     "expirationTimeSeconds": 1553553429,
    ... }
    >>> pprint.pprint(example_order)
    {'exchangeAddress': '0x4f833a24e1f95d70f028921e27040ca56e09ab0b',
     'expirationTimeSeconds': 1553553429,
     'feeRecipientAddress': '0x0000000000000000000000000000000000000000',
     'makerAddress': '0x5409ed021d9299bf6814279a6a1411a7e866a631',
     'makerAssetAmount': 1000000000000000000,
     'makerAssetData': '0xf47261b0000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
     'makerFee': 0,
     'salt': 123456789,
     'senderAddress': '0x0000000000000000000000000000000000000000',
     'takerAddress': '0x0000000000000000000000000000000000000000',
     'takerAssetAmount': 500000000000000000000,
     'takerAssetData': '0xf47261b0000000000000000000000000e41d2489571d322189246dafa5ebde1f4699f498',
     'takerFee': 0}
    """  # noqa: E501


def validate_order():
    """Validate a 0x order.

    >>> from zero_ex.json_schemas import assert_valid
    >>> example_order = {
    ...     'makerAddress': '0x5409ed021d9299bf6814279a6a1411a7e866a631',
    ...     'takerAddress': '0x0000000000000000000000000000000000000000',
    ...     'senderAddress': '0x0000000000000000000000000000000000000000',
    ...     'exchangeAddress': '0x4f833a24e1f95d70f028921e27040ca56e09ab0b',
    ...     'feeRecipientAddress':
    ...         '0x0000000000000000000000000000000000000000',
    ...     'makerAssetData': '0xf47261b0000000000000000000000000'
    ...         'c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    ...     'takerAssetData': '0xf47261b0000000000000000000000000'
    ...         'e41d2489571d322189246dafa5ebde1f4699f498',
    ...     'salt': 123456789,
    ...     'makerFee': 0,
    ...     'takerFee': 0,
    ...     'makerAssetAmount': 1000000000000000000,
    ...     'takerAssetAmount': 500000000000000000000,
    ...     'expirationTimeSeconds': 1553553429
    ... }
    >>> assert_valid(example_order, "/orderSchema")
    """
