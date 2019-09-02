import { ERC20ProxyContract, ERC20Wrapper, ERC721ProxyContract, ERC721Wrapper } from '@0x/contracts-asset-proxy';
import { DummyERC20TokenContract } from '@0x/contracts-erc20';
import {
    blockchainTests,
    constants,
    describe,
    ERC20BalancesByOwner,
    expect,
    getLatestBlockTimestampAsync,
    OrderFactory,
} from '@0x/contracts-test-utils';
import { assetDataUtils, ExchangeRevertErrors, orderHashUtils } from '@0x/order-utils';
import { FillResults, OrderStatus, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as _ from 'lodash';

import { artifacts, ExchangeContract, ExchangeWrapper } from '../src';

// tslint:disable:no-unnecessary-type-assertion
blockchainTests.resets('Exchange wrappers', env => {
    let chainId: number;
    let makerAddress: string;
    let owner: string;
    let takerAddress: string;
    let feeRecipientAddress: string;

    let erc20TokenA: DummyERC20TokenContract;
    let erc20TokenB: DummyERC20TokenContract;
    let feeToken: DummyERC20TokenContract;
    let exchange: ExchangeContract;
    let erc20Proxy: ERC20ProxyContract;
    let erc721Proxy: ERC721ProxyContract;

    let exchangeWrapper: ExchangeWrapper;
    let erc20Wrapper: ERC20Wrapper;
    let erc721Wrapper: ERC721Wrapper;
    let erc20Balances: ERC20BalancesByOwner;
    let orderFactory: OrderFactory;

    let defaultMakerAssetAddress: string;
    let defaultTakerAssetAddress: string;
    let defaultFeeAssetAddress: string;

    const PROTOCOL_FEE_MULTIPLIER = new BigNumber(150);

    const nullFillResults: FillResults = {
        makerAssetFilledAmount: constants.ZERO_AMOUNT,
        takerAssetFilledAmount: constants.ZERO_AMOUNT,
        makerFeePaid: constants.ZERO_AMOUNT,
        takerFeePaid: constants.ZERO_AMOUNT,
        protocolFeePaid: constants.ZERO_AMOUNT,
    };

    before(async () => {
        chainId = await env.getChainIdAsync();
        const accounts = await env.getAccountAddressesAsync();
        const usedAddresses = ([owner, makerAddress, takerAddress, feeRecipientAddress] = _.slice(accounts, 0, 4));

        erc20Wrapper = new ERC20Wrapper(env.provider, usedAddresses, owner);
        erc721Wrapper = new ERC721Wrapper(env.provider, usedAddresses, owner);

        const numDummyErc20ToDeploy = 3;
        [erc20TokenA, erc20TokenB, feeToken] = await erc20Wrapper.deployDummyTokensAsync(
            numDummyErc20ToDeploy,
            constants.DUMMY_TOKEN_DECIMALS,
        );
        erc20Proxy = await erc20Wrapper.deployProxyAsync();
        await erc20Wrapper.setBalancesAndAllowancesAsync();

        erc721Proxy = await erc721Wrapper.deployProxyAsync();
        await erc721Wrapper.setBalancesAndAllowancesAsync();

        exchange = await ExchangeContract.deployFrom0xArtifactAsync(
            artifacts.Exchange,
            env.provider,
            { ...env.txDefaults, from: owner },
            {},
            new BigNumber(chainId),
        );

        // Set the protocol fee multiplier of the exchange
        await exchange.setProtocolFeeMultiplier.awaitTransactionSuccessAsync(PROTOCOL_FEE_MULTIPLIER, {
            from: owner,
        });

        exchangeWrapper = new ExchangeWrapper(exchange, env.provider);
        await exchangeWrapper.registerAssetProxyAsync(erc20Proxy.address, owner);
        await exchangeWrapper.registerAssetProxyAsync(erc721Proxy.address, owner);

        await erc20Proxy.addAuthorizedAddress.awaitTransactionSuccessAsync(exchange.address, {
            from: owner,
        });
        await erc721Proxy.addAuthorizedAddress.awaitTransactionSuccessAsync(exchange.address, {
            from: owner,
        });

        defaultMakerAssetAddress = erc20TokenA.address;
        defaultTakerAssetAddress = erc20TokenB.address;
        defaultFeeAssetAddress = feeToken.address;

        const defaultOrderParams = {
            ...constants.STATIC_ORDER_PARAMS,
            makerAddress,
            feeRecipientAddress,
            makerAssetData: assetDataUtils.encodeERC20AssetData(defaultMakerAssetAddress),
            takerAssetData: assetDataUtils.encodeERC20AssetData(defaultTakerAssetAddress),
            makerFeeAssetData: assetDataUtils.encodeERC20AssetData(defaultFeeAssetAddress),
            takerFeeAssetData: assetDataUtils.encodeERC20AssetData(defaultFeeAssetAddress),
            domain: {
                verifyingContractAddress: exchange.address,
                chainId,
            },
        };
        const privateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(makerAddress)];
        orderFactory = new OrderFactory(privateKey, defaultOrderParams);
    });

    beforeEach(async () => {
        erc20Balances = await erc20Wrapper.getBalancesAsync();
    });

    describe('fillOrKillOrder', () => {
        it('should transfer the correct amounts', async () => {
            const signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(200), 18),
            });
            const takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);

            const fillResults = await exchange.fillOrKillOrder.callAsync(
                signedOrder,
                takerAssetFillAmount,
                signedOrder.signature,
                { from: takerAddress },
            );
            await exchangeWrapper.fillOrKillOrderAsync(signedOrder, takerAddress, {
                takerAssetFillAmount,
            });
            const newBalances = await erc20Wrapper.getBalancesAsync();

            const makerAssetFilledAmount = takerAssetFillAmount
                .times(signedOrder.makerAssetAmount)
                .dividedToIntegerBy(signedOrder.takerAssetAmount);
            const makerFee = signedOrder.makerFee
                .times(makerAssetFilledAmount)
                .dividedToIntegerBy(signedOrder.makerAssetAmount);
            const takerFee = signedOrder.takerFee
                .times(makerAssetFilledAmount)
                .dividedToIntegerBy(signedOrder.makerAssetAmount);

            expect(fillResults.makerAssetFilledAmount).to.bignumber.equal(makerAssetFilledAmount);
            expect(fillResults.takerAssetFilledAmount).to.bignumber.equal(takerAssetFillAmount);
            expect(fillResults.makerFeePaid).to.bignumber.equal(makerFee);
            expect(fillResults.takerFeePaid).to.bignumber.equal(takerFee);

            expect(newBalances[makerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[makerAddress][defaultMakerAssetAddress].minus(makerAssetFilledAmount),
            );
            expect(newBalances[makerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[makerAddress][defaultTakerAssetAddress].plus(takerAssetFillAmount),
            );
            expect(newBalances[makerAddress][feeToken.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][feeToken.address].minus(makerFee),
            );
            expect(newBalances[takerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[takerAddress][defaultTakerAssetAddress].minus(takerAssetFillAmount),
            );
            expect(newBalances[takerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[takerAddress][defaultMakerAssetAddress].plus(makerAssetFilledAmount),
            );
            expect(newBalances[takerAddress][feeToken.address]).to.be.bignumber.equal(
                erc20Balances[takerAddress][feeToken.address].minus(takerFee),
            );
            expect(newBalances[feeRecipientAddress][feeToken.address]).to.be.bignumber.equal(
                erc20Balances[feeRecipientAddress][feeToken.address].plus(makerFee.plus(takerFee)),
            );
        });

        it('should revert if a signedOrder is expired', async () => {
            const currentTimestamp = await getLatestBlockTimestampAsync();
            const signedOrder = await orderFactory.newSignedOrderAsync({
                expirationTimeSeconds: new BigNumber(currentTimestamp).minus(10),
            });
            const orderHashHex = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedError = new ExchangeRevertErrors.OrderStatusError(orderHashHex, OrderStatus.Expired);
            const tx = exchangeWrapper.fillOrKillOrderAsync(signedOrder, takerAddress);
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert if entire takerAssetFillAmount not filled', async () => {
            const signedOrder = await orderFactory.newSignedOrderAsync();
            const takerAssetFillAmount = signedOrder.takerAssetAmount;

            await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, {
                takerAssetFillAmount: signedOrder.takerAssetAmount.dividedToIntegerBy(2),
            });

            const expectedError = new ExchangeRevertErrors.IncompleteFillError(
                ExchangeRevertErrors.IncompleteFillErrorCode.IncompleteFillOrder,
                takerAssetFillAmount,
                takerAssetFillAmount.dividedToIntegerBy(2),
            );
            const tx = exchangeWrapper.fillOrKillOrderAsync(signedOrder, takerAddress);
            return expect(tx).to.revertWith(expectedError);
        });
    });

    describe('batch functions', () => {
        let signedOrders: SignedOrder[];
        beforeEach(async () => {
            signedOrders = [
                await orderFactory.newSignedOrderAsync(),
                await orderFactory.newSignedOrderAsync(),
                await orderFactory.newSignedOrderAsync(),
            ];
        });

        describe('batchFillOrKillOrders', () => {
            it('should transfer the correct amounts', async () => {
                const makerAssetAddress = erc20TokenA.address;
                const takerAssetAddress = erc20TokenB.address;

                const takerAssetFillAmounts: BigNumber[] = [];
                const expectedFillResults: FillResults[] = [];

                _.forEach(signedOrders, signedOrder => {
                    const takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);
                    const makerAssetFilledAmount = takerAssetFillAmount
                        .times(signedOrder.makerAssetAmount)
                        .dividedToIntegerBy(signedOrder.takerAssetAmount);
                    const makerFee = signedOrder.makerFee
                        .times(makerAssetFilledAmount)
                        .dividedToIntegerBy(signedOrder.makerAssetAmount);
                    const takerFee = signedOrder.takerFee
                        .times(makerAssetFilledAmount)
                        .dividedToIntegerBy(signedOrder.makerAssetAmount);

                    takerAssetFillAmounts.push(takerAssetFillAmount);
                    expectedFillResults.push({
                        takerAssetFilledAmount: takerAssetFillAmount,
                        makerAssetFilledAmount,
                        makerFeePaid: makerFee,
                        takerFeePaid: takerFee,
                        protocolFeePaid: constants.ZERO_AMOUNT,
                    });

                    erc20Balances[makerAddress][makerAssetAddress] = erc20Balances[makerAddress][
                        makerAssetAddress
                    ].minus(makerAssetFilledAmount);
                    erc20Balances[makerAddress][takerAssetAddress] = erc20Balances[makerAddress][
                        takerAssetAddress
                    ].plus(takerAssetFillAmount);
                    erc20Balances[makerAddress][feeToken.address] = erc20Balances[makerAddress][feeToken.address].minus(
                        makerFee,
                    );
                    erc20Balances[takerAddress][makerAssetAddress] = erc20Balances[takerAddress][
                        makerAssetAddress
                    ].plus(makerAssetFilledAmount);
                    erc20Balances[takerAddress][takerAssetAddress] = erc20Balances[takerAddress][
                        takerAssetAddress
                    ].minus(takerAssetFillAmount);
                    erc20Balances[takerAddress][feeToken.address] = erc20Balances[takerAddress][feeToken.address].minus(
                        takerFee,
                    );
                    erc20Balances[feeRecipientAddress][feeToken.address] = erc20Balances[feeRecipientAddress][
                        feeToken.address
                    ].plus(makerFee.plus(takerFee));
                });

                const fillResults = await exchange.batchFillOrKillOrders.callAsync(
                    signedOrders,
                    takerAssetFillAmounts,
                    signedOrders.map(signedOrder => signedOrder.signature),
                    { from: takerAddress },
                );
                await exchangeWrapper.batchFillOrKillOrdersAsync(signedOrders, takerAddress, {
                    takerAssetFillAmounts,
                });
                const newBalances = await erc20Wrapper.getBalancesAsync();

                expect(fillResults).to.deep.equal(expectedFillResults);
                expect(newBalances).to.be.deep.equal(erc20Balances);
            });

            it('should revert if a single signedOrder does not fill the expected amount', async () => {
                const takerAssetFillAmounts: BigNumber[] = [];
                _.forEach(signedOrders, signedOrder => {
                    const takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);
                    takerAssetFillAmounts.push(takerAssetFillAmount);
                });

                await exchangeWrapper.fillOrKillOrderAsync(signedOrders[0], takerAddress);
                const orderHashHex = orderHashUtils.getOrderHashHex(signedOrders[0]);
                const expectedError = new ExchangeRevertErrors.OrderStatusError(orderHashHex, OrderStatus.FullyFilled);
                const tx = exchangeWrapper.batchFillOrKillOrdersAsync(signedOrders, takerAddress, {
                    takerAssetFillAmounts,
                });
                return expect(tx).to.revertWith(expectedError);
            });
        });

        describe('batchFillOrdersNoThrow', async () => {
            it('should transfer the correct amounts', async () => {
                const makerAssetAddress = erc20TokenA.address;
                const takerAssetAddress = erc20TokenB.address;

                const takerAssetFillAmounts: BigNumber[] = [];
                const expectedFillResults: FillResults[] = [];

                _.forEach(signedOrders, signedOrder => {
                    const takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);
                    const makerAssetFilledAmount = takerAssetFillAmount
                        .times(signedOrder.makerAssetAmount)
                        .dividedToIntegerBy(signedOrder.takerAssetAmount);
                    const makerFee = signedOrder.makerFee
                        .times(makerAssetFilledAmount)
                        .dividedToIntegerBy(signedOrder.makerAssetAmount);
                    const takerFee = signedOrder.takerFee
                        .times(makerAssetFilledAmount)
                        .dividedToIntegerBy(signedOrder.makerAssetAmount);

                    takerAssetFillAmounts.push(takerAssetFillAmount);
                    expectedFillResults.push({
                        takerAssetFilledAmount: takerAssetFillAmount,
                        makerAssetFilledAmount,
                        makerFeePaid: makerFee,
                        takerFeePaid: takerFee,
                        protocolFeePaid: constants.ZERO_AMOUNT,
                    });

                    erc20Balances[makerAddress][makerAssetAddress] = erc20Balances[makerAddress][
                        makerAssetAddress
                    ].minus(makerAssetFilledAmount);
                    erc20Balances[makerAddress][takerAssetAddress] = erc20Balances[makerAddress][
                        takerAssetAddress
                    ].plus(takerAssetFillAmount);
                    erc20Balances[makerAddress][feeToken.address] = erc20Balances[makerAddress][feeToken.address].minus(
                        makerFee,
                    );
                    erc20Balances[takerAddress][makerAssetAddress] = erc20Balances[takerAddress][
                        makerAssetAddress
                    ].plus(makerAssetFilledAmount);
                    erc20Balances[takerAddress][takerAssetAddress] = erc20Balances[takerAddress][
                        takerAssetAddress
                    ].minus(takerAssetFillAmount);
                    erc20Balances[takerAddress][feeToken.address] = erc20Balances[takerAddress][feeToken.address].minus(
                        takerFee,
                    );
                    erc20Balances[feeRecipientAddress][feeToken.address] = erc20Balances[feeRecipientAddress][
                        feeToken.address
                    ].plus(makerFee.plus(takerFee));
                });

                const fillResults = await exchange.batchFillOrdersNoThrow.callAsync(
                    signedOrders,
                    takerAssetFillAmounts,
                    signedOrders.map(signedOrder => signedOrder.signature),
                    { from: takerAddress },
                );
                await exchangeWrapper.batchFillOrdersNoThrowAsync(signedOrders, takerAddress, {
                    takerAssetFillAmounts,
                });
                const newBalances = await erc20Wrapper.getBalancesAsync();

                expect(fillResults).to.deep.equal(expectedFillResults);
                expect(newBalances).to.be.deep.equal(erc20Balances);
            });

            it('should not revert if an order is invalid and fill the remaining orders', async () => {
                const makerAssetAddress = erc20TokenA.address;
                const takerAssetAddress = erc20TokenB.address;

                const invalidOrder = {
                    ...signedOrders[0],
                    signature: '0x00',
                };
                const validOrders = signedOrders.slice(1);
                const takerAssetFillAmounts: BigNumber[] = [invalidOrder.takerAssetAmount.div(2)];
                const expectedFillResults = [nullFillResults];

                _.forEach(validOrders, signedOrder => {
                    const takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);
                    const makerAssetFilledAmount = takerAssetFillAmount
                        .times(signedOrder.makerAssetAmount)
                        .dividedToIntegerBy(signedOrder.takerAssetAmount);
                    const makerFee = signedOrder.makerFee
                        .times(makerAssetFilledAmount)
                        .dividedToIntegerBy(signedOrder.makerAssetAmount);
                    const takerFee = signedOrder.takerFee
                        .times(makerAssetFilledAmount)
                        .dividedToIntegerBy(signedOrder.makerAssetAmount);

                    takerAssetFillAmounts.push(takerAssetFillAmount);
                    expectedFillResults.push({
                        takerAssetFilledAmount: takerAssetFillAmount,
                        makerAssetFilledAmount,
                        makerFeePaid: makerFee,
                        takerFeePaid: takerFee,
                        protocolFeePaid: constants.ZERO_AMOUNT,
                    });

                    erc20Balances[makerAddress][makerAssetAddress] = erc20Balances[makerAddress][
                        makerAssetAddress
                    ].minus(makerAssetFilledAmount);
                    erc20Balances[makerAddress][takerAssetAddress] = erc20Balances[makerAddress][
                        takerAssetAddress
                    ].plus(takerAssetFillAmount);
                    erc20Balances[makerAddress][feeToken.address] = erc20Balances[makerAddress][feeToken.address].minus(
                        makerFee,
                    );
                    erc20Balances[takerAddress][makerAssetAddress] = erc20Balances[takerAddress][
                        makerAssetAddress
                    ].plus(makerAssetFilledAmount);
                    erc20Balances[takerAddress][takerAssetAddress] = erc20Balances[takerAddress][
                        takerAssetAddress
                    ].minus(takerAssetFillAmount);
                    erc20Balances[takerAddress][feeToken.address] = erc20Balances[takerAddress][feeToken.address].minus(
                        takerFee,
                    );
                    erc20Balances[feeRecipientAddress][feeToken.address] = erc20Balances[feeRecipientAddress][
                        feeToken.address
                    ].plus(makerFee.plus(takerFee));
                });

                const newOrders = [invalidOrder, ...validOrders];
                const fillResults = await exchange.batchFillOrdersNoThrow.callAsync(
                    newOrders,
                    takerAssetFillAmounts,
                    newOrders.map(signedOrder => signedOrder.signature),
                    { from: takerAddress },
                );
                await exchangeWrapper.batchFillOrdersNoThrowAsync(newOrders, takerAddress, {
                    takerAssetFillAmounts,
                });
                const newBalances = await erc20Wrapper.getBalancesAsync();

                expect(fillResults).to.deep.equal(expectedFillResults);
                expect(newBalances).to.be.deep.equal(erc20Balances);
            });
        });

        describe('marketSellOrdersNoThrow', () => {
            it('should stop when the entire takerAssetFillAmount is filled', async () => {
                const takerAssetFillAmount = signedOrders[0].takerAssetAmount.plus(
                    signedOrders[1].takerAssetAmount.div(2),
                );

                const fillResults = await exchange.marketSellOrdersNoThrow.callAsync(
                    signedOrders,
                    takerAssetFillAmount,
                    signedOrders.map(signedOrder => signedOrder.signature),
                    { from: takerAddress },
                );
                await exchangeWrapper.marketSellOrdersNoThrowAsync(signedOrders, takerAddress, {
                    takerAssetFillAmount,
                });
                const newBalances = await erc20Wrapper.getBalancesAsync();

                const makerAssetFilledAmount = signedOrders[0].makerAssetAmount.plus(
                    signedOrders[1].makerAssetAmount.dividedToIntegerBy(2),
                );
                const makerFee = signedOrders[0].makerFee.plus(signedOrders[1].makerFee.dividedToIntegerBy(2));
                const takerFee = signedOrders[0].takerFee.plus(signedOrders[1].takerFee.dividedToIntegerBy(2));

                expect(fillResults.makerAssetFilledAmount).to.bignumber.equal(makerAssetFilledAmount);
                expect(fillResults.takerAssetFilledAmount).to.bignumber.equal(takerAssetFillAmount);
                expect(fillResults.makerFeePaid).to.bignumber.equal(makerFee);
                expect(fillResults.takerFeePaid).to.bignumber.equal(takerFee);

                expect(newBalances[makerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                    erc20Balances[makerAddress][defaultMakerAssetAddress].minus(makerAssetFilledAmount),
                );
                expect(newBalances[makerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                    erc20Balances[makerAddress][defaultTakerAssetAddress].plus(takerAssetFillAmount),
                );
                expect(newBalances[makerAddress][feeToken.address]).to.be.bignumber.equal(
                    erc20Balances[makerAddress][feeToken.address].minus(makerFee),
                );
                expect(newBalances[takerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                    erc20Balances[takerAddress][defaultTakerAssetAddress].minus(takerAssetFillAmount),
                );
                expect(newBalances[takerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                    erc20Balances[takerAddress][defaultMakerAssetAddress].plus(makerAssetFilledAmount),
                );
                expect(newBalances[takerAddress][feeToken.address]).to.be.bignumber.equal(
                    erc20Balances[takerAddress][feeToken.address].minus(takerFee),
                );
                expect(newBalances[feeRecipientAddress][feeToken.address]).to.be.bignumber.equal(
                    erc20Balances[feeRecipientAddress][feeToken.address].plus(makerFee.plus(takerFee)),
                );
            });

            it('should fill all signedOrders if cannot fill entire takerAssetFillAmount', async () => {
                const takerAssetFillAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(100000), 18);
                _.forEach(signedOrders, signedOrder => {
                    erc20Balances[makerAddress][defaultMakerAssetAddress] = erc20Balances[makerAddress][
                        defaultMakerAssetAddress
                    ].minus(signedOrder.makerAssetAmount);
                    erc20Balances[makerAddress][defaultTakerAssetAddress] = erc20Balances[makerAddress][
                        defaultTakerAssetAddress
                    ].plus(signedOrder.takerAssetAmount);
                    erc20Balances[makerAddress][feeToken.address] = erc20Balances[makerAddress][feeToken.address].minus(
                        signedOrder.makerFee,
                    );
                    erc20Balances[takerAddress][defaultMakerAssetAddress] = erc20Balances[takerAddress][
                        defaultMakerAssetAddress
                    ].plus(signedOrder.makerAssetAmount);
                    erc20Balances[takerAddress][defaultTakerAssetAddress] = erc20Balances[takerAddress][
                        defaultTakerAssetAddress
                    ].minus(signedOrder.takerAssetAmount);
                    erc20Balances[takerAddress][feeToken.address] = erc20Balances[takerAddress][feeToken.address].minus(
                        signedOrder.takerFee,
                    );
                    erc20Balances[feeRecipientAddress][feeToken.address] = erc20Balances[feeRecipientAddress][
                        feeToken.address
                    ].plus(signedOrder.makerFee.plus(signedOrder.takerFee));
                });

                const fillResults = await exchange.marketSellOrdersNoThrow.callAsync(
                    signedOrders,
                    takerAssetFillAmount,
                    signedOrders.map(signedOrder => signedOrder.signature),
                    { from: takerAddress },
                );
                await exchangeWrapper.marketSellOrdersNoThrowAsync(signedOrders, takerAddress, {
                    takerAssetFillAmount,
                });
                const newBalances = await erc20Wrapper.getBalancesAsync();

                const expectedFillResults = signedOrders
                    .map(signedOrder => ({
                        makerAssetFilledAmount: signedOrder.makerAssetAmount,
                        takerAssetFilledAmount: signedOrder.takerAssetAmount,
                        makerFeePaid: signedOrder.makerFee,
                        takerFeePaid: signedOrder.takerFee,
                        protocolFeePaid: constants.ZERO_AMOUNT,
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
                expect(newBalances).to.be.deep.equal(erc20Balances);
            });

            it('should not fill a signedOrder that does not use the same takerAssetAddress', async () => {
                signedOrders = [
                    await orderFactory.newSignedOrderAsync(),
                    await orderFactory.newSignedOrderAsync(),
                    await orderFactory.newSignedOrderAsync({
                        takerAssetData: assetDataUtils.encodeERC20AssetData(feeToken.address),
                    }),
                ];
                const takerAssetFillAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(100000), 18);
                const filledSignedOrders = signedOrders.slice(0, -1);
                _.forEach(filledSignedOrders, signedOrder => {
                    erc20Balances[makerAddress][defaultMakerAssetAddress] = erc20Balances[makerAddress][
                        defaultMakerAssetAddress
                    ].minus(signedOrder.makerAssetAmount);
                    erc20Balances[makerAddress][defaultTakerAssetAddress] = erc20Balances[makerAddress][
                        defaultTakerAssetAddress
                    ].plus(signedOrder.takerAssetAmount);
                    erc20Balances[makerAddress][feeToken.address] = erc20Balances[makerAddress][feeToken.address].minus(
                        signedOrder.makerFee,
                    );
                    erc20Balances[takerAddress][defaultMakerAssetAddress] = erc20Balances[takerAddress][
                        defaultMakerAssetAddress
                    ].plus(signedOrder.makerAssetAmount);
                    erc20Balances[takerAddress][defaultTakerAssetAddress] = erc20Balances[takerAddress][
                        defaultTakerAssetAddress
                    ].minus(signedOrder.takerAssetAmount);
                    erc20Balances[takerAddress][feeToken.address] = erc20Balances[takerAddress][feeToken.address].minus(
                        signedOrder.takerFee,
                    );
                    erc20Balances[feeRecipientAddress][feeToken.address] = erc20Balances[feeRecipientAddress][
                        feeToken.address
                    ].plus(signedOrder.makerFee.plus(signedOrder.takerFee));
                });

                const fillResults = await exchange.marketSellOrdersNoThrow.callAsync(
                    signedOrders,
                    takerAssetFillAmount,
                    signedOrders.map(signedOrder => signedOrder.signature),
                    { from: takerAddress },
                );
                await exchangeWrapper.marketSellOrdersNoThrowAsync(signedOrders, takerAddress, {
                    takerAssetFillAmount,
                });
                const newBalances = await erc20Wrapper.getBalancesAsync();

                const expectedFillResults = filledSignedOrders
                    .map(signedOrder => ({
                        makerAssetFilledAmount: signedOrder.makerAssetAmount,
                        takerAssetFilledAmount: signedOrder.takerAssetAmount,
                        makerFeePaid: signedOrder.makerFee,
                        takerFeePaid: signedOrder.takerFee,
                        protocolFeePaid: constants.ZERO_AMOUNT,
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
                expect(newBalances).to.be.deep.equal(erc20Balances);
            });
        });

        describe('marketBuyOrdersNoThrow', () => {
            it('should stop when the entire makerAssetFillAmount is filled', async () => {
                const makerAssetFillAmount = signedOrders[0].makerAssetAmount.plus(
                    signedOrders[1].makerAssetAmount.div(2),
                );

                const fillResults = await exchange.marketBuyOrdersNoThrow.callAsync(
                    signedOrders,
                    makerAssetFillAmount,
                    signedOrders.map(signedOrder => signedOrder.signature),
                    { from: takerAddress },
                );
                await exchangeWrapper.marketBuyOrdersNoThrowAsync(signedOrders, takerAddress, {
                    makerAssetFillAmount,
                });
                const newBalances = await erc20Wrapper.getBalancesAsync();

                const makerAmountBought = signedOrders[0].takerAssetAmount.plus(
                    signedOrders[1].takerAssetAmount.dividedToIntegerBy(2),
                );
                const makerFee = signedOrders[0].makerFee.plus(signedOrders[1].makerFee.dividedToIntegerBy(2));
                const takerFee = signedOrders[0].takerFee.plus(signedOrders[1].takerFee.dividedToIntegerBy(2));

                expect(fillResults.makerAssetFilledAmount).to.bignumber.equal(makerAssetFillAmount);
                expect(fillResults.takerAssetFilledAmount).to.bignumber.equal(makerAmountBought);
                expect(fillResults.makerFeePaid).to.bignumber.equal(makerFee);
                expect(fillResults.takerFeePaid).to.bignumber.equal(takerFee);

                expect(newBalances[makerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                    erc20Balances[makerAddress][defaultMakerAssetAddress].minus(makerAssetFillAmount),
                );
                expect(newBalances[makerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                    erc20Balances[makerAddress][defaultTakerAssetAddress].plus(makerAmountBought),
                );
                expect(newBalances[makerAddress][feeToken.address]).to.be.bignumber.equal(
                    erc20Balances[makerAddress][feeToken.address].minus(makerFee),
                );
                expect(newBalances[takerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                    erc20Balances[takerAddress][defaultTakerAssetAddress].minus(makerAmountBought),
                );
                expect(newBalances[takerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                    erc20Balances[takerAddress][defaultMakerAssetAddress].plus(makerAssetFillAmount),
                );
                expect(newBalances[takerAddress][feeToken.address]).to.be.bignumber.equal(
                    erc20Balances[takerAddress][feeToken.address].minus(takerFee),
                );
                expect(newBalances[feeRecipientAddress][feeToken.address]).to.be.bignumber.equal(
                    erc20Balances[feeRecipientAddress][feeToken.address].plus(makerFee.plus(takerFee)),
                );
            });

            it('should fill all signedOrders if cannot fill entire makerAssetFillAmount', async () => {
                const makerAssetFillAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(100000), 18);
                _.forEach(signedOrders, signedOrder => {
                    erc20Balances[makerAddress][defaultMakerAssetAddress] = erc20Balances[makerAddress][
                        defaultMakerAssetAddress
                    ].minus(signedOrder.makerAssetAmount);
                    erc20Balances[makerAddress][defaultTakerAssetAddress] = erc20Balances[makerAddress][
                        defaultTakerAssetAddress
                    ].plus(signedOrder.takerAssetAmount);
                    erc20Balances[makerAddress][feeToken.address] = erc20Balances[makerAddress][feeToken.address].minus(
                        signedOrder.makerFee,
                    );
                    erc20Balances[takerAddress][defaultMakerAssetAddress] = erc20Balances[takerAddress][
                        defaultMakerAssetAddress
                    ].plus(signedOrder.makerAssetAmount);
                    erc20Balances[takerAddress][defaultTakerAssetAddress] = erc20Balances[takerAddress][
                        defaultTakerAssetAddress
                    ].minus(signedOrder.takerAssetAmount);
                    erc20Balances[takerAddress][feeToken.address] = erc20Balances[takerAddress][feeToken.address].minus(
                        signedOrder.takerFee,
                    );
                    erc20Balances[feeRecipientAddress][feeToken.address] = erc20Balances[feeRecipientAddress][
                        feeToken.address
                    ].plus(signedOrder.makerFee.plus(signedOrder.takerFee));
                });

                const fillResults = await exchange.marketBuyOrdersNoThrow.callAsync(
                    signedOrders,
                    makerAssetFillAmount,
                    signedOrders.map(signedOrder => signedOrder.signature),
                    { from: takerAddress },
                );
                await exchangeWrapper.marketBuyOrdersNoThrowAsync(signedOrders, takerAddress, {
                    makerAssetFillAmount,
                });
                const newBalances = await erc20Wrapper.getBalancesAsync();

                const expectedFillResults = signedOrders
                    .map(signedOrder => ({
                        makerAssetFilledAmount: signedOrder.makerAssetAmount,
                        takerAssetFilledAmount: signedOrder.takerAssetAmount,
                        makerFeePaid: signedOrder.makerFee,
                        takerFeePaid: signedOrder.takerFee,
                        protocolFeePaid: constants.ZERO_AMOUNT,
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
                expect(newBalances).to.be.deep.equal(erc20Balances);
            });

            it('should not fill a signedOrder that does not use the same makerAssetAddress', async () => {
                signedOrders = [
                    await orderFactory.newSignedOrderAsync(),
                    await orderFactory.newSignedOrderAsync(),
                    await orderFactory.newSignedOrderAsync({
                        makerAssetData: assetDataUtils.encodeERC20AssetData(feeToken.address),
                    }),
                ];

                const makerAssetFillAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(100000), 18);
                const filledSignedOrders = signedOrders.slice(0, -1);
                _.forEach(filledSignedOrders, signedOrder => {
                    erc20Balances[makerAddress][defaultMakerAssetAddress] = erc20Balances[makerAddress][
                        defaultMakerAssetAddress
                    ].minus(signedOrder.makerAssetAmount);
                    erc20Balances[makerAddress][defaultTakerAssetAddress] = erc20Balances[makerAddress][
                        defaultTakerAssetAddress
                    ].plus(signedOrder.takerAssetAmount);
                    erc20Balances[makerAddress][feeToken.address] = erc20Balances[makerAddress][feeToken.address].minus(
                        signedOrder.makerFee,
                    );
                    erc20Balances[takerAddress][defaultMakerAssetAddress] = erc20Balances[takerAddress][
                        defaultMakerAssetAddress
                    ].plus(signedOrder.makerAssetAmount);
                    erc20Balances[takerAddress][defaultTakerAssetAddress] = erc20Balances[takerAddress][
                        defaultTakerAssetAddress
                    ].minus(signedOrder.takerAssetAmount);
                    erc20Balances[takerAddress][feeToken.address] = erc20Balances[takerAddress][feeToken.address].minus(
                        signedOrder.takerFee,
                    );
                    erc20Balances[feeRecipientAddress][feeToken.address] = erc20Balances[feeRecipientAddress][
                        feeToken.address
                    ].plus(signedOrder.makerFee.plus(signedOrder.takerFee));
                });

                const fillResults = await exchange.marketBuyOrdersNoThrow.callAsync(
                    signedOrders,
                    makerAssetFillAmount,
                    signedOrders.map(signedOrder => signedOrder.signature),
                    { from: takerAddress },
                );
                await exchangeWrapper.marketBuyOrdersNoThrowAsync(signedOrders, takerAddress, {
                    makerAssetFillAmount,
                });
                const newBalances = await erc20Wrapper.getBalancesAsync();

                const expectedFillResults = filledSignedOrders
                    .map(signedOrder => ({
                        makerAssetFilledAmount: signedOrder.makerAssetAmount,
                        takerAssetFilledAmount: signedOrder.takerAssetAmount,
                        makerFeePaid: signedOrder.makerFee,
                        takerFeePaid: signedOrder.takerFee,
                        protocolFeePaid: constants.ZERO_AMOUNT,
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
                expect(newBalances).to.be.deep.equal(erc20Balances);
            });
        });

        describe('batchCancelOrders', () => {
            it('should be able to cancel multiple signedOrders', async () => {
                const takerAssetCancelAmounts = _.map(signedOrders, signedOrder => signedOrder.takerAssetAmount);
                await exchangeWrapper.batchCancelOrdersAsync(signedOrders, makerAddress);

                await exchangeWrapper.batchFillOrdersNoThrowAsync(signedOrders, takerAddress, {
                    takerAssetFillAmounts: takerAssetCancelAmounts,
                });
                const newBalances = await erc20Wrapper.getBalancesAsync();
                expect(erc20Balances).to.be.deep.equal(newBalances);
            });
            it('should not revert if a single cancel noops', async () => {
                await exchangeWrapper.cancelOrderAsync(signedOrders[1], makerAddress);
                const expectedOrderHashes = [signedOrders[0], ...signedOrders.slice(2)].map(order =>
                    orderHashUtils.getOrderHashHex(order),
                );
                const tx = await exchangeWrapper.batchCancelOrdersAsync(signedOrders, makerAddress);
                expect(tx.logs.length).to.equal(signedOrders.length - 1);
                tx.logs.forEach((log, index) => {
                    expect((log as any).args.orderHash).to.equal(expectedOrderHashes[index]);
                });
            });
        });
    });
}); // tslint:disable-line:max-file-line-count
