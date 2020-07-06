"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
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
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var assert_1 = require("@0x/assert");
var types_1 = require("@0x/types");
var utils_1 = require("@0x/utils");
var chai = require("chai");
var ethUtil = require("ethereumjs-util");
var _ = require("lodash");
require("mocha");
var src_1 = require("../src");
var constants_1 = require("../src/constants");
var order_hash_utils_1 = require("../src/order_hash_utils");
var signature_utils_1 = require("../src/signature_utils");
var transaction_hash_utils_1 = require("../src/transaction_hash_utils");
var chai_setup_1 = require("./utils/chai_setup");
var web3_wrapper_1 = require("./utils/web3_wrapper");
chai_setup_1.chaiSetup.configure();
var expect = chai.expect;
describe('Signature utils', function () {
    var makerAddress;
    var fakeExchangeContractAddress = '0x1dc4c1cefef38a777b15aa20260a54e584b16c48';
    var fakeChainId = 1337;
    var order;
    var transaction;
    before(function () { return __awaiter(_this, void 0, void 0, function () {
        var availableAddreses;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, web3_wrapper_1.web3Wrapper.getAvailableAddressesAsync()];
                case 1:
                    availableAddreses = _a.sent();
                    makerAddress = availableAddreses[0];
                    order = {
                        makerAddress: makerAddress,
                        takerAddress: constants_1.constants.NULL_ADDRESS,
                        senderAddress: constants_1.constants.NULL_ADDRESS,
                        feeRecipientAddress: constants_1.constants.NULL_ADDRESS,
                        makerAssetData: constants_1.constants.NULL_ADDRESS,
                        takerAssetData: constants_1.constants.NULL_ADDRESS,
                        makerFeeAssetData: constants_1.constants.NULL_ADDRESS,
                        takerFeeAssetData: constants_1.constants.NULL_ADDRESS,
                        salt: new utils_1.BigNumber(0),
                        makerFee: new utils_1.BigNumber(0),
                        takerFee: new utils_1.BigNumber(0),
                        makerAssetAmount: new utils_1.BigNumber(0),
                        takerAssetAmount: new utils_1.BigNumber(0),
                        expirationTimeSeconds: new utils_1.BigNumber(0),
                        exchangeAddress: fakeExchangeContractAddress,
                        chainId: fakeChainId,
                    };
                    transaction = {
                        domain: {
                            verifyingContract: fakeExchangeContractAddress,
                            chainId: fakeChainId,
                        },
                        salt: src_1.generatePseudoRandomSalt(),
                        signerAddress: makerAddress,
                        data: '0x6927e990021d23b1eb7b8789f6a6feaf98fe104bb0cf8259421b79f9a34222b0',
                        expirationTimeSeconds: new utils_1.BigNumber(0),
                        gasPrice: new utils_1.BigNumber(0),
                    };
                    return [2 /*return*/];
            }
        });
    }); });
    describe('#isValidECSignature', function () {
        var signature = {
            v: 27,
            r: '0xaca7da997ad177f040240cdccf6905b71ab16b74434388c3a72f34fd25d64393',
            s: '0x46b2bac274ff29b48b3ea6e2d04c1336eaceafda3c53ab483fc3ff12fac3ebf2',
        };
        var data = '0x47173285a8d7341e5e972fc677286384f802f8ef42a5ec5f03bbfa254cb01fad';
        var address = '0x0e5cb767cce09a7f3ca594df118aa519be5e2b5a';
        it("should return false if the data doesn't pertain to the signature & address", function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                expect(signature_utils_1.isValidECSignature('0x0', signature, address)).to.be.false();
                return [2 /*return*/];
            });
        }); });
        it("should return false if the address doesn't pertain to the signature & data", function () { return __awaiter(_this, void 0, void 0, function () {
            var validUnrelatedAddress;
            return __generator(this, function (_a) {
                validUnrelatedAddress = '0x8b0292b11a196601ed2ce54b665cafeca0347d42';
                expect(signature_utils_1.isValidECSignature(data, signature, validUnrelatedAddress)).to.be.false();
                return [2 /*return*/];
            });
        }); });
        it("should return false if the signature doesn't pertain to the data & address", function () { return __awaiter(_this, void 0, void 0, function () {
            var wrongSignature;
            return __generator(this, function (_a) {
                wrongSignature = _.assign({}, signature, { v: 28 });
                expect(signature_utils_1.isValidECSignature(data, wrongSignature, address)).to.be.false();
                return [2 /*return*/];
            });
        }); });
        it('should return true if the signature does pertain to the data & address', function () { return __awaiter(_this, void 0, void 0, function () {
            var isValidSignatureLocal;
            return __generator(this, function (_a) {
                isValidSignatureLocal = signature_utils_1.isValidECSignature(data, signature, address);
                expect(isValidSignatureLocal).to.be.true();
                return [2 /*return*/];
            });
        }); });
    });
    describe('#generateSalt', function () {
        it('generates different salts', function () {
            var isEqual = src_1.generatePseudoRandomSalt().eq(src_1.generatePseudoRandomSalt());
            expect(isEqual).to.be.false();
        });
        it('generates salt in range [0..2^256)', function () {
            var salt = src_1.generatePseudoRandomSalt();
            expect(salt.isGreaterThanOrEqualTo(0)).to.be.true();
            // tslint:disable-next-line:custom-no-magic-numbers
            var twoPow256 = new utils_1.BigNumber(2).pow(256);
            expect(salt.isLessThan(twoPow256)).to.be.true();
        });
    });
    describe('#parseValidatorSignature', function () {
        var ethSignSignature = '0x1c3582f06356a1314dbf1c0e534c4d8e92e59b056ee607a7ff5a825f5f2cc5e6151c5cc7fdd420f5608e4d5bef108e42ad90c7a4b408caef32e24374cf387b0d7603';
        var validatorAddress = '0x63ac26ad9477d6be19a5fabe394bcc4886057c53';
        var signature = "" + ethSignSignature + validatorAddress.substr(2) + "05";
        it('throws if signature type is not Validator type signature', function () {
            expect(signature_utils_1.signatureUtils.parseValidatorSignature.bind(null, ethSignSignature)).to.throw('Unexpected signatureType: 3. Valid signature types: 5');
        });
        it('extracts signature and validator address', function () {
            var validatorSignature = signature_utils_1.signatureUtils.parseValidatorSignature(signature);
            expect(validatorSignature.validatorAddress).to.equal(validatorAddress);
            expect(validatorSignature.signature).to.equal(ethSignSignature);
        });
    });
    describe('#ecSignOrderAsync', function () {
        it('should default to eth_sign if eth_signTypedData is unavailable', function () { return __awaiter(_this, void 0, void 0, function () {
            var expectedSignature, fakeProvider, signedOrder;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        expectedSignature = '0x1bea7883d76c4d8d0cd5915ec613f8dedf3b5f03e6a1f74aa171e700b0becdc8b47ade1ede08a5496ff31e34715bc6ac5da5aba709d3d8989a48127c18ef2f56d503';
                        fakeProvider = {
                            sendAsync: function (payload, callback) {
                                return __awaiter(this, void 0, void 0, function () {
                                    var _a, address, message, signature;
                                    return __generator(this, function (_b) {
                                        switch (_b.label) {
                                            case 0:
                                                if (!(payload.method === 'eth_signTypedData')) return [3 /*break*/, 1];
                                                callback(new Error('Internal RPC Error'));
                                                return [3 /*break*/, 4];
                                            case 1:
                                                if (!(payload.method === 'eth_sign')) return [3 /*break*/, 3];
                                                _a = __read(payload.params, 2), address = _a[0], message = _a[1];
                                                return [4 /*yield*/, web3_wrapper_1.web3Wrapper.signMessageAsync(address, message)];
                                            case 2:
                                                signature = _b.sent();
                                                callback(null, {
                                                    id: 42,
                                                    jsonrpc: '2.0',
                                                    result: signature,
                                                });
                                                return [3 /*break*/, 4];
                                            case 3:
                                                callback(null, { id: 42, jsonrpc: '2.0', result: [makerAddress] });
                                                _b.label = 4;
                                            case 4: return [2 /*return*/];
                                        }
                                    });
                                });
                            },
                        };
                        return [4 /*yield*/, signature_utils_1.signatureUtils.ecSignOrderAsync(fakeProvider, order, makerAddress)];
                    case 1:
                        signedOrder = _a.sent();
                        expect(signedOrder.signature).to.equal(expectedSignature);
                        return [2 /*return*/];
                }
            });
        }); });
        it('should throw if the user denies the signing request', function () { return __awaiter(_this, void 0, void 0, function () {
            var fakeProvider;
            return __generator(this, function (_a) {
                fakeProvider = {
                    sendAsync: function (payload, callback) {
                        return __awaiter(this, void 0, void 0, function () {
                            var _a, address, message, signature;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        if (!(payload.method === 'eth_signTypedData')) return [3 /*break*/, 1];
                                        callback(new Error('User denied message signature'));
                                        return [3 /*break*/, 4];
                                    case 1:
                                        if (!(payload.method === 'eth_sign')) return [3 /*break*/, 3];
                                        _a = __read(payload.params, 2), address = _a[0], message = _a[1];
                                        return [4 /*yield*/, web3_wrapper_1.web3Wrapper.signMessageAsync(address, message)];
                                    case 2:
                                        signature = _b.sent();
                                        callback(null, {
                                            id: 42,
                                            jsonrpc: '2.0',
                                            result: signature,
                                        });
                                        return [3 /*break*/, 4];
                                    case 3:
                                        callback(null, { id: 42, jsonrpc: '2.0', result: [makerAddress] });
                                        _b.label = 4;
                                    case 4: return [2 /*return*/];
                                }
                            });
                        });
                    },
                };
                expect(signature_utils_1.signatureUtils.ecSignOrderAsync(fakeProvider, order, makerAddress)).to.to.be.rejectedWith('User denied message signature');
                return [2 /*return*/];
            });
        }); });
    });
    describe('#ecSignTransactionAsync', function () {
        it('should default to eth_sign if eth_signTypedData is unavailable', function () { return __awaiter(_this, void 0, void 0, function () {
            var fakeProvider, signedTransaction;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        fakeProvider = {
                            sendAsync: function (payload, callback) {
                                return __awaiter(this, void 0, void 0, function () {
                                    var _a, address, message, signature;
                                    return __generator(this, function (_b) {
                                        switch (_b.label) {
                                            case 0:
                                                if (!(payload.method === 'eth_signTypedData')) return [3 /*break*/, 1];
                                                callback(new Error('Internal RPC Error'));
                                                return [3 /*break*/, 4];
                                            case 1:
                                                if (!(payload.method === 'eth_sign')) return [3 /*break*/, 3];
                                                _a = __read(payload.params, 2), address = _a[0], message = _a[1];
                                                return [4 /*yield*/, web3_wrapper_1.web3Wrapper.signMessageAsync(address, message)];
                                            case 2:
                                                signature = _b.sent();
                                                callback(null, {
                                                    id: 42,
                                                    jsonrpc: '2.0',
                                                    result: signature,
                                                });
                                                return [3 /*break*/, 4];
                                            case 3:
                                                callback(null, { id: 42, jsonrpc: '2.0', result: [makerAddress] });
                                                _b.label = 4;
                                            case 4: return [2 /*return*/];
                                        }
                                    });
                                });
                            },
                        };
                        return [4 /*yield*/, signature_utils_1.signatureUtils.ecSignTransactionAsync(fakeProvider, transaction, makerAddress)];
                    case 1:
                        signedTransaction = _a.sent();
                        assert_1.assert.isHexString('signedTransaction.signature', signedTransaction.signature);
                        return [2 /*return*/];
                }
            });
        }); });
        it('should throw if the user denies the signing request', function () { return __awaiter(_this, void 0, void 0, function () {
            var fakeProvider;
            return __generator(this, function (_a) {
                fakeProvider = {
                    sendAsync: function (payload, callback) {
                        return __awaiter(this, void 0, void 0, function () {
                            var _a, address, message, signature;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        if (!(payload.method === 'eth_signTypedData')) return [3 /*break*/, 1];
                                        callback(new Error('User denied message signature'));
                                        return [3 /*break*/, 4];
                                    case 1:
                                        if (!(payload.method === 'eth_sign')) return [3 /*break*/, 3];
                                        _a = __read(payload.params, 2), address = _a[0], message = _a[1];
                                        return [4 /*yield*/, web3_wrapper_1.web3Wrapper.signMessageAsync(address, message)];
                                    case 2:
                                        signature = _b.sent();
                                        callback(null, {
                                            id: 42,
                                            jsonrpc: '2.0',
                                            result: signature,
                                        });
                                        return [3 /*break*/, 4];
                                    case 3:
                                        callback(null, { id: 42, jsonrpc: '2.0', result: [makerAddress] });
                                        _b.label = 4;
                                    case 4: return [2 /*return*/];
                                }
                            });
                        });
                    },
                };
                expect(signature_utils_1.signatureUtils.ecSignTransactionAsync(fakeProvider, transaction, makerAddress)).to.to.be.rejectedWith('User denied message signature');
                return [2 /*return*/];
            });
        }); });
    });
    describe('#ecSignHashAsync', function () {
        before(function () { return __awaiter(_this, void 0, void 0, function () {
            var availableAddreses;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, web3_wrapper_1.web3Wrapper.getAvailableAddressesAsync()];
                    case 1:
                        availableAddreses = _a.sent();
                        makerAddress = availableAddreses[0];
                        return [2 /*return*/];
                }
            });
        }); });
        it('should return the correct Signature', function () { return __awaiter(_this, void 0, void 0, function () {
            var orderHash, expectedSignature, ecSignature;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        orderHash = '0x6927e990021d23b1eb7b8789f6a6feaf98fe104bb0cf8259421b79f9a34222b0';
                        expectedSignature = '0x1b61a3ed31b43c8780e905a260a35faefcc527be7516aa11c0256729b5b351bc3340349190569279751135161d22529dc25add4f6069af05be04cacbda2ace225403';
                        return [4 /*yield*/, signature_utils_1.signatureUtils.ecSignHashAsync(web3_wrapper_1.provider, orderHash, makerAddress)];
                    case 1:
                        ecSignature = _a.sent();
                        expect(ecSignature).to.equal(expectedSignature);
                        return [2 /*return*/];
                }
            });
        }); });
        it('should return the correct Signature for signatureHex concatenated as R + S + V', function () { return __awaiter(_this, void 0, void 0, function () {
            var orderHash, expectedSignature, fakeProvider, ecSignature;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        orderHash = '0x34decbedc118904df65f379a175bb39ca18209d6ce41d5ed549d54e6e0a95004';
                        expectedSignature = '0x1b117902c86dfb95fe0d1badd983ee166ad259b27acb220174cbb4460d872871137feabdfe76e05924b484789f79af4ee7fa29ec006cedce1bbf369320d034e10b03';
                        fakeProvider = {
                            sendAsync: function (payload, callback) {
                                return __awaiter(this, void 0, void 0, function () {
                                    var _a, address, message, signature, rsvHex;
                                    return __generator(this, function (_b) {
                                        switch (_b.label) {
                                            case 0:
                                                if (!(payload.method === 'eth_sign')) return [3 /*break*/, 2];
                                                _a = __read(payload.params, 2), address = _a[0], message = _a[1];
                                                expect(message).to.equal(orderHash);
                                                return [4 /*yield*/, web3_wrapper_1.web3Wrapper.signMessageAsync(address, message)];
                                            case 1:
                                                signature = _b.sent();
                                                rsvHex = "0x" + signature.substr(130) + signature.substr(2, 128);
                                                callback(null, {
                                                    id: 42,
                                                    jsonrpc: '2.0',
                                                    result: rsvHex,
                                                });
                                                return [3 /*break*/, 3];
                                            case 2:
                                                callback(null, { id: 42, jsonrpc: '2.0', result: [makerAddress] });
                                                _b.label = 3;
                                            case 3: return [2 /*return*/];
                                        }
                                    });
                                });
                            },
                        };
                        return [4 /*yield*/, signature_utils_1.signatureUtils.ecSignHashAsync(fakeProvider, orderHash, makerAddress)];
                    case 1:
                        ecSignature = _a.sent();
                        expect(ecSignature).to.equal(expectedSignature);
                        return [2 /*return*/];
                }
            });
        }); });
        it('should return the correct Signature for signatureHex concatenated as V + R + S', function () { return __awaiter(_this, void 0, void 0, function () {
            var orderHash, expectedSignature, fakeProvider, ecSignature;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        orderHash = '0x34decbedc118904df65f379a175bb39ca18209d6ce41d5ed549d54e6e0a95004';
                        expectedSignature = '0x1b117902c86dfb95fe0d1badd983ee166ad259b27acb220174cbb4460d872871137feabdfe76e05924b484789f79af4ee7fa29ec006cedce1bbf369320d034e10b03';
                        fakeProvider = {
                            sendAsync: function (payload, callback) {
                                return __awaiter(this, void 0, void 0, function () {
                                    var _a, address, message, signature;
                                    return __generator(this, function (_b) {
                                        switch (_b.label) {
                                            case 0:
                                                if (!(payload.method === 'eth_sign')) return [3 /*break*/, 2];
                                                _a = __read(payload.params, 2), address = _a[0], message = _a[1];
                                                return [4 /*yield*/, web3_wrapper_1.web3Wrapper.signMessageAsync(address, message)];
                                            case 1:
                                                signature = _b.sent();
                                                callback(null, {
                                                    id: 42,
                                                    jsonrpc: '2.0',
                                                    result: signature,
                                                });
                                                return [3 /*break*/, 3];
                                            case 2:
                                                callback(null, { id: 42, jsonrpc: '2.0', result: [makerAddress] });
                                                _b.label = 3;
                                            case 3: return [2 /*return*/];
                                        }
                                    });
                                });
                            },
                        };
                        return [4 /*yield*/, signature_utils_1.signatureUtils.ecSignHashAsync(fakeProvider, orderHash, makerAddress)];
                    case 1:
                        ecSignature = _a.sent();
                        expect(ecSignature).to.equal(expectedSignature);
                        return [2 /*return*/];
                }
            });
        }); });
        it('should return a valid signature', function () { return __awaiter(_this, void 0, void 0, function () {
            var expectedSignature, orderHash, ecSignature;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        expectedSignature = '0x1b117902c86dfb95fe0d1badd983ee166ad259b27acb220174cbb4460d872871137feabdfe76e05924b484789f79af4ee7fa29ec006cedce1bbf369320d034e10b03';
                        orderHash = '0x34decbedc118904df65f379a175bb39ca18209d6ce41d5ed549d54e6e0a95004';
                        return [4 /*yield*/, signature_utils_1.signatureUtils.ecSignHashAsync(web3_wrapper_1.provider, orderHash, makerAddress)];
                    case 1:
                        ecSignature = _a.sent();
                        expect(ecSignature).to.equal(expectedSignature);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('#ecSignTypedDataOrderAsync', function () {
        it('should result in the same signature as signing the order hash without an ethereum message prefix', function () { return __awaiter(_this, void 0, void 0, function () {
            var orderHashHex, sig, signatureBuffer, signatureHex, signedOrder;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        orderHashHex = order_hash_utils_1.orderHashUtils.getOrderHash(order);
                        sig = ethUtil.ecsign(ethUtil.toBuffer(orderHashHex), Buffer.from('F2F48EE19680706196E2E339E5DA3491186E0C4C5030670656B0E0164837257D', 'hex'));
                        signatureBuffer = Buffer.concat([
                            ethUtil.toBuffer(sig.v),
                            ethUtil.toBuffer(sig.r),
                            ethUtil.toBuffer(sig.s),
                            ethUtil.toBuffer(types_1.SignatureType.EIP712),
                        ]);
                        signatureHex = "0x" + signatureBuffer.toString('hex');
                        return [4 /*yield*/, signature_utils_1.signatureUtils.ecSignTypedDataOrderAsync(web3_wrapper_1.provider, order, makerAddress)];
                    case 1:
                        signedOrder = _a.sent();
                        expect(signatureHex).to.eq(signedOrder.signature);
                        return [2 /*return*/];
                }
            });
        }); });
        it('should return the correct signature for signatureHex concatenated as R + S + V', function () { return __awaiter(_this, void 0, void 0, function () {
            var expectedSignature, fakeProvider, signedOrder;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        expectedSignature = '0x1b65b7b6205a4511cc81ec8f1b3eb475b398d60985089a3041c74735109f207e99542c7f0f81b0a988317e89b8280ec72829c8532a04c376f1f1236589c911545002';
                        fakeProvider = {
                            sendAsync: function (payload, callback) {
                                return __awaiter(this, void 0, void 0, function () {
                                    var _a, address, typedData, signature;
                                    return __generator(this, function (_b) {
                                        switch (_b.label) {
                                            case 0:
                                                if (!(payload.method === 'eth_signTypedData')) return [3 /*break*/, 2];
                                                _a = __read(payload.params, 2), address = _a[0], typedData = _a[1];
                                                return [4 /*yield*/, web3_wrapper_1.web3Wrapper.signTypedDataAsync(address, typedData)];
                                            case 1:
                                                signature = _b.sent();
                                                callback(null, {
                                                    id: 42,
                                                    jsonrpc: '2.0',
                                                    result: signature,
                                                });
                                                return [3 /*break*/, 3];
                                            case 2:
                                                callback(null, { id: 42, jsonrpc: '2.0', result: [makerAddress] });
                                                _b.label = 3;
                                            case 3: return [2 /*return*/];
                                        }
                                    });
                                });
                            },
                        };
                        return [4 /*yield*/, signature_utils_1.signatureUtils.ecSignTypedDataOrderAsync(fakeProvider, order, makerAddress)];
                    case 1:
                        signedOrder = _a.sent();
                        expect(signedOrder.signature).to.equal(expectedSignature);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('#ecSignTypedDataTransactionAsync', function () {
        it('should result in the same signature as signing the order hash without an ethereum message prefix', function () { return __awaiter(_this, void 0, void 0, function () {
            var transactionHashHex, sig, signatureBuffer, signatureHex, signedTransaction;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        transactionHashHex = transaction_hash_utils_1.transactionHashUtils.getTransactionHash(transaction);
                        sig = ethUtil.ecsign(ethUtil.toBuffer(transactionHashHex), Buffer.from('F2F48EE19680706196E2E339E5DA3491186E0C4C5030670656B0E0164837257D', 'hex'));
                        signatureBuffer = Buffer.concat([
                            ethUtil.toBuffer(sig.v),
                            ethUtil.toBuffer(sig.r),
                            ethUtil.toBuffer(sig.s),
                            ethUtil.toBuffer(types_1.SignatureType.EIP712),
                        ]);
                        signatureHex = "0x" + signatureBuffer.toString('hex');
                        return [4 /*yield*/, signature_utils_1.signatureUtils.ecSignTypedDataTransactionAsync(web3_wrapper_1.provider, transaction, makerAddress)];
                    case 1:
                        signedTransaction = _a.sent();
                        expect(signatureHex).to.eq(signedTransaction.signature);
                        return [2 /*return*/];
                }
            });
        }); });
        it('should return the correct Signature for signatureHex concatenated as R + S + V', function () { return __awaiter(_this, void 0, void 0, function () {
            var fakeProvider, signedTransaction;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        fakeProvider = {
                            sendAsync: function (payload, callback) {
                                return __awaiter(this, void 0, void 0, function () {
                                    var _a, address, typedData, signature;
                                    return __generator(this, function (_b) {
                                        switch (_b.label) {
                                            case 0:
                                                if (!(payload.method === 'eth_signTypedData')) return [3 /*break*/, 2];
                                                _a = __read(payload.params, 2), address = _a[0], typedData = _a[1];
                                                return [4 /*yield*/, web3_wrapper_1.web3Wrapper.signTypedDataAsync(address, typedData)];
                                            case 1:
                                                signature = _b.sent();
                                                callback(null, {
                                                    id: 42,
                                                    jsonrpc: '2.0',
                                                    result: signature,
                                                });
                                                return [3 /*break*/, 3];
                                            case 2:
                                                callback(null, { id: 42, jsonrpc: '2.0', result: [makerAddress] });
                                                _b.label = 3;
                                            case 3: return [2 /*return*/];
                                        }
                                    });
                                });
                            },
                        };
                        return [4 /*yield*/, signature_utils_1.signatureUtils.ecSignTypedDataTransactionAsync(fakeProvider, transaction, makerAddress)];
                    case 1:
                        signedTransaction = _a.sent();
                        assert_1.assert.isHexString('signedTransaction.signature', signedTransaction.signature);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('#convertECSignatureToSignatureHex', function () {
        var ecSignature = {
            v: 27,
            r: '0xaca7da997ad177f040240cdccf6905b71ab16b74434388c3a72f34fd25d64393',
            s: '0x46b2bac274ff29b48b3ea6e2d04c1336eaceafda3c53ab483fc3ff12fac3ebf2',
        };
        it('should concatenate v,r,s and append the EthSign signature type', function () { return __awaiter(_this, void 0, void 0, function () {
            var expectedSignatureWithSignatureType, signatureWithSignatureType;
            return __generator(this, function (_a) {
                expectedSignatureWithSignatureType = '0x1baca7da997ad177f040240cdccf6905b71ab16b74434388c3a72f34fd25d6439346b2bac274ff29b48b3ea6e2d04c1336eaceafda3c53ab483fc3ff12fac3ebf203';
                signatureWithSignatureType = signature_utils_1.signatureUtils.convertECSignatureToSignatureHex(ecSignature);
                expect(signatureWithSignatureType).to.equal(expectedSignatureWithSignatureType);
                return [2 /*return*/];
            });
        }); });
    });
});
//# sourceMappingURL=signature_utils_test.js.map