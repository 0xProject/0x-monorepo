import { blockchainTests, constants, expect, randomAddress, verifyEventsFromLogs } from '@0x/contracts-test-utils';
import { hexUtils, OwnableRevertErrors, ZeroExRevertErrors } from '@0x/utils';

import { artifacts } from '../artifacts';
import { basicMigrateAsync } from '../utils/migration';
import {
    ISimpleFunctionRegistryContract,
    ISimpleFunctionRegistryEvents,
    ITestSimpleFunctionRegistryFeatureContract,
    TestSimpleFunctionRegistryFeatureImpl1Contract,
    TestSimpleFunctionRegistryFeatureImpl2Contract,
} from '../wrappers';

blockchainTests.resets('SimpleFunctionRegistry feature', env => {
    const { NULL_ADDRESS } = constants;
    const notOwner = randomAddress();
    let owner: string;
    let registry: ISimpleFunctionRegistryContract;
    let testFnSelector: string;
    let testFeature: ITestSimpleFunctionRegistryFeatureContract;
    let testFeatureImpl1: TestSimpleFunctionRegistryFeatureImpl1Contract;
    let testFeatureImpl2: TestSimpleFunctionRegistryFeatureImpl2Contract;

    before(async () => {
        [owner] = await env.getAccountAddressesAsync();
        const zeroEx = await basicMigrateAsync(owner, env.provider, env.txDefaults);
        registry = new ISimpleFunctionRegistryContract(zeroEx.address, env.provider, {
            ...env.txDefaults,
            from: owner,
        });
        testFeature = new ITestSimpleFunctionRegistryFeatureContract(zeroEx.address, env.provider, env.txDefaults);
        testFnSelector = testFeature.getSelector('testFn');
        testFeatureImpl1 = await TestSimpleFunctionRegistryFeatureImpl1Contract.deployFrom0xArtifactAsync(
            artifacts.TestSimpleFunctionRegistryFeatureImpl1,
            env.provider,
            env.txDefaults,
            artifacts,
        );
        testFeatureImpl2 = await TestSimpleFunctionRegistryFeatureImpl2Contract.deployFrom0xArtifactAsync(
            artifacts.TestSimpleFunctionRegistryFeatureImpl2,
            env.provider,
            env.txDefaults,
            artifacts,
        );
    });

    it('`extend()` cannot be called by a non-owner', async () => {
        const tx = registry.extend(hexUtils.random(4), randomAddress()).callAsync({ from: notOwner });
        return expect(tx).to.revertWith(new OwnableRevertErrors.OnlyOwnerError(notOwner, owner));
    });

    it('`rollback()` cannot be called by a non-owner', async () => {
        const tx = registry.rollback(hexUtils.random(4)).callAsync({ from: notOwner });
        return expect(tx).to.revertWith(new OwnableRevertErrors.OnlyOwnerError(notOwner, owner));
    });

    it('`rollback()` reverts for unregistered function', async () => {
        const tx = registry.rollback(testFnSelector).awaitTransactionSuccessAsync();
        return expect(tx).to.revertWith(
            new ZeroExRevertErrors.SimpleFunctionRegistry.NoRollbackHistoryError(testFnSelector),
        );
    });

    it('owner can add a new function with `extend()`', async () => {
        const { logs } = await registry.extend(testFnSelector, testFeatureImpl1.address).awaitTransactionSuccessAsync();
        verifyEventsFromLogs(
            logs,
            [{ selector: testFnSelector, oldImpl: NULL_ADDRESS, newImpl: testFeatureImpl1.address }],
            ISimpleFunctionRegistryEvents.ProxyFunctionUpdated,
        );
        const r = await testFeature.testFn().callAsync();
        expect(r).to.bignumber.eq(1337);
    });

    it('owner can replace add a function with `extend()`', async () => {
        await registry.extend(testFnSelector, testFeatureImpl1.address).awaitTransactionSuccessAsync();
        await registry.extend(testFnSelector, testFeatureImpl2.address).awaitTransactionSuccessAsync();
        const r = await testFeature.testFn().callAsync();
        expect(r).to.bignumber.eq(1338);
    });

    it('owner can unset a function with `extend()`', async () => {
        await registry.extend(testFnSelector, testFeatureImpl1.address).awaitTransactionSuccessAsync();
        await registry.extend(testFnSelector, constants.NULL_ADDRESS).awaitTransactionSuccessAsync();
        return expect(testFeature.testFn().callAsync()).to.revertWith(
            new ZeroExRevertErrors.Proxy.NotImplementedError(testFnSelector),
        );
    });

    it('owner can rollback a new function to unset', async () => {
        await registry.extend(testFnSelector, testFeatureImpl1.address).awaitTransactionSuccessAsync();
        const { logs } = await registry.rollback(testFnSelector).awaitTransactionSuccessAsync();
        verifyEventsFromLogs(
            logs,
            [{ selector: testFnSelector, oldImpl: testFeatureImpl1.address, newImpl: NULL_ADDRESS }],
            ISimpleFunctionRegistryEvents.ProxyFunctionUpdated,
        );
        return expect(testFeature.testFn().callAsync()).to.revertWith(
            new ZeroExRevertErrors.Proxy.NotImplementedError(testFnSelector),
        );
    });

    it('owner can rollback a function to a previous version', async () => {
        await registry.extend(testFnSelector, testFeatureImpl1.address).awaitTransactionSuccessAsync();
        await registry.extend(testFnSelector, testFeatureImpl2.address).awaitTransactionSuccessAsync();
        await registry.rollback(testFnSelector).awaitTransactionSuccessAsync();
        const r = await testFeature.testFn().callAsync();
        expect(r).to.bignumber.eq(1337);
    });

    it('owner can rollback an unset function to a previous version', async () => {
        await registry.extend(testFnSelector, testFeatureImpl1.address).awaitTransactionSuccessAsync();
        await registry.extend(testFnSelector, constants.NULL_ADDRESS).awaitTransactionSuccessAsync();
        await registry.rollback(testFnSelector).awaitTransactionSuccessAsync();
        const r = await testFeature.testFn().callAsync();
        expect(r).to.bignumber.eq(1337);
    });
});
