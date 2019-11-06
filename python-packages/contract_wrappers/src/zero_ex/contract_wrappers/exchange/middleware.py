"""Web3.py-compatible middleware to be injected upon contract instantiation."""

from zero_ex.contract_wrappers.exceptions import (
    exception_class_from_rich_revert_selector,
    NoExceptionForSelector,
)

from . import exceptions


def rich_revert_handler(make_request, _):
    """Return a middlware to raise exceptions for rich revert return data."""
    # noqa: D202 (No blank lines allowed after function docstring
    def middleware(method, params):
        response = make_request(method, params)
        try:
            raise exception_class_from_rich_revert_selector(
                response["result"][0:10], exceptions
            )(response["result"])
        except NoExceptionForSelector:
            # response prefix didn't indicate a known error
            pass
        except TypeError:
            # eg "unhashable type: 'slice'". if response["result"] isn't
            # sliceable (eg if it's a dict), then it definitely isn't a rich
            # revert.
            pass
        except KeyError:
            # response doesn't have a "result" key
            pass
        return response

    return middleware


MIDDLEWARE = [{"layer": 0, "function": rich_revert_handler}]
