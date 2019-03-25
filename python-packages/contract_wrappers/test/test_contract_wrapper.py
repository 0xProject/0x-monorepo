"""
Tests for :class:`ContractWrapper`.
"""

import pytest
from eth_utils import to_checksum_address

from zero_ex.contract_artifacts import abi_by_name
from zero_ex.contract_wrappers import ContractWrapper


@pytest.fixture(scope="module")
def contract_wrapper(ganache_provider):
    """Get a ContractWrapper instance for testing."""
    return ContractWrapper(provider=ganache_provider)


def test_contract_wrapper__get_accounts(
    accounts, contract_wrapper
):  # pylint: disable=redefined-outer-name
    """Test getting list of accounts from ContractWrapper instance."""
    assert contract_wrapper.get_accounts() == accounts


def test_contract_wrapper__get_default_account(
    accounts, contract_wrapper
):  # pylint: disable=redefined-outer-name
    """Test getting default account from ContractWrapper instance."""
    assert contract_wrapper.get_default_account() == accounts[0]


def test_contract_wrapper__execute_method(
    accounts,
    contract_wrapper,  # pylint: disable=redefined-outer-name
    erc20_proxy_address,
    weth_address,  # pylint: disable=redefined-outer-name
):
    """Test :function:`ContractWrapper.execute` method."""
    acc1_allowance = contract_wrapper.execute_method(
        address=weth_address,
        abi=abi_by_name("WETH9"),
        method="allowance",
        view_only=True,
        args=(
            to_checksum_address(accounts[3]),
            to_checksum_address(erc20_proxy_address),
        ),
    )
    assert acc1_allowance == 0

    with pytest.raises(Exception):
        contract_wrapper.execute_method(
            address=weth_address,
            abi=abi_by_name("WETH9"),
            method="send",
            view_only=True,
            args=[
                to_checksum_address(accounts[3]),
                to_checksum_address(erc20_proxy_address),
            ],
        )
