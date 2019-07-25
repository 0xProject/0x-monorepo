"""Base wrapper class for accessing ethereum smart contracts."""

from typing import Any, Dict, Optional, Union

from eth_utils import to_checksum_address
from web3 import Web3
from web3.providers.base import BaseProvider

from .tx_params import TxParams


class ValidatorBase:
    """Base class for validating inputs to methods."""

    def __init__(
        self,
        provider: BaseProvider,
        contract_address: str,
        private_key: str = None,
    ):
        """Initialize the instance."""

    def assert_valid(
        self, method_name: str, parameter_name: str, argument_value: Any
    ):
        """Raise an exception if method input is not valid.

        :param method_name: Name of the method whose input is to be validated.
        :param parameter_name: Name of the parameter whose input is to be
            validated.
        :param argument_value: Value of argument to parameter to be validated.
        """


class BaseContractWrapper:
    """Base class for wrapping ethereum smart contracts.

    It provides functionality for instantiating a contract instance,
    calling view functions, and calling functions which require
    transactions.
    """

    def __init__(
        self,
        provider: BaseProvider,
        contract_address: str,
        validator: ValidatorBase = None,
        private_key: str = None,
    ):
        """Create an instance of BaseContractWrapper.

        :param provider: instance of :class:`web3.providers.base.BaseProvider`
        :param private_key: If specified, transactions will be signed locally,
            via Web3.py's `eth.account.signTransaction()`:code:, before being
            sent via `eth.sendRawTransaction()`:code:.
        """
        self._provider = provider
        self._private_key = private_key
        self._web3 = Web3(provider)
        self._web3_eth = self._web3.eth  # pylint: disable=no-member
        self.contract_address = self._validate_and_checksum_address(
            contract_address
        )
        if validator is None:
            validator = ValidatorBase(provider, contract_address, private_key)
        self.validator = validator

        self._can_send_tx = False
        if self._web3_eth.defaultAccount or self._web3_eth.accounts:
            self._can_send_tx = True
        else:
            middleware_stack = getattr(self._web3, "middleware_stack")
            if middleware_stack.get("sign_and_send_raw_middleware"):
                self._can_send_tx = True
            elif private_key:
                self._private_key = private_key
                self._web3_eth.defaultAccount = to_checksum_address(
                    self._web3_eth.account.privateKeyToAccount(
                        private_key
                    ).address
                )
                self._can_send_tx = True

    def _contract_instance(self, address: str, abi: dict):
        """Get a contract instance.

        :param address: string address of contract
        :param abi: dict contract ABI

        :returns: instance of contract
        """
        return self._web3_eth.contract(
            address=to_checksum_address(address), abi=abi
        )

    def _validate_and_checksum_address(self, address: str):
        if not self._web3.isAddress(address):
            raise TypeError("Invalid address provided: {}".format(address))
        return to_checksum_address(address)

    def _invoke_function_call(self, func, tx_params, view_only):
        if view_only:
            return func.call()
        if not self._can_send_tx:
            raise Exception(
                "Cannot send transaction because no local private_key"
                " or account found."
            )
        if not tx_params:
            tx_params = TxParams()
        if not tx_params.from_:
            tx_params.from_ = (
                self._web3_eth.defaultAccount or self._web3_eth.accounts[0]
            )
        tx_params.from_ = self._validate_and_checksum_address(tx_params.from_)
        if self._private_key:
            res = self._sign_and_send_raw_direct(func, tx_params)
        else:
            res = func.transact(tx_params.as_dict())
        return res

    def _sign_and_send_raw_direct(self, func, tx_params):
        transaction = func.buildTransaction(tx_params.as_dict())
        signed_tx = self._web3_eth.account.signTransaction(
            transaction, private_key=self._private_key
        )
        return self._web3_eth.sendRawTransaction(signed_tx.rawTransaction)

    # pylint: disable=too-many-arguments
    def execute_method(
        self,
        abi: dict,
        method: str,
        args: Optional[Union[list, tuple]] = None,
        tx_params: Optional[TxParams] = None,
        view_only: bool = False,
    ) -> str:
        """Execute the method on a contract instance.

        :param abi: dict of contract ABI
        :param method: string name of method to call
        :param args: default None, list or tuple of arguments for the method
        :param tx_params: default None, :class:`TxParams` transaction params
        :param view_only: default False, boolean of whether the transaction
            should only be validated.

        :returns: str of transaction hash
        """
        contract_instance = self._contract_instance(
            address=self.contract_address, abi=abi
        )
        if args is None:
            args = []
        if hasattr(contract_instance.functions, method):
            func = getattr(contract_instance.functions, method)(*args)
            return self._invoke_function_call(
                func=func, tx_params=tx_params, view_only=view_only
            )
        raise Exception(
            "No method {} found on contract {}.".format(
                self.contract_address, method
            )
        )

    @staticmethod
    def abi() -> Dict[Any, Any]:
        """Return the ABI to the underlying contract."""
