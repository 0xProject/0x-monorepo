import { getContractAddresses } from '@0xproject/migrations';
import * as chai from 'chai';

import { ContractWrappers, ContractWrappersConfig } from '../src';

import { chaiSetup } from './utils/chai_setup';
import { constants } from './utils/constants';
import { provider } from './utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;

describe('ERC20ProxyWrapper', () => {
    let contractWrappers: ContractWrappers;
    before(async () => {
        const config = {
            networkId: constants.TESTRPC_NETWORK_ID,
            contractAddresses: getContractAddresses(),
            blockPollingIntervalMs: 10,
        };
        contractWrappers = new ContractWrappers(provider, config);
    });
    describe('#isAuthorizedAsync', () => {
        it('should return false if the address is not authorized', async () => {
            const isAuthorized = await contractWrappers.erc20Proxy.isAuthorizedAsync(constants.NULL_ADDRESS);
            expect(isAuthorized).to.be.false();
        });
    });
    describe('#getAuthorizedAddressesAsync', () => {
        it('should return the list of authorized addresses', async () => {
            const authorizedAddresses = await contractWrappers.erc20Proxy.getAuthorizedAddressesAsync();
            for (const authorizedAddress of authorizedAddresses) {
                const isAuthorized = await contractWrappers.erc20Proxy.isAuthorizedAsync(authorizedAddress);
                expect(isAuthorized).to.be.true();
            }
        });
    });
});
