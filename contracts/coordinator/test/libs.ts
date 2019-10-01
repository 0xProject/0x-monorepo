import { blockchainTests, constants, expect, randomAddress } from '@0x/contracts-test-utils';
import { transactionHashUtils } from '@0x/order-utils';
import { BigNumber } from '@0x/utils';

import { artifacts, CoordinatorContract, hashUtils } from '../src';

blockchainTests.resets('Libs tests', env => {
    let coordinatorContract: CoordinatorContract;
    let chainId: number;
    const exchangeAddress = randomAddress();

    before(async () => {
        chainId = await env.getChainIdAsync();
        coordinatorContract = await CoordinatorContract.deployFrom0xArtifactAsync(
            artifacts.Coordinator,
            env.provider,
            env.txDefaults,
            artifacts,
            exchangeAddress,
            new BigNumber(chainId),
        );
    });

    describe('getApprovalHash', () => {
        it('should return the correct approval hash', async () => {
            const signedTx = {
                salt: new BigNumber(0),
                gasPrice: new BigNumber(0),
                expirationTimeSeconds: new BigNumber(0),
                signerAddress: constants.NULL_ADDRESS,
                data: '0x1234',
                signature: '0x5678',
                domain: {
                    verifyingContract: exchangeAddress,
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
