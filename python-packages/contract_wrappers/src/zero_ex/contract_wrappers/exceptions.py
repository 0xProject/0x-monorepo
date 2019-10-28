"""Exception classes common to all wrappers."""

from inspect import isclass
from typing import List

from eth_abi import decode_abi


class RichRevert(Exception):
    """Raised when a contract method returns a rich revert error."""

    def __init__(
        self, abi_signature: str, param_names: List[str], return_data: str
    ):
        """Populate instance variables with decoded return data values."""
        arg_start_index = abi_signature.index("(") + 1
        arg_end_index = abi_signature.index(")")
        arguments = decode_abi(
            abi_signature[arg_start_index:arg_end_index].split(","),
            bytes.fromhex(return_data[10:]),
        )
        for (param_name, argument) in zip(param_names, arguments):
            setattr(self, param_name, argument)
        super().__init__(vars(self))


class NoExceptionForSelector(Exception):
    """Indicates that no exception could be found for the given selector."""


def exception_class_from_rich_revert_selector(
    selector: str, exceptions_module
) -> RichRevert:
    """Return the appropriate exception class.

    :param selector: A string of the format '0xffffffff' which indicates the
        4-byte ABI function selector of a rich revert error type, which is
        expected to be found as a class attribute on some class in
        `exceptions_module`:code:.
    :param exceptions_module: The Python module in which to look for a class
        with a `selector`:code: attribute matching the value of the
        `selector`:code: argument.
    """
    # noqa: D202 (No blank lines allowed after function docstring
    def _get_rich_revert_exception_classes():
        def _exception_name_is_class_with_selector(name: str):
            if not isclass(getattr(exceptions_module, name)):
                return False

            try:
                getattr(exceptions_module, name).selector
            except AttributeError:
                return False

            return True

        def _convert_class_name_to_class(name: str):
            return getattr(exceptions_module, name)

        return list(
            map(
                _convert_class_name_to_class,
                filter(
                    _exception_name_is_class_with_selector,
                    dir(exceptions_module),
                ),
            )
        )

    rich_reverts = _get_rich_revert_exception_classes()

    try:
        return next(
            filter(
                lambda rich_revert: rich_revert.selector == selector,
                rich_reverts,
            )
        )
    except StopIteration:
        raise NoExceptionForSelector(selector)
