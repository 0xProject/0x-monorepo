import pytest
from eth_utils import to_checksum_address
from zero_ex.contract_artifacts import abi_by_name
from zero_ex.contract_wrappers.contract_wrapper import ContractWrapper


@pytest.fixture
def contract_wrapper(ganache_provider):
    return ContractWrapper(provider=ganache_provider)


def test_contract_wrapper__get_accounts(accounts, contract_wrapper):
    assert contract_wrapper.get_accounts() == accounts


def test_contract_wrapper__get_default_account(accounts, contract_wrapper):
    assert contract_wrapper.get_default_account() == accounts[0]


def test_contract_wrapper__execute_method(
    accounts, contract_wrapper, erc20_proxy_address, weth_address
):
    acc1_allowance = contract_wrapper.execute_method(
        address=weth_address,
        abi=abi_by_name("WETH9"),
        method="allowance",
        validate_only=True,
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
            validate_only=True,
            args=[
                to_checksum_address(accounts[3]),
                to_checksum_address(erc20_proxy_address),
            ],
        )
