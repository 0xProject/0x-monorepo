import { chaiSetup, constants, provider, randomAddress, txDefaults, web3Wrapper } from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { transactionHashUtils } from '@0x/order-utils';
import { BigNumber, providerUtils } from '@0x/utils';
import * as chai from 'chai';

import { artifacts, CoordinatorContract, hashUtils } from '../src';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('Libs tests', () => {
    let coordinatorContract: CoordinatorContract;
    let chainId: number;
    const exchangeAddress = randomAddress();

    before(async () => {
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    before(async () => {
        chainId = await providerUtils.getChainIdAsync(provider);
        coordinatorContract = await CoordinatorContract.deployFrom0xArtifactAsync(
            artifacts.Coordinator,
            provider,
            txDefaults,
            artifacts,
            exchangeAddress,
            new BigNumber(chainId),
        );
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
                salt: new BigNumber(0),
                expirationTimeSeconds: new BigNumber(0),
                signerAddress: constants.NULL_ADDRESS,
                data: '0x1234',
                domain: {
                    verifyingContractAddress: exchangeAddress,
                    chainId,
                },
            };
            const expectedTxHash = transactionHashUtils.getTransactionHashHex(tx);
            const txHash = await coordinatorContract.getTransactionHash.callAsync(tx);
            expect(expectedTxHash).to.eq(txHash);
        });
    });

    describe('getApprovalHash', () => {
        it('should return the correct approval hash', async () => {
            const signedTx = {
                salt: new BigNumber(0),
                expirationTimeSeconds: new BigNumber(0),
                signerAddress: constants.NULL_ADDRESS,
                data: '0x1234',
                signature: '0x5678',
                domain: {
                    verifyingContractAddress: exchangeAddress,
                    chainId,
                },
            };
            const approvalExpirationTimeSeconds = new BigNumber(0);
            const txOrigin = constants.NULL_ADDRESS;
            const approval = {
                txOrigin,
                transactionHash: transactionHashUtils.getTransactionHashHex(signedTx),
                transactionSignature: signedTx.signature,
                approvalExpirationTimeSeconds,
            };
            const expectedApprovalHash = hashUtils.getApprovalHashHex(
                signedTx,
                coordinatorContract.address,
                txOrigin,
                approvalExpirationTimeSeconds,
            );
            const approvalHash = await coordinatorContract.getCoordinatorApprovalHash.callAsync(approval);
            expect(expectedApprovalHash).to.eq(approvalHash);
        });
    });
});
