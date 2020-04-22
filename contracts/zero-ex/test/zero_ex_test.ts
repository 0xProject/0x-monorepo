import { blockchainTests, constants, expect, verifyEventsFromLogs } from '@0x/contracts-test-utils';
import { BigNumber, ZeroExRevertErrors } from '@0x/utils';

import { artifacts } from './artifacts';
import { initialMigrateAsync } from './utils/migration';
import {
    IFeatureContract,
    IOwnableContract,
    ISimpleFunctionRegistryContract,
    TestZeroExFeatureContract,
    TestZeroExFeatureEvents,
    ZeroExContract,
} from './wrappers';

blockchainTests.resets('ZeroEx contract', env => {
    let owner: string;
    let zeroEx: ZeroExContract;
    let ownable: IOwnableContract;
    let registry: ISimpleFunctionRegistryContract;
    let testFeature: TestZeroExFeatureContract;

    before(async () => {
        [owner] = await env.getAccountAddressesAsync();
        zeroEx = await initialMigrateAsync(owner, env.provider, env.txDefaults);
        ownable = new IOwnableContract(zeroEx.address, env.provider, env.txDefaults);
        registry = new ISimpleFunctionRegistryContract(zeroEx.address, env.provider, env.txDefaults);
        testFeature = new TestZeroExFeatureContract(zeroEx.address, env.provider, env.txDefaults);
        // Register test features.
        const testFeatureImpl = await TestZeroExFeatureContract.deployFrom0xArtifactAsync(
            artifacts.TestZeroExFeature,
            env.provider,
            env.txDefaults,
            artifacts,
        );
        for (const fn of ['payableFn', 'notPayableFn', 'internalFn']) {
            await registry
                .extend(testFeature.getSelector(fn), testFeatureImpl.address)
                .awaitTransactionSuccessAsync({ from: owner });
        }
    });

    it('can receive ether', async () => {
        const txHash = await env.web3Wrapper.sendTransactionAsync({
            from: owner,
            to: zeroEx.address,
            data: constants.NULL_BYTES,
            value: 1,
        });
        await env.web3Wrapper.awaitTransactionSuccessAsync(txHash);
    });

    it('can attach ether to a call', async () => {
        const wei = Math.floor(Math.random() * 100 + 1);
        const receipt = await testFeature.payableFn().awaitTransactionSuccessAsync({ value: wei });
        verifyEventsFromLogs(receipt.logs, [{ value: new BigNumber(wei) }], TestZeroExFeatureEvents.PayableFnCalled);
    });

    it('reverts when attaching ether to a non-payable function', async () => {
        const wei = Math.floor(Math.random() * 100 + 1);
        const tx = testFeature.notPayableFn().awaitTransactionSuccessAsync({ value: wei });
        // This will cause an empty revert.
        return expect(tx).to.be.rejectedWith('revert');
    });

    it('reverts when calling an unimplmented function', async () => {
        const selector = testFeature.getSelector('unimplmentedFn');
        const tx = testFeature.unimplmentedFn().awaitTransactionSuccessAsync();
        return expect(tx).to.revertWith(new ZeroExRevertErrors.Proxy.NotImplementedError(selector));
    });

    it('reverts when calling an internal function', async () => {
        const tx = testFeature.internalFn().awaitTransactionSuccessAsync({ from: owner });
        return expect(tx).to.revertWith(new ZeroExRevertErrors.Common.OnlyCallableBySelfError(owner));
    });

    describe('getFunctionImplementation()', () => {
        it('returns the correct implementations of the initial features', async () => {
            const ownableSelectors = [ownable.getSelector('transferOwnership')];
            const registrySelectors = [
                registry.getSelector('rollback'),
                registry.getSelector('extend'),
                // registry.getSelector('extendSelf'),
            ];
            const selectors = [...ownableSelectors, ...registrySelectors];
            const impls = await Promise.all(selectors.map(s => zeroEx.getFunctionImplementation(s).callAsync()));
            for (let i = 0; i < impls.length; ++i) {
                const selector = selectors[i];
                const impl = impls[i];
                const feat = new IFeatureContract(impl, env.provider, env.txDefaults);
                const featName = ownableSelectors.includes(selector) ? 'Ownable' : 'SimpleFunctionRegistry';
                expect(await feat.FEATURE_NAME().callAsync()).to.eq(featName);
            }
        });
    });
});
