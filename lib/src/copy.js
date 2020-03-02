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
var e_1, _a, e_2, _b, e_3, _c;
var utils_1 = require("@0x/utils");
var fs = require("fs");
var path = require("path");
var artifacts = require("./index");
var MONOREPO_ROOT = path.join(__dirname, '../../../..');
// HACK (xianny): can't import the root package.json normally because it is outside rootDir of this project
var pkgJson = JSON.parse(fs.readFileSync(path.join(MONOREPO_ROOT, 'package.json')).toString());
var pkgNames = pkgJson.config.contractsPackages.split(' ');
var artifactsToPublish = Object.keys(artifacts);
var contractsDirs = [];
try {
    for (var pkgNames_1 = __values(pkgNames), pkgNames_1_1 = pkgNames_1.next(); !pkgNames_1_1.done; pkgNames_1_1 = pkgNames_1.next()) {
        var pkgName = pkgNames_1_1.value;
        if (!pkgName.startsWith('@0x/contracts-')) {
            throw new Error("Invalid package name: [" + pkgName + "]. Contracts packages must be prefixed with 'contracts-'");
        }
        contractsDirs.push(pkgName.split('/contracts-')[1]);
    }
}
catch (e_1_1) { e_1 = { error: e_1_1 }; }
finally {
    try {
        if (pkgNames_1_1 && !pkgNames_1_1.done && (_a = pkgNames_1.return)) _a.call(pkgNames_1);
    }
    finally { if (e_1) throw e_1.error; }
}
var contractsPath = path.join(MONOREPO_ROOT, 'contracts');
var allArtifactPaths = [];
var _loop_1 = function (dir) {
    var artifactsDir = path.join(contractsPath, dir, 'generated-artifacts');
    if (!fs.existsSync(artifactsDir)) {
        return "continue";
    }
    var artifactPaths = fs
        .readdirSync(artifactsDir)
        .filter(function (artifact) {
        var artifactWithoutExt = artifact.split('.')[0];
        return artifactsToPublish.includes(artifactWithoutExt);
    })
        .map(function (artifact) { return path.join(artifactsDir, artifact); });
    allArtifactPaths.push.apply(allArtifactPaths, __spread(artifactPaths));
};
try {
    for (var contractsDirs_1 = __values(contractsDirs), contractsDirs_1_1 = contractsDirs_1.next(); !contractsDirs_1_1.done; contractsDirs_1_1 = contractsDirs_1.next()) {
        var dir = contractsDirs_1_1.value;
        _loop_1(dir);
    }
}
catch (e_2_1) { e_2 = { error: e_2_1 }; }
finally {
    try {
        if (contractsDirs_1_1 && !contractsDirs_1_1.done && (_b = contractsDirs_1.return)) _b.call(contractsDirs_1);
    }
    finally { if (e_2) throw e_2.error; }
}
if (allArtifactPaths.length < pkgNames.length) {
    throw new Error("Expected " + pkgNames.length + " artifacts, found " + allArtifactPaths.length + ". Please ensure artifacts are present in " + contractsPath + "/**/generated-artifacts");
}
try {
    for (var allArtifactPaths_1 = __values(allArtifactPaths), allArtifactPaths_1_1 = allArtifactPaths_1.next(); !allArtifactPaths_1_1.done; allArtifactPaths_1_1 = allArtifactPaths_1.next()) {
        var _path = allArtifactPaths_1_1.value;
        var fileName = _path.split('/').slice(-1)[0];
        var targetPath = path.join(__dirname, '../../artifacts', fileName);
        fs.copyFileSync(_path, targetPath);
        utils_1.logUtils.log("Copied " + _path);
    }
}
catch (e_3_1) { e_3 = { error: e_3_1 }; }
finally {
    try {
        if (allArtifactPaths_1_1 && !allArtifactPaths_1_1.done && (_c = allArtifactPaths_1.return)) _c.call(allArtifactPaths_1);
    }
    finally { if (e_3) throw e_3.error; }
}
utils_1.logUtils.log("Finished copying contract-artifacts. Remember to transform artifacts before publishing or using abi-gen");
//# sourceMappingURL=copy.js.map