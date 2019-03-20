import web3.exceptions
from eth_utils import to_checksum_address, remove_0x_prefix
from web3 import Web3
from web3.providers.base import BaseProvider
from web3.utils import datatypes
from zero_ex.order_utils import (
    generate_order_hash_hex,
    is_valid_signature,
    jsdict_order_to_struct,
    Order,
)
from zero_ex.contract_addresses import NETWORK_TO_ADDRESSES, NetworkId
from zero_ex.contract_artifacts import abi_by_name
from zero_ex.json_schemas import assert_valid


class ExchangeWrapper:
    def __init__(
        self,
        provider: BaseProvider,
        account_address: str = None,
        private_key: str = None,
    ):
        self._web3 = Web3(provider)
        self._exchange_address = NETWORK_TO_ADDRESSES[
            NetworkId(int(self._web3.net.version))
        ].exchange
        self._exchange_instance = self._web3.eth.contract(
            address=to_checksum_address(self._exchange_address),
            abi=abi_by_name("exchange"),
        )

        if self._web3.eth.defaultAccount:
            self._can_send_tx = True
        else:
            if hasattr(
                self._web3, "middlewares"
            ) and self._web3.middlewares.get("sign_and_send_raw_middleware"):
                if account_address:
                    self._web3.eth.defaultAccount = to_checksum_address(
                        account_address
                    )
                    self._can_send_tx = True
                else:
                    raise Exception(
                        "Please provide your wallet address associated\
                        with your private key to use the\
                        sign_and_send_raw_middleware"
                    )
            elif private_key:
                self._private_key = private_key
                self._web3.eth.defaultAccount = to_checksum_address(
                    self._web3.eth.account.privateKeyToAccount(private_key)
                )
                self._can_send_tx = True
            else:
                self._can_send_tx = False

    def get_account(self):
        return self._web3.eth.defaultAccount

    def _invoke_function_call(self, func, tx_opts, validate_only=False):
        if validate_only or not self._can_send_tx:
            return func.call()

        prefill_tx_params = self._get_tx_params(**tx_opts)
        tx_params = {k: v for k, v in prefill_tx_params.items() if v is not None}

        if self._private_key:
            return self._sign_and_send_raw_direct(func, tx_params)
        else:
            return func.transact(tx_params)

    def _get_tx_params(
        self, from_=None, gas_price=None, gas_limit=None, value=0, nonce=None
    ):
        return {
            "from": from_,
            "value": value,
            "gas": gas_limit,
            "gasPrice": gas_price,
            "nonce": nonce,
        }

    def _sign_and_send_raw_direct(self, func, tx_params):
        transaction = func.buildTransaction(tx_params)
        signed_tx = self._web3.eth.account.signTransaction(
            transaction, private_key=self._private_key
        )
        return self._web3.eth.sendRawTransaction(signed_tx.rawTransaction)

    def fill_or_kill_order(
        self,
        order: Order,
        taker_fill_amount,
        signature,
        tx_opts={},
        validate_only=False,
    ):
        assert_valid(order, "/orderSchema")
        is_valid_signature(
            self._web3,
            generate_order_hash_hex(order),
            signature,
            order.makerAddress,
        )
        taker_fill_amount = int(taker_fill_amount)
        signature = bytes.fromhex(remove_0x_prefix(signature))
        order = jsdict_order_to_struct(order)
        func = self._exchange_instance.functions.fillOrKillOrder(
            order, taker_fill_amount, signature
        )
        return self._invoke_function_call(
            func=func, tx_opts=tx_opts, validate_only=validate_only
        )

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
