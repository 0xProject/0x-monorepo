import { ERC20ProxyContract, ERC20Wrapper } from '@0x/contracts-asset-proxy';
import { DummyERC20TokenContract, IERC20TokenEvents, IERC20TokenTransferEventArgs } from '@0x/contracts-erc20';
import {
    artifacts,
    BalanceStore,
    BlockchainBalanceStore,
    ExchangeContract,
    ExchangeWrapper,
    IExchangeEvents,
    IExchangeFillEventArgs,
    LocalBalanceStore,
} from '@0x/contracts-exchange';
import {
    blockchainTests,
    constants,
    describe,
    ERC20BalancesByOwner,
    expect,
    getLatestBlockTimestampAsync,
    Numberish,
    OrderFactory,
    verifyEvents,
} from '@0x/contracts-test-utils';
import { assetDataUtils, ExchangeRevertErrors, orderHashUtils } from '@0x/order-utils';
import { FillResults, OrderStatus, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { TransactionReceiptWithDecodedLogs, TxData } from 'ethereum-types';
import * as _ from 'lodash';

import { Actor } from '../actors/base';
import { Maker } from '../actors/maker';
import { DeploymentManager } from '../utils/deployment_manager';

type FillArgs = [SignedOrder, BigNumber, string, Partial<TxData>];
type BatchFillArgs = [SignedOrder[], BigNumber[], string[], Partial<TxData>];
type MarketFillArgs = [SignedOrder[], BigNumber, string[], Partial<TxData>];

// tslint:disable:no-unnecessary-type-assertion
blockchainTests.resets('Exchange wrappers', env => {
    let chainId: number;
    let makerAddress: string;
    let takerAddress: string;
    let feeRecipientAddress: string;

    let maker: Maker;
    let taker: Actor;

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

    let wethAssetData: string;

    before(async () => {
        chainId = await env.getChainIdAsync();
        const accounts = await env.getAccountAddressesAsync();
        const usedAddresses = ([makerAddress, takerAddress, feeRecipientAddress] = _.slice(accounts, 1, 4));

        deployment = await DeploymentManager.deployAsync(env, {
            numErc20TokensToDeploy: 3,
            numErc721TokensToDeploy: 0,
            numErc1155TokensToDeploy: 0,
        });

        maker = new Maker({
            name: 'market maker',
            deployment,
            orderConfig: {
                ...constants.STATIC_ORDER_PARAMS,
                makerAddress,
                makerAssetData: assetDataUtils.encodeERC20AssetData(deployment.tokens.erc20[0].address),
                takerAssetData: assetDataUtils.encodeERC20AssetData(deployment.tokens.erc20[1].address),
                makerFeeAssetData: assetDataUtils.encodeERC20AssetData(deployment.tokens.erc20[2].address),
                takerFeeAssetData: assetDataUtils.encodeERC20AssetData(deployment.tokens.erc20[2].address),
                feeRecipientAddress,
                exchangeAddress: deployment.exchange.address,
                chainId,
            },
        });
        makerAddress = maker.address;
        taker = new Actor({
            name: 'taker',
            deployment,
        });
        takerAddress = taker.address;

        await Promise.all([
            ...deployment.tokens.erc20.map(token => maker.configureERC20TokenAsync(token)),
            taker.configureERC20TokenAsync(deployment.tokens.weth, deployment.staking.stakingProxy.address),
            ...deployment.tokens.erc20.map(token => taker.configureERC20TokenAsync(token)),
        ]);

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
                    weth: deployment.tokens.weth,
                },
            },
            {},
        );

        await blockchainBalances.updateBalancesAsync();

        initialLocalBalances = LocalBalanceStore.create(blockchainBalances);

        wethAssetData = assetDataUtils.encodeERC20AssetData(deployment.tokens.weth.address);
    });

    beforeEach(async () => {
        localBalances = LocalBalanceStore.create(initialLocalBalances);
    });

    function addFillResults(a: FillResults, b: FillResults): void {
        a.makerAssetFilledAmount = a.makerAssetFilledAmount.plus(b.makerAssetFilledAmount);
        a.takerAssetFilledAmount = a.takerAssetFilledAmount.plus(b.takerAssetFilledAmount);
        a.makerFeePaid = a.makerFeePaid.plus(b.makerFeePaid);
        a.takerFeePaid = a.takerFeePaid.plus(b.takerFeePaid);
        a.protocolFeePaid = a.protocolFeePaid.plus(b.protocolFeePaid);
    }

    function simulateFill(signedOrder: SignedOrder, expectedFillResults: FillResults, shouldUseWeth: boolean): void {
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
        if (shouldUseWeth) {
            localBalances.transferAsset(
                takerAddress,
                deployment.staking.stakingProxy.address,
                expectedFillResults.protocolFeePaid,
                wethAssetData,
            );
        } else {
            localBalances.sendEth(
                takerAddress,
                deployment.staking.stakingProxy.address,
                expectedFillResults.protocolFeePaid,
            );
        }
    }

    function maximumBatchFillResults(signedOrders: SignedOrder[]): FillResults {
        return signedOrders
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
    }

    interface FillTestInfo {
        signedOrder: SignedOrder;
        expectedFillResults: FillResults;
        shouldPayWethFees: boolean;
    }

    function verifyFillEvents(receipt: TransactionReceiptWithDecodedLogs, fillTestInfo: FillTestInfo[]) {
        const expectedFillEvents: IExchangeFillEventArgs[] = [];

        let expectedTransferEvents: IERC20TokenTransferEventArgs[] = [];

        _.forEach(fillTestInfo, ({ signedOrder, expectedFillResults, shouldPayWethFees }) => {
            const orderHash = orderHashUtils.getOrderHashHex(signedOrder);

            expectedFillEvents.push({
                makerAddress,
                feeRecipientAddress,
                makerAssetData: signedOrder.makerAssetData,
                takerAssetData: signedOrder.takerAssetData,
                makerFeeAssetData: signedOrder.makerFeeAssetData,
                takerFeeAssetData: signedOrder.takerFeeAssetData,
                orderHash,
                takerAddress,
                senderAddress: takerAddress,
                makerAssetFilledAmount: expectedFillResults.makerAssetFilledAmount,
                takerAssetFilledAmount: expectedFillResults.takerAssetFilledAmount,
                makerFeePaid: expectedFillResults.makerFeePaid,
                takerFeePaid: expectedFillResults.takerFeePaid,
                protocolFeePaid: expectedFillResults.protocolFeePaid,
            });

            const transferEvents = [
                {
                    _from: takerAddress,
                    _to: makerAddress,
                    _value: expectedFillResults.takerAssetFilledAmount,
                },
                {
                    _from: makerAddress,
                    _to: takerAddress,
                    _value: expectedFillResults.makerAssetFilledAmount,
                },
                {
                    _from: takerAddress,
                    _to: feeRecipientAddress,
                    _value: expectedFillResults.takerFeePaid,
                },
                {
                    _from: makerAddress,
                    _to: feeRecipientAddress,
                    _value: expectedFillResults.makerFeePaid,
                },
            ];

            if (shouldPayWethFees) {
                transferEvents.push({
                    _from: takerAddress,
                    _to: deployment.staking.stakingProxy.address,
                    _value: expectedFillResults.protocolFeePaid,
                });
            }

            expectedTransferEvents = expectedTransferEvents.concat(transferEvents);
        });
        verifyEvents<IExchangeFillEventArgs>(receipt, expectedFillEvents, IExchangeEvents.Fill);
        verifyEvents<IERC20TokenTransferEventArgs>(receipt, expectedTransferEvents, IERC20TokenEvents.Transfer);
    }

    // Generates a fill results object with using either
    // `makerAssetFillAmount` or `takerAssetFillAmount` to scale.
    // the asset amounts
    function calculateScaledFillResults(
        signedOrder: SignedOrder,
        fillAmount: BigNumber,
        shouldUseMaker?: boolean,
    ): FillResults {
        if (shouldUseMaker) {
            if (fillAmount == signedOrder.makerAssetAmount) {
                return {
                    makerAssetFilledAmount: signedOrder.makerAssetAmount,
                    takerAssetFilledAmount: signedOrder.takerAssetAmount,
                    makerFeePaid: signedOrder.makerFee,
                    takerFeePaid: signedOrder.takerFee,
                    protocolFeePaid: DeploymentManager.protocolFee,
                };
            } else {
                return {
                    makerAssetFilledAmount: fillAmount,
                    takerAssetFilledAmount: fillAmount
                        .times(signedOrder.takerAssetAmount)
                        .div(signedOrder.makerAssetAmount),
                    makerFeePaid: fillAmount.times(signedOrder.makerFee).div(signedOrder.makerAssetAmount),
                    takerFeePaid: fillAmount.times(signedOrder.takerFee).div(signedOrder.makerAssetAmount),
                    protocolFeePaid: DeploymentManager.protocolFee,
                };
            }
        } else {
            if (fillAmount == signedOrder.takerAssetAmount) {
                return {
                    makerAssetFilledAmount: signedOrder.makerAssetAmount,
                    takerAssetFilledAmount: signedOrder.takerAssetAmount,
                    makerFeePaid: signedOrder.makerFee,
                    takerFeePaid: signedOrder.takerFee,
                    protocolFeePaid: DeploymentManager.protocolFee,
                };
            } else {
                return {
                    makerAssetFilledAmount: fillAmount
                        .times(signedOrder.makerAssetAmount)
                        .div(signedOrder.takerAssetAmount),
                    takerAssetFilledAmount: fillAmount,
                    makerFeePaid: fillAmount.times(signedOrder.makerFee).div(signedOrder.takerAssetAmount),
                    takerFeePaid: fillAmount.times(signedOrder.takerFee).div(signedOrder.takerAssetAmount),
                    protocolFeePaid: DeploymentManager.protocolFee,
                };
            }
        }
    }

    async function assertResultsAsync(
        receipt: TransactionReceiptWithDecodedLogs,
        fillTestInfo: FillTestInfo[],
    ): Promise<void> {
        // Burn the gas used by the taker to ensure that the expected results are accurate.
        localBalances.burnGas(takerAddress, DeploymentManager.gasPrice.times(receipt.gasUsed));

        // Update the blockchain balances balance store.
        await blockchainBalances.updateBalancesAsync();

        // Ensure that the blockchain and the local balance stores are ewqual.
        blockchainBalances.assertEquals(localBalances);

        // Verify that the correct fill and transfer events were emitted.
        verifyFillEvents(receipt, fillTestInfo);
    }

    describe('fillOrKillOrder', () => {
        async function testFillOrKillOrder(value: Numberish): Promise<void> {
            const signedOrder = await maker.signOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(200), 18),
            });
            const takerAssetFilledAmount = signedOrder.takerAssetAmount.div(2);

            const args: FillArgs = [
                signedOrder,
                takerAssetFilledAmount,
                signedOrder.signature,
                { from: takerAddress, gasPrice: DeploymentManager.gasPrice, value },
            ];

            const fillResults = await deployment.exchange.fillOrKillOrder.callAsync(...args);
            const receipt = await deployment.exchange.fillOrKillOrder.awaitTransactionSuccessAsync(...args);

            const expectedFillResults = calculateScaledFillResults(signedOrder, takerAssetFilledAmount);

            expect(fillResults).to.be.deep.eq(expectedFillResults);

            let shouldPayWethFees;
            if (DeploymentManager.protocolFee.lte(value)) {
                shouldPayWethFees = false;
            } else {
                shouldPayWethFees = true;
            }

            // Simulate filling the order
            simulateFill(signedOrder, expectedFillResults, shouldPayWethFees);

            // Ensure that the correct logs were emitted and that the balances are accurate.
            await assertResultsAsync(receipt, [{ signedOrder, expectedFillResults, shouldPayWethFees }]);
        }

        it('should transfer the correct amounts and pay the protocol fee in eth', async () => {
            await testFillOrKillOrder(DeploymentManager.protocolFee);
        });

        it('should transfer the correct amounts, pay the protocol fee in eth, and refund for excess eth sent', async () => {
            await testFillOrKillOrder(DeploymentManager.protocolFee.times(2));
        });

        it('should transfer the correct amounts and pay the protocol fee in weth', async () => {
            await testFillOrKillOrder(0);
        });

        it('should transfer the correct amounts, pay the protocol fee in weth, and refund for excess eth sent', async () => {
            await testFillOrKillOrder(DeploymentManager.protocolFee.div(2));
        });

        it('should revert if a signedOrder is expired', async () => {
            const currentTimestamp = await getLatestBlockTimestampAsync();
            const signedOrder = await maker.signOrderAsync({
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
            const signedOrder = await maker.signOrderAsync();
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
            signedOrders = [await maker.signOrderAsync(), await maker.signOrderAsync(), await maker.signOrderAsync()];
        });

        describe('batchFillOrders', () => {
            async function testBatchFillOrdersAsync(value: BigNumber): Promise<void> {
                const takerAssetFillAmounts: BigNumber[] = [];
                const fillTestInfo: FillTestInfo[] = [];
                const totalFillResults: FillResults[] = [];

                let valueLeft = value;

                _.forEach(signedOrders, signedOrder => {
                    const takerAssetFilledAmount = signedOrder.takerAssetAmount.div(2);

                    takerAssetFillAmounts.push(takerAssetFilledAmount);

                    const expectedFillResults = calculateScaledFillResults(signedOrder, takerAssetFilledAmount);
                    totalFillResults.push(expectedFillResults);

                    let shouldPayWethFees;
                    if (DeploymentManager.protocolFee.lte(valueLeft)) {
                        shouldPayWethFees = false;
                        valueLeft = valueLeft.minus(DeploymentManager.protocolFee);
                    } else {
                        shouldPayWethFees = true;
                    }

                    fillTestInfo.push({ signedOrder, expectedFillResults, shouldPayWethFees });
                    simulateFill(signedOrder, expectedFillResults, shouldPayWethFees);
                });

                const args: BatchFillArgs = [
                    signedOrders,
                    takerAssetFillAmounts,
                    signedOrders.map(signedOrder => signedOrder.signature),
                    {
                        from: takerAddress,
                        gasPrice: DeploymentManager.gasPrice,
                        value,
                    },
                ];

                const fillResults = await deployment.exchange.batchFillOrders.callAsync(...args);
                const receipt = await deployment.exchange.batchFillOrders.awaitTransactionSuccessAsync(...args);

                expect(totalFillResults).to.be.deep.eq(fillResults);

                await assertResultsAsync(receipt, fillTestInfo);
            }

            it('should transfer the correct amounts if all fees are paid in eth', async () => {
                await testBatchFillOrdersAsync(DeploymentManager.protocolFee.times(signedOrders.length));
            });

            it('should transfer the correct amounts if some fees are paid in eth and some in weth', async () => {
                await testBatchFillOrdersAsync(DeploymentManager.protocolFee.times(signedOrders.length - 1));
            });

            it('should transfer the correct amounts if all fees are paid in weth', async () => {
                await testBatchFillOrdersAsync(constants.ZERO_AMOUNT);
            });
        });

        describe('batchFillOrKillOrders', () => {
            async function testBatchFillOrKillOrdersAsync(value: BigNumber): Promise<void> {
                const takerAssetFillAmounts: BigNumber[] = [];
                const fillTestInfo: FillTestInfo[] = [];
                const totalFillResults: FillResults[] = [];

                let valueLeft = value;

                _.forEach(signedOrders, signedOrder => {
                    const takerAssetFilledAmount = signedOrder.takerAssetAmount.div(2);

                    takerAssetFillAmounts.push(takerAssetFilledAmount);

                    const expectedFillResults = calculateScaledFillResults(signedOrder, takerAssetFilledAmount);
                    totalFillResults.push(expectedFillResults);

                    let shouldPayWethFees;

                    if (valueLeft.gte(DeploymentManager.protocolFee)) {
                        shouldPayWethFees = false;
                        valueLeft = valueLeft.minus(DeploymentManager.protocolFee);
                    } else {
                        shouldPayWethFees = true;
                    }

                    fillTestInfo.push({ signedOrder, expectedFillResults, shouldPayWethFees });
                    simulateFill(signedOrder, expectedFillResults, shouldPayWethFees);
                });

                const args: BatchFillArgs = [
                    signedOrders,
                    takerAssetFillAmounts,
                    signedOrders.map(order => order.signature),
                    {
                        from: takerAddress,
                        gasPrice: DeploymentManager.gasPrice,
                        value,
                    },
                ];

                const fillResults = await deployment.exchange.batchFillOrKillOrders.callAsync(...args);
                const receipt = await deployment.exchange.batchFillOrKillOrders.awaitTransactionSuccessAsync(...args);

                expect(totalFillResults).to.be.deep.eq(fillResults);

                await assertResultsAsync(receipt, fillTestInfo);
            }

            it('should transfer the correct amounts if all fees are paid in eth', async () => {
                await testBatchFillOrKillOrdersAsync(DeploymentManager.protocolFee.times(signedOrders.length));
            });

            it('should transfer the correct amounts if some fees are paid in eth and some in weth', async () => {
                await testBatchFillOrKillOrdersAsync(DeploymentManager.protocolFee.times(signedOrders.length - 1));
            });

            it('should transfer the correct amounts if all fees are paid in weth', async () => {
                await testBatchFillOrKillOrdersAsync(constants.ZERO_AMOUNT);
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
            interface SignedOrderWithValidity {
                signedOrder: SignedOrder;
                isValid: boolean;
            }

            async function testBatchFillOrdersNoThrowAsync(
                signedOrdersWithValidity: SignedOrderWithValidity[],
                value: BigNumber,
                defaultTakerAssetFillAmounts?: BigNumber[],
            ): Promise<void> {
                const takerAssetFillAmounts: BigNumber[] = defaultTakerAssetFillAmounts || [];
                const fillTestInfo: FillTestInfo[] = [];
                const totalFillResults: FillResults[] = [];

                let valueLeft = value;

                _.forEach(signedOrdersWithValidity, ({ signedOrder, isValid }) => {
                    if (isValid) {
                        const takerAssetFilledAmount = signedOrder.takerAssetAmount.div(2);
                        takerAssetFillAmounts.push(takerAssetFilledAmount);
                        const expectedFillResults = calculateScaledFillResults(signedOrder, takerAssetFilledAmount);

                        totalFillResults.push(expectedFillResults);

                        let shouldPayWethFees;

                        if (valueLeft.gte(DeploymentManager.protocolFee)) {
                            shouldPayWethFees = false;
                            valueLeft = valueLeft.minus(DeploymentManager.protocolFee);
                        } else {
                            shouldPayWethFees = true;
                        }

                        fillTestInfo.push({ signedOrder, expectedFillResults, shouldPayWethFees });
                        simulateFill(signedOrder, expectedFillResults, shouldPayWethFees);
                    } else {
                        totalFillResults.push(nullFillResults);
                    }
                });

                const args: BatchFillArgs = [
                    signedOrders,
                    takerAssetFillAmounts,
                    signedOrders.map(order => order.signature),
                    {
                        from: takerAddress,
                        gasPrice: DeploymentManager.gasPrice,
                        value,
                    },
                ];

                const fillResults = await deployment.exchange.batchFillOrdersNoThrow.callAsync(...args);
                const receipt = await deployment.exchange.batchFillOrdersNoThrow.awaitTransactionSuccessAsync(...args);

                expect(totalFillResults).to.be.deep.eq(fillResults);

                await assertResultsAsync(receipt, fillTestInfo);
            }

            it('should transfer the correct amounts if all fees are paid in eth', async () => {
                await testBatchFillOrdersNoThrowAsync(
                    signedOrders.map(signedOrder => {
                        return { signedOrder, isValid: true };
                    }),
                    DeploymentManager.protocolFee.times(signedOrders.length),
                );
            });

            it('should transfer the correct amounts if some fees are paid in eth and some in weth', async () => {
                await testBatchFillOrdersNoThrowAsync(
                    signedOrders.map(signedOrder => {
                        return { signedOrder, isValid: true };
                    }),
                    DeploymentManager.protocolFee.times(signedOrders.length - 1),
                );
            });

            it('should transfer the correct amounts if all fees are paid in weth', async () => {
                await testBatchFillOrdersNoThrowAsync(
                    signedOrders.map(signedOrder => {
                        return { signedOrder, isValid: true };
                    }),
                    constants.ZERO_AMOUNT,
                );
            });

            it('should not revert if an order is invalid and fill the remaining orders', async () => {
                const invalidOrder: SignedOrder = {
                    ...signedOrders[0],
                    signature: '0x00',
                };

                const validOrders = signedOrders.slice(1);
                const newOrders = [invalidOrder, ...validOrders];

                const takerAssetFillAmounts: BigNumber[] = [invalidOrder.takerAssetAmount.div(2)];

                await testBatchFillOrdersNoThrowAsync(
                    newOrders.map(signedOrder => {
                        return { signedOrder, isValid: true };
                    }),
                    DeploymentManager.protocolFee.times(newOrders.length),
                    takerAssetFillAmounts,
                );
            });
        });

        describe('marketSellOrdersNoThrow', () => {
            async function testMarketSellOrdersNoThrow(
                signedOrders: SignedOrder[],
                takerAssetFillAmount: BigNumber,
                value: BigNumber,
            ): Promise<void> {
                const fillTestInfo: FillTestInfo[] = [];

                let valueLeft = value;
                let takerAssetFillAmountLeft = takerAssetFillAmount;

                const totalFillResults = { ...nullFillResults };

                _.forEach(signedOrders, signedOrder => {
                    let shouldPayWethFees;

                    if (valueLeft.gte(DeploymentManager.protocolFee)) {
                        shouldPayWethFees = false;
                        valueLeft = valueLeft.minus(DeploymentManager.protocolFee);
                    } else {
                        shouldPayWethFees = true;
                    }

                    if (!takerAssetFillAmountLeft.eq(0)) {
                        const takerFillAmount = takerAssetFillAmountLeft.gte(signedOrder.takerAssetAmount)
                            ? signedOrder.takerAssetAmount
                            : takerAssetFillAmountLeft;

                        takerAssetFillAmountLeft = takerAssetFillAmountLeft.minus(takerFillAmount);

                        const expectedFillResults = calculateScaledFillResults(signedOrder, takerFillAmount);

                        simulateFill(signedOrder, expectedFillResults, shouldPayWethFees);
                        fillTestInfo.push({ signedOrder, expectedFillResults, shouldPayWethFees });

                        addFillResults(totalFillResults, expectedFillResults);
                    }
                });

                const args: MarketFillArgs = [
                    signedOrders,
                    takerAssetFillAmount,
                    signedOrders.map(order => order.signature),
                    {
                        from: takerAddress,
                        gasPrice: DeploymentManager.gasPrice,
                        value,
                    },
                ];

                const fillResults = await deployment.exchange.marketSellOrdersNoThrow.callAsync(...args);
                const receipt = await deployment.exchange.marketSellOrdersNoThrow.awaitTransactionSuccessAsync(...args);

                expect(fillResults).to.deep.equal(totalFillResults);

                await assertResultsAsync(receipt, fillTestInfo);
            }

            it('should stop when the entire takerAssetFillAmount is filled', async () => {
                const takerAssetFillAmount = signedOrders[0].takerAssetAmount.plus(
                    signedOrders[1].takerAssetAmount.div(2),
                );

                await testMarketSellOrdersNoThrow(
                    signedOrders,
                    takerAssetFillAmount,
                    DeploymentManager.protocolFee.times(2),
                );
            });

            it('should stop when the entire takerAssetFillAmount is filled', async () => {
                const takerAssetFillAmount = signedOrders[0].takerAssetAmount.plus(
                    signedOrders[1].takerAssetAmount.div(2),
                );

                await testMarketSellOrdersNoThrow(signedOrders, takerAssetFillAmount, constants.ZERO_AMOUNT);
            });

            it('should fill all signedOrders if cannot fill entire takerAssetFillAmount', async () => {
                const takerAssetFillAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(100000), 18);

                await testMarketSellOrdersNoThrow(
                    signedOrders,
                    takerAssetFillAmount,
                    DeploymentManager.protocolFee.times(signedOrders.length),
                );
            });

            it('should fill all signedOrders if cannot fill entire takerAssetFillAmount', async () => {
                const takerAssetFillAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(100000), 18);

                await testMarketSellOrdersNoThrow(signedOrders, takerAssetFillAmount, constants.ZERO_AMOUNT);
            });

            it('should fill a signedOrder that does not use the same takerAssetAddress', async () => {
                const defaultTakerAssetAddress = deployment.tokens.erc20[1];
                const feeToken = deployment.tokens.erc20[2];
                const differentTakerAssetData = assetDataUtils.encodeERC20AssetData(feeToken.address);
                const fillTestInfo: FillTestInfo[] = [];

                signedOrders = [
                    await maker.signOrderAsync(),
                    await maker.signOrderAsync(),
                    await maker.signOrderAsync({
                        takerAssetData: differentTakerAssetData,
                    }),
                ];
                const takerAssetFillAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(100000), 18);

                await testMarketSellOrdersNoThrow(
                    signedOrders,
                    takerAssetFillAmount,
                    DeploymentManager.protocolFee.times(signedOrders.length),
                );
            });

            it('should fill a signedOrder that does not use the same takerAssetAddress', async () => {
                const defaultTakerAssetAddress = deployment.tokens.erc20[1];
                const feeToken = deployment.tokens.erc20[2];
                const differentTakerAssetData = assetDataUtils.encodeERC20AssetData(feeToken.address);
                const fillTestInfo: FillTestInfo[] = [];

                signedOrders = [
                    await maker.signOrderAsync(),
                    await maker.signOrderAsync(),
                    await maker.signOrderAsync({
                        takerAssetData: differentTakerAssetData,
                    }),
                ];
                const takerAssetFillAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(100000), 18);

                await testMarketSellOrdersNoThrow(signedOrders, takerAssetFillAmount, constants.ZERO_AMOUNT);
            });
        });

        describe('marketBuyOrdersNoThrow', () => {
            async function testMarketBuyOrdersNoThrow(
                signedOrders: SignedOrder[],
                makerAssetFillAmount: BigNumber,
                value: BigNumber,
            ): Promise<void> {
                const fillTestInfo: FillTestInfo[] = [];

                let valueLeft = value;
                const totalFillResults = { ...nullFillResults };
                let makerAssetRemaining = makerAssetFillAmount;
                _.forEach(signedOrders, signedOrder => {
                    let shouldPayWethFees;

                    if (valueLeft.gte(DeploymentManager.protocolFee)) {
                        shouldPayWethFees = false;
                        valueLeft = valueLeft.minus(DeploymentManager.protocolFee);
                    } else {
                        shouldPayWethFees = true;
                    }

                    if (!makerAssetRemaining.eq(0)) {
                        const makerAssetBought = makerAssetRemaining.gte(signedOrder.makerAssetAmount)
                            ? signedOrder.makerAssetAmount
                            : makerAssetRemaining;

                        makerAssetRemaining = makerAssetRemaining.minus(makerAssetBought);

                        const expectedFillResults = calculateScaledFillResults(signedOrder, makerAssetBought, true);

                        simulateFill(signedOrder, expectedFillResults, shouldPayWethFees);
                        fillTestInfo.push({ signedOrder, expectedFillResults, shouldPayWethFees });

                        addFillResults(totalFillResults, expectedFillResults);
                    }
                });

                const args: MarketFillArgs = [
                    signedOrders,
                    makerAssetFillAmount,
                    signedOrders.map(order => order.signature),
                    {
                        from: takerAddress,
                        gasPrice: DeploymentManager.gasPrice,
                        value,
                    },
                ];
                const fillResults = await deployment.exchange.marketBuyOrdersNoThrow.callAsync(...args);
                const receipt = await deployment.exchange.marketBuyOrdersNoThrow.awaitTransactionSuccessAsync(...args);

                expect(fillResults).to.deep.equal(totalFillResults);

                await assertResultsAsync(receipt, fillTestInfo);
            }

            it('should stop when the entire makerAssetFillAmount is filled', async () => {
                const makerAssetFillAmount = signedOrders[0].makerAssetAmount.plus(
                    signedOrders[1].makerAssetAmount.div(2),
                );

                await testMarketBuyOrdersNoThrow(
                    signedOrders,
                    makerAssetFillAmount,
                    DeploymentManager.protocolFee.times(signedOrders.length),
                );
            });

            it('should stop when the entire makerAssetFillAmount is filled', async () => {
                const makerAssetFillAmount = signedOrders[0].makerAssetAmount.plus(
                    signedOrders[1].makerAssetAmount.div(2),
                );

                await testMarketBuyOrdersNoThrow(signedOrders, makerAssetFillAmount, constants.ZERO_AMOUNT);
            });

            it('should fill all signedOrders if cannot fill entire makerAssetFillAmount', async () => {
                const makerAssetFillAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(100000), 18);

                await testMarketBuyOrdersNoThrow(
                    signedOrders,
                    makerAssetFillAmount,
                    DeploymentManager.protocolFee.times(signedOrders.length),
                );
            });

            it('should fill all signedOrders if cannot fill entire makerAssetFillAmount', async () => {
                const makerAssetFillAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(100000), 18);

                await testMarketBuyOrdersNoThrow(signedOrders, makerAssetFillAmount, constants.ZERO_AMOUNT);
            });

            it('should fill a signedOrder that does not use the same makerAssetAddress', async () => {
                const fillTestInfo: FillTestInfo[] = [];
                const feeToken = deployment.tokens.erc20[2];
                const differentMakerAssetData = assetDataUtils.encodeERC20AssetData(feeToken.address);
                signedOrders = [
                    await maker.signOrderAsync(),
                    await maker.signOrderAsync(),
                    await maker.signOrderAsync({
                        makerAssetData: differentMakerAssetData,
                    }),
                ];

                const makerAssetFillAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(100000), 18);

                await testMarketBuyOrdersNoThrow(
                    signedOrders,
                    makerAssetFillAmount,
                    DeploymentManager.protocolFee.times(signedOrders.length),
                );
            });

            it('should fill a signedOrder that does not use the same makerAssetAddress', async () => {
                const fillTestInfo: FillTestInfo[] = [];
                const feeToken = deployment.tokens.erc20[2];
                const differentMakerAssetData = assetDataUtils.encodeERC20AssetData(feeToken.address);
                signedOrders = [
                    await maker.signOrderAsync(),
                    await maker.signOrderAsync(),
                    await maker.signOrderAsync({
                        makerAssetData: differentMakerAssetData,
                    }),
                ];

                const makerAssetFillAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(100000), 18);

                await testMarketBuyOrdersNoThrow(signedOrders, makerAssetFillAmount, constants.ZERO_AMOUNT);
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
            });
        });
    });
}); // tslint:disable-line:max-file-line-count
