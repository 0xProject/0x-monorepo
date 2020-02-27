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
Object.defineProperty(exports, "__esModule", { value: true });
var dev_utils_1 = require("@0x/dev-utils");
var order_utils_1 = require("@0x/order-utils");
var utils_1 = require("@0x/utils");
var chai = require("chai");
require("mocha");
var utils_2 = require("../src/utils/utils");
var chai_setup_1 = require("./utils/chai_setup");
chai_setup_1.chaiSetup.configure();
var expect = chai.expect;
describe('utils', function () {
    describe('isAssetDataEquivalent', function () {
        describe('ERC20', function () {
            var _a = __read(dev_utils_1.tokenUtils.getDummyERC20TokenAddresses(), 2), tokenA = _a[0], tokenB = _a[1];
            it('should succeed ERC20 to be ERC20Bridge', function () {
                var isEquivalent = utils_2.utils.isAssetDataEquivalent(order_utils_1.assetDataUtils.encodeERC20AssetData(tokenA), order_utils_1.assetDataUtils.encodeERC20BridgeAssetData(tokenA, utils_1.NULL_ADDRESS, utils_1.NULL_BYTES));
                expect(isEquivalent).to.be.true();
            });
            it('should succeed ERC20Bridge to be ERC20', function () {
                var isEquivalent = utils_2.utils.isAssetDataEquivalent(order_utils_1.assetDataUtils.encodeERC20BridgeAssetData(tokenA, utils_1.NULL_ADDRESS, utils_1.NULL_BYTES), order_utils_1.assetDataUtils.encodeERC20AssetData(tokenA));
                expect(isEquivalent).to.be.true();
            });
            it('should succeed ERC20 to be ERC20', function () {
                var isEquivalent = utils_2.utils.isAssetDataEquivalent(order_utils_1.assetDataUtils.encodeERC20AssetData(tokenA), order_utils_1.assetDataUtils.encodeERC20AssetData(tokenA));
                expect(isEquivalent).to.be.true();
            });
            it('should fail if ERC20Bridge is not the same ERC20 token', function () {
                var isEquivalent = utils_2.utils.isAssetDataEquivalent(order_utils_1.assetDataUtils.encodeERC20AssetData(tokenA), order_utils_1.assetDataUtils.encodeERC20BridgeAssetData(tokenB, utils_1.NULL_ADDRESS, utils_1.NULL_BYTES));
                expect(isEquivalent).to.be.false();
            });
            it('should fail if ERC20 is not the same ERC20 token', function () {
                var isEquivalent = utils_2.utils.isAssetDataEquivalent(order_utils_1.assetDataUtils.encodeERC20AssetData(tokenA), order_utils_1.assetDataUtils.encodeERC20AssetData(tokenB));
                expect(isEquivalent).to.be.false();
            });
        });
        describe('ERC721', function () {
            var _a = __read(dev_utils_1.tokenUtils.getDummyERC20TokenAddresses(), 2), tokenA = _a[0], tokenB = _a[1];
            var tokenIdA = new utils_1.BigNumber(1);
            var tokenIdB = new utils_1.BigNumber(2);
            it('should succeed if ERC721 the same ERC721 token and id', function () {
                var isEquivalent = utils_2.utils.isAssetDataEquivalent(order_utils_1.assetDataUtils.encodeERC721AssetData(tokenA, tokenIdA), order_utils_1.assetDataUtils.encodeERC721AssetData(tokenA, tokenIdA));
                expect(isEquivalent).to.be.true();
            });
            it('should fail if ERC721 is not the same ERC721 token', function () {
                var isEquivalent = utils_2.utils.isAssetDataEquivalent(order_utils_1.assetDataUtils.encodeERC721AssetData(tokenA, tokenIdA), order_utils_1.assetDataUtils.encodeERC721AssetData(tokenB, tokenIdA));
                expect(isEquivalent).to.be.false();
            });
            it('should fail if ERC721 is not the same ERC721 id', function () {
                var isEquivalent = utils_2.utils.isAssetDataEquivalent(order_utils_1.assetDataUtils.encodeERC721AssetData(tokenA, tokenIdA), order_utils_1.assetDataUtils.encodeERC721AssetData(tokenA, tokenIdB));
                expect(isEquivalent).to.be.false();
            });
            it('should fail if ERC721 is compared with ERC20', function () {
                var isEquivalent = utils_2.utils.isAssetDataEquivalent(order_utils_1.assetDataUtils.encodeERC721AssetData(tokenA, tokenIdA), order_utils_1.assetDataUtils.encodeERC20AssetData(tokenA));
                expect(isEquivalent).to.be.false();
            });
        });
        describe('ERC1155', function () {
            var _a = __read(dev_utils_1.tokenUtils.getDummyERC20TokenAddresses(), 2), tokenA = _a[0], tokenB = _a[1];
            var tokenIdA = new utils_1.BigNumber(1);
            var tokenIdB = new utils_1.BigNumber(2);
            var valueA = new utils_1.BigNumber(1);
            var valueB = new utils_1.BigNumber(2);
            it('should succeed if ERC1155 is the same ERC1155 token and id', function () {
                var isEquivalent = utils_2.utils.isAssetDataEquivalent(order_utils_1.assetDataUtils.encodeERC1155AssetData(tokenA, [tokenIdA], [valueA], utils_1.NULL_BYTES), order_utils_1.assetDataUtils.encodeERC1155AssetData(tokenA, [tokenIdA], [valueA], utils_1.NULL_BYTES));
                expect(isEquivalent).to.be.true();
            });
            it('should succeed if ERC1155 is the same ERC1155 token and ids', function () {
                var isEquivalent = utils_2.utils.isAssetDataEquivalent(order_utils_1.assetDataUtils.encodeERC1155AssetData(tokenA, [tokenIdA, tokenIdB], [valueA, valueB], utils_1.NULL_BYTES), order_utils_1.assetDataUtils.encodeERC1155AssetData(tokenA, [tokenIdA, tokenIdB], [valueA, valueB], utils_1.NULL_BYTES));
                expect(isEquivalent).to.be.true();
            });
            it('should succeed if ERC1155 is the same ERC1155 token and ids in different orders', function () {
                var isEquivalent = utils_2.utils.isAssetDataEquivalent(order_utils_1.assetDataUtils.encodeERC1155AssetData(tokenA, [tokenIdB, tokenIdA], [valueB, valueA], utils_1.NULL_BYTES), order_utils_1.assetDataUtils.encodeERC1155AssetData(tokenA, [tokenIdA, tokenIdB], [valueA, valueB], utils_1.NULL_BYTES));
                expect(isEquivalent).to.be.true();
            });
            it('should succeed if ERC1155 is the same ERC1155 token and ids with different callback data', function () {
                var isEquivalent = utils_2.utils.isAssetDataEquivalent(order_utils_1.assetDataUtils.encodeERC1155AssetData(tokenA, [tokenIdB, tokenIdA], [valueB, valueA], utils_1.NULL_BYTES), order_utils_1.assetDataUtils.encodeERC1155AssetData(tokenA, [tokenIdA, tokenIdB], [valueA, valueB], tokenA));
                expect(isEquivalent).to.be.true();
            });
            it('should fail if ERC1155 contains different ids', function () {
                var isEquivalent = utils_2.utils.isAssetDataEquivalent(order_utils_1.assetDataUtils.encodeERC1155AssetData(tokenA, [tokenIdB, tokenIdA], [valueB, valueA], utils_1.NULL_BYTES), order_utils_1.assetDataUtils.encodeERC1155AssetData(tokenB, [tokenIdA], [valueB], utils_1.NULL_BYTES));
                expect(isEquivalent).to.be.false();
            });
            it('should fail if ERC1155 is a different ERC1155 token', function () {
                var isEquivalent = utils_2.utils.isAssetDataEquivalent(order_utils_1.assetDataUtils.encodeERC1155AssetData(tokenA, [tokenIdB, tokenIdA], [valueB, valueA], utils_1.NULL_BYTES), order_utils_1.assetDataUtils.encodeERC1155AssetData(tokenB, [tokenIdA, tokenIdB], [valueA, valueB], utils_1.NULL_BYTES));
                expect(isEquivalent).to.be.false();
            });
            it('should fail if expected ERC1155 has different callback data', function () {
                var isEquivalent = utils_2.utils.isAssetDataEquivalent(order_utils_1.assetDataUtils.encodeERC1155AssetData(tokenA, [tokenIdB, tokenIdA], [valueB, valueA], tokenA), order_utils_1.assetDataUtils.encodeERC1155AssetData(tokenA, [tokenIdA, tokenIdB], [valueA, valueB], utils_1.NULL_BYTES));
                expect(isEquivalent).to.be.false();
            });
        });
    });
});
//# sourceMappingURL=utils_test.js.map