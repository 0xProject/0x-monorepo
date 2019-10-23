import { ERC20ProxyContract, ERC20Wrapper } from '@0x/contracts-asset-proxy';
import { DummyERC20TokenContract, IERC20TokenEvents, IERC20TokenTransferEventArgs } from '@0x/contracts-erc20';
import {
    artifacts,
    BalanceStore,
    BlockchainBalanceStore,
    ExchangeContract,
    ExchangeWrapper,
    LocalBalanceStore,
} from '@0x/contracts-exchange';
import {
    blockchainTests,
    constants,
    describe,
    ERC20BalancesByOwner,
    expect,
    getLatestBlockTimestampAsync,
    OrderFactory,
    verifyEvents,
} from '@0x/contracts-test-utils';
import { assetDataUtils, ExchangeRevertErrors, orderHashUtils } from '@0x/order-utils';
import { FillResults, OrderStatus, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as _ from 'lodash';

import { AddressManager } from '../utils/address_manager';
import { DeploymentManager } from '../utils/deployment_manager';

// tslint:disable:no-unnecessary-type-assertion
blockchainTests.resets.only('Exchange wrappers', env => {
    let chainId: number;
    let makerAddress: string;
    let takerAddress: string;
    let feeRecipientAddress: string;

    let maker: OrderFactory;

    const nullFillResults: FillResults = {
        makerAssetFilledAmount: constants.ZERO_AMOUNT,
        takerAssetFilledAmount: constants.ZERO_AMOUNT,
        makerFeePaid: constants.ZERO_AMOUNT,
        takerFeePaid: constants.ZERO_AMOUNT,
        protocolFeePaid: constants.ZERO_AMOUNT,
    };

    let deployment: DeploymentManager;
    let blockchainBalances: BlockchainBalanceStore;
    let initialLocalBalances: LocalBalanceStore;
    let localBalances: LocalBalanceStore;

    before(async () => {
        chainId = await env.getChainIdAsync();
        const accounts = await env.getAccountAddressesAsync();
        const usedAddresses = ([makerAddress, takerAddress, feeRecipientAddress] = _.slice(accounts, 1, 4));

        deployment = await DeploymentManager.deployAsync(env, {
            numErc20TokensToDeploy: 3,
            numErc721TokensToDeploy: 0,
            numErc1155TokensToDeploy: 0,
        });

        const addressManager = new AddressManager();

        await addressManager.addMakerAsync(
            deployment,
            { address: makerAddress, mainToken: deployment.tokens.erc20[0], feeToken: deployment.tokens.erc20[2] },
            env,
            deployment.tokens.erc20[1],
            feeRecipientAddress,
            chainId,
        );
        await addressManager.addTakerAsync(deployment, {
            address: takerAddress,
            mainToken: deployment.tokens.erc20[1],
            feeToken: deployment.tokens.erc20[2],
        });

        // FIXME: This will likely need to be updated to include WETH and ZRX
        blockchainBalances = new BlockchainBalanceStore(
            {
                makerAddress,
                takerAddress,
                feeRecipientAddress,
                stakingProxy: deployment.staking.stakingProxy.address,
            },
            {
                erc20: {
                    makerAsset: deployment.tokens.erc20[0],
                    takerAsset: deployment.tokens.erc20[1],
                    feeAsset: deployment.tokens.erc20[2],
                },
            },
            {},
        );
        await blockchainBalances.updateBalancesAsync();
        initialLocalBalances = LocalBalanceStore.create(blockchainBalances);

        maker = addressManager.makers[0].orderFactory;
    });

    beforeEach(async () => {
        localBalances = LocalBalanceStore.create(initialLocalBalances);
    });

    // FIXME - Refactor to use an interface for the arguments
    function simulateFill(
        makerAddress: string,
        takerAddress: string,
        feeRecipientAddress: string,
        signedOrder: SignedOrder,
        expectedFillResults: FillResults,
        gasUsed?: number,
    ): void {
        // taker -> maker
        localBalances.transferAsset(
            takerAddress,
            makerAddress,
            expectedFillResults.takerAssetFilledAmount,
            signedOrder.takerAssetData,
        );

        // maker -> taker
        localBalances.transferAsset(
            makerAddress,
            takerAddress,
            expectedFillResults.makerAssetFilledAmount,
            signedOrder.makerAssetData,
        );

        // maker -> feeRecipient
        localBalances.transferAsset(
            makerAddress,
            feeRecipientAddress,
            expectedFillResults.makerFeePaid,
            signedOrder.makerFeeAssetData,
        );

        // taker -> feeRecipient
        localBalances.transferAsset(
            takerAddress,
            feeRecipientAddress,
            expectedFillResults.takerFeePaid,
            signedOrder.takerFeeAssetData,
        );

        // taker -> protocol fees
        localBalances.sendEth(
            takerAddress,
            deployment.staking.stakingProxy.address,
            expectedFillResults.protocolFeePaid,
        );

        // gas -> ethereum
        if (gasUsed !== undefined) {
            localBalances.burnGas(takerAddress, DeploymentManager.gasPrice.times(gasUsed));
        }
    }

    describe('fillOrKillOrder', () => {
        it('should transfer the correct amounts', async () => {
            const signedOrder = await maker.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(200), 18),
            });
            const takerAssetFilledAmount = signedOrder.takerAssetAmount.div(2);

            const fillResults = await deployment.exchange.fillOrKillOrder.callAsync(
                signedOrder,
                takerAssetFilledAmount,
                signedOrder.signature,
                { from: takerAddress, gasPrice: DeploymentManager.gasPrice, value: DeploymentManager.protocolFee },
            );
            const receipt = await deployment.exchange.fillOrKillOrder.awaitTransactionSuccessAsync(
                signedOrder,
                takerAssetFilledAmount,
                signedOrder.signature,
                { from: takerAddress, gasPrice: DeploymentManager.gasPrice, value: DeploymentManager.protocolFee },
            );

            const makerAssetFilledAmount = takerAssetFilledAmount
                .times(signedOrder.makerAssetAmount)
                .dividedToIntegerBy(signedOrder.takerAssetAmount);
            const makerFeePaid = signedOrder.makerFee
                .times(makerAssetFilledAmount)
                .dividedToIntegerBy(signedOrder.makerAssetAmount);
            const takerFeePaid = signedOrder.takerFee
                .times(makerAssetFilledAmount)
                .dividedToIntegerBy(signedOrder.makerAssetAmount);
            const protocolFeePaid = DeploymentManager.protocolFee;

            expect(fillResults).to.be.deep.eq({
                makerAssetFilledAmount,
                takerAssetFilledAmount,
                makerFeePaid,
                takerFeePaid,
                protocolFeePaid,
            });

            // Simulate filling the order
            simulateFill(
                makerAddress,
                takerAddress,
                feeRecipientAddress,
                signedOrder,
                {
                    makerAssetFilledAmount,
                    takerAssetFilledAmount,
                    makerFeePaid,
                    takerFeePaid,
                    protocolFeePaid,
                },
                receipt.gasUsed,
            );

            // Update the blockchain balances balance store.
            await blockchainBalances.updateBalancesAsync();

            // Ensure that the blockchain and the local balance stores are ewqual.
            blockchainBalances.assertEquals(localBalances);

            expect(receipt.logs.length).to.be.eq(5);

            // FIXME - Expect that the fill event was emitted.

            verifyEvents<IERC20TokenTransferEventArgs>(
                receipt,
                [
                    {
                        _from: takerAddress,
                        _to: makerAddress,
                        _value: takerAssetFilledAmount,
                    },
                    {
                        _from: makerAddress,
                        _to: takerAddress,
                        _value: makerAssetFilledAmount,
                    },
                    {
                        _from: takerAddress,
                        _to: feeRecipientAddress,
                        _value: takerFeePaid,
                    },
                    {
                        _from: makerAddress,
                        _to: feeRecipientAddress,
                        _value: makerFeePaid,
                    },
                ],
                IERC20TokenEvents.Transfer,
            );
        });

        it('should revert if a signedOrder is expired', async () => {
            const currentTimestamp = await getLatestBlockTimestampAsync();
            const signedOrder = await maker.newSignedOrderAsync({
                expirationTimeSeconds: new BigNumber(currentTimestamp).minus(10),
            });
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedError = new ExchangeRevertErrors.OrderStatusError(orderHashHex, OrderStatus.Expired);
            const tx = deployment.exchange.fillOrKillOrder.awaitTransactionSuccessAsync(
                signedOrder,
                signedOrder.takerAssetAmount,
                signedOrder.signature,
                { from: takerAddress, gasPrice: DeploymentManager.gasPrice, value: DeploymentManager.protocolFee },
            );
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert if entire takerAssetFillAmount not filled', async () => {
            const signedOrder = await maker.newSignedOrderAsync();
            const takerAssetFillAmount = signedOrder.takerAssetAmount;

            await deployment.exchange.fillOrder.awaitTransactionSuccessAsync(
                signedOrder,
                signedOrder.takerAssetAmount.dividedToIntegerBy(2),
                signedOrder.signature,
                { from: takerAddress, gasPrice: DeploymentManager.gasPrice, value: DeploymentManager.protocolFee },
            );
            const expectedError = new ExchangeRevertErrors.IncompleteFillError(
                ExchangeRevertErrors.IncompleteFillErrorCode.IncompleteFillOrder,
                takerAssetFillAmount,
                takerAssetFillAmount.dividedToIntegerBy(2),
            );
            const tx = deployment.exchange.fillOrKillOrder.awaitTransactionSuccessAsync(
                signedOrder,
                signedOrder.takerAssetAmount,
                signedOrder.signature,
                { from: takerAddress, gasPrice: DeploymentManager.gasPrice, value: DeploymentManager.protocolFee },
            );
            return expect(tx).to.revertWith(expectedError);
        });
    });

    describe('batch functions', () => {
        let signedOrders: SignedOrder[];
        beforeEach(async () => {
            signedOrders = [
                await maker.newSignedOrderAsync(),
                await maker.newSignedOrderAsync(),
                await maker.newSignedOrderAsync(),
            ];
        });

        describe('batchFillOrders', () => {
            it('should transfer the correct amounts', async () => {
                const takerAssetFillAmounts: BigNumber[] = [];
                const expectedFillResults: FillResults[] = [];

                _.forEach(signedOrders, signedOrder => {
                    const takerAssetFilledAmount = signedOrder.takerAssetAmount.div(2);
                    const makerAssetFilledAmount = takerAssetFilledAmount
                        .times(signedOrder.makerAssetAmount)
                        .dividedToIntegerBy(signedOrder.takerAssetAmount);
                    const makerFeePaid = signedOrder.makerFee
                        .times(makerAssetFilledAmount)
                        .dividedToIntegerBy(signedOrder.makerAssetAmount);
                    const takerFeePaid = signedOrder.takerFee
                        .times(makerAssetFilledAmount)
                        .dividedToIntegerBy(signedOrder.makerAssetAmount);
                    const protocolFeePaid = DeploymentManager.protocolFee;

                    takerAssetFillAmounts.push(takerAssetFilledAmount);
                    expectedFillResults.push({
                        takerAssetFilledAmount,
                        makerAssetFilledAmount,
                        makerFeePaid,
                        takerFeePaid,
                        protocolFeePaid,
                    });

                    simulateFill(makerAddress, takerAddress, feeRecipientAddress, signedOrder, {
                        takerAssetFilledAmount,
                        makerAssetFilledAmount,
                        makerFeePaid,
                        takerFeePaid,
                        protocolFeePaid,
                    });
                });

                const fillResults = await deployment.exchange.batchFillOrders.callAsync(
                    signedOrders,
                    takerAssetFillAmounts,
                    signedOrders.map(signedOrder => signedOrder.signature),
                    {
                        from: takerAddress,
                        gasPrice: DeploymentManager.gasPrice,
                        value: DeploymentManager.protocolFee.times(signedOrders.length),
                    },
                );
                const receipt = await deployment.exchange.batchFillOrders.awaitTransactionSuccessAsync(
                    signedOrders,
                    takerAssetFillAmounts,
                    signedOrders.map(signedOrder => signedOrder.signature),
                    {
                        from: takerAddress,
                        gasPrice: DeploymentManager.gasPrice,
                        value: DeploymentManager.protocolFee.times(signedOrders.length),
                    },
                );

                localBalances.burnGas(takerAddress, DeploymentManager.gasPrice.times(receipt.gasUsed));

                await blockchainBalances.updateBalancesAsync();

                blockchainBalances.assertEquals(localBalances);

                expect(receipt.logs.length).to.be.eq(5 * signedOrders.length);
            });
        });

        describe('batchFillOrKillOrders', () => {
            it('should transfer the correct amounts', async () => {
                const takerAssetFillAmounts: BigNumber[] = [];
                const expectedFillResults: FillResults[] = [];

                _.forEach(signedOrders, signedOrder => {
                    const takerAssetFilledAmount = signedOrder.takerAssetAmount.div(2);
                    const makerAssetFilledAmount = takerAssetFilledAmount
                        .times(signedOrder.makerAssetAmount)
                        .dividedToIntegerBy(signedOrder.takerAssetAmount);
                    const makerFeePaid = signedOrder.makerFee
                        .times(makerAssetFilledAmount)
                        .dividedToIntegerBy(signedOrder.makerAssetAmount);
                    const takerFeePaid = signedOrder.takerFee
                        .times(makerAssetFilledAmount)
                        .dividedToIntegerBy(signedOrder.makerAssetAmount);
                    const protocolFeePaid = DeploymentManager.protocolFee;

                    takerAssetFillAmounts.push(takerAssetFilledAmount);
                    expectedFillResults.push({
                        takerAssetFilledAmount,
                        makerAssetFilledAmount,
                        makerFeePaid,
                        takerFeePaid,
                        protocolFeePaid,
                    });

                    simulateFill(makerAddress, takerAddress, feeRecipientAddress, signedOrder, {
                        takerAssetFilledAmount,
                        makerAssetFilledAmount,
                        makerFeePaid,
                        takerFeePaid,
                        protocolFeePaid,
                    });
                });

                const fillResults = await deployment.exchange.batchFillOrKillOrders.callAsync(
                    signedOrders,
                    takerAssetFillAmounts,
                    signedOrders.map(signedOrder => signedOrder.signature),
                    {
                        from: takerAddress,
                        gasPrice: DeploymentManager.gasPrice,
                        value: DeploymentManager.protocolFee.times(signedOrders.length),
                    },
                );
                const receipt = await deployment.exchange.batchFillOrKillOrders.awaitTransactionSuccessAsync(
                    signedOrders,
                    takerAssetFillAmounts,
                    signedOrders.map(order => order.signature),
                    {
                        from: takerAddress,
                        gasPrice: DeploymentManager.gasPrice,
                        value: DeploymentManager.protocolFee.times(signedOrders.length),
                    },
                );

                localBalances.burnGas(takerAddress, DeploymentManager.gasPrice.times(receipt.gasUsed));

                await blockchainBalances.updateBalancesAsync();

                blockchainBalances.assertEquals(localBalances);

                // FIXME - Verify events
            });

            it('should revert if a single signedOrder does not fill the expected amount', async () => {
                const takerAssetFillAmounts: BigNumber[] = [];
                _.forEach(signedOrders, signedOrder => {
                    const takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);
                    takerAssetFillAmounts.push(takerAssetFillAmount);
                });

                await deployment.exchange.fillOrKillOrder.awaitTransactionSuccessAsync(
                    signedOrders[0],
                    signedOrders[0].takerAssetAmount,
                    signedOrders[0].signature,
                    { from: takerAddress, gasPrice: DeploymentManager.gasPrice, value: DeploymentManager.protocolFee },
                );

                const orderHashHex = orderHashUtils.getOrderHashHex(signedOrders[0]);
                const expectedError = new ExchangeRevertErrors.OrderStatusError(orderHashHex, OrderStatus.FullyFilled);
                const tx = deployment.exchange.batchFillOrKillOrders.awaitTransactionSuccessAsync(
                    signedOrders,
                    takerAssetFillAmounts,
                    signedOrders.map(order => order.signature),
                    {
                        from: takerAddress,
                        gasPrice: DeploymentManager.gasPrice,
                        value: DeploymentManager.protocolFee.times(signedOrders.length),
                    },
                );
                return expect(tx).to.revertWith(expectedError);
            });
        });

        describe('batchFillOrdersNoThrow', async () => {
            it('should transfer the correct amounts', async () => {
                const takerAssetFillAmounts: BigNumber[] = [];
                const expectedFillResults: FillResults[] = [];

                _.forEach(signedOrders, signedOrder => {
                    const takerAssetFilledAmount = signedOrder.takerAssetAmount.div(2);
                    const makerAssetFilledAmount = takerAssetFilledAmount
                        .times(signedOrder.makerAssetAmount)
                        .dividedToIntegerBy(signedOrder.takerAssetAmount);
                    const makerFeePaid = signedOrder.makerFee
                        .times(makerAssetFilledAmount)
                        .dividedToIntegerBy(signedOrder.makerAssetAmount);
                    const takerFeePaid = signedOrder.takerFee
                        .times(makerAssetFilledAmount)
                        .dividedToIntegerBy(signedOrder.makerAssetAmount);
                    const protocolFeePaid = DeploymentManager.protocolFee;

                    takerAssetFillAmounts.push(takerAssetFilledAmount);
                    expectedFillResults.push({
                        takerAssetFilledAmount,
                        makerAssetFilledAmount,
                        makerFeePaid,
                        takerFeePaid,
                        protocolFeePaid,
                    });

                    simulateFill(makerAddress, takerAddress, feeRecipientAddress, signedOrder, {
                        takerAssetFilledAmount,
                        makerAssetFilledAmount,
                        makerFeePaid,
                        takerFeePaid,
                        protocolFeePaid,
                    });
                });

                const fillResults = await deployment.exchange.batchFillOrdersNoThrow.callAsync(
                    signedOrders,
                    takerAssetFillAmounts,
                    signedOrders.map(signedOrder => signedOrder.signature),
                    {
                        from: takerAddress,
                        gasPrice: DeploymentManager.gasPrice,
                        value: DeploymentManager.protocolFee.times(signedOrders.length),
                    },
                );
                const receipt = await deployment.exchange.batchFillOrdersNoThrow.awaitTransactionSuccessAsync(
                    signedOrders,
                    takerAssetFillAmounts,
                    signedOrders.map(order => order.signature),
                    {
                        from: takerAddress,
                        gasPrice: DeploymentManager.gasPrice,
                        value: DeploymentManager.protocolFee.times(signedOrders.length),
                    },
                );

                localBalances.burnGas(takerAddress, DeploymentManager.gasPrice.times(receipt.gasUsed));

                await blockchainBalances.updateBalancesAsync();

                blockchainBalances.assertEquals(localBalances);

                // FIXME - Verify events
            });

            it('should not revert if an order is invalid and fill the remaining orders with the bare minimum protocol fee', async () => {
                const invalidOrder = {
                    ...signedOrders[0],
                    signature: '0x00',
                };
                const validOrders = signedOrders.slice(1);
                const takerAssetFillAmounts: BigNumber[] = [invalidOrder.takerAssetAmount.div(2)];
                const expectedFillResults = [nullFillResults];

                _.forEach(validOrders, signedOrder => {
                    const takerAssetFilledAmount = signedOrder.takerAssetAmount.div(2);
                    const makerAssetFilledAmount = takerAssetFilledAmount
                        .times(signedOrder.makerAssetAmount)
                        .dividedToIntegerBy(signedOrder.takerAssetAmount);
                    const makerFeePaid = signedOrder.makerFee
                        .times(makerAssetFilledAmount)
                        .dividedToIntegerBy(signedOrder.makerAssetAmount);
                    const takerFeePaid = signedOrder.takerFee
                        .times(makerAssetFilledAmount)
                        .dividedToIntegerBy(signedOrder.makerAssetAmount);
                    const protocolFeePaid = DeploymentManager.protocolFee;

                    takerAssetFillAmounts.push(takerAssetFilledAmount);
                    expectedFillResults.push({
                        takerAssetFilledAmount,
                        makerAssetFilledAmount,
                        makerFeePaid,
                        takerFeePaid,
                        protocolFeePaid,
                    });

                    simulateFill(makerAddress, takerAddress, feeRecipientAddress, signedOrder, {
                        takerAssetFilledAmount,
                        makerAssetFilledAmount,
                        makerFeePaid,
                        takerFeePaid,
                        protocolFeePaid,
                    });
                });

                const newOrders = [invalidOrder, ...validOrders];
                const fillResults = await deployment.exchange.batchFillOrdersNoThrow.callAsync(
                    newOrders,
                    takerAssetFillAmounts,
                    newOrders.map(signedOrder => signedOrder.signature),
                    {
                        from: takerAddress,
                        gasPrice: DeploymentManager.gasPrice,
                        value: DeploymentManager.protocolFee.times(validOrders.length),
                    },
                );
                const receipt = await deployment.exchange.batchFillOrdersNoThrow.awaitTransactionSuccessAsync(
                    newOrders,
                    takerAssetFillAmounts,
                    newOrders.map(order => order.signature),
                    {
                        from: takerAddress,
                        gasPrice: DeploymentManager.gasPrice,
                        value: DeploymentManager.protocolFee.times(validOrders.length),
                    },
                );

                localBalances.burnGas(takerAddress, DeploymentManager.gasPrice.times(receipt.gasUsed));

                await blockchainBalances.updateBalancesAsync();

                blockchainBalances.assertEquals(localBalances);

                // FIXME - Verify events
            });
        });

        describe('marketSellOrdersNoThrow', () => {
            it('should stop when the entire takerAssetFillAmount is filled', async () => {
                const takerAssetFilledAmount = signedOrders[0].takerAssetAmount.plus(
                    signedOrders[1].takerAssetAmount.div(2),
                );
                const makerAssetFilledAmount = signedOrders[0].makerAssetAmount.plus(
                    signedOrders[1].makerAssetAmount.div(2),
                );
                const makerFeePaid = signedOrders[0].makerFee.plus(signedOrders[1].makerFee.div(2));
                const takerFeePaid = signedOrders[0].takerFee.plus(signedOrders[1].takerFee.div(2));
                const protocolFeePaid = DeploymentManager.protocolFee.times(2);

                const fillResults = await deployment.exchange.marketSellOrdersNoThrow.callAsync(
                    signedOrders,
                    takerAssetFilledAmount,
                    signedOrders.map(signedOrder => signedOrder.signature),
                    {
                        from: takerAddress,
                        gasPrice: DeploymentManager.gasPrice,
                        value: protocolFeePaid,
                    },
                );
                const receipt = await deployment.exchange.marketSellOrdersNoThrow.awaitTransactionSuccessAsync(
                    signedOrders,
                    takerAssetFilledAmount,
                    signedOrders.map(signedOrder => signedOrder.signature),
                    {
                        from: takerAddress,
                        gasPrice: DeploymentManager.gasPrice,
                        value: protocolFeePaid,
                    },
                );

                // FIXME - Refactor this.
                expect(fillResults).to.be.deep.eq({
                    makerAssetFilledAmount,
                    takerAssetFilledAmount,
                    makerFeePaid,
                    takerFeePaid,
                    protocolFeePaid,
                });

                simulateFill(makerAddress, takerAddress, feeRecipientAddress, signedOrders[0], {
                    makerAssetFilledAmount: signedOrders[0].makerAssetAmount,
                    takerAssetFilledAmount: signedOrders[0].takerAssetAmount,
                    makerFeePaid: signedOrders[0].makerFee,
                    takerFeePaid: signedOrders[0].takerFee,
                    protocolFeePaid: DeploymentManager.protocolFee,
                });
                simulateFill(
                    makerAddress,
                    takerAddress,
                    feeRecipientAddress,
                    signedOrders[1],
                    {
                        makerAssetFilledAmount: signedOrders[1].makerAssetAmount.div(2),
                        takerAssetFilledAmount: signedOrders[1].takerAssetAmount.div(2),
                        makerFeePaid: signedOrders[1].makerFee.div(2),
                        takerFeePaid: signedOrders[1].takerFee.div(2),
                        protocolFeePaid: DeploymentManager.protocolFee,
                    },
                    receipt.gasUsed,
                );

                await blockchainBalances.updateBalancesAsync();

                blockchainBalances.assertEquals(localBalances);

                // FIXME - Verify events
            });

            it('should fill all signedOrders if cannot fill entire takerAssetFillAmount', async () => {
                const takerAssetFillAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(100000), 18);
                _.forEach(signedOrders, signedOrder => {
                    simulateFill(makerAddress, takerAddress, feeRecipientAddress, signedOrder, {
                        makerAssetFilledAmount: signedOrder.makerAssetAmount,
                        takerAssetFilledAmount: signedOrder.takerAssetAmount,
                        makerFeePaid: signedOrder.makerFee,
                        takerFeePaid: signedOrder.takerFee,
                        protocolFeePaid: DeploymentManager.protocolFee,
                    });
                });

                const fillResults = await deployment.exchange.marketSellOrdersNoThrow.callAsync(
                    signedOrders,
                    takerAssetFillAmount,
                    signedOrders.map(signedOrder => signedOrder.signature),
                    {
                        from: takerAddress,
                        gasPrice: DeploymentManager.gasPrice,
                        value: DeploymentManager.protocolFee.times(signedOrders.length),
                    },
                );
                const receipt = await deployment.exchange.marketSellOrdersNoThrow.awaitTransactionSuccessAsync(
                    signedOrders,
                    takerAssetFillAmount,
                    signedOrders.map(order => order.signature),
                    {
                        from: takerAddress,
                        gasPrice: DeploymentManager.gasPrice,
                        value: DeploymentManager.protocolFee.times(signedOrders.length),
                    },
                );

                const expectedFillResults = signedOrders
                    .map(signedOrder => ({
                        makerAssetFilledAmount: signedOrder.makerAssetAmount,
                        takerAssetFilledAmount: signedOrder.takerAssetAmount,
                        makerFeePaid: signedOrder.makerFee,
                        takerFeePaid: signedOrder.takerFee,
                        protocolFeePaid: DeploymentManager.protocolFee,
                    }))
                    .reduce(
                        (totalFillResults, currentFillResults) => ({
                            makerAssetFilledAmount: totalFillResults.makerAssetFilledAmount.plus(
                                currentFillResults.makerAssetFilledAmount,
                            ),
                            takerAssetFilledAmount: totalFillResults.takerAssetFilledAmount.plus(
                                currentFillResults.takerAssetFilledAmount,
                            ),
                            makerFeePaid: totalFillResults.makerFeePaid.plus(currentFillResults.makerFeePaid),
                            takerFeePaid: totalFillResults.takerFeePaid.plus(currentFillResults.takerFeePaid),
                            protocolFeePaid: totalFillResults.protocolFeePaid.plus(currentFillResults.protocolFeePaid),
                        }),
                        nullFillResults,
                    );

                expect(fillResults).to.deep.equal(expectedFillResults);

                localBalances.burnGas(takerAddress, DeploymentManager.gasPrice.times(receipt.gasUsed));

                await blockchainBalances.updateBalancesAsync();

                blockchainBalances.assertEquals(localBalances);

                // FIXME - Verify events
            });

            it('should fill a signedOrder that does not use the same takerAssetAddress', async () => {
                const defaultTakerAssetAddress = deployment.tokens.erc20[1];
                const feeToken = deployment.tokens.erc20[2];
                const differentTakerAssetData = assetDataUtils.encodeERC20AssetData(feeToken.address);
                signedOrders = [
                    await maker.newSignedOrderAsync(),
                    await maker.newSignedOrderAsync(),
                    await maker.newSignedOrderAsync({
                        takerAssetData: differentTakerAssetData,
                    }),
                ];
                const takerAssetFillAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(100000), 18);
                _.forEach(signedOrders, signedOrder => {
                    simulateFill(makerAddress, takerAddress, feeRecipientAddress, signedOrder, {
                        makerAssetFilledAmount: signedOrder.makerAssetAmount,
                        takerAssetFilledAmount: signedOrder.takerAssetAmount,
                        makerFeePaid: signedOrder.makerFee,
                        takerFeePaid: signedOrder.takerFee,
                        protocolFeePaid: DeploymentManager.protocolFee,
                    });
                });

                const fillResults = await deployment.exchange.marketSellOrdersNoThrow.callAsync(
                    signedOrders,
                    takerAssetFillAmount,
                    signedOrders.map(signedOrder => signedOrder.signature),
                    {
                        from: takerAddress,
                        gasPrice: DeploymentManager.gasPrice,
                        value: DeploymentManager.protocolFee.times(signedOrders.length),
                    },
                );
                const receipt = await deployment.exchange.marketSellOrdersNoThrow.awaitTransactionSuccessAsync(
                    signedOrders,
                    takerAssetFillAmount,
                    signedOrders.map(order => order.signature),
                    {
                        from: takerAddress,
                        gasPrice: DeploymentManager.gasPrice,
                        value: DeploymentManager.protocolFee.times(signedOrders.length),
                    },
                );

                const expectedFillResults = signedOrders
                    .map(signedOrder => ({
                        makerAssetFilledAmount: signedOrder.makerAssetAmount,
                        takerAssetFilledAmount: signedOrder.takerAssetAmount,
                        makerFeePaid: signedOrder.makerFee,
                        takerFeePaid: signedOrder.takerFee,
                        protocolFeePaid: DeploymentManager.protocolFee,
                    }))
                    .reduce(
                        (totalFillResults, currentFillResults) => ({
                            makerAssetFilledAmount: totalFillResults.makerAssetFilledAmount.plus(
                                currentFillResults.makerAssetFilledAmount,
                            ),
                            takerAssetFilledAmount: totalFillResults.takerAssetFilledAmount.plus(
                                currentFillResults.takerAssetFilledAmount,
                            ),
                            makerFeePaid: totalFillResults.makerFeePaid.plus(currentFillResults.makerFeePaid),
                            takerFeePaid: totalFillResults.takerFeePaid.plus(currentFillResults.takerFeePaid),
                            protocolFeePaid: totalFillResults.protocolFeePaid.plus(currentFillResults.protocolFeePaid),
                        }),
                        nullFillResults,
                    );
                expect(fillResults).to.deep.equal(expectedFillResults);

                localBalances.burnGas(takerAddress, DeploymentManager.gasPrice.times(receipt.gasUsed));

                await blockchainBalances.updateBalancesAsync();

                blockchainBalances.assertEquals(localBalances);

                // FIXME - Verify events
            });
        });

        describe('marketBuyOrdersNoThrow', () => {
            it('should stop when the entire makerAssetFillAmount is filled', async () => {
                const makerAssetFillAmount = signedOrders[0].makerAssetAmount.plus(
                    signedOrders[1].makerAssetAmount.div(2),
                );

                const fillResults = await deployment.exchange.marketBuyOrdersNoThrow.callAsync(
                    signedOrders,
                    makerAssetFillAmount,
                    signedOrders.map(signedOrder => signedOrder.signature),
                    {
                        from: takerAddress,
                        gasPrice: DeploymentManager.gasPrice,
                        value: DeploymentManager.protocolFee.times(signedOrders.length),
                    },
                );
                const receipt = await deployment.exchange.marketBuyOrdersNoThrow.awaitTransactionSuccessAsync(
                    signedOrders,
                    makerAssetFillAmount,
                    signedOrders.map(signedOrder => signedOrder.signature),
                    {
                        from: takerAddress,
                        gasPrice: DeploymentManager.gasPrice,
                        value: DeploymentManager.protocolFee.times(signedOrders.length),
                    },
                );

                const makerAmountBought = signedOrders[0].takerAssetAmount.plus(
                    signedOrders[1].takerAssetAmount.div(2),
                );
                const makerFee = signedOrders[1].makerFee.plus(signedOrders[1].makerFee.div(2));
                const takerFee = signedOrders[0].takerFee.plus(signedOrders[1].takerFee.div(2));

                expect(fillResults).to.be.deep.eq({
                    makerAssetFilledAmount: makerAssetFillAmount,
                    takerAssetFilledAmount: makerAmountBought,
                    makerFeePaid: makerFee,
                    takerFeePaid: takerFee,
                    protocolFeePaid: DeploymentManager.protocolFee.times(2),
                });

                simulateFill(makerAddress, takerAddress, feeRecipientAddress, signedOrders[0], {
                    makerAssetFilledAmount: signedOrders[0].makerAssetAmount,
                    takerAssetFilledAmount: signedOrders[0].takerAssetAmount,
                    makerFeePaid: signedOrders[0].makerFee,
                    takerFeePaid: signedOrders[0].takerFee,
                    protocolFeePaid: DeploymentManager.protocolFee,
                });
                simulateFill(makerAddress, takerAddress, feeRecipientAddress, signedOrders[1], {
                    makerAssetFilledAmount: signedOrders[1].makerAssetAmount.div(2),
                    takerAssetFilledAmount: signedOrders[1].takerAssetAmount.div(2),
                    makerFeePaid: signedOrders[1].makerFee.div(2),
                    takerFeePaid: signedOrders[1].takerFee.div(2),
                    protocolFeePaid: DeploymentManager.protocolFee,
                });

                localBalances.burnGas(takerAddress, DeploymentManager.gasPrice.times(receipt.gasUsed));

                await blockchainBalances.updateBalancesAsync();

                blockchainBalances.assertEquals(localBalances);

                // FIXME - Verify events
            });

            it('should fill all signedOrders if cannot fill entire makerAssetFillAmount', async () => {
                const makerAssetFillAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(100000), 18);
                _.forEach(signedOrders, signedOrder => {
                    simulateFill(makerAddress, takerAddress, feeRecipientAddress, signedOrder, {
                        makerAssetFilledAmount: signedOrder.makerAssetAmount,
                        takerAssetFilledAmount: signedOrder.takerAssetAmount,
                        makerFeePaid: signedOrder.makerFee,
                        takerFeePaid: signedOrder.takerFee,
                        protocolFeePaid: DeploymentManager.protocolFee,
                    });
                });

                const fillResults = await deployment.exchange.marketBuyOrdersNoThrow.callAsync(
                    signedOrders,
                    makerAssetFillAmount,
                    signedOrders.map(signedOrder => signedOrder.signature),
                    {
                        from: takerAddress,
                        gasPrice: DeploymentManager.gasPrice,
                        value: DeploymentManager.protocolFee.times(signedOrders.length),
                    },
                );
                const receipt = await deployment.exchange.marketBuyOrdersNoThrow.awaitTransactionSuccessAsync(
                    signedOrders,
                    makerAssetFillAmount,
                    signedOrders.map(signedOrder => signedOrder.signature),
                    {
                        from: takerAddress,
                        gasPrice: DeploymentManager.gasPrice,
                        value: DeploymentManager.protocolFee.times(signedOrders.length),
                    },
                );

                const expectedFillResults = signedOrders
                    .map(signedOrder => ({
                        makerAssetFilledAmount: signedOrder.makerAssetAmount,
                        takerAssetFilledAmount: signedOrder.takerAssetAmount,
                        makerFeePaid: signedOrder.makerFee,
                        takerFeePaid: signedOrder.takerFee,
                        protocolFeePaid: DeploymentManager.protocolFee,
                    }))
                    .reduce(
                        (totalFillResults, currentFillResults) => ({
                            makerAssetFilledAmount: totalFillResults.makerAssetFilledAmount.plus(
                                currentFillResults.makerAssetFilledAmount,
                            ),
                            takerAssetFilledAmount: totalFillResults.takerAssetFilledAmount.plus(
                                currentFillResults.takerAssetFilledAmount,
                            ),
                            makerFeePaid: totalFillResults.makerFeePaid.plus(currentFillResults.makerFeePaid),
                            takerFeePaid: totalFillResults.takerFeePaid.plus(currentFillResults.takerFeePaid),
                            protocolFeePaid: totalFillResults.protocolFeePaid.plus(currentFillResults.protocolFeePaid),
                        }),
                        nullFillResults,
                    );

                expect(fillResults).to.deep.equal(expectedFillResults);

                localBalances.burnGas(takerAddress, DeploymentManager.gasPrice.times(receipt.gasUsed));

                await blockchainBalances.updateBalancesAsync();

                blockchainBalances.assertEquals(localBalances);

                // FIXME - Verify events
            });

            it('should fill a signedOrder that does not use the same makerAssetAddress', async () => {
                const feeToken = deployment.tokens.erc20[2];
                const differentMakerAssetData = assetDataUtils.encodeERC20AssetData(feeToken.address);
                signedOrders = [
                    await maker.newSignedOrderAsync(),
                    await maker.newSignedOrderAsync(),
                    await maker.newSignedOrderAsync({
                        makerAssetData: differentMakerAssetData,
                    }),
                ];

                const makerAssetFillAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(100000), 18);
                _.forEach(signedOrders, signedOrder => {
                    simulateFill(makerAddress, takerAddress, feeRecipientAddress, signedOrder, {
                        makerAssetFilledAmount: signedOrder.makerAssetAmount,
                        takerAssetFilledAmount: signedOrder.takerAssetAmount,
                        makerFeePaid: signedOrder.makerFee,
                        takerFeePaid: signedOrder.takerFee,
                        protocolFeePaid: DeploymentManager.protocolFee,
                    });
                });

                const fillResults = await deployment.exchange.marketBuyOrdersNoThrow.callAsync(
                    signedOrders,
                    makerAssetFillAmount,
                    signedOrders.map(signedOrder => signedOrder.signature),
                    {
                        from: takerAddress,
                        gasPrice: DeploymentManager.gasPrice,
                        value: DeploymentManager.protocolFee.times(signedOrders.length),
                    },
                );
                const receipt = await deployment.exchange.marketBuyOrdersNoThrow.awaitTransactionSuccessAsync(
                    signedOrders,
                    makerAssetFillAmount,
                    signedOrders.map(signedOrder => signedOrder.signature),
                    {
                        from: takerAddress,
                        gasPrice: DeploymentManager.gasPrice,
                        value: DeploymentManager.protocolFee.times(signedOrders.length),
                    },
                );

                const expectedFillResults = signedOrders
                    .map(signedOrder => ({
                        makerAssetFilledAmount: signedOrder.makerAssetAmount,
                        takerAssetFilledAmount: signedOrder.takerAssetAmount,
                        makerFeePaid: signedOrder.makerFee,
                        takerFeePaid: signedOrder.takerFee,
                        protocolFeePaid: DeploymentManager.protocolFee,
                    }))
                    .reduce(
                        (totalFillResults, currentFillResults) => ({
                            makerAssetFilledAmount: totalFillResults.makerAssetFilledAmount.plus(
                                currentFillResults.makerAssetFilledAmount,
                            ),
                            takerAssetFilledAmount: totalFillResults.takerAssetFilledAmount.plus(
                                currentFillResults.takerAssetFilledAmount,
                            ),
                            makerFeePaid: totalFillResults.makerFeePaid.plus(currentFillResults.makerFeePaid),
                            takerFeePaid: totalFillResults.takerFeePaid.plus(currentFillResults.takerFeePaid),
                            protocolFeePaid: totalFillResults.protocolFeePaid.plus(currentFillResults.protocolFeePaid),
                        }),
                        nullFillResults,
                    );

                expect(fillResults).to.deep.equal(expectedFillResults);

                localBalances.burnGas(takerAddress, DeploymentManager.gasPrice.times(receipt.gasUsed));

                await blockchainBalances.updateBalancesAsync();

                blockchainBalances.assertEquals(localBalances);

                // FIXME - Verify events
            });
        });

        describe('batchCancelOrders', () => {
            it('should be able to cancel multiple signedOrders', async () => {
                const takerAssetCancelAmounts = _.map(signedOrders, signedOrder => signedOrder.takerAssetAmount);
                const receipt = await deployment.exchange.batchCancelOrders.awaitTransactionSuccessAsync(signedOrders, {
                    from: makerAddress,
                });
                const expectedOrderHashes = signedOrders.map(order => orderHashUtils.getOrderHashHex(order));
                expect(receipt.logs.length).to.equal(signedOrders.length);
                receipt.logs.forEach((log, index) => {
                    expect((log as any).args.orderHash).to.equal(expectedOrderHashes[index]);
                });
            });

            // FIXME - This test can be improved a lot
            it('should not revert if a single cancel noops', async () => {
                await deployment.exchange.cancelOrder.awaitTransactionSuccessAsync(signedOrders[1], {
                    from: makerAddress,
                });
                const expectedOrderHashes = [signedOrders[0], ...signedOrders.slice(2)].map(order =>
                    orderHashUtils.getOrderHashHex(order),
                );
                const receipt = await deployment.exchange.batchCancelOrders.awaitTransactionSuccessAsync(signedOrders, {
                    from: makerAddress,
                });

                expect(receipt.logs.length).to.equal(signedOrders.length - 1);
                receipt.logs.forEach((log, index) => {
                    expect((log as any).args.orderHash).to.equal(expectedOrderHashes[index]);
                });

                // FIXME - Verify events in a better way
            });
        });
    });
}); // tslint:disable-line:max-file-line-count
