"""JSON schemas and associated utilities."""

from os import path
import json
from typing import Mapping

from pkg_resources import resource_string
import jsonschema


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
    class LocalRefResolver(jsonschema.RefResolver):
        """Resolve package-local JSON schema id's."""

        def __init__(self):
            self.ref_to_file = {
                "/addressSchema": "address_schema.json",
                "/hexSchema": "hex_schema.json",
                "/orderSchema": "order_schema.json",
                "/wholeNumberSchema": "whole_number_schema.json",
                "/ECSignature": "ec_signature_schema.json",
                "/ecSignatureParameterSchema": (
                    "ec_signature_parameter_schema.json" + ""
                ),
            }
            jsonschema.RefResolver.__init__(self, "", "")

        def resolve_from_url(self, url):
            """Resolve the given URL."""
            ref = url.replace("file://", "")
            if ref in self.ref_to_file:
                return json.loads(
                    resource_string(
                        "zero_ex.json_schemas",
                        f"schemas/{self.ref_to_file[ref]}",
                    )
                )
            raise jsonschema.ValidationError(
                f"Unknown ref '{ref}'. "
                + f"Known refs: {list(self.ref_to_file.keys())}."
            )

    resolver = LocalRefResolver()
    jsonschema.validate(
        data, resolver.resolve_from_url(schema_id), resolver=resolver
    )
