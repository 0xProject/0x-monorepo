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
from web3 import Web3
from web3.contract import ContractFunction
from web3.datastructures import AttributeDict
from web3.providers.base import BaseProvider

from zero_ex.contract_wrappers.bases import ContractMethod, Validator
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

    class AbiGenDummyValidator(  # type: ignore
        Validator
    ):
        """No-op input validator."""


try:
    from .middleware import MIDDLEWARE  # type: ignore
except ImportError:
    pass


class AbiGenDummyComplexInput(TypedDict):
    """Python representation of a tuple or struct.

    Solidity compiler output does not include the names of structs that appear
    in method definitions.  A tuple found in an ABI may have been written in
    Solidity as a literal, anonymous tuple, or it may have been written as a
    named `struct`:code:, but there is no way to tell from the compiler
    output.  This class represents a tuple that appeared in a method
    definition.  Its name is derived from a hash of that tuple's field names,
    and every method whose ABI refers to a tuple with that same list of field
    names will have a generated wrapper method that refers to this class.

    Any members of type `bytes`:code: should be encoded as UTF-8, which can be
    accomplished via `str.encode("utf_8")`:code:
    """

    foo: int

    bar: Union[bytes, str]

    car: str


class AbiGenDummyComplexOutput(TypedDict):
    """Python representation of a tuple or struct.

    Solidity compiler output does not include the names of structs that appear
    in method definitions.  A tuple found in an ABI may have been written in
    Solidity as a literal, anonymous tuple, or it may have been written as a
    named `struct`:code:, but there is no way to tell from the compiler
    output.  This class represents a tuple that appeared in a method
    definition.  Its name is derived from a hash of that tuple's field names,
    and every method whose ABI refers to a tuple with that same list of field
    names will have a generated wrapper method that refers to this class.

    Any members of type `bytes`:code: should be encoded as UTF-8, which can be
    accomplished via `str.encode("utf_8")`:code:
    """

    input: AbiGenDummyComplexInput

    lorem: Union[bytes, str]

    ipsum: Union[bytes, str]

    dolor: str


class AbiGenDummyStructNotDirectlyUsedAnywhere(TypedDict):
    """Python representation of a tuple or struct.

    Solidity compiler output does not include the names of structs that appear
    in method definitions.  A tuple found in an ABI may have been written in
    Solidity as a literal, anonymous tuple, or it may have been written as a
    named `struct`:code:, but there is no way to tell from the compiler
    output.  This class represents a tuple that appeared in a method
    definition.  Its name is derived from a hash of that tuple's field names,
    and every method whose ABI refers to a tuple with that same list of field
    names will have a generated wrapper method that refers to this class.

    Any members of type `bytes`:code: should be encoded as UTF-8, which can be
    accomplished via `str.encode("utf_8")`:code:
    """

    aField: int


class AbiGenDummyNestedStructWithInnerStructNotUsedElsewhere(TypedDict):
    """Python representation of a tuple or struct.

    Solidity compiler output does not include the names of structs that appear
    in method definitions.  A tuple found in an ABI may have been written in
    Solidity as a literal, anonymous tuple, or it may have been written as a
    named `struct`:code:, but there is no way to tell from the compiler
    output.  This class represents a tuple that appeared in a method
    definition.  Its name is derived from a hash of that tuple's field names,
    and every method whose ABI refers to a tuple with that same list of field
    names will have a generated wrapper method that refers to this class.

    Any members of type `bytes`:code: should be encoded as UTF-8, which can be
    accomplished via `str.encode("utf_8")`:code:
    """

    innerStruct: AbiGenDummyStructNotDirectlyUsedAnywhere


class AbiGenDummyStruct(TypedDict):
    """Python representation of a tuple or struct.

    Solidity compiler output does not include the names of structs that appear
    in method definitions.  A tuple found in an ABI may have been written in
    Solidity as a literal, anonymous tuple, or it may have been written as a
    named `struct`:code:, but there is no way to tell from the compiler
    output.  This class represents a tuple that appeared in a method
    definition.  Its name is derived from a hash of that tuple's field names,
    and every method whose ABI refers to a tuple with that same list of field
    names will have a generated wrapper method that refers to this class.

    Any members of type `bytes`:code: should be encoded as UTF-8, which can be
    accomplished via `str.encode("utf_8")`:code:
    """

    someBytes: Union[bytes, str]

    anInteger: int

    aDynamicArrayOfBytes: List[Union[bytes, str]]

    aString: str


class AbiGenDummyNestedStruct(TypedDict):
    """Python representation of a tuple or struct.

    Solidity compiler output does not include the names of structs that appear
    in method definitions.  A tuple found in an ABI may have been written in
    Solidity as a literal, anonymous tuple, or it may have been written as a
    named `struct`:code:, but there is no way to tell from the compiler
    output.  This class represents a tuple that appeared in a method
    definition.  Its name is derived from a hash of that tuple's field names,
    and every method whose ABI refers to a tuple with that same list of field
    names will have a generated wrapper method that refers to this class.

    Any members of type `bytes`:code: should be encoded as UTF-8, which can be
    accomplished via `str.encode("utf_8")`:code:
    """

    innerStruct: AbiGenDummyStruct

    description: str


class AcceptsAnArrayOfBytesMethod(
    ContractMethod
):  # pylint: disable=invalid-name
    """Various interfaces to the acceptsAnArrayOfBytes method."""

    def __init__(
        self,
        web3_or_provider: Union[Web3, BaseProvider],
        contract_address: str,
        contract_function: ContractFunction,
        validator: Validator = None,
    ):
        """Persist instance data."""
        super().__init__(web3_or_provider, contract_address, validator)
        self._underlying_method = contract_function

    def validate_and_normalize_inputs(self, a: List[Union[bytes, str]]):
        """Validate the inputs to the acceptsAnArrayOfBytes method."""
        self.validator.assert_valid(
            method_name="acceptsAnArrayOfBytes",
            parameter_name="a",
            argument_value=a,
        )
        return a

    def call(
        self, a: List[Union[bytes, str]], tx_params: Optional[TxParams] = None
    ) -> None:
        """Execute underlying contract method via eth_call.

        a method that accepts an array of bytes

        :param a: the array of bytes being accepted
        :param tx_params: transaction parameters

        """
        (a) = self.validate_and_normalize_inputs(a)
        tx_params = super().normalize_tx_params(tx_params)
        self._underlying_method(a).call(tx_params.as_dict())

    def estimate_gas(
        self, a: List[Union[bytes, str]], tx_params: Optional[TxParams] = None
    ) -> int:
        """Estimate gas consumption of method call."""
        (a) = self.validate_and_normalize_inputs(a)
        tx_params = super().normalize_tx_params(tx_params)
        return self._underlying_method(a).estimateGas(tx_params.as_dict())


class AcceptsBytesMethod(ContractMethod):  # pylint: disable=invalid-name
    """Various interfaces to the acceptsBytes method."""

    def __init__(
        self,
        web3_or_provider: Union[Web3, BaseProvider],
        contract_address: str,
        contract_function: ContractFunction,
        validator: Validator = None,
    ):
        """Persist instance data."""
        super().__init__(web3_or_provider, contract_address, validator)
        self._underlying_method = contract_function

    def validate_and_normalize_inputs(self, a: Union[bytes, str]):
        """Validate the inputs to the acceptsBytes method."""
        self.validator.assert_valid(
            method_name="acceptsBytes", parameter_name="a", argument_value=a,
        )
        return a

    def call(
        self, a: Union[bytes, str], tx_params: Optional[TxParams] = None
    ) -> None:
        """Execute underlying contract method via eth_call.

        :param tx_params: transaction parameters

        """
        (a) = self.validate_and_normalize_inputs(a)
        tx_params = super().normalize_tx_params(tx_params)
        self._underlying_method(a).call(tx_params.as_dict())

    def estimate_gas(
        self, a: Union[bytes, str], tx_params: Optional[TxParams] = None
    ) -> int:
        """Estimate gas consumption of method call."""
        (a) = self.validate_and_normalize_inputs(a)
        tx_params = super().normalize_tx_params(tx_params)
        return self._underlying_method(a).estimateGas(tx_params.as_dict())


