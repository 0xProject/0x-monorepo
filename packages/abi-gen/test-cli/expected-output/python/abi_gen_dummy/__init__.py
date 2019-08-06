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

    class AbiGenDummyValidator(Validator):  # type: ignore
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

class Tuple0xf95128ef(TypedDict):
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

    foo: int

    bar: bytes

    car: str

class Tuple0xa057bf41(TypedDict):
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

    input: Tuple0xf95128ef

    lorem: bytes

    ipsum: bytes

    dolor: str


class SimpleRequireMethod(ContractMethod):
    """Various interfaces to the simpleRequire method."""

    def __init__(self, provider: BaseProvider, contract_address: str, contract_function: ContractFunction, validator: Validator=None):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def call(self, tx_params: Optional[TxParams] = None) -> None:
        """Execute underlying contract method via eth_call.

        :param tx_params: transaction parameters

        """
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method().call(tx_params.as_dict())

    def send_transaction(self, tx_params: Optional[TxParams] = None) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        :param tx_params: transaction parameters

        """
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method().transact(tx_params.as_dict())

    def estimate_gas(self, tx_params: Optional[TxParams] = None) -> int:
        """Estimate gas consumption of method call."""
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method().estimateGas(tx_params.as_dict())

class AcceptsAnArrayOfBytesMethod(ContractMethod):
    """Various interfaces to the acceptsAnArrayOfBytes method."""

    def __init__(self, provider: BaseProvider, contract_address: str, contract_function: ContractFunction, validator: Validator=None):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def validate_and_normalize_inputs(self, a: List[bytes]):
        """Validate the inputs to the acceptsAnArrayOfBytes method."""
        self.validator.assert_valid(
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
        """Execute underlying contract method via eth_call.

        a method that accepts an array of bytes

        :param a: the array of bytes being accepted
        :param tx_params: transaction parameters

        """
        (a) = self.validate_and_normalize_inputs(a)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(a).call(tx_params.as_dict())

    def send_transaction(self, a: List[bytes], tx_params: Optional[TxParams] = None) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        a method that accepts an array of bytes

        :param a: the array of bytes being accepted
        :param tx_params: transaction parameters

        """
        (a) = self.validate_and_normalize_inputs(a)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(a).transact(tx_params.as_dict())

    def estimate_gas(self, a: List[bytes], tx_params: Optional[TxParams] = None) -> int:
        """Estimate gas consumption of method call."""
        (a) = self.validate_and_normalize_inputs(a)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(a).estimateGas(tx_params.as_dict())

class SimpleInputSimpleOutputMethod(ContractMethod):
    """Various interfaces to the simpleInputSimpleOutput method."""

    def __init__(self, provider: BaseProvider, contract_address: str, contract_function: ContractFunction, validator: Validator=None):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def validate_and_normalize_inputs(self, index_0: int):
        """Validate the inputs to the simpleInputSimpleOutput method."""
        self.validator.assert_valid(
            method_name='simpleInputSimpleOutput',
            parameter_name='index_0',
            argument_value=index_0,
        )
        # safeguard against fractional inputs
        index_0 = int(index_0)
        return (index_0)

    def call(self, index_0: int, tx_params: Optional[TxParams] = None) -> int:
        """Execute underlying contract method via eth_call.

        Tests decoding when both input and output are non-empty.

        :param tx_params: transaction parameters

        """
        (index_0) = self.validate_and_normalize_inputs(index_0)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(index_0).call(tx_params.as_dict())

    def send_transaction(self, index_0: int, tx_params: Optional[TxParams] = None) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        Tests decoding when both input and output are non-empty.

        :param tx_params: transaction parameters

        """
        (index_0) = self.validate_and_normalize_inputs(index_0)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(index_0).transact(tx_params.as_dict())

    def estimate_gas(self, index_0: int, tx_params: Optional[TxParams] = None) -> int:
        """Estimate gas consumption of method call."""
        (index_0) = self.validate_and_normalize_inputs(index_0)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(index_0).estimateGas(tx_params.as_dict())

class WithdrawMethod(ContractMethod):
    """Various interfaces to the withdraw method."""

    def __init__(self, provider: BaseProvider, contract_address: str, contract_function: ContractFunction, validator: Validator=None):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def validate_and_normalize_inputs(self, wad: int):
        """Validate the inputs to the withdraw method."""
        self.validator.assert_valid(
            method_name='withdraw',
            parameter_name='wad',
            argument_value=wad,
        )
        # safeguard against fractional inputs
        wad = int(wad)
        return (wad)

    def call(self, wad: int, tx_params: Optional[TxParams] = None) -> Union[None, Union[HexBytes, bytes]]:
        """Execute underlying contract method via eth_call.

        :param tx_params: transaction parameters
        :returns: the return value of the underlying method.
        """
        (wad) = self.validate_and_normalize_inputs(wad)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(wad).call(tx_params.as_dict())

    def send_transaction(self, wad: int, tx_params: Optional[TxParams] = None) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        :param tx_params: transaction parameters
        """
        (wad) = self.validate_and_normalize_inputs(wad)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(wad).transact(tx_params.as_dict())

    def estimate_gas(self, wad: int, tx_params: Optional[TxParams] = None) -> int:
        """Estimate gas consumption of method call."""
        (wad) = self.validate_and_normalize_inputs(wad)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(wad).estimateGas(tx_params.as_dict())

