import {
    addressUtils,
    chaiSetup,
    constants,
    LogDecoder,
    OrderFactory,
    provider,
    txDefaults,
    web3Wrapper,
} from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { assetDataUtils, ExchangeRevertErrors, orderHashUtils, signatureUtils } from '@0x/order-utils';
import { SignatureType, SignedOrder } from '@0x/types';
import { BigNumber, providerUtils, StringRevertError } from '@0x/utils';
import * as chai from 'chai';
import { LogWithDecodedArgs } from 'ethereum-types';
import ethUtil = require('ethereumjs-util');

import {
    artifacts,
    TestRevertReceiverContract,
    TestSignatureValidatorContract,
    TestSignatureValidatorSignatureValidatorApprovalEventArgs,
    TestStaticCallReceiverContract,
    ValidatorContract,
    WalletContract,
} from '../src';

chaiSetup.configure();
const expect = chai.expect;

const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
// tslint:disable:no-unnecessary-type-assertion
describe('MixinSignatureValidator', () => {
    let chainId: number;
    let signedOrder: SignedOrder;
    let orderFactory: OrderFactory;
    let signatureValidator: TestSignatureValidatorContract;
    let testWallet: WalletContract;
    let testValidator: ValidatorContract;
    let maliciousWallet: TestStaticCallReceiverContract;
    let maliciousValidator: TestStaticCallReceiverContract;
    let revertingWallet: TestRevertReceiverContract;
    let revertingValidator: TestRevertReceiverContract;
    let externalRevertReason: string;
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
        chainId = await providerUtils.getChainIdAsync(provider);
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        const makerAddress = accounts[0];
        signerAddress = makerAddress;
        notSignerAddress = accounts[1];
        signatureValidator = await TestSignatureValidatorContract.deployFrom0xArtifactAsync(
            artifacts.TestSignatureValidator,
            provider,
            txDefaults,
            new BigNumber(chainId),
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
        maliciousWallet = maliciousValidator = await TestStaticCallReceiverContract.deployFrom0xArtifactAsync(
            artifacts.TestStaticCallReceiver,
            provider,
            txDefaults,
        );
        revertingWallet = revertingValidator = await TestRevertReceiverContract.deployFrom0xArtifactAsync(
            artifacts.TestRevertReceiver,
            provider,
            txDefaults,
        );
        externalRevertReason = await revertingWallet.REVERT_REASON.callAsync();

        signatureValidatorLogDecoder = new LogDecoder(web3Wrapper, artifacts);
        const approveValidator = async (validatorAddress: string) => {
            type SendApproveTx = (address: string, approved: boolean, txData: { from: string }) => Promise<string>;
            const sendTx = async (fn: { sendTransactionAsync: SendApproveTx }) => {
                return web3Wrapper.awaitTransactionSuccessAsync(
                    await fn.sendTransactionAsync(validatorAddress, true, { from: signerAddress }),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
            };
            await sendTx(signatureValidator.setSignatureValidatorApproval);
            await sendTx(signatureValidator.setOrderValidatorApproval);
        };
        await approveValidator(testValidator.address);
        await approveValidator(maliciousValidator.address);
        await approveValidator(revertingValidator.address);

        const defaultOrderParams = {
            ...constants.STATIC_ORDER_PARAMS,
            makerAddress,
            feeRecipientAddress: addressUtils.generatePseudoRandomAddress(),
            makerAssetData: assetDataUtils.encodeERC20AssetData(addressUtils.generatePseudoRandomAddress()),
            takerAssetData: assetDataUtils.encodeERC20AssetData(addressUtils.generatePseudoRandomAddress()),
            domain: {
                verifyingContractAddress: signatureValidator.address,
                chainId,
            },
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

    type ValidateCallAsync = (order: SignedOrder, signerAddress: string, ignatureHex: string) => Promise<any>;

    const createHashSignatureTests = (validateCallAsync: ValidateCallAsync) => {
        it('should revert when signature is empty', async () => {
            const emptySignature = constants.NULL_BYTES;
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedError = new ExchangeRevertErrors.SignatureError(
                ExchangeRevertErrors.SignatureErrorCode.InvalidLength,
                orderHashHex,
                signedOrder.makerAddress,
                emptySignature,
            );
            const tx = validateCallAsync(signedOrder, signedOrder.makerAddress, emptySignature);
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert when signature type is unsupported', async () => {
            const unsupportedSignatureType = SignatureType.NSignatureTypes;
            const unsupportedSignatureHex = `0x${Buffer.from([unsupportedSignatureType]).toString('hex')}`;
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedError = new ExchangeRevertErrors.SignatureError(
                ExchangeRevertErrors.SignatureErrorCode.Unsupported,
                orderHashHex,
                signedOrder.makerAddress,
                unsupportedSignatureHex,
            );
            const tx = validateCallAsync(signedOrder, signedOrder.makerAddress, unsupportedSignatureHex);
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert when SignatureType=Illegal', async () => {
            const illegalSignatureHex = `0x${Buffer.from([SignatureType.Illegal]).toString('hex')}`;
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedError = new ExchangeRevertErrors.SignatureError(
                ExchangeRevertErrors.SignatureErrorCode.Illegal,
                orderHashHex,
                signedOrder.makerAddress,
                illegalSignatureHex,
            );
            const tx = validateCallAsync(signedOrder, signedOrder.makerAddress, illegalSignatureHex);
            return expect(tx).to.revertWith(expectedError);
        });

        it('should return false when SignatureType=Invalid and signature has a length of zero', async () => {
            const signatureHex = `0x${Buffer.from([SignatureType.Invalid]).toString('hex')}`;
            const isValidSignature = await validateCallAsync(signedOrder, signedOrder.makerAddress, signatureHex);
            expect(isValidSignature).to.be.false();
        });

        it('should revert when SignatureType=Invalid and signature length is non-zero', async () => {
            const fillerData = ethUtil.toBuffer('0xdeadbeef');
            const signatureType = ethUtil.toBuffer(`0x${SignatureType.Invalid}`);
            const signatureBuffer = Buffer.concat([fillerData, signatureType]);
            const signatureHex = ethUtil.bufferToHex(signatureBuffer);
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedError = new ExchangeRevertErrors.SignatureError(
                ExchangeRevertErrors.SignatureErrorCode.InvalidLength,
                orderHashHex,
                signedOrder.makerAddress,
                signatureHex,
            );
            const tx = validateCallAsync(signedOrder, signedOrder.makerAddress, signatureHex);
            return expect(tx).to.revertWith(expectedError);
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
            const isValidSignature = await validateCallAsync(signedOrder, signerAddress, signatureHex);
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
            const isValidSignature = await validateCallAsync(signedOrder, notSignerAddress, signatureHex);
            expect(isValidSignature).to.be.false();
        });

        it('should return true when SignatureType=EthSign and signature is valid', async () => {
            // Create EthSign signature
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            const orderHashWithEthSignPrefixHex = signatureUtils.addSignedMessagePrefix(orderHashHex);
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
            const isValidSignature = await validateCallAsync(signedOrder, signerAddress, signatureHex);
            expect(isValidSignature).to.be.true();
        });

        it('should return false when SignatureType=EthSign and signature is invalid', async () => {
            // Create EthSign signature
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            const orderHashWithEthSignPrefixHex = signatureUtils.addSignedMessagePrefix(orderHashHex);
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
            const isValidSignature = await validateCallAsync(signedOrder, notSignerAddress, signatureHex);
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
            const isValidSignature = await validateCallAsync(signedOrder, testWallet.address, signatureHex);
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
            const isValidSignature = await validateCallAsync(signedOrder, testWallet.address, signatureHex);
            expect(isValidSignature).to.be.false();
        });

        it('should revert when `isValidSignature` attempts to update state and SignatureType=Wallet', async () => {
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
            const expectedError = new ExchangeRevertErrors.SignatureWalletError(
                orderHashHex,
                maliciousWallet.address,
                signatureHex,
                constants.NULL_BYTES,
            );
            const tx = validateCallAsync(signedOrder, maliciousWallet.address, signatureHex);
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert when `isValidSignature` reverts and SignatureType=Wallet', async () => {
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
            const expectedError = new ExchangeRevertErrors.SignatureWalletError(
                orderHashHex,
                revertingWallet.address,
                signatureHex,
                new StringRevertError(externalRevertReason).encode(),
            );
            const tx = validateCallAsync(signedOrder, revertingWallet.address, signatureHex);
            return expect(tx).to.revertWith(expectedError);
        });

        it('should return true when SignatureType=Validator, signature is valid and validator is approved', async () => {
            const validatorAddress = ethUtil.toBuffer(`${testValidator.address}`);
            const signatureType = ethUtil.toBuffer(`0x${SignatureType.Validator}`);
            const signature = Buffer.concat([validatorAddress, signatureType]);
            const signatureHex = ethUtil.bufferToHex(signature);
            const isValidSignature = await validateCallAsync(signedOrder, signerAddress, signatureHex);
            expect(isValidSignature).to.be.true();
        });

        it('should return false when SignatureType=Validator, signature is invalid and validator is approved', async () => {
            const validatorAddress = ethUtil.toBuffer(`${testValidator.address}`);
            const signatureType = ethUtil.toBuffer(`0x${SignatureType.Validator}`);
            const signature = Buffer.concat([validatorAddress, signatureType]);
            const signatureHex = ethUtil.bufferToHex(signature);
            // This will return false because the validator requires `signerAddress`
            // to be the signer.
            const isValidSignature = await validateCallAsync(signedOrder, notSignerAddress, signatureHex);
            expect(isValidSignature).to.be.false();
        });

        it('should revert when `isValidSignature` attempts to update state and SignatureType=Validator', async () => {
            const validatorAddress = ethUtil.toBuffer(`${maliciousValidator.address}`);
            const signatureType = ethUtil.toBuffer(`0x${SignatureType.Validator}`);
            const signature = Buffer.concat([validatorAddress, signatureType]);
            const signatureHex = ethUtil.bufferToHex(signature);
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedError = new ExchangeRevertErrors.SignatureValidatorError(
                orderHashHex,
                signedOrder.makerAddress,
                signatureHex,
                constants.NULL_BYTES,
            );
            const tx = validateCallAsync(signedOrder, signerAddress, signatureHex);
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert when `isValidSignature` reverts and SignatureType=Validator', async () => {
            const validatorAddress = ethUtil.toBuffer(`${revertingValidator.address}`);
            const signatureType = ethUtil.toBuffer(`0x${SignatureType.Validator}`);
            const signature = Buffer.concat([validatorAddress, signatureType]);
            const signatureHex = ethUtil.bufferToHex(signature);
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedError = new ExchangeRevertErrors.SignatureValidatorError(
                orderHashHex,
                signedOrder.makerAddress,
                signatureHex,
                new StringRevertError(externalRevertReason).encode(),
            );
            const tx = validateCallAsync(signedOrder, signerAddress, signatureHex);
            return expect(tx).to.revertWith(expectedError);
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
            const isValidSignature = await validateCallAsync(signedOrder, signerAddress, signatureHex);
            expect(isValidSignature).to.be.false();
        });

        it('should return true when SignatureType=Presigned and signer has presigned hash', async () => {
            // Presign hash
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            await web3Wrapper.awaitTransactionSuccessAsync(
                await signatureValidator.preSign.sendTransactionAsync(orderHashHex, { from: signedOrder.makerAddress }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            // Validate presigned signature
            const signature = ethUtil.toBuffer(`0x${SignatureType.PreSigned}`);
            const signatureHex = ethUtil.bufferToHex(signature);
            const isValidSignature = await validateCallAsync(signedOrder, signedOrder.makerAddress, signatureHex);
            expect(isValidSignature).to.be.true();
        });

        it('should return false when SignatureType=Presigned and signer has not presigned hash', async () => {
            const signature = ethUtil.toBuffer(`0x${SignatureType.PreSigned}`);
            const signatureHex = ethUtil.bufferToHex(signature);
            const isValidSignature = await validateCallAsync(signedOrder, signedOrder.makerAddress, signatureHex);
            expect(isValidSignature).to.be.false();
        });
    };

    describe('isValidHashSignature', () => {
        const validateCallAsync = async (order: SignedOrder, signer: string, signatureHex: string) => {
            const orderHashHex = orderHashUtils.getOrderHashHex(order);
            return signatureValidator.isValidHashSignature.callAsync(orderHashHex, signer, signatureHex);
        };

        beforeEach(async () => {
            signedOrder = await orderFactory.newSignedOrderAsync();
        });

        it('should revert when SignatureType=OrderValidator', async () => {
            const inappropriateSignatureHex = `0x${Buffer.from([SignatureType.OrderValidator]).toString('hex')}`;
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedError = new ExchangeRevertErrors.SignatureError(
                ExchangeRevertErrors.SignatureErrorCode.InappropriateSignatureType,
                orderHashHex,
                signedOrder.makerAddress,
                inappropriateSignatureHex,
            );
            const tx = validateCallAsync(signedOrder, signerAddress, inappropriateSignatureHex);
            return expect(tx).to.revertWith(expectedError);
        });

        it('should return true when message was signed by a Trezor One (firmware version 1.6.2)', async () => {
            // messageHash translates to 0x2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b
            const messageHash = ethUtil.bufferToHex(ethUtil.toBuffer('++++++++++++++++++++++++++++++++'));
            const signer = '0xc28b145f10f0bcf0fc000e778615f8fd73490bad';
            const v = ethUtil.toBuffer('0x1c');
            const r = ethUtil.toBuffer('0x7b888b596ccf87f0bacab0dcb483124973f7420f169b4824d7a12534ac1e9832');
            const s = ethUtil.toBuffer('0x0c8e14f7edc01459e13965f1da56e0c23ed11e2cca932571eee1292178f90424');
            const trezorSignatureType = ethUtil.toBuffer(`0x${SignatureType.EthSign}`);
            const signature = Buffer.concat([v, r, s, trezorSignatureType]);
            const signatureHex = ethUtil.bufferToHex(signature);
            const isValidSignature = await signatureValidator.isValidHashSignature.callAsync(
                messageHash,
                signer,
                signatureHex,
            );
            expect(isValidSignature).to.be.true();
        });

        it('should return true when message was signed by a Trezor Model T (firmware version 2.0.7)', async () => {
            // messageHash translates to 0x2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b
            const messageHash = ethUtil.bufferToHex(ethUtil.toBuffer('++++++++++++++++++++++++++++++++'));
            const signer = '0x98ce6d9345e8ffa7d99ee0822272fae9d2c0e895';
            const v = ethUtil.toBuffer('0x1c');
            const r = ethUtil.toBuffer('0x423b71062c327f0ec4fe199b8da0f34185e59b4c1cb4cc23df86cac4a601fb3f');
            const s = ethUtil.toBuffer('0x53810d6591b5348b7ee08ee812c874b0fdfb942c9849d59512c90e295221091f');
            const trezorSignatureType = ethUtil.toBuffer(`0x${SignatureType.EthSign}`);
            const signature = Buffer.concat([v, r, s, trezorSignatureType]);
            const signatureHex = ethUtil.bufferToHex(signature);
            const isValidSignature = await signatureValidator.isValidHashSignature.callAsync(
                messageHash,
                signer,
                signatureHex,
            );
            expect(isValidSignature).to.be.true();
        });

        createHashSignatureTests(validateCallAsync);
    });

    describe('isValidOrderSignature', () => {
        const validateCallAsync = async (order: SignedOrder, signer: string, signatureHex: string) => {
            return signatureValidator.isValidOrderSignature.callAsync(order, signer, signatureHex);
        };

        beforeEach(async () => {
            signedOrder = await orderFactory.newSignedOrderAsync();
        });

        it('should return true when SignatureType=OrderValidator, signature is valid and validator is approved', async () => {
            const validatorAddress = ethUtil.toBuffer(`${testValidator.address}`);
            const signatureType = ethUtil.toBuffer(`0x${SignatureType.OrderValidator}`);
            const signature = Buffer.concat([validatorAddress, signatureType]);
            const signatureHex = ethUtil.bufferToHex(signature);
            const isValidSignature = await validateCallAsync(signedOrder, signerAddress, signatureHex);
            expect(isValidSignature).to.be.true();
        });

        it('should return false when SignatureType=OrderValidator, signature is invalid and validator is approved', async () => {
            const validatorAddress = ethUtil.toBuffer(`${testValidator.address}`);
            const signatureType = ethUtil.toBuffer(`0x${SignatureType.OrderValidator}`);
            const signature = Buffer.concat([validatorAddress, signatureType]);
            const signatureHex = ethUtil.bufferToHex(signature);
            // This will return false because the validator requires `signerAddress`
            // to be the signer.
            const isValidSignature = await validateCallAsync(signedOrder, notSignerAddress, signatureHex);
            expect(isValidSignature).to.be.false();
        });

        it('should revert when `isValidOrderSignature` attempts to update state and SignatureType=OrderValidator', async () => {
            const validatorAddress = ethUtil.toBuffer(`${maliciousValidator.address}`);
            const signatureType = ethUtil.toBuffer(`0x${SignatureType.OrderValidator}`);
            const signature = Buffer.concat([validatorAddress, signatureType]);
            const signatureHex = ethUtil.bufferToHex(signature);
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedError = new ExchangeRevertErrors.SignatureOrderValidatorError(
                orderHashHex,
                signedOrder.makerAddress,
                signatureHex,
                constants.NULL_BYTES,
            );
            const tx = validateCallAsync(signedOrder, signerAddress, signatureHex);
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert when `isValidOrderSignature` reverts and SignatureType=OrderValidator', async () => {
            const validatorAddress = ethUtil.toBuffer(`${revertingValidator.address}`);
            const signatureType = ethUtil.toBuffer(`0x${SignatureType.OrderValidator}`);
            const signature = Buffer.concat([validatorAddress, signatureType]);
            const signatureHex = ethUtil.bufferToHex(signature);
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedError = new ExchangeRevertErrors.SignatureOrderValidatorError(
                orderHashHex,
                signedOrder.makerAddress,
                signatureHex,
                new StringRevertError(externalRevertReason).encode(),
            );
            const tx = validateCallAsync(signedOrder, signerAddress, signatureHex);
            return expect(tx).to.revertWith(expectedError);
        });

        it('should return false when SignatureType=OrderValidator, signature is valid and validator is not approved', async () => {
            // Set approval of signature validator to false
            await web3Wrapper.awaitTransactionSuccessAsync(
                await signatureValidator.setOrderValidatorApproval.sendTransactionAsync(testValidator.address, false, {
                    from: signerAddress,
                }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            // Validate signature
            const validatorAddress = ethUtil.toBuffer(`${testValidator.address}`);
            const signatureType = ethUtil.toBuffer(`0x${SignatureType.OrderValidator}`);
            const signature = Buffer.concat([validatorAddress, signatureType]);
            const signatureHex = ethUtil.bufferToHex(signature);
            const isValidSignature = await validateCallAsync(signedOrder, signerAddress, signatureHex);
            expect(isValidSignature).to.be.false();
        });

        it('should return true when SignatureType=WalletOrderValidator and signature is valid', async () => {
            // Create EIP712 signature
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            const orderHashBuffer = ethUtil.toBuffer(orderHashHex);
            const ecSignature = ethUtil.ecsign(orderHashBuffer, signerPrivateKey);
            // Create 0x signature from EIP712 signature
            const signature = Buffer.concat([
                ethUtil.toBuffer(ecSignature.v),
                ecSignature.r,
                ecSignature.s,
                ethUtil.toBuffer(`0x${SignatureType.WalletOrderValidator}`),
            ]);
            const signatureHex = ethUtil.bufferToHex(signature);
            // Validate signature
            const isValidSignature = await validateCallAsync(signedOrder, testWallet.address, signatureHex);
            expect(isValidSignature).to.be.true();
        });

        it('should return false when SignatureType=WalletOrderValidator and signature is invalid', async () => {
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
                ethUtil.toBuffer(`0x${SignatureType.WalletOrderValidator}`),
            ]);
            const signatureHex = ethUtil.bufferToHex(signature);
            // Validate signature
            const isValidSignature = await validateCallAsync(signedOrder, testWallet.address, signatureHex);
            expect(isValidSignature).to.be.false();
        });

        it('should revert when `isValidSignature` attempts to update state and SignatureType=WalletOrderValidator', async () => {
            // Create EIP712 signature
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            const orderHashBuffer = ethUtil.toBuffer(orderHashHex);
            const ecSignature = ethUtil.ecsign(orderHashBuffer, signerPrivateKey);
            // Create 0x signature from EIP712 signature
            const signature = Buffer.concat([
                ethUtil.toBuffer(ecSignature.v),
                ecSignature.r,
                ecSignature.s,
                ethUtil.toBuffer(`0x${SignatureType.WalletOrderValidator}`),
            ]);
            const signatureHex = ethUtil.bufferToHex(signature);
            const expectedError = new ExchangeRevertErrors.SignatureWalletOrderValidatorError(
                orderHashHex,
                maliciousWallet.address,
                signatureHex,
                constants.NULL_BYTES,
            );
            const tx = validateCallAsync(signedOrder, maliciousWallet.address, signatureHex);
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert when `isValidSignature` reverts and SignatureType=WalletOrderValidator', async () => {
            // Create EIP712 signature
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            const orderHashBuffer = ethUtil.toBuffer(orderHashHex);
            const ecSignature = ethUtil.ecsign(orderHashBuffer, signerPrivateKey);
            // Create 0x signature from EIP712 signature
            const signature = Buffer.concat([
                ethUtil.toBuffer(ecSignature.v),
                ecSignature.r,
                ecSignature.s,
                ethUtil.toBuffer(`0x${SignatureType.WalletOrderValidator}`),
            ]);
            const signatureHex = ethUtil.bufferToHex(signature);
            const expectedError = new ExchangeRevertErrors.SignatureWalletOrderValidatorError(
                orderHashHex,
                revertingWallet.address,
                signatureHex,
                new StringRevertError(externalRevertReason).encode(),
            );
            const tx = validateCallAsync(signedOrder, revertingWallet.address, signatureHex);
            return expect(tx).to.revertWith(expectedError);
        });

        createHashSignatureTests(validateCallAsync);
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
