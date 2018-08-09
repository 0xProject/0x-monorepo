import { BlockchainLifecycle } from '@0xproject/dev-utils';
import { addSignedMessagePrefix, assetDataUtils, MessagePrefixType, orderHashUtils } from '@0xproject/order-utils';
import { RevertReason, SignatureType, SignedOrder } from '@0xproject/types';
import * as chai from 'chai';
import { LogWithDecodedArgs } from 'ethereum-types';
import ethUtil = require('ethereumjs-util');

import {
    TestSignatureValidatorContract,
    TestSignatureValidatorSignatureValidatorApprovalEventArgs,
} from '../../generated_contract_wrappers/test_signature_validator';
import { ValidatorContract } from '../../generated_contract_wrappers/validator';
import { WalletContract } from '../../generated_contract_wrappers/wallet';
import { addressUtils } from '../utils/address_utils';
import { artifacts } from '../utils/artifacts';
import { expectContractCallFailed } from '../utils/assertions';
import { chaiSetup } from '../utils/chai_setup';
import { constants } from '../utils/constants';
import { LogDecoder } from '../utils/log_decoder';
import { OrderFactory } from '../utils/order_factory';
import { provider, txDefaults, web3Wrapper } from '../utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;

const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
// tslint:disable:no-unnecessary-type-assertion
describe('MixinSignatureValidator', () => {
    let signedOrder: SignedOrder;
    let orderFactory: OrderFactory;
    let signatureValidator: TestSignatureValidatorContract;
    let testWallet: WalletContract;
    let testValidator: ValidatorContract;
    let signerAddress: string;
    let signerPrivateKey: Buffer;
    let notSignerAddress: string;
    let notSignerPrivateKey: Buffer;
    let signatureValidatorLogDecoder: LogDecoder;

    before(async () => {
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    before(async () => {
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        const makerAddress = accounts[0];
        signerAddress = makerAddress;
        notSignerAddress = accounts[1];
        signatureValidator = await TestSignatureValidatorContract.deployFrom0xArtifactAsync(
            artifacts.TestSignatureValidator,
            provider,
            txDefaults,
        );
        testWallet = await WalletContract.deployFrom0xArtifactAsync(
            artifacts.Wallet,
            provider,
            txDefaults,
            signerAddress,
        );
        testValidator = await ValidatorContract.deployFrom0xArtifactAsync(
            artifacts.Validator,
            provider,
            txDefaults,
            signerAddress,
        );
        signatureValidatorLogDecoder = new LogDecoder(web3Wrapper, signatureValidator.address);
        await web3Wrapper.awaitTransactionSuccessAsync(
            await signatureValidator.setSignatureValidatorApproval.sendTransactionAsync(testValidator.address, true, {
                from: signerAddress,
            }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );

        const defaultOrderParams = {
            ...constants.STATIC_ORDER_PARAMS,
            exchangeAddress: signatureValidator.address,
            makerAddress,
            feeRecipientAddress: addressUtils.generatePseudoRandomAddress(),
            makerAssetData: assetDataUtils.encodeERC20AssetData(addressUtils.generatePseudoRandomAddress()),
            takerAssetData: assetDataUtils.encodeERC20AssetData(addressUtils.generatePseudoRandomAddress()),
        };
        signerPrivateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(makerAddress)];
        notSignerPrivateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(notSignerAddress)];
        orderFactory = new OrderFactory(signerPrivateKey, defaultOrderParams);
    });

    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });

    describe('isValidSignature', () => {
        beforeEach(async () => {
            signedOrder = await orderFactory.newSignedOrderAsync();
        });

        it('should revert when signature is empty', async () => {
            const emptySignature = '0x';
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            return expectContractCallFailed(
                signatureValidator.publicIsValidSignature.callAsync(
                    orderHashHex,
                    signedOrder.makerAddress,
                    emptySignature,
                ),
                RevertReason.LengthGreaterThan0Required,
            );
        });

        it('should revert when signature type is unsupported', async () => {
            const unsupportedSignatureType = SignatureType.NSignatureTypes;
            const unsupportedSignatureHex = '0x' + Buffer.from([unsupportedSignatureType]).toString('hex');
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            return expectContractCallFailed(
                signatureValidator.publicIsValidSignature.callAsync(
                    orderHashHex,
                    signedOrder.makerAddress,
                    unsupportedSignatureHex,
                ),
                RevertReason.SignatureUnsupported,
            );
        });

        it('should revert when SignatureType=Illegal', async () => {
            const unsupportedSignatureHex = '0x' + Buffer.from([SignatureType.Illegal]).toString('hex');
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            return expectContractCallFailed(
                signatureValidator.publicIsValidSignature.callAsync(
                    orderHashHex,
                    signedOrder.makerAddress,
                    unsupportedSignatureHex,
                ),
                RevertReason.SignatureIllegal,
            );
        });

        it('should return false when SignatureType=Invalid and signature has a length of zero', async () => {
            const signatureHex = '0x' + Buffer.from([SignatureType.Invalid]).toString('hex');
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            const isValidSignature = await signatureValidator.publicIsValidSignature.callAsync(
                orderHashHex,
                signedOrder.makerAddress,
                signatureHex,
            );
            expect(isValidSignature).to.be.false();
        });

        it('should revert when SignatureType=Invalid and signature length is non-zero', async () => {
            const fillerData = ethUtil.toBuffer('0xdeadbeef');
            const signatureType = ethUtil.toBuffer(`0x${SignatureType.Invalid}`);
            const signatureBuffer = Buffer.concat([fillerData, signatureType]);
            const signatureHex = ethUtil.bufferToHex(signatureBuffer);
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            return expectContractCallFailed(
                signatureValidator.publicIsValidSignature.callAsync(
                    orderHashHex,
                    signedOrder.makerAddress,
                    signatureHex,
                ),
                RevertReason.Length0Required,
            );
        });

        it('should return true when SignatureType=EIP712 and signature is valid', async () => {
            // Create EIP712 signature
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            const orderHashBuffer = ethUtil.toBuffer(orderHashHex);
            const ecSignature = ethUtil.ecsign(orderHashBuffer, signerPrivateKey);
            // Create 0x signature from EIP712 signature
            const signature = Buffer.concat([
                ethUtil.toBuffer(ecSignature.v),
                ecSignature.r,
                ecSignature.s,
                ethUtil.toBuffer(`0x${SignatureType.EIP712}`),
            ]);
            const signatureHex = ethUtil.bufferToHex(signature);
            // Validate signature
            const isValidSignature = await signatureValidator.publicIsValidSignature.callAsync(
                orderHashHex,
                signerAddress,
                signatureHex,
            );
            expect(isValidSignature).to.be.true();
        });

        it('should return false when SignatureType=EIP712 and signature is invalid', async () => {
            // Create EIP712 signature
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            const orderHashBuffer = ethUtil.toBuffer(orderHashHex);
            const ecSignature = ethUtil.ecsign(orderHashBuffer, signerPrivateKey);
            // Create 0x signature from EIP712 signature
            const signature = Buffer.concat([
                ethUtil.toBuffer(ecSignature.v),
                ecSignature.r,
                ecSignature.s,
                ethUtil.toBuffer(`0x${SignatureType.EIP712}`),
            ]);
            const signatureHex = ethUtil.bufferToHex(signature);
            // Validate signature.
            // This will fail because `signerAddress` signed the message, but we're passing in `notSignerAddress`
            const isValidSignature = await signatureValidator.publicIsValidSignature.callAsync(
                orderHashHex,
                notSignerAddress,
                signatureHex,
            );
            expect(isValidSignature).to.be.false();
        });

        it('should return true when SignatureType=EthSign and signature is valid', async () => {
            // Create EthSign signature
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            const orderHashWithEthSignPrefixHex = addSignedMessagePrefix(orderHashHex, MessagePrefixType.EthSign);
            const orderHashWithEthSignPrefixBuffer = ethUtil.toBuffer(orderHashWithEthSignPrefixHex);
            const ecSignature = ethUtil.ecsign(orderHashWithEthSignPrefixBuffer, signerPrivateKey);
            // Create 0x signature from EthSign signature
            const signature = Buffer.concat([
                ethUtil.toBuffer(ecSignature.v),
                ecSignature.r,
                ecSignature.s,
                ethUtil.toBuffer(`0x${SignatureType.EthSign}`),
            ]);
            const signatureHex = ethUtil.bufferToHex(signature);
            // Validate signature
            const isValidSignature = await signatureValidator.publicIsValidSignature.callAsync(
                orderHashHex,
                signerAddress,
                signatureHex,
            );
            expect(isValidSignature).to.be.true();
        });

        it('should return false when SignatureType=EthSign and signature is invalid', async () => {
            // Create EthSign signature
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            const orderHashWithEthSignPrefixHex = addSignedMessagePrefix(orderHashHex, MessagePrefixType.EthSign);
            const orderHashWithEthSignPrefixBuffer = ethUtil.toBuffer(orderHashWithEthSignPrefixHex);
            const ecSignature = ethUtil.ecsign(orderHashWithEthSignPrefixBuffer, signerPrivateKey);
            // Create 0x signature from EthSign signature
            const signature = Buffer.concat([
                ethUtil.toBuffer(ecSignature.v),
                ecSignature.r,
                ecSignature.s,
                ethUtil.toBuffer(`0x${SignatureType.EthSign}`),
            ]);
            const signatureHex = ethUtil.bufferToHex(signature);
            // Validate signature.
            // This will fail because `signerAddress` signed the message, but we're passing in `notSignerAddress`
            const isValidSignature = await signatureValidator.publicIsValidSignature.callAsync(
                orderHashHex,
                notSignerAddress,
                signatureHex,
            );
            expect(isValidSignature).to.be.false();
        });

        it('should return true when SignatureType=Caller and signer is caller', async () => {
            const signature = ethUtil.toBuffer(`0x${SignatureType.Caller}`);
            const signatureHex = ethUtil.bufferToHex(signature);
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            const isValidSignature = await signatureValidator.publicIsValidSignature.callAsync(
                orderHashHex,
                signerAddress,
                signatureHex,
                { from: signerAddress },
            );
            expect(isValidSignature).to.be.true();
        });

        it('should return false when SignatureType=Caller and signer is not caller', async () => {
            const signature = ethUtil.toBuffer(`0x${SignatureType.Caller}`);
            const signatureHex = ethUtil.bufferToHex(signature);
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            const isValidSignature = await signatureValidator.publicIsValidSignature.callAsync(
                orderHashHex,
                signerAddress,
                signatureHex,
                { from: notSignerAddress },
            );
            expect(isValidSignature).to.be.false();
        });

        it('should return true when SignatureType=Wallet and signature is valid', async () => {
            // Create EIP712 signature
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            const orderHashBuffer = ethUtil.toBuffer(orderHashHex);
            const ecSignature = ethUtil.ecsign(orderHashBuffer, signerPrivateKey);
            // Create 0x signature from EIP712 signature
            const signature = Buffer.concat([
                ethUtil.toBuffer(ecSignature.v),
                ecSignature.r,
                ecSignature.s,
                ethUtil.toBuffer(`0x${SignatureType.Wallet}`),
            ]);
            const signatureHex = ethUtil.bufferToHex(signature);
            // Validate signature
            const isValidSignature = await signatureValidator.publicIsValidSignature.callAsync(
                orderHashHex,
                testWallet.address,
                signatureHex,
            );
            expect(isValidSignature).to.be.true();
        });

        it('should return false when SignatureType=Wallet and signature is invalid', async () => {
            // Create EIP712 signature using a private key that does not belong to the wallet owner.
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            const orderHashBuffer = ethUtil.toBuffer(orderHashHex);
            const notWalletOwnerPrivateKey = notSignerPrivateKey;
            const ecSignature = ethUtil.ecsign(orderHashBuffer, notWalletOwnerPrivateKey);
            // Create 0x signature from EIP712 signature
            const signature = Buffer.concat([
                ethUtil.toBuffer(ecSignature.v),
                ecSignature.r,
                ecSignature.s,
                ethUtil.toBuffer(`0x${SignatureType.Wallet}`),
            ]);
            const signatureHex = ethUtil.bufferToHex(signature);
            // Validate signature
            const isValidSignature = await signatureValidator.publicIsValidSignature.callAsync(
                orderHashHex,
                testWallet.address,
                signatureHex,
            );
            expect(isValidSignature).to.be.false();
        });

        it('should return true when SignatureType=Validator, signature is valid and validator is approved', async () => {
            const validatorAddress = ethUtil.toBuffer(`${testValidator.address}`);
            const signatureType = ethUtil.toBuffer(`0x${SignatureType.Validator}`);
            const signature = Buffer.concat([validatorAddress, signatureType]);
            const signatureHex = ethUtil.bufferToHex(signature);
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            const isValidSignature = await signatureValidator.publicIsValidSignature.callAsync(
                orderHashHex,
                signerAddress,
                signatureHex,
            );
            expect(isValidSignature).to.be.true();
        });

        it('should return false when SignatureType=Validator, signature is invalid and validator is approved', async () => {
            const validatorAddress = ethUtil.toBuffer(`${testValidator.address}`);
            const signatureType = ethUtil.toBuffer(`0x${SignatureType.Validator}`);
            const signature = Buffer.concat([validatorAddress, signatureType]);
            const signatureHex = ethUtil.bufferToHex(signature);
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            // This will return false because we signed the message with `signerAddress`, but
            // are validating against `notSignerAddress`
            const isValidSignature = await signatureValidator.publicIsValidSignature.callAsync(
                orderHashHex,
                notSignerAddress,
                signatureHex,
            );
            expect(isValidSignature).to.be.false();
        });

        it('should return false when SignatureType=Validator, signature is valid and validator is not approved', async () => {
            // Set approval of signature validator to false
            await web3Wrapper.awaitTransactionSuccessAsync(
                await signatureValidator.setSignatureValidatorApproval.sendTransactionAsync(
                    testValidator.address,
                    false,
                    { from: signerAddress },
                ),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            // Validate signature
            const validatorAddress = ethUtil.toBuffer(`${testValidator.address}`);
            const signatureType = ethUtil.toBuffer(`0x${SignatureType.Validator}`);
            const signature = Buffer.concat([validatorAddress, signatureType]);
            const signatureHex = ethUtil.bufferToHex(signature);
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            const isValidSignature = await signatureValidator.publicIsValidSignature.callAsync(
                orderHashHex,
                signerAddress,
                signatureHex,
            );
            expect(isValidSignature).to.be.false();
        });

        it('should return true when SignatureType=Trezor and signature is valid', async () => {
            // Create Trezor signature
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            const orderHashWithTrezorPrefixHex = addSignedMessagePrefix(orderHashHex, MessagePrefixType.Trezor);
            const orderHashWithTrezorPrefixBuffer = ethUtil.toBuffer(orderHashWithTrezorPrefixHex);
            const ecSignature = ethUtil.ecsign(orderHashWithTrezorPrefixBuffer, signerPrivateKey);
            // Create 0x signature from Trezor signature
            const signature = Buffer.concat([
                ethUtil.toBuffer(ecSignature.v),
                ecSignature.r,
                ecSignature.s,
                ethUtil.toBuffer(`0x${SignatureType.Trezor}`),
            ]);
            const signatureHex = ethUtil.bufferToHex(signature);
            // Validate signature
            const isValidSignature = await signatureValidator.publicIsValidSignature.callAsync(
                orderHashHex,
                signerAddress,
                signatureHex,
            );
            expect(isValidSignature).to.be.true();
        });

        it('should return false when SignatureType=Trezor and signature is invalid', async () => {
            // Create Trezor signature
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            const orderHashWithTrezorPrefixHex = addSignedMessagePrefix(orderHashHex, MessagePrefixType.Trezor);
            const orderHashWithTrezorPrefixBuffer = ethUtil.toBuffer(orderHashWithTrezorPrefixHex);
            const ecSignature = ethUtil.ecsign(orderHashWithTrezorPrefixBuffer, signerPrivateKey);
            // Create 0x signature from Trezor signature
            const signature = Buffer.concat([
                ethUtil.toBuffer(ecSignature.v),
                ecSignature.r,
                ecSignature.s,
                ethUtil.toBuffer(`0x${SignatureType.Trezor}`),
            ]);
            const signatureHex = ethUtil.bufferToHex(signature);
            // Validate signature.
            // This will fail because `signerAddress` signed the message, but we're passing in `notSignerAddress`
            const isValidSignature = await signatureValidator.publicIsValidSignature.callAsync(
                orderHashHex,
                notSignerAddress,
                signatureHex,
            );
            expect(isValidSignature).to.be.false();
        });

        it('should return true when SignatureType=Presigned and signer has presigned hash', async () => {
            // Presign hash
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            await web3Wrapper.awaitTransactionSuccessAsync(
                await signatureValidator.preSign.sendTransactionAsync(
                    orderHashHex,
                    signedOrder.makerAddress,
                    signedOrder.signature,
                ),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            // Validate presigned signature
            const signature = ethUtil.toBuffer(`0x${SignatureType.PreSigned}`);
            const signatureHex = ethUtil.bufferToHex(signature);
            const isValidSignature = await signatureValidator.publicIsValidSignature.callAsync(
                orderHashHex,
                signedOrder.makerAddress,
                signatureHex,
            );
            expect(isValidSignature).to.be.true();
        });

        it('should return false when SignatureType=Presigned and signer has not presigned hash', async () => {
            const signature = ethUtil.toBuffer(`0x${SignatureType.PreSigned}`);
            const signatureHex = ethUtil.bufferToHex(signature);
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            const isValidSignature = await signatureValidator.publicIsValidSignature.callAsync(
                orderHashHex,
                signedOrder.makerAddress,
                signatureHex,
            );
            expect(isValidSignature).to.be.false();
        });
    });

    describe('setSignatureValidatorApproval', () => {
        it('should emit a SignatureValidatorApprovalSet with correct args when a validator is approved', async () => {
            const approval = true;
            const res = await signatureValidatorLogDecoder.getTxWithDecodedLogsAsync(
                await signatureValidator.setSignatureValidatorApproval.sendTransactionAsync(
                    testValidator.address,
                    approval,
                    {
                        from: signerAddress,
                    },
                ),
            );
            expect(res.logs.length).to.equal(1);
            const log = res.logs[0] as LogWithDecodedArgs<TestSignatureValidatorSignatureValidatorApprovalEventArgs>;
            const logArgs = log.args;
            expect(logArgs.signerAddress).to.equal(signerAddress);
            expect(logArgs.validatorAddress).to.equal(testValidator.address);
            expect(logArgs.approved).to.equal(approval);
        });
        it('should emit a SignatureValidatorApprovalSet with correct args when a validator is disapproved', async () => {
            const approval = false;
            const res = await signatureValidatorLogDecoder.getTxWithDecodedLogsAsync(
                await signatureValidator.setSignatureValidatorApproval.sendTransactionAsync(
                    testValidator.address,
                    approval,
                    {
                        from: signerAddress,
                    },
                ),
            );
            expect(res.logs.length).to.equal(1);
            const log = res.logs[0] as LogWithDecodedArgs<TestSignatureValidatorSignatureValidatorApprovalEventArgs>;
            const logArgs = log.args;
            expect(logArgs.signerAddress).to.equal(signerAddress);
            expect(logArgs.validatorAddress).to.equal(testValidator.address);
            expect(logArgs.approved).to.equal(approval);
        });
    });
});
// tslint:disable:max-file-line-count
// tslint:enable:no-unnecessary-type-assertion
