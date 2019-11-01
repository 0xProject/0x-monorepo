"""0x JSON schemas and associated utilities.

Setup
-----

Install the package with pip::

    pip install 0x-json-schemas

"""

from os import path
import json
from typing import Mapping

from pkg_resources import resource_string
import jsonschema
from stringcase import snakecase


class _LocalRefResolver(jsonschema.RefResolver):
    """Resolve package-local JSON schema id's."""

    def __init__(self):
        """Initialize a new instance."""
        jsonschema.RefResolver.__init__(self, "", "")

    @staticmethod
    def resolve_from_url(url: str) -> str:
        """Resolve the given URL.

        :param url: a string representing the URL of the JSON schema to fetch.
        :returns: a string representing the deserialized JSON schema
        :raises jsonschema.ValidationError: when the resource associated with
                   `url` does not exist.
        """
        ref = url.replace("file://", "")
        return json.loads(
            resource_string(
                "zero_ex.json_schemas",
                f"schemas/{snakecase(ref.lstrip('/'))}.json",
            )
        )


# Instantiate the `_LocalRefResolver()` only once so that `assert_valid()` can
# perform multiple schema validations without reading from disk the schema
# every time.
_LOCAL_RESOLVER = _LocalRefResolver()


def assert_valid(data: Mapping, schema_id: str) -> None:
    """Validate the given `data` against the specified `schema`.

    :param data: Python dictionary to be validated as a JSON object.
    :param schema_id: id property of the JSON schema to validate against.  Must
        be one of those listed in `the 0x JSON schema files
        <https://github.com/0xProject/0x-monorepo/tree/development/packages/json-schemas/schemas>`_.

    Raises an exception if validation fails.

    >>> from zero_ex.json_schemas import assert_valid
    >>> from zero_ex.contract_addresses import chain_to_addresses, ChainId
    >>> from zero_ex.order_utils import asset_data_utils
    >>> from eth_utils import remove_0x_prefix
    >>> import random
    >>> from datetime import datetime, timedelta
    >>> assert_valid(
    ...     {'makerAddress': '0x5409ed021d9299bf6814279a6a1411a7e866a631',
    ...      'takerAddress': '0x0000000000000000000000000000000000000000',
    ...      'senderAddress': '0x0000000000000000000000000000000000000000',
    ...      'exchangeAddress': '0x4f833a24e1f95d70f028921e27040ca56e09ab0b',
    ...      'feeRecipientAddress': (
    ...          '0x0000000000000000000000000000000000000000'
    ...      ),
    ...      'makerAssetData': (
    ...          chain_to_addresses(ChainId.MAINNET).zrx_token
    ...      ),
    ...      'takerAssetData': (
    ...          chain_to_addresses(ChainId.MAINNET).ether_token
    ...      ),
    ...      'salt': random.randint(1, 100000000000000000),
    ...      'makerFee': 0,
    ...      'makerFeeAssetData': '0x' + '00'*20,
    ...      'takerFee': 0,
    ...      'takerFeeAssetData': '0x' + '00'*20,
    ...      'makerAssetAmount': 1000000000000000000,
    ...      'takerAssetAmount': 500000000000000000000,
    ...      'expirationTimeSeconds': round(
    ...          (datetime.utcnow() + timedelta(days=1)).timestamp()
    ...      ),
    ...      'chainId': 50
    ...     },
    ...     "/orderSchema"
    ... )
    """
    _, schema = _LOCAL_RESOLVER.resolve(schema_id)
    jsonschema.validate(data, schema, resolver=_LOCAL_RESOLVER)


def assert_valid_json(data: str, schema_id: str) -> None:
    """Validate the given `data` against the specified `schema`.

    :param data: JSON string to be validated.
    :param schema_id: id property of the JSON schema to validate against.  Must
        be one of those listed in `the 0x JSON schema files
        <https://github.com/0xProject/0x-monorepo/tree/development/packages/json-schemas/schemas>`_.

    Raises an exception if validation fails.

    >>> assert_valid_json(
    ...     '''{
    ...         "v": 27,
    ...         "r": "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
    ...         "s": "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
    ...     }''',
    ...     '/ecSignatureSchema',
    ... )
    """  # noqa: E501 (line too long)
    assert_valid(json.loads(data), schema_id)
