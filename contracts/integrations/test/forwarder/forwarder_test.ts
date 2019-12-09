import { DummyERC20TokenContract } from '@0x/contracts-erc20';
import { DummyERC721TokenContract } from '@0x/contracts-erc721';
import { artifacts as exchangeArtifacts, ExchangeContract } from '@0x/contracts-exchange';
import { artifacts, ExchangeForwarderRevertErrors, ForwarderContract } from '@0x/contracts-exchange-forwarder';
import {
    blockchainTests,
    constants,
    expect,
    getLatestBlockTimestampAsync,
    randomAddress,
    toBaseUnitAmount,
} from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';

import { Actor } from '../framework/actors/base';
import { FeeRecipient } from '../framework/actors/fee_recipient';
import { Maker } from '../framework/actors/maker';
import { Taker } from '../framework/actors/taker';
import { actorAddressesByName } from '../framework/actors/utils';
import { BlockchainBalanceStore } from '../framework/balances/blockchain_balance_store';
import { LocalBalanceStore } from '../framework/balances/local_balance_store';
import { DeploymentManager } from '../framework/deployment_manager';

import { deployForwarderAsync } from './deploy_forwarder';
import { ForwarderTestFactory } from './forwarder_test_factory';

blockchainTests('Forwarder integration tests', env => {
    let deployment: DeploymentManager;
    let forwarder: ForwarderContract;
    let balanceStore: BlockchainBalanceStore;
    let testFactory: ForwarderTestFactory;

    let makerToken: DummyERC20TokenContract;
    let makerFeeToken: DummyERC20TokenContract;
    let anotherErc20Token: DummyERC20TokenContract;
    let erc721Token: DummyERC721TokenContract;
    let nftId: BigNumber;
    let wethAssetData: string;
    let makerAssetData: string;

    let maker: Maker;
    let taker: Taker;
    let orderFeeRecipient: FeeRecipient;
    let forwarderFeeRecipient: FeeRecipient;

    before(async () => {
        deployment = await DeploymentManager.deployAsync(env, {
            numErc20TokensToDeploy: 3,
            numErc721TokensToDeploy: 1,
            numErc1155TokensToDeploy: 0,
        });
        forwarder = await deployForwarderAsync(deployment, env);

        [makerToken, makerFeeToken, anotherErc20Token] = deployment.tokens.erc20;
        [erc721Token] = deployment.tokens.erc721;
        wethAssetData = deployment.assetDataEncoder
            .ERC20Token(deployment.tokens.weth.address)
            .getABIEncodedTransactionData();
        makerAssetData = deployment.assetDataEncoder.ERC20Token(makerToken.address).getABIEncodedTransactionData();

        taker = new Taker({ name: 'Taker', deployment });
        orderFeeRecipient = new FeeRecipient({
            name: 'Order fee recipient',
            deployment,
        });
        forwarderFeeRecipient = new FeeRecipient({
            name: 'Forwarder fee recipient',
            deployment,
        });
        maker = new Maker({
            name: 'Maker',
            deployment,
            orderConfig: {
                feeRecipientAddress: orderFeeRecipient.address,
                makerAssetAmount: toBaseUnitAmount(2),
                takerAssetAmount: toBaseUnitAmount(1),
                makerAssetData,
                takerAssetData: wethAssetData,
                takerFee: constants.ZERO_AMOUNT,
                makerFeeAssetData: deployment.assetDataEncoder
                    .ERC20Token(makerFeeToken.address)
                    .getABIEncodedTransactionData(),
                takerFeeAssetData: wethAssetData,
            },
        });

        await maker.configureERC20TokenAsync(makerToken);
        await maker.configureERC20TokenAsync(makerFeeToken);
        await maker.configureERC20TokenAsync(anotherErc20Token);
        await forwarder.approveMakerAssetProxy(makerAssetData).awaitTransactionSuccessAsync();
        [nftId] = await maker.configureERC721TokenAsync(erc721Token);

        const tokenOwners = {
            ...actorAddressesByName([maker, taker, orderFeeRecipient, forwarderFeeRecipient]),
            Forwarder: forwarder.address,
            StakingProxy: deployment.staking.stakingProxy.address,
        };
        const tokenContracts = {
            erc20: { makerToken, makerFeeToken, anotherErc20Token, wETH: deployment.tokens.weth },
            erc721: { erc721Token },
        };
        const tokenIds = { erc721: { [erc721Token.address]: [nftId] } };
        balanceStore = new BlockchainBalanceStore(tokenOwners, tokenContracts, tokenIds);

        testFactory = new ForwarderTestFactory(forwarder, deployment, balanceStore, taker);
    });

    after(async () => {
        Actor.reset();
    });

    blockchainTests.resets('constructor', () => {
        it('should revert if assetProxy is unregistered', async () => {
            const chainId = await env.getChainIdAsync();
            const exchange = await ExchangeContract.deployFrom0xArtifactAsync(
                exchangeArtifacts.Exchange,
                env.provider,
                env.txDefaults,
                {},
                new BigNumber(chainId),
            );
            const deployForwarder = ForwarderContract.deployFrom0xArtifactAsync(
                artifacts.Forwarder,
                env.provider,
                env.txDefaults,
                {},
                exchange.address,
                deployment.tokens.weth.address,
            );
            await expect(deployForwarder).to.revertWith(
                new ExchangeForwarderRevertErrors.UnregisteredAssetProxyError(),
            );
        });
    });
    blockchainTests.resets('marketSellOrdersWithEth without extra fees', () => {
        it('should fill a single order without a taker fee', async () => {
            const orderWithoutFee = await maker.signOrderAsync();
            await testFactory.marketSellTestAsync([orderWithoutFee], 0.78);
        });
        it('should fill multiple orders without taker fees', async () => {
            const firstOrder = await maker.signOrderAsync();
            const secondOrder = await maker.signOrderAsync({
                makerAssetAmount: toBaseUnitAmount(285),
                takerAssetAmount: toBaseUnitAmount(21),
            });
            const orders = [firstOrder, secondOrder];
            await testFactory.marketSellTestAsync(orders, 1.51);
        });
        it('should fill a single order with a percentage fee', async () => {
            const orderWithPercentageFee = await maker.signOrderAsync({
                takerFee: toBaseUnitAmount(1),
                takerFeeAssetData: makerAssetData,
            });
            await testFactory.marketSellTestAsync([orderWithPercentageFee], 0.58);
        });
        it('should fill multiple orders with percentage fees', async () => {
            const firstOrder = await maker.signOrderAsync({
                takerFee: toBaseUnitAmount(1),
                takerFeeAssetData: makerAssetData,
            });
            const secondOrder = await maker.signOrderAsync({
                makerAssetAmount: toBaseUnitAmount(190),
                takerAssetAmount: toBaseUnitAmount(31),
                takerFee: toBaseUnitAmount(2),
                takerFeeAssetData: makerAssetData,
            });
            const orders = [firstOrder, secondOrder];
            await testFactory.marketSellTestAsync(orders, 1.34);
        });
        it('should fail to fill an order with a percentage fee if the asset proxy is not yet approved', async () => {
            const unapprovedAsset = deployment.assetDataEncoder
                .ERC20Token(anotherErc20Token.address)
                .getABIEncodedTransactionData();
            const order = await maker.signOrderAsync({
                makerAssetData: unapprovedAsset,
                takerFee: toBaseUnitAmount(2),
                takerFeeAssetData: unapprovedAsset,
            });

            await balanceStore.updateBalancesAsync();
            // Execute test case
            const tx = await forwarder
                .marketSellOrdersWithEth([order], [order.signature], [], [])
                .awaitTransactionSuccessAsync({
                    value: order.takerAssetAmount.plus(DeploymentManager.protocolFee),
                    from: taker.address,
                });

            const expectedBalances = LocalBalanceStore.create(balanceStore);
            expectedBalances.burnGas(tx.from, DeploymentManager.gasPrice.times(tx.gasUsed));

            // Verify balances
            await balanceStore.updateBalancesAsync();
            balanceStore.assertEquals(expectedBalances);
        });
        it('should fill a single order with a WETH fee', async () => {
            const orderWithWethFee = await maker.signOrderAsync({
                takerFee: toBaseUnitAmount(1),
                takerFeeAssetData: wethAssetData,
            });
            await testFactory.marketSellTestAsync([orderWithWethFee], 0.13);
        });
        it('should fill multiple orders with WETH fees', async () => {
            const firstOrder = await maker.signOrderAsync({
                takerFee: toBaseUnitAmount(1),
                takerFeeAssetData: wethAssetData,
            });
            const secondOrderWithWethFee = await maker.signOrderAsync({
                makerAssetAmount: toBaseUnitAmount(97),
                takerAssetAmount: toBaseUnitAmount(33),
                takerFee: toBaseUnitAmount(2),
                takerFeeAssetData: wethAssetData,
            });
            const orders = [firstOrder, secondOrderWithWethFee];
            await testFactory.marketSellTestAsync(orders, 1.25);
        });
        it('should refund remaining ETH if amount is greater than takerAssetAmount', async () => {
            const order = await maker.signOrderAsync();
            const ethValue = order.takerAssetAmount.plus(DeploymentManager.protocolFee).plus(2);
            const takerEthBalanceBefore = await env.web3Wrapper.getBalanceInWeiAsync(taker.address);
            const tx = await forwarder
                .marketSellOrdersWithEth([order], [order.signature], [], [])
                .awaitTransactionSuccessAsync({
                    value: ethValue,
                    from: taker.address,
                });
            const takerEthBalanceAfter = await env.web3Wrapper.getBalanceInWeiAsync(taker.address);
            const totalEthSpent = order.takerAssetAmount
                .plus(DeploymentManager.protocolFee)
                .plus(DeploymentManager.gasPrice.times(tx.gasUsed));
            expect(takerEthBalanceAfter).to.be.bignumber.equal(takerEthBalanceBefore.minus(totalEthSpent));
        });
        it('should fill orders with different makerAssetData', async () => {
            const firstOrder = await maker.signOrderAsync();
            const secondOrderMakerAssetData = deployment.assetDataEncoder
                .ERC20Token(anotherErc20Token.address)
                .getABIEncodedTransactionData();
            const secondOrder = await maker.signOrderAsync({
                makerAssetData: secondOrderMakerAssetData,
            });
            await forwarder.approveMakerAssetProxy(secondOrderMakerAssetData).awaitTransactionSuccessAsync();
            const orders = [firstOrder, secondOrder];
            await testFactory.marketSellTestAsync(orders, 1.5);
        });
        it('should fail to fill an order with a fee denominated in an asset other than makerAsset or WETH', async () => {
            const takerFeeAssetData = deployment.assetDataEncoder
                .ERC20Token(anotherErc20Token.address)
                .getABIEncodedTransactionData();
            const order = await maker.signOrderAsync({
                takerFeeAssetData,
                takerFee: toBaseUnitAmount(1),
            });
            const revertError = new ExchangeForwarderRevertErrors.UnsupportedFeeError(takerFeeAssetData);
            await testFactory.marketSellTestAsync([order], 0.5, {
                revertError,
            });
        });
        it('should fill a partially-filled order without a taker fee', async () => {
            const order = await maker.signOrderAsync();
            await testFactory.marketSellTestAsync([order], 0.3);
            await testFactory.marketSellTestAsync([order], 0.8);
        });
        it('should skip over an order with an invalid maker asset amount', async () => {
            const unfillableOrder = await maker.signOrderAsync({
                makerAssetAmount: constants.ZERO_AMOUNT,
            });
            const fillableOrder = await maker.signOrderAsync();
            await testFactory.marketSellTestAsync([unfillableOrder, fillableOrder], 1.5);
        });
        it('should skip over an order with an invalid taker asset amount', async () => {
            const unfillableOrder = await maker.signOrderAsync({
                takerAssetAmount: constants.ZERO_AMOUNT,
            });
            const fillableOrder = await maker.signOrderAsync();
            await testFactory.marketSellTestAsync([unfillableOrder, fillableOrder], 1.5);
        });
        it('should skip over an expired order', async () => {
            const currentTimestamp = await getLatestBlockTimestampAsync();
            const expiredOrder = await maker.signOrderAsync({
                expirationTimeSeconds: new BigNumber(currentTimestamp).minus(10),
            });
            const fillableOrder = await maker.signOrderAsync();
            await testFactory.marketSellTestAsync([expiredOrder, fillableOrder], 1.5);
        });
        it('should skip over a fully filled order', async () => {
            const fullyFilledOrder = await maker.signOrderAsync();
            await testFactory.marketSellTestAsync([fullyFilledOrder], 1);
            const fillableOrder = await maker.signOrderAsync();
            await testFactory.marketSellTestAsync([fullyFilledOrder, fillableOrder], 1.5);
        });
        it('should skip over a cancelled order', async () => {
            const cancelledOrder = await maker.signOrderAsync();
            await maker.cancelOrderAsync(cancelledOrder);
            const fillableOrder = await maker.signOrderAsync();
            await testFactory.marketSellTestAsync([cancelledOrder, fillableOrder], 1.5);
        });
    });
    blockchainTests.resets('marketSellOrdersWithEth with extra fees', () => {
        it('should fill the order and send fee to feeRecipient', async () => {
            const order = await maker.signOrderAsync({
                makerAssetAmount: toBaseUnitAmount(157),
                takerAssetAmount: toBaseUnitAmount(36),
            });
            await testFactory.marketSellTestAsync([order], 0.67, {
                forwarderFeeAmounts: [toBaseUnitAmount(0.2)],
                forwarderFeeRecipientAddresses: [forwarderFeeRecipient.address],
            });
        });
        it('should fill the order and send the same fees to different feeRecipient addresses', async () => {
            const order = await maker.signOrderAsync({
                makerAssetAmount: toBaseUnitAmount(157),
                takerAssetAmount: toBaseUnitAmount(36),
            });
            await testFactory.marketSellTestAsync([order], 0.67, {
                forwarderFeeAmounts: [toBaseUnitAmount(0.2), toBaseUnitAmount(0.2)],
                forwarderFeeRecipientAddresses: [randomAddress(), randomAddress()],
            });
        });
        it('should fill the order and send different fees to different feeRecipient addresses', async () => {
            const order = await maker.signOrderAsync({
                makerAssetAmount: toBaseUnitAmount(157),
                takerAssetAmount: toBaseUnitAmount(36),
            });
            await testFactory.marketSellTestAsync([order], 0.67, {
                forwarderFeeAmounts: [toBaseUnitAmount(0.2), toBaseUnitAmount(0.1)],
                forwarderFeeRecipientAddresses: [randomAddress(), randomAddress()],
            });
        });
        it('should fill the order and send the same fees to multiple instances of the same feeRecipient address', async () => {
            const order = await maker.signOrderAsync({
                makerAssetAmount: toBaseUnitAmount(157),
                takerAssetAmount: toBaseUnitAmount(36),
            });
            const feeRecipient = randomAddress();
            await testFactory.marketSellTestAsync([order], 0.67, {
                forwarderFeeAmounts: [toBaseUnitAmount(0.2), toBaseUnitAmount(0.2)],
                forwarderFeeRecipientAddresses: [feeRecipient, feeRecipient],
            });
        });
        it('should fill the order and send different fees to multiple instances of the same feeRecipient address', async () => {
            const order = await maker.signOrderAsync({
                makerAssetAmount: toBaseUnitAmount(157),
                takerAssetAmount: toBaseUnitAmount(36),
            });
            const feeRecipient = randomAddress();
            await testFactory.marketSellTestAsync([order], 0.67, {
                forwarderFeeAmounts: [toBaseUnitAmount(0.2), toBaseUnitAmount(0.1)],
                forwarderFeeRecipientAddresses: [feeRecipient, feeRecipient],
            });
        });
        it('should fail if ethFeeAmounts is longer than feeRecipients', async () => {
            const order = await maker.signOrderAsync({
                makerAssetAmount: toBaseUnitAmount(157),
                takerAssetAmount: toBaseUnitAmount(36),
            });
            const forwarderFeeAmounts = [toBaseUnitAmount(0.2)];
            const forwarderFeeRecipientAddresses: string[] = [];
            const revertError = new ExchangeForwarderRevertErrors.EthFeeLengthMismatchError(
                new BigNumber(forwarderFeeAmounts.length),
                new BigNumber(forwarderFeeRecipientAddresses.length),
            );
            await testFactory.marketSellTestAsync([order], 0.67, {
                forwarderFeeAmounts,
                forwarderFeeRecipientAddresses,
                revertError,
            });
        });
        it('should fail if feeRecipients is longer than ethFeeAmounts', async () => {
            const order = await maker.signOrderAsync({
                makerAssetAmount: toBaseUnitAmount(157),
                takerAssetAmount: toBaseUnitAmount(36),
            });
            const forwarderFeeAmounts: BigNumber[] = [];
            const forwarderFeeRecipientAddresses = [randomAddress()];
            const revertError = new ExchangeForwarderRevertErrors.EthFeeLengthMismatchError(
                new BigNumber(forwarderFeeAmounts.length),
                new BigNumber(forwarderFeeRecipientAddresses.length),
            );
            await testFactory.marketSellTestAsync([order], 0.67, {
                forwarderFeeAmounts,
                forwarderFeeRecipientAddresses,
                revertError,
            });
        });
    });
    blockchainTests.resets('marketBuyOrdersWithEth without extra fees', () => {
        it('should buy the exact amount of makerAsset in a single order', async () => {
            const order = await maker.signOrderAsync({
                makerAssetAmount: toBaseUnitAmount(131),
                takerAssetAmount: toBaseUnitAmount(20),
            });
            await testFactory.marketBuyTestAsync([order], 0.62);
        });
        it('should buy the exact amount of makerAsset in multiple orders', async () => {
            const firstOrder = await maker.signOrderAsync();
            const secondOrder = await maker.signOrderAsync({
                makerAssetAmount: toBaseUnitAmount(77),
                takerAssetAmount: toBaseUnitAmount(11),
            });
            const orders = [firstOrder, secondOrder];
            await testFactory.marketBuyTestAsync(orders, 1.96);
        });
        it('should buy exactly makerAssetBuyAmount in orders with different makerAssetData', async () => {
            const firstOrder = await maker.signOrderAsync();
            const secondOrderMakerAssetData = deployment.assetDataEncoder
                .ERC20Token(anotherErc20Token.address)
                .getABIEncodedTransactionData();
            const secondOrder = await maker.signOrderAsync({
                makerAssetData: secondOrderMakerAssetData,
            });
            await forwarder.approveMakerAssetProxy(secondOrderMakerAssetData).awaitTransactionSuccessAsync();
            const orders = [firstOrder, secondOrder];
            await testFactory.marketBuyTestAsync(orders, 1.5);
        });
        it('should buy the exact amount of makerAsset and return excess ETH', async () => {
            const order = await maker.signOrderAsync({
                makerAssetAmount: toBaseUnitAmount(80),
                takerAssetAmount: toBaseUnitAmount(17),
            });
            await testFactory.marketBuyTestAsync([order], 0.57, {
                ethValueAdjustment: 2,
            });
        });
        it('should buy the exact amount of makerAsset from a single order with a WETH fee', async () => {
            const order = await maker.signOrderAsync({
                makerAssetAmount: toBaseUnitAmount(79),
                takerAssetAmount: toBaseUnitAmount(16),
                takerFee: toBaseUnitAmount(1),
                takerFeeAssetData: wethAssetData,
            });
            await testFactory.marketBuyTestAsync([order], 0.38);
        });
        it('should buy the exact amount of makerAsset from a single order with a percentage fee', async () => {
            const order = await maker.signOrderAsync({
                makerAssetAmount: toBaseUnitAmount(80),
                takerAssetAmount: toBaseUnitAmount(17),
                takerFee: toBaseUnitAmount(1),
                takerFeeAssetData: makerAssetData,
            });
            await testFactory.marketBuyTestAsync([order], 0.52);
        });
        it('should revert if the amount of ETH sent is too low to fill the makerAssetAmount', async () => {
            const order = await maker.signOrderAsync();
            const revertError = new ExchangeForwarderRevertErrors.CompleteBuyFailedError(
                order.makerAssetAmount.times(0.5),
                constants.ZERO_AMOUNT,
            );
            await testFactory.marketBuyTestAsync([order], 0.5, {
                ethValueAdjustment: -2,
                revertError,
            });
        });
        it('should buy an ERC721 asset from a single order', async () => {
            const erc721Order = await maker.signOrderAsync({
                makerAssetAmount: new BigNumber(1),
                makerAssetData: deployment.assetDataEncoder
                    .ERC721Token(erc721Token.address, nftId)
                    .getABIEncodedTransactionData(),
                takerFeeAssetData: wethAssetData,
            });
            await testFactory.marketBuyTestAsync([erc721Order], 1);
        });
        it('should buy an ERC721 asset and pay a WETH fee', async () => {
            const erc721orderWithWethFee = await maker.signOrderAsync({
                makerAssetAmount: new BigNumber(1),
                makerAssetData: deployment.assetDataEncoder
                    .ERC721Token(erc721Token.address, nftId)
                    .getABIEncodedTransactionData(),
                takerFee: toBaseUnitAmount(1),
                takerFeeAssetData: wethAssetData,
            });
            await testFactory.marketBuyTestAsync([erc721orderWithWethFee], 1);
        });
        it('should fail to fill an order with a fee denominated in an asset other than makerAsset or WETH', async () => {
            const takerFeeAssetData = deployment.assetDataEncoder
                .ERC20Token(anotherErc20Token.address)
                .getABIEncodedTransactionData();
            const order = await maker.signOrderAsync({
                takerFeeAssetData,
                takerFee: toBaseUnitAmount(1),
            });
            const revertError = new ExchangeForwarderRevertErrors.UnsupportedFeeError(takerFeeAssetData);
            await testFactory.marketBuyTestAsync([order], 0.5, {
                revertError,
            });
        });
        it('should fill a partially-filled order without a taker fee', async () => {
            const order = await maker.signOrderAsync();
            await testFactory.marketBuyTestAsync([order], 0.3);
            await testFactory.marketBuyTestAsync([order], 0.8);
        });
        it('should skip over an order with an invalid maker asset amount', async () => {
            const unfillableOrder = await maker.signOrderAsync({
                makerAssetAmount: constants.ZERO_AMOUNT,
            });
            const fillableOrder = await maker.signOrderAsync();
            await testFactory.marketBuyTestAsync([unfillableOrder, fillableOrder], 1.5);
        });
        it('should skip over an order with an invalid taker asset amount', async () => {
            const unfillableOrder = await maker.signOrderAsync({
                takerAssetAmount: constants.ZERO_AMOUNT,
            });
            const fillableOrder = await maker.signOrderAsync();
            await testFactory.marketBuyTestAsync([unfillableOrder, fillableOrder], 1.5);
        });
        it('should skip over an expired order', async () => {
            const currentTimestamp = await getLatestBlockTimestampAsync();
            const expiredOrder = await maker.signOrderAsync({
                expirationTimeSeconds: new BigNumber(currentTimestamp).minus(10),
            });
            const fillableOrder = await maker.signOrderAsync();
            await testFactory.marketBuyTestAsync([expiredOrder, fillableOrder], 1.5);
        });
        it('should skip over a fully filled order', async () => {
            const fullyFilledOrder = await maker.signOrderAsync();
            await testFactory.marketBuyTestAsync([fullyFilledOrder], 1);
            const fillableOrder = await maker.signOrderAsync();
            await testFactory.marketBuyTestAsync([fullyFilledOrder, fillableOrder], 1.5);
        });
        it('should skip over a cancelled order', async () => {
            const cancelledOrder = await maker.signOrderAsync();
            await maker.cancelOrderAsync(cancelledOrder);
            const fillableOrder = await maker.signOrderAsync();
            await testFactory.marketBuyTestAsync([cancelledOrder, fillableOrder], 1.5);
        });
        it('Should buy slightly greater makerAsset when exchange rate is rounded', async () => {
            // The 0x Protocol contracts round the exchange rate in favor of the Maker.
            // In this case, the taker must round up how much they're going to spend, which
            // in turn increases the amount of MakerAsset being purchased.
            // Example:
            //  The taker wants to buy 5 units of the MakerAsset at a rate of 3M/2T.
            //  For every 2 units of TakerAsset, the taker will receive 3 units of MakerAsset.
            //  To purchase 5 units, the taker must spend 10/3 = 3.33 units of TakerAssset.
            //  However, the Taker can only spend whole units.
            //  Spending floor(10/3) = 3 units will yield a profit of Floor(3*3/2) = Floor(4.5) = 4 units of MakerAsset.
            //  Spending ceil(10/3) = 4 units will yield a profit of Floor(4*3/2) = 6 units of MakerAsset.
            //
            //  The forwarding contract will opt for the second option, which overbuys, to ensure the taker
            //  receives at least the amount of MakerAsset they requested.
            //
            // Construct test case using values from example above
            const order = await maker.signOrderAsync({
                makerAssetAmount: new BigNumber('30'),
                takerAssetAmount: new BigNumber('20'),
                makerFee: new BigNumber(0),
                takerFee: new BigNumber(0),
            });
            const desiredMakerAssetFillAmount = new BigNumber('5');
            const makerAssetFillAmount = new BigNumber('6');
            const primaryTakerAssetFillAmount = new BigNumber('4');
            const ethValue = primaryTakerAssetFillAmount.plus(DeploymentManager.protocolFee);

            await balanceStore.updateBalancesAsync();
            // Execute test case
            const tx = await forwarder
                .marketBuyOrdersWithEth([order], desiredMakerAssetFillAmount, [order.signature], [], [])
                .awaitTransactionSuccessAsync({
                    value: ethValue,
                    from: taker.address,
                });

            // Compute expected balances
            const expectedBalances = LocalBalanceStore.create(balanceStore);
            expectedBalances.transferAsset(maker.address, taker.address, makerAssetFillAmount, makerAssetData);
            expectedBalances.wrapEth(taker.address, deployment.tokens.weth.address, ethValue);
            expectedBalances.transferAsset(taker.address, maker.address, primaryTakerAssetFillAmount, wethAssetData);
            expectedBalances.transferAsset(
                taker.address,
                deployment.staking.stakingProxy.address,
                DeploymentManager.protocolFee,
                wethAssetData,
            );
            expectedBalances.burnGas(tx.from, DeploymentManager.gasPrice.times(tx.gasUsed));

            // Verify balances
            await balanceStore.updateBalancesAsync();
            balanceStore.assertEquals(expectedBalances);
        });
        it('Should buy slightly greater MakerAsset when exchange rate is rounded (Regression Test)', async () => {
            // Order taken from a transaction on mainnet that failed due to a rounding error.
            const order = await maker.signOrderAsync({
                makerAssetAmount: new BigNumber('268166666666666666666'),
                takerAssetAmount: new BigNumber('219090625878836371'),
                makerFee: new BigNumber(0),
                takerFee: new BigNumber(0),
            });
            // The taker will receive more than the desired amount of makerAsset due to rounding
            const desiredMakerAssetFillAmount = new BigNumber('5000000000000000000');
            const takerAssetFillAmount = new BigNumber('4084971271824171');
            const makerAssetFillAmount = takerAssetFillAmount
                .times(order.makerAssetAmount)
                .dividedToIntegerBy(order.takerAssetAmount);

            await balanceStore.updateBalancesAsync();
            // Execute test case
            const tx = await forwarder
                .marketBuyOrdersWithEth([order], desiredMakerAssetFillAmount, [order.signature], [], [])
                .awaitTransactionSuccessAsync({
                    value: takerAssetFillAmount.plus(DeploymentManager.protocolFee),
                    from: taker.address,
                });

            // Compute expected balances
            const expectedBalances = LocalBalanceStore.create(balanceStore);
            expectedBalances.transferAsset(maker.address, taker.address, makerAssetFillAmount, makerAssetData);
            expectedBalances.wrapEth(
                taker.address,
                deployment.tokens.weth.address,
                takerAssetFillAmount.plus(DeploymentManager.protocolFee),
            );
            expectedBalances.transferAsset(taker.address, maker.address, takerAssetFillAmount, wethAssetData);
            expectedBalances.transferAsset(
                taker.address,
                deployment.staking.stakingProxy.address,
                DeploymentManager.protocolFee,
                wethAssetData,
            );
            expectedBalances.burnGas(tx.from, DeploymentManager.gasPrice.times(tx.gasUsed));

            // Verify balances
            await balanceStore.updateBalancesAsync();
            balanceStore.assertEquals(expectedBalances);
        });
    });
    blockchainTests.resets('marketBuyOrdersWithEth with extra fees', () => {
        it('should buy the asset and send fee to feeRecipient', async () => {
            const order = await maker.signOrderAsync({
                makerAssetAmount: toBaseUnitAmount(125),
                takerAssetAmount: toBaseUnitAmount(11),
            });
            await testFactory.marketBuyTestAsync([order], 0.33, {
                forwarderFeeAmounts: [toBaseUnitAmount(0.2)],
                forwarderFeeRecipientAddresses: [randomAddress()],
            });
        });
        it('should fail if there is not enough ETH remaining to complete the fill', async () => {
            const order = await maker.signOrderAsync();
            const forwarderFeeAmounts = [toBaseUnitAmount(1)];
            const revertError = new ExchangeForwarderRevertErrors.CompleteBuyFailedError(
                order.takerAssetAmount,
                constants.ZERO_AMOUNT,
            );
            await testFactory.marketBuyTestAsync([order], 0.5, {
                ethValueAdjustment: -1,
                forwarderFeeAmounts,
                forwarderFeeRecipientAddresses: [randomAddress()],
                revertError,
            });
        });
        it('should fail if there is not enough ETH remaining to pay the fee', async () => {
            const order = await maker.signOrderAsync();
            const forwarderFeeAmounts = [toBaseUnitAmount(1)];
            const value = forwarderFeeAmounts[0].minus(1);
            const revertError = new ExchangeForwarderRevertErrors.InsufficientEthForFeeError(
                forwarderFeeAmounts[0],
                value,
            );
            await testFactory.marketBuyTestAsync([order], 0, {
                revertError,
                ethValueAdjustment: -1,
                forwarderFeeAmounts,
                forwarderFeeRecipientAddresses: [randomAddress()],
            });
        });
    });
});
// tslint:disable:max-file-line-count