class ComplexInputComplexOutputMethod(
    ContractMethod
):  # pylint: disable=invalid-name
    """Various interfaces to the complexInputComplexOutput method."""

    def __init__(
        self,
        web3_or_provider: Union[Web3, BaseProvider],
        contract_address: str,
        contract_function: ContractFunction,
        validator: Validator = None,
    ):
        """Persist instance data."""
        super().__init__(web3_or_provider, contract_address, validator)
        self._underlying_method = contract_function

    def validate_and_normalize_inputs(
        self, complex_input: AbiGenDummyComplexInput
    ):
        """Validate the inputs to the complexInputComplexOutput method."""
        self.validator.assert_valid(
            method_name="complexInputComplexOutput",
            parameter_name="complexInput",
            argument_value=complex_input,
        )
        return complex_input

    def call(
        self,
        complex_input: AbiGenDummyComplexInput,
        tx_params: Optional[TxParams] = None,
    ) -> AbiGenDummyComplexOutput:
        """Execute underlying contract method via eth_call.

        Tests decoding when the input and output are complex.

        :param tx_params: transaction parameters

        """
        (complex_input) = self.validate_and_normalize_inputs(complex_input)
        tx_params = super().normalize_tx_params(tx_params)
        returned = self._underlying_method(complex_input).call(
            tx_params.as_dict()
        )
        return AbiGenDummyComplexOutput(
            input=returned[0],
            lorem=returned[1],
            ipsum=returned[2],
            dolor=returned[3],
        )

    def estimate_gas(
        self,
        complex_input: AbiGenDummyComplexInput,
        tx_params: Optional[TxParams] = None,
    ) -> int:
        """Estimate gas consumption of method call."""
        (complex_input) = self.validate_and_normalize_inputs(complex_input)
        tx_params = super().normalize_tx_params(tx_params)
        return self._underlying_method(complex_input).estimateGas(
            tx_params.as_dict()
        )


class EcrecoverFnMethod(ContractMethod):  # pylint: disable=invalid-name
    """Various interfaces to the ecrecoverFn method."""

    def __init__(
        self,
        web3_or_provider: Union[Web3, BaseProvider],
        contract_address: str,
        contract_function: ContractFunction,
        validator: Validator = None,
    ):
        """Persist instance data."""
        super().__init__(web3_or_provider, contract_address, validator)
        self._underlying_method = contract_function

    def validate_and_normalize_inputs(
        self,
        _hash: Union[bytes, str],
        v: int,
        r: Union[bytes, str],
        s: Union[bytes, str],
    ):
        """Validate the inputs to the ecrecoverFn method."""
        self.validator.assert_valid(
            method_name="ecrecoverFn",
            parameter_name="hash",
            argument_value=_hash,
        )
        self.validator.assert_valid(
            method_name="ecrecoverFn", parameter_name="v", argument_value=v,
        )
        self.validator.assert_valid(
            method_name="ecrecoverFn", parameter_name="r", argument_value=r,
        )
        self.validator.assert_valid(
            method_name="ecrecoverFn", parameter_name="s", argument_value=s,
        )
        return (_hash, v, r, s)

    def call(
        self,
        _hash: Union[bytes, str],
        v: int,
        r: Union[bytes, str],
        s: Union[bytes, str],
        tx_params: Optional[TxParams] = None,
    ) -> str:
        """Execute underlying contract method via eth_call.

        test that devdocs will be generated and that multiline devdocs will
        look okay

        :param hash: description of some hash. Let's make this line super long
            to demonstrate hanging indents for method params. It has to be more
            than one hundred twenty columns.
        :param r: ECDSA r output
        :param s: ECDSA s output
        :param v: some v, recovery id
        :param tx_params: transaction parameters
        :returns: the signerAddress that created this signature. this line too
            is super long in order to demonstrate the proper hanging
            indentation in generated code.
        """
        (_hash, v, r, s) = self.validate_and_normalize_inputs(_hash, v, r, s)
        tx_params = super().normalize_tx_params(tx_params)
        returned = self._underlying_method(_hash, v, r, s).call(
            tx_params.as_dict()
        )
        return str(returned)

    def estimate_gas(
        self,
        _hash: Union[bytes, str],
        v: int,
        r: Union[bytes, str],
        s: Union[bytes, str],
        tx_params: Optional[TxParams] = None,
    ) -> int:
        """Estimate gas consumption of method call."""
        (_hash, v, r, s) = self.validate_and_normalize_inputs(_hash, v, r, s)
        tx_params = super().normalize_tx_params(tx_params)
        return self._underlying_method(_hash, v, r, s).estimateGas(
            tx_params.as_dict()
        )


