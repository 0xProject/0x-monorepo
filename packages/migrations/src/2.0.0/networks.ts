import { BigNumber } from '@0xproject/utils';

import { constants } from '../utils/constants';
import { V2NetworkConfig } from '../utils/types';

import { artifacts } from './artifacts';

export const networks: V2NetworkConfig = {
    mainnet: {
        rpcUrl: constants.MAINNET_RPC_URL,
        exchange: artifacts.Exchange.networks[constants.MAINNET_NETWORK_ID].address,
        erc20Proxy: artifacts.ERC20Proxy.networks[constants.MAINNET_NETWORK_ID].address,
        erc721Proxy: artifacts.ERC721Proxy.networks[constants.MAINNET_NETWORK_ID].address,
        assetProxyOwner: artifacts.AssetProxyOwner.networks[constants.MAINNET_NETWORK_ID].address,
        zrx: artifacts.ZRX.networks[constants.MAINNET_NETWORK_ID].address,
        assetProxyOwnerOwners: [
            '0x257619b7155d247e43c8b6d90c8c17278ae481f0',
            '0x5ee2a00f8f01d099451844af7f894f26a57fcbf2',
            '0x894d623e0e0e8ed12c4a73dada999e275684a37d',
        ],
        assetProxyOwnerRequiredConfirmations: new BigNumber(2),
        assetProxyOwnerSecondsTimeLocked: new BigNumber(1209600),
    },
    ropsten: {
        rpcUrl: constants.ROPSTEN_RPC_URL,
        exchange: artifacts.Exchange.networks[constants.ROPSTEN_NETWORK_ID].address,
        erc20Proxy: artifacts.ERC20Proxy.networks[constants.ROPSTEN_NETWORK_ID].address,
        erc721Proxy: artifacts.ERC721Proxy.networks[constants.ROPSTEN_NETWORK_ID].address,
        assetProxyOwner: artifacts.AssetProxyOwner.networks[constants.ROPSTEN_NETWORK_ID].address,
        zrx: artifacts.ZRX.networks[constants.ROPSTEN_NETWORK_ID].address,
        assetProxyOwnerOwners: [
            '0x9df8137872ac09a8fee71d0da5c7539923fb9bf0',
            '0xcf34d44db312d188789f43a63d11cf2bebb4da15',
            '0x73fd50f2a6beac9cdac9fe87ef68a18edc415831',
        ],
        assetProxyOwnerRequiredConfirmations: new BigNumber(1),
        assetProxyOwnerSecondsTimeLocked: new BigNumber(0),
    },
    kovan: {
        rpcUrl: constants.KOVAN_RPC_URL,
        exchange: artifacts.Exchange.networks[constants.KOVAN_NETWORK_ID].address,
        erc20Proxy: artifacts.ERC20Proxy.networks[constants.KOVAN_NETWORK_ID].address,
        erc721Proxy: artifacts.ERC721Proxy.networks[constants.KOVAN_NETWORK_ID].address,
        assetProxyOwner: artifacts.AssetProxyOwner.networks[constants.KOVAN_NETWORK_ID].address,
        zrx: artifacts.ZRX.networks[constants.KOVAN_NETWORK_ID].address,
        assetProxyOwnerOwners: [
            '0x9df8137872ac09a8fee71d0da5c7539923fb9bf0',
            '0xcf34d44db312d188789f43a63d11cf2bebb4da15',
            '0x73fd50f2a6beac9cdac9fe87ef68a18edc415831',
        ],
        assetProxyOwnerRequiredConfirmations: new BigNumber(1),
        assetProxyOwnerSecondsTimeLocked: new BigNumber(0),
    },
};
