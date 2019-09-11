"""Addresses at which the 0x smart contracts have been deployed.

Setup
-----

Install the package with pip::

    pip install 0x-contract-addresses

"""

from enum import Enum
from typing import Dict, NamedTuple


class ContractAddresses(NamedTuple):
    """An abstract record listing all the contracts that have addresses."""

    erc20_proxy: str
    """Address of the ERC20Proxy contract."""

    erc721_proxy: str
    """Address of the ERC20Proxy contract."""

    erc1155_proxy: str
    """Address of the ERC1155Proxy contract."""

    zrx_token: str
    """Address of the ZRX token contract."""

    ether_token: str
    """Address of the WETH token contract."""

    exchange: str
    """Address of the Exchange contract."""

    asset_proxy_owner: str
    """Address of the AssetProxyOwner contract."""

    forwarder: str
    """Address of the Forwarder contract."""

    order_validator: str
    """Address of the OrderValidator contract."""

    coordinator_registry: str
    """Address of the CoordinatorRegistry contract."""

    coordinator: str
    """Address of the Coordinator contract."""

    dev_utils: str
    """Address of the DevUtils contract."""


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


NETWORK_TO_ADDRESSES: Dict[NetworkId, ContractAddresses] = {
    NetworkId.MAINNET: ContractAddresses(  # nosec
        erc20_proxy="0x95e6f48254609a6ee006f7d493c8e5fb97094cef",
        erc721_proxy="0xefc70a1b18c432bdc64b596838b4d138f6bc6cad",
        zrx_token="0xe41d2489571d322189246dafa5ebde1f4699f498",
        ether_token="0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
        exchange="0x080bf510fcbf18b91105470639e9561022937712",
        asset_proxy_owner="0xdffe798c7172dd6deb32baee68af322e8f495ce0",
        forwarder="0x76481caa104b5f6bccb540dae4cefaf1c398ebea",
        order_validator="0xa09329c6003c9a5402102e226417738ee22cf1f2",
        coordinator_registry="0x45797531b873fd5e519477a070a955764c1a5b07",
        coordinator="0xa14857e8930acd9a882d33ec20559beb5479c8a6",
        erc1155_proxy="0x7eefbd48fd63d441ec7435d024ec7c5131019add",
        dev_utils="0x92d9a4d50190ae04e03914db2ee650124af844e6",
    ),
    NetworkId.ROPSTEN: ContractAddresses(  # nosec
        erc20_proxy="0xb1408f4c245a23c31b98d2c626777d4c0d766caa",
        erc721_proxy="0xe654aac058bfbf9f83fcaee7793311dd82f6ddb4",
        zrx_token="0xff67881f8d12f372d91baae9752eb3631ff0ed00",
        ether_token="0xc778417e063141139fce010982780140aa0cd5ab",
        exchange="0xbff9493f92a3df4b0429b6d00743b3cfb4c85831",
        asset_proxy_owner="0xf5fa5b5fed2727a0e44ac67f6772e97977aa358b",
        forwarder="0x1ebdc9758e85c1c6a85af06cc96cf89000a31913",
        order_validator="0x90431a90516ab49af23a0530e04e8c7836e7122f",
        coordinator_registry="0x403cc23e88c17c4652fb904784d1af640a6722d9",
        coordinator="0x2ba02e03ee0029311e0f43715307870a3e701b53",
        erc1155_proxy="0x19bb6caa3bc34d39e5a23cedfa3e6c7e7f3c931d",
        dev_utils="0x3e0b46bad8e374e4a110c12b832cb120dbe4a479",
    ),
    NetworkId.RINKEBY: ContractAddresses(  # nosec
        exchange="0xbff9493f92a3df4b0429b6d00743b3cfb4c85831",
        erc20_proxy="0x2f5ae4f6106e89b4147651688a92256885c5f410",
        erc721_proxy="0x7656d773e11ff7383a14dcf09a9c50990481cd10",
        zrx_token="0x8080c7e4b81ecf23aa6f877cfbfd9b0c228c6ffa",
        ether_token="0xc778417e063141139fce010982780140aa0cd5ab",
        asset_proxy_owner="0xe1703da878afcebff5b7624a826902af475b9c03",
        forwarder="0x1ebdc9758e85c1c6a85af06cc96cf89000a31913",
        order_validator="0x0c5173a51e26b29d6126c686756fb9fbef71f762",
        coordinator_registry="0x1084b6a398e47907bae43fec3ff4b677db6e4fee",
        coordinator="0x2ba02e03ee0029311e0f43715307870a3e701b53",
        erc1155_proxy="0x19bb6caa3bc34d39e5a23cedfa3e6c7e7f3c931d",
        dev_utils="0x2d4a9abda7b8b3605c8dbd34e3550a7467c78287'",
    ),
    NetworkId.KOVAN: ContractAddresses(  # nosec
        erc20_proxy="0xf1ec01d6236d3cd881a0bf0130ea25fe4234003e",
        erc721_proxy="0x2a9127c745688a165106c11cd4d647d2220af821",
        zrx_token="0x2002d3812f58e35f0ea1ffbf80a75a38c32175fa",
        ether_token="0xd0a1e359811322d97991e03f863a0c30c2cf029c",
        exchange="0x30589010550762d2f0d06f650d8e8b6ade6dbf4b",
        asset_proxy_owner="0x2c824d2882baa668e0d5202b1e7f2922278703f8",
        forwarder="0x1ebdc9758e85c1c6a85af06cc96cf89000a31913",
        order_validator="0xb389da3d204b412df2f75c6afb3d0a7ce0bc283d",
        coordinator_registry="0x09fb99968c016a3ff537bf58fb3d9fe55a7975d5",
        coordinator="0x2ba02e03ee0029311e0f43715307870a3e701b53",
        erc1155_proxy="0x64517fa2b480ba3678a2a3c0cf08ef7fd4fad36f",
        dev_utils="0x1e3616bc5144362f95d72de41874395567697e93",
    ),
    NetworkId.GANACHE: ContractAddresses(  # nosec
        exchange="0x48bacb9266a570d521063ef5dd96e61686dbe788",
        erc20_proxy="0x1dc4c1cefef38a777b15aa20260a54e584b16c48",
        erc721_proxy="0x1d7022f5b17d2f8b695918fb48fa1089c9f85401",
        erc1155_proxy="0x6a4a62e5a7ed13c361b176a5f62c2ee620ac0df8",
        zrx_token="0x871dd7c2b4b25e1aa18728e9d5f2af4c4e431f5c",
        ether_token="0x0b1ba0af832d7c05fd64161e0db78e85978e8082",
        asset_proxy_owner="0x8d42e38980ce74736c21c059b2240df09958d3c8",
        forwarder="0xaa86dda78e9434aca114b6676fc742a18d15a1cc",
        order_validator="0x4d3d5c850dd5bd9d6f4adda3dd039a3c8054ca29",
        coordinator_registry="0x1941ff73d1154774d87521d2d0aaad5d19c8df60",
        coordinator="0x0d8b0dd11f5d34ed41d556def5f841900d5b1c6b",
        dev_utils="0x38ef19fdf8e8415f18c307ed71967e19aac28ba1",
    ),
}
"""A mapping from instances of NetworkId to instances of ContractAddresses.

Addresses under NetworkId.Ganache are from our Ganache snapshot generated from
npm package @0x/migrations.

>>> NETWORK_TO_ADDRESSES[NetworkId.MAINNET].exchange
0x4f833a24e1f95d70f028921e27040ca56e09ab0b
"""
