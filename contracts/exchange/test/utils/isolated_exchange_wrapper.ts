import { FillResults, filterLogsToArguments, LogDecoder, txDefaults as testTxDefaults } from '@0x/contracts-test-utils';
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

export interface AssetBalances {
    [assetData: string]: { [address: string]: BigNumber };
}

export interface IsolatedExchangeEvents {
    fillEvents: FillEventArgs[];
    transferFromCalls: DispatchTransferFromCallArgs[];
}

export interface EventsAndBalances {
    events: IsolatedExchangeEvents;
    balances: AssetBalances;
}

export interface IsolatedFillOrderResults extends EventsAndBalances {
    fillResults: FillResults;
}

export type Order = OrderWithoutDomain;

export const DEFAULT_GOOD_SIGNATURE = createGoodSignature();
export const DEFAULT_BAD_SIGNATURE = createBadSignature();

interface CallAndSendResult<TResult> extends EventsAndBalances {
    result: TResult;
}

interface TransactionContractFunction<TResult> {
    callAsync: (...args: any[]) => Promise<TResult>;
    sendTransactionAsync: (...args: any[]) => Promise<string>;
}

/**
 * @dev Convenience wrapper for the `TestIsolatedExchange` contract.
 */
export class IsolatedExchangeWrapper {
    public static readonly CHAIN_ID = 1337;
    public instance: TestIsolatedExchangeContract;
    public logDecoder: LogDecoder;

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
    ): Promise<IsolatedFillOrderResults> {
        const _takerAssetFillAmount = new BigNumber(takerAssetFillAmount);
        const results = await this._callAndSendExchangeFunctionAsync<FillResults>(
            this.instance.fillOrder,
            order,
            _takerAssetFillAmount,
            signature,
            txOpts,
        );
        return {
            fillResults: results.result,
            events: results.events,
            balances: results.balances,
        };
    }

    public getOrderHash(order: Order): string {
        const domain = {
            verifyingContractAddress: this.instance.address,
            chainId: IsolatedExchangeWrapper.CHAIN_ID,
        };
        return orderHashUtils.getOrderHashHex(_.assign(order, { domain }));
    }

    public async getAssetBalanceAsync(assetData: string, address: string): Promise<BigNumber[]> {
        return this.getAssetBalancesAsync(assetData, [ address ]);
    }

    public async getAssetBalancesAsync(assetData: string, addresses: string[]): Promise<BigNumber[]> {
        return (await this.instance.getRawAssetBalances.callAsync([ assetData ], addresses))[0];
    }

    public async getBalancesAsync(assets: string[], addresses: string[]):
            Promise<AssetBalances> {
        const callResults = await this.instance.getRawAssetBalances.callAsync(assets, addresses);
        const result: AssetBalances = {};
        for (const i of _.times(assets.length)) {
            const assetData = assets[i];
            result[assetData] = {};
            for (const j of _.times(addresses.length)) {
                const address = addresses[j];
                result[assetData][address] = callResults[i][j];
            }
        }
        return result;
    }

    protected async _getBalancesFromTransferFromCallsAsync(
        calls: DispatchTransferFromCallArgs[],
    ): Promise<AssetBalances> {
        // Extract addresses involved in transfers.
        const addresses = _.uniq(_.flatten(calls.map(c => [c.from, c.to])));
        // Extract assets involved in transfers.
        const assets = _.uniq(calls.map(c => c.assetData));
        // Query balances of addresses and assets involved in transfers.
        return this.getBalancesAsync(assets, addresses);
    }

    protected async _callAndSendExchangeFunctionAsync<TResult>(
        instanceMethod: TransactionContractFunction<TResult>,
        // tslint:disable-next-line: trailing-comma
        ...args: any[]
    ): Promise<CallAndSendResult<TResult>> {
        // Call to get the return value.
        const result = await instanceMethod.callAsync.call(this.instance, ...args);
        // Transact to execute it.
        const receipt = await this.logDecoder.getTxWithDecodedLogsAsync(
            await this.instance.fillOrder.sendTransactionAsync.call(this.instance, ...args),
        );
        const events = extractEvents(receipt.logs);
        const balances = await this._getBalancesFromTransferFromCallsAsync(events.transferFromCalls);
        return {
            result,
            events,
            balances,
        };
    }
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
