import { DummyERC20TokenContract, WETH9Contract } from '@0x/contracts-erc20';
import {
    blockchainTests,
    constants,
    expect,
    OrderFactory,
    orderUtils,
    toHex,
    TokenBalances,
} from '@0x/contracts-test-utils';
import { assetDataUtils, ExchangeRevertErrors } from '@0x/order-utils';
import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { TransactionReceiptWithDecodedLogs } from 'ethereum-types';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import { DydxDeploymentManager } from './utils/dydx_deployment_manager';

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
    let orderFactory: OrderFactory;

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

        await addBalanceAndAllowanceAsync(
            takerFeeToken,
            tradeOriginator,
            deploymentManager.dydx.exchangeWrapper.address,
        );
        await addBalanceAndAllowanceAsync(makerToken, maker, deploymentManager.assetProxies.erc20Proxy.address);
        await addBalanceAndAllowanceAsync(makerFeeToken, maker, deploymentManager.assetProxies.erc20Proxy.address);
        await addBalanceAndAllowanceAsync(weth, untrustedSender, deploymentManager.dydx.exchangeWrapper.address);

        // The exchange wrapper needs a takerToken balance, but isn't an EOA
        await takerToken.setBalance.awaitTransactionSuccessAsync(owner, constants.INITIAL_ERC20_BALANCE, {
            from: owner,
        });
        await takerToken.transfer.awaitTransactionSuccessAsync(
            deploymentManager.dydx.exchangeWrapper.address,
            constants.INITIAL_ERC20_BALANCE,
            { from: owner },
        );

        // The exchange wrapper also needs a WETH balance
        await weth.deposit.awaitTransactionSuccessAsync({
            from: owner,
            value: constants.ONE_ETHER,
        });
        await weth.transfer.awaitTransactionSuccessAsync(
            deploymentManager.dydx.exchangeWrapper.address,
            constants.ONE_ETHER,
            { from: owner },
        );
    });

    describe('ZeroExV3ExchangeWrapper', () => {
        function dydxOrderData(order: SignedOrder): string {
            return '0x'.concat(
                Buffer.concat(
                    [
                        order.makerAddress,
                        order.takerAddress,
                        order.feeRecipientAddress,
                        order.senderAddress,
                        order.makerAssetAmount,
                        order.takerAssetAmount,
                        order.makerFee,
                        order.takerFee,
                        order.expirationTimeSeconds,
                        order.salt,
                        makerFeeToken.address,
                        takerFeeToken.address,
                    ].map(field => ethUtil.setLengthLeft(toHex(field), constants.WORD_LENGTH)),
                ).toString('hex'),
                order.signature.substr(2),
            );
        }

        async function getBalancesAsync(): Promise<TokenBalances> {
            const addresses = [
                deploymentManager.dydx.exchangeWrapper.address,
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
            initBalances: TokenBalances,
            order: SignedOrder,
            txReceipt: TransactionReceiptWithDecodedLogs,
            requestedFillAmount: BigNumber,
            gasPrice?: BigNumber,
        ): TokenBalances {
            gasPrice = new BigNumber(gasPrice || env.txDefaults.gasPrice || 0);
            const protocolFee = gasPrice.times(DydxDeploymentManager.protocolFeeMultiplier);
            const [makerAssetAmount, takerAssetAmount, makerFee, takerFee] = [
                order.makerAssetAmount,
                order.takerAssetAmount,
                order.makerFee,
                order.takerFee,
            ].map(value => value.times(requestedFillAmount).dividedToIntegerBy(order.takerAssetAmount));

            const { erc20: erc20Balances, eth: ethBalances } = _.cloneDeep(initBalances);
            ethBalances[txReceipt.from] = ethBalances[txReceipt.from].minus(gasPrice.times(txReceipt.gasUsed));

            erc20Balances[maker][makerToken.address] = erc20Balances[maker][makerToken.address].minus(makerAssetAmount);
            erc20Balances[deploymentManager.dydx.exchangeWrapper.address][makerToken.address] = erc20Balances[
                deploymentManager.dydx.exchangeWrapper.address
            ][makerToken.address].plus(makerAssetAmount);
            erc20Balances[maker][makerFeeToken.address] = erc20Balances[maker][makerFeeToken.address].minus(makerFee);
            erc20Balances[feeRecipient][makerFeeToken.address] = erc20Balances[feeRecipient][
                makerFeeToken.address
            ].plus(makerFee);

            erc20Balances[deploymentManager.dydx.exchangeWrapper.address][takerToken.address] = erc20Balances[
                deploymentManager.dydx.exchangeWrapper.address
            ][takerToken.address].minus(takerAssetAmount);
            erc20Balances[maker][takerToken.address] = erc20Balances[maker][takerToken.address].plus(takerAssetAmount);
            erc20Balances[tradeOriginator][takerFeeToken.address] = erc20Balances[tradeOriginator][
                takerFeeToken.address
            ].minus(takerFee);
            erc20Balances[feeRecipient][takerFeeToken.address] = erc20Balances[feeRecipient][
                takerFeeToken.address
            ].plus(takerFee);

            if (txReceipt.from === solo) {
                erc20Balances[deploymentManager.dydx.exchangeWrapper.address][weth.address] = erc20Balances[
                    deploymentManager.dydx.exchangeWrapper.address
                ][weth.address].minus(protocolFee);
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

        blockchainTests.resets('exchange', () => {
            const MAX_GAS_PRICE = new BigNumber(30000000000);
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
                const expectedBalances = getExpectedBalances(initialBalances, order, txReceipt, requestedFillAmount);
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
                const expectedBalances = getExpectedBalances(initialBalances, order, txReceipt, requestedFillAmount);
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
                    initialBalances,
                    order,
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
                    'ZeroExV3ExchangeWrapper#transferProtocolFee: Maximum gas price exceeded',
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
                const expectedBalances = getExpectedBalances(initialBalances, order, txReceipt, order.takerAssetAmount);
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

    describe('ZeroExV3MultiOrderExchangeWrapper', () => {});
});
