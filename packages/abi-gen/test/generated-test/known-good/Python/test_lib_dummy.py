"""Generated wrapper for TestLibDummy Solidity contract."""

import json
from typing import Optional, Tuple, Union

from hexbytes import HexBytes
from web3.datastructures import AttributeDict
from web3.providers.base import BaseProvider

from zero_ex.contract_wrappers._base_contract_wrapper import BaseContractWrapper
from zero_ex.contract_wrappers.tx_params import TxParams


class TestLibDummy(BaseContractWrapper):
    """Wrapper class for TestLibDummy Solidity contract."""

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
        super(TestLibDummy, self).__init__(
            provider=provider,
            contract_address=contract_address,
            private_key=private_key,
        )

    def _get_contract_instance(self, token_address):
        """Get an instance of the smart contract at a specific address.

        :returns: contract object
        """
        return self._contract_instance(
            address=token_address, abi=TestLibDummy.abi()
        )

    def public_add_constant(
        self,
        x: int,
        tx_params: Optional[TxParams] = None,
    ) -> int:
        """Execute underlying, same-named contract method.

        
        """
        # safeguard against fractional inputs
        x = int(x)
        func = self._get_contract_instance(
            self._contract_address
        ).functions.publicAddConstant(
            x
        )
        return self._invoke_function_call(
            func=func,
            tx_params=tx_params,
            view_only=True
        )

    def public_add_one(
        self,
        x: int,
        tx_params: Optional[TxParams] = None,
    ) -> int:
        """Execute underlying, same-named contract method.

        
        """
        # safeguard against fractional inputs
        x = int(x)
        func = self._get_contract_instance(
            self._contract_address
        ).functions.publicAddOne(
            x
        )
        return self._invoke_function_call(
            func=func,
            tx_params=tx_params,
            view_only=True
        )

    @staticmethod
    def abi():
        """Return the ABI to the underlying contract."""
        return json.loads(
            '[{"constant":true,"inputs":[{"name":"x","type":"uint256"}],"name":"publicAddConstant","outputs":[{"name":"result","type":"uint256"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[{"name":"x","type":"uint256"}],"name":"publicAddOne","outputs":[{"name":"result","type":"uint256"}],"payable":false,"stateMutability":"pure","type":"function"}]'  # noqa: E501 (line-too-long)
        )
