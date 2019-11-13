import { ReferenceFunctions as LibReferenceFunctions } from '@0x/contracts-exchange-libs';
import { blockchainTests, constants, expect, hexRandom, LogDecoder, orderHashUtils } from '@0x/contracts-test-utils';
import { SafeMathRevertErrors } from '@0x/contracts-utils';
import { Order } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { LogWithDecodedArgs } from 'ethereum-types';
import * as _ from 'lodash';

import { ExchangeRevertErrors } from '../src';

import { artifacts } from './artifacts';
import {
    TestExchangeInternalsContract,
    TestExchangeInternalsDispatchTransferFromCalledEventArgs,
    TestExchangeInternalsFillEventArgs,
} from './wrappers';

blockchainTests('Exchange core internal functions', env => {
    const CHAIN_ID = 1337;
    const ONE_ETHER = constants.ONE_ETHER;
    const randomAddress = () => hexRandom(constants.ADDRESS_LENGTH);
    const randomHash = () => hexRandom(constants.WORD_LENGTH);
    const randomAssetData = () => hexRandom(36);
    let testExchange: TestExchangeInternalsContract;
    let logDecoder: LogDecoder;
    let senderAddress: string;
    const DEFAULT_PROTOCOL_MULTIPLIER = new BigNumber(150000);
    const DEFAULT_GAS_PRICE = new BigNumber(200000);

    before(async () => {
        const accounts = await env.getAccountAddressesAsync();
        senderAddress = accounts[0];

        testExchange = await TestExchangeInternalsContract.deployFrom0xArtifactAsync(
            artifacts.TestExchangeInternals,
            env.provider,
            env.txDefaults,
            {},
            new BigNumber(CHAIN_ID),
        );
        logDecoder = new LogDecoder(env.web3Wrapper, artifacts);
    });

    blockchainTests('assertValidMatch', () => {
        const ORDER_DEFAULTS = {
            senderAddress: randomAddress(),
            makerAddress: randomAddress(),
            takerAddress: randomAddress(),
            makerFee: ONE_ETHER.times(0.001),
            takerFee: ONE_ETHER.times(0.003),
            makerAssetAmount: ONE_ETHER,
            takerAssetAmount: ONE_ETHER.times(0.5),
            makerAssetData: randomAssetData(),
            takerAssetData: randomAssetData(),
            makerFeeAssetData: randomAssetData(),
            takerFeeAssetData: randomAssetData(),
            salt: new BigNumber(_.random(0, 1e8)),
            feeRecipientAddress: randomAddress(),
            expirationTimeSeconds: new BigNumber(_.random(0, 1e8)),
            exchangeAddress: constants.NULL_ADDRESS,
            chainId: 1337, // The chain id for the isolated exchange
        };

        function makeOrder(details?: Partial<Order>): Order {
            return _.assign({}, ORDER_DEFAULTS, details);
        }

        before(async () => {
            ORDER_DEFAULTS.exchangeAddress = testExchange.address;
        });

        it('should revert if the maker asset multiplication should overflow', async () => {
            const leftOrder = makeOrder({
                makerAssetAmount: constants.MAX_UINT256,
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(100, 18),
            });
            const rightOrder = makeOrder({
                makerAssetAmount: constants.MAX_UINT256_ROOT,
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(50, 18),
            });
            const expectedError = new SafeMathRevertErrors.Uint256BinOpError(
                SafeMathRevertErrors.BinOpErrorCodes.MultiplicationOverflow,
                leftOrder.makerAssetAmount,
                rightOrder.makerAssetAmount,
            );
            return expect(testExchange.assertValidMatch.callAsync(leftOrder, rightOrder)).to.revertWith(expectedError);
        });

        it('should revert if the taker asset multiplication should overflow', async () => {
            const leftOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(100, 18),
                takerAssetAmount: constants.MAX_UINT256,
            });
            const rightOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(50, 18),
                takerAssetAmount: constants.MAX_UINT256_ROOT,
            });
            const expectedError = new SafeMathRevertErrors.Uint256BinOpError(
                SafeMathRevertErrors.BinOpErrorCodes.MultiplicationOverflow,
                leftOrder.takerAssetAmount,
                rightOrder.takerAssetAmount,
            );
            return expect(testExchange.assertValidMatch.callAsync(leftOrder, rightOrder)).to.revertWith(expectedError);
        });

        it('should revert if the prices of the left order is less than the price of the right order', async () => {
            const leftOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(49, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(100, 18),
            });
            const rightOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(100, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(50, 18),
            });
            const orderHashHexLeft = orderHashUtils.getOrderHashHex(leftOrder);
            const orderHashHexRight = orderHashUtils.getOrderHashHex(rightOrder);
            const expectedError = new ExchangeRevertErrors.NegativeSpreadError(orderHashHexLeft, orderHashHexRight);
            return expect(testExchange.assertValidMatch.callAsync(leftOrder, rightOrder)).to.revertWith(expectedError);
        });

        it('should succeed if the prices of the left and right orders are equal', async () => {
            const leftOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(50, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(100, 18),
            });
            const rightOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(100, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(50, 18),
            });
            return expect(testExchange.assertValidMatch.callAsync(leftOrder, rightOrder)).to.be.fulfilled('');
        });

        it('should succeed if the price of the left order is higher than the price of the right', async () => {
            const leftOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(50, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(100, 18),
            });
            const rightOrder = makeOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(100, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(50, 18),
            });
            return expect(testExchange.assertValidMatch.callAsync(leftOrder, rightOrder)).to.be.fulfilled('');
        });
    });

    blockchainTests.resets('updateFilledState', async () => {
        const ORDER_DEFAULTS = {
            senderAddress: randomAddress(),
            makerAddress: randomAddress(),
            takerAddress: randomAddress(),
            makerFee: ONE_ETHER.times(0.001),
            takerFee: ONE_ETHER.times(0.003),
            makerAssetAmount: ONE_ETHER,
            takerAssetAmount: ONE_ETHER.times(0.5),
            makerAssetData: randomAssetData(),
            takerAssetData: randomAssetData(),
            makerFeeAssetData: randomAssetData(),
            takerFeeAssetData: randomAssetData(),
            salt: new BigNumber(_.random(0, 1e8)),
            feeRecipientAddress: randomAddress(),
            expirationTimeSeconds: new BigNumber(_.random(0, 1e8)),
            chainId: 1337,
            exchangeAddress: constants.NULL_ADDRESS,
        };

        function makeOrder(details?: Partial<Order>): Order {
            return _.assign({}, ORDER_DEFAULTS, details);
        }

        async function testUpdateFilledStateAsync(
            order: Order,
            orderTakerAssetFilledAmount: BigNumber,
            takerAddress: string,
            takerAssetFillAmount: BigNumber,
            protocolFeeMultiplier: BigNumber,
            gasPrice: BigNumber,
        ): Promise<void> {
            const orderHash = randomHash();
            const fillResults = LibReferenceFunctions.calculateFillResults(
                order,
                takerAssetFillAmount,
                protocolFeeMultiplier,
                gasPrice,
            );
            const expectedFilledState = orderTakerAssetFilledAmount.plus(takerAssetFillAmount);
            // CAll `testUpdateFilledState()`, which will set the `filled`
            // state for this order to `orderTakerAssetFilledAmount` before
            // calling `_updateFilledState()`.
            const receipt = await logDecoder.getTxWithDecodedLogsAsync(
                await testExchange.testUpdateFilledState.sendTransactionAsync(
                    order,
                    takerAddress,
                    orderHash,
                    orderTakerAssetFilledAmount,
                    fillResults,
                ),
            );
            // Grab the new `filled` state for this order.
            const actualFilledState = await testExchange.filled.callAsync(orderHash);
            // Assert the `filled` state for this order.
            expect(actualFilledState).to.bignumber.eq(expectedFilledState);
            // Assert the logs.
            // tslint:disable-next-line: no-unnecessary-type-assertion
            const fillEvent = receipt.logs[0] as LogWithDecodedArgs<TestExchangeInternalsFillEventArgs>;
            expect(fillEvent.event).to.eq('Fill');
            expect(fillEvent.args.makerAddress).to.eq(order.makerAddress);
            expect(fillEvent.args.feeRecipientAddress).to.eq(order.feeRecipientAddress);
            expect(fillEvent.args.orderHash).to.eq(orderHash);
            expect(fillEvent.args.takerAddress).to.eq(takerAddress);
            expect(fillEvent.args.senderAddress).to.eq(senderAddress);
            expect(fillEvent.args.makerAssetFilledAmount).to.bignumber.eq(fillResults.makerAssetFilledAmount);
            expect(fillEvent.args.takerAssetFilledAmount).to.bignumber.eq(fillResults.takerAssetFilledAmount);
            expect(fillEvent.args.makerFeePaid).to.bignumber.eq(fillResults.makerFeePaid);
            expect(fillEvent.args.takerFeePaid).to.bignumber.eq(fillResults.takerFeePaid);
            expect(fillEvent.args.makerAssetData).to.eq(order.makerAssetData);
            expect(fillEvent.args.takerAssetData).to.eq(order.takerAssetData);
            expect(fillEvent.args.makerFeeAssetData).to.eq(order.makerFeeAssetData);
            expect(fillEvent.args.takerFeeAssetData).to.eq(order.takerFeeAssetData);
            expect(fillEvent.args.protocolFeePaid).to.bignumber.eq(fillResults.protocolFeePaid);
        }

        it('emits a `Fill` event and updates `filled` state correctly', async () => {
            const order = makeOrder();
            return testUpdateFilledStateAsync(
                order,
                order.takerAssetAmount.times(0.1),
                randomAddress(),
                order.takerAssetAmount.times(0.25),
                DEFAULT_PROTOCOL_MULTIPLIER,
                DEFAULT_GAS_PRICE,
            );
        });

        it('reverts if `leftOrderTakerAssetFilledAmount + fillResults.takerAssetFilledAmount` overflows', async () => {
            const order = makeOrder();
            const orderTakerAssetFilledAmount = constants.MAX_UINT256.dividedToIntegerBy(2);
            const takerAssetFillAmount = constants.MAX_UINT256.dividedToIntegerBy(2).plus(2);
            const fillResults = {
                makerAssetFilledAmount: constants.ZERO_AMOUNT,
                takerAssetFilledAmount: takerAssetFillAmount,
                makerFeePaid: constants.ZERO_AMOUNT,
                takerFeePaid: constants.ZERO_AMOUNT,
                protocolFeePaid: constants.ZERO_AMOUNT,
            };
            const expectedError = new SafeMathRevertErrors.Uint256BinOpError(
                SafeMathRevertErrors.BinOpErrorCodes.AdditionOverflow,
                orderTakerAssetFilledAmount,
                takerAssetFillAmount,
            );
            return expect(
                testExchange.testUpdateFilledState.awaitTransactionSuccessAsync(
                    order,
                    randomAddress(),
                    randomHash(),
                    orderTakerAssetFilledAmount,
                    fillResults,
                ),
            ).to.revertWith(expectedError);
        });
    });

    blockchainTests('settleOrder', () => {
        const DEFAULT_ORDER = {
            senderAddress: randomAddress(),
            makerAddress: randomAddress(),
            takerAddress: randomAddress(),
            makerFee: ONE_ETHER.times(0.001),
            takerFee: ONE_ETHER.times(0.003),
            makerAssetAmount: ONE_ETHER,
            takerAssetAmount: ONE_ETHER.times(0.5),
            makerAssetData: randomAssetData(),
            takerAssetData: randomAssetData(),
            makerFeeAssetData: randomAssetData(),
            takerFeeAssetData: randomAssetData(),
            salt: new BigNumber(_.random(0, 1e8)),
            feeRecipientAddress: randomAddress(),
            expirationTimeSeconds: new BigNumber(_.random(0, 1e8)),
        };

        it('calls `_dispatchTransferFrom()` in the right order with the correct arguments', async () => {
            const order = DEFAULT_ORDER;
            const orderHash = randomHash();
            const takerAddress = randomAddress();
            const fillResults = {
                makerAssetFilledAmount: ONE_ETHER.times(2),
                takerAssetFilledAmount: ONE_ETHER.times(10),
                makerFeePaid: ONE_ETHER.times(0.01),
                takerFeePaid: ONE_ETHER.times(0.025),
                protocolFeePaid: constants.ZERO_AMOUNT,
            };
            const receipt = await logDecoder.getTxWithDecodedLogsAsync(
                await testExchange.settleOrder.sendTransactionAsync(orderHash, order, takerAddress, fillResults),
            );
            const logs = receipt.logs as Array<
                LogWithDecodedArgs<TestExchangeInternalsDispatchTransferFromCalledEventArgs>
            >;
            expect(logs.length === 4);
            expect(_.every(logs, log => log.event === 'DispatchTransferFromCalled')).to.be.true();
            // taker -> maker
            expect(logs[0].args.orderHash).to.eq(orderHash);
            expect(logs[0].args.assetData).to.eq(order.takerAssetData);
            expect(logs[0].args.from).to.eq(takerAddress);
            expect(logs[0].args.to).to.eq(order.makerAddress);
            expect(logs[0].args.amount).to.bignumber.eq(fillResults.takerAssetFilledAmount);
            // maker -> taker
            expect(logs[1].args.orderHash).to.eq(orderHash);
            expect(logs[1].args.assetData).to.eq(order.makerAssetData);
            expect(logs[1].args.from).to.eq(order.makerAddress);
            expect(logs[1].args.to).to.eq(takerAddress);
            expect(logs[1].args.amount).to.bignumber.eq(fillResults.makerAssetFilledAmount);
            // taker fee -> feeRecipient
            expect(logs[2].args.orderHash).to.eq(orderHash);
            expect(logs[2].args.assetData).to.eq(order.takerFeeAssetData);
            expect(logs[2].args.from).to.eq(takerAddress);
            expect(logs[2].args.to).to.eq(order.feeRecipientAddress);
            expect(logs[2].args.amount).to.bignumber.eq(fillResults.takerFeePaid);
            // maker fee -> feeRecipient
            expect(logs[3].args.orderHash).to.eq(orderHash);
            expect(logs[3].args.assetData).to.eq(order.makerFeeAssetData);
            expect(logs[3].args.from).to.eq(order.makerAddress);
            expect(logs[3].args.to).to.eq(order.feeRecipientAddress);
            expect(logs[3].args.amount).to.bignumber.eq(fillResults.makerFeePaid);
        });
    });

    blockchainTests('settleMatchOrders', () => {
        const getOrder = () => {
            return {
                senderAddress: randomAddress(),
                makerAddress: randomAddress(),
                takerAddress: randomAddress(),
                makerFee: ONE_ETHER.times(0.001),
                takerFee: ONE_ETHER.times(0.003),
                makerAssetAmount: ONE_ETHER,
                takerAssetAmount: ONE_ETHER.times(0.5),
                makerAssetData: randomAssetData(),
                takerAssetData: randomAssetData(),
                makerFeeAssetData: randomAssetData(),
                takerFeeAssetData: randomAssetData(),
                salt: new BigNumber(_.random(0, 1e8)),
                feeRecipientAddress: randomAddress(),
                expirationTimeSeconds: new BigNumber(_.random(0, 1e8)),
            };
        };

        it('should revert if the taker fee paid fields addition overflow and left.feeRecipient == right.feeRecipient && left.takerFeeAssetData == right.takerFeeAssetData', async () => {
            // Get the arguments for the call to `settleMatchOrders()`.
            const leftOrder = getOrder();
            const rightOrder = getOrder();
            const leftOrderHash = randomHash();
            const rightOrderHash = randomHash();
            const takerAddress = randomAddress();
            const matchedFillResults = {
                left: {
                    makerAssetFilledAmount: ONE_ETHER.times(2),
                    takerAssetFilledAmount: ONE_ETHER.times(10),
                    makerFeePaid: ONE_ETHER.times(0.01),
                    takerFeePaid: constants.MAX_UINT256,
                    protocolFeePaid: constants.ZERO_AMOUNT,
                },
                right: {
                    takerAssetFilledAmount: ONE_ETHER.times(20),
                    makerAssetFilledAmount: ONE_ETHER.times(4),
                    makerFeePaid: ONE_ETHER.times(0.02),
                    takerFeePaid: constants.MAX_UINT256_ROOT,
                    protocolFeePaid: constants.ZERO_AMOUNT,
                },
                profitInLeftMakerAsset: ONE_ETHER,
                profitInRightMakerAsset: ONE_ETHER.times(2),
            };

            // Set the fee recipient addresses and the taker fee asset data fields to be the same
            rightOrder.feeRecipientAddress = leftOrder.feeRecipientAddress;
            rightOrder.takerFeeAssetData = leftOrder.takerFeeAssetData;

            // The expected error that should be thrown by the function.
            const expectedError = new SafeMathRevertErrors.Uint256BinOpError(
                SafeMathRevertErrors.BinOpErrorCodes.AdditionOverflow,
                matchedFillResults.left.takerFeePaid,
                matchedFillResults.right.takerFeePaid,
            );

            // Ensure that the call to `settleMatchOrders()` fails with the expected error.
            const tx = testExchange.settleMatchOrders.sendTransactionAsync(
                leftOrderHash,
                rightOrderHash,
                leftOrder,
                rightOrder,
                takerAddress,
                matchedFillResults,
            );
            return expect(tx).to.revertWith(expectedError);
        });

        it('should succeed if the taker fee paid fields addition overflow and left.feeRecipient != right.feeRecipient || left.takerFeeAssetData != right.takerFeeAssetData', async () => {
            // Get the arguments for the call to `settleMatchOrders()`.
            const leftOrder = getOrder();
            const rightOrder = getOrder();
            const leftOrderHash = randomHash();
            const rightOrderHash = randomHash();
            const takerAddress = randomAddress();
            const matchedFillResults = {
                left: {
                    makerAssetFilledAmount: ONE_ETHER.times(2),
                    takerAssetFilledAmount: ONE_ETHER.times(10),
                    makerFeePaid: ONE_ETHER.times(0.01),
                    takerFeePaid: constants.MAX_UINT256,
                    protocolFeePaid: constants.ZERO_AMOUNT,
                },
                right: {
                    takerAssetFilledAmount: ONE_ETHER.times(20),
                    makerAssetFilledAmount: ONE_ETHER.times(4),
                    makerFeePaid: ONE_ETHER.times(0.02),
                    takerFeePaid: constants.MAX_UINT256_ROOT,
                    protocolFeePaid: constants.ZERO_AMOUNT,
                },
                profitInLeftMakerAsset: ONE_ETHER,
                profitInRightMakerAsset: ONE_ETHER.times(2),
            };

            // The call to `settleMatchOrders()` should be successful.
            return expect(
                testExchange.settleMatchOrders.sendTransactionAsync(
                    leftOrderHash,
                    rightOrderHash,
                    leftOrder,
                    rightOrder,
                    takerAddress,
                    matchedFillResults,
                ),
            ).to.be.fulfilled('');
        });

        it('calls `_dispatchTransferFrom()` to collect fees from the left order when left.feeRecipient == right.feeRecipient && left.takerFeeAssetData == right.takerFeeAssetData', async () => {
            const leftOrder = getOrder();
            const rightOrder = getOrder();
            const leftOrderHash = randomHash();
            const rightOrderHash = randomHash();
            const takerAddress = randomAddress();
            const matchedFillResults = {
                left: {
                    makerAssetFilledAmount: ONE_ETHER.times(2),
                    takerAssetFilledAmount: ONE_ETHER.times(10),
                    makerFeePaid: ONE_ETHER.times(0.01),
                    takerFeePaid: ONE_ETHER.times(0.025),
                    protocolFeePaid: constants.ZERO_AMOUNT,
                },
                right: {
                    takerAssetFilledAmount: ONE_ETHER.times(20),
                    makerAssetFilledAmount: ONE_ETHER.times(4),
                    makerFeePaid: ONE_ETHER.times(0.02),
                    takerFeePaid: ONE_ETHER.times(0.05),
                    protocolFeePaid: constants.ZERO_AMOUNT,
                },
                profitInLeftMakerAsset: ONE_ETHER,
                profitInRightMakerAsset: ONE_ETHER.times(2),
            };

            // Set the fee recipient addresses and the taker fee asset data fields to be the same
            rightOrder.feeRecipientAddress = leftOrder.feeRecipientAddress;
            rightOrder.takerFeeAssetData = leftOrder.takerFeeAssetData;

            // Call settleMatchOrders and collect the logs
            const receipt = await logDecoder.getTxWithDecodedLogsAsync(
                await testExchange.settleMatchOrders.sendTransactionAsync(
                    leftOrderHash,
                    rightOrderHash,
                    leftOrder,
                    rightOrder,
                    takerAddress,
                    matchedFillResults,
                ),
            );
            const logs = receipt.logs as Array<
                LogWithDecodedArgs<TestExchangeInternalsDispatchTransferFromCalledEventArgs>
            >;

            // Ensure that the logs have the correct lengths and names
            expect(logs.length).to.be.eq(7);
            expect(_.every(logs, log => log.event === 'DispatchTransferFromCalled')).to.be.true();

            // Right maker asset -> left maker
            expect(logs[0].args.orderHash).to.be.eq(rightOrderHash);
            expect(logs[0].args.assetData).to.be.eq(rightOrder.makerAssetData);
            expect(logs[0].args.from).to.be.eq(rightOrder.makerAddress);
            expect(logs[0].args.to).to.be.eq(leftOrder.makerAddress);
            expect(logs[0].args.amount).bignumber.to.be.eq(matchedFillResults.left.takerAssetFilledAmount);

            // Left maker asset -> right maker
            expect(logs[1].args.orderHash).to.be.eq(leftOrderHash);
            expect(logs[1].args.assetData).to.be.eq(leftOrder.makerAssetData);
            expect(logs[1].args.from).to.be.eq(leftOrder.makerAddress);
            expect(logs[1].args.to).to.be.eq(rightOrder.makerAddress);
            expect(logs[1].args.amount).bignumber.to.be.eq(matchedFillResults.right.takerAssetFilledAmount);

            // Right maker fee -> right fee recipient
            expect(logs[2].args.orderHash).to.be.eq(rightOrderHash);
            expect(logs[2].args.assetData).to.be.eq(rightOrder.makerFeeAssetData);
            expect(logs[2].args.from).to.be.eq(rightOrder.makerAddress);
            expect(logs[2].args.to).to.be.eq(rightOrder.feeRecipientAddress);
            expect(logs[2].args.amount).bignumber.to.be.eq(matchedFillResults.right.makerFeePaid);

            // Left maker fee -> left fee recipient
            expect(logs[3].args.orderHash).to.be.eq(leftOrderHash);
            expect(logs[3].args.assetData).to.be.eq(leftOrder.makerFeeAssetData);
            expect(logs[3].args.from).to.be.eq(leftOrder.makerAddress);
            expect(logs[3].args.to).to.be.eq(leftOrder.feeRecipientAddress);
            expect(logs[3].args.amount).bignumber.to.be.eq(matchedFillResults.left.makerFeePaid);

            // Left maker -> taker profit
            expect(logs[4].args.orderHash).to.be.eq(leftOrderHash);
            expect(logs[4].args.assetData).to.be.eq(leftOrder.makerAssetData);
            expect(logs[4].args.from).to.be.eq(leftOrder.makerAddress);
            expect(logs[4].args.to).to.be.eq(takerAddress);
            expect(logs[4].args.amount).bignumber.to.be.eq(matchedFillResults.profitInLeftMakerAsset);

            // right maker -> taker profit
            expect(logs[5].args.orderHash).to.be.eq(rightOrderHash);
            expect(logs[5].args.assetData).to.be.eq(rightOrder.makerAssetData);
            expect(logs[5].args.from).to.be.eq(rightOrder.makerAddress);
            expect(logs[5].args.to).to.be.eq(takerAddress);
            expect(logs[5].args.amount).bignumber.to.be.eq(matchedFillResults.profitInRightMakerAsset);

            // taker fees -> fee recipient
            expect(logs[6].args.orderHash).to.be.eq(leftOrderHash);
            expect(logs[6].args.assetData).to.be.eq(leftOrder.takerFeeAssetData);
            expect(logs[6].args.from).to.be.eq(takerAddress);
            expect(logs[6].args.to).to.be.eq(leftOrder.feeRecipientAddress);
            expect(logs[6].args.amount).bignumber.to.be.eq(ONE_ETHER.times(0.075));
        });

        it('calls `_dispatchTransferFrom()` from in the right order when the fee recipients and taker fee asset data are not the same', async () => {
            const leftOrder = getOrder();
            const rightOrder = getOrder();
            const leftOrderHash = randomHash();
            const rightOrderHash = randomHash();
            const takerAddress = randomAddress();
            const matchedFillResults = {
                left: {
                    makerAssetFilledAmount: ONE_ETHER.times(2),
                    takerAssetFilledAmount: ONE_ETHER.times(10),
                    makerFeePaid: ONE_ETHER.times(0.01),
                    takerFeePaid: ONE_ETHER.times(0.025),
                    protocolFeePaid: constants.ZERO_AMOUNT,
                },
                right: {
                    takerAssetFilledAmount: ONE_ETHER.times(20),
                    makerAssetFilledAmount: ONE_ETHER.times(4),
                    makerFeePaid: ONE_ETHER.times(0.02),
                    takerFeePaid: ONE_ETHER.times(0.05),
                    protocolFeePaid: constants.ZERO_AMOUNT,
                },
                profitInLeftMakerAsset: ONE_ETHER,
                profitInRightMakerAsset: ONE_ETHER.times(2),
            };

            // Call settleMatchOrders and collect the logs
            const receipt = await logDecoder.getTxWithDecodedLogsAsync(
                await testExchange.settleMatchOrders.sendTransactionAsync(
                    leftOrderHash,
                    rightOrderHash,
                    leftOrder,
                    rightOrder,
                    takerAddress,
                    matchedFillResults,
                ),
            );
            const logs = receipt.logs as Array<
                LogWithDecodedArgs<TestExchangeInternalsDispatchTransferFromCalledEventArgs>
            >;

            // Ensure that the logs have the correct lengths and names
            expect(logs.length).to.be.eq(8);
            expect(_.every(logs, log => log.event === 'DispatchTransferFromCalled')).to.be.true();

            // Right maker asset -> left maker
            expect(logs[0].args.orderHash).to.be.eq(rightOrderHash);
            expect(logs[0].args.assetData).to.be.eq(rightOrder.makerAssetData);
            expect(logs[0].args.from).to.be.eq(rightOrder.makerAddress);
            expect(logs[0].args.to).to.be.eq(leftOrder.makerAddress);
            expect(logs[0].args.amount).bignumber.to.be.eq(matchedFillResults.left.takerAssetFilledAmount);

            // Left maker asset -> right maker
            expect(logs[1].args.orderHash).to.be.eq(leftOrderHash);
            expect(logs[1].args.assetData).to.be.eq(leftOrder.makerAssetData);
            expect(logs[1].args.from).to.be.eq(leftOrder.makerAddress);
            expect(logs[1].args.to).to.be.eq(rightOrder.makerAddress);
            expect(logs[1].args.amount).bignumber.to.be.eq(matchedFillResults.right.takerAssetFilledAmount);

            // Right maker fee -> right fee recipient
            expect(logs[2].args.orderHash).to.be.eq(rightOrderHash);
            expect(logs[2].args.assetData).to.be.eq(rightOrder.makerFeeAssetData);
            expect(logs[2].args.from).to.be.eq(rightOrder.makerAddress);
            expect(logs[2].args.to).to.be.eq(rightOrder.feeRecipientAddress);
            expect(logs[2].args.amount).bignumber.to.be.eq(matchedFillResults.right.makerFeePaid);

            // Left maker fee -> left fee recipient
            expect(logs[3].args.orderHash).to.be.eq(leftOrderHash);
            expect(logs[3].args.assetData).to.be.eq(leftOrder.makerFeeAssetData);
            expect(logs[3].args.from).to.be.eq(leftOrder.makerAddress);
            expect(logs[3].args.to).to.be.eq(leftOrder.feeRecipientAddress);
            expect(logs[3].args.amount).bignumber.to.be.eq(matchedFillResults.left.makerFeePaid);

            // Left maker -> taker profit
            expect(logs[4].args.orderHash).to.be.eq(leftOrderHash);
            expect(logs[4].args.assetData).to.be.eq(leftOrder.makerAssetData);
            expect(logs[4].args.from).to.be.eq(leftOrder.makerAddress);
            expect(logs[4].args.to).to.be.eq(takerAddress);
            expect(logs[4].args.amount).bignumber.to.be.eq(matchedFillResults.profitInLeftMakerAsset);

            // right maker -> taker profit
            expect(logs[5].args.orderHash).to.be.eq(rightOrderHash);
            expect(logs[5].args.assetData).to.be.eq(rightOrder.makerAssetData);
            expect(logs[5].args.from).to.be.eq(rightOrder.makerAddress);
            expect(logs[5].args.to).to.be.eq(takerAddress);
            expect(logs[5].args.amount).bignumber.to.be.eq(matchedFillResults.profitInRightMakerAsset);

            // Right taker fee -> right fee recipient
            expect(logs[6].args.orderHash).to.be.eq(rightOrderHash);
            expect(logs[6].args.assetData).to.be.eq(rightOrder.takerFeeAssetData);
            expect(logs[6].args.from).to.be.eq(takerAddress);
            expect(logs[6].args.to).to.be.eq(rightOrder.feeRecipientAddress);
            expect(logs[6].args.amount).bignumber.to.be.eq(matchedFillResults.right.takerFeePaid);

            // Right taker fee -> right fee recipient
            expect(logs[7].args.orderHash).to.be.eq(leftOrderHash);
            expect(logs[7].args.assetData).to.be.eq(leftOrder.takerFeeAssetData);
            expect(logs[7].args.from).to.be.eq(takerAddress);
            expect(logs[7].args.to).to.be.eq(leftOrder.feeRecipientAddress);
            expect(logs[7].args.amount).bignumber.to.be.eq(matchedFillResults.left.takerFeePaid);
        });
    });
});
// tslint:disable-line:max-file-line-count
