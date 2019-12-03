import { IAssetDataContract } from '@0x/contracts-asset-proxy';
import { DummyERC721TokenContract } from '@0x/contracts-erc721';
import { ForwarderContract } from '@0x/contracts-exchange-forwarder';
import { blockchainTests, constants, getLatestBlockTimestampAsync, toBaseUnitAmount } from '@0x/contracts-test-utils';
import { generatePseudoRandomSalt } from '@0x/order-utils';
import { SignatureType, SignedOrder } from '@0x/types';
import { AbiEncoder, BigNumber, ExchangeForwarderRevertErrors, hexConcat } from '@0x/utils';

import { deployEth2DaiBridgeAsync } from '../bridges/deploy_eth2dai_bridge';
import { deployUniswapBridgeAsync } from '../bridges/deploy_uniswap_bridge';
import { Actor } from '../framework/actors/base';
import { FeeRecipient } from '../framework/actors/fee_recipient';
import { Maker } from '../framework/actors/maker';
import { Taker } from '../framework/actors/taker';
import { actorAddressesByName } from '../framework/actors/utils';
import { BlockchainBalanceStore } from '../framework/balances/blockchain_balance_store';
import { DeploymentManager } from '../framework/deployment_manager';
import { TestEth2DaiContract, TestUniswapExchangeContract } from '../wrappers';

import { deployForwarderAsync } from './deploy_forwarder';
import { ForwarderTestFactory } from './forwarder_test_factory';

