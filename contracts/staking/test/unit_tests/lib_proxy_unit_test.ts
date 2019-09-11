import { blockchainTests, constants, expect, hexConcat, hexRandom, hexSlice } from '@0x/contracts-test-utils';
import { StakingRevertErrors } from '@0x/order-utils';

import { artifacts, TestLibProxyContract, TestLibProxyReceiverContract } from '../../src';

blockchainTests.resets.only('LibProxy', env => {
    let proxy: TestLibProxyContract;
    let receiver: TestLibProxyReceiverContract;

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
        return hexConcat('0x00', hexRandom(3));
    }

    // Choose a random 24 byte string of calldata to send and prepend with `0x00` to ensure
    // that it does not call `externalProxyCall` by accident. This calldata will make the fallback
    // in `TestLibProxyReceiver` succeed because it isn't 4 bytes long.
    function constructRandomSuccessCalldata(): string {
        return hexConcat('0x00', hexRandom(35));
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
        function verifyPostConditions(result: [boolean, string], success: boolean, calldata: string): void {
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

        describe('RevertRule Checks', () => {
            it('should revert with the correct data when the call succeeds and revertRule = AlwaysRevert', async () => {
                const calldata = constructRandomSuccessCalldata();

                // Ensure that the returndata (the provided calldata) is correct.
                verifyPostConditions(
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
                verifyPostConditions(
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
                verifyPostConditions(
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
                verifyPostConditions(
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
                verifyPostConditions(
                    await publicProxyCallAsync({
                        calldata,
                    }),
                    true,
                    calldata,
                );
            });

            it('should revert with the correct data when the call falls and revertRule = RevertOnError', async () => {
                const calldata = constructRandomFailureCalldata();

                // Ensure that the returndata (the provided calldata) is correct.
                verifyPostConditions(
                    await publicProxyCallAsync({
                        calldata,
                    }),
                    false,
                    calldata,
                );
            });
        });

        describe('Combinatorial Tests', () => {
            const revertRuleScenarios: RevertRule[] = [
                RevertRule.RevertOnError,
                RevertRule.AlwaysRevert,
                RevertRule.NeverRevert,
            ];
            const ignoreIngressScenarios: boolean[] = [false, true];
            const customEgressScenarios: string[] = [
                constants.NULL_BYTES4,
                constructRandomFailureCalldata(), // Random failure calldata is used because it is nonzero and won't collide.
            ];
            const calldataScenarios: string[] = [constructRandomFailureCalldata(), constructRandomSuccessCalldata()];

            function createTestDescription(
                revertRule: RevertRule,
                customEgressSelector: string,
                ignoreIngressSelector: boolean,
                calldata: string,
            ): string {
                return `should work correctly when revertRule == ${revertRule}, customEgressSelector == ${customEgressSelector},
                    ignoreIngressSelector == ${ignoreIngressSelector}, calldata == ${calldata}`;
            }

            // Combinatorially test `proxyCall()` with all input types.
            for (const revertRule of revertRuleScenarios) {
                for (const customEgressSelector of customEgressScenarios) {
                    for (const shouldIgnoreIngressSelector of ignoreIngressScenarios) {
                        for (const calldata of calldataScenarios) {
                            it(
                                createTestDescription(
                                    revertRule,
                                    customEgressSelector,
                                    shouldIgnoreIngressSelector,
                                    calldata,
                                ),
                                async () => {
                                    // Determine whether or not the call should succeed.
                                    let shouldSucceed = true;
                                    if (
                                        ((shouldIgnoreIngressSelector &&
                                            customEgressSelector !== constants.NULL_BYTES4) ||
                                            (!shouldIgnoreIngressSelector &&
                                                customEgressSelector === constants.NULL_BYTES4)) &&
                                        calldata.length === 10 // This corresponds to a hex length of 4
                                    ) {
                                        shouldSucceed = false;
                                    }

                                    // Override the above success value if the RevertRule defines the success.
                                    if (revertRule === RevertRule.AlwaysRevert) {
                                        shouldSucceed = false;
                                    }
                                    if (revertRule === RevertRule.NeverRevert) {
                                        shouldSucceed = true;
                                    }

                                    // Construct the data that should be returned.
                                    let returnData: string = calldata;
                                    if (shouldIgnoreIngressSelector) {
                                        returnData = hexSlice(returnData, 4);
                                    }
                                    if (customEgressSelector !== constants.NULL_BYTES4) {
                                        returnData = hexConcat(customEgressSelector, returnData);
                                    }

                                    // Ensure that the test passes as expected.
                                    verifyPostConditions(
                                        await publicProxyCallAsync({
                                            calldata,
                                            customEgressSelector,
                                            ignoreIngressSelector: shouldIgnoreIngressSelector,
                                            revertRule,
                                        }),
                                        shouldSucceed,
                                        returnData,
                                    );
                                },
                            );
                        }
                    }
                }
            }
        });
    });
});
