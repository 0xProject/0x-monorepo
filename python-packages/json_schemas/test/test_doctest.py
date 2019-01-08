"""Exercise doctests for all of our modules."""

from doctest import testmod
import pkgutil
import importlib

import zero_ex.json_schemas


def test_all_doctests():
    """Gather zero_ex.json_schemas.* modules and doctest them."""
    # json_schemas module
    module = "zero_ex.json_schemas"
    print(module)
    failure_count, _ = testmod(importlib.import_module(module))
    assert failure_count == 0

    # any json_schemas.* sub-modules
    for (_, modname, _) in pkgutil.walk_packages(
        path=zero_ex.json_schemas.__path__, prefix="zero_ex.json_schemas"
    ):
        module = importlib.import_module(modname)
        print(module)
        (failure_count, _) = testmod(module)
        assert failure_count == 0
