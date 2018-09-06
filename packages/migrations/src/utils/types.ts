import { BigNumber } from '@0xproject/utils';

export interface ERC20Token {
    address?: string;
    name: string;
    symbol: string;
    decimals: BigNumber;
    ipfsHash: string;
    swarmHash: string;
}

export interface ERC721Token {
    name: string;
    symbol: string;
}

export enum ContractName {
    TokenTransferProxy = 'TokenTransferProxy',
    TokenRegistry = 'TokenRegistry',
    MultiSigWalletWithTimeLock = 'MultiSigWalletWithTimeLock',
    Exchange = 'Exchange',
    ZRXToken = 'ZRXToken',
    DummyToken = 'DummyToken',
    WETH9 = 'WETH9',
    MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddress = 'MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddress',
    AccountLevels = 'AccountLevels',
    EtherDelta = 'EtherDelta',
    Arbitrage = 'Arbitrage',
}

export interface V2NetworkConfig {
    [network: string]: {
        rpcUrl: string;
        exchange: string;
        erc20Proxy: string;
        erc721Proxy: string;
        assetProxyOwner: string;
        zrx: string;
        assetProxyOwnerOwners: string[];
        assetProxyOwnerRequiredConfirmations: BigNumber;
        assetProxyOwnerSecondsTimeLocked: BigNumber;
    };
}
