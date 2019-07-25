"""Tests for :class:`BaseContractWrapper`."""

import pytest

from zero_ex.contract_addresses import NETWORK_TO_ADDRESSES, NetworkId
from zero_ex.contract_wrappers._base_contract_wrapper import (
    BaseContractWrapper,
)


@pytest.fixture(scope="module")
def contract_wrapper(ganache_provider):
    """Get a BaseContractWrapper instance for testing."""
    return BaseContractWrapper(
        provider=ganache_provider,
        contract_address=NETWORK_TO_ADDRESSES[NetworkId.GANACHE].ether_token,
    )
