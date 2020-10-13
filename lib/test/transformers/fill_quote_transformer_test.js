"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const contracts_test_utils_1 = require("@0x/contracts-test-utils");
const order_utils_1 = require("@0x/order-utils");
const utils_1 = require("@0x/utils");
const _ = require("lodash");
const artifacts_1 = require("../artifacts");
const test_fill_quote_transformer_bridge_1 = require("../generated-wrappers/test_fill_quote_transformer_bridge");
const wrappers_1 = require("../wrappers");
const { NULL_ADDRESS, NULL_BYTES, MAX_UINT256, ZERO_AMOUNT } = contracts_test_utils_1.constants;
contracts_test_utils_1.blockchainTests.resets('FillQuoteTransformer', env => {
    let maker;
    let feeRecipient;
    let sender;
    let taker;
    let exchange;
    let bridge;
    let transformer;
    let host;
    let makerToken;
    let takerToken;
    let takerFeeToken;
    let singleProtocolFee;
    const GAS_PRICE = 1337;
    before(() => __awaiter(this, void 0, void 0, function* () {
        [maker, feeRecipient, sender, taker] = yield env.getAccountAddressesAsync();
        exchange = yield wrappers_1.TestFillQuoteTransformerExchangeContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.TestFillQuoteTransformerExchange, env.provider, env.txDefaults, artifacts_1.artifacts);
        const bridgeAdapter = yield wrappers_1.BridgeAdapterContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.BridgeAdapter, env.provider, env.txDefaults, artifacts_1.artifacts, {
            balancerBridge: NULL_ADDRESS,
            curveBridge: NULL_ADDRESS,
            kyberBridge: NULL_ADDRESS,
            mooniswapBridge: NULL_ADDRESS,
            mStableBridge: NULL_ADDRESS,
            oasisBridge: NULL_ADDRESS,
            uniswapBridge: NULL_ADDRESS,
            uniswapV2Bridge: NULL_ADDRESS,
            kyberNetworkProxy: NULL_ADDRESS,
            oasis: NULL_ADDRESS,
            uniswapV2Router: NULL_ADDRESS,
            uniswapExchangeFactory: NULL_ADDRESS,
            mStable: NULL_ADDRESS,
            weth: NULL_ADDRESS,
            shellBridge: NULL_ADDRESS,
            shell: NULL_ADDRESS,
        });
        transformer = yield wrappers_1.FillQuoteTransformerContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.FillQuoteTransformer, env.provider, env.txDefaults, artifacts_1.artifacts, exchange.address, bridgeAdapter.address);
        host = yield wrappers_1.TestFillQuoteTransformerHostContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.TestFillQuoteTransformerHost, env.provider, Object.assign({}, env.txDefaults, { gasPrice: GAS_PRICE }), artifacts_1.artifacts);
        bridge = yield test_fill_quote_transformer_bridge_1.TestFillQuoteTransformerBridgeContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.TestFillQuoteTransformerBridge, env.provider, Object.assign({}, env.txDefaults, { from: sender }), artifacts_1.artifacts);
        [makerToken, takerToken, takerFeeToken] = yield Promise.all(_.times(3, () => __awaiter(this, void 0, void 0, function* () {
            return wrappers_1.TestMintableERC20TokenContract.deployFrom0xArtifactAsync(artifacts_1.artifacts.TestMintableERC20Token, env.provider, env.txDefaults, artifacts_1.artifacts);
        })));
        singleProtocolFee = (yield exchange.protocolFeeMultiplier().callAsync()).times(GAS_PRICE);
    }));
    function createOrder(fields = {}) {
        return Object.assign({ chainId: 1, exchangeAddress: exchange.address, expirationTimeSeconds: ZERO_AMOUNT, salt: ZERO_AMOUNT, senderAddress: NULL_ADDRESS, takerAddress: NULL_ADDRESS, makerAddress: maker, feeRecipientAddress: feeRecipient, makerAssetAmount: contracts_test_utils_1.getRandomInteger('0.1e18', '1e18'), takerAssetAmount: contracts_test_utils_1.getRandomInteger('0.1e18', '1e18'), makerFee: ZERO_AMOUNT, takerFee: contracts_test_utils_1.getRandomInteger('0.001e18', '0.1e18'), makerAssetData: order_utils_1.assetDataUtils.encodeERC20AssetData(makerToken.address), takerAssetData: order_utils_1.assetDataUtils.encodeERC20AssetData(takerToken.address), makerFeeAssetData: NULL_BYTES, takerFeeAssetData: order_utils_1.assetDataUtils.encodeERC20AssetData(takerToken.address), filledTakerAssetAmount: ZERO_AMOUNT }, fields);
    }
    function createBridgeOrder(fields = {}, fillRatio = 1.0) {
        const order = createOrder(fields);
        const bridgeData = encodeBridgeBehavior(order.makerAssetAmount, fillRatio);
        return Object.assign({}, order, { makerAddress: bridge.address, makerAssetData: order_utils_1.assetDataUtils.encodeERC20BridgeAssetData(makerToken.address, bridge.address, bridgeData), makerFeeAssetData: NULL_BYTES, takerFeeAssetData: NULL_BYTES, makerFee: ZERO_AMOUNT, takerFee: ZERO_AMOUNT });
    }
    const ZERO_QUOTE_FILL_RESULTS = {
        makerAssetBought: ZERO_AMOUNT,
        takerAssetSpent: ZERO_AMOUNT,
        protocolFeePaid: ZERO_AMOUNT,
    };
    function getExpectedSellQuoteFillResults(orders, takerAssetFillAmount = contracts_test_utils_1.constants.MAX_UINT256) {
        const qfr = Object.assign({}, ZERO_QUOTE_FILL_RESULTS);
        for (const order of orders) {
            if (qfr.takerAssetSpent.gte(takerAssetFillAmount)) {
                break;
            }
            const singleFillAmount = utils_1.BigNumber.min(takerAssetFillAmount.minus(qfr.takerAssetSpent), order.takerAssetAmount.minus(order.filledTakerAssetAmount));
            const fillRatio = singleFillAmount.div(order.takerAssetAmount);
            qfr.takerAssetSpent = qfr.takerAssetSpent.plus(singleFillAmount);
            qfr.protocolFeePaid = qfr.protocolFeePaid.plus(singleProtocolFee);
            qfr.makerAssetBought = qfr.makerAssetBought.plus(fillRatio.times(order.makerAssetAmount).integerValue(utils_1.BigNumber.ROUND_DOWN));
            const takerFee = fillRatio.times(order.takerFee).integerValue(utils_1.BigNumber.ROUND_DOWN);
            if (order.takerAssetData === order.takerFeeAssetData) {
                // Taker fee is in taker asset.
                qfr.takerAssetSpent = qfr.takerAssetSpent.plus(takerFee);
            }
            else if (order.makerAssetData === order.takerFeeAssetData) {
                // Taker fee is in maker asset.
                qfr.makerAssetBought = qfr.makerAssetBought.minus(takerFee);
            }
        }
        return qfr;
    }
    function getExpectedBuyQuoteFillResults(orders, makerAssetFillAmount = contracts_test_utils_1.constants.MAX_UINT256) {
        const qfr = Object.assign({}, ZERO_QUOTE_FILL_RESULTS);
        for (const order of orders) {
            if (qfr.makerAssetBought.gte(makerAssetFillAmount)) {
                break;
            }
            const filledMakerAssetAmount = order.filledTakerAssetAmount
                .times(order.makerAssetAmount.div(order.takerAssetAmount))
                .integerValue(utils_1.BigNumber.ROUND_DOWN);
            const singleFillAmount = utils_1.BigNumber.min(makerAssetFillAmount.minus(qfr.makerAssetBought), order.makerAssetAmount.minus(filledMakerAssetAmount));
            const fillRatio = singleFillAmount.div(order.makerAssetAmount);
            qfr.takerAssetSpent = qfr.takerAssetSpent.plus(fillRatio.times(order.takerAssetAmount).integerValue(utils_1.BigNumber.ROUND_UP));
            qfr.protocolFeePaid = qfr.protocolFeePaid.plus(singleProtocolFee);
            qfr.makerAssetBought = qfr.makerAssetBought.plus(singleFillAmount);
            const takerFee = fillRatio.times(order.takerFee).integerValue(utils_1.BigNumber.ROUND_UP);
            if (order.takerAssetData === order.takerFeeAssetData) {
                // Taker fee is in taker asset.
                qfr.takerAssetSpent = qfr.takerAssetSpent.plus(takerFee);
            }
            else if (order.makerAssetData === order.takerFeeAssetData) {
                // Taker fee is in maker asset.
                qfr.makerAssetBought = qfr.makerAssetBought.minus(takerFee);
            }
        }
        return qfr;
    }
    const ZERO_BALANCES = {
        makerAssetBalance: ZERO_AMOUNT,
        takerAssetBalance: ZERO_AMOUNT,
        takerFeeBalance: ZERO_AMOUNT,
        protocolFeeBalance: ZERO_AMOUNT,
    };
    function getBalancesAsync(owner) {
        return __awaiter(this, void 0, void 0, function* () {
            const balances = Object.assign({}, ZERO_BALANCES);
            [
                balances.makerAssetBalance,
                balances.takerAssetBalance,
                balances.takerFeeBalance,
                balances.protocolFeeBalance,
            ] = yield Promise.all([
                makerToken.balanceOf(owner).callAsync(),
                takerToken.balanceOf(owner).callAsync(),
                takerFeeToken.balanceOf(owner).callAsync(),
                env.web3Wrapper.getBalanceInWeiAsync(owner),
            ]);
            return balances;
        });
    }
    function assertBalances(actual, expected) {
        contracts_test_utils_1.assertIntegerRoughlyEquals(actual.makerAssetBalance, expected.makerAssetBalance, 10, 'makerAssetBalance');
        contracts_test_utils_1.assertIntegerRoughlyEquals(actual.takerAssetBalance, expected.takerAssetBalance, 10, 'takerAssetBalance');
        contracts_test_utils_1.assertIntegerRoughlyEquals(actual.takerFeeBalance, expected.takerFeeBalance, 10, 'takerFeeBalance');
        contracts_test_utils_1.assertIntegerRoughlyEquals(actual.protocolFeeBalance, expected.protocolFeeBalance, 10, 'protocolFeeBalance');
    }
    function encodeTransformData(fields = {}) {
        return order_utils_1.encodeFillQuoteTransformerData(Object.assign({ side: order_utils_1.FillQuoteTransformerSide.Sell, sellToken: takerToken.address, buyToken: makerToken.address, orders: [], signatures: [], maxOrderFillAmounts: [], fillAmount: MAX_UINT256, refundReceiver: NULL_ADDRESS, rfqtTakerAddress: NULL_ADDRESS }, fields));
    }
    function encodeExchangeBehavior(filledTakerAssetAmount = 0, makerAssetMintRatio = 1.0) {
        return utils_1.hexUtils.slice(exchange
            .encodeBehaviorData({
            filledTakerAssetAmount: new utils_1.BigNumber(filledTakerAssetAmount),
            makerAssetMintRatio: new utils_1.BigNumber(makerAssetMintRatio).times('1e18').integerValue(),
        })
            .getABIEncodedTransactionData(), 4);
    }
    function encodeBridgeBehavior(amount, makerAssetMintRatio = 1.0) {
        return utils_1.hexUtils.slice(bridge
            .encodeBehaviorData({
            makerAssetMintRatio: new utils_1.BigNumber(makerAssetMintRatio).times('1e18').integerValue(),
            amount,
        })
            .getABIEncodedTransactionData(), 4);
    }
    const ERC20_ASSET_PROXY_ID = '0xf47261b0';
    describe('sell quotes', () => {
        it('can fully sell to a single order quote', () => __awaiter(this, void 0, void 0, function* () {
            const orders = _.times(1, () => createOrder());
            const signatures = orders.map(() => encodeExchangeBehavior());
            const qfr = getExpectedSellQuoteFillResults(orders);
            yield host
                .executeTransform(transformer.address, takerToken.address, qfr.takerAssetSpent, sender, taker, encodeTransformData({
                orders,
                signatures,
            }))
                .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid });
            assertBalances(yield getBalancesAsync(host.address), Object.assign({}, ZERO_BALANCES, { makerAssetBalance: qfr.makerAssetBought }));
        }));
        it('can fully sell to multi order quote', () => __awaiter(this, void 0, void 0, function* () {
            const orders = _.times(3, () => createOrder());
            const signatures = orders.map(() => encodeExchangeBehavior());
            const qfr = getExpectedSellQuoteFillResults(orders);
            yield host
                .executeTransform(transformer.address, takerToken.address, qfr.takerAssetSpent, sender, taker, encodeTransformData({
                orders,
                signatures,
            }))
                .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid });
            assertBalances(yield getBalancesAsync(host.address), Object.assign({}, ZERO_BALANCES, { makerAssetBalance: qfr.makerAssetBought }));
        }));
        it('can partially sell to single order quote', () => __awaiter(this, void 0, void 0, function* () {
            const orders = _.times(1, () => createOrder());
            const signatures = orders.map(() => encodeExchangeBehavior());
            const qfr = getExpectedSellQuoteFillResults(orders, getExpectedSellQuoteFillResults(orders).takerAssetSpent.dividedToIntegerBy(2));
            yield host
                .executeTransform(transformer.address, takerToken.address, qfr.takerAssetSpent, sender, taker, encodeTransformData({
                orders,
                signatures,
            }))
                .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid });
            assertBalances(yield getBalancesAsync(host.address), Object.assign({}, ZERO_BALANCES, { makerAssetBalance: qfr.makerAssetBought }));
        }));
        it('can partially sell to multi order quote and refund unused protocol fees', () => __awaiter(this, void 0, void 0, function* () {
            const orders = _.times(3, () => createOrder());
            const signatures = orders.map(() => encodeExchangeBehavior());
            const qfr = getExpectedSellQuoteFillResults(orders.slice(0, 2));
            const maxProtocolFees = singleProtocolFee.times(orders.length);
            yield host
                .executeTransform(transformer.address, takerToken.address, qfr.takerAssetSpent, sender, taker, encodeTransformData({
                orders,
                signatures,
            }))
                .awaitTransactionSuccessAsync({ value: maxProtocolFees });
            assertBalances(yield getBalancesAsync(host.address), Object.assign({}, ZERO_BALANCES, { makerAssetBalance: qfr.makerAssetBought, protocolFeeBalance: singleProtocolFee }));
        }));
        it('can sell to multi order quote with a failing order', () => __awaiter(this, void 0, void 0, function* () {
            const orders = _.times(3, () => createOrder());
            // First order will fail.
            const validOrders = orders.slice(1);
            const signatures = [NULL_BYTES, ...validOrders.map(() => encodeExchangeBehavior())];
            const qfr = getExpectedSellQuoteFillResults(validOrders);
            yield host
                .executeTransform(transformer.address, takerToken.address, qfr.takerAssetSpent, sender, taker, encodeTransformData({
                orders,
                signatures,
            }))
                .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid });
            assertBalances(yield getBalancesAsync(host.address), Object.assign({}, ZERO_BALANCES, { makerAssetBalance: qfr.makerAssetBought }));
        }));
        it('succeeds if an order transfers too few maker tokens', () => __awaiter(this, void 0, void 0, function* () {
            const mintScale = 0.5;
            const orders = _.times(3, () => createOrder());
            // First order mints less than expected.
            const signatures = [
                encodeExchangeBehavior(0, mintScale),
                ...orders.slice(1).map(() => encodeExchangeBehavior()),
            ];
            const qfr = getExpectedSellQuoteFillResults(orders);
            yield host
                .executeTransform(transformer.address, takerToken.address, qfr.takerAssetSpent, sender, taker, encodeTransformData({
                orders,
                signatures,
            }))
                .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid });
            assertBalances(yield getBalancesAsync(host.address), Object.assign({}, ZERO_BALANCES, { makerAssetBalance: qfr.makerAssetBought
                    .minus(orders[0].makerAssetAmount.times(1 - mintScale))
                    .integerValue(utils_1.BigNumber.ROUND_DOWN) }));
        }));
        it('can fail if an order is partially filled', () => __awaiter(this, void 0, void 0, function* () {
            const orders = _.times(3, () => createOrder());
            // First order is partially filled.
            const filledOrder = Object.assign({}, orders[0], { filledTakerAssetAmount: orders[0].takerAssetAmount.dividedToIntegerBy(2) });
            // First order is partially filled.
            const signatures = [
                encodeExchangeBehavior(filledOrder.filledTakerAssetAmount),
                ...orders.slice(1).map(() => encodeExchangeBehavior()),
            ];
            const qfr = getExpectedSellQuoteFillResults(orders);
            const tx = host
                .executeTransform(transformer.address, takerToken.address, qfr.takerAssetSpent, sender, taker, encodeTransformData({
                orders,
                signatures,
            }))
                .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid });
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.TransformERC20.IncompleteFillSellQuoteError(takerToken.address, getExpectedSellQuoteFillResults([filledOrder, ...orders.slice(1)]).takerAssetSpent, qfr.takerAssetSpent));
        }));
        it('fails if not enough protocol fee provided', () => __awaiter(this, void 0, void 0, function* () {
            const orders = _.times(3, () => createOrder());
            const signatures = orders.map(() => encodeExchangeBehavior());
            const qfr = getExpectedSellQuoteFillResults(orders);
            const tx = host
                .executeTransform(transformer.address, takerToken.address, qfr.takerAssetSpent, sender, taker, encodeTransformData({
                orders,
                signatures,
            }))
                .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid.minus(1) });
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.TransformERC20.IncompleteFillSellQuoteError(takerToken.address, getExpectedSellQuoteFillResults([...orders.slice(0, 2)]).takerAssetSpent, qfr.takerAssetSpent));
        }));
        it('can sell less than the taker token balance', () => __awaiter(this, void 0, void 0, function* () {
            const orders = _.times(3, () => createOrder());
            const signatures = orders.map(() => encodeExchangeBehavior());
            const qfr = getExpectedSellQuoteFillResults(orders);
            const takerTokenBalance = qfr.takerAssetSpent.times(1.01).integerValue();
            yield host
                .executeTransform(transformer.address, takerToken.address, takerTokenBalance, sender, taker, encodeTransformData({
                orders,
                signatures,
                fillAmount: qfr.takerAssetSpent,
            }))
                .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid });
            assertBalances(yield getBalancesAsync(host.address), Object.assign({}, ZERO_BALANCES, { makerAssetBalance: qfr.makerAssetBought, takerAssetBalance: qfr.takerAssetSpent.times(0.01).integerValue() }));
        }));
        it('fails to sell more than the taker token balance', () => __awaiter(this, void 0, void 0, function* () {
            const orders = _.times(3, () => createOrder());
            const signatures = orders.map(() => encodeExchangeBehavior());
            const qfr = getExpectedSellQuoteFillResults(orders);
            const takerTokenBalance = qfr.takerAssetSpent.times(0.99).integerValue();
            const tx = host
                .executeTransform(transformer.address, takerToken.address, takerTokenBalance, sender, taker, encodeTransformData({
                orders,
                signatures,
                fillAmount: qfr.takerAssetSpent,
            }))
                .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid });
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.TransformERC20.IncompleteFillSellQuoteError(takerToken.address, getExpectedSellQuoteFillResults(orders.slice(0, 2)).takerAssetSpent, qfr.takerAssetSpent));
        }));
        it('can fully sell to a single order with maker asset taker fees', () => __awaiter(this, void 0, void 0, function* () {
            const orders = _.times(1, () => createOrder({
                takerFeeAssetData: order_utils_1.assetDataUtils.encodeERC20AssetData(makerToken.address),
            }));
            const signatures = orders.map(() => encodeExchangeBehavior());
            const qfr = getExpectedSellQuoteFillResults(orders);
            yield host
                .executeTransform(transformer.address, takerToken.address, qfr.takerAssetSpent, sender, taker, encodeTransformData({
                orders,
                signatures,
            }))
                .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid });
            assertBalances(yield getBalancesAsync(host.address), Object.assign({}, ZERO_BALANCES, { makerAssetBalance: qfr.makerAssetBought }));
        }));
        it('fails if an order has a non-standard taker fee asset', () => __awaiter(this, void 0, void 0, function* () {
            const BAD_ASSET_DATA = utils_1.hexUtils.random(36);
            const orders = _.times(1, () => createOrder({ takerFeeAssetData: BAD_ASSET_DATA }));
            const signatures = orders.map(() => encodeExchangeBehavior());
            const qfr = getExpectedSellQuoteFillResults(orders);
            const tx = host
                .executeTransform(transformer.address, takerToken.address, qfr.takerAssetSpent, sender, taker, encodeTransformData({
                orders,
                signatures,
            }))
                .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid });
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.TransformERC20.InvalidERC20AssetDataError(BAD_ASSET_DATA));
        }));
        it('fails if an order has a fee asset that is neither maker or taker asset', () => __awaiter(this, void 0, void 0, function* () {
            const badToken = contracts_test_utils_1.randomAddress();
            const BAD_ASSET_DATA = utils_1.hexUtils.concat(ERC20_ASSET_PROXY_ID, utils_1.hexUtils.leftPad(badToken));
            const orders = _.times(1, () => createOrder({ takerFeeAssetData: BAD_ASSET_DATA }));
            const signatures = orders.map(() => encodeExchangeBehavior());
            const qfr = getExpectedSellQuoteFillResults(orders);
            const tx = host
                .executeTransform(transformer.address, takerToken.address, qfr.takerAssetSpent, sender, taker, encodeTransformData({
                orders,
                signatures,
            }))
                .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid });
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.TransformERC20.InvalidTakerFeeTokenError(badToken));
        }));
        it('respects `maxOrderFillAmounts`', () => __awaiter(this, void 0, void 0, function* () {
            const orders = _.times(2, () => createOrder());
            const signatures = orders.map(() => encodeExchangeBehavior());
            const qfr = getExpectedSellQuoteFillResults(orders.slice(1));
            const protocolFee = singleProtocolFee.times(2);
            yield host
                .executeTransform(transformer.address, takerToken.address, qfr.takerAssetSpent, sender, taker, encodeTransformData({
                orders,
                signatures,
                // Skip the first order.
                maxOrderFillAmounts: [ZERO_AMOUNT],
            }))
                .awaitTransactionSuccessAsync({ value: protocolFee });
            assertBalances(yield getBalancesAsync(host.address), Object.assign({}, ZERO_BALANCES, { makerAssetBalance: qfr.makerAssetBought }));
        }));
        it('can refund unspent protocol fee to the `refundReceiver`', () => __awaiter(this, void 0, void 0, function* () {
            const orders = _.times(2, () => createOrder());
            const signatures = orders.map(() => encodeExchangeBehavior());
            const qfr = getExpectedSellQuoteFillResults(orders);
            const protocolFee = qfr.protocolFeePaid.plus(1);
            const refundReceiver = contracts_test_utils_1.randomAddress();
            yield host
                .executeTransform(transformer.address, takerToken.address, qfr.takerAssetSpent, sender, taker, encodeTransformData({
                orders,
                signatures,
                refundReceiver,
            }))
                .awaitTransactionSuccessAsync({ value: protocolFee });
            const receiverBalancer = yield env.web3Wrapper.getBalanceInWeiAsync(refundReceiver);
            contracts_test_utils_1.expect(receiverBalancer).to.bignumber.eq(1);
        }));
        it('can refund unspent protocol fee to the taker', () => __awaiter(this, void 0, void 0, function* () {
            const orders = _.times(2, () => createOrder());
            const signatures = orders.map(() => encodeExchangeBehavior());
            const qfr = getExpectedSellQuoteFillResults(orders);
            const protocolFee = qfr.protocolFeePaid.plus(1);
            const refundReceiver = contracts_test_utils_1.randomAddress();
            yield host
                .executeTransform(transformer.address, takerToken.address, qfr.takerAssetSpent, sender, refundReceiver, // taker = refundReceiver
            encodeTransformData({
                orders,
                signatures,
                // address(1) indicates taker
                refundReceiver: utils_1.hexUtils.leftPad(1, 20),
            }))
                .awaitTransactionSuccessAsync({ value: protocolFee });
            const receiverBalancer = yield env.web3Wrapper.getBalanceInWeiAsync(refundReceiver);
            contracts_test_utils_1.expect(receiverBalancer).to.bignumber.eq(1);
        }));
        it('can refund unspent protocol fee to the sender', () => __awaiter(this, void 0, void 0, function* () {
            const orders = _.times(2, () => createOrder());
            const signatures = orders.map(() => encodeExchangeBehavior());
            const qfr = getExpectedSellQuoteFillResults(orders);
            const protocolFee = qfr.protocolFeePaid.plus(1);
            const refundReceiver = contracts_test_utils_1.randomAddress();
            yield host
                .executeTransform(transformer.address, takerToken.address, qfr.takerAssetSpent, refundReceiver, // sender = refundReceiver
            taker, encodeTransformData({
                orders,
                signatures,
                // address(2) indicates sender
                refundReceiver: utils_1.hexUtils.leftPad(2, 20),
            }))
                .awaitTransactionSuccessAsync({ value: protocolFee });
            const receiverBalancer = yield env.web3Wrapper.getBalanceInWeiAsync(refundReceiver);
            contracts_test_utils_1.expect(receiverBalancer).to.bignumber.eq(1);
        }));
    });
    describe('buy quotes', () => {
        it('can fully buy from a single order quote', () => __awaiter(this, void 0, void 0, function* () {
            const orders = _.times(1, () => createOrder());
            const signatures = orders.map(() => encodeExchangeBehavior());
            const qfr = getExpectedBuyQuoteFillResults(orders);
            yield host
                .executeTransform(transformer.address, takerToken.address, qfr.takerAssetSpent, sender, taker, encodeTransformData({
                orders,
                signatures,
                side: order_utils_1.FillQuoteTransformerSide.Buy,
                fillAmount: qfr.makerAssetBought,
            }))
                .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid });
            assertBalances(yield getBalancesAsync(host.address), Object.assign({}, ZERO_BALANCES, { makerAssetBalance: qfr.makerAssetBought }));
        }));
        it('can fully buy from a multi order quote', () => __awaiter(this, void 0, void 0, function* () {
            const orders = _.times(3, () => createOrder());
            const signatures = orders.map(() => encodeExchangeBehavior());
            const qfr = getExpectedBuyQuoteFillResults(orders);
            yield host
                .executeTransform(transformer.address, takerToken.address, qfr.takerAssetSpent, sender, taker, encodeTransformData({
                orders,
                signatures,
                side: order_utils_1.FillQuoteTransformerSide.Buy,
                fillAmount: qfr.makerAssetBought,
            }))
                .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid });
            assertBalances(yield getBalancesAsync(host.address), Object.assign({}, ZERO_BALANCES, { makerAssetBalance: qfr.makerAssetBought }));
        }));
        it('can partially buy from a single order quote', () => __awaiter(this, void 0, void 0, function* () {
            const orders = _.times(1, () => createOrder());
            const signatures = orders.map(() => encodeExchangeBehavior());
            const qfr = getExpectedBuyQuoteFillResults(orders, getExpectedBuyQuoteFillResults(orders).makerAssetBought.dividedToIntegerBy(2));
            yield host
                .executeTransform(transformer.address, takerToken.address, qfr.takerAssetSpent, sender, taker, encodeTransformData({
                orders,
                signatures,
                side: order_utils_1.FillQuoteTransformerSide.Buy,
                fillAmount: qfr.makerAssetBought,
            }))
                .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid });
            assertBalances(yield getBalancesAsync(host.address), Object.assign({}, ZERO_BALANCES, { makerAssetBalance: qfr.makerAssetBought }));
        }));
        it('can partially buy from multi order quote and refund unused protocol fees', () => __awaiter(this, void 0, void 0, function* () {
            const orders = _.times(3, () => createOrder());
            const signatures = orders.map(() => encodeExchangeBehavior());
            const qfr = getExpectedBuyQuoteFillResults(orders.slice(0, 2));
            const maxProtocolFees = singleProtocolFee.times(orders.length);
            yield host
                .executeTransform(transformer.address, takerToken.address, qfr.takerAssetSpent, sender, taker, encodeTransformData({
                orders,
                signatures,
                side: order_utils_1.FillQuoteTransformerSide.Buy,
                fillAmount: qfr.makerAssetBought,
            }))
                .awaitTransactionSuccessAsync({ value: maxProtocolFees });
            assertBalances(yield getBalancesAsync(host.address), Object.assign({}, ZERO_BALANCES, { makerAssetBalance: qfr.makerAssetBought, protocolFeeBalance: singleProtocolFee }));
        }));
        it('can buy from multi order quote with a failing order', () => __awaiter(this, void 0, void 0, function* () {
            const orders = _.times(3, () => createOrder());
            // First order will fail.
            const validOrders = orders.slice(1);
            const signatures = [NULL_BYTES, ...validOrders.map(() => encodeExchangeBehavior())];
            const qfr = getExpectedBuyQuoteFillResults(validOrders);
            yield host
                .executeTransform(transformer.address, takerToken.address, qfr.takerAssetSpent, sender, taker, encodeTransformData({
                orders,
                signatures,
                side: order_utils_1.FillQuoteTransformerSide.Buy,
                fillAmount: qfr.makerAssetBought,
            }))
                .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid });
            assertBalances(yield getBalancesAsync(host.address), Object.assign({}, ZERO_BALANCES, { makerAssetBalance: qfr.makerAssetBought }));
        }));
        it('fails to buy more than available in orders', () => __awaiter(this, void 0, void 0, function* () {
            const orders = _.times(3, () => createOrder());
            const signatures = orders.map(() => encodeExchangeBehavior());
            const qfr = getExpectedBuyQuoteFillResults(orders);
            const tx = host
                .executeTransform(transformer.address, takerToken.address, qfr.takerAssetSpent, sender, taker, encodeTransformData({
                orders,
                signatures,
                side: order_utils_1.FillQuoteTransformerSide.Buy,
                fillAmount: qfr.makerAssetBought.plus(1),
            }))
                .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid });
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.TransformERC20.IncompleteFillBuyQuoteError(makerToken.address, qfr.makerAssetBought, qfr.makerAssetBought.plus(1)));
        }));
        it('can fully buy from a single order with maker asset taker fees', () => __awaiter(this, void 0, void 0, function* () {
            const orders = _.times(1, () => createOrder({
                takerFeeAssetData: order_utils_1.assetDataUtils.encodeERC20AssetData(makerToken.address),
            }));
            const signatures = orders.map(() => encodeExchangeBehavior());
            const qfr = getExpectedBuyQuoteFillResults(orders);
            yield host
                .executeTransform(transformer.address, takerToken.address, qfr.takerAssetSpent, sender, taker, encodeTransformData({
                orders,
                signatures,
                side: order_utils_1.FillQuoteTransformerSide.Buy,
                fillAmount: qfr.makerAssetBought,
            }))
                .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid });
            assertBalances(yield getBalancesAsync(host.address), Object.assign({}, ZERO_BALANCES, { makerAssetBalance: qfr.makerAssetBought }));
        }));
        it('fails if an order has a non-standard taker fee asset', () => __awaiter(this, void 0, void 0, function* () {
            const BAD_ASSET_DATA = utils_1.hexUtils.random(36);
            const orders = _.times(1, () => createOrder({ takerFeeAssetData: BAD_ASSET_DATA }));
            const signatures = orders.map(() => encodeExchangeBehavior());
            const qfr = getExpectedBuyQuoteFillResults(orders);
            const tx = host
                .executeTransform(transformer.address, takerToken.address, qfr.takerAssetSpent, sender, taker, encodeTransformData({
                orders,
                signatures,
                side: order_utils_1.FillQuoteTransformerSide.Buy,
                fillAmount: qfr.makerAssetBought,
            }))
                .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid });
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.TransformERC20.InvalidERC20AssetDataError(BAD_ASSET_DATA));
        }));
        it('fails if an order has a fee asset that is neither maker or taker asset', () => __awaiter(this, void 0, void 0, function* () {
            const badToken = contracts_test_utils_1.randomAddress();
            const BAD_ASSET_DATA = utils_1.hexUtils.concat(ERC20_ASSET_PROXY_ID, utils_1.hexUtils.leftPad(badToken));
            const orders = _.times(1, () => createOrder({ takerFeeAssetData: BAD_ASSET_DATA }));
            const signatures = orders.map(() => encodeExchangeBehavior());
            const qfr = getExpectedBuyQuoteFillResults(orders);
            const tx = host
                .executeTransform(transformer.address, takerToken.address, qfr.takerAssetSpent, sender, taker, encodeTransformData({
                orders,
                signatures,
                side: order_utils_1.FillQuoteTransformerSide.Buy,
                fillAmount: qfr.makerAssetBought,
            }))
                .awaitTransactionSuccessAsync({ value: qfr.protocolFeePaid });
            return contracts_test_utils_1.expect(tx).to.revertWith(new utils_1.ZeroExRevertErrors.TransformERC20.InvalidTakerFeeTokenError(badToken));
        }));
        it('respects `maxOrderFillAmounts`', () => __awaiter(this, void 0, void 0, function* () {
            const orders = _.times(2, () => createOrder());
            const signatures = orders.map(() => encodeExchangeBehavior());
            const qfr = getExpectedBuyQuoteFillResults(orders.slice(1));
            const protocolFee = singleProtocolFee.times(2);
            yield host
                .executeTransform(transformer.address, takerToken.address, qfr.takerAssetSpent, sender, taker, encodeTransformData({
                orders,
                signatures,
                side: order_utils_1.FillQuoteTransformerSide.Buy,
                fillAmount: qfr.makerAssetBought,
                // Skip the first order.
                maxOrderFillAmounts: [ZERO_AMOUNT],
            }))
                .awaitTransactionSuccessAsync({ value: protocolFee });
            assertBalances(yield getBalancesAsync(host.address), Object.assign({}, ZERO_BALANCES, { makerAssetBalance: qfr.makerAssetBought }));
        }));
    });
    describe('bridge orders fall through', () => {
        it('can fully sell to a single bridge order quote', () => __awaiter(this, void 0, void 0, function* () {
            const orders = _.times(1, () => createBridgeOrder());
            const signatures = orders.map(() => NULL_BYTES);
            const qfr = getExpectedSellQuoteFillResults(orders);
            yield host
                .executeTransform(transformer.address, takerToken.address, qfr.takerAssetSpent, sender, taker, encodeTransformData({
                orders,
                signatures,
            }))
                .awaitTransactionSuccessAsync({ value: ZERO_AMOUNT });
            assertBalances(yield getBalancesAsync(host.address), Object.assign({}, ZERO_BALANCES, { makerAssetBalance: qfr.makerAssetBought }));
        }));
        it('can sell to a mix of order quote', () => __awaiter(this, void 0, void 0, function* () {
            const nativeOrders = [createOrder()];
            const bridgeOrders = [createBridgeOrder()];
            const orders = [...nativeOrders, ...bridgeOrders];
            const signatures = [
                ...nativeOrders.map(() => encodeExchangeBehavior()),
                ...bridgeOrders.map(() => NULL_BYTES),
            ];
            const qfr = getExpectedSellQuoteFillResults(orders);
            yield host
                .executeTransform(transformer.address, takerToken.address, qfr.takerAssetSpent, sender, taker, encodeTransformData({
                orders,
                signatures,
            }))
                .awaitTransactionSuccessAsync({ value: singleProtocolFee.times(nativeOrders.length) });
            assertBalances(yield getBalancesAsync(host.address), Object.assign({}, ZERO_BALANCES, { makerAssetBalance: qfr.makerAssetBought }));
        }));
        it('can attempt to sell to a mix of order quote handling reverts', () => __awaiter(this, void 0, void 0, function* () {
            const nativeOrders = _.times(3, () => createOrder());
            const bridgeOrders = [createBridgeOrder()];
            const orders = [...nativeOrders, ...bridgeOrders];
            const signatures = [
                ...nativeOrders.map(() => NULL_BYTES),
                ...bridgeOrders.map(() => NULL_BYTES),
            ];
            const qfr = getExpectedSellQuoteFillResults(bridgeOrders);
            yield host
                .executeTransform(transformer.address, takerToken.address, qfr.takerAssetSpent, sender, taker, encodeTransformData({
                orders,
                signatures,
            }))
                // Single protocol fee as all Native orders will fail
                .awaitTransactionSuccessAsync({ value: singleProtocolFee });
            assertBalances(yield getBalancesAsync(host.address), Object.assign({}, ZERO_BALANCES, { makerAssetBalance: qfr.makerAssetBought, protocolFeeBalance: singleProtocolFee }));
        }));
        it('can continue to the bridge order if the native order reverts', () => __awaiter(this, void 0, void 0, function* () {
            const nativeOrders = [createOrder()];
            const bridgeOrders = [createBridgeOrder()];
            const orders = [...nativeOrders, ...bridgeOrders];
            const signatures = [
                ...nativeOrders.map(() => encodeExchangeBehavior()),
                ...bridgeOrders.map(() => NULL_BYTES),
            ];
            const qfr = getExpectedSellQuoteFillResults(bridgeOrders);
            yield host
                .executeTransform(transformer.address, takerToken.address, qfr.takerAssetSpent, sender, taker, encodeTransformData({
                orders,
                signatures,
            }))
                // Insufficient single protocol fee
                .awaitTransactionSuccessAsync({ value: singleProtocolFee.minus(1) });
            assertBalances(yield getBalancesAsync(host.address), Object.assign({}, ZERO_BALANCES, { makerAssetBalance: qfr.makerAssetBought, protocolFeeBalance: singleProtocolFee }));
        }));
    });
});
//# sourceMappingURL=fill_quote_transformer_test.js.map