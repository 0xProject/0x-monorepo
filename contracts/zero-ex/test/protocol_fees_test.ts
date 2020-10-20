import { blockchainTests, constants, expect } from '@0x/contracts-test-utils';
import { BigNumber, hexUtils } from '@0x/utils';

import { artifacts } from './artifacts';
import { TestProtocolFeesContract, TestStakingContract, TestWethContract } from './wrappers';

blockchainTests.resets('ProtocolFees', env => {
    let payer: string;
    let protocolFees: TestProtocolFeesContract;
    let staking: TestStakingContract;
    let weth: TestWethContract;

    before(async () => {
        [payer] = await env.getAccountAddressesAsync();
        protocolFees = await TestProtocolFeesContract.deployFrom0xArtifactAsync(
            artifacts.TestProtocolFees,
            env.provider,
            env.txDefaults,
            artifacts,
        );
        weth = await TestWethContract.deployFrom0xArtifactAsync(
            artifacts.TestWeth,
            env.provider,
            env.txDefaults,
            artifacts,
        );
        staking = await TestStakingContract.deployFrom0xArtifactAsync(
            artifacts.TestStaking,
            env.provider,
            env.txDefaults,
            artifacts,
            weth.address,
        );
        await weth.mint(payer, constants.ONE_ETHER).awaitTransactionSuccessAsync();
        await weth.approve(protocolFees.address, constants.ONE_ETHER).awaitTransactionSuccessAsync();
    });

    describe('_collectProtocolFee()', () => {
        it('can collect a protocol fee multiple times', async () => {
            const poolId = hexUtils.random();
            const amount1 = new BigNumber(123456);
            const amount2 = new BigNumber(456789);
            let receipt = await protocolFees
                .collectProtocolFee(poolId, amount1, weth.address)
                .awaitTransactionSuccessAsync({ from: payer });

            receipt = await protocolFees
                .transferFeesForPool(poolId, staking.address, weth.address)
                .awaitTransactionSuccessAsync();

            receipt = await protocolFees
                .collectProtocolFee(poolId, amount2, weth.address)
                .awaitTransactionSuccessAsync({ from: payer });

            receipt = await protocolFees
                .transferFeesForPool(poolId, staking.address, weth.address)
                .awaitTransactionSuccessAsync();

            const balance = await staking.balanceForPool(poolId).callAsync();
            const wethBalance = await weth.balanceOf(staking.address).callAsync();

            expect(balance).to.bignumber.eq(wethBalance);

            const total = amount1.plus(amount2);
            // We leave 1 wei behind for gas reasons.
            return expect(balance).to.bignumber.eq(total.minus(1));
        });
    });
});
