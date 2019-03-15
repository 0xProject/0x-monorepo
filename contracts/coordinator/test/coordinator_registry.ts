import { artifacts as exchangeArtifacts } from '@0x/contracts-exchange';
import { chaiSetup, provider, web3Wrapper } from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import * as chai from 'chai';
import { LogWithDecodedArgs } from 'ethereum-types';

import { CoordinatorRegistryCoordinatorEndpointSetEventArgs } from '../src';

import { CoordinatorRegistryWrapper } from './utils/coordinator_registry_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
web3Wrapper.abiDecoder.addABI(exchangeArtifacts.Exchange.compilerOutput.abi);
// tslint:disable:no-unnecessary-type-assertion
describe('Coordinator Registry tests', () => {
    let coordinatorOperator: string;
    const coordinatorEndpoint = 'http://sometec.0x.org';
    const nilCoordinatorEndpoint = '';
    let coordinatorRegistryWrapper: CoordinatorRegistryWrapper;
    // tests
    before(async () => {
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    before(async () => {
        // setup accounts (skip owner)
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        [, coordinatorOperator] = accounts;
        // deploy coordinator registry
        coordinatorRegistryWrapper = new CoordinatorRegistryWrapper(provider);
        await coordinatorRegistryWrapper.deployCoordinatorRegistryAsync();
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
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
