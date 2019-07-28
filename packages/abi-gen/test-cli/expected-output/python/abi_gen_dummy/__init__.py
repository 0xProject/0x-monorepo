"""Generated wrapper for AbiGenDummy Solidity contract."""

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
from web3.contract import ContractFunction
from web3.datastructures import AttributeDict
from web3.providers.base import BaseProvider

from zero_ex.contract_wrappers._base_contract_wrapper import BaseContractWrapper, ValidatorBase
from zero_ex.contract_wrappers.tx_params import TxParams


# Try to import a custom validator class definition; if there isn't one,
# declare one that we can instantiate for the default argument to the
# constructor for AbiGenDummy below.
try:
    # both mypy and pylint complain about what we're doing here, but this
    # works just fine, so their messages have been disabled here.
    from . import (  # type: ignore # pylint: disable=import-self
        AbiGenDummyValidator,
    )
except ImportError:

    class AbiGenDummyValidator(ValidatorBase):  # type: ignore
        """No-op input validator."""


class Tuple0xc9bdd2d5(TypedDict):
    """Python representation of a tuple or struct.

    A tuple found in an ABI may have been written in Solidity as a literal
    tuple, or it may have been written as a parameter with a Solidity
    `struct`:code: data type; there's no way to tell which, based solely on the
    ABI, and the name of a Solidity `struct`:code: is not conveyed through the
    ABI.  This class represents a tuple that appeared in a method definition.
    Its name is derived from a hash of that tuple's field names, and every
    method whose ABI refers to a tuple with that same list of field names will
    have a generated wrapper method that refers to this class.

    Any members of type `bytes`:code: should be encoded as UTF-8, which can be
    accomplished via `str.encode("utf_8")`:code:
    """

    innerStruct: Tuple0xcf8ad995

    description: str

class Tuple0xcf8ad995(TypedDict):
    """Python representation of a tuple or struct.

    A tuple found in an ABI may have been written in Solidity as a literal
    tuple, or it may have been written as a parameter with a Solidity
    `struct`:code: data type; there's no way to tell which, based solely on the
    ABI, and the name of a Solidity `struct`:code: is not conveyed through the
    ABI.  This class represents a tuple that appeared in a method definition.
    Its name is derived from a hash of that tuple's field names, and every
    method whose ABI refers to a tuple with that same list of field names will
    have a generated wrapper method that refers to this class.

    Any members of type `bytes`:code: should be encoded as UTF-8, which can be
    accomplished via `str.encode("utf_8")`:code:
    """

    someBytes: bytes

    anInteger: int

    aDynamicArrayOfBytes: List[bytes]

    aString: str


class SimpleRequireMethod:
    """Various interfaces to the simpleRequire method."""

    def __init__(self, contract: BaseContractWrapper, contract_function: ContractFunction):
        """Persist instance data."""
        self.contract = contract
        self.underlying_method = contract_function

    def call(self, tx_params: Optional[TxParams] = None) -> None:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters

        """
        return self.contract.call(func=self.underlying_method(), tx_params=tx_params)

    def send_transaction(self, tx_params: Optional[TxParams] = None) -> Union[HexBytes, bytes]:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters

        """
        func = self.underlying_method()
        return self.contract.send_transaction(func=func, tx_params=tx_params)

class AcceptsAnArrayOfBytesMethod:
    """Various interfaces to the acceptsAnArrayOfBytes method."""

    def __init__(self, contract: BaseContractWrapper, contract_function: ContractFunction):
        """Persist instance data."""
        self.contract = contract
        self.underlying_method = contract_function

    def validate_and_normalize_inputs(self, a: List[bytes]):
        """Validate the inputs to the acceptsAnArrayOfBytes method."""
        self.contract.validator.assert_valid(
            method_name='acceptsAnArrayOfBytes',
            parameter_name='a',
            argument_value=a,
        )
        a = [
            bytes.fromhex(a_element.decode("utf-8"))
            for a_element in a
        ]
        return (a)

    def call(self, a: List[bytes], tx_params: Optional[TxParams] = None) -> None:
        """Execute underlying, same-named contract method.

        a method that accepts an array of bytes

        :param a: the array of bytes being accepted
        :param tx_params: transaction parameters

        """
        (a) = self.validate_and_normalize_inputs(a)
        return self.contract.call(func=self.underlying_method(a), tx_params=tx_params)

    def send_transaction(self, a: List[bytes], tx_params: Optional[TxParams] = None) -> Union[HexBytes, bytes]:
        """Execute underlying, same-named contract method.

        a method that accepts an array of bytes

        :param a: the array of bytes being accepted
        :param tx_params: transaction parameters

        """
        (a) = self.validate_and_normalize_inputs(a)
        func = self.underlying_method(a)
        return self.contract.send_transaction(func=func, tx_params=tx_params)

