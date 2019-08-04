import {
    blockchainTests,
    constants,
    describe,
    expect,
    hexRandom,
} from '@0x/contracts-test-utils';
import { OrderWithoutDomain as Order } from '@0x/types';

import {
    artifacts,
    TestWrapperFunctionsContract,
    TestWrapperFunctionsFillOrderCalledEventArgs as FillOrderCalledEventArgs,
} from '../src';

blockchainTests.only('Exchange wrapper functions unit tests.', env => {
    const randomAddress = () => hexRandom(constants.ADDRESS_LENGTH);
    const randomAssetData = () => hexRandom(34);
    const DEFAULT_ORDER: Order = {
        makerAddress: randomAddress(),
        takerAddress: randomAddress(),
    };
    let testContract: TestWrapperFunctionsContract;

    before(async () => {
        testContract = await TestWrapperFunctionsContract.deployFrom0xArtifactAsync(
            artifacts.TestWrapperFunctions,
            env.provider,
            env.txDefaults,
        );
    });

    describe('getOrdersInfo', () => {
        it('works', async () => {
            testContract.getOrdersInfo.callAsync(orders);
        });
    });
});
