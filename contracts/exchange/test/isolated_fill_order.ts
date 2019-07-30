import {
    addressUtils,
    blockchainTests,
    constants,
    expect,
    FillResults,
    LogDecoder,
} from '@0x/contracts-test-utils';
import { Order } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { LogWithDecodedArgs } from 'ethereum-types';
import * as _ from 'lodash';

import {
    artifacts,
    TestIsolatedExchangeContract,
    TestIsolatedExchangeDispatchTransferFromCalledEventArgs as DispatchTransferFromCallArgs,
    TestIsolatedExchangeFillEventArgs as FillEventArgs,
} from '../src';

blockchainTests.resets.only('Isolated fillOrder() tests', env => {
    const GOOD_SIGNATURE = '0x0101';
    const BAD_SIGNATURE = '0x0001';
    const TOMORROW = Math.floor(_.now() / 1000) + 60 * 60 * 24;
    const DEFAULT_ORDER: Order = {
        senderAddress: constants.NULL_ADDRESS,
        makerAddress: addressUtils.generatePseudoRandomAddress(),
        takerAddress: constants.NULL_ADDRESS,
        makerFee: constants.ZERO_AMOUNT,
        takerFee: constants.ZERO_AMOUNT,
        makerAssetAmount: constants.ZERO_AMOUNT,
        takerAssetAmount: constants.ZERO_AMOUNT,
        makerAssetData: constants.NULL_BYTES,
        takerAssetData: constants.NULL_BYTES,
        makerFeeAssetData: constants.NULL_BYTES,
        takerFeeAssetData: constants.NULL_BYTES,
        salt: constants.ZERO_AMOUNT,
        feeRecipientAddress: constants.NULL_ADDRESS,
        expirationTimeSeconds: toBN(TOMORROW),
        domain: {
            verifyingContractAddress: constants.NULL_ADDRESS,
            chainId: 1337,
        },
    };
    let takerAddress: string;
    let testExchange: TestIsolatedExchangeContract;
    let logDecoder: LogDecoder;
    let nextSaltValue = 1;

    before(async () => {
        [ takerAddress ] = await env.getAccountAddressesAsync();
        testExchange = await TestIsolatedExchangeContract.deployFrom0xArtifactAsync(
            artifacts.TestIsolatedExchange,
            env.provider,
            env.txDefaults,
        );
        logDecoder = new LogDecoder(env.web3Wrapper, artifacts);
    });

    interface IsolatedExchangeAssetBalances {
        [assetData: string]: {[address: string]: BigNumber};
    }

    interface IsolatedFillOrderAsyncResults {
        fillResults: FillResults;
        fillEventArgs: FillEventArgs;
        transferFromCalls: DispatchTransferFromCallArgs[];
        balances: IsolatedExchangeAssetBalances;
    }

    async function isolatedFillOrderAsync(
        order: Order,
        takerAssetFillAmount: BigNumber | number,
        signature: string = GOOD_SIGNATURE,
    ): Promise<IsolatedFillOrderAsyncResults> {
        const _takerAssetFillAmount = toBN(takerAssetFillAmount);
        // Call to get the return value.
        const fillResults = await testExchange.fillOrder.callAsync(
            order,
            _takerAssetFillAmount,
            signature,
        );
        // Transact to execute it.
        const receipt = await logDecoder.getTxWithDecodedLogsAsync(
            await testExchange.fillOrder.sendTransactionAsync(
                order,
                _takerAssetFillAmount,
                signature,
            ),
        );
        // Parse logs.
        const fillEventArgs = (receipt.logs[0] as LogWithDecodedArgs<FillEventArgs>).args;
        const transferFromCalls =
            (receipt.logs.slice(1) as Array<LogWithDecodedArgs<DispatchTransferFromCallArgs>>).map(
                log => log.args,
            );
        // Extract addresses involved in transfers.
        const addresses = _.uniq(_.flatten(transferFromCalls.map(c => [c.from, c.to])));
        // Extract assets involved in transfers.
        const assets = _.uniq(transferFromCalls.map(c => c.assetData));
        // Query balances of addresses and assets involved in transfers.
        const balances = await (async () => {
            const result: IsolatedExchangeAssetBalances = {};
            for (const assetData of assets) {
                result[assetData] = _.zipObject(
                    addresses,
                    await testExchange.getMultipleRawAssetBalanceChanges.callAsync(
                        assetData,
                        addresses,
                    ),
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

    function createOrder(details: Partial<Order> = {}): Order {
        return _.assign(
            {},
            DEFAULT_ORDER,
            { salt: toBN(nextSaltValue++) },
            details,
        );
    }

    it('works', async () => {
        const order = createOrder({
            makerAssetAmount: toBN(1),
            takerAssetAmount: toBN(2),
        });
        const results = await isolatedFillOrderAsync(order, 2);
        console.log(results);
    });
});

function toBN(num: BigNumber | string | number): BigNumber {
    return new BigNumber(num);
}
