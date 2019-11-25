"""Test 0x Exchnage wrapper."""

import random

import pytest
from eth_utils import remove_0x_prefix
from web3 import Web3

from zero_ex.contract_addresses import NETWORK_TO_ADDRESSES, NetworkId
from zero_ex.contract_wrappers import TxParams
from zero_ex.contract_wrappers.exchange import Exchange
from zero_ex.contract_wrappers.exchange.types import Order
from zero_ex.json_schemas import assert_valid
from zero_ex.order_utils import generate_order_hash_hex, sign_hash_to_bytes


@pytest.fixture(scope="module")
def exchange_wrapper(ganache_provider):
    """Get an Exchange wrapper instance."""
    return Exchange(
        provider=ganache_provider,
        contract_address=NETWORK_TO_ADDRESSES[NetworkId.GANACHE].exchange,
    )


def create_test_order(
    maker_address,
    maker_asset_amount,
    maker_asset_data,
    taker_asset_amount,
    taker_asset_data,
):
    """Create a test order."""
    order = Order(
        makerAddress=maker_address,
        takerAddress="0x0000000000000000000000000000000000000000",
        feeRecipientAddress="0x0000000000000000000000000000000000000000",
        senderAddress="0x0000000000000000000000000000000000000000",
        makerAssetAmount=maker_asset_amount,
        takerAssetAmount=taker_asset_amount,
        makerFee=0,
        takerFee=0,
        expirationTimeSeconds=100000000000000,
        salt=random.randint(1, 1000000000),
        makerAssetData=maker_asset_data,
        takerAssetData=taker_asset_data,
    )
    return order


def assert_fill_log(fill_log, maker, taker, order, order_hash):
    """assert that the fill log matches the order details"""
    assert fill_log.makerAddress == maker
    assert fill_log.takerAddress == taker
    assert fill_log.feeRecipientAddress == order["feeRecipientAddress"]
    assert fill_log.senderAddress == taker
    assert fill_log.orderHash == bytes.fromhex(remove_0x_prefix(order_hash))
    assert fill_log.makerAssetFilledAmount == order["makerAssetAmount"]
    assert fill_log.takerAssetFilledAmount == order["takerAssetAmount"]
    assert fill_log.makerFeePaid == order["makerFee"]
    assert fill_log.takerFeePaid == order["takerFee"]
    assert fill_log.makerAssetData == order["makerAssetData"]
    assert fill_log.takerAssetData == order["takerAssetData"]


def test_exchange_wrapper__fill_order(
    accounts,
    exchange_wrapper,  # pylint: disable=redefined-outer-name
    ganache_provider,
    weth_asset_data,
):
    """Test filling an order."""
    taker = accounts[0]
    maker = accounts[1]
    exchange_address = exchange_wrapper.contract_address
    order = create_test_order(maker, 1, weth_asset_data, 1, weth_asset_data)
    order_hash = generate_order_hash_hex(
        order=order, exchange_address=exchange_address
    )
    order_signature = sign_hash_to_bytes(ganache_provider, maker, order_hash)

    tx_hash = exchange_wrapper.fill_order.send_transaction(
        order=order,
        taker_asset_fill_amount=order["takerAssetAmount"],
        signature=order_signature,
        tx_params=TxParams(from_=taker),
    )
    assert_valid(tx_hash.hex(), "/hexSchema")

    fill_event = exchange_wrapper.get_fill_event(tx_hash)
    assert_fill_log(fill_event[0].args, maker, taker, order, order_hash)


def test_exchange_wrapper__fill_order__build_then_send(
    accounts,
    exchange_wrapper,  # pylint: disable=redefined-outer-name
    ganache_provider,
    weth_asset_data,
):
    """Test filling an order."""
    taker = accounts[0]
    maker = accounts[1]
    exchange_address = exchange_wrapper.contract_address
    order = create_test_order(maker, 1, weth_asset_data, 1, weth_asset_data)
    order_hash = generate_order_hash_hex(
        order=order, exchange_address=exchange_address
    )
    order_signature = sign_hash_to_bytes(ganache_provider, maker, order_hash)

    tx_hash = Web3(ganache_provider).eth.sendTransaction(
        exchange_wrapper.fill_order.build_transaction(
            order=order,
            taker_asset_fill_amount=order["takerAssetAmount"],
            signature=order_signature,
            tx_params=TxParams(from_=taker),
        )
    )

    assert_valid(tx_hash.hex(), "/hexSchema")

    fill_event = exchange_wrapper.get_fill_event(tx_hash)
    assert_fill_log(fill_event[0].args, maker, taker, order, order_hash)


def test_exchange_wrapper__fill_order__without_from_tx_param(
    accounts,
    exchange_wrapper,  # pylint: disable=redefined-outer-name
    ganache_provider,
    weth_asset_data,
):
    """Test filling an order."""
    maker = accounts[1]
    exchange_address = exchange_wrapper.contract_address
    order = create_test_order(maker, 1, weth_asset_data, 1, weth_asset_data)
    order_hash = generate_order_hash_hex(
        order=order, exchange_address=exchange_address
    )
    order_signature = sign_hash_to_bytes(ganache_provider, maker, order_hash)

    exchange_wrapper._web3_eth.defaultAccount = (  # pylint: disable=protected-access
        None
    )
    exchange_wrapper._web3_eth.accounts.clear()  # pylint: disable=protected-access

    built_tx = exchange_wrapper.fill_order.build_transaction(
        order=order,
        taker_asset_fill_amount=order["takerAssetAmount"],
        signature=order_signature,
    )
    assert (
        built_tx["data"][:825]
        == "0xb4be83d50000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000002a00000000000000000000000006ecbe1db9ef729cbe972c83fb886247691fb6beb000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005af3107a400000000000000000000000000000000000000000000000000"
    )


# pylint: disable=too-many-locals
def test_exchange_wrapper__batch_fill_orders(
    accounts,
    exchange_wrapper,  # pylint: disable=redefined-outer-name
    ganache_provider,
    weth_asset_data,
):
    """Test filling a batch of orders."""
    taker = accounts[0]
    maker = accounts[1]
    exchange_address = exchange_wrapper.contract_address
    orders = []
    order_1 = create_test_order(maker, 1, weth_asset_data, 1, weth_asset_data)
    order_2 = create_test_order(maker, 1, weth_asset_data, 1, weth_asset_data)
    orders.append(order_1)
    orders.append(order_2)
    order_hashes = [
        generate_order_hash_hex(order=order, exchange_address=exchange_address)
        for order in orders
    ]
    order_signatures = [
        sign_hash_to_bytes(ganache_provider, maker, order_hash)
        for order_hash in order_hashes
    ]
    taker_amounts = [order["takerAssetAmount"] for order in orders]
    tx_hash = exchange_wrapper.batch_fill_orders.send_transaction(
        orders=orders,
        taker_asset_fill_amounts=taker_amounts,
        signatures=order_signatures,
        tx_params=TxParams(from_=taker),
    )
    assert_valid(tx_hash.hex(), "/hexSchema")

    fill_events = exchange_wrapper.get_fill_event(tx_hash)
    for index, order in enumerate(orders):
        assert_fill_log(
            fill_events[index].args, maker, taker, order, order_hashes[index]
        )
