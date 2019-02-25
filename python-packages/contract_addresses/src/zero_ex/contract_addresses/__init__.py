"""Addresses at which the 0x smart contracts have been deployed."""

from enum import Enum
from typing import Dict, NamedTuple


class ContractAddresses(NamedTuple):  # noqa
    """An abstract record listing all the contracts that have addresses."""

    erc20_proxy: str
    erc721_proxy: str
    zrx_token: str
    ether_token: str
    exchange: str
    asset_proxy_owner: str
    forwarder: str
    order_validator: str


class NetworkId(Enum):
    """Network names correlated to their network identification numbers.

    >>> NetworkId.MAINNET
    <NetworkId.MAINNET: 1>
    """

    MAINNET = 1
    ROPSTEN = 3
    RINKEBY = 4
    KOVAN = 42
    GANACHE = 50


NETWORK_TO_ADDRESSES: Dict[NetworkId, ContractAddresses] = {
    NetworkId.MAINNET: ContractAddresses(
        erc20_proxy="0x2240dab907db71e64d3e0dba4800c83b5c502d4e",
        erc721_proxy="0x208e41fb445f1bb1b6780d58356e81405f3e6127",
        zrx_token="0xe41d2489571d322189246dafa5ebde1f4699f498",
        ether_token="0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
        exchange="0x4f833a24e1f95d70f028921e27040ca56e09ab0b",
        asset_proxy_owner="0x17992e4ffb22730138e4b62aaa6367fa9d3699a6",
        forwarder="0x5468a1dc173652ee28d249c271fa9933144746b1",
        order_validator="0x9463e518dea6810309563c81d5266c1b1d149138",
    ),
    NetworkId.ROPSTEN: ContractAddresses(
        erc20_proxy="0xb1408f4c245a23c31b98d2c626777d4c0d766caa",
        erc721_proxy="0xe654aac058bfbf9f83fcaee7793311dd82f6ddb4",
        zrx_token="0xff67881f8d12f372d91baae9752eb3631ff0ed00",
        ether_token="0xc778417e063141139fce010982780140aa0cd5ab",
        exchange="0x4530c0483a1633c7a1c97d2c53721caff2caaaaf",
        asset_proxy_owner="0xf5fa5b5fed2727a0e44ac67f6772e97977aa358b",
        forwarder="0x2240dab907db71e64d3e0dba4800c83b5c502d4e",
        order_validator="0x90431a90516ab49af23a0530e04e8c7836e7122f",
    ),
    NetworkId.RINKEBY: ContractAddresses(
        exchange="0xbce0b5f6eb618c565c3e5f5cd69652bbc279f44e",
        erc20_proxy="0x2f5ae4f6106e89b4147651688a92256885c5f410",
        erc721_proxy="0x7656d773e11ff7383a14dcf09a9c50990481cd10",
        zrx_token="0x8080c7e4b81ecf23aa6f877cfbfd9b0c228c6ffa",
        ether_token="0xc778417e063141139fce010982780140aa0cd5ab",
        asset_proxy_owner="0xe1703da878afcebff5b7624a826902af475b9c03",
        forwarder="0x2d40589abbdee84961f3a7656b9af7adb0ee5ab4",
        order_validator="0x0c5173a51e26b29d6126c686756fb9fbef71f762",
    ),
    NetworkId.KOVAN: ContractAddresses(
        erc20_proxy="0xf1ec01d6236d3cd881a0bf0130ea25fe4234003e",
        erc721_proxy="0x2a9127c745688a165106c11cd4d647d2220af821",
        zrx_token="0x2002d3812f58e35f0ea1ffbf80a75a38c32175fa",
        ether_token="0xd0a1e359811322d97991e03f863a0c30c2cf029c",
        exchange="0x35dd2932454449b14cee11a94d3674a936d5d7b2",
        asset_proxy_owner="0x2c824d2882baa668e0d5202b1e7f2922278703f8",
        forwarder="0x17992e4ffb22730138e4b62aaa6367fa9d3699a6",
        order_validator="0xb389da3d204b412df2f75c6afb3d0a7ce0bc283d",
    ),
    NetworkId.GANACHE: ContractAddresses(
        exchange="0x48bacb9266a570d521063ef5dd96e61686dbe788",
        erc20_proxy="0x1dc4c1cefef38a777b15aa20260a54e584b16c48",
        erc721_proxy="0x1d7022f5b17d2f8b695918fb48fa1089c9f85401",
        zrx_token="0x871dd7c2b4b25e1aa18728e9d5f2af4c4e431f5c",
        ether_token="0x0b1ba0af832d7c05fd64161e0db78e85978e8082",
        asset_proxy_owner="0x34d402f14d58e001d8efbe6585051bf9706aa064",
        forwarder="0x6000eca38b8b5bba64986182fe2a69c57f6b5414",
        order_validator="0x32eecaf51dfea9618e9bc94e9fbfddb1bbdcba15",
    ),
}
"""A mapping from instances of NetworkId to instances of ContractAddresses.

Addresses under NetworkId.Ganache are from our Ganache snapshot generated from
migrations.

>>> NETWORK_TO_ADDRESSES[NetworkId.MAINNET].exchange
0x4f833a24e1f95d70f028921e27040ca56e09ab0b
"""