class EmitSimpleEventMethod(ContractMethod):  # pylint: disable=invalid-name
    """Various interfaces to the emitSimpleEvent method."""

    def __init__(
        self,
        web3_or_provider: Union[Web3, BaseProvider],
        contract_address: str,
        contract_function: ContractFunction,
    ):
        """Persist instance data."""
        super().__init__(web3_or_provider, contract_address)
        self._underlying_method = contract_function

    def call(self, tx_params: Optional[TxParams] = None) -> None:
        """Execute underlying contract method via eth_call.

        :param tx_params: transaction parameters
        :returns: the return value of the underlying method.
        """
        tx_params = super().normalize_tx_params(tx_params)
        self._underlying_method().call(tx_params.as_dict())

    def send_transaction(
        self, tx_params: Optional[TxParams] = None
    ) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        :param tx_params: transaction parameters
        """
        tx_params = super().normalize_tx_params(tx_params)
        return self._underlying_method().transact(tx_params.as_dict())

    def build_transaction(self, tx_params: Optional[TxParams] = None) -> dict:
        """Construct calldata to be used as input to the method."""
        tx_params = super().normalize_tx_params(tx_params)
        return self._underlying_method().buildTransaction(tx_params.as_dict())

    def estimate_gas(self, tx_params: Optional[TxParams] = None) -> int:
        """Estimate gas consumption of method call."""
        tx_params = super().normalize_tx_params(tx_params)
        return self._underlying_method().estimateGas(tx_params.as_dict())


class MethodAcceptingArrayOfArrayOfStructsMethod(
    ContractMethod
):  # pylint: disable=invalid-name
    """Various interfaces to the methodAcceptingArrayOfArrayOfStructs method."""

    def __init__(
        self,
        web3_or_provider: Union[Web3, BaseProvider],
        contract_address: str,
        contract_function: ContractFunction,
        validator: Validator = None,
    ):
        """Persist instance data."""
        super().__init__(web3_or_provider, contract_address, validator)
        self._underlying_method = contract_function

    def validate_and_normalize_inputs(
        self, index_0: List[List[AbiGenDummyStruct]]
    ):
        """Validate the inputs to the methodAcceptingArrayOfArrayOfStructs method."""
        self.validator.assert_valid(
            method_name="methodAcceptingArrayOfArrayOfStructs",
            parameter_name="index_0",
            argument_value=index_0,
        )
        return index_0

    def call(
        self,
        index_0: List[List[AbiGenDummyStruct]],
        tx_params: Optional[TxParams] = None,
    ) -> None:
        """Execute underlying contract method via eth_call.

        :param tx_params: transaction parameters

        """
        (index_0) = self.validate_and_normalize_inputs(index_0)
        tx_params = super().normalize_tx_params(tx_params)
        self._underlying_method(index_0).call(tx_params.as_dict())

    def estimate_gas(
        self,
        index_0: List[List[AbiGenDummyStruct]],
        tx_params: Optional[TxParams] = None,
    ) -> int:
        """Estimate gas consumption of method call."""
        (index_0) = self.validate_and_normalize_inputs(index_0)
        tx_params = super().normalize_tx_params(tx_params)
        return self._underlying_method(index_0).estimateGas(
            tx_params.as_dict()
        )


class MethodAcceptingArrayOfStructsMethod(
    ContractMethod
):  # pylint: disable=invalid-name
    """Various interfaces to the methodAcceptingArrayOfStructs method."""

    def __init__(
        self,
        web3_or_provider: Union[Web3, BaseProvider],
        contract_address: str,
        contract_function: ContractFunction,
        validator: Validator = None,
    ):
        """Persist instance data."""
        super().__init__(web3_or_provider, contract_address, validator)
        self._underlying_method = contract_function

    def validate_and_normalize_inputs(self, index_0: List[AbiGenDummyStruct]):
        """Validate the inputs to the methodAcceptingArrayOfStructs method."""
        self.validator.assert_valid(
            method_name="methodAcceptingArrayOfStructs",
            parameter_name="index_0",
            argument_value=index_0,
        )
        return index_0

    def call(
        self,
        index_0: List[AbiGenDummyStruct],
        tx_params: Optional[TxParams] = None,
    ) -> None:
        """Execute underlying contract method via eth_call.

        :param tx_params: transaction parameters

        """
        (index_0) = self.validate_and_normalize_inputs(index_0)
        tx_params = super().normalize_tx_params(tx_params)
        self._underlying_method(index_0).call(tx_params.as_dict())

    def estimate_gas(
        self,
        index_0: List[AbiGenDummyStruct],
        tx_params: Optional[TxParams] = None,
    ) -> int:
        """Estimate gas consumption of method call."""
        (index_0) = self.validate_and_normalize_inputs(index_0)
        tx_params = super().normalize_tx_params(tx_params)
        return self._underlying_method(index_0).estimateGas(
            tx_params.as_dict()
        )


class MethodReturningArrayOfStructsMethod(
    ContractMethod
):  # pylint: disable=invalid-name
    """Various interfaces to the methodReturningArrayOfStructs method."""

    def __init__(
        self,
        web3_or_provider: Union[Web3, BaseProvider],
        contract_address: str,
        contract_function: ContractFunction,
    ):
        """Persist instance data."""
        super().__init__(web3_or_provider, contract_address)
        self._underlying_method = contract_function

    def call(
        self, tx_params: Optional[TxParams] = None
    ) -> List[AbiGenDummyStruct]:
        """Execute underlying contract method via eth_call.

        :param tx_params: transaction parameters

        """
        tx_params = super().normalize_tx_params(tx_params)
        returned = self._underlying_method().call(tx_params.as_dict())
        return [
            AbiGenDummyStruct(
                someBytes=element[0],
                anInteger=element[1],
                aDynamicArrayOfBytes=element[2],
                aString=element[3],
            )
            for element in returned
        ]

    def estimate_gas(self, tx_params: Optional[TxParams] = None) -> int:
        """Estimate gas consumption of method call."""
        tx_params = super().normalize_tx_params(tx_params)
        return self._underlying_method().estimateGas(tx_params.as_dict())


class MethodReturningMultipleValuesMethod(
    ContractMethod
):  # pylint: disable=invalid-name
    """Various interfaces to the methodReturningMultipleValues method."""

    def __init__(
        self,
        web3_or_provider: Union[Web3, BaseProvider],
        contract_address: str,
        contract_function: ContractFunction,
    ):
        """Persist instance data."""
        super().__init__(web3_or_provider, contract_address)
        self._underlying_method = contract_function

    def call(self, tx_params: Optional[TxParams] = None) -> Tuple[int, str]:
        """Execute underlying contract method via eth_call.

        :param tx_params: transaction parameters

        """
        tx_params = super().normalize_tx_params(tx_params)
        returned = self._underlying_method().call(tx_params.as_dict())
        return (
            returned[0],
            returned[1],
        )

    def estimate_gas(self, tx_params: Optional[TxParams] = None) -> int:
        """Estimate gas consumption of method call."""
        tx_params = super().normalize_tx_params(tx_params)
        return self._underlying_method().estimateGas(tx_params.as_dict())


class MethodUsingNestedStructWithInnerStructNotUsedElsewhereMethod(
    ContractMethod
):  # pylint: disable=invalid-name
    """Various interfaces to the methodUsingNestedStructWithInnerStructNotUsedElsewhere method."""

    def __init__(
        self,
        web3_or_provider: Union[Web3, BaseProvider],
        contract_address: str,
        contract_function: ContractFunction,
    ):
        """Persist instance data."""
        super().__init__(web3_or_provider, contract_address)
        self._underlying_method = contract_function

    def call(
        self, tx_params: Optional[TxParams] = None
    ) -> AbiGenDummyNestedStructWithInnerStructNotUsedElsewhere:
        """Execute underlying contract method via eth_call.

        :param tx_params: transaction parameters

        """
        tx_params = super().normalize_tx_params(tx_params)
        returned = self._underlying_method().call(tx_params.as_dict())
        return AbiGenDummyNestedStructWithInnerStructNotUsedElsewhere(
            innerStruct=returned[0],
        )

    def estimate_gas(self, tx_params: Optional[TxParams] = None) -> int:
        """Estimate gas consumption of method call."""
        tx_params = super().normalize_tx_params(tx_params)
        return self._underlying_method().estimateGas(tx_params.as_dict())


class MultiInputMultiOutputMethod(
    ContractMethod
):  # pylint: disable=invalid-name
    """Various interfaces to the multiInputMultiOutput method."""

    def __init__(
        self,
        web3_or_provider: Union[Web3, BaseProvider],
        contract_address: str,
        contract_function: ContractFunction,
        validator: Validator = None,
    ):
        """Persist instance data."""
        super().__init__(web3_or_provider, contract_address, validator)
        self._underlying_method = contract_function

    def validate_and_normalize_inputs(
        self, index_0: int, index_1: Union[bytes, str], index_2: str
    ):
        """Validate the inputs to the multiInputMultiOutput method."""
        self.validator.assert_valid(
            method_name="multiInputMultiOutput",
            parameter_name="index_0",
            argument_value=index_0,
        )
        # safeguard against fractional inputs
        index_0 = int(index_0)
        self.validator.assert_valid(
            method_name="multiInputMultiOutput",
            parameter_name="index_1",
            argument_value=index_1,
        )
        self.validator.assert_valid(
            method_name="multiInputMultiOutput",
            parameter_name="index_2",
            argument_value=index_2,
        )
        return (index_0, index_1, index_2)

    def call(
        self,
        index_0: int,
        index_1: Union[bytes, str],
        index_2: str,
        tx_params: Optional[TxParams] = None,
    ) -> Tuple[Union[bytes, str], Union[bytes, str], str]:
        """Execute underlying contract method via eth_call.

        Tests decoding when the input and output are complex and have more than
        one argument.

        :param tx_params: transaction parameters

        """
        (index_0, index_1, index_2) = self.validate_and_normalize_inputs(
            index_0, index_1, index_2
        )
        tx_params = super().normalize_tx_params(tx_params)
        returned = self._underlying_method(index_0, index_1, index_2).call(
            tx_params.as_dict()
        )
        return (
            returned[0],
            returned[1],
            returned[2],
        )

    def estimate_gas(
        self,
        index_0: int,
        index_1: Union[bytes, str],
        index_2: str,
        tx_params: Optional[TxParams] = None,
    ) -> int:
        """Estimate gas consumption of method call."""
        (index_0, index_1, index_2) = self.validate_and_normalize_inputs(
            index_0, index_1, index_2
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self._underlying_method(index_0, index_1, index_2).estimateGas(
            tx_params.as_dict()
        )


class NestedStructInputMethod(ContractMethod):  # pylint: disable=invalid-name
    """Various interfaces to the nestedStructInput method."""

    def __init__(
        self,
        web3_or_provider: Union[Web3, BaseProvider],
        contract_address: str,
        contract_function: ContractFunction,
        validator: Validator = None,
    ):
        """Persist instance data."""
        super().__init__(web3_or_provider, contract_address, validator)
        self._underlying_method = contract_function

    def validate_and_normalize_inputs(self, n: AbiGenDummyNestedStruct):
        """Validate the inputs to the nestedStructInput method."""
        self.validator.assert_valid(
            method_name="nestedStructInput",
            parameter_name="n",
            argument_value=n,
        )
        return n

    def call(
        self, n: AbiGenDummyNestedStruct, tx_params: Optional[TxParams] = None
    ) -> None:
        """Execute underlying contract method via eth_call.

        :param tx_params: transaction parameters

        """
        (n) = self.validate_and_normalize_inputs(n)
        tx_params = super().normalize_tx_params(tx_params)
        self._underlying_method(n).call(tx_params.as_dict())

    def estimate_gas(
        self, n: AbiGenDummyNestedStruct, tx_params: Optional[TxParams] = None
    ) -> int:
        """Estimate gas consumption of method call."""
        (n) = self.validate_and_normalize_inputs(n)
        tx_params = super().normalize_tx_params(tx_params)
        return self._underlying_method(n).estimateGas(tx_params.as_dict())


class NestedStructOutputMethod(ContractMethod):  # pylint: disable=invalid-name
    """Various interfaces to the nestedStructOutput method."""

    def __init__(
        self,
        web3_or_provider: Union[Web3, BaseProvider],
        contract_address: str,
        contract_function: ContractFunction,
    ):
        """Persist instance data."""
        super().__init__(web3_or_provider, contract_address)
        self._underlying_method = contract_function

    def call(
        self, tx_params: Optional[TxParams] = None
    ) -> AbiGenDummyNestedStruct:
        """Execute underlying contract method via eth_call.

        :param tx_params: transaction parameters

        """
        tx_params = super().normalize_tx_params(tx_params)
        returned = self._underlying_method().call(tx_params.as_dict())
        return AbiGenDummyNestedStruct(
            innerStruct=returned[0], description=returned[1],
        )

    def estimate_gas(self, tx_params: Optional[TxParams] = None) -> int:
        """Estimate gas consumption of method call."""
        tx_params = super().normalize_tx_params(tx_params)
        return self._underlying_method().estimateGas(tx_params.as_dict())


class NoInputNoOutputMethod(ContractMethod):  # pylint: disable=invalid-name
    """Various interfaces to the noInputNoOutput method."""

    def __init__(
        self,
        web3_or_provider: Union[Web3, BaseProvider],
        contract_address: str,
        contract_function: ContractFunction,
    ):
        """Persist instance data."""
        super().__init__(web3_or_provider, contract_address)
        self._underlying_method = contract_function

    def call(self, tx_params: Optional[TxParams] = None) -> None:
        """Execute underlying contract method via eth_call.

        Tests decoding when both input and output are empty.

        :param tx_params: transaction parameters

        """
        tx_params = super().normalize_tx_params(tx_params)
        self._underlying_method().call(tx_params.as_dict())

    def estimate_gas(self, tx_params: Optional[TxParams] = None) -> int:
        """Estimate gas consumption of method call."""
        tx_params = super().normalize_tx_params(tx_params)
        return self._underlying_method().estimateGas(tx_params.as_dict())


class NoInputSimpleOutputMethod(
    ContractMethod
):  # pylint: disable=invalid-name
    """Various interfaces to the noInputSimpleOutput method."""

    def __init__(
        self,
        web3_or_provider: Union[Web3, BaseProvider],
        contract_address: str,
        contract_function: ContractFunction,
    ):
        """Persist instance data."""
        super().__init__(web3_or_provider, contract_address)
        self._underlying_method = contract_function

    def call(self, tx_params: Optional[TxParams] = None) -> int:
        """Execute underlying contract method via eth_call.

        Tests decoding when input is empty and output is non-empty.

        :param tx_params: transaction parameters

        """
        tx_params = super().normalize_tx_params(tx_params)
        returned = self._underlying_method().call(tx_params.as_dict())
        return int(returned)

    def estimate_gas(self, tx_params: Optional[TxParams] = None) -> int:
        """Estimate gas consumption of method call."""
        tx_params = super().normalize_tx_params(tx_params)
        return self._underlying_method().estimateGas(tx_params.as_dict())


class NonPureMethodMethod(ContractMethod):  # pylint: disable=invalid-name
    """Various interfaces to the nonPureMethod method."""

    def __init__(
        self,
        web3_or_provider: Union[Web3, BaseProvider],
        contract_address: str,
        contract_function: ContractFunction,
    ):
        """Persist instance data."""
        super().__init__(web3_or_provider, contract_address)
        self._underlying_method = contract_function

    def call(self, tx_params: Optional[TxParams] = None) -> int:
        """Execute underlying contract method via eth_call.

        :param tx_params: transaction parameters
        :returns: the return value of the underlying method.
        """
        tx_params = super().normalize_tx_params(tx_params)
        returned = self._underlying_method().call(tx_params.as_dict())
        return int(returned)

    def send_transaction(
        self, tx_params: Optional[TxParams] = None
    ) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        :param tx_params: transaction parameters
        """
        tx_params = super().normalize_tx_params(tx_params)
        return self._underlying_method().transact(tx_params.as_dict())

    def build_transaction(self, tx_params: Optional[TxParams] = None) -> dict:
        """Construct calldata to be used as input to the method."""
        tx_params = super().normalize_tx_params(tx_params)
        return self._underlying_method().buildTransaction(tx_params.as_dict())

    def estimate_gas(self, tx_params: Optional[TxParams] = None) -> int:
        """Estimate gas consumption of method call."""
        tx_params = super().normalize_tx_params(tx_params)
        return self._underlying_method().estimateGas(tx_params.as_dict())


