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
import { AbiEncoder, hexUtils, OwnableRevertErrors, ZeroExRevertErrors } from '@0x/utils';

import { ETH_TOKEN_ADDRESS } from '../../src/constants';
import { artifacts } from '../artifacts';
import { abis } from '../utils/abis';
import { fullMigrateAsync } from '../utils/migration';
import {
    FlashWalletContract,
    ITokenSpenderContract,
    TestMintableERC20TokenContract,
    TestMintTokenERC20TransformerContract,
    TestMintTokenERC20TransformerEvents,
    TransformERC20Contract,
    TransformERC20Events,
    ZeroExContract,
} from '../wrappers';

blockchainTests.resets('TransformERC20 feature', env => {
    let owner: string;
    let taker: string;
    let transformerDeployer: string;
    let zeroEx: ZeroExContract;
    let feature: TransformERC20Contract;
    let wallet: FlashWalletContract;
    let allowanceTarget: string;

    before(async () => {
        [owner, taker, transformerDeployer] = await env.getAccountAddressesAsync();
        zeroEx = await fullMigrateAsync(
            owner,
            env.provider,
            env.txDefaults,
            {
                transformERC20: await TransformERC20Contract.deployFrom0xArtifactAsync(
                    artifacts.TestTransformERC20,
                    env.provider,
                    env.txDefaults,
                    artifacts,
                ),
            },
            { transformerDeployer },
        );
        feature = new TransformERC20Contract(zeroEx.address, env.provider, env.txDefaults, abis);
        wallet = new FlashWalletContract(await feature.getTransformWallet().callAsync(), env.provider, env.txDefaults);
        allowanceTarget = await new ITokenSpenderContract(zeroEx.address, env.provider, env.txDefaults)
            .getAllowanceTarget()
            .callAsync();
    });

    const { MAX_UINT256, ZERO_AMOUNT } = constants;

    describe('wallets', () => {
        it('createTransformWallet() replaces the current wallet', async () => {
            const newWalletAddress = await feature.createTransformWallet().callAsync();
            expect(newWalletAddress).to.not.eq(wallet.address);
            await feature.createTransformWallet().awaitTransactionSuccessAsync();
            return expect(feature.getTransformWallet().callAsync()).to.eventually.eq(newWalletAddress);
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
                TransformERC20Events.TransformerDeployerUpdated,
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

    describe('_transformERC20()', () => {
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
                ._transformERC20(
                    callDataHash,
                    taker,
                    inputToken.address,
                    outputToken.address,
                    inputTokenAmount,
                    minOutputTokenAmount,
                    [transformation],
                )
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
                TransformERC20Events.TransformedERC20,
            );
            verifyEventsFromLogs(
                receipt.logs,
                [
                    {
                        callDataHash,
                        taker,
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
                ._transformERC20(
                    callDataHash,
                    taker,
                    inputToken.address,
                    ETH_TOKEN_ADDRESS,
                    inputTokenAmount,
                    minOutputTokenAmount,
                    [transformation],
                )
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
                TransformERC20Events.TransformedERC20,
            );
            verifyEventsFromLogs(
                receipt.logs,
                [
                    {
                        callDataHash,
                        taker,
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
                ._transformERC20(
                    callDataHash,
                    taker,
                    inputToken.address,
                    outputToken.address,
                    inputTokenAmount,
                    minOutputTokenAmount,
                    [transformation],
                )
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
                TransformERC20Events.TransformedERC20,
            );
            verifyEventsFromLogs(
                receipt.logs,
                [
                    {
                        callDataHash,
                        taker,
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
                ._transformERC20(
                    hexUtils.random(),
                    taker,
                    inputToken.address,
                    outputToken.address,
                    inputTokenAmount,
                    minOutputTokenAmount,
                    [
                        createMintTokenTransformation({
                            outputTokenMintAmount,
                            inputTokenBurnAmunt: inputTokenAmount,
                        }),
                    ],
                )
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
                ._transformERC20(
                    hexUtils.random(),
                    taker,
                    inputToken.address,
                    outputToken.address,
                    inputTokenAmount,
                    minOutputTokenAmount,
                    [
                        createMintTokenTransformation({
                            outputTokenFeeAmount,
                            inputTokenBurnAmunt: inputTokenAmount,
                        }),
                    ],
                )
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
                ._transformERC20(
                    callDataHash,
                    taker,
                    inputToken.address,
                    outputToken.address,
                    inputTokenAmount,
                    minOutputTokenAmount,
                    transformations,
                )
                .awaitTransactionSuccessAsync({ value: callValue });
            verifyEventsFromLogs(
                receipt.logs,
                [
                    {
                        callDataHash,
                        taker,
                        context: wallet.address,
                        caller: zeroEx.address,
                        data: transformations[0].data,
                        inputTokenBalance: inputTokenAmount,
                        ethBalance: callValue,
                    },
                    {
                        callDataHash,
                        taker,
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
                ._transformERC20(
                    callDataHash,
                    taker,
                    inputToken.address,
                    outputToken.address,
                    inputTokenAmount,
                    minOutputTokenAmount,
                    transformations,
                )
                .awaitTransactionSuccessAsync({ value: callValue });
            return expect(tx).to.revertWith(
                new ZeroExRevertErrors.TransformERC20.TransformerFailedError(
                    undefined,
                    transformations[0].data,
                    constants.NULL_BYTES,
                ),
            );
        });
    });
});
