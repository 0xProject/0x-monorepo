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
    current_time, maker_address, maker_asset_data, taker_asset_data
):
    order: Order = {
        "makerAddress": maker_address.lower(),
        "takerAddress": "0x0000000000000000000000000000000000000000",
        "feeRecipientAddress": "0x0000000000000000000000000000000000000000",
        "senderAddress": "0x0000000000000000000000000000000000000000",
        "makerAssetAmount": 2,
        "takerAssetAmount": 2,
        "makerFee": 0,
        "takerFee": 0,
        "expirationTimeSeconds": current_time + 1000000000,
        "salt": random.randint(1, 1000000000),
        "makerAssetData": maker_asset_data,
        "takerAssetData": taker_asset_data,
    }
    return order


def test_exchange_wrapper__fill_order(
    accounts,
    current_time,
    exchange_wrapper,
    ganache_provider,
    get_tx_receipt,
    weth_asset_data,
    zrx_asset_data,
):
    taker = accounts[0]
    maker = accounts[1]
    exchange_address = exchange_wrapper.exchange_address
    order = create_test_order(
        current_time, maker, zrx_asset_data, weth_asset_data
    )
    order_hash = generate_order_hash_hex(
        order=order, exchange_address=exchange_address
    )
    order_signature = sign_hash(ganache_provider, maker, order_hash)

    transaction_hash = exchange_wrapper.fill_order(
        order=order,
        taker_fill_amount=order["takerAssetAmount"],
        signature=order_signature,
        tx_opts={"from_": taker},
    )
    assert_valid(transaction_hash.hex(), "/hexSchema")
    reciept = get_tx_receipt(transaction_hash)
    fill_event = exchange_wrapper.get_fill_event(reciept)
    fill_log = fill_event[0].args

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
