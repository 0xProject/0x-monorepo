"""Conveniences for handling types representing Exchange Solidity structs.

The `TypedDict`:code: classes in the .exchange module represent tuples
encountered in the Exchange contract's ABI.  However, they have weird names,
containing hashes of the tuple's field names, because the name of a Solidity
`struct`:code: isn't conveyed through the ABI.  This module provides type
aliases with human-friendly names.
"""

from enum import auto, Enum

from . import (
    Tuple0x735c43e3,
    Tuple0x6ca34a6f,
    Tuple0x4c5ca29b,
    Tuple0xdabc15fe,
    Tuple0xb1e4a1ae,
)


# Would rather not repeat ourselves below, but base classes are mentioned in
# the class docstrings because of a bug in sphinx rendering.  Using the `..
# autoclass` directive, with the `:show-inheritance:` role, results in docs
# being rendered with just "Bases: dict", and no mention of the direct ancestor
# of each of these classes.


class FillResults(Tuple0x735c43e3):
    """The `FillResults`:code: Solidity struct.

    Also known as
    `zero_ex.contract_wrappers.exchange.Tuple0x735c43e3`:py:class:.
    """


class Order(Tuple0x6ca34a6f):
    """The `Order`:code: Solidity struct.

    Also known as
    `zero_ex.contract_wrappers.exchange.Tuple0x6ca34a6f`:py:class:.
    """


class MatchedFillResults(Tuple0x4c5ca29b):
    """The `MatchedFillResults`:code: Solidity struct.

    Also known as
    `zero_ex.contract_wrappers.exchange.Tuple0x4c5ca29b`:py:class:.
    """


class ZeroExTransaction(Tuple0xdabc15fe):
    """The `ZeroExTransaction`:code: Solidity struct.

    Also known as
    `zero_ex.contract_wrappers.exchange.Tuple0xdabc15fe`:py:class:.
    """


class OrderInfo(Tuple0xb1e4a1ae):
    """The `OrderInfo`:code: Solidity struct.

    Also known as
    `zero_ex.contract_wrappers.exchange.Tuple0xb1e4a1ae`:py:class:.
    """


class OrderStatus(Enum):  # noqa: D101 # pylint: disable=missing-docstring
    INVALID = 0
    INVALID_MAKER_ASSET_AMOUNT = auto()
    INVALID_TAKER_ASSET_AMOUNT = auto()
    FILLABLE = auto()
    EXPIRED = auto()
    FULLY_FILLED = auto()
    CANCELLED = auto()
