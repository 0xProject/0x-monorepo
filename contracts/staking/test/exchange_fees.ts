import { blockchainTests, constants, expect, hexRandom } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';

import { artifacts, TestExchangeFeesContract } from '../src/';

blockchainTests.resets('Fees tests', env => {
    let testContract: TestExchangeFeesContract;

    before(async () => {
        const [ownerAddress] = await env.getAccountAddressesAsync();
        testContract = await TestExchangeFeesContract.deployFrom0xArtifactAsync(
            artifacts.TestExchangeFees,
            env.provider,
            env.txDefaults,
            artifacts,
            ownerAddress,
        );
    });

    describe('payProtocolFee()', () => {
        let minimumStake: BigNumber;

        function randomAddress(): string {
            return hexRandom(constants.ADDRESS_LENGTH);
        }

        before(async () => {
            minimumStake = (await testContract.getParams.callAsync())[2];
        });

        it('credits pools with stake == minimum', async () => {
            const makerAddress = randomAddress();
            const feePaid = new BigNumber(1e18);
            const poolId = hexRandom();
            await testContract.createTestPool.awaitTransactionSuccessAsync(poolId, minimumStake, [makerAddress]);
            await testContract.payProtocolFee.awaitTransactionSuccessAsync(
                makerAddress,
                constants.NULL_ADDRESS,
                feePaid,
                { value: feePaid },
            );
            const feesCredited = await testContract.getProtocolFeesThisEpochByPool.callAsync(poolId);
            expect(feesCredited).to.bignumber.eq(feePaid);
        });

        it('does not credit pools with stake < minimum', async () => {
            const stake = minimumStake.minus(1);
            const makerAddress = randomAddress();
            const feePaid = new BigNumber(1e18);
            const poolId = hexRandom();
            await testContract.createTestPool.awaitTransactionSuccessAsync(poolId, stake, [makerAddress]);
            await testContract.payProtocolFee.awaitTransactionSuccessAsync(
                makerAddress,
                constants.NULL_ADDRESS,
                feePaid,
                { value: feePaid },
            );
            const feesCredited = await testContract.getProtocolFeesThisEpochByPool.callAsync(poolId);
            expect(feesCredited).to.bignumber.eq(0);
        });
    });
});
// tslint:enable:no-unnecessary-type-assertion
