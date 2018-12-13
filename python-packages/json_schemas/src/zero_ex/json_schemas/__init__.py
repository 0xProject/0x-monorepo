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
    def _ref_to_file(ref: str) -> str:
        """Translate a JSON schema ref to its corresponding file name.

        >>> _LocalRefResolver._ref_to_file("/addressSchema")
        'address_schema.json'
        """
        _ref = ref.lstrip("/")

        # handle weird special cases
        _ref = _ref.replace("ECSignature", "EcSignature")
        _ref = _ref.replace("Schema", "")

        return f"{snakecase(_ref)}_schema.json"

    def resolve_from_url(self, url: str) -> str:
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
                f"schemas/{_LocalRefResolver._ref_to_file(ref)}",
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
    ...     '/ECSignature',
    ... )
    """
    # noqa

    _, schema = _LOCAL_RESOLVER.resolve(schema_id)
    jsonschema.validate(data, schema, resolver=_LOCAL_RESOLVER)
