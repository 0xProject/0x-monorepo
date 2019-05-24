import { OrderWithoutDomain } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { AbiDefinition } from 'ethereum-types';

export { OrderStatus } from '@0x/types';

export interface ERC20BalancesByOwner {
    [ownerAddress: string]: {
        [tokenAddress: string]: BigNumber;
    };
}

export interface ERC721TokenIdsByOwner {
    [ownerAddress: string]: {
        [tokenAddress: string]: BigNumber[];
    };
}

export interface ERC1155FungibleHoldingsByOwner {
    [ownerAddress: string]: {
        [tokenAddress: string]: {
            [tokenId: string]: BigNumber;
        };
    };
}

export interface ERC1155NonFungibleHoldingsByOwner {
    [ownerAddress: string]: {
        [tokenAddress: string]: {
            [tokenId: string]: BigNumber[];
        };
    };
}

export interface ERC1155HoldingsByOwner {
    fungible: ERC1155FungibleHoldingsByOwner;
    nonFungible: ERC1155NonFungibleHoldingsByOwner;
}

export interface SubmissionContractEventArgs {
    transactionId: BigNumber;
}

export interface BatchFillOrders {
    orders: OrderWithoutDomain[];
    signatures: string[];
    takerAssetFillAmounts: BigNumber[];
}

export interface MarketSellOrders {
    orders: OrderWithoutDomain[];
    signatures: string[];
    takerAssetFillAmount: BigNumber;
}

export interface MarketBuyOrders {
    orders: OrderWithoutDomain[];
    signatures: string[];
    makerAssetFillAmount: BigNumber;
}

export interface BatchCancelOrders {
    orders: OrderWithoutDomain[];
}

export interface CancelOrdersBefore {
    salt: BigNumber;
}

export interface TransactionDataParams {
    name: string;
    abi: AbiDefinition[];
    args: any[];
}

export interface MultiSigConfig {
    owners: string[];
    confirmationsRequired: number;
    secondsRequired: number;
}

export interface MultiSigConfigByNetwork {
    [networkName: string]: MultiSigConfig;
}

export interface Token {
    address?: string;
    name: string;
    symbol: string;
    decimals: number;
    ipfsHash: string;
    swarmHash: string;
}

export enum ContractName {
    TokenRegistry = 'TokenRegistry',
    MultiSigWalletWithTimeLock = 'MultiSigWalletWithTimeLock',
    Exchange = 'Exchange',
    DummyERC20Token = 'DummyERC20Token',
    EtherToken = 'WETH9',
    DutchAuction = 'DutchAuction',
    AssetProxyOwner = 'AssetProxyOwner',
    AccountLevels = 'AccountLevels',
    EtherDelta = 'EtherDelta',
    Arbitrage = 'Arbitrage',
    TestAssetDataDecoders = 'TestAssetDataDecoders',
    TestAssetProxyDispatcher = 'TestAssetProxyDispatcher',
    TestLibs = 'TestLibs',
    TestSignatureValidator = 'TestSignatureValidator',
    ERC20Proxy = 'ERC20Proxy',
    ERC721Proxy = 'ERC721Proxy',
    DummyERC721Receiver = 'DummyERC721Receiver',
    DummyERC721Token = 'DummyERC721Token',
    TestLibBytes = 'TestLibBytes',
    TestWallet = 'TestWallet',
    Authorizable = 'Authorizable',
    Whitelist = 'Whitelist',
    Forwarder = 'Forwarder',
    BalanceThresholdFilter = 'BalanceThresholdFilter',
}

export interface OrderInfo {
    orderStatus: number;
    orderHash: string;
    orderTakerAssetFilledAmount: BigNumber;
}

export interface CancelOrder {
    order: OrderWithoutDomain;
    takerAssetCancelAmount: BigNumber;
}

export interface MatchOrder {
    left: OrderWithoutDomain;
    right: OrderWithoutDomain;
    leftSignature: string;
    rightSignature: string;
}

export interface FillResults {
    makerAssetFilledAmount: BigNumber;
    takerAssetFilledAmount: BigNumber;
    makerFeePaid: BigNumber;
    takerFeePaid: BigNumber;
}
