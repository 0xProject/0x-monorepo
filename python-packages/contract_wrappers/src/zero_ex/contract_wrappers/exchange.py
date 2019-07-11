"""Generated wrapper for Exchange Solidity contract."""

# pylint: disable=too-many-arguments

import json
from typing import (  # pylint: disable=unused-import
    List,
    Optional,
    Tuple,
    Union,
)

from mypy_extensions import TypedDict  # pylint: disable=unused-import
from hexbytes import HexBytes
from web3.datastructures import AttributeDict
from web3.providers.base import BaseProvider

from zero_ex.contract_wrappers._base_contract_wrapper import (
    BaseContractWrapper,
)
from zero_ex.contract_wrappers.tx_params import TxParams


class Tuple0xbb41e5b3(TypedDict):
    """Python representation of a tuple or struct.

    A tuple found in an ABI may have been written in Solidity as a literal
    tuple, or it may have been written as a parameter with a Solidity
    `struct`:code: data type; there's no way to tell which, based solely on the
    ABI, and the name of a Solidity `struct`:code: is not conveyed through the
    ABI.  This class represents a tuple that appeared in a method definition.
    Its name is derived from a hash of that tuple's field names, and every
    method whose ABI refers to a tuple with that same list of field names will
    have a generated wrapper method that refers to this class.
    """

    makerAssetFilledAmount: int

    takerAssetFilledAmount: int

    makerFeePaid: int

    takerFeePaid: int


