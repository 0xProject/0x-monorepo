import { BlockParam, ContractEventArg, DecodedLogArgs, LogEntryEvent, LogWithDecodedArgs } from 'ethereum-types';

export type LogEvent = LogEntryEvent;
export interface DecodedLogEvent<ArgsType extends DecodedLogArgs> {
    isRemoved: boolean;
    log: LogWithDecodedArgs<ArgsType>;
}

export type EventCallback<ArgsType extends DecodedLogArgs> = (
    err: null | Error,
    log?: DecodedLogEvent<ArgsType>,
) => void;

export interface ContractEvent<ContractEventArgs> {
    logIndex: number;
    transactionIndex: number;
    transactionHash: string;
    blockHash: string;
    blockNumber: number;
    address: string;
    type: string;
    event: string;
    args: ContractEventArgs;
}

export enum ContractWrappersError {
    ContractNotDeployedOnNetwork = 'CONTRACT_NOT_DEPLOYED_ON_NETWORK',
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

export interface IndexedFilterValues {
    [index: string]: ContractEventArg;
}

export interface BlockRange {
    fromBlock: BlockParam;
    toBlock: BlockParam;
}
