import { blockchainTests, constants } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { artifacts, TestRefundableContract, TestRefundableReceiverContract } from '../src';

blockchainTests('Refundable', env => {
    let refundable: TestRefundableContract;
    let receiver: TestRefundableReceiverContract;

    const ONE_HUNDRED = new BigNumber(100);
    const ONE_THOUSAND = new BigNumber(1000);

    before(async () => {
        // Create the refundable contract.
        refundable = await TestRefundableContract.deployFrom0xArtifactAsync(
            artifacts.TestRefundable,
            env.provider,
            env.txDefaults,
            {},
        );

        // Create the receiver contract.
        receiver = await TestRefundableReceiverContract.deployFrom0xArtifactAsync(
            artifacts.TestRefundableReceiver,
            env.provider,
            env.txDefaults,
            {},
        );
    });

    // The contents of these typescript tests is not adequate to understand the assertions that are made during
    // these calls. For a more accurate picture, checkout out "./contracts/test/TestRefundableReceiver.sol". Specifically,
    // the function `testRefundNonzeroBalance()` is used in this test suite.
    blockchainTests.resets('refundNonzeroBalance', () => {
        it('should not send a refund when no value is sent', async () => {
            // Send 100 wei to the refundable contract that should be refunded.
            await receiver.testRefundNonzeroBalance.awaitTransactionSuccessAsync(refundable.address, {
                value: constants.ZERO_AMOUNT,
            });
        });

        it('should send a full refund when nonzero value is sent', async () => {
            // Send 100 wei to the refundable contract that should be refunded.
            await receiver.testRefundNonzeroBalance.awaitTransactionSuccessAsync(refundable.address, {
                value: ONE_HUNDRED,
            });
        });
    });

    // The contents of these typescript tests is not adequate to understand the assertions that are made during
    // these calls. For a more accurate picture, checkout out "./contracts/test/TestRefundableReceiver.sol".
    blockchainTests.resets('refundFinalBalance', () => {
        it('should fully refund the sender when `shouldNotRefund` is false', async () => {
            // Send 100 wei to the refundable contract that should be refunded to the receiver contract.
            await receiver.testRefundFinalBalance.awaitTransactionSuccessAsync(refundable.address, false, {
                value: ONE_HUNDRED,
            });
        });

        // This test may not be necessary, but it is included here as a sanity check.
        it('should fully refund the sender when `shouldNotRefund` is false for two calls in a row', async () => {
            // Send 100 wei to the refundable contract that should be refunded to the receiver contract.
            await receiver.testRefundFinalBalance.awaitTransactionSuccessAsync(refundable.address, false, {
                value: ONE_HUNDRED,
            });

            // Send 1000 wei to the refundable contract that should be refunded to the receiver contract.
            await receiver.testRefundFinalBalance.awaitTransactionSuccessAsync(refundable.address, false, {
                value: new BigNumber(1000),
            });
        });

        it('should not refund the sender if `shouldNotRefund` is true', async () => {
            /// Send 100 wei to the refundable contract that should not be refunded.
            await receiver.testRefundFinalBalance.awaitTransactionSuccessAsync(refundable.address, true, {
                value: new BigNumber(1000),
            });
        });
    });

    // The contents of these typescript tests is not adequate to understand the assertions that are made during
    // these calls. For a more accurate picture, checkout out "./contracts/test/TestRefundableReceiver.sol".
    blockchainTests.resets('disableRefundUntilEnd', () => {
        it('should fully refund the sender when `shouldNotRefund` is false', async () => {
            // Send 100 wei to the refundable contract that should be refunded to the receiver contract.
            await receiver.testDisableRefundUntilEnd.awaitTransactionSuccessAsync(refundable.address, false, {
                value: ONE_HUNDRED,
            });
        });

        // This test may not be necessary, but it is included here as a sanity check.
        it('should fully refund the sender when `shouldNotRefund` is false for two calls in a row', async () => {
            // Send 100 wei to the refundable contract that should be refunded to the receiver contract.
            await receiver.testDisableRefundUntilEnd.awaitTransactionSuccessAsync(refundable.address, false, {
                value: ONE_HUNDRED,
            });

            // Send 1000 wei to the refundable contract that should be refunded to the receiver contract.
            await receiver.testDisableRefundUntilEnd.awaitTransactionSuccessAsync(refundable.address, false, {
                value: ONE_THOUSAND,
            });
        });

        it('should not refund the sender if `shouldNotRefund` is true', async () => {
            /// Send 100 wei to the refundable contract that should not be refunded.
            await receiver.testDisableRefundUntilEnd.awaitTransactionSuccessAsync(refundable.address, false, {
                value: ONE_HUNDRED,
            });
        });

        it('should disable the `disableRefundUntilEnd` modifier and refund when `shouldNotRefund` is false', async () => {
            /// Send 100 wei to the refundable contract that should be refunded.
            await receiver.testNestedDisableRefundUntilEnd.awaitTransactionSuccessAsync(refundable.address, false, {
                value: ONE_HUNDRED,
            });
        });

        it('should disable the `refundFinalBalance` modifier and send no refund when `shouldNotRefund` is true', async () => {
            /// Send 100 wei to the refundable contract that should not be refunded.
            await receiver.testNestedDisableRefundUntilEnd.awaitTransactionSuccessAsync(refundable.address, true, {
                value: ONE_HUNDRED,
            });
        });

        it('should disable the `refundFinalBalance` modifier and refund when `shouldNotRefund` is false', async () => {
            /// Send 100 wei to the refundable contract that should be refunded.
            await receiver.testMixedRefunds.awaitTransactionSuccessAsync(refundable.address, false, {
                value: ONE_HUNDRED,
            });
        });

        it('should disable the `refundFinalBalance` modifier and send no refund when `shouldNotRefund` is true', async () => {
            /// Send 100 wei to the refundable contract that should not be refunded.
            await receiver.testMixedRefunds.awaitTransactionSuccessAsync(refundable.address, true, {
                value: ONE_HUNDRED,
            });
        });
    });
});
