"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var constants_1 = require("../../constants");
var constants_2 = require("./constants");
var NULL_ADDRESS = constants_1.constants.NULL_ADDRESS, NULL_BYTES = constants_1.constants.NULL_BYTES, ZERO_AMOUNT = constants_1.constants.ZERO_AMOUNT;
var INFINITE_TIMESTAMP_SEC = constants_2.constants.INFINITE_TIMESTAMP_SEC;
exports.dummyOrderUtils = {
    createDummyOrderForSampler: function (makerAssetData, takerAssetData, makerAddress) {
        return {
            makerAddress: makerAddress,
            takerAddress: NULL_ADDRESS,
            senderAddress: NULL_ADDRESS,
            feeRecipientAddress: NULL_ADDRESS,
            salt: ZERO_AMOUNT,
            expirationTimeSeconds: INFINITE_TIMESTAMP_SEC,
            makerAssetData: makerAssetData,
            takerAssetData: takerAssetData,
            makerFeeAssetData: NULL_BYTES,
            takerFeeAssetData: NULL_BYTES,
            makerFee: ZERO_AMOUNT,
            takerFee: ZERO_AMOUNT,
            makerAssetAmount: ZERO_AMOUNT,
            takerAssetAmount: ZERO_AMOUNT,
            signature: NULL_BYTES,
            chainId: 1,
            exchangeAddress: NULL_ADDRESS,
        };
    },
};
//# sourceMappingURL=dummy_order_utils.js.map