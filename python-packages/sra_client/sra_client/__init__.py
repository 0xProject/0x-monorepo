# coding: utf-8

# flake8: noqa

"""Demonstration of using the python sra_client.

Configure and create an API client instance
--------------------------------------------

>>> from sra_client import ApiClient, Configuration
>>> from sra_client.api import DefaultApi
>>> config = Configuration()
>>> config.host = "http://localhost:3000"
>>> relayer_api = DefaultApi(ApiClient(config))

Post Order
-----------

Post an order to an SRA-compliant Relayer.


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
>>> relayer_api.post_order_with_http_info(
...     network_id=42, signed_order_schema=example_signed_order)[1]
200

Get Orders
-----------

Get orders from an SRA-compliant Relayer.

>>> relayer_api.get_orders()
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


Get Order
---------

Get an order by hash from an SRA-compliant Relayer.

>>> example_order_hash = (
...     "0xc1c4e9a983755b4a2ff048b0c591a27"
...     "0f437972e1ec440986770ac943a577404")
>>> relayer_api.get_order(order_hash=example_order_hash)  # doctest: +SKIP
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

Get Asset Pair
---------------

Get available asset pairs from an SRA-compliant Relayer.

>>> relayer_api.get_asset_pairs()
{'records': [{'assetDataA': {'assetData': '0xf47261b0000000000000000000000000d0a1e359811322d97991e03f863a0c30c2cf029c',
                             'maxAmount': '115792089237316195423570985008687907853269984665640564039457584007913129639936',
                             'minAmount': '0',
                             'precision': 18},
              'assetDataB': {'assetData': '0xf47261b00000000000000000000000002002d3812f58e35f0ea1ffbf80a75a38c32175fa',
                             'maxAmount': '115792089237316195423570985008687907853269984665640564039457584007913129639936',
                             'minAmount': '0',
                             'precision': 18}}]}

Get Orderbook
-------------

Get the orderbook for an asset pair from an SRA-compliant Relayer.

>>> example_base_asset_data = (
...     "0xf47261b0000000000000000000000000"
...     "d0a1e359811322d97991e03f863a0c30c2cf029c")
>>> example_quote_asset_data = (
...     "0xf47261b0000000000000000000000000"
...     "2002d3812f58e35f0ea1ffbf80a75a38c32175fa")
>>> relayer_api.get_orderbook(
...     base_asset_data=example_base_asset_data,
...     quote_asset_data=example_quote_asset_data)
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
"""  # noqa: E501 (line too long)

# NOTE: Bug in get_order method.
# Sra_client not deserialzing order from server properly, need fix!


from __future__ import absolute_import

__version__ = "1.0.0"

# import apis into sdk package
from sra_client.api.default_api import DefaultApi

# import ApiClient
from sra_client.api_client import ApiClient
from sra_client.configuration import Configuration

# import models into sdk package
from sra_client.models.order_schema import OrderSchema
from sra_client.models.paginated_collection_schema import (
    PaginatedCollectionSchema,
)
from sra_client.models.relayer_api_asset_data_pairs_response_schema import (
    RelayerApiAssetDataPairsResponseSchema,
)
from sra_client.models.relayer_api_asset_data_trade_info_schema import (
    RelayerApiAssetDataTradeInfoSchema,
)
from sra_client.models.relayer_api_error_response_schema import (
    RelayerApiErrorResponseSchema,
)
from sra_client.models.relayer_api_error_response_schema_validation_errors import (  # noqa: E501 (line too long)
    RelayerApiErrorResponseSchemaValidationErrors,
)
from sra_client.models.relayer_api_fee_recipients_response_schema import (
    RelayerApiFeeRecipientsResponseSchema,
)
from sra_client.models.relayer_api_order_config_payload_schema import (
    RelayerApiOrderConfigPayloadSchema,
)
from sra_client.models.relayer_api_order_config_response_schema import (
    RelayerApiOrderConfigResponseSchema,
)
from sra_client.models.relayer_api_order_schema import RelayerApiOrderSchema
from sra_client.models.relayer_api_orderbook_response_schema import (
    RelayerApiOrderbookResponseSchema,
)
from sra_client.models.relayer_api_orders_channel_subscribe_payload_schema import (  # noqa: E501 (line too long)
    RelayerApiOrdersChannelSubscribePayloadSchema,
)
from sra_client.models.relayer_api_orders_channel_subscribe_schema import (
    RelayerApiOrdersChannelSubscribeSchema,
)
from sra_client.models.relayer_api_orders_channel_update_schema import (
    RelayerApiOrdersChannelUpdateSchema,
)
from sra_client.models.relayer_api_orders_response_schema import (
    RelayerApiOrdersResponseSchema,
)
from sra_client.models.signed_order_schema import SignedOrderSchema
