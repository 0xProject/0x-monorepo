"""Base wrapper class for accessing ethereum smart contracts."""

from typing import Optional, Union

from eth_utils import to_checksum_address
from web3 import Web3
from web3.providers.base import BaseProvider

from .tx_params import TxParams


class BaseContractWrapper:
    """Base class for wrapping ethereum smart contracts.

    It provides functionality for instantiating a contract instance,
    calling view functions, and calling functions which require
    transactions.

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
        """Create an instance of BaseContractWrapper."""
        self._provider = provider
        self._account_address = account_address
        self._private_key = private_key
        self._web3 = Web3(provider)
        self._web3_eth = self._web3.eth  # pylint: disable=no-member

        self._can_send_tx = False
        if self._web3_eth.defaultAccount or self._web3_eth.accounts:
            self._can_send_tx = True
        else:
            middleware_stack = getattr(self._web3, "middleware_stack")
            if middleware_stack.get("sign_and_send_raw_middleware"):
                self._can_send_tx = True
            elif private_key:
                self._private_key = private_key
                self._web3_eth.defaultAccount = to_checksum_address(
                    self._web3_eth.account.privateKeyToAccount(
                        private_key
                    ).address
                )
                self._can_send_tx = True

    def _contract_instance(self, address: str, abi: dict):
        """Get a contract instance.

        :param address: string address of contract
        :param abi: dict contract ABI

        :returns: instance of contract
        """
        return self._web3_eth.contract(
            address=to_checksum_address(address), abi=abi
        )

    def _validate_and_checksum_address(self, address: str):
        if not self._web3.isAddress(address):
            raise TypeError("Invalid address provided: {}".format(address))
        return to_checksum_address(address)

    def _invoke_function_call(self, func, tx_params, view_only):
        if view_only:
            return func.call()
        if not self._can_send_tx:
            raise Exception(
                "Cannot send transaction because no local private_key"
                " or account found."
            )
        if not tx_params:
            tx_params = TxParams()
        if not tx_params.from_:
            tx_params.from_ = (
                self._web3_eth.defaultAccount or self._web3_eth.accounts[0]
            )
        tx_params.from_ = self._validate_and_checksum_address(tx_params.from_)
        if self._private_key:
            res = self._sign_and_send_raw_direct(func, tx_params)
        else:
            res = func.transact(tx_params.as_dict())
        return res

    def _sign_and_send_raw_direct(self, func, tx_params):
        transaction = func.buildTransaction(tx_params.as_dict())
        signed_tx = self._web3_eth.account.signTransaction(
            transaction, private_key=self._private_key
        )
        return self._web3_eth.sendRawTransaction(signed_tx.rawTransaction)

    def execute_method(
        self,
        address: str,
        abi: dict,
        method: str,
        args: Optional[Union[list, tuple]] = None,
        tx_params: Optional[TxParams] = None,
        view_only: bool = False,
    ) -> str:
        """Execute the method on a contract instance.

        :param address: string of contract address
        :param abi: dict of contract ABI
        :param method: string name of method to call
        :param args: default None, list or tuple of arguments for the method
        :param tx_params: default None, :class:`TxParams` transaction params
        :param view_only: default False, boolean of whether the transaction
            should only be validated.

        :returns: str of transaction hash
        """
        contract_instance = self._contract_instance(address=address, abi=abi)
        if args is None:
            args = []
        if hasattr(contract_instance.functions, method):
            func = getattr(contract_instance.functions, method)(*args)
            return self._invoke_function_call(
                func=func, tx_params=tx_params, view_only=view_only
            )
        raise Exception(
            "No method {} found on contract {}.".format(address, method)
        )