class Tuple0x260219a2(TypedDict):
    """Python representation of a tuple or struct.

    A tuple found in an ABI may have been written in Solidity as a literal
    tuple, or it may have been written as a parameter with a Solidity
    `struct`:code: data type; there's no way to tell which, based solely on the
    ABI, and the name of a Solidity `struct`:code: is not conveyed through the
    ABI.  This class represents a tuple that appeared in a method definition.
    Its name is derived from a hash of that tuple's field names, and every
    method whose ABI refers to a tuple with that same list of field names will
    have a generated wrapper method that refers to this class.
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


class Tuple0x054ca44e(TypedDict):
    """Python representation of a tuple or struct.

    A tuple found in an ABI may have been written in Solidity as a literal
    tuple, or it may have been written as a parameter with a Solidity
    `struct`:code: data type; there's no way to tell which, based solely on the
    ABI, and the name of a Solidity `struct`:code: is not conveyed through the
    ABI.  This class represents a tuple that appeared in a method definition.
    Its name is derived from a hash of that tuple's field names, and every
    method whose ABI refers to a tuple with that same list of field names will
    have a generated wrapper method that refers to this class.
    """

    left: Tuple0xbb41e5b3

    right: Tuple0xbb41e5b3

    leftMakerAssetSpreadAmount: int


class Tuple0xb1e4a1ae(TypedDict):
    """Python representation of a tuple or struct.

    A tuple found in an ABI may have been written in Solidity as a literal
    tuple, or it may have been written as a parameter with a Solidity
    `struct`:code: data type; there's no way to tell which, based solely on the
    ABI, and the name of a Solidity `struct`:code: is not conveyed through the
    ABI.  This class represents a tuple that appeared in a method definition.
    Its name is derived from a hash of that tuple's field names, and every
    method whose ABI refers to a tuple with that same list of field names will
    have a generated wrapper method that refers to this class.
    """

    orderStatus: int

    orderHash: bytes

    orderTakerAssetFilledAmount: int


# pylint: disable=too-many-public-methods
class Exchange(BaseContractWrapper):
    """Wrapper class for Exchange Solidity contract."""

    def __init__(
        self,
        provider: BaseProvider,
        contract_address: str,
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

    def _get_contract_instance(self, token_address):
        """Get an instance of the smart contract at a specific address.

        :returns: contract object
        """
        return self._contract_instance(
            address=token_address, abi=Exchange.abi()
        )

    def filled(
        self, index_0: bytes, tx_params: Optional[TxParams] = None
    ) -> int:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters

        """
        func = self._get_contract_instance(
            self.contract_address
        ).functions.filled(index_0)
        return self._invoke_function_call(
            func=func, tx_params=tx_params, view_only=True
        )

    def batch_fill_orders(
        self,
        orders: List[Tuple0x260219a2],
        taker_asset_fill_amounts: List[int],
        signatures: List[bytes],
        tx_params: Optional[TxParams] = None,
        view_only: bool = False,
    ) -> Union[HexBytes, bytes]:
        """Execute underlying, same-named contract method.

        Synchronously executes multiple calls of fillOrder.

        :param orders: Array of order specifications.
        :param signatures: Proofs that orders have been created by makers.
        :param takerAssetFillAmounts: Array of desired amounts of takerAsset to
            sell in orders.
        :param tx_params: transaction parameters
        :param view_only: whether to use transact() or call()

        :returns: transaction hash
        """
        signatures = [
            bytes.fromhex(signatures_element.decode("utf-8"))
            for signatures_element in signatures
        ]
        func = self._get_contract_instance(
            self.contract_address
        ).functions.batchFillOrders(
            orders, taker_asset_fill_amounts, signatures
        )
        return self._invoke_function_call(
            func=func, tx_params=tx_params, view_only=view_only
        )

    def cancelled(
        self, index_0: bytes, tx_params: Optional[TxParams] = None
    ) -> bool:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters

        """
        func = self._get_contract_instance(
            self.contract_address
        ).functions.cancelled(index_0)
        return self._invoke_function_call(
            func=func, tx_params=tx_params, view_only=True
        )

    def pre_sign(
        self,
        _hash: bytes,
        signer_address: str,
        signature: bytes,
        tx_params: Optional[TxParams] = None,
        view_only: bool = False,
    ) -> None:
        """Execute underlying, same-named contract method.

        Approves a hash on-chain using any valid signature type.      After
        presigning a hash, the preSign signature type will become valid for
        that hash and signer.

        :param signature: Proof that the hash has been signed by signer.
        :param signerAddress: Address that should have signed the given hash.
        :param tx_params: transaction parameters
        :param view_only: whether to use transact() or call()

        :returns: transaction hash
        """
        signer_address = self._validate_and_checksum_address(signer_address)
        signature = bytes.fromhex(signature.decode("utf-8"))
        func = self._get_contract_instance(
            self.contract_address
        ).functions.preSign(_hash, signer_address, signature)
        return self._invoke_function_call(
            func=func, tx_params=tx_params, view_only=view_only
        )

    def match_orders(
        self,
        left_order: Tuple0x260219a2,
        right_order: Tuple0x260219a2,
        left_signature: bytes,
        right_signature: bytes,
        tx_params: Optional[TxParams] = None,
        view_only: bool = False,
    ) -> Union[HexBytes, bytes]:
        """Execute underlying, same-named contract method.

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
        :param view_only: whether to use transact() or call()

        :returns: transaction hash
        """
        left_signature = bytes.fromhex(left_signature.decode("utf-8"))
        right_signature = bytes.fromhex(right_signature.decode("utf-8"))
        func = self._get_contract_instance(
            self.contract_address
        ).functions.matchOrders(
            left_order, right_order, left_signature, right_signature
        )
        return self._invoke_function_call(
            func=func, tx_params=tx_params, view_only=view_only
        )

    def fill_order_no_throw(
        self,
        order: Tuple0x260219a2,
        taker_asset_fill_amount: int,
        signature: bytes,
        tx_params: Optional[TxParams] = None,
        view_only: bool = False,
    ) -> Union[HexBytes, bytes]:
        """Execute underlying, same-named contract method.

        Fills the input order.      Returns false if the transaction would
        otherwise revert.

        :param order: Order struct containing order specifications.
        :param signature: Proof that order has been created by maker.
        :param takerAssetFillAmount: Desired amount of takerAsset to sell.
        :param tx_params: transaction parameters
        :param view_only: whether to use transact() or call()

        :returns: transaction hash
        """
        # safeguard against fractional inputs
        taker_asset_fill_amount = int(taker_asset_fill_amount)
        signature = bytes.fromhex(signature.decode("utf-8"))
        func = self._get_contract_instance(
            self.contract_address
        ).functions.fillOrderNoThrow(order, taker_asset_fill_amount, signature)
        return self._invoke_function_call(
            func=func, tx_params=tx_params, view_only=view_only
        )

    def asset_proxies(
        self, index_0: bytes, tx_params: Optional[TxParams] = None
    ) -> str:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters

        """
        func = self._get_contract_instance(
            self.contract_address
        ).functions.assetProxies(index_0)
        return self._invoke_function_call(
            func=func, tx_params=tx_params, view_only=True
        )

    def batch_cancel_orders(
        self,
        orders: List[Tuple0x260219a2],
        tx_params: Optional[TxParams] = None,
        view_only: bool = False,
    ) -> None:
        """Execute underlying, same-named contract method.

        Synchronously cancels multiple orders in a single transaction.

        :param orders: Array of order specifications.
        :param tx_params: transaction parameters
        :param view_only: whether to use transact() or call()

        :returns: transaction hash
        """
        func = self._get_contract_instance(
            self.contract_address
        ).functions.batchCancelOrders(orders)
        return self._invoke_function_call(
            func=func, tx_params=tx_params, view_only=view_only
        )

    def batch_fill_or_kill_orders(
        self,
        orders: List[Tuple0x260219a2],
        taker_asset_fill_amounts: List[int],
        signatures: List[bytes],
        tx_params: Optional[TxParams] = None,
        view_only: bool = False,
    ) -> Union[HexBytes, bytes]:
        """Execute underlying, same-named contract method.

        Synchronously executes multiple calls of fillOrKill.

        :param orders: Array of order specifications.
        :param signatures: Proofs that orders have been created by makers.
        :param takerAssetFillAmounts: Array of desired amounts of takerAsset to
            sell in orders.
        :param tx_params: transaction parameters
        :param view_only: whether to use transact() or call()

        :returns: transaction hash
        """
        signatures = [
            bytes.fromhex(signatures_element.decode("utf-8"))
            for signatures_element in signatures
        ]
        func = self._get_contract_instance(
            self.contract_address
        ).functions.batchFillOrKillOrders(
            orders, taker_asset_fill_amounts, signatures
        )
        return self._invoke_function_call(
            func=func, tx_params=tx_params, view_only=view_only
        )

    def cancel_orders_up_to(
        self,
        target_order_epoch: int,
        tx_params: Optional[TxParams] = None,
        view_only: bool = False,
    ) -> None:
        """Execute underlying, same-named contract method.

        Cancels all orders created by makerAddress with a salt less than or
        equal to the targetOrderEpoch      and senderAddress equal to
        msg.sender (or null address if msg.sender == makerAddress).

        :param targetOrderEpoch: Orders created with a salt less or equal to
            this value will be cancelled.
        :param tx_params: transaction parameters
        :param view_only: whether to use transact() or call()

        :returns: transaction hash
        """
        # safeguard against fractional inputs
        target_order_epoch = int(target_order_epoch)
        func = self._get_contract_instance(
            self.contract_address
        ).functions.cancelOrdersUpTo(target_order_epoch)
        return self._invoke_function_call(
            func=func, tx_params=tx_params, view_only=view_only
        )

    def batch_fill_orders_no_throw(
        self,
        orders: List[Tuple0x260219a2],
        taker_asset_fill_amounts: List[int],
        signatures: List[bytes],
        tx_params: Optional[TxParams] = None,
        view_only: bool = False,
    ) -> Union[HexBytes, bytes]:
        """Execute underlying, same-named contract method.

        Fills an order with specified parameters and ECDSA signature.
        Returns false if the transaction would otherwise revert.

        :param orders: Array of order specifications.
        :param signatures: Proofs that orders have been created by makers.
        :param takerAssetFillAmounts: Array of desired amounts of takerAsset to
            sell in orders.
        :param tx_params: transaction parameters
        :param view_only: whether to use transact() or call()

        :returns: transaction hash
        """
        signatures = [
            bytes.fromhex(signatures_element.decode("utf-8"))
            for signatures_element in signatures
        ]
        func = self._get_contract_instance(
            self.contract_address
        ).functions.batchFillOrdersNoThrow(
            orders, taker_asset_fill_amounts, signatures
        )
        return self._invoke_function_call(
            func=func, tx_params=tx_params, view_only=view_only
        )

    def get_asset_proxy(
        self, asset_proxy_id: bytes, tx_params: Optional[TxParams] = None
    ) -> str:
        """Execute underlying, same-named contract method.

        Gets an asset proxy.

        :param assetProxyId: Id of the asset proxy.
        :param tx_params: transaction parameters
        :returns: The asset proxy registered to assetProxyId. Returns 0x0 if no
            proxy is registered.
        """
        func = self._get_contract_instance(
            self.contract_address
        ).functions.getAssetProxy(asset_proxy_id)
        return self._invoke_function_call(
            func=func, tx_params=tx_params, view_only=True
        )

    def transactions(
        self, index_0: bytes, tx_params: Optional[TxParams] = None
    ) -> bool:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters

        """
        func = self._get_contract_instance(
            self.contract_address
        ).functions.transactions(index_0)
        return self._invoke_function_call(
            func=func, tx_params=tx_params, view_only=True
        )

    def fill_or_kill_order(
        self,
        order: Tuple0x260219a2,
        taker_asset_fill_amount: int,
        signature: bytes,
        tx_params: Optional[TxParams] = None,
        view_only: bool = False,
    ) -> Union[HexBytes, bytes]:
        """Execute underlying, same-named contract method.

        Fills the input order. Reverts if exact takerAssetFillAmount not
        filled.

        :param order: Order struct containing order specifications.
        :param signature: Proof that order has been created by maker.
        :param takerAssetFillAmount: Desired amount of takerAsset to sell.
        :param tx_params: transaction parameters
        :param view_only: whether to use transact() or call()

        :returns: transaction hash
        """
        # safeguard against fractional inputs
        taker_asset_fill_amount = int(taker_asset_fill_amount)
        signature = bytes.fromhex(signature.decode("utf-8"))
        func = self._get_contract_instance(
            self.contract_address
        ).functions.fillOrKillOrder(order, taker_asset_fill_amount, signature)
        return self._invoke_function_call(
            func=func, tx_params=tx_params, view_only=view_only
        )

    def set_signature_validator_approval(
        self,
        validator_address: str,
        approval: bool,
        tx_params: Optional[TxParams] = None,
        view_only: bool = False,
    ) -> None:
        """Execute underlying, same-named contract method.

        Approves/unnapproves a Validator contract to verify signatures on
        signer's behalf.

        :param approval: Approval or disapproval of  Validator contract.
        :param validatorAddress: Address of Validator contract.
        :param tx_params: transaction parameters
        :param view_only: whether to use transact() or call()

        :returns: transaction hash
        """
        validator_address = self._validate_and_checksum_address(
            validator_address
        )
        func = self._get_contract_instance(
            self.contract_address
        ).functions.setSignatureValidatorApproval(validator_address, approval)
        return self._invoke_function_call(
            func=func, tx_params=tx_params, view_only=view_only
        )

    def allowed_validators(
        self, index_0: str, index_1: str, tx_params: Optional[TxParams] = None
    ) -> bool:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters

        """
        index_0 = self._validate_and_checksum_address(index_0)
        index_1 = self._validate_and_checksum_address(index_1)
        func = self._get_contract_instance(
            self.contract_address
        ).functions.allowedValidators(index_0, index_1)
        return self._invoke_function_call(
            func=func, tx_params=tx_params, view_only=True
        )

    def market_sell_orders(
        self,
        orders: List[Tuple0x260219a2],
        taker_asset_fill_amount: int,
        signatures: List[bytes],
        tx_params: Optional[TxParams] = None,
        view_only: bool = False,
    ) -> Union[HexBytes, bytes]:
        """Execute underlying, same-named contract method.

        Synchronously executes multiple calls of fillOrder until total amount
        of takerAsset is sold by taker.

        :param orders: Array of order specifications.
        :param signatures: Proofs that orders have been created by makers.
        :param takerAssetFillAmount: Desired amount of takerAsset to sell.
        :param tx_params: transaction parameters
        :param view_only: whether to use transact() or call()

        :returns: transaction hash
        """
        # safeguard against fractional inputs
        taker_asset_fill_amount = int(taker_asset_fill_amount)
        signatures = [
            bytes.fromhex(signatures_element.decode("utf-8"))
            for signatures_element in signatures
        ]
        func = self._get_contract_instance(
            self.contract_address
        ).functions.marketSellOrders(
            orders, taker_asset_fill_amount, signatures
        )
        return self._invoke_function_call(
            func=func, tx_params=tx_params, view_only=view_only
        )

    def get_orders_info(
        self,
        orders: List[Tuple0x260219a2],
        tx_params: Optional[TxParams] = None,
    ) -> List[Tuple0xb1e4a1ae]:
        """Execute underlying, same-named contract method.

        Fetches information for all passed in orders.

        :param orders: Array of order specifications.
        :param tx_params: transaction parameters
        :returns: Array of OrderInfo instances that correspond to each order.
        """
        func = self._get_contract_instance(
            self.contract_address
        ).functions.getOrdersInfo(orders)
        return self._invoke_function_call(
            func=func, tx_params=tx_params, view_only=True
        )

    def pre_signed(
        self,
        index_0: bytes,
        index_1: str,
        tx_params: Optional[TxParams] = None,
    ) -> bool:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters

        """
        index_1 = self._validate_and_checksum_address(index_1)
        func = self._get_contract_instance(
            self.contract_address
        ).functions.preSigned(index_0, index_1)
        return self._invoke_function_call(
            func=func, tx_params=tx_params, view_only=True
        )

    def owner(self, tx_params: Optional[TxParams] = None) -> str:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters

        """
        func = self._get_contract_instance(
            self.contract_address
        ).functions.owner()
        return self._invoke_function_call(
            func=func, tx_params=tx_params, view_only=True
        )

    def is_valid_signature(
        self,
        _hash: bytes,
        signer_address: str,
        signature: bytes,
        tx_params: Optional[TxParams] = None,
    ) -> bool:
        """Execute underlying, same-named contract method.

        Verifies that a hash has been signed by the given signer.

        :param hash: Any 32 byte hash.
        :param signature: Proof that the hash has been signed by signer.
        :param signerAddress: Address that should have signed the given hash.
        :param tx_params: transaction parameters
        :returns: True if the address recovered from the provided signature
            matches the input signer address.
        """
        signer_address = self._validate_and_checksum_address(signer_address)
        signature = bytes.fromhex(signature.decode("utf-8"))
        func = self._get_contract_instance(
            self.contract_address
        ).functions.isValidSignature(_hash, signer_address, signature)
        return self._invoke_function_call(
            func=func, tx_params=tx_params, view_only=True
        )

    def market_buy_orders_no_throw(
        self,
        orders: List[Tuple0x260219a2],
        maker_asset_fill_amount: int,
        signatures: List[bytes],
        tx_params: Optional[TxParams] = None,
        view_only: bool = False,
    ) -> Union[HexBytes, bytes]:
        """Execute underlying, same-named contract method.

        Synchronously executes multiple fill orders in a single transaction
        until total amount is bought by taker.      Returns false if the
        transaction would otherwise revert.

        :param makerAssetFillAmount: Desired amount of makerAsset to buy.
        :param orders: Array of order specifications.
        :param signatures: Proofs that orders have been signed by makers.
        :param tx_params: transaction parameters
        :param view_only: whether to use transact() or call()

        :returns: transaction hash
        """
        # safeguard against fractional inputs
        maker_asset_fill_amount = int(maker_asset_fill_amount)
        signatures = [
            bytes.fromhex(signatures_element.decode("utf-8"))
            for signatures_element in signatures
        ]
        func = self._get_contract_instance(
            self.contract_address
        ).functions.marketBuyOrdersNoThrow(
            orders, maker_asset_fill_amount, signatures
        )
        return self._invoke_function_call(
            func=func, tx_params=tx_params, view_only=view_only
        )

    def fill_order(
        self,
        order: Tuple0x260219a2,
        taker_asset_fill_amount: int,
        signature: bytes,
        tx_params: Optional[TxParams] = None,
        view_only: bool = False,
    ) -> Union[HexBytes, bytes]:
        """Execute underlying, same-named contract method.

        Fills the input order.

        :param order: Order struct containing order specifications.
        :param signature: Proof that order has been created by maker.
        :param takerAssetFillAmount: Desired amount of takerAsset to sell.
        :param tx_params: transaction parameters
        :param view_only: whether to use transact() or call()

        :returns: transaction hash
        """
        # safeguard against fractional inputs
        taker_asset_fill_amount = int(taker_asset_fill_amount)
        signature = bytes.fromhex(signature.decode("utf-8"))
        func = self._get_contract_instance(
            self.contract_address
        ).functions.fillOrder(order, taker_asset_fill_amount, signature)
        return self._invoke_function_call(
            func=func, tx_params=tx_params, view_only=view_only
        )

    def execute_transaction(
        self,
        salt: int,
        signer_address: str,
        data: bytes,
        signature: bytes,
        tx_params: Optional[TxParams] = None,
        view_only: bool = False,
    ) -> None:
        """Execute underlying, same-named contract method.

        Executes an exchange method call in the context of signer.

        :param data: AbiV2 encoded calldata.
        :param salt: Arbitrary number to ensure uniqueness of transaction hash.
        :param signature: Proof of signer transaction by signer.
        :param signerAddress: Address of transaction signer.
        :param tx_params: transaction parameters
        :param view_only: whether to use transact() or call()

        :returns: transaction hash
        """
        # safeguard against fractional inputs
        salt = int(salt)
        signer_address = self._validate_and_checksum_address(signer_address)
        data = bytes.fromhex(data.decode("utf-8"))
        signature = bytes.fromhex(signature.decode("utf-8"))
        func = self._get_contract_instance(
            self.contract_address
        ).functions.executeTransaction(salt, signer_address, data, signature)
        return self._invoke_function_call(
            func=func, tx_params=tx_params, view_only=view_only
        )

    def register_asset_proxy(
        self,
        asset_proxy: str,
        tx_params: Optional[TxParams] = None,
        view_only: bool = False,
    ) -> None:
        """Execute underlying, same-named contract method.

        Registers an asset proxy to its asset proxy id.      Once an asset
        proxy is registered, it cannot be unregistered.

        :param assetProxy: Address of new asset proxy to register.
        :param tx_params: transaction parameters
        :param view_only: whether to use transact() or call()

        :returns: transaction hash
        """
        asset_proxy = self._validate_and_checksum_address(asset_proxy)
        func = self._get_contract_instance(
            self.contract_address
        ).functions.registerAssetProxy(asset_proxy)
        return self._invoke_function_call(
            func=func, tx_params=tx_params, view_only=view_only
        )

    def get_order_info(
        self, order: Tuple0x260219a2, tx_params: Optional[TxParams] = None
    ) -> Tuple0xb1e4a1ae:
        """Execute underlying, same-named contract method.

        Gets information about an order: status, hash, and amount filled.

        :param order: Order to gather information on.
        :param tx_params: transaction parameters
        :returns: OrderInfo Information about the order and its state.
            See LibOrder.OrderInfo for a complete description.
        """
        func = self._get_contract_instance(
            self.contract_address
        ).functions.getOrderInfo(order)
        return self._invoke_function_call(
            func=func, tx_params=tx_params, view_only=True
        )

    def cancel_order(
        self,
        order: Tuple0x260219a2,
        tx_params: Optional[TxParams] = None,
        view_only: bool = False,
    ) -> None:
        """Execute underlying, same-named contract method.

        After calling, the order can not be filled anymore.      Throws if
        order is invalid or sender does not have permission to cancel.

        :param order: Order to cancel. Order must be OrderStatus.FILLABLE.
        :param tx_params: transaction parameters
        :param view_only: whether to use transact() or call()

        :returns: transaction hash
        """
        func = self._get_contract_instance(
            self.contract_address
        ).functions.cancelOrder(order)
        return self._invoke_function_call(
            func=func, tx_params=tx_params, view_only=view_only
        )

    def order_epoch(
        self, index_0: str, index_1: str, tx_params: Optional[TxParams] = None
    ) -> int:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters

        """
        index_0 = self._validate_and_checksum_address(index_0)
        index_1 = self._validate_and_checksum_address(index_1)
        func = self._get_contract_instance(
            self.contract_address
        ).functions.orderEpoch(index_0, index_1)
        return self._invoke_function_call(
            func=func, tx_params=tx_params, view_only=True
        )

    def zrx_asset_data(self, tx_params: Optional[TxParams] = None) -> bytes:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters

        """
        func = self._get_contract_instance(
            self.contract_address
        ).functions.ZRX_ASSET_DATA()
        return self._invoke_function_call(
            func=func, tx_params=tx_params, view_only=True
        )

    def market_sell_orders_no_throw(
        self,
        orders: List[Tuple0x260219a2],
        taker_asset_fill_amount: int,
        signatures: List[bytes],
        tx_params: Optional[TxParams] = None,
        view_only: bool = False,
    ) -> Union[HexBytes, bytes]:
        """Execute underlying, same-named contract method.

        Synchronously executes multiple calls of fillOrder until total amount
        of takerAsset is sold by taker.      Returns false if the transaction
        would otherwise revert.

        :param orders: Array of order specifications.
        :param signatures: Proofs that orders have been signed by makers.
        :param takerAssetFillAmount: Desired amount of takerAsset to sell.
        :param tx_params: transaction parameters
        :param view_only: whether to use transact() or call()

        :returns: transaction hash
        """
        # safeguard against fractional inputs
        taker_asset_fill_amount = int(taker_asset_fill_amount)
        signatures = [
            bytes.fromhex(signatures_element.decode("utf-8"))
            for signatures_element in signatures
        ]
        func = self._get_contract_instance(
            self.contract_address
        ).functions.marketSellOrdersNoThrow(
            orders, taker_asset_fill_amount, signatures
        )
        return self._invoke_function_call(
            func=func, tx_params=tx_params, view_only=view_only
        )

    def eip712_domain_hash(
        self, tx_params: Optional[TxParams] = None
    ) -> bytes:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters

        """
        func = self._get_contract_instance(
            self.contract_address
        ).functions.EIP712_DOMAIN_HASH()
        return self._invoke_function_call(
            func=func, tx_params=tx_params, view_only=True
        )

    def market_buy_orders(
        self,
        orders: List[Tuple0x260219a2],
        maker_asset_fill_amount: int,
        signatures: List[bytes],
        tx_params: Optional[TxParams] = None,
        view_only: bool = False,
    ) -> Union[HexBytes, bytes]:
        """Execute underlying, same-named contract method.

        Synchronously executes multiple calls of fillOrder until total amount
        of makerAsset is bought by taker.

        :param makerAssetFillAmount: Desired amount of makerAsset to buy.
        :param orders: Array of order specifications.
        :param signatures: Proofs that orders have been signed by makers.
        :param tx_params: transaction parameters
        :param view_only: whether to use transact() or call()

        :returns: transaction hash
        """
        # safeguard against fractional inputs
        maker_asset_fill_amount = int(maker_asset_fill_amount)
        signatures = [
            bytes.fromhex(signatures_element.decode("utf-8"))
            for signatures_element in signatures
        ]
        func = self._get_contract_instance(
            self.contract_address
        ).functions.marketBuyOrders(
            orders, maker_asset_fill_amount, signatures
        )
        return self._invoke_function_call(
            func=func, tx_params=tx_params, view_only=view_only
        )

    def current_context_address(
        self, tx_params: Optional[TxParams] = None
    ) -> str:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters

        """
        func = self._get_contract_instance(
            self.contract_address
        ).functions.currentContextAddress()
        return self._invoke_function_call(
            func=func, tx_params=tx_params, view_only=True
        )

    def transfer_ownership(
        self,
        new_owner: str,
        tx_params: Optional[TxParams] = None,
        view_only: bool = False,
    ) -> None:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters
        :param view_only: whether to use transact() or call()

        :returns: transaction hash
        """
        new_owner = self._validate_and_checksum_address(new_owner)
        func = self._get_contract_instance(
            self.contract_address
        ).functions.transferOwnership(new_owner)
        return self._invoke_function_call(
            func=func, tx_params=tx_params, view_only=view_only
        )

    def version(self, tx_params: Optional[TxParams] = None) -> str:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters

        """
        func = self._get_contract_instance(
            self.contract_address
        ).functions.VERSION()
        return self._invoke_function_call(
            func=func, tx_params=tx_params, view_only=True
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
            self._get_contract_instance(self.contract_address)
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
            self._get_contract_instance(self.contract_address)
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
            self._get_contract_instance(self.contract_address)
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
            self._get_contract_instance(self.contract_address)
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
            self._get_contract_instance(self.contract_address)
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