class EcrecoverFnMethod:
    """Various interfaces to the ecrecoverFn method."""

    def __init__(self, contract: BaseContractWrapper, contract_function: ContractFunction):
        """Persist instance data."""
        self.contract = contract
        self.underlying_method = contract_function

    def validate_and_normalize_inputs(self, _hash: bytes, v: int, r: bytes, s: bytes):
        """Validate the inputs to the ecrecoverFn method."""
        self.contract.validator.assert_valid(
            method_name='ecrecoverFn',
            parameter_name='hash',
            argument_value=_hash,
        )
        self.contract.validator.assert_valid(
            method_name='ecrecoverFn',
            parameter_name='v',
            argument_value=v,
        )
        self.contract.validator.assert_valid(
            method_name='ecrecoverFn',
            parameter_name='r',
            argument_value=r,
        )
        self.contract.validator.assert_valid(
            method_name='ecrecoverFn',
            parameter_name='s',
            argument_value=s,
        )
        return (_hash, v, r, s)

    def call(self, _hash: bytes, v: int, r: bytes, s: bytes, tx_params: Optional[TxParams] = None) -> str:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters

        """
        (_hash, v, r, s) = self.validate_and_normalize_inputs(_hash, v, r, s)
        return self.contract.call(func=self.underlying_method(_hash, v, r, s), tx_params=tx_params)

    def send_transaction(self, _hash: bytes, v: int, r: bytes, s: bytes, tx_params: Optional[TxParams] = None) -> Union[HexBytes, bytes]:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters

        """
        (_hash, v, r, s) = self.validate_and_normalize_inputs(_hash, v, r, s)
        func = self.underlying_method(_hash, v, r, s)
        return self.contract.send_transaction(func=func, tx_params=tx_params)

class AcceptsBytesMethod:
    """Various interfaces to the acceptsBytes method."""

    def __init__(self, contract: BaseContractWrapper, contract_function: ContractFunction):
        """Persist instance data."""
        self.contract = contract
        self.underlying_method = contract_function

    def validate_and_normalize_inputs(self, a: bytes):
        """Validate the inputs to the acceptsBytes method."""
        self.contract.validator.assert_valid(
            method_name='acceptsBytes',
            parameter_name='a',
            argument_value=a,
        )
        a = bytes.fromhex(a.decode("utf-8"))
        return (a)

    def call(self, a: bytes, tx_params: Optional[TxParams] = None) -> None:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters

        """
        (a) = self.validate_and_normalize_inputs(a)
        return self.contract.call(func=self.underlying_method(a), tx_params=tx_params)

    def send_transaction(self, a: bytes, tx_params: Optional[TxParams] = None) -> Union[HexBytes, bytes]:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters

        """
        (a) = self.validate_and_normalize_inputs(a)
        func = self.underlying_method(a)
        return self.contract.send_transaction(func=func, tx_params=tx_params)

class RevertWithConstantMethod:
    """Various interfaces to the revertWithConstant method."""

    def __init__(self, contract: BaseContractWrapper, contract_function: ContractFunction):
        """Persist instance data."""
        self.contract = contract
        self.underlying_method = contract_function

    def call(self, tx_params: Optional[TxParams] = None) -> None:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters

        """
        return self.contract.call(func=self.underlying_method(), tx_params=tx_params)

    def send_transaction(self, tx_params: Optional[TxParams] = None) -> Union[HexBytes, bytes]:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters

        """
        func = self.underlying_method()
        return self.contract.send_transaction(func=func, tx_params=tx_params)

class SimpleRevertMethod:
    """Various interfaces to the simpleRevert method."""

    def __init__(self, contract: BaseContractWrapper, contract_function: ContractFunction):
        """Persist instance data."""
        self.contract = contract
        self.underlying_method = contract_function

    def call(self, tx_params: Optional[TxParams] = None) -> None:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters

        """
        return self.contract.call(func=self.underlying_method(), tx_params=tx_params)

    def send_transaction(self, tx_params: Optional[TxParams] = None) -> Union[HexBytes, bytes]:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters

        """
        func = self.underlying_method()
        return self.contract.send_transaction(func=func, tx_params=tx_params)

