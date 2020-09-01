import {
    blockchainTests,
    constants,
    expect,
    getRandomInteger,
    getRandomPortion,
    Numberish,
    randomAddress,
    verifyEventsFromLogs,
} from '@0x/contracts-test-utils';
import { ETH_TOKEN_ADDRESS } from '@0x/order-utils';
import { AbiEncoder, hexUtils, OwnableRevertErrors, ZeroExRevertErrors } from '@0x/utils';
import { DecodedLogEntry } from 'ethereum-types';
import * as ethjs from 'ethereumjs-util';

import { generateCallDataHashSignature, signCallData } from '../../src/signed_call_data';
import { IZeroExContract, TransformERC20FeatureContract } from '../../src/wrappers';
import { artifacts } from '../artifacts';
import { abis } from '../utils/abis';
import { fullMigrateAsync } from '../utils/migration';
import {
    FlashWalletContract,
    ITokenSpenderFeatureContract,
    TestMintableERC20TokenContract,
    TestMintTokenERC20TransformerContract,
    TestMintTokenERC20TransformerEvents,
    TestMintTokenERC20TransformerMintTransformEventArgs,
    TransformERC20FeatureEvents,
} from '../wrappers';

const { NULL_BYTES, NULL_BYTES32 } = constants;

type MintTokenTransformerEvent = DecodedLogEntry<TestMintTokenERC20TransformerMintTransformEventArgs>;

