import { FillResults, filterLogsToArguments, LogDecoder, txDefaults as testTxDefaults } from '@0x/contracts-test-utils';
import { orderHashUtils } from '@0x/order-utils';
import { OrderWithoutDomain, SignatureType } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { TxData, Web3Wrapper } from '@0x/web3-wrapper';
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

export interface IsolatedAssetBalances {
    [assetData: string]: { [address: string]: BigNumber };
}

export interface IsolatedFillOrderResults {
    fillResults: FillResults;
    fillEventArgs: FillEventArgs;
    transferFromCalls: DispatchTransferFromCallArgs[];
    balances: IsolatedAssetBalances;
}

export type Order = OrderWithoutDomain;

export const DEFAULT_GOOD_SIGNATURE = createGoodSignature();
export const DEFAULT_BAD_SIGNATURE = createBadSignature();

/**
 * @dev Convenience wrapper for the `TestIsolatedExchange` contract.
 */
export class IsolatedExchangeWrapper {
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
        // Call to get the return value.
        const fillResults = await this.instance.fillOrder.callAsync(order, _takerAssetFillAmount, signature, txOpts);
        // Transact to execute it.
        const receipt = await this.logDecoder.getTxWithDecodedLogsAsync(
            await this.instance.fillOrder.sendTransactionAsync(order, _takerAssetFillAmount, signature, txOpts),
        );
        // Parse logs.
        const fillEventArgs = filterLogsToArguments<FillEventArgs>(receipt.logs, 'Fill')[0];
        const transferFromCalls = filterLogsToArguments<DispatchTransferFromCallArgs>(
            receipt.logs,
            'DispatchTransferFromCalled',
        );
        // Extract addresses involved in transfers.
        const addresses = _.uniq(_.flatten(transferFromCalls.map(c => [c.from, c.to])));
        // Extract assets involved in transfers.
        const assets = _.uniq(transferFromCalls.map(c => c.assetData));
        // Query balances of addresses and assets involved in transfers.
        const balances = await (async () => {
            const result: IsolatedAssetBalances = {};
            for (const assetData of assets) {
                result[assetData] = _.zipObject(
                    addresses,
                    await this.instance.getRawAssetBalances.callAsync(assetData, addresses),
                );
            }
            return result;
        })();
        return {
            fillResults,
            fillEventArgs,
            transferFromCalls,
            balances,
        };
    }

    public getOrderHash(order: Order): string {
        const domain = {
            verifyingContractAddress: this.instance.address,
            chainId: 1337,
        };
        return orderHashUtils.getOrderHashHex(_.assign(order, { domain }));
    }
}
