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

To interact with a 0x Relayer, you need the HTTP endpoint of the Relayer you'd
like to connect to (eg https://api.radarrelay.com/0x/v2).

For testing one can use the `0x-launch-kit-backend
<https://github.com/0xProject/0x-launch-kit-backend#table-of-contents/>`_ to host
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
on Linux.  For other platforms one would have to clone `the 0x-launch-kit-backend
repository <https://github.com/0xProject/0x-launch-kit-backend>`_ and build and start
the server.)

Configure and create an API client instance
-------------------------------------------

>>> from zero_ex.sra_client import ApiClient, Configuration, DefaultApi
>>> config = Configuration()
>>> config.host = "http://localhost:3000"
>>> relayer = DefaultApi(ApiClient(config))

Preparing to trade
------------------

Making and taking orders induces the SRA endpoint to deal with the Ethereum
network.  Before we can start trading, we need to do a few things with the
network directly.

To start, connect to the Ethereum network:

>>> from web3 import HTTPProvider, Web3
>>> eth_node = HTTPProvider("http://localhost:8545")

What network is it?

>>> from zero_ex.contract_addresses import NetworkId
>>> network_id = NetworkId.GANACHE  # you might use .MAINNET or .KOVAN

For our Maker role, we'll just use the first address available in the node:

>>> maker_address = Web3(eth_node).eth.accounts[0]

The 0x Ganache snapshot loaded into our eth_node has a pre-loaded ZRX balance
for this account, so the example orders below have the maker trading away ZRX.
Before such an order can be valid, though, the maker must give the 0x contracts
permission to trade their ZRX tokens:

>>> from zero_ex.contract_addresses import NETWORK_TO_ADDRESSES
>>> contract_addresses = NETWORK_TO_ADDRESSES[network_id]
>>>
>>> from zero_ex.contract_artifacts import abi_by_name
>>> zrx_token_contract = Web3(eth_node).eth.contract(
...    address=Web3.toChecksumAddress(contract_addresses.zrx_token),
...    abi=abi_by_name("ZRXToken")
... )
>>>
>>> zrx_token_contract.functions.approve(
...     Web3.toChecksumAddress(contract_addresses.erc20_proxy),
...     1000000000000000000
... ).transact(
...     {"from": Web3.toChecksumAddress(maker_address)}
... )
HexBytes('0x...')

Post Order
-----------

Post an order for our Maker to trade ZRX for WETH:

>>> from zero_ex.contract_wrappers.exchange.types import Order, order_to_jsdict
>>> from zero_ex.order_utils import (
...     asset_data_utils,
...     sign_hash)
>>> import random
>>> from datetime import datetime, timedelta
>>> order = Order(
...     makerAddress=maker_address,
...     takerAddress="0x0000000000000000000000000000000000000000",
...     senderAddress="0x0000000000000000000000000000000000000000",
...     exchangeAddress=contract_addresses.exchange,
...     feeRecipientAddress="0x0000000000000000000000000000000000000000",
...     makerAssetData=asset_data_utils.encode_erc20(
...         contract_addresses.zrx_token
...     ),
...     takerAssetData=asset_data_utils.encode_erc20(
...         contract_addresses.ether_token
...     ),
...     salt=random.randint(1, 100000000000000000),
...     makerFee=0,
...     takerFee=0,
...     makerAssetAmount=2,
...     takerAssetAmount=2,
...     expirationTimeSeconds=round(
...         (datetime.utcnow() + timedelta(days=1)).timestamp()
...     )
... )

>>> from zero_ex.order_utils import generate_order_hash_hex
>>> order_hash_hex = generate_order_hash_hex(
...     order, contract_addresses.exchange
... )
>>> relayer.post_order_with_http_info(
...     network_id=network_id.value,
...     signed_order_schema=order_to_jsdict(
...         order=order,
...         exchange_address=contract_addresses.exchange,
...         signature=sign_hash(
...             eth_node, Web3.toChecksumAddress(maker_address), order_hash_hex
...         )
...     )
... )[1]
200

Get Order
---------

Retrieve the order we just posted:

>>> relayer.get_order("0x" + order_hash_hex)
{'meta_data': {},
 'order': {'exchangeAddress': '0x...',
           'expirationTimeSeconds': '...',
           'feeRecipientAddress': '0x0000000000000000000000000000000000000000',
           'makerAddress': '0x...',
           'makerAssetAmount': '2',
           'makerAssetData': '0xf47261b0000000000000000000000000...',
           'makerFee': '0',
           'salt': '...',
           'senderAddress': '0x0000000000000000000000000000000000000000',
           'signature': '0x...',
           'takerAddress': '0x0000000000000000000000000000000000000000',
           'takerAssetAmount': '2',
           'takerAssetData': '0xf47261b0000000000000000000000000...',
           'takerFee': '0'}}

Get Orders
-----------

Retrieve all of the Relayer's orders, a set which at this point consists solely
of the one we just posted:

>>> relayer.get_orders()
{'records': [{'meta_data': {},
              'order': {'exchangeAddress': '0x...',
                        'expirationTimeSeconds': '...',
                        'feeRecipientAddress': '0x0000000000000000000000000000000000000000',
                        'makerAddress': '0x...',
                        'makerAssetAmount': '2',
                        'makerAssetData': '0xf47261b000000000000000000000000...',
                        'makerFee': '0',
                        'salt': '...',
                        'senderAddress': '0x0000000000000000000000000000000000000000',
                        'signature': '0x...',
                        'takerAddress': '0x0000000000000000000000000000000000000000',
                        'takerAssetAmount': '2',
                        'takerAssetData': '0xf47261b0000000000000000000000000...',
                        'takerFee': '0'}}]}

Get Asset Pairs
---------------

