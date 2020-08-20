import {
    blockchainTests,
    constants,
    expect,
    getRandomInteger,
    randomAddress,
    verifyEventsFromLogs,
} from '@0x/contracts-test-utils';
import { getExchangeProxyMetaTransactionHash, signatureUtils } from '@0x/order-utils';
import { ExchangeProxyMetaTransaction } from '@0x/types';
import { BigNumber, hexUtils, StringRevertError, ZeroExRevertErrors } from '@0x/utils';
import * as _ from 'lodash';

import { generateCallDataSignature, signCallData } from '../../src/signed_call_data';
import { IZeroExContract, MetaTransactionsFeatureContract } from '../../src/wrappers';
import { artifacts } from '../artifacts';
import { abis } from '../utils/abis';
import { fullMigrateAsync } from '../utils/migration';
import {
    ITokenSpenderFeatureContract,
    TestMetaTransactionsTransformERC20FeatureContract,
    TestMetaTransactionsTransformERC20FeatureEvents,
    TestMintableERC20TokenContract,
} from '../wrappers';

const { NULL_ADDRESS, NULL_BYTES, ZERO_AMOUNT } = constants;

blockchainTests.resets('MetaTransactions feature', env => {
    let owner: string;
    let sender: string;
    let signers: string[];
    let zeroEx: IZeroExContract;
    let feature: MetaTransactionsFeatureContract;
    let feeToken: TestMintableERC20TokenContract;
    let transformERC20Feature: TestMetaTransactionsTransformERC20FeatureContract;
    let allowanceTarget: string;

    const MAX_FEE_AMOUNT = new BigNumber('1e18');
    const TRANSFORM_ERC20_FAILING_VALUE = new BigNumber(666);
    const TRANSFORM_ERC20_REENTER_VALUE = new BigNumber(777);
    const TRANSFORM_ERC20_BATCH_REENTER_VALUE = new BigNumber(888);
    const REENTRANCY_FLAG_MTX = 0x1;

    before(async () => {
        [owner, sender, ...signers] = await env.getAccountAddressesAsync();
        transformERC20Feature = await TestMetaTransactionsTransformERC20FeatureContract.deployFrom0xArtifactAsync(
            artifacts.TestMetaTransactionsTransformERC20Feature,
            env.provider,
            env.txDefaults,
            {},
        );
        zeroEx = await fullMigrateAsync(owner, env.provider, env.txDefaults, {
            transformERC20: transformERC20Feature.address,
        });
        feature = new MetaTransactionsFeatureContract(zeroEx.address, env.provider, { ...env.txDefaults, from: sender }, abis);
        feeToken = await TestMintableERC20TokenContract.deployFrom0xArtifactAsync(
            artifacts.TestMintableERC20Token,
            env.provider,
            env.txDefaults,
            {},
        );
        allowanceTarget = await new ITokenSpenderFeatureContract(zeroEx.address, env.provider, env.txDefaults)
            .getAllowanceTarget()
            .callAsync();
        // Fund signers with fee tokens.
        await Promise.all(
            signers.map(async signer => {
                await feeToken.mint(signer, MAX_FEE_AMOUNT).awaitTransactionSuccessAsync();
                await feeToken.approve(allowanceTarget, MAX_FEE_AMOUNT).awaitTransactionSuccessAsync({ from: signer });
            }),
        );
    });

    function getRandomMetaTransaction(
        fields: Partial<ExchangeProxyMetaTransaction> = {},
    ): ExchangeProxyMetaTransaction {
        return {
            signer: _.sampleSize(signers)[0],
            sender,
            minGasPrice: getRandomInteger('2', '1e9'),
            maxGasPrice: getRandomInteger('1e9', '100e9'),
            expirationTimeSeconds: new BigNumber(Math.floor(_.now() / 1000) + 360),
            salt: new BigNumber(hexUtils.random()),
            callData: hexUtils.random(4),
            value: getRandomInteger(1, '1e18'),
            feeToken: feeToken.address,
            feeAmount: getRandomInteger(1, MAX_FEE_AMOUNT),
            domain: {
                chainId: 1, // Ganache's `chainid` opcode is hardcoded as 1
                verifyingContract: zeroEx.address,
            },
            ...fields,
        };
    }

    async function signMetaTransactionAsync(mtx: ExchangeProxyMetaTransaction, signer?: string): Promise<string> {
        return signatureUtils.ecSignHashAsync(
            env.provider,
            getExchangeProxyMetaTransactionHash(mtx),
            signer || mtx.signer,
        );
    }

    describe('getMetaTransactionHash()', () => {
        it('generates the correct hash', async () => {
            const mtx = getRandomMetaTransaction();
            const expected = getExchangeProxyMetaTransactionHash(mtx);
            const actual = await feature.getMetaTransactionHash(mtx).callAsync();
            expect(actual).to.eq(expected);
        });
    });

    interface TransformERC20Args {
        inputToken: string;
        outputToken: string;
        inputTokenAmount: BigNumber;
        minOutputTokenAmount: BigNumber;
        transformations: Array<{ deploymentNonce: BigNumber; data: string }>;
    }

    function getRandomTransformERC20Args(fields: Partial<TransformERC20Args> = {}): TransformERC20Args {
        return {
            inputToken: randomAddress(),
            outputToken: randomAddress(),
            inputTokenAmount: getRandomInteger(1, '1e18'),
            minOutputTokenAmount: getRandomInteger(1, '1e18'),
            transformations: [{ deploymentNonce: new BigNumber(123), data: hexUtils.random() }],
            ...fields,
        };
    }

    const RAW_SUCCESS_RESULT = hexUtils.leftPad(1337);

    describe('executeMetaTransaction()', () => {
        it('can call `TransformERC20.transformERC20()`', async () => {
            const args = getRandomTransformERC20Args();
            const mtx = getRandomMetaTransaction({
                callData: transformERC20Feature
                    .transformERC20(
                        args.inputToken,
                        args.outputToken,
                        args.inputTokenAmount,
                        args.minOutputTokenAmount,
                        args.transformations,
                    )
                    .getABIEncodedTransactionData(),
            });
            const signature = await signMetaTransactionAsync(mtx);
            const callOpts = {
                gasPrice: mtx.minGasPrice,
                value: mtx.value,
            };
            const rawResult = await feature.executeMetaTransaction(mtx, signature).callAsync(callOpts);
            expect(rawResult).to.eq(RAW_SUCCESS_RESULT);
            const receipt = await feature.executeMetaTransaction(mtx, signature).awaitTransactionSuccessAsync(callOpts);
            verifyEventsFromLogs(
                receipt.logs,
                [
                    {
                        inputToken: args.inputToken,
                        outputToken: args.outputToken,
                        inputTokenAmount: args.inputTokenAmount,
                        minOutputTokenAmount: args.minOutputTokenAmount,
                        transformations: args.transformations,
                        sender: zeroEx.address,
                        value: mtx.value,
                        callDataHash: hexUtils.hash(mtx.callData),
                        taker: mtx.signer,
                        callDataSignature: NULL_BYTES,
                    },
                ],
                TestMetaTransactionsTransformERC20FeatureEvents.TransformERC20Called,
            );
        });

        it('can call `TransformERC20.transformERC20()` with signed calldata', async () => {
            const args = getRandomTransformERC20Args();
            const callData = transformERC20Feature
                .transformERC20(
                    args.inputToken,
                    args.outputToken,
                    args.inputTokenAmount,
                    args.minOutputTokenAmount,
                    args.transformations,
                )
                .getABIEncodedTransactionData();
            const callDataSignerKey = hexUtils.random();
            const callDataSignature = generateCallDataSignature(callData, callDataSignerKey);
            const signedCallData = signCallData(callData, callDataSignerKey);
            const mtx = getRandomMetaTransaction({ callData: signedCallData });
            const signature = await signMetaTransactionAsync(mtx);
            const callOpts = {
                gasPrice: mtx.minGasPrice,
                value: mtx.value,
            };
            const rawResult = await feature.executeMetaTransaction(mtx, signature).callAsync(callOpts);
            expect(rawResult).to.eq(RAW_SUCCESS_RESULT);
            const receipt = await feature.executeMetaTransaction(mtx, signature).awaitTransactionSuccessAsync(callOpts);
            verifyEventsFromLogs(
                receipt.logs,
                [
                    {
                        inputToken: args.inputToken,
                        outputToken: args.outputToken,
                        inputTokenAmount: args.inputTokenAmount,
                        minOutputTokenAmount: args.minOutputTokenAmount,
                        transformations: args.transformations,
                        sender: zeroEx.address,
                        value: mtx.value,
                        callDataHash: hexUtils.hash(callData),
                        taker: mtx.signer,
                        callDataSignature,
                    },
                ],
                TestMetaTransactionsTransformERC20FeatureEvents.TransformERC20Called,
            );
        });

        it('can call with any sender if `sender == 0`', async () => {
            const args = getRandomTransformERC20Args();
            const mtx = getRandomMetaTransaction({
                sender: NULL_ADDRESS,
                callData: transformERC20Feature
                    .transformERC20(
                        args.inputToken,
                        args.outputToken,
                        args.inputTokenAmount,
                        args.minOutputTokenAmount,
                        args.transformations,
                    )
                    .getABIEncodedTransactionData(),
            });
            const signature = await signMetaTransactionAsync(mtx);
            const callOpts = {
                gasPrice: mtx.minGasPrice,
                value: mtx.value,
                from: randomAddress(),
            };
            const rawResult = await feature.executeMetaTransaction(mtx, signature).callAsync(callOpts);
            expect(rawResult).to.eq(RAW_SUCCESS_RESULT);
        });

        it('works without fee', async () => {
            const args = getRandomTransformERC20Args();
            const mtx = getRandomMetaTransaction({
                feeAmount: ZERO_AMOUNT,
                feeToken: randomAddress(),
                callData: transformERC20Feature
                    .transformERC20(
                        args.inputToken,
                        args.outputToken,
                        args.inputTokenAmount,
                        args.minOutputTokenAmount,
                        args.transformations,
                    )
                    .getABIEncodedTransactionData(),
            });
            const signature = await signMetaTransactionAsync(mtx);
            const callOpts = {
                gasPrice: mtx.minGasPrice,
                value: mtx.value,
            };
            const rawResult = await feature.executeMetaTransaction(mtx, signature).callAsync(callOpts);
            expect(rawResult).to.eq(RAW_SUCCESS_RESULT);
        });

        it('fails if the translated call fails', async () => {
            const args = getRandomTransformERC20Args();
            const mtx = getRandomMetaTransaction({
                value: new BigNumber(TRANSFORM_ERC20_FAILING_VALUE),
                callData: transformERC20Feature
                    .transformERC20(
                        args.inputToken,
                        args.outputToken,
                        args.inputTokenAmount,
                        args.minOutputTokenAmount,
                        args.transformations,
                    )
                    .getABIEncodedTransactionData(),
            });
            const mtxHash = getExchangeProxyMetaTransactionHash(mtx);
            const signature = await signMetaTransactionAsync(mtx);
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
                    callDataHash: hexUtils.hash(mtx.callData),
                    callDataSignature: NULL_BYTES,
                })
                .getABIEncodedTransactionData();
            return expect(tx).to.revertWith(
                new ZeroExRevertErrors.MetaTransactions.MetaTransactionCallFailedError(
                    mtxHash,
                    actualCallData,
                    new StringRevertError('FAIL').encode(),
                ),
            );
        });

        it('fails with unsupported function', async () => {
            const mtx = getRandomMetaTransaction({
                callData: transformERC20Feature.createTransformWallet().getABIEncodedTransactionData(),
            });
            const mtxHash = getExchangeProxyMetaTransactionHash(mtx);
            const signature = await signMetaTransactionAsync(mtx);
            const callOpts = {
                gasPrice: mtx.minGasPrice,
                value: mtx.value,
            };
            const tx = feature.executeMetaTransaction(mtx, signature).awaitTransactionSuccessAsync(callOpts);
            return expect(tx).to.revertWith(
                new ZeroExRevertErrors.MetaTransactions.MetaTransactionUnsupportedFunctionError(
                    mtxHash,
                    hexUtils.slice(mtx.callData, 0, 4),
                ),
            );
        });

        it('cannot execute the same mtx twice', async () => {
            const args = getRandomTransformERC20Args();
            const mtx = getRandomMetaTransaction({
                callData: transformERC20Feature
                    .transformERC20(
                        args.inputToken,
                        args.outputToken,
                        args.inputTokenAmount,
                        args.minOutputTokenAmount,
                        args.transformations,
                    )
                    .getABIEncodedTransactionData(),
            });
            const mtxHash = getExchangeProxyMetaTransactionHash(mtx);
            const signature = await signMetaTransactionAsync(mtx);
            const callOpts = {
                gasPrice: mtx.minGasPrice,
                value: mtx.value,
            };
            const receipt = await feature.executeMetaTransaction(mtx, signature).awaitTransactionSuccessAsync(callOpts);
            const tx = feature.executeMetaTransaction(mtx, signature).awaitTransactionSuccessAsync(callOpts);
            return expect(tx).to.revertWith(
                new ZeroExRevertErrors.MetaTransactions.MetaTransactionAlreadyExecutedError(
                    mtxHash,
                    receipt.blockNumber,
                ),
            );
        });

        it('fails if not enough ETH provided', async () => {
            const mtx = getRandomMetaTransaction();
            const mtxHash = getExchangeProxyMetaTransactionHash(mtx);
            const signature = await signMetaTransactionAsync(mtx);
            const callOpts = {
                gasPrice: mtx.minGasPrice,
                value: mtx.value.minus(1),
            };
            const tx = feature.executeMetaTransaction(mtx, signature).awaitTransactionSuccessAsync(callOpts);
            return expect(tx).to.revertWith(
                new ZeroExRevertErrors.MetaTransactions.MetaTransactionInsufficientEthError(
                    mtxHash,
                    callOpts.value,
                    mtx.value,
                ),
            );
        });

        it('fails if gas price too low', async () => {
            const mtx = getRandomMetaTransaction();
            const mtxHash = getExchangeProxyMetaTransactionHash(mtx);
            const signature = await signMetaTransactionAsync(mtx);
            const callOpts = {
                gasPrice: mtx.minGasPrice.minus(1),
                value: mtx.value,
            };
            const tx = feature.executeMetaTransaction(mtx, signature).awaitTransactionSuccessAsync(callOpts);
            return expect(tx).to.revertWith(
                new ZeroExRevertErrors.MetaTransactions.MetaTransactionGasPriceError(
                    mtxHash,
                    callOpts.gasPrice,
                    mtx.minGasPrice,
                    mtx.maxGasPrice,
                ),
            );
        });

        it('fails if gas price too high', async () => {
            const mtx = getRandomMetaTransaction();
            const mtxHash = getExchangeProxyMetaTransactionHash(mtx);
            const signature = await signMetaTransactionAsync(mtx);
            const callOpts = {
                gasPrice: mtx.maxGasPrice.plus(1),
                value: mtx.value,
            };
            const tx = feature.executeMetaTransaction(mtx, signature).awaitTransactionSuccessAsync(callOpts);
            return expect(tx).to.revertWith(
                new ZeroExRevertErrors.MetaTransactions.MetaTransactionGasPriceError(
                    mtxHash,
                    callOpts.gasPrice,
                    mtx.minGasPrice,
                    mtx.maxGasPrice,
                ),
            );
        });

        it('fails if expired', async () => {
            const mtx = getRandomMetaTransaction({
                expirationTimeSeconds: new BigNumber(Math.floor(_.now() / 1000 - 60)),
            });
            const mtxHash = getExchangeProxyMetaTransactionHash(mtx);
            const signature = await signMetaTransactionAsync(mtx);
            const callOpts = {
                gasPrice: mtx.maxGasPrice,
                value: mtx.value,
            };
            const tx = feature.executeMetaTransaction(mtx, signature).awaitTransactionSuccessAsync(callOpts);
            return expect(tx).to.revertWith(
                new ZeroExRevertErrors.MetaTransactions.MetaTransactionExpiredError(
                    mtxHash,
                    undefined,
                    mtx.expirationTimeSeconds,
                ),
            );
        });

        it('fails if wrong sender', async () => {
            const requiredSender = randomAddress();
            const mtx = getRandomMetaTransaction({
                sender: requiredSender,
            });
            const mtxHash = getExchangeProxyMetaTransactionHash(mtx);
            const signature = await signMetaTransactionAsync(mtx);
            const callOpts = {
                gasPrice: mtx.maxGasPrice,
                value: mtx.value,
            };
            const tx = feature.executeMetaTransaction(mtx, signature).awaitTransactionSuccessAsync(callOpts);
            return expect(tx).to.revertWith(
                new ZeroExRevertErrors.MetaTransactions.MetaTransactionWrongSenderError(
                    mtxHash,
                    sender,
                    requiredSender,
                ),
            );
        });

        it('fails if signature is wrong', async () => {
            const mtx = getRandomMetaTransaction({ signer: signers[0] });
            const mtxHash = getExchangeProxyMetaTransactionHash(mtx);
            const signature = await signMetaTransactionAsync(mtx, signers[1]);
            const callOpts = {
                gasPrice: mtx.maxGasPrice,
                value: mtx.value,
            };
            const tx = feature.executeMetaTransaction(mtx, signature).awaitTransactionSuccessAsync(callOpts);
            return expect(tx).to.revertWith(
                new ZeroExRevertErrors.MetaTransactions.MetaTransactionInvalidSignatureError(
                    mtxHash,
                    signature,
                    new ZeroExRevertErrors.SignatureValidator.SignatureValidationError(
                        ZeroExRevertErrors.SignatureValidator.SignatureValidationErrorCodes.WrongSigner,
                        mtxHash,
                        signers[0],
                        signature,
                    ).encode(),
                ),
            );
        });

        it('cannot reenter `executeMetaTransaction()`', async () => {
            const args = getRandomTransformERC20Args();
            const mtx = getRandomMetaTransaction({
                callData: transformERC20Feature
                    .transformERC20(
                        args.inputToken,
                        args.outputToken,
                        args.inputTokenAmount,
                        args.minOutputTokenAmount,
                        args.transformations,
                    )
                    .getABIEncodedTransactionData(),
                value: TRANSFORM_ERC20_REENTER_VALUE,
            });
            const mtxHash = getExchangeProxyMetaTransactionHash(mtx);
            const signature = await signMetaTransactionAsync(mtx);
            const callOpts = {
                gasPrice: mtx.maxGasPrice,
                value: mtx.value,
            };
            const tx = feature.executeMetaTransaction(mtx, signature).awaitTransactionSuccessAsync(callOpts);
            return expect(tx).to.revertWith(
                new ZeroExRevertErrors.MetaTransactions.MetaTransactionCallFailedError(
                    mtxHash,
                    undefined,
                    new ZeroExRevertErrors.Common.IllegalReentrancyError(
                        feature.getSelector('executeMetaTransaction'),
                        REENTRANCY_FLAG_MTX,
                    ).encode(),
                ),
            );
        });

        it('cannot reenter `batchExecuteMetaTransactions()`', async () => {
            const args = getRandomTransformERC20Args();
            const mtx = getRandomMetaTransaction({
                callData: transformERC20Feature
                    .transformERC20(
                        args.inputToken,
                        args.outputToken,
                        args.inputTokenAmount,
                        args.minOutputTokenAmount,
                        args.transformations,
                    )
                    .getABIEncodedTransactionData(),
                value: TRANSFORM_ERC20_BATCH_REENTER_VALUE,
            });
            const mtxHash = getExchangeProxyMetaTransactionHash(mtx);
            const signature = await signMetaTransactionAsync(mtx);
            const callOpts = {
                gasPrice: mtx.maxGasPrice,
                value: mtx.value,
            };
            const tx = feature.executeMetaTransaction(mtx, signature).awaitTransactionSuccessAsync(callOpts);
            return expect(tx).to.revertWith(
                new ZeroExRevertErrors.MetaTransactions.MetaTransactionCallFailedError(
                    mtxHash,
                    undefined,
                    new ZeroExRevertErrors.Common.IllegalReentrancyError(
                        feature.getSelector('batchExecuteMetaTransactions'),
                        REENTRANCY_FLAG_MTX,
                    ).encode(),
                ),
            );
        });
    });

    describe('batchExecuteMetaTransactions()', () => {
        it('can execute multiple transactions', async () => {
            const mtxs = _.times(2, i => {
                const args = getRandomTransformERC20Args();
                return getRandomMetaTransaction({
                    signer: signers[i],
                    callData: transformERC20Feature
                        .transformERC20(
                            args.inputToken,
                            args.outputToken,
                            args.inputTokenAmount,
                            args.minOutputTokenAmount,
                            args.transformations,
                        )
                        .getABIEncodedTransactionData(),
                });
            });
            const signatures = await Promise.all(mtxs.map(async mtx => signMetaTransactionAsync(mtx)));
            const callOpts = {
                gasPrice: BigNumber.max(...mtxs.map(mtx => mtx.minGasPrice)),
                value: BigNumber.sum(...mtxs.map(mtx => mtx.value)),
            };
            const rawResults = await feature.batchExecuteMetaTransactions(mtxs, signatures).callAsync(callOpts);
            expect(rawResults).to.eql(mtxs.map(() => RAW_SUCCESS_RESULT));
        });

        it('cannot execute the same transaction twice', async () => {
            const mtx = (() => {
                const args = getRandomTransformERC20Args();
                return getRandomMetaTransaction({
                    signer: _.sampleSize(signers, 1)[0],
                    callData: transformERC20Feature
                        .transformERC20(
                            args.inputToken,
                            args.outputToken,
                            args.inputTokenAmount,
                            args.minOutputTokenAmount,
                            args.transformations,
                        )
                        .getABIEncodedTransactionData(),
                });
            })();
            const mtxHash = getExchangeProxyMetaTransactionHash(mtx);
            const mtxs = _.times(2, () => mtx);
            const signatures = await Promise.all(mtxs.map(async m => signMetaTransactionAsync(m)));
            const callOpts = {
                gasPrice: BigNumber.max(...mtxs.map(m => m.minGasPrice)),
                value: BigNumber.sum(...mtxs.map(m => m.value)),
            };
            const block = await env.web3Wrapper.getBlockNumberAsync();
            const tx = feature.batchExecuteMetaTransactions(mtxs, signatures).callAsync(callOpts);
            return expect(tx).to.revertWith(
                new ZeroExRevertErrors.MetaTransactions.MetaTransactionAlreadyExecutedError(mtxHash, block),
            );
        });

        it('fails if a meta-transaction fails', async () => {
            const args = getRandomTransformERC20Args();
            const mtx = getRandomMetaTransaction({
                value: new BigNumber(TRANSFORM_ERC20_FAILING_VALUE),
                callData: transformERC20Feature
                    .transformERC20(
                        args.inputToken,
                        args.outputToken,
                        args.inputTokenAmount,
                        args.minOutputTokenAmount,
                        args.transformations,
                    )
                    .getABIEncodedTransactionData(),
            });
            const mtxHash = getExchangeProxyMetaTransactionHash(mtx);
            const signature = await signMetaTransactionAsync(mtx);
            const callOpts = {
                gasPrice: mtx.minGasPrice,
                value: mtx.value,
            };
            const tx = feature.batchExecuteMetaTransactions([mtx], [signature]).callAsync(callOpts);
            return expect(tx).to.revertWith(
                new ZeroExRevertErrors.MetaTransactions.MetaTransactionCallFailedError(
                    mtxHash,
                    undefined,
                    new StringRevertError('FAIL').encode(),
                ),
            );
        });

        it('cannot reenter `executeMetaTransaction()`', async () => {
            const args = getRandomTransformERC20Args();
            const mtx = getRandomMetaTransaction({
                callData: transformERC20Feature
                    .transformERC20(
                        args.inputToken,
                        args.outputToken,
                        args.inputTokenAmount,
                        args.minOutputTokenAmount,
                        args.transformations,
                    )
                    .getABIEncodedTransactionData(),
                value: TRANSFORM_ERC20_REENTER_VALUE,
            });
            const mtxHash = getExchangeProxyMetaTransactionHash(mtx);
            const signature = await signMetaTransactionAsync(mtx);
            const callOpts = {
                gasPrice: mtx.maxGasPrice,
                value: mtx.value,
            };
            const tx = feature.batchExecuteMetaTransactions([mtx], [signature]).awaitTransactionSuccessAsync(callOpts);
            return expect(tx).to.revertWith(
                new ZeroExRevertErrors.MetaTransactions.MetaTransactionCallFailedError(
                    mtxHash,
                    undefined,
                    new ZeroExRevertErrors.Common.IllegalReentrancyError(
                        feature.getSelector('executeMetaTransaction'),
                        REENTRANCY_FLAG_MTX,
                    ).encode(),
                ),
            );
        });

        it('cannot reenter `batchExecuteMetaTransactions()`', async () => {
            const args = getRandomTransformERC20Args();
            const mtx = getRandomMetaTransaction({
                callData: transformERC20Feature
                    .transformERC20(
                        args.inputToken,
                        args.outputToken,
                        args.inputTokenAmount,
                        args.minOutputTokenAmount,
                        args.transformations,
                    )
                    .getABIEncodedTransactionData(),
                value: TRANSFORM_ERC20_BATCH_REENTER_VALUE,
            });
            const mtxHash = getExchangeProxyMetaTransactionHash(mtx);
            const signature = await signMetaTransactionAsync(mtx);
            const callOpts = {
                gasPrice: mtx.maxGasPrice,
                value: mtx.value,
            };
            const tx = feature.batchExecuteMetaTransactions([mtx], [signature]).awaitTransactionSuccessAsync(callOpts);
            return expect(tx).to.revertWith(
                new ZeroExRevertErrors.MetaTransactions.MetaTransactionCallFailedError(
                    mtxHash,
                    undefined,
                    new ZeroExRevertErrors.Common.IllegalReentrancyError(
                        feature.getSelector('batchExecuteMetaTransactions'),
                        REENTRANCY_FLAG_MTX,
                    ).encode(),
                ),
            );
        });
    });

    describe('getMetaTransactionExecutedBlock()', () => {
        it('returns zero for an unexecuted mtx', async () => {
            const mtx = getRandomMetaTransaction();
            const block = await feature.getMetaTransactionExecutedBlock(mtx).callAsync();
            expect(block).to.bignumber.eq(0);
        });

        it('returns the block it was executed in', async () => {
            const args = getRandomTransformERC20Args();
            const mtx = getRandomMetaTransaction({
                callData: transformERC20Feature
                    .transformERC20(
                        args.inputToken,
                        args.outputToken,
                        args.inputTokenAmount,
                        args.minOutputTokenAmount,
                        args.transformations,
                    )
                    .getABIEncodedTransactionData(),
            });
            const signature = await signMetaTransactionAsync(mtx);
            const callOpts = {
                gasPrice: mtx.minGasPrice,
                value: mtx.value,
            };
            const receipt = await feature.executeMetaTransaction(mtx, signature).awaitTransactionSuccessAsync(callOpts);
            const block = await feature.getMetaTransactionExecutedBlock(mtx).callAsync();
            expect(block).to.bignumber.eq(receipt.blockNumber);
        });
    });

    describe('getMetaTransactionHashExecutedBlock()', () => {
        it('returns zero for an unexecuted mtx', async () => {
            const mtx = getRandomMetaTransaction();
            const mtxHash = getExchangeProxyMetaTransactionHash(mtx);
            const block = await feature.getMetaTransactionHashExecutedBlock(mtxHash).callAsync();
            expect(block).to.bignumber.eq(0);
        });

        it('returns the block it was executed in', async () => {
            const args = getRandomTransformERC20Args();
            const mtx = getRandomMetaTransaction({
                callData: transformERC20Feature
                    .transformERC20(
                        args.inputToken,
                        args.outputToken,
                        args.inputTokenAmount,
                        args.minOutputTokenAmount,
                        args.transformations,
                    )
                    .getABIEncodedTransactionData(),
            });
            const signature = await signMetaTransactionAsync(mtx);
            const callOpts = {
                gasPrice: mtx.minGasPrice,
                value: mtx.value,
            };
            const receipt = await feature.executeMetaTransaction(mtx, signature).awaitTransactionSuccessAsync(callOpts);
            const mtxHash = getExchangeProxyMetaTransactionHash(mtx);
            const block = await feature.getMetaTransactionHashExecutedBlock(mtxHash).callAsync();
            expect(block).to.bignumber.eq(receipt.blockNumber);
        });
    });
});
