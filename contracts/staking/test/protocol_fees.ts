import { blockchainTests, constants, expect, LogDecoder } from '@0x/contracts-test-utils';
import { StakingRevertErrors } from '@0x/order-utils';
import { BigNumber } from '@0x/utils';
import { LogWithDecodedArgs } from 'ethereum-types';

import {
    artifacts,
    TestProtocolFeesContract,
    TestProtocolFeesERC20ProxyContract,
    TestProtocolFeesERC20ProxyTransferFromCalledEventArgs,
} from '../src';

// tslint:disable:no-unnecessary-type-assertion
blockchainTests('Protocol Fee Unit Tests', env => {
    // The accounts that will be used during testing.
    let owner: string;
    let exchange: string;
    let nonExchange: string;
    let makerAddress: string;
    let payerAddress: string;

    // The contract that will be used for testng `payProtocolFee` and `_unwrapETH`.
    let protocolFees: TestProtocolFeesContract;
    let proxy: TestProtocolFeesERC20ProxyContract;

    // The log decoder that will be used to decode logs from TestProtocolFeesERC20Proxy.
    let logDecoder: LogDecoder;

    // The default protocol fee that will be paid -- a somewhat realistic value.
    const DEFAULT_PROTOCOL_FEE_PAID = new BigNumber(150000).times(10000000);

    // The default pool Id that will be used.
    const DEFAULT_POOL_ID = '0x0000000000000000000000000000000000000000000000000000000000000001';

    // The WETH asset data that should be set in the contract.
    const WETH_ASSET_DATA = '0xf47261b0000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';

    before(async () => {
        // Get accounts to represent the exchange and an address that is not a registered exchange.
        [
            owner,
            exchange,
            nonExchange,
            makerAddress,
            payerAddress,
        ] = (await env.web3Wrapper.getAvailableAddressesAsync()).slice(0, 6);

        // Deploy the protocol fees contract.
        protocolFees = await TestProtocolFeesContract.deployFrom0xArtifactAsync(
            artifacts.TestProtocolFees,
            env.provider,
            {
                ...env.txDefaults,
                from: owner,
            },
            {},
        );

        // Deploy the erc20Proxy for testing.
        proxy = await TestProtocolFeesERC20ProxyContract.deployFrom0xArtifactAsync(
            artifacts.TestProtocolFeesERC20Proxy,
            env.provider,
            env.txDefaults,
            {},
        );

        // Register the test ERC20Proxy in the exchange.
        await protocolFees.addERC20AssetProxy.awaitTransactionSuccessAsync(proxy.address);

        // Register an exchange in the protocol fee contract.
        await protocolFees.addExchangeAddress.awaitTransactionSuccessAsync(exchange, { from: owner });

        // "Register" the makerAddress in the default pool.
        await protocolFees.setPoolIdOfMaker.awaitTransactionSuccessAsync(DEFAULT_POOL_ID, makerAddress);

        // Create the log decoder that will be used to decode TransferFromCalledEvent logs.
        logDecoder = new LogDecoder(env.web3Wrapper, artifacts);
    });

    blockchainTests.resets('payProtocolFee', () => {
        // Verify that the DEFAULT_POOL_ID was pushed to the active pool list and that the correct amount
        // is registered in the pool, or that the NIL_POOL's state was unaffected depending on which pool id
        // was provided.
        async function verifyEndStateAsync(poolId: string, amount: BigNumber): Promise<void> {
            if (poolId === DEFAULT_POOL_ID) {
                // Ensure that the `DEFAULT_POOL_ID` was pushed into this epoch's active pool.
                const activePools = await protocolFees.getActivePoolsByEpoch.callAsync();
                expect(activePools.length).to.be.eq(1);
                expect(activePools[0]).to.be.eq(DEFAULT_POOL_ID);

                // Ensure that the `DEFAULT_PROTOCOL_FEE_PAID` was attributed to the maker's pool.
                const feesInMakerPool = await protocolFees.getProtocolFeesThisEpochByPool.callAsync(DEFAULT_POOL_ID);
                expect(feesInMakerPool).bignumber.to.be.eq(amount);
            } else {
                // Ensure that the only active pool this epoch is the "zero" pool.
                const activePools = await protocolFees.getActivePoolsByEpoch.callAsync();
                expect(activePools.length).to.be.eq(0);

                // Ensure that the `NIL_POOL` was not attributed a payment.
                const feesInMakerPool = await protocolFees.getProtocolFeesThisEpochByPool.callAsync(
                    constants.NULL_BYTES32,
                );
                expect(feesInMakerPool).bignumber.to.be.eq(constants.ZERO_AMOUNT);
            }
        }

        it('should revert if called by a non-exchange', async () => {
            const expectedError = new StakingRevertErrors.OnlyCallableByExchangeError(nonExchange);
            const tx = protocolFees.payProtocolFee.sendTransactionAsync(
                makerAddress,
                payerAddress,
                DEFAULT_PROTOCOL_FEE_PAID,
                { from: nonExchange },
            );
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert if `protocolFeePaid` is zero with zero value sent', async () => {
            const expectedError = new StakingRevertErrors.InvalidProtocolFeePaymentError(
                constants.ZERO_AMOUNT,
                constants.ZERO_AMOUNT,
            );
            const tx = protocolFees.payProtocolFee.sendTransactionAsync(
                makerAddress,
                payerAddress,
                constants.ZERO_AMOUNT,
                { from: exchange, value: constants.ZERO_AMOUNT },
            );
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert if `protocolFeePaid` is zero with non-zero value sent', async () => {
            const expectedError = new StakingRevertErrors.InvalidProtocolFeePaymentError(
                constants.ZERO_AMOUNT,
                DEFAULT_PROTOCOL_FEE_PAID,
            );
            const tx = protocolFees.payProtocolFee.sendTransactionAsync(
                makerAddress,
                payerAddress,
                constants.ZERO_AMOUNT,
                { from: exchange, value: DEFAULT_PROTOCOL_FEE_PAID },
            );
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert if `protocolFeePaid` is different than the provided message value', async () => {
            const differentProtocolFeePaid = DEFAULT_PROTOCOL_FEE_PAID.minus(50);
            const expectedError = new StakingRevertErrors.InvalidProtocolFeePaymentError(
                differentProtocolFeePaid,
                DEFAULT_PROTOCOL_FEE_PAID,
            );
            const tx = protocolFees.payProtocolFee.sendTransactionAsync(
                makerAddress,
                payerAddress,
                differentProtocolFeePaid,
                { from: exchange, value: DEFAULT_PROTOCOL_FEE_PAID },
            );
            return expect(tx).to.revertWith(expectedError);
        });

        it('should call `transferFrom` in the proxy if no value is sent and the maker is not in a pool', async () => {
            const receipt = await protocolFees.payProtocolFee.awaitTransactionSuccessAsync(
                payerAddress, // This is an unregistered maker address
                payerAddress,
                DEFAULT_PROTOCOL_FEE_PAID,
                { from: exchange, value: 0 },
            );

            // Ensure that the correct number of logs were recorded.
            expect(receipt.logs.length).to.be.eq(1);

            // Ensure that the correct log was recorded.
            const log = logDecoder.decodeLogOrThrow(receipt.logs[0]) as LogWithDecodedArgs<
                TestProtocolFeesERC20ProxyTransferFromCalledEventArgs
            >;
            expect(log.event).to.be.eq('TransferFromCalled');
            expect(log.args.assetData).to.be.eq(WETH_ASSET_DATA);
            expect(log.args.amount).bignumber.to.be.eq(DEFAULT_PROTOCOL_FEE_PAID);
            expect(log.args.from).to.be.eq(payerAddress);
            expect(log.args.to).to.be.eq(protocolFees.address);

            // Verify that the end state is correct.
            await verifyEndStateAsync(constants.NULL_BYTES32, constants.ZERO_AMOUNT);
        });

        it('should call `transferFrom` in the proxy and update `protocolFeesThisEpochByPool` if no value is sent and the maker is in a pool', async () => {
            const receipt = await protocolFees.payProtocolFee.awaitTransactionSuccessAsync(
                makerAddress,
                payerAddress,
                DEFAULT_PROTOCOL_FEE_PAID,
                { from: exchange, value: 0 },
            );

            // Ensure that the correct number of logs were recorded.
            expect(receipt.logs.length).to.be.eq(1);

            // Ensure that the correct log was recorded.
            const log = logDecoder.decodeLogOrThrow(receipt.logs[0]) as LogWithDecodedArgs<
                TestProtocolFeesERC20ProxyTransferFromCalledEventArgs
            >;
            expect(log.event).to.be.eq('TransferFromCalled');
            expect(log.args.assetData).to.be.eq(WETH_ASSET_DATA);
            expect(log.args.amount).bignumber.to.be.eq(DEFAULT_PROTOCOL_FEE_PAID);
            expect(log.args.from).to.be.eq(payerAddress);
            expect(log.args.to).to.be.eq(protocolFees.address);

            // Verify that the end state is correct.
            await verifyEndStateAsync(DEFAULT_POOL_ID, DEFAULT_PROTOCOL_FEE_PAID);
        });

        it('should not call `transferFrom` in the proxy and should not update `protocolFeesThisEpochByPool` if value is sent and the maker is not in a pool', async () => {
            const receipt = await protocolFees.payProtocolFee.awaitTransactionSuccessAsync(
                payerAddress, // This is an unregistered maker address
                payerAddress,
                DEFAULT_PROTOCOL_FEE_PAID,
                { from: exchange, value: DEFAULT_PROTOCOL_FEE_PAID },
            );

            // Ensure that the correct number of logs were recorded.
            expect(receipt.logs.length).to.be.eq(0);

            // Verify that the end state is correct.
            await verifyEndStateAsync(constants.NULL_BYTES32, constants.ZERO_AMOUNT);
        });

        it('should not call `transferFrom` in the proxy and should update `protocolFeesThisEpochByPool` if value is sent and the maker is in a pool', async () => {
            const receipt = await protocolFees.payProtocolFee.awaitTransactionSuccessAsync(
                makerAddress,
                payerAddress,
                DEFAULT_PROTOCOL_FEE_PAID,
                { from: exchange, value: DEFAULT_PROTOCOL_FEE_PAID },
            );

            // Ensure that the correct number of logs were recorded.
            expect(receipt.logs.length).to.be.eq(0);

            // Verify that the end state is correct.
            await verifyEndStateAsync(DEFAULT_POOL_ID, DEFAULT_PROTOCOL_FEE_PAID);
        });

        it('should only have one active pool if a fee is paid on behalf of one maker ETH twice', async () => {
            // Pay the first fee
            await protocolFees.payProtocolFee.awaitTransactionSuccessAsync(
                makerAddress,
                payerAddress,
                DEFAULT_PROTOCOL_FEE_PAID,
                { from: exchange, value: DEFAULT_PROTOCOL_FEE_PAID },
            );

            // Pay the second fee
            const receipt = await protocolFees.payProtocolFee.awaitTransactionSuccessAsync(
                makerAddress,
                payerAddress,
                DEFAULT_PROTOCOL_FEE_PAID,
                { from: exchange, value: DEFAULT_PROTOCOL_FEE_PAID },
            );

            // Ensure that the correct number of logs were recorded.
            expect(receipt.logs.length).to.be.eq(0);

            // Verify that the end state is correct -- namely that the active pools list was only updated once,
            // and that the correct amount is recorded on behalf of the maker.
            await verifyEndStateAsync(DEFAULT_POOL_ID, DEFAULT_PROTOCOL_FEE_PAID.times(2));
        });

        it('should only have one active pool if a fee is paid on behalf of one maker in WETH and then ETH', async () => {
            // Pay the first fee
            await protocolFees.payProtocolFee.awaitTransactionSuccessAsync(
                makerAddress,
                payerAddress,
                DEFAULT_PROTOCOL_FEE_PAID,
                { from: exchange, value: 0 },
            );

            // Pay the second fee
            const receipt = await protocolFees.payProtocolFee.awaitTransactionSuccessAsync(
                makerAddress,
                payerAddress,
                DEFAULT_PROTOCOL_FEE_PAID,
                { from: exchange, value: DEFAULT_PROTOCOL_FEE_PAID },
            );

            // Ensure that the correct number of logs were recorded.
            expect(receipt.logs.length).to.be.eq(0);

            // Verify that the end state is correct -- namely that the active pools list was only updated once,
            // and that the correct amount is recorded on behalf of the maker.
            await verifyEndStateAsync(DEFAULT_POOL_ID, DEFAULT_PROTOCOL_FEE_PAID.times(2));
        });

        it('should only have one active pool if a fee is paid on behalf of one maker in ETH and then WETH', async () => {
            // Pay the first fee
            await protocolFees.payProtocolFee.awaitTransactionSuccessAsync(
                makerAddress,
                payerAddress,
                DEFAULT_PROTOCOL_FEE_PAID,
                { from: exchange, value: DEFAULT_PROTOCOL_FEE_PAID },
            );

            // Pay the second fee
            const receipt = await protocolFees.payProtocolFee.awaitTransactionSuccessAsync(
                makerAddress,
                payerAddress,
                DEFAULT_PROTOCOL_FEE_PAID,
                { from: exchange, value: 0 },
            );

            // Ensure that the correct number of logs were recorded.
            expect(receipt.logs.length).to.be.eq(1);

            // Ensure that the correct log was recorded
            const log = logDecoder.decodeLogOrThrow(receipt.logs[0]) as LogWithDecodedArgs<
                TestProtocolFeesERC20ProxyTransferFromCalledEventArgs
            >;
            expect(log.event).to.be.eq('TransferFromCalled');
            expect(log.args.assetData).to.be.eq(WETH_ASSET_DATA);
            expect(log.args.amount).bignumber.to.be.eq(DEFAULT_PROTOCOL_FEE_PAID);
            expect(log.args.from).to.be.eq(payerAddress);
            expect(log.args.to).to.be.eq(protocolFees.address);

            // Verify that the end state is correct -- namely that the active pools list was only updated once,
            // and that the correct amount is recorded on behalf of the maker.
            await verifyEndStateAsync(DEFAULT_POOL_ID, DEFAULT_PROTOCOL_FEE_PAID.times(2));
        });

        it('should only have one active pool if a fee is paid on behalf of one maker in WETH twice', async () => {
            // Pay the first fee
            await protocolFees.payProtocolFee.awaitTransactionSuccessAsync(
                makerAddress,
                payerAddress,
                DEFAULT_PROTOCOL_FEE_PAID,
                { from: exchange, value: 0 },
            );

            // Pay the second fee
            const receipt = await protocolFees.payProtocolFee.awaitTransactionSuccessAsync(
                makerAddress,
                payerAddress,
                DEFAULT_PROTOCOL_FEE_PAID,
                { from: exchange, value: 0 },
            );

            // Ensure that the correct number of logs were recorded.
            expect(receipt.logs.length).to.be.eq(1);

            // Ensure that the correct log was recorded.
            const log = logDecoder.decodeLogOrThrow(receipt.logs[0]) as LogWithDecodedArgs<
                TestProtocolFeesERC20ProxyTransferFromCalledEventArgs
            >;
            expect(log.event).to.be.eq('TransferFromCalled');
            expect(log.args.assetData).to.be.eq(WETH_ASSET_DATA);
            expect(log.args.amount).bignumber.to.be.eq(DEFAULT_PROTOCOL_FEE_PAID);
            expect(log.args.from).to.be.eq(payerAddress);
            expect(log.args.to).to.be.eq(protocolFees.address);

            // Verify that the end state is correct -- namely that the active pools list was only updated once,
            // and that the correct amount is recorded on behalf of the maker.
            await verifyEndStateAsync(DEFAULT_POOL_ID, DEFAULT_PROTOCOL_FEE_PAID.times(2));
        });
    });
});
