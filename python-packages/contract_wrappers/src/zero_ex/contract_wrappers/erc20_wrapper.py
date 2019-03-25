"""Wrapper for Ethereum ERC20 Token smart contract."""
from typing import Optional, Tuple, Union
from hexbytes import HexBytes
from web3.datastructures import AttributeDict
from web3.providers.base import BaseProvider

from zero_ex.contract_artifacts import abi_by_name

from ._base_contract_wrapper import BaseContractWrapper
from .tx_params import TxParams


class ERC20Token(BaseContractWrapper):
    """Wrapper class for Ethereum ERC20 smart contract.

    :param provider: instance of :class:`web3.providers.base.BaseProvider`
    :param account_address: default None, str of account address
    :param private_key: default None, str of private_key
    """

    def __init__(
        self,
        provider: BaseProvider,
        account_address: str = None,
        private_key: str = None,
    ):
        """Get an instance of wrapper for ERC20 smart contract."""
        super(ERC20Token, self).__init__(
            provider=provider,
            account_address=account_address,
            private_key=private_key,
        )

    def _erc20(self, token_address):
        """Get an instance of the ERC20 smart contract at a specific address.

        :param token_address: string address of token smart contract

        :returns: ERC20 contract object
        """
        return self._contract_instance(
            address=token_address, abi=abi_by_name("ERC20Token")
        )

    def transfer(
        self,
        token_address: str,
        to_address: str,
        value: int,
        tx_params: Optional[TxParams] = None,
        view_only: bool = False,
    ) -> Union[HexBytes, bytes]:
        """Transfer the balance from owner's account to another account.

        :param token_address: string address of token smart contract
        :param to_address: string address of receiver
        :param value: integer amount to send in Wei base unit
        :param tx_params: default None, dict of transaction options
        :param view_only: default False, boolean of whether to transact or
            view only

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

    def approve(
        self,
        token_address: str,
        spender_address: str,
        value: int,
        tx_params: Optional[TxParams] = None,
        view_only: bool = False,
    ) -> Union[HexBytes, bytes]:
        """Approve a `spender_address` to spend up to `value` your account.

        :param token_address: string address of token smart contract
        :param spender_address: string address of receiver
        :param value: integer amount of allowance in Wei base unit
        :param tx_params: default None, dict of transaction options
        :param view_only: default False, boolean of whether to transact or
            view only

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

    def transfer_from(
        self,
        token_address: str,
        authorized_address: str,
        to_address: str,
        value: int,
        tx_params: Optional[TxParams] = None,
        view_only: bool = False,
    ) -> Union[HexBytes, bytes]:
        """Transfer tokens from `authorized_address` to another address.

        Note that the `authorized_address` must have called with `approve`
        with your address as the `spender_address`.

        :param token_address: string address of token smart contract
        :param authorized_address: string address you have been authorized to
            to transfer tokens from
        :param to_address: string address of receiver
        :param value: integer amount to send in Wei base unit
        :param tx_params: default None, dict of transaction options
        :param view_only: default False, boolean of whether to transact or
            view only

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

    def total_supply(self, token_address: str) -> int:
        """Get total supply of a given ERC20 Token.

        :param token_address: string address of token smart contract

        :returns: integer amount of tokens in Wei
        """
        token_address = self._validate_and_checksum_address(token_address)
        func = self._erc20(token_address).functions.totalSupply()
        return self._invoke_function_call(
            func=func, tx_params=None, view_only=True
        )

    def balance_of(self, token_address: str, owner_address: str) -> int:
        """Get token balance of a given owner address.

        :param token_address: string address of token smart contract
        :param owner_address: string address of owner to check balance for

        :returns: integer amount of tokens in Wei the owner has
        """
        token_address = self._validate_and_checksum_address(token_address)
        owner_address = self._validate_and_checksum_address(owner_address)
        func = self._erc20(token_address).functions.balanceOf(owner_address)
        return self._invoke_function_call(
            func=func, tx_params=None, view_only=True
        )

    def allowance(
        self, token_address: str, owner_address: str, spender_address: str
    ) -> Union[HexBytes, bytes]:
        """Get the amount of tokens approved for a spender.

        :param token_address: string address of token smart contract
        :param owner_address: string address of owner of the tokens
        :param spender_address: string address of spender to be checked

        :returns: integer amount of tokens in Wei spender is authorized
            to spend
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

        :param token_address: string address of token smart contract
        :param tx_hash: `HexBytes` hash of transfer transaction
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

        :param token_address: string address of token smart contract
        :param tx_hash: `HexBytes` hash of approval transaction
        """
        tx_receipt = self._web3_eth.getTransactionReceipt(tx_hash)
        token_address = self._validate_and_checksum_address(token_address)
        return (
            self._erc20(token_address)
            .events.Approval()
            .processReceipt(tx_receipt)
        )
