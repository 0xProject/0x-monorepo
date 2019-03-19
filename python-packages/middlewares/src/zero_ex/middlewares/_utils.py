"""Utility tools for middlewares."""

try:
    from cytoolz import curry, compose  # pylint: disable=unused-import
except ImportError:
    from toolz import curry, compose  # type:ignore


@curry  # type:ignore
def apply_formatter_if(condition, formatter, value):
    """Apply formatter given condition is true."""
    if condition(value):
        return formatter(value)
    return value