class MultiInputMultiOutputMethod(ContractMethod):
    """Various interfaces to the multiInputMultiOutput method."""

    def __init__(self, provider: BaseProvider, contract_address: str, contract_function: ContractFunction, validator: Validator=None):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def validate_and_normalize_inputs(self, index_0: int, index_1: bytes, index_2: str):
        """Validate the inputs to the multiInputMultiOutput method."""
        self.validator.assert_valid(
            method_name='multiInputMultiOutput',
            parameter_name='index_0',
            argument_value=index_0,
        )
        # safeguard against fractional inputs
        index_0 = int(index_0)
        self.validator.assert_valid(
            method_name='multiInputMultiOutput',
            parameter_name='index_1',
            argument_value=index_1,
        )
        index_1 = bytes.fromhex(index_1.decode("utf-8"))
        self.validator.assert_valid(
            method_name='multiInputMultiOutput',
            parameter_name='index_2',
            argument_value=index_2,
        )
        return (index_0, index_1, index_2)

    def call(self, index_0: int, index_1: bytes, index_2: str, tx_params: Optional[TxParams] = None) -> [bytes, bytes, str]
:
        """Execute underlying contract method via eth_call.

        Tests decoding when the input and output are complex and have more than
        one argument.

        :param tx_params: transaction parameters

        """
        (index_0, index_1, index_2) = self.validate_and_normalize_inputs(index_0, index_1, index_2)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(index_0, index_1, index_2).call(tx_params.as_dict())

    def send_transaction(self, index_0: int, index_1: bytes, index_2: str, tx_params: Optional[TxParams] = None) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        Tests decoding when the input and output are complex and have more than
        one argument.

        :param tx_params: transaction parameters

        """
        (index_0, index_1, index_2) = self.validate_and_normalize_inputs(index_0, index_1, index_2)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(index_0, index_1, index_2).transact(tx_params.as_dict())

    def estimate_gas(self, index_0: int, index_1: bytes, index_2: str, tx_params: Optional[TxParams] = None) -> int:
        """Estimate gas consumption of method call."""
        (index_0, index_1, index_2) = self.validate_and_normalize_inputs(index_0, index_1, index_2)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(index_0, index_1, index_2).estimateGas(tx_params.as_dict())

class EcrecoverFnMethod(ContractMethod):
    """Various interfaces to the ecrecoverFn method."""

    def __init__(self, provider: BaseProvider, contract_address: str, contract_function: ContractFunction, validator: Validator=None):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def validate_and_normalize_inputs(self, _hash: bytes, v: int, r: bytes, s: bytes):
        """Validate the inputs to the ecrecoverFn method."""
        self.validator.assert_valid(
            method_name='ecrecoverFn',
            parameter_name='hash',
            argument_value=_hash,
        )
        self.validator.assert_valid(
            method_name='ecrecoverFn',
            parameter_name='v',
            argument_value=v,
        )
        self.validator.assert_valid(
            method_name='ecrecoverFn',
            parameter_name='r',
            argument_value=r,
        )
        self.validator.assert_valid(
            method_name='ecrecoverFn',
            parameter_name='s',
            argument_value=s,
        )
        return (_hash, v, r, s)

    def call(self, _hash: bytes, v: int, r: bytes, s: bytes, tx_params: Optional[TxParams] = None) -> str:
        """Execute underlying contract method via eth_call.

        test that devdocs will be generated and     that multiline devdocs will
        look okay

        :param hash: description of some hash. Let's make this line super long
            to demonstrate hanging indents for method params. It has to be more
            than one hundred twenty columns.
        :param r: ECDSA r output
        :param s: ECDSA s output
        :param v: some v, recovery id
        :param tx_params: transaction parameters
        :returns: the signerAddress that created this signature
        """
        (_hash, v, r, s) = self.validate_and_normalize_inputs(_hash, v, r, s)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(_hash, v, r, s).call(tx_params.as_dict())

    def send_transaction(self, _hash: bytes, v: int, r: bytes, s: bytes, tx_params: Optional[TxParams] = None) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        test that devdocs will be generated and     that multiline devdocs will
        look okay

        :param hash: description of some hash. Let's make this line super long
            to demonstrate hanging indents for method params. It has to be more
            than one hundred twenty columns.
        :param r: ECDSA r output
        :param s: ECDSA s output
        :param v: some v, recovery id
        :param tx_params: transaction parameters
        :returns: the signerAddress that created this signature
        """
        (_hash, v, r, s) = self.validate_and_normalize_inputs(_hash, v, r, s)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(_hash, v, r, s).transact(tx_params.as_dict())

    def estimate_gas(self, _hash: bytes, v: int, r: bytes, s: bytes, tx_params: Optional[TxParams] = None) -> int:
        """Estimate gas consumption of method call."""
        (_hash, v, r, s) = self.validate_and_normalize_inputs(_hash, v, r, s)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(_hash, v, r, s).estimateGas(tx_params.as_dict())

