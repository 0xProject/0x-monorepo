import { blockchainTests } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';

import { artifacts, TestProtocolFeesContract, TestProtocolFeesReceiverContract } from '../src';

blockchainTests.only('Protocol Fee Payments', env => {
    let testProtocolFees: TestProtocolFeesContract;
    let testProtocolFeesReceiver: TestProtocolFeesReceiverContract;

    const DEFAULT_GAS_PRICE = new BigNumber(20000);
    const DEFAULT_PROTOCOL_FEE_MULTIPLIER = new BigNumber(150);
    const DEFAULT_PROTOCOL_FEE = DEFAULT_GAS_PRICE.times(DEFAULT_PROTOCOL_FEE_MULTIPLIER);

    before(async () => {
        testProtocolFees = await TestProtocolFeesContract.deployFrom0xArtifactAsync(
            artifacts.TestProtocolFees,
            env.provider,
            env.txDefaults,
            {},
        );
        testProtocolFeesReceiver = await TestProtocolFeesReceiverContract.deployFrom0xArtifactAsync(
            artifacts.TestProtocolFeesReceiver,
            env.provider,
            env.txDefaults,
            {},
        );
    });

    blockchainTests.resets('fillOrder Protocol Fees', () => {
        it('should not pay protocol fee when there is no registered protocol fee collector', async () => {
            await testProtocolFeesReceiver.testFillOrderProtocolFees.awaitTransactionSuccessAsync(
                testProtocolFees.address,
                DEFAULT_PROTOCOL_FEE_MULTIPLIER,
                false,
                {
                    gasPrice: DEFAULT_GAS_PRICE,
                    value: DEFAULT_PROTOCOL_FEE,
                },
            );
        });

        it('should pay protocol fee in WETH when too little value is sent', async () => {
            await testProtocolFeesReceiver.testFillOrderProtocolFees.awaitTransactionSuccessAsync(
                testProtocolFees.address,
                DEFAULT_PROTOCOL_FEE_MULTIPLIER,
                true,
                {
                    gasPrice: DEFAULT_GAS_PRICE,
                    value: DEFAULT_PROTOCOL_FEE.minus(new BigNumber(10)),
                },
            );
        });

        it('should pay protocol fee in ETH when the correct value is sent', async () => {
            await testProtocolFeesReceiver.testFillOrderProtocolFees.awaitTransactionSuccessAsync(
                testProtocolFees.address,
                DEFAULT_PROTOCOL_FEE_MULTIPLIER,
                true,
                {
                    gasPrice: DEFAULT_GAS_PRICE,
                    value: DEFAULT_PROTOCOL_FEE,
                },
            );
        });

        it('should pay protocol fee in ETH when extra value is sent', async () => {
            await testProtocolFeesReceiver.testFillOrderProtocolFees.awaitTransactionSuccessAsync(
                testProtocolFees.address,
                DEFAULT_PROTOCOL_FEE_MULTIPLIER,
                true,
                {
                    gasPrice: DEFAULT_GAS_PRICE,
                    value: DEFAULT_PROTOCOL_FEE.plus(new BigNumber(10)),
                },
            );
        });
    });

    blockchainTests.resets('matchOrders Protocol Fees', () => {
        it('should not pay protocol fee when there is no registered protocol fee collector', async () => {
            await testProtocolFeesReceiver.testMatchOrdersProtocolFees.awaitTransactionSuccessAsync(
                testProtocolFees.address,
                DEFAULT_PROTOCOL_FEE_MULTIPLIER,
                false,
                {
                    gasPrice: DEFAULT_GAS_PRICE,
                    value: DEFAULT_PROTOCOL_FEE,
                },
            );
        });

        it('should pay protocol fee in WETH when too little value is sent', async () => {
            await testProtocolFeesReceiver.testMatchOrdersProtocolFees.awaitTransactionSuccessAsync(
                testProtocolFees.address,
                DEFAULT_PROTOCOL_FEE_MULTIPLIER,
                true,
                {
                    gasPrice: DEFAULT_GAS_PRICE,
                    value: DEFAULT_PROTOCOL_FEE.minus(new BigNumber(10)),
                },
            );
        });

        it('should pay protocol fee in ETH when the correct value is sent', async () => {
            await testProtocolFeesReceiver.testMatchOrdersProtocolFees.awaitTransactionSuccessAsync(
                testProtocolFees.address,
                DEFAULT_PROTOCOL_FEE_MULTIPLIER,
                true,
                {
                    gasPrice: DEFAULT_GAS_PRICE,
                    value: DEFAULT_PROTOCOL_FEE,
                },
            );
        });

        it('should pay protocol fee in ETH when extra value is sent', async () => {
            await testProtocolFeesReceiver.testMatchOrdersProtocolFees.awaitTransactionSuccessAsync(
                testProtocolFees.address,
                DEFAULT_PROTOCOL_FEE_MULTIPLIER,
                true,
                {
                    gasPrice: DEFAULT_GAS_PRICE,
                    value: DEFAULT_PROTOCOL_FEE.plus(new BigNumber(10)),
                },
            );
        });
    });
});
