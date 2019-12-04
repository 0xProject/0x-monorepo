"""Python wrappers for interacting with 0x smart contracts.

The smart contract wrappers have simplified interfaces, performing client-side
validation on transactions, and throwing helpful error messages.

Setup
-----

Install the 0x-contract-wrappers with pip::

    pip install 0x-contract-wrappers

We need a Web3 provider to allow us to talk to the blockchain. You can
read `more about providers in the Web3.py documentation
<https://web3py.readthedocs.io/en/stable/>`_.  The examples below assume
there's a local instance of Ganache listening on port 8545:

>>> from web3 import HTTPProvider
>>> ganache = HTTPProvider("http://localhost:8545")

To replicate these examples, one can use the `0xorg/ganache-cli`:code: docker
image, which comes with the 0x contracts pre-deployed.  To start it::

    docker run -d -p 8545:8545 0xorg/ganache-cli

Accounts
--------

In the examples below, we will use the accounts provided by Ganache, which are
accessible through the Web3 instance. The first account will be the maker, and
the second account will be the taker.

>>> from web3 import Web3
>>> accounts = Web3(ganache).eth.accounts
>>> maker_address = accounts[0]
>>> taker_address = accounts[1]

In the examples below, we'll use the optional `tx_params`:code: parameter to
the contract calls, in order to specify which account each transaction is to
originate from.  Under normal circumstances, your provider will have a default
account which will be used if you decline to specify an originating address.
For convenience, a `TxParams`:code: class is provided:

>>> from zero_ex.contract_wrappers import TxParams

Contract Addresses
------------------

The `0x-contract-addresses`:code: package (which is used by
`0x-contract-wrappers`:code: and thus gets installed along with it) provides
the addresses of the 0x contracts on each chain, including those that come
pre-deployed deployed in the `0xorg/ganache-cli`:code: docker image.  Let's
capture the addresses we'll use throughout the examples below:

>>> from zero_ex.contract_addresses import chain_to_addresses, ChainId
>>> weth_address     = chain_to_addresses(ChainId.GANACHE).ether_token
>>> zrx_address      = chain_to_addresses(ChainId.GANACHE).zrx_token
>>> exchange_address = chain_to_addresses(ChainId.GANACHE).exchange

Wrapping ETH
------------

The examples below demonstrate constructing an order with the maker providing
ZRX in exchange for the taker providing some WETH.  For the order to be valid,
our Taker first needs to wrap some ether as WETH.

First get an instance of the WETH contract on the network:

>>> from zero_ex.contract_artifacts import abi_by_name
>>> weth_instance = Web3(ganache).eth.contract(
...    address=Web3.toChecksumAddress(weth_address),
...    abi=abi_by_name("WETH9")
... )

Then have the Taker deposit some ETH into that contract, which will result in
it receiving WETH:

>>> from eth_utils import to_wei
>>> weth_instance.functions.deposit().transact(
...     {"from": Web3.toChecksumAddress(taker_address),
...      "value": to_wei(1, 'ether')}
... )
HexBytes('0x...')

Approvals
---------

In order to trade on 0x, one must approve the 0x smart contracts to transfer
their tokens.  Because the order constructed below has the maker giving WETH,
we need to tell the WETH token contract to let the 0x contracts transfer our
balance:

>>> from zero_ex.contract_wrappers.erc20_token import ERC20Token
>>> zrx_token = ERC20Token(
...     web3_or_provider=ganache,
...     contract_address=chain_to_addresses(ChainId.GANACHE).zrx_token,
... )
>>> weth_token = ERC20Token(
...     web3_or_provider=ganache,
...     contract_address=chain_to_addresses(ChainId.GANACHE).ether_token,
... )

>>> erc20_proxy_addr = chain_to_addresses(ChainId.GANACHE).erc20_proxy

>>> tx = zrx_token.approve.send_transaction(
...     erc20_proxy_addr,
...     to_wei(100, 'ether'),
...     tx_params=TxParams(from_=maker_address),
... )

>>> tx = weth_token.approve.send_transaction(
...     erc20_proxy_addr,
...     to_wei(100, 'ether'),
...     tx_params=TxParams(from_=taker_address),
... )

Constructing an order
---------------------

>>> from zero_ex.contract_wrappers.exchange.types import Order
>>> from zero_ex.order_utils import asset_data_utils
>>> from datetime import datetime, timedelta
>>> import random
>>> order = Order(
...     makerAddress=maker_address,
...     takerAddress='0x0000000000000000000000000000000000000000',
...     senderAddress='0x0000000000000000000000000000000000000000',
...     feeRecipientAddress='0x0000000000000000000000000000000000000000',
...     makerAssetData=asset_data_utils.encode_erc20(zrx_address),
...     takerAssetData=asset_data_utils.encode_erc20(weth_address),
...     salt=random.randint(1, 100000000000000000),
...     makerFee=0,
...     takerFee=0,
...     makerAssetAmount=to_wei(0.1, 'ether'),
...     takerAssetAmount=to_wei(0.1, 'ether'),
...     expirationTimeSeconds=round(
...         (datetime.utcnow() + timedelta(days=1)).timestamp()
...     ),
...     makerFeeAssetData='0x',
...     takerFeeAssetData='0x',
... )

For this order to be valid, our Maker must sign a hash of it:

>>> from zero_ex.order_utils import generate_order_hash_hex
>>> order_hash_hex = generate_order_hash_hex(
...     order, exchange_address, Web3(ganache).eth.chainId
... )

>>> from zero_ex.order_utils import sign_hash
>>> maker_signature = sign_hash(
...     ganache, Web3.toChecksumAddress(maker_address), order_hash_hex
... )

Now our Maker can either deliver this order, along with his signature, directly
to the taker, or he can choose to broadcast the order to a 0x Relayer.  For
more information on working with Relayers, see `the documentation for
0x-sra-client <http://0x-sra-client-py.s3-website-us-east-1.amazonaws.com/>`_.

Filling an order
----------------

Now we'll have our Taker fill the order.

>>> from zero_ex.contract_wrappers.exchange import Exchange
>>> exchange = Exchange(
...     web3_or_provider=ganache,
...     contract_address=chain_to_addresses(ChainId.GANACHE).exchange,
... )

But before filling an order, one may wish to check that it's actually fillable:

>>> from zero_ex.contract_wrappers.exchange.types import OrderStatus
>>> OrderStatus(exchange.get_order_info.call(order)["orderStatus"])
<OrderStatus.FILLABLE: 3>

The `takerAssetAmount`:code: parameter specifies the amount of tokens (in this
case WETH) that the taker wants to fill.  This example fills the order
completely, but partial fills are possible too.

Note that sending value in the fill transaction is a way to pay the protocol
fee.  The value to send is a function of the gas price, so we'll need some help
in that determination:

>>> from web3.gas_strategies.rpc import rpc_gas_price_strategy
>>> web3 = Web3(ganache)
>>> web3.eth.setGasPriceStrategy(rpc_gas_price_strategy)

One may wish to first call the method in a read-only way, to ensure that it
will not revert, and to validate that the return data is as expected:

>>> from pprint import pprint
>>> pprint(exchange.fill_order.call(
...     order=order,
...     taker_asset_fill_amount=order["takerAssetAmount"],
...     signature=maker_signature,
...     tx_params=TxParams(
...         from_=taker_address, value=web3.eth.generateGasPrice() * 150000
...     ),
... ))
{'makerAssetFilledAmount': 100000000000000000,
 'makerFeePaid': 0,
 'protocolFeePaid': ...,
 'takerAssetFilledAmount': 100000000000000000,
 'takerFeePaid': 0}

Finally, submit the transaction:

>>> tx_hash = exchange.fill_order.send_transaction(
...     order=order,
...     taker_asset_fill_amount=order["takerAssetAmount"],
...     signature=maker_signature,
...     tx_params=TxParams(
...         from_=taker_address, value=web3.eth.generateGasPrice() * 150000
...     )
... )

Once the transaction is mined, we can get the details of our exchange through
the exchange wrapper:

>>> exchange.get_fill_event(tx_hash)
(AttributeDict({'args': ...({'makerAddress': ...}), 'event': 'Fill', ...}),)
>>> pprint(exchange.get_fill_event(tx_hash)[0].args.__dict__)
{'feeRecipientAddress': '0x0000000000000000000000000000000000000000',
 'makerAddress': '0x...',
 'makerAssetData': b...,
 'makerAssetFilledAmount': 100000000000000000,
 'makerFeeAssetData': b...,
 'makerFeePaid': 0,
 'orderHash': b...,
 'protocolFeePaid': ...,
 'senderAddress': '0x...',
 'takerAddress': '0x...',
 'takerAssetData': b...,
 'takerAssetFilledAmount': 100000000000000000,
 'takerFeeAssetData': b...,
 'takerFeePaid': 0}
>>> exchange.get_fill_event(tx_hash)[0].args.takerAssetFilledAmount
100000000000000000

Cancelling an order
--------------------

A Maker can cancel an order that has yet to be filled.

>>> order = Order(
...     makerAddress=maker_address,
...     takerAddress='0x0000000000000000000000000000000000000000',
...     exchangeAddress=exchange_address,
...     senderAddress='0x0000000000000000000000000000000000000000',
...     feeRecipientAddress='0x0000000000000000000000000000000000000000',
...     makerAssetData=asset_data_utils.encode_erc20(weth_address),
...     makerFeeAssetData=asset_data_utils.encode_erc20('0x' + '00'*20),
...     takerAssetData=asset_data_utils.encode_erc20(weth_address),
...     takerFeeAssetData=asset_data_utils.encode_erc20('0x' + '00'*20),
...     salt=random.randint(1, 100000000000000000),
...     makerFee=0,
...     takerFee=0,
...     makerAssetAmount=1000000000000000000,
...     takerAssetAmount=500000000000000000000,
...     expirationTimeSeconds=round(
...         (datetime.utcnow() + timedelta(days=1)).timestamp()
...     )
... )

>>> tx_hash = exchange.cancel_order.send_transaction(
...     order=order, tx_params=TxParams(from_=maker_address)
... )

Once the transaction is mined, we can get the details of the cancellation
through the Exchange wrapper:

>>> exchange.get_cancel_event(tx_hash)
(AttributeDict({'args': ...({'makerAddress': ...}), 'event': 'Cancel', ...}),)
>>> pprint(exchange.get_cancel_event(tx_hash)[0].args.__dict__)
{'feeRecipientAddress': '0x0000000000000000000000000000000000000000',
 'makerAddress': '0x...',
 'makerAssetData': b...,
 'orderHash': b...,
 'senderAddress': '0x...',
 'takerAssetData': b...}
>>> exchange.get_cancel_event(tx_hash)[0].args.feeRecipientAddress
'0x0000000000000000000000000000000000000000'

Batching orders
----------------

The Exchange contract can also process multiple orders at the same time. Here
is an example where the taker fills two orders in one transaction:

>>> order_1 = Order(
...     makerAddress=maker_address,
...     takerAddress='0x0000000000000000000000000000000000000000',
...     senderAddress='0x0000000000000000000000000000000000000000',
...     feeRecipientAddress='0x0000000000000000000000000000000000000000',
...     makerAssetData=asset_data_utils.encode_erc20(zrx_address),
...     makerFeeAssetData=asset_data_utils.encode_erc20('0x' + '00'*20),
...     takerAssetData=asset_data_utils.encode_erc20(weth_address),
...     takerFeeAssetData=asset_data_utils.encode_erc20('0x' + '00'*20),
...     salt=random.randint(1, 100000000000000000),
...     makerFee=0,
...     takerFee=0,
...     makerAssetAmount=100,
...     takerAssetAmount=100,
...     expirationTimeSeconds=round(
...         (datetime.utcnow() + timedelta(days=1)).timestamp()
...     )
... )
>>> signature_1 = sign_hash(
...     ganache,
...     Web3.toChecksumAddress(maker_address),
...     generate_order_hash_hex(
...         order_1, exchange.contract_address, Web3(ganache).eth.chainId
...     ),
... )
>>> order_2 = Order(
...     makerAddress=maker_address,
...     takerAddress='0x0000000000000000000000000000000000000000',
...     senderAddress='0x0000000000000000000000000000000000000000',
...     feeRecipientAddress='0x0000000000000000000000000000000000000000',
...     makerAssetData=asset_data_utils.encode_erc20(zrx_address),
...     makerFeeAssetData=asset_data_utils.encode_erc20('0x' + '00'*20),
...     takerAssetData=asset_data_utils.encode_erc20(weth_address),
...     takerFeeAssetData=asset_data_utils.encode_erc20('0x' + '00'*20),
...     salt=random.randint(1, 100000000000000000),
...     makerFee=0,
...     takerFee=0,
...     makerAssetAmount=200,
...     takerAssetAmount=200,
...     expirationTimeSeconds=round(
...         (datetime.utcnow() + timedelta(days=1)).timestamp()
...     )
... )
>>> signature_2 = sign_hash(
...     ganache,
...     Web3.toChecksumAddress(maker_address),
...     generate_order_hash_hex(
...         order_2, exchange.contract_address, Web3(ganache).eth.chainId
...     ),
... )

Fill order_1 and order_2 together:

>>> exchange.batch_fill_orders.send_transaction(
...     orders=[order_1, order_2],
...     taker_asset_fill_amounts=[1, 2],
...     signatures=[signature_1, signature_2],
...     tx_params=TxParams(
...         from_=taker_address,
...         value=2*web3.eth.generateGasPrice()*150000
...     )
... )
HexBytes('0x...')

Estimating gas consumption
--------------------------

Before executing a transaction, you may want to get an estimate of how much gas
will be consumed.

>>> exchange.cancel_order.estimate_gas(
...     order=Order(
...         makerAddress=maker_address,
...         takerAddress='0x0000000000000000000000000000000000000000',
...         exchangeAddress=exchange_address,
...         senderAddress='0x0000000000000000000000000000000000000000',
...         feeRecipientAddress='0x0000000000000000000000000000000000000000',
...         makerAssetData=asset_data_utils.encode_erc20(weth_address),
...         makerFeeAssetData=asset_data_utils.encode_erc20('0x' + '00'*20),
...         takerAssetData=asset_data_utils.encode_erc20(weth_address),
...         takerFeeAssetData=asset_data_utils.encode_erc20('0x' + '00'*20),
...         salt=random.randint(1, 100000000000000000),
...         makerFee=0,
...         takerFee=0,
...         makerAssetAmount=1000000000000000000,
...         takerAssetAmount=500000000000000000000,
...         expirationTimeSeconds=round(
...             (datetime.utcnow() + timedelta(days=1)).timestamp()
...         )
...     ),
...     tx_params=TxParams(from_=maker_address),
... )
74...
"""

from .tx_params import TxParams