class NestedStructOutputMethod:
    """Various interfaces to the nestedStructOutput method."""

    def __init__(self, contract: BaseContractWrapper, contract_function: ContractFunction):
        """Persist instance data."""
        self.contract = contract
        self.underlying_method = contract_function

    def call(self, tx_params: Optional[TxParams] = None) -> Tuple0xc9bdd2d5:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters

        """
        return self.contract.call(func=self.underlying_method(), tx_params=tx_params)

    def send_transaction(self, tx_params: Optional[TxParams] = None) -> Union[HexBytes, bytes]:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters

        """
        func = self.underlying_method()
        return self.contract.send_transaction(func=func, tx_params=tx_params)

class RequireWithConstantMethod:
    """Various interfaces to the requireWithConstant method."""

    def __init__(self, contract: BaseContractWrapper, contract_function: ContractFunction):
        """Persist instance data."""
        self.contract = contract
        self.underlying_method = contract_function

    def call(self, tx_params: Optional[TxParams] = None) -> None:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters

        """
        return self.contract.call(func=self.underlying_method(), tx_params=tx_params)

    def send_transaction(self, tx_params: Optional[TxParams] = None) -> Union[HexBytes, bytes]:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters

        """
        func = self.underlying_method()
        return self.contract.send_transaction(func=func, tx_params=tx_params)

class WithAddressInputMethod:
    """Various interfaces to the withAddressInput method."""

    def __init__(self, contract: BaseContractWrapper, contract_function: ContractFunction):
        """Persist instance data."""
        self.contract = contract
        self.underlying_method = contract_function

    def validate_and_normalize_inputs(self, x: str, a: int, b: int, y: str, c: int):
        """Validate the inputs to the withAddressInput method."""
        self.contract.validator.assert_valid(
            method_name='withAddressInput',
            parameter_name='x',
            argument_value=x,
        )
        x = self.contract.validate_and_checksum_address(x)
        self.contract.validator.assert_valid(
            method_name='withAddressInput',
            parameter_name='a',
            argument_value=a,
        )
        # safeguard against fractional inputs
        a = int(a)
        self.contract.validator.assert_valid(
            method_name='withAddressInput',
            parameter_name='b',
            argument_value=b,
        )
        # safeguard against fractional inputs
        b = int(b)
        self.contract.validator.assert_valid(
            method_name='withAddressInput',
            parameter_name='y',
            argument_value=y,
        )
        y = self.contract.validate_and_checksum_address(y)
        self.contract.validator.assert_valid(
            method_name='withAddressInput',
            parameter_name='c',
            argument_value=c,
        )
        # safeguard against fractional inputs
        c = int(c)
        return (x, a, b, y, c)

    def call(self, x: str, a: int, b: int, y: str, c: int, tx_params: Optional[TxParams] = None) -> str:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters

        """
        (x, a, b, y, c) = self.validate_and_normalize_inputs(x, a, b, y, c)
        return self.contract.call(func=self.underlying_method(x, a, b, y, c), tx_params=tx_params)

    def send_transaction(self, x: str, a: int, b: int, y: str, c: int, tx_params: Optional[TxParams] = None) -> Union[HexBytes, bytes]:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters

        """
        (x, a, b, y, c) = self.validate_and_normalize_inputs(x, a, b, y, c)
        func = self.underlying_method(x, a, b, y, c)
        return self.contract.send_transaction(func=func, tx_params=tx_params)

class StructInputMethod:
    """Various interfaces to the structInput method."""

    def __init__(self, contract: BaseContractWrapper, contract_function: ContractFunction):
        """Persist instance data."""
        self.contract = contract
        self.underlying_method = contract_function

    def validate_and_normalize_inputs(self, s: Tuple0xcf8ad995):
        """Validate the inputs to the structInput method."""
        self.contract.validator.assert_valid(
            method_name='structInput',
            parameter_name='s',
            argument_value=s,
        )
        return (s)

    def call(self, s: Tuple0xcf8ad995, tx_params: Optional[TxParams] = None) -> None:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters

        """
        (s) = self.validate_and_normalize_inputs(s)
        return self.contract.call(func=self.underlying_method(s), tx_params=tx_params)

    def send_transaction(self, s: Tuple0xcf8ad995, tx_params: Optional[TxParams] = None) -> Union[HexBytes, bytes]:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters

        """
        (s) = self.validate_and_normalize_inputs(s)
        func = self.underlying_method(s)
        return self.contract.send_transaction(func=func, tx_params=tx_params)

