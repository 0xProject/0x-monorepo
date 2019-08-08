"""Generated wrapper for Exchange Solidity contract."""

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
# constructor for Exchange below.
try:
    # both mypy and pylint complain about what we're doing here, but this
    # works just fine, so their messages have been disabled here.
    from . import (  # type: ignore # pylint: disable=import-self
        ExchangeValidator,
    )
except ImportError:

    class ExchangeValidator(  # type: ignore
        Validator
    ):
        """No-op input validator."""


class Tuple0xbb41e5b3(TypedDict):
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

    makerAssetFilledAmount: int

    takerAssetFilledAmount: int

    makerFeePaid: int

    takerFeePaid: int


class Tuple0x054ca44e(TypedDict):
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

    left: Tuple0xbb41e5b3

    right: Tuple0xbb41e5b3

    leftMakerAssetSpreadAmount: int


class Tuple0x260219a2(TypedDict):
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

    makerAddress: str

    takerAddress: str

    feeRecipientAddress: str

    senderAddress: str

    makerAssetAmount: int

    takerAssetAmount: int

    makerFee: int

    takerFee: int

    expirationTimeSeconds: int

    salt: int

    makerAssetData: bytes

    takerAssetData: bytes


class Tuple0xb1e4a1ae(TypedDict):
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

    orderStatus: int

    orderHash: bytes

    orderTakerAssetFilledAmount: int


