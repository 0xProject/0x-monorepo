"""Wrapper for 0x Exchange smart contract."""

from typing import List, Optional, Tuple, Union
from itertools import repeat

from hexbytes import HexBytes
from web3.providers.base import BaseProvider
from web3.datastructures import AttributeDict

from zero_ex.contract_artifacts import abi_by_name
from zero_ex.json_schemas import assert_valid
from zero_ex.order_utils import (
    Order,
    generate_order_hash_hex,
    is_valid_signature,
    order_to_jsdict,
)

from ._base_contract_wrapper import BaseContractWrapper
from .tx_params import TxParams


class CancelDisallowedError(Exception):
    """Exception for when Cancel is not allowed."""


class Exchange(BaseContractWrapper):
    """Wrapper class for 0x Exchange smart contract."""

    def __init__(
        self,
        provider: BaseProvider,
        contract_address: str,
        private_key: str = None,
    ):
        """Get an instance of the 0x Exchange smart contract wrapper.

        :param provider: instance of :class:`web3.providers.base.BaseProvider`
        :param private_key: str of private_key
        """
        super(Exchange, self).__init__(
            provider=provider,
            contract_address=contract_address,
            private_key=private_key,
        )
        self._web3_net = self._web3.net  # pylint: disable=no-member
        self._exchange = self._contract_instance(
            address=self.contract_address, abi=abi_by_name("Exchange")
        )

    # pylint: disable=too-many-arguments
    def batch_fill_orders(
        self,
        orders: List[Order],
        taker_asset_fill_amounts: List[int],
        signatures: List[bytes],
        tx_params: Optional[TxParams] = None,
        view_only: bool = False,
    ) -> Union[HexBytes, bytes]:
        """Call `fillOrder` sequentially for orders, amounts and signatures.

        :param orders: list of instances of :class:`zero_ex.order_utils.Order`
        :param taker_asset_fill_amounts: list of integer taker amounts in Wei
        :param signatures: list of order hash signatures
        :param tx_params: default None, :class:`TxParams` transaction params
        :param view_only: default False, boolean of whether to transact or
            view only

        :returns: transaction hash
        """
        order_jsdicts = [
            order_to_jsdict(order, self.contract_address) for order in orders
        ]
        map(assert_valid, order_jsdicts, repeat("/orderSchema"))
        # safeguard against fractional inputs
        normalized_fill_amounts = [
            int(taker_fill_amount)
            for taker_fill_amount in taker_asset_fill_amounts
        ]
        normalized_signatures = [
            bytes.fromhex(signature.decode("utf-8"))
            for signature in signatures
        ]
        func = self._exchange.functions.batchFillOrders(
            orders, normalized_fill_amounts, normalized_signatures
        )
        return self._invoke_function_call(
            func=func, tx_params=tx_params, view_only=view_only
        )

    # pylint: disable=too-many-arguments
    def fill_order(
        self,
        order: Order,
        taker_asset_fill_amount: int,
        signature: bytes,
        tx_params: Optional[TxParams] = None,
        view_only: bool = False,
    ) -> Union[HexBytes, bytes]:
        """Fill a signed order with given amount of taker asset.

        This is the most basic way to fill an order. All of the other methods
        call fillOrder under the hood with additional logic. This function
        will attempt to fill the amount specified by the caller. However, if
        the remaining fillable amount is less than the amount specified, the
        remaining amount will be filled. Partial fills are allowed when
        filling orders.

        See the specification docs for `fillOrder
        <https://github.com/0xProject/0x-protocol-specification/blob/master
        /v2/v2-specification.md#fillorder>`_.

        :param order: instance of :class:`zero_ex.order_utils.Order`
        :param taker_asset_fill_amount: integer taker amount in Wei (1 Wei is
            10e-18 ETH)
        :param signature: order hash signature
        :param tx_params: default None, :class:`TxParams` transaction params
        :param view_only: default False, boolean of whether to transact or
            view only

        :returns: transaction hash
        """
        assert_valid(
            order_to_jsdict(order, self.contract_address), "/orderSchema"
        )
        is_valid_signature(
            self._provider,
            generate_order_hash_hex(order, self.contract_address),
            "0x" + signature.decode("utf-8"),
            order["makerAddress"],
        )
        # safeguard against fractional inputs
        taker_fill_amount = int(taker_asset_fill_amount)
        normalized_signature = bytes.fromhex(signature.decode("utf-8"))
        func = self._exchange.functions.fillOrder(
            order, taker_fill_amount, normalized_signature
        )
        return self._invoke_function_call(
            func=func, tx_params=tx_params, view_only=view_only
        )

    # pylint: disable=too-many-arguments
    def fill_or_kill_order(
        self,
        order: Order,
        taker_asset_fill_amount: int,
        signature: bytes,
        tx_params: Optional[TxParams] = None,
        view_only: bool = False,
    ) -> Union[HexBytes, bytes]:
        """Attemp to `fillOrder`, revert if fill is not exact amount.

        :param order: instance of :class:`zero_ex.order_utils.Order`
        :param taker_asset_fill_amount: integer taker amount in Wei (1 Wei is
            10e-18 ETH)
        :param signature: order hash signature
        :param tx_params: default None, :class:`TxParams` transaction params
        :param view_only: default False, boolean of whether to transact or
            view only

        :returns: transaction hash
        """
        assert_valid(
            order_to_jsdict(order, self.contract_address), "/orderSchema"
        )
        is_valid_signature(
            self._provider,
            generate_order_hash_hex(order, self.contract_address),
            "0x" + signature.decode("utf-8"),
            order["makerAddress"],
        )
        # safeguard against fractional inputs
        taker_fill_amount = int(taker_asset_fill_amount)
        func = self._exchange.functions.fillOrKillOrder(
            order, taker_fill_amount, signature
        )
        return self._invoke_function_call(
            func=func, tx_params=tx_params, view_only=view_only
        )

    # pylint: disable=too-many-arguments
    def batch_fill_or_kill_orders(
        self,
        orders: List[Order],
        taker_asset_fill_amounts: List[int],
        signatures: List[bytes],
        tx_params: Optional[TxParams] = None,
        view_only: bool = False,
    ) -> Union[HexBytes, bytes]:
        """Call `fillOrKillOrder` sequentially for orders.

        :param orders: list of instances of :class:`zero_ex.order_utils.Order`
        :param taker_asset_fill_amounts: list of integer taker amounts in Wei
        :param signatures: list of order hash signatures
        :param tx_params: default None, :class:`TxParams` transaction params
        :param view_only: default False, boolean of whether to transact or
            view only

        :returns: transaction hash
        """
        order_jsdicts = [
            order_to_jsdict(order, self.contract_address) for order in orders
        ]
        map(assert_valid, order_jsdicts, repeat("/orderSchema"))
        # safeguard against fractional inputs
        normalized_fill_amounts = [
            int(taker_fill_amount)
            for taker_fill_amount in taker_asset_fill_amounts
        ]
        func = self._exchange.functions.batchFillOrKillOrders(
            orders, normalized_fill_amounts, signatures
        )
        return self._invoke_function_call(
            func=func, tx_params=tx_params, view_only=view_only
        )

    def batch_cancel_orders(
        self,
        orders: List[Order],
        tx_params: Optional[TxParams] = None,
        view_only: bool = False,
    ) -> Union[HexBytes, bytes]:
        """Call `cancelOrder` sequentially for provided orders.

        :param orders: list of instance of :class:`zero_ex.order_utils.Order`
        :param tx_params: default None, :class:`TxParams` transaction params
        :param view_only: default False, boolean of whether to transact or
            view only

        :returns: transaction hash
        """
        order_jsdicts = [
            order_to_jsdict(order, self.contract_address) for order in orders
        ]
        map(assert_valid, order_jsdicts, repeat("/orderSchema"))
        maker_addresses = [
            self._validate_and_checksum_address(order["makerAddress"])
            for order in orders
        ]
        if tx_params and tx_params.from_:
            map(
                self._raise_if_maker_not_canceller,
                maker_addresses,
                repeat(tx_params.from_),
            )
        elif self._web3_eth.defaultAccount:
            map(
                self._raise_if_maker_not_canceller,
                maker_addresses,
                repeat(self._web3_eth.defaultAccount),
            )
        func = self._exchange.functions.batchCancelOrders(orders)
        return self._invoke_function_call(
            func=func, tx_params=tx_params, view_only=view_only
        )

    def cancel_order(
        self,
        order: Order,
        tx_params: Optional[TxParams] = None,
        view_only: bool = False,
    ) -> Union[HexBytes, bytes]:
        """Cancel an order.

        See the specification docs for `cancelOrder
        <https://github.com/0xProject/0x-protocol-specification/blob/master
        /v2/v2-specification.md#cancelorder>`_.

        :param order: instance of :class:`zero_ex.order_utils.Order`
        :param tx_params: default None, :class:`TxParams` transaction params
        :param view_only: default False, boolean of whether to transact or
            view only

        :returns: transaction hash
        """
        assert_valid(
            order_to_jsdict(order, self.contract_address), "/orderSchema"
        )
        maker_address = self._validate_and_checksum_address(
            order["makerAddress"]
        )

        if tx_params and tx_params.from_:
            self._raise_if_maker_not_canceller(
                maker_address,
                self._validate_and_checksum_address(tx_params.from_),
            )
        elif self._web3_eth.defaultAccount:
            self._raise_if_maker_not_canceller(
                maker_address, self._web3_eth.defaultAccount
            )
        func = self._exchange.functions.cancelOrder(order)
        return self._invoke_function_call(
            func=func, tx_params=tx_params, view_only=view_only
        )

    def get_fill_event(
        self, tx_hash: Union[HexBytes, bytes]
    ) -> Tuple[AttributeDict]:
        """Get fill event for a fill transaction.

        :param tx_hash: `HexBytes` hash of fill transaction

        :returns: fill event
        """
        tx_receipt = self._web3_eth.getTransactionReceipt(tx_hash)
        return self._exchange.events.Fill().processReceipt(tx_receipt)

    def get_cancel_event(
        self, tx_hash: Union[HexBytes, bytes]
    ) -> Tuple[AttributeDict]:
        """Get cancel event for cancel transaction.

        :param tx_hash: `HexBytes` hash of cancel transaction
        """
        tx_receipt = self._web3_eth.getTransactionReceipt(tx_hash)
        return self._exchange.events.Cancel().processReceipt(tx_receipt)

    @staticmethod
    def _raise_if_maker_not_canceller(maker_address, canceller_address):
        """Raise exception is maker is not same as canceller."""
        if maker_address != canceller_address:
            raise CancelDisallowedError(
                "Order with makerAddress {} can not be cancelled by {}".format(
                    maker_address, canceller_address
                )
            )
