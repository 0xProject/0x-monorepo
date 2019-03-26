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

>>> from web3 import HTTPProvider, Web3
>>> from zero_ex.contract_addresses import (
...     NETWORK_TO_ADDRESSES, NetworkId)
>>> from zero_ex.order_utils import (
...     asset_data_utils,
...     generate_order_hash_hex,
...     jsdict_order_to_struct,
...     sign_hash)
>>> provider = HTTPProvider("http://localhost:8545")
>>> maker_address = "0x5409ed021d9299bf6814279a6a1411a7e866a631"
>>> weth_address = NETWORK_TO_ADDRESSES[NetworkId.KOVAN].ether_token
>>> zrx_address = NETWORK_TO_ADDRESSES[NetworkId.KOVAN].zrx_token
>>> weth_asset_data = asset_data_utils.encode_erc20_asset_data(weth_address)
>>> zrx_asset_data = asset_data_utils.encode_erc20_asset_data(zrx_address)
>>> example_order = {
...     "makerAddress": maker_address,
...     "takerAddress": "0x0000000000000000000000000000000000000000",
...     "senderAddress": "0x0000000000000000000000000000000000000000",
...     "exchangeAddress": "0x35dd2932454449b14cee11a94d3674a936d5d7b2",
...     "feeRecipientAddress":
...         "0x0000000000000000000000000000000000000000",
...     "makerAssetData": weth_asset_data,
...     "takerAssetData": zrx_asset_data,
...     "salt": "2362734632784682376287462",
...     "makerFee": "0",
...     "takerFee": "0",
...     "makerAssetAmount": "1000000000000000000",
...     "takerAssetAmount": "500000000000000000000",
...     "expirationTimeSeconds": "999999999999999999999"}
>>> order_hash = generate_order_hash_hex(
...     jsdict_order_to_struct(example_order),
...     example_order["exchangeAddress"])
>>> example_order["signature"] = sign_hash(
...     provider, Web3.toChecksumAddress(maker_address), order_hash)
>>> relayer_api.post_order_with_http_info(
...     network_id=42, signed_order_schema=example_order)[1]
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

>>> relayer_api.get_order(order_hash)  # doctest: +SKIP
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

>>> relayer_api.get_orderbook(
...     base_asset_data=weth_asset_data,
...     quote_asset_data=zrx_asset_data)
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
