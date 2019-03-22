import pytest
from decimal import Decimal
from zero_ex.contract_wrappers.erc_20_wrapper import ERC20Wrapper


MAX_ALLOWANCE = "{:.0f}".format(Decimal(2) ** 256 - 1)


@pytest.fixture
def erc20_wrapper(ganache_provider):
    return ERC20Wrapper(ganache_provider)


def test_erc20_wrapper__balance_of(
    accounts, erc20_wrapper, weth_address, weth_instance
):
    acc1_original_weth_balance = erc20_wrapper.balance_of(weth_address, accounts[0])
    acc2_original_weth_balance = erc20_wrapper.balance_of(weth_address, accounts[1])

    expected_difference = 2 * 10 ** 18

    weth_instance.functions.deposit().transact(
        {"from": accounts[0], "value": expected_difference}
    )
    weth_instance.functions.deposit().transact(
        {"from": accounts[1], "value": expected_difference}
    )
    acc1_weth_balance = erc20_wrapper.balance_of(weth_address, accounts[0])
    acc2_weth_balance = erc20_wrapper.balance_of(weth_address, accounts[1])

    assert acc1_weth_balance - acc1_original_weth_balance == expected_difference
    assert acc2_weth_balance - acc2_original_weth_balance == expected_difference


def test_erc20_wrapper__approve(
    accounts, erc20_proxy_address, erc20_wrapper, weth_address
):
    erc20_wrapper.approve(
        weth_address,
        erc20_proxy_address,
        MAX_ALLOWANCE,
        tx_opts={"from_": accounts[0]},
    )
    erc20_wrapper.approve(
        weth_address,
        erc20_proxy_address,
        MAX_ALLOWANCE,
        tx_opts={"from_": accounts[1]},
    )

    acc_1_weth_allowance = erc20_wrapper.allowance(
        weth_address, accounts[0], erc20_proxy_address
    )
    acc_2_weth_allowance = erc20_wrapper.allowance(
        weth_address, accounts[1], erc20_proxy_address
    )

    assert acc_1_weth_allowance == int(MAX_ALLOWANCE)
    assert acc_2_weth_allowance == int(MAX_ALLOWANCE)
