"""Wrapper for Ethereum ERC20 Token smart contract."""

from typing import Optional, Tuple, Union

from hexbytes import HexBytes
from web3.datastructures import AttributeDict
from web3.providers.base import BaseProvider

from zero_ex.contract_artifacts import abi_by_name

from ._base_contract_wrapper import BaseContractWrapper
from .tx_params import TxParams


class ERC20Token(BaseContractWrapper):
    """Wrapper class for Ethereum ERC20 smart contract."""

    def __init__(
        self,
        provider: BaseProvider,
        account_address: str = None,
        private_key: str = None,
    ):
        """Get an instance of wrapper for ERC20 smart contract.

        :param provider: instance of :class:`web3.providers.base.BaseProvider`
        """
        super(ERC20Token, self).__init__(
            provider=provider,
            account_address=account_address,
            private_key=private_key,
        )

    def _erc20(self, token_address):
        """Get an instance of the ERC20 smart contract at a specific address.

        :returns: ERC20 contract object
        """
        return self._contract_instance(
            address=token_address, abi=abi_by_name("ERC20Token")
        )

    # pylint: disable=too-many-arguments
    def approve(
        self,
        token_address: str,
        spender_address: str,
        value: int,
        tx_params: Optional[TxParams] = None,
        view_only: bool = False,
    ) -> Union[HexBytes, bytes]:
        """Approve an address to spend up to `value`:code: of your tokens.

        :param value: amount of allowance
        :param tx_params: transaction options
        :param view_only: whether to use transact() or call()

        :returns: transaction hash
        """
        token_address = self._validate_and_checksum_address(token_address)
        spender_address = self._validate_and_checksum_address(spender_address)
        # safeguard against fractional inputs
        value = int(value)
        func = self._erc20(token_address).functions.approve(
            spender_address, value
        )
        return self._invoke_function_call(
            func=func, tx_params=tx_params, view_only=view_only
        )

    def total_supply(self, token_address: str) -> int:
        """Get total supply of a given ERC20 Token.

        :returns: amount of tokens
        """
        token_address = self._validate_and_checksum_address(token_address)
        func = self._erc20(token_address).functions.totalSupply()
        return self._invoke_function_call(
            func=func, tx_params=None, view_only=True
        )

    # pylint: disable=too-many-arguments
    def transfer_from(
        self,
        token_address: str,
        authorized_address: str,
        to_address: str,
        value: int,
        tx_params: Optional[TxParams] = None,
        view_only: bool = False,
    ) -> Union[HexBytes, bytes]:
        """Transfer tokens from `authorized_address`:code: to another address.

        Note that the `authorized_address`:code: must have already called
        `approve`:code: for the `spender_address`:code:.

        :param authorized_address: address you have been authorized to transfer
            tokens from
        :param value: amount to send
        :param tx_params: transaction parameters
        :param view_only: whether to use transact() or call()

        :returns: transaction hash
        """
        token_address = self._validate_and_checksum_address(token_address)
        authorized_address = self._validate_and_checksum_address(
            authorized_address
        )
        to_address = self._validate_and_checksum_address(to_address)
        # safeguard against fractional inputs
        value = int(value)
        func = self._erc20(token_address).functions.transferFrom(
            authorized_address, to_address, value
        )
        return self._invoke_function_call(
            func=func, tx_params=tx_params, view_only=view_only
        )

    def balance_of(self, token_address: str, owner_address: str) -> int:
        """Get token balance of a given owner address.

        :returns: amount of tokens
        """
        token_address = self._validate_and_checksum_address(token_address)
        owner_address = self._validate_and_checksum_address(owner_address)
        func = self._erc20(token_address).functions.balanceOf(owner_address)
        return self._invoke_function_call(
            func=func, tx_params=None, view_only=True
        )

    # pylint: disable=too-many-arguments
    def transfer(
        self,
        token_address: str,
        to_address: str,
        value: int,
        tx_params: Optional[TxParams] = None,
        view_only: bool = False,
    ) -> Union[HexBytes, bytes]:
        """Transfer the balance from owner's account to another account.

        :param value: integer amount to send
        :param tx_params: transaction parameters
        :param view_only: whether to use transact() or call()

        :returns: transaction hash
        """
        token_address = self._validate_and_checksum_address(token_address)
        to_address = self._validate_and_checksum_address(to_address)
        # safeguard against fractional inputs
        value = int(value)
        func = self._erc20(token_address).functions.transfer(to_address, value)
        return self._invoke_function_call(
            func=func, tx_params=tx_params, view_only=view_only
        )

    def allowance(
        self, token_address: str, owner_address: str, spender_address: str
    ) -> Union[HexBytes, bytes]:
        """Get the amount of tokens approved for a spender.

        :returns: amount of tokens
        """
        token_address = self._validate_and_checksum_address(token_address)
        owner_address = self._validate_and_checksum_address(owner_address)
        spender_address = self._validate_and_checksum_address(spender_address)
        func = self._erc20(token_address).functions.allowance(
            owner_address, spender_address
        )
        return self._invoke_function_call(
            func=func, tx_params=None, view_only=True
        )

    def get_transfer_event(
        self, token_address: str, tx_hash: Union[HexBytes, bytes]
    ) -> Tuple[AttributeDict]:
        """Get the result of a transfer from its transaction hash.

        :param tx_hash: hash of transfer transaction
        """
        tx_receipt = self._web3_eth.getTransactionReceipt(tx_hash)
        token_address = self._validate_and_checksum_address(token_address)
        return (
            self._erc20(token_address)
            .events.Transfer()
            .processReceipt(tx_receipt)
        )

    def get_approval_event(
        self, token_address: str, tx_hash: Union[HexBytes, bytes]
    ) -> Tuple[AttributeDict]:
        """Get the result of an approval event from its transaction hash.

        :param tx_hash: hash of approval transaction
        """
        tx_receipt = self._web3_eth.getTransactionReceipt(tx_hash)
        token_address = self._validate_and_checksum_address(token_address)
        return (
            self._erc20(token_address)
            .events.Approval()
            .processReceipt(tx_receipt)
        )
