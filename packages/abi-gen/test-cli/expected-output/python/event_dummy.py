"""Generated wrapper for EventDummy Solidity contract."""

import json
from typing import Optional, Tuple, Union

from hexbytes import HexBytes
from web3.datastructures import AttributeDict
from web3.providers.base import BaseProvider

from zero_ex.contract_wrappers._base_contract_wrapper import BaseContractWrapper
from zero_ex.contract_wrappers.tx_params import TxParams


class EventDummy(BaseContractWrapper):
    """Wrapper class for EventDummy Solidity contract."""

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
            address=token_address, abi=EventDummy.abi()
        )

    def withdraw(
        self,
        wad: int,
        tx_params: Optional[TxParams] = None,
        view_only: bool = False,
    ) -> None:
        """Execute underlying, same-named contract method.

        :param tx_params: transaction parameters
        :param view_only: whether to use transact() or call()

        :returns: transaction hash
        """
        # safeguard against fractional inputs
        wad = int(wad)
        func = self._get_contract_instance(
            self._contract_address
        ).functions.withdraw(
            wad
        )
        return self._invoke_function_call(
            func=func,
            tx_params=tx_params,
            view_only=view_only
        )
    def get_withdrawal_event(
        self, token_address: str, tx_hash: Union[HexBytes, bytes]
    ) -> Tuple[AttributeDict]:
        """Get log entry for Withdrawal event.

        :param tx_hash: hash of transaction emitting Withdrawal event.
        """
        tx_receipt = self._web3_eth.getTransactionReceipt(tx_hash)
        token_address = self._validate_and_checksum_address(token_address)
        return (
            self._get_contract_instance(token_address)
            .events.Withdrawal()
            .processReceipt(tx_receipt)
        )

    @staticmethod
    def abi():
        """Return the ABI to the underlying contract."""
        return json.loads(
            '[{"constant":false,"inputs":[{"name":"wad","type":"uint256"}],"name":"withdraw","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_owner","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"Withdrawal","type":"event"}]'  # noqa: E501 (line-too-long)
        )
