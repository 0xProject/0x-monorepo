"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("@0x/types");
const utils_1 = require("@0x/utils");
const ethjs = require("ethereumjs-util");
/**
 * Generate calldata with a signature appended.
 */
function signCallData(callData, privateKey) {
    const prefix = ethjs.sha3('SignedCallDataSignature(bytes)').slice(0, 4);
    return utils_1.hexUtils.concat(callData, prefix, generateCallDataSignature(callData, privateKey));
}
exports.signCallData = signCallData;
/**
 * Generate a signature for calldata.
 */
function generateCallDataSignature(callData, privateKey) {
    return generateCallDataHashSignature(utils_1.hexUtils.hash(callData), privateKey);
}
exports.generateCallDataSignature = generateCallDataSignature;
/**
 * Generate a signature for calldata hash.
 */
function generateCallDataHashSignature(callDataHash, privateKey) {
    const { r, s, v } = ethjs.ecsign(ethjs.hashPersonalMessage(ethjs.toBuffer(callDataHash)), ethjs.toBuffer(privateKey));
    return utils_1.hexUtils.concat(v, r, s, types_1.SignatureType.EthSign);
}
exports.generateCallDataHashSignature = generateCallDataHashSignature;
//# sourceMappingURL=signed_call_data.js.map