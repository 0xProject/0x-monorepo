import { schemas } from '@0x/json-schemas';
import { transactionHashUtils } from '@0x/order-utils';
import { Order, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import _ = require('lodash');

import { ExchangeContract } from '../index';

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
     * Hashes the transaction data for use with the Exchange contract.
     * @param data The ABI Encoded 0x Exchange method. I.e fillOrder
     * @param salt A random value to provide uniqueness and prevent replay attacks.
     * @param signerAddress The address which will sign this transaction.
     * @return The hash of the 0x transaction.
     */
    public getTransactionHashHex(data: string, salt: BigNumber, signerAddress: string): string {
        const exchangeAddress = this._getExchangeContract().address;
        const transaction = {
            verifyingContractAddress: exchangeAddress,
            salt,
            signerAddress,
            data,
        };
        const hashHex = transactionHashUtils.getTransactionHashHex(transaction);
        return hashHex;
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
     * Encodes a matchOrders transaction.
     * @param   leftOrder First order to match.
     * @param   rightOrder Second order to match.
     * @return Hex encoded abi of the function call.
     */
    public matchOrdersTx(leftOrder: SignedOrder, rightOrder: SignedOrder): string {
        assert.doesConformToSchema('leftOrder', leftOrder, schemas.orderSchema);
        assert.doesConformToSchema('rightOrder', rightOrder, schemas.orderSchema);
        const abiEncodedData = this._getExchangeContract().matchOrders.getABIEncodedTransactionData(
            leftOrder,
            rightOrder,
            leftOrder.signature,
            rightOrder.signature,
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