class NonPureMethodMethod:
    """Various interfaces to the nonPureMethod method."""

    def __init__(self, contract: BaseContractWrapper, contract_function: ContractFunction):
        """Persist instance data."""
        self.contract = contract
        self.underlying_method = contract_function

    def call(self, tx_params: Optional[TxParams] = None) -> Union[int, Union[HexBytes, bytes]]:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters
        :returns: the return value of the underlying method.
        """
        return self.contract.call(func=self.underlying_method(), tx_params=tx_params)

    def send_transaction(self, tx_params: Optional[TxParams] = None) -> Union[HexBytes, bytes]:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters
        """
        func = self.underlying_method()
        return self.contract.send_transaction(func=func, tx_params=tx_params)

class SimplePureFunctionWithInputMethod:
    """Various interfaces to the simplePureFunctionWithInput method."""

    def __init__(self, contract: BaseContractWrapper, contract_function: ContractFunction):
        """Persist instance data."""
        self.contract = contract
        self.underlying_method = contract_function

    def validate_and_normalize_inputs(self, x: int):
        """Validate the inputs to the simplePureFunctionWithInput method."""
        self.contract.validator.assert_valid(
            method_name='simplePureFunctionWithInput',
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
        return self.contract.call(func=self.underlying_method(x), tx_params=tx_params)

    def send_transaction(self, x: int, tx_params: Optional[TxParams] = None) -> Union[HexBytes, bytes]:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters

        """
        (x) = self.validate_and_normalize_inputs(x)
        func = self.underlying_method(x)
        return self.contract.send_transaction(func=func, tx_params=tx_params)

class NonPureMethodThatReturnsNothingMethod:
    """Various interfaces to the nonPureMethodThatReturnsNothing method."""

    def __init__(self, contract: BaseContractWrapper, contract_function: ContractFunction):
        """Persist instance data."""
        self.contract = contract
        self.underlying_method = contract_function

    def call(self, tx_params: Optional[TxParams] = None) -> Union[None, Union[HexBytes, bytes]]:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters
        :returns: the return value of the underlying method.
        """
        return self.contract.call(func=self.underlying_method(), tx_params=tx_params)

    def send_transaction(self, tx_params: Optional[TxParams] = None) -> Union[HexBytes, bytes]:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters
        """
        func = self.underlying_method()
        return self.contract.send_transaction(func=func, tx_params=tx_params)

class SimplePureFunctionMethod:
    """Various interfaces to the simplePureFunction method."""

    def __init__(self, contract: BaseContractWrapper, contract_function: ContractFunction):
        """Persist instance data."""
        self.contract = contract
        self.underlying_method = contract_function

    def call(self, tx_params: Optional[TxParams] = None) -> int:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters

        """
        return self.contract.call(func=self.underlying_method(), tx_params=tx_params)

    def send_transaction(self, tx_params: Optional[TxParams] = None) -> Union[HexBytes, bytes]:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters

        """
        func = self.underlying_method()
        return self.contract.send_transaction(func=func, tx_params=tx_params)

class NestedStructInputMethod:
    """Various interfaces to the nestedStructInput method."""

    def __init__(self, contract: BaseContractWrapper, contract_function: ContractFunction):
        """Persist instance data."""
        self.contract = contract
        self.underlying_method = contract_function

    def validate_and_normalize_inputs(self, n: Tuple0xc9bdd2d5):
        """Validate the inputs to the nestedStructInput method."""
        self.contract.validator.assert_valid(
            method_name='nestedStructInput',
            parameter_name='n',
            argument_value=n,
        )
        return (n)

    def call(self, n: Tuple0xc9bdd2d5, tx_params: Optional[TxParams] = None) -> None:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters

        """
        (n) = self.validate_and_normalize_inputs(n)
        return self.contract.call(func=self.underlying_method(n), tx_params=tx_params)

    def send_transaction(self, n: Tuple0xc9bdd2d5, tx_params: Optional[TxParams] = None) -> Union[HexBytes, bytes]:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters

        """
        (n) = self.validate_and_normalize_inputs(n)
        func = self.underlying_method(n)
        return self.contract.send_transaction(func=func, tx_params=tx_params)

class StructOutputMethod:
    """Various interfaces to the structOutput method."""

    def __init__(self, contract: BaseContractWrapper, contract_function: ContractFunction):
        """Persist instance data."""
        self.contract = contract
        self.underlying_method = contract_function

    def call(self, tx_params: Optional[TxParams] = None) -> Tuple0xcf8ad995:
        """Execute underlying, same-named contract method.

        a method that returns a struct

        :param tx_params: transaction parameters
        :returns: a Struct struct
        """
        return self.contract.call(func=self.underlying_method(), tx_params=tx_params)

    def send_transaction(self, tx_params: Optional[TxParams] = None) -> Union[HexBytes, bytes]:
        """Execute underlying, same-named contract method.

        a method that returns a struct

        :param tx_params: transaction parameters
        :returns: a Struct struct
        """
        func = self.underlying_method()
        return self.contract.send_transaction(func=func, tx_params=tx_params)

class PureFunctionWithConstantMethod:
    """Various interfaces to the pureFunctionWithConstant method."""

    def __init__(self, contract: BaseContractWrapper, contract_function: ContractFunction):
        """Persist instance data."""
        self.contract = contract
        self.underlying_method = contract_function

    def call(self, tx_params: Optional[TxParams] = None) -> int:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters

        """
        return self.contract.call(func=self.underlying_method(), tx_params=tx_params)

    def send_transaction(self, tx_params: Optional[TxParams] = None) -> Union[HexBytes, bytes]:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters

        """
        func = self.underlying_method()
        return self.contract.send_transaction(func=func, tx_params=tx_params)

# pylint: disable=too-many-public-methods,too-many-instance-attributes
class AbiGenDummy(BaseContractWrapper):
    """Wrapper class for AbiGenDummy Solidity contract.

    All method parameters of type `bytes`:code: should be encoded as UTF-8,
    which can be accomplished via `str.encode("utf_8")`:code:.
    """
    simple_require: SimpleRequireMethod
    accepts_an_array_of_bytes: AcceptsAnArrayOfBytesMethod
    ecrecover_fn: EcrecoverFnMethod
    accepts_bytes: AcceptsBytesMethod
    revert_with_constant: RevertWithConstantMethod
    simple_revert: SimpleRevertMethod
    nested_struct_output: NestedStructOutputMethod
    require_with_constant: RequireWithConstantMethod
    with_address_input: WithAddressInputMethod
    struct_input: StructInputMethod
    non_pure_method: NonPureMethodMethod
    simple_pure_function_with_input: SimplePureFunctionWithInputMethod
    non_pure_method_that_returns_nothing: NonPureMethodThatReturnsNothingMethod
    simple_pure_function: SimplePureFunctionMethod
    nested_struct_input: NestedStructInputMethod
    struct_output: StructOutputMethod
    pure_function_with_constant: PureFunctionWithConstantMethod

    def __init__(
        self,
        provider: BaseProvider,
        contract_address: str,
        validator: AbiGenDummyValidator = None,
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
            validator = AbiGenDummyValidator(provider, contract_address, private_key)

        super().__init__(
            provider=provider,
            contract_address=contract_address,
            validator=validator,
            private_key=private_key,
        )
        functions = self._web3_eth.contract(
            address=to_checksum_address(contract_address), abi=AbiGenDummy.abi()
        ).functions
        self.simple_require = SimpleRequireMethod(self, functions.simpleRequire)
        self.accepts_an_array_of_bytes = AcceptsAnArrayOfBytesMethod(self, functions.acceptsAnArrayOfBytes)
        self.ecrecover_fn = EcrecoverFnMethod(self, functions.ecrecoverFn)
        self.accepts_bytes = AcceptsBytesMethod(self, functions.acceptsBytes)
        self.revert_with_constant = RevertWithConstantMethod(self, functions.revertWithConstant)
        self.simple_revert = SimpleRevertMethod(self, functions.simpleRevert)
        self.nested_struct_output = NestedStructOutputMethod(self, functions.nestedStructOutput)
        self.require_with_constant = RequireWithConstantMethod(self, functions.requireWithConstant)
        self.with_address_input = WithAddressInputMethod(self, functions.withAddressInput)
        self.struct_input = StructInputMethod(self, functions.structInput)
        self.non_pure_method = NonPureMethodMethod(self, functions.nonPureMethod)
        self.simple_pure_function_with_input = SimplePureFunctionWithInputMethod(self, functions.simplePureFunctionWithInput)
        self.non_pure_method_that_returns_nothing = NonPureMethodThatReturnsNothingMethod(self, functions.nonPureMethodThatReturnsNothing)
        self.simple_pure_function = SimplePureFunctionMethod(self, functions.simplePureFunction)
        self.nested_struct_input = NestedStructInputMethod(self, functions.nestedStructInput)
        self.struct_output = StructOutputMethod(self, functions.structOutput)
        self.pure_function_with_constant = PureFunctionWithConstantMethod(self, functions.pureFunctionWithConstant)

    def get_an_event_event(
        self, tx_hash: Union[HexBytes, bytes]
    ) -> Tuple[AttributeDict]:
        """Get log entry for AnEvent event.

        :param tx_hash: hash of transaction emitting AnEvent event
        """
        tx_receipt = self._web3_eth.getTransactionReceipt(tx_hash)
        return (
            self.contract_instance(self.contract_address, AbiGenDummy.abi())
            .events.AnEvent()
            .processReceipt(tx_receipt)
        )

    @staticmethod
    def abi():
        """Return the ABI to the underlying contract."""
        return json.loads(
            '[{"constant":true,"inputs":[],"name":"simpleRequire","outputs":[],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[{"name":"a","type":"bytes[]"}],"name":"acceptsAnArrayOfBytes","outputs":[],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[{"name":"hash","type":"bytes32"},{"name":"v","type":"uint8"},{"name":"r","type":"bytes32"},{"name":"s","type":"bytes32"}],"name":"ecrecoverFn","outputs":[{"name":"signerAddress","type":"address"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[{"name":"a","type":"bytes"}],"name":"acceptsBytes","outputs":[],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[],"name":"revertWithConstant","outputs":[],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[],"name":"simpleRevert","outputs":[],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[],"name":"nestedStructOutput","outputs":[{"components":[{"components":[{"name":"someBytes","type":"bytes"},{"name":"anInteger","type":"uint32"},{"name":"aDynamicArrayOfBytes","type":"bytes[]"},{"name":"aString","type":"string"}],"name":"innerStruct","type":"tuple"},{"name":"description","type":"string"}],"name":"","type":"tuple"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[],"name":"requireWithConstant","outputs":[],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[{"name":"x","type":"address"},{"name":"a","type":"uint256"},{"name":"b","type":"uint256"},{"name":"y","type":"address"},{"name":"c","type":"uint256"}],"name":"withAddressInput","outputs":[{"name":"z","type":"address"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[{"components":[{"name":"someBytes","type":"bytes"},{"name":"anInteger","type":"uint32"},{"name":"aDynamicArrayOfBytes","type":"bytes[]"},{"name":"aString","type":"string"}],"name":"s","type":"tuple"}],"name":"structInput","outputs":[],"payable":false,"stateMutability":"pure","type":"function"},{"constant":false,"inputs":[],"name":"nonPureMethod","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"x","type":"uint256"}],"name":"simplePureFunctionWithInput","outputs":[{"name":"sum","type":"uint256"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":false,"inputs":[],"name":"nonPureMethodThatReturnsNothing","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"simplePureFunction","outputs":[{"name":"result","type":"uint256"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[{"components":[{"components":[{"name":"someBytes","type":"bytes"},{"name":"anInteger","type":"uint32"},{"name":"aDynamicArrayOfBytes","type":"bytes[]"},{"name":"aString","type":"string"}],"name":"innerStruct","type":"tuple"},{"name":"description","type":"string"}],"name":"n","type":"tuple"}],"name":"nestedStructInput","outputs":[],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[],"name":"structOutput","outputs":[{"components":[{"name":"someBytes","type":"bytes"},{"name":"anInteger","type":"uint32"},{"name":"aDynamicArrayOfBytes","type":"bytes[]"},{"name":"aString","type":"string"}],"name":"s","type":"tuple"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[],"name":"pureFunctionWithConstant","outputs":[{"name":"someConstant","type":"uint256"}],"payable":false,"stateMutability":"pure","type":"function"},{"anonymous":false,"inputs":[{"indexed":false,"name":"param","type":"uint8"}],"name":"AnEvent","type":"event"}]'  # noqa: E501 (line-too-long)
        )

# pylint: disable=too-many-lines
