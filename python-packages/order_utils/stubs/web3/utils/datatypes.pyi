from typing import Any


class ContractFunction:
    def call() -> Any:
        ...


class Contract:
    class functions:
        def __getattr__(self, function_name) -> ContractFunction:
            ...
        ...
    ...
