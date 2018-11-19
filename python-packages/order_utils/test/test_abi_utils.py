"""Tests of 0x.abi_utils."""

import pytest

from zero_ex.dev_utils.abi_utils import (
    elementary_name,
    event_id,
    method_id,
    parse_signature,
    simple_encode,
)


def test_parse_signature_type_error():
    """Test that passing in wrong types raises TypeError."""
    with pytest.raises(TypeError):
        parse_signature(123)


def test_parse_signature_bad_input():
    """Test that passing a non-signature string raises a ValueError."""
    with pytest.raises(ValueError):
        parse_signature("a string that's not even close to a signature")


def test_elementary_name_type_error():
    """Test that passing in wrong types raises TypeError."""
    with pytest.raises(TypeError):
        elementary_name(123)


def test_event_id_type_error():
    """Test that passing in wrong types raises TypeError."""
    with pytest.raises(TypeError):
        event_id(123, [])

    with pytest.raises(TypeError):
        event_id("valid string", 123)


def test_method_id_type_error():
    """Test that passing in wrong types raises TypeError."""
    with pytest.raises(TypeError):
        method_id(123, [])

    with pytest.raises(TypeError):
        method_id("ERC20Token", 123)


def test_simple_encode_type_error():
    """Test that passing in wrong types raises TypeError."""
    with pytest.raises(TypeError):
        simple_encode(123)
