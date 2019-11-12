import { blockchainTests, constants, expect, randomAddress, transactionHashUtils } from '@0x/contracts-test-utils';
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
                salt: constants.ZERO_AMOUNT,
                gasPrice: constants.ZERO_AMOUNT,
                expirationTimeSeconds: constants.ZERO_AMOUNT,
                signerAddress: constants.NULL_ADDRESS,
                data: '0x1234',
                signature: '0x5678',
                domain: {
                    verifyingContract: exchangeAddress,
                    chainId,
                },
            };
            const txOrigin = constants.NULL_ADDRESS;
            const approval = {
                txOrigin,
                transactionHash: transactionHashUtils.getTransactionHashHex(signedTx),
                transactionSignature: signedTx.signature,
            };
            const expectedApprovalHash = await hashUtils.getApprovalHashHexAsync(
                signedTx,
                coordinatorContract.address,
                txOrigin,
            );
            const approvalHash = await coordinatorContract.getCoordinatorApprovalHash.callAsync(approval);
            expect(expectedApprovalHash).to.eq(approvalHash);
        });
    });
});
