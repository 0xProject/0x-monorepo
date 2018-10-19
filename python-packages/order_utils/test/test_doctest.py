"""Exercise doctests for order_utils module."""

from doctest import testmod

from zero_ex.dev_utils import abi_utils, type_assertions
from zero_ex.order_utils import asset_data_utils


def test_doctest_asset_data_utils():
    """Invoke doctest on the asset_data_utils module."""
    (failure_count, _) = testmod(asset_data_utils)
    assert failure_count == 0


def test_doctest_abi_utils():
    """Invoke doctest on the abi_utils module."""
    (failure_count, _) = testmod(abi_utils)
    assert failure_count == 0


def test_doctest_type_assertions():
    """Invoke doctest on the type_assertions module."""
    (failure_count, _) = testmod(type_assertions)
    assert failure_count == 0
