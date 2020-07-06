"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("@0x/utils");
exports.utils = {
    getSignatureTypeIndexIfExists: function (signature) {
        // tslint:disable-next-line:custom-no-magic-numbers
        var signatureTypeHex = signature.slice(-2);
        var base = 16;
        var signatureTypeInt = parseInt(signatureTypeHex, base);
        return signatureTypeInt;
    },
    getCurrentUnixTimestampSec: function () {
        var milisecondsInSecond = 1000;
        return new utils_1.BigNumber(Date.now() / milisecondsInSecond).integerValue();
    },
    getPartialAmountFloor: function (numerator, denominator, target) {
        var fillMakerTokenAmount = numerator
            .multipliedBy(target)
            .div(denominator)
            .integerValue(0);
        return fillMakerTokenAmount;
    },
};
//# sourceMappingURL=utils.js.map