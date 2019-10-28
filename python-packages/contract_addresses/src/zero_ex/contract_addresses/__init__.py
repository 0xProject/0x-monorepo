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


NULL_ADDRESS = "0x" + "00" * 20


NETWORK_TO_ADDRESSES: Dict[NetworkId, ContractAddresses] = {
    NetworkId.MAINNET: ContractAddresses(  # nosec
        exchange_v2="0x080bf510fcbf18b91105470639e9561022937712",
        exchange=NULL_ADDRESS,
        erc20_proxy="0x95e6f48254609a6ee006f7d493c8e5fb97094cef",
        erc721_proxy="0xefc70a1b18c432bdc64b596838b4d138f6bc6cad",
        forwarder="0x76481caa104b5f6bccb540dae4cefaf1c398ebea",
        order_validator="0xa09329c6003c9a5402102e226417738ee22cf1f2",
        zrx_token="0xe41d2489571d322189246dafa5ebde1f4699f498",
        ether_token="0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
        asset_proxy_owner="0xdffe798c7172dd6deb32baee68af322e8f495ce0",
        zero_ex_governor=NULL_ADDRESS,
        dutch_auction=NULL_ADDRESS,
        coordinator_registry="0x45797531b873fd5e519477a070a955764c1a5b07",
        coordinator=NULL_ADDRESS,
        multi_asset_proxy="0xef701d5389ae74503d633396c4d654eabedc9d78",
        static_call_proxy="0x3517b88c19508c08650616019062b898ab65ed29",
        erc1155_proxy="0x7eefbd48fd63d441ec7435d024ec7c5131019add",
        zrx_vault=NULL_ADDRESS,
        staking=NULL_ADDRESS,
        staking_proxy=NULL_ADDRESS,
        dev_utils=NULL_ADDRESS,
        erc20_bridge_proxy=NULL_ADDRESS,
    ),
    NetworkId.ROPSTEN: ContractAddresses(  # nosec
        erc20_proxy="0xb1408f4c245a23c31b98d2c626777d4c0d766caa",
        erc721_proxy="0xe654aac058bfbf9f83fcaee7793311dd82f6ddb4",
        zrx_token="0xff67881f8d12f372d91baae9752eb3631ff0ed00",
        ether_token="0xc778417e063141139fce010982780140aa0cd5ab",
        exchange_v2="0xbff9493f92a3df4b0429b6d00743b3cfb4c85831",
        exchange="0xc56388332ddfc98701fefed94535100c6166956c",
        asset_proxy_owner=NULL_ADDRESS,
        zero_ex_governor="0xdcf20f7b447d51f2b3e5499b7f6cbbf7295a5d26",
        forwarder="0x31c3890769ed3bb30b2781fd238a5bb7ecfeb7c8",
        order_validator=NULL_ADDRESS,
        dutch_auction=NULL_ADDRESS,
        coordinator_registry="0x403cc23e88c17c4652fb904784d1af640a6722d9",
        coordinator=NULL_ADDRESS,
        multi_asset_proxy="0xab8fbd189c569ccdee3a4d929bb7f557be4028f6",
        static_call_proxy="0xe1b97e47aa3796276033a5341e884d2ba46b6ac1",
        erc1155_proxy="0x19bb6caa3bc34d39e5a23cedfa3e6c7e7f3c931d",
        dev_utils="0x3dfd5157eec10eb1a357c1074de30787ce92cb43",
        zrx_vault="0xffd161026865ad8b4ab28a76840474935eec4dfa",
        staking="0x3f46b98061a3e1e1f41dff296ec19402c298f8a9",
        staking_proxy="0xfaabcee42ab6b9c649794ac6c133711071897ee9",
        erc20_bridge_proxy="0x599b340b5045436a99b1f0c718d30f5a0c8519dd",
    ),
    NetworkId.RINKEBY: ContractAddresses(  # nosec
        exchange_v2="",
        exchange="0xbff9493f92a3df4b0429b6d00743b3cfb4c85831",
        erc20_proxy="0x2f5ae4f6106e89b4147651688a92256885c5f410",
        erc721_proxy="0x7656d773e11ff7383a14dcf09a9c50990481cd10",
        zrx_token="0x8080c7e4b81ecf23aa6f877cfbfd9b0c228c6ffa",
        ether_token="0xc778417e063141139fce010982780140aa0cd5ab",
        asset_proxy_owner=NULL_ADDRESS,
        zero_ex_governor="0x5d751aa855a1aee5fe44cf5350ed25b5727b66ae",
        forwarder="0xc6db36aeb96a2eb52079c342c3a980c83dea8e3c",
        order_validator=NULL_ADDRESS,
        dutch_auction=NULL_ADDRESS,
        coordinator_registry="0x1084b6a398e47907bae43fec3ff4b677db6e4fee",
        coordinator=NULL_ADDRESS,
        multi_asset_proxy="0xb34cde0ad3a83d04abebc0b66e75196f22216621",
        static_call_proxy="0xe1b97e47aa3796276033a5341e884d2ba46b6ac1",
        erc1155_proxy="0x19bb6caa3bc34d39e5a23cedfa3e6c7e7f3c931d",
        dev_utils="0xcfc66b8e75e8f075c3e1d61e6487d73dfe35d808",
        zrx_vault="0xa5bf6ac73bc40790fc6ffc9dbbbce76c9176e224",
        staking="0x344d4f661a82afdd84d31456c291822d90d5dc3a",
        staking_proxy="0xc6ad5277ea225ac05e271eb14a7ebb480cd9dd9f",
        erc20_bridge_proxy="0x31b8653642110f17bdb1f719901d7e7d49b08141",
    ),
    NetworkId.KOVAN: ContractAddresses(  # nosec
        erc20_proxy="0xf1ec01d6236d3cd881a0bf0130ea25fe4234003e",
        erc721_proxy="0x2a9127c745688a165106c11cd4d647d2220af821",
        zrx_token="0x2002d3812f58e35f0ea1ffbf80a75a38c32175fa",
        ether_token="0xd0a1e359811322d97991e03f863a0c30c2cf029c",
        exchange_v2="0x30589010550762d2f0d06f650d8e8b6ade6dbf4b",
        exchange="0xca8b1626b3b7a0da722ca9f264c4630c7d34d3b8",
        asset_proxy_owner=NULL_ADDRESS,
        zero_ex_governor="0x3654e5363cd75c8974c76208137df9691e820e97",
        forwarder="0x1ebdc9758e85c1c6a85af06cc96cf89000a31913",
        order_validator=NULL_ADDRESS,
        dutch_auction=NULL_ADDRESS,
        coordinator_registry="0x09fb99968c016a3ff537bf58fb3d9fe55a7975d5",
        coordinator=NULL_ADDRESS,
        multi_asset_proxy="0xf6313a772c222f51c28f2304c0703b8cf5428fd8",
        static_call_proxy="0x48e94bdb9033640d45ea7c721e25f380f8bffa43",
        erc1155_proxy="0x64517fa2b480ba3678a2a3c0cf08ef7fd4fad36f",
        dev_utils="0xb1863ac46ae23ec55d6eeb8ecc8815655ee638a8",
        zrx_vault="0xf36eabdfe986b35b62c8fd5a98a7f2aebb79b291",
        staking="0x89150f5eed50b3528f79bfb539f29d727f92821c",
        staking_proxy="0xbab9145f1d57cd4bb0c9aa2d1ece0a5b6e734d34",
        erc20_bridge_proxy="0xfb2dd2a1366de37f7241c83d47da58fd503e2c64",
    ),
    NetworkId.GANACHE: ContractAddresses(  # nosec
        erc20_proxy="0x1dc4c1cefef38a777b15aa20260a54e584b16c48",
        erc721_proxy="0x1d7022f5b17d2f8b695918fb48fa1089c9f85401",
        erc1155_proxy="0x6a4a62e5a7ed13c361b176a5f62c2ee620ac0df8",
        zrx_token="0x871dd7c2b4b25e1aa18728e9d5f2af4c4e431f5c",
        ether_token="0x0b1ba0af832d7c05fd64161e0db78e85978e8082",
        exchange_v2="0x48bacb9266a570d521063ef5dd96e61686dbe788",
        exchange="0x48bacb9266a570d521063ef5dd96e61686dbe788",
        zero_ex_governor=NULL_ADDRESS,
        asset_proxy_owner=NULL_ADDRESS,
        forwarder=NULL_ADDRESS,
        order_validator=NULL_ADDRESS,
        dutch_auction=NULL_ADDRESS,
        coordinator_registry="0x1941ff73d1154774d87521d2d0aaad5d19c8df60",
        coordinator=NULL_ADDRESS,
        multi_asset_proxy="0xcfc18cec799fbd1793b5c43e773c98d4d61cc2db",
        static_call_proxy="0x6dfff22588be9b3ef8cf0ad6dc9b84796f9fb45f",
        dev_utils="0x38ef19fdf8e8415f18c307ed71967e19aac28ba1",
        zrx_vault=NULL_ADDRESS,
        staking=NULL_ADDRESS,
        staking_proxy=NULL_ADDRESS,
        erc20_bridge_proxy=NULL_ADDRESS,
    ),
}
"""A mapping from instances of NetworkId to instances of ContractAddresses.

Addresses under NetworkId.Ganache are from our Ganache snapshot generated from
npm package @0x/migrations.

>>> NETWORK_TO_ADDRESSES[NetworkId.MAINNET].exchange
0x4f833a24e1f95d70f028921e27040ca56e09ab0b
"""
