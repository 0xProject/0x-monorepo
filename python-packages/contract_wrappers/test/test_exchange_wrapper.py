import random
import pytest
from eth_utils import remove_0x_prefix
from zero_ex.contract_wrappers.exchange_wrapper import ExchangeWrapper
from zero_ex.json_schemas import assert_valid
from zero_ex.order_utils import generate_order_hash_hex, Order, sign_hash


@pytest.fixture
def exchange_wrapper(ganache_provider):
    return ExchangeWrapper(provider=ganache_provider)


def create_test_order(
    current_time,
    maker_address,
    maker_asset_amount,
    maker_asset_data,
    taker_asset_amount,
    taker_asset_data,
):
    order: Order = {
        "makerAddress": maker_address.lower(),
        "takerAddress": "0x0000000000000000000000000000000000000000",
        "feeRecipientAddress": "0x0000000000000000000000000000000000000000",
        "senderAddress": "0x0000000000000000000000000000000000000000",
        "makerAssetAmount": maker_asset_amount,
        "takerAssetAmount": taker_asset_amount,
        "makerFee": 0,
        "takerFee": 0,
        "expirationTimeSeconds": current_time + 1000000000,
        "salt": random.randint(1, 1000000000),
        "makerAssetData": maker_asset_data,
        "takerAssetData": taker_asset_data,
    }
    return order


def assert_fill_log(fill_log, maker, taker, order, order_hash):
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
    current_time,
    exchange_wrapper,
    ganache_provider,
    get_tx_receipt,
    weth_asset_data,
):
    taker = accounts[0]
    maker = accounts[1]
    exchange_address = exchange_wrapper.exchange_address
    order = create_test_order(
        current_time, maker, 1, weth_asset_data, 1, weth_asset_data
    )
    order_hash = generate_order_hash_hex(
        order=order, exchange_address=exchange_address
    )
    order_signature = sign_hash(ganache_provider, maker, order_hash)

    transaction_hash = exchange_wrapper.fill_order(
        order=order,
        amount_in_wei=order["takerAssetAmount"],
        signature=order_signature,
        tx_opts={"from_": taker},
    )
    assert_valid(transaction_hash.hex(), "/hexSchema")

    reciept = get_tx_receipt(transaction_hash)
    fill_event = exchange_wrapper.get_fill_event(reciept)
    assert_fill_log(fill_event[0].args, maker, taker, order, order_hash)


def test_exchange_wrapper__batch_fill_orders(
    accounts,
    current_time,
    exchange_wrapper,
    ganache_provider,
    get_tx_receipt,
    weth_asset_data,
):
    taker = accounts[0]
    maker = accounts[1]
    exchange_address = exchange_wrapper.exchange_address
    orders = []
    order_1 = create_test_order(
        current_time, maker, 1, weth_asset_data, 1, weth_asset_data
    )
    order_2 = create_test_order(
        current_time, maker, 1, weth_asset_data, 1, weth_asset_data
    )
    orders.append(order_1)
    orders.append(order_2)
    order_hashes = [
        generate_order_hash_hex(order=order, exchange_address=exchange_address)
        for order in orders
    ]
    order_signatures = [
        sign_hash(ganache_provider, maker, order_hash)
        for order_hash in order_hashes
    ]

    fill_amounts = [order["takerAssetAmount"] for order in orders]
    transaction_hash = exchange_wrapper.batch_fill_orders(
        orders=orders,
        amounts_in_wei=fill_amounts,
        signatures=order_signatures,
        tx_opts={"from_": taker},
    )
    assert_valid(transaction_hash.hex(), "/hexSchema")

    reciept = get_tx_receipt(transaction_hash)
    fill_events = exchange_wrapper.get_fill_event(reciept)
    for index, order in enumerate(orders):
        assert_fill_log(
            fill_events[index].args, maker, taker, order, order_hashes[index]
        )
