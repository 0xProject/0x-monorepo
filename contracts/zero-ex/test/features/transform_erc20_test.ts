import {
    blockchainTests,
    constants,
    expect,
    getRandomInteger,
    getRandomPortion,
    verifyEventsFromLogs,
} from '@0x/contracts-test-utils';
import { BigNumber, hexUtils, ZeroExRevertErrors } from '@0x/utils';

import { artifacts } from '../artifacts';
import { abis } from '../utils/abis';
import { fullMigrateAsync } from '../utils/migration';
import {
    IPuppetPoolContract,
    ITokenSpenderContract,
    TestMintableERC20TokenContract,
    TestMintTokenERC20TransformerContract,
    TestMintTokenERC20TransformerEvents,
    TransformERC20Contract,
    TransformERC20Events,
    ZeroExContract,
} from '../wrappers';

blockchainTests.resets('TransformERC20 feature', env => {
    let taker: string;
    let zeroEx: ZeroExContract;
    let feature: TransformERC20Contract;
    let puppetPool: IPuppetPoolContract;
    let spenderAddress: string;
    let puppetAddress: string;

    before(async () => {
        let owner;
        [owner, taker] = await env.getAccountAddressesAsync();
        zeroEx = await fullMigrateAsync(owner, env.provider, env.txDefaults, {
            transformERC20: (await TransformERC20Contract.deployFrom0xArtifactAsync(
                artifacts.TestTransformERC20,
                env.provider,
                env.txDefaults,
                artifacts,
            )).address,
        });
        feature = new TransformERC20Contract(zeroEx.address, env.provider, env.txDefaults, abis);
        puppetPool = new IPuppetPoolContract(zeroEx.address, env.provider, env.txDefaults, abis);
        // Create a puppet to be (re)used by transforms.
        puppetAddress = await puppetPool.createFreePuppet().callAsync();
        await puppetPool.createFreePuppet().awaitTransactionSuccessAsync();
    });

    const ETH_TOKEN_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

    describe('_transformERC20()', () => {
        let inputToken: TestMintableERC20TokenContract;
        let outputToken: TestMintableERC20TokenContract;
        let mintTransformer: TestMintTokenERC20TransformerContract;

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
            mintTransformer = await TestMintTokenERC20TransformerContract.deployFrom0xArtifactAsync(
                artifacts.TestMintTokenERC20Transformer,
                env.provider,
                env.txDefaults,
                artifacts,
            );
            spenderAddress = await new ITokenSpenderContract(zeroEx.address, env.provider, env.txDefaults, abis)
                .getTokenSpenderPuppet()
                .callAsync();
        });

        function encodeMintTokenTransformerData(
            _outputToken: TestMintableERC20TokenContract,
            outputTokenMintAmount: BigNumber,
            _taker: string,
        ): string {
            return hexUtils.concat(
                hexUtils.leftPad(_outputToken.address),
                hexUtils.leftPad(outputTokenMintAmount),
                hexUtils.leftPad(_taker),
            );
        }

        it("succeeds if taker's output token balance increases by exactly minOutputTokenAmount", async () => {
            const startingOutputTokenBalance = getRandomInteger(0, '100e18');
            const startingInputTokenBalance = getRandomInteger(0, '100e18');
            await outputToken.mint(taker, startingOutputTokenBalance).awaitTransactionSuccessAsync();
            await inputToken.mint(taker, startingInputTokenBalance).awaitTransactionSuccessAsync();
            const inputTokenAmount = getRandomPortion(startingInputTokenBalance);
            const minOutputTokenAmount = getRandomInteger(1, '1e18');
            const outputTokenMintAmount = minOutputTokenAmount;
            const callDataHash = hexUtils.random();
            const transformerData = encodeMintTokenTransformerData(outputToken, outputTokenMintAmount, taker);
            const receipt = await feature
                ._transformERC20(
                    callDataHash,
                    taker,
                    inputToken.address,
                    outputToken.address,
                    inputTokenAmount,
                    minOutputTokenAmount,
                    [
                        {
                            transformer: mintTransformer.address,
                            tokens: [inputToken.address],
                            amounts: [inputTokenAmount],
                            data: transformerData,
                        },
                    ],
                )
                .awaitTransactionSuccessAsync();
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
                TransformERC20Events.TransformedERC20,
            );
            verifyEventsFromLogs(
                receipt.logs,
                [
                    {
                        callDataHash,
                        taker,
                        caller: puppetAddress,
                        tokens: [inputToken.address],
                        amounts: [inputTokenAmount],
                        data: transformerData,
                    },
                ],
                TestMintTokenERC20TransformerEvents.MintTransform,
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
            const callDataHash = hexUtils.random();
            const transformerData = encodeMintTokenTransformerData(outputToken, outputTokenMintAmount, taker);
            const receipt = await feature
                ._transformERC20(
                    callDataHash,
                    taker,
                    inputToken.address,
                    outputToken.address,
                    inputTokenAmount,
                    minOutputTokenAmount,
                    [
                        {
                            transformer: mintTransformer.address,
                            tokens: [inputToken.address],
                            amounts: [inputTokenAmount],
                            data: transformerData,
                        },
                    ],
                )
                .awaitTransactionSuccessAsync({ from: taker });
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
                TransformERC20Events.TransformedERC20,
            );
            verifyEventsFromLogs(
                receipt.logs,
                [
                    {
                        callDataHash,
                        taker,
                        caller: puppetAddress,
                        tokens: [inputToken.address],
                        amounts: [inputTokenAmount],
                        data: transformerData,
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
            const tx = feature
                ._transformERC20(
                    hexUtils.random(),
                    taker,
                    inputToken.address,
                    outputToken.address,
                    inputTokenAmount,
                    minOutputTokenAmount,
                    [
                        {
                            transformer: mintTransformer.address,
                            tokens: [inputToken.address],
                            amounts: [inputTokenAmount],
                            data: encodeMintTokenTransformerData(outputToken, outputTokenMintAmount, taker),
                        },
                    ],
                )
                .awaitTransactionSuccessAsync({ from: taker });
            const expectedError = new ZeroExRevertErrors.TransformERC20.IncompleteERC20TransformError(
                outputToken.address,
                outputTokenMintAmount,
                minOutputTokenAmount,
            );
            return expect(tx).to.revertWith(expectedError);
        });

        it('returns puppet to pool', async () => {
            const startingOutputTokenBalance = getRandomInteger(0, '100e18');
            const startingInputTokenBalance = getRandomInteger(0, '100e18');
            await outputToken.mint(taker, startingOutputTokenBalance).awaitTransactionSuccessAsync();
            await inputToken.mint(taker, startingInputTokenBalance).awaitTransactionSuccessAsync();
            const inputTokenAmount = getRandomPortion(startingInputTokenBalance);
            const minOutputTokenAmount = getRandomInteger(1, '1e18');
            const outputTokenMintAmount = minOutputTokenAmount;
            await feature
                ._transformERC20(
                    hexUtils.random(),
                    taker,
                    inputToken.address,
                    outputToken.address,
                    inputTokenAmount,
                    minOutputTokenAmount,
                    [
                        {
                            transformer: mintTransformer.address,
                            tokens: [inputToken.address],
                            amounts: [inputTokenAmount],
                            data: encodeMintTokenTransformerData(outputToken, outputTokenMintAmount, taker),
                        },
                    ],
                )
                .awaitTransactionSuccessAsync({ from: taker });
            expect(await puppetPool.getFreePuppetsCount().callAsync()).to.bignumber.eq(1);
        });

        it('can transfer multiple tokens and ETH to a transformer', async () => {
            const startingOutputTokenBalance = getRandomInteger(0, '100e18');
            const startingInputTokenBalance = getRandomInteger(0, '100e18');
            await outputToken.mint(taker, startingOutputTokenBalance).awaitTransactionSuccessAsync();
            await inputToken.mint(taker, startingInputTokenBalance).awaitTransactionSuccessAsync();
            const inputTokenAmount = getRandomPortion(startingInputTokenBalance);
            const minOutputTokenAmount = getRandomInteger(1, '1e18');
            const outputTokenMintAmount = minOutputTokenAmount;
            const ethAttached = getRandomInteger(1, '1e18');
            const callDataHash = hexUtils.random();
            const transformations = [
                // Transfer the input token and ETH to the first transformer, return
                // the input tokens to the sender, mint output tokens the sender.
                {
                    transformer: mintTransformer.address,
                    tokens: [inputToken.address],
                    amounts: [inputTokenAmount],
                    data: encodeMintTokenTransformerData(outputToken, outputTokenMintAmount, constants.NULL_ADDRESS),
                },
                // Accept the input token, the previously minted output tokens,
                // and ETH, then mint more output tokens to the taker.
                {
                    transformer: mintTransformer.address,
                    tokens: [inputToken.address, ETH_TOKEN_ADDRESS, outputToken.address],
                    amounts: [inputTokenAmount, ethAttached, outputTokenMintAmount],
                    data: encodeMintTokenTransformerData(outputToken, outputTokenMintAmount, taker),
                },
            ];
            const receipt = await feature
                ._transformERC20(
                    callDataHash,
                    taker,
                    inputToken.address,
                    outputToken.address,
                    inputTokenAmount,
                    minOutputTokenAmount,
                    transformations,
                )
                .awaitTransactionSuccessAsync({ from: taker, value: ethAttached });
            verifyEventsFromLogs(
                receipt.logs,
                [
                    {
                        callDataHash,
                        taker,
                        caller: puppetAddress,
                        tokens: [inputToken.address],
                        amounts: [inputTokenAmount],
                        data: transformations[0].data,
                    },
                    {
                        callDataHash,
                        taker,
                        caller: puppetAddress,
                        tokens: [inputToken.address, ETH_TOKEN_ADDRESS, outputToken.address],
                        amounts: [inputTokenAmount, ethAttached, outputTokenMintAmount],
                        data: transformations[1].data,
                    },
                ],
                TestMintTokenERC20TransformerEvents.MintTransform,
            );
        });

        it('can consume entire transferrable taker balance', async () => {
            const startingOutputTokenBalance = getRandomInteger(0, '100e18');
            const startingInputTokenBalance = getRandomInteger(1, '100e18');
            const inputTokenAllowance = getRandomInteger(1, '100e18');
            const transferrableInputTokenAmount = BigNumber.min(startingInputTokenBalance, inputTokenAllowance);
            await outputToken.mint(taker, startingOutputTokenBalance).awaitTransactionSuccessAsync();
            await inputToken.mint(taker, startingInputTokenBalance).awaitTransactionSuccessAsync();
            await inputToken.approve(spenderAddress, inputTokenAllowance).awaitTransactionSuccessAsync({ from: taker });
            const minOutputTokenAmount = getRandomInteger(1, '1e18');
            const outputTokenMintAmount = minOutputTokenAmount;
            const callDataHash = hexUtils.random();
            const transformerData = encodeMintTokenTransformerData(outputToken, outputTokenMintAmount, taker);
            const receipt = await feature
                ._transformERC20(
                    callDataHash,
                    taker,
                    inputToken.address,
                    outputToken.address,
                    constants.MAX_UINT256,
                    minOutputTokenAmount,
                    [
                        {
                            transformer: mintTransformer.address,
                            tokens: [inputToken.address],
                            amounts: [transferrableInputTokenAmount],
                            data: transformerData,
                        },
                    ],
                )
                .awaitTransactionSuccessAsync({ from: taker });
            verifyEventsFromLogs(
                receipt.logs,
                [
                    {
                        taker,
                        inputTokenAmount: transferrableInputTokenAmount,
                        outputTokenAmount: outputTokenMintAmount,
                        inputToken: inputToken.address,
                        outputToken: outputToken.address,
                    },
                ],
                TransformERC20Events.TransformedERC20,
            );
            verifyEventsFromLogs(
                receipt.logs,
                [
                    {
                        callDataHash,
                        taker,
                        caller: puppetAddress,
                        tokens: [inputToken.address],
                        amounts: [transferrableInputTokenAmount],
                        data: transformerData,
                    },
                ],
                TestMintTokenERC20TransformerEvents.MintTransform,
            );
        });

        it('can transfer entire token and ETH balance to transformer', async () => {
            const startingOutputTokenBalance = getRandomInteger(0, '100e18');
            const startingInputTokenBalance = getRandomInteger(1, '100e18');
            const inputTokenAmount = getRandomPortion(startingInputTokenBalance);
            await outputToken.mint(taker, startingOutputTokenBalance).awaitTransactionSuccessAsync();
            await inputToken.mint(taker, startingInputTokenBalance).awaitTransactionSuccessAsync();
            const minOutputTokenAmount = getRandomInteger(1, '1e18');
            const outputTokenMintAmount = minOutputTokenAmount;
            const callDataHash = hexUtils.random();
            const ethAttached = getRandomInteger(1, '1e18');
            const transformerData = encodeMintTokenTransformerData(outputToken, outputTokenMintAmount, taker);
            const receipt = await feature
                ._transformERC20(
                    callDataHash,
                    taker,
                    inputToken.address,
                    outputToken.address,
                    inputTokenAmount,
                    minOutputTokenAmount,
                    [
                        {
                            transformer: mintTransformer.address,
                            tokens: [inputToken.address, ETH_TOKEN_ADDRESS],
                            amounts: [constants.MAX_UINT256, constants.MAX_UINT256],
                            data: transformerData,
                        },
                    ],
                )
                .awaitTransactionSuccessAsync({ from: taker, value: ethAttached });
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
                TransformERC20Events.TransformedERC20,
            );
            verifyEventsFromLogs(
                receipt.logs,
                [
                    {
                        callDataHash,
                        taker,
                        caller: puppetAddress,
                        tokens: [inputToken.address, ETH_TOKEN_ADDRESS],
                        amounts: [inputTokenAmount, ethAttached],
                        data: transformerData,
                    },
                ],
                TestMintTokenERC20TransformerEvents.MintTransform,
            );
        });

        it('can transfer partial token and ETH balance to transformer', async () => {
            const startingOutputTokenBalance = getRandomInteger(0, '100e18');
            const startingInputTokenBalance = getRandomInteger(1, '100e18');
            const ethAttached = getRandomInteger(1, '1e18');
            const inputTokenAmount = getRandomPortion(startingInputTokenBalance);
            const inputTokenTransformAmount = getRandomPortion(ethAttached);
            const ethTransformAmount = getRandomPortion(ethAttached);
            await outputToken.mint(taker, startingOutputTokenBalance).awaitTransactionSuccessAsync();
            await inputToken.mint(taker, startingInputTokenBalance).awaitTransactionSuccessAsync();
            const minOutputTokenAmount = getRandomInteger(1, '1e18');
            const outputTokenMintAmount = minOutputTokenAmount;
            const callDataHash = hexUtils.random();
            const transformerData = encodeMintTokenTransformerData(outputToken, outputTokenMintAmount, taker);
            const receipt = await feature
                ._transformERC20(
                    callDataHash,
                    taker,
                    inputToken.address,
                    outputToken.address,
                    inputTokenAmount,
                    minOutputTokenAmount,
                    [
                        {
                            transformer: mintTransformer.address,
                            tokens: [inputToken.address, ETH_TOKEN_ADDRESS],
                            amounts: [inputTokenTransformAmount, ethTransformAmount],
                            data: transformerData,
                        },
                    ],
                )
                .awaitTransactionSuccessAsync({ from: taker, value: ethAttached });
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
                TransformERC20Events.TransformedERC20,
            );
            verifyEventsFromLogs(
                receipt.logs,
                [
                    {
                        callDataHash,
                        taker,
                        caller: puppetAddress,
                        tokens: [inputToken.address, ETH_TOKEN_ADDRESS],
                        amounts: [inputTokenTransformAmount, ethTransformAmount],
                        data: transformerData,
                    },
                ],
                TestMintTokenERC20TransformerEvents.MintTransform,
            );
        });
    });
});