blockchainTests.resets('Forwarder <> ERC20Bridge integration tests', env => {
    let deployment: DeploymentManager;
    let balanceStore: BlockchainBalanceStore;
    let testFactory: ForwarderTestFactory;

    let forwarder: ForwarderContract;
    let assetDataEncoder: IAssetDataContract;
    let eth2Dai: TestEth2DaiContract;
    let uniswapExchange: TestUniswapExchangeContract;

    let erc721Token: DummyERC721TokenContract;
    let nftId: BigNumber;
    let makerTokenAssetData: string;
    let makerFeeTokenAssetData: string;
    let eth2DaiBridgeAssetData: string;
    let uniswapBridgeAssetData: string;

    let maker: Maker;
    let taker: Taker;
    let orderFeeRecipient: FeeRecipient;
    let forwarderFeeRecipient: FeeRecipient;

    let eth2DaiBridgeOrder: SignedOrder;
    let uniswapBridgeOrder: SignedOrder;

    before(async () => {
        assetDataEncoder = new IAssetDataContract(constants.NULL_ADDRESS, env.provider);
        deployment = await DeploymentManager.deployAsync(env, {
            numErc20TokensToDeploy: 2,
            numErc721TokensToDeploy: 1,
            numErc1155TokensToDeploy: 0,
        });
        const [makerToken, makerFeeToken] = deployment.tokens.erc20;
        [erc721Token] = deployment.tokens.erc721;

        forwarder = await deployForwarderAsync(deployment, env);
        const eth2DaiContracts = await deployEth2DaiBridgeAsync(deployment, env);
        const [eth2DaiBridge] = eth2DaiContracts;
        [, eth2Dai] = eth2DaiContracts;
        const uniswapContracts = await deployUniswapBridgeAsync(deployment, env, [makerToken.address]);
        const [uniswapBridge] = uniswapContracts;
        [, [uniswapExchange]] = uniswapContracts;

        makerTokenAssetData = assetDataEncoder.ERC20Token(makerToken.address).getABIEncodedTransactionData();
        makerFeeTokenAssetData = assetDataEncoder.ERC20Token(makerFeeToken.address).getABIEncodedTransactionData();
        const wethAssetData = assetDataEncoder
            .ERC20Token(deployment.tokens.weth.address)
            .getABIEncodedTransactionData();

        const bridgeDataEncoder = AbiEncoder.create([{ name: 'fromTokenAddress', type: 'address' }]);
        const bridgeData = bridgeDataEncoder.encode([deployment.tokens.weth.address]);
        eth2DaiBridgeAssetData = assetDataEncoder
            .ERC20Bridge(makerToken.address, eth2DaiBridge.address, bridgeData)
            .getABIEncodedTransactionData();
        uniswapBridgeAssetData = assetDataEncoder
            .ERC20Bridge(makerToken.address, uniswapBridge.address, bridgeData)
            .getABIEncodedTransactionData();

        taker = new Taker({ name: 'Taker', deployment });
        orderFeeRecipient = new FeeRecipient({
            name: 'Order fee recipient',
            deployment,
        });
        forwarderFeeRecipient = new FeeRecipient({
            name: 'Forwarder fee recipient',
            deployment,
        });

        const fifteenMinutesInSeconds = 15 * 60;
        const currentBlockTimestamp = await getLatestBlockTimestampAsync();
        const orderDefaults = {
            chainId: deployment.chainId,
            exchangeAddress: deployment.exchange.address,
            takerAddress: constants.NULL_ADDRESS,
            feeRecipientAddress: orderFeeRecipient.address,
            senderAddress: constants.NULL_ADDRESS,
            makerAssetAmount: toBaseUnitAmount(2),
            takerAssetAmount: toBaseUnitAmount(1),
            takerAssetData: wethAssetData,
            makerFee: constants.ZERO_AMOUNT,
            takerFee: constants.ZERO_AMOUNT,
            makerFeeAssetData: makerFeeTokenAssetData,
            takerFeeAssetData: wethAssetData,
            expirationTimeSeconds: new BigNumber(currentBlockTimestamp).plus(fifteenMinutesInSeconds),
            salt: generatePseudoRandomSalt(),
            signature: hexConcat(SignatureType.Wallet),
        };
        eth2DaiBridgeOrder = {
            ...orderDefaults,
            makerAddress: eth2DaiBridge.address,
            makerAssetData: eth2DaiBridgeAssetData,
        };
        uniswapBridgeOrder = {
            ...orderDefaults,
            makerAddress: uniswapBridge.address,
            makerAssetData: uniswapBridgeAssetData,
        };

        maker = new Maker({
            name: 'Maker',
            deployment,
            orderConfig: { ...orderDefaults, makerFee: toBaseUnitAmount(0.01) },
        });
        await maker.configureERC20TokenAsync(makerToken);
        await maker.configureERC20TokenAsync(makerFeeToken);
        await forwarder.approveMakerAssetProxy(makerTokenAssetData).awaitTransactionSuccessAsync();
        [nftId] = await maker.configureERC721TokenAsync(erc721Token);

        // We need to top up the TestUniswapExchange with some ETH so that it can perform tokenToEthSwapInput
        await uniswapExchange.topUpEth().awaitTransactionSuccessAsync({
            from: forwarderFeeRecipient.address,
            value: constants.ONE_ETHER.times(10),
        });

        const tokenOwners = {
            ...actorAddressesByName([maker, taker, orderFeeRecipient, forwarderFeeRecipient]),
            Forwarder: forwarder.address,
            StakingProxy: deployment.staking.stakingProxy.address,
        };
        const tokenContracts = {
            erc20: { makerToken, makerFeeToken, wETH: deployment.tokens.weth },
            erc721: { erc721Token },
        };
        const tokenIds = { erc721: { [erc721Token.address]: [nftId] } };
        balanceStore = new BlockchainBalanceStore(tokenOwners, tokenContracts, tokenIds);

        testFactory = new ForwarderTestFactory(forwarder, deployment, balanceStore, taker, forwarderFeeRecipient);
    });

    after(async () => {
        Actor.reset();
    });

    describe('marketSellOrdersWithEth', () => {
        it('should fully fill a single Eth2DaiBridge order without a taker fee', async () => {
            await testFactory.marketSellTestAsync([eth2DaiBridgeOrder], 1);
        });
        it('should partially fill a single Eth2DaiBridge order without a taker fee', async () => {
            await testFactory.marketSellTestAsync([eth2DaiBridgeOrder], 0.34);
        });
        it('should correctly handle excess maker asset acquired from Eth2Dai', async () => {
            const bridgeExcessBuyAmount = new BigNumber(1);
            await eth2Dai.setExcessBuyAmount(bridgeExcessBuyAmount).awaitTransactionSuccessAsync();
            await testFactory.marketSellTestAsync([eth2DaiBridgeOrder], 0.34, { bridgeExcessBuyAmount });
        });
        it('should fill a single Eth2DaiBridge order with a WETH taker fee', async () => {
            const order = {
                ...eth2DaiBridgeOrder,
                takerFee: toBaseUnitAmount(0.01),
            };
            await testFactory.marketSellTestAsync([order], 0.78);
        });
        it('should fill a single Eth2DaiBridge order with a percentage taker fee', async () => {
            const order = {
                ...eth2DaiBridgeOrder,
                takerFee: toBaseUnitAmount(0.01),
                takerFeeAssetData: makerTokenAssetData,
            };
            await testFactory.marketSellTestAsync([order], 0.78);
        });
        it('should fill an Eth2DaiBridge order along with non-bridge orders, with an affiliate fee', async () => {
            const orders = [
                // ERC721 order
                await maker.signOrderAsync({
                    makerAssetAmount: new BigNumber(1),
                    makerAssetData: assetDataEncoder
                        .ERC721Token(erc721Token.address, nftId)
                        .getABIEncodedTransactionData(),
                    takerFee: toBaseUnitAmount(0.01),
                }),
                eth2DaiBridgeOrder,
                await maker.signOrderAsync({ makerAssetData: makerTokenAssetData }), // Non-bridge order of the same ERC20
            ];
            await testFactory.marketSellTestAsync(orders, 2.56, { forwarderFeePercentage: 1 });
        });
        it('should fully fill a single UniswapBridge order without a taker fee', async () => {
            await testFactory.marketSellTestAsync([uniswapBridgeOrder], 1);
        });
        it('should partially fill a single UniswapBridge order without a taker fee', async () => {
            await testFactory.marketSellTestAsync([uniswapBridgeOrder], 0.34);
        });
        it('should correctly handle excess maker asset acquired from Uniswap', async () => {
            const bridgeExcessBuyAmount = new BigNumber(1);
            await uniswapExchange.setExcessBuyAmount(bridgeExcessBuyAmount).awaitTransactionSuccessAsync();
            await testFactory.marketSellTestAsync([uniswapBridgeOrder], 0.34, { bridgeExcessBuyAmount });
        });
        it('should fill a single UniswapBridge order with a WETH taker fee', async () => {
            const order = {
                ...uniswapBridgeOrder,
                takerFee: toBaseUnitAmount(0.01),
            };
            await testFactory.marketSellTestAsync([order], 0.78);
        });
        it('should fill a single UniswapBridge order with a percentage taker fee', async () => {
            const order = {
                ...uniswapBridgeOrder,
                takerFee: toBaseUnitAmount(0.01),
                takerFeeAssetData: makerTokenAssetData,
            };
            await testFactory.marketSellTestAsync([order], 0.78);
        });
        it('should fill an UniswapBridge order along with non-bridge orders', async () => {
            const orders = [
                // ERC721 order
                await maker.signOrderAsync({
                    makerAssetAmount: new BigNumber(1),
                    makerAssetData: assetDataEncoder
                        .ERC721Token(erc721Token.address, nftId)
                        .getABIEncodedTransactionData(),
                    takerFee: toBaseUnitAmount(0.01),
                }),
                uniswapBridgeOrder,
                await maker.signOrderAsync({ makerAssetData: makerTokenAssetData }), // Non-bridge order of the same ERC20
            ];
            await testFactory.marketSellTestAsync(orders, 2.56, { forwarderFeePercentage: 1 });
        });
        it('should fill multiple bridge orders', async () => {
            await testFactory.marketSellTestAsync([eth2DaiBridgeOrder, uniswapBridgeOrder], 1.23);
        });
        it('should revert if the takerFee is denominated in a different token', async () => {
            const order = {
                ...eth2DaiBridgeOrder,
                takerFee: toBaseUnitAmount(0.01),
                takerFeeAssetData: makerFeeTokenAssetData,
            };
            const expectedError = new ExchangeForwarderRevertErrors.UnsupportedFeeError(makerFeeTokenAssetData);
            await testFactory.marketSellTestAsync([order], 1.23, { revertError: expectedError });
        });
    });
    describe('marketBuyOrdersWithEth', () => {
        it('should fully fill a single Eth2DaiBridge order without a taker fee', async () => {
            await testFactory.marketBuyTestAsync([eth2DaiBridgeOrder], 1);
        });
        it('should partially fill a single Eth2DaiBridge order without a taker fee', async () => {
            await testFactory.marketBuyTestAsync([eth2DaiBridgeOrder], 0.34);
        });
        it('should return excess ETH', async () => {
            await testFactory.marketBuyTestAsync([eth2DaiBridgeOrder], 1, { ethValueAdjustment: 1 });
        });
        it('should correctly handle excess maker asset acquired from Eth2Dai', async () => {
            const bridgeExcessBuyAmount = new BigNumber(1);
            await eth2Dai.setExcessBuyAmount(bridgeExcessBuyAmount).awaitTransactionSuccessAsync();
            await testFactory.marketBuyTestAsync([eth2DaiBridgeOrder], 0.34, { bridgeExcessBuyAmount });
        });
        it('should fill a single Eth2DaiBridge order with a WETH taker fee', async () => {
            const order = {
                ...eth2DaiBridgeOrder,
                takerFee: toBaseUnitAmount(0.01),
            };
            await testFactory.marketBuyTestAsync([order], 0.78);
        });
        it('should fill a single Eth2DaiBridge order with a percentage taker fee', async () => {
            const order = {
                ...eth2DaiBridgeOrder,
                takerFee: toBaseUnitAmount(0.01),
                takerFeeAssetData: makerTokenAssetData,
            };
            await testFactory.marketBuyTestAsync([order], 0.78);
        });
        it('should fill an Eth2DaiBridge order along with non-bridge orders, with an affiliate fee', async () => {
            const orders = [
                // ERC721 order
                await maker.signOrderAsync({
                    makerAssetAmount: new BigNumber(1),
                    makerAssetData: assetDataEncoder
                        .ERC721Token(erc721Token.address, nftId)
                        .getABIEncodedTransactionData(),
                    takerFee: toBaseUnitAmount(0.01),
                }),
                eth2DaiBridgeOrder,
                await maker.signOrderAsync({ makerAssetData: makerTokenAssetData }), // Non-bridge order of the same ERC20
            ];
            await testFactory.marketBuyTestAsync(orders, 2.56, { forwarderFeePercentage: 1 });
        });
        it('should revert if the amount of ETH sent is too low to fill the makerAssetAmount (Eth2Dai)', async () => {
            const expectedError = new ExchangeForwarderRevertErrors.CompleteBuyFailedError(
                eth2DaiBridgeOrder.makerAssetAmount.times(0.5),
                constants.ZERO_AMOUNT,
            );
            await testFactory.marketBuyTestAsync([eth2DaiBridgeOrder], 0.5, {
                ethValueAdjustment: -2,
                revertError: expectedError,
            });
        });
        it('should fully fill a single UniswapBridge order without a taker fee', async () => {
            await testFactory.marketBuyTestAsync([uniswapBridgeOrder], 1);
        });
        it('should partially fill a single UniswapBridge order without a taker fee', async () => {
            await testFactory.marketBuyTestAsync([uniswapBridgeOrder], 0.34);
        });
        it('should correctly handle excess maker asset acquired from Uniswap', async () => {
            const bridgeExcessBuyAmount = new BigNumber(1);
            await uniswapExchange.setExcessBuyAmount(bridgeExcessBuyAmount).awaitTransactionSuccessAsync();
            await testFactory.marketBuyTestAsync([uniswapBridgeOrder], 0.34, { bridgeExcessBuyAmount });
        });
        it('should fill a single UniswapBridge order with a WETH taker fee', async () => {
            const order = {
                ...uniswapBridgeOrder,
                takerFee: toBaseUnitAmount(0.01),
            };
            await testFactory.marketBuyTestAsync([order], 0.78);
        });
        it('should fill a single UniswapBridge order with a percentage taker fee', async () => {
            const order = {
                ...uniswapBridgeOrder,
                takerFee: toBaseUnitAmount(0.01),
                takerFeeAssetData: makerTokenAssetData,
            };
            await testFactory.marketBuyTestAsync([order], 0.78);
        });
        it('should fill an UniswapBridge order along with non-bridge orders', async () => {
            const orders = [
                // ERC721 order
                await maker.signOrderAsync({
                    makerAssetAmount: new BigNumber(1),
                    makerAssetData: assetDataEncoder
                        .ERC721Token(erc721Token.address, nftId)
                        .getABIEncodedTransactionData(),
                    takerFee: toBaseUnitAmount(0.01),
                }),
                uniswapBridgeOrder,
                await maker.signOrderAsync({ makerAssetData: makerTokenAssetData }), // Non-bridge order of the same ERC20
            ];
            await testFactory.marketBuyTestAsync(orders, 2.56, { forwarderFeePercentage: 1 });
        });
        it('should revert if the amount of ETH sent is too low to fill the makerAssetAmount (Uniswap)', async () => {
            const expectedError = new ExchangeForwarderRevertErrors.CompleteBuyFailedError(
                uniswapBridgeOrder.makerAssetAmount.times(0.5),
                constants.ZERO_AMOUNT,
            );
            await testFactory.marketBuyTestAsync([uniswapBridgeOrder], 0.5, {
                ethValueAdjustment: -2,
                revertError: expectedError,
            });
        });
        it('should fill multiple bridge orders', async () => {
            await testFactory.marketBuyTestAsync([eth2DaiBridgeOrder, uniswapBridgeOrder], 1.23);
        });
        it('should revert if the takerFee is denominated in a different token', async () => {
            const order = {
                ...eth2DaiBridgeOrder,
                takerFee: toBaseUnitAmount(0.01),
                takerFeeAssetData: makerFeeTokenAssetData,
            };
            const expectedError = new ExchangeForwarderRevertErrors.UnsupportedFeeError(makerFeeTokenAssetData);
            await testFactory.marketBuyTestAsync([order], 1.23, { revertError: expectedError });
        });
    });
});
// tslint:disable:max-file-line-count