class AcceptsBytesMethod(ContractMethod):
    """Various interfaces to the acceptsBytes method."""

    def __init__(self, provider: BaseProvider, contract_address: str, contract_function: ContractFunction, validator: Validator=None):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def validate_and_normalize_inputs(self, a: bytes):
        """Validate the inputs to the acceptsBytes method."""
        self.validator.assert_valid(
            method_name='acceptsBytes',
            parameter_name='a',
            argument_value=a,
        )
        a = bytes.fromhex(a.decode("utf-8"))
        return (a)

    def call(self, a: bytes, tx_params: Optional[TxParams] = None) -> None:
        """Execute underlying contract method via eth_call.

        :param tx_params: transaction parameters

        """
        (a) = self.validate_and_normalize_inputs(a)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(a).call(tx_params.as_dict())

    def send_transaction(self, a: bytes, tx_params: Optional[TxParams] = None) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        :param tx_params: transaction parameters

        """
        (a) = self.validate_and_normalize_inputs(a)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(a).transact(tx_params.as_dict())

    def estimate_gas(self, a: bytes, tx_params: Optional[TxParams] = None) -> int:
        """Estimate gas consumption of method call."""
        (a) = self.validate_and_normalize_inputs(a)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(a).estimateGas(tx_params.as_dict())

class NoInputSimpleOutputMethod(ContractMethod):
    """Various interfaces to the noInputSimpleOutput method."""

    def __init__(self, provider: BaseProvider, contract_address: str, contract_function: ContractFunction, validator: Validator=None):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def call(self, tx_params: Optional[TxParams] = None) -> int:
        """Execute underlying contract method via eth_call.

        Tests decoding when input is empty and output is non-empty.

        :param tx_params: transaction parameters

        """
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method().call(tx_params.as_dict())

    def send_transaction(self, tx_params: Optional[TxParams] = None) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        Tests decoding when input is empty and output is non-empty.

        :param tx_params: transaction parameters

        """
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method().transact(tx_params.as_dict())

    def estimate_gas(self, tx_params: Optional[TxParams] = None) -> int:
        """Estimate gas consumption of method call."""
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method().estimateGas(tx_params.as_dict())

class RevertWithConstantMethod(ContractMethod):
    """Various interfaces to the revertWithConstant method."""

    def __init__(self, provider: BaseProvider, contract_address: str, contract_function: ContractFunction, validator: Validator=None):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def call(self, tx_params: Optional[TxParams] = None) -> None:
        """Execute underlying contract method via eth_call.

        :param tx_params: transaction parameters

        """
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method().call(tx_params.as_dict())

    def send_transaction(self, tx_params: Optional[TxParams] = None) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        :param tx_params: transaction parameters

        """
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method().transact(tx_params.as_dict())

    def estimate_gas(self, tx_params: Optional[TxParams] = None) -> int:
        """Estimate gas consumption of method call."""
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method().estimateGas(tx_params.as_dict())

class SimpleRevertMethod(ContractMethod):
    """Various interfaces to the simpleRevert method."""

    def __init__(self, provider: BaseProvider, contract_address: str, contract_function: ContractFunction, validator: Validator=None):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def call(self, tx_params: Optional[TxParams] = None) -> None:
        """Execute underlying contract method via eth_call.

        :param tx_params: transaction parameters

        """
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method().call(tx_params.as_dict())

    def send_transaction(self, tx_params: Optional[TxParams] = None) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        :param tx_params: transaction parameters

        """
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method().transact(tx_params.as_dict())

    def estimate_gas(self, tx_params: Optional[TxParams] = None) -> int:
        """Estimate gas consumption of method call."""
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method().estimateGas(tx_params.as_dict())

class NestedStructOutputMethod(ContractMethod):
    """Various interfaces to the nestedStructOutput method."""

    def __init__(self, provider: BaseProvider, contract_address: str, contract_function: ContractFunction, validator: Validator=None):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def call(self, tx_params: Optional[TxParams] = None) -> Tuple0xc9bdd2d5:
        """Execute underlying contract method via eth_call.

        :param tx_params: transaction parameters

        """
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method().call(tx_params.as_dict())

    def send_transaction(self, tx_params: Optional[TxParams] = None) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        :param tx_params: transaction parameters

        """
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method().transact(tx_params.as_dict())

    def estimate_gas(self, tx_params: Optional[TxParams] = None) -> int:
        """Estimate gas consumption of method call."""
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method().estimateGas(tx_params.as_dict())

class RequireWithConstantMethod(ContractMethod):
    """Various interfaces to the requireWithConstant method."""

    def __init__(self, provider: BaseProvider, contract_address: str, contract_function: ContractFunction, validator: Validator=None):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def call(self, tx_params: Optional[TxParams] = None) -> None:
        """Execute underlying contract method via eth_call.

        :param tx_params: transaction parameters

        """
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method().call(tx_params.as_dict())

    def send_transaction(self, tx_params: Optional[TxParams] = None) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        :param tx_params: transaction parameters

        """
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method().transact(tx_params.as_dict())

    def estimate_gas(self, tx_params: Optional[TxParams] = None) -> int:
        """Estimate gas consumption of method call."""
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method().estimateGas(tx_params.as_dict())

