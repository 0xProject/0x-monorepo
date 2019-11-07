"""Generated wrapper for TestLibDummy Solidity contract."""

# pylint: disable=too-many-arguments

import json
from typing import (  # pylint: disable=unused-import
    Any,
    List,
    Optional,
    Tuple,
    Union,
)

from eth_utils import to_checksum_address
from mypy_extensions import TypedDict  # pylint: disable=unused-import
from hexbytes import HexBytes
from web3 import Web3
from web3.contract import ContractFunction
from web3.datastructures import AttributeDict
from web3.providers.base import BaseProvider

from zero_ex.contract_wrappers.bases import ContractMethod, Validator
from zero_ex.contract_wrappers.tx_params import TxParams


# Try to import a custom validator class definition; if there isn't one,
# declare one that we can instantiate for the default argument to the
# constructor for TestLibDummy below.
try:
    # both mypy and pylint complain about what we're doing here, but this
    # works just fine, so their messages have been disabled here.
    from . import (  # type: ignore # pylint: disable=import-self
        TestLibDummyValidator,
    )
except ImportError:

    class TestLibDummyValidator(  # type: ignore
        Validator
    ):
        """No-op input validator."""


try:
    from .middleware import MIDDLEWARE  # type: ignore
except ImportError:
    pass


class PublicAddConstantMethod(ContractMethod):
    """Various interfaces to the publicAddConstant method."""

    def __init__(
        self,
        web3_or_provider: Union[Web3, BaseProvider],
        contract_address: str,
        contract_function: ContractFunction,
        validator: Validator = None,
    ):
        """Persist instance data."""
        super().__init__(web3_or_provider, contract_address, validator)
        self.underlying_method = contract_function

    def validate_and_normalize_inputs(self, x: int):
        """Validate the inputs to the publicAddConstant method."""
        self.validator.assert_valid(
            method_name="publicAddConstant",
            parameter_name="x",
            argument_value=x,
        )
        # safeguard against fractional inputs
        x = int(x)
        return x

    def call(self, x: int, tx_params: Optional[TxParams] = None) -> int:
        """Execute underlying contract method via eth_call.

        :param tx_params: transaction parameters

        """
        (x) = self.validate_and_normalize_inputs(x)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(x).call(tx_params.as_dict())

    def send_transaction(
        self, x: int, tx_params: Optional[TxParams] = None
    ) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        :param tx_params: transaction parameters

        """
        (x) = self.validate_and_normalize_inputs(x)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(x).transact(tx_params.as_dict())

    def estimate_gas(
        self, x: int, tx_params: Optional[TxParams] = None
    ) -> int:
        """Estimate gas consumption of method call."""
        (x) = self.validate_and_normalize_inputs(x)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(x).estimateGas(tx_params.as_dict())


class PublicAddOneMethod(ContractMethod):
    """Various interfaces to the publicAddOne method."""

    def __init__(
        self,
        web3_or_provider: Union[Web3, BaseProvider],
        contract_address: str,
        contract_function: ContractFunction,
        validator: Validator = None,
    ):
        """Persist instance data."""
        super().__init__(web3_or_provider, contract_address, validator)
        self.underlying_method = contract_function

    def validate_and_normalize_inputs(self, x: int):
        """Validate the inputs to the publicAddOne method."""
        self.validator.assert_valid(
            method_name="publicAddOne", parameter_name="x", argument_value=x,
        )
        # safeguard against fractional inputs
        x = int(x)
        return x

    def call(self, x: int, tx_params: Optional[TxParams] = None) -> int:
        """Execute underlying contract method via eth_call.

        :param tx_params: transaction parameters

        """
        (x) = self.validate_and_normalize_inputs(x)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(x).call(tx_params.as_dict())

    def send_transaction(
        self, x: int, tx_params: Optional[TxParams] = None
    ) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        :param tx_params: transaction parameters

        """
        (x) = self.validate_and_normalize_inputs(x)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(x).transact(tx_params.as_dict())

    def estimate_gas(
        self, x: int, tx_params: Optional[TxParams] = None
    ) -> int:
        """Estimate gas consumption of method call."""
        (x) = self.validate_and_normalize_inputs(x)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(x).estimateGas(tx_params.as_dict())


# pylint: disable=too-many-public-methods,too-many-instance-attributes
class TestLibDummy:
    """Wrapper class for TestLibDummy Solidity contract."""

    public_add_constant: PublicAddConstantMethod
    """Constructor-initialized instance of
    :class:`PublicAddConstantMethod`.
    """

    public_add_one: PublicAddOneMethod
    """Constructor-initialized instance of
    :class:`PublicAddOneMethod`.
    """

    def __init__(
        self,
        web3_or_provider: Union[Web3, BaseProvider],
        contract_address: str,
        validator: TestLibDummyValidator = None,
    ):
        """Get an instance of wrapper for smart contract.

        :param web3_or_provider: Either an instance of `web3.Web3`:code: or
            `web3.providers.base.BaseProvider`:code:
        :param contract_address: where the contract has been deployed
        :param validator: for validation of method inputs.
        """
        # pylint: disable=too-many-statements

        self.contract_address = contract_address

        if not validator:
            validator = TestLibDummyValidator(
                web3_or_provider, contract_address
            )

        web3 = None
        if isinstance(web3_or_provider, BaseProvider):
            web3 = Web3(web3_or_provider)
        elif isinstance(web3_or_provider, Web3):
            web3 = web3_or_provider
        else:
            raise TypeError(
                "Expected parameter 'web3_or_provider' to be an instance of either"
                + " Web3 or BaseProvider"
            )

        # if any middleware was imported, inject it
        try:
            MIDDLEWARE
        except NameError:
            pass
        else:
            try:
                for middleware in MIDDLEWARE:
                    web3.middleware_onion.inject(
                        middleware["function"], layer=middleware["layer"],
                    )
            except ValueError as value_error:
                if value_error.args == (
                    "You can't add the same un-named instance twice",
                ):
                    pass

        self._web3_eth = web3.eth

        functions = self._web3_eth.contract(
            address=to_checksum_address(contract_address),
            abi=TestLibDummy.abi(),
        ).functions

        self.public_add_constant = PublicAddConstantMethod(
            web3_or_provider,
            contract_address,
            functions.publicAddConstant,
            validator,
        )

        self.public_add_one = PublicAddOneMethod(
            web3_or_provider,
            contract_address,
            functions.publicAddOne,
            validator,
        )

    @staticmethod
    def abi():
        """Return the ABI to the underlying contract."""
        return json.loads(
            '[{"constant":true,"inputs":[{"internalType":"uint256","name":"x","type":"uint256"}],"name":"publicAddConstant","outputs":[{"internalType":"uint256","name":"result","type":"uint256"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[{"internalType":"uint256","name":"x","type":"uint256"}],"name":"publicAddOne","outputs":[{"internalType":"uint256","name":"result","type":"uint256"}],"payable":false,"stateMutability":"pure","type":"function"}]'  # noqa: E501 (line-too-long)
        )


# pylint: disable=too-many-lines
