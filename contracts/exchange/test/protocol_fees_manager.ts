import { blockchainTests, constants, expect } from '@0x/contracts-test-utils';
import { OwnableRevertErrors } from '@0x/contracts-utils';
import { BigNumber } from '@0x/utils';
import { LogWithDecodedArgs } from 'ethereum-types';

import {
    artifacts,
    ExchangeContract,
    ExchangeProtocolFeeCollectorAddressEventArgs,
    ExchangeProtocolFeeMultiplierEventArgs,
} from '../src';

blockchainTests.resets('MixinProtocolFees', env => {
    let accounts: string[];
    let exchange: ExchangeContract;
    let nonOwner: string;
    let owner: string;
    let protocolFeeCollector: string;

    // The protocolFeeMultiplier that will be used to test the update functions.
    const protocolFeeMultiplier = new BigNumber(15000);

    before(async () => {
        accounts = await env.web3Wrapper.getAvailableAddressesAsync();
        owner = accounts[0];
        nonOwner = accounts[1];
        protocolFeeCollector = accounts[2];

        // Update the from address of the txDefaults. This is the address that will become the owner.
        env.txDefaults.from = owner;

        // Deploy the exchange contract.
        exchange = await ExchangeContract.deployFrom0xArtifactAsync(
            artifacts.Exchange,
            env.provider,
            env.txDefaults,
            {},
            new BigNumber(1337),
        );
    });

    blockchainTests.resets('setProtocolFeeMultiplier', () => {
        it('should revert if msg.sender != owner', async () => {
            const expectedError = new OwnableRevertErrors.OnlyOwnerError(nonOwner, owner);

            // Ensure that the transaction reverts with the expected rich error.
            const tx = exchange.setProtocolFeeCollectorAddress.sendTransactionAsync(protocolFeeCollector, {
                from: nonOwner,
            });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should succeed and emit an ProtocolFeeMultiplier event if msg.sender == owner', async () => {
            // Call the `setProtocolFeeMultiplier()` function and get the receipt.
            const receipt = await exchange.setProtocolFeeMultiplier.awaitTransactionSuccessAsync(
                protocolFeeMultiplier,
                {
                    from: owner,
                },
            );

            // Verify that the protocolFeeCollector address was actually updated to the correct address.
            const updated = await exchange.protocolFeeMultiplier.callAsync();
            expect(updated).bignumber.to.be.eq(protocolFeeMultiplier);

            // Ensure that the correct `ProtocolFeeCollectorAddress` event was logged.
            // tslint:disable:no-unnecessary-type-assertion
            const updatedEvent = receipt.logs[0] as LogWithDecodedArgs<ExchangeProtocolFeeMultiplierEventArgs>;
            expect(updatedEvent.event).to.be.eq('ProtocolFeeMultiplier');
            expect(updatedEvent.args.oldProtocolFeeMultiplier).bignumber.to.be.eq(constants.ZERO_AMOUNT);
            expect(updatedEvent.args.updatedProtocolFeeMultiplier).bignumber.to.be.eq(protocolFeeMultiplier);
        });
    });

    blockchainTests.resets('setProtocolFeeCollectorAddress', () => {
        it('should revert if msg.sender != owner', async () => {
            const expectedError = new OwnableRevertErrors.OnlyOwnerError(nonOwner, owner);

            // Ensure that the transaction reverts with the expected rich error.
            const tx = exchange.setProtocolFeeCollectorAddress.sendTransactionAsync(protocolFeeCollector, {
                from: nonOwner,
            });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should succeed and emit an ProtocolFeeCollectorAddress event if msg.sender == owner', async () => {
            // Call the `setProtocolFeeCollectorAddress()` function and get the receipt.
            const receipt = await exchange.setProtocolFeeCollectorAddress.awaitTransactionSuccessAsync(
                protocolFeeCollector,
                {
                    from: owner,
                },
            );

            // Verify that the protocolFeeCollector address was actually updated to the correct address.
            const updated = await exchange.protocolFeeCollector.callAsync();
            expect(updated).to.be.eq(protocolFeeCollector);

            // Ensure that the correct `UpdatedProtocolFeeCollectorAddress` event was logged.
            // tslint:disable:no-unnecessary-type-assertion
            const updatedEvent = receipt.logs[0] as LogWithDecodedArgs<ExchangeProtocolFeeCollectorAddressEventArgs>;
            expect(updatedEvent.event).to.be.eq('ProtocolFeeCollectorAddress');
            expect(updatedEvent.args.oldProtocolFeeCollector).to.be.eq(constants.NULL_ADDRESS);
            expect(updatedEvent.args.updatedProtocolFeeCollector).to.be.eq(protocolFeeCollector);
        });
    });

    blockchainTests.resets('detachProtocolFeeCollector', () => {
        it('should revert if msg.sender != owner', async () => {
            const expectedError = new OwnableRevertErrors.OnlyOwnerError(nonOwner, owner);

            // Ensure that the transaction reverts with the expected rich error.
            const tx = exchange.detachProtocolFeeCollector.sendTransactionAsync({
                from: nonOwner,
            });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should succeed and emit an ProtocolFeeCollectorAddress event if msg.sender == owner', async () => {
            await exchange.setProtocolFeeCollectorAddress.awaitTransactionSuccessAsync(protocolFeeCollector, {
                from: owner,
            });

            const receipt = await exchange.detachProtocolFeeCollector.awaitTransactionSuccessAsync({
                from: owner,
            });

            // Verify that the protocolFeeCollector address was actually updated to the correct address.
            const updated = await exchange.protocolFeeCollector.callAsync();
            expect(updated).to.be.eq(constants.NULL_ADDRESS);

            // Ensure that the correct `UpdatedProtocolFeeCollectorAddress` event was logged.
            // tslint:disable:no-unnecessary-type-assertion
            const updatedEvent = receipt.logs[0] as LogWithDecodedArgs<ExchangeProtocolFeeCollectorAddressEventArgs>;
            expect(updatedEvent.event).to.be.eq('ProtocolFeeCollectorAddress');
            expect(updatedEvent.args.oldProtocolFeeCollector).to.be.eq(protocolFeeCollector);
            expect(updatedEvent.args.updatedProtocolFeeCollector).to.be.eq(constants.NULL_ADDRESS);
        });
    });
});
