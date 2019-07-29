"""Tests for :class:`ContractMethod`."""

import pytest

from zero_ex.contract_addresses import NETWORK_TO_ADDRESSES, NetworkId
from zero_ex.contract_wrappers._base_contract_wrapper import ContractMethod


@pytest.fixture(scope="module")
def contract_wrapper(ganache_provider):
    """Get a ContractMethod instance for testing."""
    return ContractMethod(
        provider=ganache_provider,
        contract_address=NETWORK_TO_ADDRESSES[NetworkId.GANACHE].ether_token,
    )
