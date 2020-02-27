"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var types_1 = require("./types");
/**
 * Error class representing insufficient asset liquidity
 */
var InsufficientAssetLiquidityError = /** @class */ (function (_super) {
    __extends(InsufficientAssetLiquidityError, _super);
    /**
     * @param amountAvailableToFill The amount availabe to fill (in base units) factoring in slippage
     */
    function InsufficientAssetLiquidityError(amountAvailableToFill) {
        var _this = _super.call(this, types_1.SwapQuoterError.InsufficientAssetLiquidity) || this;
        _this.amountAvailableToFill = amountAvailableToFill;
        // Setting prototype so instanceof works.  See https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(_this, InsufficientAssetLiquidityError.prototype);
        return _this;
    }
    return InsufficientAssetLiquidityError;
}(Error));
exports.InsufficientAssetLiquidityError = InsufficientAssetLiquidityError;
//# sourceMappingURL=errors.js.map