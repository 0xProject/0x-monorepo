import {
    constants,
    filterLogsToArguments,
    MutatorContractFunction,
    TransactionHelper,
    txDefaults as testTxDefaults,
} from '@0x/contracts-test-utils';
import { orderHashUtils } from '@0x/order-utils';
import { FillResults, OrderInfo, OrderWithoutDomain, SignatureType } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { TxData, Web3Wrapper } from '@0x/web3-wrapper';
import * as crypto from 'crypto';
import { LogEntry } from 'ethereum-types';

import {
    artifacts,
    IsolatedExchangeContract,
    IsolatedExchangeDispatchTransferFromCalledEventArgs as DispatchTransferFromCallArgs,
    IsolatedExchangeFillEventArgs as FillEventArgs,
} from '../../src';

export interface AssetBalances {
    [assetData: string]: { [address: string]: BigNumber };
}

export interface IsolatedExchangeEvents {
    fillEvents: FillEventArgs[];
    transferFromCalls: DispatchTransferFromCallArgs[];
}

export type Order = OrderWithoutDomain;
export type Numberish = string | number | BigNumber;

export const DEFAULT_GOOD_SIGNATURE = createGoodSignature();
export const DEFAULT_BAD_SIGNATURE = createBadSignature();

/**
 * @dev Convenience wrapper for the `IsolatedExchange` contract.
 */
export class IsolatedExchangeWrapper {
    public static readonly CHAIN_ID = 1337;
    public readonly instance: IsolatedExchangeContract;
    public readonly txHelper: TransactionHelper;
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
        this.txHelper = new TransactionHelper(web3Wrapper, artifacts);
    }

    public async getTakerAssetFilledAmountAsync(order: Order): Promise<BigNumber> {
        return this.instance.filled.callAsync(this.getOrderHash(order));
    }

    public async cancelOrderAsync(order: Order, txOpts?: TxData): Promise<void> {
        await this.instance.cancelOrder.awaitTransactionSuccessAsync(order, txOpts);
    }

    public async cancelOrdersUpToAsync(epoch: BigNumber, txOpts?: TxData): Promise<void> {
        await this.instance.cancelOrdersUpTo.awaitTransactionSuccessAsync(epoch, txOpts);
    }

    public async fillOrderAsync(
        order: Order,
        takerAssetFillAmount: Numberish,
        signature: string = DEFAULT_GOOD_SIGNATURE,
        txOpts?: TxData,
    ): Promise<FillResults> {
        return this._runFillContractFunctionAsync(
            this.instance.fillOrder,
            order,
            new BigNumber(takerAssetFillAmount),
            signature,
            txOpts,
        );
    }

    public getOrderHash(order: Order): string {
        const domain = {
            verifyingContract: this.instance.address,
            chainId: IsolatedExchangeWrapper.CHAIN_ID,
        };
        return orderHashUtils.getOrderHashHex({ ...order, domain });
    }

    public async getOrderInfoAsync(order: Order): Promise<OrderInfo> {
        return this.instance.getOrderInfo.callAsync(order);
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

    protected async _runFillContractFunctionAsync<
        TCallAsyncArgs extends any[],
        TAwaitTransactionSuccessAsyncArgs extends any[],
        TResult
    >(
        contractFunction: MutatorContractFunction<TCallAsyncArgs, TAwaitTransactionSuccessAsyncArgs, TResult>,
        // tslint:disable-next-line: trailing-comma
        ...args: TAwaitTransactionSuccessAsyncArgs
    ): Promise<TResult> {
        this.lastTxEvents = createEmptyEvents();
        this.lastTxBalanceChanges = {};
        const [result, receipt] = await this.txHelper.getResultAndReceiptAsync(contractFunction, ...args);
        this.lastTxEvents = extractEvents(receipt.logs);
        this.lastTxBalanceChanges = getBalanceChangesFromTransferFromCalls(this.lastTxEvents.transferFromCalls);
        return result;
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
