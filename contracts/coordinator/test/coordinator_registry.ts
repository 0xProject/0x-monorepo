import { blockchainTests, expect } from '@0x/contracts-test-utils';
import { LogWithDecodedArgs } from 'ethereum-types';

import { CoordinatorRegistryCoordinatorEndpointSetEventArgs } from '../src';

import { CoordinatorRegistryWrapper } from './utils/coordinator_registry_wrapper';

// tslint:disable:no-unnecessary-type-assertion
blockchainTests.resets('Coordinator Registry tests', env => {
    let coordinatorOperator: string;
    const coordinatorEndpoint = 'http://sometec.0x.org';
    const nilCoordinatorEndpoint = '';
    let coordinatorRegistryWrapper: CoordinatorRegistryWrapper;
    // tests
    before(async () => {
        // setup accounts (skip owner)
        const accounts = await env.getAccountAddressesAsync();
        [, coordinatorOperator] = accounts;
        // deploy coordinator registry
        coordinatorRegistryWrapper = new CoordinatorRegistryWrapper(env.provider);
        await coordinatorRegistryWrapper.deployCoordinatorRegistryAsync();
    });
    describe('core', () => {
        it('Should successfully set a Coordinator endpoint', async () => {
            await coordinatorRegistryWrapper.setCoordinatorEndpointAsync(coordinatorOperator, coordinatorEndpoint);
            const recordedCoordinatorEndpoint = await coordinatorRegistryWrapper.getCoordinatorEndpointAsync(
                coordinatorOperator,
            );
            expect(recordedCoordinatorEndpoint).to.be.equal(coordinatorEndpoint);
        });
        it('Should successfully unset a Coordinator endpoint', async () => {
            // set Coordinator endpoint
            await coordinatorRegistryWrapper.setCoordinatorEndpointAsync(coordinatorOperator, coordinatorEndpoint);
            let recordedCoordinatorEndpoint = await coordinatorRegistryWrapper.getCoordinatorEndpointAsync(
                coordinatorOperator,
            );
            expect(recordedCoordinatorEndpoint).to.be.equal(coordinatorEndpoint);
            // unset Coordinator endpoint
            await coordinatorRegistryWrapper.setCoordinatorEndpointAsync(coordinatorOperator, nilCoordinatorEndpoint);
            recordedCoordinatorEndpoint = await coordinatorRegistryWrapper.getCoordinatorEndpointAsync(
                coordinatorOperator,
            );
            expect(recordedCoordinatorEndpoint).to.be.equal(nilCoordinatorEndpoint);
        });
        it('Should emit an event when setting Coordinator endpoint', async () => {
            // set Coordinator endpoint
            const txReceipt = await coordinatorRegistryWrapper.setCoordinatorEndpointAsync(
                coordinatorOperator,
                coordinatorEndpoint,
            );
            const recordedCoordinatorEndpoint = await coordinatorRegistryWrapper.getCoordinatorEndpointAsync(
                coordinatorOperator,
            );
            expect(recordedCoordinatorEndpoint).to.be.equal(coordinatorEndpoint);
            // validate event
            expect(txReceipt.logs.length).to.be.equal(1);
            const log = txReceipt.logs[0] as LogWithDecodedArgs<CoordinatorRegistryCoordinatorEndpointSetEventArgs>;
            expect(log.args.coordinatorOperator).to.be.equal(coordinatorOperator);
            expect(log.args.coordinatorEndpoint).to.be.equal(coordinatorEndpoint);
        });
    });
});