class WithAddressInputMethod(ContractMethod):
    """Various interfaces to the withAddressInput method."""

    def __init__(self, provider: BaseProvider, contract_address: str, contract_function: ContractFunction, validator: Validator=None):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def validate_and_normalize_inputs(self, x: str, a: int, b: int, y: str, c: int):
        """Validate the inputs to the withAddressInput method."""
        self.validator.assert_valid(
            method_name='withAddressInput',
            parameter_name='x',
            argument_value=x,
        )
        x = self.validate_and_checksum_address(x)
        self.validator.assert_valid(
            method_name='withAddressInput',
            parameter_name='a',
            argument_value=a,
        )
        # safeguard against fractional inputs
        a = int(a)
        self.validator.assert_valid(
            method_name='withAddressInput',
            parameter_name='b',
            argument_value=b,
        )
        # safeguard against fractional inputs
        b = int(b)
        self.validator.assert_valid(
            method_name='withAddressInput',
            parameter_name='y',
            argument_value=y,
        )
        y = self.validate_and_checksum_address(y)
        self.validator.assert_valid(
            method_name='withAddressInput',
            parameter_name='c',
            argument_value=c,
        )
        # safeguard against fractional inputs
        c = int(c)
        return (x, a, b, y, c)

    def call(self, x: str, a: int, b: int, y: str, c: int, tx_params: Optional[TxParams] = None) -> str:
        """Execute underlying contract method via eth_call.

        :param tx_params: transaction parameters

        """
        (x, a, b, y, c) = self.validate_and_normalize_inputs(x, a, b, y, c)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(x, a, b, y, c).call(tx_params.as_dict())

    def send_transaction(self, x: str, a: int, b: int, y: str, c: int, tx_params: Optional[TxParams] = None) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        :param tx_params: transaction parameters

        """
        (x, a, b, y, c) = self.validate_and_normalize_inputs(x, a, b, y, c)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(x, a, b, y, c).transact(tx_params.as_dict())

    def estimate_gas(self, x: str, a: int, b: int, y: str, c: int, tx_params: Optional[TxParams] = None) -> int:
        """Estimate gas consumption of method call."""
        (x, a, b, y, c) = self.validate_and_normalize_inputs(x, a, b, y, c)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(x, a, b, y, c).estimateGas(tx_params.as_dict())

class StructInputMethod(ContractMethod):
    """Various interfaces to the structInput method."""

    def __init__(self, provider: BaseProvider, contract_address: str, contract_function: ContractFunction, validator: Validator=None):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def validate_and_normalize_inputs(self, s: Tuple0xcf8ad995):
        """Validate the inputs to the structInput method."""
        self.validator.assert_valid(
            method_name='structInput',
            parameter_name='s',
            argument_value=s,
        )
        return (s)

    def call(self, s: Tuple0xcf8ad995, tx_params: Optional[TxParams] = None) -> None:
        """Execute underlying contract method via eth_call.

        :param tx_params: transaction parameters

        """
        (s) = self.validate_and_normalize_inputs(s)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(s).call(tx_params.as_dict())

    def send_transaction(self, s: Tuple0xcf8ad995, tx_params: Optional[TxParams] = None) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        :param tx_params: transaction parameters

        """
        (s) = self.validate_and_normalize_inputs(s)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(s).transact(tx_params.as_dict())

    def estimate_gas(self, s: Tuple0xcf8ad995, tx_params: Optional[TxParams] = None) -> int:
        """Estimate gas consumption of method call."""
        (s) = self.validate_and_normalize_inputs(s)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(s).estimateGas(tx_params.as_dict())

