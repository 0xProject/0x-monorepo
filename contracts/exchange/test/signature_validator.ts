import { encodeERC20AssetData, ERC20ProxyContract, ERC20Wrapper } from '@0x/contracts-asset-proxy';
import { DummyERC20TokenContract } from '@0x/contracts-erc20';
import {
    blockchainTests,
    constants,
    expect,
    LogDecoder,
    OrderFactory,
    orderHashUtils,
    orderUtils,
    randomAddress,
    TransactionFactory,
    transactionHashUtils,
} from '@0x/contracts-test-utils';
import { SignatureType, SignedOrder, SignedZeroExTransaction } from '@0x/types';
import { BigNumber, ExchangeRevertErrors, hexUtils, StringRevertError } from '@0x/utils';
import { LogWithDecodedArgs } from 'ethereum-types';
import ethUtil = require('ethereumjs-util');

import { artifacts } from './artifacts';
import {
    ExchangeContract,
    ExchangeSignatureValidatorApprovalEventArgs,
    IEIP1271DataContract,
    TestValidatorWalletContract,
} from './wrappers';

enum ValidatorWalletAction {
    Reject = 0,
    Accept = 1,
    Revert = 2,
    UpdateState = 3,
    MatchSignatureHash = 4,
    ReturnTrue = 5,
    ReturnNothing = 6,
    NTypes = 7,
}

