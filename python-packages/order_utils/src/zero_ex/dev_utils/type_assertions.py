"""Assertions for runtime type checking of function arguments."""

from typing import Any


def assert_is_string(value: Any, name: str) -> None:
    """If :param value: isn't of type str, raise a TypeError.

    >>> try: assert_is_string(123, 'var')
    ... except TypeError as type_error: print(str(type_error))
    ...
    expected variable 'var', with value 123, to have type 'str', not 'int'
    """
    if not isinstance(value, str):
        raise TypeError(
            f"expected variable '{name}', with value {str(value)}, to have"
            + f" type 'str', not '{type(value).__name__}'"
        )


def assert_is_list(value: Any, name: str) -> None:
    """If :param value: isn't of type list, raise a TypeError.

    >>> try: assert_is_list(123, 'var')
    ... except TypeError as type_error: print(str(type_error))
    ...
    expected variable 'var', with value 123, to have type 'list', not 'int'
    """
    if not isinstance(value, list):
        raise TypeError(
            f"expected variable '{name}', with value {str(value)}, to have"
            + f" type 'list', not '{type(value).__name__}'"
        )
