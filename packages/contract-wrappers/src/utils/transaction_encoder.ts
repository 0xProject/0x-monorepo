import { ExchangeContract } from '@0xproject/abi-gen-wrappers';

import { schemas } from '@0xproject/json-schemas';
import { eip712Utils } from '@0xproject/order-utils';
import { Order, SignedOrder } from '@0xproject/types';
import { BigNumber, signTypedDataUtils } from '@0xproject/utils';
import _ = require('lodash');

import { assert } from './assert';

/**
 * Transaction Encoder. Transaction messages exist for the purpose of calling methods on the Exchange contract
 * in the context of another address. For example, UserA can encode and sign a fillOrder transaction and UserB
 * can submit this to the blockchain. The Exchange context executes as if UserA had directly submitted this transaction.
 */
export class TransactionEncoder {
    private readonly _exchangeInstance: ExchangeContract;
    constructor(exchangeInstance: ExchangeContract) {
        this._exchangeInstance = exchangeInstance;
    }
    /**
     * Encodes the transaction data for use with the Exchange contract.
     * @param data The ABI Encoded 0x Exchange method. I.e fillOrder
     * @param salt A random value to provide uniqueness and prevent replay attacks.
     * @param signerAddress The address which will sign this transaction.
     * @return An unsigned hex encoded transaction for use in 0x Exchange executeTransaction.
     */
    public getTransactionHex(data: string, salt: BigNumber, signerAddress: string): string {
        const exchangeAddress = this._getExchangeContract().address;
        const executeTransactionData = {
            salt,
            signerAddress,
            data,
        };
        const typedData = eip712Utils.createZeroExTransactionTypedData(executeTransactionData, exchangeAddress);
        const eip712MessageBuffer = signTypedDataUtils.generateTypedDataHash(typedData);
        const messageHex = `0x${eip712MessageBuffer.toString('hex')}`;
        return messageHex;
    }
    /**
     * Encodes a fillOrder transaction.
     * @param  signedOrder           An object that conforms to the SignedOrder interface.
     * @param  takerAssetFillAmount  The amount of the order (in taker asset baseUnits) that you wish to fill.
     * @return Hex encoded abi of the function call.
     */
    public fillOrderTx(signedOrder: SignedOrder, takerAssetFillAmount: BigNumber): string {
        assert.doesConformToSchema('signedOrder', signedOrder, schemas.signedOrderSchema);
        assert.isValidBaseUnitAmount('takerAssetFillAmount', takerAssetFillAmount);
        const abiEncodedData = this._getExchangeContract().fillOrder.getABIEncodedTransactionData(
            signedOrder,
            takerAssetFillAmount,
            signedOrder.signature,
        );
        return abiEncodedData;
    }
    /**
     * Encodes a fillOrderNoThrow transaction.
     * @param  signedOrder           An object that conforms to the SignedOrder interface.
     * @param  takerAssetFillAmount  The amount of the order (in taker asset baseUnits) that you wish to fill.
     * @return Hex encoded abi of the function call.
     */
    public fillOrderNoThrowTx(signedOrder: SignedOrder, takerAssetFillAmount: BigNumber): string {
        assert.doesConformToSchema('signedOrder', signedOrder, schemas.signedOrderSchema);
        assert.isValidBaseUnitAmount('takerAssetFillAmount', takerAssetFillAmount);
        const abiEncodedData = this._getExchangeContract().fillOrderNoThrow.getABIEncodedTransactionData(
            signedOrder,
            takerAssetFillAmount,
            signedOrder.signature,
        );
        return abiEncodedData;
    }
    /**
     * Encodes a fillOrKillOrder transaction.
     * @param  signedOrder           An object that conforms to the SignedOrder interface.
     * @param  takerAssetFillAmount  The amount of the order (in taker asset baseUnits) that you wish to fill.
     * @return Hex encoded abi of the function call.
     */
    public fillOrKillOrderTx(signedOrder: SignedOrder, takerAssetFillAmount: BigNumber): string {
        assert.doesConformToSchema('signedOrder', signedOrder, schemas.signedOrderSchema);
        assert.isValidBaseUnitAmount('takerAssetFillAmount', takerAssetFillAmount);
        const abiEncodedData = this._getExchangeContract().fillOrKillOrder.getABIEncodedTransactionData(
            signedOrder,
            takerAssetFillAmount,
            signedOrder.signature,
        );
        return abiEncodedData;
    }
    /**
     * Encodes a batchFillOrders transaction.
     * @param   signedOrders          An array of signed orders to fill.
     * @param   takerAssetFillAmounts The amounts of the orders (in taker asset baseUnits) that you wish to fill.
     * @return Hex encoded abi of the function call.
     */
    public batchFillOrdersTx(signedOrders: SignedOrder[], takerAssetFillAmounts: BigNumber[]): string {
        assert.doesConformToSchema('signedOrders', signedOrders, schemas.signedOrdersSchema);
        _.forEach(takerAssetFillAmounts, takerAssetFillAmount =>
            assert.isBigNumber('takerAssetFillAmount', takerAssetFillAmount),
        );
        const signatures = _.map(signedOrders, signedOrder => signedOrder.signature);
        const abiEncodedData = this._getExchangeContract().batchFillOrders.getABIEncodedTransactionData(
            signedOrders,
            takerAssetFillAmounts,
            signatures,
        );
        return abiEncodedData;
    }
    /**
     * Encodes a batchFillOrKillOrders transaction.
     * @param   signedOrders          An array of signed orders to fill.
     * @param   takerAssetFillAmounts The amounts of the orders (in taker asset baseUnits) that you wish to fill.
     * @return Hex encoded abi of the function call.
     */
    public batchFillOrKillOrdersTx(signedOrders: SignedOrder[], takerAssetFillAmounts: BigNumber[]): string {
        assert.doesConformToSchema('signedOrders', signedOrders, schemas.signedOrdersSchema);
        _.forEach(takerAssetFillAmounts, takerAssetFillAmount =>
            assert.isBigNumber('takerAssetFillAmount', takerAssetFillAmount),
        );
        const signatures = _.map(signedOrders, signedOrder => signedOrder.signature);
        const abiEncodedData = this._getExchangeContract().batchFillOrKillOrders.getABIEncodedTransactionData(
            signedOrders,
            takerAssetFillAmounts,
            signatures,
        );
        return abiEncodedData;
    }
    /**
     * Encodes a batchFillOrdersNoThrow transaction.
     * @param   signedOrders          An array of signed orders to fill.
     * @param   takerAssetFillAmounts The amounts of the orders (in taker asset baseUnits) that you wish to fill.
     * @return Hex encoded abi of the function call.
     */
    public batchFillOrdersNoThrowTx(signedOrders: SignedOrder[], takerAssetFillAmounts: BigNumber[]): string {
        assert.doesConformToSchema('signedOrders', signedOrders, schemas.signedOrdersSchema);
        _.forEach(takerAssetFillAmounts, takerAssetFillAmount =>
            assert.isBigNumber('takerAssetFillAmount', takerAssetFillAmount),
        );
        const signatures = _.map(signedOrders, signedOrder => signedOrder.signature);
        const abiEncodedData = this._getExchangeContract().batchFillOrdersNoThrow.getABIEncodedTransactionData(
            signedOrders,
            takerAssetFillAmounts,
            signatures,
        );
        return abiEncodedData;
    }
    /**
     * Encodes a batchCancelOrders transaction.
     * @param   signedOrders An array of orders to cancel.
     * @return Hex encoded abi of the function call.
     */
    public batchCancelOrdersTx(signedOrders: SignedOrder[]): string {
        assert.doesConformToSchema('signedOrders', signedOrders, schemas.signedOrdersSchema);
        const abiEncodedData = this._getExchangeContract().batchCancelOrders.getABIEncodedTransactionData(signedOrders);
        return abiEncodedData;
    }
    /**
     * Encodes a cancelOrdersUpTo transaction.
     * @param  targetOrderEpoch Target order epoch.
     * @return Hex encoded abi of the function call.
     */
    public cancelOrdersUpToTx(targetOrderEpoch: BigNumber): string {
        assert.isBigNumber('targetOrderEpoch', targetOrderEpoch);
        const abiEncodedData = this._getExchangeContract().cancelOrdersUpTo.getABIEncodedTransactionData(
            targetOrderEpoch,
        );
        return abiEncodedData;
    }
    /**
     * Encodes a cancelOrder transaction.
     * @param  order An object that conforms to the Order or SignedOrder interface. The order you would like to cancel.
     * @return Hex encoded abi of the function call.
     */
    public cancelOrderTx(order: Order | SignedOrder): string {
        assert.doesConformToSchema('order', order, schemas.orderSchema);
        const abiEncodedData = this._getExchangeContract().cancelOrder.getABIEncodedTransactionData(order);
        return abiEncodedData;
    }
    /**
     * Encodes a marketSellOrders transaction.
     * @param   signedOrders         An array of signed orders to fill.
     * @param   takerAssetFillAmount Taker asset fill amount.
     * @return Hex encoded abi of the function call.
     */
    public marketSellOrdersTx(signedOrders: SignedOrder[], takerAssetFillAmount: BigNumber): string {
        assert.doesConformToSchema('signedOrders', signedOrders, schemas.signedOrdersSchema);
        assert.isBigNumber('takerAssetFillAmount', takerAssetFillAmount);
        const signatures = _.map(signedOrders, signedOrder => signedOrder.signature);
        const abiEncodedData = this._getExchangeContract().marketSellOrders.getABIEncodedTransactionData(
            signedOrders,
            takerAssetFillAmount,
            signatures,
        );
        return abiEncodedData;
    }
    /**
     * Encodes a marketSellOrdersNoThrow transaction.
     * @param   signedOrders         An array of signed orders to fill.
     * @param   takerAssetFillAmount Taker asset fill amount.
     * @return Hex encoded abi of the function call.
     */
    public marketSellOrdersNoThrowTx(signedOrders: SignedOrder[], takerAssetFillAmount: BigNumber): string {
        assert.doesConformToSchema('signedOrders', signedOrders, schemas.signedOrdersSchema);
        assert.isBigNumber('takerAssetFillAmount', takerAssetFillAmount);
        const signatures = _.map(signedOrders, signedOrder => signedOrder.signature);
        const abiEncodedData = this._getExchangeContract().marketSellOrdersNoThrow.getABIEncodedTransactionData(
            signedOrders,
            takerAssetFillAmount,
            signatures,
        );
        return abiEncodedData;
    }
    /**
     * Encodes a maketBuyOrders transaction.
     * @param   signedOrders         An array of signed orders to fill.
     * @param   makerAssetFillAmount Maker asset fill amount.
     * @return Hex encoded abi of the function call.
     */
    public marketBuyOrdersTx(signedOrders: SignedOrder[], makerAssetFillAmount: BigNumber): string {
        assert.doesConformToSchema('signedOrders', signedOrders, schemas.signedOrdersSchema);
        assert.isBigNumber('makerAssetFillAmount', makerAssetFillAmount);
        const signatures = _.map(signedOrders, signedOrder => signedOrder.signature);
        const abiEncodedData = this._getExchangeContract().marketBuyOrders.getABIEncodedTransactionData(
            signedOrders,
            makerAssetFillAmount,
            signatures,
        );
        return abiEncodedData;
    }
    /**
     * Encodes a maketBuyOrdersNoThrow transaction.
     * @param   signedOrders         An array of signed orders to fill.
     * @param   makerAssetFillAmount Maker asset fill amount.
     * @return Hex encoded abi of the function call.
     */
    public marketBuyOrdersNoThrowTx(signedOrders: SignedOrder[], makerAssetFillAmount: BigNumber): string {
        assert.doesConformToSchema('signedOrders', signedOrders, schemas.signedOrdersSchema);
        assert.isBigNumber('makerAssetFillAmount', makerAssetFillAmount);
        const signatures = _.map(signedOrders, signedOrder => signedOrder.signature);
        const abiEncodedData = this._getExchangeContract().marketBuyOrdersNoThrow.getABIEncodedTransactionData(
            signedOrders,
            makerAssetFillAmount,
            signatures,
        );
        return abiEncodedData;
    }
    /**
     * Encodes a preSign transaction.
     * @param hash          Hash to pre-sign
     * @param signerAddress Address that should have signed the given hash.
     * @param signature     Proof that the hash has been signed by signer.
     * @return Hex encoded abi of the function call.
     */
    public preSignTx(hash: string, signerAddress: string, signature: string): string {
        assert.isHexString('hash', hash);
        assert.isETHAddressHex('signerAddress', signerAddress);
        assert.isHexString('signature', signature);
        const abiEncodedData = this._getExchangeContract().preSign.getABIEncodedTransactionData(
            hash,
            signerAddress,
            signature,
        );
        return abiEncodedData;
    }
    /**
     * Encodes a setSignatureValidatorApproval transaction.
     * @param   validatorAddress        Validator contract address.
     * @param   isApproved              Boolean value to set approval to.
     * @return Hex encoded abi of the function call.
     */
    public setSignatureValidatorApprovalTx(validatorAddress: string, isApproved: boolean): string {
        assert.isETHAddressHex('validatorAddress', validatorAddress);
        assert.isBoolean('isApproved', isApproved);
        const abiEncodedData = this._getExchangeContract().setSignatureValidatorApproval.getABIEncodedTransactionData(
            validatorAddress,
            isApproved,
        );
        return abiEncodedData;
    }
    private _getExchangeContract(): ExchangeContract {
        return this._exchangeInstance;
    }
}
