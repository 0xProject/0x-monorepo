import { IExchangeContract } from '@0x/contracts-exchange';
import { chaiSetup, constants, provider, txDefaults, web3Wrapper } from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';

import { artifacts, LibTransactionDecoderContract } from '../src';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

const order = {
    makerAddress: '0xe36ea790bc9d7ab70c55260c66d52b1eca985f84',
    takerAddress: '0x0000000000000000000000000000000000000000',
    feeRecipientAddress: '0x78dc5d2d739606d31509c31d654056a45185ecb6',
    senderAddress: '0x6ecbe1db9ef729cbe972c83fb886247691fb6beb',
    makerAssetAmount: new BigNumber('100000000000000000000'),
    takerAssetAmount: new BigNumber('200000000000000000000'),
    makerFee: new BigNumber('1000000000000000000'),
    takerFee: new BigNumber('1000000000000000000'),
    expirationTimeSeconds: new BigNumber('1552396423'),
    salt: new BigNumber('66097384406870180066678463045003379626790660770396923976862707230261946348951'),
    makerAssetData: '0xf47261b000000000000000000000000034d402f14d58e001d8efbe6585051bf9706aa064',
    takerAssetData: '0xf47261b000000000000000000000000025b8fe1de9daf8ba351890744ff28cf7dfa8f5e3',
    makerFeeAssetData: '0xf47261b000000000000000000000000034d402f14d58e001d8efbe6585051bf9706aa064',
    takerFeeAssetData: '0xf47261b000000000000000000000000025b8fe1de9daf8ba351890744ff28cf7dfa8f5e3',
};
const takerAssetFillAmount = new BigNumber('100000000000000000000');
const signature =
    '0x1ce8e3c600d933423172b5021158a6be2e818613ff8e762d70ef490c752fd98a626a215f09f169668990414de75a53da221c294a3002f796d004827258b641876e03';

describe('LibTransactionDecoder', () => {
    let libTxDecoder: LibTransactionDecoderContract;
    const exchangeInterface = new IExchangeContract(constants.NULL_ADDRESS, provider, txDefaults);
    before(async () => {
        await blockchainLifecycle.startAsync();
        libTxDecoder = await LibTransactionDecoderContract.deployFrom0xArtifactAsync(
            artifacts.LibTransactionDecoder,
            provider,
            txDefaults,
            artifacts,
        );
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });

    it('should decode an Exchange.batchCancelOrders() transaction', async () => {
        const input = exchangeInterface.batchCancelOrders.getABIEncodedTransactionData([order, order]);
        expect(await libTxDecoder.decodeZeroExTransactionData.callAsync(input)).to.deep.equal([
            'batchCancelOrders',
            [order, order],
            [],
            [],
        ]);
    });

    for (const func of ['batchFillOrders', 'batchFillOrdersNoThrow', 'batchFillOrKillOrders']) {
        const input = (exchangeInterface as any)[func].getABIEncodedTransactionData(
            [order, order],
            [takerAssetFillAmount, takerAssetFillAmount],
            [signature, signature],
        );
        it(`should decode an Exchange.${func}() transaction`, async () => {
            expect(await libTxDecoder.decodeZeroExTransactionData.callAsync(input)).to.deep.equal([
                func,
                [order, order],
                [takerAssetFillAmount, takerAssetFillAmount],
                [signature, signature],
            ]);
        });
    }

    it('should decode an Exchange.cancelOrder() transaction', async () => {
        const input = exchangeInterface.cancelOrder.getABIEncodedTransactionData(order);
        expect(await libTxDecoder.decodeZeroExTransactionData.callAsync(input)).to.deep.equal([
            'cancelOrder',
            [order],
            [],
            [],
        ]);
    });

    for (const func of ['fillOrder', 'fillOrderNoThrow', 'fillOrKillOrder']) {
        const input = (exchangeInterface as any)[func].getABIEncodedTransactionData(
            order,
            takerAssetFillAmount,
            signature,
        );
        it(`should decode an Exchange.${func}() transaction`, async () => {
            expect(await libTxDecoder.decodeZeroExTransactionData.callAsync(input)).to.deep.equal([
                func,
                [order],
                [takerAssetFillAmount],
                [signature],
            ]);
        });
    }

    for (const func of [
            'marketBuyOrdersNoThrow',
            'marketSellOrdersNoThrow',
            'marketBuyOrdersFillOrKill',
            'marketSellOrdersFillOrKill',
        ]) {
        const input = (exchangeInterface as any)[func].getABIEncodedTransactionData(
            [order, order],
            takerAssetFillAmount,
            [signature, signature],
        );
        it(`should decode an Exchange.${func}() transaction`, async () => {
            expect(await libTxDecoder.decodeZeroExTransactionData.callAsync(input)).to.deep.equal([
                func,
                [order, order],
                [takerAssetFillAmount],
                [signature, signature],
            ]);
        });
    }

    it('should decode an Exchange.matchOrders() transaction', async () => {
        const complementaryOrder = {
            ...order,
            makerAddress: order.takerAddress,
            takerAddress: order.makerAddress,
            makerAssetData: order.takerAssetData,
            takerAssetData: order.makerAssetData,
            makerAssetAmount: order.takerAssetAmount,
            takerAssetAmount: order.makerAssetAmount,
            makerFee: order.takerFee,
            takerFee: order.makerFee,
            makerFeeAssetData: order.takerFeeAssetData,
            takerFeeAssetData: order.makerFeeAssetData,
        };
        const input = exchangeInterface.matchOrders.getABIEncodedTransactionData(
            order,
            complementaryOrder,
            signature,
            signature,
        );
        expect(await libTxDecoder.decodeZeroExTransactionData.callAsync(input)).to.deep.equal([
            'matchOrders',
            [order, complementaryOrder],
            [order.takerAssetAmount, complementaryOrder.takerAssetAmount],
            [signature, signature],
        ]);
    });
});