class NonPureMethodMethod(ContractMethod):
    """Various interfaces to the nonPureMethod method."""

    def __init__(self, provider: BaseProvider, contract_address: str, contract_function: ContractFunction, validator: Validator=None):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def call(self, tx_params: Optional[TxParams] = None) -> Union[int, Union[HexBytes, bytes]]:
        """Execute underlying contract method via eth_call.

        :param tx_params: transaction parameters
        :returns: the return value of the underlying method.
        """
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method().call(tx_params.as_dict())

    def send_transaction(self, tx_params: Optional[TxParams] = None) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        :param tx_params: transaction parameters
        """
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method().transact(tx_params.as_dict())

    def estimate_gas(self, tx_params: Optional[TxParams] = None) -> int:
        """Estimate gas consumption of method call."""
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method().estimateGas(tx_params.as_dict())

class ComplexInputComplexOutputMethod(ContractMethod):
    """Various interfaces to the complexInputComplexOutput method."""

    def __init__(self, provider: BaseProvider, contract_address: str, contract_function: ContractFunction, validator: Validator=None):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def validate_and_normalize_inputs(self, complex_input: Tuple0xf95128ef):
        """Validate the inputs to the complexInputComplexOutput method."""
        self.validator.assert_valid(
            method_name='complexInputComplexOutput',
            parameter_name='complexInput',
            argument_value=complex_input,
        )
        return (complex_input)

    def call(self, complex_input: Tuple0xf95128ef, tx_params: Optional[TxParams] = None) -> Tuple0xa057bf41:
        """Execute underlying contract method via eth_call.

        Tests decoding when the input and output are complex.

        :param tx_params: transaction parameters

        """
        (complex_input) = self.validate_and_normalize_inputs(complex_input)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(complex_input).call(tx_params.as_dict())

    def send_transaction(self, complex_input: Tuple0xf95128ef, tx_params: Optional[TxParams] = None) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        Tests decoding when the input and output are complex.

        :param tx_params: transaction parameters

        """
        (complex_input) = self.validate_and_normalize_inputs(complex_input)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(complex_input).transact(tx_params.as_dict())

    def estimate_gas(self, complex_input: Tuple0xf95128ef, tx_params: Optional[TxParams] = None) -> int:
        """Estimate gas consumption of method call."""
        (complex_input) = self.validate_and_normalize_inputs(complex_input)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(complex_input).estimateGas(tx_params.as_dict())

class NoInputNoOutputMethod(ContractMethod):
    """Various interfaces to the noInputNoOutput method."""

    def __init__(self, provider: BaseProvider, contract_address: str, contract_function: ContractFunction, validator: Validator=None):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def call(self, tx_params: Optional[TxParams] = None) -> None:
        """Execute underlying contract method via eth_call.

        Tests decoding when both input and output are empty.

        :param tx_params: transaction parameters

        """
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method().call(tx_params.as_dict())

    def send_transaction(self, tx_params: Optional[TxParams] = None) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        Tests decoding when both input and output are empty.

        :param tx_params: transaction parameters

        """
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method().transact(tx_params.as_dict())

    def estimate_gas(self, tx_params: Optional[TxParams] = None) -> int:
        """Estimate gas consumption of method call."""
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method().estimateGas(tx_params.as_dict())

class SimplePureFunctionWithInputMethod(ContractMethod):
    """Various interfaces to the simplePureFunctionWithInput method."""

    def __init__(self, provider: BaseProvider, contract_address: str, contract_function: ContractFunction, validator: Validator=None):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def validate_and_normalize_inputs(self, x: int):
        """Validate the inputs to the simplePureFunctionWithInput method."""
        self.validator.assert_valid(
            method_name='simplePureFunctionWithInput',
            parameter_name='x',
            argument_value=x,
        )
        # safeguard against fractional inputs
        x = int(x)
        return (x)

    def call(self, x: int, tx_params: Optional[TxParams] = None) -> int:
        """Execute underlying contract method via eth_call.

        :param tx_params: transaction parameters

        """
        (x) = self.validate_and_normalize_inputs(x)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(x).call(tx_params.as_dict())

    def send_transaction(self, x: int, tx_params: Optional[TxParams] = None) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        :param tx_params: transaction parameters

        """
        (x) = self.validate_and_normalize_inputs(x)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(x).transact(tx_params.as_dict())

    def estimate_gas(self, x: int, tx_params: Optional[TxParams] = None) -> int:
        """Estimate gas consumption of method call."""
        (x) = self.validate_and_normalize_inputs(x)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(x).estimateGas(tx_params.as_dict())

class NonPureMethodThatReturnsNothingMethod(ContractMethod):
    """Various interfaces to the nonPureMethodThatReturnsNothing method."""

    def __init__(self, provider: BaseProvider, contract_address: str, contract_function: ContractFunction, validator: Validator=None):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def call(self, tx_params: Optional[TxParams] = None) -> Union[None, Union[HexBytes, bytes]]:
        """Execute underlying contract method via eth_call.

        :param tx_params: transaction parameters
        :returns: the return value of the underlying method.
        """
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method().call(tx_params.as_dict())

    def send_transaction(self, tx_params: Optional[TxParams] = None) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        :param tx_params: transaction parameters
        """
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method().transact(tx_params.as_dict())

    def estimate_gas(self, tx_params: Optional[TxParams] = None) -> int:
        """Estimate gas consumption of method call."""
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method().estimateGas(tx_params.as_dict())

class SimplePureFunctionMethod(ContractMethod):
    """Various interfaces to the simplePureFunction method."""

    def __init__(self, provider: BaseProvider, contract_address: str, contract_function: ContractFunction, validator: Validator=None):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def call(self, tx_params: Optional[TxParams] = None) -> int:
        """Execute underlying contract method via eth_call.

        :param tx_params: transaction parameters

        """
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method().call(tx_params.as_dict())

    def send_transaction(self, tx_params: Optional[TxParams] = None) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        :param tx_params: transaction parameters

        """
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method().transact(tx_params.as_dict())

    def estimate_gas(self, tx_params: Optional[TxParams] = None) -> int:
        """Estimate gas consumption of method call."""
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method().estimateGas(tx_params.as_dict())

