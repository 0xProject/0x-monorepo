from typing import Dict, List, Optional, Union

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

    class net:
        version: str
        ...

    class eth:
        @staticmethod
        def contract(address: str, abi: Dict) -> Contract: ...
        ...

    class geth:
        class personal:
            @staticmethod
            def listAccounts() -> List[str]:
                ...
            ...
        ...

    ...
