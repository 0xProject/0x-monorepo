import {
    artifacts as BrokerArtifacts,
    BrokerContract,
    godsUnchainedUtils,
    GodsUnchainedValidatorContract,
    TestGodsUnchainedContract,
} from '@0x/contracts-broker';
import { DummyERC721TokenContract } from '@0x/contracts-erc721';
import { ExchangeFunctionName } from '@0x/contracts-exchange';
import { ReferenceFunctions } from '@0x/contracts-exchange-libs';
import { blockchainTests, constants, expect } from '@0x/contracts-test-utils';
import { assetDataUtils } from '@0x/order-utils';
import { SignedOrder } from '@0x/types';
import { BigNumber, ExchangeRevertErrors } from '@0x/utils';
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

    let broker: BrokerContract;
    let godsUnchained: TestGodsUnchainedContract;
    let validator: GodsUnchainedValidatorContract;

    let godsUnchainedTokenIds: BigNumber[];
    let erc721AssetData: string[];
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
        );

        const takerAssetData = godsUnchainedUtils.encodeBrokerAssetData(
            broker.address,
            validator.address,
            makerSpecifiedProto,
            makerSpecifiedQuality,
        );

        const orderConfig = {
            feeRecipientAddress: constants.NULL_ADDRESS,
            makerAssetData: assetDataUtils.encodeERC20AssetData(makerToken.address),
            takerAssetData,
            takerAssetAmount: new BigNumber(2),
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

        await maker.configureERC20TokenAsync(makerToken);
        godsUnchainedTokenIds = await taker.configureERC721TokenAsync(
            new DummyERC721TokenContract(godsUnchained.address, env.provider),
            broker.address,
            5,
        );
        erc721AssetData = godsUnchainedTokenIds.map(tokenId =>
            assetDataUtils.encodeERC721AssetData(godsUnchained.address, tokenId),
        );

        const tokenOwners = {
            Maker: maker.address,
            Taker: taker.address,
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
        brokeredAssets: string[],
        orders: SignedOrder[],
        takerAssetFillAmounts: BigNumber[],
        receipt: TransactionReceiptWithDecodedLogs,
    ): LocalBalanceStore {
        const expectedBalances = LocalBalanceStore.create(initialBalances);
        // Transaction gas cost
        expectedBalances.burnGas(receipt.from, DeploymentManager.gasPrice.times(receipt.gasUsed));
        // Taker -> Maker
        for (const brokeredAsset of brokeredAssets) {
            expectedBalances.transferAsset(taker.address, maker.address, new BigNumber(1), brokeredAsset);
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
        return expectedBalances;
    }

    describe('brokerTrade', () => {
        let order: SignedOrder;

        before(async () => {
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
                        [erc721AssetData[0]],
                        order,
                        new BigNumber(1),
                        order.signature,
                        deployment.exchange.getSelector(fnName),
                    )
                    .awaitTransactionSuccessAsync({
                        from: taker.address,
                        value: DeploymentManager.protocolFee,
                        gasPrice: DeploymentManager.gasPrice,
                    });
                const expectedBalances = simulateBrokerFills(
                    [erc721AssetData[0]],
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
                        [erc721AssetData[0], erc721AssetData[1]],
                        order,
                        new BigNumber(2),
                        order.signature,
                        deployment.exchange.getSelector(fnName),
                    )
                    .awaitTransactionSuccessAsync({
                        from: taker.address,
                        value: DeploymentManager.protocolFee,
                        gasPrice: DeploymentManager.gasPrice,
                    });

                const expectedBalances = simulateBrokerFills(
                    [erc721AssetData[0], erc721AssetData[1]],
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
                        [erc721AssetData[2]],
                        order,
                        new BigNumber(1),
                        order.signature,
                        deployment.exchange.getSelector(fnName),
                    )
                    .awaitTransactionSuccessAsync({
                        from: taker.address,
                        value: DeploymentManager.protocolFee,
                        gasPrice: DeploymentManager.gasPrice,
                    });
                expect(tx).to.revertWith(new ExchangeRevertErrors.AssetProxyTransferError());
            });
            it(`${fnName} with one valid asset, one invalid asset`, async () => {
                const tx = broker
                    .brokerTrade(
                        [erc721AssetData[0], erc721AssetData[2]], // valid, invalid
                        order,
                        new BigNumber(2),
                        order.signature,
                        deployment.exchange.getSelector(fnName),
                    )
                    .awaitTransactionSuccessAsync({
                        from: taker.address,
                        value: DeploymentManager.protocolFee,
                        gasPrice: DeploymentManager.gasPrice,
                    });
                expect(tx).to.revertWith(new ExchangeRevertErrors.AssetProxyTransferError());
            });
            it(`${fnName} with too few assets`, async () => {
                const tx = broker
                    .brokerTrade(
                        [erc721AssetData[0]],
                        order,
                        new BigNumber(2),
                        order.signature,
                        deployment.exchange.getSelector(fnName),
                    )
                    .awaitTransactionSuccessAsync({
                        from: taker.address,
                        value: DeploymentManager.protocolFee,
                        gasPrice: DeploymentManager.gasPrice,
                    });
                expect(tx).to.revertWith(new ExchangeRevertErrors.AssetProxyTransferError());
            });
            it(`${fnName} with same asset twice`, async () => {
                const tx = broker
                    .brokerTrade(
                        [erc721AssetData[0], erc721AssetData[0]],
                        order,
                        new BigNumber(2),
                        order.signature,
                        deployment.exchange.getSelector(fnName),
                    )
                    .awaitTransactionSuccessAsync({
                        from: taker.address,
                        value: DeploymentManager.protocolFee,
                        gasPrice: DeploymentManager.gasPrice,
                    });
                expect(tx).to.revertWith(new ExchangeRevertErrors.AssetProxyTransferError());
            });
            it(`${fnName} with excess assets`, async () => {
                const receipt = await broker
                    .brokerTrade(
                        erc721AssetData,
                        order,
                        new BigNumber(2),
                        order.signature,
                        deployment.exchange.getSelector(fnName),
                    )
                    .awaitTransactionSuccessAsync({
                        from: taker.address,
                        value: DeploymentManager.protocolFee,
                        gasPrice: DeploymentManager.gasPrice,
                    });

                const expectedBalances = simulateBrokerFills(
                    [erc721AssetData[0], erc721AssetData[1]],
                    [order],
                    [new BigNumber(2)],
                    receipt,
                );
                await balanceStore.updateBalancesAsync();
                balanceStore.assertEquals(expectedBalances);
            });
        }
    });

    describe('batchBrokerTrade', () => {
        let orders: SignedOrder[];

        before(async () => {
            const firstOrderProto = makerSpecifiedProto;
            const firstOrderQuality = makerSpecifiedQuality;
            const secondOrderProto = new BigNumber(42);
            const secondOrderQuality = new BigNumber(7);

            await godsUnchained
                .setTokenProperties(godsUnchainedTokenIds[0], firstOrderProto, firstOrderQuality)
                .awaitTransactionSuccessAsync();
            await godsUnchained
                .setTokenProperties(godsUnchainedTokenIds[1], firstOrderProto, firstOrderQuality)
                .awaitTransactionSuccessAsync();
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
                        validator.address,
                        firstOrderProto,
                        firstOrderQuality,
                    ),
                }),
                await maker.signOrderAsync({
                    takerAssetData: godsUnchainedUtils.encodeBrokerAssetData(
                        broker.address,
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
                        [erc721AssetData[0]],
                        [orders[0]],
                        [new BigNumber(1)],
                        [orders[0].signature],
                        deployment.exchange.getSelector(fnName),
                    )
                    .awaitTransactionSuccessAsync({
                        from: taker.address,
                        value: DeploymentManager.protocolFee,
                        gasPrice: DeploymentManager.gasPrice,
                    });

                const expectedBalances = simulateBrokerFills(
                    [erc721AssetData[0]],
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
                        [erc721AssetData[0], erc721AssetData[2]],
                        orders,
                        [new BigNumber(1), new BigNumber(1)],
                        [orders[0].signature, orders[1].signature],
                        deployment.exchange.getSelector(fnName),
                    )
                    .awaitTransactionSuccessAsync({
                        from: taker.address,
                        value: DeploymentManager.protocolFee.times(2),
                        gasPrice: DeploymentManager.gasPrice,
                    });

                const expectedBalances = simulateBrokerFills(
                    [erc721AssetData[0], erc721AssetData[2]],
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
                        erc721AssetData.slice(0, 4),
                        orders,
                        [new BigNumber(2), new BigNumber(2)],
                        [orders[0].signature, orders[1].signature],
                        deployment.exchange.getSelector(fnName),
                    )
                    .awaitTransactionSuccessAsync({
                        from: taker.address,
                        value: DeploymentManager.protocolFee.times(2),
                        gasPrice: DeploymentManager.gasPrice,
                    });

                const expectedBalances = simulateBrokerFills(
                    erc721AssetData.slice(0, 4),
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
                        erc721AssetData,
                        orders,
                        [new BigNumber(2), new BigNumber(2)],
                        [orders[0].signature, orders[1].signature],
                        deployment.exchange.getSelector(fnName),
                    )
                    .awaitTransactionSuccessAsync({
                        from: taker.address,
                        value: DeploymentManager.protocolFee.times(2),
                        gasPrice: DeploymentManager.gasPrice,
                    });

                const expectedBalances = simulateBrokerFills(
                    erc721AssetData.slice(0, 4),
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
                    [...erc721AssetData.slice(0, 3), erc721AssetData[4]],
                    orders,
                    [new BigNumber(2), new BigNumber(2)],
                    [orders[0].signature, orders[1].signature],
                    deployment.exchange.getSelector(ExchangeFunctionName.BatchFillOrders),
                )
                .awaitTransactionSuccessAsync({
                    from: taker.address,
                    value: DeploymentManager.protocolFee.times(2),
                    gasPrice: DeploymentManager.gasPrice,
                });
            expect(tx).to.revertWith(new ExchangeRevertErrors.AssetProxyTransferError());
        });
        it(`batchFillOrKillOrders reverts on invalid asset`, async () => {
            const tx = broker
                .batchBrokerTrade(
                    [...erc721AssetData.slice(0, 3), erc721AssetData[4]],
                    orders,
                    [new BigNumber(2), new BigNumber(2)],
                    [orders[0].signature, orders[1].signature],
                    deployment.exchange.getSelector(ExchangeFunctionName.BatchFillOrKillOrders),
                )
                .awaitTransactionSuccessAsync({
                    from: taker.address,
                    value: DeploymentManager.protocolFee.times(2),
                    gasPrice: DeploymentManager.gasPrice,
                });
            expect(tx).to.revertWith(new ExchangeRevertErrors.AssetProxyTransferError());
        });
        it(`batchFillOrdersNoThrow catches revert on invalid asset`, async () => {
            const receipt = await broker
                .batchBrokerTrade(
                    [...erc721AssetData.slice(0, 3), erc721AssetData[4]],
                    orders,
                    [new BigNumber(2), new BigNumber(2)],
                    [orders[0].signature, orders[1].signature],
                    deployment.exchange.getSelector(ExchangeFunctionName.BatchFillOrdersNoThrow),
                )
                .awaitTransactionSuccessAsync({
                    from: taker.address,
                    value: DeploymentManager.protocolFee.times(2),
                    gasPrice: DeploymentManager.gasPrice,
                });
            const expectedBalances = simulateBrokerFills(
                erc721AssetData.slice(0, 2),
                [orders[0]],
                [new BigNumber(2)],
                receipt,
            );
            await balanceStore.updateBalancesAsync();
            balanceStore.assertEquals(expectedBalances);
        });
    });
}); // tslint:disable-line:max-file-line-count
