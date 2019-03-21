import pytest
import random
from zero_ex.contract_wrappers.exchange_wrapper import ExchangeWrapper
from zero_ex.json_schemas import assert_valid
from zero_ex.order_utils import (
    generate_order_hash_hex,
    Order,
    order_to_jsdict,
    sign_hash
)

@pytest.fixture
def exchange_wrapper_with_ganache(ganache_provider, local_private_key_1):
    return ExchangeWrapper(
        provider=ganache_provider,
        private_key=local_private_key_1
    )

def create_test_order(maker_address, maker_asset_data, taker_asset_data):
    order: Order = {
        "makerAddress": maker_address,
        "takerAddress": "0x0000000000000000000000000000000000000000",
        "feeRecipientAddress": "0x0000000000000000000000000000000000000000",
        "senderAddress": "0x0000000000000000000000000000000000000000",
        "makerAssetAmount": 1000000000000000000,
        "takerAssetAmount": 1000000000000000000,
        "makerFee": 0,
        "takerFee": 0,
        "expirationTimeSeconds": 1000000000,
        "salt": random.randint(1, 1000000000),
        "makerAssetData": maker_asset_data,
        "takerAssetData": taker_asset_data,
    }
    return order


def test_exchange_wrapper__fill_or_kill_order(
    exchange_wrapper_with_ganache, 
    ganache_provider, 
    local_account_2,
    weth_asset_data_ganache,
    zrx_asset_data_ganache,
):
    exchange_address = exchange_wrapper_with_ganache.exchange_address()
    order: Order = create_test_order(
        local_account_2.lower(), weth_asset_data_ganache, zrx_asset_data_ganache
    )
    order_hash = generate_order_hash_hex(order=order, exchange_address=exchange_address)
    order_signature = sign_hash(ganache_provider, local_account_2, order_hash)
    transaction = exchange_wrapper_with_ganache.fill_or_kill_order(
        order, 0, order_signature,
    )
    print(transaction)
    assert transaction == 1