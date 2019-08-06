from typing import Any


class Contract:
    def call(self): ...

    functions: Any

    events: Any
    ...


class ContractFunction:
    def __call__(self, *args, **kwargs):
        ...

    ...
