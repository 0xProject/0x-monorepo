"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
var chai = require("chai");
var lodash_1 = require("lodash");
require("mocha");
var artifacts = require("../src/index");
var transform_1 = require("../src/transform");
var expect = chai.expect;
// For pure functions, we use local EVM execution in `@0x/base-contract` instead
// of making an eth_call. This requires the `deployedBytecode` from compiler output.
var CONTRACTS_WITH_PURE_FNS = [
    // 'Coordinator', // missing deployedBytecode
    'DevUtils',
    'ERC1155Proxy',
    'ERC20Proxy',
    'ERC721Proxy',
    'IAssetProxy',
    'MultiAssetProxy',
    'StaticCallProxy',
];
describe('Contract Artifacts', function () {
    it('should not include forbidden attributes', function () {
        var e_1, _a, e_2, _b;
        var forbiddenPropertiesByArtifact = {};
        try {
            for (var _c = __values(Object.entries(artifacts)), _d = _c.next(); !_d.done; _d = _c.next()) {
                var _e = __read(_d.value, 2), artifactName = _e[0], artifact = _e[1];
                try {
                    for (var FORBIDDEN_PROPERTIES_1 = __values(transform_1.FORBIDDEN_PROPERTIES), FORBIDDEN_PROPERTIES_1_1 = FORBIDDEN_PROPERTIES_1.next(); !FORBIDDEN_PROPERTIES_1_1.done; FORBIDDEN_PROPERTIES_1_1 = FORBIDDEN_PROPERTIES_1.next()) {
                        var forbiddenProperty = FORBIDDEN_PROPERTIES_1_1.value;
                        var rejectedValue = lodash_1.get(artifact, forbiddenProperty);
                        if (rejectedValue) {
                            var previousForbidden = forbiddenPropertiesByArtifact[artifactName];
                            forbiddenPropertiesByArtifact[artifactName] = previousForbidden
                                ? __spread(previousForbidden, [forbiddenProperty]) : [forbiddenProperty];
                        }
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (FORBIDDEN_PROPERTIES_1_1 && !FORBIDDEN_PROPERTIES_1_1.done && (_b = FORBIDDEN_PROPERTIES_1.return)) _b.call(FORBIDDEN_PROPERTIES_1);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_1) throw e_1.error; }
        }
        expect(forbiddenPropertiesByArtifact).to.eql({});
    });
    it('should include all required attributes', function () {
        var e_3, _a, e_4, _b;
        var missingRequiredPropertiesByArtifact = {};
        try {
            for (var _c = __values(Object.entries(artifacts)), _d = _c.next(); !_d.done; _d = _c.next()) {
                var _e = __read(_d.value, 2), artifactName = _e[0], artifact = _e[1];
                try {
                    for (var REQUIRED_PROPERTIES_1 = __values(transform_1.REQUIRED_PROPERTIES), REQUIRED_PROPERTIES_1_1 = REQUIRED_PROPERTIES_1.next(); !REQUIRED_PROPERTIES_1_1.done; REQUIRED_PROPERTIES_1_1 = REQUIRED_PROPERTIES_1.next()) {
                        var requiredProperty = REQUIRED_PROPERTIES_1_1.value;
                        // HACK (xianny): Remove after `compiler` field is added in v3.
                        if (requiredProperty === 'compiler' && artifact.schemaVersion === '2.0.0') {
                            continue;
                        }
                        if (requiredProperty === 'compilerOutput.evm.deployedBytecode.object') {
                            if (!CONTRACTS_WITH_PURE_FNS.includes(artifactName)) {
                                continue;
                            }
                        }
                        var requiredValue = lodash_1.get(artifact, requiredProperty);
                        if (requiredValue === undefined || requiredValue === '') {
                            var previousMissing = missingRequiredPropertiesByArtifact[artifactName];
                            missingRequiredPropertiesByArtifact[artifactName] = previousMissing
                                ? __spread(previousMissing, [requiredProperty]) : [requiredProperty];
                        }
                    }
                }
                catch (e_4_1) { e_4 = { error: e_4_1 }; }
                finally {
                    try {
                        if (REQUIRED_PROPERTIES_1_1 && !REQUIRED_PROPERTIES_1_1.done && (_b = REQUIRED_PROPERTIES_1.return)) _b.call(REQUIRED_PROPERTIES_1);
                    }
                    finally { if (e_4) throw e_4.error; }
                }
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_3) throw e_3.error; }
        }
        expect(missingRequiredPropertiesByArtifact).to.eql({});
    });
});
//# sourceMappingURL=contract_artifacts_test.js.map