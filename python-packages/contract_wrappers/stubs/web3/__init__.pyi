from typing import Any, Callable, Dict, List, Optional, Union

from hexbytes import HexBytes
from eth_account.local import LocalAccount
from web3 import datastructures
from web3.contract import Contract
from web3.providers.base import BaseProvider


class Web3:
    class HTTPProvider(BaseProvider):
        ...

    def __init__(self, provider: BaseProvider) -> None: ...

    @staticmethod
    def sha3(
        primitive: Optional[Union[bytes, int, None]] = None,
        text: Optional[str] = None,
        hexstr: Optional[str] = None
    ) -> bytes: ...

    @staticmethod
    def isAddress(address: str) -> bool: ...

    class middleware_stack:
        @staticmethod
        def get(key: str) -> Callable: ...
        ...

    class net:
        version: str
        ...


    class eth:
        defaultAccount: str
        accounts: List[str]
        ...

        class account:
            @staticmethod
            def privateKeyToAccount(private_key: str) -> LocalAccount: ...
            ...

        @staticmethod
        def getTransactionReceipt(tx_hash: Union[HexBytes, bytes]) -> Any: ...
        
        @staticmethod
        def contract(address: str, abi: Dict) -> Contract: ...
        ...

        @staticmethod
        def isAddress(address: str) -> bool: ...
        ...
    ...
