"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("@0x/utils");
var ORDER_ABI_COMPONENTS = [
    { name: 'makerAddress', type: 'address' },
    { name: 'takerAddress', type: 'address' },
    { name: 'feeRecipientAddress', type: 'address' },
    { name: 'senderAddress', type: 'address' },
    { name: 'makerAssetAmount', type: 'uint256' },
    { name: 'takerAssetAmount', type: 'uint256' },
    { name: 'makerFee', type: 'uint256' },
    { name: 'takerFee', type: 'uint256' },
    { name: 'expirationTimeSeconds', type: 'uint256' },
    { name: 'salt', type: 'uint256' },
    { name: 'makerAssetData', type: 'bytes' },
    { name: 'takerAssetData', type: 'bytes' },
    { name: 'makerFeeAssetData', type: 'bytes' },
    { name: 'takerFeeAssetData', type: 'bytes' },
];
/**
 * ABI encoder for `FillQuoteTransformer.TransformData`
 */
exports.fillQuoteTransformerDataEncoder = utils_1.AbiEncoder.create([
    {
        name: 'data',
        type: 'tuple',
        components: [
            { name: 'side', type: 'uint8' },
            { name: 'sellToken', type: 'address' },
            { name: 'buyToken', type: 'address' },
            {
                name: 'orders',
                type: 'tuple[]',
                components: ORDER_ABI_COMPONENTS,
            },
            { name: 'signatures', type: 'bytes[]' },
            { name: 'maxOrderFillAmounts', type: 'uint256[]' },
            { name: 'fillAmount', type: 'uint256' },
        ],
    },
]);
/**
 * Market operation for `FillQuoteTransformerData`.
 */
var FillQuoteTransformerSide;
(function (FillQuoteTransformerSide) {
    FillQuoteTransformerSide[FillQuoteTransformerSide["Sell"] = 0] = "Sell";
    FillQuoteTransformerSide[FillQuoteTransformerSide["Buy"] = 1] = "Buy";
})(FillQuoteTransformerSide = exports.FillQuoteTransformerSide || (exports.FillQuoteTransformerSide = {}));
/**
 * ABI-encode a `FillQuoteTransformer.TransformData` type.
 */
function encodeFillQuoteTransformerData(data) {
    return exports.fillQuoteTransformerDataEncoder.encode([data]);
}
exports.encodeFillQuoteTransformerData = encodeFillQuoteTransformerData;
/**
 * ABI-decode a `FillQuoteTransformer.TransformData` type.
 */
function decodeFillQuoteTransformerData(encoded) {
    return exports.fillQuoteTransformerDataEncoder.decode(encoded).data;
}
exports.decodeFillQuoteTransformerData = decodeFillQuoteTransformerData;
/**
 * ABI encoder for `WethTransformer.TransformData`
 */
exports.wethTransformerDataEncoder = utils_1.AbiEncoder.create([
    {
        name: 'data',
        type: 'tuple',
        components: [{ name: 'token', type: 'address' }, { name: 'amount', type: 'uint256' }],
    },
]);
/**
 * ABI-encode a `WethTransformer.TransformData` type.
 */
function encodeWethTransformerData(data) {
    return exports.wethTransformerDataEncoder.encode([data]);
}
exports.encodeWethTransformerData = encodeWethTransformerData;
/**
 * ABI-decode a `WethTransformer.TransformData` type.
 */
function decodeWethTransformerData(encoded) {
    return exports.wethTransformerDataEncoder.decode(encoded).data;
}
exports.decodeWethTransformerData = decodeWethTransformerData;
/**
 * ABI encoder for `PayTakerTransformer.TransformData`
 */
exports.payTakerTransformerDataEncoder = utils_1.AbiEncoder.create([
    {
        name: 'data',
        type: 'tuple',
        components: [{ name: 'tokens', type: 'address[]' }, { name: 'amounts', type: 'uint256[]' }],
    },
]);
/**
 * ABI-encode a `PayTakerTransformer.TransformData` type.
 */
function encodePayTakerTransformerData(data) {
    return exports.payTakerTransformerDataEncoder.encode([data]);
}
exports.encodePayTakerTransformerData = encodePayTakerTransformerData;
/**
 * ABI-decode a `PayTakerTransformer.TransformData` type.
 */
function decodePayTakerTransformerData(encoded) {
    return exports.payTakerTransformerDataEncoder.decode(encoded).data;
}
exports.decodePayTakerTransformerData = decodePayTakerTransformerData;
/**
 * ABI encoder for `PayTakerTransformer.TransformData`
 */
exports.affiliateFeeTransformerDataEncoder = utils_1.AbiEncoder.create({
    name: 'data',
    type: 'tuple',
    components: [
        {
            name: 'fees',
            type: 'tuple[]',
            components: [
                { name: 'token', type: 'address' },
                { name: 'amount', type: 'uint256' },
                { name: 'recipient', type: 'address' },
            ],
        },
    ],
});
/**
 * ABI-encode a `AffiliateFeeTransformer.TransformData` type.
 */
function encodeAffiliateFeeTransformerData(data) {
    return exports.affiliateFeeTransformerDataEncoder.encode(data);
}
exports.encodeAffiliateFeeTransformerData = encodeAffiliateFeeTransformerData;
/**
 * ABI-decode a `AffiliateFeeTransformer.TransformData` type.
 */
function decodeAffiliateFeeTransformerData(encoded) {
    return exports.affiliateFeeTransformerDataEncoder.decode(encoded).data;
}
exports.decodeAffiliateFeeTransformerData = decodeAffiliateFeeTransformerData;
//# sourceMappingURL=transformer_data_encoders.js.map