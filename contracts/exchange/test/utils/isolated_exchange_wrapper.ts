import { constants, FillResults, filterLogsToArguments, LogDecoder, txDefaults as testTxDefaults } from '@0x/contracts-test-utils';
import { orderHashUtils } from '@0x/order-utils';
import { OrderWithoutDomain, SignatureType } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { TxData, Web3Wrapper } from '@0x/web3-wrapper';
import { LogEntry } from 'ethereum-types';
import * as _ from 'lodash';

import {
    artifacts,
    TestIsolatedExchangeContract,
    TestIsolatedExchangeDispatchTransferFromCalledEventArgs as DispatchTransferFromCallArgs,
    TestIsolatedExchangeFillEventArgs as FillEventArgs,
} from '../../src';

export interface AssetBalances {
    [assetData: string]: { [address: string]: BigNumber };
}

export interface IsolatedExchangeEvents {
    fillEvents: FillEventArgs[];
    transferFromCalls: DispatchTransferFromCallArgs[];
}

export type Order = OrderWithoutDomain;

export const DEFAULT_GOOD_SIGNATURE = createGoodSignature();
export const DEFAULT_BAD_SIGNATURE = createBadSignature();

/**
 * @dev Convenience wrapper for the `TestIsolatedExchange` contract.
 */
export class IsolatedExchangeWrapper {
    public static readonly CHAIN_ID = 1337;
    public instance: TestIsolatedExchangeContract;
    public logDecoder: LogDecoder;
    public lastTxEvents: IsolatedExchangeEvents = createEmptyEvents();
    public lastTxBalanceChanges: AssetBalances = {};

    public static async deployAsync(
        web3Wrapper: Web3Wrapper,
        txDefaults: Partial<TxData> = testTxDefaults,
    ): Promise<IsolatedExchangeWrapper> {
        const provider = web3Wrapper.getProvider();
        const instance = await TestIsolatedExchangeContract.deployFrom0xArtifactAsync(
            artifacts.TestIsolatedExchange,
            provider,
            txDefaults,
        );
        return new IsolatedExchangeWrapper(web3Wrapper, instance);
    }

    public static fromAddress(
        address: string,
        web3Wrapper: Web3Wrapper,
        txDefaults: Partial<TxData> = testTxDefaults,
    ): IsolatedExchangeWrapper {
        const provider = web3Wrapper.getProvider();
        const instance = new TestIsolatedExchangeContract(address, provider, txDefaults);
        return new IsolatedExchangeWrapper(web3Wrapper, instance);
    }

    public constructor(web3Wrapper: Web3Wrapper, instance: TestIsolatedExchangeContract) {
        this.instance = instance;
        this.logDecoder = new LogDecoder(web3Wrapper, artifacts);
    }

    public async fillOrderAsync(
        order: Order,
        takerAssetFillAmount: BigNumber | number,
        signature: string = DEFAULT_GOOD_SIGNATURE,
        txOpts?: TxData,
    ): Promise<FillResults> {
        return this._callAndSendExchangeFunctionAsync<FillResults>(
            this.instance.fillOrder,
            order,
            new BigNumber(takerAssetFillAmount),
            signature,
            txOpts,
        );
    }

    public getOrderHash(order: Order): string {
        const domain = {
            verifyingContractAddress: this.instance.address,
            chainId: IsolatedExchangeWrapper.CHAIN_ID,
        };
        return orderHashUtils.getOrderHashHex(_.assign(order, { domain }));
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

    protected async _callAndSendExchangeFunctionAsync<TResult>(
        instanceMethod: TransactionContractFunction<TResult>,
        // tslint:disable-next-line: trailing-comma
        ...args: any[]
    ): Promise<TResult> {
        this.lastTxEvents = createEmptyEvents();
        this.lastTxBalanceChanges = {};
        // Call to get the return value.
        const result = await instanceMethod.callAsync(...args);
        // Transact to execute it.
        const receipt = await this.logDecoder.getTxWithDecodedLogsAsync(
            await this.instance.fillOrder.sendTransactionAsync.call(this.instance, ...args),
        );
        this.lastTxEvents = extractEvents(receipt.logs);
        this.lastTxBalanceChanges = getBalanceChangesFromTransferFromCalls(
            this.lastTxEvents.transferFromCalls,
        );
        return result;
    }
}

interface TransactionContractFunction<TResult> {
    callAsync: (...args: any[]) => Promise<TResult>;
    sendTransactionAsync: (...args: any[]) => Promise<string>;
}

/**
 * @dev Create a signature for the `TestIsolatedExchange` contract that will pass.
 */
export function createGoodSignature(type: SignatureType = SignatureType.EIP712): string {
    return `0x01${Buffer.from([type]).toString('hex')}`;
}

/**
 * @dev Create a signature for the `TestIsolatedExchange` contract that will fail.
 */
export function createBadSignature(type: SignatureType = SignatureType.EIP712): string {
    return `0x00${Buffer.from([type]).toString('hex')}`;
}

function createEmptyEvents(): IsolatedExchangeEvents {
    return { fillEvents: [], transferFromCalls: [] };
}

function extractEvents(logs: LogEntry[]): IsolatedExchangeEvents {
    return {
        fillEvents: filterLogsToArguments<FillEventArgs>(logs, 'Fill'),
        transferFromCalls: filterLogsToArguments<DispatchTransferFromCallArgs>(
            logs,
            'DispatchTransferFromCalled',
        ),
    };
}

// Executes transferFrom calls to compute relative balances for addresses.
function getBalanceChangesFromTransferFromCalls(
    calls: DispatchTransferFromCallArgs[],
): AssetBalances {
    const changes: AssetBalances = {};
    for (const call of calls) {
        const { assetData, from, to, amount } = call;
        const balances = changes[assetData] = changes[assetData ] || {};
        const fromBalance = balances[from] || constants.ZERO_AMOUNT;
        const toBalance = balances[to] || constants.ZERO_AMOUNT;
        balances[from] = fromBalance.minus(amount);
        balances[to] = toBalance.plus(amount);
    }
    return changes;
}
