"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const artifacts_1 = require("../artifacts");
exports.abis = _.mapValues(artifacts_1.artifacts, v => v.compilerOutput.abi);
//# sourceMappingURL=abis.js.map