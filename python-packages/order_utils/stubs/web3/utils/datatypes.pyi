from typing import Any, Callable


class ContractFunctions:
    def __getattr__(self, function_name) -> Callable:
        ...
    ...


class Contract:
    class functions: ContractFunctions:
    ...
