import { BlockchainLifecycle } from '@0xproject/dev-utils';
import { FillScenarios } from '@0xproject/fill-scenarios';
import { getContractAddresses } from '@0xproject/migrations';
import { assetDataUtils, generatePseudoRandomSalt, orderHashUtils, signatureUtils } from '@0xproject/order-utils';
import { SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import 'mocha';

import { ContractWrappers } from '../src';
import { TransactionEncoder } from '../src/utils/transaction_encoder';

import { constants } from './utils/constants';
import { tokenUtils } from './utils/token_utils';
import { provider, web3Wrapper } from './utils/web3_wrapper';

const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('TransactionEncoder', () => {
    let contractWrappers: ContractWrappers;
    let userAddresses: string[];
    let fillScenarios: FillScenarios;
    let exchangeContractAddress: string;
    let makerTokenAddress: string;
    let takerTokenAddress: string;
    let coinbase: string;
    let makerAddress: string;
    let senderAddress: string;
    let takerAddress: string;
    let makerAssetData: string;
    let takerAssetData: string;
    let txHash: string;
    const fillableAmount = new BigNumber(5);
    const takerTokenFillAmount = new BigNumber(5);
    let signedOrder: SignedOrder;

    before(async () => {
        await blockchainLifecycle.startAsync();
        const config = {
            networkId: constants.TESTRPC_NETWORK_ID,
            contractAddresses: getContractAddresses(),
            blockPollingIntervalMs: 10,
        };
        contractWrappers = new ContractWrappers(provider, config);
        exchangeContractAddress = contractWrappers.exchange.address;
        userAddresses = await web3Wrapper.getAvailableAddressesAsync();
        const zrxTokenAddress = contractWrappers.exchange.zrxTokenAddress;
        fillScenarios = new FillScenarios(
            provider,
            userAddresses,
            zrxTokenAddress,
            exchangeContractAddress,
            contractWrappers.erc20Proxy.address,
            contractWrappers.erc721Proxy.address,
        );
        [coinbase, makerAddress, takerAddress, senderAddress] = userAddresses;
        [makerTokenAddress, takerTokenAddress] = tokenUtils.getDummyERC20TokenAddresses();
        [makerAssetData, takerAssetData] = [
            assetDataUtils.encodeERC20AssetData(makerTokenAddress),
            assetDataUtils.encodeERC20AssetData(takerTokenAddress),
        ];
        signedOrder = await fillScenarios.createFillableSignedOrderAsync(
            makerAssetData,
            takerAssetData,
            makerAddress,
            takerAddress,
            fillableAmount,
        );
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('encode and executeTransaction', () => {
        const executeTransactionOrThrowAsync = async (
            encoder: TransactionEncoder,
            data: string,
            signerAddress: string = takerAddress,
        ): Promise<void> => {
            const salt = generatePseudoRandomSalt();
            const encodedTransaction = encoder.getTransactionHex(data, salt, signerAddress);
            const signature = await signatureUtils.ecSignHashAsync(provider, encodedTransaction, signerAddress);
            txHash = await contractWrappers.exchange.executeTransactionAsync(
                salt,
                signerAddress,
                data,
                signature,
                senderAddress,
            );
            await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
        };
        describe('#fillOrderTx', () => {
            it('should successfully execute the transaction', async () => {
                const encoder = await contractWrappers.exchange.transactionEncoderAsync();
                const data = encoder.fillOrderTx(signedOrder, takerTokenFillAmount);
                await executeTransactionOrThrowAsync(encoder, data);
            });
        });
        describe('#fillOrderNoThrowTx', () => {
            it('should successfully execute the transaction', async () => {
                const encoder = await contractWrappers.exchange.transactionEncoderAsync();
                const data = encoder.fillOrderNoThrowTx(signedOrder, takerTokenFillAmount);
                await executeTransactionOrThrowAsync(encoder, data);
            });
        });
        describe('#fillOrKillOrderTx', () => {
            it('should successfully execute the transaction', async () => {
                const encoder = await contractWrappers.exchange.transactionEncoderAsync();
                const data = encoder.fillOrKillOrderTx(signedOrder, takerTokenFillAmount);
                await executeTransactionOrThrowAsync(encoder, data);
            });
        });
        describe('#marketSellOrdersTx', () => {
            it('should successfully execute the transaction', async () => {
                const encoder = await contractWrappers.exchange.transactionEncoderAsync();
                const data = encoder.marketSellOrdersTx([signedOrder], takerTokenFillAmount);
                await executeTransactionOrThrowAsync(encoder, data);
            });
        });
        describe('#marketSellOrdersNoThrowTx', () => {
            it('should successfully execute the transaction', async () => {
                const encoder = await contractWrappers.exchange.transactionEncoderAsync();
                const data = encoder.marketSellOrdersNoThrowTx([signedOrder], takerTokenFillAmount);
                await executeTransactionOrThrowAsync(encoder, data);
            });
        });
        describe('#marketBuyOrdersTx', () => {
            it('should successfully execute the transaction', async () => {
                const encoder = await contractWrappers.exchange.transactionEncoderAsync();
                const data = encoder.marketBuyOrdersTx([signedOrder], fillableAmount);
                await executeTransactionOrThrowAsync(encoder, data);
            });
        });
        describe('#marketBuyOrdersNoThrowTx', () => {
            it('should successfully execute the transaction', async () => {
                const encoder = await contractWrappers.exchange.transactionEncoderAsync();
                const data = encoder.marketBuyOrdersNoThrowTx([signedOrder], fillableAmount);
                await executeTransactionOrThrowAsync(encoder, data);
            });
        });
        describe('#preSignTx', () => {
            it('should successfully execute the transaction', async () => {
                const encoder = await contractWrappers.exchange.transactionEncoderAsync();
                const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
                const signature = signedOrder.signature;
                const data = encoder.preSignTx(orderHash, makerAddress, signature);
                await executeTransactionOrThrowAsync(encoder, data);
            });
        });
        describe('#setSignatureValidatorApprovalTx', () => {
            it('should successfully execute the transaction', async () => {
                const encoder = await contractWrappers.exchange.transactionEncoderAsync();
                const isApproved = true;
                const data = encoder.setSignatureValidatorApprovalTx(senderAddress, isApproved);
                await executeTransactionOrThrowAsync(encoder, data);
            });
        });
        describe('#batchFillOrdersTx', () => {
            it('should successfully execute the transaction', async () => {
                const encoder = await contractWrappers.exchange.transactionEncoderAsync();
                const data = encoder.batchFillOrdersTx([signedOrder], [takerTokenFillAmount]);
                await executeTransactionOrThrowAsync(encoder, data);
            });
        });
        describe('#batchFillOrKillOrdersTx', () => {
            it('should successfully execute the transaction', async () => {
                const encoder = await contractWrappers.exchange.transactionEncoderAsync();
                const data = encoder.batchFillOrKillOrdersTx([signedOrder], [takerTokenFillAmount]);
                await executeTransactionOrThrowAsync(encoder, data);
            });
        });
        describe('#batchFillOrdersNoThrowTx', () => {
            it('should successfully execute the transaction', async () => {
                const encoder = await contractWrappers.exchange.transactionEncoderAsync();
                const data = encoder.batchFillOrdersNoThrowTx([signedOrder], [takerTokenFillAmount]);
                await executeTransactionOrThrowAsync(encoder, data);
            });
        });
        describe('#batchCancelOrdersTx', () => {
            it('should successfully execute the transaction', async () => {
                const encoder = await contractWrappers.exchange.transactionEncoderAsync();
                const data = encoder.batchCancelOrdersTx([signedOrder]);
                const signerAddress = makerAddress;
                await executeTransactionOrThrowAsync(encoder, data, signerAddress);
            });
        });
        describe('#cancelOrderTx', () => {
            it('should successfully execute the transaction', async () => {
                const encoder = await contractWrappers.exchange.transactionEncoderAsync();
                const data = encoder.cancelOrderTx(signedOrder);
                const signerAddress = makerAddress;
                await executeTransactionOrThrowAsync(encoder, data, signerAddress);
            });
        });
        describe('#cancelOrdersUpToTx', () => {
            it('should successfully execute the transaction', async () => {
                const encoder = await contractWrappers.exchange.transactionEncoderAsync();
                const targetEpoch = signedOrder.salt;
                const data = encoder.cancelOrdersUpToTx(targetEpoch);
                const signerAddress = makerAddress;
                await executeTransactionOrThrowAsync(encoder, data, signerAddress);
            });
        });
    });
});
