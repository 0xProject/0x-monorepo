"""Assertions for runtime type checking of function arguments."""


def string_or_type_error(value):
    """If :param value: isn't of type str, raise a TypeError.

    >>> try: string_or_type_error(123)
    ... except TypeError as type_error: print(str(type_error))
    ...
    expected 123 to have type 'str', not 'int'
    """
    if not isinstance(value, str):
        raise TypeError(
            "expected "
            + str(value)
            + " to have type 'str', not '"
            + type(value).__name__
            + "'"
        )


def list_or_type_error(value):
    """If :param value: isn't of type list, raise a TypeError.

    >>> try: list_or_type_error(123)
    ... except TypeError as type_error: print(str(type_error))
    ...
    expected 123 to have type 'list', not 'int'
    """
    if not isinstance(value, list):
        raise TypeError(
            "expected "
            + str(value)
            + " to have type 'list', not '"
            + type(value).__name__
            + "'"
        )
