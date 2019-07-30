"""Base wrapper class for accessing ethereum smart contracts."""

from typing import Any

from eth_utils import is_address, to_checksum_address
from web3 import Web3
from web3.providers.base import BaseProvider

from .tx_params import TxParams


class Validator:
    """Base class for validating inputs to methods."""

    def __init__(self, provider: BaseProvider, contract_address: str):
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
        validator: Validator = None,
    ):
        """Instantiate the object.

        :param provider: Instance of :class:`web3.providers.base.BaseProvider`
        :param contract_address: Where the contract has been deployed to.
        :param validator: Used to validate method inputs.
        """
        self._web3_eth = Web3(provider).eth  # pylint: disable=no-member
        if validator is None:
            validator = Validator(provider, contract_address)
        self.validator = validator

    @staticmethod
    def validate_and_checksum_address(address: str):
        """Validate the given address, and return it's checksum address."""
        if not is_address(address):
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
