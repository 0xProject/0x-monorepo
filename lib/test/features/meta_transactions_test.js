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
const _ = require("lodash");
const signed_call_data_1 = require("../../src/signed_call_data");
const wrappers_1 = require("../../src/wrappers");
const artifacts_1 = require("../artifacts");
const abis_1 = require("../utils/abis");
const migration_1 = require("../utils/migration");
const wrappers_2 = require("../wrappers");
const { NULL_ADDRESS, NULL_BYTES, ZERO_AMOUNT } = contracts_test_utils_1.constants;
contracts_test_utils_1.blockchainTests.resets('MetaTransactions feature', env => {
    let owner;
    let sender;
    let signers;
    let zeroEx;
    let feature;
    let feeToken;
    let transformERC20Feature;
    let allowanceTarget;
    const MAX_FEE_AMOUNT = new utils_1.BigNumber('1e18');
    const TRANSFORM_ERC20_FAILING_VALUE = new utils_1.BigNumber(666);
    const TRANSFORM_ERC20_REENTER_VALUE = new utils_1.BigNumber(777);
    const TRANSFORM_ERC20_BATCH_REENTER_VALUE = new utils_1.BigNumber(888);
    const REENTRANCY_FLAG_MTX = 0x1;
    before(() => __awaiter(this, void 0, void 0, function* () {
        [owner, sender, ...signers] = yield env.getAccountAddressesAsync();
        transformERC20Feature = yield wrappers_2.TestMetaTransactionsTransformERC20FeatureContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.TestMetaTransactionsTransformERC20Feature, env.provider, env.txDefaults, {});
        zeroEx = yield migration_1.fullMigrateAsync(owner, env.provider, env.txDefaults, {
            transformERC20: transformERC20Feature.address,
        });
        feature = new wrappers_1.MetaTransactionsFeatureContract(zeroEx.address, env.provider, Object.assign({}, env.txDefaults, { from: sender }), abis_1.abis);
        feeToken = yield wrappers_2.TestMintableERC20TokenContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.TestMintableERC20Token, env.provider, env.txDefaults, {});
        allowanceTarget = yield new wrappers_2.ITokenSpenderFeatureContract(zeroEx.address, env.provider, env.txDefaults)
            .getAllowanceTarget()
            .callAsync();
        // Fund signers with fee tokens.
        yield Promise.all(signers.map((signer) => __awaiter(this, void 0, void 0, function* () {
            yield feeToken.mint(signer, MAX_FEE_AMOUNT).awaitTransactionSuccessAsync();
            yield feeToken.approve(allowanceTarget, MAX_FEE_AMOUNT).awaitTransactionSuccessAsync({ from: signer });
        })));
    }));
    function getRandomMetaTransaction(fields = {}) {
        return Object.assign({ signer: _.sampleSize(signers)[0], sender, minGasPrice: contracts_test_utils_1.getRandomInteger('2', '1e9'), maxGasPrice: contracts_test_utils_1.getRandomInteger('1e9', '100e9'), expirationTimeSeconds: new utils_1.BigNumber(Math.floor(_.now() / 1000) + 360), salt: new utils_1.BigNumber(utils_1.hexUtils.random()), callData: utils_1.hexUtils.random(4), value: contracts_test_utils_1.getRandomInteger(1, '1e18'), feeToken: feeToken.address, feeAmount: contracts_test_utils_1.getRandomInteger(1, MAX_FEE_AMOUNT), domain: {
                chainId: 1,
                verifyingContract: zeroEx.address,
            } }, fields);
    }
    function signMetaTransactionAsync(mtx, signer) {
        return __awaiter(this, void 0, void 0, function* () {
            return order_utils_1.signatureUtils.ecSignHashAsync(env.provider, order_utils_1.getExchangeProxyMetaTransactionHash(mtx), signer || mtx.signer);
        });
    }
    describe('getMetaTransactionHash()', () => {
        it('generates the correct hash', () => __awaiter(this, void 0, void 0, function* () {
            const mtx = getRandomMetaTransaction();
            const expected = order_utils_1.getExchangeProxyMetaTransactionHash(mtx);
            const actual = yield feature.getMetaTransactionHash(mtx).callAsync();
            contracts_test_utils_1.expect(actual).to.eq(expected);
        }));
    });
    function getRandomTransformERC20Args(fields = {}) {
        return Object.assign({ inputToken: contracts_test_utils_1.randomAddress(), outputToken: contracts_test_utils_1.randomAddress(), inputTokenAmount: contracts_test_utils_1.getRandomInteger(1, '1e18'), minOutputTokenAmount: contracts_test_utils_1.getRandomInteger(1, '1e18'), transformations: [{ deploymentNonce: new utils_1.BigNumber(123), data: utils_1.hexUtils.random() }] }, fields);
    }
    const RAW_SUCCESS_RESULT = utils_1.hexUtils.leftPad(1337);
    describe('executeMetaTransaction()', () => {
        it('can call `TransformERC20.transformERC20()`', () => __awaiter(this, void 0, void 0, function* () {
            const args = getRandomTransformERC20Args();
            const mtx = getRandomMetaTransaction({
                callData: transformERC20Feature
                    .transformERC20(args.inputToken, args.outputToken, args.inputTokenAmount, args.minOutputTokenAmount, args.transformations)
                    .getABIEncodedTransactionData(),
            });
            const signature = yield signMetaTransactionAsync(mtx);
            const callOpts = {
                gasPrice: mtx.minGasPrice,
                value: mtx.value,
            };
            const rawResult = yield feature.executeMetaTransaction(mtx, signature).callAsync(callOpts);
            contracts_test_utils_1.expect(rawResult).to.eq(RAW_SUCCESS_RESULT);
            const receipt = yield feature.executeMetaTransaction(mtx, signature).awaitTransactionSuccessAsync(callOpts);
            contracts_test_utils_1.verifyEventsFromLogs(receipt.logs, [
                {
                    inputToken: args.inputToken,
                    outputToken: args.outputToken,
                    inputTokenAmount: args.inputTokenAmount,
                    minOutputTokenAmount: args.minOutputTokenAmount,
                    transformations: args.transformations,
                    sender: zeroEx.address,
                    value: mtx.value,
                    callDataHash: utils_1.hexUtils.hash(mtx.callData),
                    taker: mtx.signer,
                    callDataSignature: NULL_BYTES,
                },
            ], wrappers_2.TestMetaTransactionsTransformERC20FeatureEvents.TransformERC20Called);
        }));
        it('can call `TransformERC20.transformERC20()` with signed calldata', () => __awaiter(this, void 0, void 0, function* () {
            const args = getRandomTransformERC20Args();
            const callData = transformERC20Feature
                .transformERC20(args.inputToken, args.outputToken, args.inputTokenAmount, args.minOutputTokenAmount, args.transformations)
                .getABIEncodedTransactionData();
            const callDataSignerKey = utils_1.hexUtils.random();
            const callDataSignature = signed_call_data_1.generateCallDataSignature(callData, callDataSignerKey);
            const signedCallData = signed_call_data_1.signCallData(callData, callDataSignerKey);
            const mtx = getRandomMetaTransaction({ callData: signedCallData });
            const signature = yield signMetaTransactionAsync(mtx);
            const callOpts = {
                gasPrice: mtx.minGasPrice,
                value: mtx.value,
            };
            const rawResult = yield feature.executeMetaTransaction(mtx, signature).callAsync(callOpts);
            contracts_test_utils_1.expect(rawResult).to.eq(RAW_SUCCESS_RESULT);
            const receipt = yield feature.executeMetaTransaction(mtx, signature).awaitTransactionSuccessAsync(callOpts);
            contracts_test_utils_1.verifyEventsFromLogs(receipt.logs, [
                {
                    inputToken: args.inputToken,
                    outputToken: args.outputToken,
                    inputTokenAmount: args.inputTokenAmount,
                    minOutputTokenAmount: args.minOutputTokenAmount,
                    transformations: args.transformations,
                    sender: zeroEx.address,
                    value: mtx.value,
                    callDataHash: utils_1.hexUtils.hash(callData),
                    taker: mtx.signer,
                    callDataSignature,
                },
            ], wrappers_2.TestMetaTransactionsTransformERC20FeatureEvents.TransformERC20Called);
        }));
        it('can call with any sender if `sender == 0`', () => __awaiter(this, void 0, void 0, function* () {
            const args = getRandomTransformERC20Args();
            const mtx = getRandomMetaTransaction({
                sender: NULL_ADDRESS,
                callData: transformERC20Feature
                    .transformERC20(args.inputToken, args.outputToken, args.inputTokenAmount, args.minOutputTokenAmount, args.transformations)
                    .getABIEncodedTransactionData(),
            });
            const signature = yield signMetaTransactionAsync(mtx);
            const callOpts = {
                gasPrice: mtx.minGasPrice,
                value: mtx.value,
                from: contracts_test_utils_1.randomAddress(),
            };
            const rawResult = yield feature.executeMetaTransaction(mtx, signature).callAsync(callOpts);
            contracts_test_utils_1.expect(rawResult).to.eq(RAW_SUCCESS_RESULT);
        }));
        it('works without fee', () => __awaiter(this, void 0, void 0, function* () {
            const args = getRandomTransformERC20Args();
            const mtx = getRandomMetaTransaction({
                feeAmount: ZERO_AMOUNT,
                feeToken: contracts_test_utils_1.randomAddress(),
                callData: transformERC20Feature
                    .transformERC20(args.inputToken, args.outputToken, args.inputTokenAmount, args.minOutputTokenAmount, args.transformations)
                    .getABIEncodedTransactionData(),
            });
            const signature = yield signMetaTransactionAsync(mtx);
            const callOpts = {
                gasPrice: mtx.minGasPrice,
                value: mtx.value,
            };
            const rawResult = yield feature.executeMetaTransaction(mtx, signature).callAsync(callOpts);
            contracts_test_utils_1.expect(rawResult).to.eq(RAW_SUCCESS_RESULT);
        }));
        it('fails if the translated call fails', () => __awaiter(this, void 0, void 0, function* () {
            const args = getRandomTransformERC20Args();
            const mtx = getRandomMetaTransaction({
                value: new utils_1.BigNumber(TRANSFORM_ERC20_FAILING_VALUE),
                callData: transformERC20Feature
                    .transformERC20(args.inputToken, args.outputToken, args.inputTokenAmount, args.minOutputTokenAmount, args.transformations)
                    .getABIEncodedTransactionData(),
            });
            const mtxHash = order_utils_1.getExchangeProxyMetaTransactionHash(mtx);
            const signature = yield signMetaTransactionAsync(mtx);
            const callOpts = {
                gasPrice: mtx.minGasPrice,
                value: mtx.value,
            };
            const tx = feature.executeMetaTransaction(mtx, signature).callAsync(callOpts);
            const actualCallData = transformERC20Feature
                ._transformERC20({
                taker: mtx.signer,
                inputToken: args.inputToken,
                outputToken: args.outputToken,
                inputTokenAmount: args.inputTokenAmount,
                minOutputTokenAmount: args.minOutputTokenAmount,
                transformations: args.transformations,
                callDataHash: utils_1.hexUtils.hash(mtx.callData),
                callDataSignature: NULL_BYTES,
            })
                .getABIEncodedTransactionData();
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.MetaTransactions.MetaTransactionCallFailedError(mtxHash, actualCallData, new utils_1.StringRevertError('FAIL').encode()));
        }));
        it('fails with unsupported function', () => __awaiter(this, void 0, void 0, function* () {
            const mtx = getRandomMetaTransaction({
                callData: transformERC20Feature.createTransformWallet().getABIEncodedTransactionData(),
            });
            const mtxHash = order_utils_1.getExchangeProxyMetaTransactionHash(mtx);
            const signature = yield signMetaTransactionAsync(mtx);
            const callOpts = {
                gasPrice: mtx.minGasPrice,
                value: mtx.value,
            };
            const tx = feature.executeMetaTransaction(mtx, signature).awaitTransactionSuccessAsync(callOpts);
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.MetaTransactions.MetaTransactionUnsupportedFunctionError(mtxHash, utils_1.hexUtils.slice(mtx.callData, 0, 4)));
        }));
        it('cannot execute the same mtx twice', () => __awaiter(this, void 0, void 0, function* () {
            const args = getRandomTransformERC20Args();
            const mtx = getRandomMetaTransaction({
                callData: transformERC20Feature
                    .transformERC20(args.inputToken, args.outputToken, args.inputTokenAmount, args.minOutputTokenAmount, args.transformations)
                    .getABIEncodedTransactionData(),
            });
            const mtxHash = order_utils_1.getExchangeProxyMetaTransactionHash(mtx);
            const signature = yield signMetaTransactionAsync(mtx);
            const callOpts = {
                gasPrice: mtx.minGasPrice,
                value: mtx.value,
            };
            const receipt = yield feature.executeMetaTransaction(mtx, signature).awaitTransactionSuccessAsync(callOpts);
            const tx = feature.executeMetaTransaction(mtx, signature).awaitTransactionSuccessAsync(callOpts);
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.MetaTransactions.MetaTransactionAlreadyExecutedError(mtxHash, receipt.blockNumber));
        }));
        it('fails if not enough ETH provided', () => __awaiter(this, void 0, void 0, function* () {
            const mtx = getRandomMetaTransaction();
            const mtxHash = order_utils_1.getExchangeProxyMetaTransactionHash(mtx);
            const signature = yield signMetaTransactionAsync(mtx);
            const callOpts = {
                gasPrice: mtx.minGasPrice,
                value: mtx.value.minus(1),
            };
            const tx = feature.executeMetaTransaction(mtx, signature).awaitTransactionSuccessAsync(callOpts);
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.MetaTransactions.MetaTransactionInsufficientEthError(mtxHash, callOpts.value, mtx.value));
        }));
        it('fails if gas price too low', () => __awaiter(this, void 0, void 0, function* () {
            const mtx = getRandomMetaTransaction();
            const mtxHash = order_utils_1.getExchangeProxyMetaTransactionHash(mtx);
            const signature = yield signMetaTransactionAsync(mtx);
            const callOpts = {
                gasPrice: mtx.minGasPrice.minus(1),
                value: mtx.value,
            };
            const tx = feature.executeMetaTransaction(mtx, signature).awaitTransactionSuccessAsync(callOpts);
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.MetaTransactions.MetaTransactionGasPriceError(mtxHash, callOpts.gasPrice, mtx.minGasPrice, mtx.maxGasPrice));
        }));
        it('fails if gas price too high', () => __awaiter(this, void 0, void 0, function* () {
            const mtx = getRandomMetaTransaction();
            const mtxHash = order_utils_1.getExchangeProxyMetaTransactionHash(mtx);
            const signature = yield signMetaTransactionAsync(mtx);
            const callOpts = {
                gasPrice: mtx.maxGasPrice.plus(1),
                value: mtx.value,
            };
            const tx = feature.executeMetaTransaction(mtx, signature).awaitTransactionSuccessAsync(callOpts);
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.MetaTransactions.MetaTransactionGasPriceError(mtxHash, callOpts.gasPrice, mtx.minGasPrice, mtx.maxGasPrice));
        }));
        it('fails if expired', () => __awaiter(this, void 0, void 0, function* () {
            const mtx = getRandomMetaTransaction({
                expirationTimeSeconds: new utils_1.BigNumber(Math.floor(_.now() / 1000 - 60)),
            });
            const mtxHash = order_utils_1.getExchangeProxyMetaTransactionHash(mtx);
            const signature = yield signMetaTransactionAsync(mtx);
            const callOpts = {
                gasPrice: mtx.maxGasPrice,
                value: mtx.value,
            };
            const tx = feature.executeMetaTransaction(mtx, signature).awaitTransactionSuccessAsync(callOpts);
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.MetaTransactions.MetaTransactionExpiredError(mtxHash, undefined, mtx.expirationTimeSeconds));
        }));
        it('fails if wrong sender', () => __awaiter(this, void 0, void 0, function* () {
            const requiredSender = contracts_test_utils_1.randomAddress();
            const mtx = getRandomMetaTransaction({
                sender: requiredSender,
            });
            const mtxHash = order_utils_1.getExchangeProxyMetaTransactionHash(mtx);
            const signature = yield signMetaTransactionAsync(mtx);
            const callOpts = {
                gasPrice: mtx.maxGasPrice,
                value: mtx.value,
            };
            const tx = feature.executeMetaTransaction(mtx, signature).awaitTransactionSuccessAsync(callOpts);
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.MetaTransactions.MetaTransactionWrongSenderError(mtxHash, sender, requiredSender));
        }));
        it('fails if signature is wrong', () => __awaiter(this, void 0, void 0, function* () {
            const mtx = getRandomMetaTransaction({ signer: signers[0] });
            const mtxHash = order_utils_1.getExchangeProxyMetaTransactionHash(mtx);
            const signature = yield signMetaTransactionAsync(mtx, signers[1]);
            const callOpts = {
                gasPrice: mtx.maxGasPrice,
                value: mtx.value,
            };
            const tx = feature.executeMetaTransaction(mtx, signature).awaitTransactionSuccessAsync(callOpts);
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.MetaTransactions.MetaTransactionInvalidSignatureError(mtxHash, signature, new utils_1.ZeroExRevertErrors.SignatureValidator.SignatureValidationError(utils_1.ZeroExRevertErrors.SignatureValidator.SignatureValidationErrorCodes.WrongSigner, mtxHash, signers[0], signature).encode()));
        }));
        it('cannot reenter `executeMetaTransaction()`', () => __awaiter(this, void 0, void 0, function* () {
            const args = getRandomTransformERC20Args();
            const mtx = getRandomMetaTransaction({
                callData: transformERC20Feature
                    .transformERC20(args.inputToken, args.outputToken, args.inputTokenAmount, args.minOutputTokenAmount, args.transformations)
                    .getABIEncodedTransactionData(),
                value: TRANSFORM_ERC20_REENTER_VALUE,
            });
            const mtxHash = order_utils_1.getExchangeProxyMetaTransactionHash(mtx);
            const signature = yield signMetaTransactionAsync(mtx);
            const callOpts = {
                gasPrice: mtx.maxGasPrice,
                value: mtx.value,
            };
            const tx = feature.executeMetaTransaction(mtx, signature).awaitTransactionSuccessAsync(callOpts);
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.MetaTransactions.MetaTransactionCallFailedError(mtxHash, undefined, new utils_1.ZeroExRevertErrors.Common.IllegalReentrancyError(feature.getSelector('executeMetaTransaction'), REENTRANCY_FLAG_MTX).encode()));
        }));
        it('cannot reenter `batchExecuteMetaTransactions()`', () => __awaiter(this, void 0, void 0, function* () {
            const args = getRandomTransformERC20Args();
            const mtx = getRandomMetaTransaction({
                callData: transformERC20Feature
                    .transformERC20(args.inputToken, args.outputToken, args.inputTokenAmount, args.minOutputTokenAmount, args.transformations)
                    .getABIEncodedTransactionData(),
                value: TRANSFORM_ERC20_BATCH_REENTER_VALUE,
            });
            const mtxHash = order_utils_1.getExchangeProxyMetaTransactionHash(mtx);
            const signature = yield signMetaTransactionAsync(mtx);
            const callOpts = {
                gasPrice: mtx.maxGasPrice,
                value: mtx.value,
            };
            const tx = feature.executeMetaTransaction(mtx, signature).awaitTransactionSuccessAsync(callOpts);
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.MetaTransactions.MetaTransactionCallFailedError(mtxHash, undefined, new utils_1.ZeroExRevertErrors.Common.IllegalReentrancyError(feature.getSelector('batchExecuteMetaTransactions'), REENTRANCY_FLAG_MTX).encode()));
        }));
        it('cannot reenter `executeMetaTransaction()`', () => __awaiter(this, void 0, void 0, function* () {
            const args = getRandomTransformERC20Args();
            const mtx = getRandomMetaTransaction({
                callData: transformERC20Feature
                    .transformERC20(args.inputToken, args.outputToken, args.inputTokenAmount, args.minOutputTokenAmount, args.transformations)
                    .getABIEncodedTransactionData(),
                value: TRANSFORM_ERC20_REENTER_VALUE,
            });
            const mtxHash = order_utils_1.getExchangeProxyMetaTransactionHash(mtx);
            const signature = yield signMetaTransactionAsync(mtx);
            const callOpts = {
                gasPrice: mtx.maxGasPrice,
                value: mtx.value,
            };
            const tx = feature.executeMetaTransaction(mtx, signature).awaitTransactionSuccessAsync(callOpts);
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.MetaTransactions.MetaTransactionCallFailedError(mtxHash, undefined, new utils_1.ZeroExRevertErrors.Common.IllegalReentrancyError(feature.getSelector('executeMetaTransaction'), REENTRANCY_FLAG_MTX).encode()));
        }));
        it('cannot reenter `batchExecuteMetaTransactions()`', () => __awaiter(this, void 0, void 0, function* () {
            const args = getRandomTransformERC20Args();
            const mtx = getRandomMetaTransaction({
                callData: transformERC20Feature
                    .transformERC20(args.inputToken, args.outputToken, args.inputTokenAmount, args.minOutputTokenAmount, args.transformations)
                    .getABIEncodedTransactionData(),
                value: TRANSFORM_ERC20_BATCH_REENTER_VALUE,
            });
            const mtxHash = order_utils_1.getExchangeProxyMetaTransactionHash(mtx);
            const signature = yield signMetaTransactionAsync(mtx);
            const callOpts = {
                gasPrice: mtx.maxGasPrice,
                value: mtx.value,
            };
            const tx = feature.executeMetaTransaction(mtx, signature).awaitTransactionSuccessAsync(callOpts);
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.MetaTransactions.MetaTransactionCallFailedError(mtxHash, undefined, new utils_1.ZeroExRevertErrors.Common.IllegalReentrancyError(feature.getSelector('batchExecuteMetaTransactions'), REENTRANCY_FLAG_MTX).encode()));
        }));
    });
    describe('batchExecuteMetaTransactions()', () => {
        it('can execute multiple transactions', () => __awaiter(this, void 0, void 0, function* () {
            const mtxs = _.times(2, i => {
                const args = getRandomTransformERC20Args();
                return getRandomMetaTransaction({
                    signer: signers[i],
                    callData: transformERC20Feature
                        .transformERC20(args.inputToken, args.outputToken, args.inputTokenAmount, args.minOutputTokenAmount, args.transformations)
                        .getABIEncodedTransactionData(),
                });
            });
            const signatures = yield Promise.all(mtxs.map((mtx) => __awaiter(this, void 0, void 0, function* () { return signMetaTransactionAsync(mtx); })));
            const callOpts = {
                gasPrice: utils_1.BigNumber.max(...mtxs.map(mtx => mtx.minGasPrice)),
                value: utils_1.BigNumber.sum(...mtxs.map(mtx => mtx.value)),
            };
            const rawResults = yield feature.batchExecuteMetaTransactions(mtxs, signatures).callAsync(callOpts);
            contracts_test_utils_1.expect(rawResults).to.eql(mtxs.map(() => RAW_SUCCESS_RESULT));
        }));
        it('cannot execute the same transaction twice', () => __awaiter(this, void 0, void 0, function* () {
            const mtx = (() => {
                const args = getRandomTransformERC20Args();
                return getRandomMetaTransaction({
                    signer: _.sampleSize(signers, 1)[0],
                    callData: transformERC20Feature
                        .transformERC20(args.inputToken, args.outputToken, args.inputTokenAmount, args.minOutputTokenAmount, args.transformations)
                        .getABIEncodedTransactionData(),
                });
            })();
            const mtxHash = order_utils_1.getExchangeProxyMetaTransactionHash(mtx);
            const mtxs = _.times(2, () => mtx);
            const signatures = yield Promise.all(mtxs.map((m) => __awaiter(this, void 0, void 0, function* () { return signMetaTransactionAsync(m); })));
            const callOpts = {
                gasPrice: utils_1.BigNumber.max(...mtxs.map(m => m.minGasPrice)),
                value: utils_1.BigNumber.sum(...mtxs.map(m => m.value)),
            };
            const block = yield env.web3Wrapper.getBlockNumberAsync();
            const tx = feature.batchExecuteMetaTransactions(mtxs, signatures).callAsync(callOpts);
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.MetaTransactions.MetaTransactionAlreadyExecutedError(mtxHash, block));
        }));
        it('fails if a meta-transaction fails', () => __awaiter(this, void 0, void 0, function* () {
            const args = getRandomTransformERC20Args();
            const mtx = getRandomMetaTransaction({
                value: new utils_1.BigNumber(TRANSFORM_ERC20_FAILING_VALUE),
                callData: transformERC20Feature
                    .transformERC20(args.inputToken, args.outputToken, args.inputTokenAmount, args.minOutputTokenAmount, args.transformations)
                    .getABIEncodedTransactionData(),
            });
            const mtxHash = order_utils_1.getExchangeProxyMetaTransactionHash(mtx);
            const signature = yield signMetaTransactionAsync(mtx);
            const callOpts = {
                gasPrice: mtx.minGasPrice,
                value: mtx.value,
            };
            const tx = feature.batchExecuteMetaTransactions([mtx], [signature]).callAsync(callOpts);
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.MetaTransactions.MetaTransactionCallFailedError(mtxHash, undefined, new utils_1.StringRevertError('FAIL').encode()));
        }));
        it('cannot reenter `executeMetaTransaction()`', () => __awaiter(this, void 0, void 0, function* () {
            const args = getRandomTransformERC20Args();
            const mtx = getRandomMetaTransaction({
                callData: transformERC20Feature
                    .transformERC20(args.inputToken, args.outputToken, args.inputTokenAmount, args.minOutputTokenAmount, args.transformations)
                    .getABIEncodedTransactionData(),
                value: TRANSFORM_ERC20_REENTER_VALUE,
            });
            const mtxHash = order_utils_1.getExchangeProxyMetaTransactionHash(mtx);
            const signature = yield signMetaTransactionAsync(mtx);
            const callOpts = {
                gasPrice: mtx.maxGasPrice,
                value: mtx.value,
            };
            const tx = feature.batchExecuteMetaTransactions([mtx], [signature]).awaitTransactionSuccessAsync(callOpts);
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.MetaTransactions.MetaTransactionCallFailedError(mtxHash, undefined, new utils_1.ZeroExRevertErrors.Common.IllegalReentrancyError(feature.getSelector('executeMetaTransaction'), REENTRANCY_FLAG_MTX).encode()));
        }));
        it('cannot reenter `batchExecuteMetaTransactions()`', () => __awaiter(this, void 0, void 0, function* () {
            const args = getRandomTransformERC20Args();
            const mtx = getRandomMetaTransaction({
                callData: transformERC20Feature
                    .transformERC20(args.inputToken, args.outputToken, args.inputTokenAmount, args.minOutputTokenAmount, args.transformations)
                    .getABIEncodedTransactionData(),
                value: TRANSFORM_ERC20_BATCH_REENTER_VALUE,
            });
            const mtxHash = order_utils_1.getExchangeProxyMetaTransactionHash(mtx);
            const signature = yield signMetaTransactionAsync(mtx);
            const callOpts = {
                gasPrice: mtx.maxGasPrice,
                value: mtx.value,
            };
            const tx = feature.batchExecuteMetaTransactions([mtx], [signature]).awaitTransactionSuccessAsync(callOpts);
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.MetaTransactions.MetaTransactionCallFailedError(mtxHash, undefined, new utils_1.ZeroExRevertErrors.Common.IllegalReentrancyError(feature.getSelector('batchExecuteMetaTransactions'), REENTRANCY_FLAG_MTX).encode()));
        }));
    });
    describe('getMetaTransactionExecutedBlock()', () => {
        it('returns zero for an unexecuted mtx', () => __awaiter(this, void 0, void 0, function* () {
            const mtx = getRandomMetaTransaction();
            const block = yield feature.getMetaTransactionExecutedBlock(mtx).callAsync();
            contracts_test_utils_1.expect(block).to.bignumber.eq(0);
        }));
        it('returns the block it was executed in', () => __awaiter(this, void 0, void 0, function* () {
            const args = getRandomTransformERC20Args();
            const mtx = getRandomMetaTransaction({
                callData: transformERC20Feature
                    .transformERC20(args.inputToken, args.outputToken, args.inputTokenAmount, args.minOutputTokenAmount, args.transformations)
                    .getABIEncodedTransactionData(),
            });
            const signature = yield signMetaTransactionAsync(mtx);
            const callOpts = {
                gasPrice: mtx.minGasPrice,
                value: mtx.value,
            };
            const receipt = yield feature.executeMetaTransaction(mtx, signature).awaitTransactionSuccessAsync(callOpts);
            const block = yield feature.getMetaTransactionExecutedBlock(mtx).callAsync();
            contracts_test_utils_1.expect(block).to.bignumber.eq(receipt.blockNumber);
        }));
    });
    describe('getMetaTransactionHashExecutedBlock()', () => {
        it('returns zero for an unexecuted mtx', () => __awaiter(this, void 0, void 0, function* () {
            const mtx = getRandomMetaTransaction();
            const mtxHash = order_utils_1.getExchangeProxyMetaTransactionHash(mtx);
            const block = yield feature.getMetaTransactionHashExecutedBlock(mtxHash).callAsync();
            contracts_test_utils_1.expect(block).to.bignumber.eq(0);
        }));
        it('returns the block it was executed in', () => __awaiter(this, void 0, void 0, function* () {
            const args = getRandomTransformERC20Args();
            const mtx = getRandomMetaTransaction({
                callData: transformERC20Feature
                    .transformERC20(args.inputToken, args.outputToken, args.inputTokenAmount, args.minOutputTokenAmount, args.transformations)
                    .getABIEncodedTransactionData(),
            });
            const signature = yield signMetaTransactionAsync(mtx);
            const callOpts = {
                gasPrice: mtx.minGasPrice,
                value: mtx.value,
            };
            const receipt = yield feature.executeMetaTransaction(mtx, signature).awaitTransactionSuccessAsync(callOpts);
            const mtxHash = order_utils_1.getExchangeProxyMetaTransactionHash(mtx);
            const block = yield feature.getMetaTransactionHashExecutedBlock(mtxHash).callAsync();
            contracts_test_utils_1.expect(block).to.bignumber.eq(receipt.blockNumber);
        }));
    });
});
//# sourceMappingURL=meta_transactions_test.js.map