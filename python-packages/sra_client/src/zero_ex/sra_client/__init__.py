# coding: utf-8

# flake8: noqa

r"""A Python client for interacting with SRA-compatible Relayers.

0x Protocol is an open standard.  Many Relayers opt to implementing a set of
`Standard Relayer API (SRA)
<http://sra-spec.s3-website-us-east-1.amazonaws.com/>`_ endpoints, to make it
easier for anyone to source liquidity that conforms to the 0x order format.
Here, we will show you how you can use the `0x-sra-client`:code: module to
interact with 0x relayers that implement the SRA specification.

Setup
-----

Install the package with pip::

    pip install 0x-sra-client

To interact with a 0x Relayer, you need the HTTP endpoint of the Relayer you'd like to
connect to (eg https://api.radarrelay.com/0x/v2).

For testing one can use the `0x-launch-kit
<https://github.com/0xProject/0x-launch-kit#table-of-contents/>`_ to host
orders locally.  The examples below assume that this server is running locally
and listening on port 3000, so the Relayer URL they use is
`http://localhost:3000`:code:.

By default, Launch Kit will connect to Kovan via Infura.  However, it can be
configured to connect to any JSON-RPC endpoint, on any network.  The examples
below assume that Launch Kit is connected to a Ganache development network
accessible at `http://localhost:8545`:code:.

To replicate this setup, one could run the following commands:

::

    docker run -d -p 8545:8545 0xorg/ganache-cli

    docker run -d --network host \
        -e RPC_URL=http://localhost:8545 \
        -e NETWORK_ID=50 \
        -e WHITELIST_ALL_TOKENS=True \
        0xorg/launch-kit-ci

(Note: This will only work on Linux, because `--network host`:code: only works
on Linux.  For other platforms one would have to clone `the 0x-launch-kit
repository <https://github.com/0xProject/0x-launch-kit>`_ and build and start
the server.)

Configure and create an API client instance
-------------------------------------------

>>> from zero_ex.sra_client import ApiClient, Configuration, DefaultApi
>>> config = Configuration()
>>> config.host = "http://localhost:3000"
>>> relayer_api = DefaultApi(ApiClient(config))

Preparing to trade
------------------

Making and taking orders induces the SRA endpoint to deal with the Ethereum
network.  Before we can start trading, we need to do a few things with the
network directly.

To start, connect to the Ethereum network:

>>> from web3 import HTTPProvider, Web3
>>> ganache = HTTPProvider("http://localhost:8545")

For our Maker role, we'll just use the first address available in the node:

>>> maker_address = Web3(ganache).eth.accounts[0].lower()

The 0x Ganache snapshot has a pre-loaded ZRX balance for this account, so the
example orders below have the maker trading away ZRX.  Before such an order can
be valid, though, the maker must give the 0x contracts permission to trade
their ZRX tokens:

>>> from zero_ex.contract_addresses import NETWORK_TO_ADDRESSES, NetworkId
>>> zrx_address = NETWORK_TO_ADDRESSES[NetworkId.GANACHE].zrx_token
>>>
>>> from zero_ex.contract_artifacts import abi_by_name
>>> zrx_token_contract = Web3(ganache).eth.contract(
...    address=Web3.toChecksumAddress(zrx_address),
...    abi=abi_by_name("ZRXToken")
... )
>>>
>>> zrx_token_contract.functions.approve(
...     Web3.toChecksumAddress(
...         NETWORK_TO_ADDRESSES[NetworkId.GANACHE].erc20_proxy
...     ),
...     1000000000000000000
... ).transact(
...     {"from": Web3.toChecksumAddress(maker_address)}
... )
HexBytes('0x...')

Post Order
-----------

Post an order for our Maker to trade ZRX for WETH:

>>> exchange_address = NETWORK_TO_ADDRESSES[NetworkId.GANACHE].exchange
>>> weth_address = NETWORK_TO_ADDRESSES[NetworkId.GANACHE].ether_token
>>> from zero_ex.order_utils import (
...     asset_data_utils,
...     generate_order_hash_hex,
...     jsdict_order_to_struct,
...     sign_hash)
>>> import random
>>> order = {
...     "makerAddress": maker_address,
...     "takerAddress": "0x0000000000000000000000000000000000000000",
...     "senderAddress": "0x0000000000000000000000000000000000000000",
...     "exchangeAddress": exchange_address,
...     "feeRecipientAddress": "0x0000000000000000000000000000000000000000",
...     "makerAssetData": "0x"+asset_data_utils.encode_erc20(zrx_address).hex(),
...     "takerAssetData": "0x"+asset_data_utils.encode_erc20(weth_address).hex(),
...     "salt": str(random.randint(1, 100000000000000000)),
...     "makerFee": "0",
...     "takerFee": "0",
...     "makerAssetAmount": "1000000000000000000",
...     "takerAssetAmount": "500000000000000000000",
...     "expirationTimeSeconds": "999999999999999999999"}
>>> order_hash_hex = generate_order_hash_hex(
...     jsdict_order_to_struct(order), exchange_address)
>>> order["signature"] = sign_hash(
...     ganache, Web3.toChecksumAddress(maker_address), order_hash_hex)
>>> relayer_api.post_order_with_http_info(
...     network_id=NetworkId.GANACHE.value, signed_order_schema=order)[1]
200

Get Order
---------

Retrieve the order we just posted:

>>> relayer_api.get_order("0x" + order_hash_hex)
{'meta_data': {},
 'order': {'exchangeAddress': '0x...',
           'expirationTimeSeconds': '1000000000000000000000',
           'feeRecipientAddress': '0x0000000000000000000000000000000000000000',
           'makerAddress': '0x...',
           'makerAssetAmount': '1000000000000000000',
           'makerAssetData': '0xf47261b0000000000000000000000000...',
           'makerFee': '0',
           'salt': '...',
           'senderAddress': '0x0000000000000000000000000000000000000000',
           'signature': '0x...',
           'takerAddress': '0x0000000000000000000000000000000000000000',
           'takerAssetAmount': '500000000000000000000',
           'takerAssetData': '0xf47261b0000000000000000000000000...',
           'takerFee': '0'}}

Get Orders
-----------

Retrieve all of the Relayer's orders, a set which consists solely of the one we
just posted:

>>> relayer_api.get_orders()
{'records': [{'meta_data': {},
              'order': {'exchangeAddress': '0x...',
                        'expirationTimeSeconds': '1000000000000000000000',
                        'feeRecipientAddress': '0x0000000000000000000000000000000000000000',
                        'makerAddress': '0x...',
                        'makerAssetAmount': '1000000000000000000',
                        'makerAssetData': '0xf47261b000000000000000000000000...',
                        'makerFee': '0',
                        'salt': '...',
                        'senderAddress': '0x0000000000000000000000000000000000000000',
                        'signature': '0x...',
                        'takerAddress': '0x0000000000000000000000000000000000000000',
                        'takerAssetAmount': '500000000000000000000',
                        'takerAssetData': '0xf47261b0000000000000000000000000...',
                        'takerFee': '0'}}]}

Get Asset Pairs
---------------

Get all of the Relayer's available asset pairs, which here means just WETH and
ZRX, since that's all there is on this Relayer's order book:

>>> relayer_api.get_asset_pairs()
{'records': [{'assetDataA': {'assetData': '0xf47261b0000000000000000000000000...',
                             'maxAmount': '115792089237316195423570985008687907853269984665640564039457584007913129639936',
                             'minAmount': '0',
                             'precision': 18},
              'assetDataB': {'assetData': '0xf47261b0000000000000000000000000...',
                             'maxAmount': '115792089237316195423570985008687907853269984665640564039457584007913129639936',
                             'minAmount': '0',
                             'precision': 18}}]}

Get Orderbook
-------------

Get the Relayer's order book for the WETH/ZRX asset pair (which, again,
consists just of our order):

>>> relayer_api.get_orderbook(
...     base_asset_data="0x"+asset_data_utils.encode_erc20(weth_address).hex(),
...     quote_asset_data="0x"+asset_data_utils.encode_erc20(zrx_address).hex(),
... )
{'asks': {'records': []},
 'bids': {'records': [{'meta_data': {},
                       'order': {'exchangeAddress': '0x...',
                                 'expirationTimeSeconds': '...',
                                 'feeRecipientAddress': '0x0000000000000000000000000000000000000000',
                                 'makerAddress': '0x...',
                                 'makerAssetAmount': '1000000000000000000',
                                 'makerAssetData': '0xf47261b0000000000000000000000000...',
                                 'makerFee': '0',
                                 'salt': '...',
                                 'senderAddress': '0x0000000000000000000000000000000000000000',
                                 'signature': '0x...',
                                 'takerAddress': '0x0000000000000000000000000000000000000000',
                                 'takerAssetAmount': '500000000000000000000',
                                 'takerAssetData': '0xf47261b0000000000000000000000000...',
                                 'takerFee': '0'}}]}}

Filling or Cancelling an Order
------------------------------

Fills and cancels are triggered by dealing directly with the 0x Exchange
contract, not by going through a Relayer.  See `the 0x-contract-wrappers
documentation
<http://0x-contract-wrappers-py.s3-website-us-east-1.amazonaws.com/>`_ for
examples.
"""  # noqa: E501 (line too long)

