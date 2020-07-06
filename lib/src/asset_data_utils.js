"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
var contract_wrappers_1 = require("@0x/contract-wrappers");
var types_1 = require("@0x/types");
var utils_1 = require("@0x/utils");
var _ = require("lodash");
var fakeProvider = { isEIP1193: true };
var assetDataEncoder = new contract_wrappers_1.IAssetDataContract(utils_1.NULL_ADDRESS, fakeProvider);
exports.assetDataUtils = {
    encodeERC20AssetData: function (tokenAddress) {
        return assetDataEncoder.ERC20Token(tokenAddress).getABIEncodedTransactionData();
    },
    encodeERC20BridgeAssetData: function (tokenAddress, bridgeAddress, bridgeData) {
        return assetDataEncoder.ERC20Bridge(tokenAddress, bridgeAddress, bridgeData).getABIEncodedTransactionData();
    },
    encodeERC721AssetData: function (tokenAddress, tokenId) {
        return assetDataEncoder.ERC721Token(tokenAddress, tokenId).getABIEncodedTransactionData();
    },
    encodeERC1155AssetData: function (tokenAddress, tokenIds, tokenValues, callbackData) {
        return assetDataEncoder
            .ERC1155Assets(tokenAddress, tokenIds, tokenValues, callbackData)
            .getABIEncodedTransactionData();
    },
    encodeMultiAssetData: function (values, nestedAssetData) {
        return assetDataEncoder.MultiAsset(values, nestedAssetData).getABIEncodedTransactionData();
    },
    encodeStaticCallAssetData: function (staticCallTargetAddress, staticCallData, expectedReturnDataHash) {
        return assetDataEncoder
            .StaticCall(staticCallTargetAddress, staticCallData, expectedReturnDataHash)
            .getABIEncodedTransactionData();
    },
    /**
     * Decode any assetData into its corresponding assetData object
     * @param assetData Hex encoded assetData string to decode
     * @return Either a ERC20, ERC20Bridge, ERC721, ERC1155, StaticCall, or MultiAsset assetData object
     */
    decodeAssetDataOrThrow: function (assetData) {
        var assetProxyId = utils_1.hexUtils.slice(assetData, 0, 4); // tslint:disable-line:custom-no-magic-numbers
        switch (assetProxyId) {
            case types_1.AssetProxyId.ERC20: {
                var tokenAddress = assetDataEncoder.getABIDecodedTransactionData('ERC20Token', assetData);
                return {
                    assetProxyId: assetProxyId,
                    tokenAddress: tokenAddress,
                };
            }
            case types_1.AssetProxyId.ERC20Bridge: {
                var _a = __read(assetDataEncoder.getABIDecodedTransactionData('ERC20Bridge', assetData), 3), tokenAddress = _a[0], bridgeAddress = _a[1], bridgeData = _a[2];
                return {
                    assetProxyId: assetProxyId,
                    tokenAddress: tokenAddress,
                    bridgeAddress: bridgeAddress,
                    bridgeData: bridgeData,
                };
            }
            case types_1.AssetProxyId.ERC721: {
                var _b = __read(assetDataEncoder.getABIDecodedTransactionData('ERC721Token', assetData), 2), tokenAddress = _b[0], tokenId = _b[1];
                return {
                    assetProxyId: assetProxyId,
                    tokenAddress: tokenAddress,
                    tokenId: tokenId,
                };
            }
            case types_1.AssetProxyId.ERC1155: {
                var _c = __read(assetDataEncoder.getABIDecodedTransactionData('ERC1155Assets', assetData), 4), tokenAddress = _c[0], tokenIds = _c[1], tokenValues = _c[2], callbackData = _c[3];
                return {
                    assetProxyId: assetProxyId,
                    tokenAddress: tokenAddress,
                    tokenIds: tokenIds,
                    tokenValues: tokenValues,
                    callbackData: callbackData,
                };
            }
            case types_1.AssetProxyId.MultiAsset: {
                var _d = __read(assetDataEncoder.getABIDecodedTransactionData('MultiAsset', assetData), 2), amounts = _d[0], nestedAssetData = _d[1];
                var multiAssetData = {
                    assetProxyId: assetProxyId,
                    amounts: amounts,
                    nestedAssetData: nestedAssetData,
                };
                return multiAssetData;
            }
            case types_1.AssetProxyId.StaticCall:
                var _e = __read(assetDataEncoder.getABIDecodedTransactionData('StaticCall', assetData), 3), callTarget = _e[0], staticCallData = _e[1], callResultHash = _e[2];
                return {
                    assetProxyId: assetProxyId,
                    callTarget: callTarget,
                    staticCallData: staticCallData,
                    callResultHash: callResultHash,
                };
            default:
                throw new Error("Unhandled asset proxy ID: " + assetProxyId);
        }
    },
    /**
     * Decodes a MultiAsset assetData hex string into its corresponding amounts and decoded nestedAssetData elements (all nested elements are flattened)
     * @param assetData Hex encoded assetData string to decode
     * @return An object containing the decoded amounts and nestedAssetData
     */
    decodeMultiAssetDataRecursively: function (assetData) {
        var decodedAssetData = exports.assetDataUtils.decodeAssetDataOrThrow(assetData); // tslint:disable-line:no-unnecessary-type-assertion
        if (decodedAssetData.assetProxyId !== types_1.AssetProxyId.MultiAsset) {
            throw new Error("Not a MultiAssetData. Use 'decodeAssetDataOrThrow' instead");
        }
        var amounts = [];
        var decodedNestedAssetData = decodedAssetData.nestedAssetData.map(function (nestedAssetDataElement, index) {
            var decodedNestedAssetDataElement = exports.assetDataUtils.decodeAssetDataOrThrow(nestedAssetDataElement);
            if (decodedNestedAssetDataElement.assetProxyId === types_1.AssetProxyId.MultiAsset) {
                var recursivelyDecodedAssetData = exports.assetDataUtils.decodeMultiAssetDataRecursively(nestedAssetDataElement);
                amounts.push(recursivelyDecodedAssetData.amounts.map(function (amountElement) {
                    return amountElement.times(decodedAssetData.amounts[index]);
                }));
                return recursivelyDecodedAssetData.nestedAssetData;
            }
            else {
                amounts.push(decodedAssetData.amounts[index]);
                return decodedNestedAssetDataElement;
            }
        });
        var flattenedAmounts = _.flattenDeep(amounts);
        var flattenedDecodedNestedAssetData = _.flattenDeep(decodedNestedAssetData);
        return {
            assetProxyId: decodedAssetData.assetProxyId,
            amounts: flattenedAmounts,
            // tslint:disable-next-line:no-unnecessary-type-assertion
            nestedAssetData: flattenedDecodedNestedAssetData,
        };
    },
    isERC20TokenAssetData: function (assetData) {
        return assetData.assetProxyId === types_1.AssetProxyId.ERC20;
    },
    isERC20BridgeAssetData: function (assetData) {
        return assetData.assetProxyId === types_1.AssetProxyId.ERC20Bridge;
    },
    isERC1155TokenAssetData: function (assetData) {
        return assetData.assetProxyId === types_1.AssetProxyId.ERC1155;
    },
    isERC721TokenAssetData: function (assetData) {
        return assetData.assetProxyId === types_1.AssetProxyId.ERC721;
    },
    isMultiAssetData: function (assetData) {
        return assetData.assetProxyId === types_1.AssetProxyId.MultiAsset;
    },
    isStaticCallAssetData: function (assetData) {
        return assetData.assetProxyId === types_1.AssetProxyId.StaticCall;
    },
};
//# sourceMappingURL=asset_data_utils.js.map