blockchainTests.resets('TransformERC20 feature', env => {
    const callDataSignerKey = hexUtils.random();
    const callDataSigner = ethjs.bufferToHex(ethjs.privateToAddress(ethjs.toBuffer(callDataSignerKey)));
    let owner: string;
    let taker: string;
    let sender: string;
    let transformerDeployer: string;
    let zeroEx: IZeroExContract;
    let feature: TransformERC20FeatureContract;
    let wallet: FlashWalletContract;
    let allowanceTarget: string;

    before(async () => {
        [owner, taker, sender, transformerDeployer] = await env.getAccountAddressesAsync();
        zeroEx = await fullMigrateAsync(
            owner,
            env.provider,
            env.txDefaults,
            {
                transformERC20: (await TransformERC20FeatureContract.deployFrom0xArtifactAsync(
                    artifacts.TestTransformERC20,
                    env.provider,
                    env.txDefaults,
                    artifacts,
                )).address,
            },
            { transformerDeployer },
        );
        feature = new TransformERC20FeatureContract(zeroEx.address, env.provider, { ...env.txDefaults, from: sender }, abis);
        wallet = new FlashWalletContract(await feature.getTransformWallet().callAsync(), env.provider, env.txDefaults);
        allowanceTarget = await new ITokenSpenderFeatureContract(zeroEx.address, env.provider, env.txDefaults)
            .getAllowanceTarget()
            .callAsync();
        await feature.setQuoteSigner(callDataSigner).awaitTransactionSuccessAsync({ from: owner });
    });

    const { MAX_UINT256, ZERO_AMOUNT } = constants;

    describe('wallets', () => {
        it('createTransformWallet() replaces the current wallet', async () => {
            const newWalletAddress = await feature.createTransformWallet().callAsync({ from: owner });
            expect(newWalletAddress).to.not.eq(wallet.address);
            await feature.createTransformWallet().awaitTransactionSuccessAsync({ from: owner });
            return expect(feature.getTransformWallet().callAsync()).to.eventually.eq(newWalletAddress);
        });

        it('createTransformWallet() cannot be called by non-owner', async () => {
            const notOwner = randomAddress();
            const tx = feature.createTransformWallet().callAsync({ from: notOwner });
            return expect(tx).to.revertWith(new OwnableRevertErrors.OnlyOwnerError(notOwner, owner));
        });
    });

    describe('transformer deployer', () => {
        it('`getTransformerDeployer()` returns the transformer deployer', async () => {
            const actualDeployer = await feature.getTransformerDeployer().callAsync();
            expect(actualDeployer).to.eq(transformerDeployer);
        });

        it('owner can set the transformer deployer with `setTransformerDeployer()`', async () => {
            const newDeployer = randomAddress();
            const receipt = await feature
                .setTransformerDeployer(newDeployer)
                .awaitTransactionSuccessAsync({ from: owner });
            verifyEventsFromLogs(
                receipt.logs,
                [{ transformerDeployer: newDeployer }],
                TransformERC20FeatureEvents.TransformerDeployerUpdated,
            );
            const actualDeployer = await feature.getTransformerDeployer().callAsync();
            expect(actualDeployer).to.eq(newDeployer);
        });

        it('non-owner cannot set the transformer deployer with `setTransformerDeployer()`', async () => {
            const newDeployer = randomAddress();
            const notOwner = randomAddress();
            const tx = feature.setTransformerDeployer(newDeployer).callAsync({ from: notOwner });
            return expect(tx).to.revertWith(new OwnableRevertErrors.OnlyOwnerError(notOwner, owner));
        });
    });

    describe('quote signer', () => {
        it('`getQuoteSigner()` returns the quote signer', async () => {
            const actualSigner = await feature.getQuoteSigner().callAsync();
            expect(actualSigner).to.eq(callDataSigner);
        });

        it('owner can set the quote signer with `setQuoteSigner()`', async () => {
            const newSigner = randomAddress();
            const receipt = await feature.setQuoteSigner(newSigner).awaitTransactionSuccessAsync({ from: owner });
            verifyEventsFromLogs(receipt.logs, [{ quoteSigner: newSigner }], TransformERC20FeatureEvents.QuoteSignerUpdated);
            const actualSigner = await feature.getQuoteSigner().callAsync();
            expect(actualSigner).to.eq(newSigner);
        });

        it('non-owner cannot set the quote signer with `setQuoteSigner()`', async () => {
            const newSigner = randomAddress();
            const notOwner = randomAddress();
            const tx = feature.setQuoteSigner(newSigner).callAsync({ from: notOwner });
            return expect(tx).to.revertWith(new OwnableRevertErrors.OnlyOwnerError(notOwner, owner));
        });
    });

    describe('_transformERC20()/transformERC20()', () => {
        let inputToken: TestMintableERC20TokenContract;
        let outputToken: TestMintableERC20TokenContract;
        let mintTransformer: TestMintTokenERC20TransformerContract;
        let transformerNonce: number;

        before(async () => {
            inputToken = await TestMintableERC20TokenContract.deployFrom0xArtifactAsync(
                artifacts.TestMintableERC20Token,
                env.provider,
                env.txDefaults,
                artifacts,
            );
            outputToken = await TestMintableERC20TokenContract.deployFrom0xArtifactAsync(
                artifacts.TestMintableERC20Token,
                env.provider,
                env.txDefaults,
                artifacts,
            );
            transformerNonce = await env.web3Wrapper.getAccountNonceAsync(transformerDeployer);
            mintTransformer = await TestMintTokenERC20TransformerContract.deployFrom0xArtifactAsync(
                artifacts.TestMintTokenERC20Transformer,
                env.provider,
                {
                    ...env.txDefaults,
                    from: transformerDeployer,
                },
                artifacts,
            );
            await inputToken.approve(allowanceTarget, MAX_UINT256).awaitTransactionSuccessAsync({ from: taker });
        });

        interface Transformation {
            deploymentNonce: number;
            data: string;
        }

        const transformDataEncoder = AbiEncoder.create([
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

        function createMintTokenTransformation(
            opts: Partial<{
                transformer: string;
                outputTokenAddress: string;
                inputTokenAddress: string;
                inputTokenBurnAmunt: Numberish;
                outputTokenMintAmount: Numberish;
                outputTokenFeeAmount: Numberish;
                deploymentNonce: number;
            }> = {},
        ): Transformation {
            const _opts = {
                outputTokenAddress: outputToken.address,
                inputTokenAddress: inputToken.address,
                inputTokenBurnAmunt: ZERO_AMOUNT,
                outputTokenMintAmount: ZERO_AMOUNT,
                outputTokenFeeAmount: ZERO_AMOUNT,
                transformer: mintTransformer.address,
                deploymentNonce: transformerNonce,
                ...opts,
            };
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
            it("succeeds if taker's output token balance increases by exactly minOutputTokenAmount", async () => {
                const startingOutputTokenBalance = getRandomInteger(0, '100e18');
                const startingInputTokenBalance = getRandomInteger(0, '100e18');
                await outputToken.mint(taker, startingOutputTokenBalance).awaitTransactionSuccessAsync();
                await inputToken.mint(taker, startingInputTokenBalance).awaitTransactionSuccessAsync();
                const inputTokenAmount = getRandomPortion(startingInputTokenBalance);
                const minOutputTokenAmount = getRandomInteger(1, '1e18');
                const outputTokenMintAmount = minOutputTokenAmount;
                const callValue = getRandomInteger(1, '1e18');
                const callDataHash = hexUtils.random();
                const transformation = createMintTokenTransformation({
                    outputTokenMintAmount,
                    inputTokenBurnAmunt: inputTokenAmount,
                });
                const receipt = await feature
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
                verifyEventsFromLogs(
                    receipt.logs,
                    [
                        {
                            taker,
                            inputTokenAmount,
                            outputTokenAmount: outputTokenMintAmount,
                            inputToken: inputToken.address,
                            outputToken: outputToken.address,
                        },
                    ],
                    TransformERC20FeatureEvents.TransformedERC20,
                );
                verifyEventsFromLogs(
                    receipt.logs,
                    [
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
                    ],
                    TestMintTokenERC20TransformerEvents.MintTransform,
                );
            });

            it("succeeds if taker's output token balance increases by exactly minOutputTokenAmount, with ETH", async () => {
                const startingInputTokenBalance = getRandomInteger(0, '100e18');
                await inputToken.mint(taker, startingInputTokenBalance).awaitTransactionSuccessAsync();
                const inputTokenAmount = getRandomPortion(startingInputTokenBalance);
                const minOutputTokenAmount = getRandomInteger(1, '1e18');
                const outputTokenMintAmount = minOutputTokenAmount;
                const callValue = outputTokenMintAmount.times(2);
                const callDataHash = hexUtils.random();
                const transformation = createMintTokenTransformation({
                    outputTokenMintAmount,
                    inputTokenBurnAmunt: inputTokenAmount,
                    outputTokenAddress: ETH_TOKEN_ADDRESS,
                });
                const startingOutputTokenBalance = await env.web3Wrapper.getBalanceInWeiAsync(taker);
                const receipt = await feature
                    ._transformERC20({
                        taker,
                        inputToken: inputToken.address,
                        outputToken: ETH_TOKEN_ADDRESS,
                        inputTokenAmount,
                        minOutputTokenAmount,
                        transformations: [transformation],
                        callDataHash,
                        callDataSignature: NULL_BYTES,
                    })
                    .awaitTransactionSuccessAsync({ value: callValue });
                verifyEventsFromLogs(
                    receipt.logs,
                    [
                        {
                            taker,
                            inputTokenAmount,
                            outputTokenAmount: outputTokenMintAmount,
                            inputToken: inputToken.address,
                            outputToken: ETH_TOKEN_ADDRESS,
                        },
                    ],
                    TransformERC20FeatureEvents.TransformedERC20,
                );
                verifyEventsFromLogs(
                    receipt.logs,
                    [
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
                    ],
                    TestMintTokenERC20TransformerEvents.MintTransform,
                );
                expect(await env.web3Wrapper.getBalanceInWeiAsync(taker)).to.bignumber.eq(
                    startingOutputTokenBalance.plus(outputTokenMintAmount),
                );
            });

            it("succeeds if taker's output token balance increases by more than minOutputTokenAmount", async () => {
                const startingOutputTokenBalance = getRandomInteger(0, '100e18');
                const startingInputTokenBalance = getRandomInteger(0, '100e18');
                await outputToken.mint(taker, startingOutputTokenBalance).awaitTransactionSuccessAsync();
                await inputToken.mint(taker, startingInputTokenBalance).awaitTransactionSuccessAsync();
                const inputTokenAmount = getRandomPortion(startingInputTokenBalance);
                const minOutputTokenAmount = getRandomInteger(1, '1e18');
                const outputTokenMintAmount = minOutputTokenAmount.plus(1);
                const callValue = getRandomInteger(1, '1e18');
                const callDataHash = hexUtils.random();
                const transformation = createMintTokenTransformation({
                    outputTokenMintAmount,
                    inputTokenBurnAmunt: inputTokenAmount,
                });
                const receipt = await feature
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
                verifyEventsFromLogs(
                    receipt.logs,
                    [
                        {
                            taker,
                            inputTokenAmount,
                            outputTokenAmount: outputTokenMintAmount,
                            inputToken: inputToken.address,
                            outputToken: outputToken.address,
                        },
                    ],
                    TransformERC20FeatureEvents.TransformedERC20,
                );
                verifyEventsFromLogs(
                    receipt.logs,
                    [
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
                    ],
                    TestMintTokenERC20TransformerEvents.MintTransform,
                );
            });

            it("throws if taker's output token balance increases by less than minOutputTokenAmount", async () => {
                const startingOutputTokenBalance = getRandomInteger(0, '100e18');
                const startingInputTokenBalance = getRandomInteger(0, '100e18');
                await outputToken.mint(taker, startingOutputTokenBalance).awaitTransactionSuccessAsync();
                await inputToken.mint(taker, startingInputTokenBalance).awaitTransactionSuccessAsync();
                const inputTokenAmount = getRandomPortion(startingInputTokenBalance);
                const minOutputTokenAmount = getRandomInteger(1, '1e18');
                const outputTokenMintAmount = minOutputTokenAmount.minus(1);
                const callValue = getRandomInteger(1, '1e18');
                const tx = feature
                    ._transformERC20({
                        callDataHash: hexUtils.random(),
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
                const expectedError = new ZeroExRevertErrors.TransformERC20.IncompleteTransformERC20Error(
                    outputToken.address,
                    outputTokenMintAmount,
                    minOutputTokenAmount,
                );
                return expect(tx).to.revertWith(expectedError);
            });

            it("throws if taker's output token balance decreases", async () => {
                const startingOutputTokenBalance = getRandomInteger(0, '100e18');
                const startingInputTokenBalance = getRandomInteger(0, '100e18');
                await outputToken.mint(taker, startingOutputTokenBalance).awaitTransactionSuccessAsync();
                await inputToken.mint(taker, startingInputTokenBalance).awaitTransactionSuccessAsync();
                const inputTokenAmount = getRandomPortion(startingInputTokenBalance);
                const minOutputTokenAmount = ZERO_AMOUNT;
                const outputTokenFeeAmount = 1;
                const callValue = getRandomInteger(1, '1e18');
                const tx = feature
                    ._transformERC20({
                        callDataHash: hexUtils.random(),
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
                const expectedError = new ZeroExRevertErrors.TransformERC20.NegativeTransformERC20OutputError(
                    outputToken.address,
                    outputTokenFeeAmount,
                );
                return expect(tx).to.revertWith(expectedError);
            });

            it('can call multiple transformers', async () => {
                const startingOutputTokenBalance = getRandomInteger(0, '100e18');
                const startingInputTokenBalance = getRandomInteger(2, '100e18');
                await outputToken.mint(taker, startingOutputTokenBalance).awaitTransactionSuccessAsync();
                await inputToken.mint(taker, startingInputTokenBalance).awaitTransactionSuccessAsync();
                const inputTokenAmount = getRandomPortion(startingInputTokenBalance);
                const minOutputTokenAmount = getRandomInteger(2, '1e18');
                const outputTokenMintAmount = minOutputTokenAmount;
                const callValue = getRandomInteger(1, '1e18');
                const callDataHash = hexUtils.random();
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
                const receipt = await feature
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
                verifyEventsFromLogs(
                    receipt.logs,
                    [
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
                    ],
                    TestMintTokenERC20TransformerEvents.MintTransform,
                );
            });

            it('fails with invalid transformer nonce', async () => {
                const startingOutputTokenBalance = getRandomInteger(0, '100e18');
                const startingInputTokenBalance = getRandomInteger(2, '100e18');
                await outputToken.mint(taker, startingOutputTokenBalance).awaitTransactionSuccessAsync();
                await inputToken.mint(taker, startingInputTokenBalance).awaitTransactionSuccessAsync();
                const inputTokenAmount = getRandomPortion(startingInputTokenBalance);
                const minOutputTokenAmount = getRandomInteger(2, '1e18');
                const callValue = getRandomInteger(1, '1e18');
                const callDataHash = hexUtils.random();
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
                return expect(tx).to.revertWith(
                    new ZeroExRevertErrors.TransformERC20.TransformerFailedError(
                        undefined,
                        transformations[0].data,
                        constants.NULL_BYTES,
                    ),
                );
            });

            it('passes the calldata hash to transformer with proper signature', async () => {
                const startingOutputTokenBalance = getRandomInteger(0, '100e18');
                const startingInputTokenBalance = getRandomInteger(0, '100e18');
                await outputToken.mint(taker, startingOutputTokenBalance).awaitTransactionSuccessAsync();
                await inputToken.mint(taker, startingInputTokenBalance).awaitTransactionSuccessAsync();
                const inputTokenAmount = getRandomPortion(startingInputTokenBalance);
                const minOutputTokenAmount = getRandomInteger(1, '1e18');
                const outputTokenMintAmount = minOutputTokenAmount;
                const callValue = getRandomInteger(1, '1e18');
                const callDataHash = hexUtils.random();
                const transformation = createMintTokenTransformation({
                    outputTokenMintAmount,
                    inputTokenBurnAmunt: inputTokenAmount,
                });
                const receipt = await feature
                    ._transformERC20({
                        taker,
                        inputToken: inputToken.address,
                        outputToken: outputToken.address,
                        inputTokenAmount,
                        minOutputTokenAmount,
                        transformations: [transformation],
                        callDataHash,
                        callDataSignature: generateCallDataHashSignature(callDataHash, callDataSignerKey),
                    })
                    .awaitTransactionSuccessAsync({ value: callValue });
                const { callDataHash: actualCallDataHash } = (receipt.logs[0] as MintTokenTransformerEvent).args;
                expect(actualCallDataHash).to.eq(callDataHash);
            });

            it('passes empty calldata hash to transformer with improper signature', async () => {
                const startingOutputTokenBalance = getRandomInteger(0, '100e18');
                const startingInputTokenBalance = getRandomInteger(0, '100e18');
                await outputToken.mint(taker, startingOutputTokenBalance).awaitTransactionSuccessAsync();
                await inputToken.mint(taker, startingInputTokenBalance).awaitTransactionSuccessAsync();
                const inputTokenAmount = getRandomPortion(startingInputTokenBalance);
                const minOutputTokenAmount = getRandomInteger(1, '1e18');
                const outputTokenMintAmount = minOutputTokenAmount;
                const callValue = getRandomInteger(1, '1e18');
                const callDataHash = hexUtils.random();
                const transformation = createMintTokenTransformation({
                    outputTokenMintAmount,
                    inputTokenBurnAmunt: inputTokenAmount,
                });
                const receipt = await feature
                    ._transformERC20({
                        taker,
                        inputToken: inputToken.address,
                        outputToken: outputToken.address,
                        inputTokenAmount,
                        minOutputTokenAmount,
                        transformations: [transformation],
                        callDataHash,
                        callDataSignature: generateCallDataHashSignature(callDataHash, hexUtils.random()),
                    })
                    .awaitTransactionSuccessAsync({ value: callValue });
                const { callDataHash: actualCallDataHash } = (receipt.logs[0] as MintTokenTransformerEvent).args;
                expect(actualCallDataHash).to.eq(NULL_BYTES32);
            });

            it('passes empty calldata hash to transformer with no signature', async () => {
                const startingOutputTokenBalance = getRandomInteger(0, '100e18');
                const startingInputTokenBalance = getRandomInteger(0, '100e18');
                await outputToken.mint(taker, startingOutputTokenBalance).awaitTransactionSuccessAsync();
                await inputToken.mint(taker, startingInputTokenBalance).awaitTransactionSuccessAsync();
                const inputTokenAmount = getRandomPortion(startingInputTokenBalance);
                const minOutputTokenAmount = getRandomInteger(1, '1e18');
                const outputTokenMintAmount = minOutputTokenAmount;
                const callValue = getRandomInteger(1, '1e18');
                const callDataHash = hexUtils.random();
                const transformation = createMintTokenTransformation({
                    outputTokenMintAmount,
                    inputTokenBurnAmunt: inputTokenAmount,
                });
                const receipt = await feature
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
                const { callDataHash: actualCallDataHash } = (receipt.logs[0] as MintTokenTransformerEvent).args;
                expect(actualCallDataHash).to.eq(NULL_BYTES32);
            });
        });

        describe('transformERC20()', () => {
            it('passes the calldata hash to transformer with properly signed calldata', async () => {
                const startingOutputTokenBalance = getRandomInteger(0, '100e18');
                const startingInputTokenBalance = getRandomInteger(0, '100e18');
                await outputToken.mint(taker, startingOutputTokenBalance).awaitTransactionSuccessAsync();
                await inputToken.mint(taker, startingInputTokenBalance).awaitTransactionSuccessAsync();
                const inputTokenAmount = getRandomPortion(startingInputTokenBalance);
                const minOutputTokenAmount = getRandomInteger(1, '1e18');
                const outputTokenMintAmount = minOutputTokenAmount;
                const callValue = getRandomInteger(1, '1e18');
                const transformation = createMintTokenTransformation({
                    outputTokenMintAmount,
                    inputTokenBurnAmunt: inputTokenAmount,
                });
                const bakedCall = feature.transformERC20(
                    inputToken.address,
                    outputToken.address,
                    inputTokenAmount,
                    minOutputTokenAmount,
                    [transformation],
                );
                const callData = bakedCall.getABIEncodedTransactionData();
                const signedCallData = signCallData(callData, callDataSignerKey);
                const receipt = await bakedCall.awaitTransactionSuccessAsync({
                    from: taker,
                    value: callValue,
                    data: signedCallData,
                });
                const { callDataHash: actualCallDataHash } = (receipt.logs[0] as MintTokenTransformerEvent).args;
                expect(actualCallDataHash).to.eq(hexUtils.hash(callData));
            });

            it('passes empty calldata hash to transformer with improperly signed calldata', async () => {
                const startingOutputTokenBalance = getRandomInteger(0, '100e18');
                const startingInputTokenBalance = getRandomInteger(0, '100e18');
                await outputToken.mint(taker, startingOutputTokenBalance).awaitTransactionSuccessAsync();
                await inputToken.mint(taker, startingInputTokenBalance).awaitTransactionSuccessAsync();
                const inputTokenAmount = getRandomPortion(startingInputTokenBalance);
                const minOutputTokenAmount = getRandomInteger(1, '1e18');
                const outputTokenMintAmount = minOutputTokenAmount;
                const callValue = getRandomInteger(1, '1e18');
                const transformation = createMintTokenTransformation({
                    outputTokenMintAmount,
                    inputTokenBurnAmunt: inputTokenAmount,
                });
                const bakedCall = feature.transformERC20(
                    inputToken.address,
                    outputToken.address,
                    inputTokenAmount,
                    minOutputTokenAmount,
                    [transformation],
                );
                const callData = bakedCall.getABIEncodedTransactionData();
                const signedCallData = signCallData(callData, hexUtils.random());
                const receipt = await bakedCall.awaitTransactionSuccessAsync({
                    from: taker,
                    value: callValue,
                    data: signedCallData,
                });
                const { callDataHash: actualCallDataHash } = (receipt.logs[0] as MintTokenTransformerEvent).args;
                expect(actualCallDataHash).to.eq(NULL_BYTES32);
            });

            it('passes empty calldata hash to transformer with unsigned calldata', async () => {
                const startingOutputTokenBalance = getRandomInteger(0, '100e18');
                const startingInputTokenBalance = getRandomInteger(0, '100e18');
                await outputToken.mint(taker, startingOutputTokenBalance).awaitTransactionSuccessAsync();
                await inputToken.mint(taker, startingInputTokenBalance).awaitTransactionSuccessAsync();
                const inputTokenAmount = getRandomPortion(startingInputTokenBalance);
                const minOutputTokenAmount = getRandomInteger(1, '1e18');
                const outputTokenMintAmount = minOutputTokenAmount;
                const callValue = getRandomInteger(1, '1e18');
                const transformation = createMintTokenTransformation({
                    outputTokenMintAmount,
                    inputTokenBurnAmunt: inputTokenAmount,
                });
                const bakedCall = feature.transformERC20(
                    inputToken.address,
                    outputToken.address,
                    inputTokenAmount,
                    minOutputTokenAmount,
                    [transformation],
                );
                const callData = bakedCall.getABIEncodedTransactionData();
                const receipt = await bakedCall.awaitTransactionSuccessAsync({
                    from: taker,
                    value: callValue,
                    data: callData,
                });
                const { callDataHash: actualCallDataHash } = (receipt.logs[0] as MintTokenTransformerEvent).args;
                expect(actualCallDataHash).to.eq(NULL_BYTES32);
            });

            it('passes empty calldata hash to transformer with calldata with malformed signature', async () => {
                const startingOutputTokenBalance = getRandomInteger(0, '100e18');
                const startingInputTokenBalance = getRandomInteger(0, '100e18');
                await outputToken.mint(taker, startingOutputTokenBalance).awaitTransactionSuccessAsync();
                await inputToken.mint(taker, startingInputTokenBalance).awaitTransactionSuccessAsync();
                const inputTokenAmount = getRandomPortion(startingInputTokenBalance);
                const minOutputTokenAmount = getRandomInteger(1, '1e18');
                const outputTokenMintAmount = minOutputTokenAmount;
                const callValue = getRandomInteger(1, '1e18');
                const transformation = createMintTokenTransformation({
                    outputTokenMintAmount,
                    inputTokenBurnAmunt: inputTokenAmount,
                });
                const bakedCall = feature.transformERC20(
                    inputToken.address,
                    outputToken.address,
                    inputTokenAmount,
                    minOutputTokenAmount,
                    [transformation],
                );
                const callData = bakedCall.getABIEncodedTransactionData();
                const signedCallData = hexUtils.concat(
                    hexUtils.slice(signCallData(callData, hexUtils.random()), 0, -1),
                    127,
                );
                const receipt = await bakedCall.awaitTransactionSuccessAsync({
                    from: taker,
                    value: callValue,
                    data: signedCallData,
                });
                const { callDataHash: actualCallDataHash } = (receipt.logs[0] as MintTokenTransformerEvent).args;
                expect(actualCallDataHash).to.eq(NULL_BYTES32);
            });
        });
    });
});