from __future__ import absolute_import

__version__ = "1.0.0"

# import apis into sdk package
from .api.default_api import DefaultApi

# import ApiClient
from .api_client import ApiClient
from .configuration import Configuration

# import models into sdk package
from .models.order_schema import OrderSchema
from .models.paginated_collection_schema import PaginatedCollectionSchema
from .models.relayer_api_asset_data_pairs_response_schema import (
    RelayerApiAssetDataPairsResponseSchema,
)
from .models.relayer_api_asset_data_trade_info_schema import (
    RelayerApiAssetDataTradeInfoSchema,
)
from .models.relayer_api_error_response_schema import (
    RelayerApiErrorResponseSchema,
)
from .models.relayer_api_error_response_schema_validation_errors import (
    RelayerApiErrorResponseSchemaValidationErrors,
)
from .models.relayer_api_fee_recipients_response_schema import (
    RelayerApiFeeRecipientsResponseSchema,
)
from .models.relayer_api_order_config_payload_schema import (
    RelayerApiOrderConfigPayloadSchema,
)
from .models.relayer_api_order_config_response_schema import (
    RelayerApiOrderConfigResponseSchema,
)
from .models.relayer_api_order_schema import RelayerApiOrderSchema
from .models.relayer_api_orderbook_response_schema import (
    RelayerApiOrderbookResponseSchema,
)
from .models.relayer_api_orders_channel_subscribe_payload_schema import (
    RelayerApiOrdersChannelSubscribePayloadSchema,
)
from .models.relayer_api_orders_channel_subscribe_schema import (
    RelayerApiOrdersChannelSubscribeSchema,
)
from .models.relayer_api_orders_channel_update_schema import (
    RelayerApiOrdersChannelUpdateSchema,
)
from .models.relayer_api_orders_response_schema import (
    RelayerApiOrdersResponseSchema,
)
from .models.signed_order_schema import SignedOrderSchema
