"""Base wrapper class for accessing ethereum smart contracts."""

from typing import Any

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


class ContractMethod:
    """Base class for wrapping an Ethereum smart contract method."""

    def __init__(
        self,
        provider: BaseProvider,
        contract_address: str,
        validator: ValidatorBase = None,
        private_key: str = None,
    ):
        """Instantiate the object.

        :param provider: Instance of :class:`web3.providers.base.BaseProvider`
        :param contract_address: Where the contract has been deployed to.
        :param validator: Used to validate method inputs.
        :param private_key: If specified, transactions will be signed locally,
            via Web3.py's `eth.account.signTransaction()`:code:, before being
            sent via `eth.sendRawTransaction()`:code:.
        """
        self._provider = provider
        self._private_key = private_key
        self._web3 = Web3(provider)
        self._web3_eth = self._web3.eth  # pylint: disable=no-member
        self.contract_address = self.validate_and_checksum_address(
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

    def validate_and_checksum_address(self, address: str):
        """Validate the given address, and return it's checksum address."""
        if not self._web3.isAddress(address):
            raise TypeError("Invalid address provided: {}".format(address))
        return to_checksum_address(address)

    def normalize_tx_params(self, tx_params) -> TxParams:
        """Normalize and return the given transaction parameters."""
        if not tx_params:
            tx_params = TxParams()
        if not tx_params.from_:
            tx_params.from_ = (
                self._web3_eth.defaultAccount or self._web3_eth.accounts[0]
            )
        tx_params.from_ = self.validate_and_checksum_address(tx_params.from_)
        return tx_params

    def invoke_send_transaction(self, func, tx_params):
        """Invoke the given contract method."""
        if not self._can_send_tx:
            raise Exception(
                "Cannot send transaction because no local private_key"
                " or account found."
            )
        tx_params = self.normalize_tx_params(tx_params)
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

