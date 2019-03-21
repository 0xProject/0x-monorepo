from decimal import Decimal


MAX_ALLOWANCE = "{:.0f}".format(Decimal(2) ** 256 - 1)


def test_erc20_wrapper__balance_of(
    accounts, erc20_wrapper, weth_address, zrx_address
):
    acc1_weth_balance = erc20_wrapper.balance_of(weth_address, accounts[0])
    acc1_zrx_balance = erc20_wrapper.balance_of(zrx_address, accounts[0])
    acc2_zrx_balance = erc20_wrapper.balance_of(zrx_address, accounts[1])

    assert acc1_weth_balance > 0
    assert acc1_zrx_balance > 0
    assert acc2_zrx_balance > 0


def test_erc20_wrapper__approve(
    accounts, erc20_proxy_address, erc20_wrapper, zrx_address
):
    erc20_wrapper.approve(
        zrx_address,
        erc20_proxy_address,
        MAX_ALLOWANCE,
        tx_opts={"from_": accounts[0]},
    )

    erc20_wrapper.approve(
        zrx_address,
        erc20_proxy_address,
        MAX_ALLOWANCE,
        tx_opts={"from_": accounts[1]},
    )

    acc_1_zrx_allowance = erc20_wrapper.allowance(
        zrx_address, accounts[0], erc20_proxy_address
    )

    acc_2_zrx_allowance = erc20_wrapper.allowance(
        zrx_address, accounts[1], erc20_proxy_address
    )

    assert acc_1_zrx_allowance == int(MAX_ALLOWANCE)
    assert acc_2_zrx_allowance == int(MAX_ALLOWANCE)