// tslint:disable:no-unnecessary-type-assertion
blockchainTests.resets('MixinSignatureValidator', env => {
    let chainId: number;
    let exchange: ExchangeContract;
    let validatorWallet: TestValidatorWalletContract;
    let validatorWalletRevertReason: string;
    let signerAddress: string;
    let signerPrivateKey: Buffer;
    let notSignerAddress: string;
    let accounts: string[];
    let owner: string;
    let makerAddress: string;
    let takerAddress: string;
    let feeRecipientAddress: string;

    const eip1271Data = new IEIP1271DataContract(constants.NULL_ADDRESS, env.provider, env.txDefaults);
    before(async () => {
        chainId = await env.getChainIdAsync();
        accounts = await env.getAccountAddressesAsync();
        [owner, signerAddress, notSignerAddress, makerAddress, takerAddress, feeRecipientAddress] = accounts;
        exchange = await ExchangeContract.deployFrom0xArtifactAsync(
            artifacts.Exchange,
            env.provider,
            env.txDefaults,
            {},
            new BigNumber(chainId),
        );
        validatorWallet = await TestValidatorWalletContract.deployFrom0xArtifactAsync(
            artifacts.TestValidatorWallet,
            env.provider,
            env.txDefaults,
            {},
            exchange.address,
        );
        validatorWalletRevertReason = await validatorWallet.REVERT_REASON().callAsync();

        // Approve the validator for both signers.
        await Promise.all(
            [signerAddress, notSignerAddress].map(async (addr: string) => {
                return exchange
                    .setSignatureValidatorApproval(validatorWallet.address, true)
                    .awaitTransactionSuccessAsync({ from: addr });
            }),
        );

        signerPrivateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(signerAddress)];
    });

    const SIGNATURE_LENGTH = 65;
    const generateRandomSignature = (): string => hexUtils.random(SIGNATURE_LENGTH);
    const hashBytes = (bytesHex: string): string => ethUtil.bufferToHex(ethUtil.sha3(ethUtil.toBuffer(bytesHex)));
    const signDataHex = (dataHex: string, privateKey: Buffer): string => {
        const ecSignature = ethUtil.ecsign(ethUtil.toBuffer(dataHex), privateKey);
        return hexUtils.concat(ecSignature.v, ecSignature.r, ecSignature.s);
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
            const signatureHex = hexUtils.concat(SignatureType.NSignatureTypes);
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
            const signatureHex = hexUtils.concat(SignatureType.Illegal);
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
            const signatureHex = hexUtils.concat(SignatureType.Invalid);
            const isValidSignature = await validateAsync(hashHex, signerAddress, signatureHex);
            expect(isValidSignature).to.be.false();
        });

        it('should revert when SignatureType=Invalid and signature length is non-zero', async () => {
            const hashHex = getCurrentHashHex();
            const signatureHex = hexUtils.concat('0xdeadbeef', SignatureType.Invalid);
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
            const signatureHex = hexUtils.concat(signDataHex(hashHex, signerPrivateKey), SignatureType.EIP712);
            const isValidSignature = await validateAsync(hashHex, signerAddress, signatureHex);
            expect(isValidSignature).to.be.true();
        });

        it('should return false when SignatureType=EIP712 and signature is invalid', async () => {
            const hashHex = getCurrentHashHex();
            const signatureHex = hexUtils.concat(generateRandomSignature(), SignatureType.EIP712);
            const isValidSignature = await validateAsync(hashHex, signerAddress, signatureHex);
            expect(isValidSignature).to.be.false();
        });

        it('should return true when SignatureType=EthSign and signature is valid', async () => {
            // Create EthSign signature
            const hashHex = getCurrentHashHex();
            const orderHashWithEthSignPrefixHex = ethUtil.bufferToHex(
                ethUtil.hashPersonalMessage(ethUtil.toBuffer(hashHex)),
            );
            const signatureHex = hexUtils.concat(
                signDataHex(orderHashWithEthSignPrefixHex, signerPrivateKey),
                SignatureType.EthSign,
            );
            const isValidSignature = await validateAsync(hashHex, signerAddress, signatureHex);
            expect(isValidSignature).to.be.true();
        });

        it('should return false when SignatureType=EthSign and signature is invalid', async () => {
            const hashHex = getCurrentHashHex();
            // Create EthSign signature
            const signatureHex = hexUtils.concat(generateRandomSignature(), SignatureType.EthSign);
            const isValidSignature = await validateAsync(hashHex, signerAddress, signatureHex);
            expect(isValidSignature).to.be.false();
        });

        it('should return true when SignatureType=Wallet and signature is valid', async () => {
            const hashHex = getCurrentHashHex(validatorWallet.address);
            // Doesn't have to contain a real signature since our wallet contract
            // just does a hash comparison.
            const signatureDataHex = generateRandomSignature();
            const signatureHex = hexUtils.concat(signatureDataHex, SignatureType.Wallet);
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
            const signatureHex = hexUtils.concat(notSignatureDataHex, SignatureType.Wallet);
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
            const signatureHex = hexUtils.concat(generateRandomSignature(), SignatureType.Wallet);
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
            const signatureHex = hexUtils.concat(SignatureType.Wallet);
            const expectedError = new ExchangeRevertErrors.SignatureWalletError(
                hashHex,
                signerAddress,
                signatureHex,
                constants.NULL_BYTES,
            );
            const tx = validateAsync(hashHex, signerAddress, signatureHex);
            return expect(tx).to.revertWith(expectedError);
        });

        it('should return false when validator returns `true` and SignatureType=Wallet', async () => {
            const hashHex = getCurrentHashHex();
            const signatureHex = hexUtils.concat(SignatureType.Wallet);
            const isValidSignature = await validateAsync(
                hashHex,
                validatorWallet.address,
                signatureHex,
                ValidatorWalletAction.ReturnTrue,
            );
            expect(isValidSignature).to.be.false();
        });

        it('should revert when validator returns nothing and SignatureType=Wallet', async () => {
            const hashHex = getCurrentHashHex(validatorWallet.address);
            const signatureHex = hexUtils.concat(SignatureType.Wallet);
            const expectedError = new ExchangeRevertErrors.SignatureWalletError(
                hashHex,
                validatorWallet.address,
                signatureHex,
                constants.NULL_BYTES,
            );
            const tx = validateAsync(
                hashHex,
                validatorWallet.address,
                signatureHex,
                ValidatorWalletAction.ReturnNothing,
            );
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert when validator reverts and SignatureType=Wallet', async () => {
            const hashHex = getCurrentHashHex(validatorWallet.address);
            // Doesn't have to contain a real signature since our wallet contract
            // just does a hash comparison.
            const signatureHex = hexUtils.concat(generateRandomSignature(), SignatureType.Wallet);
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
            await exchange.preSign(hashHex).awaitTransactionSuccessAsync({ from: signerAddress });
            // Validate presigned signature
            const signatureHex = hexUtils.concat(SignatureType.PreSigned);
            const isValidSignature = await validateAsync(hashHex, signerAddress, signatureHex);
            expect(isValidSignature).to.be.true();
        });

        it('should return false when SignatureType=Presigned and signer has not presigned hash', async () => {
            const hashHex = getCurrentHashHex();
            const signatureHex = hexUtils.concat(SignatureType.PreSigned);
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
                await validatorWallet
                    .prepare(_hashHex, validatorAction, expectedSignatureHashHex)
                    .awaitTransactionSuccessAsync();
            }
            return exchange.isValidHashSignature(_hashHex, _signerAddress, signatureHex).callAsync();
        };

        it('should revert when signerAddress == 0', async () => {
            const signatureHex = hexUtils.concat(SignatureType.EIP712);
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
            const signatureHex = hexUtils.concat(SignatureType.Validator);
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
            const signatureHex = hexUtils.concat(SignatureType.EIP1271Wallet);
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
            const isValidSignature = await exchange.isValidHashSignature(messageHash, signer, signatureHex).callAsync();
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
            const isValidSignature = await exchange.isValidHashSignature(messageHash, signer, signatureHex).callAsync();
            expect(isValidSignature).to.be.true();
        });

        createHashSignatureTests((_signerAddress?: string) => hashHex, validateAsync);
    });

    describe('isValidOrderSignature', () => {
        let orderFactory: OrderFactory;
        let signedOrder: SignedOrder;

        before(async () => {
            const defaultOrderParams = {
                ...constants.STATIC_ORDER_PARAMS,
                makerAddress: signerAddress,
                feeRecipientAddress: randomAddress(),
                makerAssetData: encodeERC20AssetData(randomAddress()),
                takerAssetData: encodeERC20AssetData(randomAddress()),
                makerFeeAssetData: encodeERC20AssetData(randomAddress()),
                takerFeeAssetData: encodeERC20AssetData(randomAddress()),
                makerFee: constants.ZERO_AMOUNT,
                takerFee: constants.ZERO_AMOUNT,
                exchangeAddress: exchange.address,
                chainId,
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
                await validatorWallet
                    .prepare(orderHashHex, validatorAction, expectedSignatureHashHex)
                    .awaitTransactionSuccessAsync();
            }
            return exchange.isValidOrderSignature(order, signatureHex).callAsync();
        };

        it('should revert when signerAddress == 0', async () => {
            const signatureHex = hexUtils.concat(SignatureType.EIP712);
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
            const tx = exchange.isValidOrderSignature(nullMakerOrder, signatureHex).callAsync();
            return expect(tx).to.revertWith(expectedError);
        });

        it('should return true when SignatureType=Validator, signature is valid and validator is approved', async () => {
            // Doesn't have to contain a real signature since our wallet contract
            // just does a hash comparison.
            const signatureDataHex = generateRandomSignature();
            const signatureHex = hexUtils.concat(signatureDataHex, validatorWallet.address, SignatureType.Validator);
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
            const signatureHex = hexUtils.concat(notSignatureDataHex, validatorWallet.address, SignatureType.Validator);
            const isValidSignature = await validateAsync(
                signedOrder,
                signatureHex,
                ValidatorWalletAction.MatchSignatureHash,
                signatureDataHex,
            );
            expect(isValidSignature).to.be.false();
        });

        it('should return false when validator returns `true` and SignatureType=Validator', async () => {
            const signatureDataHex = generateRandomSignature();
            const signatureHex = hexUtils.concat(signatureDataHex, validatorWallet.address, SignatureType.Validator);
            const isValidSignature = await validateAsync(
                signedOrder,
                signatureHex,
                ValidatorWalletAction.ReturnTrue,
                signatureDataHex,
            );
            expect(isValidSignature).to.be.false();
        });

        it('should revert when validator returns nothing and SignatureType=Validator', async () => {
            const signatureDataHex = generateRandomSignature();
            const signatureHex = hexUtils.concat(signatureDataHex, validatorWallet.address, SignatureType.Validator);
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            const data = eip1271Data.OrderWithHash(signedOrder, orderHashHex).getABIEncodedTransactionData();
            const expectedError = new ExchangeRevertErrors.EIP1271SignatureError(
                validatorWallet.address,
                data,
                signatureHex,
                constants.NULL_BYTES,
            );
            const tx = validateAsync(signedOrder, signatureHex, ValidatorWalletAction.ReturnNothing, signatureDataHex);
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert when validator attempts to update state and SignatureType=Validator', async () => {
            // Doesn't have to contain a real signature since our wallet contract
            // just does a hash comparison.
            const signatureDataHex = generateRandomSignature();
            const signatureHex = hexUtils.concat(signatureDataHex, validatorWallet.address, SignatureType.Validator);
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            const data = eip1271Data.OrderWithHash(signedOrder, orderHashHex).getABIEncodedTransactionData();
            const expectedError = new ExchangeRevertErrors.EIP1271SignatureError(
                validatorWallet.address,
                data,
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
            const signatureHex = hexUtils.concat(signatureDataHex, validatorWallet.address, SignatureType.Validator);
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            const data = eip1271Data.OrderWithHash(signedOrder, orderHashHex).getABIEncodedTransactionData();
            const expectedError = new ExchangeRevertErrors.EIP1271SignatureError(
                validatorWallet.address,
                data,
                signatureHex,
                new StringRevertError(validatorWalletRevertReason).encode(),
            );
            const tx = validateAsync(signedOrder, signatureHex, ValidatorWalletAction.Revert);
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert when SignatureType=Validator and signature is shorter than 21 bytes', async () => {
            // Set approval of signature validator to false
            await exchange
                .setSignatureValidatorApproval(validatorWallet.address, false)
                .awaitTransactionSuccessAsync({ from: signedOrder.makerAddress });
            // Doesn't have to contain a real signature since our wallet contract
            // just does a hash comparison.
            const signatureHex = hexUtils.concat(SignatureType.Validator);
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedError = new ExchangeRevertErrors.SignatureError(
                ExchangeRevertErrors.SignatureErrorCode.InvalidLength,
                orderHashHex,
                signedOrder.makerAddress,
                signatureHex,
            );
            const tx = validateAsync(signedOrder, signatureHex, ValidatorWalletAction.MatchSignatureHash);
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert when SignatureType=Validator, signature is valid and validator is not approved', async () => {
            // Set approval of signature validator to false
            await exchange
                .setSignatureValidatorApproval(validatorWallet.address, false)
                .awaitTransactionSuccessAsync({ from: signedOrder.makerAddress });
            // Doesn't have to contain a real signature since our wallet contract
            // just does a hash comparison.
            const signatureDataHex = generateRandomSignature();
            const signatureHex = hexUtils.concat(signatureDataHex, validatorWallet.address, SignatureType.Validator);
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
            const signatureHex = hexUtils.concat(signatureDataHex, SignatureType.EIP1271Wallet);
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
            const signatureHex = hexUtils.concat(notSignatureDataHex, SignatureType.EIP1271Wallet);
            // Validate signature
            const isValidSignature = await validateAsync(
                signedOrder,
                signatureHex,
                ValidatorWalletAction.MatchSignatureHash,
                signatureDataHex,
            );
            expect(isValidSignature).to.be.false();
        });

        it('should return false when validator returns `true` and SignatureType=EIP1271Wallet', async () => {
            signedOrder.makerAddress = validatorWallet.address;
            const signatureDataHex = generateRandomSignature();
            const signatureHex = hexUtils.concat(signatureDataHex, SignatureType.EIP1271Wallet);
            // Validate signature
            const isValidSignature = await validateAsync(
                signedOrder,
                signatureHex,
                ValidatorWalletAction.ReturnTrue,
                signatureDataHex,
            );
            expect(isValidSignature).to.be.false();
        });

        it('should revert when validator returns nothing and SignatureType=EIP1271Wallet', async () => {
            signedOrder.makerAddress = validatorWallet.address;
            const signatureDataHex = generateRandomSignature();
            const signatureHex = hexUtils.concat(signatureDataHex, SignatureType.EIP1271Wallet);
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            const data = eip1271Data.OrderWithHash(signedOrder, orderHashHex).getABIEncodedTransactionData();
            const expectedError = new ExchangeRevertErrors.EIP1271SignatureError(
                validatorWallet.address,
                data,
                signatureHex,
                constants.NULL_BYTES,
            );
            const tx = validateAsync(signedOrder, signatureHex, ValidatorWalletAction.ReturnNothing, signatureDataHex);
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert when validator attempts to update state and SignatureType=EIP1271Wallet', async () => {
            signedOrder.makerAddress = validatorWallet.address;
            // Doesn't have to contain a real signature since our wallet contract
            // just does a hash comparison.
            const signatureHex = hexUtils.concat(generateRandomSignature(), SignatureType.EIP1271Wallet);
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            const data = eip1271Data.OrderWithHash(signedOrder, orderHashHex).getABIEncodedTransactionData();
            const expectedError = new ExchangeRevertErrors.EIP1271SignatureError(
                validatorWallet.address,
                data,
                signatureHex,
                constants.NULL_BYTES,
            );
            const tx = validateAsync(signedOrder, signatureHex, ValidatorWalletAction.UpdateState);
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert when validator reverts and SignatureType=EIP1271Wallet', async () => {
            signedOrder.makerAddress = validatorWallet.address;
            const signatureHex = hexUtils.concat(SignatureType.EIP1271Wallet);
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            const data = eip1271Data.OrderWithHash(signedOrder, orderHashHex).getABIEncodedTransactionData();
            const expectedError = new ExchangeRevertErrors.EIP1271SignatureError(
                validatorWallet.address,
                data,
                signatureHex,
                new StringRevertError(validatorWalletRevertReason).encode(),
            );
            const tx = validateAsync(signedOrder, signatureHex, ValidatorWalletAction.Revert);
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert when signer is an EOA and SignatureType=EIP1271Wallet', async () => {
            const signatureHex = hexUtils.concat(SignatureType.EIP1271Wallet);
            signedOrder.makerAddress = notSignerAddress;
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            const data = eip1271Data.OrderWithHash(signedOrder, orderHashHex).getABIEncodedTransactionData();
            const expectedError = new ExchangeRevertErrors.EIP1271SignatureError(
                notSignerAddress,
                data,
                signatureHex,
                constants.NULL_BYTES,
            );
            const tx = exchange.isValidOrderSignature(signedOrder, signatureHex).callAsync();
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert when signer is an EOA and SignatureType=Validator', async () => {
            const signatureHex = hexUtils.concat(notSignerAddress, SignatureType.Validator);
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            const data = eip1271Data.OrderWithHash(signedOrder, orderHashHex).getABIEncodedTransactionData();
            const expectedError = new ExchangeRevertErrors.EIP1271SignatureError(
                notSignerAddress,
                data,
                signatureHex,
                constants.NULL_BYTES,
            );
            // Register an EOA as a validator.
            await exchange
                .setSignatureValidatorApproval(notSignerAddress, true)
                .awaitTransactionSuccessAsync({ from: signerAddress });
            const tx = exchange.isValidOrderSignature(signedOrder, signatureHex).callAsync();
            return expect(tx).to.revertWith(expectedError);
        });

        // Run hash-only signature type tests as well.
        const validateOrderHashAsync = async (
            _hashHex: string,
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
            transactionFactory = new TransactionFactory(signerPrivateKey, exchange.address, chainId);
        });

        beforeEach(async () => {
            // We don't actually do anything with the transaction so we can just
            // fill it with random data.
            signedTransaction = await transactionFactory.newSignedTransactionAsync({
                data: hexUtils.random(TRANSACTION_DATA_LENGTH),
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
                await validatorWallet
                    .prepare(transactionHashHex, validatorAction, expectedSignatureHashHex)
                    .awaitTransactionSuccessAsync();
            }
            return exchange.isValidTransactionSignature(transaction, signatureHex).callAsync();
        };

        it('should revert when signerAddress == 0', async () => {
            const signatureHex = hexUtils.concat(SignatureType.EIP712);
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
            const tx = exchange.isValidTransactionSignature(nullSignerTransaction, signatureHex).callAsync();
            return expect(tx).to.revertWith(expectedError);
        });

        it('should return true when SignatureType=Validator, signature is valid and validator is approved', async () => {
            // Doesn't have to contain a real signature since our wallet contract
            // just does a hash comparison.
            const signatureDataHex = generateRandomSignature();
            const signatureHex = hexUtils.concat(signatureDataHex, validatorWallet.address, SignatureType.Validator);
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
            const signatureHex = hexUtils.concat(notSignatureDataHex, validatorWallet.address, SignatureType.Validator);
            const isValidSignature = await validateAsync(
                signedTransaction,
                signatureHex,
                ValidatorWalletAction.MatchSignatureHash,
                signatureDataHex,
            );
            expect(isValidSignature).to.be.false();
        });

        it('should return false when validator returns `true` and SignatureType=Validator', async () => {
            const signatureDataHex = generateRandomSignature();
            const signatureHex = hexUtils.concat(signatureDataHex, validatorWallet.address, SignatureType.Validator);
            const isValidSignature = await validateAsync(
                signedTransaction,
                signatureHex,
                ValidatorWalletAction.ReturnTrue,
                signatureDataHex,
            );
            expect(isValidSignature).to.be.false();
        });

        it('should revert when SignatureType=Validator and signature is shorter than 21 bytes', async () => {
            // Set approval of signature validator to false
            await exchange
                .setSignatureValidatorApproval(validatorWallet.address, false)
                .awaitTransactionSuccessAsync({ from: signedTransaction.signerAddress });
            // Doesn't have to contain a real signature since our wallet contract
            // just does a hash comparison.
            const signatureHex = hexUtils.concat(SignatureType.Validator);
            const transactionHashHex = transactionHashUtils.getTransactionHashHex(signedTransaction);
            const expectedError = new ExchangeRevertErrors.SignatureError(
                ExchangeRevertErrors.SignatureErrorCode.InvalidLength,
                transactionHashHex,
                signedTransaction.signerAddress,
                signatureHex,
            );
            const tx = validateAsync(signedTransaction, signatureHex, ValidatorWalletAction.MatchSignatureHash);
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert when validator returns nothing and SignatureType=Validator', async () => {
            const signatureDataHex = generateRandomSignature();
            const signatureHex = hexUtils.concat(signatureDataHex, validatorWallet.address, SignatureType.Validator);
            const transactionHashHex = transactionHashUtils.getTransactionHashHex(signedTransaction);
            const data = eip1271Data
                .ZeroExTransactionWithHash(signedTransaction, transactionHashHex)
                .getABIEncodedTransactionData();
            const expectedError = new ExchangeRevertErrors.EIP1271SignatureError(
                validatorWallet.address,
                data,
                signatureHex,
                constants.NULL_BYTES,
            );
            const tx = validateAsync(
                signedTransaction,
                signatureHex,
                ValidatorWalletAction.ReturnNothing,
                signatureDataHex,
            );
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert when validator attempts to update state and SignatureType=Validator', async () => {
            // Doesn't have to contain a real signature since our wallet contract
            // just does a hash comparison.
            const signatureDataHex = generateRandomSignature();
            const signatureHex = hexUtils.concat(signatureDataHex, validatorWallet.address, SignatureType.Validator);
            const transactionHashHex = transactionHashUtils.getTransactionHashHex(signedTransaction);
            const data = eip1271Data
                .ZeroExTransactionWithHash(signedTransaction, transactionHashHex)
                .getABIEncodedTransactionData();
            const expectedError = new ExchangeRevertErrors.EIP1271SignatureError(
                validatorWallet.address,
                data,
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
            const signatureHex = hexUtils.concat(signatureDataHex, validatorWallet.address, SignatureType.Validator);
            const transactionHashHex = transactionHashUtils.getTransactionHashHex(signedTransaction);
            const data = eip1271Data
                .ZeroExTransactionWithHash(signedTransaction, transactionHashHex)
                .getABIEncodedTransactionData();
            const expectedError = new ExchangeRevertErrors.EIP1271SignatureError(
                validatorWallet.address,
                data,
                signatureHex,
                new StringRevertError(validatorWalletRevertReason).encode(),
            );
            const tx = validateAsync(signedTransaction, signatureHex, ValidatorWalletAction.Revert);
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert when SignatureType=Validator, signature is valid and validator is not approved', async () => {
            // Set approval of signature validator to false
            await exchange
                .setSignatureValidatorApproval(validatorWallet.address, false)
                .awaitTransactionSuccessAsync({ from: signedTransaction.signerAddress });
            // Doesn't have to contain a real signature since our wallet contract
            // just does a hash comparison.
            const signatureDataHex = generateRandomSignature();
            const signatureHex = hexUtils.concat(signatureDataHex, validatorWallet.address, SignatureType.Validator);
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
            const signatureHex = hexUtils.concat(signatureDataHex, SignatureType.EIP1271Wallet);
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
            const signatureHex = hexUtils.concat(notSignatureDataHex, SignatureType.EIP1271Wallet);
            // Validate signature
            const isValidSignature = await validateAsync(
                signedTransaction,
                signatureHex,
                ValidatorWalletAction.MatchSignatureHash,
                signatureDataHex,
            );
            expect(isValidSignature).to.be.false();
        });

        it('should return false when validator returns `true` and SignatureType=EIP1271Wallet', async () => {
            signedTransaction.signerAddress = validatorWallet.address;
            const signatureDataHex = generateRandomSignature();
            const signatureHex = hexUtils.concat(signatureDataHex, SignatureType.EIP1271Wallet);
            // Validate signature
            const isValidSignature = await validateAsync(
                signedTransaction,
                signatureHex,
                ValidatorWalletAction.ReturnTrue,
                signatureDataHex,
            );
            expect(isValidSignature).to.be.false();
        });

        it('should revert when validator returns nothing and SignatureType=EIP1271Wallet', async () => {
            signedTransaction.signerAddress = validatorWallet.address;
            const signatureDataHex = generateRandomSignature();
            const signatureHex = hexUtils.concat(signatureDataHex, SignatureType.EIP1271Wallet);
            const transactionHashHex = transactionHashUtils.getTransactionHashHex(signedTransaction);
            const data = eip1271Data
                .ZeroExTransactionWithHash(signedTransaction, transactionHashHex)
                .getABIEncodedTransactionData();
            const expectedError = new ExchangeRevertErrors.EIP1271SignatureError(
                validatorWallet.address,
                data,
                signatureHex,
                constants.NULL_BYTES,
            );
            const tx = validateAsync(
                signedTransaction,
                signatureHex,
                ValidatorWalletAction.ReturnNothing,
                signatureDataHex,
            );
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert when validator attempts to update state and SignatureType=EIP1271Wallet', async () => {
            signedTransaction.signerAddress = validatorWallet.address;
            // Doesn't have to contain a real signature since our wallet contract
            // just does a hash comparison.
            const signatureHex = hexUtils.concat(generateRandomSignature(), SignatureType.EIP1271Wallet);
            const transactionHashHex = transactionHashUtils.getTransactionHashHex(signedTransaction);
            const data = eip1271Data
                .ZeroExTransactionWithHash(signedTransaction, transactionHashHex)
                .getABIEncodedTransactionData();
            const expectedError = new ExchangeRevertErrors.EIP1271SignatureError(
                validatorWallet.address,
                data,
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
            const signatureHex = hexUtils.concat(generateRandomSignature(), SignatureType.EIP1271Wallet);
            const transactionHashHex = transactionHashUtils.getTransactionHashHex(signedTransaction);
            const data = eip1271Data
                .ZeroExTransactionWithHash(signedTransaction, transactionHashHex)
                .getABIEncodedTransactionData();
            const expectedError = new ExchangeRevertErrors.EIP1271SignatureError(
                validatorWallet.address,
                data,
                signatureHex,
                new StringRevertError(validatorWalletRevertReason).encode(),
            );
            const tx = validateAsync(signedTransaction, signatureHex, ValidatorWalletAction.Revert);
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert when signer is an EOA and SignatureType=EIP1271Wallet', async () => {
            const signatureHex = hexUtils.concat(SignatureType.EIP1271Wallet);
            const transactionHashHex = transactionHashUtils.getTransactionHashHex(signedTransaction);
            const data = eip1271Data
                .ZeroExTransactionWithHash(signedTransaction, transactionHashHex)
                .getABIEncodedTransactionData();
            const expectedError = new ExchangeRevertErrors.EIP1271SignatureError(
                signedTransaction.signerAddress,
                data,
                signatureHex,
                constants.NULL_BYTES,
            );
            const tx = exchange.isValidTransactionSignature(signedTransaction, signatureHex).callAsync();
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert when signer is an EOA and SignatureType=Validator', async () => {
            const signatureHex = hexUtils.concat(notSignerAddress, SignatureType.Validator);
            const transactionHashHex = transactionHashUtils.getTransactionHashHex(signedTransaction);
            const data = eip1271Data
                .ZeroExTransactionWithHash(signedTransaction, transactionHashHex)
                .getABIEncodedTransactionData();
            const expectedError = new ExchangeRevertErrors.EIP1271SignatureError(
                notSignerAddress,
                data,
                signatureHex,
                constants.NULL_BYTES,
            );
            // Register an EOA as a validator.
            await exchange
                .setSignatureValidatorApproval(notSignerAddress, true)
                .awaitTransactionSuccessAsync({ from: signerAddress });
            const tx = exchange.isValidTransactionSignature(signedTransaction, signatureHex).callAsync();
            return expect(tx).to.revertWith(expectedError);
        });

        // Run hash-only signature type tests as well.
        const validateOrderHashAsync = async (
            _hashHex: string,
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
            const res = await exchange
                .setSignatureValidatorApproval(validatorWallet.address, approval)
                .awaitTransactionSuccessAsync({
                    from: signerAddress,
                });
            expect(res.logs.length).to.equal(1);
            const log = signatureValidatorLogDecoder.decodeLogOrThrow(res.logs[0]) as LogWithDecodedArgs<
                ExchangeSignatureValidatorApprovalEventArgs
            >;
            const logArgs = log.args;
            expect(logArgs.signerAddress).to.equal(signerAddress);
            expect(logArgs.validatorAddress).to.equal(validatorWallet.address);
            expect(logArgs.isApproved).to.equal(approval);
        });
        it('should emit a SignatureValidatorApprovalSet with correct args when a validator is disapproved', async () => {
            const approval = false;
            const res = await exchange
                .setSignatureValidatorApproval(validatorWallet.address, approval)
                .awaitTransactionSuccessAsync({
                    from: signerAddress,
                });
            expect(res.logs.length).to.equal(1);
            const log = signatureValidatorLogDecoder.decodeLogOrThrow(res.logs[0]) as LogWithDecodedArgs<
                ExchangeSignatureValidatorApprovalEventArgs
            >;
            const logArgs = log.args;
            expect(logArgs.signerAddress).to.equal(signerAddress);
            expect(logArgs.validatorAddress).to.equal(validatorWallet.address);
            expect(logArgs.isApproved).to.equal(approval);
        });
    });

    describe('fillOrder integration tests', () => {
        let erc20Wrapper: ERC20Wrapper;
        let erc20Proxy: ERC20ProxyContract;
        let erc20TokenA: DummyERC20TokenContract;
        let erc20TokenB: DummyERC20TokenContract;
        let feeToken: DummyERC20TokenContract;
        let orderFactory: OrderFactory;
        let signedOrder: SignedOrder;

        before(async () => {
            // Deploy ERC20 proxy and tokens
            erc20Wrapper = new ERC20Wrapper(env.provider, accounts, owner);
            erc20Proxy = await erc20Wrapper.deployProxyAsync();
            const numDummyErc20ToDeploy = 3;
            [erc20TokenA, erc20TokenB, feeToken] = await erc20Wrapper.deployDummyTokensAsync(
                numDummyErc20ToDeploy,
                constants.DUMMY_TOKEN_DECIMALS,
            );
            await erc20Wrapper.setBalancesAndAllowancesAsync();

            // Configure ERC20 proxy and exchange
            await erc20Proxy.addAuthorizedAddress(exchange.address).awaitTransactionSuccessAsync({ from: owner });
            await exchange.registerAssetProxy(erc20Proxy.address).awaitTransactionSuccessAsync({ from: owner });

            // Configure order defaults
            const defaultMakerAssetAddress = erc20TokenA.address;
            const defaultTakerAssetAddress = erc20TokenB.address;
            const defaultFeeAssetAddress = feeToken.address;
            const defaultOrderParams = {
                ...constants.STATIC_ORDER_PARAMS,
                makerAddress,
                feeRecipientAddress,
                makerAssetData: encodeERC20AssetData(defaultMakerAssetAddress),
                takerAssetData: encodeERC20AssetData(defaultTakerAssetAddress),
                makerFeeAssetData: encodeERC20AssetData(defaultFeeAssetAddress),
                takerFeeAssetData: encodeERC20AssetData(defaultFeeAssetAddress),
                exchangeAddress: exchange.address,
                chainId,
            };
            const privateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(makerAddress)];
            orderFactory = new OrderFactory(privateKey, defaultOrderParams);

            // Approve the ERC20 proxy with the test validator wallet.
            await validatorWallet
                .approveERC20(erc20TokenA.address, erc20Proxy.address, constants.INITIAL_ERC20_ALLOWANCE)
                .awaitTransactionSuccessAsync();
            // Mint some ERC20 tokens to the test validator wallet.
            await erc20TokenA
                .setBalance(validatorWallet.address, constants.INITIAL_ERC20_BALANCE)
                .awaitTransactionSuccessAsync();
            // Approve the validator.
            await exchange.setSignatureValidatorApproval(validatorWallet.address, true).awaitTransactionSuccessAsync({
                from: makerAddress,
            });
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerFee: constants.ZERO_AMOUNT,
                takerFee: constants.ZERO_AMOUNT,
            });
        });

        it('should revert if `Validator` signature type rejects during a second fill', async () => {
            const signatureHex = hexUtils.concat(validatorWallet.address, SignatureType.Validator);
            signedOrder.signature = signatureHex;
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            // Allow the signature check for the first fill.
            await validatorWallet
                .prepare(orderHashHex, ValidatorWalletAction.Accept, constants.NULL_BYTES)
                .awaitTransactionSuccessAsync();
            const fillAmount = signedOrder.takerAssetAmount.div(10);
            await exchange.fillOrder(signedOrder, fillAmount, signedOrder.signature).awaitTransactionSuccessAsync({
                from: takerAddress,
            });
            // Reject the signature check for the second fill.
            await validatorWallet
                .prepare(orderHashHex, ValidatorWalletAction.Reject, constants.NULL_BYTES)
                .awaitTransactionSuccessAsync();
            const tx = exchange.fillOrder(signedOrder, fillAmount, signedOrder.signature).awaitTransactionSuccessAsync({
                from: takerAddress,
            });
            const expectedError = new ExchangeRevertErrors.SignatureError(
                ExchangeRevertErrors.SignatureErrorCode.BadOrderSignature,
                orderHashHex,
                signedOrder.makerAddress,
                signedOrder.signature,
            );
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert if `Wallet` signature type rejects during a second fill', async () => {
            const signatureHex = hexUtils.concat(SignatureType.Wallet);
            signedOrder.makerAddress = validatorWallet.address;
            signedOrder.signature = signatureHex;
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            // Allow the signature check for the first fill.
            await validatorWallet
                .prepare(orderHashHex, ValidatorWalletAction.Accept, constants.NULL_BYTES)
                .awaitTransactionSuccessAsync();
            const fillAmount = signedOrder.takerAssetAmount.div(10);
            await exchange.fillOrder(signedOrder, fillAmount, signedOrder.signature).awaitTransactionSuccessAsync({
                from: takerAddress,
            });
            // Reject the signature check for the second fill.
            await validatorWallet
                .prepare(orderHashHex, ValidatorWalletAction.Reject, constants.NULL_BYTES)
                .awaitTransactionSuccessAsync();
            const tx = exchange.fillOrder(signedOrder, fillAmount, signedOrder.signature).awaitTransactionSuccessAsync({
                from: takerAddress,
            });
            const expectedError = new ExchangeRevertErrors.SignatureError(
                ExchangeRevertErrors.SignatureErrorCode.BadOrderSignature,
                orderHashHex,
                signedOrder.makerAddress,
                signedOrder.signature,
            );
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert if `EIP1271Wallet` signature type rejects during a second fill', async () => {
            const signatureHex = hexUtils.concat(SignatureType.EIP1271Wallet);
            signedOrder.makerAddress = validatorWallet.address;
            signedOrder.signature = signatureHex;
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            // Allow the signature check for the first fill.
            await validatorWallet
                .prepare(orderHashHex, ValidatorWalletAction.Accept, constants.NULL_BYTES)
                .awaitTransactionSuccessAsync();
            const fillAmount = signedOrder.takerAssetAmount.div(10);
            await exchange.fillOrder(signedOrder, fillAmount, signedOrder.signature).awaitTransactionSuccessAsync({
                from: takerAddress,
            });
            // Reject the signature check for the second fill.
            await validatorWallet
                .prepare(orderHashHex, ValidatorWalletAction.Reject, constants.NULL_BYTES)
                .awaitTransactionSuccessAsync();
            const tx = exchange.fillOrder(signedOrder, fillAmount, signedOrder.signature).awaitTransactionSuccessAsync({
                from: takerAddress,
            });
            const expectedError = new ExchangeRevertErrors.SignatureError(
                ExchangeRevertErrors.SignatureErrorCode.BadOrderSignature,
                orderHashHex,
                signedOrder.makerAddress,
                signedOrder.signature,
            );
            return expect(tx).to.revertWith(expectedError);
        });
    });
});
// tslint:disable:max-file-line-count
// tslint:enable:no-unnecessary-type-assertion
