import { blockchainTests, expect, verifyEvents } from '@0x/contracts-test-utils';

import { artifacts, CoordinatorRegistryContract, CoordinatorRegistryCoordinatorEndpointSetEventArgs } from '../src';

// tslint:disable:no-unnecessary-type-assertion
blockchainTests.resets('Coordinator Registry tests', env => {
    let coordinatorRegistry: CoordinatorRegistryContract;
    let coordinatorOperator: string;
    const coordinatorEndpoint = 'http://sometec.0x.org';
    const nilCoordinatorEndpoint = '';
    // tests
    before(async () => {
        // setup accounts (skip owner)
        const accounts = await env.getAccountAddressesAsync();
        [, coordinatorOperator] = accounts;
        // deploy coordinator registry
        coordinatorRegistry = await CoordinatorRegistryContract.deployFrom0xArtifactAsync(
            artifacts.CoordinatorRegistry,
            env.provider,
            env.txDefaults,
            artifacts,
        );
    });
    describe('core', () => {
        it('Should successfully set a Coordinator endpoint', async () => {
            await coordinatorRegistry.setCoordinatorEndpoint(coordinatorEndpoint).awaitTransactionSuccessAsync({
                from: coordinatorOperator,
            });
            const recordedCoordinatorEndpoint = await coordinatorRegistry
                .getCoordinatorEndpoint(coordinatorOperator)
                .callAsync();
            expect(recordedCoordinatorEndpoint).to.be.equal(coordinatorEndpoint);
        });
        it('Should successfully unset a Coordinator endpoint', async () => {
            // set Coordinator endpoint
            await coordinatorRegistry.setCoordinatorEndpoint(coordinatorEndpoint).awaitTransactionSuccessAsync({
                from: coordinatorOperator,
            });
            let recordedCoordinatorEndpoint = await coordinatorRegistry
                .getCoordinatorEndpoint(coordinatorOperator)
                .callAsync();
            expect(recordedCoordinatorEndpoint).to.be.equal(coordinatorEndpoint);
            // unset Coordinator endpoint
            await coordinatorRegistry.setCoordinatorEndpoint(nilCoordinatorEndpoint).awaitTransactionSuccessAsync({
                from: coordinatorOperator,
            });
            recordedCoordinatorEndpoint = await coordinatorRegistry
                .getCoordinatorEndpoint(coordinatorOperator)
                .callAsync();
            expect(recordedCoordinatorEndpoint).to.be.equal(nilCoordinatorEndpoint);
        });
        it('Should emit an event when setting Coordinator endpoint', async () => {
            // set Coordinator endpoint
            const txReceipt = await coordinatorRegistry
                .setCoordinatorEndpoint(coordinatorEndpoint)
                .awaitTransactionSuccessAsync({
                    from: coordinatorOperator,
                });
            const recordedCoordinatorEndpoint = await coordinatorRegistry
                .getCoordinatorEndpoint(coordinatorOperator)
                .callAsync();
            expect(recordedCoordinatorEndpoint).to.be.equal(coordinatorEndpoint);
            // validate event
            const expectedEvent: CoordinatorRegistryCoordinatorEndpointSetEventArgs = {
                coordinatorOperator,
                coordinatorEndpoint,
            };
            verifyEvents(txReceipt, [expectedEvent], 'CoordinatorEndpointSet');
        });
    });
});
