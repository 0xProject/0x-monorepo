"""Fixtures for pytest"""

import pytest
from eth_utils import remove_0x_prefix, to_checksum_address
from web3 import Web3
from zero_ex.order_utils import asset_data_utils as adu
from zero_ex.contract_addresses import NETWORK_TO_ADDRESSES, NetworkId
from zero_ex.contract_artifacts import abi_by_name


@pytest.fixture
def ganache_provider():
    return Web3.HTTPProvider(endpoint_uri="http://127.0.0.1:8545")


@pytest.fixture
def accounts(ganache_provider):
    return Web3(ganache_provider).eth.accounts


@pytest.fixture
def current_time(ganache_provider):
    return Web3(ganache_provider).eth.getBlock("latest").timestamp


@pytest.fixture
def get_tx_receipt(ganache_provider):
    return Web3(ganache_provider).eth.getTransactionReceipt


@pytest.fixture
def erc20_proxy_address():
    return NETWORK_TO_ADDRESSES[NetworkId.GANACHE].erc20_proxy


@pytest.fixture
def weth_address():
    return NETWORK_TO_ADDRESSES[NetworkId.GANACHE].ether_token


@pytest.fixture
def weth_instance(ganache_provider, weth_address):
    return Web3(ganache_provider).eth.contract(
        address=to_checksum_address(weth_address), abi=abi_by_name("WETH9")
    )


@pytest.fixture
def zrx_asset_data(zrx_address):
    return bytes.fromhex(
        remove_0x_prefix(adu.encode_erc20_asset_data(zrx_address))
    )


@pytest.fixture
def weth_asset_data(weth_address):
    return bytes.fromhex(
        remove_0x_prefix(adu.encode_erc20_asset_data(weth_address))
    )
