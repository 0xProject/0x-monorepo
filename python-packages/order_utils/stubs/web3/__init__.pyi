from typing import Dict, Optional, Union

from web3.utils import datatypes


class Web3:
    class HTTPProvider: ...

    def __init__(self, provider: HTTPProvider) -> None: ...

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
