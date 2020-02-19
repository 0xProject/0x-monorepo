import { artifacts as exchangeArtifacts, ExchangeContract } from '@0x/contracts-exchange';
import { blockchainTests, constants, expect } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';

import { artifacts, DevUtilsContract } from '@0x/contracts-dev-utils';

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

blockchainTests('LibTransactionDecoder', env => {
    let devUtils: DevUtilsContract;
    const exchangeInterface = new ExchangeContract(constants.NULL_ADDRESS, { isEIP1193: true } as any);
    before(async () => {
        const exchange = await ExchangeContract.deployFrom0xArtifactAsync(
            exchangeArtifacts.Exchange,
            env.provider,
            env.txDefaults,
            exchangeArtifacts,
            new BigNumber(1),
        );
        devUtils = await DevUtilsContract.deployWithLibrariesFrom0xArtifactAsync(
            artifacts.DevUtils,
            artifacts,
            env.provider,
            env.txDefaults,
            artifacts,
            exchange.address,
            constants.NULL_ADDRESS,
            constants.NULL_ADDRESS,
        );
    });

    it('should decode an Exchange.batchCancelOrders() transaction', async () => {
        const input = exchangeInterface.batchCancelOrders([order, order]).getABIEncodedTransactionData();
        expect(await devUtils.decodeZeroExTransactionData(input).callAsync()).to.deep.equal([
            'batchCancelOrders',
            [order, order],
            [],
            [],
        ]);
    });

    for (const func of ['batchFillOrders', 'batchFillOrdersNoThrow', 'batchFillOrKillOrders']) {
        const input = (exchangeInterface as any)
            [func]([order, order], [takerAssetFillAmount, takerAssetFillAmount], [signature, signature])
            .getABIEncodedTransactionData();
        it(`should decode an Exchange.${func}() transaction`, async () => {
            expect(await devUtils.decodeZeroExTransactionData(input).callAsync()).to.deep.equal([
                func,
                [order, order],
                [takerAssetFillAmount, takerAssetFillAmount],
                [signature, signature],
            ]);
        });
    }

    it('should decode an Exchange.cancelOrder() transaction', async () => {
        const input = exchangeInterface.cancelOrder(order).getABIEncodedTransactionData();
        expect(await devUtils.decodeZeroExTransactionData(input).callAsync()).to.deep.equal([
            'cancelOrder',
            [order],
            [],
            [],
        ]);
    });

    for (const func of ['fillOrder', 'fillOrKillOrder']) {
        const input = (exchangeInterface as any)
            [func](order, takerAssetFillAmount, signature)
            .getABIEncodedTransactionData();
        it(`should decode an Exchange.${func}() transaction`, async () => {
            expect(await devUtils.decodeZeroExTransactionData(input).callAsync()).to.deep.equal([
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
        const input = (exchangeInterface as any)
            [func]([order, order], takerAssetFillAmount, [signature, signature])
            .getABIEncodedTransactionData();
        it(`should decode an Exchange.${func}() transaction`, async () => {
            expect(await devUtils.decodeZeroExTransactionData(input).callAsync()).to.deep.equal([
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
        const input = exchangeInterface
            .matchOrders(order, complementaryOrder, signature, signature)
            .getABIEncodedTransactionData();
        expect(await devUtils.decodeZeroExTransactionData(input).callAsync()).to.deep.equal([
            'matchOrders',
            [order, complementaryOrder],
            [order.takerAssetAmount, complementaryOrder.takerAssetAmount],
            [signature, signature],
        ]);
    });
});
