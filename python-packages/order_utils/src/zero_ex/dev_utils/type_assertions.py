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


def assert_is_int(value: Any, name: str) -> None:
    """If :param value: isn't of type int, raise a TypeError.

    >>> try: assert_is_int('asdf', 'var')
    ... except TypeError as type_error: print(str(type_error))
    ...
    expected variable 'var', with value asdf, to have type 'int', not 'str'
    """
    if not isinstance(value, int):
        raise TypeError(
            f"expected variable '{name}', with value {str(value)}, to have"
            + f" type 'int', not '{type(value).__name__}'"
        )


def assert_is_hex_string(value: Any, name: str) -> None:
    """Assert that :param value: is a string of hex chars.

    If :param value: isn't a str, raise a TypeError.  If it is a string but
    contains non-hex characters ("0x" prefix permitted), raise a ValueError.
    """
    assert_is_string(value, name)
    int(value, 16)  # raises a ValueError if value isn't a base-16 str