class NestedStructInputMethod(ContractMethod):
    """Various interfaces to the nestedStructInput method."""

    def __init__(self, provider: BaseProvider, contract_address: str, contract_function: ContractFunction, validator: Validator=None):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def validate_and_normalize_inputs(self, n: Tuple0xc9bdd2d5):
        """Validate the inputs to the nestedStructInput method."""
        self.validator.assert_valid(
            method_name='nestedStructInput',
            parameter_name='n',
            argument_value=n,
        )
        return (n)

    def call(self, n: Tuple0xc9bdd2d5, tx_params: Optional[TxParams] = None) -> None:
        """Execute underlying contract method via eth_call.

        :param tx_params: transaction parameters

        """
        (n) = self.validate_and_normalize_inputs(n)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(n).call(tx_params.as_dict())

    def send_transaction(self, n: Tuple0xc9bdd2d5, tx_params: Optional[TxParams] = None) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        :param tx_params: transaction parameters

        """
        (n) = self.validate_and_normalize_inputs(n)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(n).transact(tx_params.as_dict())

    def estimate_gas(self, n: Tuple0xc9bdd2d5, tx_params: Optional[TxParams] = None) -> int:
        """Estimate gas consumption of method call."""
        (n) = self.validate_and_normalize_inputs(n)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(n).estimateGas(tx_params.as_dict())

class StructOutputMethod(ContractMethod):
    """Various interfaces to the structOutput method."""

    def __init__(self, provider: BaseProvider, contract_address: str, contract_function: ContractFunction, validator: Validator=None):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def call(self, tx_params: Optional[TxParams] = None) -> Tuple0xcf8ad995:
        """Execute underlying contract method via eth_call.

        a method that returns a struct

        :param tx_params: transaction parameters
        :returns: a Struct struct
        """
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method().call(tx_params.as_dict())

    def send_transaction(self, tx_params: Optional[TxParams] = None) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        a method that returns a struct

        :param tx_params: transaction parameters
        :returns: a Struct struct
        """
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method().transact(tx_params.as_dict())

    def estimate_gas(self, tx_params: Optional[TxParams] = None) -> int:
        """Estimate gas consumption of method call."""
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method().estimateGas(tx_params.as_dict())

class PureFunctionWithConstantMethod(ContractMethod):
    """Various interfaces to the pureFunctionWithConstant method."""

    def __init__(self, provider: BaseProvider, contract_address: str, contract_function: ContractFunction, validator: Validator=None):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def call(self, tx_params: Optional[TxParams] = None) -> int:
        """Execute underlying contract method via eth_call.

        :param tx_params: transaction parameters

        """
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method().call(tx_params.as_dict())

    def send_transaction(self, tx_params: Optional[TxParams] = None) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        :param tx_params: transaction parameters

        """
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method().transact(tx_params.as_dict())

    def estimate_gas(self, tx_params: Optional[TxParams] = None) -> int:
        """Estimate gas consumption of method call."""
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method().estimateGas(tx_params.as_dict())

class SimpleInputNoOutputMethod(ContractMethod):
    """Various interfaces to the simpleInputNoOutput method."""

    def __init__(self, provider: BaseProvider, contract_address: str, contract_function: ContractFunction, validator: Validator=None):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def validate_and_normalize_inputs(self, index_0: int):
        """Validate the inputs to the simpleInputNoOutput method."""
        self.validator.assert_valid(
            method_name='simpleInputNoOutput',
            parameter_name='index_0',
            argument_value=index_0,
        )
        # safeguard against fractional inputs
        index_0 = int(index_0)
        return (index_0)

    def call(self, index_0: int, tx_params: Optional[TxParams] = None) -> None:
        """Execute underlying contract method via eth_call.

        Tests decoding when input is not empty but output is empty.

        :param tx_params: transaction parameters

        """
        (index_0) = self.validate_and_normalize_inputs(index_0)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(index_0).call(tx_params.as_dict())

    def send_transaction(self, index_0: int, tx_params: Optional[TxParams] = None) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        Tests decoding when input is not empty but output is empty.

        :param tx_params: transaction parameters

        """
        (index_0) = self.validate_and_normalize_inputs(index_0)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(index_0).transact(tx_params.as_dict())

    def estimate_gas(self, index_0: int, tx_params: Optional[TxParams] = None) -> int:
        """Estimate gas consumption of method call."""
        (index_0) = self.validate_and_normalize_inputs(index_0)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(index_0).estimateGas(tx_params.as_dict())

