"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("@0x/utils");
var web3_wrapper_1 = require("@0x/web3-wrapper");
var TOKEN_DECIMALS = 18;
// tslint:disable:custom-no-magic-numbers
exports.baseUnitAmount = function (unitAmount, decimals) {
    if (decimals === void 0) { decimals = TOKEN_DECIMALS; }
    return web3_wrapper_1.Web3Wrapper.toBaseUnitAmount(new utils_1.BigNumber(unitAmount), decimals);
};
//# sourceMappingURL=utils.js.map