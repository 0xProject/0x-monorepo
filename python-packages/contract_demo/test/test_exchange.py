"""Test calling methods on the Exchange contract."""

from eth_utils import to_checksum_address
from web3 import Web3
from web3.utils import datatypes

from zero_ex.contract_addresses import NETWORK_TO_ADDRESSES, NetworkId
import zero_ex.contract_artifacts
from zero_ex.json_schemas import assert_valid
from zero_ex.order_utils import (
    Order,
    OrderInfo,
    order_to_jsdict,
    generate_order_hash_hex,
)


def test_get_order_info():
    """Demonstrate Exchange.getOrderInfo()."""
    order: Order = {
        "makerAddress": "0x0000000000000000000000000000000000000000",
        "takerAddress": "0x0000000000000000000000000000000000000000",
        "feeRecipientAddress": "0x0000000000000000000000000000000000000000",
        "senderAddress": "0x0000000000000000000000000000000000000000",
        "makerAssetAmount": 1000000000000000000,
        "takerAssetAmount": 1000000000000000000,
        "makerFee": 0,
        "takerFee": 0,
        "expirationTimeSeconds": 12345,
        "salt": 12345,
        "makerAssetData": (b"\x00") * 20,
        "takerAssetData": (b"\x00") * 20,
    }

    web3_instance = Web3(Web3.HTTPProvider("http://127.0.0.1:8545"))

    # false positive from pylint: disable=no-member
    contract_address = NETWORK_TO_ADDRESSES[
        NetworkId(int(web3_instance.net.version))
    ].exchange

    assert_valid(
        order_to_jsdict(order, exchange_address=contract_address),
        "/orderSchema",
    )

    # false positive from pylint: disable=no-member
    exchange: datatypes.Contract = web3_instance.eth.contract(
        address=to_checksum_address(contract_address),
        abi=zero_ex.contract_artifacts.abi_by_name("Exchange"),
    )

    order_info = OrderInfo(*exchange.call().getOrderInfo(order))

    assert isinstance(order_info.order_status, int)
    assert order_info.order_status == 4

    assert isinstance(order_info.order_hash, bytes)
    assert order_info.order_hash.hex() == generate_order_hash_hex(
        order,
        exchange_address=NETWORK_TO_ADDRESSES[NetworkId.GANACHE].exchange,
    )

    assert isinstance(order_info.order_taker_asset_filled_amount, int)
    assert order_info.order_taker_asset_filled_amount == 0


def test_get_orders_info():
    """Demonstrate Exchange.getOrderInfo()."""
    order: Order = {
        "makerAddress": "0x0000000000000000000000000000000000000000",
        "takerAddress": "0x0000000000000000000000000000000000000000",
        "feeRecipientAddress": "0x0000000000000000000000000000000000000000",
        "senderAddress": "0x0000000000000000000000000000000000000000",
        "makerAssetAmount": 1000000000000000000,
        "takerAssetAmount": 1000000000000000000,
        "makerFee": 0,
        "takerFee": 0,
        "expirationTimeSeconds": 12345,
        "salt": 12345,
        "makerAssetData": (b"\x00") * 20,
        "takerAssetData": (b"\x00") * 20,
    }

    web3_instance = Web3(Web3.HTTPProvider("http://127.0.0.1:8545"))

    # false positive from pylint: disable=no-member
    contract_address = NETWORK_TO_ADDRESSES[
        NetworkId(int(web3_instance.net.version))
    ].exchange

    assert_valid(
        order_to_jsdict(order, exchange_address=contract_address),
        "/orderSchema",
    )

    # false positive from pylint: disable=no-member
    exchange: datatypes.Contract = web3_instance.eth.contract(
        address=to_checksum_address(contract_address),
        abi=zero_ex.contract_artifacts.abi_by_name("Exchange"),
    )

    orders_info = exchange.call().getOrdersInfo([order])

    for order_info in orders_info:
        order_info = OrderInfo(*order_info)
        assert isinstance(order_info.order_status, int)
        assert order_info.order_status == 4

        assert isinstance(order_info.order_hash, bytes)
        assert order_info.order_hash.hex() == generate_order_hash_hex(
            order,
            exchange_address=NETWORK_TO_ADDRESSES[NetworkId.GANACHE].exchange,
        )

        assert isinstance(order_info.order_taker_asset_filled_amount, int)
        assert order_info.order_taker_asset_filled_amount == 0
