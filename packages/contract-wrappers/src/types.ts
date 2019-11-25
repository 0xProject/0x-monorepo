import { ContractAddresses } from '@0x/contract-addresses';
import { BigNumber } from '@0x/utils';

export enum ForwarderError {
    CompleteFillFailed = 'COMPLETE_FILL_FAILED',
}

export enum ContractError {
    ContractNotDeployedOnChain = 'CONTRACT_NOT_DEPLOYED_ON_CHAIN',
    InsufficientAllowanceForTransfer = 'INSUFFICIENT_ALLOWANCE_FOR_TRANSFER',
    InsufficientBalanceForTransfer = 'INSUFFICIENT_BALANCE_FOR_TRANSFER',
    InsufficientEthBalanceForDeposit = 'INSUFFICIENT_ETH_BALANCE_FOR_DEPOSIT',
    InsufficientWEthBalanceForWithdrawal = 'INSUFFICIENT_WETH_BALANCE_FOR_WITHDRAWAL',
    InvalidJump = 'INVALID_JUMP',
    OutOfGas = 'OUT_OF_GAS',
    SubscriptionNotFound = 'SUBSCRIPTION_NOT_FOUND',
    SubscriptionAlreadyPresent = 'SUBSCRIPTION_ALREADY_PRESENT',
    ERC721OwnerNotFound = 'ERC_721_OWNER_NOT_FOUND',
    ERC721NoApproval = 'ERC_721_NO_APPROVAL',
    SignatureRequestDenied = 'SIGNATURE_REQUEST_DENIED',
}

/**
 * chainId: The id of the underlying ethereum chain your provider is connected to. (1-mainnet, 3-ropsten, 4-rinkeby, 42-kovan, 1337-testrpc)
 * gasPrice: Gas price to use with every transaction
 * contractAddresses: The address of all contracts to use. Defaults to the known addresses based on chainId.
 * blockPollingIntervalMs: The interval to use for block polling in event watching methods (defaults to 1000)
 */
export interface ContractWrappersConfig {
    chainId: number;
    gasPrice?: BigNumber;
    contractAddresses?: ContractAddresses;
    blockPollingIntervalMs?: number;
}

export interface OrderInfo {
    orderStatus: OrderStatus;
    orderHash: string;
    orderTakerAssetFilledAmount: BigNumber;
}

export enum OrderStatus {
    Invalid = 0,
    InvalidMakerAssetAmount,
    InvalidTakerAssetAmount,
    Fillable,
    Expired,
    FullyFilled,
    Cancelled,
}

export interface TraderInfo {
    makerBalance: BigNumber;
    makerAllowance: BigNumber;
    takerBalance: BigNumber;
    takerAllowance: BigNumber;
    makerZrxBalance: BigNumber;
    makerZrxAllowance: BigNumber;
    takerZrxBalance: BigNumber;
    takerZrxAllowance: BigNumber;
}

export interface OrderAndTraderInfo {
    orderInfo: OrderInfo;
    traderInfo: TraderInfo;
}
