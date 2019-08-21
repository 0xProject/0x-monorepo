import { blockchainTests, constants, expect, LogDecoder } from '@0x/contracts-test-utils';
import { BigNumber, OwnableRevertErrors } from '@0x/utils';
import { LogWithDecodedArgs } from 'ethereum-types';

import {
    artifacts,
    ExchangeContract,
    ExchangeUpdatedProtocolFeeMultiplierEventArgs,
    ExchangeUpdatedStakingAddressEventArgs,
    ExchangeUpdatedWethAddressEventArgs,
} from '../src';

blockchainTests.resets('MixinStakingManager', env => {
    let accounts: string[];
    let exchange: ExchangeContract;
    let logDecoder: LogDecoder;
    let nonOwner: string;
    let owner: string;
    let staking: string;
    let weth: string;

    // The protocolFeeMultiplier that will be used to test the update functions.
    const protocolFeeMultiplier = new BigNumber(15000);

    before(async () => {
        accounts = await env.web3Wrapper.getAvailableAddressesAsync();
        owner = accounts[0];
        nonOwner = accounts[1];
        staking = accounts[2];
        weth = accounts[3];

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

        // Configure the log decoder
        logDecoder = new LogDecoder(env.web3Wrapper, artifacts);
    });

    blockchainTests.resets('updateProtocolFeeMultiplier', () => {
        it('should revert if msg.sender != owner', async () => {
            const expectedError = new OwnableRevertErrors.OnlyOwnerError(nonOwner, owner);

            // Ensure that the transaction reverts with the expected rich error.
            const tx = exchange.updateStakingAddress.sendTransactionAsync(staking, {
                from: nonOwner,
            });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should succeed and emit an UpdatedProtocolFeeMultiplier event if msg.sender == owner', async () => {
            // Call the `updateProtocolFeeMultiplier()` function and get the receipt.
            const receipt = await logDecoder.getTxWithDecodedLogsAsync(
                await exchange.updateProtocolFeeMultiplier.sendTransactionAsync(protocolFeeMultiplier, {
                    from: owner,
                }),
            );

            // Verify that the staking address was actually updated to the correct address.
            const updated = await exchange.protocolFeeMultiplier.callAsync();
            expect(updated).bignumber.to.be.eq(protocolFeeMultiplier);

            // Ensure that the correct `UpdatedStakingAddress` event was logged.
            // tslint:disable:no-unnecessary-type-assertion
            const updatedEvent = receipt.logs[0] as LogWithDecodedArgs<ExchangeUpdatedProtocolFeeMultiplierEventArgs>;
            expect(updatedEvent.event).to.be.eq('UpdatedProtocolFeeMultiplier');
            expect(updatedEvent.args.oldProtocolFeeMultiplier).bignumber.to.be.eq(constants.ZERO_AMOUNT);
            expect(updatedEvent.args.updatedProtocolFeeMultiplier).bignumber.to.be.eq(protocolFeeMultiplier);
        });
    });

    blockchainTests.resets('updateStakingAddress', () => {
        it('should revert if msg.sender != owner', async () => {
            const expectedError = new OwnableRevertErrors.OnlyOwnerError(nonOwner, owner);

            // Ensure that the transaction reverts with the expected rich error.
            const tx = exchange.updateStakingAddress.sendTransactionAsync(staking, {
                from: nonOwner,
            });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should succeed and emit an UpdatedStakingAddress event if msg.sender == owner', async () => {
            // Call the `updateStakingAddress()` function and get the receipt.
            const receipt = await logDecoder.getTxWithDecodedLogsAsync(
                await exchange.updateStakingAddress.sendTransactionAsync(staking, {
                    from: owner,
                }),
            );

            // Verify that the staking address was actually updated to the correct address.
            const updated = await exchange.staking.callAsync();
            expect(updated).to.be.eq(staking);

            // Ensure that the correct `UpdatedStakingAddress` event was logged.
            // tslint:disable:no-unnecessary-type-assertion
            const updatedEvent = receipt.logs[0] as LogWithDecodedArgs<ExchangeUpdatedStakingAddressEventArgs>;
            expect(updatedEvent.event).to.be.eq('UpdatedStakingAddress');
            expect(updatedEvent.args.oldStaking).to.be.eq(constants.NULL_ADDRESS);
            expect(updatedEvent.args.updatedStaking).to.be.eq(staking);
        });
    });

    blockchainTests.resets('updateWethAddress', () => {
        it('should revert if msg.sender != owner', async () => {
            const expectedError = new OwnableRevertErrors.OnlyOwnerError(nonOwner, owner);

            // Ensure that the transaction reverts with the expected rich error.
            const tx = exchange.updateWethAddress.sendTransactionAsync(weth, {
                from: nonOwner,
            });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should succeed and emit an UpdatedStakingAddress event if msg.sender == owner', async () => {
            // Call the `updateWethAddress()` function and get the receipt.
            const receipt = await logDecoder.getTxWithDecodedLogsAsync(
                await exchange.updateWethAddress.sendTransactionAsync(weth, {
                    from: owner,
                }),
            );

            // Verify that the staking address was actually updated to the correct address.
            const updated = await exchange.weth.callAsync();
            expect(updated).to.be.eq(weth);

            // Ensure that the correct `UpdatedStakingAddress` event was logged.
            // tslint:disable:no-unnecessary-type-assertion
            const updatedEvent = receipt.logs[0] as LogWithDecodedArgs<ExchangeUpdatedWethAddressEventArgs>;
            expect(updatedEvent.event).to.be.eq('UpdatedWethAddress');
            expect(updatedEvent.args.oldWeth).to.be.eq(constants.NULL_ADDRESS);
            expect(updatedEvent.args.updatedWeth).to.be.eq(weth);
        });
    });
});
