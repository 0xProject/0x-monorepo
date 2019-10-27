"""Validate inputs to the Exchange contract."""

from typing import Any, Union

from web3 import Web3
from web3.providers.base import BaseProvider

from zero_ex import json_schemas
from zero_ex.contract_wrappers.order_conversions import order_to_jsdict

from ..bases import Validator


class ExchangeValidator(Validator):
    """Validate inputs to Exchange methods."""

    def __init__(
        self,
        web3_or_provider: Union[Web3, BaseProvider],
        contract_address: str,
    ):
        """Initialize the class."""
        super().__init__(web3_or_provider, contract_address)

        web3 = None
        if isinstance(web3_or_provider, BaseProvider):
            web3 = Web3(web3_or_provider)
        elif isinstance(web3_or_provider, Web3):
            web3 = web3_or_provider
        if web3 is None:
            raise TypeError(
                "Expected parameter 'web3_or_provider' to be an instance of either"
                + " Web3 or BaseProvider"
            )

        self.contract_address = contract_address
        self.chain_id = web3.eth.chainId

    def assert_valid(
        self, method_name: str, parameter_name: str, argument_value: Any
    ) -> None:
        """Raise an exception if method input is not valid.

        :param method_name: Name of the method whose input is to be validated.
        :param parameter_name: Name of the parameter whose input is to be
            validated.
        :param argument_value: Value of argument to parameter to be validated.
        """
        if parameter_name == "order":
            json_schemas.assert_valid(
                order_to_jsdict(
                    argument_value, self.chain_id, self.contract_address
                ),
                "/orderSchema",
            )

        if parameter_name == "orders":
            for order in argument_value:
                json_schemas.assert_valid(
                    order_to_jsdict(
                        order, self.chain_id, self.contract_address
                    ),
                    "/orderSchema",
                )