# pylint: disable=too-many-public-methods,too-many-instance-attributes
class AbiGenDummy:
    """Wrapper class for AbiGenDummy Solidity contract.

    All method parameters of type `bytes`:code: should be encoded as UTF-8,
    which can be accomplished via `str.encode("utf_8")`:code:.
    """
    simple_require: SimpleRequireMethod
    accepts_an_array_of_bytes: AcceptsAnArrayOfBytesMethod
    simple_input_simple_output: SimpleInputSimpleOutputMethod
    withdraw: WithdrawMethod
    multi_input_multi_output: MultiInputMultiOutputMethod
    ecrecover_fn: EcrecoverFnMethod
    accepts_bytes: AcceptsBytesMethod
    no_input_simple_output: NoInputSimpleOutputMethod
    revert_with_constant: RevertWithConstantMethod
    simple_revert: SimpleRevertMethod
    nested_struct_output: NestedStructOutputMethod
    require_with_constant: RequireWithConstantMethod
    with_address_input: WithAddressInputMethod
    struct_input: StructInputMethod
    non_pure_method: NonPureMethodMethod
    complex_input_complex_output: ComplexInputComplexOutputMethod
    no_input_no_output: NoInputNoOutputMethod
    simple_pure_function_with_input: SimplePureFunctionWithInputMethod
    non_pure_method_that_returns_nothing: NonPureMethodThatReturnsNothingMethod
    simple_pure_function: SimplePureFunctionMethod
    nested_struct_input: NestedStructInputMethod
    struct_output: StructOutputMethod
    pure_function_with_constant: PureFunctionWithConstantMethod
    simple_input_no_output: SimpleInputNoOutputMethod

    def __init__(
        self,
        provider: BaseProvider,
        contract_address: str,
        validator: AbiGenDummyValidator = None,
    ):
        """Get an instance of wrapper for smart contract.

        :param provider: instance of :class:`web3.providers.base.BaseProvider`
        :param contract_address: where the contract has been deployed
        :param validator: for validation of method inputs.
        """
        self.contract_address = contract_address

        if not validator:
            validator = AbiGenDummyValidator(provider, contract_address)

        self._web3_eth = Web3(  # type: ignore # pylint: disable=no-member
            provider
        ).eth

        functions = self._web3_eth.contract(address=to_checksum_address(contract_address), abi=AbiGenDummy.abi()).functions

        self.simple_require = SimpleRequireMethod(provider, contract_address, functions.simpleRequire, validator)

        self.accepts_an_array_of_bytes = AcceptsAnArrayOfBytesMethod(provider, contract_address, functions.acceptsAnArrayOfBytes, validator)

        self.simple_input_simple_output = SimpleInputSimpleOutputMethod(provider, contract_address, functions.simpleInputSimpleOutput, validator)

        self.withdraw = WithdrawMethod(provider, contract_address, functions.withdraw, validator)

        self.multi_input_multi_output = MultiInputMultiOutputMethod(provider, contract_address, functions.multiInputMultiOutput, validator)

        self.ecrecover_fn = EcrecoverFnMethod(provider, contract_address, functions.ecrecoverFn, validator)

        self.accepts_bytes = AcceptsBytesMethod(provider, contract_address, functions.acceptsBytes, validator)

        self.no_input_simple_output = NoInputSimpleOutputMethod(provider, contract_address, functions.noInputSimpleOutput, validator)

        self.revert_with_constant = RevertWithConstantMethod(provider, contract_address, functions.revertWithConstant, validator)

        self.simple_revert = SimpleRevertMethod(provider, contract_address, functions.simpleRevert, validator)

        self.nested_struct_output = NestedStructOutputMethod(provider, contract_address, functions.nestedStructOutput, validator)

        self.require_with_constant = RequireWithConstantMethod(provider, contract_address, functions.requireWithConstant, validator)

        self.with_address_input = WithAddressInputMethod(provider, contract_address, functions.withAddressInput, validator)

        self.struct_input = StructInputMethod(provider, contract_address, functions.structInput, validator)

        self.non_pure_method = NonPureMethodMethod(provider, contract_address, functions.nonPureMethod, validator)

        self.complex_input_complex_output = ComplexInputComplexOutputMethod(provider, contract_address, functions.complexInputComplexOutput, validator)

        self.no_input_no_output = NoInputNoOutputMethod(provider, contract_address, functions.noInputNoOutput, validator)

        self.simple_pure_function_with_input = SimplePureFunctionWithInputMethod(provider, contract_address, functions.simplePureFunctionWithInput, validator)

        self.non_pure_method_that_returns_nothing = NonPureMethodThatReturnsNothingMethod(provider, contract_address, functions.nonPureMethodThatReturnsNothing, validator)

        self.simple_pure_function = SimplePureFunctionMethod(provider, contract_address, functions.simplePureFunction, validator)

        self.nested_struct_input = NestedStructInputMethod(provider, contract_address, functions.nestedStructInput, validator)

        self.struct_output = StructOutputMethod(provider, contract_address, functions.structOutput, validator)

        self.pure_function_with_constant = PureFunctionWithConstantMethod(provider, contract_address, functions.pureFunctionWithConstant, validator)

        self.simple_input_no_output = SimpleInputNoOutputMethod(provider, contract_address, functions.simpleInputNoOutput, validator)

    def get_withdrawal_event(
        self, tx_hash: Union[HexBytes, bytes]
    ) -> Tuple[AttributeDict]:
        """Get log entry for Withdrawal event.

        :param tx_hash: hash of transaction emitting Withdrawal event
        """
        tx_receipt = self._web3_eth.getTransactionReceipt(tx_hash)
        return self._web3_eth.contract(address=to_checksum_address(self.contract_address), abi=AbiGenDummy.abi()).events.Withdrawal().processReceipt(tx_receipt)
    def get_an_event_event(
        self, tx_hash: Union[HexBytes, bytes]
    ) -> Tuple[AttributeDict]:
        """Get log entry for AnEvent event.

        :param tx_hash: hash of transaction emitting AnEvent event
        """
        tx_receipt = self._web3_eth.getTransactionReceipt(tx_hash)
        return self._web3_eth.contract(address=to_checksum_address(self.contract_address), abi=AbiGenDummy.abi()).events.AnEvent().processReceipt(tx_receipt)

    @staticmethod
    def abi():
        """Return the ABI to the underlying contract."""
        return json.loads(
            '[{"constant":true,"inputs":[],"name":"simpleRequire","outputs":[],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[{"name":"a","type":"bytes[]"}],"name":"acceptsAnArrayOfBytes","outputs":[],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[{"name":"index_0","type":"uint256"}],"name":"simpleInputSimpleOutput","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":false,"inputs":[{"name":"wad","type":"uint256"}],"name":"withdraw","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"index_0","type":"uint256"},{"name":"index_1","type":"bytes"},{"name":"index_2","type":"string"}],"name":"multiInputMultiOutput","outputs":[{"name":"","type":"bytes"},{"name":"","type":"bytes"},{"name":"","type":"string"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[{"name":"hash","type":"bytes32"},{"name":"v","type":"uint8"},{"name":"r","type":"bytes32"},{"name":"s","type":"bytes32"}],"name":"ecrecoverFn","outputs":[{"name":"signerAddress","type":"address"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[{"name":"a","type":"bytes"}],"name":"acceptsBytes","outputs":[],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[],"name":"noInputSimpleOutput","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[],"name":"revertWithConstant","outputs":[],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[],"name":"simpleRevert","outputs":[],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[],"name":"nestedStructOutput","outputs":[{"components":[{"components":[{"name":"someBytes","type":"bytes"},{"name":"anInteger","type":"uint32"},{"name":"aDynamicArrayOfBytes","type":"bytes[]"},{"name":"aString","type":"string"}],"name":"innerStruct","type":"tuple"},{"name":"description","type":"string"}],"name":"","type":"tuple"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[],"name":"requireWithConstant","outputs":[],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[{"name":"x","type":"address"},{"name":"a","type":"uint256"},{"name":"b","type":"uint256"},{"name":"y","type":"address"},{"name":"c","type":"uint256"}],"name":"withAddressInput","outputs":[{"name":"z","type":"address"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[{"components":[{"name":"someBytes","type":"bytes"},{"name":"anInteger","type":"uint32"},{"name":"aDynamicArrayOfBytes","type":"bytes[]"},{"name":"aString","type":"string"}],"name":"s","type":"tuple"}],"name":"structInput","outputs":[],"payable":false,"stateMutability":"pure","type":"function"},{"constant":false,"inputs":[],"name":"nonPureMethod","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"components":[{"name":"foo","type":"uint256"},{"name":"bar","type":"bytes"},{"name":"car","type":"string"}],"name":"complexInput","type":"tuple"}],"name":"complexInputComplexOutput","outputs":[{"components":[{"components":[{"name":"foo","type":"uint256"},{"name":"bar","type":"bytes"},{"name":"car","type":"string"}],"name":"input","type":"tuple"},{"name":"lorem","type":"bytes"},{"name":"ipsum","type":"bytes"},{"name":"dolor","type":"string"}],"name":"","type":"tuple"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[],"name":"noInputNoOutput","outputs":[],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[{"name":"x","type":"uint256"}],"name":"simplePureFunctionWithInput","outputs":[{"name":"sum","type":"uint256"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":false,"inputs":[],"name":"nonPureMethodThatReturnsNothing","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"simplePureFunction","outputs":[{"name":"result","type":"uint256"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[{"components":[{"components":[{"name":"someBytes","type":"bytes"},{"name":"anInteger","type":"uint32"},{"name":"aDynamicArrayOfBytes","type":"bytes[]"},{"name":"aString","type":"string"}],"name":"innerStruct","type":"tuple"},{"name":"description","type":"string"}],"name":"n","type":"tuple"}],"name":"nestedStructInput","outputs":[],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[],"name":"structOutput","outputs":[{"components":[{"name":"someBytes","type":"bytes"},{"name":"anInteger","type":"uint32"},{"name":"aDynamicArrayOfBytes","type":"bytes[]"},{"name":"aString","type":"string"}],"name":"s","type":"tuple"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[],"name":"pureFunctionWithConstant","outputs":[{"name":"someConstant","type":"uint256"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[{"name":"index_0","type":"uint256"}],"name":"simpleInputNoOutput","outputs":[],"payable":false,"stateMutability":"pure","type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_owner","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"Withdrawal","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"param","type":"uint8"}],"name":"AnEvent","type":"event"}]'  # noqa: E501 (line-too-long)
        )

# pylint: disable=too-many-lines
