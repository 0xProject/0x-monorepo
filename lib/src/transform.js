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
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("@0x/utils");
var fs = require("fs");
exports.REQUIRED_PROPERTIES = [
    'schemaVersion',
    'contractName',
    'compilerOutput.evm.bytecode.object',
    'compilerOutput.evm.deployedBytecode.object',
    'compilerOutput.abi',
    'compilerOutput.devdoc',
    'compiler',
];
exports.FORBIDDEN_PROPERTIES = [
    'compilerOutput.evm.bytecode.sourceMap',
    'compilerOutput.evm.bytecode.opcodes',
    'compilerOutput.evm.bytecode.linkReferences',
    'compilerOutput.evm.deployedBytecode.sourceMap',
    'compilerOutput.evm.deployedBytecode.opcodes',
    'compilerOutput.evm.deployedBytecode.linkReferences',
    'compilerOutput.evm.assembly',
    'compilerOutput.evm.legacyAssembly',
    'compilerOutput.evm.gasEstimates',
    'compilerOutput.evm.methodIdentifiers',
    'compilerOutput.metadata',
    'compilerOutput.userdoc',
    'compiler.settings.remappings',
    'sourceCodes',
    'sources',
    'sourceTreeHashHex',
];
function removeForbiddenProperties(inputDir, outputDir) {
    var e_1, _a, e_2, _b;
    var filePaths = fs
        .readdirSync(inputDir)
        .filter(function (filename) { return filename.indexOf('.json') !== -1; })
        .map(function (filename) { return "./" + inputDir + "/" + filename; });
    try {
        for (var filePaths_1 = __values(filePaths), filePaths_1_1 = filePaths_1.next(); !filePaths_1_1.done; filePaths_1_1 = filePaths_1.next()) {
            var filePath = filePaths_1_1.value;
            var artifact = JSON.parse(fs.readFileSync(filePath).toString());
            try {
                for (var FORBIDDEN_PROPERTIES_1 = __values(exports.FORBIDDEN_PROPERTIES), FORBIDDEN_PROPERTIES_1_1 = FORBIDDEN_PROPERTIES_1.next(); !FORBIDDEN_PROPERTIES_1_1.done; FORBIDDEN_PROPERTIES_1_1 = FORBIDDEN_PROPERTIES_1.next()) {
                    var property = FORBIDDEN_PROPERTIES_1_1.value;
                    utils_1.deleteNestedProperty(artifact, property);
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (FORBIDDEN_PROPERTIES_1_1 && !FORBIDDEN_PROPERTIES_1_1.done && (_b = FORBIDDEN_PROPERTIES_1.return)) _b.call(FORBIDDEN_PROPERTIES_1);
                }
                finally { if (e_2) throw e_2.error; }
            }
            fs.writeFileSync(filePath.replace(inputDir, outputDir), JSON.stringify(artifact));
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (filePaths_1_1 && !filePaths_1_1.done && (_a = filePaths_1.return)) _a.call(filePaths_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
}
if (require.main === module) {
    var inputDir = process.argv[2];
    var outputDir = process.argv[3] !== undefined ? process.argv[3] : inputDir;
    utils_1.logUtils.log("Deleting forbidden properties from artifacts in " + inputDir + ". Output to " + outputDir);
    if (!fs.existsSync("./" + outputDir)) {
        fs.mkdirSync("./" + outputDir);
    }
    removeForbiddenProperties(inputDir, outputDir);
}
//# sourceMappingURL=transform.js.map