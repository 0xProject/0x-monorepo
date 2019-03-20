import web3.exceptions
from eth_utils import to_checksum_address, remove_0x_prefix
from hexbytes import HexBytes
from web3 import Web3
from web3.providers.base import BaseProvider
from web3.utils import datatypes
from zero_ex.order_utils import Order, jsdict_order_to_struct
from zero_ex.contract_addresses import NETWORK_TO_ADDRESSES, NetworkId
from zero_ex.contract_artifacts import abi_by_name
from zero_ex.json_schemas import assert_valid


class ExchangeWrapper():
    def __init__(
        self,
        provider: BaseProvider,
        account_address: str = None,
    ):
        self._account = account_address
        self._web3_instance = Web3(provider)
        self._web3_instance.eth.defaultAccount = account_address
        self.exchange_address = to_checksum_address(
            NETWORK_TO_ADDRESSES[NetworkId(
                int(self._web3_instance.net.version))].exchange
        )
        self._exchange_instance = self._web3_instance.eth.contract(
            address=self.exchange_address,
            abi=abi_by_name("exchange")
        )

    def _send_transaction(
        self,
        func,
        tx_opts,
    ):

        if self._account and self._web3_instance.middlewares.get("sign_and_send_raw_middleware"):
            pre_tx_params = self._get_tx_params(**tx_opts)
            tx_params = {k: v for k,
                         v in pre_tx_params.items() if v is not None}
            return func.transact(tx_params)
        else:
            return func.call()

    def _get_tx_params(
        self,
        gas_price=None,
        gas_limit=None,
        value=0,
    ):
        return {
            "value": value,
            "gas": gas_limit,
            "gasPrice": gas_price
        }

    def fill_or_kill_order(
        self,
        order,
        taker_fill_amount,
        signature,
        tx_opts={},
    ):
        assert_valid(order, "/orderSchema")
        taker_fill_amount = int(taker_fill_amount)
        signature = bytes.fromhex(remove_0x_prefix(signature))
        order = jsdict_order_to_struct(order)
        func = self._exchange_instance.functions.fillOrKillOrder(
            order,
            taker_fill_amount,
            signature,
        )
        return self._send_transaction(func=func, tx_opts=tx_opts)

    # def batch_fill_orders(
    #     signed_orders,
    #     taker_asset_fill_amounts,
    #     taker_address,
    #     order_transaction_opts
    # ):
    # signatures = [x.signature for x in signed_orders]
    # func = self._exchange_instance.functions.batchFillOrders(
    #     signed_orders, taker_asset_fill_amounts, signatures
    # )
    # return _send_transaction(func, gas_price, gas_limit)
