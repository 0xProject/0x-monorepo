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

from mypy_extensions import TypedDict  # pylint: disable=unused-import
from hexbytes import HexBytes
from web3.datastructures import AttributeDict
from web3.providers.base import BaseProvider

from zero_ex.contract_wrappers._base_contract_wrapper import BaseContractWrapper
from zero_ex.contract_wrappers.tx_params import TxParams


class AbiGenDummyValidatorBase:
    """Base class for validating inputs to AbiGenDummy methods."""
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

    class AbiGenDummyValidator(AbiGenDummyValidatorBase):  # type: ignore
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


# pylint: disable=too-many-public-methods
class AbiGenDummy(BaseContractWrapper):
    """Wrapper class for AbiGenDummy Solidity contract.

    All method parameters of type `bytes`:code: should be encoded as UTF-8,
    which can be accomplished via `str.encode("utf_8")`:code:.
    """

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
        super().__init__(
            provider=provider,
            contract_address=contract_address,
            private_key=private_key,
        )

        if not validator:
            validator = AbiGenDummyValidator(provider, contract_address, private_key)

        self.validator = validator

    def _get_contract_instance(self, token_address):
        """Get an instance of the smart contract at a specific address.

        :returns: contract object
        """
        return self._contract_instance(
            address=token_address, abi=AbiGenDummy.abi()
        )

    def simple_require(
        self,
        tx_params: Optional[TxParams] = None,
    ) -> None:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters

        """
        func = self._get_contract_instance(
            self.contract_address
        ).functions.simpleRequire()
        return self._invoke_function_call(
            func=func,
            tx_params=tx_params,
            view_only=True
        )

    def accepts_an_array_of_bytes(
        self,
        a: List[bytes],
        tx_params: Optional[TxParams] = None,
    ) -> None:
        """Execute underlying, same-named contract method.

        a method that accepts an array of bytes

        :param a: the array of bytes being accepted
        :param tx_params: transaction parameters

        """
        self.validator.assert_valid(
            method_name='acceptsAnArrayOfBytes',
            parameter_name='a',
            argument_value=a,
        )
        a = [
            bytes.fromhex(a_element.decode("utf-8"))
            for a_element in a
        ]
        func = self._get_contract_instance(
            self.contract_address
        ).functions.acceptsAnArrayOfBytes(a)
        return self._invoke_function_call(
            func=func,
            tx_params=tx_params,
            view_only=True
        )

    def ecrecover_fn(
        self,
        _hash: bytes, v: int, r: bytes, s: bytes,
        tx_params: Optional[TxParams] = None,
    ) -> str:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters

        """
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
        func = self._get_contract_instance(
            self.contract_address
        ).functions.ecrecoverFn(_hash, v, r, s)
        return self._invoke_function_call(
            func=func,
            tx_params=tx_params,
            view_only=True
        )

    def accepts_bytes(
        self,
        a: bytes,
        tx_params: Optional[TxParams] = None,
    ) -> None:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters

        """
        self.validator.assert_valid(
            method_name='acceptsBytes',
            parameter_name='a',
            argument_value=a,
        )
        a = bytes.fromhex(a.decode("utf-8"))
        func = self._get_contract_instance(
            self.contract_address
        ).functions.acceptsBytes(a)
        return self._invoke_function_call(
            func=func,
            tx_params=tx_params,
            view_only=True
        )

    def revert_with_constant(
        self,
        tx_params: Optional[TxParams] = None,
    ) -> None:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters

        """
        func = self._get_contract_instance(
            self.contract_address
        ).functions.revertWithConstant()
        return self._invoke_function_call(
            func=func,
            tx_params=tx_params,
            view_only=True
        )

    def simple_revert(
        self,
        tx_params: Optional[TxParams] = None,
    ) -> None:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters

        """
        func = self._get_contract_instance(
            self.contract_address
        ).functions.simpleRevert()
        return self._invoke_function_call(
            func=func,
            tx_params=tx_params,
            view_only=True
        )

    def nested_struct_output(
        self,
        tx_params: Optional[TxParams] = None,
    ) -> Tuple0xc9bdd2d5:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters

        """
        func = self._get_contract_instance(
            self.contract_address
        ).functions.nestedStructOutput()
        return self._invoke_function_call(
            func=func,
            tx_params=tx_params,
            view_only=True
        )

    def require_with_constant(
        self,
        tx_params: Optional[TxParams] = None,
    ) -> None:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters

        """
        func = self._get_contract_instance(
            self.contract_address
        ).functions.requireWithConstant()
        return self._invoke_function_call(
            func=func,
            tx_params=tx_params,
            view_only=True
        )

    def with_address_input(
        self,
        x: str, a: int, b: int, y: str, c: int,
        tx_params: Optional[TxParams] = None,
    ) -> str:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters

        """
        self.validator.assert_valid(
            method_name='withAddressInput',
            parameter_name='x',
            argument_value=x,
        )
        x = self._validate_and_checksum_address(x)
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
        y = self._validate_and_checksum_address(y)
        self.validator.assert_valid(
            method_name='withAddressInput',
            parameter_name='c',
            argument_value=c,
        )
        # safeguard against fractional inputs
        c = int(c)
        func = self._get_contract_instance(
            self.contract_address
        ).functions.withAddressInput(x, a, b, y, c)
        return self._invoke_function_call(
            func=func,
            tx_params=tx_params,
            view_only=True
        )

    def struct_input(
        self,
        s: Tuple0xcf8ad995,
        tx_params: Optional[TxParams] = None,
    ) -> None:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters

        """
        self.validator.assert_valid(
            method_name='structInput',
            parameter_name='s',
            argument_value=s,
        )
        func = self._get_contract_instance(
            self.contract_address
        ).functions.structInput(s)
        return self._invoke_function_call(
            func=func,
            tx_params=tx_params,
            view_only=True
        )

    def non_pure_method(
        self,
        tx_params: Optional[TxParams] = None,
        view_only: bool = False,
    ) -> Union[int, Union[HexBytes, bytes]]:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters
        :param view_only: whether to use transact() or call()

        :returns: if param `view_only`:code: is `True`:code:, then returns the
            value returned from the underlying function; else returns the
            transaction hash.
        """
        func = self._get_contract_instance(
            self.contract_address
        ).functions.nonPureMethod()
        return self._invoke_function_call(
            func=func,
            tx_params=tx_params,
            view_only=view_only
        )

    def simple_pure_function_with_input(
        self,
        x: int,
        tx_params: Optional[TxParams] = None,
    ) -> int:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters

        """
        self.validator.assert_valid(
            method_name='simplePureFunctionWithInput',
            parameter_name='x',
            argument_value=x,
        )
        # safeguard against fractional inputs
        x = int(x)
        func = self._get_contract_instance(
            self.contract_address
        ).functions.simplePureFunctionWithInput(x)
        return self._invoke_function_call(
            func=func,
            tx_params=tx_params,
            view_only=True
        )

    def non_pure_method_that_returns_nothing(
        self,
        tx_params: Optional[TxParams] = None,
        view_only: bool = False,
    ) -> Union[None, Union[HexBytes, bytes]]:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters
        :param view_only: whether to use transact() or call()

        :returns: if param `view_only`:code: is `True`:code:, then returns the
            value returned from the underlying function; else returns the
            transaction hash.
        """
        func = self._get_contract_instance(
            self.contract_address
        ).functions.nonPureMethodThatReturnsNothing()
        return self._invoke_function_call(
            func=func,
            tx_params=tx_params,
            view_only=view_only
        )

    def simple_pure_function(
        self,
        tx_params: Optional[TxParams] = None,
    ) -> int:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters

        """
        func = self._get_contract_instance(
            self.contract_address
        ).functions.simplePureFunction()
        return self._invoke_function_call(
            func=func,
            tx_params=tx_params,
            view_only=True
        )

    def nested_struct_input(
        self,
        n: Tuple0xc9bdd2d5,
        tx_params: Optional[TxParams] = None,
    ) -> None:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters

        """
        self.validator.assert_valid(
            method_name='nestedStructInput',
            parameter_name='n',
            argument_value=n,
        )
        func = self._get_contract_instance(
            self.contract_address
        ).functions.nestedStructInput(n)
        return self._invoke_function_call(
            func=func,
            tx_params=tx_params,
            view_only=True
        )

    def struct_output(
        self,
        tx_params: Optional[TxParams] = None,
    ) -> Tuple0xcf8ad995:
        """Execute underlying, same-named contract method.

        a method that returns a struct

        :param tx_params: transaction parameters
        :returns: a Struct struct
        """
        func = self._get_contract_instance(
            self.contract_address
        ).functions.structOutput()
        return self._invoke_function_call(
            func=func,
            tx_params=tx_params,
            view_only=True
        )

    def pure_function_with_constant(
        self,
        tx_params: Optional[TxParams] = None,
    ) -> int:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters

        """
        func = self._get_contract_instance(
            self.contract_address
        ).functions.pureFunctionWithConstant()
        return self._invoke_function_call(
            func=func,
            tx_params=tx_params,
            view_only=True
        )
    def get_an_event_event(
        self, tx_hash: Union[HexBytes, bytes]
    ) -> Tuple[AttributeDict]:
        """Get log entry for AnEvent event.

        :param tx_hash: hash of transaction emitting AnEvent event
        """
        tx_receipt = self._web3_eth.getTransactionReceipt(tx_hash)
        return (
            self._get_contract_instance(self.contract_address)
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
