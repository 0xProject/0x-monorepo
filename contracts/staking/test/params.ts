import { blockchainTests, expect, filterLogsToArguments } from '@0x/contracts-test-utils';
import { AuthorizableRevertErrors, BigNumber } from '@0x/utils';
import { TransactionReceiptWithDecodedLogs } from 'ethereum-types';
import * as _ from 'lodash';

import {
    artifacts,
    IStakingEventsParamsSetEventArgs,
    TestMixinParamsContract,
    TestMixinParamsEvents,
    TestMixinParamsWETHApproveEventArgs,
} from '../src/';

import { constants as stakingConstants } from './utils/constants';
import { StakingParams } from './utils/types';

blockchainTests('Configurable Parameters unit tests', env => {
    let testContract: TestMixinParamsContract;
    let authorizedAddress: string;
    let notAuthorizedAddress: string;

    before(async () => {
        [authorizedAddress, notAuthorizedAddress] = await env.getAccountAddressesAsync();
        testContract = await TestMixinParamsContract.deployFrom0xArtifactAsync(
            artifacts.TestMixinParams,
            env.provider,
            env.txDefaults,
            artifacts,
        );
    });

    blockchainTests.resets('setParams()', () => {
        async function setParamsAndAssertAsync(
            params: Partial<StakingParams>,
            from?: string,
        ): Promise<TransactionReceiptWithDecodedLogs> {
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
            const events = filterLogsToArguments<IStakingEventsParamsSetEventArgs>(receipt.logs, 'ParamsSet');
            expect(events.length).to.eq(1);
            const event = events[0];
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
            return receipt;
        }

        it('throws if not called by an authorized address', async () => {
            const tx = setParamsAndAssertAsync({}, notAuthorizedAddress);
            const expectedError = new AuthorizableRevertErrors.SenderNotAuthorizedError(notAuthorizedAddress);
            return expect(tx).to.revertWith(expectedError);
        });

        it('works if called by owner', async () => {
            return setParamsAndAssertAsync({});
        });
    });
});
// tslint:enable:no-unnecessary-type-assertion
