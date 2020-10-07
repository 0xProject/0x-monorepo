import { artifacts as erc20Artifacts, DummyERC20TokenContract } from '@0x/contracts-erc20';
import { blockchainTests, constants, expect, randomAddress, verifyEventsFromLogs } from '@0x/contracts-test-utils';
import { BigNumber, OwnableRevertErrors, ZeroExRevertErrors } from '@0x/utils';

import {
    IOwnableFeatureContract,
    IZeroExContract,
    LiquidityProviderFeatureContract,
    TokenSpenderFeatureContract,
} from '../../src/wrappers';
import { artifacts } from '../artifacts';
import { abis } from '../utils/abis';
import { fullMigrateAsync } from '../utils/migration';
import { IERC20BridgeEvents, TestBridgeContract, TestWethContract } from '../wrappers';

blockchainTests('LiquidityProvider feature', env => {
    let zeroEx: IZeroExContract;
    let feature: LiquidityProviderFeatureContract;
    let token: DummyERC20TokenContract;
    let weth: TestWethContract;
    let owner: string;
    let taker: string;

    before(async () => {
        [owner, taker] = await env.getAccountAddressesAsync();
        zeroEx = await fullMigrateAsync(owner, env.provider, env.txDefaults, {
            tokenSpender: (await TokenSpenderFeatureContract.deployFrom0xArtifactAsync(
                artifacts.TestTokenSpender,
                env.provider,
                env.txDefaults,
                artifacts,
            )).address,
        });
        const tokenSpender = new TokenSpenderFeatureContract(zeroEx.address, env.provider, env.txDefaults, abis);
        const allowanceTarget = await tokenSpender.getAllowanceTarget().callAsync();

        token = await DummyERC20TokenContract.deployFrom0xArtifactAsync(
            erc20Artifacts.DummyERC20Token,
            env.provider,
            env.txDefaults,
            erc20Artifacts,
            constants.DUMMY_TOKEN_NAME,
            constants.DUMMY_TOKEN_SYMBOL,
            constants.DUMMY_TOKEN_DECIMALS,
            constants.DUMMY_TOKEN_TOTAL_SUPPLY,
        );
        await token.setBalance(taker, constants.INITIAL_ERC20_BALANCE).awaitTransactionSuccessAsync();
        weth = await TestWethContract.deployFrom0xArtifactAsync(
            artifacts.TestWeth,
            env.provider,
            env.txDefaults,
            artifacts,
        );
        await token
            .approve(allowanceTarget, constants.INITIAL_ERC20_ALLOWANCE)
            .awaitTransactionSuccessAsync({ from: taker });

        feature = new LiquidityProviderFeatureContract(zeroEx.address, env.provider, env.txDefaults, abis);
        const featureImpl = await LiquidityProviderFeatureContract.deployFrom0xArtifactAsync(
            artifacts.LiquidityProviderFeature,
            env.provider,
            env.txDefaults,
            artifacts,
            weth.address,
        );
        await new IOwnableFeatureContract(zeroEx.address, env.provider, env.txDefaults, abis)
            .migrate(featureImpl.address, featureImpl.migrate().getABIEncodedTransactionData(), owner)
            .awaitTransactionSuccessAsync();
    });
    describe('Registry', () => {
        it('`getLiquidityProviderForMarket` reverts if address is not set', async () => {
            const [xAsset, yAsset] = [randomAddress(), randomAddress()];
            let tx = feature.getLiquidityProviderForMarket(xAsset, yAsset).awaitTransactionSuccessAsync();
            expect(tx).to.revertWith(
                new ZeroExRevertErrors.LiquidityProvider.NoLiquidityProviderForMarketError(xAsset, yAsset),
            );
            tx = feature.getLiquidityProviderForMarket(yAsset, xAsset).awaitTransactionSuccessAsync();
            return expect(tx).to.revertWith(
                new ZeroExRevertErrors.LiquidityProvider.NoLiquidityProviderForMarketError(yAsset, xAsset),
            );
        });
        it('can set/get a liquidity provider address for a given market', async () => {
            const expectedAddress = randomAddress();
            await feature
                .setLiquidityProviderForMarket(token.address, weth.address, expectedAddress)
                .awaitTransactionSuccessAsync();
            let actualAddress = await feature.getLiquidityProviderForMarket(token.address, weth.address).callAsync();
            expect(actualAddress).to.equal(expectedAddress);
            actualAddress = await feature.getLiquidityProviderForMarket(weth.address, token.address).callAsync();
            expect(actualAddress).to.equal(expectedAddress);
        });
        it('can update a liquidity provider address for a given market', async () => {
            const expectedAddress = randomAddress();
            await feature
                .setLiquidityProviderForMarket(token.address, weth.address, expectedAddress)
                .awaitTransactionSuccessAsync();
            let actualAddress = await feature.getLiquidityProviderForMarket(token.address, weth.address).callAsync();
            expect(actualAddress).to.equal(expectedAddress);
            actualAddress = await feature.getLiquidityProviderForMarket(weth.address, token.address).callAsync();
            expect(actualAddress).to.equal(expectedAddress);
        });
        it('can effectively remove a liquidity provider for a market by setting the address to 0', async () => {
            await feature
                .setLiquidityProviderForMarket(token.address, weth.address, constants.NULL_ADDRESS)
                .awaitTransactionSuccessAsync();
            const tx = feature
                .getLiquidityProviderForMarket(token.address, weth.address)
                .awaitTransactionSuccessAsync();
            return expect(tx).to.revertWith(
                new ZeroExRevertErrors.LiquidityProvider.NoLiquidityProviderForMarketError(token.address, weth.address),
            );
        });
        it('reverts if non-owner attempts to set an address', async () => {
            const tx = feature
                .setLiquidityProviderForMarket(randomAddress(), randomAddress(), randomAddress())
                .awaitTransactionSuccessAsync({ from: taker });
            return expect(tx).to.revertWith(new OwnableRevertErrors.OnlyOwnerError(taker, owner));
        });
    });
    blockchainTests.resets('Swap', () => {
        let liquidityProvider: TestBridgeContract;
        const ETH_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

        before(async () => {
            liquidityProvider = await TestBridgeContract.deployFrom0xArtifactAsync(
                artifacts.TestBridge,
                env.provider,
                env.txDefaults,
                artifacts,
                token.address,
                weth.address,
            );
            await feature
                .setLiquidityProviderForMarket(token.address, weth.address, liquidityProvider.address)
                .awaitTransactionSuccessAsync();
        });
        it('Cannot execute a swap for a market without a liquidity provider set', async () => {
            const [xAsset, yAsset] = [randomAddress(), randomAddress()];
            const tx = feature
                .sellToLiquidityProvider(
                    xAsset,
                    yAsset,
                    constants.NULL_ADDRESS,
                    constants.ONE_ETHER,
                    constants.ZERO_AMOUNT,
                )
                .awaitTransactionSuccessAsync({ from: taker });
            return expect(tx).to.revertWith(
                new ZeroExRevertErrors.LiquidityProvider.NoLiquidityProviderForMarketError(xAsset, yAsset),
            );
        });
        it('Successfully executes an ERC20-ERC20 swap', async () => {
            const tx = await feature
                .sellToLiquidityProvider(
                    weth.address,
                    token.address,
                    constants.NULL_ADDRESS,
                    constants.ONE_ETHER,
                    constants.ZERO_AMOUNT,
                )
                .awaitTransactionSuccessAsync({ from: taker });
            verifyEventsFromLogs(
                tx.logs,
                [
                    {
                        inputToken: token.address,
                        outputToken: weth.address,
                        inputTokenAmount: constants.ONE_ETHER,
                        outputTokenAmount: constants.ZERO_AMOUNT,
                        from: constants.NULL_ADDRESS,
                        to: taker,
                    },
                ],
                IERC20BridgeEvents.ERC20BridgeTransfer,
            );
        });
        it('Reverts if cannot fulfill the minimum buy amount', async () => {
            const minBuyAmount = new BigNumber(1);
            const tx = feature
                .sellToLiquidityProvider(
                    weth.address,
                    token.address,
                    constants.NULL_ADDRESS,
                    constants.ONE_ETHER,
                    minBuyAmount,
                )
                .awaitTransactionSuccessAsync({ from: taker });
            return expect(tx).to.revertWith(
                new ZeroExRevertErrors.LiquidityProvider.LiquidityProviderIncompleteSellError(
                    liquidityProvider.address,
                    weth.address,
                    token.address,
                    constants.ONE_ETHER,
                    constants.ZERO_AMOUNT,
                    minBuyAmount,
                ),
            );
        });
        it('Successfully executes an ETH-ERC20 swap', async () => {
            const tx = await feature
                .sellToLiquidityProvider(
                    token.address,
                    ETH_TOKEN_ADDRESS,
                    constants.NULL_ADDRESS,
                    constants.ONE_ETHER,
                    constants.ZERO_AMOUNT,
                )
                .awaitTransactionSuccessAsync({ from: taker, value: constants.ONE_ETHER });
            verifyEventsFromLogs(
                tx.logs,
                [
                    {
                        inputToken: weth.address,
                        outputToken: token.address,
                        inputTokenAmount: constants.ONE_ETHER,
                        outputTokenAmount: constants.ZERO_AMOUNT,
                        from: constants.NULL_ADDRESS,
                        to: taker,
                    },
                ],
                IERC20BridgeEvents.ERC20BridgeTransfer,
            );
        });
        it('Successfully executes an ERC20-ETH swap', async () => {
            const tx = await feature
                .sellToLiquidityProvider(
                    ETH_TOKEN_ADDRESS,
                    token.address,
                    constants.NULL_ADDRESS,
                    constants.ONE_ETHER,
                    constants.ZERO_AMOUNT,
                )
                .awaitTransactionSuccessAsync({ from: taker });
            verifyEventsFromLogs(
                tx.logs,
                [
                    {
                        inputToken: token.address,
                        outputToken: weth.address,
                        inputTokenAmount: constants.ONE_ETHER,
                        outputTokenAmount: constants.ZERO_AMOUNT,
                        from: constants.NULL_ADDRESS,
                        to: zeroEx.address,
                    },
                ],
                IERC20BridgeEvents.ERC20BridgeTransfer,
            );
        });
    });
});
