import { ExchangeRevertErrors } from '@0x/contracts-exchange';
import { blockchainTests, constants, expect, orderHashUtils } from '@0x/contracts-test-utils';
import { assetDataUtils } from '@0x/order-utils';
import { SignedOrder } from '@0x/types';
import { BigNumber, StringRevertError } from '@0x/utils';

import { encodeStopLimiStaticCallData } from '../../src/chainlink_utils';

import { artifacts } from '../artifacts';
import { Actor } from '../framework/actors/base';
import { Maker } from '../framework/actors/maker';
import { Taker } from '../framework/actors/taker';
import { BlockchainBalanceStore } from '../framework/balances/blockchain_balance_store';
import { LocalBalanceStore } from '../framework/balances/local_balance_store';
import { DeploymentManager } from '../framework/deployment_manager';
import { ChainlinkStopLimitContract, TestChainlinkAggregatorContract } from '../wrappers';

blockchainTests.resets('Chainlink stop-limit order tests', env => {
    let deployment: DeploymentManager;
    let balanceStore: BlockchainBalanceStore;
    let initialBalances: LocalBalanceStore;

    let chainLinkAggregator: TestChainlinkAggregatorContract;

    let maker: Maker;
    let taker: Taker;

    let order: SignedOrder;

    const stopPrice = new BigNumber(42);
    const limitPrice = new BigNumber(1337);
    const priceFreshness = new BigNumber(123);

    before(async () => {
        deployment = await DeploymentManager.deployAsync(env, {
            numErc20TokensToDeploy: 2,
            numErc721TokensToDeploy: 0,
            numErc1155TokensToDeploy: 0,
        });
        const [makerToken, takerToken] = deployment.tokens.erc20;

        const chainlinkStopLimit = await ChainlinkStopLimitContract.deployFrom0xArtifactAsync(
            artifacts.ChainlinkStopLimit,
            env.provider,
            env.txDefaults,
            artifacts,
        );
        chainLinkAggregator = await TestChainlinkAggregatorContract.deployFrom0xArtifactAsync(
            artifacts.TestChainlinkAggregator,
            env.provider,
            env.txDefaults,
            artifacts,
        );

        const makerAssetData = assetDataUtils.encodeMultiAssetData(
            [new BigNumber(1), new BigNumber(1)],
            [
                assetDataUtils.encodeERC20AssetData(makerToken.address),
                encodeStopLimiStaticCallData(
                    chainlinkStopLimit.address,
                    chainLinkAggregator.address,
                    stopPrice,
                    limitPrice,
                    priceFreshness,
                ),
            ],
        );

        const orderConfig = {
            feeRecipientAddress: constants.NULL_ADDRESS,
            makerAssetData,
            takerAssetData: assetDataUtils.encodeERC20AssetData(takerToken.address),
            makerFeeAssetData: constants.NULL_BYTES,
            takerFeeAssetData: constants.NULL_BYTES,
            makerFee: constants.ZERO_AMOUNT,
            takerFee: constants.ZERO_AMOUNT,
        };

        maker = new Maker({
            name: 'Maker',
            deployment,
            orderConfig,
        });
        taker = new Taker({ name: 'Taker', deployment });

        // Set balances and allowances
        await maker.configureERC20TokenAsync(makerToken);
        await taker.configureERC20TokenAsync(takerToken);

        order = await maker.signOrderAsync();

        // Set up balance stores
        const tokenOwners = {
            Maker: maker.address,
            Taker: taker.address,
        };
        const tokenContracts = {
            erc20: { makerToken, takerToken },
        };
        balanceStore = new BlockchainBalanceStore(tokenOwners, tokenContracts);
        await balanceStore.updateBalancesAsync();
        initialBalances = LocalBalanceStore.create(balanceStore);
    });

    after(async () => {
        Actor.reset();
    });

    it('fillOrder reverts if price < stopPrice', async () => {
        await chainLinkAggregator.setPrice(stopPrice.minus(1)).awaitTransactionSuccessAsync();
        const tx = taker.fillOrderAsync(order, order.takerAssetAmount);
        const expectedError = new ExchangeRevertErrors.AssetProxyTransferError(
            orderHashUtils.getOrderHashHex(order),
            order.makerAssetData,
            new StringRevertError('ChainlinkStopLimitOracle/OUT_OF_PRICE_RANGE').encode(),
        );
        return expect(tx).to.revertWith(expectedError);
    });
    it('fillOrder reverts price > limitPrice', async () => {
        await chainLinkAggregator.setPrice(limitPrice.plus(1)).awaitTransactionSuccessAsync();
        const tx = taker.fillOrderAsync(order, order.takerAssetAmount);
        const expectedError = new ExchangeRevertErrors.AssetProxyTransferError(
            orderHashUtils.getOrderHashHex(order),
            order.makerAssetData,
            new StringRevertError('ChainlinkStopLimitOracle/OUT_OF_PRICE_RANGE').encode(),
        );
        return expect(tx).to.revertWith(expectedError);
    });
    it('fillOrder succeeds if price = stopPrice', async () => {
        await chainLinkAggregator.setPrice(stopPrice).awaitTransactionSuccessAsync();
        const receipt = await taker.fillOrderAsync(order, order.takerAssetAmount);
        const expectedBalances = LocalBalanceStore.create(initialBalances);
        expectedBalances.simulateFills([order], taker.address, receipt, deployment, DeploymentManager.protocolFee);
        await balanceStore.updateBalancesAsync();
        balanceStore.assertEquals(expectedBalances);
    });
    it('fillOrder succeeds if price = limitPrice', async () => {
        await chainLinkAggregator.setPrice(limitPrice).awaitTransactionSuccessAsync();
        const receipt = await taker.fillOrderAsync(order, order.takerAssetAmount);
        const expectedBalances = LocalBalanceStore.create(initialBalances);
        expectedBalances.simulateFills([order], taker.address, receipt, deployment, DeploymentManager.protocolFee);
        await balanceStore.updateBalancesAsync();
        balanceStore.assertEquals(expectedBalances);
    });
    it('fillOrder succeeds if stopPrice < price < limitPrice', async () => {
        await chainLinkAggregator
            .setPrice(stopPrice.plus(limitPrice).dividedToIntegerBy(2))
            .awaitTransactionSuccessAsync();
        const receipt = await taker.fillOrderAsync(order, order.takerAssetAmount);
        const expectedBalances = LocalBalanceStore.create(initialBalances);
        expectedBalances.simulateFills([order], taker.address, receipt, deployment, DeploymentManager.protocolFee);
        await balanceStore.updateBalancesAsync();
        balanceStore.assertEquals(expectedBalances);
    });
    it('fillOrder reverts latestTimestamp is too low', async () => {
        await chainLinkAggregator.setTimestampDelta(priceFreshness.plus(1)).awaitTransactionSuccessAsync();
        await chainLinkAggregator.setPrice(stopPrice).awaitTransactionSuccessAsync();
        const tx = taker.fillOrderAsync(order, order.takerAssetAmount);
        const expectedError = new ExchangeRevertErrors.AssetProxyTransferError(
            orderHashUtils.getOrderHashHex(order),
            order.makerAssetData,
            new StringRevertError('ChainlinkStopLimitOracle/PRICE_DATA_TOO_OLD').encode(),
        );
        return expect(tx).to.revertWith(expectedError);
    });
}); // tslint:disable-line:max-file-line-count
