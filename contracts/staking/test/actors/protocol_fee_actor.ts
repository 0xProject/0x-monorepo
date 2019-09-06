import { constants, expect } from '@0x/contracts-test-utils';
import { StakingRevertErrors } from '@0x/order-utils';
import { BigNumber } from '@0x/utils';
import { LogWithDecodedArgs } from 'ethereum-types';

import { TestProtocolFeesContract, TestProtocolFeesERC20ProxyTransferFromCalledEventArgs } from '../../src';

export interface PayProtocolFeeArgs {
    poolId: string;
    makerAddress: string;
    payerAddress: string;
    protocolFeePaid: BigNumber;
    from: string;
    value: BigNumber;
}

// tslint:disable:no-unnecessary-type-assertion
export class ProtocolFeeActor {
    private readonly _exchanges: string[];
    private readonly _registered_makers: string[];
    private readonly _protocolFees: TestProtocolFeesContract;
    private readonly _wethAssetData = '0xf47261b0000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';

    constructor(exchanges: string[], makers: string[], protocolFees: TestProtocolFeesContract) {
        this._exchanges = exchanges;
        this._protocolFees = protocolFees;
        this._registered_makers = makers;
    }

    /**
     * This function will test the `payProtocolFee()` function, and will revert if the behavior deviates
     * whatsoever from the expected behavior.
     * @param makerAddress The address of the order's maker.
     * @param payerAddress The address that is responsible for paying the protocol fee.
     * @param protocolFeePaid The fee that should be paid to the staking contract.
     * @param from The address that should send the transaction.
     * @param value The amount of value that should be sent in the transaction.
     */
    public async payProtocolFeeAsync(args: PayProtocolFeeArgs): Promise<void> {
        // Get the original state to compare with afterwards
        const originalActivePools = await this._protocolFees.getActivePoolsByEpoch.callAsync();
        const originalProtocolFeesCollected = await this._protocolFees.getProtocolFeesThisEpochByPool.callAsync(
            args.poolId,
        );

        // If the poolId is already registered, it should not be added to the active pools list. Otherwise, it should be added.
        const shouldBeAdded = !originalActivePools.includes(args.poolId);

        // Handle all of the failure cases.
        const tx = this._protocolFees.payProtocolFee.awaitTransactionSuccessAsync(
            args.makerAddress,
            args.payerAddress,
            args.protocolFeePaid,
            { from: args.from, value: args.value },
        );
        if (!this._exchanges.includes(args.from)) {
            const expectedError = new StakingRevertErrors.OnlyCallableByExchangeError(args.from);
            return expect(tx, 'should revert when the `from` address is not a registered exchange').to.revertWith(
                expectedError,
            );
        } else if (args.protocolFeePaid.eq(0)) {
            const expectedError = new StakingRevertErrors.InvalidProtocolFeePaymentError(
                StakingRevertErrors.ProtocolFeePaymentErrorCodes.ZeroProtocolFeePaid,
                constants.ZERO_AMOUNT,
                new BigNumber(args.value),
            );
            return expect(tx, 'should revert when the `protocolFeePaid` is zero').to.revertWith(expectedError);
        } else if (!args.protocolFeePaid.eq(args.value) && !args.value.eq(0)) {
            const expectedError = new StakingRevertErrors.InvalidProtocolFeePaymentError(
                StakingRevertErrors.ProtocolFeePaymentErrorCodes.MismatchedFeeAndPayment,
                args.protocolFeePaid,
                new BigNumber(args.value),
            );
            return expect(tx, 'should revert when the `protocolFeePaid` and the value are mismatched').to.revertWith(
                expectedError,
            );
        }

        // Call the transaction and collect the logs.
        const receipt = await tx;

        // If WETH should have been paid, an event should be logged. Otherwise, no event should have been logged.
        if (args.value.eq(0)) {
            // Ensure that one log was recorded.
            expect(receipt.logs.length, 'log length should be one').to.be.eq(1);

            // Ensure that the correct log was recorded.
            const log = receipt.logs[0] as LogWithDecodedArgs<TestProtocolFeesERC20ProxyTransferFromCalledEventArgs>;
            expect(log.event, 'log event should be `TransferFromCalled`').to.be.eq('TransferFromCalled');
            expect(log.args.assetData, 'log `assetData` should be `wethAssetData`').to.be.eq(this._wethAssetData);
            expect(log.args.amount, 'log `amount` should be `protocolFeePaid`').bignumber.to.be.eq(
                args.protocolFeePaid,
            );
            expect(log.args.from, 'log `from` should be `payerAddress`').to.be.eq(args.payerAddress);
            expect(log.args.to).to.be.eq(this._protocolFees.address);
        } else {
            expect(receipt.logs.length, 'log length should be zero').to.be.eq(0);
        }

        // Get the final state.
        const finalActivePools = await this._protocolFees.getActivePoolsByEpoch.callAsync();
        const finalProtocolFeesCollected = await this._protocolFees.getProtocolFeesThisEpochByPool.callAsync(
            args.poolId,
        );

        // Check that the active pools list was updated appropriately.
        if (shouldBeAdded && this._registered_makers.includes(args.makerAddress)) {
            // Check that the pool id was added to the list of active pools for this epoch.
            expect(finalActivePools.length, 'final active pools should have been updated').to.be.eq(
                originalActivePools.length + 1,
            );
            expect(finalActivePools.includes(args.poolId), 'final active pools should contain pool id').to.be.true();
        } else {
            // Check that active pools list was not altered.
            expect(finalActivePools, 'final active pools should be identical to original active pools').to.be.deep.eq(
                originalActivePools,
            );
        }

        // Check that the pool has the correct amount of fees attributed to it for this epoch.
        if (this._registered_makers.includes(args.makerAddress)) {
            expect(
                finalProtocolFeesCollected,
                'final protocol fees should be the original protocol fees plus the fee paid',
            ).bignumber.to.be.eq(originalProtocolFeesCollected.plus(args.protocolFeePaid));
        }
    }
}
// tslint:enable:no-unnecessary-type-assertion
