"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var contracts_test_utils_1 = require("@0x/contracts-test-utils");
var utils_1 = require("@0x/utils");
var constants_1 = require("../../src/constants");
var artifacts_1 = require("../artifacts");
var abis_1 = require("../utils/abis");
var migration_1 = require("../utils/migration");
var wrappers_1 = require("../wrappers");
contracts_test_utils_1.blockchainTests.resets('TransformERC20 feature', function (env) {
    var owner;
    var taker;
    var transformerDeployer;
    var zeroEx;
    var feature;
    var wallet;
    var allowanceTarget;
    before(function () { return __awaiter(_this, void 0, void 0, function () {
        var _a, _b, _c, _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0: return [4 /*yield*/, env.getAccountAddressesAsync()];
                case 1:
                    _a = __read.apply(void 0, [_f.sent(), 3]), owner = _a[0], taker = _a[1], transformerDeployer = _a[2];
                    _b = migration_1.fullMigrateAsync;
                    _c = [owner,
                        env.provider,
                        env.txDefaults];
                    _d = {};
                    return [4 /*yield*/, wrappers_1.TransformERC20Contract.deployFrom0xArtifactAsync(artifacts_1.artifacts.TestTransformERC20, env.provider, env.txDefaults, artifacts_1.artifacts)];
                case 2: return [4 /*yield*/, _b.apply(void 0, _c.concat([(_d.transformERC20 = _f.sent(),
                            _d), { transformerDeployer: transformerDeployer }]))];
                case 3:
                    zeroEx = _f.sent();
                    feature = new wrappers_1.TransformERC20Contract(zeroEx.address, env.provider, env.txDefaults, abis_1.abis);
                    _e = wrappers_1.FlashWalletContract.bind;
                    return [4 /*yield*/, feature.getTransformWallet().callAsync()];
                case 4:
                    wallet = new (_e.apply(wrappers_1.FlashWalletContract, [void 0, _f.sent(), env.provider, env.txDefaults]))();
                    return [4 /*yield*/, new wrappers_1.ITokenSpenderContract(zeroEx.address, env.provider, env.txDefaults)
                            .getAllowanceTarget()
                            .callAsync()];
                case 5:
                    allowanceTarget = _f.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    var MAX_UINT256 = contracts_test_utils_1.constants.MAX_UINT256, ZERO_AMOUNT = contracts_test_utils_1.constants.ZERO_AMOUNT;
    describe('wallets', function () {
        it('createTransformWallet() replaces the current wallet', function () { return __awaiter(_this, void 0, void 0, function () {
            var newWalletAddress;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, feature.createTransformWallet().callAsync()];
                    case 1:
                        newWalletAddress = _a.sent();
                        contracts_test_utils_1.expect(newWalletAddress).to.not.eq(wallet.address);
                        return [4 /*yield*/, feature.createTransformWallet().awaitTransactionSuccessAsync()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, contracts_test_utils_1.expect(feature.getTransformWallet().callAsync()).to.eventually.eq(newWalletAddress)];
                }
            });
        }); });
    });
    describe('transformer deployer', function () {
        it('`getTransformerDeployer()` returns the transformer deployer', function () { return __awaiter(_this, void 0, void 0, function () {
            var actualDeployer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, feature.getTransformerDeployer().callAsync()];
                    case 1:
                        actualDeployer = _a.sent();
                        contracts_test_utils_1.expect(actualDeployer).to.eq(transformerDeployer);
                        return [2 /*return*/];
                }
            });
        }); });
        it('owner can set the transformer deployer with `setTransformerDeployer()`', function () { return __awaiter(_this, void 0, void 0, function () {
            var newDeployer, receipt, actualDeployer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        newDeployer = contracts_test_utils_1.randomAddress();
                        return [4 /*yield*/, feature
                                .setTransformerDeployer(newDeployer)
                                .awaitTransactionSuccessAsync({ from: owner })];
                    case 1:
                        receipt = _a.sent();
                        contracts_test_utils_1.verifyEventsFromLogs(receipt.logs, [{ transformerDeployer: newDeployer }], wrappers_1.TransformERC20Events.TransformerDeployerUpdated);
                        return [4 /*yield*/, feature.getTransformerDeployer().callAsync()];
                    case 2:
                        actualDeployer = _a.sent();
                        contracts_test_utils_1.expect(actualDeployer).to.eq(newDeployer);
                        return [2 /*return*/];
                }
            });
        }); });
        it('non-owner cannot set the transformer deployer with `setTransformerDeployer()`', function () { return __awaiter(_this, void 0, void 0, function () {
            var newDeployer, notOwner, tx;
            return __generator(this, function (_a) {
                newDeployer = contracts_test_utils_1.randomAddress();
                notOwner = contracts_test_utils_1.randomAddress();
                tx = feature.setTransformerDeployer(newDeployer).callAsync({ from: notOwner });
                return [2 /*return*/, contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.OwnableRevertErrors.OnlyOwnerError(notOwner, owner))];
            });
        }); });
    });
    describe('_transformERC20()', function () {
        var inputToken;
        var outputToken;
        var mintTransformer;
        var transformerNonce;
        before(function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, wrappers_1.TestMintableERC20TokenContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.TestMintableERC20Token, env.provider, env.txDefaults, artifacts_1.artifacts)];
                    case 1:
                        inputToken = _a.sent();
                        return [4 /*yield*/, wrappers_1.TestMintableERC20TokenContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.TestMintableERC20Token, env.provider, env.txDefaults, artifacts_1.artifacts)];
                    case 2:
                        outputToken = _a.sent();
                        return [4 /*yield*/, env.web3Wrapper.getAccountNonceAsync(transformerDeployer)];
                    case 3:
                        transformerNonce = _a.sent();
                        return [4 /*yield*/, wrappers_1.TestMintTokenERC20TransformerContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.TestMintTokenERC20Transformer, env.provider, __assign({}, env.txDefaults, { from: transformerDeployer }), artifacts_1.artifacts)];
                    case 4:
                        mintTransformer = _a.sent();
                        return [4 /*yield*/, inputToken.approve(allowanceTarget, MAX_UINT256).awaitTransactionSuccessAsync({ from: taker })];
                    case 5:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        var transformDataEncoder = utils_1.AbiEncoder.create([
            {
                name: 'data',
                type: 'tuple',
                components: [
                    { name: 'inputToken', type: 'address' },
                    { name: 'outputToken', type: 'address' },
                    { name: 'burnAmount', type: 'uint256' },
                    { name: 'mintAmount', type: 'uint256' },
                    { name: 'feeAmount', type: 'uint256' },
                ],
            },
        ]);
        function createMintTokenTransformation(opts) {
            if (opts === void 0) { opts = {}; }
            var _opts = __assign({ outputTokenAddress: outputToken.address, inputTokenAddress: inputToken.address, inputTokenBurnAmunt: ZERO_AMOUNT, outputTokenMintAmount: ZERO_AMOUNT, outputTokenFeeAmount: ZERO_AMOUNT, transformer: mintTransformer.address, deploymentNonce: transformerNonce }, opts);
            return {
                deploymentNonce: _opts.deploymentNonce,
                data: transformDataEncoder.encode([
                    {
                        inputToken: _opts.inputTokenAddress,
                        outputToken: _opts.outputTokenAddress,
                        burnAmount: _opts.inputTokenBurnAmunt,
                        mintAmount: _opts.outputTokenMintAmount,
                        feeAmount: _opts.outputTokenFeeAmount,
                    },
                ]),
            };
        }
        it("succeeds if taker's output token balance increases by exactly minOutputTokenAmount", function () { return __awaiter(_this, void 0, void 0, function () {
            var startingOutputTokenBalance, startingInputTokenBalance, inputTokenAmount, minOutputTokenAmount, outputTokenMintAmount, callValue, callDataHash, transformation, receipt;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startingOutputTokenBalance = contracts_test_utils_1.getRandomInteger(0, '100e18');
                        startingInputTokenBalance = contracts_test_utils_1.getRandomInteger(0, '100e18');
                        return [4 /*yield*/, outputToken.mint(taker, startingOutputTokenBalance).awaitTransactionSuccessAsync()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, inputToken.mint(taker, startingInputTokenBalance).awaitTransactionSuccessAsync()];
                    case 2:
                        _a.sent();
                        inputTokenAmount = contracts_test_utils_1.getRandomPortion(startingInputTokenBalance);
                        minOutputTokenAmount = contracts_test_utils_1.getRandomInteger(1, '1e18');
                        outputTokenMintAmount = minOutputTokenAmount;
                        callValue = contracts_test_utils_1.getRandomInteger(1, '1e18');
                        callDataHash = utils_1.hexUtils.random();
                        transformation = createMintTokenTransformation({
                            outputTokenMintAmount: outputTokenMintAmount,
                            inputTokenBurnAmunt: inputTokenAmount,
                        });
                        return [4 /*yield*/, feature
                                ._transformERC20(callDataHash, taker, inputToken.address, outputToken.address, inputTokenAmount, minOutputTokenAmount, [transformation])
                                .awaitTransactionSuccessAsync({ value: callValue })];
                    case 3:
                        receipt = _a.sent();
                        contracts_test_utils_1.verifyEventsFromLogs(receipt.logs, [
                            {
                                taker: taker,
                                inputTokenAmount: inputTokenAmount,
                                outputTokenAmount: outputTokenMintAmount,
                                inputToken: inputToken.address,
                                outputToken: outputToken.address,
                            },
                        ], wrappers_1.TransformERC20Events.TransformedERC20);
                        contracts_test_utils_1.verifyEventsFromLogs(receipt.logs, [
                            {
                                callDataHash: callDataHash,
                                taker: taker,
                                context: wallet.address,
                                caller: zeroEx.address,
                                data: transformation.data,
                                inputTokenBalance: inputTokenAmount,
                                ethBalance: callValue,
                            },
                        ], wrappers_1.TestMintTokenERC20TransformerEvents.MintTransform);
                        return [2 /*return*/];
                }
            });
        }); });
        it("succeeds if taker's output token balance increases by exactly minOutputTokenAmount, with ETH", function () { return __awaiter(_this, void 0, void 0, function () {
            var startingInputTokenBalance, inputTokenAmount, minOutputTokenAmount, outputTokenMintAmount, callValue, callDataHash, transformation, startingOutputTokenBalance, receipt, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        startingInputTokenBalance = contracts_test_utils_1.getRandomInteger(0, '100e18');
                        return [4 /*yield*/, inputToken.mint(taker, startingInputTokenBalance).awaitTransactionSuccessAsync()];
                    case 1:
                        _b.sent();
                        inputTokenAmount = contracts_test_utils_1.getRandomPortion(startingInputTokenBalance);
                        minOutputTokenAmount = contracts_test_utils_1.getRandomInteger(1, '1e18');
                        outputTokenMintAmount = minOutputTokenAmount;
                        callValue = outputTokenMintAmount.times(2);
                        callDataHash = utils_1.hexUtils.random();
                        transformation = createMintTokenTransformation({
                            outputTokenMintAmount: outputTokenMintAmount,
                            inputTokenBurnAmunt: inputTokenAmount,
                            outputTokenAddress: constants_1.ETH_TOKEN_ADDRESS,
                        });
                        return [4 /*yield*/, env.web3Wrapper.getBalanceInWeiAsync(taker)];
                    case 2:
                        startingOutputTokenBalance = _b.sent();
                        return [4 /*yield*/, feature
                                ._transformERC20(callDataHash, taker, inputToken.address, constants_1.ETH_TOKEN_ADDRESS, inputTokenAmount, minOutputTokenAmount, [transformation])
                                .awaitTransactionSuccessAsync({ value: callValue })];
                    case 3:
                        receipt = _b.sent();
                        contracts_test_utils_1.verifyEventsFromLogs(receipt.logs, [
                            {
                                taker: taker,
                                inputTokenAmount: inputTokenAmount,
                                outputTokenAmount: outputTokenMintAmount,
                                inputToken: inputToken.address,
                                outputToken: constants_1.ETH_TOKEN_ADDRESS,
                            },
                        ], wrappers_1.TransformERC20Events.TransformedERC20);
                        contracts_test_utils_1.verifyEventsFromLogs(receipt.logs, [
                            {
                                callDataHash: callDataHash,
                                taker: taker,
                                context: wallet.address,
                                caller: zeroEx.address,
                                data: transformation.data,
                                inputTokenBalance: inputTokenAmount,
                                ethBalance: callValue,
                            },
                        ], wrappers_1.TestMintTokenERC20TransformerEvents.MintTransform);
                        _a = contracts_test_utils_1.expect;
                        return [4 /*yield*/, env.web3Wrapper.getBalanceInWeiAsync(taker)];
                    case 4:
                        _a.apply(void 0, [_b.sent()]).to.bignumber.eq(startingOutputTokenBalance.plus(outputTokenMintAmount));
                        return [2 /*return*/];
                }
            });
        }); });
        it("succeeds if taker's output token balance increases by more than minOutputTokenAmount", function () { return __awaiter(_this, void 0, void 0, function () {
            var startingOutputTokenBalance, startingInputTokenBalance, inputTokenAmount, minOutputTokenAmount, outputTokenMintAmount, callValue, callDataHash, transformation, receipt;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startingOutputTokenBalance = contracts_test_utils_1.getRandomInteger(0, '100e18');
                        startingInputTokenBalance = contracts_test_utils_1.getRandomInteger(0, '100e18');
                        return [4 /*yield*/, outputToken.mint(taker, startingOutputTokenBalance).awaitTransactionSuccessAsync()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, inputToken.mint(taker, startingInputTokenBalance).awaitTransactionSuccessAsync()];
                    case 2:
                        _a.sent();
                        inputTokenAmount = contracts_test_utils_1.getRandomPortion(startingInputTokenBalance);
                        minOutputTokenAmount = contracts_test_utils_1.getRandomInteger(1, '1e18');
                        outputTokenMintAmount = minOutputTokenAmount.plus(1);
                        callValue = contracts_test_utils_1.getRandomInteger(1, '1e18');
                        callDataHash = utils_1.hexUtils.random();
                        transformation = createMintTokenTransformation({
                            outputTokenMintAmount: outputTokenMintAmount,
                            inputTokenBurnAmunt: inputTokenAmount,
                        });
                        return [4 /*yield*/, feature
                                ._transformERC20(callDataHash, taker, inputToken.address, outputToken.address, inputTokenAmount, minOutputTokenAmount, [transformation])
                                .awaitTransactionSuccessAsync({ value: callValue })];
                    case 3:
                        receipt = _a.sent();
                        contracts_test_utils_1.verifyEventsFromLogs(receipt.logs, [
                            {
                                taker: taker,
                                inputTokenAmount: inputTokenAmount,
                                outputTokenAmount: outputTokenMintAmount,
                                inputToken: inputToken.address,
                                outputToken: outputToken.address,
                            },
                        ], wrappers_1.TransformERC20Events.TransformedERC20);
                        contracts_test_utils_1.verifyEventsFromLogs(receipt.logs, [
                            {
                                callDataHash: callDataHash,
                                taker: taker,
                                context: wallet.address,
                                caller: zeroEx.address,
                                data: transformation.data,
                                inputTokenBalance: inputTokenAmount,
                                ethBalance: callValue,
                            },
                        ], wrappers_1.TestMintTokenERC20TransformerEvents.MintTransform);
                        return [2 /*return*/];
                }
            });
        }); });
        it("throws if taker's output token balance increases by less than minOutputTokenAmount", function () { return __awaiter(_this, void 0, void 0, function () {
            var startingOutputTokenBalance, startingInputTokenBalance, inputTokenAmount, minOutputTokenAmount, outputTokenMintAmount, callValue, tx, expectedError;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startingOutputTokenBalance = contracts_test_utils_1.getRandomInteger(0, '100e18');
                        startingInputTokenBalance = contracts_test_utils_1.getRandomInteger(0, '100e18');
                        return [4 /*yield*/, outputToken.mint(taker, startingOutputTokenBalance).awaitTransactionSuccessAsync()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, inputToken.mint(taker, startingInputTokenBalance).awaitTransactionSuccessAsync()];
                    case 2:
                        _a.sent();
                        inputTokenAmount = contracts_test_utils_1.getRandomPortion(startingInputTokenBalance);
                        minOutputTokenAmount = contracts_test_utils_1.getRandomInteger(1, '1e18');
                        outputTokenMintAmount = minOutputTokenAmount.minus(1);
                        callValue = contracts_test_utils_1.getRandomInteger(1, '1e18');
                        tx = feature
                            ._transformERC20(utils_1.hexUtils.random(), taker, inputToken.address, outputToken.address, inputTokenAmount, minOutputTokenAmount, [
                            createMintTokenTransformation({
                                outputTokenMintAmount: outputTokenMintAmount,
                                inputTokenBurnAmunt: inputTokenAmount,
                            }),
                        ])
                            .awaitTransactionSuccessAsync({ value: callValue });
                        expectedError = new utils_1.ZeroExRevertErrors.TransformERC20.IncompleteTransformERC20Error(outputToken.address, outputTokenMintAmount, minOutputTokenAmount);
                        return [2 /*return*/, contracts_test_utils_1.expect(tx).to.revertWith(expectedError)];
                }
            });
        }); });
        it("throws if taker's output token balance decreases", function () { return __awaiter(_this, void 0, void 0, function () {
            var startingOutputTokenBalance, startingInputTokenBalance, inputTokenAmount, minOutputTokenAmount, outputTokenFeeAmount, callValue, tx, expectedError;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startingOutputTokenBalance = contracts_test_utils_1.getRandomInteger(0, '100e18');
                        startingInputTokenBalance = contracts_test_utils_1.getRandomInteger(0, '100e18');
                        return [4 /*yield*/, outputToken.mint(taker, startingOutputTokenBalance).awaitTransactionSuccessAsync()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, inputToken.mint(taker, startingInputTokenBalance).awaitTransactionSuccessAsync()];
                    case 2:
                        _a.sent();
                        inputTokenAmount = contracts_test_utils_1.getRandomPortion(startingInputTokenBalance);
                        minOutputTokenAmount = ZERO_AMOUNT;
                        outputTokenFeeAmount = 1;
                        callValue = contracts_test_utils_1.getRandomInteger(1, '1e18');
                        tx = feature
                            ._transformERC20(utils_1.hexUtils.random(), taker, inputToken.address, outputToken.address, inputTokenAmount, minOutputTokenAmount, [
                            createMintTokenTransformation({
                                outputTokenFeeAmount: outputTokenFeeAmount,
                                inputTokenBurnAmunt: inputTokenAmount,
                            }),
                        ])
                            .awaitTransactionSuccessAsync({ value: callValue });
                        expectedError = new utils_1.ZeroExRevertErrors.TransformERC20.NegativeTransformERC20OutputError(outputToken.address, outputTokenFeeAmount);
                        return [2 /*return*/, contracts_test_utils_1.expect(tx).to.revertWith(expectedError)];
                }
            });
        }); });
        it('can call multiple transformers', function () { return __awaiter(_this, void 0, void 0, function () {
            var startingOutputTokenBalance, startingInputTokenBalance, inputTokenAmount, minOutputTokenAmount, outputTokenMintAmount, callValue, callDataHash, transformations, receipt;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startingOutputTokenBalance = contracts_test_utils_1.getRandomInteger(0, '100e18');
                        startingInputTokenBalance = contracts_test_utils_1.getRandomInteger(2, '100e18');
                        return [4 /*yield*/, outputToken.mint(taker, startingOutputTokenBalance).awaitTransactionSuccessAsync()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, inputToken.mint(taker, startingInputTokenBalance).awaitTransactionSuccessAsync()];
                    case 2:
                        _a.sent();
                        inputTokenAmount = contracts_test_utils_1.getRandomPortion(startingInputTokenBalance);
                        minOutputTokenAmount = contracts_test_utils_1.getRandomInteger(2, '1e18');
                        outputTokenMintAmount = minOutputTokenAmount;
                        callValue = contracts_test_utils_1.getRandomInteger(1, '1e18');
                        callDataHash = utils_1.hexUtils.random();
                        transformations = [
                            createMintTokenTransformation({
                                inputTokenBurnAmunt: 1,
                                outputTokenMintAmount: 1,
                            }),
                            createMintTokenTransformation({
                                inputTokenBurnAmunt: inputTokenAmount.minus(1),
                                outputTokenMintAmount: outputTokenMintAmount.minus(1),
                            }),
                        ];
                        return [4 /*yield*/, feature
                                ._transformERC20(callDataHash, taker, inputToken.address, outputToken.address, inputTokenAmount, minOutputTokenAmount, transformations)
                                .awaitTransactionSuccessAsync({ value: callValue })];
                    case 3:
                        receipt = _a.sent();
                        contracts_test_utils_1.verifyEventsFromLogs(receipt.logs, [
                            {
                                callDataHash: callDataHash,
                                taker: taker,
                                context: wallet.address,
                                caller: zeroEx.address,
                                data: transformations[0].data,
                                inputTokenBalance: inputTokenAmount,
                                ethBalance: callValue,
                            },
                            {
                                callDataHash: callDataHash,
                                taker: taker,
                                context: wallet.address,
                                caller: zeroEx.address,
                                data: transformations[1].data,
                                inputTokenBalance: inputTokenAmount.minus(1),
                                ethBalance: callValue,
                            },
                        ], wrappers_1.TestMintTokenERC20TransformerEvents.MintTransform);
                        return [2 /*return*/];
                }
            });
        }); });
        it('fails with invalid transformer nonce', function () { return __awaiter(_this, void 0, void 0, function () {
            var startingOutputTokenBalance, startingInputTokenBalance, inputTokenAmount, minOutputTokenAmount, callValue, callDataHash, transformations, tx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startingOutputTokenBalance = contracts_test_utils_1.getRandomInteger(0, '100e18');
                        startingInputTokenBalance = contracts_test_utils_1.getRandomInteger(2, '100e18');
                        return [4 /*yield*/, outputToken.mint(taker, startingOutputTokenBalance).awaitTransactionSuccessAsync()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, inputToken.mint(taker, startingInputTokenBalance).awaitTransactionSuccessAsync()];
                    case 2:
                        _a.sent();
                        inputTokenAmount = contracts_test_utils_1.getRandomPortion(startingInputTokenBalance);
                        minOutputTokenAmount = contracts_test_utils_1.getRandomInteger(2, '1e18');
                        callValue = contracts_test_utils_1.getRandomInteger(1, '1e18');
                        callDataHash = utils_1.hexUtils.random();
                        transformations = [createMintTokenTransformation({ deploymentNonce: 1337 })];
                        tx = feature
                            ._transformERC20(callDataHash, taker, inputToken.address, outputToken.address, inputTokenAmount, minOutputTokenAmount, transformations)
                            .awaitTransactionSuccessAsync({ value: callValue });
                        return [2 /*return*/, contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.TransformERC20.TransformerFailedError(undefined, transformations[0].data, contracts_test_utils_1.constants.NULL_BYTES))];
                }
            });
        }); });
    });
});
//# sourceMappingURL=transform_erc20_test.js.map