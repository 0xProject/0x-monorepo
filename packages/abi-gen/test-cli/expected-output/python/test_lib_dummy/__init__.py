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

from mypy_extensions import TypedDict  # pylint: disable=unused-import
from hexbytes import HexBytes
from web3.datastructures import AttributeDict
from web3.providers.base import BaseProvider

from zero_ex.contract_wrappers._base_contract_wrapper import BaseContractWrapper, ValidatorBase
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

    class TestLibDummyValidator(ValidatorBase):  # type: ignore
        """No-op input validator."""





class PublicAddConstantMethod:
    """Various interfaces to the publicAddConstant method."""

    def __init__(self, contract: BaseContractWrapper):
        """Persist instance data."""
        self.contract = contract

    def validate_and_normalize_inputs(self, x: int):
        """Validate the inputs to the publicAddConstant method."""
        self.contract.validator.assert_valid(
            method_name='publicAddConstant',
            parameter_name='x',
            argument_value=x,
        )
        # safeguard against fractional inputs
        x = int(x)
        return (x)

    def call(self, x: int, tx_params: Optional[TxParams] = None) -> int:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters

        """
        (x) = self.validate_and_normalize_inputs(x)
        func = self.contract.contract_instance(address=self.contract.contract_address, abi=self.contract.abi()).functions.publicAddConstant(x)
        return self.contract.invoke_function_call(func=func, tx_params=tx_params, view_only=True)

    def send_transaction(self, x: int, tx_params: Optional[TxParams] = None) -> Union[HexBytes, bytes]:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters

        """
        (x) = self.validate_and_normalize_inputs(x)
        func = self.contract.contract_instance(address=self.contract.contract_address, abi=self.contract.abi()).functions.publicAddConstant(x)
        return self.contract.invoke_function_call(func=func, tx_params=tx_params, view_only=False)

class PublicAddOneMethod:
    """Various interfaces to the publicAddOne method."""

    def __init__(self, contract: BaseContractWrapper):
        """Persist instance data."""
        self.contract = contract

    def validate_and_normalize_inputs(self, x: int):
        """Validate the inputs to the publicAddOne method."""
        self.contract.validator.assert_valid(
            method_name='publicAddOne',
            parameter_name='x',
            argument_value=x,
        )
        # safeguard against fractional inputs
        x = int(x)
        return (x)

    def call(self, x: int, tx_params: Optional[TxParams] = None) -> int:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters

        """
        (x) = self.validate_and_normalize_inputs(x)
        func = self.contract.contract_instance(address=self.contract.contract_address, abi=self.contract.abi()).functions.publicAddOne(x)
        return self.contract.invoke_function_call(func=func, tx_params=tx_params, view_only=True)

    def send_transaction(self, x: int, tx_params: Optional[TxParams] = None) -> Union[HexBytes, bytes]:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters

        """
        (x) = self.validate_and_normalize_inputs(x)
        func = self.contract.contract_instance(address=self.contract.contract_address, abi=self.contract.abi()).functions.publicAddOne(x)
        return self.contract.invoke_function_call(func=func, tx_params=tx_params, view_only=False)

# pylint: disable=too-many-public-methods,too-many-instance-attributes
class TestLibDummy(BaseContractWrapper):
    """Wrapper class for TestLibDummy Solidity contract."""
    public_add_constant: PublicAddConstantMethod
    public_add_one: PublicAddOneMethod

    def __init__(
        self,
        provider: BaseProvider,
        contract_address: str,
        validator: TestLibDummyValidator = None,
        private_key: str = None,
    ):
        """Get an instance of wrapper for smart contract.

        :param provider: instance of :class:`web3.providers.base.BaseProvider`
        :param contract_address: where the contract has been deployed
        :param private_key: If specified, transactions will be signed locally,
            via Web3.py's `eth.account.signTransaction()`:code:, before being
            sent via `eth.sendRawTransaction()`:code:.
        """
        if not validator:
            validator = TestLibDummyValidator(provider, contract_address, private_key)

        super().__init__(
            provider=provider,
            contract_address=contract_address,
            validator=validator,
            private_key=private_key,
        )

        self.public_add_constant = PublicAddConstantMethod(self)
        self.public_add_one = PublicAddOneMethod(self)

    def _get_contract_instance(self, token_address):
        """Get an instance of the smart contract at a specific address.

        :returns: contract object
        """
        return self.contract_instance(
            address=token_address, abi=TestLibDummy.abi()
        )

    @staticmethod
    def abi():
        """Return the ABI to the underlying contract."""
        return json.loads(
            '[{"constant":true,"inputs":[{"name":"x","type":"uint256"}],"name":"publicAddConstant","outputs":[{"name":"result","type":"uint256"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[{"name":"x","type":"uint256"}],"name":"publicAddOne","outputs":[{"name":"result","type":"uint256"}],"payable":false,"stateMutability":"pure","type":"function"}]'  # noqa: E501 (line-too-long)
        )

# pylint: disable=too-many-lines
