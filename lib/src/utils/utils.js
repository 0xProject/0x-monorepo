"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var order_utils_1 = require("@0x/order-utils");
var utils_1 = require("@0x/utils");
var web3_wrapper_1 = require("@0x/web3-wrapper");
var constants_1 = require("../constants");
// tslint:disable:no-unnecessary-type-assertion
exports.utils = {
    numberPercentageToEtherTokenAmountPercentage: function (percentage) {
        return web3_wrapper_1.Web3Wrapper.toBaseUnitAmount(constants_1.constants.ONE_AMOUNT, constants_1.constants.ETHER_TOKEN_DECIMALS).multipliedBy(percentage);
    },
    isOrderTakerFeePayableWithMakerAsset: function (order) {
        return !order.takerFee.isZero() && exports.utils.isAssetDataEquivalent(order.takerFeeAssetData, order.makerAssetData);
    },
    isOrderTakerFeePayableWithTakerAsset: function (order) {
        return !order.takerFee.isZero() && exports.utils.isAssetDataEquivalent(order.takerFeeAssetData, order.takerAssetData);
    },
    getAdjustedMakerAndTakerAmountsFromTakerFees: function (order) {
        var adjustedMakerAssetAmount = exports.utils.isOrderTakerFeePayableWithMakerAsset(order)
            ? order.makerAssetAmount.minus(order.takerFee)
            : order.makerAssetAmount;
        var adjustedTakerAssetAmount = exports.utils.isOrderTakerFeePayableWithTakerAsset(order)
            ? order.takerAssetAmount.plus(order.takerFee)
            : order.takerAssetAmount;
        return [adjustedMakerAssetAmount, adjustedTakerAssetAmount];
    },
    isExactAssetData: function (expectedAssetData, actualAssetData) {
        return expectedAssetData === actualAssetData;
    },
    /**
     * Compare the Asset Data for equivalency. Expected is the asset data the user provided (wanted),
     * actual is the asset data found or created.
     */
    isAssetDataEquivalent: function (expectedAssetData, actualAssetData) {
        if (exports.utils.isExactAssetData(expectedAssetData, actualAssetData)) {
            return true;
        }
        var decodedExpectedAssetData = order_utils_1.assetDataUtils.decodeAssetDataOrThrow(expectedAssetData);
        var decodedActualAssetData = order_utils_1.assetDataUtils.decodeAssetDataOrThrow(actualAssetData);
        // ERC20 === ERC20, ERC20 === ERC20Bridge
        if (exports.utils.isERC20EquivalentAssetData(decodedExpectedAssetData) &&
            exports.utils.isERC20EquivalentAssetData(decodedActualAssetData)) {
            var doesTokenAddressMatch = decodedExpectedAssetData.tokenAddress === decodedActualAssetData.tokenAddress;
            return doesTokenAddressMatch;
        }
        // ERC1155 === ERC1155
        if (order_utils_1.assetDataUtils.isERC1155TokenAssetData(decodedExpectedAssetData) &&
            order_utils_1.assetDataUtils.isERC1155TokenAssetData(decodedActualAssetData)) {
            var doesTokenAddressMatch = decodedExpectedAssetData.tokenAddress === decodedActualAssetData.tokenAddress;
            // IDs may be out of order yet still equivalent
            // i.e (["a", "b"], [1,2]) === (["b", "a"], [2, 1])
            //     (["a", "b"], [2,1]) !== (["b", "a"], [2, 1])
            var hasAllIds = decodedExpectedAssetData.tokenIds.every(function (id) { return decodedActualAssetData.tokenIds.findIndex(function (v) { return id.eq(v); }) !== -1; });
            var hasAllValues = decodedExpectedAssetData.tokenIds.every(function (id, i) {
                return decodedExpectedAssetData.tokenValues[i].eq(decodedActualAssetData.tokenValues[decodedActualAssetData.tokenIds.findIndex(function (v) { return id.eq(v); })]);
            });
            // If expected contains callback data, ensure it is present
            // if actual has callbackdata and expected provided none then ignore it
            var hasEquivalentCallback = decodedExpectedAssetData.callbackData === utils_1.NULL_BYTES ||
                decodedExpectedAssetData.callbackData === decodedActualAssetData.callbackData;
            return doesTokenAddressMatch && hasAllIds && hasAllValues && hasEquivalentCallback;
        }
        // ERC721 === ERC721
        if (order_utils_1.assetDataUtils.isERC721TokenAssetData(decodedExpectedAssetData) ||
            order_utils_1.assetDataUtils.isERC721TokenAssetData(decodedActualAssetData)) {
            // Asset Data should exactly match for ERC721
            return exports.utils.isExactAssetData(expectedAssetData, actualAssetData);
        }
        // TODO(dekz): Unsupported cases
        // ERCXX(token) === MAP(token, staticCall)
        // MAP(a, b) === MAP(b, a) === MAP(b, a, staticCall)
        return false;
    },
    isERC20EquivalentAssetData: function (assetData) {
        return order_utils_1.assetDataUtils.isERC20TokenAssetData(assetData) || order_utils_1.assetDataUtils.isERC20BridgeAssetData(assetData);
    },
};
//# sourceMappingURL=utils.js.map