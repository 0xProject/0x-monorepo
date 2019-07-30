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
    TestExchangeIsolatedContract,
    TestExchangeIsolatedDispatchTransferFromCalledEventArgs as DispatchTransferFromCallArgs,
    TestExchangeIsolatedFillEventArgs as FillEventArgs,
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
    let testExchange: TestExchangeIsolatedContract;
    let logDecoder: LogDecoder;
    let nextSaltValue = 1;

    before(async () => {
        [ takerAddress ] = await env.getAccountAddressesAsync();
        testExchange = await TestExchangeIsolatedContract.deployFrom0xArtifactAsync(
            artifacts.TestExchangeIsolated,
            env.provider,
            env.txDefaults,
        );
        logDecoder = new LogDecoder(env.web3Wrapper, artifacts);
    });

    interface IsolatedFillOrderAsyncResults {
        fillResults: FillResults;
        fillEventArgs: FillEventArgs;
        transferFromCallArgs: DispatchTransferFromCallArgs[];
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
        const fillEventArgs = (receipt.logs[0] as LogWithDecodedArgs<FillEventArgs>).args;
        const transferFromCallArgs =
            (receipt.logs.slice(1) as Array<LogWithDecodedArgs<DispatchTransferFromCallArgs>>).map(
                log => log.args,
            );
        return {
            fillResults,
            fillEventArgs,
            transferFromCallArgs,
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
            takerAssetAmount: toBN(1),
        });
        const results = await isolatedFillOrderAsync(order, 1);
        console.log(results);
    });
});

function toBN(num: BigNumber | string | number): BigNumber {
    return new BigNumber(num);
}
