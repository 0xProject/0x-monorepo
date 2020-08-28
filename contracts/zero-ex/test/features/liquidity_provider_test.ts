import {
    blockchainTests,
    expect,
    getRandomInteger,
    randomAddress,
    verifyEventsFromLogs,
} from '@0x/contracts-test-utils';
import { BigNumber, hexUtils, StringRevertError, ZeroExRevertErrors } from '@0x/utils';

import { IZeroExContract, TokenSpenderFeatureContract } from '../../src/wrappers';
import { artifacts } from '../artifacts';
import { abis } from '../utils/abis';
import { fullMigrateAsync } from '../utils/migration';
import { TestTokenSpenderERC20TokenContract, TestTokenSpenderERC20TokenEvents } from '../wrappers';

blockchainTests.resets('LiquidityProvider feature', env => {
    let zeroEx: IZeroExContract;
    let feature: TokenSpenderFeatureContract;
    let token: TestTokenSpenderERC20TokenContract;
    let allowanceTarget: string;

    before(async () => {
        const [owner] = await env.getAccountAddressesAsync();
        zeroEx = await fullMigrateAsync(owner, env.provider, env.txDefaults, {
            tokenSpender: (await TokenSpenderFeatureContract.deployFrom0xArtifactAsync(
                artifacts.TestTokenSpender,
                env.provider,
                env.txDefaults,
                artifacts,
            )).address,
        });
        feature = new TokenSpenderFeatureContract(zeroEx.address, env.provider, env.txDefaults, abis);
        token = await TestTokenSpenderERC20TokenContract.deployFrom0xArtifactAsync(
            artifacts.TestTokenSpenderERC20Token,
            env.provider,
            env.txDefaults,
            artifacts,
        );
        allowanceTarget = await feature.getAllowanceTarget().callAsync();
    });

    describe('Registry', () => {

    });
    describe('Swap', () => {

    });
});