Get all of the Relayer's available asset pairs, which here means just WETH and
ZRX, since that's all there is on this Relayer's order book:

>>> relayer.get_asset_pairs()
{'records': [{'assetDataA': {'assetData': '0xf47261b0000000000000000000000000...',
                             'maxAmount': '115792089237316195423570985008687907853269984665640564039457584007913129639936',
                             'minAmount': '0',
                             'precision': 18},
              'assetDataB': {'assetData': '0xf47261b0000000000000000000000000...',
                             'maxAmount': '115792089237316195423570985008687907853269984665640564039457584007913129639936',
                             'minAmount': '0',
                             'precision': 18}}]}
>>> asset_data_utils.decode_erc20_asset_data(
...     relayer.get_asset_pairs().records[0]['assetDataA']['assetData']
... ).token_address == contract_addresses.zrx_token
True
>>> asset_data_utils.decode_erc20_asset_data(
...     relayer.get_asset_pairs().records[0]['assetDataB']['assetData']
... ).token_address == contract_addresses.ether_token
True

Get Orderbook
-------------

Get the Relayer's order book for the WETH/ZRX asset pair (which, again,
consists just of our order):

>>> orderbook = relayer.get_orderbook(
...     base_asset_data= "0x" + asset_data_utils.encode_erc20(
...         contract_addresses.ether_token
...     ).hex(),
...     quote_asset_data= "0x" + asset_data_utils.encode_erc20(
...         contract_addresses.zrx_token
...     ).hex(),
... )
>>> orderbook
{'asks': {'records': []},
 'bids': {'records': [{'meta_data': {},
                       'order': {'exchangeAddress': '0x...',
                                 'expirationTimeSeconds': '...',
                                 'feeRecipientAddress': '0x0000000000000000000000000000000000000000',
                                 'makerAddress': '0x...',
                                 'makerAssetAmount': '2',
                                 'makerAssetData': '0xf47261b0000000000000000000000000...',
                                 'makerFee': '0',
                                 'salt': '...',
                                 'senderAddress': '0x0000000000000000000000000000000000000000',
                                 'signature': '0x...',
                                 'takerAddress': '0x0000000000000000000000000000000000000000',
                                 'takerAssetAmount': '2',
                                 'takerAssetData': '0xf47261b0000000000000000000000000...',
                                 'takerFee': '0'}}]}}

Select an order from the orderbook
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

>>> from zero_ex.contract_wrappers.exchange.types import jsdict_to_order
>>> order = jsdict_to_order(orderbook.bids.records[0].order)
>>> from pprint import pprint
>>> pprint(order)
{'expirationTimeSeconds': ...,
 'feeRecipientAddress': '0x0000000000000000000000000000000000000000',
 'makerAddress': '0x...',
 'makerAssetAmount': 2,
 'makerAssetData': b...
 'makerFee': 0,
 'salt': ...,
 'senderAddress': '0x0000000000000000000000000000000000000000',
 'signature': '0x...',
 'takerAddress': '0x0000000000000000000000000000000000000000',
 'takerAssetAmount': 2,
 'takerAssetData': b...
 'takerFee': 0}

Filling or Cancelling an Order
------------------------------

Fills and cancels are triggered by dealing directly with the 0x Exchange
contract, not by going through a Relayer.

See `the 0x-contract-wrappers documentation
<http://0x-contract-wrappers-py.s3-website-us-east-1.amazonaws.com/>`_ for more
examples.

Filling
^^^^^^^

>>> taker_address = Web3(eth_node).eth.accounts[1]

Our taker will take a ZRX/WETH order, but it doesn't have any WETH yet.  By
depositing some ether into the WETH contract, it will be given some WETH to
trade with:

>>> weth_instance = Web3(eth_node).eth.contract(
...    address=Web3.toChecksumAddress(contract_addresses.ether_token),
...    abi=abi_by_name("WETH9")
... )
>>> weth_instance.functions.deposit().transact(
...     {"from": Web3.toChecksumAddress(taker_address),
...      "value": 1000000000000000000}
... )
HexBytes('0x...')

Next the taker needs to give the 0x contracts permission to trade their WETH:

>>> weth_instance.functions.approve(
...     Web3.toChecksumAddress(contract_addresses.erc20_proxy),
...     1000000000000000000
... ).transact(
...     {"from": Web3.toChecksumAddress(taker_address)}
... )
HexBytes('0x...')

Now the taker is ready to trade.

Recall that in a previous example we selected a specific order from the order
book.  Now let's have the taker fill it:

>>> from zero_ex.contract_wrappers import TxParams
>>> from zero_ex.contract_wrappers.exchange import Exchange
>>> from zero_ex.order_utils import Order
>>> exchange = Exchange(
...     provider=eth_node,
...     contract_address=NETWORK_TO_ADDRESSES[NetworkId.GANACHE].exchange
... )

(Due to `an Issue with the Launch Kit Backend
<https://github.com/0xProject/0x-launch-kit-backend/issues/73>`_, we need to
checksum the address in the order before filling it.)
>>> order['makerAddress'] = Web3.toChecksumAddress(order['makerAddress'])

>>> exchange.fill_order.send_transaction(
...     order=order,
...     taker_asset_fill_amount=order['makerAssetAmount']/2, # note the half fill
...     signature=order['signature'].replace('0x', '').encode('utf-8'),
...     tx_params=TxParams(from_=taker_address)
... )
HexBytes('0x...')

Cancelling
^^^^^^^^^^

Note that the above fill was partial: it only filled half of the order.  Now
we'll have our maker cancel the remaining order:

>>> exchange.cancel_order.send_transaction(
...     order=order,
...     tx_params=TxParams(from_=maker_address)
... )
HexBytes('0x...')

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
