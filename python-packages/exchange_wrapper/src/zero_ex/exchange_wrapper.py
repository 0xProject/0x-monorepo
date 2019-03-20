from eth_utils import to_checksum_address
from web3 import web3
import web3.exceptions
from web3.providers.base import BaseProvider
from web3.utils import datatypes
from zero_ex.contract_addresses import NETWORK_TO_ADDRESSES, NetworkId
from zero_ex.constract_artifcats import abi_by_name
from zero_ex.json_schemas import assert_valid

class ExchangeWrapper():
    def __init__(
        self, provider, network_id 
    ):
        self._web3_instance = Web3(provider)
        self.exchange_address_checksumed = to_checksum_address(
            NETWORK_TO_ADDRESSES[NetworkId(int(self._web3_instance.net.version))].exchange
        )
        self._exchange_instance = self._web3_instance(
            address=self.exchange_address_checksumed,
            abi=abi_by_name("exchange")
        )

    def _send_transaction(self, func, gas_price, gas_limit, value=0):
        tx_params = _get_tx_params(gas_price=gas_price, gas_limit=gas_limit, value=value)
        return func.transact(tx_params)

    def _get_tx_params(self, gas_price, gas_limit, value):
        return {
            "value": value,
            "gas": gas_limit,
            "gasPrice": gas_price
        }

    def fill_or_kill_order(
        order,
        taker_fill_amount,
        signature,
        gas_price=15000000000,
        gas_limit=150000,
    ):
        assert_valid(order, "/order_schema")
        func = self._exchange_instance.functions.fillOrKillOrder(
            order,
            taker_fill_amount,
            signature    
        )
        return _send_transaction(func, gas_price, gas_limit)

    def batch_fill_orders(
        signed_orders,
        taker_asset_fill_amounts,
        taker_address,
        order_transaction_opts
    ):
        signatures = [x.signature for x in signed_orders]
        func = self._exchange_instance.functions.batchFillOrders(
            signed_orders, taker_asset_fill_amounts, signatures
        )
        return _send_transaction(func, gas_price, gas_limit)
        