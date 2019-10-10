import { DummyERC20TokenContract, WETH9Contract } from '@0x/contracts-erc20';
import {
    blockchainTests,
    constants,
    expect,
    OrderFactory,
    orderUtils,
    TokenBalances,
} from '@0x/contracts-test-utils';
import { assetDataUtils, ExchangeRevertErrors } from '@0x/order-utils';
import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { TransactionReceiptWithDecodedLogs } from 'ethereum-types';
import * as _ from 'lodash';

import { DydxDeploymentManager } from './utils/dydx_deployment_manager';
import { dydxMultiOrderData, dydxOrderData, PriceRatio } from './utils/dydx_utils';
import { ZeroExV3ExchangeWrapperContract, ZeroExV3MultiOrderExchangeWrapperContract } from '../src';

blockchainTests('dYdX <> 0x integration tests', env => {
    let owner: string;
    let solo: string;
    let untrustedSender: string;
    let maker: string;
    let feeRecipient: string;
    let tradeOriginator: string;
    let accounts: string[];

    let weth: WETH9Contract;
    let makerToken: DummyERC20TokenContract;
    let takerToken: DummyERC20TokenContract;
    let makerFeeToken: DummyERC20TokenContract;
    let takerFeeToken: DummyERC20TokenContract;

    let deploymentManager: DydxDeploymentManager;

    const MAX_GAS_PRICE = new BigNumber(30000000000);

    async function addBalanceAndAllowanceAsync(
        token: DummyERC20TokenContract | WETH9Contract,
        tokenOwner: string,
        tokenSpender: string,
    ): Promise<void> {
        if (token instanceof DummyERC20TokenContract) {
            await token.setBalance.awaitTransactionSuccessAsync(tokenOwner, constants.INITIAL_ERC20_BALANCE, {
                from: owner,
            });
        } else {
            await token.deposit.awaitTransactionSuccessAsync({
                from: tokenOwner,
                value: constants.ONE_ETHER,
            });
        }
        await token.approve.awaitTransactionSuccessAsync(tokenSpender, constants.INITIAL_ERC20_ALLOWANCE, {
            from: tokenOwner,
        });
    }

    async function configureExchangeWrapper(
        exchangeWrapper: ZeroExV3ExchangeWrapperContract | ZeroExV3MultiOrderExchangeWrapperContract,
    ): Promise<void> {
        await addBalanceAndAllowanceAsync(takerFeeToken, tradeOriginator, exchangeWrapper.address);
        await addBalanceAndAllowanceAsync(weth, untrustedSender, exchangeWrapper.address);

        // The exchange wrappers need a takerToken balance, but aren't EOAs
        await takerToken.setBalance.awaitTransactionSuccessAsync(owner, constants.INITIAL_ERC20_BALANCE, {
            from: owner,
        });
        await takerToken.transfer.awaitTransactionSuccessAsync(
            exchangeWrapper.address,
            constants.INITIAL_ERC20_BALANCE,
            { from: owner },
        );

        // The exchange wrappers also need a WETH balance
        await weth.deposit.awaitTransactionSuccessAsync({
            from: owner,
            value: constants.ONE_ETHER,
        });
        await weth.transfer.awaitTransactionSuccessAsync(exchangeWrapper.address, constants.ONE_ETHER, { from: owner });
    }

    before(async () => {
        [
            owner,
            solo,
            untrustedSender,
            maker,
            feeRecipient,
            tradeOriginator,
        ] = accounts = await env.getAccountAddressesAsync();

        deploymentManager = await DydxDeploymentManager.deployAsync(env, {
            owner,
            trustedMsgSenders: [solo],
        });

        [makerToken, takerToken, makerFeeToken, takerFeeToken] = deploymentManager.tokens.erc20;
        weth = deploymentManager.tokens.weth;

        await addBalanceAndAllowanceAsync(makerToken, maker, deploymentManager.assetProxies.erc20Proxy.address);
        await addBalanceAndAllowanceAsync(makerFeeToken, maker, deploymentManager.assetProxies.erc20Proxy.address);

        await configureExchangeWrapper(deploymentManager.dydx.exchangeWrapper);
        await configureExchangeWrapper(deploymentManager.dydx.multiOrderExchangeWrapper);
    });

    async function getBalancesAsync(): Promise<TokenBalances> {
        const addresses = [
            deploymentManager.dydx.exchangeWrapper.address,
            deploymentManager.dydx.multiOrderExchangeWrapper.address,
            deploymentManager.staking.stakingProxy.address,
            ...accounts,
        ];
        const tokens = [makerToken, takerToken, makerFeeToken, takerFeeToken, weth];
        const erc20Balances = _.zipObject(
            addresses,
            await Promise.all(
                addresses.map(async account =>
                    _.zipObject(
                        tokens.map(token => token.address),
                        await Promise.all(tokens.map(token => token.balanceOf.callAsync(account))),
                    ),
                ),
            ),
        );
        const ethBalances = _.zipObject(
            addresses,
            await Promise.all(addresses.map(address => env.web3Wrapper.getBalanceInWeiAsync(address))),
        );

        return {
            erc20: erc20Balances,
            erc721: {},
            erc1155: {},
            eth: ethBalances,
        };
    }

    function getExpectedBalances(
        exchangeWrapper: ZeroExV3ExchangeWrapperContract | ZeroExV3MultiOrderExchangeWrapperContract,
        initBalances: TokenBalances,
        orders: SignedOrder[],
        txReceipt: TransactionReceiptWithDecodedLogs,
        requestedFillAmount: BigNumber,
        gasPrice?: BigNumber,
    ): TokenBalances {
        gasPrice = new BigNumber(gasPrice || env.txDefaults.gasPrice || 0);
        const protocolFee = gasPrice.times(DydxDeploymentManager.protocolFeeMultiplier);

        const expectedBalances = _.cloneDeep(initBalances);
        expectedBalances.eth[txReceipt.from] = expectedBalances.eth[txReceipt.from].minus(
            gasPrice.times(txReceipt.gasUsed),
        );

        function _simulateFill(currentBalances: TokenBalances, order: SignedOrder): TokenBalances {
            if (requestedFillAmount.isEqualTo(0)) {
                return currentBalances;
            }

            const [makerAssetAmount, takerAssetAmount, makerFee, takerFee] = requestedFillAmount.isGreaterThanOrEqualTo(
                order.takerAssetAmount,
            )
                ? [order.makerAssetAmount, order.takerAssetAmount, order.makerFee, order.takerFee]
                : [order.makerAssetAmount, order.takerAssetAmount, order.makerFee, order.takerFee].map(value =>
                      value.times(requestedFillAmount).dividedToIntegerBy(order.takerAssetAmount),
                  );
            requestedFillAmount = requestedFillAmount.minus(takerAssetAmount);

            const { erc20: erc20Balances, eth: ethBalances } = currentBalances;
            erc20Balances[maker][makerToken.address] = erc20Balances[maker][makerToken.address].minus(makerAssetAmount);
            erc20Balances[exchangeWrapper.address][makerToken.address] = erc20Balances[exchangeWrapper.address][
                makerToken.address
            ].plus(makerAssetAmount);
            erc20Balances[maker][makerFeeToken.address] = erc20Balances[maker][makerFeeToken.address].minus(makerFee);
            erc20Balances[feeRecipient][makerFeeToken.address] = erc20Balances[feeRecipient][
                makerFeeToken.address
            ].plus(makerFee);

            erc20Balances[exchangeWrapper.address][takerToken.address] = erc20Balances[exchangeWrapper.address][
                takerToken.address
            ].minus(takerAssetAmount);
            erc20Balances[maker][takerToken.address] = erc20Balances[maker][takerToken.address].plus(takerAssetAmount);
            erc20Balances[tradeOriginator][takerFeeToken.address] = erc20Balances[tradeOriginator][
                takerFeeToken.address
            ].minus(takerFee);
            erc20Balances[feeRecipient][takerFeeToken.address] = erc20Balances[feeRecipient][
                takerFeeToken.address
            ].plus(takerFee);

            if (txReceipt.from === solo) {
                erc20Balances[exchangeWrapper.address][weth.address] = erc20Balances[exchangeWrapper.address][
                    weth.address
                ].minus(protocolFee);
            } else {
                erc20Balances[txReceipt.from][weth.address] = erc20Balances[txReceipt.from][weth.address].minus(
                    protocolFee,
                );
            }
            erc20Balances[deploymentManager.staking.stakingProxy.address][weth.address] = erc20Balances[
                deploymentManager.staking.stakingProxy.address
            ][weth.address].plus(protocolFee);

            return {
                erc20: erc20Balances,
                erc721: {},
                erc1155: {},
                eth: ethBalances,
            };
        }

        return orders.reduce((currentBalances, order) => _simulateFill(currentBalances, order), expectedBalances);
    }

    async function verifyBalancesAsync(expectedBalances: TokenBalances): Promise<void> {
        const { erc20: expectedErc20Balances, eth: expectedEthBalances } = expectedBalances;
        const { erc20: actualErc20Balances, eth: actualEthBalances } = await getBalancesAsync();
        const accountsByName = {
            owner,
            solo,
            untrustedSender,
            maker,
            feeRecipient,
            tradeOriginator,
            ZeroExV3ExchangeWrapper: deploymentManager.dydx.exchangeWrapper.address,
            ZeroExV3MultiOrderExchangeWrapper: deploymentManager.dydx.multiOrderExchangeWrapper.address,
            StakingProxy: deploymentManager.staking.stakingProxy.address,
        };
        const tokensByName = { makerToken, takerToken, makerFeeToken, takerFeeToken, weth };
        _.forIn(accountsByName, (accountAddress, ownerName) => {
            expect(actualEthBalances[accountAddress], `${ownerName} eth balance`).to.bignumber.equal(
                expectedEthBalances[accountAddress],
            );
            _.forIn(tokensByName, (token, tokenName) => {
                expect(
                    actualErc20Balances[accountAddress][token.address],
                    `${ownerName} ${tokenName} balance`,
                ).to.bignumber.equal(expectedErc20Balances[accountAddress][token.address]);
            });
        });
    }

    blockchainTests('ZeroExV3ExchangeWrapper', () => {
        let orderFactory: OrderFactory;

        before(async () => {
            // Configure order defaults
            const chainId = await env.getChainIdAsync();
            const defaultOrderParams = {
                ...constants.STATIC_ORDER_PARAMS,
                makerAddress: maker,
                feeRecipientAddress: feeRecipient,
                makerAssetData: assetDataUtils.encodeERC20AssetData(makerToken.address),
                takerAssetData: assetDataUtils.encodeERC20AssetData(takerToken.address),
                makerFeeAssetData: assetDataUtils.encodeERC20AssetData(makerFeeToken.address),
                takerFeeAssetData: assetDataUtils.encodeERC20AssetData(takerFeeToken.address),
                exchangeAddress: deploymentManager.exchange.address,
                chainId,
            };
            const makerPrivateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(maker)];
            orderFactory = new OrderFactory(makerPrivateKey, defaultOrderParams);
        });

        blockchainTests.resets('exchange', () => {
            let initialBalances: TokenBalances;

            before(async () => {
                initialBalances = await getBalancesAsync();
            });

            it('succeeds if solo provides an order with a non-zero taker fee', async () => {
                const order = await orderFactory.newSignedOrderAsync();
                const requestedFillAmount = order.takerAssetAmount.dividedToIntegerBy(2);
                const txReceipt = await deploymentManager.dydx.exchangeWrapper.exchange.awaitTransactionSuccessAsync(
                    tradeOriginator,
                    solo,
                    makerToken.address,
                    takerToken.address,
                    requestedFillAmount,
                    dydxOrderData(order),
                    { from: solo },
                );
                const expectedBalances = getExpectedBalances(
                    deploymentManager.dydx.exchangeWrapper,
                    initialBalances,
                    [order],
                    txReceipt,
                    requestedFillAmount,
                );
                await verifyBalancesAsync(expectedBalances);
            });
            it('succeeds if an untrusted sender provides an order without a taker fee', async () => {
                const order = await orderFactory.newSignedOrderAsync({
                    takerFee: constants.ZERO_AMOUNT,
                });
                const requestedFillAmount = order.takerAssetAmount.dividedToIntegerBy(2);
                const txReceipt = await deploymentManager.dydx.exchangeWrapper.exchange.awaitTransactionSuccessAsync(
                    tradeOriginator,
                    untrustedSender,
                    makerToken.address,
                    takerToken.address,
                    requestedFillAmount,
                    dydxOrderData(order),
                    { from: untrustedSender },
                );
                const expectedBalances = getExpectedBalances(
                    deploymentManager.dydx.exchangeWrapper,
                    initialBalances,
                    [order],
                    txReceipt,
                    requestedFillAmount,
                );
                await verifyBalancesAsync(expectedBalances);
            });
            it('reverts if an untrusted sender provides an order with a non-zero taker fee', async () => {
                const order = await orderFactory.newSignedOrderAsync();
                const tx = deploymentManager.dydx.exchangeWrapper.exchange.awaitTransactionSuccessAsync(
                    tradeOriginator,
                    untrustedSender,
                    makerToken.address,
                    takerToken.address,
                    order.takerAssetAmount.dividedToIntegerBy(2),
                    dydxOrderData(order),
                    { from: untrustedSender },
                );
                return expect(tx).to.revertWith(
                    'ZeroExV3ExchangeWrapper#transferTakerFee: Only trusted senders can dictate the fee payer',
                );
            });
            it('succeeds if called via solo with a gas price = MAX_GAS_PRICE', async () => {
                const order = await orderFactory.newSignedOrderAsync();
                const requestedFillAmount = order.takerAssetAmount.dividedToIntegerBy(2);
                const txReceipt = await deploymentManager.dydx.exchangeWrapper.exchange.awaitTransactionSuccessAsync(
                    tradeOriginator,
                    solo,
                    makerToken.address,
                    takerToken.address,
                    requestedFillAmount,
                    dydxOrderData(order),
                    { from: solo, gasPrice: MAX_GAS_PRICE },
                );
                const expectedBalances = getExpectedBalances(
                    deploymentManager.dydx.exchangeWrapper,
                    initialBalances,
                    [order],
                    txReceipt,
                    requestedFillAmount,
                    MAX_GAS_PRICE,
                );
                await verifyBalancesAsync(expectedBalances);
            });
            it('reverts if called via solo with a gas price > MAX_GAS_PRICE', async () => {
                const order = await orderFactory.newSignedOrderAsync();
                const requestedFillAmount = order.takerAssetAmount.dividedToIntegerBy(2);
                const tx = deploymentManager.dydx.exchangeWrapper.exchange.awaitTransactionSuccessAsync(
                    tradeOriginator,
                    solo,
                    makerToken.address,
                    takerToken.address,
                    requestedFillAmount,
                    dydxOrderData(order),
                    { from: solo, gasPrice: MAX_GAS_PRICE.plus(1) },
                );
                return expect(tx).to.revertWith(
                    'ZeroExV3ExchangeWrapper#validateProtocolFee: Maximum gas price exceeded',
                );
            });
            it('succeeds if requestedFillAmount = order.takerAssetAmount', async () => {
                const order = await orderFactory.newSignedOrderAsync();
                const txReceipt = await deploymentManager.dydx.exchangeWrapper.exchange.awaitTransactionSuccessAsync(
                    tradeOriginator,
                    solo,
                    makerToken.address,
                    takerToken.address,
                    order.takerAssetAmount,
                    dydxOrderData(order),
                    { from: solo },
                );
                const expectedBalances = getExpectedBalances(
                    deploymentManager.dydx.exchangeWrapper,
                    initialBalances,
                    [order],
                    txReceipt,
                    order.takerAssetAmount,
                );
                await verifyBalancesAsync(expectedBalances);
            });
            it('reverts if requestedFillAmount > order.takerAssetAmount', async () => {
                const order = await orderFactory.newSignedOrderAsync();
                const tx = deploymentManager.dydx.exchangeWrapper.exchange.awaitTransactionSuccessAsync(
                    tradeOriginator,
                    solo,
                    makerToken.address,
                    takerToken.address,
                    order.takerAssetAmount.plus(1),
                    dydxOrderData(order),
                    { from: solo },
                );
                return expect(tx).to.revertWith(
                    new ExchangeRevertErrors.IncompleteFillError(
                        ExchangeRevertErrors.IncompleteFillErrorCode.IncompleteFillOrder,
                        order.takerAssetAmount.plus(1),
                        order.takerAssetAmount,
                    ),
                );
            });
        });

        describe('getExchangeCost', () => {
            it('returns correct cost (no rounding)', async () => {
                const order = await orderFactory.newSignedOrderAsync({
                    takerAssetAmount: new BigNumber(2000),
                    makerAssetAmount: new BigNumber(3000),
                });
                const cost = await deploymentManager.dydx.exchangeWrapper.getExchangeCost.callAsync(
                    makerToken.address,
                    takerToken.address,
                    new BigNumber(6000),
                    dydxOrderData(order),
                );
                return expect(cost).to.bignumber.equal(4000);
            });
            it('returns correct cost (rounds up)', async () => {
                const order = await orderFactory.newSignedOrderAsync({
                    takerAssetAmount: new BigNumber(20001),
                    makerAssetAmount: new BigNumber(30000),
                });
                const cost = await deploymentManager.dydx.exchangeWrapper.getExchangeCost.callAsync(
                    makerToken.address,
                    takerToken.address,
                    new BigNumber(6000),
                    dydxOrderData(order),
                );
                return expect(cost).to.bignumber.equal(4001);
            });
        });

        describe('getMaxMakerAmount', () => {
            before(async () => {
                await addBalanceAndAllowanceAsync(takerToken, solo, deploymentManager.assetProxies.erc20Proxy.address);
                await addBalanceAndAllowanceAsync(
                    takerFeeToken,
                    solo,
                    deploymentManager.assetProxies.erc20Proxy.address,
                );
                await addBalanceAndAllowanceAsync(weth, solo, deploymentManager.staking.stakingProxy.address);
            });

            it('returns 0 if order is not fillable', async () => {
                const order = await orderFactory.newSignedOrderAsync();
                const cancelParams = orderUtils.createCancel(order);
                await deploymentManager.exchange.cancelOrder.awaitTransactionSuccessAsync(cancelParams.order, {
                    from: maker,
                });
                const maxMakerAmount = await deploymentManager.dydx.exchangeWrapper.getMaxMakerAmount.callAsync(
                    makerToken.address,
                    takerToken.address,
                    dydxOrderData(order),
                );
                return expect(maxMakerAmount).to.bignumber.equal(0);
            });
            it('returns correct maker amount (no rounding)', async () => {
                const order = await orderFactory.newSignedOrderAsync({
                    takerAssetAmount: new BigNumber(3000),
                    makerAssetAmount: new BigNumber(9000),
                });
                // Fill two-thirds of the order
                const fillParams = orderUtils.createFill(order, new BigNumber(2000));
                await deploymentManager.exchange.fillOrder.awaitTransactionSuccessAsync(
                    fillParams.order,
                    fillParams.takerAssetFillAmount,
                    fillParams.signature,
                    { from: solo },
                );
                const maxMakerAmount = await deploymentManager.dydx.exchangeWrapper.getMaxMakerAmount.callAsync(
                    makerToken.address,
                    takerToken.address,
                    dydxOrderData(order),
                );
                // Remaining maker amount should be one-third of 9000
                return expect(maxMakerAmount).to.bignumber.equal(3000);
            });
            it('returns correct maker amount (rounds down)', async () => {
                const order = await orderFactory.newSignedOrderAsync({
                    takerAssetAmount: new BigNumber(3000),
                    makerAssetAmount: new BigNumber(9001),
                });
                // Fill two-thirds of the order
                const fillParams = orderUtils.createFill(order, new BigNumber(2000));
                await deploymentManager.exchange.fillOrder.awaitTransactionSuccessAsync(
                    fillParams.order,
                    fillParams.takerAssetFillAmount,
                    fillParams.signature,
                    { from: solo },
                );
                const maxMakerAmount = await deploymentManager.dydx.exchangeWrapper.getMaxMakerAmount.callAsync(
                    makerToken.address,
                    takerToken.address,
                    dydxOrderData(order),
                );
                // Remaining maker amount should be one-third of 9000
                return expect(maxMakerAmount).to.bignumber.equal(3000);
            });
        });
    });

    blockchainTests.resets('ZeroExV3MultiOrderExchangeWrapper', () => {
        let orderFactory: OrderFactory;

        before(async () => {
            // Configure order defaults
            const chainId = await env.getChainIdAsync();
            const defaultOrderParams = {
                ...constants.STATIC_ORDER_PARAMS,
                makerAddress: maker,
                feeRecipientAddress: feeRecipient,
                makerFee: constants.ZERO_AMOUNT,
                takerFee: constants.ZERO_AMOUNT,
                makerAssetData: assetDataUtils.encodeERC20AssetData(makerToken.address),
                takerAssetData: assetDataUtils.encodeERC20AssetData(takerToken.address),
                makerFeeAssetData: constants.NULL_BYTES,
                takerFeeAssetData: constants.NULL_BYTES,
                exchangeAddress: deploymentManager.exchange.address,
                chainId,
            };
            const makerPrivateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(maker)];
            orderFactory = new OrderFactory(makerPrivateKey, defaultOrderParams);
        });

        describe('exchange', () => {
            let initialBalances: TokenBalances;
            let defaultOrders: SignedOrder[];
            let defaultOrderData: string;
            let defaultFillAmount: BigNumber;

            before(async () => {
                initialBalances = await getBalancesAsync();
                const order1 = await orderFactory.newSignedOrderAsync();
                const order2 = await orderFactory.newSignedOrderAsync({
                    makerAssetAmount: new BigNumber(3000000),
                    takerAssetAmount: new BigNumber(6000000),
                });
                const maxPrice = {
                    makerAmount: new BigNumber(1),
                    takerAmount: new BigNumber(2),
                };
                defaultOrders = [order1, order2];
                defaultOrderData = dydxMultiOrderData([order1, order2], maxPrice);
                defaultFillAmount = order1.takerAssetAmount.plus(order2.takerAssetAmount);
            });

            it('fully fills two orders via solo', async () => {
                const txReceipt = await deploymentManager.dydx.multiOrderExchangeWrapper.exchange.awaitTransactionSuccessAsync(
                    tradeOriginator,
                    solo,
                    makerToken.address,
                    takerToken.address,
                    defaultFillAmount,
                    defaultOrderData,
                    { from: solo },
                );
                const expectedBalances = getExpectedBalances(
                    deploymentManager.dydx.multiOrderExchangeWrapper,
                    initialBalances,
                    defaultOrders,
                    txReceipt,
                    defaultFillAmount,
                );
                await verifyBalancesAsync(expectedBalances);
            });
            it('partially fills two orders via solo', async () => {
                const fillAmount = defaultFillAmount.minus(1000000);
                const txReceipt = await deploymentManager.dydx.multiOrderExchangeWrapper.exchange.awaitTransactionSuccessAsync(
                    tradeOriginator,
                    solo,
                    makerToken.address,
                    takerToken.address,
                    fillAmount,
                    defaultOrderData,
                    { from: solo },
                );
                const expectedBalances = getExpectedBalances(
                    deploymentManager.dydx.multiOrderExchangeWrapper,
                    initialBalances,
                    defaultOrders,
                    txReceipt,
                    fillAmount,
                );
                await verifyBalancesAsync(expectedBalances);
            });
            it('fills two orders and transfers weth from untrusted sender', async () => {
                const txReceipt = await deploymentManager.dydx.multiOrderExchangeWrapper.exchange.awaitTransactionSuccessAsync(
                    tradeOriginator,
                    untrustedSender,
                    makerToken.address,
                    takerToken.address,
                    defaultFillAmount,
                    defaultOrderData,
                    { from: untrustedSender },
                );
                const expectedBalances = getExpectedBalances(
                    deploymentManager.dydx.multiOrderExchangeWrapper,
                    initialBalances,
                    defaultOrders,
                    txReceipt,
                    defaultFillAmount,
                );
                await verifyBalancesAsync(expectedBalances);
            });
            it('reverts if cannot fill full amount', async () => {
                const tx = deploymentManager.dydx.multiOrderExchangeWrapper.exchange.awaitTransactionSuccessAsync(
                    tradeOriginator,
                    solo,
                    makerToken.address,
                    takerToken.address,
                    defaultFillAmount.plus(1),
                    defaultOrderData,
                    { from: solo },
                );
                return expect(tx).to.revertWith(
                    'ZeroExV3MultiOrderExchangeWrapper#exchange: Cannot sell enough taker token',
                );
            });
            it('succeeds if called via solo with a gas price = MAX_GAS_PRICE', async () => {
                const txReceipt = await deploymentManager.dydx.multiOrderExchangeWrapper.exchange.awaitTransactionSuccessAsync(
                    tradeOriginator,
                    solo,
                    makerToken.address,
                    takerToken.address,
                    defaultFillAmount,
                    defaultOrderData,
                    { from: solo, gasPrice: MAX_GAS_PRICE },
                );
                const expectedBalances = getExpectedBalances(
                    deploymentManager.dydx.multiOrderExchangeWrapper,
                    initialBalances,
                    defaultOrders,
                    txReceipt,
                    defaultFillAmount,
                    MAX_GAS_PRICE,
                );
                await verifyBalancesAsync(expectedBalances);
            });
            it('reverts if called via solo with a gas price > MAX_GAS_PRICE', async () => {
                const tx = deploymentManager.dydx.multiOrderExchangeWrapper.exchange.awaitTransactionSuccessAsync(
                    tradeOriginator,
                    solo,
                    makerToken.address,
                    takerToken.address,
                    defaultFillAmount,
                    defaultOrderData,
                    { from: solo, gasPrice: MAX_GAS_PRICE.plus(1) },
                );
                return expect(tx).to.revertWith(
                    'ZeroExV3MultiOrderExchangeWrapper#validateProtocolFee: Maximum gas price exceeded',
                );
            });
            it('reverts if max price is violated', async () => {
                const maxPrice = {
                    makerAmount: new BigNumber(100000000000),
                    takerAmount: new BigNumber(199999999999),
                };
                const orderData = dydxMultiOrderData(defaultOrders, maxPrice);
                const tx = deploymentManager.dydx.multiOrderExchangeWrapper.exchange.awaitTransactionSuccessAsync(
                    tradeOriginator,
                    solo,
                    makerToken.address,
                    takerToken.address,
                    defaultFillAmount,
                    orderData,
                    { from: solo },
                );
                return expect(tx).to.revertWith(
                    'ZeroExV3MultiOrderExchangeWrapper#validateTradePrice: Price greater than maxPrice',
                );
            });
            it('reverts if takerAmountRatio overflows 128 bits', async () => {
                const maxPrice = {
                    makerAmount: constants.ZERO_AMOUNT,
                    takerAmount: new BigNumber(2).pow(128),
                };
                const orderData = dydxMultiOrderData(defaultOrders, maxPrice);
                const tx = deploymentManager.dydx.multiOrderExchangeWrapper.exchange.awaitTransactionSuccessAsync(
                    tradeOriginator,
                    solo,
                    makerToken.address,
                    takerToken.address,
                    defaultFillAmount,
                    orderData,
                    { from: solo },
                );
                return expect(tx).to.revertWith(
                    'ZeroExV3MultiOrderExchangeWrapper#parseMaxPriceRatio: takerAmountRatio > 128 bits',
                );
            });
            it('reverts if makerAmountRatio overflows 128 bits', async () => {
                const maxPrice = {
                    makerAmount: new BigNumber(2).pow(128),
                    takerAmount: constants.ZERO_AMOUNT,
                };
                const orderData = dydxMultiOrderData(defaultOrders, maxPrice);
                const tx = deploymentManager.dydx.multiOrderExchangeWrapper.exchange.awaitTransactionSuccessAsync(
                    tradeOriginator,
                    solo,
                    makerToken.address,
                    takerToken.address,
                    defaultFillAmount,
                    orderData,
                    { from: solo },
                );
                return expect(tx).to.revertWith(
                    'ZeroExV3MultiOrderExchangeWrapper#parseMaxPriceRatio: makerAmountRatio > 128 bits',
                );
            });
        });

        describe('getExchangeCost', () => {
            let defaultOrders: SignedOrder[];
            let defaultOrderData: string;
            let defaultMaxPrice: PriceRatio;

            before(async () => {
                const order1 = await orderFactory.newSignedOrderAsync({
                    makerAssetAmount: new BigNumber(10000),
                    takerAssetAmount: new BigNumber(12345),
                });
                const order2 = await orderFactory.newSignedOrderAsync({
                    makerAssetAmount: new BigNumber(10000),
                    takerAssetAmount: new BigNumber(13000),
                });
                defaultMaxPrice = {
                    makerAmount: new BigNumber(10),
                    takerAmount: new BigNumber(13),
                };
                defaultOrders = [order1, order2];
                defaultOrderData = dydxMultiOrderData([order1, order2], defaultMaxPrice);
            });

            it('returns correct cost', async () => {
                const cost = await deploymentManager.dydx.multiOrderExchangeWrapper.getExchangeCost.callAsync(
                    makerToken.address,
                    takerToken.address,
                    new BigNumber(15000),
                    defaultOrderData,
                );
                return expect(cost).to.bignumber.equal(18845); // 12345 + 13000 / 2
            });
            it('skips over unfillable orders', async () => {
                const cancelParams = orderUtils.createCancel(defaultOrders[0]);
                await deploymentManager.exchange.cancelOrder.awaitTransactionSuccessAsync(cancelParams.order, {
                    from: maker,
                });
                const cost = await deploymentManager.dydx.multiOrderExchangeWrapper.getExchangeCost.callAsync(
                    makerToken.address,
                    takerToken.address,
                    new BigNumber(10000),
                    defaultOrderData,
                );
                return expect(cost).to.bignumber.equal(13000);
            });
            it('reverts if the desired amount of maker token cannot be bought', async () => {
                const tx = deploymentManager.dydx.multiOrderExchangeWrapper.getExchangeCost.callAsync(
                    makerToken.address,
                    takerToken.address,
                    new BigNumber(20001),
                    defaultOrderData,
                );
                expect(tx).to.revertWith(
                    'ZeroExV3MultiOrderExchangeWrapper#getExchangeCostInternal: Cannot buy enough maker token',
                );
            });
            it('reverts if max price is violated', async () => {
                const maxPrice = {
                    makerAmount: new BigNumber(1),
                    takerAmount: new BigNumber(1),
                };
                const orderData = dydxMultiOrderData(defaultOrders, maxPrice);
                const tx = deploymentManager.dydx.multiOrderExchangeWrapper.getExchangeCost.callAsync(
                    makerToken.address,
                    takerToken.address,
                    new BigNumber(15000),
                    orderData,
                );
                expect(tx).to.revertWith(
                    'ZeroExV3MultiOrderExchangeWrapper#validateTradePrice: Price greater than maxPrice',
                );
            });
        });
    });
});
// tslint:disable:max-file-line-count
