"""Test 0x Exchnage wrapper."""

import random

import pytest
from eth_utils import remove_0x_prefix

from zero_ex.contract_addresses import network_to_addresses, NetworkId
from zero_ex.contract_wrappers import TxParams
from zero_ex.contract_wrappers.exchange import Exchange
from zero_ex.contract_wrappers.exchange.types import Order
from zero_ex.json_schemas import assert_valid
from zero_ex.order_utils import (
    asset_data_utils,
    generate_order_hash_hex,
    sign_hash,
)


@pytest.fixture(scope="module")
def exchange_wrapper(ganache_provider):
    """Get an Exchange wrapper instance."""
    return Exchange(
        web3_or_provider=ganache_provider,
        contract_address=network_to_addresses(NetworkId.GANACHE).exchange,
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
        makerFeeAssetData=asset_data_utils.encode_erc20("0x" + "00" * 20),
        takerFeeAssetData=asset_data_utils.encode_erc20("0x" + "00" * 20),
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
    zrx_asset_data,
):
    """Test filling an order."""
    taker = accounts[0]
    maker = accounts[1]
    exchange_address = exchange_wrapper.contract_address
    order = create_test_order(maker, 1, weth_asset_data, 1, zrx_asset_data)
    order_hash = generate_order_hash_hex(
        order=order, exchange_address=exchange_address, chain_id=1337
    )
    order_signature = sign_hash(ganache_provider, maker, order_hash)

    fill_results = exchange_wrapper.fill_order.call(
        order=order,
        taker_asset_fill_amount=order["takerAssetAmount"],
        signature=order_signature,
        tx_params=TxParams(from_=taker),
    )
    assert fill_results[0] == 1
    assert fill_results[1] == 1
    assert fill_results[2] == 0
    assert fill_results[3] == 0
    assert fill_results[4] == 0

    tx_hash = exchange_wrapper.fill_order.send_transaction(
        order=order,
        taker_asset_fill_amount=order["takerAssetAmount"],
        signature=order_signature,
        tx_params=TxParams(from_=taker),
    )
    assert_valid(tx_hash.hex(), "/hexSchema")

    fill_event = exchange_wrapper.get_fill_event(tx_hash)
    assert_fill_log(fill_event[0].args, maker, taker, order, order_hash)


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
        generate_order_hash_hex(
            order=order, exchange_address=exchange_address, chain_id=1337
        )
        for order in orders
    ]
    order_signatures = [
        sign_hash(ganache_provider, maker, order_hash)
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


def test_two_instantiations_with_web3_objects(web3_instance):
    """Test that instantiating two Exchange objects doesn't raise.

    When instantiating an Exchange object with a web3 client (rather than a
    provider) there was a bug encountered where web3.py was giving an error
    when trying to install the rich-revert-handling middleware on the web3
    client, an error saying "can't install this same middleware instance
    again."  Test that that bug isn't occurring.
    """
    exchange = Exchange(  # pylint: disable=unused-variable
        web3_instance, network_to_addresses(NetworkId.GANACHE).exchange
    )
    exchange2 = Exchange(  # pylint: disable=unused-variable
        web3_instance, network_to_addresses(NetworkId.GANACHE).exchange
    )
