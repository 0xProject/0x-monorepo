import { ChainId, getContractAddressesForChainOrThrow } from '@0x/contract-addresses';
import { devConstants, web3Factory } from '@0x/dev-utils';
import * as chai from 'chai';
import * as dirtyChai from 'dirty-chai';
import 'mocha';

import { runMigrationsAsync } from '../src/migration';

chai.use(dirtyChai);

const expect = chai.expect;

describe('addresses', () => {
    it('should contain the same addresses as contract-addresses', async () => {
        const providerConfigs = { shouldUseInProcessGanache: true };
        const provider = web3Factory.getRpcProvider(providerConfigs);
        const txDefaults = {
            from: devConstants.TESTRPC_FIRST_ADDRESS,
        };
        const migrationAddresses = await runMigrationsAsync(provider, txDefaults);
        const expectedAddresses = getContractAddressesForChainOrThrow(ChainId.Ganache);
        expect(migrationAddresses).to.include(expectedAddresses);
    });
});
