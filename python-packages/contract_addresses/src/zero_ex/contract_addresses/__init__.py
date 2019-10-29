"""Addresses at which the 0x smart contracts have been deployed.

Setup
-----

Install the package with pip::

    pip install 0x-contract-addresses

"""

from enum import Enum
import json
from typing import Dict, NamedTuple

from pkg_resources import resource_string


class ContractAddresses(NamedTuple):
    """An abstract record listing all the contracts that have addresses."""

    erc20_proxy: str
    """Address of the ERC20Proxy contract."""

    erc721_proxy: str
    """Address of the ERC721Proxy contract."""

    zrx_token: str
    """Address of the ZRX token contract."""

    ether_token: str
    """Address of the WETH token contract."""

    exchange_v2: str
    """Address of the v2 Exchange contract."""

    exchange: str
    """Address of the v3 Exchange contract."""

    asset_proxy_owner: str
    """Address of the AssetProxyOwner contract."""

    zero_ex_governor: str
    """Address of the ZeroExGovernor contract."""

    forwarder: str
    """Address of the Forwarder contract."""

    order_validator: str
    """Address of the OrderValidator contract."""

    dutch_auction: str
    """Address of the DutchAuction contract."""

    coordinator_registry: str
    """Address of the CoordinatorRegistry contract."""

    coordinator: str
    """Address of the Coordinator contract."""

    multi_asset_proxy: str
    """Address of the MultiAssetProxy contract."""

    static_call_proxy: str
    """Address of the StaticCallProxy contract."""

    erc1155_proxy: str
    """Address of the ERC1155Proxy contract."""

    dev_utils: str
    """Address of the DevUtils contract."""

    zrx_vault: str
    """Address of the ZRXVault contract."""

    staking: str
    """Address of the Staking contract."""

    staking_proxy: str
    """Address of the StakingProxy contract."""

    erc20_bridge_proxy: str
    """Address of the ERC20BridgeProxy contract."""


class NetworkId(Enum):
    """Network names correlated to their network identification numbers.

    >>> NetworkId.MAINNET
    <NetworkId.MAINNET: 1>

    >>> NetworkId.MAINNET.value
    1
    """

    MAINNET = 1
    ROPSTEN = 3
    RINKEBY = 4
    KOVAN = 42
    GANACHE = 50


class _AddressCache:
    """A cache to facilitate lazy & singular loading of contract addresses."""

    # pylint: disable=too-few-public-methods

    # class data, not instance:
    _network_to_addresses: Dict[str, ContractAddresses] = {}

    @classmethod
    def network_to_addresses(cls, network_id: NetworkId):
        """Return the addresses for the given network ID.

        First tries to get data from the class level storage
        `_network_to_addresses`.  If it's not there, loads it from disk, stores
        it in the class data (for the next caller), and then returns it.
        """
        try:
            return cls._network_to_addresses[str(network_id.value)]
        except KeyError:
            cls._network_to_addresses = json.loads(
                resource_string("zero_ex.contract_addresses", "addresses.json")
            )
            return cls._network_to_addresses[str(network_id.value)]


def network_to_addresses(network_id: NetworkId) -> ContractAddresses:
    """Map a NetworkId to an instance of ContractAddresses.

    Addresses under NetworkId.Ganache are from our Ganache snapshot generated
    from npm package @0x/migrations.

    >>> network_to_addresses(NetworkId.MAINNET).exchange
    '0x...'
    """
    addresses = _AddressCache.network_to_addresses(network_id)

    return ContractAddresses(
        erc20_proxy=addresses["erc20Proxy"],
        erc721_proxy=addresses["erc721Proxy"],
        zrx_token=addresses["zrxToken"],
        ether_token=addresses["etherToken"],
        exchange_v2=addresses["exchangeV2"],
        exchange=addresses["exchange"],
        asset_proxy_owner=addresses["assetProxyOwner"],
        zero_ex_governor=addresses["zeroExGovernor"],
        forwarder=addresses["forwarder"],
        order_validator=addresses["orderValidator"],
        dutch_auction=addresses["dutchAuction"],
        coordinator_registry=addresses["coordinatorRegistry"],
        coordinator=addresses["coordinator"],
        multi_asset_proxy=addresses["multiAssetProxy"],
        static_call_proxy=addresses["staticCallProxy"],
        erc1155_proxy=addresses["erc1155Proxy"],
        dev_utils=addresses["devUtils"],
        zrx_vault=addresses["zrxVault"],
        staking=addresses["staking"],
        staking_proxy=addresses["stakingProxy"],
        erc20_bridge_proxy=addresses["erc20BridgeProxy"],
    )
