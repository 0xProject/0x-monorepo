"""Python wrappers for interacting with 0x smart contracts.

The smart contract wrappers have simplified interfaces,
and perform client-side validation on transactions and throw
helpful error messages.

Installing
==========
Install the 0x-contract-wrappers with pip:

``pip install 0x-contract-wrappers``

Demo
====
We will demonstrate some basic steps to help you get started trading on 0x.

**Importing packages**

The first step to interact with the 0x smart contract is to import
the following relevant packages:

>>> import random
>>> from eth_utils import to_checksum_address
>>> from zero_ex.contract_addresses import NETWORK_TO_ADDRESSES, NetworkId
>>> from zero_ex.contract_wrappers import (
...     ERC20Token, Exchange
... )
>>> from zero_ex.order_utils import(
...     sign_hash, generate_order_hash_hex)

**Provider**

We need a web3 provider to allow us to talk to the blockchain. You can
read more about provders
`here <https://web3py.readthedocs.io/en/stable/providers.htm>`__.  In our
case, we are using our local node (ganache), we will connect to our provider
at http://localhost:8545.

>>> from web3 import HTTPProvider
>>> provider = HTTPProvider("http://localhost:8545")

**Declaring Decimals and Addresses**

Since we are dealing with a few contracts, we will specify them now to
reduce the syntax load. Fortunately for us, the 0x python packages comes
with a couple of contract addresses that can be useful to have at hand.
One thing that is important to remember is that there are no decimals in
the Ethereum virtual machine (EVM), which means you always need to keep
track of how many "decimals" each token possesses. Since we will sell some
ZRX for some ETH and since they both have 18 decimals, we can use a shared
constant.

>>> weth_address = NETWORK_TO_ADDRESSES[NetworkId.GANACHE].ether_token
>>> zrx_address = NETWORK_TO_ADDRESSES[NetworkId.GANACHE].zrx_token

**Approvals and WETH Balance**

To trade on 0x, the participants (maker and taker) require a small
amount of initial set up. They need to approve the 0x smart contracts
to move funds on their behalf. In order to give 0x protocol smart contract
access to funds, we need to set allowances (you can read about allowances
`here <https://tokenallowance.io/>`__).
In our demo the taker asset is WETH (or Wrapped ETH, you can read about WETH
`here <https://weth.io/>`__).,
as ETH is not an ERC20 token it must first be converted into WETH to be
used by 0x. Concretely, "converting" ETH to WETH means that we will deposit
some ETH in a smart contract acting as a ERC20 wrapper. In exchange of
depositing ETH, we will get some ERC20 compliant tokens called WETH at a
1:1 conversion rate. For example, depositing 10 ETH will give us back 10 WETH
and we can revert the process at any time.

>>> import pprint
>>> # Instantiate an instance of the erc20_wrapper with the provider
>>> erc20_wrapper = ERC20Token(provider)
>>> # For convience we can retrieve the accounts we can use directly
>>> # from our contract wrapper
>>> accounts = erc20_wrapper.get_accounts()
>>> pprint.pprint(accounts)
['0x5409ED021D9299bf6814279A6A1411A7e866A631',
 '0x6Ecbe1DB9EF729CBe972C83Fb886247691Fb6beb',
 '0xE36Ea790bc9d7AB70C55260C66D52b1eca985f84',
 '0xE834EC434DABA538cd1b9Fe1582052B880BD7e63',
 '0x78dc5D2D739606d31509C31d654056A45185ECb6',
 '0xA8dDa8d7F5310E4A9E24F8eBA77E091Ac264f872',
 '0x06cEf8E666768cC40Cc78CF93d9611019dDcB628',
 '0x4404ac8bd8F9618D27Ad2f1485AA1B2cFD82482D',
 '0x7457d5E02197480Db681D3fdF256c7acA21bDc12',
 '0x91c987bf62D25945dB517BDAa840A6c661374402']

The first account will be the maker, and the second account will be the taker
for the purposes of this demo.

>>> maker = accounts[0]
>>> taker = accounts[1]

Now we need to allow the 0x ERC20 Proxy to move WETH on behalf of our
maker and taker accounts. Let's let our maker and taker here approve
the 0x ERC20 Proxy an allowance of 100 WETH.

>>> # Multiplying by 10 ** 18 to account for decimals
>>> ALLOWANCE = (100) * 10 ** 18
>>> erc20_proxy = NETWORK_TO_ADDRESSES[NetworkId.GANACHE].erc20_proxy

>>> # Set allowance to the erc20_proxy from maker account
>>> tx = erc20_wrapper.approve(
...     weth_address,
...     erc20_proxy,
...     ALLOWANCE,
...     tx_params=TxParams(from_=maker),
... )
>>> # Check the allowance given to the 0x ERC20 Proxy
>>> maker_allowance = erc20_wrapper.allowance(
...     weth_address,
...     maker,
...     erc20_proxy,
... )
>>> (maker_allowance) // 10 ** 18
100

>>> # Set allowance to the erc20_proxy from taker account
>>> tx = erc20_wrapper.approve(
...     weth_address,
...     erc20_proxy,
...     ALLOWANCE,
...     tx_params=TxParams(from_=taker),
... )
>>> # Check the allowance given to the 0x ERC20 Proxy
>>> taker_allowance = erc20_wrapper.allowance(
...     weth_address,
...     taker,
...     erc20_proxy,
... )
>>> (taker_allowance) // 10 ** 18
100

To give our accounts some initial WETH balance, we'll need
to *wrap* some ETH to get WETH. The WETH token contract
contains two extra methods, not included in the ERC20 token
standard, so we will grab the ABI for the WETH Token contract
and call the deposit method to wrap our ETH. Here is how we do so.

>>> from zero_ex.contract_artifacts import abi_by_name
>>> # Converting 0.5 ETH to base unit wei
>>> deposit_amount = int(0.5 * 10 ** 18)

>>> # Let's have our maker wrap 1 ETH for 1 WETH
>>> tx = erc20_wrapper.execute_method(
... address=weth_address,
... abi=abi_by_name("WETH9"),
... method="deposit",
... tx_params=TxParams(from_=maker, value=deposit_amount))
>>> # Checking our maker's WETH balance
>>> maker_balance = erc20_wrapper.balance_of(
...     token_address=weth_address, owner_address=maker)
>>> (maker_balance) / 10 ** 18  # doctest: +SKIP
0.5

>>> # Let's have our taker wrap 0.5 ETH as well
>>> tx = erc20_wrapper.execute_method(
... address=weth_address,
... abi=abi_by_name("WETH9"),
... method="deposit",
... tx_params=TxParams(from_=taker, value=deposit_amount))
>>> # Checking our taker's WETH balance
>>> taker_balance = erc20_wrapper.balance_of(
...     token_address=weth_address, owner_address=taker)
>>> (taker_balance) / 10 ** 18  # doctest: +SKIP
0.5

Now we can trade our WETH tokens on 0x!

**Signing an order**

Here is an example of a JSON order previously generated by our maker
to sell 0.1 WETH. To confirm his intent to sell and recieve the described
token amounts in this order, our maker must first sign the order by
creating a signature with the given order data.

>>> maker
'0x5409ED021D9299bf6814279A6A1411A7e866A631'

>>> example_order = {
... 'makerAddress': '0x5409ed021d9299bf6814279a6a1411a7e866a631',
... 'takerAddress': '0x0000000000000000000000000000000000000000',
... 'senderAddress': '0x0000000000000000000000000000000000000000',
... 'exchangeAddress': '0x48bacb9266a570d521063ef5dd96e61686dbe788',
... 'feeRecipientAddress': '0x0000000000000000000000000000000000000000',
... 'makerAssetData': bytes.fromhex(
...     'f47261b0000000000000000000000000'
...     'c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'),
... 'takerAssetData': bytes.fromhex(
...     'f47261b0000000000000000000000000'
...     'c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'),
... 'salt': random.randint(1, 100000000000000000),
... 'makerFee': 0,
... 'takerFee': 0,
... 'makerAssetAmount': 100000000000000000,
... 'takerAssetAmount': 100000000000000000,
... 'expirationTimeSeconds': 999999999999999999999}

Please checkout our demo `here
<http://0x-demos-py.s3-website-us-east-1.amazonaws.com/>`__
if you would like to see how you can create an 0x order
with our python packages.

To sign this order, we first need to generate the order hash.

>>> order_hash = generate_order_hash_hex(
...     example_order, example_order["exchangeAddress"])

Now our maker can sign this order hash with our web3 provider and
the `sign_hash` function from the order utils package.

>>> maker_signature = sign_hash(
...     provider, to_checksum_address(maker), order_hash)

Now our maker can either deliver his signature and example order
directly to the taker, or he can choose to broadcast the order
with his signature to a 0x-relayer.

**Filling an order**

We finally have a valid order! We can now have our taker try
to fill the example order. The *takerAssetAmount* is simply the
amount of tokens (in our case WETH) the taker wants to fill.
For this demonstration, we will be completely filling the order.
Orders may also be partially filled.

Now let's fill the example order:

>>> # Instantiate an instance of the exchange_wrapper with
>>> # the provider
>>> zero_ex_exchange = Exchange(provider)
>>> tx_hash = zero_ex_exchange.fill_order(
...     order=example_order,
...     taker_amount=example_order["takerAssetAmount"],
...     signature=maker_signature,
...     tx_params=TxParams(from_=taker))

Once the transaction is mined, we can get the details of
our exchange through the exchange wrapper.

>>> fill_event = zero_ex_exchange.get_fill_event(tx_hash)
>>> taker_filled_amount = fill_event[0].args.takerAssetFilledAmount
>>> taker_filled_amount / 10 ** 18
0.1

**Cancelling an order**

Now we will show how to cancel an order if the maker no
long wishes to exchange his WETH tokens. We will use a second example
order to demonstrate.

>>> example_order_2 = {
... 'makerAddress': '0x5409ed021d9299bf6814279a6a1411a7e866a631',
... 'takerAddress': '0x0000000000000000000000000000000000000000',
... 'exchangeAddress': '0x4f833a24e1f95d70f028921e27040ca56e09ab0b',
... 'senderAddress': '0x0000000000000000000000000000000000000000',
... 'feeRecipientAddress': '0x0000000000000000000000000000000000000000',
... 'makerAssetData': bytes.fromhex(
...     'f47261b0000000000000000000000000'
...     'c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'),
... 'takerAssetData': bytes.fromhex(
...     'f47261b0000000000000000000000000'
...     'e41d2489571d322189246dafa5ebde1f4699f498'),
... 'salt': random.randint(1, 100000000000000000),
... 'makerFee': 0,
... 'takerFee': 0,
... 'makerAssetAmount': 1000000000000000000,
... 'takerAssetAmount': 500000000000000000000,
... 'expirationTimeSeconds': 999999999999999999999}
>>> tx_hash = zero_ex_exchange.cancel_order(
...     order=example_order_2, tx_params=TxParams(from_=maker))

Once the transaction is mined, we can get the details of
our cancellation through the exchange wrapper.

>>> cancel_event = zero_ex_exchange.get_cancel_event(tx_hash);
>>> cancelled_order_hash = cancel_event[0].args.orderHash.hex()

**Batching orders**

The 0x exchange contract can also process multiple orders at
the same time. Here is an example where the taker fills
two orders in one transaction.

>>> order_1 = {
... 'makerAddress': '0x5409ed021d9299bf6814279a6a1411a7e866a631',
... 'takerAddress': '0x0000000000000000000000000000000000000000',
... 'senderAddress': '0x0000000000000000000000000000000000000000',
... 'feeRecipientAddress': '0x0000000000000000000000000000000000000000',
... 'makerAssetData': bytes.fromhex(
...     'f47261b0000000000000000000000000'
...     'c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'),
... 'takerAssetData': bytes.fromhex(
...     'f47261b0000000000000000000000000'
...     'c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'),
... 'salt': random.randint(1, 100000000000000000),
... 'makerFee': 0,
... 'takerFee': 0,
... 'makerAssetAmount': 100,
... 'takerAssetAmount': 100,
... 'expirationTimeSeconds': 1000000000000000000}
>>> order_hash_1 = generate_order_hash_hex(
...     order_1, zero_ex_exchange.address)
>>> signature_1 = sign_hash(
...     provider, to_checksum_address(maker), order_hash_1)
>>> order_2 = {
... 'makerAddress': '0x5409ed021d9299bf6814279a6a1411a7e866a631',
... 'takerAddress': '0x0000000000000000000000000000000000000000',
... 'senderAddress': '0x0000000000000000000000000000000000000000',
... 'feeRecipientAddress': '0x0000000000000000000000000000000000000000',
... 'makerAssetData': bytes.fromhex(
...     'f47261b0000000000000000000000000'
...     'c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'),
... 'takerAssetData': bytes.fromhex(
...     'f47261b0000000000000000000000000'
...     'c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'),
... 'salt': random.randint(1, 100000000000000000),
... 'makerFee': 0,
... 'takerFee': 0,
... 'makerAssetAmount': 200,
... 'takerAssetAmount': 200,
... 'expirationTimeSeconds': 2000000000000000000}
>>> order_hash_2 = generate_order_hash_hex(
...     order_2, zero_ex_exchange.address)
>>> signature_2 = sign_hash(
...     provider, to_checksum_address(maker), order_hash_2)

Fill order_1 and order_2 together.

>>> tx_hash = zero_ex_exchange.batch_fill_orders(
...     orders=[order_1, order_2],
...     taker_amounts=[1, 2],
...     signatures=[signature_1, signature_2],
...     tx_params=TxParams(from_=taker))
"""

from .tx_params import TxParams
from .erc20_wrapper import ERC20Token
from .exchange_wrapper import Exchange
