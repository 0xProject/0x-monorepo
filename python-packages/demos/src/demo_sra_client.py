"""Demonstration of using the python sra_client."""


def post_order():
    """Post an order to a SRA compliant 0x-relayer.

    >>> import sra_client
    >>> example_signed_order = {
    ...     "makerAddress": "0x5409ed021d9299bf6814279a6a1411a7e866a631",
    ...     "takerAddress": "0x0000000000000000000000000000000000000000",
    ...     "senderAddress": "0x0000000000000000000000000000000000000000",
    ...     "exchangeAddress": "0x35dd2932454449b14cee11a94d3674a936d5d7b2",
    ...     "feeRecipientAddress":
    ...         "0x0000000000000000000000000000000000000000",
    ...     "makerAssetData": "0xf47261b0000000000000000000000000"
    ...         "d0a1e359811322d97991e03f863a0c30c2cf029c",
    ...     "takerAssetData": "0xf47261b0000000000000000000000000"
    ...         "2002d3812f58e35f0ea1ffbf80a75a38c32175fa",
    ...     "salt": "2362734632784682376287462",
    ...     "makerFee": "0",
    ...     "takerFee": "0",
    ...     "makerAssetAmount": "1000000000000000000",
    ...     "takerAssetAmount": "500000000000000000000",
    ...     "expirationTimeSeconds": "999999999999999999999",
    ...     "signature": (
    ...         "0x1cb085506ccef3d15061766808a6d5b5369a6dacc323101f704ab1b38d0166725"
    ...         "002379d576b1ddffee6adcfc080ff7118d20beae723d3708ce4e04e49dd92694003")
    ... }
    >>> relayer_api = sra_client.api.default_api.DefaultApi()
    >>> response = relayer_api.post_order_with_http_info(
    ...     network_id=42, signed_order_schema=example_signed_order)
    >>> response[1]
    200
    """  # noqa: E501


def get_orders():
    """Get orders from a SRA compliant 0x-relayer.

    >>> import sra_client
    >>> relayer_api = sra_client.api.default_api.DefaultApi()
    >>> response = relayer_api.get_orders()
    >>> response
    {'records': [{'meta_data': {},
                  'order': {'exchange_address': '0x35dd2932454449b14cee11a94d3674a936d5d7b2',
                            'expiration_time_seconds': '1000000000000000000000',
                            'fee_recipient_address': '0x0000000000000000000000000000000000000000',
                            'maker_address': '0x5409ed021d9299bf6814279a6a1411a7e866a631',
                            'maker_asset_amount': '1000000000000000000',
                            'maker_asset_data': '0xf47261b0000000000000000000000000d0a1e359811322d97991e03f863a0c30c2cf029c',
                            'maker_fee': '0',
                            'salt': '2362734632784682376287462',
                            'sender_address': '0x0000000000000000000000000000000000000000',
                            'taker_address': '0x0000000000000000000000000000000000000000',
                            'taker_asset_amount': '500000000000000000000',
                            'taker_asset_data': '0xf47261b00000000000000000000000002002d3812f58e35f0ea1ffbf80a75a38c32175fa',
                            'taker_fee': '0'}}]}
    """  # noqa: E501


def get_order():
    """Get an order by hash from a SRA compliant 0x-relayer.

    >>> import sra_client
    >>> example_order_hash = (
    ...     "0xc1c4e9a983755b4a2ff048b0c591a27"
    ...     "0f437972e1ec440986770ac943a577404")
    >>> relayer_api = sra_client.api.default_api.DefaultApi()
    >>> response = relayer_api.get_order(order_hash=example_order_hash)  # doctest: +SKIP
    >>> response  # doctest: +SKIP
    {'meta_data': {},
    'order': {'exchange_address': '0x35dd2932454449b14cee11a94d3674a936d5d7b2',
                'expiration_time_seconds': '1000000000000000000000',
                'fee_recipient_address': '0x0000000000000000000000000000000000000000',
                'maker_address': '0x5409ed021d9299bf6814279a6a1411a7e866a631',
                'maker_asset_amount': '1000000000000000000',
                'maker_asset_data': '0xf47261b0000000000000000000000000d0a1e359811322d97991e03f863a0c30c2cf029c',
                'maker_fee': '0',
                'salt': '2362734632784682376287462',
                'sender_address': '0x0000000000000000000000000000000000000000',
                'taker_address': '0x0000000000000000000000000000000000000000',
                'taker_asset_amount': '500000000000000000000',
                'taker_asset_data': '0xf47261b00000000000000000000000002002d3812f58e35f0ea1ffbf80a75a38c32175fa',
                'taker_fee': '0'}},
    """  # noqa: 501
    # NOTE: sra_client not deserialzing order from server properly, need fix!


def get_asset_pairs():
    """Get available asset pairs from a SRA compliant relayers.

    >>> import sra_client
    >>> relayer_api = sra_client.api.default_api.DefaultApi()
    >>> response = relayer_api.get_asset_pairs()
    >>> response
    {'records': [{'assetDataA': {'assetData': '0xf47261b0000000000000000000000000d0a1e359811322d97991e03f863a0c30c2cf029c',
                                 'maxAmount': '115792089237316195423570985008687907853269984665640564039457584007913129639936',
                                 'minAmount': '0',
                                 'precision': 18},
                  'assetDataB': {'assetData': '0xf47261b00000000000000000000000002002d3812f58e35f0ea1ffbf80a75a38c32175fa',
                                 'maxAmount': '115792089237316195423570985008687907853269984665640564039457584007913129639936',
                                 'minAmount': '0',
                                 'precision': 18}}]}
    """  # noqa: E501


def get_orderbook():
    """Get the orderbook for an asset pair from a SRA compliant 0x-relayer.

    >>> import sra_client
    >>> example_base_asset_data = (
    ...     "0xf47261b0000000000000000000000000"
    ...     "d0a1e359811322d97991e03f863a0c30c2cf029c")
    >>> example_quote_asset_data = (
    ...     "0xf47261b0000000000000000000000000"
    ...     "2002d3812f58e35f0ea1ffbf80a75a38c32175fa")
    >>> relayer_api = sra_client.api.default_api.DefaultApi()
    >>> response = relayer_api.get_orderbook(
    ...     base_asset_data=example_base_asset_data,
    ...     quote_asset_data=example_quote_asset_data)
    >>> response
    {'asks': {'records': [{'meta_data': {},
                           'order': {'exchange_address': '0x35dd2932454449b14cee11a94d3674a936d5d7b2',
                                     'expiration_time_seconds': '1000000000000000000000',
                                     'fee_recipient_address': '0x0000000000000000000000000000000000000000',
                                     'maker_address': '0x5409ed021d9299bf6814279a6a1411a7e866a631',
                                     'maker_asset_amount': '1000000000000000000',
                                     'maker_asset_data': '0xf47261b0000000000000000000000000d0a1e359811322d97991e03f863a0c30c2cf029c',
                                     'maker_fee': '0',
                                     'salt': '2362734632784682376287462',
                                     'sender_address': '0x0000000000000000000000000000000000000000',
                                     'taker_address': '0x0000000000000000000000000000000000000000',
                                     'taker_asset_amount': '500000000000000000000',
                                     'taker_asset_data': '0xf47261b00000000000000000000000002002d3812f58e35f0ea1ffbf80a75a38c32175fa',
                                     'taker_fee': '0'}}]},
     'bids': {'records': []}}
    """  # noqa: E501
