"""JSON schemas and associated utilities."""

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

    >>> assert_valid(
    ...     {'v': 27, 'r': '0x'+'f'*64, 's': '0x'+'f'*64},
    ...     '/ecSignatureSchema',
    ... )
    """
    # noqa

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
    ...     r'''{
    ...         "v": 27,
    ...         "r": "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
    ...         "s": "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
    ...     }''',
    ...     '/ecSignatureSchema',
    ... )
    """  # noqa: E501 (line too long)
    assert_valid(json.loads(data), schema_id)
