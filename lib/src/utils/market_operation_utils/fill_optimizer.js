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
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("@0x/utils");
var constants_1 = require("../../constants");
var ZERO_AMOUNT = constants_1.constants.ZERO_AMOUNT;
/**
 * Class for finding optimized fill paths.
 */
var FillsOptimizer = /** @class */ (function () {
    function FillsOptimizer(runLimit, shouldMinimize) {
        this._currentRunCount = 0;
        this._optimalPath = undefined;
        this._optimalPathAdjustedOutput = ZERO_AMOUNT;
        this._runLimit = runLimit;
        this._shouldMinimize = !!shouldMinimize;
    }
    FillsOptimizer.prototype.optimize = function (fills, input, upperBoundPath) {
        this._currentRunCount = 0;
        this._optimalPath = upperBoundPath;
        this._optimalPathAdjustedOutput = upperBoundPath ? getPathAdjustedOutput(upperBoundPath, input) : ZERO_AMOUNT;
        var ctx = {
            currentPath: [],
            currentPathInput: ZERO_AMOUNT,
            currentPathAdjustedOutput: ZERO_AMOUNT,
            currentPathFlags: 0,
        };
        // Visit all valid combinations of fills to find the optimal path.
        this._walk(fills, input, ctx);
        if (this._optimalPath) {
            return sortFillsByAdjustedRate(this._optimalPath, this._shouldMinimize);
        }
        return undefined;
    };
    FillsOptimizer.prototype._walk = function (fills, input, ctx) {
        var e_1, _a;
        var currentPath = ctx.currentPath, currentPathInput = ctx.currentPathInput, currentPathAdjustedOutput = ctx.currentPathAdjustedOutput, currentPathFlags = ctx.currentPathFlags;
        // Stop if the current path is already complete.
        if (currentPathInput.gte(input)) {
            this._updateOptimalPath(currentPath, currentPathAdjustedOutput);
            return;
        }
        var lastNode = currentPath.length !== 0 ? currentPath[currentPath.length - 1] : undefined;
        var _loop_1 = function (nextFill) {
            // Subsequent fills must be a root node or be preceded by its parent,
            // enforcing contiguous fills.
            if (nextFill.parent && nextFill.parent !== lastNode) {
                return "continue";
            }
            // Stop if we've hit our run limit.
            if (this_1._currentRunCount++ >= this_1._runLimit) {
                return "break";
            }
            var nextPath = __spread(currentPath, [nextFill]);
            var nextPathInput = utils_1.BigNumber.min(input, currentPathInput.plus(nextFill.input));
            var nextPathAdjustedOutput = currentPathAdjustedOutput.plus(getPartialFillOutput(nextFill, nextPathInput.minus(currentPathInput)).minus(nextFill.fillPenalty));
            // tslint:disable-next-line: no-bitwise
            var nextPathFlags = currentPathFlags | nextFill.flags;
            this_1._walk(
            // Filter out incompatible fills.
            // tslint:disable-next-line no-bitwise
            fills.filter(function (f) { return f !== nextFill && (nextPathFlags & f.exclusionMask) === 0; }), input, {
                currentPath: nextPath,
                currentPathInput: nextPathInput,
                currentPathAdjustedOutput: nextPathAdjustedOutput,
                // tslint:disable-next-line: no-bitwise
                currentPathFlags: nextPathFlags,
            });
        };
        var this_1 = this;
        try {
            // Visit next fill candidates.
            for (var fills_1 = __values(fills), fills_1_1 = fills_1.next(); !fills_1_1.done; fills_1_1 = fills_1.next()) {
                var nextFill = fills_1_1.value;
                var state_1 = _loop_1(nextFill);
                if (state_1 === "break")
                    break;
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (fills_1_1 && !fills_1_1.done && (_a = fills_1.return)) _a.call(fills_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
    };
    FillsOptimizer.prototype._updateOptimalPath = function (path, adjustedOutput) {
        if (!this._optimalPath || this._compareOutputs(adjustedOutput, this._optimalPathAdjustedOutput) === 1) {
            this._optimalPath = path;
            this._optimalPathAdjustedOutput = adjustedOutput;
        }
    };
    FillsOptimizer.prototype._compareOutputs = function (a, b) {
        return comparePathOutputs(a, b, this._shouldMinimize);
    };
    return FillsOptimizer;
}());
exports.FillsOptimizer = FillsOptimizer;
/**
 * Compute the total output minus penalty for a fill path, optionally clipping the input
 * to `maxInput`.
 */
function getPathAdjustedOutput(path, maxInput) {
    var e_2, _a;
    var currentInput = ZERO_AMOUNT;
    var currentOutput = ZERO_AMOUNT;
    var currentPenalty = ZERO_AMOUNT;
    try {
        for (var path_1 = __values(path), path_1_1 = path_1.next(); !path_1_1.done; path_1_1 = path_1.next()) {
            var fill = path_1_1.value;
            currentPenalty = currentPenalty.plus(fill.fillPenalty);
            if (maxInput && currentInput.plus(fill.input).gte(maxInput)) {
                var partialInput = maxInput.minus(currentInput);
                currentOutput = currentOutput.plus(getPartialFillOutput(fill, partialInput));
                currentInput = partialInput;
                break;
            }
            else {
                currentInput = currentInput.plus(fill.input);
                currentOutput = currentOutput.plus(fill.output);
            }
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (path_1_1 && !path_1_1.done && (_a = path_1.return)) _a.call(path_1);
        }
        finally { if (e_2) throw e_2.error; }
    }
    return currentOutput.minus(currentPenalty);
}
exports.getPathAdjustedOutput = getPathAdjustedOutput;
/**
 * Compares two rewards, returning -1, 0, or 1
 * if `a` is less than, equal to, or greater than `b`.
 */
function comparePathOutputs(a, b, shouldMinimize) {
    return shouldMinimize ? b.comparedTo(a) : a.comparedTo(b);
}
exports.comparePathOutputs = comparePathOutputs;
// Get the partial output earned by a fill at input `partialInput`.
function getPartialFillOutput(fill, partialInput) {
    return utils_1.BigNumber.min(fill.output, fill.output.div(fill.input).times(partialInput));
}
/**
 * Sort a path by adjusted input -> output rate while keeping sub-fills contiguous.
 */
function sortFillsByAdjustedRate(path, shouldMinimize) {
    if (shouldMinimize === void 0) { shouldMinimize = false; }
    return path.slice(0).sort(function (a, b) {
        var rootA = getFillRoot(a);
        var rootB = getFillRoot(b);
        var adjustedRateA = rootA.output.minus(rootA.fillPenalty).div(rootA.input);
        var adjustedRateB = rootB.output.minus(rootB.fillPenalty).div(rootB.input);
        if ((!a.parent && !b.parent) || a.fillData.source !== b.fillData.source) {
            return shouldMinimize ? adjustedRateA.comparedTo(adjustedRateB) : adjustedRateB.comparedTo(adjustedRateA);
        }
        if (isFillAncestorOf(a, b)) {
            return -1;
        }
        if (isFillAncestorOf(b, a)) {
            return 1;
        }
        return 0;
    });
}
exports.sortFillsByAdjustedRate = sortFillsByAdjustedRate;
function getFillRoot(fill) {
    var root = fill;
    while (root.parent) {
        root = root.parent;
    }
    return root;
}
function isFillAncestorOf(ancestor, fill) {
    var currFill = fill.parent;
    while (currFill) {
        if (currFill === ancestor) {
            return true;
        }
        currFill = currFill.parent;
    }
    return false;
}
//# sourceMappingURL=fill_optimizer.js.map