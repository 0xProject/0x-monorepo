"""Exercise doctests for all of our modules."""

from doctest import testmod
import pkgutil
import importlib

import zero_ex


def test_all_doctests():
    """Gather zero_ex.* modules and doctest them.

    NOTE: we now use `importlib` instead of `imp` because `imp` is deprecated
    and also `load_module()` will reload modules that are already loaded,
    causing tests to faily non-deterministically.
    Ref https://bit.ly/2zwgyrZ
    """
    for (_, modname, _) in pkgutil.walk_packages(
        path=zero_ex.__path__, prefix="zero_ex."
    ):
        module = importlib.import_module(modname)
        print(module)
        (failure_count, _) = testmod(module)
        assert failure_count == 0
