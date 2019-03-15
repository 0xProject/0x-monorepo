import {
    addressUtils,
    chaiSetup,
    constants as devConstants,
    expectContractCallFailedAsync,
    getLatestBlockTimestampAsync,
    provider,
    TransactionFactory,
    txDefaults,
    web3Wrapper,
} from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { transactionHashUtils } from '@0x/order-utils';
import { RevertReason, SignatureType, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import * as ethUtil from 'ethereumjs-util';

import { ApprovalFactory, artifacts, constants, exchangeDataEncoder, TestMixinsContract } from '../src';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('Mixins tests', () => {
    let transactionSignerAddress: string;
    let approvalSignerAddress1: string;
    let approvalSignerAddress2: string;
    let mixins: TestMixinsContract;
    let transactionFactory: TransactionFactory;
    let approvalFactory1: ApprovalFactory;
    let approvalFactory2: ApprovalFactory;
    let defaultOrder: SignedOrder;
    const exchangeAddress = addressUtils.generatePseudoRandomAddress();

    before(async () => {
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    before(async () => {
        mixins = await TestMixinsContract.deployFrom0xArtifactAsync(
            artifacts.TestMixins,
            provider,
            txDefaults,
            exchangeAddress,
        );
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        [transactionSignerAddress, approvalSignerAddress1, approvalSignerAddress2] = accounts.slice(0, 3);
        defaultOrder = {
            exchangeAddress: devConstants.NULL_ADDRESS,
            makerAddress: devConstants.NULL_ADDRESS,
            takerAddress: devConstants.NULL_ADDRESS,
            senderAddress: mixins.address,
            feeRecipientAddress: approvalSignerAddress1,
            makerAssetData: devConstants.NULL_BYTES,
            takerAssetData: devConstants.NULL_BYTES,
            makerAssetAmount: devConstants.ZERO_AMOUNT,
            takerAssetAmount: devConstants.ZERO_AMOUNT,
            makerFee: devConstants.ZERO_AMOUNT,
            takerFee: devConstants.ZERO_AMOUNT,
            expirationTimeSeconds: devConstants.ZERO_AMOUNT,
            salt: devConstants.ZERO_AMOUNT,
            signature: devConstants.NULL_BYTES,
        };
        const transactionSignerPrivateKey =
            devConstants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(transactionSignerAddress)];
        const approvalSignerPrivateKey1 = devConstants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(approvalSignerAddress1)];
        const approvalSignerPrivateKey2 = devConstants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(approvalSignerAddress2)];
        transactionFactory = new TransactionFactory(transactionSignerPrivateKey, exchangeAddress);
        approvalFactory1 = new ApprovalFactory(approvalSignerPrivateKey1, mixins.address);
        approvalFactory2 = new ApprovalFactory(approvalSignerPrivateKey2, mixins.address);
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });

    describe('getSignerAddress', () => {
        it('should return the correct address using the EthSign signature type', async () => {
            const data = devConstants.NULL_BYTES;
            const transaction = transactionFactory.newSignedTransaction(data, SignatureType.EthSign);
            const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
            const signerAddress = await mixins.getSignerAddress.callAsync(transactionHash, transaction.signature);
            expect(transaction.signerAddress).to.eq(signerAddress);
        });
        it('should return the correct address using the EIP712 signature type', async () => {
            const data = devConstants.NULL_BYTES;
            const transaction = transactionFactory.newSignedTransaction(data, SignatureType.EIP712);
            const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
            const signerAddress = await mixins.getSignerAddress.callAsync(transactionHash, transaction.signature);
            expect(transaction.signerAddress).to.eq(signerAddress);
        });
        it('should revert with with the Illegal signature type', async () => {
            const data = devConstants.NULL_BYTES;
            const transaction = transactionFactory.newSignedTransaction(data);
            const illegalSignatureByte = ethUtil.toBuffer(SignatureType.Illegal).toString('hex');
            transaction.signature = `${transaction.signature.slice(
                0,
                transaction.signature.length - 2,
            )}${illegalSignatureByte}`;
            const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
            expectContractCallFailedAsync(
                mixins.getSignerAddress.callAsync(transactionHash, transaction.signature),
                RevertReason.SignatureIllegal,
            );
        });
        it('should revert with with the Invalid signature type', async () => {
            const data = devConstants.NULL_BYTES;
            const transaction = transactionFactory.newSignedTransaction(data);
            const invalidSignatureByte = ethUtil.toBuffer(SignatureType.Invalid).toString('hex');
            transaction.signature = `0x${invalidSignatureByte}`;
            const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
            expectContractCallFailedAsync(
                mixins.getSignerAddress.callAsync(transactionHash, transaction.signature),
                RevertReason.SignatureInvalid,
            );
        });
        it("should revert with with a signature type that doesn't exist", async () => {
            const data = devConstants.NULL_BYTES;
            const transaction = transactionFactory.newSignedTransaction(data);
            const invalidSignatureByte = '04';
            transaction.signature = `${transaction.signature.slice(
                0,
                transaction.signature.length - 2,
            )}${invalidSignatureByte}`;
            const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
            expectContractCallFailedAsync(
                mixins.getSignerAddress.callAsync(transactionHash, transaction.signature),
                RevertReason.SignatureUnsupported,
            );
        });
    });

    describe('Single order approvals', () => {
        for (const fnName of constants.SINGLE_FILL_FN_NAMES) {
            it(`Should be successful: function=${fnName}, caller=tx_signer, senderAddress=[verifier], approval_sig=[approver1], expiration=[valid]`, async () => {
                const orders = [defaultOrder];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                const transaction = transactionFactory.newSignedTransaction(data);
                const currentTimestamp = await getLatestBlockTimestampAsync();
                const approvalExpirationTimeSeconds = new BigNumber(currentTimestamp).plus(constants.TIME_BUFFER);
                const approval = approvalFactory1.newSignedApproval(
                    transaction,
                    transactionSignerAddress,
                    approvalExpirationTimeSeconds,
                );
                await mixins.assertValidTransactionOrdersApproval.callAsync(
                    transaction,
                    orders,
                    transactionSignerAddress,
                    transaction.signature,
                    [approvalExpirationTimeSeconds],
                    [approval.signature],
                    { from: transactionSignerAddress },
                );
                await mixins.assertValidCoordinatorApprovals.callAsync(
                    transaction,
                    transactionSignerAddress,
                    transaction.signature,
                    [approvalExpirationTimeSeconds],
                    [approval.signature],
                    { from: transactionSignerAddress },
                );
            });
            it(`Should be successful: function=${fnName}, caller=tx_signer, senderAddress=[null], approval_sig=[approver1], expiration=[valid]`, async () => {
                const order = {
                    ...defaultOrder,
                    senderAddress: devConstants.NULL_ADDRESS,
                };
                const orders = [order];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                const transaction = transactionFactory.newSignedTransaction(data);
                const currentTimestamp = await getLatestBlockTimestampAsync();
                const approvalExpirationTimeSeconds = new BigNumber(currentTimestamp).plus(constants.TIME_BUFFER);
                const approval = approvalFactory1.newSignedApproval(
                    transaction,
                    transactionSignerAddress,
                    approvalExpirationTimeSeconds,
                );
                await mixins.assertValidTransactionOrdersApproval.callAsync(
                    transaction,
                    orders,
                    transactionSignerAddress,
                    transaction.signature,
                    [approvalExpirationTimeSeconds],
                    [approval.signature],
                    { from: transactionSignerAddress },
                );
                await mixins.assertValidCoordinatorApprovals.callAsync(
                    transaction,
                    transactionSignerAddress,
                    transaction.signature,
                    [approvalExpirationTimeSeconds],
                    [approval.signature],
                    { from: transactionSignerAddress },
                );
            });
            it(`Should be successful: function=${fnName}, caller=approver1, senderAddress=[verifier], approval_sig=[], expiration=[]`, async () => {
                const orders = [defaultOrder];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                const transaction = transactionFactory.newSignedTransaction(data);
                await mixins.assertValidTransactionOrdersApproval.callAsync(
                    transaction,
                    orders,
                    approvalSignerAddress1,
                    transaction.signature,
                    [],
                    [],
                    { from: approvalSignerAddress1 },
                );
                await mixins.assertValidCoordinatorApprovals.callAsync(
                    transaction,
                    approvalSignerAddress1,
                    transaction.signature,
                    [],
                    [],
                    {
                        from: approvalSignerAddress1,
                    },
                );
            });
            it(`Should be successful: function=${fnName}, caller=approver1, senderAddress=[verifier], approval_sig=[approver1], expiration=[invalid]`, async () => {
                const orders = [defaultOrder];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                const transaction = transactionFactory.newSignedTransaction(data);
                const currentTimestamp = await getLatestBlockTimestampAsync();
                const approvalExpirationTimeSeconds = new BigNumber(currentTimestamp).plus(constants.TIME_BUFFER);
                const approval = approvalFactory1.newSignedApproval(
                    transaction,
                    transactionSignerAddress,
                    approvalExpirationTimeSeconds,
                );
                await mixins.assertValidTransactionOrdersApproval.callAsync(
                    transaction,
                    orders,
                    approvalSignerAddress1,
                    transaction.signature,
                    [approvalExpirationTimeSeconds],
                    [approval.signature],
                    { from: approvalSignerAddress1 },
                );
                await mixins.assertValidCoordinatorApprovals.callAsync(
                    transaction,
                    approvalSignerAddress1,
                    transaction.signature,
                    [approvalExpirationTimeSeconds],
                    [approval.signature],
                    { from: approvalSignerAddress1 },
                );
            });
            it(`Should be successful: function=${fnName}, caller=approver1, senderAddress=[verifier], approval_sig=[], expiration=[]`, async () => {
                const orders = [defaultOrder];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                const transaction = transactionFactory.newSignedTransaction(data);
                await mixins.assertValidTransactionOrdersApproval.callAsync(
                    transaction,
                    orders,
                    approvalSignerAddress1,
                    transaction.signature,
                    [],
                    [],
                    { from: approvalSignerAddress1 },
                );
                await mixins.assertValidCoordinatorApprovals.callAsync(
                    transaction,
                    approvalSignerAddress1,
                    transaction.signature,
                    [],
                    [],
                    {
                        from: approvalSignerAddress1,
                    },
                );
            });
            it(`Should revert: function=${fnName}, caller=tx_signer, senderAddress=[verifier], approval_sig=[invalid], expiration=[valid]`, async () => {
                const orders = [defaultOrder];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                const transaction = transactionFactory.newSignedTransaction(data);
                const currentTimestamp = await getLatestBlockTimestampAsync();
                const approvalExpirationTimeSeconds = new BigNumber(currentTimestamp).plus(constants.TIME_BUFFER);
                const approval = approvalFactory1.newSignedApproval(
                    transaction,
                    transactionSignerAddress,
                    approvalExpirationTimeSeconds,
                );
                const signature = `${approval.signature.slice(0, 4)}FFFFFFFF${approval.signature.slice(12)}`;
                expectContractCallFailedAsync(
                    mixins.assertValidTransactionOrdersApproval.callAsync(
                        transaction,
                        orders,
                        transactionSignerAddress,
                        transaction.signature,
                        [approvalExpirationTimeSeconds],
                        [signature],
                        { from: transactionSignerAddress },
                    ),
                    RevertReason.InvalidApprovalSignature,
                );
                expectContractCallFailedAsync(
                    mixins.assertValidCoordinatorApprovals.callAsync(
                        transaction,
                        transactionSignerAddress,
                        transaction.signature,
                        [approvalExpirationTimeSeconds],
                        [signature],
                        { from: transactionSignerAddress },
                    ),
                    RevertReason.InvalidApprovalSignature,
                );
            });
            it(`Should revert: function=${fnName}, caller=tx_signer, senderAddress=[verifier], approval_sig=[approver1], expiration=[invalid]`, async () => {
                const orders = [defaultOrder];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                const transaction = transactionFactory.newSignedTransaction(data);
                const currentTimestamp = await getLatestBlockTimestampAsync();
                const approvalExpirationTimeSeconds = new BigNumber(currentTimestamp).minus(constants.TIME_BUFFER);
                const approval = approvalFactory1.newSignedApproval(
                    transaction,
                    transactionSignerAddress,
                    approvalExpirationTimeSeconds,
                );
                expectContractCallFailedAsync(
                    mixins.assertValidTransactionOrdersApproval.callAsync(
                        transaction,
                        orders,
                        transactionSignerAddress,
                        transaction.signature,
                        [approvalExpirationTimeSeconds],
                        [approval.signature],
                        { from: transactionSignerAddress },
                    ),
                    RevertReason.ApprovalExpired,
                );
                expectContractCallFailedAsync(
                    mixins.assertValidCoordinatorApprovals.callAsync(
                        transaction,
                        transactionSignerAddress,
                        transaction.signature,
                        [approvalExpirationTimeSeconds],
                        [approval.signature],
                        { from: transactionSignerAddress },
                    ),
                    RevertReason.ApprovalExpired,
                );
            });
            it(`Should revert: function=${fnName}, caller=approver2, senderAddress=[verifier], approval_sig=[approver1], expiration=[valid]`, async () => {
                const orders = [defaultOrder];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                const transaction = transactionFactory.newSignedTransaction(data);
                const currentTimestamp = await getLatestBlockTimestampAsync();
                const approvalExpirationTimeSeconds = new BigNumber(currentTimestamp).plus(constants.TIME_BUFFER);
                const approval = approvalFactory1.newSignedApproval(
                    transaction,
                    transactionSignerAddress,
                    approvalExpirationTimeSeconds,
                );
                expectContractCallFailedAsync(
                    mixins.assertValidTransactionOrdersApproval.callAsync(
                        transaction,
                        orders,
                        transactionSignerAddress,
                        transaction.signature,
                        [approvalExpirationTimeSeconds],
                        [approval.signature],
                        { from: approvalSignerAddress2 },
                    ),
                    RevertReason.InvalidOrigin,
                );
                expectContractCallFailedAsync(
                    mixins.assertValidCoordinatorApprovals.callAsync(
                        transaction,
                        transactionSignerAddress,
                        transaction.signature,
                        [approvalExpirationTimeSeconds],
                        [approval.signature],
                        { from: approvalSignerAddress2 },
                    ),
                    RevertReason.InvalidOrigin,
                );
            });
        }
    });
    describe('Batch order approvals', () => {
        for (const fnName of [
            ...constants.BATCH_FILL_FN_NAMES,
            ...constants.MARKET_FILL_FN_NAMES,
            constants.MATCH_ORDERS,
        ]) {
            it(`Should be successful: function=${fnName} caller=tx_signer, senderAddress=[verifier,verifier], feeRecipient=[approver1,approver1], approval_sig=[approver1], expiration=[valid]`, async () => {
                const orders = [defaultOrder, defaultOrder];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                const transaction = transactionFactory.newSignedTransaction(data);
                const currentTimestamp = await getLatestBlockTimestampAsync();
                const approvalExpirationTimeSeconds = new BigNumber(currentTimestamp).plus(constants.TIME_BUFFER);
                const approval = approvalFactory1.newSignedApproval(
                    transaction,
                    transactionSignerAddress,
                    approvalExpirationTimeSeconds,
                );
                await mixins.assertValidTransactionOrdersApproval.callAsync(
                    transaction,
                    orders,
                    transactionSignerAddress,
                    transaction.signature,
                    [approvalExpirationTimeSeconds],
                    [approval.signature],
                    { from: transactionSignerAddress },
                );
                await mixins.assertValidCoordinatorApprovals.callAsync(
                    transaction,
                    transactionSignerAddress,
                    transaction.signature,
                    [approvalExpirationTimeSeconds],
                    [approval.signature],
                    { from: transactionSignerAddress },
                );
            });
            it(`Should be successful: function=${fnName} caller=tx_signer, senderAddress=[null,null], feeRecipient=[approver1,approver1], approval_sig=[approver1], expiration=[valid]`, async () => {
                const orders = [defaultOrder, defaultOrder].map(order => ({
                    ...order,
                    senderAddress: devConstants.NULL_ADDRESS,
                }));
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                const transaction = transactionFactory.newSignedTransaction(data);
                const currentTimestamp = await getLatestBlockTimestampAsync();
                const approvalExpirationTimeSeconds = new BigNumber(currentTimestamp).plus(constants.TIME_BUFFER);
                const approval = approvalFactory1.newSignedApproval(
                    transaction,
                    transactionSignerAddress,
                    approvalExpirationTimeSeconds,
                );
                await mixins.assertValidTransactionOrdersApproval.callAsync(
                    transaction,
                    orders,
                    transactionSignerAddress,
                    transaction.signature,
                    [approvalExpirationTimeSeconds],
                    [approval.signature],
                    { from: transactionSignerAddress },
                );
                await mixins.assertValidCoordinatorApprovals.callAsync(
                    transaction,
                    transactionSignerAddress,
                    transaction.signature,
                    [approvalExpirationTimeSeconds],
                    [approval.signature],
                    { from: transactionSignerAddress },
                );
            });
            it(`Should be successful: function=${fnName} caller=tx_signer, senderAddress=[null,null], feeRecipient=[approver1,approver1], approval_sig=[], expiration=[]`, async () => {
                const orders = [defaultOrder, defaultOrder].map(order => ({
                    ...order,
                    senderAddress: devConstants.NULL_ADDRESS,
                }));
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                const transaction = transactionFactory.newSignedTransaction(data);
                await mixins.assertValidTransactionOrdersApproval.callAsync(
                    transaction,
                    orders,
                    transactionSignerAddress,
                    transaction.signature,
                    [],
                    [],
                    { from: transactionSignerAddress },
                );
                await mixins.assertValidCoordinatorApprovals.callAsync(
                    transaction,
                    transactionSignerAddress,
                    transaction.signature,
                    [],
                    [],
                    { from: transactionSignerAddress },
                );
            });
            it(`Should be successful: function=${fnName} caller=tx_signer, senderAddress=[verifier,null], feeRecipient=[approver1,approver1], approval_sig=[approver1], expiration=[valid]`, async () => {
                const orders = [defaultOrder, { ...defaultOrder, senderAddress: devConstants.NULL_ADDRESS }];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                const transaction = transactionFactory.newSignedTransaction(data);
                const currentTimestamp = await getLatestBlockTimestampAsync();
                const approvalExpirationTimeSeconds = new BigNumber(currentTimestamp).plus(constants.TIME_BUFFER);
                const approval = approvalFactory1.newSignedApproval(
                    transaction,
                    transactionSignerAddress,
                    approvalExpirationTimeSeconds,
                );
                await mixins.assertValidTransactionOrdersApproval.callAsync(
                    transaction,
                    orders,
                    transactionSignerAddress,
                    transaction.signature,
                    [approvalExpirationTimeSeconds],
                    [approval.signature],
                    { from: transactionSignerAddress },
                );
                await mixins.assertValidCoordinatorApprovals.callAsync(
                    transaction,
                    transactionSignerAddress,
                    transaction.signature,
                    [approvalExpirationTimeSeconds],
                    [approval.signature],
                    { from: transactionSignerAddress },
                );
            });
            it(`Should be successful: function=${fnName} caller=tx_signer, senderAddress=[verifier,verifier], feeRecipient=[approver1,approver2], approval_sig=[approver1,approver2], expiration=[valid,valid]`, async () => {
                const orders = [defaultOrder, { ...defaultOrder, feeRecipientAddress: approvalSignerAddress2 }];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                const transaction = transactionFactory.newSignedTransaction(data);
                const currentTimestamp = await getLatestBlockTimestampAsync();
                const approvalExpirationTimeSeconds = new BigNumber(currentTimestamp).plus(constants.TIME_BUFFER);
                const approval1 = approvalFactory1.newSignedApproval(
                    transaction,
                    transactionSignerAddress,
                    approvalExpirationTimeSeconds,
                );
                const approval2 = approvalFactory2.newSignedApproval(
                    transaction,
                    transactionSignerAddress,
                    approvalExpirationTimeSeconds,
                );
                await mixins.assertValidTransactionOrdersApproval.callAsync(
                    transaction,
                    orders,
                    transactionSignerAddress,
                    transaction.signature,
                    [approvalExpirationTimeSeconds, approvalExpirationTimeSeconds],
                    [approval1.signature, approval2.signature],
                    { from: transactionSignerAddress },
                );
                await mixins.assertValidCoordinatorApprovals.callAsync(
                    transaction,
                    transactionSignerAddress,
                    transaction.signature,
                    [approvalExpirationTimeSeconds, approvalExpirationTimeSeconds],
                    [approval1.signature, approval2.signature],
                    { from: transactionSignerAddress },
                );
            });
            it(`Should be successful: function=${fnName} caller=approver1, senderAddress=[verifier,verifier], feeRecipient=[approver1,approver1], approval_sig=[], expiration=[]`, async () => {
                const orders = [defaultOrder, defaultOrder];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                const transaction = transactionFactory.newSignedTransaction(data);
                await mixins.assertValidTransactionOrdersApproval.callAsync(
                    transaction,
                    orders,
                    approvalSignerAddress1,
                    transaction.signature,
                    [],
                    [],
                    { from: approvalSignerAddress1 },
                );
                await mixins.assertValidCoordinatorApprovals.callAsync(
                    transaction,
                    approvalSignerAddress1,
                    transaction.signature,
                    [],
                    [],
                    { from: approvalSignerAddress1 },
                );
            });
            it(`Should revert: function=${fnName} caller=approver1, senderAddress=[verifier,verifier], feeRecipient=[approver1,approver2], approval_sig=[approver2], expiration=[valid]`, async () => {
                const orders = [defaultOrder, { ...defaultOrder, feeRecipientAddress: approvalSignerAddress2 }];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                const transaction = transactionFactory.newSignedTransaction(data);
                const currentTimestamp = await getLatestBlockTimestampAsync();
                const approvalExpirationTimeSeconds = new BigNumber(currentTimestamp).plus(constants.TIME_BUFFER);
                const approval2 = approvalFactory2.newSignedApproval(
                    transaction,
                    transactionSignerAddress,
                    approvalExpirationTimeSeconds,
                );
                expectContractCallFailedAsync(
                    mixins.assertValidTransactionOrdersApproval.callAsync(
                        transaction,
                        orders,
                        transactionSignerAddress,
                        transaction.signature,
                        [approvalExpirationTimeSeconds],
                        [approval2.signature],
                        { from: approvalSignerAddress1 },
                    ),
                    RevertReason.InvalidOrigin,
                );
                expectContractCallFailedAsync(
                    mixins.assertValidCoordinatorApprovals.callAsync(
                        transaction,
                        transactionSignerAddress,
                        transaction.signature,
                        [approvalExpirationTimeSeconds],
                        [approval2.signature],
                        { from: approvalSignerAddress1 },
                    ),
                    RevertReason.InvalidOrigin,
                );
            });
            it(`Should revert: function=${fnName} caller=tx_signer, senderAddress=[verifier,verifier], feeRecipient=[approver1, approver1], approval_sig=[], expiration=[]`, async () => {
                const orders = [defaultOrder, defaultOrder];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                const transaction = transactionFactory.newSignedTransaction(data);
                expectContractCallFailedAsync(
                    mixins.assertValidTransactionOrdersApproval.callAsync(
                        transaction,
                        orders,
                        transactionSignerAddress,
                        transaction.signature,
                        [],
                        [],
                        { from: transactionSignerAddress },
                    ),
                    RevertReason.InvalidApprovalSignature,
                );
                expectContractCallFailedAsync(
                    mixins.assertValidCoordinatorApprovals.callAsync(
                        transaction,
                        transactionSignerAddress,
                        transaction.signature,
                        [],
                        [],
                        { from: transactionSignerAddress },
                    ),
                    RevertReason.InvalidApprovalSignature,
                );
            });
            it(`Should revert: function=${fnName} caller=tx_signer, senderAddress=[verifier,verifier], feeRecipient=[approver1, approver1], approval_sig=[invalid], expiration=[valid]`, async () => {
                const orders = [defaultOrder, defaultOrder];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                const transaction = transactionFactory.newSignedTransaction(data);
                const currentTimestamp = await getLatestBlockTimestampAsync();
                const approvalExpirationTimeSeconds = new BigNumber(currentTimestamp).plus(constants.TIME_BUFFER);
                const approval = approvalFactory1.newSignedApproval(
                    transaction,
                    transactionSignerAddress,
                    approvalExpirationTimeSeconds,
                );
                const signature = `${approval.signature.slice(0, 4)}FFFFFFFF${approval.signature.slice(12)}`;
                expectContractCallFailedAsync(
                    mixins.assertValidTransactionOrdersApproval.callAsync(
                        transaction,
                        orders,
                        transactionSignerAddress,
                        transaction.signature,
                        [approvalExpirationTimeSeconds],
                        [signature],
                        { from: transactionSignerAddress },
                    ),
                    RevertReason.InvalidApprovalSignature,
                );
                expectContractCallFailedAsync(
                    mixins.assertValidCoordinatorApprovals.callAsync(
                        transaction,
                        transactionSignerAddress,
                        transaction.signature,
                        [approvalExpirationTimeSeconds],
                        [signature],
                        { from: transactionSignerAddress },
                    ),
                    RevertReason.InvalidApprovalSignature,
                );
            });
            it(`Should revert: function=${fnName} caller=tx_signer, senderAddress=[verifier,verifier], feeRecipient=[approver1, approver2], approval_sig=[valid,invalid], expiration=[valid,valid]`, async () => {
                const orders = [defaultOrder, { ...defaultOrder, feeRecipientAddress: approvalSignerAddress2 }];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                const transaction = transactionFactory.newSignedTransaction(data);
                const currentTimestamp = await getLatestBlockTimestampAsync();
                const approvalExpirationTimeSeconds = new BigNumber(currentTimestamp).plus(constants.TIME_BUFFER);
                const approval1 = approvalFactory1.newSignedApproval(
                    transaction,
                    transactionSignerAddress,
                    approvalExpirationTimeSeconds,
                );
                const approval2 = approvalFactory2.newSignedApproval(
                    transaction,
                    transactionSignerAddress,
                    approvalExpirationTimeSeconds,
                );
                const approvalSignature2 = `${approval2.signature.slice(0, 4)}FFFFFFFF${approval2.signature.slice(12)}`;
                expectContractCallFailedAsync(
                    mixins.assertValidTransactionOrdersApproval.callAsync(
                        transaction,
                        orders,
                        transactionSignerAddress,
                        transaction.signature,
                        [approvalExpirationTimeSeconds, approvalExpirationTimeSeconds],
                        [approval1.signature, approvalSignature2],
                        { from: transactionSignerAddress },
                    ),
                    RevertReason.InvalidApprovalSignature,
                );
                expectContractCallFailedAsync(
                    mixins.assertValidCoordinatorApprovals.callAsync(
                        transaction,
                        transactionSignerAddress,
                        transaction.signature,
                        [approvalExpirationTimeSeconds, approvalExpirationTimeSeconds],
                        [approval1.signature, approvalSignature2],
                        { from: transactionSignerAddress },
                    ),
                    RevertReason.InvalidApprovalSignature,
                );
            });
            it(`Should revert: function=${fnName} caller=approver1, senderAddress=[verifier,verifier], feeRecipient=[approver1, approver2], approval_sig=[invalid], expiration=[valid]`, async () => {
                const orders = [defaultOrder, { ...defaultOrder, feeRecipientAddress: approvalSignerAddress2 }];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                const transaction = transactionFactory.newSignedTransaction(data);
                const currentTimestamp = await getLatestBlockTimestampAsync();
                const approvalExpirationTimeSeconds = new BigNumber(currentTimestamp).plus(constants.TIME_BUFFER);
                const approval2 = approvalFactory2.newSignedApproval(
                    transaction,
                    transactionSignerAddress,
                    approvalExpirationTimeSeconds,
                );
                const approvalSignature2 = `${approval2.signature.slice(0, 4)}FFFFFFFF${approval2.signature.slice(12)}`;
                expectContractCallFailedAsync(
                    mixins.assertValidTransactionOrdersApproval.callAsync(
                        transaction,
                        orders,
                        approvalSignerAddress1,
                        transaction.signature,
                        [approvalExpirationTimeSeconds],
                        [approvalSignature2],
                        { from: approvalSignerAddress1 },
                    ),
                    RevertReason.InvalidApprovalSignature,
                );
                expectContractCallFailedAsync(
                    mixins.assertValidCoordinatorApprovals.callAsync(
                        transaction,
                        approvalSignerAddress1,
                        transaction.signature,
                        [approvalExpirationTimeSeconds],
                        [approvalSignature2],
                        { from: approvalSignerAddress1 },
                    ),
                    RevertReason.InvalidApprovalSignature,
                );
            });
            it(`Should revert: function=${fnName} caller=tx_signer, senderAddress=[verifier,verifier], feeRecipient=[approver1, approver2], approval_sig=[valid,valid], expiration=[valid,invalid]`, async () => {
                const orders = [defaultOrder, { ...defaultOrder, feeRecipientAddress: approvalSignerAddress2 }];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                const transaction = transactionFactory.newSignedTransaction(data);
                const currentTimestamp = await getLatestBlockTimestampAsync();
                const approvalExpirationTimeSeconds1 = new BigNumber(currentTimestamp).plus(constants.TIME_BUFFER);
                const approvalExpirationTimeSeconds2 = new BigNumber(currentTimestamp).minus(constants.TIME_BUFFER);
                const approval1 = approvalFactory1.newSignedApproval(
                    transaction,
                    transactionSignerAddress,
                    approvalExpirationTimeSeconds1,
                );
                const approval2 = approvalFactory2.newSignedApproval(
                    transaction,
                    transactionSignerAddress,
                    approvalExpirationTimeSeconds2,
                );
                expectContractCallFailedAsync(
                    mixins.assertValidTransactionOrdersApproval.callAsync(
                        transaction,
                        orders,
                        transactionSignerAddress,
                        transaction.signature,
                        [approvalExpirationTimeSeconds1, approvalExpirationTimeSeconds2],
                        [approval1.signature, approval2.signature],
                        { from: transactionSignerAddress },
                    ),
                    RevertReason.ApprovalExpired,
                );
                expectContractCallFailedAsync(
                    mixins.assertValidCoordinatorApprovals.callAsync(
                        transaction,
                        transactionSignerAddress,
                        transaction.signature,
                        [approvalExpirationTimeSeconds1, approvalExpirationTimeSeconds2],
                        [approval1.signature, approval2.signature],
                        { from: transactionSignerAddress },
                    ),
                    RevertReason.ApprovalExpired,
                );
            });
            it(`Should revert: function=${fnName} caller=approver1, senderAddress=[verifier,verifier], feeRecipient=[approver1, approver2], approval_sig=[valid], expiration=[invalid]`, async () => {
                const orders = [defaultOrder, { ...defaultOrder, feeRecipientAddress: approvalSignerAddress2 }];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                const transaction = transactionFactory.newSignedTransaction(data);
                const currentTimestamp = await getLatestBlockTimestampAsync();
                const approvalExpirationTimeSeconds = new BigNumber(currentTimestamp).minus(constants.TIME_BUFFER);
                const approval2 = approvalFactory2.newSignedApproval(
                    transaction,
                    transactionSignerAddress,
                    approvalExpirationTimeSeconds,
                );
                expectContractCallFailedAsync(
                    mixins.assertValidTransactionOrdersApproval.callAsync(
                        transaction,
                        orders,
                        approvalSignerAddress1,
                        transaction.signature,
                        [approvalExpirationTimeSeconds],
                        [approval2.signature],
                        { from: approvalSignerAddress1 },
                    ),
                    RevertReason.ApprovalExpired,
                );
                expectContractCallFailedAsync(
                    mixins.assertValidCoordinatorApprovals.callAsync(
                        transaction,
                        approvalSignerAddress1,
                        transaction.signature,
                        [approvalExpirationTimeSeconds],
                        [approval2.signature],
                        { from: approvalSignerAddress1 },
                    ),
                    RevertReason.ApprovalExpired,
                );
            });
            it(`Should revert: function=${fnName} caller=approver2, senderAddress=[verifier,verifier], feeRecipient=[approver1, approver1], approval_sig=[valid], expiration=[valid]`, async () => {
                const orders = [defaultOrder, defaultOrder];
                const data = exchangeDataEncoder.encodeOrdersToExchangeData(fnName, orders);
                const transaction = transactionFactory.newSignedTransaction(data);
                const currentTimestamp = await getLatestBlockTimestampAsync();
                const approvalExpirationTimeSeconds = new BigNumber(currentTimestamp).plus(constants.TIME_BUFFER);
                const approval1 = approvalFactory1.newSignedApproval(
                    transaction,
                    transactionSignerAddress,
                    approvalExpirationTimeSeconds,
                );
                expectContractCallFailedAsync(
                    mixins.assertValidTransactionOrdersApproval.callAsync(
                        transaction,
                        orders,
                        transactionSignerAddress,
                        transaction.signature,
                        [approvalExpirationTimeSeconds],
                        [approval1.signature],
                        { from: approvalSignerAddress2 },
                    ),
                    RevertReason.InvalidOrigin,
                );
                expectContractCallFailedAsync(
                    mixins.assertValidCoordinatorApprovals.callAsync(
                        transaction,
                        transactionSignerAddress,
                        transaction.signature,
                        [approvalExpirationTimeSeconds],
                        [approval1.signature],
                        { from: approvalSignerAddress2 },
                    ),
                    RevertReason.InvalidOrigin,
                );
            });
        }
    });
    describe('cancels', () => {
        it('should allow the tx signer to call `cancelOrders` without approval', async () => {
            const orders = [defaultOrder];
            const data = exchangeDataEncoder.encodeOrdersToExchangeData(constants.CANCEL_ORDERS, orders);
            const transaction = transactionFactory.newSignedTransaction(data);
            await mixins.assertValidCoordinatorApprovals.callAsync(
                transaction,
                transactionSignerAddress,
                transaction.signature,
                [],
                [],
                { from: transactionSignerAddress },
            );
        });
        it('should allow the tx signer to call `batchCancelOrders` without approval', async () => {
            const orders = [defaultOrder, defaultOrder];
            const data = exchangeDataEncoder.encodeOrdersToExchangeData(constants.BATCH_CANCEL_ORDERS, orders);
            const transaction = transactionFactory.newSignedTransaction(data);
            await mixins.assertValidCoordinatorApprovals.callAsync(
                transaction,
                transactionSignerAddress,
                transaction.signature,
                [],
                [],
                { from: transactionSignerAddress },
            );
        });
        it('should allow the tx signer to call `cancelOrdersUpTo` without approval', async () => {
            const orders: SignedOrder[] = [];
            const data = exchangeDataEncoder.encodeOrdersToExchangeData(constants.CANCEL_ORDERS_UP_TO, orders);
            const transaction = transactionFactory.newSignedTransaction(data);
            await mixins.assertValidCoordinatorApprovals.callAsync(
                transaction,
                transactionSignerAddress,
                transaction.signature,
                [],
                [],
                { from: transactionSignerAddress },
            );
        });
    });
});
// tslint:disable:max-file-line-count
