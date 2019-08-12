import {
    addressUtils,
    blockchainTests,
    constants,
    expect,
    hexConcat,
    hexRandom,
    LogDecoder,
    OrderFactory,
    orderUtils,
    TransactionFactory,
} from '@0x/contracts-test-utils';
import {
    assetDataUtils,
    ExchangeRevertErrors,
    orderHashUtils,
    signatureUtils,
    transactionHashUtils,
} from '@0x/order-utils';
import { SignatureType, SignedOrder, SignedZeroExTransaction } from '@0x/types';
import { BigNumber, LibBytesRevertErrors, StringRevertError } from '@0x/utils';
import { LogWithDecodedArgs } from 'ethereum-types';
import ethUtil = require('ethereumjs-util');

import {
    artifacts,
    TestSignatureValidatorContract,
    TestSignatureValidatorSignatureValidatorApprovalEventArgs,
    TestValidatorWalletContract,
} from '../src';

import { ValidatorWalletAction, ValidatorWalletDataType } from './utils';

// tslint:disable:no-unnecessary-type-assertion
blockchainTests.resets('MixinSignatureValidator', env => {
    let chainId: number;
    let signatureValidator: TestSignatureValidatorContract;
    let validatorWallet: TestValidatorWalletContract;
    let validatorWalletRevertReason: string;
    let signerAddress: string;
    let signerPrivateKey: Buffer;
    let notSignerAddress: string;

    before(async () => {
        chainId = await env.getChainIdAsync();
        const accounts = await env.getAccountAddressesAsync();
        signerAddress = accounts[0];
        notSignerAddress = accounts[1];
        signatureValidator = await TestSignatureValidatorContract.deployFrom0xArtifactAsync(
            artifacts.TestSignatureValidator,
            env.provider,
            env.txDefaults,
            new BigNumber(chainId),
        );
        validatorWallet = await TestValidatorWalletContract.deployFrom0xArtifactAsync(
            artifacts.TestValidatorWallet,
            env.provider,
            env.txDefaults,
            signatureValidator.address,
        );
        validatorWalletRevertReason = await validatorWallet.REVERT_REASON.callAsync();

        // Approve the validator for both signers.
        await Promise.all(
            [signerAddress, notSignerAddress].map(async (addr: string) => {
                return signatureValidator.setSignatureValidatorApproval.awaitTransactionSuccessAsync(
                    validatorWallet.address,
                    true,
                    { from: addr },
                );
            }),
        );

        signerPrivateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(signerAddress)];
    });

    const SIGNATURE_LENGTH = 65;
    const generateRandomSignature = (): string => hexRandom(SIGNATURE_LENGTH);
    const hashBytes = (bytesHex: string): string => ethUtil.bufferToHex(ethUtil.sha3(ethUtil.toBuffer(bytesHex)));
    const signDataHex = (dataHex: string, privateKey: Buffer): string => {
        const ecSignature = ethUtil.ecsign(ethUtil.toBuffer(dataHex), privateKey);
        return hexConcat(ecSignature.v, ecSignature.r, ecSignature.s);
    };

    type ValidateHashSignatureAsync = (
        hashHex: string,
        signerAddress: string,
        signatureHex: string,
        validatorAction?: ValidatorWalletAction,
        validatorExpectedSignatureHex?: string,
    ) => Promise<any>;

    const createHashSignatureTests = (
        getCurrentHashHex: (signerAddress?: string) => string,
        validateAsync: ValidateHashSignatureAsync,
    ) => {
        it('should revert when signature is empty', async () => {
            const hashHex = getCurrentHashHex();
            const emptySignature = constants.NULL_BYTES;
            const expectedError = new ExchangeRevertErrors.SignatureError(
                ExchangeRevertErrors.SignatureErrorCode.InvalidLength,
                hashHex,
                signerAddress,
                emptySignature,
            );
            const tx = validateAsync(hashHex, signerAddress, emptySignature);
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert when signature type is unsupported', async () => {
            const hashHex = getCurrentHashHex();
            const signatureHex = hexConcat(SignatureType.NSignatureTypes);
            const expectedError = new ExchangeRevertErrors.SignatureError(
                ExchangeRevertErrors.SignatureErrorCode.Unsupported,
                hashHex,
                signerAddress,
                signatureHex,
            );
            const tx = validateAsync(hashHex, signerAddress, signatureHex);
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert when SignatureType=Illegal', async () => {
            const hashHex = getCurrentHashHex();
            const signatureHex = hexConcat(SignatureType.Illegal);
            const expectedError = new ExchangeRevertErrors.SignatureError(
                ExchangeRevertErrors.SignatureErrorCode.Illegal,
                hashHex,
                signerAddress,
                signatureHex,
            );
            const tx = validateAsync(hashHex, signerAddress, signatureHex);
            return expect(tx).to.revertWith(expectedError);
        });

        it('should return false when SignatureType=Invalid and signature has a length of zero', async () => {
            const hashHex = getCurrentHashHex();
            const signatureHex = hexConcat(SignatureType.Invalid);
            const isValidSignature = await validateAsync(hashHex, signerAddress, signatureHex);
            expect(isValidSignature).to.be.false();
        });

        it('should revert when SignatureType=Invalid and signature length is non-zero', async () => {
            const hashHex = getCurrentHashHex();
            const signatureHex = hexConcat('0xdeadbeef', SignatureType.Invalid);
            const expectedError = new ExchangeRevertErrors.SignatureError(
                ExchangeRevertErrors.SignatureErrorCode.InvalidLength,
                hashHex,
                signerAddress,
                signatureHex,
            );
            const tx = validateAsync(hashHex, signerAddress, signatureHex);
            return expect(tx).to.revertWith(expectedError);
        });

        it('should return true when SignatureType=EIP712 and signature is valid', async () => {
            const hashHex = getCurrentHashHex();
            const signatureHex = hexConcat(signDataHex(hashHex, signerPrivateKey), SignatureType.EIP712);
            const isValidSignature = await validateAsync(hashHex, signerAddress, signatureHex);
            expect(isValidSignature).to.be.true();
        });

        it('should return false when SignatureType=EIP712 and signature is invalid', async () => {
            const hashHex = getCurrentHashHex();
            const signatureHex = hexConcat(generateRandomSignature(), SignatureType.EIP712);
            const isValidSignature = await validateAsync(hashHex, signerAddress, signatureHex);
            expect(isValidSignature).to.be.false();
        });

        it('should return true when SignatureType=EthSign and signature is valid', async () => {
            // Create EthSign signature
            const hashHex = getCurrentHashHex();
            const orderHashWithEthSignPrefixHex = signatureUtils.addSignedMessagePrefix(hashHex);
            const signatureHex = hexConcat(
                signDataHex(orderHashWithEthSignPrefixHex, signerPrivateKey),
                SignatureType.EthSign,
            );
            const isValidSignature = await validateAsync(hashHex, signerAddress, signatureHex);
            expect(isValidSignature).to.be.true();
        });

        it('should return false when SignatureType=EthSign and signature is invalid', async () => {
            const hashHex = getCurrentHashHex();
            // Create EthSign signature
            const signatureHex = hexConcat(generateRandomSignature(), SignatureType.EthSign);
            const isValidSignature = await validateAsync(hashHex, signerAddress, signatureHex);
            expect(isValidSignature).to.be.false();
        });

        it('should return true when SignatureType=Wallet and signature is valid', async () => {
            const hashHex = getCurrentHashHex(validatorWallet.address);
            // Doesn't have to contain a real signature since our wallet contract
            // just does a hash comparison.
            const signatureDataHex = generateRandomSignature();
            const signatureHex = hexConcat(signatureDataHex, SignatureType.Wallet);
            const isValidSignature = await validateAsync(
                hashHex,
                validatorWallet.address,
                signatureHex,
                ValidatorWalletAction.MatchSignatureHash,
                signatureDataHex,
            );
            expect(isValidSignature).to.be.true();
        });

        it('should return false when SignatureType=Wallet and signature is invalid', async () => {
            const hashHex = getCurrentHashHex(validatorWallet.address);
            // Doesn't have to contain a real signature since our wallet contract
            // just does a hash comparison.
            const signatureDataHex = generateRandomSignature();
            const notSignatureDataHex = generateRandomSignature();
            const signatureHex = hexConcat(notSignatureDataHex, SignatureType.Wallet);
            // Validate signature
            const isValidSignature = await validateAsync(
                hashHex,
                validatorWallet.address,
                signatureHex,
                ValidatorWalletAction.MatchSignatureHash,
                signatureDataHex,
            );
            expect(isValidSignature).to.be.false();
        });

        it('should revert when validator attempts to update state and SignatureType=Wallet', async () => {
            const hashHex = getCurrentHashHex(validatorWallet.address);
            // Doesn't have to contain a real signature since our wallet contract
            // just does a hash comparison.
            const signatureHex = hexConcat(generateRandomSignature(), SignatureType.Wallet);
            const expectedError = new ExchangeRevertErrors.SignatureWalletError(
                hashHex,
                validatorWallet.address,
                signatureHex,
                constants.NULL_BYTES,
            );
            const tx = validateAsync(hashHex, validatorWallet.address, signatureHex, ValidatorWalletAction.UpdateState);
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert when signer is an EOA and SignatureType=Wallet', async () => {
            const hashHex = getCurrentHashHex();
            const signatureHex = hexConcat(SignatureType.Wallet);
            const expectedError = new LibBytesRevertErrors.InvalidByteOperationError(
                LibBytesRevertErrors.InvalidByteOperationErrorCodes.LengthGreaterThanOrEqualsFourRequired,
                new BigNumber(0),
                new BigNumber(4),
            );
            const tx = validateAsync(hashHex, signerAddress, signatureHex);
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert when validator reverts and SignatureType=Wallet', async () => {
            const hashHex = getCurrentHashHex(validatorWallet.address);
            // Doesn't have to contain a real signature since our wallet contract
            // just does a hash comparison.
            const signatureHex = hexConcat(generateRandomSignature(), SignatureType.Wallet);
            const expectedError = new ExchangeRevertErrors.SignatureWalletError(
                hashHex,
                validatorWallet.address,
                signatureHex,
                new StringRevertError(validatorWalletRevertReason).encode(),
            );
            const tx = validateAsync(hashHex, validatorWallet.address, signatureHex, ValidatorWalletAction.Revert);
            return expect(tx).to.revertWith(expectedError);
        });

        it('should return true when SignatureType=Presigned and signer has presigned hash', async () => {
            const hashHex = getCurrentHashHex();
            // Presign the hash
            await signatureValidator.preSign.awaitTransactionSuccessAsync(hashHex, { from: signerAddress });
            // Validate presigned signature
            const signatureHex = hexConcat(SignatureType.PreSigned);
            const isValidSignature = await validateAsync(hashHex, signerAddress, signatureHex);
            expect(isValidSignature).to.be.true();
        });

        it('should return false when SignatureType=Presigned and signer has not presigned hash', async () => {
            const hashHex = getCurrentHashHex();
            const signatureHex = hexConcat(SignatureType.PreSigned);
            const isValidSignature = await validateAsync(hashHex, signerAddress, signatureHex);
            expect(isValidSignature).to.be.false();
        });
    };

    describe('isValidHashSignature', () => {
        let hashHex: string;

        beforeEach(async () => {
            hashHex = orderUtils.generatePseudoRandomOrderHash();
        });

        const validateAsync = async (
            _hashHex: string,
            _signerAddress: string,
            signatureHex: string,
            validatorAction?: ValidatorWalletAction,
            validatorExpectedSignatureHex?: string,
        ) => {
            const expectedSignatureHashHex =
                validatorExpectedSignatureHex === undefined
                    ? constants.NULL_BYTES
                    : hashBytes(validatorExpectedSignatureHex);
            if (validatorAction !== undefined) {
                await validatorWallet.prepare.awaitTransactionSuccessAsync(
                    _hashHex,
                    ValidatorWalletDataType.None,
                    validatorAction,
                    expectedSignatureHashHex,
                );
            }
            return signatureValidator.isValidHashSignature.callAsync(_hashHex, _signerAddress, signatureHex);
        };

        it('should revert when signerAddress == 0', async () => {
            const signatureHex = hexConcat(SignatureType.EIP712);
            const expectedError = new ExchangeRevertErrors.SignatureError(
                ExchangeRevertErrors.SignatureErrorCode.InvalidSigner,
                hashHex,
                constants.NULL_ADDRESS,
                signatureHex,
            );
            const tx = validateAsync(hashHex, constants.NULL_ADDRESS, signatureHex);
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert when SignatureType=Validator', async () => {
            const signatureHex = hexConcat(SignatureType.Validator);
            const expectedError = new ExchangeRevertErrors.SignatureError(
                ExchangeRevertErrors.SignatureErrorCode.InappropriateSignatureType,
                hashHex,
                signerAddress,
                signatureHex,
            );
            const tx = validateAsync(hashHex, signerAddress, signatureHex);
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert when SignatureType=EIP1271Wallet', async () => {
            const signatureHex = hexConcat(SignatureType.EIP1271Wallet);
            const expectedError = new ExchangeRevertErrors.SignatureError(
                ExchangeRevertErrors.SignatureErrorCode.InappropriateSignatureType,
                hashHex,
                signerAddress,
                signatureHex,
            );
            const tx = validateAsync(hashHex, signerAddress, signatureHex);
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

        createHashSignatureTests((_signerAddress?: string) => hashHex, validateAsync);
    });

    describe('isValidOrderSignature', () => {
        let orderFactory: OrderFactory;
        let signedOrder: SignedOrder;

        before(async () => {
            const makerAddress = signerAddress;
            const defaultOrderParams = {
                ...constants.STATIC_ORDER_PARAMS,
                makerAddress,
                feeRecipientAddress: addressUtils.generatePseudoRandomAddress(),
                makerAssetData: assetDataUtils.encodeERC20AssetData(addressUtils.generatePseudoRandomAddress()),
                takerAssetData: assetDataUtils.encodeERC20AssetData(addressUtils.generatePseudoRandomAddress()),
                makerFeeAssetData: assetDataUtils.encodeERC20AssetData(addressUtils.generatePseudoRandomAddress()),
                takerFeeAssetData: assetDataUtils.encodeERC20AssetData(addressUtils.generatePseudoRandomAddress()),
                makerFee: constants.ZERO_AMOUNT,
                takerFee: constants.ZERO_AMOUNT,
                domain: {
                    verifyingContractAddress: signatureValidator.address,
                    chainId,
                },
            };
            orderFactory = new OrderFactory(signerPrivateKey, defaultOrderParams);
        });

        beforeEach(async () => {
            signedOrder = await orderFactory.newSignedOrderAsync();
        });

        const validateAsync = async (
            order: SignedOrder,
            signatureHex: string,
            validatorAction?: ValidatorWalletAction,
            validatorExpectedSignatureHex?: string,
        ) => {
            const orderHashHex = orderHashUtils.getOrderHashHex(order);
            const expectedSignatureHashHex =
                validatorExpectedSignatureHex === undefined
                    ? constants.NULL_BYTES
                    : hashBytes(validatorExpectedSignatureHex);
            if (validatorAction !== undefined) {
                await validatorWallet.prepare.awaitTransactionSuccessAsync(
                    orderHashHex,
                    ValidatorWalletDataType.Order,
                    validatorAction,
                    expectedSignatureHashHex,
                );
            }
            return signatureValidator.isValidOrderSignature.callAsync(order, signatureHex);
        };

        it('should revert when signerAddress == 0', async () => {
            const signatureHex = hexConcat(SignatureType.EIP712);
            const nullMakerOrder = {
                ...signedOrder,
                makerAddress: constants.NULL_ADDRESS,
            };
            const orderHashHex = orderHashUtils.getOrderHashHex(nullMakerOrder);
            const expectedError = new ExchangeRevertErrors.SignatureError(
                ExchangeRevertErrors.SignatureErrorCode.InvalidSigner,
                orderHashHex,
                constants.NULL_ADDRESS,
                signatureHex,
            );
            const tx = signatureValidator.isValidOrderSignature.callAsync(nullMakerOrder, signatureHex);
            return expect(tx).to.revertWith(expectedError);
        });

        it('should return true when SignatureType=Validator, signature is valid and validator is approved', async () => {
            // Doesn't have to contain a real signature since our wallet contract
            // just does a hash comparison.
            const signatureDataHex = generateRandomSignature();
            const signatureHex = hexConcat(signatureDataHex, validatorWallet.address, SignatureType.Validator);
            const isValidSignature = await validateAsync(
                signedOrder,
                signatureHex,
                ValidatorWalletAction.MatchSignatureHash,
                signatureDataHex,
            );
            expect(isValidSignature).to.be.true();
        });

        it('should return false when SignatureType=Validator, signature is invalid and validator is approved', async () => {
            // Doesn't have to contain a real signature since our wallet contract
            // just does a hash comparison.
            const signatureDataHex = generateRandomSignature();
            const notSignatureDataHex = generateRandomSignature();
            const signatureHex = hexConcat(notSignatureDataHex, validatorWallet.address, SignatureType.Validator);
            const isValidSignature = await validateAsync(
                signedOrder,
                signatureHex,
                ValidatorWalletAction.MatchSignatureHash,
                signatureDataHex,
            );
            expect(isValidSignature).to.be.false();
        });

        it('should revert when validator attempts to update state and SignatureType=Validator', async () => {
            // Doesn't have to contain a real signature since our wallet contract
            // just does a hash comparison.
            const signatureDataHex = generateRandomSignature();
            const signatureHex = hexConcat(signatureDataHex, validatorWallet.address, SignatureType.Validator);
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedError = new ExchangeRevertErrors.SignatureValidatorError(
                orderHashHex,
                signedOrder.makerAddress,
                validatorWallet.address,
                signatureHex,
                constants.NULL_BYTES,
            );
            const tx = validateAsync(signedOrder, signatureHex, ValidatorWalletAction.UpdateState);
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert when validator reverts and SignatureType=Validator', async () => {
            // Doesn't have to contain a real signature since our wallet contract
            // just does a hash comparison.
            const signatureDataHex = generateRandomSignature();
            const signatureHex = hexConcat(signatureDataHex, validatorWallet.address, SignatureType.Validator);
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedError = new ExchangeRevertErrors.SignatureValidatorError(
                orderHashHex,
                signedOrder.makerAddress,
                validatorWallet.address,
                signatureHex,
                new StringRevertError(validatorWalletRevertReason).encode(),
            );
            const tx = validateAsync(signedOrder, signatureHex, ValidatorWalletAction.Revert);
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert when SignatureType=Validator, signature is valid and validator is not approved', async () => {
            // Set approval of signature validator to false
            await signatureValidator.setSignatureValidatorApproval.awaitTransactionSuccessAsync(
                validatorWallet.address,
                false,
                { from: signedOrder.makerAddress },
            );
            // Doesn't have to contain a real signature since our wallet contract
            // just does a hash comparison.
            const signatureDataHex = generateRandomSignature();
            const signatureHex = hexConcat(signatureDataHex, validatorWallet.address, SignatureType.Validator);
            const expectedError = new ExchangeRevertErrors.SignatureValidatorNotApprovedError(
                signedOrder.makerAddress,
                validatorWallet.address,
            );
            const tx = validateAsync(signedOrder, signatureHex, ValidatorWalletAction.Revert);
            return expect(tx).to.revertWith(expectedError);
        });

        it('should return true when SignatureType=EIP1271Wallet and signature is valid', async () => {
            signedOrder.makerAddress = validatorWallet.address;
            // Doesn't have to contain a real signature since our wallet contract
            // just does a hash comparison.
            const signatureDataHex = generateRandomSignature();
            const signatureHex = hexConcat(signatureDataHex, SignatureType.EIP1271Wallet);
            // Validate signature
            const isValidSignature = await validateAsync(
                signedOrder,
                signatureHex,
                ValidatorWalletAction.MatchSignatureHash,
                signatureDataHex,
            );
            expect(isValidSignature).to.be.true();
        });

        it('should return false when SignatureType=EIP1271Wallet and signature is invalid', async () => {
            signedOrder.makerAddress = validatorWallet.address;
            // Doesn't have to contain a real signature since our wallet contract
            // just does a hash comparison.
            const signatureDataHex = generateRandomSignature();
            const notSignatureDataHex = generateRandomSignature();
            const signatureHex = hexConcat(notSignatureDataHex, SignatureType.EIP1271Wallet);
            // Validate signature
            const isValidSignature = await validateAsync(
                signedOrder,
                signatureHex,
                ValidatorWalletAction.MatchSignatureHash,
                signatureDataHex,
            );
            expect(isValidSignature).to.be.false();
        });

        it('should revert when validator attempts to update state and SignatureType=EIP1271Wallet', async () => {
            signedOrder.makerAddress = validatorWallet.address;
            // Doesn't have to contain a real signature since our wallet contract
            // just does a hash comparison.
            const signatureHex = hexConcat(generateRandomSignature(), SignatureType.EIP1271Wallet);
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedError = new ExchangeRevertErrors.SignatureWalletError(
                orderHashHex,
                validatorWallet.address,
                signatureHex,
                constants.NULL_BYTES,
            );
            const tx = validateAsync(signedOrder, signatureHex, ValidatorWalletAction.UpdateState);
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert when validator reverts and SignatureType=EIP1271Wallet', async () => {
            signedOrder.makerAddress = validatorWallet.address;
            const signatureHex = hexConcat(SignatureType.EIP1271Wallet);
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedError = new ExchangeRevertErrors.SignatureWalletError(
                orderHashHex,
                validatorWallet.address,
                signatureHex,
                new StringRevertError(validatorWalletRevertReason).encode(),
            );
            const tx = validateAsync(signedOrder, signatureHex, ValidatorWalletAction.Revert);
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert when signer is an EOA and SignatureType=EIP1271Wallet', async () => {
            const signatureHex = hexConcat(SignatureType.EIP1271Wallet);
            const expectedError = new LibBytesRevertErrors.InvalidByteOperationError(
                LibBytesRevertErrors.InvalidByteOperationErrorCodes.LengthGreaterThanOrEqualsFourRequired,
                new BigNumber(0),
                new BigNumber(4),
            );
            const tx = signatureValidator.isValidOrderSignature.callAsync(signedOrder, signatureHex);
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert when signer is an EOA and SignatureType=Validator', async () => {
            const signatureHex = hexConcat(notSignerAddress, SignatureType.Validator);
            const expectedError = new LibBytesRevertErrors.InvalidByteOperationError(
                LibBytesRevertErrors.InvalidByteOperationErrorCodes.LengthGreaterThanOrEqualsFourRequired,
                new BigNumber(0),
                new BigNumber(4),
            );
            // Register an EOA as a validator.
            await signatureValidator.setSignatureValidatorApproval.awaitTransactionSuccessAsync(
                notSignerAddress,
                true,
                { from: signerAddress },
            );
            const tx = signatureValidator.isValidOrderSignature.callAsync(signedOrder, signatureHex);
            return expect(tx).to.revertWith(expectedError);
        });

        // Run hash-only signature type tests as well.
        const validateOrderHashAsync = async (
            hashHex: string,
            _signerAddress: string,
            signatureHex: string,
            validatorAction?: ValidatorWalletAction,
            validatorExpectedSignatureHex?: string,
        ): Promise<any> => {
            signedOrder.makerAddress = _signerAddress;
            return validateAsync(signedOrder, signatureHex, validatorAction, validatorExpectedSignatureHex);
        };
        createHashSignatureTests((_signerAddress?: string) => {
            signedOrder.makerAddress = _signerAddress === undefined ? signerAddress : _signerAddress;
            return orderHashUtils.getOrderHashHex(signedOrder);
        }, validateOrderHashAsync);
    });

    describe('isValidTransactionSignature', () => {
        let transactionFactory: TransactionFactory;
        let signedTransaction: SignedZeroExTransaction;
        const TRANSACTION_DATA_LENGTH = 100;

        before(async () => {
            transactionFactory = new TransactionFactory(signerPrivateKey, signatureValidator.address, chainId);
        });

        beforeEach(async () => {
            // We don't actually do anything with the transaction so we can just
            // fill it with random data.
            signedTransaction = await transactionFactory.newSignedTransactionAsync({
                data: hexRandom(TRANSACTION_DATA_LENGTH),
            });
        });

        const validateAsync = async (
            transaction: SignedZeroExTransaction,
            signatureHex: string,
            validatorAction?: ValidatorWalletAction,
            validatorExpectedSignatureHex?: string,
        ) => {
            const transactionHashHex = transactionHashUtils.getTransactionHashHex(transaction);
            const expectedSignatureHashHex =
                validatorExpectedSignatureHex === undefined
                    ? constants.NULL_BYTES
                    : hashBytes(validatorExpectedSignatureHex);
            if (validatorAction !== undefined) {
                await validatorWallet.prepare.awaitTransactionSuccessAsync(
                    transactionHashHex,
                    ValidatorWalletDataType.ZeroExTransaction,
                    validatorAction,
                    expectedSignatureHashHex,
                );
            }
            return signatureValidator.isValidTransactionSignature.callAsync(transaction, signatureHex);
        };

        it('should revert when signerAddress == 0', async () => {
            const signatureHex = hexConcat(SignatureType.EIP712);
            const nullSignerTransaction = {
                ...signedTransaction,
                signerAddress: constants.NULL_ADDRESS,
            };
            const transactionHashHex = transactionHashUtils.getTransactionHashHex(nullSignerTransaction);
            const expectedError = new ExchangeRevertErrors.SignatureError(
                ExchangeRevertErrors.SignatureErrorCode.InvalidSigner,
                transactionHashHex,
                constants.NULL_ADDRESS,
                signatureHex,
            );
            const tx = signatureValidator.isValidTransactionSignature.callAsync(nullSignerTransaction, signatureHex);
            return expect(tx).to.revertWith(expectedError);
        });

        it('should return true when SignatureType=Validator, signature is valid and validator is approved', async () => {
            // Doesn't have to contain a real signature since our wallet contract
            // just does a hash comparison.
            const signatureDataHex = generateRandomSignature();
            const signatureHex = hexConcat(signatureDataHex, validatorWallet.address, SignatureType.Validator);
            const isValidSignature = await validateAsync(
                signedTransaction,
                signatureHex,
                ValidatorWalletAction.MatchSignatureHash,
                signatureDataHex,
            );
            expect(isValidSignature).to.be.true();
        });

        it('should return false when SignatureType=Validator, signature is invalid and validator is approved', async () => {
            // Doesn't have to contain a real signature since our wallet contract
            // just does a hash comparison.
            const signatureDataHex = generateRandomSignature();
            const notSignatureDataHex = generateRandomSignature();
            const signatureHex = hexConcat(notSignatureDataHex, validatorWallet.address, SignatureType.Validator);
            const isValidSignature = await validateAsync(
                signedTransaction,
                signatureHex,
                ValidatorWalletAction.MatchSignatureHash,
                signatureDataHex,
            );
            expect(isValidSignature).to.be.false();
        });

        it('should revert when validator attempts to update state and SignatureType=Validator', async () => {
            // Doesn't have to contain a real signature since our wallet contract
            // just does a hash comparison.
            const signatureDataHex = generateRandomSignature();
            const signatureHex = hexConcat(signatureDataHex, validatorWallet.address, SignatureType.Validator);
            const transactionHashHex = transactionHashUtils.getTransactionHashHex(signedTransaction);
            const expectedError = new ExchangeRevertErrors.SignatureValidatorError(
                transactionHashHex,
                signedTransaction.signerAddress,
                validatorWallet.address,
                signatureHex,
                constants.NULL_BYTES,
            );
            const tx = validateAsync(signedTransaction, signatureHex, ValidatorWalletAction.UpdateState);
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert when validator reverts and SignatureType=Validator', async () => {
            // Doesn't have to contain a real signature since our wallet contract
            // just does a hash comparison.
            const signatureDataHex = generateRandomSignature();
            const signatureHex = hexConcat(signatureDataHex, validatorWallet.address, SignatureType.Validator);
            const transactionHashHex = transactionHashUtils.getTransactionHashHex(signedTransaction);
            const expectedError = new ExchangeRevertErrors.SignatureValidatorError(
                transactionHashHex,
                signedTransaction.signerAddress,
                validatorWallet.address,
                signatureHex,
                new StringRevertError(validatorWalletRevertReason).encode(),
            );
            const tx = validateAsync(signedTransaction, signatureHex, ValidatorWalletAction.Revert);
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert when SignatureType=Validator, signature is valid and validator is not approved', async () => {
            // Set approval of signature validator to false
            await signatureValidator.setSignatureValidatorApproval.awaitTransactionSuccessAsync(
                validatorWallet.address,
                false,
                { from: signedTransaction.signerAddress },
            );
            // Doesn't have to contain a real signature since our wallet contract
            // just does a hash comparison.
            const signatureDataHex = generateRandomSignature();
            const signatureHex = hexConcat(signatureDataHex, validatorWallet.address, SignatureType.Validator);
            const expectedError = new ExchangeRevertErrors.SignatureValidatorNotApprovedError(
                signedTransaction.signerAddress,
                validatorWallet.address,
            );
            const tx = validateAsync(signedTransaction, signatureHex, ValidatorWalletAction.Revert);
            return expect(tx).to.revertWith(expectedError);
        });

        it('should return true when SignatureType=EIP1271Wallet and signature is valid', async () => {
            signedTransaction.signerAddress = validatorWallet.address;
            // Doesn't have to contain a real signature since our wallet contract
            // just does a hash comparison.
            const signatureDataHex = generateRandomSignature();
            const signatureHex = hexConcat(signatureDataHex, SignatureType.EIP1271Wallet);
            // Validate signature
            const isValidSignature = await validateAsync(
                signedTransaction,
                signatureHex,
                ValidatorWalletAction.MatchSignatureHash,
                signatureDataHex,
            );
            expect(isValidSignature).to.be.true();
        });

        it('should return false when SignatureType=EIP1271Wallet and signature is invalid', async () => {
            signedTransaction.signerAddress = validatorWallet.address;
            // Doesn't have to contain a real signature since our wallet contract
            // just does a hash comparison.
            const signatureDataHex = generateRandomSignature();
            const notSignatureDataHex = generateRandomSignature();
            const signatureHex = hexConcat(notSignatureDataHex, SignatureType.EIP1271Wallet);
            // Validate signature
            const isValidSignature = await validateAsync(
                signedTransaction,
                signatureHex,
                ValidatorWalletAction.MatchSignatureHash,
                signatureDataHex,
            );
            expect(isValidSignature).to.be.false();
        });

        it('should revert when validator attempts to update state and SignatureType=EIP1271Wallet', async () => {
            signedTransaction.signerAddress = validatorWallet.address;
            // Doesn't have to contain a real signature since our wallet contract
            // just does a hash comparison.
            const signatureHex = hexConcat(generateRandomSignature(), SignatureType.EIP1271Wallet);
            const transactionHashHex = transactionHashUtils.getTransactionHashHex(signedTransaction);
            const expectedError = new ExchangeRevertErrors.SignatureWalletError(
                transactionHashHex,
                validatorWallet.address,
                signatureHex,
                constants.NULL_BYTES,
            );
            const tx = validateAsync(signedTransaction, signatureHex, ValidatorWalletAction.UpdateState);
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert when validator reverts and SignatureType=EIP1271Wallet', async () => {
            signedTransaction.signerAddress = validatorWallet.address;
            // Doesn't have to contain a real signature since our wallet contract
            // just does a hash comparison.
            const signatureHex = hexConcat(generateRandomSignature(), SignatureType.EIP1271Wallet);
            const transactionHashHex = transactionHashUtils.getTransactionHashHex(signedTransaction);
            const expectedError = new ExchangeRevertErrors.SignatureWalletError(
                transactionHashHex,
                validatorWallet.address,
                signatureHex,
                new StringRevertError(validatorWalletRevertReason).encode(),
            );
            const tx = validateAsync(signedTransaction, signatureHex, ValidatorWalletAction.Revert);
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert when signer is an EOA and SignatureType=EIP1271Wallet', async () => {
            const signatureHex = hexConcat(SignatureType.EIP1271Wallet);
            const expectedError = new LibBytesRevertErrors.InvalidByteOperationError(
                LibBytesRevertErrors.InvalidByteOperationErrorCodes.LengthGreaterThanOrEqualsFourRequired,
                new BigNumber(0),
                new BigNumber(4),
            );
            const tx = signatureValidator.isValidTransactionSignature.callAsync(signedTransaction, signatureHex);
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert when signer is an EOA and SignatureType=Validator', async () => {
            const signatureHex = hexConcat(notSignerAddress, SignatureType.Validator);
            const expectedError = new LibBytesRevertErrors.InvalidByteOperationError(
                LibBytesRevertErrors.InvalidByteOperationErrorCodes.LengthGreaterThanOrEqualsFourRequired,
                new BigNumber(0),
                new BigNumber(4),
            );
            // Register an EOA as a validator.
            await signatureValidator.setSignatureValidatorApproval.awaitTransactionSuccessAsync(
                notSignerAddress,
                true,
                { from: signerAddress },
            );
            const tx = signatureValidator.isValidTransactionSignature.callAsync(signedTransaction, signatureHex);
            return expect(tx).to.revertWith(expectedError);
        });

        // Run hash-only signature type tests as well.
        const validateOrderHashAsync = async (
            hashHex: string,
            _signerAddress: string,
            signatureHex: string,
            validatorAction?: ValidatorWalletAction,
            validatorExpectedSignatureHex?: string,
        ): Promise<any> => {
            signedTransaction.signerAddress = _signerAddress;
            return validateAsync(signedTransaction, signatureHex, validatorAction, validatorExpectedSignatureHex);
        };
        createHashSignatureTests((_signerAddress?: string) => {
            signedTransaction.signerAddress = _signerAddress === undefined ? signerAddress : _signerAddress;
            return transactionHashUtils.getTransactionHashHex(signedTransaction);
        }, validateOrderHashAsync);
    });

    describe('setSignatureValidatorApproval', () => {
        let signatureValidatorLogDecoder: LogDecoder;

        before(async () => {
            signatureValidatorLogDecoder = new LogDecoder(env.web3Wrapper, artifacts);
        });

        it('should emit a SignatureValidatorApprovalSet with correct args when a validator is approved', async () => {
            const approval = true;
            const res = await signatureValidator.setSignatureValidatorApproval.awaitTransactionSuccessAsync(
                validatorWallet.address,
                approval,
                {
                    from: signerAddress,
                },
            );
            expect(res.logs.length).to.equal(1);
            const log = signatureValidatorLogDecoder.decodeLogOrThrow(res.logs[0]) as LogWithDecodedArgs<
                TestSignatureValidatorSignatureValidatorApprovalEventArgs
            >;
            const logArgs = log.args;
            expect(logArgs.signerAddress).to.equal(signerAddress);
            expect(logArgs.validatorAddress).to.equal(validatorWallet.address);
            expect(logArgs.approved).to.equal(approval);
        });
        it('should emit a SignatureValidatorApprovalSet with correct args when a validator is disapproved', async () => {
            const approval = false;
            const res = await signatureValidator.setSignatureValidatorApproval.awaitTransactionSuccessAsync(
                validatorWallet.address,
                approval,
                {
                    from: signerAddress,
                },
            );
            expect(res.logs.length).to.equal(1);
            const log = signatureValidatorLogDecoder.decodeLogOrThrow(res.logs[0]) as LogWithDecodedArgs<
                TestSignatureValidatorSignatureValidatorApprovalEventArgs
            >;
            const logArgs = log.args;
            expect(logArgs.signerAddress).to.equal(signerAddress);
            expect(logArgs.validatorAddress).to.equal(validatorWallet.address);
            expect(logArgs.approved).to.equal(approval);
        });
    });
});
// tslint:disable:max-file-line-count
// tslint:enable:no-unnecessary-type-assertion
