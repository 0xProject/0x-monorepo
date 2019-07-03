"""Generated wrapper for AbiGenDummy Solidity contract."""

import json
from typing import Optional, Tuple, Union

from hexbytes import HexBytes
from web3.datastructures import AttributeDict
from web3.providers.base import BaseProvider

from zero_ex.contract_wrappers._base_contract_wrapper import BaseContractWrapper
from zero_ex.contract_wrappers.tx_params import TxParams


class AbiGenDummy(BaseContractWrapper):
    """Wrapper class for AbiGenDummy Solidity contract."""

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
        super(AbiGenDummy, self).__init__(
            provider=provider,
            contract_address=contract_address,
            private_key=private_key,
        )

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

        
        """
        func = self._get_contract_instance(
            self._contract_address
        ).functions.simpleRequire(
        )
        return self._invoke_function_call(
            func=func,
            tx_params=tx_params,
            view_only=True
        )

    def ecrecover_fn(
        self,
        hash: bytes,
        v: int,
        r: bytes,
        s: bytes,
        tx_params: Optional[TxParams] = None,
    ) -> str:
        """Execute underlying, same-named contract method.

        
        """
        func = self._get_contract_instance(
            self._contract_address
        ).functions.ecrecoverFn(
            hash,
            v,
            r,
            s
        )
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

        
        """
        func = self._get_contract_instance(
            self._contract_address
        ).functions.revertWithConstant(
        )
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

        
        """
        func = self._get_contract_instance(
            self._contract_address
        ).functions.simpleRevert(
        )
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

        
        """
        func = self._get_contract_instance(
            self._contract_address
        ).functions.requireWithConstant(
        )
        return self._invoke_function_call(
            func=func,
            tx_params=tx_params,
            view_only=True
        )

    def simple_pure_function_with_input(
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
        ).functions.simplePureFunctionWithInput(
            x
        )
        return self._invoke_function_call(
            func=func,
            tx_params=tx_params,
            view_only=True
        )

    def simple_pure_function(
        self,
        tx_params: Optional[TxParams] = None,
    ) -> int:
        """Execute underlying, same-named contract method.

        
        """
        func = self._get_contract_instance(
            self._contract_address
        ).functions.simplePureFunction(
        )
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

        
        """
        func = self._get_contract_instance(
            self._contract_address
        ).functions.pureFunctionWithConstant(
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
            '[{"constant":true,"inputs":[],"name":"simpleRequire","outputs":[],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[{"name":"hash","type":"bytes32"},{"name":"v","type":"uint8"},{"name":"r","type":"bytes32"},{"name":"s","type":"bytes32"}],"name":"ecrecoverFn","outputs":[{"name":"signerAddress","type":"address"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[],"name":"revertWithConstant","outputs":[],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[],"name":"simpleRevert","outputs":[],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[],"name":"requireWithConstant","outputs":[],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[{"name":"x","type":"uint256"}],"name":"simplePureFunctionWithInput","outputs":[{"name":"sum","type":"uint256"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[],"name":"simplePureFunction","outputs":[{"name":"result","type":"uint256"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[],"name":"pureFunctionWithConstant","outputs":[{"name":"someConstant","type":"uint256"}],"payable":false,"stateMutability":"pure","type":"function"}]'  # noqa: E501 (line-too-long)
        )
