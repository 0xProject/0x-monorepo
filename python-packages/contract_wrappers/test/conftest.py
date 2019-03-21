"""Fixtures for pytest"""

import pytest
from eth_utils import to_checksum_address, remove_0x_prefix
from hexbytes import HexBytes
from web3 import Web3
from web3.middleware import construct_sign_and_send_raw_middleware
from zero_ex.order_utils import asset_data_utils as adu
from zero_ex.contract_addresses import NETWORK_TO_ADDRESSES, NetworkId


@pytest.fixture
def local_account_2():
    return to_checksum_address("0x6ecbe1db9ef729cbe972c83fb886247691fb6beb")

@pytest.fixture
def local_private_key_2():
    return "5d862464fe9303452126c8bc94274b8c5f9874cbd219789b3eb2128075a76f72"
    
@pytest.fixture
def local_account_1():
    return to_checksum_address("0x5409ed021d9299bf6814279a6a1411a7e866a631")

@pytest.fixture
def local_private_key_1():
    return "f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e0164837257d"

@pytest.fixture
def ganache_rpc_url():
    return "http://127.0.0.1:8545"

@pytest.fixture
def ganache_provider(ganache_rpc_url):
    return Web3.HTTPProvider(endpoint_uri=ganache_rpc_url)

@pytest.fixture
def zrx_asset_data_ganache():
    return bytes.fromhex(remove_0x_prefix(
        adu.encode_erc20_asset_data(NETWORK_TO_ADDRESSES[NetworkId.GANACHE].zrx_token)
    ))

@pytest.fixture
def weth_asset_data_ganache():
    return bytes.fromhex(remove_0x_prefix(
        adu.encode_erc20_asset_data(NETWORK_TO_ADDRESSES[NetworkId.GANACHE].ether_token)
    ))