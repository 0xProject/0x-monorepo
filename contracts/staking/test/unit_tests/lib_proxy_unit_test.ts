import {
    blockchainTests,
    constants,
    expect,
    hexConcat,
    hexRandom,
    hexSlice,
    testCombinatoriallyWithReferenceFunc,
} from '@0x/contracts-test-utils';
import { StakingRevertErrors } from '@0x/order-utils';

import { artifacts, TestLibProxyContract, TestLibProxyReceiverContract } from '../../src';

blockchainTests.resets('LibProxy', env => {
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

    interface PublicProxyCallArgs {
        destination: string;
        revertRule: RevertRule;
        customEgressSelector: string;
        ignoreIngressSelector: boolean;
        calldata: string;
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

    // Verifies that the result of a given call to `proxyCall()` results in specified outcome
    function verifyPostConditions(result: [boolean, string], success: boolean, calldata: string): void {
        expect(result[0]).to.be.eq(success);
        expect(result[1]).to.be.eq(calldata);
    }

    // Verifies that the result of a given call to `proxyCall()` results in `ProxyDestinationCannotBeNilError`
    function verifyDestinationZeroError(result: [boolean, string]): void {
        const expectedError = new StakingRevertErrors.ProxyDestinationCannotBeNilError();
        expect(result[0]).to.be.false();
        expect(result[1]).to.be.eq(expectedError.encode());
    }

    describe('proxyCall', () => {
        describe('Failure Conditions', () => {
            it('should revert when the destination is address zero', async () => {
                verifyDestinationZeroError(await publicProxyCallAsync({ destination: constants.NULL_ADDRESS }));
            });

            it('should revert when the destination is address zero and revertRule == AlwaysRevert', async () => {
                verifyDestinationZeroError(
                    await publicProxyCallAsync({
                        destination: constants.NULL_ADDRESS,
                        revertRule: RevertRule.AlwaysRevert,
                    }),
                );
            });

            it('should revert when the destination is address zero and revertRule == NeverRevert', async () => {
                verifyDestinationZeroError(
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
            // Combinatorial Scenarios for `proxyCall()`.
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

            // A reference function that returns the expected success and returndata values of a given call to `proxyCall()`.
            async function referenceFuncAsync(
                revertRule: RevertRule,
                customEgressSelector: string,
                shouldIgnoreIngressSelector: boolean,
                calldata: string,
            ): Promise<[boolean, string]> {
                // Determine whether or not the call should succeed.
                let shouldSucceed = true;
                if (
                    ((shouldIgnoreIngressSelector && customEgressSelector !== constants.NULL_BYTES4) ||
                        (!shouldIgnoreIngressSelector && customEgressSelector === constants.NULL_BYTES4)) &&
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
                let returnData = calldata;
                if (shouldIgnoreIngressSelector) {
                    returnData = hexSlice(returnData, 4);
                }
                if (customEgressSelector !== constants.NULL_BYTES4) {
                    returnData = hexConcat(customEgressSelector, returnData);
                }

                // Return the success and return data values.
                return [shouldSucceed, returnData];
            }

            // A wrapper for `publicProxyCall()` that allow us to combinatorially test `proxyCall()` for the
            // scenarios defined above.
            async function testFuncAsync(
                revertRule: RevertRule,
                customEgressSelector: string,
                shouldIgnoreIngressSelector: boolean,
                calldata: string,
            ): Promise<[boolean, string]> {
                return publicProxyCallAsync({
                    calldata,
                    customEgressSelector,
                    ignoreIngressSelector: shouldIgnoreIngressSelector,
                    revertRule,
                });
            }

            // Combinatorially test proxy call.
            testCombinatoriallyWithReferenceFunc('proxyCall', referenceFuncAsync, testFuncAsync, [
                revertRuleScenarios,
                customEgressScenarios,
                ignoreIngressScenarios,
                calldataScenarios,
            ]);
        });
    });
});
