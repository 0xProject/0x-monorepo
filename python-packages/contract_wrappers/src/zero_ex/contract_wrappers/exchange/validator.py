"""Validate inputs to the Exchange contract."""

from typing import Any

from web3.providers.base import BaseProvider

from zero_ex import json_schemas

from ..bases import ValidatorBase
from .types import order_to_jsdict


class ExchangeValidator(ValidatorBase):
    """Validate inputs to Exchange methods."""

    def __init__(
        self,
        provider: BaseProvider,
        contract_address: str,
        private_key: str = None,
    ):
        """Initialize the class."""
        super().__init__(provider, contract_address, private_key)
        self.contract_address = contract_address

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
                order_to_jsdict(argument_value, self.contract_address),
                "/orderSchema",
            )

        if parameter_name == "orders":
            for order in argument_value:
                json_schemas.assert_valid(
                    order_to_jsdict(order, self.contract_address),
                    "/orderSchema",
                )
