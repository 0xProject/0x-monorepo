import { blockchainTests, constants, expect, filterLogsToArguments } from '@0x/contracts-test-utils';
import { StakingRevertErrors } from '@0x/order-utils';
import { BigNumber, OwnableRevertErrors } from '@0x/utils';

import { artifacts, IStakingEventsParamsSetEventArgs, MixinParamsContract } from '../src/';

import { constants as stakingConstants } from './utils/constants';
import { StakingParams } from './utils/types';

blockchainTests('Configurable Parameters', env => {
    let testContract: MixinParamsContract;
    let ownerAddress: string;
    let notOwnerAddress: string;

    before(async () => {
        [ownerAddress, notOwnerAddress] = await env.getAccountAddressesAsync();
        testContract = await MixinParamsContract.deployFrom0xArtifactAsync(
            artifacts.MixinParams,
            env.provider,
            env.txDefaults,
            artifacts,
        );
    });

    blockchainTests.resets('setParams()', () => {
        async function setParamsAndAssertAsync(params: Partial<StakingParams>, from?: string): Promise<void> {
            const _params = {
                ...stakingConstants.DEFAULT_PARAMS,
                ...params,
            };
            const receipt = await testContract.setParams.awaitTransactionSuccessAsync(
                new BigNumber(_params.epochDurationInSeconds),
                new BigNumber(_params.rewardDelegatedStakeWeight),
                new BigNumber(_params.minimumPoolStake),
                new BigNumber(_params.maximumMakersInPool),
                new BigNumber(_params.cobbDouglasAlphaNumerator),
                new BigNumber(_params.cobbDouglasAlphaDenominator),
                _params.wethProxyAddress,
                _params.ethVaultAddress,
                _params.rewardVaultAddress,
                _params.zrxVaultAddress,
                { from },
            );
            // Assert event.
            expect(receipt.logs.length).to.eq(1);
            const event = filterLogsToArguments<IStakingEventsParamsSetEventArgs>(receipt.logs, 'ParamsSet')[0];
            expect(event.epochDurationInSeconds).to.bignumber.eq(_params.epochDurationInSeconds);
            expect(event.rewardDelegatedStakeWeight).to.bignumber.eq(_params.rewardDelegatedStakeWeight);
            expect(event.minimumPoolStake).to.bignumber.eq(_params.minimumPoolStake);
            expect(event.maximumMakersInPool).to.bignumber.eq(_params.maximumMakersInPool);
            expect(event.cobbDouglasAlphaNumerator).to.bignumber.eq(_params.cobbDouglasAlphaNumerator);
            expect(event.cobbDouglasAlphaDenominator).to.bignumber.eq(_params.cobbDouglasAlphaDenominator);
            expect(event.wethProxyAddress).to.eq(_params.wethProxyAddress);
            expect(event.ethVaultAddress).to.eq(_params.ethVaultAddress);
            expect(event.rewardVaultAddress).to.eq(_params.rewardVaultAddress);
            expect(event.zrxVaultAddress).to.eq(_params.zrxVaultAddress);
            // Assert `getParams()`.
            const actual = await testContract.getParams.callAsync();
            expect(actual[0]).to.bignumber.eq(_params.epochDurationInSeconds);
            expect(actual[1]).to.bignumber.eq(_params.rewardDelegatedStakeWeight);
            expect(actual[2]).to.bignumber.eq(_params.minimumPoolStake);
            expect(actual[3]).to.bignumber.eq(_params.maximumMakersInPool);
            expect(actual[4]).to.bignumber.eq(_params.cobbDouglasAlphaNumerator);
            expect(actual[5]).to.bignumber.eq(_params.cobbDouglasAlphaDenominator);
            expect(actual[6]).to.eq(_params.wethProxyAddress);
            expect(actual[7]).to.eq(_params.ethVaultAddress);
            expect(actual[8]).to.eq(_params.rewardVaultAddress);
            expect(actual[9]).to.eq(_params.zrxVaultAddress);
        }

        it('throws if not called by owner', async () => {
            const tx = setParamsAndAssertAsync({}, notOwnerAddress);
            const expectedError = new OwnableRevertErrors.OnlyOwnerError(notOwnerAddress, ownerAddress);
            return expect(tx).to.revertWith(expectedError);
        });

        it('works if called by owner', async () => {
            return setParamsAndAssertAsync({});
        });
    });
});
// tslint:enable:no-unnecessary-type-assertion
