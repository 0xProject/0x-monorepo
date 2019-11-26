import { DummyERC20TokenContract, ERC20TokenEvents, ERC20TokenTransferEventArgs } from '@0x/contracts-erc20';
import { ExchangeRevertErrors, IExchangeEvents, IExchangeFillEventArgs } from '@0x/contracts-exchange';
import { ReferenceFunctions } from '@0x/contracts-exchange-libs';
import {
    blockchainTests,
    constants,
    describe,
    expect,
    getLatestBlockTimestampAsync,
    Numberish,
    orderHashUtils,
    toBaseUnitAmount,
    verifyEvents,
} from '@0x/contracts-test-utils';
import { FillResults, OrderStatus, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { TransactionReceiptWithDecodedLogs } from 'ethereum-types';
import * as _ from 'lodash';

import { Actor } from '../framework/actors/base';
import { Maker } from '../framework/actors/maker';
import { BlockchainBalanceStore } from '../framework/balances/blockchain_balance_store';
import { LocalBalanceStore } from '../framework/balances/local_balance_store';
import { DeploymentManager } from '../framework/deployment_manager';

const { addFillResults, safeGetPartialAmountFloor } = ReferenceFunctions;

// tslint:disable:no-unnecessary-type-assertion
blockchainTests.resets('Exchange wrappers', env => {
    let maker: Maker;
    let taker: Actor;
    let feeRecipient: string;

    let makerToken: DummyERC20TokenContract;
    let takerToken: DummyERC20TokenContract;
    let feeToken: DummyERC20TokenContract;

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
        [feeRecipient] = await env.getAccountAddressesAsync();

        deployment = await DeploymentManager.deployAsync(env, {
            numErc20TokensToDeploy: 3,
            numErc721TokensToDeploy: 0,
            numErc1155TokensToDeploy: 0,
        });

        [makerToken, takerToken, feeToken] = deployment.tokens.erc20;

        maker = new Maker({
            name: 'market maker',
            deployment,
            orderConfig: {
                makerAssetData: deployment.assetDataEncoder
                    .ERC20Token(makerToken.address)
                    .getABIEncodedTransactionData(),
                takerAssetData: deployment.assetDataEncoder
                    .ERC20Token(takerToken.address)
                    .getABIEncodedTransactionData(),
                makerFeeAssetData: deployment.assetDataEncoder
                    .ERC20Token(feeToken.address)
                    .getABIEncodedTransactionData(),
                takerFeeAssetData: deployment.assetDataEncoder
                    .ERC20Token(feeToken.address)
                    .getABIEncodedTransactionData(),
                feeRecipientAddress: feeRecipient,
            },
        });

        taker = new Actor({
            name: 'taker',
            deployment,
        });

        await Promise.all([
            ...deployment.tokens.erc20.map(async token => maker.configureERC20TokenAsync(token)),
            taker.configureERC20TokenAsync(deployment.tokens.weth, deployment.staking.stakingProxy.address),
            ...deployment.tokens.erc20.map(async token => taker.configureERC20TokenAsync(token)),
        ]);

        blockchainBalances = new BlockchainBalanceStore(
            {
                makerAddress: maker.address,
                takerAddress: taker.address,
                feeRecipientAddress: feeRecipient,
                stakingProxy: deployment.staking.stakingProxy.address,
            },
            {
                erc20: {
                    makerToken,
                    takerToken,
                    feeToken,
                    weth: deployment.tokens.weth,
                },
            },
            {},
        );

        await blockchainBalances.updateBalancesAsync();

        initialLocalBalances = LocalBalanceStore.create(blockchainBalances);

        wethAssetData = deployment.assetDataEncoder
            .ERC20Token(deployment.tokens.weth.address)
            .getABIEncodedTransactionData();
    });

    beforeEach(async () => {
        localBalances = LocalBalanceStore.create(initialLocalBalances);
    });

    after(async () => {
        Actor.count = 0;
    });

    interface SignedOrderWithValidity {
        signedOrder: SignedOrder;
        isValid: boolean;
    }

    async function simulateFillAsync(
        signedOrder: SignedOrder,
        expectedFillResults: FillResults,
        shouldUseWeth: boolean,
    ): Promise<void> {
        // taker -> maker
        await localBalances.transferAssetAsync(
            taker.address,
            maker.address,
            expectedFillResults.takerAssetFilledAmount,
            signedOrder.takerAssetData,
        );

        // maker -> taker
        await localBalances.transferAssetAsync(
            maker.address,
            taker.address,
            expectedFillResults.makerAssetFilledAmount,
            signedOrder.makerAssetData,
        );

        // maker -> feeRecipient
        await localBalances.transferAssetAsync(
            maker.address,
            feeRecipient,
            expectedFillResults.makerFeePaid,
            signedOrder.makerFeeAssetData,
        );

        // taker -> feeRecipient
        await localBalances.transferAssetAsync(
            taker.address,
            feeRecipient,
            expectedFillResults.takerFeePaid,
            signedOrder.takerFeeAssetData,
        );

        // taker -> protocol fees
        if (shouldUseWeth) {
            await localBalances.transferAssetAsync(
                taker.address,
                deployment.staking.stakingProxy.address,
                expectedFillResults.protocolFeePaid,
                wethAssetData,
            );
        } else {
            localBalances.sendEth(
                taker.address,
                deployment.staking.stakingProxy.address,
                expectedFillResults.protocolFeePaid,
            );
        }
    }

    interface FillTestInfo {
        signedOrder: SignedOrder;
        expectedFillResults: FillResults;
        shouldPayWethFees: boolean;
    }

    function verifyFillEvents(receipt: TransactionReceiptWithDecodedLogs, fillTestInfos: FillTestInfo[]): void {
        const expectedFillEvents: IExchangeFillEventArgs[] = [];

        let expectedTransferEvents: ERC20TokenTransferEventArgs[] = [];

        for (const { signedOrder, expectedFillResults, shouldPayWethFees } of fillTestInfos) {
            const orderHash = orderHashUtils.getOrderHashHex(signedOrder);

            expectedFillEvents.push({
                makerAddress: maker.address,
                feeRecipientAddress: feeRecipient,
                makerAssetData: signedOrder.makerAssetData,
                takerAssetData: signedOrder.takerAssetData,
                makerFeeAssetData: signedOrder.makerFeeAssetData,
                takerFeeAssetData: signedOrder.takerFeeAssetData,
                orderHash,
                takerAddress: taker.address,
                senderAddress: taker.address,
                makerAssetFilledAmount: expectedFillResults.makerAssetFilledAmount,
                takerAssetFilledAmount: expectedFillResults.takerAssetFilledAmount,
                makerFeePaid: expectedFillResults.makerFeePaid,
                takerFeePaid: expectedFillResults.takerFeePaid,
                protocolFeePaid: expectedFillResults.protocolFeePaid,
            });

            const transferEvents = [
                {
                    _from: taker.address,
                    _to: maker.address,
                    _value: expectedFillResults.takerAssetFilledAmount,
                },
                {
                    _from: maker.address,
                    _to: taker.address,
                    _value: expectedFillResults.makerAssetFilledAmount,
                },
                {
                    _from: taker.address,
                    _to: feeRecipient,
                    _value: expectedFillResults.takerFeePaid,
                },
                {
                    _from: maker.address,
                    _to: feeRecipient,
                    _value: expectedFillResults.makerFeePaid,
                },
            ];

            if (shouldPayWethFees) {
                transferEvents.push({
                    _from: taker.address,
                    _to: deployment.staking.stakingProxy.address,
                    _value: expectedFillResults.protocolFeePaid,
                });
            }

            expectedTransferEvents = expectedTransferEvents.concat(transferEvents);
        }
        verifyEvents<IExchangeFillEventArgs>(receipt, expectedFillEvents, IExchangeEvents.Fill);
        verifyEvents<ERC20TokenTransferEventArgs>(receipt, expectedTransferEvents, ERC20TokenEvents.Transfer);
    }

    function calculateScaledFillResultsWithMaker(signedOrder: SignedOrder, fillAmount: BigNumber): FillResults {
        if (fillAmount === signedOrder.makerAssetAmount) {
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
                takerAssetFilledAmount: safeGetPartialAmountFloor(
                    fillAmount,
                    signedOrder.makerAssetAmount,
                    signedOrder.takerAssetAmount,
                ),
                makerFeePaid: safeGetPartialAmountFloor(fillAmount, signedOrder.makerAssetAmount, signedOrder.makerFee),
                takerFeePaid: safeGetPartialAmountFloor(fillAmount, signedOrder.makerAssetAmount, signedOrder.takerFee),
                protocolFeePaid: DeploymentManager.protocolFee,
            };
        }
    }

    function calculateScaledFillResultsWithTaker(signedOrder: SignedOrder, fillAmount: BigNumber): FillResults {
        if (fillAmount === signedOrder.takerAssetAmount) {
            return {
                makerAssetFilledAmount: signedOrder.makerAssetAmount,
                takerAssetFilledAmount: signedOrder.takerAssetAmount,
                makerFeePaid: signedOrder.makerFee,
                takerFeePaid: signedOrder.takerFee,
                protocolFeePaid: DeploymentManager.protocolFee,
            };
        } else {
            return {
                makerAssetFilledAmount: safeGetPartialAmountFloor(
                    fillAmount,
                    signedOrder.takerAssetAmount,
                    signedOrder.makerAssetAmount,
                ),
                takerAssetFilledAmount: fillAmount,
                makerFeePaid: safeGetPartialAmountFloor(fillAmount, signedOrder.takerAssetAmount, signedOrder.makerFee),
                takerFeePaid: safeGetPartialAmountFloor(fillAmount, signedOrder.takerAssetAmount, signedOrder.takerFee),
                protocolFeePaid: DeploymentManager.protocolFee,
            };
        }
    }

    async function assertResultsAsync(
        receipt: TransactionReceiptWithDecodedLogs,
        fillTestInfo: FillTestInfo[],
    ): Promise<void> {
        // Burn the gas used by the taker to ensure that the expected results are accurate.
        localBalances.burnGas(taker.address, DeploymentManager.gasPrice.times(receipt.gasUsed));

        // Update the blockchain balances balance store.
        await blockchainBalances.updateBalancesAsync();

        // Ensure that the blockchain and the local balance stores are equal.
        blockchainBalances.assertEquals(localBalances);

        // Verify that the correct fill and transfer events were emitted.
        verifyFillEvents(receipt, fillTestInfo);
    }

    describe('fillOrKillOrder', () => {
        async function testFillOrKillOrderAsync(value: Numberish): Promise<void> {
            const signedOrder = await maker.signOrderAsync({
                makerAssetAmount: toBaseUnitAmount(new BigNumber(100)),
                takerAssetAmount: toBaseUnitAmount(new BigNumber(200)),
            });
            const takerAssetFilledAmount = signedOrder.takerAssetAmount.div(5);

            const contractFn = deployment.exchange.fillOrKillOrder(
                signedOrder,
                takerAssetFilledAmount,
                signedOrder.signature,
            );
            const callData = { from: taker.address, gasPrice: DeploymentManager.gasPrice, value };
            const fillResults = await contractFn.callAsync(callData);
            const receipt = await contractFn.awaitTransactionSuccessAsync(callData);

            const expectedFillResults = calculateScaledFillResultsWithTaker(signedOrder, takerAssetFilledAmount);

            expect(fillResults).to.be.deep.eq(expectedFillResults);

            const shouldPayWethFees = DeploymentManager.protocolFee.gt(value);

            // Simulate filling the order
            await simulateFillAsync(signedOrder, expectedFillResults, shouldPayWethFees);

            // Ensure that the correct logs were emitted and that the balances are accurate.
            await assertResultsAsync(receipt, [{ signedOrder, expectedFillResults, shouldPayWethFees }]);
        }

        it('should transfer the correct amounts and pay the protocol fee in eth', async () => {
            await testFillOrKillOrderAsync(DeploymentManager.protocolFee);
        });

        it('should transfer the correct amounts, pay the protocol fee in eth, and refund for excess eth sent', async () => {
            await testFillOrKillOrderAsync(DeploymentManager.protocolFee.times(2));
        });

        it('should transfer the correct amounts and pay the protocol fee in weth', async () => {
            await testFillOrKillOrderAsync(0);
        });

        it('should transfer the correct amounts, pay the protocol fee in weth, and refund for excess eth sent', async () => {
            await testFillOrKillOrderAsync(DeploymentManager.protocolFee.div(2));
        });

        it('should revert if a signedOrder is expired', async () => {
            const currentTimestamp = await getLatestBlockTimestampAsync();
            const signedOrder = await maker.signOrderAsync({
                expirationTimeSeconds: new BigNumber(currentTimestamp).minus(10),
            });
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedError = new ExchangeRevertErrors.OrderStatusError(orderHashHex, OrderStatus.Expired);
            const tx = deployment.exchange
                .fillOrKillOrder(signedOrder, signedOrder.takerAssetAmount, signedOrder.signature)
                .awaitTransactionSuccessAsync({
                    from: taker.address,
                    gasPrice: DeploymentManager.gasPrice,
                    value: DeploymentManager.protocolFee,
                });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert if entire takerAssetFillAmount not filled', async () => {
            const signedOrder = await maker.signOrderAsync();
            const takerAssetFillAmount = signedOrder.takerAssetAmount;

            await deployment.exchange
                .fillOrder(signedOrder, signedOrder.takerAssetAmount.dividedToIntegerBy(2), signedOrder.signature)
                .awaitTransactionSuccessAsync({
                    from: taker.address,
                    gasPrice: DeploymentManager.gasPrice,
                    value: DeploymentManager.protocolFee,
                });
            const expectedError = new ExchangeRevertErrors.IncompleteFillError(
                ExchangeRevertErrors.IncompleteFillErrorCode.IncompleteFillOrder,
                takerAssetFillAmount,
                takerAssetFillAmount.dividedToIntegerBy(2),
            );
            const tx = deployment.exchange
                .fillOrKillOrder(signedOrder, signedOrder.takerAssetAmount, signedOrder.signature)
                .awaitTransactionSuccessAsync({
                    from: taker.address,
                    gasPrice: DeploymentManager.gasPrice,
                    value: DeploymentManager.protocolFee,
                });
            return expect(tx).to.revertWith(expectedError);
        });
    });

    describe('batch functions', () => {
        let signedOrders: SignedOrder[];

        before(async () => {
            signedOrders = [await maker.signOrderAsync(), await maker.signOrderAsync(), await maker.signOrderAsync()];
        });

        describe('batchFillOrders', () => {
            async function testBatchFillOrdersAsync(value: BigNumber): Promise<void> {
                const takerAssetFillAmounts: BigNumber[] = [];
                const fillTestInfo: FillTestInfo[] = [];
                const totalFillResults: FillResults[] = [];

                let valueLeft = value;

                for (const signedOrder of signedOrders) {
                    const takerAssetFilledAmount = signedOrder.takerAssetAmount.div(2);

                    takerAssetFillAmounts.push(takerAssetFilledAmount);

                    const expectedFillResults = calculateScaledFillResultsWithTaker(
                        signedOrder,
                        takerAssetFilledAmount,
                    );
                    totalFillResults.push(expectedFillResults);

                    let shouldPayWethFees;
                    if (DeploymentManager.protocolFee.lte(valueLeft)) {
                        shouldPayWethFees = false;
                        valueLeft = valueLeft.minus(DeploymentManager.protocolFee);
                    } else {
                        shouldPayWethFees = true;
                    }

                    fillTestInfo.push({ signedOrder, expectedFillResults, shouldPayWethFees });
                    await simulateFillAsync(signedOrder, expectedFillResults, shouldPayWethFees);
                }

                const contractFn = deployment.exchange.batchFillOrders(
                    signedOrders,
                    takerAssetFillAmounts,
                    signedOrders.map(signedOrder => signedOrder.signature),
                );
                const callData = {
                    from: taker.address,
                    gasPrice: DeploymentManager.gasPrice,
                    value,
                };
                const fillResults = await contractFn.callAsync(callData);
                const receipt = await contractFn.awaitTransactionSuccessAsync(callData);

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

                for (const signedOrder of signedOrders) {
                    const takerAssetFilledAmount = signedOrder.takerAssetAmount.div(2);

                    takerAssetFillAmounts.push(takerAssetFilledAmount);

                    const expectedFillResults = calculateScaledFillResultsWithTaker(
                        signedOrder,
                        takerAssetFilledAmount,
                    );
                    totalFillResults.push(expectedFillResults);

                    let shouldPayWethFees;

                    if (valueLeft.gte(DeploymentManager.protocolFee)) {
                        shouldPayWethFees = false;
                        valueLeft = valueLeft.minus(DeploymentManager.protocolFee);
                    } else {
                        shouldPayWethFees = true;
                    }

                    fillTestInfo.push({ signedOrder, expectedFillResults, shouldPayWethFees });
                    await simulateFillAsync(signedOrder, expectedFillResults, shouldPayWethFees);
                }

                const contractFn = deployment.exchange.batchFillOrKillOrders(
                    signedOrders,
                    takerAssetFillAmounts,
                    signedOrders.map(order => order.signature),
                );
                const callData = {
                    from: taker.address,
                    gasPrice: DeploymentManager.gasPrice,
                    value,
                };
                const fillResults = await contractFn.callAsync(callData);
                const receipt = await contractFn.awaitTransactionSuccessAsync(callData);

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
                const takerAssetFillAmounts = signedOrders.map(signedOrder => signedOrder.takerAssetAmount.div(2));

                await deployment.exchange
                    .fillOrKillOrder(signedOrders[0], signedOrders[0].takerAssetAmount, signedOrders[0].signature)
                    .awaitTransactionSuccessAsync({
                        from: taker.address,
                        gasPrice: DeploymentManager.gasPrice,
                        value: DeploymentManager.protocolFee,
                    });

                const orderHashHex = orderHashUtils.getOrderHashHex(signedOrders[0]);
                const expectedError = new ExchangeRevertErrors.OrderStatusError(orderHashHex, OrderStatus.FullyFilled);
                const tx = deployment.exchange
                    .batchFillOrKillOrders(
                        signedOrders,
                        takerAssetFillAmounts,
                        signedOrders.map(order => order.signature),
                    )
                    .awaitTransactionSuccessAsync({
                        from: taker.address,
                        gasPrice: DeploymentManager.gasPrice,
                        value: DeploymentManager.protocolFee.times(signedOrders.length),
                    });
                return expect(tx).to.revertWith(expectedError);
            });
        });

        describe('batchFillOrdersNoThrow', async () => {
            async function testBatchFillOrdersNoThrowAsync(
                signedOrdersWithValidity: SignedOrderWithValidity[],
                value: BigNumber,
                defaultTakerAssetFillAmounts?: BigNumber[],
            ): Promise<void> {
                const takerAssetFillAmounts: BigNumber[] = defaultTakerAssetFillAmounts || [];
                const fillTestInfo: FillTestInfo[] = [];
                const totalFillResults: FillResults[] = [];

                let valueLeft = value;

                for (const { signedOrder, isValid } of signedOrdersWithValidity) {
                    if (isValid) {
                        const takerAssetFilledAmount = signedOrder.takerAssetAmount.div(2);
                        takerAssetFillAmounts.push(takerAssetFilledAmount);
                        const expectedFillResults = calculateScaledFillResultsWithTaker(
                            signedOrder,
                            takerAssetFilledAmount,
                        );

                        totalFillResults.push(expectedFillResults);

                        let shouldPayWethFees;

                        if (valueLeft.gte(DeploymentManager.protocolFee)) {
                            shouldPayWethFees = false;
                            valueLeft = valueLeft.minus(DeploymentManager.protocolFee);
                        } else {
                            shouldPayWethFees = true;
                        }

                        fillTestInfo.push({ signedOrder, expectedFillResults, shouldPayWethFees });
                        await simulateFillAsync(signedOrder, expectedFillResults, shouldPayWethFees);
                    } else {
                        totalFillResults.push(nullFillResults);
                    }
                }

                const contractFn = deployment.exchange.batchFillOrdersNoThrow(
                    signedOrdersWithValidity.map(signedOrderWithValidity => signedOrderWithValidity.signedOrder),
                    takerAssetFillAmounts,
                    signedOrdersWithValidity.map(
                        signedOrderWithValidity => signedOrderWithValidity.signedOrder.signature,
                    ),
                );
                const callData = {
                    from: taker.address,
                    gasPrice: DeploymentManager.gasPrice,
                    value,
                };
                const fillResults = await contractFn.callAsync(callData);
                const receipt = await contractFn.awaitTransactionSuccessAsync(callData);

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

                const newOrders = [
                    { signedOrder: invalidOrder, isValid: false },
                    ...validOrders.map(validOrder => {
                        return { signedOrder: validOrder, isValid: true };
                    }),
                ];

                const takerAssetFillAmounts: BigNumber[] = [invalidOrder.takerAssetAmount.div(2)];

                await testBatchFillOrdersNoThrowAsync(
                    newOrders,
                    DeploymentManager.protocolFee.times(newOrders.length),
                    takerAssetFillAmounts,
                );
            });
        });

        describe('marketSellOrdersNoThrow', () => {
            async function testMarketSellOrdersNoThrowAsync(
                signedOrdersWithValidity: SignedOrderWithValidity[],
                takerAssetFillAmount: BigNumber,
                value: BigNumber,
            ): Promise<void> {
                const fillTestInfo: FillTestInfo[] = [];

                let valueLeft = value;
                let takerAssetFillAmountLeft = takerAssetFillAmount;

                let totalFillResults = { ...nullFillResults };

                for (const { signedOrder, isValid } of signedOrdersWithValidity) {
                    if (isValid) {
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

                            const expectedFillResults = calculateScaledFillResultsWithTaker(
                                signedOrder,
                                takerFillAmount,
                            );

                            await simulateFillAsync(signedOrder, expectedFillResults, shouldPayWethFees);
                            fillTestInfo.push({ signedOrder, expectedFillResults, shouldPayWethFees });

                            totalFillResults = addFillResults(totalFillResults, expectedFillResults);
                        }
                    }
                }

                const contractFn = deployment.exchange.marketSellOrdersNoThrow(
                    signedOrdersWithValidity.map(orderWithValidity => orderWithValidity.signedOrder),
                    takerAssetFillAmount,
                    signedOrdersWithValidity.map(orderWithValidity => orderWithValidity.signedOrder.signature),
                );
                const callData = {
                    from: taker.address,
                    gasPrice: DeploymentManager.gasPrice,
                    value,
                };
                const fillResults = await contractFn.callAsync(callData);
                const receipt = await contractFn.awaitTransactionSuccessAsync(callData);
                expect(fillResults).to.deep.equal(totalFillResults);

                await assertResultsAsync(receipt, fillTestInfo);
            }

            it('should stop when the entire takerAssetFillAmount is filled (eth protocol fee)', async () => {
                const takerAssetFillAmount = signedOrders[0].takerAssetAmount.plus(
                    signedOrders[1].takerAssetAmount.div(2),
                );

                await testMarketSellOrdersNoThrowAsync(
                    signedOrders.map(signedOrder => {
                        return { signedOrder, isValid: true };
                    }),
                    takerAssetFillAmount,
                    DeploymentManager.protocolFee.times(2),
                );
            });

            it('should stop when the entire takerAssetFillAmount is filled (weth protocol fee)', async () => {
                const takerAssetFillAmount = signedOrders[0].takerAssetAmount.plus(
                    signedOrders[1].takerAssetAmount.div(2),
                );

                await testMarketSellOrdersNoThrowAsync(
                    signedOrders.map(signedOrder => {
                        return { signedOrder, isValid: true };
                    }),
                    takerAssetFillAmount,
                    constants.ZERO_AMOUNT,
                );
            });

            it('should fill all signedOrders if cannot fill entire takerAssetFillAmount (eth protocol fee)', async () => {
                const takerAssetFillAmount = toBaseUnitAmount(new BigNumber(100000));

                await testMarketSellOrdersNoThrowAsync(
                    signedOrders.map(signedOrder => {
                        return { signedOrder, isValid: true };
                    }),
                    takerAssetFillAmount,
                    DeploymentManager.protocolFee.times(signedOrders.length),
                );
            });

            it('should fill all signedOrders if cannot fill entire takerAssetFillAmount (weth protocol fee)', async () => {
                const takerAssetFillAmount = toBaseUnitAmount(new BigNumber(100000));

                await testMarketSellOrdersNoThrowAsync(
                    signedOrders.map(signedOrder => {
                        return { signedOrder, isValid: true };
                    }),
                    takerAssetFillAmount,
                    constants.ZERO_AMOUNT,
                );
            });

            it('should fill a signedOrder that does not use the same takerAssetAddress (eth protocol fee)', async () => {
                const differentTakerAssetData = deployment.assetDataEncoder
                    .ERC20Token(feeToken.address)
                    .getABIEncodedTransactionData();

                signedOrders = [
                    await maker.signOrderAsync(),
                    await maker.signOrderAsync(),
                    await maker.signOrderAsync({
                        takerAssetData: differentTakerAssetData,
                    }),
                ];
                const takerAssetFillAmount = toBaseUnitAmount(new BigNumber(100000));

                await testMarketSellOrdersNoThrowAsync(
                    signedOrders.map(signedOrder => {
                        return { signedOrder, isValid: true };
                    }),
                    takerAssetFillAmount,
                    DeploymentManager.protocolFee.times(signedOrders.length),
                );
            });

            it('should fill a signedOrder that does not use the same takerAssetAddress (weth protocol fee)', async () => {
                const differentTakerAssetData = deployment.assetDataEncoder
                    .ERC20Token(feeToken.address)
                    .getABIEncodedTransactionData();

                signedOrders = [
                    await maker.signOrderAsync(),
                    await maker.signOrderAsync(),
                    await maker.signOrderAsync({
                        takerAssetData: differentTakerAssetData,
                    }),
                ];
                const takerAssetFillAmount = toBaseUnitAmount(new BigNumber(100000));

                await testMarketSellOrdersNoThrowAsync(
                    signedOrders.map(signedOrder => {
                        return { signedOrder, isValid: true };
                    }),
                    takerAssetFillAmount,
                    constants.ZERO_AMOUNT,
                );
            });

            it('should not revert if an invalid order is included (eth protocol fee)', async () => {
                const takerAssetFillAmount = toBaseUnitAmount(new BigNumber(100000));

                const invalidOrder = { ...signedOrders[0], signature: '0x00' };
                const validOrders = signedOrders.slice(1);

                const newOrdersWithValidity = [
                    { signedOrder: invalidOrder, isValid: false },
                    ...validOrders.map(signedOrder => {
                        return { signedOrder, isValid: true };
                    }),
                ];

                await testMarketSellOrdersNoThrowAsync(
                    newOrdersWithValidity,
                    takerAssetFillAmount,
                    DeploymentManager.protocolFee.times(validOrders.length),
                );
            });

            it('should not revert if an invalid order is included (weth protocol fee)', async () => {
                const takerAssetFillAmount = toBaseUnitAmount(new BigNumber(100000));

                const invalidOrder = { ...signedOrders[0], signature: '0x00' };
                const validOrders = signedOrders.slice(1);

                const newOrdersWithValidity = [
                    { signedOrder: invalidOrder, isValid: false },
                    ...validOrders.map(signedOrder => {
                        return { signedOrder, isValid: true };
                    }),
                ];

                await testMarketSellOrdersNoThrowAsync(
                    newOrdersWithValidity,
                    takerAssetFillAmount,
                    constants.ZERO_AMOUNT,
                );
            });
        });

        describe('marketBuyOrdersNoThrow', () => {
            async function testMarketBuyOrdersNoThrowAsync(
                signedOrdersWithValidity: SignedOrderWithValidity[],
                makerAssetFillAmount: BigNumber,
                value: BigNumber,
            ): Promise<void> {
                const fillTestInfo: FillTestInfo[] = [];

                let valueLeft = value;
                let totalFillResults = { ...nullFillResults };
                let makerAssetRemaining = makerAssetFillAmount;
                for (const { signedOrder, isValid } of signedOrdersWithValidity) {
                    if (isValid) {
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

                            const expectedFillResults = calculateScaledFillResultsWithMaker(
                                signedOrder,
                                makerAssetBought,
                            );

                            await simulateFillAsync(signedOrder, expectedFillResults, shouldPayWethFees);
                            fillTestInfo.push({ signedOrder, expectedFillResults, shouldPayWethFees });

                            totalFillResults = addFillResults(totalFillResults, expectedFillResults);
                        }
                    }
                }

                const contractFn = deployment.exchange.marketBuyOrdersNoThrow(
                    signedOrdersWithValidity.map(orderWithValidity => orderWithValidity.signedOrder),
                    makerAssetFillAmount,
                    signedOrdersWithValidity.map(orderWithValidity => orderWithValidity.signedOrder.signature),
                );
                const callData = {
                    from: taker.address,
                    gasPrice: DeploymentManager.gasPrice,
                    value,
                };
                const fillResults = await contractFn.callAsync(callData);
                const receipt = await contractFn.awaitTransactionSuccessAsync(callData);
                expect(fillResults).to.deep.equal(totalFillResults);

                await assertResultsAsync(receipt, fillTestInfo);
            }

            it('should stop when the entire makerAssetFillAmount is filled (eth protocol fee)', async () => {
                const makerAssetFillAmount = signedOrders[0].makerAssetAmount.plus(
                    signedOrders[1].makerAssetAmount.div(2),
                );

                await testMarketBuyOrdersNoThrowAsync(
                    signedOrders.map(signedOrder => {
                        return { signedOrder, isValid: true };
                    }),
                    makerAssetFillAmount,
                    DeploymentManager.protocolFee.times(signedOrders.length),
                );
            });

            it('should stop when the entire makerAssetFillAmount is filled (weth protocol fee)', async () => {
                const makerAssetFillAmount = signedOrders[0].makerAssetAmount.plus(
                    signedOrders[1].makerAssetAmount.div(2),
                );

                await testMarketBuyOrdersNoThrowAsync(
                    signedOrders.map(signedOrder => {
                        return { signedOrder, isValid: true };
                    }),
                    makerAssetFillAmount,
                    constants.ZERO_AMOUNT,
                );
            });

            it('should fill all signedOrders if cannot fill entire makerAssetFillAmount (eth protocol fee)', async () => {
                const makerAssetFillAmount = toBaseUnitAmount(new BigNumber(100000));

                await testMarketBuyOrdersNoThrowAsync(
                    signedOrders.map(signedOrder => {
                        return { signedOrder, isValid: true };
                    }),
                    makerAssetFillAmount,
                    DeploymentManager.protocolFee.times(signedOrders.length),
                );
            });

            it('should fill all signedOrders if cannot fill entire makerAssetFillAmount (weth protocol fee)', async () => {
                const makerAssetFillAmount = toBaseUnitAmount(new BigNumber(100000));

                await testMarketBuyOrdersNoThrowAsync(
                    signedOrders.map(signedOrder => {
                        return { signedOrder, isValid: true };
                    }),
                    makerAssetFillAmount,
                    constants.ZERO_AMOUNT,
                );
            });

            it('should fill a signedOrder that does not use the same makerAssetAddress (eth protocol fee)', async () => {
                const differentMakerAssetData = deployment.assetDataEncoder
                    .ERC20Token(feeToken.address)
                    .getABIEncodedTransactionData();

                signedOrders = [
                    await maker.signOrderAsync(),
                    await maker.signOrderAsync(),
                    await maker.signOrderAsync({
                        makerAssetData: differentMakerAssetData,
                    }),
                ];

                const makerAssetFillAmount = toBaseUnitAmount(new BigNumber(100000));

                await testMarketBuyOrdersNoThrowAsync(
                    signedOrders.map(signedOrder => {
                        return { signedOrder, isValid: true };
                    }),
                    makerAssetFillAmount,
                    DeploymentManager.protocolFee.times(signedOrders.length),
                );
            });

            it('should fill a signedOrder that does not use the same makerAssetAddress (weth protocol fee)', async () => {
                const differentMakerAssetData = deployment.assetDataEncoder
                    .ERC20Token(feeToken.address)
                    .getABIEncodedTransactionData();

                signedOrders = [
                    await maker.signOrderAsync(),
                    await maker.signOrderAsync(),
                    await maker.signOrderAsync({
                        makerAssetData: differentMakerAssetData,
                    }),
                ];

                const makerAssetFillAmount = toBaseUnitAmount(new BigNumber(100000));

                await testMarketBuyOrdersNoThrowAsync(
                    signedOrders.map(signedOrder => {
                        return { signedOrder, isValid: true };
                    }),
                    makerAssetFillAmount,
                    constants.ZERO_AMOUNT,
                );
            });

            it('should not revert if an invalid order is included (eth protocol fee)', async () => {
                const makerAssetFillAmount = toBaseUnitAmount(new BigNumber(100000));

                const invalidOrder = { ...signedOrders[0], signature: '0x00' };
                const validOrders = signedOrders.slice(1);

                const newOrdersWithValidity = [
                    { signedOrder: invalidOrder, isValid: false },
                    ...validOrders.map(signedOrder => {
                        return { signedOrder, isValid: true };
                    }),
                ];

                await testMarketBuyOrdersNoThrowAsync(
                    newOrdersWithValidity,
                    makerAssetFillAmount,
                    DeploymentManager.protocolFee.times(validOrders.length),
                );
            });

            it('should not revert if an invalid order is included (weth protocol fee)', async () => {
                const makerAssetFillAmount = toBaseUnitAmount(new BigNumber(100000));

                const invalidOrder = { ...signedOrders[0], signature: '0x00' };
                const validOrders = signedOrders.slice(1);

                const newOrdersWithValidity = [
                    { signedOrder: invalidOrder, isValid: false },
                    ...validOrders.map(signedOrder => {
                        return { signedOrder, isValid: true };
                    }),
                ];

                await testMarketBuyOrdersNoThrowAsync(
                    newOrdersWithValidity,
                    makerAssetFillAmount,
                    constants.ZERO_AMOUNT,
                );
            });
        });

        describe('batchCancelOrders', () => {
            it('should be able to cancel multiple signedOrders', async () => {
                const receipt = await deployment.exchange.batchCancelOrders(signedOrders).awaitTransactionSuccessAsync({
                    from: maker.address,
                });
                const expectedOrderHashes = signedOrders.map(order => orderHashUtils.getOrderHashHex(order));
                expect(receipt.logs.length).to.equal(signedOrders.length);
                receipt.logs.forEach((log, index) => {
                    expect((log as any).args.orderHash).to.equal(expectedOrderHashes[index]);
                });
            });

            it('should not revert if a single cancel noops', async () => {
                await deployment.exchange.cancelOrder(signedOrders[1]).awaitTransactionSuccessAsync({
                    from: maker.address,
                });
                const expectedOrderHashes = [signedOrders[0], ...signedOrders.slice(2)].map(order =>
                    orderHashUtils.getOrderHashHex(order),
                );
                const receipt = await deployment.exchange.batchCancelOrders(signedOrders).awaitTransactionSuccessAsync({
                    from: maker.address,
                });

                expect(receipt.logs.length).to.equal(signedOrders.length - 1);
                receipt.logs.forEach((log, index) => {
                    expect((log as any).args.orderHash).to.equal(expectedOrderHashes[index]);
                });
            });
        });
    });
}); // tslint:disable-line:max-file-line-count
