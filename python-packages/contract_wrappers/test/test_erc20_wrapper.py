"""Tests for ERC20Token wrapper."""

from decimal import Decimal

import pytest

from zero_ex.contract_addresses import network_to_addresses, NetworkId
from zero_ex.contract_wrappers import TxParams
from zero_ex.contract_wrappers.erc20_token import ERC20Token


MAX_ALLOWANCE = int("{:.0f}".format(Decimal(2) ** 256 - 1))


@pytest.fixture(scope="module")
def erc20_wrapper(ganache_provider):
    """Get an instance of ERC20Token wrapper class for testing."""
    return ERC20Token(
        ganache_provider, network_to_addresses(NetworkId.GANACHE).ether_token
    )


def test_erc20_wrapper__balance_of(
    accounts,
    erc20_wrapper,  # pylint: disable=redefined-outer-name
    weth_instance,  # pylint: disable=redefined-outer-name
):
    """Test getting baance of an account for an ERC20 token."""
    acc1_original_weth_balance = erc20_wrapper.balance_of.call(accounts[0])
    acc2_original_weth_balance = erc20_wrapper.balance_of.call(accounts[1])

    expected_difference = 1 * 10 ** 18

    weth_instance.functions.deposit().transact(
        {"from": accounts[0], "value": expected_difference}
    )
    weth_instance.functions.deposit().transact(
        {"from": accounts[1], "value": expected_difference}
    )
    acc1_weth_balance = erc20_wrapper.balance_of.call(accounts[0])
    acc2_weth_balance = erc20_wrapper.balance_of.call(accounts[1])

    assert (
        acc1_weth_balance - acc1_original_weth_balance == expected_difference
    )
    assert (
        acc2_weth_balance - acc2_original_weth_balance == expected_difference
    )


def test_erc20_wrapper__approve(
    accounts,
    erc20_proxy_address,
    erc20_wrapper,  # pylint: disable=redefined-outer-name
):
    """Test approving one account to spend balance from another account."""
    erc20_wrapper.approve.send_transaction(
        erc20_proxy_address,
        MAX_ALLOWANCE,
        tx_params=TxParams(from_=accounts[0]),
    )
    erc20_wrapper.approve.send_transaction(
        erc20_proxy_address,
        MAX_ALLOWANCE,
        tx_params=TxParams(from_=accounts[1]),
    )

    acc_1_weth_allowance = erc20_wrapper.allowance.call(
        accounts[0], erc20_proxy_address
    )
    acc_2_weth_allowance = erc20_wrapper.allowance.call(
        accounts[1], erc20_proxy_address
    )

    assert acc_1_weth_allowance == MAX_ALLOWANCE
    assert acc_2_weth_allowance == MAX_ALLOWANCE
