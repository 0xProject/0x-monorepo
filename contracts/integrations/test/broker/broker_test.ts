import {
    artifacts as BrokerArtifacts,
    BrokerContract,
    godsUnchainedUtils,
    GodsUnchainedValidatorContract,
    TestGodsUnchainedContract,
} from '@0x/contracts-broker';
import { DummyERC721TokenContract } from '@0x/contracts-erc721';
import { ExchangeFunctionName, ExchangeRevertErrors } from '@0x/contracts-exchange';
import { ReferenceFunctions } from '@0x/contracts-exchange-libs';
import { blockchainTests, constants, expect } from '@0x/contracts-test-utils';
import { assetDataUtils } from '@0x/order-utils';
import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { TransactionReceiptWithDecodedLogs } from 'ethereum-types';

import { Actor } from '../framework/actors/base';
import { Maker } from '../framework/actors/maker';
import { Taker } from '../framework/actors/taker';
import { BlockchainBalanceStore } from '../framework/balances/blockchain_balance_store';
import { LocalBalanceStore } from '../framework/balances/local_balance_store';
import { DeploymentManager } from '../framework/deployment_manager';

blockchainTests.resets('Broker <> Gods Unchained integration tests', env => {
    let deployment: DeploymentManager;
    let balanceStore: BlockchainBalanceStore;
    let initialBalances: LocalBalanceStore;

    let maker: Maker;
    let taker: Taker;
    let affiliate: Actor;

    let broker: BrokerContract;
    let godsUnchained: TestGodsUnchainedContract;
    let validator: GodsUnchainedValidatorContract;

    let godsUnchainedTokenIds: BigNumber[];
    const makerSpecifiedProto = new BigNumber(1337);
    const makerSpecifiedQuality = new BigNumber(25);

    before(async () => {
        deployment = await DeploymentManager.deployAsync(env, {
            numErc20TokensToDeploy: 1,
            numErc721TokensToDeploy: 0,
            numErc1155TokensToDeploy: 0,
        });
        const [makerToken] = deployment.tokens.erc20;

        godsUnchained = await TestGodsUnchainedContract.deployFrom0xArtifactAsync(
            BrokerArtifacts.TestGodsUnchained,
            env.provider,
            env.txDefaults,
            BrokerArtifacts,
            'Gods Unchained Cards',
            'GU',
        );

        validator = await GodsUnchainedValidatorContract.deployFrom0xArtifactAsync(
            BrokerArtifacts.GodsUnchainedValidator,
            env.provider,
            env.txDefaults,
            BrokerArtifacts,
            godsUnchained.address,
        );

        broker = await BrokerContract.deployFrom0xArtifactAsync(
            BrokerArtifacts.Broker,
            env.provider,
            env.txDefaults,
            BrokerArtifacts,
            deployment.exchange.address,
            deployment.tokens.weth.address,
        );

        const takerAssetData = godsUnchainedUtils.encodeBrokerAssetData(
            broker.address,
            godsUnchained.address,
            validator.address,
            makerSpecifiedProto,
            makerSpecifiedQuality,
        );

        const orderConfig = {
            feeRecipientAddress: constants.NULL_ADDRESS,
            makerAssetData: assetDataUtils.encodeERC20AssetData(makerToken.address),
            takerAssetData,
            takerAssetAmount: new BigNumber(2), // buy 2 cards
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
        affiliate = new Actor({ name: 'Affiliate', deployment });

        // Set balances and allowances
        await maker.configureERC20TokenAsync(makerToken);
        godsUnchainedTokenIds = await taker.configureERC721TokenAsync(
            new DummyERC721TokenContract(godsUnchained.address, env.provider),
            broker.address,
            5,
        );
        await maker.configureERC20TokenAsync(deployment.tokens.weth);

        const tokenOwners = {
            Maker: maker.address,
            Taker: taker.address,
            Affiliate: affiliate.address,
            Broker: broker.address,
            StakingProxy: deployment.staking.stakingProxy.address,
        };
        const tokenContracts = {
            erc20: { makerToken, WETH: deployment.tokens.weth },
            erc721: { GodsUnchained: new DummyERC721TokenContract(godsUnchained.address, env.provider) },
        };
        const tokenIds = {
            erc721: { [godsUnchained.address]: godsUnchainedTokenIds },
        };
        balanceStore = new BlockchainBalanceStore(tokenOwners, tokenContracts, tokenIds);
        await balanceStore.updateBalancesAsync();
        initialBalances = LocalBalanceStore.create(balanceStore);
    });

    after(async () => {
        Actor.reset();
    });

    function simulateBrokerFills(
        brokeredAssets: BigNumber[],
        orders: SignedOrder[],
        takerAssetFillAmounts: BigNumber[],
        receipt: TransactionReceiptWithDecodedLogs,
    ): LocalBalanceStore {
        const expectedBalances = LocalBalanceStore.create(initialBalances);
        // Transaction gas cost
        expectedBalances.burnGas(receipt.from, DeploymentManager.gasPrice.times(receipt.gasUsed));
        // Taker -> Maker
        for (const brokeredAsset of brokeredAssets) {
            const erc721AssetData = assetDataUtils.encodeERC721AssetData(godsUnchained.address, brokeredAsset);
            expectedBalances.transferAsset(taker.address, maker.address, new BigNumber(1), erc721AssetData);
        }
        // Maker -> Taker
        for (const [i, order] of orders.entries()) {
            const amount = ReferenceFunctions.safeGetPartialAmountFloor(
                takerAssetFillAmounts[i],
                order.takerAssetAmount,
                order.makerAssetAmount,
            );
            expectedBalances.transferAsset(maker.address, taker.address, amount, order.makerAssetData);
        }
        // Protocol fee
        expectedBalances.sendEth(
            receipt.from,
            deployment.staking.stakingProxy.address,
            DeploymentManager.protocolFee.times(orders.length),
        );
        expectedBalances.wrapEth(
            deployment.staking.stakingProxy.address,
            deployment.tokens.weth.address,
            DeploymentManager.protocolFee.times(orders.length),
        );
        return expectedBalances;
    }

    describe('brokerTrade', () => {
        let order: SignedOrder;

        before(async () => {
            // The first two cards will satisfy the maker-specified proto and quality
            await godsUnchained
                .setTokenProperties(godsUnchainedTokenIds[0], makerSpecifiedProto, makerSpecifiedQuality)
                .awaitTransactionSuccessAsync();
            await godsUnchained
                .setTokenProperties(godsUnchainedTokenIds[1], makerSpecifiedProto, makerSpecifiedQuality)
                .awaitTransactionSuccessAsync();

            order = await maker.signOrderAsync();
        });

        for (const fnName of constants.SINGLE_FILL_FN_NAMES) {
            it(`${fnName} with one valid asset`, async () => {
                const receipt = await broker
                    .brokerTrade(
                        [godsUnchainedTokenIds[0]],
                        order,
                        new BigNumber(1),
                        order.signature,
                        deployment.exchange.getSelector(fnName),
                        [],
                        [],
                    )
                    .awaitTransactionSuccessAsync({
                        from: taker.address,
                        value: DeploymentManager.protocolFee,
                        gasPrice: DeploymentManager.gasPrice,
                    });
                const expectedBalances = simulateBrokerFills(
                    [godsUnchainedTokenIds[0]],
                    [order],
                    [new BigNumber(1)],
                    receipt,
                );
                await balanceStore.updateBalancesAsync();
                balanceStore.assertEquals(expectedBalances);
            });
            it(`${fnName} with two valid assets`, async () => {
                const receipt = await broker
                    .brokerTrade(
                        [godsUnchainedTokenIds[0], godsUnchainedTokenIds[1]],
                        order,
                        new BigNumber(2),
                        order.signature,
                        deployment.exchange.getSelector(fnName),
                        [],
                        [],
                    )
                    .awaitTransactionSuccessAsync({
                        from: taker.address,
                        value: DeploymentManager.protocolFee,
                        gasPrice: DeploymentManager.gasPrice,
                    });

                const expectedBalances = simulateBrokerFills(
                    [godsUnchainedTokenIds[0], godsUnchainedTokenIds[1]],
                    [order],
                    [new BigNumber(2)],
                    receipt,
                );
                await balanceStore.updateBalancesAsync();
                balanceStore.assertEquals(expectedBalances);
            });
            it(`${fnName} with one invalid asset`, async () => {
                const tx = broker
                    .brokerTrade(
                        [godsUnchainedTokenIds[2]],
                        order,
                        new BigNumber(1),
                        order.signature,
                        deployment.exchange.getSelector(fnName),
                        [],
                        [],
                    )
                    .awaitTransactionSuccessAsync({
                        from: taker.address,
                        value: DeploymentManager.protocolFee,
                        gasPrice: DeploymentManager.gasPrice,
                    });
                return expect(tx).to.revertWith(new ExchangeRevertErrors.AssetProxyTransferError());
            });
            it(`${fnName} with one valid asset, one invalid asset`, async () => {
                const tx = broker
                    .brokerTrade(
                        [godsUnchainedTokenIds[0], godsUnchainedTokenIds[2]], // valid, invalid
                        order,
                        new BigNumber(2),
                        order.signature,
                        deployment.exchange.getSelector(fnName),
                        [],
                        [],
                    )
                    .awaitTransactionSuccessAsync({
                        from: taker.address,
                        value: DeploymentManager.protocolFee,
                        gasPrice: DeploymentManager.gasPrice,
                    });
                return expect(tx).to.revertWith(new ExchangeRevertErrors.AssetProxyTransferError());
            });
            it(`${fnName} with too few assets`, async () => {
                const tx = broker
                    .brokerTrade(
                        [godsUnchainedTokenIds[0]], // One asset provided
                        order,
                        new BigNumber(2), // But two are required for the fill
                        order.signature,
                        deployment.exchange.getSelector(fnName),
                        [],
                        [],
                    )
                    .awaitTransactionSuccessAsync({
                        from: taker.address,
                        value: DeploymentManager.protocolFee,
                        gasPrice: DeploymentManager.gasPrice,
                    });
                return expect(tx).to.revertWith(new ExchangeRevertErrors.AssetProxyTransferError());
            });
            it(`${fnName} with same asset twice`, async () => {
                const tx = broker
                    .brokerTrade(
                        [godsUnchainedTokenIds[0], godsUnchainedTokenIds[0]],
                        order,
                        new BigNumber(2),
                        order.signature,
                        deployment.exchange.getSelector(fnName),
                        [],
                        [],
                    )
                    .awaitTransactionSuccessAsync({
                        from: taker.address,
                        value: DeploymentManager.protocolFee,
                        gasPrice: DeploymentManager.gasPrice,
                    });
                return expect(tx).to.revertWith(new ExchangeRevertErrors.AssetProxyTransferError());
            });
            it(`${fnName} with excess assets`, async () => {
                const receipt = await broker
                    .brokerTrade(
                        godsUnchainedTokenIds,
                        order,
                        new BigNumber(2),
                        order.signature,
                        deployment.exchange.getSelector(fnName),
                        [],
                        [],
                    )
                    .awaitTransactionSuccessAsync({
                        from: taker.address,
                        value: DeploymentManager.protocolFee,
                        gasPrice: DeploymentManager.gasPrice,
                    });

                const expectedBalances = simulateBrokerFills(
                    [godsUnchainedTokenIds[0], godsUnchainedTokenIds[1]], // 3rd card isn't transferred
                    [order],
                    [new BigNumber(2)],
                    receipt,
                );
                await balanceStore.updateBalancesAsync();
                balanceStore.assertEquals(expectedBalances);
            });
        }
        describe('ETH/WETH behavior', () => {
            it(`Reverts if insufficient ETH is provided`, async () => {
                const tx = broker
                    .brokerTrade(
                        [godsUnchainedTokenIds[0]],
                        order,
                        new BigNumber(1),
                        order.signature,
                        deployment.exchange.getSelector(ExchangeFunctionName.FillOrder),
                        [],
                        [],
                    )
                    .awaitTransactionSuccessAsync({
                        from: taker.address,
                        value: DeploymentManager.protocolFee.minus(1),
                        gasPrice: DeploymentManager.gasPrice,
                    });
                return expect(tx).to.revertWith(new ExchangeRevertErrors.PayProtocolFeeError());
            });
            it(`Refunds sender if excess ETH is provided`, async () => {
                const receipt = await broker
                    .brokerTrade(
                        [godsUnchainedTokenIds[0]],
                        order,
                        new BigNumber(1),
                        order.signature,
                        deployment.exchange.getSelector(ExchangeFunctionName.FillOrder),
                        [],
                        [],
                    )
                    .awaitTransactionSuccessAsync({
                        from: taker.address,
                        value: DeploymentManager.protocolFee.plus(1), // 1 wei gets refunded
                        gasPrice: DeploymentManager.gasPrice,
                    });
                const expectedBalances = simulateBrokerFills(
                    [godsUnchainedTokenIds[0]],
                    [order],
                    [new BigNumber(1)],
                    receipt,
                );
                await balanceStore.updateBalancesAsync();
                balanceStore.assertEquals(expectedBalances);
            });
            it(`Pays a single ETH affiliate fee and refunds excess ETH`, async () => {
                const affiliateFee = new BigNumber(100);
                const receipt = await broker
                    .brokerTrade(
                        [godsUnchainedTokenIds[0]],
                        order,
                        new BigNumber(1),
                        order.signature,
                        deployment.exchange.getSelector(ExchangeFunctionName.FillOrder),
                        [affiliateFee],
                        [affiliate.address],
                    )
                    .awaitTransactionSuccessAsync({
                        from: taker.address,
                        value: DeploymentManager.protocolFee.plus(affiliateFee).plus(1),
                        gasPrice: DeploymentManager.gasPrice,
                    });
                const expectedBalances = simulateBrokerFills(
                    [godsUnchainedTokenIds[0]],
                    [order],
                    [new BigNumber(1)],
                    receipt,
                );
                expectedBalances.sendEth(receipt.from, affiliate.address, affiliateFee);
                await balanceStore.updateBalancesAsync();
                balanceStore.assertEquals(expectedBalances);
            });
            it(`Pays a multiple ETH affiliate fees and refunds excess ETH`, async () => {
                const affiliateFee = new BigNumber(100);
                const receipt = await broker
                    .brokerTrade(
                        [godsUnchainedTokenIds[0]],
                        order,
                        new BigNumber(1),
                        order.signature,
                        deployment.exchange.getSelector(ExchangeFunctionName.FillOrder),
                        [affiliateFee, affiliateFee],
                        [affiliate.address, maker.address],
                    )
                    .awaitTransactionSuccessAsync({
                        from: taker.address,
                        value: DeploymentManager.protocolFee.plus(affiliateFee.times(2)).plus(1),
                        gasPrice: DeploymentManager.gasPrice,
                    });
                const expectedBalances = simulateBrokerFills(
                    [godsUnchainedTokenIds[0]],
                    [order],
                    [new BigNumber(1)],
                    receipt,
                );
                expectedBalances.sendEth(receipt.from, affiliate.address, affiliateFee);
                expectedBalances.sendEth(receipt.from, maker.address, affiliateFee);
                await balanceStore.updateBalancesAsync();
                balanceStore.assertEquals(expectedBalances);
            });
            it(`Taker can fill an order with a WETH takerFee`, async () => {
                const wethAssetData = assetDataUtils.encodeERC20AssetData(deployment.tokens.weth.address);
                const takerFee = new BigNumber(100);
                const takerFeeOrder = await maker.signOrderAsync({
                    feeRecipientAddress: affiliate.address,
                    takerFeeAssetData: wethAssetData,
                    takerFee,
                });
                const receipt = await broker
                    .brokerTrade(
                        [godsUnchainedTokenIds[0], godsUnchainedTokenIds[1]],
                        takerFeeOrder,
                        new BigNumber(2),
                        takerFeeOrder.signature,
                        deployment.exchange.getSelector(ExchangeFunctionName.FillOrder),
                        [],
                        [],
                    )
                    .awaitTransactionSuccessAsync({
                        from: taker.address,
                        value: takerFee.plus(DeploymentManager.protocolFee),
                        gasPrice: DeploymentManager.gasPrice,
                    });

                const expectedBalances = simulateBrokerFills(
                    [godsUnchainedTokenIds[0], godsUnchainedTokenIds[1]],
                    [takerFeeOrder],
                    [new BigNumber(2)],
                    receipt,
                );
                expectedBalances.wrapEth(taker.address, deployment.tokens.weth.address, takerFee);
                expectedBalances.transferAsset(taker.address, affiliate.address, takerFee, wethAssetData);
                await balanceStore.updateBalancesAsync();
                balanceStore.assertEquals(expectedBalances);
            });
            it(`Taker can fill a vanilla (not property-based) order through the Broker if takerAssetData = WETH`, async () => {
                const wethAssetData = assetDataUtils.encodeERC20AssetData(deployment.tokens.weth.address);
                const takerAssetAmount = constants.ONE_ETHER.dividedToIntegerBy(2);
                const wethOrder = await maker.signOrderAsync({
                    takerAssetData: wethAssetData,
                    takerAssetAmount,
                });
                const receipt = await broker
                    .brokerTrade(
                        [],
                        wethOrder,
                        takerAssetAmount,
                        wethOrder.signature,
                        deployment.exchange.getSelector(ExchangeFunctionName.FillOrder),
                        [],
                        [],
                    )
                    .awaitTransactionSuccessAsync({
                        from: taker.address,
                        value: takerAssetAmount.plus(DeploymentManager.protocolFee),
                        gasPrice: DeploymentManager.gasPrice,
                    });
                const expectedBalances = LocalBalanceStore.create(initialBalances);
                expectedBalances.wrapEth(
                    taker.address,
                    deployment.tokens.weth.address,
                    takerAssetAmount.plus(DeploymentManager.protocolFee),
                );
                expectedBalances.simulateFills([wethOrder], taker.address, receipt, deployment);
                await balanceStore.updateBalancesAsync();
                balanceStore.assertEquals(expectedBalances);
            });
        });
    });

    describe('batchBrokerTrade', () => {
        let orders: SignedOrder[];

        before(async () => {
            // Two orders specifying different protos/qualities
            const firstOrderProto = makerSpecifiedProto;
            const firstOrderQuality = makerSpecifiedQuality;
            const secondOrderProto = new BigNumber(42);
            const secondOrderQuality = new BigNumber(7);

            // First two cards satisfy the proto/quality of the first order
            await godsUnchained
                .setTokenProperties(godsUnchainedTokenIds[0], firstOrderProto, firstOrderQuality)
                .awaitTransactionSuccessAsync();
            await godsUnchained
                .setTokenProperties(godsUnchainedTokenIds[1], firstOrderProto, firstOrderQuality)
                .awaitTransactionSuccessAsync();
            // Next two cards satisfy the proto/quality of the second order
            await godsUnchained
                .setTokenProperties(godsUnchainedTokenIds[2], secondOrderProto, secondOrderQuality)
                .awaitTransactionSuccessAsync();
            await godsUnchained
                .setTokenProperties(godsUnchainedTokenIds[3], secondOrderProto, secondOrderQuality)
                .awaitTransactionSuccessAsync();

            orders = [
                await maker.signOrderAsync({
                    takerAssetData: godsUnchainedUtils.encodeBrokerAssetData(
                        broker.address,
                        godsUnchained.address,
                        validator.address,
                        firstOrderProto,
                        firstOrderQuality,
                    ),
                }),
                await maker.signOrderAsync({
                    takerAssetData: godsUnchainedUtils.encodeBrokerAssetData(
                        broker.address,
                        godsUnchained.address,
                        validator.address,
                        secondOrderProto,
                        secondOrderQuality,
                    ),
                }),
            ];
        });

        for (const fnName of constants.BATCH_FILL_FN_NAMES) {
            it(`${fnName} with one order, one valid asset`, async () => {
                const receipt = await broker
                    .batchBrokerTrade(
                        [godsUnchainedTokenIds[0]],
                        [orders[0]],
                        [new BigNumber(1)],
                        [orders[0].signature],
                        deployment.exchange.getSelector(fnName),
                        [],
                        [],
                    )
                    .awaitTransactionSuccessAsync({
                        from: taker.address,
                        value: DeploymentManager.protocolFee,
                        gasPrice: DeploymentManager.gasPrice,
                    });

                const expectedBalances = simulateBrokerFills(
                    [godsUnchainedTokenIds[0]],
                    [orders[0]],
                    [new BigNumber(1)],
                    receipt,
                );
                await balanceStore.updateBalancesAsync();
                balanceStore.assertEquals(expectedBalances);
            });
            it(`${fnName} with two orders, one valid asset each`, async () => {
                const receipt = await broker
                    .batchBrokerTrade(
                        [godsUnchainedTokenIds[0], godsUnchainedTokenIds[2]], // valid for 1st order, valid for 2nd
                        orders,
                        [new BigNumber(1), new BigNumber(1)],
                        [orders[0].signature, orders[1].signature],
                        deployment.exchange.getSelector(fnName),
                        [],
                        [],
                    )
                    .awaitTransactionSuccessAsync({
                        from: taker.address,
                        value: DeploymentManager.protocolFee.times(2),
                        gasPrice: DeploymentManager.gasPrice,
                    });

                const expectedBalances = simulateBrokerFills(
                    [godsUnchainedTokenIds[0], godsUnchainedTokenIds[2]],
                    orders,
                    [new BigNumber(1), new BigNumber(1)],
                    receipt,
                );
                await balanceStore.updateBalancesAsync();
                balanceStore.assertEquals(expectedBalances);
            });
            it(`${fnName} with two orders, two valid assets each`, async () => {
                const receipt = await broker
                    .batchBrokerTrade(
                        godsUnchainedTokenIds.slice(0, 4),
                        orders,
                        [new BigNumber(2), new BigNumber(2)],
                        [orders[0].signature, orders[1].signature],
                        deployment.exchange.getSelector(fnName),
                        [],
                        [],
                    )
                    .awaitTransactionSuccessAsync({
                        from: taker.address,
                        value: DeploymentManager.protocolFee.times(2),
                        gasPrice: DeploymentManager.gasPrice,
                    });

                const expectedBalances = simulateBrokerFills(
                    godsUnchainedTokenIds.slice(0, 4),
                    orders,
                    [new BigNumber(2), new BigNumber(2)],
                    receipt,
                );
                await balanceStore.updateBalancesAsync();
                balanceStore.assertEquals(expectedBalances);
            });
            it(`${fnName} with two orders, two valid assets each + excess asset`, async () => {
                const receipt = await broker
                    .batchBrokerTrade(
                        godsUnchainedTokenIds,
                        orders,
                        [new BigNumber(2), new BigNumber(2)],
                        [orders[0].signature, orders[1].signature],
                        deployment.exchange.getSelector(fnName),
                        [],
                        [],
                    )
                    .awaitTransactionSuccessAsync({
                        from: taker.address,
                        value: DeploymentManager.protocolFee.times(2),
                        gasPrice: DeploymentManager.gasPrice,
                    });

                const expectedBalances = simulateBrokerFills(
                    godsUnchainedTokenIds.slice(0, 4), // 5th card isn't transferred
                    orders,
                    [new BigNumber(2), new BigNumber(2)],
                    receipt,
                );
                await balanceStore.updateBalancesAsync();
                balanceStore.assertEquals(expectedBalances);
            });
        }
        it(`batchFillOrders reverts on invalid asset`, async () => {
            const tx = broker
                .batchBrokerTrade(
                    [...godsUnchainedTokenIds.slice(0, 3), godsUnchainedTokenIds[4]], // Last card isn't valid for 2nd order
                    orders,
                    [new BigNumber(2), new BigNumber(2)],
                    [orders[0].signature, orders[1].signature],
                    deployment.exchange.getSelector(ExchangeFunctionName.BatchFillOrders),
                    [],
                    [],
                )
                .awaitTransactionSuccessAsync({
                    from: taker.address,
                    value: DeploymentManager.protocolFee.times(2),
                    gasPrice: DeploymentManager.gasPrice,
                });
            return expect(tx).to.revertWith(new ExchangeRevertErrors.AssetProxyTransferError());
        });
        it(`batchFillOrKillOrders reverts on invalid asset`, async () => {
            const tx = broker
                .batchBrokerTrade(
                    [...godsUnchainedTokenIds.slice(0, 3), godsUnchainedTokenIds[4]], // Last card isn't valid for 2nd order
                    orders,
                    [new BigNumber(2), new BigNumber(2)],
                    [orders[0].signature, orders[1].signature],
                    deployment.exchange.getSelector(ExchangeFunctionName.BatchFillOrKillOrders),
                    [],
                    [],
                )
                .awaitTransactionSuccessAsync({
                    from: taker.address,
                    value: DeploymentManager.protocolFee.times(2),
                    gasPrice: DeploymentManager.gasPrice,
                });
            return expect(tx).to.revertWith(new ExchangeRevertErrors.AssetProxyTransferError());
        });
        it(`batchFillOrdersNoThrow catches revert on invalid asset`, async () => {
            const receipt = await broker
                .batchBrokerTrade(
                    [...godsUnchainedTokenIds.slice(0, 3), godsUnchainedTokenIds[4]], // Last card isn't valid for 2nd order
                    orders,
                    [new BigNumber(2), new BigNumber(2)],
                    [orders[0].signature, orders[1].signature],
                    deployment.exchange.getSelector(ExchangeFunctionName.BatchFillOrdersNoThrow),
                    [],
                    [],
                )
                .awaitTransactionSuccessAsync({
                    from: taker.address,
                    value: DeploymentManager.protocolFee.times(2),
                    gasPrice: DeploymentManager.gasPrice,
                });
            const expectedBalances = simulateBrokerFills(
                godsUnchainedTokenIds.slice(0, 2), // First order gets filled
                [orders[0]],
                [new BigNumber(2)],
                receipt,
            );
            await balanceStore.updateBalancesAsync();
            balanceStore.assertEquals(expectedBalances);
        });
    });
}); // tslint:disable-line:max-file-line-count
