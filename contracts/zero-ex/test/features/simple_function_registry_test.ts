import { blockchainTests, constants, expect, randomAddress, verifyEventsFromLogs } from '@0x/contracts-test-utils';
import { BigNumber, hexUtils, OwnableRevertErrors, ZeroExRevertErrors } from '@0x/utils';

import { ZeroExContract } from '../../src/wrappers';
import { artifacts } from '../artifacts';
import { initialMigrateAsync } from '../utils/migration';
import {
    ISimpleFunctionRegistryFeatureContract,
    ISimpleFunctionRegistryFeatureEvents,
    ITestSimpleFunctionRegistryFeatureContract,
    TestSimpleFunctionRegistryFeatureImpl1Contract,
    TestSimpleFunctionRegistryFeatureImpl2Contract,
} from '../wrappers';

blockchainTests.resets('SimpleFunctionRegistry feature', env => {
    const { NULL_ADDRESS } = constants;
    const notOwner = randomAddress();
    let owner: string;
    let zeroEx: ZeroExContract;
    let registry: ISimpleFunctionRegistryFeatureContract;
    let testFnSelector: string;
    let testFeature: ITestSimpleFunctionRegistryFeatureContract;
    let testFeatureImpl1: TestSimpleFunctionRegistryFeatureImpl1Contract;
    let testFeatureImpl2: TestSimpleFunctionRegistryFeatureImpl2Contract;

    before(async () => {
        [owner] = await env.getAccountAddressesAsync();
        zeroEx = await initialMigrateAsync(owner, env.provider, env.txDefaults);
        registry = new ISimpleFunctionRegistryFeatureContract(zeroEx.address, env.provider, {
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
        const tx = registry.rollback(hexUtils.random(4), NULL_ADDRESS).callAsync({ from: notOwner });
        return expect(tx).to.revertWith(new OwnableRevertErrors.OnlyOwnerError(notOwner, owner));
    });

    it('`rollback()` to non-zero impl reverts for unregistered function', async () => {
        const rollbackAddress = randomAddress();
        const tx = registry.rollback(testFnSelector, rollbackAddress).awaitTransactionSuccessAsync();
        return expect(tx).to.revertWith(
            new ZeroExRevertErrors.SimpleFunctionRegistry.NotInRollbackHistoryError(testFnSelector, rollbackAddress),
        );
    });

    it('`rollback()` to zero impl succeeds for unregistered function', async () => {
        await registry.rollback(testFnSelector, NULL_ADDRESS).awaitTransactionSuccessAsync();
        const impl = await zeroEx.getFunctionImplementation(testFnSelector).callAsync();
        expect(impl).to.eq(NULL_ADDRESS);
    });

    it('owner can add a new function with `extend()`', async () => {
        const { logs } = await registry.extend(testFnSelector, testFeatureImpl1.address).awaitTransactionSuccessAsync();
        verifyEventsFromLogs(
            logs,
            [{ selector: testFnSelector, oldImpl: NULL_ADDRESS, newImpl: testFeatureImpl1.address }],
            ISimpleFunctionRegistryFeatureEvents.ProxyFunctionUpdated,
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

    it('owner can zero a function with `extend()`', async () => {
        await registry.extend(testFnSelector, testFeatureImpl1.address).awaitTransactionSuccessAsync();
        await registry.extend(testFnSelector, constants.NULL_ADDRESS).awaitTransactionSuccessAsync();
        return expect(testFeature.testFn().callAsync()).to.revertWith(
            new ZeroExRevertErrors.Proxy.NotImplementedError(testFnSelector),
        );
    });

    it('can query rollback history', async () => {
        await registry.extend(testFnSelector, testFeatureImpl1.address).awaitTransactionSuccessAsync();
        await registry.extend(testFnSelector, testFeatureImpl2.address).awaitTransactionSuccessAsync();
        await registry.extend(testFnSelector, NULL_ADDRESS).awaitTransactionSuccessAsync();
        const rollbackLength = await registry.getRollbackLength(testFnSelector).callAsync();
        expect(rollbackLength).to.bignumber.eq(3);
        const entries = await Promise.all(
            [...new Array(rollbackLength.toNumber())].map((v, i) =>
                registry.getRollbackEntryAtIndex(testFnSelector, new BigNumber(i)).callAsync(),
            ),
        );
        expect(entries).to.deep.eq([NULL_ADDRESS, testFeatureImpl1.address, testFeatureImpl2.address]);
    });

    it('owner can rollback a function to zero', async () => {
        await registry.extend(testFnSelector, testFeatureImpl1.address).awaitTransactionSuccessAsync();
        await registry.extend(testFnSelector, testFeatureImpl2.address).awaitTransactionSuccessAsync();
        const { logs } = await registry.rollback(testFnSelector, NULL_ADDRESS).awaitTransactionSuccessAsync();
        verifyEventsFromLogs(
            logs,
            [{ selector: testFnSelector, oldImpl: testFeatureImpl2.address, newImpl: NULL_ADDRESS }],
            ISimpleFunctionRegistryFeatureEvents.ProxyFunctionUpdated,
        );
        const rollbackLength = await registry.getRollbackLength(testFnSelector).callAsync();
        expect(rollbackLength).to.bignumber.eq(0);
        return expect(testFeature.testFn().callAsync()).to.revertWith(
            new ZeroExRevertErrors.Proxy.NotImplementedError(testFnSelector),
        );
    });

    it('owner can rollback a function to the prior version', async () => {
        await registry.extend(testFnSelector, testFeatureImpl1.address).awaitTransactionSuccessAsync();
        await registry.extend(testFnSelector, testFeatureImpl2.address).awaitTransactionSuccessAsync();
        await registry.rollback(testFnSelector, testFeatureImpl1.address).awaitTransactionSuccessAsync();
        const r = await testFeature.testFn().callAsync();
        expect(r).to.bignumber.eq(1337);
        const rollbackLength = await registry.getRollbackLength(testFnSelector).callAsync();
        expect(rollbackLength).to.bignumber.eq(1);
    });

    it('owner can rollback a zero function to the prior version', async () => {
        await registry.extend(testFnSelector, testFeatureImpl2.address).awaitTransactionSuccessAsync();
        await registry.extend(testFnSelector, testFeatureImpl1.address).awaitTransactionSuccessAsync();
        await registry.extend(testFnSelector, constants.NULL_ADDRESS).awaitTransactionSuccessAsync();
        await registry.rollback(testFnSelector, testFeatureImpl1.address).awaitTransactionSuccessAsync();
        const r = await testFeature.testFn().callAsync();
        expect(r).to.bignumber.eq(1337);
        const rollbackLength = await registry.getRollbackLength(testFnSelector).callAsync();
        expect(rollbackLength).to.bignumber.eq(2);
    });

    it('owner can rollback a function to a much older version', async () => {
        await registry.extend(testFnSelector, testFeatureImpl1.address).awaitTransactionSuccessAsync();
        await registry.extend(testFnSelector, NULL_ADDRESS).awaitTransactionSuccessAsync();
        await registry.extend(testFnSelector, testFeatureImpl2.address).awaitTransactionSuccessAsync();
        await registry.rollback(testFnSelector, testFeatureImpl1.address).awaitTransactionSuccessAsync();
        const r = await testFeature.testFn().callAsync();
        expect(r).to.bignumber.eq(1337);
        const rollbackLength = await registry.getRollbackLength(testFnSelector).callAsync();
        expect(rollbackLength).to.bignumber.eq(1);
    });

    it('owner cannot rollback a function to a version not in history', async () => {
        await registry.extend(testFnSelector, NULL_ADDRESS).awaitTransactionSuccessAsync();
        await registry.extend(testFnSelector, testFeatureImpl2.address).awaitTransactionSuccessAsync();
        const tx = registry.rollback(testFnSelector, testFeatureImpl1.address).awaitTransactionSuccessAsync();
        return expect(tx).to.revertWith(
            new ZeroExRevertErrors.SimpleFunctionRegistry.NotInRollbackHistoryError(
                testFnSelector,
                testFeatureImpl1.address,
            ),
        );
    });
});