class FilledMethod(ContractMethod):
    """Various interfaces to the filled method."""

    def __init__(
        self,
        provider: BaseProvider,
        contract_address: str,
        contract_function: ContractFunction,
        validator: Validator = None,
    ):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def validate_and_normalize_inputs(self, index_0: bytes):
        """Validate the inputs to the filled method."""
        self.validator.assert_valid(
            method_name="filled",
            parameter_name="index_0",
            argument_value=index_0,
        )
        return index_0

    def call(
        self, index_0: bytes, tx_params: Optional[TxParams] = None
    ) -> int:
        """Execute underlying contract method via eth_call.

        :param tx_params: transaction parameters

        """
        (index_0) = self.validate_and_normalize_inputs(index_0)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(index_0).call(tx_params.as_dict())

    def send_transaction(
        self, index_0: bytes, tx_params: Optional[TxParams] = None
    ) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        :param tx_params: transaction parameters

        """
        (index_0) = self.validate_and_normalize_inputs(index_0)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(index_0).transact(tx_params.as_dict())

    def estimate_gas(
        self, index_0: bytes, tx_params: Optional[TxParams] = None
    ) -> int:
        """Estimate gas consumption of method call."""
        (index_0) = self.validate_and_normalize_inputs(index_0)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(index_0).estimateGas(tx_params.as_dict())


class BatchFillOrdersMethod(ContractMethod):
    """Various interfaces to the batchFillOrders method."""

    def __init__(
        self,
        provider: BaseProvider,
        contract_address: str,
        contract_function: ContractFunction,
        validator: Validator = None,
    ):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def validate_and_normalize_inputs(
        self,
        orders: List[Tuple0x260219a2],
        taker_asset_fill_amounts: List[int],
        signatures: List[bytes],
    ):
        """Validate the inputs to the batchFillOrders method."""
        self.validator.assert_valid(
            method_name="batchFillOrders",
            parameter_name="orders",
            argument_value=orders,
        )
        self.validator.assert_valid(
            method_name="batchFillOrders",
            parameter_name="takerAssetFillAmounts",
            argument_value=taker_asset_fill_amounts,
        )
        self.validator.assert_valid(
            method_name="batchFillOrders",
            parameter_name="signatures",
            argument_value=signatures,
        )
        signatures = [
            bytes.fromhex(signatures_element.decode("utf-8"))
            for signatures_element in signatures
        ]
        return (orders, taker_asset_fill_amounts, signatures)

    def call(
        self,
        orders: List[Tuple0x260219a2],
        taker_asset_fill_amounts: List[int],
        signatures: List[bytes],
        tx_params: Optional[TxParams] = None,
    ) -> Union[Tuple0xbb41e5b3, Union[HexBytes, bytes]]:
        """Execute underlying contract method via eth_call.

        Synchronously executes multiple calls of fillOrder.

        :param orders: Array of order specifications.
        :param signatures: Proofs that orders have been created by makers.
        :param takerAssetFillAmounts: Array of desired amounts of takerAsset to
            sell in orders.
        :param tx_params: transaction parameters
        :returns: the return value of the underlying method.
        """
        (
            orders,
            taker_asset_fill_amounts,
            signatures,
        ) = self.validate_and_normalize_inputs(
            orders, taker_asset_fill_amounts, signatures
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(
            orders, taker_asset_fill_amounts, signatures
        ).call(tx_params.as_dict())

    def send_transaction(
        self,
        orders: List[Tuple0x260219a2],
        taker_asset_fill_amounts: List[int],
        signatures: List[bytes],
        tx_params: Optional[TxParams] = None,
    ) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        Synchronously executes multiple calls of fillOrder.

        :param orders: Array of order specifications.
        :param signatures: Proofs that orders have been created by makers.
        :param takerAssetFillAmounts: Array of desired amounts of takerAsset to
            sell in orders.
        :param tx_params: transaction parameters
        """
        (
            orders,
            taker_asset_fill_amounts,
            signatures,
        ) = self.validate_and_normalize_inputs(
            orders, taker_asset_fill_amounts, signatures
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(
            orders, taker_asset_fill_amounts, signatures
        ).transact(tx_params.as_dict())

    def estimate_gas(
        self,
        orders: List[Tuple0x260219a2],
        taker_asset_fill_amounts: List[int],
        signatures: List[bytes],
        tx_params: Optional[TxParams] = None,
    ) -> int:
        """Estimate gas consumption of method call."""
        (
            orders,
            taker_asset_fill_amounts,
            signatures,
        ) = self.validate_and_normalize_inputs(
            orders, taker_asset_fill_amounts, signatures
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(
            orders, taker_asset_fill_amounts, signatures
        ).estimateGas(tx_params.as_dict())


class CancelledMethod(ContractMethod):
    """Various interfaces to the cancelled method."""

    def __init__(
        self,
        provider: BaseProvider,
        contract_address: str,
        contract_function: ContractFunction,
        validator: Validator = None,
    ):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def validate_and_normalize_inputs(self, index_0: bytes):
        """Validate the inputs to the cancelled method."""
        self.validator.assert_valid(
            method_name="cancelled",
            parameter_name="index_0",
            argument_value=index_0,
        )
        return index_0

    def call(
        self, index_0: bytes, tx_params: Optional[TxParams] = None
    ) -> bool:
        """Execute underlying contract method via eth_call.

        :param tx_params: transaction parameters

        """
        (index_0) = self.validate_and_normalize_inputs(index_0)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(index_0).call(tx_params.as_dict())

    def send_transaction(
        self, index_0: bytes, tx_params: Optional[TxParams] = None
    ) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        :param tx_params: transaction parameters

        """
        (index_0) = self.validate_and_normalize_inputs(index_0)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(index_0).transact(tx_params.as_dict())

    def estimate_gas(
        self, index_0: bytes, tx_params: Optional[TxParams] = None
    ) -> int:
        """Estimate gas consumption of method call."""
        (index_0) = self.validate_and_normalize_inputs(index_0)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(index_0).estimateGas(tx_params.as_dict())


class PreSignMethod(ContractMethod):
    """Various interfaces to the preSign method."""

    def __init__(
        self,
        provider: BaseProvider,
        contract_address: str,
        contract_function: ContractFunction,
        validator: Validator = None,
    ):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def validate_and_normalize_inputs(
        self, _hash: bytes, signer_address: str, signature: bytes
    ):
        """Validate the inputs to the preSign method."""
        self.validator.assert_valid(
            method_name="preSign", parameter_name="hash", argument_value=_hash
        )
        self.validator.assert_valid(
            method_name="preSign",
            parameter_name="signerAddress",
            argument_value=signer_address,
        )
        signer_address = self.validate_and_checksum_address(signer_address)
        self.validator.assert_valid(
            method_name="preSign",
            parameter_name="signature",
            argument_value=signature,
        )
        signature = bytes.fromhex(signature.decode("utf-8"))
        return (_hash, signer_address, signature)

    def call(
        self,
        _hash: bytes,
        signer_address: str,
        signature: bytes,
        tx_params: Optional[TxParams] = None,
    ) -> Union[None, Union[HexBytes, bytes]]:
        """Execute underlying contract method via eth_call.

        Approves a hash on-chain using any valid signature type.      After
        presigning a hash, the preSign signature type will become valid for
        that hash and signer.

        :param signature: Proof that the hash has been signed by signer.
        :param signerAddress: Address that should have signed the given hash.
        :param tx_params: transaction parameters
        :returns: the return value of the underlying method.
        """
        (
            _hash,
            signer_address,
            signature,
        ) = self.validate_and_normalize_inputs(
            _hash, signer_address, signature
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(_hash, signer_address, signature).call(
            tx_params.as_dict()
        )

    def send_transaction(
        self,
        _hash: bytes,
        signer_address: str,
        signature: bytes,
        tx_params: Optional[TxParams] = None,
    ) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        Approves a hash on-chain using any valid signature type.      After
        presigning a hash, the preSign signature type will become valid for
        that hash and signer.

        :param signature: Proof that the hash has been signed by signer.
        :param signerAddress: Address that should have signed the given hash.
        :param tx_params: transaction parameters
        """
        (
            _hash,
            signer_address,
            signature,
        ) = self.validate_and_normalize_inputs(
            _hash, signer_address, signature
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(
            _hash, signer_address, signature
        ).transact(tx_params.as_dict())

    def estimate_gas(
        self,
        _hash: bytes,
        signer_address: str,
        signature: bytes,
        tx_params: Optional[TxParams] = None,
    ) -> int:
        """Estimate gas consumption of method call."""
        (
            _hash,
            signer_address,
            signature,
        ) = self.validate_and_normalize_inputs(
            _hash, signer_address, signature
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(
            _hash, signer_address, signature
        ).estimateGas(tx_params.as_dict())


class MatchOrdersMethod(ContractMethod):
    """Various interfaces to the matchOrders method."""

    def __init__(
        self,
        provider: BaseProvider,
        contract_address: str,
        contract_function: ContractFunction,
        validator: Validator = None,
    ):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def validate_and_normalize_inputs(
        self,
        left_order: Tuple0x260219a2,
        right_order: Tuple0x260219a2,
        left_signature: bytes,
        right_signature: bytes,
    ):
        """Validate the inputs to the matchOrders method."""
        self.validator.assert_valid(
            method_name="matchOrders",
            parameter_name="leftOrder",
            argument_value=left_order,
        )
        self.validator.assert_valid(
            method_name="matchOrders",
            parameter_name="rightOrder",
            argument_value=right_order,
        )
        self.validator.assert_valid(
            method_name="matchOrders",
            parameter_name="leftSignature",
            argument_value=left_signature,
        )
        left_signature = bytes.fromhex(left_signature.decode("utf-8"))
        self.validator.assert_valid(
            method_name="matchOrders",
            parameter_name="rightSignature",
            argument_value=right_signature,
        )
        right_signature = bytes.fromhex(right_signature.decode("utf-8"))
        return (left_order, right_order, left_signature, right_signature)

    def call(
        self,
        left_order: Tuple0x260219a2,
        right_order: Tuple0x260219a2,
        left_signature: bytes,
        right_signature: bytes,
        tx_params: Optional[TxParams] = None,
    ) -> Union[Tuple0x054ca44e, Union[HexBytes, bytes]]:
        """Execute underlying contract method via eth_call.

        Match two complementary orders that have a profitable spread.      Each
        order is filled at their respective price point. However, the
        calculations are      carried out as though the orders are both being
        filled at the right order's price point.      The profit made by the
        left order goes to the taker (who matched the two orders).

        :param leftOrder: First order to match.
        :param leftSignature: Proof that order was created by the left maker.
        :param rightOrder: Second order to match.
        :param rightSignature: Proof that order was created by the right maker.
        :param tx_params: transaction parameters
        :returns: the return value of the underlying method.
        """
        (
            left_order,
            right_order,
            left_signature,
            right_signature,
        ) = self.validate_and_normalize_inputs(
            left_order, right_order, left_signature, right_signature
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(
            left_order, right_order, left_signature, right_signature
        ).call(tx_params.as_dict())

    def send_transaction(
        self,
        left_order: Tuple0x260219a2,
        right_order: Tuple0x260219a2,
        left_signature: bytes,
        right_signature: bytes,
        tx_params: Optional[TxParams] = None,
    ) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        Match two complementary orders that have a profitable spread.      Each
        order is filled at their respective price point. However, the
        calculations are      carried out as though the orders are both being
        filled at the right order's price point.      The profit made by the
        left order goes to the taker (who matched the two orders).

        :param leftOrder: First order to match.
        :param leftSignature: Proof that order was created by the left maker.
        :param rightOrder: Second order to match.
        :param rightSignature: Proof that order was created by the right maker.
        :param tx_params: transaction parameters
        """
        (
            left_order,
            right_order,
            left_signature,
            right_signature,
        ) = self.validate_and_normalize_inputs(
            left_order, right_order, left_signature, right_signature
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(
            left_order, right_order, left_signature, right_signature
        ).transact(tx_params.as_dict())

    def estimate_gas(
        self,
        left_order: Tuple0x260219a2,
        right_order: Tuple0x260219a2,
        left_signature: bytes,
        right_signature: bytes,
        tx_params: Optional[TxParams] = None,
    ) -> int:
        """Estimate gas consumption of method call."""
        (
            left_order,
            right_order,
            left_signature,
            right_signature,
        ) = self.validate_and_normalize_inputs(
            left_order, right_order, left_signature, right_signature
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(
            left_order, right_order, left_signature, right_signature
        ).estimateGas(tx_params.as_dict())


class FillOrderNoThrowMethod(ContractMethod):
    """Various interfaces to the fillOrderNoThrow method."""

    def __init__(
        self,
        provider: BaseProvider,
        contract_address: str,
        contract_function: ContractFunction,
        validator: Validator = None,
    ):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def validate_and_normalize_inputs(
        self,
        order: Tuple0x260219a2,
        taker_asset_fill_amount: int,
        signature: bytes,
    ):
        """Validate the inputs to the fillOrderNoThrow method."""
        self.validator.assert_valid(
            method_name="fillOrderNoThrow",
            parameter_name="order",
            argument_value=order,
        )
        self.validator.assert_valid(
            method_name="fillOrderNoThrow",
            parameter_name="takerAssetFillAmount",
            argument_value=taker_asset_fill_amount,
        )
        # safeguard against fractional inputs
        taker_asset_fill_amount = int(taker_asset_fill_amount)
        self.validator.assert_valid(
            method_name="fillOrderNoThrow",
            parameter_name="signature",
            argument_value=signature,
        )
        signature = bytes.fromhex(signature.decode("utf-8"))
        return (order, taker_asset_fill_amount, signature)

    def call(
        self,
        order: Tuple0x260219a2,
        taker_asset_fill_amount: int,
        signature: bytes,
        tx_params: Optional[TxParams] = None,
    ) -> Union[Tuple0xbb41e5b3, Union[HexBytes, bytes]]:
        """Execute underlying contract method via eth_call.

        Fills the input order.      Returns false if the transaction would
        otherwise revert.

        :param order: Order struct containing order specifications.
        :param signature: Proof that order has been created by maker.
        :param takerAssetFillAmount: Desired amount of takerAsset to sell.
        :param tx_params: transaction parameters
        :returns: the return value of the underlying method.
        """
        (
            order,
            taker_asset_fill_amount,
            signature,
        ) = self.validate_and_normalize_inputs(
            order, taker_asset_fill_amount, signature
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(
            order, taker_asset_fill_amount, signature
        ).call(tx_params.as_dict())

    def send_transaction(
        self,
        order: Tuple0x260219a2,
        taker_asset_fill_amount: int,
        signature: bytes,
        tx_params: Optional[TxParams] = None,
    ) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        Fills the input order.      Returns false if the transaction would
        otherwise revert.

        :param order: Order struct containing order specifications.
        :param signature: Proof that order has been created by maker.
        :param takerAssetFillAmount: Desired amount of takerAsset to sell.
        :param tx_params: transaction parameters
        """
        (
            order,
            taker_asset_fill_amount,
            signature,
        ) = self.validate_and_normalize_inputs(
            order, taker_asset_fill_amount, signature
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(
            order, taker_asset_fill_amount, signature
        ).transact(tx_params.as_dict())

    def estimate_gas(
        self,
        order: Tuple0x260219a2,
        taker_asset_fill_amount: int,
        signature: bytes,
        tx_params: Optional[TxParams] = None,
    ) -> int:
        """Estimate gas consumption of method call."""
        (
            order,
            taker_asset_fill_amount,
            signature,
        ) = self.validate_and_normalize_inputs(
            order, taker_asset_fill_amount, signature
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(
            order, taker_asset_fill_amount, signature
        ).estimateGas(tx_params.as_dict())


class AssetProxiesMethod(ContractMethod):
    """Various interfaces to the assetProxies method."""

    def __init__(
        self,
        provider: BaseProvider,
        contract_address: str,
        contract_function: ContractFunction,
        validator: Validator = None,
    ):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def validate_and_normalize_inputs(self, index_0: bytes):
        """Validate the inputs to the assetProxies method."""
        self.validator.assert_valid(
            method_name="assetProxies",
            parameter_name="index_0",
            argument_value=index_0,
        )
        return index_0

    def call(
        self, index_0: bytes, tx_params: Optional[TxParams] = None
    ) -> str:
        """Execute underlying contract method via eth_call.

        :param tx_params: transaction parameters

        """
        (index_0) = self.validate_and_normalize_inputs(index_0)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(index_0).call(tx_params.as_dict())

    def send_transaction(
        self, index_0: bytes, tx_params: Optional[TxParams] = None
    ) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        :param tx_params: transaction parameters

        """
        (index_0) = self.validate_and_normalize_inputs(index_0)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(index_0).transact(tx_params.as_dict())

    def estimate_gas(
        self, index_0: bytes, tx_params: Optional[TxParams] = None
    ) -> int:
        """Estimate gas consumption of method call."""
        (index_0) = self.validate_and_normalize_inputs(index_0)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(index_0).estimateGas(tx_params.as_dict())


class BatchCancelOrdersMethod(ContractMethod):
    """Various interfaces to the batchCancelOrders method."""

    def __init__(
        self,
        provider: BaseProvider,
        contract_address: str,
        contract_function: ContractFunction,
        validator: Validator = None,
    ):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def validate_and_normalize_inputs(self, orders: List[Tuple0x260219a2]):
        """Validate the inputs to the batchCancelOrders method."""
        self.validator.assert_valid(
            method_name="batchCancelOrders",
            parameter_name="orders",
            argument_value=orders,
        )
        return orders

    def call(
        self,
        orders: List[Tuple0x260219a2],
        tx_params: Optional[TxParams] = None,
    ) -> Union[None, Union[HexBytes, bytes]]:
        """Execute underlying contract method via eth_call.

        Synchronously cancels multiple orders in a single transaction.

        :param orders: Array of order specifications.
        :param tx_params: transaction parameters
        :returns: the return value of the underlying method.
        """
        (orders) = self.validate_and_normalize_inputs(orders)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(orders).call(tx_params.as_dict())

    def send_transaction(
        self,
        orders: List[Tuple0x260219a2],
        tx_params: Optional[TxParams] = None,
    ) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        Synchronously cancels multiple orders in a single transaction.

        :param orders: Array of order specifications.
        :param tx_params: transaction parameters
        """
        (orders) = self.validate_and_normalize_inputs(orders)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(orders).transact(tx_params.as_dict())

    def estimate_gas(
        self,
        orders: List[Tuple0x260219a2],
        tx_params: Optional[TxParams] = None,
    ) -> int:
        """Estimate gas consumption of method call."""
        (orders) = self.validate_and_normalize_inputs(orders)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(orders).estimateGas(tx_params.as_dict())


class BatchFillOrKillOrdersMethod(ContractMethod):
    """Various interfaces to the batchFillOrKillOrders method."""

    def __init__(
        self,
        provider: BaseProvider,
        contract_address: str,
        contract_function: ContractFunction,
        validator: Validator = None,
    ):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def validate_and_normalize_inputs(
        self,
        orders: List[Tuple0x260219a2],
        taker_asset_fill_amounts: List[int],
        signatures: List[bytes],
    ):
        """Validate the inputs to the batchFillOrKillOrders method."""
        self.validator.assert_valid(
            method_name="batchFillOrKillOrders",
            parameter_name="orders",
            argument_value=orders,
        )
        self.validator.assert_valid(
            method_name="batchFillOrKillOrders",
            parameter_name="takerAssetFillAmounts",
            argument_value=taker_asset_fill_amounts,
        )
        self.validator.assert_valid(
            method_name="batchFillOrKillOrders",
            parameter_name="signatures",
            argument_value=signatures,
        )
        signatures = [
            bytes.fromhex(signatures_element.decode("utf-8"))
            for signatures_element in signatures
        ]
        return (orders, taker_asset_fill_amounts, signatures)

    def call(
        self,
        orders: List[Tuple0x260219a2],
        taker_asset_fill_amounts: List[int],
        signatures: List[bytes],
        tx_params: Optional[TxParams] = None,
    ) -> Union[Tuple0xbb41e5b3, Union[HexBytes, bytes]]:
        """Execute underlying contract method via eth_call.

        Synchronously executes multiple calls of fillOrKill.

        :param orders: Array of order specifications.
        :param signatures: Proofs that orders have been created by makers.
        :param takerAssetFillAmounts: Array of desired amounts of takerAsset to
            sell in orders.
        :param tx_params: transaction parameters
        :returns: the return value of the underlying method.
        """
        (
            orders,
            taker_asset_fill_amounts,
            signatures,
        ) = self.validate_and_normalize_inputs(
            orders, taker_asset_fill_amounts, signatures
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(
            orders, taker_asset_fill_amounts, signatures
        ).call(tx_params.as_dict())

    def send_transaction(
        self,
        orders: List[Tuple0x260219a2],
        taker_asset_fill_amounts: List[int],
        signatures: List[bytes],
        tx_params: Optional[TxParams] = None,
    ) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        Synchronously executes multiple calls of fillOrKill.

        :param orders: Array of order specifications.
        :param signatures: Proofs that orders have been created by makers.
        :param takerAssetFillAmounts: Array of desired amounts of takerAsset to
            sell in orders.
        :param tx_params: transaction parameters
        """
        (
            orders,
            taker_asset_fill_amounts,
            signatures,
        ) = self.validate_and_normalize_inputs(
            orders, taker_asset_fill_amounts, signatures
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(
            orders, taker_asset_fill_amounts, signatures
        ).transact(tx_params.as_dict())

    def estimate_gas(
        self,
        orders: List[Tuple0x260219a2],
        taker_asset_fill_amounts: List[int],
        signatures: List[bytes],
        tx_params: Optional[TxParams] = None,
    ) -> int:
        """Estimate gas consumption of method call."""
        (
            orders,
            taker_asset_fill_amounts,
            signatures,
        ) = self.validate_and_normalize_inputs(
            orders, taker_asset_fill_amounts, signatures
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(
            orders, taker_asset_fill_amounts, signatures
        ).estimateGas(tx_params.as_dict())


class CancelOrdersUpToMethod(ContractMethod):
    """Various interfaces to the cancelOrdersUpTo method."""

    def __init__(
        self,
        provider: BaseProvider,
        contract_address: str,
        contract_function: ContractFunction,
        validator: Validator = None,
    ):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def validate_and_normalize_inputs(self, target_order_epoch: int):
        """Validate the inputs to the cancelOrdersUpTo method."""
        self.validator.assert_valid(
            method_name="cancelOrdersUpTo",
            parameter_name="targetOrderEpoch",
            argument_value=target_order_epoch,
        )
        # safeguard against fractional inputs
        target_order_epoch = int(target_order_epoch)
        return target_order_epoch

    def call(
        self, target_order_epoch: int, tx_params: Optional[TxParams] = None
    ) -> Union[None, Union[HexBytes, bytes]]:
        """Execute underlying contract method via eth_call.

        Cancels all orders created by makerAddress with a salt less than or
        equal to the targetOrderEpoch      and senderAddress equal to
        msg.sender (or null address if msg.sender == makerAddress).

        :param targetOrderEpoch: Orders created with a salt less or equal to
            this value will be cancelled.
        :param tx_params: transaction parameters
        :returns: the return value of the underlying method.
        """
        (target_order_epoch) = self.validate_and_normalize_inputs(
            target_order_epoch
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(target_order_epoch).call(
            tx_params.as_dict()
        )

    def send_transaction(
        self, target_order_epoch: int, tx_params: Optional[TxParams] = None
    ) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        Cancels all orders created by makerAddress with a salt less than or
        equal to the targetOrderEpoch      and senderAddress equal to
        msg.sender (or null address if msg.sender == makerAddress).

        :param targetOrderEpoch: Orders created with a salt less or equal to
            this value will be cancelled.
        :param tx_params: transaction parameters
        """
        (target_order_epoch) = self.validate_and_normalize_inputs(
            target_order_epoch
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(target_order_epoch).transact(
            tx_params.as_dict()
        )

    def estimate_gas(
        self, target_order_epoch: int, tx_params: Optional[TxParams] = None
    ) -> int:
        """Estimate gas consumption of method call."""
        (target_order_epoch) = self.validate_and_normalize_inputs(
            target_order_epoch
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(target_order_epoch).estimateGas(
            tx_params.as_dict()
        )


class BatchFillOrdersNoThrowMethod(ContractMethod):
    """Various interfaces to the batchFillOrdersNoThrow method."""

    def __init__(
        self,
        provider: BaseProvider,
        contract_address: str,
        contract_function: ContractFunction,
        validator: Validator = None,
    ):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def validate_and_normalize_inputs(
        self,
        orders: List[Tuple0x260219a2],
        taker_asset_fill_amounts: List[int],
        signatures: List[bytes],
    ):
        """Validate the inputs to the batchFillOrdersNoThrow method."""
        self.validator.assert_valid(
            method_name="batchFillOrdersNoThrow",
            parameter_name="orders",
            argument_value=orders,
        )
        self.validator.assert_valid(
            method_name="batchFillOrdersNoThrow",
            parameter_name="takerAssetFillAmounts",
            argument_value=taker_asset_fill_amounts,
        )
        self.validator.assert_valid(
            method_name="batchFillOrdersNoThrow",
            parameter_name="signatures",
            argument_value=signatures,
        )
        signatures = [
            bytes.fromhex(signatures_element.decode("utf-8"))
            for signatures_element in signatures
        ]
        return (orders, taker_asset_fill_amounts, signatures)

    def call(
        self,
        orders: List[Tuple0x260219a2],
        taker_asset_fill_amounts: List[int],
        signatures: List[bytes],
        tx_params: Optional[TxParams] = None,
    ) -> Union[Tuple0xbb41e5b3, Union[HexBytes, bytes]]:
        """Execute underlying contract method via eth_call.

        Fills an order with specified parameters and ECDSA signature.
        Returns false if the transaction would otherwise revert.

        :param orders: Array of order specifications.
        :param signatures: Proofs that orders have been created by makers.
        :param takerAssetFillAmounts: Array of desired amounts of takerAsset to
            sell in orders.
        :param tx_params: transaction parameters
        :returns: the return value of the underlying method.
        """
        (
            orders,
            taker_asset_fill_amounts,
            signatures,
        ) = self.validate_and_normalize_inputs(
            orders, taker_asset_fill_amounts, signatures
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(
            orders, taker_asset_fill_amounts, signatures
        ).call(tx_params.as_dict())

    def send_transaction(
        self,
        orders: List[Tuple0x260219a2],
        taker_asset_fill_amounts: List[int],
        signatures: List[bytes],
        tx_params: Optional[TxParams] = None,
    ) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        Fills an order with specified parameters and ECDSA signature.
        Returns false if the transaction would otherwise revert.

        :param orders: Array of order specifications.
        :param signatures: Proofs that orders have been created by makers.
        :param takerAssetFillAmounts: Array of desired amounts of takerAsset to
            sell in orders.
        :param tx_params: transaction parameters
        """
        (
            orders,
            taker_asset_fill_amounts,
            signatures,
        ) = self.validate_and_normalize_inputs(
            orders, taker_asset_fill_amounts, signatures
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(
            orders, taker_asset_fill_amounts, signatures
        ).transact(tx_params.as_dict())

    def estimate_gas(
        self,
        orders: List[Tuple0x260219a2],
        taker_asset_fill_amounts: List[int],
        signatures: List[bytes],
        tx_params: Optional[TxParams] = None,
    ) -> int:
        """Estimate gas consumption of method call."""
        (
            orders,
            taker_asset_fill_amounts,
            signatures,
        ) = self.validate_and_normalize_inputs(
            orders, taker_asset_fill_amounts, signatures
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(
            orders, taker_asset_fill_amounts, signatures
        ).estimateGas(tx_params.as_dict())


class GetAssetProxyMethod(ContractMethod):
    """Various interfaces to the getAssetProxy method."""

    def __init__(
        self,
        provider: BaseProvider,
        contract_address: str,
        contract_function: ContractFunction,
        validator: Validator = None,
    ):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def validate_and_normalize_inputs(self, asset_proxy_id: bytes):
        """Validate the inputs to the getAssetProxy method."""
        self.validator.assert_valid(
            method_name="getAssetProxy",
            parameter_name="assetProxyId",
            argument_value=asset_proxy_id,
        )
        return asset_proxy_id

    def call(
        self, asset_proxy_id: bytes, tx_params: Optional[TxParams] = None
    ) -> str:
        """Execute underlying contract method via eth_call.

        Gets an asset proxy.

        :param assetProxyId: Id of the asset proxy.
        :param tx_params: transaction parameters
        :returns: The asset proxy registered to assetProxyId. Returns 0x0 if no
            proxy is registered.
        """
        (asset_proxy_id) = self.validate_and_normalize_inputs(asset_proxy_id)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(asset_proxy_id).call(tx_params.as_dict())

    def send_transaction(
        self, asset_proxy_id: bytes, tx_params: Optional[TxParams] = None
    ) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        Gets an asset proxy.

        :param assetProxyId: Id of the asset proxy.
        :param tx_params: transaction parameters
        :returns: The asset proxy registered to assetProxyId. Returns 0x0 if no
            proxy is registered.
        """
        (asset_proxy_id) = self.validate_and_normalize_inputs(asset_proxy_id)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(asset_proxy_id).transact(
            tx_params.as_dict()
        )

    def estimate_gas(
        self, asset_proxy_id: bytes, tx_params: Optional[TxParams] = None
    ) -> int:
        """Estimate gas consumption of method call."""
        (asset_proxy_id) = self.validate_and_normalize_inputs(asset_proxy_id)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(asset_proxy_id).estimateGas(
            tx_params.as_dict()
        )


class TransactionsMethod(ContractMethod):
    """Various interfaces to the transactions method."""

    def __init__(
        self,
        provider: BaseProvider,
        contract_address: str,
        contract_function: ContractFunction,
        validator: Validator = None,
    ):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def validate_and_normalize_inputs(self, index_0: bytes):
        """Validate the inputs to the transactions method."""
        self.validator.assert_valid(
            method_name="transactions",
            parameter_name="index_0",
            argument_value=index_0,
        )
        return index_0

    def call(
        self, index_0: bytes, tx_params: Optional[TxParams] = None
    ) -> bool:
        """Execute underlying contract method via eth_call.

        :param tx_params: transaction parameters

        """
        (index_0) = self.validate_and_normalize_inputs(index_0)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(index_0).call(tx_params.as_dict())

    def send_transaction(
        self, index_0: bytes, tx_params: Optional[TxParams] = None
    ) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        :param tx_params: transaction parameters

        """
        (index_0) = self.validate_and_normalize_inputs(index_0)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(index_0).transact(tx_params.as_dict())

    def estimate_gas(
        self, index_0: bytes, tx_params: Optional[TxParams] = None
    ) -> int:
        """Estimate gas consumption of method call."""
        (index_0) = self.validate_and_normalize_inputs(index_0)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(index_0).estimateGas(tx_params.as_dict())


class FillOrKillOrderMethod(ContractMethod):
    """Various interfaces to the fillOrKillOrder method."""

    def __init__(
        self,
        provider: BaseProvider,
        contract_address: str,
        contract_function: ContractFunction,
        validator: Validator = None,
    ):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def validate_and_normalize_inputs(
        self,
        order: Tuple0x260219a2,
        taker_asset_fill_amount: int,
        signature: bytes,
    ):
        """Validate the inputs to the fillOrKillOrder method."""
        self.validator.assert_valid(
            method_name="fillOrKillOrder",
            parameter_name="order",
            argument_value=order,
        )
        self.validator.assert_valid(
            method_name="fillOrKillOrder",
            parameter_name="takerAssetFillAmount",
            argument_value=taker_asset_fill_amount,
        )
        # safeguard against fractional inputs
        taker_asset_fill_amount = int(taker_asset_fill_amount)
        self.validator.assert_valid(
            method_name="fillOrKillOrder",
            parameter_name="signature",
            argument_value=signature,
        )
        signature = bytes.fromhex(signature.decode("utf-8"))
        return (order, taker_asset_fill_amount, signature)

    def call(
        self,
        order: Tuple0x260219a2,
        taker_asset_fill_amount: int,
        signature: bytes,
        tx_params: Optional[TxParams] = None,
    ) -> Union[Tuple0xbb41e5b3, Union[HexBytes, bytes]]:
        """Execute underlying contract method via eth_call.

        Fills the input order. Reverts if exact takerAssetFillAmount not
        filled.

        :param order: Order struct containing order specifications.
        :param signature: Proof that order has been created by maker.
        :param takerAssetFillAmount: Desired amount of takerAsset to sell.
        :param tx_params: transaction parameters
        :returns: the return value of the underlying method.
        """
        (
            order,
            taker_asset_fill_amount,
            signature,
        ) = self.validate_and_normalize_inputs(
            order, taker_asset_fill_amount, signature
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(
            order, taker_asset_fill_amount, signature
        ).call(tx_params.as_dict())

    def send_transaction(
        self,
        order: Tuple0x260219a2,
        taker_asset_fill_amount: int,
        signature: bytes,
        tx_params: Optional[TxParams] = None,
    ) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        Fills the input order. Reverts if exact takerAssetFillAmount not
        filled.

        :param order: Order struct containing order specifications.
        :param signature: Proof that order has been created by maker.
        :param takerAssetFillAmount: Desired amount of takerAsset to sell.
        :param tx_params: transaction parameters
        """
        (
            order,
            taker_asset_fill_amount,
            signature,
        ) = self.validate_and_normalize_inputs(
            order, taker_asset_fill_amount, signature
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(
            order, taker_asset_fill_amount, signature
        ).transact(tx_params.as_dict())

    def estimate_gas(
        self,
        order: Tuple0x260219a2,
        taker_asset_fill_amount: int,
        signature: bytes,
        tx_params: Optional[TxParams] = None,
    ) -> int:
        """Estimate gas consumption of method call."""
        (
            order,
            taker_asset_fill_amount,
            signature,
        ) = self.validate_and_normalize_inputs(
            order, taker_asset_fill_amount, signature
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(
            order, taker_asset_fill_amount, signature
        ).estimateGas(tx_params.as_dict())


class SetSignatureValidatorApprovalMethod(ContractMethod):
    """Various interfaces to the setSignatureValidatorApproval method."""

    def __init__(
        self,
        provider: BaseProvider,
        contract_address: str,
        contract_function: ContractFunction,
        validator: Validator = None,
    ):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def validate_and_normalize_inputs(
        self, validator_address: str, approval: bool
    ):
        """Validate the inputs to the setSignatureValidatorApproval method."""
        self.validator.assert_valid(
            method_name="setSignatureValidatorApproval",
            parameter_name="validatorAddress",
            argument_value=validator_address,
        )
        validator_address = self.validate_and_checksum_address(
            validator_address
        )
        self.validator.assert_valid(
            method_name="setSignatureValidatorApproval",
            parameter_name="approval",
            argument_value=approval,
        )
        return (validator_address, approval)

    def call(
        self,
        validator_address: str,
        approval: bool,
        tx_params: Optional[TxParams] = None,
    ) -> Union[None, Union[HexBytes, bytes]]:
        """Execute underlying contract method via eth_call.

        Approves/unnapproves a Validator contract to verify signatures on
        signer's behalf.

        :param approval: Approval or disapproval of  Validator contract.
        :param validatorAddress: Address of Validator contract.
        :param tx_params: transaction parameters
        :returns: the return value of the underlying method.
        """
        (validator_address, approval) = self.validate_and_normalize_inputs(
            validator_address, approval
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(validator_address, approval).call(
            tx_params.as_dict()
        )

    def send_transaction(
        self,
        validator_address: str,
        approval: bool,
        tx_params: Optional[TxParams] = None,
    ) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        Approves/unnapproves a Validator contract to verify signatures on
        signer's behalf.

        :param approval: Approval or disapproval of  Validator contract.
        :param validatorAddress: Address of Validator contract.
        :param tx_params: transaction parameters
        """
        (validator_address, approval) = self.validate_and_normalize_inputs(
            validator_address, approval
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(validator_address, approval).transact(
            tx_params.as_dict()
        )

    def estimate_gas(
        self,
        validator_address: str,
        approval: bool,
        tx_params: Optional[TxParams] = None,
    ) -> int:
        """Estimate gas consumption of method call."""
        (validator_address, approval) = self.validate_and_normalize_inputs(
            validator_address, approval
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(validator_address, approval).estimateGas(
            tx_params.as_dict()
        )


class AllowedValidatorsMethod(ContractMethod):
    """Various interfaces to the allowedValidators method."""

    def __init__(
        self,
        provider: BaseProvider,
        contract_address: str,
        contract_function: ContractFunction,
        validator: Validator = None,
    ):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def validate_and_normalize_inputs(self, index_0: str, index_1: str):
        """Validate the inputs to the allowedValidators method."""
        self.validator.assert_valid(
            method_name="allowedValidators",
            parameter_name="index_0",
            argument_value=index_0,
        )
        index_0 = self.validate_and_checksum_address(index_0)
        self.validator.assert_valid(
            method_name="allowedValidators",
            parameter_name="index_1",
            argument_value=index_1,
        )
        index_1 = self.validate_and_checksum_address(index_1)
        return (index_0, index_1)

    def call(
        self, index_0: str, index_1: str, tx_params: Optional[TxParams] = None
    ) -> bool:
        """Execute underlying contract method via eth_call.

        :param tx_params: transaction parameters

        """
        (index_0, index_1) = self.validate_and_normalize_inputs(
            index_0, index_1
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(index_0, index_1).call(
            tx_params.as_dict()
        )

    def send_transaction(
        self, index_0: str, index_1: str, tx_params: Optional[TxParams] = None
    ) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        :param tx_params: transaction parameters

        """
        (index_0, index_1) = self.validate_and_normalize_inputs(
            index_0, index_1
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(index_0, index_1).transact(
            tx_params.as_dict()
        )

    def estimate_gas(
        self, index_0: str, index_1: str, tx_params: Optional[TxParams] = None
    ) -> int:
        """Estimate gas consumption of method call."""
        (index_0, index_1) = self.validate_and_normalize_inputs(
            index_0, index_1
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(index_0, index_1).estimateGas(
            tx_params.as_dict()
        )


class MarketSellOrdersMethod(ContractMethod):
    """Various interfaces to the marketSellOrders method."""

    def __init__(
        self,
        provider: BaseProvider,
        contract_address: str,
        contract_function: ContractFunction,
        validator: Validator = None,
    ):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def validate_and_normalize_inputs(
        self,
        orders: List[Tuple0x260219a2],
        taker_asset_fill_amount: int,
        signatures: List[bytes],
    ):
        """Validate the inputs to the marketSellOrders method."""
        self.validator.assert_valid(
            method_name="marketSellOrders",
            parameter_name="orders",
            argument_value=orders,
        )
        self.validator.assert_valid(
            method_name="marketSellOrders",
            parameter_name="takerAssetFillAmount",
            argument_value=taker_asset_fill_amount,
        )
        # safeguard against fractional inputs
        taker_asset_fill_amount = int(taker_asset_fill_amount)
        self.validator.assert_valid(
            method_name="marketSellOrders",
            parameter_name="signatures",
            argument_value=signatures,
        )
        signatures = [
            bytes.fromhex(signatures_element.decode("utf-8"))
            for signatures_element in signatures
        ]
        return (orders, taker_asset_fill_amount, signatures)

    def call(
        self,
        orders: List[Tuple0x260219a2],
        taker_asset_fill_amount: int,
        signatures: List[bytes],
        tx_params: Optional[TxParams] = None,
    ) -> Union[Tuple0xbb41e5b3, Union[HexBytes, bytes]]:
        """Execute underlying contract method via eth_call.

        Synchronously executes multiple calls of fillOrder until total amount
        of takerAsset is sold by taker.

        :param orders: Array of order specifications.
        :param signatures: Proofs that orders have been created by makers.
        :param takerAssetFillAmount: Desired amount of takerAsset to sell.
        :param tx_params: transaction parameters
        :returns: the return value of the underlying method.
        """
        (
            orders,
            taker_asset_fill_amount,
            signatures,
        ) = self.validate_and_normalize_inputs(
            orders, taker_asset_fill_amount, signatures
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(
            orders, taker_asset_fill_amount, signatures
        ).call(tx_params.as_dict())

    def send_transaction(
        self,
        orders: List[Tuple0x260219a2],
        taker_asset_fill_amount: int,
        signatures: List[bytes],
        tx_params: Optional[TxParams] = None,
    ) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        Synchronously executes multiple calls of fillOrder until total amount
        of takerAsset is sold by taker.

        :param orders: Array of order specifications.
        :param signatures: Proofs that orders have been created by makers.
        :param takerAssetFillAmount: Desired amount of takerAsset to sell.
        :param tx_params: transaction parameters
        """
        (
            orders,
            taker_asset_fill_amount,
            signatures,
        ) = self.validate_and_normalize_inputs(
            orders, taker_asset_fill_amount, signatures
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(
            orders, taker_asset_fill_amount, signatures
        ).transact(tx_params.as_dict())

    def estimate_gas(
        self,
        orders: List[Tuple0x260219a2],
        taker_asset_fill_amount: int,
        signatures: List[bytes],
        tx_params: Optional[TxParams] = None,
    ) -> int:
        """Estimate gas consumption of method call."""
        (
            orders,
            taker_asset_fill_amount,
            signatures,
        ) = self.validate_and_normalize_inputs(
            orders, taker_asset_fill_amount, signatures
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(
            orders, taker_asset_fill_amount, signatures
        ).estimateGas(tx_params.as_dict())


class GetOrdersInfoMethod(ContractMethod):
    """Various interfaces to the getOrdersInfo method."""

    def __init__(
        self,
        provider: BaseProvider,
        contract_address: str,
        contract_function: ContractFunction,
        validator: Validator = None,
    ):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def validate_and_normalize_inputs(self, orders: List[Tuple0x260219a2]):
        """Validate the inputs to the getOrdersInfo method."""
        self.validator.assert_valid(
            method_name="getOrdersInfo",
            parameter_name="orders",
            argument_value=orders,
        )
        return orders

    def call(
        self,
        orders: List[Tuple0x260219a2],
        tx_params: Optional[TxParams] = None,
    ) -> List[Tuple0xb1e4a1ae]:
        """Execute underlying contract method via eth_call.

        Fetches information for all passed in orders.

        :param orders: Array of order specifications.
        :param tx_params: transaction parameters
        :returns: Array of OrderInfo instances that correspond to each order.
        """
        (orders) = self.validate_and_normalize_inputs(orders)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(orders).call(tx_params.as_dict())

    def send_transaction(
        self,
        orders: List[Tuple0x260219a2],
        tx_params: Optional[TxParams] = None,
    ) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        Fetches information for all passed in orders.

        :param orders: Array of order specifications.
        :param tx_params: transaction parameters
        :returns: Array of OrderInfo instances that correspond to each order.
        """
        (orders) = self.validate_and_normalize_inputs(orders)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(orders).transact(tx_params.as_dict())

    def estimate_gas(
        self,
        orders: List[Tuple0x260219a2],
        tx_params: Optional[TxParams] = None,
    ) -> int:
        """Estimate gas consumption of method call."""
        (orders) = self.validate_and_normalize_inputs(orders)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(orders).estimateGas(tx_params.as_dict())


class PreSignedMethod(ContractMethod):
    """Various interfaces to the preSigned method."""

    def __init__(
        self,
        provider: BaseProvider,
        contract_address: str,
        contract_function: ContractFunction,
        validator: Validator = None,
    ):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def validate_and_normalize_inputs(self, index_0: bytes, index_1: str):
        """Validate the inputs to the preSigned method."""
        self.validator.assert_valid(
            method_name="preSigned",
            parameter_name="index_0",
            argument_value=index_0,
        )
        self.validator.assert_valid(
            method_name="preSigned",
            parameter_name="index_1",
            argument_value=index_1,
        )
        index_1 = self.validate_and_checksum_address(index_1)
        return (index_0, index_1)

    def call(
        self,
        index_0: bytes,
        index_1: str,
        tx_params: Optional[TxParams] = None,
    ) -> bool:
        """Execute underlying contract method via eth_call.

        :param tx_params: transaction parameters

        """
        (index_0, index_1) = self.validate_and_normalize_inputs(
            index_0, index_1
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(index_0, index_1).call(
            tx_params.as_dict()
        )

    def send_transaction(
        self,
        index_0: bytes,
        index_1: str,
        tx_params: Optional[TxParams] = None,
    ) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        :param tx_params: transaction parameters

        """
        (index_0, index_1) = self.validate_and_normalize_inputs(
            index_0, index_1
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(index_0, index_1).transact(
            tx_params.as_dict()
        )

    def estimate_gas(
        self,
        index_0: bytes,
        index_1: str,
        tx_params: Optional[TxParams] = None,
    ) -> int:
        """Estimate gas consumption of method call."""
        (index_0, index_1) = self.validate_and_normalize_inputs(
            index_0, index_1
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(index_0, index_1).estimateGas(
            tx_params.as_dict()
        )


class OwnerMethod(ContractMethod):
    """Various interfaces to the owner method."""

    def __init__(
        self,
        provider: BaseProvider,
        contract_address: str,
        contract_function: ContractFunction,
        validator: Validator = None,
    ):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def call(self, tx_params: Optional[TxParams] = None) -> str:
        """Execute underlying contract method via eth_call.

        :param tx_params: transaction parameters

        """
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method().call(tx_params.as_dict())

    def send_transaction(
        self, tx_params: Optional[TxParams] = None
    ) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        :param tx_params: transaction parameters

        """
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method().transact(tx_params.as_dict())

    def estimate_gas(self, tx_params: Optional[TxParams] = None) -> int:
        """Estimate gas consumption of method call."""
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method().estimateGas(tx_params.as_dict())


class IsValidSignatureMethod(ContractMethod):
    """Various interfaces to the isValidSignature method."""

    def __init__(
        self,
        provider: BaseProvider,
        contract_address: str,
        contract_function: ContractFunction,
        validator: Validator = None,
    ):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def validate_and_normalize_inputs(
        self, _hash: bytes, signer_address: str, signature: bytes
    ):
        """Validate the inputs to the isValidSignature method."""
        self.validator.assert_valid(
            method_name="isValidSignature",
            parameter_name="hash",
            argument_value=_hash,
        )
        self.validator.assert_valid(
            method_name="isValidSignature",
            parameter_name="signerAddress",
            argument_value=signer_address,
        )
        signer_address = self.validate_and_checksum_address(signer_address)
        self.validator.assert_valid(
            method_name="isValidSignature",
            parameter_name="signature",
            argument_value=signature,
        )
        signature = bytes.fromhex(signature.decode("utf-8"))
        return (_hash, signer_address, signature)

    def call(
        self,
        _hash: bytes,
        signer_address: str,
        signature: bytes,
        tx_params: Optional[TxParams] = None,
    ) -> bool:
        """Execute underlying contract method via eth_call.

        Verifies that a hash has been signed by the given signer.

        :param hash: Any 32 byte hash.
        :param signature: Proof that the hash has been signed by signer.
        :param signerAddress: Address that should have signed the given hash.
        :param tx_params: transaction parameters
        :returns: True if the address recovered from the provided signature
            matches the input signer address.
        """
        (
            _hash,
            signer_address,
            signature,
        ) = self.validate_and_normalize_inputs(
            _hash, signer_address, signature
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(_hash, signer_address, signature).call(
            tx_params.as_dict()
        )

    def send_transaction(
        self,
        _hash: bytes,
        signer_address: str,
        signature: bytes,
        tx_params: Optional[TxParams] = None,
    ) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        Verifies that a hash has been signed by the given signer.

        :param hash: Any 32 byte hash.
        :param signature: Proof that the hash has been signed by signer.
        :param signerAddress: Address that should have signed the given hash.
        :param tx_params: transaction parameters
        :returns: True if the address recovered from the provided signature
            matches the input signer address.
        """
        (
            _hash,
            signer_address,
            signature,
        ) = self.validate_and_normalize_inputs(
            _hash, signer_address, signature
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(
            _hash, signer_address, signature
        ).transact(tx_params.as_dict())

    def estimate_gas(
        self,
        _hash: bytes,
        signer_address: str,
        signature: bytes,
        tx_params: Optional[TxParams] = None,
    ) -> int:
        """Estimate gas consumption of method call."""
        (
            _hash,
            signer_address,
            signature,
        ) = self.validate_and_normalize_inputs(
            _hash, signer_address, signature
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(
            _hash, signer_address, signature
        ).estimateGas(tx_params.as_dict())


class MarketBuyOrdersNoThrowMethod(ContractMethod):
    """Various interfaces to the marketBuyOrdersNoThrow method."""

    def __init__(
        self,
        provider: BaseProvider,
        contract_address: str,
        contract_function: ContractFunction,
        validator: Validator = None,
    ):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def validate_and_normalize_inputs(
        self,
        orders: List[Tuple0x260219a2],
        maker_asset_fill_amount: int,
        signatures: List[bytes],
    ):
        """Validate the inputs to the marketBuyOrdersNoThrow method."""
        self.validator.assert_valid(
            method_name="marketBuyOrdersNoThrow",
            parameter_name="orders",
            argument_value=orders,
        )
        self.validator.assert_valid(
            method_name="marketBuyOrdersNoThrow",
            parameter_name="makerAssetFillAmount",
            argument_value=maker_asset_fill_amount,
        )
        # safeguard against fractional inputs
        maker_asset_fill_amount = int(maker_asset_fill_amount)
        self.validator.assert_valid(
            method_name="marketBuyOrdersNoThrow",
            parameter_name="signatures",
            argument_value=signatures,
        )
        signatures = [
            bytes.fromhex(signatures_element.decode("utf-8"))
            for signatures_element in signatures
        ]
        return (orders, maker_asset_fill_amount, signatures)

    def call(
        self,
        orders: List[Tuple0x260219a2],
        maker_asset_fill_amount: int,
        signatures: List[bytes],
        tx_params: Optional[TxParams] = None,
    ) -> Union[Tuple0xbb41e5b3, Union[HexBytes, bytes]]:
        """Execute underlying contract method via eth_call.

        Synchronously executes multiple fill orders in a single transaction
        until total amount is bought by taker.      Returns false if the
        transaction would otherwise revert.

        :param makerAssetFillAmount: Desired amount of makerAsset to buy.
        :param orders: Array of order specifications.
        :param signatures: Proofs that orders have been signed by makers.
        :param tx_params: transaction parameters
        :returns: the return value of the underlying method.
        """
        (
            orders,
            maker_asset_fill_amount,
            signatures,
        ) = self.validate_and_normalize_inputs(
            orders, maker_asset_fill_amount, signatures
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(
            orders, maker_asset_fill_amount, signatures
        ).call(tx_params.as_dict())

    def send_transaction(
        self,
        orders: List[Tuple0x260219a2],
        maker_asset_fill_amount: int,
        signatures: List[bytes],
        tx_params: Optional[TxParams] = None,
    ) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        Synchronously executes multiple fill orders in a single transaction
        until total amount is bought by taker.      Returns false if the
        transaction would otherwise revert.

        :param makerAssetFillAmount: Desired amount of makerAsset to buy.
        :param orders: Array of order specifications.
        :param signatures: Proofs that orders have been signed by makers.
        :param tx_params: transaction parameters
        """
        (
            orders,
            maker_asset_fill_amount,
            signatures,
        ) = self.validate_and_normalize_inputs(
            orders, maker_asset_fill_amount, signatures
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(
            orders, maker_asset_fill_amount, signatures
        ).transact(tx_params.as_dict())

    def estimate_gas(
        self,
        orders: List[Tuple0x260219a2],
        maker_asset_fill_amount: int,
        signatures: List[bytes],
        tx_params: Optional[TxParams] = None,
    ) -> int:
        """Estimate gas consumption of method call."""
        (
            orders,
            maker_asset_fill_amount,
            signatures,
        ) = self.validate_and_normalize_inputs(
            orders, maker_asset_fill_amount, signatures
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(
            orders, maker_asset_fill_amount, signatures
        ).estimateGas(tx_params.as_dict())


class FillOrderMethod(ContractMethod):
    """Various interfaces to the fillOrder method."""

    def __init__(
        self,
        provider: BaseProvider,
        contract_address: str,
        contract_function: ContractFunction,
        validator: Validator = None,
    ):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def validate_and_normalize_inputs(
        self,
        order: Tuple0x260219a2,
        taker_asset_fill_amount: int,
        signature: bytes,
    ):
        """Validate the inputs to the fillOrder method."""
        self.validator.assert_valid(
            method_name="fillOrder",
            parameter_name="order",
            argument_value=order,
        )
        self.validator.assert_valid(
            method_name="fillOrder",
            parameter_name="takerAssetFillAmount",
            argument_value=taker_asset_fill_amount,
        )
        # safeguard against fractional inputs
        taker_asset_fill_amount = int(taker_asset_fill_amount)
        self.validator.assert_valid(
            method_name="fillOrder",
            parameter_name="signature",
            argument_value=signature,
        )
        signature = bytes.fromhex(signature.decode("utf-8"))
        return (order, taker_asset_fill_amount, signature)

    def call(
        self,
        order: Tuple0x260219a2,
        taker_asset_fill_amount: int,
        signature: bytes,
        tx_params: Optional[TxParams] = None,
    ) -> Union[Tuple0xbb41e5b3, Union[HexBytes, bytes]]:
        """Execute underlying contract method via eth_call.

        Fills the input order.

        :param order: Order struct containing order specifications.
        :param signature: Proof that order has been created by maker.
        :param takerAssetFillAmount: Desired amount of takerAsset to sell.
        :param tx_params: transaction parameters
        :returns: the return value of the underlying method.
        """
        (
            order,
            taker_asset_fill_amount,
            signature,
        ) = self.validate_and_normalize_inputs(
            order, taker_asset_fill_amount, signature
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(
            order, taker_asset_fill_amount, signature
        ).call(tx_params.as_dict())

    def send_transaction(
        self,
        order: Tuple0x260219a2,
        taker_asset_fill_amount: int,
        signature: bytes,
        tx_params: Optional[TxParams] = None,
    ) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        Fills the input order.

        :param order: Order struct containing order specifications.
        :param signature: Proof that order has been created by maker.
        :param takerAssetFillAmount: Desired amount of takerAsset to sell.
        :param tx_params: transaction parameters
        """
        (
            order,
            taker_asset_fill_amount,
            signature,
        ) = self.validate_and_normalize_inputs(
            order, taker_asset_fill_amount, signature
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(
            order, taker_asset_fill_amount, signature
        ).transact(tx_params.as_dict())

    def estimate_gas(
        self,
        order: Tuple0x260219a2,
        taker_asset_fill_amount: int,
        signature: bytes,
        tx_params: Optional[TxParams] = None,
    ) -> int:
        """Estimate gas consumption of method call."""
        (
            order,
            taker_asset_fill_amount,
            signature,
        ) = self.validate_and_normalize_inputs(
            order, taker_asset_fill_amount, signature
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(
            order, taker_asset_fill_amount, signature
        ).estimateGas(tx_params.as_dict())


class ExecuteTransactionMethod(ContractMethod):
    """Various interfaces to the executeTransaction method."""

    def __init__(
        self,
        provider: BaseProvider,
        contract_address: str,
        contract_function: ContractFunction,
        validator: Validator = None,
    ):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def validate_and_normalize_inputs(
        self, salt: int, signer_address: str, data: bytes, signature: bytes
    ):
        """Validate the inputs to the executeTransaction method."""
        self.validator.assert_valid(
            method_name="executeTransaction",
            parameter_name="salt",
            argument_value=salt,
        )
        # safeguard against fractional inputs
        salt = int(salt)
        self.validator.assert_valid(
            method_name="executeTransaction",
            parameter_name="signerAddress",
            argument_value=signer_address,
        )
        signer_address = self.validate_and_checksum_address(signer_address)
        self.validator.assert_valid(
            method_name="executeTransaction",
            parameter_name="data",
            argument_value=data,
        )
        data = bytes.fromhex(data.decode("utf-8"))
        self.validator.assert_valid(
            method_name="executeTransaction",
            parameter_name="signature",
            argument_value=signature,
        )
        signature = bytes.fromhex(signature.decode("utf-8"))
        return (salt, signer_address, data, signature)

    def call(
        self,
        salt: int,
        signer_address: str,
        data: bytes,
        signature: bytes,
        tx_params: Optional[TxParams] = None,
    ) -> Union[None, Union[HexBytes, bytes]]:
        """Execute underlying contract method via eth_call.

        Executes an exchange method call in the context of signer.

        :param data: AbiV2 encoded calldata.
        :param salt: Arbitrary number to ensure uniqueness of transaction hash.
        :param signature: Proof of signer transaction by signer.
        :param signerAddress: Address of transaction signer.
        :param tx_params: transaction parameters
        :returns: the return value of the underlying method.
        """
        (
            salt,
            signer_address,
            data,
            signature,
        ) = self.validate_and_normalize_inputs(
            salt, signer_address, data, signature
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(
            salt, signer_address, data, signature
        ).call(tx_params.as_dict())

    def send_transaction(
        self,
        salt: int,
        signer_address: str,
        data: bytes,
        signature: bytes,
        tx_params: Optional[TxParams] = None,
    ) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        Executes an exchange method call in the context of signer.

        :param data: AbiV2 encoded calldata.
        :param salt: Arbitrary number to ensure uniqueness of transaction hash.
        :param signature: Proof of signer transaction by signer.
        :param signerAddress: Address of transaction signer.
        :param tx_params: transaction parameters
        """
        (
            salt,
            signer_address,
            data,
            signature,
        ) = self.validate_and_normalize_inputs(
            salt, signer_address, data, signature
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(
            salt, signer_address, data, signature
        ).transact(tx_params.as_dict())

    def estimate_gas(
        self,
        salt: int,
        signer_address: str,
        data: bytes,
        signature: bytes,
        tx_params: Optional[TxParams] = None,
    ) -> int:
        """Estimate gas consumption of method call."""
        (
            salt,
            signer_address,
            data,
            signature,
        ) = self.validate_and_normalize_inputs(
            salt, signer_address, data, signature
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(
            salt, signer_address, data, signature
        ).estimateGas(tx_params.as_dict())


class RegisterAssetProxyMethod(ContractMethod):
    """Various interfaces to the registerAssetProxy method."""

    def __init__(
        self,
        provider: BaseProvider,
        contract_address: str,
        contract_function: ContractFunction,
        validator: Validator = None,
    ):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def validate_and_normalize_inputs(self, asset_proxy: str):
        """Validate the inputs to the registerAssetProxy method."""
        self.validator.assert_valid(
            method_name="registerAssetProxy",
            parameter_name="assetProxy",
            argument_value=asset_proxy,
        )
        asset_proxy = self.validate_and_checksum_address(asset_proxy)
        return asset_proxy

    def call(
        self, asset_proxy: str, tx_params: Optional[TxParams] = None
    ) -> Union[None, Union[HexBytes, bytes]]:
        """Execute underlying contract method via eth_call.

        Registers an asset proxy to its asset proxy id.      Once an asset
        proxy is registered, it cannot be unregistered.

        :param assetProxy: Address of new asset proxy to register.
        :param tx_params: transaction parameters
        :returns: the return value of the underlying method.
        """
        (asset_proxy) = self.validate_and_normalize_inputs(asset_proxy)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(asset_proxy).call(tx_params.as_dict())

    def send_transaction(
        self, asset_proxy: str, tx_params: Optional[TxParams] = None
    ) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        Registers an asset proxy to its asset proxy id.      Once an asset
        proxy is registered, it cannot be unregistered.

        :param assetProxy: Address of new asset proxy to register.
        :param tx_params: transaction parameters
        """
        (asset_proxy) = self.validate_and_normalize_inputs(asset_proxy)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(asset_proxy).transact(
            tx_params.as_dict()
        )

    def estimate_gas(
        self, asset_proxy: str, tx_params: Optional[TxParams] = None
    ) -> int:
        """Estimate gas consumption of method call."""
        (asset_proxy) = self.validate_and_normalize_inputs(asset_proxy)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(asset_proxy).estimateGas(
            tx_params.as_dict()
        )


class GetOrderInfoMethod(ContractMethod):
    """Various interfaces to the getOrderInfo method."""

    def __init__(
        self,
        provider: BaseProvider,
        contract_address: str,
        contract_function: ContractFunction,
        validator: Validator = None,
    ):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def validate_and_normalize_inputs(self, order: Tuple0x260219a2):
        """Validate the inputs to the getOrderInfo method."""
        self.validator.assert_valid(
            method_name="getOrderInfo",
            parameter_name="order",
            argument_value=order,
        )
        return order

    def call(
        self, order: Tuple0x260219a2, tx_params: Optional[TxParams] = None
    ) -> Tuple0xb1e4a1ae:
        """Execute underlying contract method via eth_call.

        Gets information about an order: status, hash, and amount filled.

        :param order: Order to gather information on.
        :param tx_params: transaction parameters
        :returns: OrderInfo Information about the order and its state.
            See LibOrder.OrderInfo for a complete description.
        """
        (order) = self.validate_and_normalize_inputs(order)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(order).call(tx_params.as_dict())

    def send_transaction(
        self, order: Tuple0x260219a2, tx_params: Optional[TxParams] = None
    ) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        Gets information about an order: status, hash, and amount filled.

        :param order: Order to gather information on.
        :param tx_params: transaction parameters
        :returns: OrderInfo Information about the order and its state.
            See LibOrder.OrderInfo for a complete description.
        """
        (order) = self.validate_and_normalize_inputs(order)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(order).transact(tx_params.as_dict())

    def estimate_gas(
        self, order: Tuple0x260219a2, tx_params: Optional[TxParams] = None
    ) -> int:
        """Estimate gas consumption of method call."""
        (order) = self.validate_and_normalize_inputs(order)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(order).estimateGas(tx_params.as_dict())


class CancelOrderMethod(ContractMethod):
    """Various interfaces to the cancelOrder method."""

    def __init__(
        self,
        provider: BaseProvider,
        contract_address: str,
        contract_function: ContractFunction,
        validator: Validator = None,
    ):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def validate_and_normalize_inputs(self, order: Tuple0x260219a2):
        """Validate the inputs to the cancelOrder method."""
        self.validator.assert_valid(
            method_name="cancelOrder",
            parameter_name="order",
            argument_value=order,
        )
        return order

    def call(
        self, order: Tuple0x260219a2, tx_params: Optional[TxParams] = None
    ) -> Union[None, Union[HexBytes, bytes]]:
        """Execute underlying contract method via eth_call.

        After calling, the order can not be filled anymore.      Throws if
        order is invalid or sender does not have permission to cancel.

        :param order: Order to cancel. Order must be OrderStatus.FILLABLE.
        :param tx_params: transaction parameters
        :returns: the return value of the underlying method.
        """
        (order) = self.validate_and_normalize_inputs(order)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(order).call(tx_params.as_dict())

    def send_transaction(
        self, order: Tuple0x260219a2, tx_params: Optional[TxParams] = None
    ) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        After calling, the order can not be filled anymore.      Throws if
        order is invalid or sender does not have permission to cancel.

        :param order: Order to cancel. Order must be OrderStatus.FILLABLE.
        :param tx_params: transaction parameters
        """
        (order) = self.validate_and_normalize_inputs(order)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(order).transact(tx_params.as_dict())

    def estimate_gas(
        self, order: Tuple0x260219a2, tx_params: Optional[TxParams] = None
    ) -> int:
        """Estimate gas consumption of method call."""
        (order) = self.validate_and_normalize_inputs(order)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(order).estimateGas(tx_params.as_dict())


class OrderEpochMethod(ContractMethod):
    """Various interfaces to the orderEpoch method."""

    def __init__(
        self,
        provider: BaseProvider,
        contract_address: str,
        contract_function: ContractFunction,
        validator: Validator = None,
    ):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def validate_and_normalize_inputs(self, index_0: str, index_1: str):
        """Validate the inputs to the orderEpoch method."""
        self.validator.assert_valid(
            method_name="orderEpoch",
            parameter_name="index_0",
            argument_value=index_0,
        )
        index_0 = self.validate_and_checksum_address(index_0)
        self.validator.assert_valid(
            method_name="orderEpoch",
            parameter_name="index_1",
            argument_value=index_1,
        )
        index_1 = self.validate_and_checksum_address(index_1)
        return (index_0, index_1)

    def call(
        self, index_0: str, index_1: str, tx_params: Optional[TxParams] = None
    ) -> int:
        """Execute underlying contract method via eth_call.

        :param tx_params: transaction parameters

        """
        (index_0, index_1) = self.validate_and_normalize_inputs(
            index_0, index_1
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(index_0, index_1).call(
            tx_params.as_dict()
        )

    def send_transaction(
        self, index_0: str, index_1: str, tx_params: Optional[TxParams] = None
    ) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        :param tx_params: transaction parameters

        """
        (index_0, index_1) = self.validate_and_normalize_inputs(
            index_0, index_1
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(index_0, index_1).transact(
            tx_params.as_dict()
        )

    def estimate_gas(
        self, index_0: str, index_1: str, tx_params: Optional[TxParams] = None
    ) -> int:
        """Estimate gas consumption of method call."""
        (index_0, index_1) = self.validate_and_normalize_inputs(
            index_0, index_1
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(index_0, index_1).estimateGas(
            tx_params.as_dict()
        )


class ZrxAssetDataMethod(ContractMethod):
    """Various interfaces to the ZRX_ASSET_DATA method."""

    def __init__(
        self,
        provider: BaseProvider,
        contract_address: str,
        contract_function: ContractFunction,
        validator: Validator = None,
    ):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def call(self, tx_params: Optional[TxParams] = None) -> bytes:
        """Execute underlying contract method via eth_call.

        :param tx_params: transaction parameters

        """
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method().call(tx_params.as_dict())

    def send_transaction(
        self, tx_params: Optional[TxParams] = None
    ) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        :param tx_params: transaction parameters

        """
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method().transact(tx_params.as_dict())

    def estimate_gas(self, tx_params: Optional[TxParams] = None) -> int:
        """Estimate gas consumption of method call."""
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method().estimateGas(tx_params.as_dict())


class MarketSellOrdersNoThrowMethod(ContractMethod):
    """Various interfaces to the marketSellOrdersNoThrow method."""

    def __init__(
        self,
        provider: BaseProvider,
        contract_address: str,
        contract_function: ContractFunction,
        validator: Validator = None,
    ):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def validate_and_normalize_inputs(
        self,
        orders: List[Tuple0x260219a2],
        taker_asset_fill_amount: int,
        signatures: List[bytes],
    ):
        """Validate the inputs to the marketSellOrdersNoThrow method."""
        self.validator.assert_valid(
            method_name="marketSellOrdersNoThrow",
            parameter_name="orders",
            argument_value=orders,
        )
        self.validator.assert_valid(
            method_name="marketSellOrdersNoThrow",
            parameter_name="takerAssetFillAmount",
            argument_value=taker_asset_fill_amount,
        )
        # safeguard against fractional inputs
        taker_asset_fill_amount = int(taker_asset_fill_amount)
        self.validator.assert_valid(
            method_name="marketSellOrdersNoThrow",
            parameter_name="signatures",
            argument_value=signatures,
        )
        signatures = [
            bytes.fromhex(signatures_element.decode("utf-8"))
            for signatures_element in signatures
        ]
        return (orders, taker_asset_fill_amount, signatures)

    def call(
        self,
        orders: List[Tuple0x260219a2],
        taker_asset_fill_amount: int,
        signatures: List[bytes],
        tx_params: Optional[TxParams] = None,
    ) -> Union[Tuple0xbb41e5b3, Union[HexBytes, bytes]]:
        """Execute underlying contract method via eth_call.

        Synchronously executes multiple calls of fillOrder until total amount
        of takerAsset is sold by taker.      Returns false if the transaction
        would otherwise revert.

        :param orders: Array of order specifications.
        :param signatures: Proofs that orders have been signed by makers.
        :param takerAssetFillAmount: Desired amount of takerAsset to sell.
        :param tx_params: transaction parameters
        :returns: the return value of the underlying method.
        """
        (
            orders,
            taker_asset_fill_amount,
            signatures,
        ) = self.validate_and_normalize_inputs(
            orders, taker_asset_fill_amount, signatures
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(
            orders, taker_asset_fill_amount, signatures
        ).call(tx_params.as_dict())

    def send_transaction(
        self,
        orders: List[Tuple0x260219a2],
        taker_asset_fill_amount: int,
        signatures: List[bytes],
        tx_params: Optional[TxParams] = None,
    ) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        Synchronously executes multiple calls of fillOrder until total amount
        of takerAsset is sold by taker.      Returns false if the transaction
        would otherwise revert.

        :param orders: Array of order specifications.
        :param signatures: Proofs that orders have been signed by makers.
        :param takerAssetFillAmount: Desired amount of takerAsset to sell.
        :param tx_params: transaction parameters
        """
        (
            orders,
            taker_asset_fill_amount,
            signatures,
        ) = self.validate_and_normalize_inputs(
            orders, taker_asset_fill_amount, signatures
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(
            orders, taker_asset_fill_amount, signatures
        ).transact(tx_params.as_dict())

    def estimate_gas(
        self,
        orders: List[Tuple0x260219a2],
        taker_asset_fill_amount: int,
        signatures: List[bytes],
        tx_params: Optional[TxParams] = None,
    ) -> int:
        """Estimate gas consumption of method call."""
        (
            orders,
            taker_asset_fill_amount,
            signatures,
        ) = self.validate_and_normalize_inputs(
            orders, taker_asset_fill_amount, signatures
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(
            orders, taker_asset_fill_amount, signatures
        ).estimateGas(tx_params.as_dict())


class Eip712DomainHashMethod(ContractMethod):
    """Various interfaces to the EIP712_DOMAIN_HASH method."""

    def __init__(
        self,
        provider: BaseProvider,
        contract_address: str,
        contract_function: ContractFunction,
        validator: Validator = None,
    ):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def call(self, tx_params: Optional[TxParams] = None) -> bytes:
        """Execute underlying contract method via eth_call.

        :param tx_params: transaction parameters

        """
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method().call(tx_params.as_dict())

    def send_transaction(
        self, tx_params: Optional[TxParams] = None
    ) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        :param tx_params: transaction parameters

        """
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method().transact(tx_params.as_dict())

    def estimate_gas(self, tx_params: Optional[TxParams] = None) -> int:
        """Estimate gas consumption of method call."""
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method().estimateGas(tx_params.as_dict())


class MarketBuyOrdersMethod(ContractMethod):
    """Various interfaces to the marketBuyOrders method."""

    def __init__(
        self,
        provider: BaseProvider,
        contract_address: str,
        contract_function: ContractFunction,
        validator: Validator = None,
    ):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def validate_and_normalize_inputs(
        self,
        orders: List[Tuple0x260219a2],
        maker_asset_fill_amount: int,
        signatures: List[bytes],
    ):
        """Validate the inputs to the marketBuyOrders method."""
        self.validator.assert_valid(
            method_name="marketBuyOrders",
            parameter_name="orders",
            argument_value=orders,
        )
        self.validator.assert_valid(
            method_name="marketBuyOrders",
            parameter_name="makerAssetFillAmount",
            argument_value=maker_asset_fill_amount,
        )
        # safeguard against fractional inputs
        maker_asset_fill_amount = int(maker_asset_fill_amount)
        self.validator.assert_valid(
            method_name="marketBuyOrders",
            parameter_name="signatures",
            argument_value=signatures,
        )
        signatures = [
            bytes.fromhex(signatures_element.decode("utf-8"))
            for signatures_element in signatures
        ]
        return (orders, maker_asset_fill_amount, signatures)

    def call(
        self,
        orders: List[Tuple0x260219a2],
        maker_asset_fill_amount: int,
        signatures: List[bytes],
        tx_params: Optional[TxParams] = None,
    ) -> Union[Tuple0xbb41e5b3, Union[HexBytes, bytes]]:
        """Execute underlying contract method via eth_call.

        Synchronously executes multiple calls of fillOrder until total amount
        of makerAsset is bought by taker.

        :param makerAssetFillAmount: Desired amount of makerAsset to buy.
        :param orders: Array of order specifications.
        :param signatures: Proofs that orders have been signed by makers.
        :param tx_params: transaction parameters
        :returns: the return value of the underlying method.
        """
        (
            orders,
            maker_asset_fill_amount,
            signatures,
        ) = self.validate_and_normalize_inputs(
            orders, maker_asset_fill_amount, signatures
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(
            orders, maker_asset_fill_amount, signatures
        ).call(tx_params.as_dict())

    def send_transaction(
        self,
        orders: List[Tuple0x260219a2],
        maker_asset_fill_amount: int,
        signatures: List[bytes],
        tx_params: Optional[TxParams] = None,
    ) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        Synchronously executes multiple calls of fillOrder until total amount
        of makerAsset is bought by taker.

        :param makerAssetFillAmount: Desired amount of makerAsset to buy.
        :param orders: Array of order specifications.
        :param signatures: Proofs that orders have been signed by makers.
        :param tx_params: transaction parameters
        """
        (
            orders,
            maker_asset_fill_amount,
            signatures,
        ) = self.validate_and_normalize_inputs(
            orders, maker_asset_fill_amount, signatures
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(
            orders, maker_asset_fill_amount, signatures
        ).transact(tx_params.as_dict())

    def estimate_gas(
        self,
        orders: List[Tuple0x260219a2],
        maker_asset_fill_amount: int,
        signatures: List[bytes],
        tx_params: Optional[TxParams] = None,
    ) -> int:
        """Estimate gas consumption of method call."""
        (
            orders,
            maker_asset_fill_amount,
            signatures,
        ) = self.validate_and_normalize_inputs(
            orders, maker_asset_fill_amount, signatures
        )
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(
            orders, maker_asset_fill_amount, signatures
        ).estimateGas(tx_params.as_dict())


class CurrentContextAddressMethod(ContractMethod):
    """Various interfaces to the currentContextAddress method."""

    def __init__(
        self,
        provider: BaseProvider,
        contract_address: str,
        contract_function: ContractFunction,
        validator: Validator = None,
    ):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def call(self, tx_params: Optional[TxParams] = None) -> str:
        """Execute underlying contract method via eth_call.

        :param tx_params: transaction parameters

        """
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method().call(tx_params.as_dict())

    def send_transaction(
        self, tx_params: Optional[TxParams] = None
    ) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        :param tx_params: transaction parameters

        """
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method().transact(tx_params.as_dict())

    def estimate_gas(self, tx_params: Optional[TxParams] = None) -> int:
        """Estimate gas consumption of method call."""
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method().estimateGas(tx_params.as_dict())


class TransferOwnershipMethod(ContractMethod):
    """Various interfaces to the transferOwnership method."""

    def __init__(
        self,
        provider: BaseProvider,
        contract_address: str,
        contract_function: ContractFunction,
        validator: Validator = None,
    ):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def validate_and_normalize_inputs(self, new_owner: str):
        """Validate the inputs to the transferOwnership method."""
        self.validator.assert_valid(
            method_name="transferOwnership",
            parameter_name="newOwner",
            argument_value=new_owner,
        )
        new_owner = self.validate_and_checksum_address(new_owner)
        return new_owner

    def call(
        self, new_owner: str, tx_params: Optional[TxParams] = None
    ) -> Union[None, Union[HexBytes, bytes]]:
        """Execute underlying contract method via eth_call.

        :param tx_params: transaction parameters
        :returns: the return value of the underlying method.
        """
        (new_owner) = self.validate_and_normalize_inputs(new_owner)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(new_owner).call(tx_params.as_dict())

    def send_transaction(
        self, new_owner: str, tx_params: Optional[TxParams] = None
    ) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        :param tx_params: transaction parameters
        """
        (new_owner) = self.validate_and_normalize_inputs(new_owner)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(new_owner).transact(tx_params.as_dict())

    def estimate_gas(
        self, new_owner: str, tx_params: Optional[TxParams] = None
    ) -> int:
        """Estimate gas consumption of method call."""
        (new_owner) = self.validate_and_normalize_inputs(new_owner)
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method(new_owner).estimateGas(
            tx_params.as_dict()
        )


class VersionMethod(ContractMethod):
    """Various interfaces to the VERSION method."""

    def __init__(
        self,
        provider: BaseProvider,
        contract_address: str,
        contract_function: ContractFunction,
        validator: Validator = None,
    ):
        """Persist instance data."""
        super().__init__(provider, contract_address, validator)
        self.underlying_method = contract_function

    def call(self, tx_params: Optional[TxParams] = None) -> str:
        """Execute underlying contract method via eth_call.

        :param tx_params: transaction parameters

        """
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method().call(tx_params.as_dict())

    def send_transaction(
        self, tx_params: Optional[TxParams] = None
    ) -> Union[HexBytes, bytes]:
        """Execute underlying contract method via eth_sendTransaction.

        :param tx_params: transaction parameters

        """
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method().transact(tx_params.as_dict())

    def estimate_gas(self, tx_params: Optional[TxParams] = None) -> int:
        """Estimate gas consumption of method call."""
        tx_params = super().normalize_tx_params(tx_params)
        return self.underlying_method().estimateGas(tx_params.as_dict())


# pylint: disable=too-many-public-methods,too-many-instance-attributes
class Exchange:
    """Wrapper class for Exchange Solidity contract.

    All method parameters of type `bytes`:code: should be encoded as UTF-8,
    which can be accomplished via `str.encode("utf_8")`:code:.
    """

    filled: FilledMethod
    batch_fill_orders: BatchFillOrdersMethod
    cancelled: CancelledMethod
    pre_sign: PreSignMethod
    match_orders: MatchOrdersMethod
    fill_order_no_throw: FillOrderNoThrowMethod
    asset_proxies: AssetProxiesMethod
    batch_cancel_orders: BatchCancelOrdersMethod
    batch_fill_or_kill_orders: BatchFillOrKillOrdersMethod
    cancel_orders_up_to: CancelOrdersUpToMethod
    batch_fill_orders_no_throw: BatchFillOrdersNoThrowMethod
    get_asset_proxy: GetAssetProxyMethod
    transactions: TransactionsMethod
    fill_or_kill_order: FillOrKillOrderMethod
    set_signature_validator_approval: SetSignatureValidatorApprovalMethod
    allowed_validators: AllowedValidatorsMethod
    market_sell_orders: MarketSellOrdersMethod
    get_orders_info: GetOrdersInfoMethod
    pre_signed: PreSignedMethod
    owner: OwnerMethod
    is_valid_signature: IsValidSignatureMethod
    market_buy_orders_no_throw: MarketBuyOrdersNoThrowMethod
    fill_order: FillOrderMethod
    execute_transaction: ExecuteTransactionMethod
    register_asset_proxy: RegisterAssetProxyMethod
    get_order_info: GetOrderInfoMethod
    cancel_order: CancelOrderMethod
    order_epoch: OrderEpochMethod
    zrx_asset_data: ZrxAssetDataMethod
    market_sell_orders_no_throw: MarketSellOrdersNoThrowMethod
    eip712_domain_hash: Eip712DomainHashMethod
    market_buy_orders: MarketBuyOrdersMethod
    current_context_address: CurrentContextAddressMethod
    transfer_ownership: TransferOwnershipMethod
    version: VersionMethod

    def __init__(
        self,
        provider: BaseProvider,
        contract_address: str,
        validator: ExchangeValidator = None,
    ):
        """Get an instance of wrapper for smart contract.

        :param provider: instance of :class:`web3.providers.base.BaseProvider`
        :param contract_address: where the contract has been deployed
        :param validator: for validation of method inputs.
        """
        self.contract_address = contract_address

        if not validator:
            validator = ExchangeValidator(provider, contract_address)

        self._web3_eth = Web3(  # type: ignore # pylint: disable=no-member
            provider
        ).eth

        functions = self._web3_eth.contract(
            address=to_checksum_address(contract_address), abi=Exchange.abi()
        ).functions

        self.filled = FilledMethod(
            provider, contract_address, functions.filled, validator
        )

        self.batch_fill_orders = BatchFillOrdersMethod(
            provider, contract_address, functions.batchFillOrders, validator
        )

        self.cancelled = CancelledMethod(
            provider, contract_address, functions.cancelled, validator
        )

        self.pre_sign = PreSignMethod(
            provider, contract_address, functions.preSign, validator
        )

        self.match_orders = MatchOrdersMethod(
            provider, contract_address, functions.matchOrders, validator
        )

        self.fill_order_no_throw = FillOrderNoThrowMethod(
            provider, contract_address, functions.fillOrderNoThrow, validator
        )

        self.asset_proxies = AssetProxiesMethod(
            provider, contract_address, functions.assetProxies, validator
        )

        self.batch_cancel_orders = BatchCancelOrdersMethod(
            provider, contract_address, functions.batchCancelOrders, validator
        )

        self.batch_fill_or_kill_orders = BatchFillOrKillOrdersMethod(
            provider,
            contract_address,
            functions.batchFillOrKillOrders,
            validator,
        )

        self.cancel_orders_up_to = CancelOrdersUpToMethod(
            provider, contract_address, functions.cancelOrdersUpTo, validator
        )

        self.batch_fill_orders_no_throw = BatchFillOrdersNoThrowMethod(
            provider,
            contract_address,
            functions.batchFillOrdersNoThrow,
            validator,
        )

        self.get_asset_proxy = GetAssetProxyMethod(
            provider, contract_address, functions.getAssetProxy, validator
        )

        self.transactions = TransactionsMethod(
            provider, contract_address, functions.transactions, validator
        )

        self.fill_or_kill_order = FillOrKillOrderMethod(
            provider, contract_address, functions.fillOrKillOrder, validator
        )

        self.set_signature_validator_approval = SetSignatureValidatorApprovalMethod(
            provider,
            contract_address,
            functions.setSignatureValidatorApproval,
            validator,
        )

        self.allowed_validators = AllowedValidatorsMethod(
            provider, contract_address, functions.allowedValidators, validator
        )

        self.market_sell_orders = MarketSellOrdersMethod(
            provider, contract_address, functions.marketSellOrders, validator
        )

        self.get_orders_info = GetOrdersInfoMethod(
            provider, contract_address, functions.getOrdersInfo, validator
        )

        self.pre_signed = PreSignedMethod(
            provider, contract_address, functions.preSigned, validator
        )

        self.owner = OwnerMethod(
            provider, contract_address, functions.owner, validator
        )

        self.is_valid_signature = IsValidSignatureMethod(
            provider, contract_address, functions.isValidSignature, validator
        )

        self.market_buy_orders_no_throw = MarketBuyOrdersNoThrowMethod(
            provider,
            contract_address,
            functions.marketBuyOrdersNoThrow,
            validator,
        )

        self.fill_order = FillOrderMethod(
            provider, contract_address, functions.fillOrder, validator
        )

        self.execute_transaction = ExecuteTransactionMethod(
            provider, contract_address, functions.executeTransaction, validator
        )

        self.register_asset_proxy = RegisterAssetProxyMethod(
            provider, contract_address, functions.registerAssetProxy, validator
        )

        self.get_order_info = GetOrderInfoMethod(
            provider, contract_address, functions.getOrderInfo, validator
        )

        self.cancel_order = CancelOrderMethod(
            provider, contract_address, functions.cancelOrder, validator
        )

        self.order_epoch = OrderEpochMethod(
            provider, contract_address, functions.orderEpoch, validator
        )

        self.zrx_asset_data = ZrxAssetDataMethod(
            provider, contract_address, functions.ZRX_ASSET_DATA, validator
        )

        self.market_sell_orders_no_throw = MarketSellOrdersNoThrowMethod(
            provider,
            contract_address,
            functions.marketSellOrdersNoThrow,
            validator,
        )

        self.eip712_domain_hash = Eip712DomainHashMethod(
            provider, contract_address, functions.EIP712_DOMAIN_HASH, validator
        )

        self.market_buy_orders = MarketBuyOrdersMethod(
            provider, contract_address, functions.marketBuyOrders, validator
        )

        self.current_context_address = CurrentContextAddressMethod(
            provider,
            contract_address,
            functions.currentContextAddress,
            validator,
        )

        self.transfer_ownership = TransferOwnershipMethod(
            provider, contract_address, functions.transferOwnership, validator
        )

        self.version = VersionMethod(
            provider, contract_address, functions.VERSION, validator
        )

    def get_signature_validator_approval_event(
        self, tx_hash: Union[HexBytes, bytes]
    ) -> Tuple[AttributeDict]:
        """Get log entry for SignatureValidatorApproval event.

        :param tx_hash: hash of transaction emitting SignatureValidatorApproval
            event
        """
        tx_receipt = self._web3_eth.getTransactionReceipt(tx_hash)
        return (
            self._web3_eth.contract(
                address=to_checksum_address(self.contract_address),
                abi=Exchange.abi(),
            )
            .events.SignatureValidatorApproval()
            .processReceipt(tx_receipt)
        )

    def get_fill_event(
        self, tx_hash: Union[HexBytes, bytes]
    ) -> Tuple[AttributeDict]:
        """Get log entry for Fill event.

        :param tx_hash: hash of transaction emitting Fill event
        """
        tx_receipt = self._web3_eth.getTransactionReceipt(tx_hash)
        return (
            self._web3_eth.contract(
                address=to_checksum_address(self.contract_address),
                abi=Exchange.abi(),
            )
            .events.Fill()
            .processReceipt(tx_receipt)
        )

    def get_cancel_event(
        self, tx_hash: Union[HexBytes, bytes]
    ) -> Tuple[AttributeDict]:
        """Get log entry for Cancel event.

        :param tx_hash: hash of transaction emitting Cancel event
        """
        tx_receipt = self._web3_eth.getTransactionReceipt(tx_hash)
        return (
            self._web3_eth.contract(
                address=to_checksum_address(self.contract_address),
                abi=Exchange.abi(),
            )
            .events.Cancel()
            .processReceipt(tx_receipt)
        )

    def get_cancel_up_to_event(
        self, tx_hash: Union[HexBytes, bytes]
    ) -> Tuple[AttributeDict]:
        """Get log entry for CancelUpTo event.

        :param tx_hash: hash of transaction emitting CancelUpTo event
        """
        tx_receipt = self._web3_eth.getTransactionReceipt(tx_hash)
        return (
            self._web3_eth.contract(
                address=to_checksum_address(self.contract_address),
                abi=Exchange.abi(),
            )
            .events.CancelUpTo()
            .processReceipt(tx_receipt)
        )

    def get_asset_proxy_registered_event(
        self, tx_hash: Union[HexBytes, bytes]
    ) -> Tuple[AttributeDict]:
        """Get log entry for AssetProxyRegistered event.

        :param tx_hash: hash of transaction emitting AssetProxyRegistered event
        """
        tx_receipt = self._web3_eth.getTransactionReceipt(tx_hash)
        return (
            self._web3_eth.contract(
                address=to_checksum_address(self.contract_address),
                abi=Exchange.abi(),
            )
            .events.AssetProxyRegistered()
            .processReceipt(tx_receipt)
        )

    @staticmethod
    def abi():
        """Return the ABI to the underlying contract."""
        return json.loads(
            '[{"constant":true,"inputs":[{"name":"index_0","type":"bytes32"}],"name":"filled","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"components":[{"name":"makerAddress","type":"address"},{"name":"takerAddress","type":"address"},{"name":"feeRecipientAddress","type":"address"},{"name":"senderAddress","type":"address"},{"name":"makerAssetAmount","type":"uint256"},{"name":"takerAssetAmount","type":"uint256"},{"name":"makerFee","type":"uint256"},{"name":"takerFee","type":"uint256"},{"name":"expirationTimeSeconds","type":"uint256"},{"name":"salt","type":"uint256"},{"name":"makerAssetData","type":"bytes"},{"name":"takerAssetData","type":"bytes"}],"name":"orders","type":"tuple[]"},{"name":"takerAssetFillAmounts","type":"uint256[]"},{"name":"signatures","type":"bytes[]"}],"name":"batchFillOrders","outputs":[{"components":[{"name":"makerAssetFilledAmount","type":"uint256"},{"name":"takerAssetFilledAmount","type":"uint256"},{"name":"makerFeePaid","type":"uint256"},{"name":"takerFeePaid","type":"uint256"}],"name":"totalFillResults","type":"tuple"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"index_0","type":"bytes32"}],"name":"cancelled","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"hash","type":"bytes32"},{"name":"signerAddress","type":"address"},{"name":"signature","type":"bytes"}],"name":"preSign","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"components":[{"name":"makerAddress","type":"address"},{"name":"takerAddress","type":"address"},{"name":"feeRecipientAddress","type":"address"},{"name":"senderAddress","type":"address"},{"name":"makerAssetAmount","type":"uint256"},{"name":"takerAssetAmount","type":"uint256"},{"name":"makerFee","type":"uint256"},{"name":"takerFee","type":"uint256"},{"name":"expirationTimeSeconds","type":"uint256"},{"name":"salt","type":"uint256"},{"name":"makerAssetData","type":"bytes"},{"name":"takerAssetData","type":"bytes"}],"name":"leftOrder","type":"tuple"},{"components":[{"name":"makerAddress","type":"address"},{"name":"takerAddress","type":"address"},{"name":"feeRecipientAddress","type":"address"},{"name":"senderAddress","type":"address"},{"name":"makerAssetAmount","type":"uint256"},{"name":"takerAssetAmount","type":"uint256"},{"name":"makerFee","type":"uint256"},{"name":"takerFee","type":"uint256"},{"name":"expirationTimeSeconds","type":"uint256"},{"name":"salt","type":"uint256"},{"name":"makerAssetData","type":"bytes"},{"name":"takerAssetData","type":"bytes"}],"name":"rightOrder","type":"tuple"},{"name":"leftSignature","type":"bytes"},{"name":"rightSignature","type":"bytes"}],"name":"matchOrders","outputs":[{"components":[{"components":[{"name":"makerAssetFilledAmount","type":"uint256"},{"name":"takerAssetFilledAmount","type":"uint256"},{"name":"makerFeePaid","type":"uint256"},{"name":"takerFeePaid","type":"uint256"}],"name":"left","type":"tuple"},{"components":[{"name":"makerAssetFilledAmount","type":"uint256"},{"name":"takerAssetFilledAmount","type":"uint256"},{"name":"makerFeePaid","type":"uint256"},{"name":"takerFeePaid","type":"uint256"}],"name":"right","type":"tuple"},{"name":"leftMakerAssetSpreadAmount","type":"uint256"}],"name":"matchedFillResults","type":"tuple"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"components":[{"name":"makerAddress","type":"address"},{"name":"takerAddress","type":"address"},{"name":"feeRecipientAddress","type":"address"},{"name":"senderAddress","type":"address"},{"name":"makerAssetAmount","type":"uint256"},{"name":"takerAssetAmount","type":"uint256"},{"name":"makerFee","type":"uint256"},{"name":"takerFee","type":"uint256"},{"name":"expirationTimeSeconds","type":"uint256"},{"name":"salt","type":"uint256"},{"name":"makerAssetData","type":"bytes"},{"name":"takerAssetData","type":"bytes"}],"name":"order","type":"tuple"},{"name":"takerAssetFillAmount","type":"uint256"},{"name":"signature","type":"bytes"}],"name":"fillOrderNoThrow","outputs":[{"components":[{"name":"makerAssetFilledAmount","type":"uint256"},{"name":"takerAssetFilledAmount","type":"uint256"},{"name":"makerFeePaid","type":"uint256"},{"name":"takerFeePaid","type":"uint256"}],"name":"fillResults","type":"tuple"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"index_0","type":"bytes4"}],"name":"assetProxies","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"components":[{"name":"makerAddress","type":"address"},{"name":"takerAddress","type":"address"},{"name":"feeRecipientAddress","type":"address"},{"name":"senderAddress","type":"address"},{"name":"makerAssetAmount","type":"uint256"},{"name":"takerAssetAmount","type":"uint256"},{"name":"makerFee","type":"uint256"},{"name":"takerFee","type":"uint256"},{"name":"expirationTimeSeconds","type":"uint256"},{"name":"salt","type":"uint256"},{"name":"makerAssetData","type":"bytes"},{"name":"takerAssetData","type":"bytes"}],"name":"orders","type":"tuple[]"}],"name":"batchCancelOrders","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"components":[{"name":"makerAddress","type":"address"},{"name":"takerAddress","type":"address"},{"name":"feeRecipientAddress","type":"address"},{"name":"senderAddress","type":"address"},{"name":"makerAssetAmount","type":"uint256"},{"name":"takerAssetAmount","type":"uint256"},{"name":"makerFee","type":"uint256"},{"name":"takerFee","type":"uint256"},{"name":"expirationTimeSeconds","type":"uint256"},{"name":"salt","type":"uint256"},{"name":"makerAssetData","type":"bytes"},{"name":"takerAssetData","type":"bytes"}],"name":"orders","type":"tuple[]"},{"name":"takerAssetFillAmounts","type":"uint256[]"},{"name":"signatures","type":"bytes[]"}],"name":"batchFillOrKillOrders","outputs":[{"components":[{"name":"makerAssetFilledAmount","type":"uint256"},{"name":"takerAssetFilledAmount","type":"uint256"},{"name":"makerFeePaid","type":"uint256"},{"name":"takerFeePaid","type":"uint256"}],"name":"totalFillResults","type":"tuple"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"targetOrderEpoch","type":"uint256"}],"name":"cancelOrdersUpTo","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"components":[{"name":"makerAddress","type":"address"},{"name":"takerAddress","type":"address"},{"name":"feeRecipientAddress","type":"address"},{"name":"senderAddress","type":"address"},{"name":"makerAssetAmount","type":"uint256"},{"name":"takerAssetAmount","type":"uint256"},{"name":"makerFee","type":"uint256"},{"name":"takerFee","type":"uint256"},{"name":"expirationTimeSeconds","type":"uint256"},{"name":"salt","type":"uint256"},{"name":"makerAssetData","type":"bytes"},{"name":"takerAssetData","type":"bytes"}],"name":"orders","type":"tuple[]"},{"name":"takerAssetFillAmounts","type":"uint256[]"},{"name":"signatures","type":"bytes[]"}],"name":"batchFillOrdersNoThrow","outputs":[{"components":[{"name":"makerAssetFilledAmount","type":"uint256"},{"name":"takerAssetFilledAmount","type":"uint256"},{"name":"makerFeePaid","type":"uint256"},{"name":"takerFeePaid","type":"uint256"}],"name":"totalFillResults","type":"tuple"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"assetProxyId","type":"bytes4"}],"name":"getAssetProxy","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"index_0","type":"bytes32"}],"name":"transactions","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"components":[{"name":"makerAddress","type":"address"},{"name":"takerAddress","type":"address"},{"name":"feeRecipientAddress","type":"address"},{"name":"senderAddress","type":"address"},{"name":"makerAssetAmount","type":"uint256"},{"name":"takerAssetAmount","type":"uint256"},{"name":"makerFee","type":"uint256"},{"name":"takerFee","type":"uint256"},{"name":"expirationTimeSeconds","type":"uint256"},{"name":"salt","type":"uint256"},{"name":"makerAssetData","type":"bytes"},{"name":"takerAssetData","type":"bytes"}],"name":"order","type":"tuple"},{"name":"takerAssetFillAmount","type":"uint256"},{"name":"signature","type":"bytes"}],"name":"fillOrKillOrder","outputs":[{"components":[{"name":"makerAssetFilledAmount","type":"uint256"},{"name":"takerAssetFilledAmount","type":"uint256"},{"name":"makerFeePaid","type":"uint256"},{"name":"takerFeePaid","type":"uint256"}],"name":"fillResults","type":"tuple"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"validatorAddress","type":"address"},{"name":"approval","type":"bool"}],"name":"setSignatureValidatorApproval","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"index_0","type":"address"},{"name":"index_1","type":"address"}],"name":"allowedValidators","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"components":[{"name":"makerAddress","type":"address"},{"name":"takerAddress","type":"address"},{"name":"feeRecipientAddress","type":"address"},{"name":"senderAddress","type":"address"},{"name":"makerAssetAmount","type":"uint256"},{"name":"takerAssetAmount","type":"uint256"},{"name":"makerFee","type":"uint256"},{"name":"takerFee","type":"uint256"},{"name":"expirationTimeSeconds","type":"uint256"},{"name":"salt","type":"uint256"},{"name":"makerAssetData","type":"bytes"},{"name":"takerAssetData","type":"bytes"}],"name":"orders","type":"tuple[]"},{"name":"takerAssetFillAmount","type":"uint256"},{"name":"signatures","type":"bytes[]"}],"name":"marketSellOrders","outputs":[{"components":[{"name":"makerAssetFilledAmount","type":"uint256"},{"name":"takerAssetFilledAmount","type":"uint256"},{"name":"makerFeePaid","type":"uint256"},{"name":"takerFeePaid","type":"uint256"}],"name":"totalFillResults","type":"tuple"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"components":[{"name":"makerAddress","type":"address"},{"name":"takerAddress","type":"address"},{"name":"feeRecipientAddress","type":"address"},{"name":"senderAddress","type":"address"},{"name":"makerAssetAmount","type":"uint256"},{"name":"takerAssetAmount","type":"uint256"},{"name":"makerFee","type":"uint256"},{"name":"takerFee","type":"uint256"},{"name":"expirationTimeSeconds","type":"uint256"},{"name":"salt","type":"uint256"},{"name":"makerAssetData","type":"bytes"},{"name":"takerAssetData","type":"bytes"}],"name":"orders","type":"tuple[]"}],"name":"getOrdersInfo","outputs":[{"components":[{"name":"orderStatus","type":"uint8"},{"name":"orderHash","type":"bytes32"},{"name":"orderTakerAssetFilledAmount","type":"uint256"}],"name":"","type":"tuple[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"index_0","type":"bytes32"},{"name":"index_1","type":"address"}],"name":"preSigned","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"hash","type":"bytes32"},{"name":"signerAddress","type":"address"},{"name":"signature","type":"bytes"}],"name":"isValidSignature","outputs":[{"name":"isValid","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"components":[{"name":"makerAddress","type":"address"},{"name":"takerAddress","type":"address"},{"name":"feeRecipientAddress","type":"address"},{"name":"senderAddress","type":"address"},{"name":"makerAssetAmount","type":"uint256"},{"name":"takerAssetAmount","type":"uint256"},{"name":"makerFee","type":"uint256"},{"name":"takerFee","type":"uint256"},{"name":"expirationTimeSeconds","type":"uint256"},{"name":"salt","type":"uint256"},{"name":"makerAssetData","type":"bytes"},{"name":"takerAssetData","type":"bytes"}],"name":"orders","type":"tuple[]"},{"name":"makerAssetFillAmount","type":"uint256"},{"name":"signatures","type":"bytes[]"}],"name":"marketBuyOrdersNoThrow","outputs":[{"components":[{"name":"makerAssetFilledAmount","type":"uint256"},{"name":"takerAssetFilledAmount","type":"uint256"},{"name":"makerFeePaid","type":"uint256"},{"name":"takerFeePaid","type":"uint256"}],"name":"totalFillResults","type":"tuple"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"components":[{"name":"makerAddress","type":"address"},{"name":"takerAddress","type":"address"},{"name":"feeRecipientAddress","type":"address"},{"name":"senderAddress","type":"address"},{"name":"makerAssetAmount","type":"uint256"},{"name":"takerAssetAmount","type":"uint256"},{"name":"makerFee","type":"uint256"},{"name":"takerFee","type":"uint256"},{"name":"expirationTimeSeconds","type":"uint256"},{"name":"salt","type":"uint256"},{"name":"makerAssetData","type":"bytes"},{"name":"takerAssetData","type":"bytes"}],"name":"order","type":"tuple"},{"name":"takerAssetFillAmount","type":"uint256"},{"name":"signature","type":"bytes"}],"name":"fillOrder","outputs":[{"components":[{"name":"makerAssetFilledAmount","type":"uint256"},{"name":"takerAssetFilledAmount","type":"uint256"},{"name":"makerFeePaid","type":"uint256"},{"name":"takerFeePaid","type":"uint256"}],"name":"fillResults","type":"tuple"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"salt","type":"uint256"},{"name":"signerAddress","type":"address"},{"name":"data","type":"bytes"},{"name":"signature","type":"bytes"}],"name":"executeTransaction","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"assetProxy","type":"address"}],"name":"registerAssetProxy","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"components":[{"name":"makerAddress","type":"address"},{"name":"takerAddress","type":"address"},{"name":"feeRecipientAddress","type":"address"},{"name":"senderAddress","type":"address"},{"name":"makerAssetAmount","type":"uint256"},{"name":"takerAssetAmount","type":"uint256"},{"name":"makerFee","type":"uint256"},{"name":"takerFee","type":"uint256"},{"name":"expirationTimeSeconds","type":"uint256"},{"name":"salt","type":"uint256"},{"name":"makerAssetData","type":"bytes"},{"name":"takerAssetData","type":"bytes"}],"name":"order","type":"tuple"}],"name":"getOrderInfo","outputs":[{"components":[{"name":"orderStatus","type":"uint8"},{"name":"orderHash","type":"bytes32"},{"name":"orderTakerAssetFilledAmount","type":"uint256"}],"name":"orderInfo","type":"tuple"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"components":[{"name":"makerAddress","type":"address"},{"name":"takerAddress","type":"address"},{"name":"feeRecipientAddress","type":"address"},{"name":"senderAddress","type":"address"},{"name":"makerAssetAmount","type":"uint256"},{"name":"takerAssetAmount","type":"uint256"},{"name":"makerFee","type":"uint256"},{"name":"takerFee","type":"uint256"},{"name":"expirationTimeSeconds","type":"uint256"},{"name":"salt","type":"uint256"},{"name":"makerAssetData","type":"bytes"},{"name":"takerAssetData","type":"bytes"}],"name":"order","type":"tuple"}],"name":"cancelOrder","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"index_0","type":"address"},{"name":"index_1","type":"address"}],"name":"orderEpoch","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"ZRX_ASSET_DATA","outputs":[{"name":"","type":"bytes"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"components":[{"name":"makerAddress","type":"address"},{"name":"takerAddress","type":"address"},{"name":"feeRecipientAddress","type":"address"},{"name":"senderAddress","type":"address"},{"name":"makerAssetAmount","type":"uint256"},{"name":"takerAssetAmount","type":"uint256"},{"name":"makerFee","type":"uint256"},{"name":"takerFee","type":"uint256"},{"name":"expirationTimeSeconds","type":"uint256"},{"name":"salt","type":"uint256"},{"name":"makerAssetData","type":"bytes"},{"name":"takerAssetData","type":"bytes"}],"name":"orders","type":"tuple[]"},{"name":"takerAssetFillAmount","type":"uint256"},{"name":"signatures","type":"bytes[]"}],"name":"marketSellOrdersNoThrow","outputs":[{"components":[{"name":"makerAssetFilledAmount","type":"uint256"},{"name":"takerAssetFilledAmount","type":"uint256"},{"name":"makerFeePaid","type":"uint256"},{"name":"takerFeePaid","type":"uint256"}],"name":"totalFillResults","type":"tuple"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"EIP712_DOMAIN_HASH","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"components":[{"name":"makerAddress","type":"address"},{"name":"takerAddress","type":"address"},{"name":"feeRecipientAddress","type":"address"},{"name":"senderAddress","type":"address"},{"name":"makerAssetAmount","type":"uint256"},{"name":"takerAssetAmount","type":"uint256"},{"name":"makerFee","type":"uint256"},{"name":"takerFee","type":"uint256"},{"name":"expirationTimeSeconds","type":"uint256"},{"name":"salt","type":"uint256"},{"name":"makerAssetData","type":"bytes"},{"name":"takerAssetData","type":"bytes"}],"name":"orders","type":"tuple[]"},{"name":"makerAssetFillAmount","type":"uint256"},{"name":"signatures","type":"bytes[]"}],"name":"marketBuyOrders","outputs":[{"components":[{"name":"makerAssetFilledAmount","type":"uint256"},{"name":"takerAssetFilledAmount","type":"uint256"},{"name":"makerFeePaid","type":"uint256"},{"name":"takerFeePaid","type":"uint256"}],"name":"totalFillResults","type":"tuple"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"currentContextAddress","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"VERSION","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[{"name":"_zrxAssetData","type":"bytes"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"signerAddress","type":"address"},{"indexed":true,"name":"validatorAddress","type":"address"},{"indexed":false,"name":"approved","type":"bool"}],"name":"SignatureValidatorApproval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"makerAddress","type":"address"},{"indexed":true,"name":"feeRecipientAddress","type":"address"},{"indexed":false,"name":"takerAddress","type":"address"},{"indexed":false,"name":"senderAddress","type":"address"},{"indexed":false,"name":"makerAssetFilledAmount","type":"uint256"},{"indexed":false,"name":"takerAssetFilledAmount","type":"uint256"},{"indexed":false,"name":"makerFeePaid","type":"uint256"},{"indexed":false,"name":"takerFeePaid","type":"uint256"},{"indexed":true,"name":"orderHash","type":"bytes32"},{"indexed":false,"name":"makerAssetData","type":"bytes"},{"indexed":false,"name":"takerAssetData","type":"bytes"}],"name":"Fill","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"makerAddress","type":"address"},{"indexed":true,"name":"feeRecipientAddress","type":"address"},{"indexed":false,"name":"senderAddress","type":"address"},{"indexed":true,"name":"orderHash","type":"bytes32"},{"indexed":false,"name":"makerAssetData","type":"bytes"},{"indexed":false,"name":"takerAssetData","type":"bytes"}],"name":"Cancel","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"makerAddress","type":"address"},{"indexed":true,"name":"senderAddress","type":"address"},{"indexed":false,"name":"orderEpoch","type":"uint256"}],"name":"CancelUpTo","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"id","type":"bytes4"},{"indexed":false,"name":"assetProxy","type":"address"}],"name":"AssetProxyRegistered","type":"event"}]'  # noqa: E501 (line-too-long)
        )


# pylint: disable=too-many-lines
