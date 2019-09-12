import { blockchainTests } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';

import { artifacts, TestProtocolFeesContract, TestProtocolFeesReceiverContract } from '../src';

// The contents of this test suite does not inform the reader about the assertions made in these
// tests. For more information and a more accurate view of the tests, check out
// "contracts/test/TestProtocolFeesReceiver.sol".
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
            artifacts,
        );
        testProtocolFeesReceiver = await TestProtocolFeesReceiverContract.deployFrom0xArtifactAsync(
            artifacts.TestProtocolFeesReceiver,
            env.provider,
            env.txDefaults,
            artifacts,
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

        it('should not forward ETH when too little value is sent', async () => {
            await testProtocolFeesReceiver.testFillOrderProtocolFees.awaitTransactionSuccessAsync(
                testProtocolFees.address,
                DEFAULT_PROTOCOL_FEE_MULTIPLIER,
                true,
                {
                    gasPrice: DEFAULT_GAS_PRICE,
                    value: DEFAULT_PROTOCOL_FEE.minus(10),
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
                    value: DEFAULT_PROTOCOL_FEE.plus(10),
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

        it('should not forward ETH twice when too little value is sent', async () => {
            await testProtocolFeesReceiver.testMatchOrdersProtocolFees.awaitTransactionSuccessAsync(
                testProtocolFees.address,
                DEFAULT_PROTOCOL_FEE_MULTIPLIER,
                true,
                {
                    gasPrice: DEFAULT_GAS_PRICE,
                    value: DEFAULT_PROTOCOL_FEE.minus(10),
                },
            );
        });

        it('should pay protocol fee in ETH and then not forward ETH when exactly one protocol fee is sent', async () => {
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

        it('should pay protocol fee in ETH and then not forward ETH when a bit more than one protocol fee is sent', async () => {
            await testProtocolFeesReceiver.testMatchOrdersProtocolFees.awaitTransactionSuccessAsync(
                testProtocolFees.address,
                DEFAULT_PROTOCOL_FEE_MULTIPLIER,
                true,
                {
                    gasPrice: DEFAULT_GAS_PRICE,
                    value: DEFAULT_PROTOCOL_FEE.plus(10),
                },
            );
        });

        it('should pay protocol fee in ETH when exactly double the protocol fee is sent', async () => {
            await testProtocolFeesReceiver.testMatchOrdersProtocolFees.awaitTransactionSuccessAsync(
                testProtocolFees.address,
                DEFAULT_PROTOCOL_FEE_MULTIPLIER,
                true,
                {
                    gasPrice: DEFAULT_GAS_PRICE,
                    value: DEFAULT_PROTOCOL_FEE.times(2),
                },
            );
        });

        it('should pay protocol fee in ETH when more than double the protocol fee is sent', async () => {
            await testProtocolFeesReceiver.testMatchOrdersProtocolFees.awaitTransactionSuccessAsync(
                testProtocolFees.address,
                DEFAULT_PROTOCOL_FEE_MULTIPLIER,
                true,
                {
                    gasPrice: DEFAULT_GAS_PRICE,
                    value: DEFAULT_PROTOCOL_FEE.times(2).plus(10),
                },
            );
        });
    });

    blockchainTests.resets('batchFillOrder ProtocolFees', () => {
        it('should not pay protocol fees when there is not a protocolFeeCollector registered', async () => {
            await testProtocolFeesReceiver.testBatchFillOrdersProtocolFees.awaitTransactionSuccessAsync(
                testProtocolFees.address,
                DEFAULT_PROTOCOL_FEE_MULTIPLIER,
                new BigNumber(2), // If successful, create a `batchFillOrders` with 2 orders.
                false,
                {
                    gasPrice: DEFAULT_GAS_PRICE,
                    value: DEFAULT_PROTOCOL_FEE,
                },
            );
        });

        it('should not forward ETH when less than one protocol fee is sent and only one order is in the batch', async () => {
            await testProtocolFeesReceiver.testBatchFillOrdersProtocolFees.awaitTransactionSuccessAsync(
                testProtocolFees.address,
                DEFAULT_PROTOCOL_FEE_MULTIPLIER,
                new BigNumber(1),
                true,
                {
                    gasPrice: DEFAULT_GAS_PRICE,
                    value: DEFAULT_PROTOCOL_FEE.minus(10),
                },
            );
        });

        it('should pay one protocol fee in ETH when the exact protocol fee is sent and only one order is in the batch', async () => {
            await testProtocolFeesReceiver.testBatchFillOrdersProtocolFees.awaitTransactionSuccessAsync(
                testProtocolFees.address,
                DEFAULT_PROTOCOL_FEE_MULTIPLIER,
                new BigNumber(1),
                true,
                {
                    gasPrice: DEFAULT_GAS_PRICE,
                    value: DEFAULT_PROTOCOL_FEE,
                },
            );
        });

        it('should pay one protocol fee in ETH when more than the exact protocol fee is sent and only one order is in the batch', async () => {
            await testProtocolFeesReceiver.testBatchFillOrdersProtocolFees.awaitTransactionSuccessAsync(
                testProtocolFees.address,
                DEFAULT_PROTOCOL_FEE_MULTIPLIER,
                new BigNumber(1),
                true,
                {
                    gasPrice: DEFAULT_GAS_PRICE,
                    value: DEFAULT_PROTOCOL_FEE.plus(10),
                },
            );
        });

        it('should not forward ETH twice when an insuffiecent amount of ETH for one protocol fee is sent', async () => {
            await testProtocolFeesReceiver.testBatchFillOrdersProtocolFees.awaitTransactionSuccessAsync(
                testProtocolFees.address,
                DEFAULT_PROTOCOL_FEE_MULTIPLIER,
                new BigNumber(2),
                true,
                {
                    gasPrice: DEFAULT_GAS_PRICE,
                    value: DEFAULT_PROTOCOL_FEE.minus(10),
                },
            );
        });

        it('should pay a protocol in ETH and not forward ETH for the second when exactly one protocol fee in ETH is sent', async () => {
            await testProtocolFeesReceiver.testBatchFillOrdersProtocolFees.awaitTransactionSuccessAsync(
                testProtocolFees.address,
                DEFAULT_PROTOCOL_FEE_MULTIPLIER,
                new BigNumber(2),
                true,
                {
                    gasPrice: DEFAULT_GAS_PRICE,
                    value: DEFAULT_PROTOCOL_FEE,
                },
            );
        });

        it('should pay both protocol fees in ETH when exactly two protocol fees in ETH is sent', async () => {
            await testProtocolFeesReceiver.testBatchFillOrdersProtocolFees.awaitTransactionSuccessAsync(
                testProtocolFees.address,
                DEFAULT_PROTOCOL_FEE_MULTIPLIER,
                new BigNumber(2),
                true,
                {
                    gasPrice: DEFAULT_GAS_PRICE,
                    value: DEFAULT_PROTOCOL_FEE.times(2),
                },
            );
        });

        it('should pay two protocol fees in ETH and then not forward ETH for a third when exactly two protocol fees in ETH is sent', async () => {
            await testProtocolFeesReceiver.testBatchFillOrdersProtocolFees.awaitTransactionSuccessAsync(
                testProtocolFees.address,
                DEFAULT_PROTOCOL_FEE_MULTIPLIER,
                new BigNumber(3),
                true,
                {
                    gasPrice: DEFAULT_GAS_PRICE,
                    value: DEFAULT_PROTOCOL_FEE.times(2),
                },
            );
        });

        it('should pay three protocol fees in ETH  when more than three protocol fees in ETH is sent', async () => {
            await testProtocolFeesReceiver.testBatchFillOrdersProtocolFees.awaitTransactionSuccessAsync(
                testProtocolFees.address,
                DEFAULT_PROTOCOL_FEE_MULTIPLIER,
                new BigNumber(3),
                true,
                {
                    gasPrice: DEFAULT_GAS_PRICE,
                    value: DEFAULT_PROTOCOL_FEE.times(3).plus(10),
                },
            );
        });
    });
});
