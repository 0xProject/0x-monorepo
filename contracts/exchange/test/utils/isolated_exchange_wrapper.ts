import {
    constants,
    filterLogsToArguments,
    orderHashUtils,
    txDefaults as testTxDefaults,
} from '@0x/contracts-test-utils';
import { FillResults, Order, OrderInfo, SignatureType } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { TxData, Web3Wrapper } from '@0x/web3-wrapper';
import * as crypto from 'crypto';
import { LogEntry } from 'ethereum-types';

import { artifacts } from '../artifacts';

import {
    IsolatedExchangeContract,
    IsolatedExchangeDispatchTransferFromCalledEventArgs as DispatchTransferFromCallArgs,
    IsolatedExchangeFillEventArgs as FillEventArgs,
} from '../wrappers';

export interface AssetBalances {
    [assetData: string]: { [address: string]: BigNumber };
}

export interface IsolatedExchangeEvents {
    fillEvents: FillEventArgs[];
    transferFromCalls: DispatchTransferFromCallArgs[];
}

export type Order = Order;
export type Numberish = string | number | BigNumber;

export const DEFAULT_GOOD_SIGNATURE = createGoodSignature();
export const DEFAULT_BAD_SIGNATURE = createBadSignature();

/**
 * @dev Convenience wrapper for the `IsolatedExchange` contract.
 */
export class IsolatedExchangeWrapper {
    public static readonly CHAIN_ID = 1337;
    public readonly instance: IsolatedExchangeContract;
    public lastTxEvents: IsolatedExchangeEvents = createEmptyEvents();
    public lastTxBalanceChanges: AssetBalances = {};

    public static async deployAsync(
        web3Wrapper: Web3Wrapper,
        txDefaults: Partial<TxData> = testTxDefaults,
    ): Promise<IsolatedExchangeWrapper> {
        const provider = web3Wrapper.getProvider();
        const instance = await IsolatedExchangeContract.deployFrom0xArtifactAsync(
            artifacts.IsolatedExchange,
            provider,
            txDefaults,
            {},
        );
        return new IsolatedExchangeWrapper(web3Wrapper, instance);
    }

    public static fromAddress(
        address: string,
        web3Wrapper: Web3Wrapper,
        txDefaults: Partial<TxData> = testTxDefaults,
    ): IsolatedExchangeWrapper {
        const provider = web3Wrapper.getProvider();
        const instance = new IsolatedExchangeContract(address, provider, txDefaults);
        return new IsolatedExchangeWrapper(web3Wrapper, instance);
    }

    public constructor(web3Wrapper: Web3Wrapper, instance: IsolatedExchangeContract) {
        this.instance = instance;
    }

    public async getTakerAssetFilledAmountAsync(order: Order): Promise<BigNumber> {
        return this.instance.filled(this.getOrderHash(order)).callAsync();
    }

    public async cancelOrderAsync(order: Order, txOpts?: TxData): Promise<void> {
        await this.instance.cancelOrder(order).awaitTransactionSuccessAsync(txOpts);
    }

    public async cancelOrdersUpToAsync(epoch: BigNumber, txOpts?: TxData): Promise<void> {
        await this.instance.cancelOrdersUpTo(epoch).awaitTransactionSuccessAsync(txOpts);
    }

    public async fillOrderAsync(
        order: Order,
        takerAssetFillAmount: Numberish,
        signature: string = DEFAULT_GOOD_SIGNATURE,
        txOpts?: TxData,
    ): Promise<FillResults> {
        this.lastTxEvents = createEmptyEvents();
        this.lastTxBalanceChanges = {};
        const fillOrderFn = this.instance.fillOrder(order, new BigNumber(takerAssetFillAmount), signature);
        const result = await fillOrderFn.callAsync();
        const receipt = await fillOrderFn.awaitTransactionSuccessAsync(txOpts);
        this.lastTxEvents = extractEvents(receipt.logs);
        this.lastTxBalanceChanges = getBalanceChangesFromTransferFromCalls(this.lastTxEvents.transferFromCalls);
        return result;
    }

    public getOrderHash(order: Order): string {
        const domainInfo = {
            exchangeAddress: this.instance.address,
            chainId: IsolatedExchangeWrapper.CHAIN_ID,
        };
        return orderHashUtils.getOrderHashHex({ ...order, ...domainInfo });
    }

    public async getOrderInfoAsync(order: Order): Promise<OrderInfo> {
        return this.instance.getOrderInfo(order).callAsync();
    }

    public getBalanceChange(assetData: string, address: string): BigNumber {
        if (assetData in this.lastTxBalanceChanges) {
            const balances = this.lastTxBalanceChanges[assetData];
            if (address in balances) {
                return balances[address];
            }
        }
        return constants.ZERO_AMOUNT;
    }
}

/**
 * Create a signature for the `IsolatedExchange` contract that will pass.
 */
export function createGoodSignature(type: SignatureType = SignatureType.EIP712): string {
    return `0x01${Buffer.from([type]).toString('hex')}`;
}

/**
 * Create a signature for the `IsolatedExchange` contract that will fail.
 */
export function createBadSignature(type: SignatureType = SignatureType.EIP712): string {
    return `0x00${Buffer.from([type]).toString('hex')}`;
}

const ERC20_ASSET_DATA_LENGTH = 36;

/**
 * Create asset data for the `IsolatedExchange` contract that will pass.
 */
export function createGoodAssetData(length: number = ERC20_ASSET_DATA_LENGTH): string {
    return `0x01${crypto.randomBytes(length - 1).toString('hex')}`;
}

/**
 * Create asset data for the `IsolatedExchange` contract that will fail.
 */
export function createBadAssetData(length: number = ERC20_ASSET_DATA_LENGTH): string {
    return `0x00${crypto.randomBytes(length - 1).toString('hex')}`;
}

function createEmptyEvents(): IsolatedExchangeEvents {
    return { fillEvents: [], transferFromCalls: [] };
}

function extractEvents(logs: LogEntry[]): IsolatedExchangeEvents {
    return {
        fillEvents: filterLogsToArguments<FillEventArgs>(logs, 'Fill'),
        transferFromCalls: filterLogsToArguments<DispatchTransferFromCallArgs>(logs, 'DispatchTransferFromCalled'),
    };
}

// Executes transferFrom calls to compute relative balances for addresses.
function getBalanceChangesFromTransferFromCalls(calls: DispatchTransferFromCallArgs[]): AssetBalances {
    const changes: AssetBalances = {};
    for (const call of calls) {
        const { assetData, from, to, amount } = call;
        const balances = (changes[assetData] = changes[assetData] || {});
        const fromBalance = balances[from] || constants.ZERO_AMOUNT;
        const toBalance = balances[to] || constants.ZERO_AMOUNT;
        balances[from] = fromBalance.minus(amount);
        balances[to] = toBalance.plus(amount);
    }
    return changes;
}
