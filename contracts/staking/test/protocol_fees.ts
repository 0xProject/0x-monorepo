import { blockchainTests, constants } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';

import { artifacts, TestProtocolFeesContract, TestProtocolFeesERC20ProxyContract } from '../src';

import { ProtocolFeeActor } from './actors/protocol_fee_actor';

// tslint:disable:no-unnecessary-type-assertion
blockchainTests('Protocol Fee Unit Tests', env => {
    // The accounts that will be used during testing.
    let owner: string;
    let exchange: string;
    let nonExchange: string;
    let makerAddress: string;
    let payerAddress: string;

    // The actor that will be used for testng `payProtocolFee` and `_unwrapETH`.
    let protocolFeeActor: ProtocolFeeActor;

    // The default protocol fee that will be paid -- a somewhat realistic value.
    const DEFAULT_PROTOCOL_FEE_PAID = new BigNumber(150000).times(10000000);

    // The default pool Id that will be used.
    const DEFAULT_POOL_ID = '0x0000000000000000000000000000000000000000000000000000000000000001';

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
        const protocolFees = await TestProtocolFeesContract.deployFrom0xArtifactAsync(
            artifacts.TestProtocolFees,
            env.provider,
            {
                ...env.txDefaults,
                from: owner,
            },
            artifacts,
        );

        // Deploy the erc20Proxy for testing.
        const proxy = await TestProtocolFeesERC20ProxyContract.deployFrom0xArtifactAsync(
            artifacts.TestProtocolFeesERC20Proxy,
            env.provider,
            env.txDefaults,
            {},
        );

        // Register the test ERC20Proxy in the exchange.
        await protocolFees.setWethProxy.awaitTransactionSuccessAsync(proxy.address);

        // Register an exchange in the protocol fee contract.
        await protocolFees.addExchangeAddress.awaitTransactionSuccessAsync(exchange, { from: owner });

        // "Register" the makerAddress in the default pool.
        await protocolFees.addMakerToPool.awaitTransactionSuccessAsync(DEFAULT_POOL_ID, makerAddress);

        // Initialize the protocol fee actor.
        protocolFeeActor = new ProtocolFeeActor([exchange], [makerAddress], protocolFees);
    });

    blockchainTests.resets('payProtocolFee', () => {
        it('should revert if called by a non-exchange', async () => {
            await protocolFeeActor.payProtocolFeeAsync({
                poolId: DEFAULT_POOL_ID,
                makerAddress,
                payerAddress,
                protocolFeePaid: DEFAULT_PROTOCOL_FEE_PAID,
                from: nonExchange,
                value: constants.ZERO_AMOUNT,
            });
        });

        it('should revert if `protocolFeePaid` is zero with zero value sent', async () => {
            await protocolFeeActor.payProtocolFeeAsync({
                poolId: DEFAULT_POOL_ID,
                makerAddress,
                payerAddress,
                protocolFeePaid: constants.ZERO_AMOUNT,
                from: exchange,
                value: constants.ZERO_AMOUNT,
            });
        });

        it('should revert if `protocolFeePaid` is zero with non-zero value sent', async () => {
            await protocolFeeActor.payProtocolFeeAsync({
                poolId: DEFAULT_POOL_ID,
                makerAddress,
                payerAddress,
                protocolFeePaid: constants.ZERO_AMOUNT,
                from: exchange,
                value: DEFAULT_PROTOCOL_FEE_PAID,
            });
        });

        it('should revert if `protocolFeePaid` is different than the provided message value', async () => {
            await protocolFeeActor.payProtocolFeeAsync({
                poolId: DEFAULT_POOL_ID,
                makerAddress,
                payerAddress,
                protocolFeePaid: DEFAULT_PROTOCOL_FEE_PAID.minus(50),
                from: exchange,
                value: DEFAULT_PROTOCOL_FEE_PAID,
            });
        });

        it('should call `transferFrom` in the proxy if no value is sent and the maker is not in a pool', async () => {
            await protocolFeeActor.payProtocolFeeAsync({
                poolId: DEFAULT_POOL_ID,
                makerAddress: payerAddress, // This is an unregistered maker address
                payerAddress,
                protocolFeePaid: DEFAULT_PROTOCOL_FEE_PAID,
                from: exchange,
                value: constants.ZERO_AMOUNT,
            });
        });

        it('should call `transferFrom` in the proxy and update `protocolFeesThisEpochByPool` if no value is sent and the maker is in a pool', async () => {
            await protocolFeeActor.payProtocolFeeAsync({
                poolId: DEFAULT_POOL_ID,
                makerAddress,
                payerAddress,
                protocolFeePaid: DEFAULT_PROTOCOL_FEE_PAID,
                from: exchange,
                value: constants.ZERO_AMOUNT,
            });
        });

        it('should not call `transferFrom` in the proxy and should not update `protocolFeesThisEpochByPool` if value is sent and the maker is not in a pool', async () => {
            await protocolFeeActor.payProtocolFeeAsync({
                poolId: DEFAULT_POOL_ID,
                makerAddress: payerAddress, // This is an unregistered maker address
                payerAddress,
                protocolFeePaid: DEFAULT_PROTOCOL_FEE_PAID,
                from: exchange,
                value: DEFAULT_PROTOCOL_FEE_PAID,
            });
        });

        it('should not call `transferFrom` in the proxy and should update `protocolFeesThisEpochByPool` if value is sent and the maker is in a pool', async () => {
            await protocolFeeActor.payProtocolFeeAsync({
                poolId: DEFAULT_POOL_ID,
                makerAddress,
                payerAddress,
                protocolFeePaid: DEFAULT_PROTOCOL_FEE_PAID,
                from: exchange,
                value: DEFAULT_PROTOCOL_FEE_PAID,
            });
        });

        it('should only have one active pool if a fee is paid on behalf of one maker ETH twice', async () => {
            await protocolFeeActor.payProtocolFeeAsync({
                poolId: DEFAULT_POOL_ID,
                makerAddress,
                payerAddress,
                protocolFeePaid: DEFAULT_PROTOCOL_FEE_PAID,
                from: exchange,
                value: DEFAULT_PROTOCOL_FEE_PAID,
            });

            await protocolFeeActor.payProtocolFeeAsync({
                poolId: DEFAULT_POOL_ID,
                makerAddress,
                payerAddress,
                protocolFeePaid: DEFAULT_PROTOCOL_FEE_PAID,
                from: exchange,
                value: DEFAULT_PROTOCOL_FEE_PAID,
            });
        });

        it('should only have one active pool if a fee is paid on behalf of one maker in WETH and then ETH', async () => {
            await protocolFeeActor.payProtocolFeeAsync({
                poolId: DEFAULT_POOL_ID,
                makerAddress,
                payerAddress,
                protocolFeePaid: DEFAULT_PROTOCOL_FEE_PAID,
                from: exchange,
                value: constants.ZERO_AMOUNT,
            });

            await protocolFeeActor.payProtocolFeeAsync({
                poolId: DEFAULT_POOL_ID,
                makerAddress,
                payerAddress,
                protocolFeePaid: DEFAULT_PROTOCOL_FEE_PAID,
                from: exchange,
                value: DEFAULT_PROTOCOL_FEE_PAID,
            });
        });

        it('should only have one active pool if a fee is paid on behalf of one maker in ETH and then WETH', async () => {
            await protocolFeeActor.payProtocolFeeAsync({
                poolId: DEFAULT_POOL_ID,
                makerAddress,
                payerAddress,
                protocolFeePaid: DEFAULT_PROTOCOL_FEE_PAID,
                from: exchange,
                value: DEFAULT_PROTOCOL_FEE_PAID,
            });

            await protocolFeeActor.payProtocolFeeAsync({
                poolId: DEFAULT_POOL_ID,
                makerAddress,
                payerAddress,
                protocolFeePaid: DEFAULT_PROTOCOL_FEE_PAID,
                from: exchange,
                value: constants.ZERO_AMOUNT,
            });
        });

        it('should only have one active pool if a fee is paid on behalf of one maker in WETH twice', async () => {
            await protocolFeeActor.payProtocolFeeAsync({
                poolId: DEFAULT_POOL_ID,
                makerAddress,
                payerAddress,
                protocolFeePaid: DEFAULT_PROTOCOL_FEE_PAID,
                from: exchange,
                value: constants.ZERO_AMOUNT,
            });

            await protocolFeeActor.payProtocolFeeAsync({
                poolId: DEFAULT_POOL_ID,
                makerAddress,
                payerAddress,
                protocolFeePaid: DEFAULT_PROTOCOL_FEE_PAID,
                from: exchange,
                value: constants.ZERO_AMOUNT,
            });
        });
    });
});
// tslint:enable:no-unnecessary-type-assertion
