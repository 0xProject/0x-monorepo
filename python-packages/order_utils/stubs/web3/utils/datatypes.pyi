from typing import Callable


class ContractFunctions:
    def __getattr__(self, function_name) -> Callable:
        ...
    ...


class Contract:
    functions: ContractFunctions
    ...
