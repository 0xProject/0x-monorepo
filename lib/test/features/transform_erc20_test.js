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
const order_utils_1 = require("@0x/order-utils");
const utils_1 = require("@0x/utils");
const ethjs = require("ethereumjs-util");
const signed_call_data_1 = require("../../src/signed_call_data");
const wrappers_1 = require("../../src/wrappers");
const artifacts_1 = require("../artifacts");
const abis_1 = require("../utils/abis");
const migration_1 = require("../utils/migration");
const wrappers_2 = require("../wrappers");
const { NULL_ADDRESS, NULL_BYTES, NULL_BYTES32 } = contracts_test_utils_1.constants;
contracts_test_utils_1.blockchainTests.resets('TransformERC20 feature', env => {
    const callDataSignerKey = utils_1.hexUtils.random();
    const callDataSigner = ethjs.bufferToHex(ethjs.privateToAddress(ethjs.toBuffer(callDataSignerKey)));
    let owner;
    let taker;
    let sender;
    let transformerDeployer;
    let zeroEx;
    let feature;
    let wallet;
    let allowanceTarget;
    before(() => __awaiter(this, void 0, void 0, function* () {
        [owner, taker, sender, transformerDeployer] = yield env.getAccountAddressesAsync();
        zeroEx = yield migration_1.fullMigrateAsync(owner, env.provider, env.txDefaults, {
            transformERC20: (yield wrappers_1.TransformERC20FeatureContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.TestTransformERC20, env.provider, env.txDefaults, artifacts_1.artifacts)).address,
        }, { transformerDeployer });
        feature = new wrappers_1.TransformERC20FeatureContract(zeroEx.address, env.provider, Object.assign({}, env.txDefaults, { from: sender }), abis_1.abis);
        wallet = new wrappers_2.FlashWalletContract(yield feature.getTransformWallet().callAsync(), env.provider, env.txDefaults);
        allowanceTarget = yield new wrappers_2.ITokenSpenderFeatureContract(zeroEx.address, env.provider, env.txDefaults)
            .getAllowanceTarget()
            .callAsync();
        yield feature.setQuoteSigner(callDataSigner).awaitTransactionSuccessAsync({ from: owner });
    }));
    const { MAX_UINT256, ZERO_AMOUNT } = contracts_test_utils_1.constants;
    describe('wallets', () => {
        it('createTransformWallet() replaces the current wallet', () => __awaiter(this, void 0, void 0, function* () {
            const newWalletAddress = yield feature.createTransformWallet().callAsync({ from: owner });
            contracts_test_utils_1.expect(newWalletAddress).to.not.eq(wallet.address);
            yield feature.createTransformWallet().awaitTransactionSuccessAsync({ from: owner });
            return contracts_test_utils_1.expect(feature.getTransformWallet().callAsync()).to.eventually.eq(newWalletAddress);
        }));
        it('createTransformWallet() cannot be called by non-owner', () => __awaiter(this, void 0, void 0, function* () {
            const notOwner = contracts_test_utils_1.randomAddress();
            const tx = feature.createTransformWallet().callAsync({ from: notOwner });
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.OwnableRevertErrors.OnlyOwnerError(notOwner, owner));
        }));
    });
    describe('transformer deployer', () => {
        it('`getTransformerDeployer()` returns the transformer deployer', () => __awaiter(this, void 0, void 0, function* () {
            const actualDeployer = yield feature.getTransformerDeployer().callAsync();
            contracts_test_utils_1.expect(actualDeployer).to.eq(transformerDeployer);
        }));
        it('owner can set the transformer deployer with `setTransformerDeployer()`', () => __awaiter(this, void 0, void 0, function* () {
            const newDeployer = contracts_test_utils_1.randomAddress();
            const receipt = yield feature
                .setTransformerDeployer(newDeployer)
                .awaitTransactionSuccessAsync({ from: owner });
            contracts_test_utils_1.verifyEventsFromLogs(receipt.logs, [{ transformerDeployer: newDeployer }], wrappers_2.TransformERC20FeatureEvents.TransformerDeployerUpdated);
            const actualDeployer = yield feature.getTransformerDeployer().callAsync();
            contracts_test_utils_1.expect(actualDeployer).to.eq(newDeployer);
        }));
        it('non-owner cannot set the transformer deployer with `setTransformerDeployer()`', () => __awaiter(this, void 0, void 0, function* () {
            const newDeployer = contracts_test_utils_1.randomAddress();
            const notOwner = contracts_test_utils_1.randomAddress();
            const tx = feature.setTransformerDeployer(newDeployer).callAsync({ from: notOwner });
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.OwnableRevertErrors.OnlyOwnerError(notOwner, owner));
        }));
    });
    describe('quote signer', () => {
        it('`getQuoteSigner()` returns the quote signer', () => __awaiter(this, void 0, void 0, function* () {
            const actualSigner = yield feature.getQuoteSigner().callAsync();
            contracts_test_utils_1.expect(actualSigner).to.eq(callDataSigner);
        }));
        it('owner can set the quote signer with `setQuoteSigner()`', () => __awaiter(this, void 0, void 0, function* () {
            const newSigner = contracts_test_utils_1.randomAddress();
            const receipt = yield feature.setQuoteSigner(newSigner).awaitTransactionSuccessAsync({ from: owner });
            contracts_test_utils_1.verifyEventsFromLogs(receipt.logs, [{ quoteSigner: newSigner }], wrappers_2.TransformERC20FeatureEvents.QuoteSignerUpdated);
            const actualSigner = yield feature.getQuoteSigner().callAsync();
            contracts_test_utils_1.expect(actualSigner).to.eq(newSigner);
        }));
        it('non-owner cannot set the quote signer with `setQuoteSigner()`', () => __awaiter(this, void 0, void 0, function* () {
            const newSigner = contracts_test_utils_1.randomAddress();
            const notOwner = contracts_test_utils_1.randomAddress();
            const tx = feature.setQuoteSigner(newSigner).callAsync({ from: notOwner });
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.OwnableRevertErrors.OnlyOwnerError(notOwner, owner));
        }));
    });
    describe('_transformERC20()/transformERC20()', () => {
        let inputToken;
        let outputToken;
        let mintTransformer;
        let transformerNonce;
        before(() => __awaiter(this, void 0, void 0, function* () {
            inputToken = yield wrappers_2.TestMintableERC20TokenContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.TestMintableERC20Token, env.provider, env.txDefaults, artifacts_1.artifacts);
            outputToken = yield wrappers_2.TestMintableERC20TokenContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.TestMintableERC20Token, env.provider, env.txDefaults, artifacts_1.artifacts);
            transformerNonce = yield env.web3Wrapper.getAccountNonceAsync(transformerDeployer);
            mintTransformer = yield wrappers_2.TestMintTokenERC20TransformerContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.TestMintTokenERC20Transformer, env.provider, Object.assign({}, env.txDefaults, { from: transformerDeployer }), artifacts_1.artifacts);
            yield inputToken.approve(allowanceTarget, MAX_UINT256).awaitTransactionSuccessAsync({ from: taker });
        }));
        const transformDataEncoder = utils_1.AbiEncoder.create([
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
        function createMintTokenTransformation(opts = {}) {
            const _opts = Object.assign({ outputTokenAddress: outputToken.address, inputTokenAddress: inputToken.address, inputTokenBurnAmunt: ZERO_AMOUNT, outputTokenMintAmount: ZERO_AMOUNT, outputTokenFeeAmount: ZERO_AMOUNT, transformer: mintTransformer.address, deploymentNonce: transformerNonce }, opts);
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
        describe('_transformERC20()', () => {
            it("succeeds if taker's output token balance increases by exactly minOutputTokenAmount", () => __awaiter(this, void 0, void 0, function* () {
                const startingOutputTokenBalance = contracts_test_utils_1.getRandomInteger(0, '100e18');
                const startingInputTokenBalance = contracts_test_utils_1.getRandomInteger(0, '100e18');
                yield outputToken.mint(taker, startingOutputTokenBalance).awaitTransactionSuccessAsync();
                yield inputToken.mint(taker, startingInputTokenBalance).awaitTransactionSuccessAsync();
                const inputTokenAmount = contracts_test_utils_1.getRandomPortion(startingInputTokenBalance);
                const minOutputTokenAmount = contracts_test_utils_1.getRandomInteger(1, '1e18');
                const outputTokenMintAmount = minOutputTokenAmount;
                const callValue = contracts_test_utils_1.getRandomInteger(1, '1e18');
                const callDataHash = utils_1.hexUtils.random();
                const transformation = createMintTokenTransformation({
                    outputTokenMintAmount,
                    inputTokenBurnAmunt: inputTokenAmount,
                });
                const receipt = yield feature
                    ._transformERC20({
                    taker,
                    inputToken: inputToken.address,
                    outputToken: outputToken.address,
                    inputTokenAmount,
                    minOutputTokenAmount,
                    transformations: [transformation],
                    callDataHash,
                    callDataSignature: NULL_BYTES,
                })
                    .awaitTransactionSuccessAsync({ value: callValue });
                contracts_test_utils_1.verifyEventsFromLogs(receipt.logs, [
                    {
                        taker,
                        inputTokenAmount,
                        outputTokenAmount: outputTokenMintAmount,
                        inputToken: inputToken.address,
                        outputToken: outputToken.address,
                    },
                ], wrappers_2.TransformERC20FeatureEvents.TransformedERC20);
                contracts_test_utils_1.verifyEventsFromLogs(receipt.logs, [
                    {
                        sender,
                        taker,
                        callDataHash: NULL_BYTES32,
                        context: wallet.address,
                        caller: zeroEx.address,
                        data: transformation.data,
                        inputTokenBalance: inputTokenAmount,
                        ethBalance: callValue,
                    },
                ], wrappers_2.TestMintTokenERC20TransformerEvents.MintTransform);
            }));
            it("succeeds if taker's output token balance increases by exactly minOutputTokenAmount, with ETH", () => __awaiter(this, void 0, void 0, function* () {
                const startingInputTokenBalance = contracts_test_utils_1.getRandomInteger(0, '100e18');
                yield inputToken.mint(taker, startingInputTokenBalance).awaitTransactionSuccessAsync();
                const inputTokenAmount = contracts_test_utils_1.getRandomPortion(startingInputTokenBalance);
                const minOutputTokenAmount = contracts_test_utils_1.getRandomInteger(1, '1e18');
                const outputTokenMintAmount = minOutputTokenAmount;
                const callValue = outputTokenMintAmount.times(2);
                const callDataHash = utils_1.hexUtils.random();
                const transformation = createMintTokenTransformation({
                    outputTokenMintAmount,
                    inputTokenBurnAmunt: inputTokenAmount,
                    outputTokenAddress: order_utils_1.ETH_TOKEN_ADDRESS,
                });
                const startingOutputTokenBalance = yield env.web3Wrapper.getBalanceInWeiAsync(taker);
                const receipt = yield feature
                    ._transformERC20({
                    taker,
                    inputToken: inputToken.address,
                    outputToken: order_utils_1.ETH_TOKEN_ADDRESS,
                    inputTokenAmount,
                    minOutputTokenAmount,
                    transformations: [transformation],
                    callDataHash,
                    callDataSignature: NULL_BYTES,
                })
                    .awaitTransactionSuccessAsync({ value: callValue });
                contracts_test_utils_1.verifyEventsFromLogs(receipt.logs, [
                    {
                        taker,
                        inputTokenAmount,
                        outputTokenAmount: outputTokenMintAmount,
                        inputToken: inputToken.address,
                        outputToken: order_utils_1.ETH_TOKEN_ADDRESS,
                    },
                ], wrappers_2.TransformERC20FeatureEvents.TransformedERC20);
                contracts_test_utils_1.verifyEventsFromLogs(receipt.logs, [
                    {
                        taker,
                        sender,
                        callDataHash: NULL_BYTES32,
                        context: wallet.address,
                        caller: zeroEx.address,
                        data: transformation.data,
                        inputTokenBalance: inputTokenAmount,
                        ethBalance: callValue,
                    },
                ], wrappers_2.TestMintTokenERC20TransformerEvents.MintTransform);
                contracts_test_utils_1.expect(yield env.web3Wrapper.getBalanceInWeiAsync(taker)).to.bignumber.eq(startingOutputTokenBalance.plus(outputTokenMintAmount));
            }));
            it("succeeds if taker's output token balance increases by more than minOutputTokenAmount", () => __awaiter(this, void 0, void 0, function* () {
                const startingOutputTokenBalance = contracts_test_utils_1.getRandomInteger(0, '100e18');
                const startingInputTokenBalance = contracts_test_utils_1.getRandomInteger(0, '100e18');
                yield outputToken.mint(taker, startingOutputTokenBalance).awaitTransactionSuccessAsync();
                yield inputToken.mint(taker, startingInputTokenBalance).awaitTransactionSuccessAsync();
                const inputTokenAmount = contracts_test_utils_1.getRandomPortion(startingInputTokenBalance);
                const minOutputTokenAmount = contracts_test_utils_1.getRandomInteger(1, '1e18');
                const outputTokenMintAmount = minOutputTokenAmount.plus(1);
                const callValue = contracts_test_utils_1.getRandomInteger(1, '1e18');
                const callDataHash = utils_1.hexUtils.random();
                const transformation = createMintTokenTransformation({
                    outputTokenMintAmount,
                    inputTokenBurnAmunt: inputTokenAmount,
                });
                const receipt = yield feature
                    ._transformERC20({
                    taker,
                    inputToken: inputToken.address,
                    outputToken: outputToken.address,
                    inputTokenAmount,
                    minOutputTokenAmount,
                    transformations: [transformation],
                    callDataHash,
                    callDataSignature: NULL_BYTES,
                })
                    .awaitTransactionSuccessAsync({ value: callValue });
                contracts_test_utils_1.verifyEventsFromLogs(receipt.logs, [
                    {
                        taker,
                        inputTokenAmount,
                        outputTokenAmount: outputTokenMintAmount,
                        inputToken: inputToken.address,
                        outputToken: outputToken.address,
                    },
                ], wrappers_2.TransformERC20FeatureEvents.TransformedERC20);
                contracts_test_utils_1.verifyEventsFromLogs(receipt.logs, [
                    {
                        sender,
                        taker,
                        callDataHash: NULL_BYTES32,
                        context: wallet.address,
                        caller: zeroEx.address,
                        data: transformation.data,
                        inputTokenBalance: inputTokenAmount,
                        ethBalance: callValue,
                    },
                ], wrappers_2.TestMintTokenERC20TransformerEvents.MintTransform);
            }));
            it("throws if taker's output token balance increases by less than minOutputTokenAmount", () => __awaiter(this, void 0, void 0, function* () {
                const startingOutputTokenBalance = contracts_test_utils_1.getRandomInteger(0, '100e18');
                const startingInputTokenBalance = contracts_test_utils_1.getRandomInteger(0, '100e18');
                yield outputToken.mint(taker, startingOutputTokenBalance).awaitTransactionSuccessAsync();
                yield inputToken.mint(taker, startingInputTokenBalance).awaitTransactionSuccessAsync();
                const inputTokenAmount = contracts_test_utils_1.getRandomPortion(startingInputTokenBalance);
                const minOutputTokenAmount = contracts_test_utils_1.getRandomInteger(1, '1e18');
                const outputTokenMintAmount = minOutputTokenAmount.minus(1);
                const callValue = contracts_test_utils_1.getRandomInteger(1, '1e18');
                const tx = feature
                    ._transformERC20({
                    callDataHash: utils_1.hexUtils.random(),
                    taker,
                    inputToken: inputToken.address,
                    outputToken: outputToken.address,
                    inputTokenAmount,
                    minOutputTokenAmount,
                    callDataSignature: NULL_BYTES,
                    transformations: [
                        createMintTokenTransformation({
                            outputTokenMintAmount,
                            inputTokenBurnAmunt: inputTokenAmount,
                        }),
                    ],
                })
                    .awaitTransactionSuccessAsync({ value: callValue });
                const expectedError = new utils_1.ZeroExRevertErrors.TransformERC20.IncompleteTransformERC20Error(outputToken.address, outputTokenMintAmount, minOutputTokenAmount);
                return contracts_test_utils_1.expect(tx).to.revertWith(expectedError);
            }));
            it("throws if taker's output token balance decreases", () => __awaiter(this, void 0, void 0, function* () {
                const startingOutputTokenBalance = contracts_test_utils_1.getRandomInteger(0, '100e18');
                const startingInputTokenBalance = contracts_test_utils_1.getRandomInteger(0, '100e18');
                yield outputToken.mint(taker, startingOutputTokenBalance).awaitTransactionSuccessAsync();
                yield inputToken.mint(taker, startingInputTokenBalance).awaitTransactionSuccessAsync();
                const inputTokenAmount = contracts_test_utils_1.getRandomPortion(startingInputTokenBalance);
                const minOutputTokenAmount = ZERO_AMOUNT;
                const outputTokenFeeAmount = 1;
                const callValue = contracts_test_utils_1.getRandomInteger(1, '1e18');
                const tx = feature
                    ._transformERC20({
                    callDataHash: utils_1.hexUtils.random(),
                    taker,
                    inputToken: inputToken.address,
                    outputToken: outputToken.address,
                    inputTokenAmount,
                    minOutputTokenAmount,
                    callDataSignature: NULL_BYTES,
                    transformations: [
                        createMintTokenTransformation({
                            outputTokenFeeAmount,
                            inputTokenBurnAmunt: inputTokenAmount,
                        }),
                    ],
                })
                    .awaitTransactionSuccessAsync({ value: callValue });
                const expectedError = new utils_1.ZeroExRevertErrors.TransformERC20.NegativeTransformERC20OutputError(outputToken.address, outputTokenFeeAmount);
                return contracts_test_utils_1.expect(tx).to.revertWith(expectedError);
            }));
            it('can call multiple transformers', () => __awaiter(this, void 0, void 0, function* () {
                const startingOutputTokenBalance = contracts_test_utils_1.getRandomInteger(0, '100e18');
                const startingInputTokenBalance = contracts_test_utils_1.getRandomInteger(2, '100e18');
                yield outputToken.mint(taker, startingOutputTokenBalance).awaitTransactionSuccessAsync();
                yield inputToken.mint(taker, startingInputTokenBalance).awaitTransactionSuccessAsync();
                const inputTokenAmount = contracts_test_utils_1.getRandomPortion(startingInputTokenBalance);
                const minOutputTokenAmount = contracts_test_utils_1.getRandomInteger(2, '1e18');
                const outputTokenMintAmount = minOutputTokenAmount;
                const callValue = contracts_test_utils_1.getRandomInteger(1, '1e18');
                const callDataHash = utils_1.hexUtils.random();
                // Split the total minting between two transformers.
                const transformations = [
                    createMintTokenTransformation({
                        inputTokenBurnAmunt: 1,
                        outputTokenMintAmount: 1,
                    }),
                    createMintTokenTransformation({
                        inputTokenBurnAmunt: inputTokenAmount.minus(1),
                        outputTokenMintAmount: outputTokenMintAmount.minus(1),
                    }),
                ];
                const receipt = yield feature
                    ._transformERC20({
                    taker,
                    inputToken: inputToken.address,
                    outputToken: outputToken.address,
                    inputTokenAmount,
                    minOutputTokenAmount,
                    transformations,
                    callDataHash,
                    callDataSignature: NULL_BYTES,
                })
                    .awaitTransactionSuccessAsync({ value: callValue });
                contracts_test_utils_1.verifyEventsFromLogs(receipt.logs, [
                    {
                        sender,
                        taker,
                        callDataHash: NULL_BYTES32,
                        context: wallet.address,
                        caller: zeroEx.address,
                        data: transformations[0].data,
                        inputTokenBalance: inputTokenAmount,
                        ethBalance: callValue,
                    },
                    {
                        sender,
                        taker,
                        callDataHash: NULL_BYTES32,
                        context: wallet.address,
                        caller: zeroEx.address,
                        data: transformations[1].data,
                        inputTokenBalance: inputTokenAmount.minus(1),
                        ethBalance: callValue,
                    },
                ], wrappers_2.TestMintTokenERC20TransformerEvents.MintTransform);
            }));
            it('fails with invalid transformer nonce', () => __awaiter(this, void 0, void 0, function* () {
                const startingOutputTokenBalance = contracts_test_utils_1.getRandomInteger(0, '100e18');
                const startingInputTokenBalance = contracts_test_utils_1.getRandomInteger(2, '100e18');
                yield outputToken.mint(taker, startingOutputTokenBalance).awaitTransactionSuccessAsync();
                yield inputToken.mint(taker, startingInputTokenBalance).awaitTransactionSuccessAsync();
                const inputTokenAmount = contracts_test_utils_1.getRandomPortion(startingInputTokenBalance);
                const minOutputTokenAmount = contracts_test_utils_1.getRandomInteger(2, '1e18');
                const callValue = contracts_test_utils_1.getRandomInteger(1, '1e18');
                const callDataHash = utils_1.hexUtils.random();
                const transformations = [createMintTokenTransformation({ deploymentNonce: 1337 })];
                const tx = feature
                    ._transformERC20({
                    taker,
                    inputToken: inputToken.address,
                    outputToken: outputToken.address,
                    inputTokenAmount,
                    minOutputTokenAmount,
                    transformations,
                    callDataHash,
                    callDataSignature: NULL_BYTES,
                })
                    .awaitTransactionSuccessAsync({ value: callValue });
                return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.TransformERC20.TransformerFailedError(undefined, transformations[0].data, contracts_test_utils_1.constants.NULL_BYTES));
            }));
            it('passes the calldata hash to transformer with proper signature', () => __awaiter(this, void 0, void 0, function* () {
                const startingOutputTokenBalance = contracts_test_utils_1.getRandomInteger(0, '100e18');
                const startingInputTokenBalance = contracts_test_utils_1.getRandomInteger(0, '100e18');
                yield outputToken.mint(taker, startingOutputTokenBalance).awaitTransactionSuccessAsync();
                yield inputToken.mint(taker, startingInputTokenBalance).awaitTransactionSuccessAsync();
                const inputTokenAmount = contracts_test_utils_1.getRandomPortion(startingInputTokenBalance);
                const minOutputTokenAmount = contracts_test_utils_1.getRandomInteger(1, '1e18');
                const outputTokenMintAmount = minOutputTokenAmount;
                const callValue = contracts_test_utils_1.getRandomInteger(1, '1e18');
                const callDataHash = utils_1.hexUtils.random();
                const transformation = createMintTokenTransformation({
                    outputTokenMintAmount,
                    inputTokenBurnAmunt: inputTokenAmount,
                });
                const receipt = yield feature
                    ._transformERC20({
                    taker,
                    inputToken: inputToken.address,
                    outputToken: outputToken.address,
                    inputTokenAmount,
                    minOutputTokenAmount,
                    transformations: [transformation],
                    callDataHash,
                    callDataSignature: signed_call_data_1.generateCallDataHashSignature(callDataHash, callDataSignerKey),
                })
                    .awaitTransactionSuccessAsync({ value: callValue });
                const { callDataHash: actualCallDataHash } = receipt.logs[0].args;
                contracts_test_utils_1.expect(actualCallDataHash).to.eq(callDataHash);
            }));
            it('passes empty calldata hash to transformer with improper signature', () => __awaiter(this, void 0, void 0, function* () {
                const startingOutputTokenBalance = contracts_test_utils_1.getRandomInteger(0, '100e18');
                const startingInputTokenBalance = contracts_test_utils_1.getRandomInteger(0, '100e18');
                yield outputToken.mint(taker, startingOutputTokenBalance).awaitTransactionSuccessAsync();
                yield inputToken.mint(taker, startingInputTokenBalance).awaitTransactionSuccessAsync();
                const inputTokenAmount = contracts_test_utils_1.getRandomPortion(startingInputTokenBalance);
                const minOutputTokenAmount = contracts_test_utils_1.getRandomInteger(1, '1e18');
                const outputTokenMintAmount = minOutputTokenAmount;
                const callValue = contracts_test_utils_1.getRandomInteger(1, '1e18');
                const callDataHash = utils_1.hexUtils.random();
                const transformation = createMintTokenTransformation({
                    outputTokenMintAmount,
                    inputTokenBurnAmunt: inputTokenAmount,
                });
                const receipt = yield feature
                    ._transformERC20({
                    taker,
                    inputToken: inputToken.address,
                    outputToken: outputToken.address,
                    inputTokenAmount,
                    minOutputTokenAmount,
                    transformations: [transformation],
                    callDataHash,
                    callDataSignature: signed_call_data_1.generateCallDataHashSignature(callDataHash, utils_1.hexUtils.random()),
                })
                    .awaitTransactionSuccessAsync({ value: callValue });
                const { callDataHash: actualCallDataHash } = receipt.logs[0].args;
                contracts_test_utils_1.expect(actualCallDataHash).to.eq(NULL_BYTES32);
            }));
            it('passes empty calldata hash to transformer with no signature', () => __awaiter(this, void 0, void 0, function* () {
                const startingOutputTokenBalance = contracts_test_utils_1.getRandomInteger(0, '100e18');
                const startingInputTokenBalance = contracts_test_utils_1.getRandomInteger(0, '100e18');
                yield outputToken.mint(taker, startingOutputTokenBalance).awaitTransactionSuccessAsync();
                yield inputToken.mint(taker, startingInputTokenBalance).awaitTransactionSuccessAsync();
                const inputTokenAmount = contracts_test_utils_1.getRandomPortion(startingInputTokenBalance);
                const minOutputTokenAmount = contracts_test_utils_1.getRandomInteger(1, '1e18');
                const outputTokenMintAmount = minOutputTokenAmount;
                const callValue = contracts_test_utils_1.getRandomInteger(1, '1e18');
                const callDataHash = utils_1.hexUtils.random();
                const transformation = createMintTokenTransformation({
                    outputTokenMintAmount,
                    inputTokenBurnAmunt: inputTokenAmount,
                });
                const receipt = yield feature
                    ._transformERC20({
                    taker,
                    inputToken: inputToken.address,
                    outputToken: outputToken.address,
                    inputTokenAmount,
                    minOutputTokenAmount,
                    transformations: [transformation],
                    callDataHash,
                    callDataSignature: NULL_BYTES,
                })
                    .awaitTransactionSuccessAsync({ value: callValue });
                const { callDataHash: actualCallDataHash } = receipt.logs[0].args;
                contracts_test_utils_1.expect(actualCallDataHash).to.eq(NULL_BYTES32);
            }));
        });
        describe('transformERC20()', () => {
            it('passes the calldata hash to transformer with properly signed calldata', () => __awaiter(this, void 0, void 0, function* () {
                const startingOutputTokenBalance = contracts_test_utils_1.getRandomInteger(0, '100e18');
                const startingInputTokenBalance = contracts_test_utils_1.getRandomInteger(0, '100e18');
                yield outputToken.mint(taker, startingOutputTokenBalance).awaitTransactionSuccessAsync();
                yield inputToken.mint(taker, startingInputTokenBalance).awaitTransactionSuccessAsync();
                const inputTokenAmount = contracts_test_utils_1.getRandomPortion(startingInputTokenBalance);
                const minOutputTokenAmount = contracts_test_utils_1.getRandomInteger(1, '1e18');
                const outputTokenMintAmount = minOutputTokenAmount;
                const callValue = contracts_test_utils_1.getRandomInteger(1, '1e18');
                const transformation = createMintTokenTransformation({
                    outputTokenMintAmount,
                    inputTokenBurnAmunt: inputTokenAmount,
                });
                const bakedCall = feature.transformERC20(inputToken.address, outputToken.address, inputTokenAmount, minOutputTokenAmount, [transformation]);
                const callData = bakedCall.getABIEncodedTransactionData();
                const signedCallData = signed_call_data_1.signCallData(callData, callDataSignerKey);
                const receipt = yield bakedCall.awaitTransactionSuccessAsync({
                    from: taker,
                    value: callValue,
                    data: signedCallData,
                });
                const { callDataHash: actualCallDataHash } = receipt.logs[0].args;
                contracts_test_utils_1.expect(actualCallDataHash).to.eq(utils_1.hexUtils.hash(callData));
            }));
            it('passes the calldata hash to transformer when no quote signer configured', () => __awaiter(this, void 0, void 0, function* () {
                const startingOutputTokenBalance = contracts_test_utils_1.getRandomInteger(0, '100e18');
                const startingInputTokenBalance = contracts_test_utils_1.getRandomInteger(0, '100e18');
                yield outputToken.mint(taker, startingOutputTokenBalance).awaitTransactionSuccessAsync();
                yield inputToken.mint(taker, startingInputTokenBalance).awaitTransactionSuccessAsync();
                const inputTokenAmount = contracts_test_utils_1.getRandomPortion(startingInputTokenBalance);
                const minOutputTokenAmount = contracts_test_utils_1.getRandomInteger(1, '1e18');
                const outputTokenMintAmount = minOutputTokenAmount;
                const callValue = contracts_test_utils_1.getRandomInteger(1, '1e18');
                const transformation = createMintTokenTransformation({
                    outputTokenMintAmount,
                    inputTokenBurnAmunt: inputTokenAmount,
                });
                const bakedCall = feature.transformERC20(inputToken.address, outputToken.address, inputTokenAmount, minOutputTokenAmount, [transformation]);
                const callData = bakedCall.getABIEncodedTransactionData();
                yield feature.setQuoteSigner(NULL_ADDRESS).awaitTransactionSuccessAsync({ from: owner });
                const receipt = yield bakedCall.awaitTransactionSuccessAsync({
                    from: taker,
                    value: callValue,
                    data: callData,
                });
                const { callDataHash: actualCallDataHash } = receipt.logs[0].args;
                contracts_test_utils_1.expect(actualCallDataHash).to.eq(utils_1.hexUtils.hash(callData));
            }));
            it('passes empty calldata hash to transformer with improperly signed calldata', () => __awaiter(this, void 0, void 0, function* () {
                const startingOutputTokenBalance = contracts_test_utils_1.getRandomInteger(0, '100e18');
                const startingInputTokenBalance = contracts_test_utils_1.getRandomInteger(0, '100e18');
                yield outputToken.mint(taker, startingOutputTokenBalance).awaitTransactionSuccessAsync();
                yield inputToken.mint(taker, startingInputTokenBalance).awaitTransactionSuccessAsync();
                const inputTokenAmount = contracts_test_utils_1.getRandomPortion(startingInputTokenBalance);
                const minOutputTokenAmount = contracts_test_utils_1.getRandomInteger(1, '1e18');
                const outputTokenMintAmount = minOutputTokenAmount;
                const callValue = contracts_test_utils_1.getRandomInteger(1, '1e18');
                const transformation = createMintTokenTransformation({
                    outputTokenMintAmount,
                    inputTokenBurnAmunt: inputTokenAmount,
                });
                const bakedCall = feature.transformERC20(inputToken.address, outputToken.address, inputTokenAmount, minOutputTokenAmount, [transformation]);
                const callData = bakedCall.getABIEncodedTransactionData();
                const signedCallData = signed_call_data_1.signCallData(callData, utils_1.hexUtils.random());
                const receipt = yield bakedCall.awaitTransactionSuccessAsync({
                    from: taker,
                    value: callValue,
                    data: signedCallData,
                });
                const { callDataHash: actualCallDataHash } = receipt.logs[0].args;
                contracts_test_utils_1.expect(actualCallDataHash).to.eq(NULL_BYTES32);
            }));
            it('passes empty calldata hash to transformer with unsigned calldata', () => __awaiter(this, void 0, void 0, function* () {
                const startingOutputTokenBalance = contracts_test_utils_1.getRandomInteger(0, '100e18');
                const startingInputTokenBalance = contracts_test_utils_1.getRandomInteger(0, '100e18');
                yield outputToken.mint(taker, startingOutputTokenBalance).awaitTransactionSuccessAsync();
                yield inputToken.mint(taker, startingInputTokenBalance).awaitTransactionSuccessAsync();
                const inputTokenAmount = contracts_test_utils_1.getRandomPortion(startingInputTokenBalance);
                const minOutputTokenAmount = contracts_test_utils_1.getRandomInteger(1, '1e18');
                const outputTokenMintAmount = minOutputTokenAmount;
                const callValue = contracts_test_utils_1.getRandomInteger(1, '1e18');
                const transformation = createMintTokenTransformation({
                    outputTokenMintAmount,
                    inputTokenBurnAmunt: inputTokenAmount,
                });
                const bakedCall = feature.transformERC20(inputToken.address, outputToken.address, inputTokenAmount, minOutputTokenAmount, [transformation]);
                const callData = bakedCall.getABIEncodedTransactionData();
                const receipt = yield bakedCall.awaitTransactionSuccessAsync({
                    from: taker,
                    value: callValue,
                    data: callData,
                });
                const { callDataHash: actualCallDataHash } = receipt.logs[0].args;
                contracts_test_utils_1.expect(actualCallDataHash).to.eq(NULL_BYTES32);
            }));
            it('passes empty calldata hash to transformer with calldata with malformed signature', () => __awaiter(this, void 0, void 0, function* () {
                const startingOutputTokenBalance = contracts_test_utils_1.getRandomInteger(0, '100e18');
                const startingInputTokenBalance = contracts_test_utils_1.getRandomInteger(0, '100e18');
                yield outputToken.mint(taker, startingOutputTokenBalance).awaitTransactionSuccessAsync();
                yield inputToken.mint(taker, startingInputTokenBalance).awaitTransactionSuccessAsync();
                const inputTokenAmount = contracts_test_utils_1.getRandomPortion(startingInputTokenBalance);
                const minOutputTokenAmount = contracts_test_utils_1.getRandomInteger(1, '1e18');
                const outputTokenMintAmount = minOutputTokenAmount;
                const callValue = contracts_test_utils_1.getRandomInteger(1, '1e18');
                const transformation = createMintTokenTransformation({
                    outputTokenMintAmount,
                    inputTokenBurnAmunt: inputTokenAmount,
                });
                const bakedCall = feature.transformERC20(inputToken.address, outputToken.address, inputTokenAmount, minOutputTokenAmount, [transformation]);
                const callData = bakedCall.getABIEncodedTransactionData();
                const signedCallData = utils_1.hexUtils.concat(utils_1.hexUtils.slice(signed_call_data_1.signCallData(callData, utils_1.hexUtils.random()), 0, -1), 127);
                const receipt = yield bakedCall.awaitTransactionSuccessAsync({
                    from: taker,
                    value: callValue,
                    data: signedCallData,
                });
                const { callDataHash: actualCallDataHash } = receipt.logs[0].args;
                contracts_test_utils_1.expect(actualCallDataHash).to.eq(NULL_BYTES32);
            }));
        });
    });
});
//# sourceMappingURL=transform_erc20_test.js.map