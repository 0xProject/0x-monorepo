import { artifacts as exchangeArtifacts, IExchangeContract } from '@0x/contracts-exchange';
import {
    chaiSetup,
    constants as devConstants,
    expectContractCallFailedAsync,
    getLatestBlockTimestampAsync,
    provider,
    txDefaults,
    web3Wrapper,
} from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { RevertReason, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import * as ethUtil from 'ethereumjs-util';

import {
    ApprovalFactory,
    artifacts,
    constants,
    hashUtils,
    TECSignatureType,
    TECTransactionFactory,
    TestMixinsContract,
} from '../src';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
const timeBuffer = new BigNumber(1000);

const encodeBatchOrderApproval = (fn: string, orders: SignedOrder[], exchangeInstance: IExchangeContract): string => {
    let data;
    if (constants.BATCH_FILL_FN_NAMES.indexOf(fn) !== -1) {
        data = (exchangeInstance as any)[fn].getABIEncodedTransactionData(
            orders,
            orders.map(order => order.takerAssetAmount),
            orders.map(order => order.signature),
        );
    } else if (constants.MARKET_FILL_FN_NAMES.indexOf(fn) !== -1) {
        data = (exchangeInstance as any)[fn].getABIEncodedTransactionData(
            orders,
            orders[0].takerAssetAmount,
            orders.map(order => order.signature),
        );
    } else if (fn === 'matchOrders') {
        data = (exchangeInstance as any)[fn].getABIEncodedTransactionData(
            orders[0],
            orders[1],
            orders[0].signature,
            orders[1].signature,
        );
    } else {
        throw new Error(`Error: ${fn} not a batch fill function`);
    }
    return data;
};

describe.only('Mixins tests', () => {
    let transactionSignerAddress: string;
    let approvalSignerAddress1: string;
    let approvalSignerAddress2: string;
    let mixins: TestMixinsContract;
    let transactionFactory: TECTransactionFactory;
    let approvalFactory1: ApprovalFactory;
    let approvalFactory2: ApprovalFactory;
    let defaultOrder: SignedOrder;
    let exchangeInterface: IExchangeContract;
    before(async () => {
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    before(async () => {
        mixins = await TestMixinsContract.deployFrom0xArtifactAsync(artifacts.TestMixins, provider, txDefaults);
        exchangeInterface = await IExchangeContract.deployFrom0xArtifactAsync(
            exchangeArtifacts.IExchange,
            provider,
            txDefaults,
        );
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        [transactionSignerAddress, approvalSignerAddress1, approvalSignerAddress2] = accounts.slice(0, 2);
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
        const transactionSignerPrivateKey = devConstants.TESTRPC_PRIVATE_KEYS[0];
        const approvalSignerPrivateKey1 = devConstants.TESTRPC_PRIVATE_KEYS[1];
        const approvalSignerPrivateKey2 = devConstants.TESTRPC_PRIVATE_KEYS[2];
        transactionFactory = new TECTransactionFactory(transactionSignerPrivateKey, mixins.address);
        approvalFactory1 = new ApprovalFactory(approvalSignerPrivateKey1);
        approvalFactory2 = new ApprovalFactory(approvalSignerPrivateKey2);
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
            const transaction = transactionFactory.newSignedTECTransaction(data, TECSignatureType.EthSign);
            const transactionHash = hashUtils.getTransactionHashHex(transaction);
            const signerAddress = await mixins.getSignerAddress.callAsync(transactionHash, transaction.signature);
            expect(transaction.signerAddress).to.eq(signerAddress);
        });
        it('should return the correct address using the EIP712 signature type', async () => {
            const data = devConstants.NULL_BYTES;
            const transaction = transactionFactory.newSignedTECTransaction(data, TECSignatureType.EIP712);
            const transactionHash = hashUtils.getTransactionHashHex(transaction);
            const signerAddress = await mixins.getSignerAddress.callAsync(transactionHash, transaction.signature);
            expect(transaction.signerAddress).to.eq(signerAddress);
        });
        it('should revert with with the Illegal signature type', async () => {
            const data = devConstants.NULL_BYTES;
            const transaction = transactionFactory.newSignedTECTransaction(data);
            const illegalSignatureByte = ethUtil.toBuffer(TECSignatureType.Illegal).toString('hex');
            transaction.signature = `${transaction.signature.slice(
                0,
                transaction.signature.length - 2,
            )}${illegalSignatureByte}`;
            const transactionHash = hashUtils.getTransactionHashHex(transaction);
            expectContractCallFailedAsync(
                mixins.getSignerAddress.callAsync(transactionHash, transaction.signature),
                RevertReason.SignatureIllegal,
            );
        });
        it("should revert with with a signature type that doesn't exist", async () => {
            const data = devConstants.NULL_BYTES;
            const transaction = transactionFactory.newSignedTECTransaction(data);
            const invalidSignatureByte = '03';
            transaction.signature = `${transaction.signature.slice(
                0,
                transaction.signature.length - 2,
            )}${invalidSignatureByte}`;
            const transactionHash = hashUtils.getTransactionHashHex(transaction);
            expectContractCallFailedAsync(
                mixins.getSignerAddress.callAsync(transactionHash, transaction.signature),
                RevertReason.SignatureUnsupported,
            );
        });
    });

    describe('Single order approvals', () => {
        for (const fn of constants.SINGLE_FILL_FN_NAMES) {
            it(`Should be successful: function=${fn}, caller=tx_signer, senderAddress=verifier, approval_sig=approver1, expiration=valid`, async () => {
                const data = (exchangeInterface as any)[fn].getABIEncodedTransactionData(
                    defaultOrder,
                    defaultOrder.takerAssetAmount,
                    defaultOrder.signature,
                );
                const transaction = transactionFactory.newSignedTECTransaction(data);
                const transactionHash = hashUtils.getTransactionHashHex(transaction);
                const currentTimestamp = await getLatestBlockTimestampAsync();
                const approvalExpirationTimeSeconds = new BigNumber(currentTimestamp).plus(timeBuffer);
                const approval = approvalFactory1.newSignedApproval(transaction, approvalExpirationTimeSeconds);
                await mixins.assertValidSingleOrderApproval.callAsync(
                    defaultOrder,
                    transactionHash,
                    transaction.signature,
                    approvalExpirationTimeSeconds,
                    approval.approvalSignature,
                    { from: transactionSignerAddress },
                );
                await mixins.assertValidTECApprovals.callAsync(
                    transaction,
                    transaction.signature,
                    [approvalExpirationTimeSeconds],
                    [approval.approvalSignature],
                    { from: transactionSignerAddress },
                );
            });
            it(`Should be successful: function=${fn}, caller=tx_signer, senderAddress=null, approval_sig=approver1, expiration=valid`, async () => {
                const order = {
                    ...defaultOrder,
                    senderAddress: devConstants.NULL_ADDRESS,
                };
                const data = (exchangeInterface as any)[fn].getABIEncodedTransactionData(
                    order,
                    order.takerAssetAmount,
                    order.signature,
                );
                const transaction = transactionFactory.newSignedTECTransaction(data);
                const transactionHash = hashUtils.getTransactionHashHex(transaction);
                const currentTimestamp = await getLatestBlockTimestampAsync();
                const approvalExpirationTimeSeconds = new BigNumber(currentTimestamp).plus(timeBuffer);
                const approval = approvalFactory1.newSignedApproval(transaction, approvalExpirationTimeSeconds);
                await mixins.assertValidSingleOrderApproval.callAsync(
                    order,
                    transactionHash,
                    transaction.signature,
                    approvalExpirationTimeSeconds,
                    approval.approvalSignature,
                    { from: transactionSignerAddress },
                );
                await mixins.assertValidTECApprovals.callAsync(
                    transaction,
                    transaction.signature,
                    [approvalExpirationTimeSeconds],
                    [approval.approvalSignature],
                    { from: transactionSignerAddress },
                );
            });
            it(`Should be successful: function=${fn}, caller=approver1, senderAddress=verifier, approval_sig=null, expiration=valid`, async () => {
                const data = (exchangeInterface as any)[fn].getABIEncodedTransactionData(
                    defaultOrder,
                    defaultOrder.takerAssetAmount,
                    defaultOrder.signature,
                );
                const transaction = transactionFactory.newSignedTECTransaction(data);
                const transactionHash = hashUtils.getTransactionHashHex(transaction);
                const currentTimestamp = await getLatestBlockTimestampAsync();
                const approvalExpirationTimeSeconds = new BigNumber(currentTimestamp).plus(timeBuffer);
                const approvalSignature = devConstants.NULL_BYTES;
                await mixins.assertValidSingleOrderApproval.callAsync(
                    defaultOrder,
                    transactionHash,
                    transaction.signature,
                    approvalExpirationTimeSeconds,
                    approvalSignature,
                    { from: approvalSignerAddress1 },
                );
                await mixins.assertValidTECApprovals.callAsync(
                    transaction,
                    transaction.signature,
                    [approvalExpirationTimeSeconds],
                    [approvalSignature],
                    { from: approvalSignerAddress1 },
                );
            });
            it(`Should be successful: function=${fn}, caller=approver1, senderAddress=verifier, approval_sig=approver1, expiration=invalid`, async () => {
                const data = (exchangeInterface as any)[fn].getABIEncodedTransactionData(
                    defaultOrder,
                    defaultOrder.takerAssetAmount,
                    defaultOrder.signature,
                );
                const transaction = transactionFactory.newSignedTECTransaction(data);
                const transactionHash = hashUtils.getTransactionHashHex(transaction);
                const currentTimestamp = await getLatestBlockTimestampAsync();
                const approvalExpirationTimeSeconds = new BigNumber(currentTimestamp).plus(timeBuffer);
                const approval = approvalFactory1.newSignedApproval(transaction, approvalExpirationTimeSeconds);
                await mixins.assertValidSingleOrderApproval.callAsync(
                    defaultOrder,
                    transactionHash,
                    transaction.signature,
                    approvalExpirationTimeSeconds,
                    approval.approvalSignature,
                    { from: approvalSignerAddress1 },
                );
                await mixins.assertValidTECApprovals.callAsync(
                    transaction,
                    transaction.signature,
                    [approvalExpirationTimeSeconds],
                    [approval.approvalSignature],
                    { from: approvalSignerAddress1 },
                );
            });
            it(`Should be successful: function=${fn}, caller=approver1, senderAddress=verifier, approval_sig=null, expiration=null`, async () => {
                const data = (exchangeInterface as any)[fn].getABIEncodedTransactionData(
                    defaultOrder,
                    defaultOrder.takerAssetAmount,
                    defaultOrder.signature,
                );
                const transaction = transactionFactory.newSignedTECTransaction(data);
                const transactionHash = hashUtils.getTransactionHashHex(transaction);
                await mixins.assertValidSingleOrderApproval.callAsync(
                    defaultOrder,
                    transactionHash,
                    transaction.signature,
                    devConstants.ZERO_AMOUNT,
                    devConstants.NULL_BYTES,
                    { from: approvalSignerAddress1 },
                );
                await mixins.assertValidTECApprovals.callAsync(transaction, transaction.signature, [], [], {
                    from: approvalSignerAddress1,
                });
            });
            it(`Should revert: function=${fn}, caller=tx_signer, senderAddress=verifier, approval_sig=invalid, expiration=valid`, async () => {
                const data = (exchangeInterface as any)[fn].getABIEncodedTransactionData(
                    defaultOrder,
                    defaultOrder.takerAssetAmount,
                    defaultOrder.signature,
                );
                const transaction = transactionFactory.newSignedTECTransaction(data);
                const transactionHash = hashUtils.getTransactionHashHex(transaction);
                const currentTimestamp = await getLatestBlockTimestampAsync();
                const approvalExpirationTimeSeconds = new BigNumber(currentTimestamp).plus(timeBuffer);
                const approval = approvalFactory1.newSignedApproval(transaction, approvalExpirationTimeSeconds);
                const approvalSignature = `${approval.approvalSignature.slice(
                    0,
                    4,
                )}FFFFFFFF${approval.approvalSignature.slice(12)}`;
                expectContractCallFailedAsync(
                    mixins.assertValidSingleOrderApproval.callAsync(
                        defaultOrder,
                        transactionHash,
                        transaction.signature,
                        approvalExpirationTimeSeconds,
                        approvalSignature,
                        { from: transactionSignerAddress },
                    ),
                    RevertReason.InvalidApprovalSignature,
                );
                expectContractCallFailedAsync(
                    mixins.assertValidTECApprovals.callAsync(
                        transaction,
                        transaction.signature,
                        [approvalExpirationTimeSeconds],
                        [approvalSignature],
                        { from: transactionSignerAddress },
                    ),
                    RevertReason.InvalidApprovalSignature,
                );
            });
            it(`Should revert: function=${fn}, caller=tx_signer, senderAddress=verifier, approval_sig=approver1, expiration=invalid`, async () => {
                const data = (exchangeInterface as any)[fn].getABIEncodedTransactionData(
                    defaultOrder,
                    defaultOrder.takerAssetAmount,
                    defaultOrder.signature,
                );
                const transaction = transactionFactory.newSignedTECTransaction(data);
                const transactionHash = hashUtils.getTransactionHashHex(transaction);
                const currentTimestamp = await getLatestBlockTimestampAsync();
                const approvalExpirationTimeSeconds = new BigNumber(currentTimestamp).minus(timeBuffer);
                const approval = approvalFactory1.newSignedApproval(transaction, approvalExpirationTimeSeconds);
                expectContractCallFailedAsync(
                    mixins.assertValidSingleOrderApproval.callAsync(
                        defaultOrder,
                        transactionHash,
                        transaction.signature,
                        approvalExpirationTimeSeconds,
                        approval.approvalSignature,
                        { from: transactionSignerAddress },
                    ),
                    RevertReason.ApprovalExpired,
                );
                expectContractCallFailedAsync(
                    mixins.assertValidTECApprovals.callAsync(
                        transaction,
                        transaction.signature,
                        [approvalExpirationTimeSeconds],
                        [approval.approvalSignature],
                        { from: transactionSignerAddress },
                    ),
                    RevertReason.ApprovalExpired,
                );
            });
        }
    });
    describe('Batch order approvals', () => {
        for (const fn of [...constants.BATCH_FILL_FN_NAMES, ...constants.MARKET_FILL_FN_NAMES, 'matchOrders']) {
            it(`Should be successful: function=${fn} caller=tx_signer, senderAddress=[verifier,verifier], feeRecipient=[approver1,approver1], approval_sig=[approver1], expiration=[valid]`, async () => {
                const orders = [defaultOrder, defaultOrder];
                const data = encodeBatchOrderApproval(fn, orders, exchangeInterface);
                const transaction = transactionFactory.newSignedTECTransaction(data);
                const transactionHash = hashUtils.getTransactionHashHex(transaction);
                const currentTimestamp = await getLatestBlockTimestampAsync();
                const approvalExpirationTimeSeconds = new BigNumber(currentTimestamp).plus(timeBuffer);
                const approval = approvalFactory1.newSignedApproval(transaction, approvalExpirationTimeSeconds);
                await mixins.assertValidBatchOrderApproval.callAsync(
                    orders,
                    transactionHash,
                    transaction.signature,
                    [approvalExpirationTimeSeconds],
                    [approval.approvalSignature],
                    { from: transactionSignerAddress },
                );
                await mixins.assertValidTECApprovals.callAsync(
                    transaction,
                    transaction.signature,
                    [approvalExpirationTimeSeconds],
                    [approval.approvalSignature],
                    { from: transactionSignerAddress },
                );
            });
            it(`Should be successful: function=${fn} caller=tx_signer, senderAddress=[null,null], feeRecipient=[approver1,approver1], approval_sig=[approver1], expiration=[valid]`, async () => {
                const orders = [defaultOrder, defaultOrder].map(order => ({
                    ...order,
                    senderAddress: devConstants.NULL_ADDRESS,
                }));
                const data = encodeBatchOrderApproval(fn, orders, exchangeInterface);
                const transaction = transactionFactory.newSignedTECTransaction(data);
                const transactionHash = hashUtils.getTransactionHashHex(transaction);
                const currentTimestamp = await getLatestBlockTimestampAsync();
                const approvalExpirationTimeSeconds = new BigNumber(currentTimestamp).plus(timeBuffer);
                const approval = approvalFactory1.newSignedApproval(transaction, approvalExpirationTimeSeconds);
                await mixins.assertValidBatchOrderApproval.callAsync(
                    orders,
                    transactionHash,
                    transaction.signature,
                    [approvalExpirationTimeSeconds],
                    [approval.approvalSignature],
                    { from: transactionSignerAddress },
                );
                await mixins.assertValidTECApprovals.callAsync(
                    transaction,
                    transaction.signature,
                    [approvalExpirationTimeSeconds],
                    [approval.approvalSignature],
                    { from: transactionSignerAddress },
                );
            });
            it(`Should be successful: function=${fn} caller=tx_signer, senderAddress=[null,null], feeRecipient=[approver1,approver1], approval_sig=[], expiration=[]`, async () => {
                const orders = [defaultOrder, defaultOrder].map(order => ({
                    ...order,
                    senderAddress: devConstants.NULL_ADDRESS,
                }));
                const data = encodeBatchOrderApproval(fn, orders, exchangeInterface);
                const transaction = transactionFactory.newSignedTECTransaction(data);
                const transactionHash = hashUtils.getTransactionHashHex(transaction);
                await mixins.assertValidBatchOrderApproval.callAsync(
                    orders,
                    transactionHash,
                    transaction.signature,
                    [],
                    [],
                    { from: transactionSignerAddress },
                );
                await mixins.assertValidTECApprovals.callAsync(transaction, transaction.signature, [], [], {
                    from: transactionSignerAddress,
                });
            });
            it(`Should be successful: function=${fn} caller=tx_signer, senderAddress=[verifier,null], feeRecipient=[approver1,approver1], approval_sig=[approver1], expiration=[valid]`, async () => {
                const orders = [defaultOrder, { ...defaultOrder, senderAddress: devConstants.NULL_ADDRESS }];
                const data = encodeBatchOrderApproval(fn, orders, exchangeInterface);
                const transaction = transactionFactory.newSignedTECTransaction(data);
                const transactionHash = hashUtils.getTransactionHashHex(transaction);
                const currentTimestamp = await getLatestBlockTimestampAsync();
                const approvalExpirationTimeSeconds = new BigNumber(currentTimestamp).plus(timeBuffer);
                const approval = approvalFactory1.newSignedApproval(transaction, approvalExpirationTimeSeconds);
                await mixins.assertValidBatchOrderApproval.callAsync(
                    orders,
                    transactionHash,
                    transaction.signature,
                    [approvalExpirationTimeSeconds],
                    [approval.approvalSignature],
                    { from: transactionSignerAddress },
                );
                await mixins.assertValidTECApprovals.callAsync(
                    transaction,
                    transaction.signature,
                    [approvalExpirationTimeSeconds],
                    [approval.approvalSignature],
                    { from: transactionSignerAddress },
                );
            });
            it(`Should be successful: function=${fn} caller=tx_signer, senderAddress=[verifier,verifier], feeRecipient=[approver1,approver2], approval_sig=[approver1,approver2], expiration=[valid,valid]`, async () => {
                const orders = [defaultOrder, { ...defaultOrder, feeRecipientAddress: approvalSignerAddress2 }];
                const data = encodeBatchOrderApproval(fn, orders, exchangeInterface);
                const transaction = transactionFactory.newSignedTECTransaction(data);
                const transactionHash = hashUtils.getTransactionHashHex(transaction);
                const currentTimestamp = await getLatestBlockTimestampAsync();
                const approvalExpirationTimeSeconds = new BigNumber(currentTimestamp).plus(timeBuffer);
                const approval1 = approvalFactory1.newSignedApproval(transaction, approvalExpirationTimeSeconds);
                const approval2 = approvalFactory2.newSignedApproval(transaction, approvalExpirationTimeSeconds);
                await mixins.assertValidBatchOrderApproval.callAsync(
                    orders,
                    transactionHash,
                    transaction.signature,
                    [approvalExpirationTimeSeconds, approvalExpirationTimeSeconds],
                    [approval1.approvalSignature, approval2.approvalSignature],
                    { from: transactionSignerAddress },
                );
                await mixins.assertValidTECApprovals.callAsync(
                    transaction,
                    transaction.signature,
                    [approvalExpirationTimeSeconds, approvalExpirationTimeSeconds],
                    [approval1.approvalSignature, approval2.approvalSignature],
                    { from: transactionSignerAddress },
                );
            });
            it(`Should be successful: function=${fn} caller=approver1, senderAddress=[verifier,verifier], feeRecipient=[approver1,approver1], approval_sig=[], expiration=[]`, async () => {
                const orders = [defaultOrder, defaultOrder];
                const data = encodeBatchOrderApproval(fn, orders, exchangeInterface);
                const transaction = transactionFactory.newSignedTECTransaction(data);
                const transactionHash = hashUtils.getTransactionHashHex(transaction);
                await mixins.assertValidBatchOrderApproval.callAsync(
                    orders,
                    transactionHash,
                    transaction.signature,
                    [],
                    [],
                    { from: approvalSignerAddress1 },
                );
                await mixins.assertValidTECApprovals.callAsync(transaction, transaction.signature, [], [], {
                    from: approvalSignerAddress1,
                });
            });
            it(`Should be successful: function=${fn} caller=approver1, senderAddress=[verifier,verifier], feeRecipient=[approver1,approver2], approval_sig=[approver2], expiration=[valid]`, async () => {
                const orders = [defaultOrder, { ...defaultOrder, feeRecipientAddress: approvalSignerAddress2 }];
                const data = encodeBatchOrderApproval(fn, orders, exchangeInterface);
                const transaction = transactionFactory.newSignedTECTransaction(data);
                const transactionHash = hashUtils.getTransactionHashHex(transaction);
                const currentTimestamp = await getLatestBlockTimestampAsync();
                const approvalExpirationTimeSeconds = new BigNumber(currentTimestamp).plus(timeBuffer);
                const approval2 = approvalFactory2.newSignedApproval(transaction, approvalExpirationTimeSeconds);
                await mixins.assertValidBatchOrderApproval.callAsync(
                    orders,
                    transactionHash,
                    transaction.signature,
                    [approvalExpirationTimeSeconds],
                    [approval2.approvalSignature],
                    { from: approvalSignerAddress1 },
                );
                await mixins.assertValidTECApprovals.callAsync(
                    transaction,
                    transaction.signature,
                    [approvalExpirationTimeSeconds],
                    [approval2.approvalSignature],
                    { from: approvalSignerAddress1 },
                );
            });
        }
    });
    describe('assertValidTECApprovals', () => {});
});
