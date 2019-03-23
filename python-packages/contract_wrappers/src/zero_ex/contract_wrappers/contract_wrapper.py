"""Lorem Ipsum

Lorem ipsum dolor sit amet, consectetur adipiscing elit,
sed do eiusmod tempor incididunt ut labore et dolore magna
aliqua. Ut enim ad minim veniam, quis nostrud exercitation
ullamco laboris nisi ut aliquip ex ea commodo consequat.
"""

from typing import Dict
from eth_utils import to_checksum_address
from web3 import Web3
from web3.providers.base import BaseProvider
from zero_ex.json_schemas import assert_valid


class ContractWrapper:
    """Lorem ipsum dolor sit amet, consectetur..."""

    def __init__(
        self,
        provider: BaseProvider,
        account_address: str = None,
        private_key: str = None,
    ):
        self._provider = provider
        self._web3 = Web3(provider)

        if (
            self._web3.eth.defaultAccount
            or len(self._web3.eth.accounts) is not 0
        ):
            self._can_send_tx = True
        else:
            if hasattr(
                self._web3, "middleware_stack"
            ) and self._web3.middleware_stack.get(
                "sign_and_send_raw_middleware"
            ):
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
                    self._web3.eth.account.privateKeyToAccount(
                        private_key
                    ).address
                )
                self._can_send_tx = True
            else:
                self._can_send_tx = False

    def _contract_instance(self, address, abi):
        return self._web3.eth.contract(
            address=to_checksum_address(address), abi=abi
        )

    def _validate_and_checksum_address(self, address: str):
        if not self._web3.isAddress(address):
            raise TypeError("Invalid address provided: {}".format(address))
        return to_checksum_address(address)

    def _invoke_function_call(self, func, tx_opts, validate_only):
        if validate_only or not self._can_send_tx:
            return func.call()

        prefilled_tx_params = self._get_tx_params(**tx_opts)
        # Bug in tx_data_schema, fails on checksummed address
        # assert_valid(prefilled_tx_params, "/txDataSchema")
        tx_params = {
            k: v for k, v in prefilled_tx_params.items() if v is not None
        }

        if hasattr(self, "_private_key"):
            return self._sign_and_send_raw_direct(func, tx_params)
        else:
            return func.transact(tx_params)

    def _get_tx_params(
        self, from_=None, gas_price=None, gas_limit=None, value=0, nonce=None
    ):
        return {
            "from": self._validate_and_checksum_address(from_)
            if from_
            else None,
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

    def execute_method(
        self, address, abi, method, args, tx_opts=None, validate_only=False
    ):
        contract_instance = self._contract_instance(address=address, abi=abi)
        if hasattr(contract_instance.functions, method):
            func = getattr(contract_instance.functions, method)(*args)
            return self._invoke_function_call(
                func=func, tx_opts=tx_opts, validate_only=validate_only
            )
        else:
            raise Exception(
                "No method {} found on contract {}.".format(address, method)
            )

    def get_accounts(self):
        return self._web3.eth.accounts

    def get_default_account(self):
        return self._web3.eth.defaultAccount or self.get_accounts()[0]
