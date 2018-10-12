"""Exercise doctests for order_utils module."""

from doctest import testmod
from zero_ex.order_utils import signature_utils


def test_doctest():
    """Invoke doctest on the module."""
    (failure_count, _) = testmod(signature_utils)
    assert failure_count == 0
