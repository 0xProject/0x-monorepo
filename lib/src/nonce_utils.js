"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@0x/utils");
const ethjs = require("ethereumjs-util");
/**
 * Fetch and RLP encode the transaction count (nonce) of an account.
 */
function getRLPEncodedAccountNonceAsync(web3Wrapper, address) {
    return __awaiter(this, void 0, void 0, function* () {
        const nonce = yield web3Wrapper.getAccountNonceAsync(address);
        return rlpEncodeNonce(nonce);
    });
}
exports.getRLPEncodedAccountNonceAsync = getRLPEncodedAccountNonceAsync;
/**
 * RLP encode the transaction count (nonce) of an account.
 */
function rlpEncodeNonce(nonce) {
    if (nonce === 0) {
        return '0x80';
    }
    else if (nonce <= 0x7f) {
        return ethjs.bufferToHex(ethjs.toBuffer(nonce));
    }
    else {
        const rlpNonce = ethjs.toBuffer(nonce);
        return utils_1.hexUtils.concat(rlpNonce.length + 0x80, ethjs.bufferToHex(rlpNonce));
    }
}
exports.rlpEncodeNonce = rlpEncodeNonce;
//# sourceMappingURL=nonce_utils.js.map