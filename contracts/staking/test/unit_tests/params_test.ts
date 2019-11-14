import { blockchainTests, expect, filterLogsToArguments } from '@0x/contracts-test-utils';
import { AuthorizableRevertErrors } from '@0x/contracts-utils';
import { BigNumber } from '@0x/utils';
import { TransactionReceiptWithDecodedLogs } from 'ethereum-types';
import * as _ from 'lodash';

import { artifacts } from '../artifacts';
import { IStakingEventsParamsSetEventArgs, TestMixinParamsContract } from '../wrappers';

import { constants as stakingConstants } from '../../src/constants';
import { StakingParams } from '../../src/types';

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
        await testContract.addAuthorizedAddress(authorizedAddress).awaitTransactionSuccessAsync();
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
            const receipt = await testContract
                .setParams(
                    new BigNumber(_params.epochDurationInSeconds),
                    new BigNumber(_params.rewardDelegatedStakeWeight),
                    new BigNumber(_params.minimumPoolStake),
                    new BigNumber(_params.cobbDouglasAlphaNumerator),
                    new BigNumber(_params.cobbDouglasAlphaDenominator),
                )
                .awaitTransactionSuccessAsync({ from });
            // Assert event.
            const events = filterLogsToArguments<IStakingEventsParamsSetEventArgs>(receipt.logs, 'ParamsSet');
            expect(events.length).to.eq(1);
            const event = events[0];
            expect(event.epochDurationInSeconds).to.bignumber.eq(_params.epochDurationInSeconds);
            expect(event.rewardDelegatedStakeWeight).to.bignumber.eq(_params.rewardDelegatedStakeWeight);
            expect(event.minimumPoolStake).to.bignumber.eq(_params.minimumPoolStake);
            expect(event.cobbDouglasAlphaNumerator).to.bignumber.eq(_params.cobbDouglasAlphaNumerator);
            expect(event.cobbDouglasAlphaDenominator).to.bignumber.eq(_params.cobbDouglasAlphaDenominator);
            // Assert `getParams()`.
            const actual = await testContract.getParams().callAsync();
            expect(actual[0]).to.bignumber.eq(_params.epochDurationInSeconds);
            expect(actual[1]).to.bignumber.eq(_params.rewardDelegatedStakeWeight);
            expect(actual[2]).to.bignumber.eq(_params.minimumPoolStake);
            expect(actual[3]).to.bignumber.eq(_params.cobbDouglasAlphaNumerator);
            expect(actual[4]).to.bignumber.eq(_params.cobbDouglasAlphaDenominator);
            return receipt;
        }

        it('throws if not called by an authorized address', async () => {
            const tx = setParamsAndAssertAsync({}, notAuthorizedAddress);
            const expectedError = new AuthorizableRevertErrors.SenderNotAuthorizedError(notAuthorizedAddress);
            return expect(tx).to.revertWith(expectedError);
        });

        it('throws if `assertValidStorageParams()` throws`', async () => {
            await testContract.setShouldFailAssertValidStorageParams(true).awaitTransactionSuccessAsync();
            const tx = setParamsAndAssertAsync({});
            return expect(tx).to.revertWith('ASSERT_VALID_STORAGE_PARAMS_FAILED');
        });

        it('works if called by owner', async () => {
            return setParamsAndAssertAsync({});
        });
    });
});
// tslint:enable:no-unnecessary-type-assertion
