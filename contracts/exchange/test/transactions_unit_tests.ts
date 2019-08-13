import { blockchainTests, chaiSetup, describe } from '@0x/contracts-test-utils';
import * as chai from 'chai';
import * as _ from 'lodash';

import { artifacts, TestTransactionsContract } from '../src';

chaiSetup.configure();
const expect = chai.expect;
blockchainTests.resets('FillOrder Tests', ({ provider, web3Wrapper, txDefaults }) => {
    let transactionsContract: TestTransactionsContract;
    let accounts: string[];

    before(async () => {
        accounts = await web3Wrapper.getAvailableAddressesAsync();

        transactionsContract = await TestTransactionsContract.deployFrom0xArtifactAsync(
            artifacts.TestTransactions,
            provider,
            txDefaults,
            {},
        );
    });

    describe('getCurrentContext', () => {
        it('should return the sender address when there is not a saved context address', async () => {
            const currentContextAddress = await transactionsContract.getCurrentContextAddress.callAsync({
                from: accounts[0],
            });
            expect(currentContextAddress).to.be.eq(accounts[0]);
        });

        it('should return the sender address when there is a saved context address', async () => {
            // Set the current context address to the taker address
            await transactionsContract.setCurrentContextAddress.sendTransactionAsync(accounts[1]);

            // Ensure that the queried current context address is the same as the address that was set.
            const currentContextAddress = await transactionsContract.getCurrentContextAddress.callAsync({
                from: accounts[0],
            });
            expect(currentContextAddress).to.be.eq(accounts[1]);
        });
    });
});
