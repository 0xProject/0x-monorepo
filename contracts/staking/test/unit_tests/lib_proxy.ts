import { blockchainTests, constants, expect, hexRandom } from '@0x/contracts-test-utils';
import { StakingRevertErrors } from '@0x/order-utils';

import { artifacts, TestLibProxyContract, TestLibProxyReceiverContract } from '../../src';

blockchainTests.resets('LibProxy', env => {
    let proxy: TestLibProxyContract;
    let receiver: TestLibProxyReceiverContract;

    // Generates a random bytes4 value.
    function randomBytes4(): string {
        return hexRandom(4);
    }

    before(async () => {
        proxy = await TestLibProxyContract.deployFrom0xArtifactAsync(
            artifacts.TestLibProxy,
            env.provider,
            env.txDefaults,
            artifacts,
        );

        receiver = await TestLibProxyReceiverContract.deployFrom0xArtifactAsync(
            artifacts.TestLibProxyReceiver,
            env.provider,
            env.txDefaults,
            artifacts,
        );
    });

    enum RevertRule {
        RevertOnError,
        AlwaysRevert,
        NeverRevert,
    }

    // Choose a random 4 byte string of calldata to send and prepend with `0x00` to ensure
    // that it does not call `externalProxyCall` by accident. This calldata will make the fallback
    // in `TestLibProxyReceiver` fail because it is 4 bytes long.
    function constructRandomFailureCalldata(): string {
        return '0x00'.concat(randomBytes4().slice(4, 10));
    }

    // Choose a random 24 byte string of calldata to send and prepend with `0x00` to ensure
    // that it does not call `externalProxyCall` by accident. This calldata will make the fallback
    // in `TestLibProxyReceiver` succeed because it isn't 4 bytes long.
    function constructRandomSuccessCalldata(): string {
        return '0x00'.concat(hexRandom(36).slice(2, 74));
    }

    interface PublicProxyCallArgs {
        destination: string;
        revertRule: RevertRule;
        customEgressSelector: string;
        ignoreIngressSelector: boolean;
        calldata: string;
    }

    // Exposes `publicProxyCall()` with useful default arguments.
    async function publicProxyCallAsync(args: Partial<PublicProxyCallArgs>): Promise<[boolean, string]> {
        return proxy.publicProxyCall.callAsync(
            {
                destination: args.destination || receiver.address,
                revertRule: args.revertRule || RevertRule.RevertOnError,
                customEgressSelector: args.customEgressSelector || constants.NULL_BYTES4,
                ignoreIngressSelector: args.ignoreIngressSelector || false,
            },
            args.calldata || constructRandomSuccessCalldata(),
        );
    }

    describe('proxyCall', () => {
        // Verifies that the result of a given call to `proxyCall()` results in specified outcome
        function checkEndingConditions(result: [boolean, string], success: boolean, calldata: string): void {
            expect(result[0]).to.be.eq(success);
            expect(result[1]).to.be.eq(calldata);
        }

        describe('Failure Conditions', () => {
            // Verifies that the result of a given call to `proxyCall()` results in `ProxyDestinationCannotBeNilError`
            function checkDestinationZeroError(result: [boolean, string]): void {
                const expectedError = new StakingRevertErrors.ProxyDestinationCannotBeNilError();
                expect(result[0]).to.be.false();
                expect(result[1]).to.be.eq(expectedError.encode());
            }

            it('should revert when the destination is address zero', async () => {
                checkDestinationZeroError(await publicProxyCallAsync({ destination: constants.NULL_ADDRESS }));
            });

            it('should revert when the destination is address zero and revertRule == AlwaysRevert', async () => {
                checkDestinationZeroError(
                    await publicProxyCallAsync({
                        destination: constants.NULL_ADDRESS,
                        revertRule: RevertRule.AlwaysRevert,
                    }),
                );
            });

            it('should revert when the destination is address zero and revertRule == NeverRevert', async () => {
                checkDestinationZeroError(
                    await publicProxyCallAsync({
                        destination: constants.NULL_ADDRESS,
                        revertRule: RevertRule.NeverRevert,
                    }),
                );
            });
        });

        describe('Calldata Checks', () => {
            it('should simply forward the calldata and succeed when customEngressSelector == bytes4(0), ignoreIngressSelector == false, and revertRule = RevertOnError', async () => {
                const calldata = constructRandomSuccessCalldata();

                // Ensure that the returndata (the provided calldata) is correct.
                checkEndingConditions(await publicProxyCallAsync({ calldata }), true, calldata);
            });

            it('should send the customEgressSelector followed by the calldata when customEgressSelector != bytes4(0), ignoreIngressSelector == false, and revertRule == RevertOnError', async () => {
                const calldata = constructRandomSuccessCalldata();

                // Choose a random customEgressSelector selector.
                const customEgressSelector = randomBytes4();

                // Ensure that the returndata (the provided calldata) is correct.
                checkEndingConditions(
                    await publicProxyCallAsync({
                        calldata,
                        customEgressSelector,
                    }),
                    true,
                    customEgressSelector.concat(calldata.slice(2, calldata.length)),
                );
            });

            it('should send the the calldata without the selector when customEgressSelector == bytes4(0), ignoreIngressSelector == true, and revertRule == RevertOnError', async () => {
                const calldata = constructRandomSuccessCalldata();

                // Ensure that the returndata (the provided calldata) is correct.
                checkEndingConditions(
                    await publicProxyCallAsync({
                        calldata,
                        ignoreIngressSelector: true,
                    }),
                    true,
                    '0x'.concat(calldata.slice(10, calldata.length)),
                );
            });

            it('should send the calldata with the customEgressSelector replacing its selctor when customEngressSelector != bytes4(0), ignoreIngressSelector == true, and revertRule == RevertOnError', async () => {
                const calldata = constructRandomSuccessCalldata();

                // Choose a random customEgressSelector selector.
                const customEgressSelector = randomBytes4();

                // Ensure that the returndata (the provided calldata) is correct.
                checkEndingConditions(
                    await publicProxyCallAsync({
                        calldata,
                        customEgressSelector,
                        ignoreIngressSelector: true,
                    }),
                    true,
                    customEgressSelector.concat(calldata.slice(10, calldata.length)),
                );
            });
        });

        describe('RevertRule Checks', () => {
            it('should revert with the correct data when the call succeeds and revertRule = AlwaysRevert', async () => {
                const calldata = constructRandomSuccessCalldata();

                // Ensure that the returndata (the provided calldata) is correct.
                checkEndingConditions(
                    await publicProxyCallAsync({
                        calldata,
                        revertRule: RevertRule.AlwaysRevert,
                    }),
                    false,
                    calldata,
                );
            });

            it('should revert with the correct data when the call falls and revertRule = AlwaysRevert', async () => {
                const calldata = constructRandomFailureCalldata();

                // Ensure that the returndata (the provided calldata) is correct.
                checkEndingConditions(
                    await publicProxyCallAsync({
                        calldata,
                        revertRule: RevertRule.AlwaysRevert,
                    }),
                    false,
                    calldata,
                );
            });

            it('should succeed with the correct data when the call succeeds and revertRule = NeverRevert', async () => {
                const calldata = constructRandomSuccessCalldata();

                // Ensure that the returndata (the provided calldata) is correct.
                checkEndingConditions(
                    await publicProxyCallAsync({
                        calldata,
                        revertRule: RevertRule.NeverRevert,
                    }),
                    true,
                    calldata,
                );
            });

            it('should succeed with the correct data when the call falls and revertRule = NeverRevert', async () => {
                const calldata = constructRandomFailureCalldata();

                // Ensure that the returndata (the provided calldata) is correct.
                checkEndingConditions(
                    await publicProxyCallAsync({
                        calldata,
                        revertRule: RevertRule.NeverRevert,
                    }),
                    true,
                    calldata,
                );
            });

            it('should succeed with the correct data when the call succeeds and revertRule = RevertOnError', async () => {
                const calldata = constructRandomSuccessCalldata();

                // Ensure that the returndata (the provided calldata) is correct.
                checkEndingConditions(
                    await publicProxyCallAsync({
                        calldata,
                    }),
                    true,
                    calldata,
                );
            });

            it('should revert with the correct data when the call falls and revertRule = RevertOnError', async () => {
                // Choose a random 4 byte string of calldata to send and replace the first byte with `0x00` to ensure
                // that it does not call `publicProxyCall` by accident.
                const calldata = '0x00'.concat(randomBytes4().slice(4, 10));

                // Ensure that the returndata (the provided calldata) is correct.
                checkEndingConditions(
                    await publicProxyCallAsync({
                        calldata,
                    }),
                    false,
                    calldata,
                );
            });
        });

        // For brevity, only `RevertOnError` was tested by the `customEgressSelector` and `ignoreIngressSelector` tests. These
        // cases are intended to prevent regressions from occuring with the other two revert rules.
        describe('Mixed Checks', () => {
            it('should function correctly when customEgressSelector != bytes4(0) and revertRule == AlwaysRevert', async () => {
                const calldata = constructRandomSuccessCalldata();

                // Choose a random customEgressSelector selector.
                const customEgressSelector = randomBytes4();

                // Ensure that the returndata (the provided calldata) is correct.
                checkEndingConditions(
                    await publicProxyCallAsync({
                        calldata,
                        customEgressSelector,
                        revertRule: RevertRule.AlwaysRevert,
                    }),
                    false,
                    customEgressSelector.concat(calldata.slice(2, calldata.length)),
                );
            });

            it('should function correctly when customEgressSelector != bytes4(0) and revertRule == NeverRevert', async () => {
                const calldata = constructRandomSuccessCalldata();

                // Choose a random customEgressSelector selector.
                const customEgressSelector = randomBytes4();

                // Ensure that the returndata (the provided calldata) is correct.
                checkEndingConditions(
                    await publicProxyCallAsync({
                        calldata,
                        customEgressSelector,
                        revertRule: RevertRule.NeverRevert,
                    }),
                    true,
                    customEgressSelector.concat(calldata.slice(2, calldata.length)),
                );
            });

            it('should function correctly when ignoreIngressSelector == true and revertRule == AlwaysRevert', async () => {
                const calldata = constructRandomSuccessCalldata();

                // Ensure that the returndata (the provided calldata) is correct.
                checkEndingConditions(
                    await publicProxyCallAsync({
                        calldata,
                        ignoreIngressSelector: true,
                        revertRule: RevertRule.AlwaysRevert,
                    }),
                    false,
                    '0x'.concat(calldata.slice(10, calldata.length)),
                );
            });

            it('should function correctly when ignoreIngressSelector == true and revertRule == NeverRevert', async () => {
                const calldata = constructRandomSuccessCalldata();

                // Ensure that the returndata (the provided calldata) is correct.
                checkEndingConditions(
                    await publicProxyCallAsync({
                        calldata,
                        ignoreIngressSelector: true,
                        revertRule: RevertRule.NeverRevert,
                    }),
                    true,
                    '0x'.concat(calldata.slice(10, calldata.length)),
                );
            });
        });
    });
});
