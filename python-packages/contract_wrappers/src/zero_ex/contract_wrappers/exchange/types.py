"""Conveniences for handling types representing Exchange Solidity structs.

The `TypedDict`:code: classes in the .exchange module represent tuples
encountered in the Exchange contract's ABI.  However, they have weird names,
containing hashes of the tuple's field names, because the name of a Solidity
`struct`:code: isn't conveyed through the ABI.  This module provides type
aliases with human-friendly names.
"""

from enum import auto, Enum

from . import (
    LibFillResultsFillResults,
    LibOrderOrder,
    LibFillResultsMatchedFillResults,
    LibZeroExTransactionZeroExTransaction,
    LibOrderOrderInfo,
)


# Would rather not repeat ourselves below, but base classes are mentioned in
# the class docstrings because of a bug in sphinx rendering.  Using the `..
# autoclass` directive, with the `:show-inheritance:` role, results in docs
# being rendered with just "Bases: dict", and no mention of the direct ancestor
# of each of these classes.


class FillResults(LibFillResultsFillResults):
    """The `FillResults`:code: Solidity struct.

    Also known as
    `zero_ex.contract_wrappers.exchange.LibFillResultsFillResults`:py:class:.
    """


class Order(LibOrderOrder):
    """The `Order`:code: Solidity struct.

    Also known as
    `zero_ex.contract_wrappers.exchange.LibOrderOrder`:py:class:.
    """


class MatchedFillResults(LibFillResultsMatchedFillResults):
    """The `MatchedFillResults`:code: Solidity struct.

    Also known as
    `zero_ex.contract_wrappers.exchange.LibFillResultsMatchedFillResults`:py:class:.
    """


class ZeroExTransaction(LibZeroExTransactionZeroExTransaction):
    """The `ZeroExTransaction`:code: Solidity struct.

    Also known as
    `zero_ex.contract_wrappers.exchange.LibZeroExTransactionZeroExTransaction`:py:class:.
    """


class OrderInfo(LibOrderOrderInfo):
    """The `OrderInfo`:code: Solidity struct.

    Also known as
    `zero_ex.contract_wrappers.exchange.LibOrderOrderInfo`:py:class:.
    """


class OrderStatus(Enum):  # noqa: D101 # pylint: disable=missing-docstring
    INVALID = 0
    INVALID_MAKER_ASSET_AMOUNT = auto()
    INVALID_TAKER_ASSET_AMOUNT = auto()
    FILLABLE = auto()
    EXPIRED = auto()
    FULLY_FILLED = auto()
    CANCELLED = auto()
