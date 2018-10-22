"""Assertions for runtime type checking of function arguments."""

from typing import Any


def assert_is_string(value: Any) -> None:
    """If :param value: isn't of type str, raise a TypeError.

    >>> try: assert_is_string(123)
    ... except TypeError as type_error: print(str(type_error))
    ...
    expected variable with value 123 to have type 'str', not 'int'
    """
    if not isinstance(value, str):
        raise TypeError(
            "expected variable with value "
            + str(value)
            + " to have type 'str', not '"
            + type(value).__name__
            + "'"
        )


def assert_is_list(value: Any) -> None:
    """If :param value: isn't of type list, raise a TypeError.

    >>> try: assert_is_list(123)
    ... except TypeError as type_error: print(str(type_error))
    ...
    expected variable with value 123 to have type 'list', not 'int'
    """
    if not isinstance(value, list):
        raise TypeError(
            "expected variable with value "
            + str(value)
            + " to have type 'list', not '"
            + type(value).__name__
            + "'"
        )
