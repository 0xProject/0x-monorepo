import { chaiSetup, constants, provider, txDefaults, web3Wrapper } from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';

import { artifacts, hashUtils, TestLibsContract } from '../src';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('Libs tests', () => {
    let testLibs: TestLibsContract;

    before(async () => {
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    before(async () => {
        testLibs = await TestLibsContract.deployFrom0xArtifactAsync(artifacts.TestLibs, provider, txDefaults);
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });

    describe('getTransactionHash', () => {
        it('should return the correct transaction hash', async () => {
            const tx = {
                verifyingContractAddress: testLibs.address,
                salt: new BigNumber(0),
                signerAddress: constants.NULL_ADDRESS,
                data: '0x1234',
            };
            const expectedTxHash = hashUtils.getTransactionHashHex(tx);
            const txHash = await testLibs.publicGetTransactionHash.callAsync(tx);
            expect(expectedTxHash).to.eq(txHash);
        });
    });

    describe('getApprovalHash', () => {
        it('should return the correct approval hash', async () => {
            const signedTx = {
                verifyingContractAddress: testLibs.address,
                salt: new BigNumber(0),
                signerAddress: constants.NULL_ADDRESS,
                data: '0x1234',
                signature: '0x5678',
            };
            const approvalExpirationTimeSeconds = new BigNumber(0);
            const txOrigin = constants.NULL_ADDRESS;
            const approval = {
                txOrigin,
                transactionHash: hashUtils.getTransactionHashHex(signedTx),
                transactionSignature: signedTx.signature,
                approvalExpirationTimeSeconds,
            };
            const expectedApprovalHash = hashUtils.getApprovalHashHex(
                signedTx,
                txOrigin,
                approvalExpirationTimeSeconds,
            );
            const approvalHash = await testLibs.publicGetCoordinatorApprovalHash.callAsync(approval);
            expect(expectedApprovalHash).to.eq(approvalHash);
        });
    });
});
