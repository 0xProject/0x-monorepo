from typing import Dict, Optional, Union

from web3.utils import datatypes
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
        def contract(address: str, abi: Dict) -> datatypes.Contract: ...
        ...
    ...
