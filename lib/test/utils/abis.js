"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
var artifacts_1 = require("../artifacts");
exports.abis = _.mapValues(artifacts_1.artifacts, function (v) { return v.compilerOutput.abi; });
//# sourceMappingURL=abis.js.map