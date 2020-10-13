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
const contracts_test_utils_1 = require("@0x/contracts-test-utils");
const fs_1 = require("fs");
const path_1 = require("path");
const util_1 = require("util");
contracts_test_utils_1.describe('Storage ID uniqueness test', () => {
    const STORAGE_SOURCES_DIR = path_1.resolve(__dirname, '../../contracts/src/storage');
    function findStorageIdFromSourceFileAsync(path) {
        return __awaiter(this, void 0, void 0, function* () {
            const contents = yield util_1.promisify(fs_1.readFile)(path, { encoding: 'utf-8' });
            const m = /LibStorage\.\s*getStorageOffset\(\s*LibStorage\.\s*StorageId\.\s*(\w+)\s*\)/m.exec(contents);
            if (m) {
                return m[1];
            }
        });
    }
    it('all StorageId references are unique in storage libraries', () => __awaiter(this, void 0, void 0, function* () {
        const sourcePaths = (yield util_1.promisify(fs_1.readdir)(STORAGE_SOURCES_DIR))
            .filter(p => p.endsWith('.sol'))
            .map(p => path_1.resolve(STORAGE_SOURCES_DIR, p));
        const storageIds = (yield Promise.all(sourcePaths.map((p) => __awaiter(this, void 0, void 0, function* () { return findStorageIdFromSourceFileAsync(p); })))).filter(id => !!id);
        for (let i = 0; i < storageIds.length; ++i) {
            const storageId = storageIds[i];
            for (let j = 0; j < storageIds.length; ++j) {
                if (i !== j && storageId === storageIds[j]) {
                    throw new Error(`Found duplicate StorageId ${storageId} ` +
                        `in files ${path_1.basename(sourcePaths[i])}, ${path_1.basename(sourcePaths[j])}`);
                }
            }
        }
    }));
});
//# sourceMappingURL=storage_uniqueness_test.js.map