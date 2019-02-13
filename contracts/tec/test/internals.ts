import { chaiSetup, constants, provider, TransactionFactory, txDefaults, web3Wrapper } from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { transactionHashUtils } from '@0x/order-utils';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';

import { artifacts, TestInternalsContract } from '../src';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('Internals tests', () => {
    let transactionSignerAddress: string;
    let approvalSignerAddress: string;
    let testInternals: TestInternalsContract;
    let transactionFactory: TransactionFactory;

    before(async () => {
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    before(async () => {
        testInternals = await TestInternalsContract.deployFrom0xArtifactAsync(
            artifacts.TestInternals,
            provider,
            txDefaults,
        );
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        [transactionSignerAddress, approvalSignerAddress] = accounts.slice(0, 2);
        const transactionSignerPrivateKey = constants.TESTRPC_PRIVATE_KEYS[0];
        const approvalSignerPrivateKey = constants.TESTRPC_PRIVATE_KEYS[1];
        transactionFactory = new TransactionFactory(transactionSignerPrivateKey, testInternals.address);
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });

    describe('getSignerAddress', () => {
        it('should return the correct address', async () => {
            const data = constants.NULL_BYTES;
            const transaction = transactionFactory.newSignedTransaction(data);
            const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
            const signerAddress = await testInternals.publicGetSignerAddress.callAsync(
                transactionHash,
                transaction.signature,
            );
            expect(transaction.signerAddress).to.eq(signerAddress);
        });
    });
});