class NonPureMethodThatReturnsNothingMethod(
    ContractMethod
):  # pylint: disable=invalid-name
    """Various interfaces to the nonPureMethodThatReturnsNothing method."""

    def __init__(
        self,
        web3_or_provider: Union[Web3, BaseProvider],
        contract_address: str,
        contract_function: ContractFunction,
    ):
        """Persist instance data."""
        super().__init__(web3_or_provider, contract_address)
        self._underlying_method = contract_function

    def call(self, tx_params: Optional[TxParams] = None) -> None:
        """Execute underlying contract method via eth_call.

        :param tx_params: transaction parameters
        :returns: the return value of the underlying method.
        """
        tx_params = super().normalize_tx_params(tx_params)
        self._underlying_method().call(tx_params.as_dict())

    def send_transaction(
        self, tx_params: Optional[TxParams] = None
    ) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        :param tx_params: transaction parameters
        """
        tx_params = super().normalize_tx_params(tx_params)
        return self._underlying_method().transact(tx_params.as_dict())

    def build_transaction(self, tx_params: Optional[TxParams] = None) -> dict:
        """Construct calldata to be used as input to the method."""
        tx_params = super().normalize_tx_params(tx_params)
        return self._underlying_method().buildTransaction(tx_params.as_dict())

    def estimate_gas(self, tx_params: Optional[TxParams] = None) -> int:
        """Estimate gas consumption of method call."""
        tx_params = super().normalize_tx_params(tx_params)
        return self._underlying_method().estimateGas(tx_params.as_dict())


class OverloadedMethod2Method(ContractMethod):  # pylint: disable=invalid-name
    """Various interfaces to the overloadedMethod method."""

    def __init__(
        self,
        web3_or_provider: Union[Web3, BaseProvider],
        contract_address: str,
        contract_function: ContractFunction,
        validator: Validator = None,
    ):
        """Persist instance data."""
        super().__init__(web3_or_provider, contract_address, validator)
        self._underlying_method = contract_function

    def validate_and_normalize_inputs(self, a: str):
        """Validate the inputs to the overloadedMethod method."""
        self.validator.assert_valid(
            method_name="overloadedMethod",
            parameter_name="a",
            argument_value=a,
        )
        return a

    def call(self, a: str, tx_params: Optional[TxParams] = None) -> None:
        """Execute underlying contract method via eth_call.

        :param tx_params: transaction parameters

        """
        (a) = self.validate_and_normalize_inputs(a)
        tx_params = super().normalize_tx_params(tx_params)
        self._underlying_method(a).call(tx_params.as_dict())

    def estimate_gas(
        self, a: str, tx_params: Optional[TxParams] = None
    ) -> int:
        """Estimate gas consumption of method call."""
        (a) = self.validate_and_normalize_inputs(a)
        tx_params = super().normalize_tx_params(tx_params)
        return self._underlying_method(a).estimateGas(tx_params.as_dict())


class OverloadedMethod1Method(ContractMethod):  # pylint: disable=invalid-name
    """Various interfaces to the overloadedMethod method."""

    def __init__(
        self,
        web3_or_provider: Union[Web3, BaseProvider],
        contract_address: str,
        contract_function: ContractFunction,
        validator: Validator = None,
    ):
        """Persist instance data."""
        super().__init__(web3_or_provider, contract_address, validator)
        self._underlying_method = contract_function

    def validate_and_normalize_inputs(self, a: int):
        """Validate the inputs to the overloadedMethod method."""
        self.validator.assert_valid(
            method_name="overloadedMethod",
            parameter_name="a",
            argument_value=a,
        )
        return a

    def call(self, a: int, tx_params: Optional[TxParams] = None) -> None:
        """Execute underlying contract method via eth_call.

        :param tx_params: transaction parameters

        """
        (a) = self.validate_and_normalize_inputs(a)
        tx_params = super().normalize_tx_params(tx_params)
        self._underlying_method(a).call(tx_params.as_dict())

    def estimate_gas(
        self, a: int, tx_params: Optional[TxParams] = None
    ) -> int:
        """Estimate gas consumption of method call."""
        (a) = self.validate_and_normalize_inputs(a)
        tx_params = super().normalize_tx_params(tx_params)
        return self._underlying_method(a).estimateGas(tx_params.as_dict())


class PureFunctionWithConstantMethod(
    ContractMethod
):  # pylint: disable=invalid-name
    """Various interfaces to the pureFunctionWithConstant method."""

    def __init__(
        self,
        web3_or_provider: Union[Web3, BaseProvider],
        contract_address: str,
        contract_function: ContractFunction,
    ):
        """Persist instance data."""
        super().__init__(web3_or_provider, contract_address)
        self._underlying_method = contract_function

    def call(self, tx_params: Optional[TxParams] = None) -> int:
        """Execute underlying contract method via eth_call.

        :param tx_params: transaction parameters

        """
        tx_params = super().normalize_tx_params(tx_params)
        returned = self._underlying_method().call(tx_params.as_dict())
        return int(returned)

    def estimate_gas(self, tx_params: Optional[TxParams] = None) -> int:
        """Estimate gas consumption of method call."""
        tx_params = super().normalize_tx_params(tx_params)
        return self._underlying_method().estimateGas(tx_params.as_dict())


class RequireWithConstantMethod(
    ContractMethod
):  # pylint: disable=invalid-name
    """Various interfaces to the requireWithConstant method."""

    def __init__(
        self,
        web3_or_provider: Union[Web3, BaseProvider],
        contract_address: str,
        contract_function: ContractFunction,
    ):
        """Persist instance data."""
        super().__init__(web3_or_provider, contract_address)
        self._underlying_method = contract_function

    def call(self, tx_params: Optional[TxParams] = None) -> None:
        """Execute underlying contract method via eth_call.

        :param tx_params: transaction parameters

        """
        tx_params = super().normalize_tx_params(tx_params)
        self._underlying_method().call(tx_params.as_dict())

    def estimate_gas(self, tx_params: Optional[TxParams] = None) -> int:
        """Estimate gas consumption of method call."""
        tx_params = super().normalize_tx_params(tx_params)
        return self._underlying_method().estimateGas(tx_params.as_dict())


class RevertWithConstantMethod(ContractMethod):  # pylint: disable=invalid-name
    """Various interfaces to the revertWithConstant method."""

    def __init__(
        self,
        web3_or_provider: Union[Web3, BaseProvider],
        contract_address: str,
        contract_function: ContractFunction,
    ):
        """Persist instance data."""
        super().__init__(web3_or_provider, contract_address)
        self._underlying_method = contract_function

    def call(self, tx_params: Optional[TxParams] = None) -> None:
        """Execute underlying contract method via eth_call.

        :param tx_params: transaction parameters

        """
        tx_params = super().normalize_tx_params(tx_params)
        self._underlying_method().call(tx_params.as_dict())

    def estimate_gas(self, tx_params: Optional[TxParams] = None) -> int:
        """Estimate gas consumption of method call."""
        tx_params = super().normalize_tx_params(tx_params)
        return self._underlying_method().estimateGas(tx_params.as_dict())


class SimpleInputNoOutputMethod(
    ContractMethod
):  # pylint: disable=invalid-name
    """Various interfaces to the simpleInputNoOutput method."""

    def __init__(
        self,
        web3_or_provider: Union[Web3, BaseProvider],
        contract_address: str,
        contract_function: ContractFunction,
        validator: Validator = None,
    ):
        """Persist instance data."""
        super().__init__(web3_or_provider, contract_address, validator)
        self._underlying_method = contract_function

    def validate_and_normalize_inputs(self, index_0: int):
        """Validate the inputs to the simpleInputNoOutput method."""
        self.validator.assert_valid(
            method_name="simpleInputNoOutput",
            parameter_name="index_0",
            argument_value=index_0,
        )
        # safeguard against fractional inputs
        index_0 = int(index_0)
        return index_0

    def call(self, index_0: int, tx_params: Optional[TxParams] = None) -> None:
        """Execute underlying contract method via eth_call.

        Tests decoding when input is not empty but output is empty.

        :param tx_params: transaction parameters

        """
        (index_0) = self.validate_and_normalize_inputs(index_0)
        tx_params = super().normalize_tx_params(tx_params)
        self._underlying_method(index_0).call(tx_params.as_dict())

    def estimate_gas(
        self, index_0: int, tx_params: Optional[TxParams] = None
    ) -> int:
        """Estimate gas consumption of method call."""
        (index_0) = self.validate_and_normalize_inputs(index_0)
        tx_params = super().normalize_tx_params(tx_params)
        return self._underlying_method(index_0).estimateGas(
            tx_params.as_dict()
        )


class SimpleInputSimpleOutputMethod(
    ContractMethod
):  # pylint: disable=invalid-name
    """Various interfaces to the simpleInputSimpleOutput method."""

    def __init__(
        self,
        web3_or_provider: Union[Web3, BaseProvider],
        contract_address: str,
        contract_function: ContractFunction,
        validator: Validator = None,
    ):
        """Persist instance data."""
        super().__init__(web3_or_provider, contract_address, validator)
        self._underlying_method = contract_function

    def validate_and_normalize_inputs(self, index_0: int):
        """Validate the inputs to the simpleInputSimpleOutput method."""
        self.validator.assert_valid(
            method_name="simpleInputSimpleOutput",
            parameter_name="index_0",
            argument_value=index_0,
        )
        # safeguard against fractional inputs
        index_0 = int(index_0)
        return index_0

    def call(self, index_0: int, tx_params: Optional[TxParams] = None) -> int:
        """Execute underlying contract method via eth_call.

        Tests decoding when both input and output are non-empty.

        :param tx_params: transaction parameters

        """
        (index_0) = self.validate_and_normalize_inputs(index_0)
        tx_params = super().normalize_tx_params(tx_params)
        returned = self._underlying_method(index_0).call(tx_params.as_dict())
        return int(returned)

    def estimate_gas(
        self, index_0: int, tx_params: Optional[TxParams] = None
    ) -> int:
        """Estimate gas consumption of method call."""
        (index_0) = self.validate_and_normalize_inputs(index_0)
        tx_params = super().normalize_tx_params(tx_params)
        return self._underlying_method(index_0).estimateGas(
            tx_params.as_dict()
        )


class SimplePureFunctionMethod(ContractMethod):  # pylint: disable=invalid-name
    """Various interfaces to the simplePureFunction method."""

    def __init__(
        self,
        web3_or_provider: Union[Web3, BaseProvider],
        contract_address: str,
        contract_function: ContractFunction,
    ):
        """Persist instance data."""
        super().__init__(web3_or_provider, contract_address)
        self._underlying_method = contract_function

    def call(self, tx_params: Optional[TxParams] = None) -> int:
        """Execute underlying contract method via eth_call.

        :param tx_params: transaction parameters

        """
        tx_params = super().normalize_tx_params(tx_params)
        returned = self._underlying_method().call(tx_params.as_dict())
        return int(returned)

    def estimate_gas(self, tx_params: Optional[TxParams] = None) -> int:
        """Estimate gas consumption of method call."""
        tx_params = super().normalize_tx_params(tx_params)
        return self._underlying_method().estimateGas(tx_params.as_dict())


class SimplePureFunctionWithInputMethod(
    ContractMethod
):  # pylint: disable=invalid-name
    """Various interfaces to the simplePureFunctionWithInput method."""

    def __init__(
        self,
        web3_or_provider: Union[Web3, BaseProvider],
        contract_address: str,
        contract_function: ContractFunction,
        validator: Validator = None,
    ):
        """Persist instance data."""
        super().__init__(web3_or_provider, contract_address, validator)
        self._underlying_method = contract_function

    def validate_and_normalize_inputs(self, x: int):
        """Validate the inputs to the simplePureFunctionWithInput method."""
        self.validator.assert_valid(
            method_name="simplePureFunctionWithInput",
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
        returned = self._underlying_method(x).call(tx_params.as_dict())
        return int(returned)

    def estimate_gas(
        self, x: int, tx_params: Optional[TxParams] = None
    ) -> int:
        """Estimate gas consumption of method call."""
        (x) = self.validate_and_normalize_inputs(x)
        tx_params = super().normalize_tx_params(tx_params)
        return self._underlying_method(x).estimateGas(tx_params.as_dict())


class SimpleRequireMethod(ContractMethod):  # pylint: disable=invalid-name
    """Various interfaces to the simpleRequire method."""

    def __init__(
        self,
        web3_or_provider: Union[Web3, BaseProvider],
        contract_address: str,
        contract_function: ContractFunction,
    ):
        """Persist instance data."""
        super().__init__(web3_or_provider, contract_address)
        self._underlying_method = contract_function

    def call(self, tx_params: Optional[TxParams] = None) -> None:
        """Execute underlying contract method via eth_call.

        :param tx_params: transaction parameters

        """
        tx_params = super().normalize_tx_params(tx_params)
        self._underlying_method().call(tx_params.as_dict())

    def estimate_gas(self, tx_params: Optional[TxParams] = None) -> int:
        """Estimate gas consumption of method call."""
        tx_params = super().normalize_tx_params(tx_params)
        return self._underlying_method().estimateGas(tx_params.as_dict())


class SimpleRevertMethod(ContractMethod):  # pylint: disable=invalid-name
    """Various interfaces to the simpleRevert method."""

    def __init__(
        self,
        web3_or_provider: Union[Web3, BaseProvider],
        contract_address: str,
        contract_function: ContractFunction,
    ):
        """Persist instance data."""
        super().__init__(web3_or_provider, contract_address)
        self._underlying_method = contract_function

    def call(self, tx_params: Optional[TxParams] = None) -> None:
        """Execute underlying contract method via eth_call.

        :param tx_params: transaction parameters

        """
        tx_params = super().normalize_tx_params(tx_params)
        self._underlying_method().call(tx_params.as_dict())

    def estimate_gas(self, tx_params: Optional[TxParams] = None) -> int:
        """Estimate gas consumption of method call."""
        tx_params = super().normalize_tx_params(tx_params)
        return self._underlying_method().estimateGas(tx_params.as_dict())


class StructInputMethod(ContractMethod):  # pylint: disable=invalid-name
    """Various interfaces to the structInput method."""

    def __init__(
        self,
        web3_or_provider: Union[Web3, BaseProvider],
        contract_address: str,
        contract_function: ContractFunction,
        validator: Validator = None,
    ):
        """Persist instance data."""
        super().__init__(web3_or_provider, contract_address, validator)
        self._underlying_method = contract_function

    def validate_and_normalize_inputs(self, s: AbiGenDummyStruct):
        """Validate the inputs to the structInput method."""
        self.validator.assert_valid(
            method_name="structInput", parameter_name="s", argument_value=s,
        )
        return s

    def call(
        self, s: AbiGenDummyStruct, tx_params: Optional[TxParams] = None
    ) -> None:
        """Execute underlying contract method via eth_call.

        :param tx_params: transaction parameters

        """
        (s) = self.validate_and_normalize_inputs(s)
        tx_params = super().normalize_tx_params(tx_params)
        self._underlying_method(s).call(tx_params.as_dict())

    def estimate_gas(
        self, s: AbiGenDummyStruct, tx_params: Optional[TxParams] = None
    ) -> int:
        """Estimate gas consumption of method call."""
        (s) = self.validate_and_normalize_inputs(s)
        tx_params = super().normalize_tx_params(tx_params)
        return self._underlying_method(s).estimateGas(tx_params.as_dict())


class StructOutputMethod(ContractMethod):  # pylint: disable=invalid-name
    """Various interfaces to the structOutput method."""

    def __init__(
        self,
        web3_or_provider: Union[Web3, BaseProvider],
        contract_address: str,
        contract_function: ContractFunction,
    ):
        """Persist instance data."""
        super().__init__(web3_or_provider, contract_address)
        self._underlying_method = contract_function

    def call(self, tx_params: Optional[TxParams] = None) -> AbiGenDummyStruct:
        """Execute underlying contract method via eth_call.

        a method that returns a struct

        :param tx_params: transaction parameters
        :returns: a Struct struct
        """
        tx_params = super().normalize_tx_params(tx_params)
        returned = self._underlying_method().call(tx_params.as_dict())
        return AbiGenDummyStruct(
            someBytes=returned[0],
            anInteger=returned[1],
            aDynamicArrayOfBytes=returned[2],
            aString=returned[3],
        )

    def estimate_gas(self, tx_params: Optional[TxParams] = None) -> int:
        """Estimate gas consumption of method call."""
        tx_params = super().normalize_tx_params(tx_params)
        return self._underlying_method().estimateGas(tx_params.as_dict())


class WithAddressInputMethod(ContractMethod):  # pylint: disable=invalid-name
    """Various interfaces to the withAddressInput method."""

    def __init__(
        self,
        web3_or_provider: Union[Web3, BaseProvider],
        contract_address: str,
        contract_function: ContractFunction,
        validator: Validator = None,
    ):
        """Persist instance data."""
        super().__init__(web3_or_provider, contract_address, validator)
        self._underlying_method = contract_function

    def validate_and_normalize_inputs(
        self, x: str, a: int, b: int, y: str, c: int
    ):
        """Validate the inputs to the withAddressInput method."""
        self.validator.assert_valid(
            method_name="withAddressInput",
            parameter_name="x",
            argument_value=x,
        )
        x = self.validate_and_checksum_address(x)
        self.validator.assert_valid(
            method_name="withAddressInput",
            parameter_name="a",
            argument_value=a,
        )
        # safeguard against fractional inputs
        a = int(a)
        self.validator.assert_valid(
            method_name="withAddressInput",
            parameter_name="b",
            argument_value=b,
        )
        # safeguard against fractional inputs
        b = int(b)
        self.validator.assert_valid(
            method_name="withAddressInput",
            parameter_name="y",
            argument_value=y,
        )
        y = self.validate_and_checksum_address(y)
        self.validator.assert_valid(
            method_name="withAddressInput",
            parameter_name="c",
            argument_value=c,
        )
        # safeguard against fractional inputs
        c = int(c)
        return (x, a, b, y, c)

    def call(
        self,
        x: str,
        a: int,
        b: int,
        y: str,
        c: int,
        tx_params: Optional[TxParams] = None,
    ) -> str:
        """Execute underlying contract method via eth_call.

        :param tx_params: transaction parameters

        """
        (x, a, b, y, c) = self.validate_and_normalize_inputs(x, a, b, y, c)
        tx_params = super().normalize_tx_params(tx_params)
        returned = self._underlying_method(x, a, b, y, c).call(
            tx_params.as_dict()
        )
        return str(returned)

    def estimate_gas(
        self,
        x: str,
        a: int,
        b: int,
        y: str,
        c: int,
        tx_params: Optional[TxParams] = None,
    ) -> int:
        """Estimate gas consumption of method call."""
        (x, a, b, y, c) = self.validate_and_normalize_inputs(x, a, b, y, c)
        tx_params = super().normalize_tx_params(tx_params)
        return self._underlying_method(x, a, b, y, c).estimateGas(
            tx_params.as_dict()
        )


class WithdrawMethod(ContractMethod):  # pylint: disable=invalid-name
    """Various interfaces to the withdraw method."""

    def __init__(
        self,
        web3_or_provider: Union[Web3, BaseProvider],
        contract_address: str,
        contract_function: ContractFunction,
        validator: Validator = None,
    ):
        """Persist instance data."""
        super().__init__(web3_or_provider, contract_address, validator)
        self._underlying_method = contract_function

    def validate_and_normalize_inputs(self, wad: int):
        """Validate the inputs to the withdraw method."""
        self.validator.assert_valid(
            method_name="withdraw", parameter_name="wad", argument_value=wad,
        )
        # safeguard against fractional inputs
        wad = int(wad)
        return wad

    def call(self, wad: int, tx_params: Optional[TxParams] = None) -> None:
        """Execute underlying contract method via eth_call.

        :param tx_params: transaction parameters
        :returns: the return value of the underlying method.
        """
        (wad) = self.validate_and_normalize_inputs(wad)
        tx_params = super().normalize_tx_params(tx_params)
        self._underlying_method(wad).call(tx_params.as_dict())

    def send_transaction(
        self, wad: int, tx_params: Optional[TxParams] = None
    ) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        :param tx_params: transaction parameters
        """
        (wad) = self.validate_and_normalize_inputs(wad)
        tx_params = super().normalize_tx_params(tx_params)
        return self._underlying_method(wad).transact(tx_params.as_dict())

    def build_transaction(
        self, wad: int, tx_params: Optional[TxParams] = None
    ) -> dict:
        """Construct calldata to be used as input to the method."""
        (wad) = self.validate_and_normalize_inputs(wad)
        tx_params = super().normalize_tx_params(tx_params)
        return self._underlying_method(wad).buildTransaction(
            tx_params.as_dict()
        )

    def estimate_gas(
        self, wad: int, tx_params: Optional[TxParams] = None
    ) -> int:
        """Estimate gas consumption of method call."""
        (wad) = self.validate_and_normalize_inputs(wad)
        tx_params = super().normalize_tx_params(tx_params)
        return self._underlying_method(wad).estimateGas(tx_params.as_dict())


