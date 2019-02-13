import {
    chaiSetup,
    constants,
    expectContractCallFailedAsync,
    provider,
    txDefaults,
    web3Wrapper,
} from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { transactionHashUtils } from '@0x/order-utils';
import { RevertReason } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import * as ethUtil from 'ethereumjs-util';

import { artifacts, MixinSignatureValidatorContract, TECSignatureType, TECTransactionFactory } from '../src';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('Mixins tests', () => {
    let transactionSignerAddress: string;
    let approvalSignerAddress: string;
    let signatureValidator: MixinSignatureValidatorContract;
    let transactionFactory: TECTransactionFactory;

    before(async () => {
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    before(async () => {
        signatureValidator = await MixinSignatureValidatorContract.deployFrom0xArtifactAsync(
            artifacts.MixinSignatureValidator,
            provider,
            txDefaults,
        );
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        [transactionSignerAddress, approvalSignerAddress] = accounts.slice(0, 2);
        const transactionSignerPrivateKey = constants.TESTRPC_PRIVATE_KEYS[0];
        const approvalSignerPrivateKey = constants.TESTRPC_PRIVATE_KEYS[1];
        transactionFactory = new TECTransactionFactory(transactionSignerPrivateKey, signatureValidator.address);
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });

    describe('getSignerAddress', () => {
        it('should return the correct address using the EthSign signature type', async () => {
            const data = constants.NULL_BYTES;
            const transaction = transactionFactory.newSignedTECTransaction(data, TECSignatureType.EthSign);
            const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
            const signerAddress = await signatureValidator.getSignerAddress.callAsync(
                transactionHash,
                transaction.signature,
            );
            expect(transaction.signerAddress).to.eq(signerAddress);
        });
        it('should return the correct address using the EIP712 signature type', async () => {
            const data = constants.NULL_BYTES;
            const transaction = transactionFactory.newSignedTECTransaction(data, TECSignatureType.EIP712);
            const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
            const signerAddress = await signatureValidator.getSignerAddress.callAsync(
                transactionHash,
                transaction.signature,
            );
            expect(transaction.signerAddress).to.eq(signerAddress);
        });
        it('should revert with with the Illegal signature type', async () => {
            const data = constants.NULL_BYTES;
            const transaction = transactionFactory.newSignedTECTransaction(data);
            const illegalSignatureByte = ethUtil.toBuffer(TECSignatureType.Illegal).toString('hex');
            transaction.signature = `${transaction.signature.slice(
                0,
                transaction.signature.length - 2,
            )}${illegalSignatureByte}`;
            const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
            expectContractCallFailedAsync(
                signatureValidator.getSignerAddress.callAsync(transactionHash, transaction.signature),
                RevertReason.SignatureIllegal,
            );
        });
        it("should revert with with a signature type that doesn't exist", async () => {
            const data = constants.NULL_BYTES;
            const transaction = transactionFactory.newSignedTECTransaction(data);
            const invalidSignatureByte = '03';
            transaction.signature = `${transaction.signature.slice(
                0,
                transaction.signature.length - 2,
            )}${invalidSignatureByte}`;
            const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
            expectContractCallFailedAsync(
                signatureValidator.getSignerAddress.callAsync(transactionHash, transaction.signature),
                RevertReason.SignatureUnsupported,
            );
        });
    });
});