# pylint: disable=too-many-public-methods,too-many-instance-attributes
class AbiGenDummy:
    """Wrapper class for AbiGenDummy Solidity contract.

    All method parameters of type `bytes`:code: should be encoded as UTF-8,
    which can be accomplished via `str.encode("utf_8")`:code:.
    """

    accepts_an_array_of_bytes: AcceptsAnArrayOfBytesMethod
    """Constructor-initialized instance of
    :class:`AcceptsAnArrayOfBytesMethod`.
    """

    accepts_bytes: AcceptsBytesMethod
    """Constructor-initialized instance of
    :class:`AcceptsBytesMethod`.
    """

    complex_input_complex_output: ComplexInputComplexOutputMethod
    """Constructor-initialized instance of
    :class:`ComplexInputComplexOutputMethod`.
    """

    ecrecover_fn: EcrecoverFnMethod
    """Constructor-initialized instance of
    :class:`EcrecoverFnMethod`.
    """

    emit_simple_event: EmitSimpleEventMethod
    """Constructor-initialized instance of
    :class:`EmitSimpleEventMethod`.
    """

    method_accepting_array_of_array_of_structs: MethodAcceptingArrayOfArrayOfStructsMethod
    """Constructor-initialized instance of
    :class:`MethodAcceptingArrayOfArrayOfStructsMethod`.
    """

    method_accepting_array_of_structs: MethodAcceptingArrayOfStructsMethod
    """Constructor-initialized instance of
    :class:`MethodAcceptingArrayOfStructsMethod`.
    """

    method_returning_array_of_structs: MethodReturningArrayOfStructsMethod
    """Constructor-initialized instance of
    :class:`MethodReturningArrayOfStructsMethod`.
    """

    method_returning_multiple_values: MethodReturningMultipleValuesMethod
    """Constructor-initialized instance of
    :class:`MethodReturningMultipleValuesMethod`.
    """

    method_using_nested_struct_with_inner_struct_not_used_elsewhere: MethodUsingNestedStructWithInnerStructNotUsedElsewhereMethod
    """Constructor-initialized instance of
    :class:`MethodUsingNestedStructWithInnerStructNotUsedElsewhereMethod`.
    """

    multi_input_multi_output: MultiInputMultiOutputMethod
    """Constructor-initialized instance of
    :class:`MultiInputMultiOutputMethod`.
    """

    nested_struct_input: NestedStructInputMethod
    """Constructor-initialized instance of
    :class:`NestedStructInputMethod`.
    """

    nested_struct_output: NestedStructOutputMethod
    """Constructor-initialized instance of
    :class:`NestedStructOutputMethod`.
    """

    no_input_no_output: NoInputNoOutputMethod
    """Constructor-initialized instance of
    :class:`NoInputNoOutputMethod`.
    """

    no_input_simple_output: NoInputSimpleOutputMethod
    """Constructor-initialized instance of
    :class:`NoInputSimpleOutputMethod`.
    """

    non_pure_method: NonPureMethodMethod
    """Constructor-initialized instance of
    :class:`NonPureMethodMethod`.
    """

    non_pure_method_that_returns_nothing: NonPureMethodThatReturnsNothingMethod
    """Constructor-initialized instance of
    :class:`NonPureMethodThatReturnsNothingMethod`.
    """

    overloaded_method2: OverloadedMethod2Method
    """Constructor-initialized instance of
    :class:`OverloadedMethod2Method`.
    """

    overloaded_method1: OverloadedMethod1Method
    """Constructor-initialized instance of
    :class:`OverloadedMethod1Method`.
    """

    pure_function_with_constant: PureFunctionWithConstantMethod
    """Constructor-initialized instance of
    :class:`PureFunctionWithConstantMethod`.
    """

    require_with_constant: RequireWithConstantMethod
    """Constructor-initialized instance of
    :class:`RequireWithConstantMethod`.
    """

    revert_with_constant: RevertWithConstantMethod
    """Constructor-initialized instance of
    :class:`RevertWithConstantMethod`.
    """

    simple_input_no_output: SimpleInputNoOutputMethod
    """Constructor-initialized instance of
    :class:`SimpleInputNoOutputMethod`.
    """

    simple_input_simple_output: SimpleInputSimpleOutputMethod
    """Constructor-initialized instance of
    :class:`SimpleInputSimpleOutputMethod`.
    """

    simple_pure_function: SimplePureFunctionMethod
    """Constructor-initialized instance of
    :class:`SimplePureFunctionMethod`.
    """

    simple_pure_function_with_input: SimplePureFunctionWithInputMethod
    """Constructor-initialized instance of
    :class:`SimplePureFunctionWithInputMethod`.
    """

    simple_require: SimpleRequireMethod
    """Constructor-initialized instance of
    :class:`SimpleRequireMethod`.
    """

    simple_revert: SimpleRevertMethod
    """Constructor-initialized instance of
    :class:`SimpleRevertMethod`.
    """

    struct_input: StructInputMethod
    """Constructor-initialized instance of
    :class:`StructInputMethod`.
    """

    struct_output: StructOutputMethod
    """Constructor-initialized instance of
    :class:`StructOutputMethod`.
    """

    with_address_input: WithAddressInputMethod
    """Constructor-initialized instance of
    :class:`WithAddressInputMethod`.
    """

    withdraw: WithdrawMethod
    """Constructor-initialized instance of
    :class:`WithdrawMethod`.
    """

    def __init__(
        self,
        web3_or_provider: Union[Web3, BaseProvider],
        contract_address: str,
        validator: AbiGenDummyValidator = None,
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
            validator = AbiGenDummyValidator(
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
            abi=AbiGenDummy.abi(),
        ).functions

        self.accepts_an_array_of_bytes = AcceptsAnArrayOfBytesMethod(
            web3_or_provider,
            contract_address,
            functions.acceptsAnArrayOfBytes,
            validator,
        )

        self.accepts_bytes = AcceptsBytesMethod(
            web3_or_provider,
            contract_address,
            functions.acceptsBytes,
            validator,
        )

        self.complex_input_complex_output = ComplexInputComplexOutputMethod(
            web3_or_provider,
            contract_address,
            functions.complexInputComplexOutput,
            validator,
        )

        self.ecrecover_fn = EcrecoverFnMethod(
            web3_or_provider,
            contract_address,
            functions.ecrecoverFn,
            validator,
        )

        self.emit_simple_event = EmitSimpleEventMethod(
            web3_or_provider, contract_address, functions.emitSimpleEvent
        )

        self.method_accepting_array_of_array_of_structs = MethodAcceptingArrayOfArrayOfStructsMethod(
            web3_or_provider,
            contract_address,
            functions.methodAcceptingArrayOfArrayOfStructs,
            validator,
        )

        self.method_accepting_array_of_structs = MethodAcceptingArrayOfStructsMethod(
            web3_or_provider,
            contract_address,
            functions.methodAcceptingArrayOfStructs,
            validator,
        )

        self.method_returning_array_of_structs = MethodReturningArrayOfStructsMethod(
            web3_or_provider,
            contract_address,
            functions.methodReturningArrayOfStructs,
        )

        self.method_returning_multiple_values = MethodReturningMultipleValuesMethod(
            web3_or_provider,
            contract_address,
            functions.methodReturningMultipleValues,
        )

        self.method_using_nested_struct_with_inner_struct_not_used_elsewhere = MethodUsingNestedStructWithInnerStructNotUsedElsewhereMethod(
            web3_or_provider,
            contract_address,
            functions.methodUsingNestedStructWithInnerStructNotUsedElsewhere,
        )

        self.multi_input_multi_output = MultiInputMultiOutputMethod(
            web3_or_provider,
            contract_address,
            functions.multiInputMultiOutput,
            validator,
        )

        self.nested_struct_input = NestedStructInputMethod(
            web3_or_provider,
            contract_address,
            functions.nestedStructInput,
            validator,
        )

        self.nested_struct_output = NestedStructOutputMethod(
            web3_or_provider, contract_address, functions.nestedStructOutput
        )

        self.no_input_no_output = NoInputNoOutputMethod(
            web3_or_provider, contract_address, functions.noInputNoOutput
        )

        self.no_input_simple_output = NoInputSimpleOutputMethod(
            web3_or_provider, contract_address, functions.noInputSimpleOutput
        )

        self.non_pure_method = NonPureMethodMethod(
            web3_or_provider, contract_address, functions.nonPureMethod
        )

        self.non_pure_method_that_returns_nothing = NonPureMethodThatReturnsNothingMethod(
            web3_or_provider,
            contract_address,
            functions.nonPureMethodThatReturnsNothing,
        )

        self.overloaded_method2 = OverloadedMethod2Method(
            web3_or_provider,
            contract_address,
            functions.overloadedMethod,
            validator,
        )

        self.overloaded_method1 = OverloadedMethod1Method(
            web3_or_provider,
            contract_address,
            functions.overloadedMethod,
            validator,
        )

        self.pure_function_with_constant = PureFunctionWithConstantMethod(
            web3_or_provider,
            contract_address,
            functions.pureFunctionWithConstant,
        )

        self.require_with_constant = RequireWithConstantMethod(
            web3_or_provider, contract_address, functions.requireWithConstant
        )

        self.revert_with_constant = RevertWithConstantMethod(
            web3_or_provider, contract_address, functions.revertWithConstant
        )

        self.simple_input_no_output = SimpleInputNoOutputMethod(
            web3_or_provider,
            contract_address,
            functions.simpleInputNoOutput,
            validator,
        )

        self.simple_input_simple_output = SimpleInputSimpleOutputMethod(
            web3_or_provider,
            contract_address,
            functions.simpleInputSimpleOutput,
            validator,
        )

        self.simple_pure_function = SimplePureFunctionMethod(
            web3_or_provider, contract_address, functions.simplePureFunction
        )

        self.simple_pure_function_with_input = SimplePureFunctionWithInputMethod(
            web3_or_provider,
            contract_address,
            functions.simplePureFunctionWithInput,
            validator,
        )

        self.simple_require = SimpleRequireMethod(
            web3_or_provider, contract_address, functions.simpleRequire
        )

        self.simple_revert = SimpleRevertMethod(
            web3_or_provider, contract_address, functions.simpleRevert
        )

        self.struct_input = StructInputMethod(
            web3_or_provider,
            contract_address,
            functions.structInput,
            validator,
        )

        self.struct_output = StructOutputMethod(
            web3_or_provider, contract_address, functions.structOutput
        )

        self.with_address_input = WithAddressInputMethod(
            web3_or_provider,
            contract_address,
            functions.withAddressInput,
            validator,
        )

        self.withdraw = WithdrawMethod(
            web3_or_provider, contract_address, functions.withdraw, validator
        )

    def get_simple_event_event(
        self, tx_hash: Union[HexBytes, bytes]
    ) -> Tuple[AttributeDict]:
        """Get log entry for SimpleEvent event.

        :param tx_hash: hash of transaction emitting SimpleEvent event
        """
        tx_receipt = self._web3_eth.getTransactionReceipt(tx_hash)
        return (
            self._web3_eth.contract(
                address=to_checksum_address(self.contract_address),
                abi=AbiGenDummy.abi(),
            )
            .events.SimpleEvent()
            .processReceipt(tx_receipt)
        )

    def get_withdrawal_event(
        self, tx_hash: Union[HexBytes, bytes]
    ) -> Tuple[AttributeDict]:
        """Get log entry for Withdrawal event.

        :param tx_hash: hash of transaction emitting Withdrawal event
        """
        tx_receipt = self._web3_eth.getTransactionReceipt(tx_hash)
        return (
            self._web3_eth.contract(
                address=to_checksum_address(self.contract_address),
                abi=AbiGenDummy.abi(),
            )
            .events.Withdrawal()
            .processReceipt(tx_receipt)
        )

    @staticmethod
    def abi():
        """Return the ABI to the underlying contract."""
        return json.loads(
            '[{"anonymous":false,"inputs":[{"indexed":false,"internalType":"bytes","name":"someBytes","type":"bytes"},{"indexed":false,"internalType":"string","name":"someString","type":"string"}],"name":"SimpleEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_owner","type":"address"},{"indexed":false,"internalType":"uint256","name":"_value","type":"uint256"}],"name":"Withdrawal","type":"event"},{"constant":true,"inputs":[{"internalType":"bytes[]","name":"a","type":"bytes[]"}],"name":"acceptsAnArrayOfBytes","outputs":[],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[{"internalType":"bytes","name":"a","type":"bytes"}],"name":"acceptsBytes","outputs":[],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[{"components":[{"internalType":"uint256","name":"foo","type":"uint256"},{"internalType":"bytes","name":"bar","type":"bytes"},{"internalType":"string","name":"car","type":"string"}],"internalType":"struct AbiGenDummy.ComplexInput","name":"complexInput","type":"tuple"}],"name":"complexInputComplexOutput","outputs":[{"components":[{"components":[{"internalType":"uint256","name":"foo","type":"uint256"},{"internalType":"bytes","name":"bar","type":"bytes"},{"internalType":"string","name":"car","type":"string"}],"internalType":"struct AbiGenDummy.ComplexInput","name":"input","type":"tuple"},{"internalType":"bytes","name":"lorem","type":"bytes"},{"internalType":"bytes","name":"ipsum","type":"bytes"},{"internalType":"string","name":"dolor","type":"string"}],"internalType":"struct AbiGenDummy.ComplexOutput","name":"","type":"tuple"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[{"internalType":"bytes32","name":"hash","type":"bytes32"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"ecrecoverFn","outputs":[{"internalType":"address","name":"signerAddress","type":"address"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":false,"inputs":[],"name":"emitSimpleEvent","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"components":[{"internalType":"bytes","name":"someBytes","type":"bytes"},{"internalType":"uint32","name":"anInteger","type":"uint32"},{"internalType":"bytes[]","name":"aDynamicArrayOfBytes","type":"bytes[]"},{"internalType":"string","name":"aString","type":"string"}],"internalType":"struct AbiGenDummy.Struct[][]","name":"index_0","type":"tuple[][]"}],"name":"methodAcceptingArrayOfArrayOfStructs","outputs":[],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[{"components":[{"internalType":"bytes","name":"someBytes","type":"bytes"},{"internalType":"uint32","name":"anInteger","type":"uint32"},{"internalType":"bytes[]","name":"aDynamicArrayOfBytes","type":"bytes[]"},{"internalType":"string","name":"aString","type":"string"}],"internalType":"struct AbiGenDummy.Struct[]","name":"index_0","type":"tuple[]"}],"name":"methodAcceptingArrayOfStructs","outputs":[],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[],"name":"methodReturningArrayOfStructs","outputs":[{"components":[{"internalType":"bytes","name":"someBytes","type":"bytes"},{"internalType":"uint32","name":"anInteger","type":"uint32"},{"internalType":"bytes[]","name":"aDynamicArrayOfBytes","type":"bytes[]"},{"internalType":"string","name":"aString","type":"string"}],"internalType":"struct AbiGenDummy.Struct[]","name":"","type":"tuple[]"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[],"name":"methodReturningMultipleValues","outputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[],"name":"methodUsingNestedStructWithInnerStructNotUsedElsewhere","outputs":[{"components":[{"components":[{"internalType":"uint256","name":"aField","type":"uint256"}],"internalType":"struct AbiGenDummy.StructNotDirectlyUsedAnywhere","name":"innerStruct","type":"tuple"}],"internalType":"struct AbiGenDummy.NestedStructWithInnerStructNotUsedElsewhere","name":"","type":"tuple"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[{"internalType":"uint256","name":"index_0","type":"uint256"},{"internalType":"bytes","name":"index_1","type":"bytes"},{"internalType":"string","name":"index_2","type":"string"}],"name":"multiInputMultiOutput","outputs":[{"internalType":"bytes","name":"","type":"bytes"},{"internalType":"bytes","name":"","type":"bytes"},{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[{"components":[{"components":[{"internalType":"bytes","name":"someBytes","type":"bytes"},{"internalType":"uint32","name":"anInteger","type":"uint32"},{"internalType":"bytes[]","name":"aDynamicArrayOfBytes","type":"bytes[]"},{"internalType":"string","name":"aString","type":"string"}],"internalType":"struct AbiGenDummy.Struct","name":"innerStruct","type":"tuple"},{"internalType":"string","name":"description","type":"string"}],"internalType":"struct AbiGenDummy.NestedStruct","name":"n","type":"tuple"}],"name":"nestedStructInput","outputs":[],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[],"name":"nestedStructOutput","outputs":[{"components":[{"components":[{"internalType":"bytes","name":"someBytes","type":"bytes"},{"internalType":"uint32","name":"anInteger","type":"uint32"},{"internalType":"bytes[]","name":"aDynamicArrayOfBytes","type":"bytes[]"},{"internalType":"string","name":"aString","type":"string"}],"internalType":"struct AbiGenDummy.Struct","name":"innerStruct","type":"tuple"},{"internalType":"string","name":"description","type":"string"}],"internalType":"struct AbiGenDummy.NestedStruct","name":"","type":"tuple"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[],"name":"noInputNoOutput","outputs":[],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[],"name":"noInputSimpleOutput","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":false,"inputs":[],"name":"nonPureMethod","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"nonPureMethodThatReturnsNothing","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"internalType":"string","name":"a","type":"string"}],"name":"overloadedMethod","outputs":[],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[{"internalType":"int256","name":"a","type":"int256"}],"name":"overloadedMethod","outputs":[],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[],"name":"pureFunctionWithConstant","outputs":[{"internalType":"uint256","name":"someConstant","type":"uint256"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[],"name":"requireWithConstant","outputs":[],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[],"name":"revertWithConstant","outputs":[],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[{"internalType":"uint256","name":"index_0","type":"uint256"}],"name":"simpleInputNoOutput","outputs":[],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[{"internalType":"uint256","name":"index_0","type":"uint256"}],"name":"simpleInputSimpleOutput","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[],"name":"simplePureFunction","outputs":[{"internalType":"uint256","name":"result","type":"uint256"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[{"internalType":"uint256","name":"x","type":"uint256"}],"name":"simplePureFunctionWithInput","outputs":[{"internalType":"uint256","name":"sum","type":"uint256"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[],"name":"simpleRequire","outputs":[],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[],"name":"simpleRevert","outputs":[],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[{"components":[{"internalType":"bytes","name":"someBytes","type":"bytes"},{"internalType":"uint32","name":"anInteger","type":"uint32"},{"internalType":"bytes[]","name":"aDynamicArrayOfBytes","type":"bytes[]"},{"internalType":"string","name":"aString","type":"string"}],"internalType":"struct AbiGenDummy.Struct","name":"s","type":"tuple"}],"name":"structInput","outputs":[],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[],"name":"structOutput","outputs":[{"components":[{"internalType":"bytes","name":"someBytes","type":"bytes"},{"internalType":"uint32","name":"anInteger","type":"uint32"},{"internalType":"bytes[]","name":"aDynamicArrayOfBytes","type":"bytes[]"},{"internalType":"string","name":"aString","type":"string"}],"internalType":"struct AbiGenDummy.Struct","name":"s","type":"tuple"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"x","type":"address"},{"internalType":"uint256","name":"a","type":"uint256"},{"internalType":"uint256","name":"b","type":"uint256"},{"internalType":"address","name":"y","type":"address"},{"internalType":"uint256","name":"c","type":"uint256"}],"name":"withAddressInput","outputs":[{"internalType":"address","name":"z","type":"address"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":false,"inputs":[{"internalType":"uint256","name":"wad","type":"uint256"}],"name":"withdraw","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"}]'  # noqa: E501 (line-too-long)
        )


# pylint: disable=too-many-lines
