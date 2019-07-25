import { ERC20ProxyContract, ERC20Wrapper, ERC721ProxyContract, ERC721Wrapper } from '@0x/contracts-asset-proxy';
import { DummyERC20TokenContract } from '@0x/contracts-erc20';
import { DummyERC721TokenContract } from '@0x/contracts-erc721';
import {
    chaiSetup,
    constants,
    ERC20BalancesByOwner,
    ERC721TokenIdsByOwner,
    expectTransactionFailedAsync,
    OrderFactory,
    provider,
    txDefaults,
    web3Wrapper,
} from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { assetDataUtils } from '@0x/order-utils';
import { RevertReason } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as chai from 'chai';
import * as _ from 'lodash';

import {
    artifacts,
    ExchangeContract,
    ExchangeWrapper,
    MatchOrderTester,
    ReentrantERC20TokenContract,
    TestExchangeInternalsContract,
} from '../src';

import { dependencyArtifacts } from './utils/dependency_artifacts';

const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
chaiSetup.configure();
const expect = chai.expect;

describe('matchOrders', () => {
    let makerAddressLeft: string;
    let makerAddressRight: string;
    let owner: string;
    let takerAddress: string;
    let feeRecipientAddressLeft: string;
    let feeRecipientAddressRight: string;

    let erc20TokenA: DummyERC20TokenContract;
    let erc20TokenB: DummyERC20TokenContract;
    let zrxToken: DummyERC20TokenContract;
    let erc721Token: DummyERC721TokenContract;
    let reentrantErc20Token: ReentrantERC20TokenContract;
    let exchange: ExchangeContract;
    let erc20Proxy: ERC20ProxyContract;
    let erc721Proxy: ERC721ProxyContract;

    let erc20BalancesByOwner: ERC20BalancesByOwner;
    let erc721TokenIdsByOwner: ERC721TokenIdsByOwner;
    let exchangeWrapper: ExchangeWrapper;
    let erc20Wrapper: ERC20Wrapper;
    let erc721Wrapper: ERC721Wrapper;
    let orderFactoryLeft: OrderFactory;
    let orderFactoryRight: OrderFactory;

    let erc721LeftMakerAssetIds: BigNumber[];
    let erc721RightMakerAssetIds: BigNumber[];

    let defaultERC20MakerAssetAddress: string;
    let defaultERC20TakerAssetAddress: string;
    let defaultERC721AssetAddress: string;

    let matchOrderTester: MatchOrderTester;

    let testExchange: TestExchangeInternalsContract;

    before(async () => {
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    before(async () => {
        // Create accounts
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        // Hack(albrow): Both Prettier and TSLint insert a trailing comma below
        // but that is invalid syntax as of TypeScript version >= 2.8. We don't
        // have the right fine-grained configuration options in TSLint,
        // Prettier, or TypeScript, to reconcile this, so we will just have to
        // wait for them to sort it out. We disable TSLint and Prettier for
        // this part of the code for now. This occurs several times in this
        // file. See https://github.com/prettier/prettier/issues/4624.
        // prettier-ignore
        const usedAddresses = ([
            owner,
            makerAddressLeft,
            makerAddressRight,
            takerAddress,
            feeRecipientAddressLeft,
            // tslint:disable-next-line:trailing-comma
            feeRecipientAddressRight
        ] = _.slice(accounts, 0, 6));
        // Create wrappers
        erc20Wrapper = new ERC20Wrapper(provider, usedAddresses, owner);
        erc721Wrapper = new ERC721Wrapper(provider, usedAddresses, owner);
        // Deploy ERC20 token & ERC20 proxy
        const numDummyErc20ToDeploy = 3;
        [erc20TokenA, erc20TokenB, zrxToken] = await erc20Wrapper.deployDummyTokensAsync(
            numDummyErc20ToDeploy,
            constants.DUMMY_TOKEN_DECIMALS,
        );
        erc20Proxy = await erc20Wrapper.deployProxyAsync();
        await erc20Wrapper.setBalancesAndAllowancesAsync();
        // Deploy ERC721 token and proxy
        [erc721Token] = await erc721Wrapper.deployDummyTokensAsync();
        erc721Proxy = await erc721Wrapper.deployProxyAsync();
        await erc721Wrapper.setBalancesAndAllowancesAsync();
        const erc721Balances = await erc721Wrapper.getBalancesAsync();
        erc721LeftMakerAssetIds = erc721Balances[makerAddressLeft][erc721Token.address];
        erc721RightMakerAssetIds = erc721Balances[makerAddressRight][erc721Token.address];
        // Depoy exchange
        exchange = await ExchangeContract.deployFrom0xArtifactAsync(
            artifacts.Exchange,
            provider,
            txDefaults,
            dependencyArtifacts,
            assetDataUtils.encodeERC20AssetData(zrxToken.address),
        );
        exchangeWrapper = new ExchangeWrapper(exchange, provider);
        await exchangeWrapper.registerAssetProxyAsync(erc20Proxy.address, owner);
        await exchangeWrapper.registerAssetProxyAsync(erc721Proxy.address, owner);
        // Authorize ERC20 and ERC721 trades by exchange
        await web3Wrapper.awaitTransactionSuccessAsync(
            await erc20Proxy.addAuthorizedAddress.sendTransactionAsync(exchange.address, {
                from: owner,
            }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
        await web3Wrapper.awaitTransactionSuccessAsync(
            await erc721Proxy.addAuthorizedAddress.sendTransactionAsync(exchange.address, {
                from: owner,
            }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );

        reentrantErc20Token = await ReentrantERC20TokenContract.deployFrom0xArtifactAsync(
            artifacts.ReentrantERC20Token,
            provider,
            txDefaults,
            dependencyArtifacts,
            exchange.address,
        );

        // Set default addresses
        defaultERC20MakerAssetAddress = erc20TokenA.address;
        defaultERC20TakerAssetAddress = erc20TokenB.address;
        defaultERC721AssetAddress = erc721Token.address;
        // Create default order parameters
        const defaultOrderParamsLeft = {
            ...constants.STATIC_ORDER_PARAMS,
            makerAddress: makerAddressLeft,
            exchangeAddress: exchange.address,
            makerAssetData: assetDataUtils.encodeERC20AssetData(defaultERC20MakerAssetAddress),
            takerAssetData: assetDataUtils.encodeERC20AssetData(defaultERC20TakerAssetAddress),
            feeRecipientAddress: feeRecipientAddressLeft,
        };
        const defaultOrderParamsRight = {
            ...constants.STATIC_ORDER_PARAMS,
            makerAddress: makerAddressRight,
            exchangeAddress: exchange.address,
            makerAssetData: assetDataUtils.encodeERC20AssetData(defaultERC20TakerAssetAddress),
            takerAssetData: assetDataUtils.encodeERC20AssetData(defaultERC20MakerAssetAddress),
            feeRecipientAddress: feeRecipientAddressRight,
        };
        const privateKeyLeft = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(makerAddressLeft)];
        orderFactoryLeft = new OrderFactory(privateKeyLeft, defaultOrderParamsLeft);
        const privateKeyRight = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(makerAddressRight)];
        orderFactoryRight = new OrderFactory(privateKeyRight, defaultOrderParamsRight);
        // Set match order tester
        matchOrderTester = new MatchOrderTester(exchangeWrapper, erc20Wrapper, erc721Wrapper, zrxToken.address);
        testExchange = await TestExchangeInternalsContract.deployFrom0xArtifactAsync(
            artifacts.TestExchangeInternals,
            provider,
            txDefaults,
            dependencyArtifacts,
        );
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('matchOrders', () => {
        beforeEach(async () => {
            erc20BalancesByOwner = await erc20Wrapper.getBalancesAsync();
            erc721TokenIdsByOwner = await erc721Wrapper.getBalancesAsync();
        });

        it('Should transfer correct amounts when right order is fully filled and values pass isRoundingErrorFloor but fail isRoundingErrorCeil', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAddress: makerAddressLeft,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(17), 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(98), 0),
                feeRecipientAddress: feeRecipientAddressLeft,
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAddress: makerAddressRight,
                makerAssetData: assetDataUtils.encodeERC20AssetData(defaultERC20TakerAssetAddress),
                takerAssetData: assetDataUtils.encodeERC20AssetData(defaultERC20MakerAssetAddress),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(75), 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(13), 0),
                feeRecipientAddress: feeRecipientAddressRight,
            });
            // Assert is rounding error ceil & not rounding error floor
            // These assertions are taken from MixinMatchOrders::calculateMatchedFillResults
            // The rounding error is derived computating how much the left maker will sell.
            const numerator = signedOrderLeft.makerAssetAmount;
            const denominator = signedOrderLeft.takerAssetAmount;
            const target = signedOrderRight.makerAssetAmount;
            const isRoundingErrorCeil = await testExchange.publicIsRoundingErrorCeil.callAsync(
                numerator,
                denominator,
                target,
            );
            expect(isRoundingErrorCeil).to.be.true();
            const isRoundingErrorFloor = await testExchange.publicIsRoundingErrorFloor.callAsync(
                numerator,
                denominator,
                target,
            );
            expect(isRoundingErrorFloor).to.be.false();
            // Match signedOrderLeft with signedOrderRight
            // Note that the left maker received a slightly better sell price.
            // This is intentional; see note in MixinMatchOrders.calculateMatchedFillResults.
            // Because the left maker received a slightly more favorable sell price, the fee
            // paid by the left taker is slightly higher than that paid by the left maker.
            // Fees can be thought of as a tax paid by the seller, derived from the sale price.
            const expectedTransferAmounts = {
                // Left Maker
                amountSoldByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(13), 0),
                amountBoughtByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(75), 0),
                feePaidByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber('76.4705882352941176'), 16), // 76.47%
                // Right Maker
                amountSoldByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(75), 0),
                amountBoughtByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(13), 0),
                feePaidByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
                // Taker
                amountReceivedByTaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(0), 0),
                feePaidByTakerLeft: Web3Wrapper.toBaseUnitAmount(new BigNumber('76.5306122448979591'), 16), // 76.53%
                feePaidByTakerRight: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
            };
            await matchOrderTester.matchOrdersAndAssertEffectsAsync(
                signedOrderLeft,
                signedOrderRight,
                takerAddress,
                erc20BalancesByOwner,
                erc721TokenIdsByOwner,
                expectedTransferAmounts,
            );
        });

        it('Should transfer correct amounts when left order is fully filled and values pass isRoundingErrorCeil but fail isRoundingErrorFloor', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAddress: makerAddressLeft,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(15), 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(90), 0),
                feeRecipientAddress: feeRecipientAddressLeft,
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAddress: makerAddressRight,
                makerAssetData: assetDataUtils.encodeERC20AssetData(defaultERC20TakerAssetAddress),
                takerAssetData: assetDataUtils.encodeERC20AssetData(defaultERC20MakerAssetAddress),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(97), 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(14), 0),
                feeRecipientAddress: feeRecipientAddressRight,
            });
            // Assert is rounding error floor & not rounding error ceil
            // These assertions are taken from MixinMatchOrders::calculateMatchedFillResults
            // The rounding error is derived computating how much the right maker will buy.
            const numerator = signedOrderRight.takerAssetAmount;
            const denominator = signedOrderRight.makerAssetAmount;
            const target = signedOrderLeft.takerAssetAmount;
            const isRoundingErrorFloor = await testExchange.publicIsRoundingErrorFloor.callAsync(
                numerator,
                denominator,
                target,
            );
            expect(isRoundingErrorFloor).to.be.true();
            const isRoundingErrorCeil = await testExchange.publicIsRoundingErrorCeil.callAsync(
                numerator,
                denominator,
                target,
            );
            expect(isRoundingErrorCeil).to.be.false();
            // Match signedOrderLeft with signedOrderRight
            // Note that the right maker received a slightly better purchase price.
            // This is intentional; see note in MixinMatchOrders.calculateMatchedFillResults.
            // Because the right maker received a slightly more favorable buy price, the fee
            // paid by the right taker is slightly higher than that paid by the right maker.
            // Fees can be thought of as a tax paid by the seller, derived from the sale price.
            const expectedTransferAmounts = {
                // Left Maker
                amountSoldByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(15), 0),
                amountBoughtByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(90), 0),
                feePaidByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
                // Right Maker
                amountSoldByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(90), 0),
                amountBoughtByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(13), 0),
                feePaidByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber('92.7835051546391752'), 16), // 92.78%
                // Taker
                amountReceivedByTaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(2), 0),
                feePaidByTakerLeft: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
                feePaidByTakerRight: Web3Wrapper.toBaseUnitAmount(new BigNumber('92.8571428571428571'), 16), // 92.85%
            };
            await matchOrderTester.matchOrdersAndAssertEffectsAsync(
                signedOrderLeft,
                signedOrderRight,
                takerAddress,
                erc20BalancesByOwner,
                erc721TokenIdsByOwner,
                expectedTransferAmounts,
            );
        });

        it('Should give right maker a better buy price when rounding', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAddress: makerAddressLeft,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(16), 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(22), 0),
                feeRecipientAddress: feeRecipientAddressLeft,
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAddress: makerAddressRight,
                makerAssetData: assetDataUtils.encodeERC20AssetData(defaultERC20TakerAssetAddress),
                takerAssetData: assetDataUtils.encodeERC20AssetData(defaultERC20MakerAssetAddress),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(83), 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(49), 0),
                feeRecipientAddress: feeRecipientAddressRight,
            });
            // Note:
            // The correct price buy price for the right maker would yield (49/83) * 22 = 12.988 units
            // of the left maker asset. This gets rounded up to 13, giving the right maker a better price.
            // Note:
            //  The maker/taker fee percentage paid on the right order differs because
            //  they received different sale prices. The right maker pays a
            //  fee slightly lower than the right taker.
            const expectedTransferAmounts = {
                // Left Maker
                amountSoldByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(16), 0),
                amountBoughtByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(22), 0),
                feePaidByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
                // Right Maker
                amountSoldByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(22), 0),
                amountBoughtByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(13), 0),
                feePaidByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber('26.5060240963855421'), 16), // 26.506%
                // Taker
                amountReceivedByTaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(3), 0),
                feePaidByTakerLeft: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
                feePaidByTakerRight: Web3Wrapper.toBaseUnitAmount(new BigNumber('26.5306122448979591'), 16), // 26.531%
            };
            // Match signedOrderLeft with signedOrderRight
            await matchOrderTester.matchOrdersAndAssertEffectsAsync(
                signedOrderLeft,
                signedOrderRight,
                takerAddress,
                erc20BalancesByOwner,
                erc721TokenIdsByOwner,
                expectedTransferAmounts,
            );
        });

        it('Should give left maker a better sell price when rounding', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAddress: makerAddressLeft,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(12), 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(97), 0),
                feeRecipientAddress: feeRecipientAddressLeft,
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAddress: makerAddressRight,
                makerAssetData: assetDataUtils.encodeERC20AssetData(defaultERC20TakerAssetAddress),
                takerAssetData: assetDataUtils.encodeERC20AssetData(defaultERC20MakerAssetAddress),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(89), 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(1), 0),
                feeRecipientAddress: feeRecipientAddressRight,
            });
            // Note:
            //  The maker/taker fee percentage paid on the left order differs because
            //  they received different sale prices. The left maker pays a fee
            //  slightly lower than the left taker.
            const expectedTransferAmounts = {
                // Left Maker
                amountSoldByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(11), 0),
                amountBoughtByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(89), 0),
                feePaidByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber('91.6666666666666666'), 16), // 91.6%
                // Right Maker
                amountSoldByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(89), 0),
                amountBoughtByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(1), 0),
                feePaidByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
                // Taker
                amountReceivedByTaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 0),
                feePaidByTakerLeft: Web3Wrapper.toBaseUnitAmount(new BigNumber('91.7525773195876288'), 16), // 91.75%
                feePaidByTakerRight: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
            };
            // Match signedOrderLeft with signedOrderRight
            await matchOrderTester.matchOrdersAndAssertEffectsAsync(
                signedOrderLeft,
                signedOrderRight,
                takerAddress,
                erc20BalancesByOwner,
                erc721TokenIdsByOwner,
                expectedTransferAmounts,
            );
        });

        it('Should give right maker and right taker a favorable fee price when rounding', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAddress: makerAddressLeft,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(16), 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(22), 0),
                feeRecipientAddress: feeRecipientAddressLeft,
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAddress: makerAddressRight,
                makerAssetData: assetDataUtils.encodeERC20AssetData(defaultERC20TakerAssetAddress),
                takerAssetData: assetDataUtils.encodeERC20AssetData(defaultERC20MakerAssetAddress),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(83), 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(49), 0),
                feeRecipientAddress: feeRecipientAddressRight,
                makerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(10000), 0),
                takerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(10000), 0),
            });
            // Note:
            //  The maker/taker fee percentage paid on the right order differs because
            //  they received different sale prices. The right maker pays a
            //  fee slightly lower than the right taker.
            const expectedTransferAmounts = {
                // Left Maker
                amountSoldByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(16), 0),
                amountBoughtByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(22), 0),
                feePaidByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
                // Right Maker
                amountSoldByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(22), 0),
                amountBoughtByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(13), 0),
                feePaidByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(2650), 0), // 2650.6 rounded down tro 2650
                // Taker
                amountReceivedByTaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(3), 0),
                feePaidByTakerLeft: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
                feePaidByTakerRight: Web3Wrapper.toBaseUnitAmount(new BigNumber(2653), 0), // 2653.1 rounded down to 2653
            };
            // Match signedOrderLeft with signedOrderRight
            await matchOrderTester.matchOrdersAndAssertEffectsAsync(
                signedOrderLeft,
                signedOrderRight,
                takerAddress,
                erc20BalancesByOwner,
                erc721TokenIdsByOwner,
                expectedTransferAmounts,
            );
        });

        it('Should give left maker and left taker a favorable fee price when rounding', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAddress: makerAddressLeft,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(12), 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(97), 0),
                feeRecipientAddress: feeRecipientAddressLeft,
                makerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(10000), 0),
                takerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(10000), 0),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAddress: makerAddressRight,
                makerAssetData: assetDataUtils.encodeERC20AssetData(defaultERC20TakerAssetAddress),
                takerAssetData: assetDataUtils.encodeERC20AssetData(defaultERC20MakerAssetAddress),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(89), 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(1), 0),
                feeRecipientAddress: feeRecipientAddressRight,
            });
            // Note:
            //  The maker/taker fee percentage paid on the left order differs because
            //  they received different sale prices. The left maker pays a
            //  fee slightly lower than the left taker.
            const expectedTransferAmounts = {
                // Left Maker
                amountSoldByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(11), 0),
                amountBoughtByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(89), 0),
                feePaidByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(9166), 0), // 9166.6 rounded down to 9166
                // Right Maker
                amountSoldByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(89), 0),
                amountBoughtByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(1), 0),
                feePaidByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
                // Taker
                amountReceivedByTaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 0),
                feePaidByTakerLeft: Web3Wrapper.toBaseUnitAmount(new BigNumber(9175), 0), // 9175.2 rounded down to 9175
                feePaidByTakerRight: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
            };
            // Match signedOrderLeft with signedOrderRight
            await matchOrderTester.matchOrdersAndAssertEffectsAsync(
                signedOrderLeft,
                signedOrderRight,
                takerAddress,
                erc20BalancesByOwner,
                erc721TokenIdsByOwner,
                expectedTransferAmounts,
            );
        });

        it('Should transfer correct amounts when right order fill amount deviates from amount derived by `Exchange.fillOrder`', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAddress: makerAddressLeft,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(1000), 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(1005), 0),
                feeRecipientAddress: feeRecipientAddressLeft,
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAddress: makerAddressRight,
                makerAssetData: assetDataUtils.encodeERC20AssetData(defaultERC20TakerAssetAddress),
                takerAssetData: assetDataUtils.encodeERC20AssetData(defaultERC20MakerAssetAddress),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(2126), 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(1063), 0),
                feeRecipientAddress: feeRecipientAddressRight,
            });
            const expectedTransferAmounts = {
                // Left Maker
                amountSoldByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(1000), 0),
                amountBoughtByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(1005), 0),
                feePaidByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
                // Right Maker
                // Notes:
                //  i.
                //    The left order is fully filled by the right order, so the right maker must sell 1005 units of their asset to the left maker.
                //    By selling 1005 units, the right maker should theoretically receive 502.5 units of the left maker's asset.
                //    Since the transfer amount must be an integer, this value must be rounded down to 502 or up to 503.
                //  ii.
                //    If the right order were filled via `Exchange.fillOrder` the respective fill amounts would be [1004, 502] or [1006, 503].
                //    It follows that we cannot trigger a sale of 1005 units of the right maker's asset through `Exchange.fillOrder`.
                //  iii.
                //    For an optimal match, the algorithm must choose either [1005, 502] or [1005, 503] as fill amounts for the right order.
                //    The algorithm favors the right maker when the exchange rate must be rounded, so the final fill for the right order is [1005, 503].
                //  iv.
                //    The right maker fee differs from the right taker fee because their exchange rate differs.
                //    The right maker always receives the better exchange and fee price.
                amountSoldByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(1005), 0),
                amountBoughtByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(503), 0),
                feePaidByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber('47.2718720602069614'), 16), // 47.27%
                // Taker
                amountReceivedByTaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(497), 0),
                feePaidByTakerLeft: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
                feePaidByTakerRight: Web3Wrapper.toBaseUnitAmount(new BigNumber('47.3189087488240827'), 16), // 47.31%
            };
            // Match signedOrderLeft with signedOrderRight
            await matchOrderTester.matchOrdersAndAssertEffectsAsync(
                signedOrderLeft,
                signedOrderRight,
                takerAddress,
                erc20BalancesByOwner,
                erc721TokenIdsByOwner,
                expectedTransferAmounts,
            );
        });

        const reentrancyTest = (functionNames: string[]) => {
            _.forEach(functionNames, async (functionName: string, functionId: number) => {
                const description = `should not allow matchOrders to reenter the Exchange contract via ${functionName}`;
                it(description, async () => {
                    const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                        makerAssetData: assetDataUtils.encodeERC20AssetData(reentrantErc20Token.address),
                        makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(5), 18),
                        takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                    });
                    const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                        makerAddress: makerAddressRight,
                        takerAssetData: assetDataUtils.encodeERC20AssetData(reentrantErc20Token.address),
                        makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                        takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(2), 18),
                        feeRecipientAddress: feeRecipientAddressRight,
                    });
                    await web3Wrapper.awaitTransactionSuccessAsync(
                        await reentrantErc20Token.setCurrentFunction.sendTransactionAsync(functionId),
                        constants.AWAIT_TRANSACTION_MINED_MS,
                    );
                    await expectTransactionFailedAsync(
                        exchangeWrapper.matchOrdersAsync(signedOrderLeft, signedOrderRight, takerAddress),
                        RevertReason.TransferFailed,
                    );
                });
            });
        };
        describe('matchOrders reentrancy tests', () => reentrancyTest(constants.FUNCTIONS_WITH_MUTEX));

        it('should transfer the correct amounts when orders completely fill each other', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(5), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(2), 18),
            });
            // Match signedOrderLeft with signedOrderRight
            const expectedTransferAmounts = {
                // Left Maker
                amountSoldByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(5), 18),
                amountBoughtByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                feePaidByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
                // Right Maker
                amountSoldByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                amountBoughtByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(2), 18),
                feePaidByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
                // Taker
                amountReceivedByTaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(3), 18),
                feePaidByTakerLeft: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
                feePaidByTakerRight: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
            };
            await matchOrderTester.matchOrdersAndAssertEffectsAsync(
                signedOrderLeft,
                signedOrderRight,
                takerAddress,
                erc20BalancesByOwner,
                erc721TokenIdsByOwner,
                expectedTransferAmounts,
            );
        });

        it('should transfer the correct amounts when orders completely fill each other and taker doesnt take a profit', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(5), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(5), 18),
            });
            // Match signedOrderLeft with signedOrderRight
            const expectedTransferAmounts = {
                // Left Maker
                amountSoldByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(5), 18),
                amountBoughtByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                feePaidByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
                // Right Maker
                amountSoldByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                amountBoughtByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(5), 18),
                feePaidByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
                // Taker
                amountReceivedByTaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(0), 18),
                feePaidByTakerLeft: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
                feePaidByTakerRight: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
            };
            // Match signedOrderLeft with signedOrderRight
            await matchOrderTester.matchOrdersAndAssertEffectsAsync(
                signedOrderLeft,
                signedOrderRight,
                takerAddress,
                erc20BalancesByOwner,
                erc721TokenIdsByOwner,
                expectedTransferAmounts,
            );
        });

        it('should transfer the correct amounts when left order is completely filled and right order is partially filled', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(5), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(20), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(4), 18),
            });
            // Match signedOrderLeft with signedOrderRight
            const expectedTransferAmounts = {
                // Left Maker
                amountSoldByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(5), 18),
                amountBoughtByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                feePaidByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
                // Right Maker
                amountSoldByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                amountBoughtByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(2), 18),
                feePaidByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(50), 16), // 50%
                // Taker
                amountReceivedByTaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(3), 18),
                feePaidByTakerLeft: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
                feePaidByTakerRight: Web3Wrapper.toBaseUnitAmount(new BigNumber(50), 16), // 50%
            };
            // Match signedOrderLeft with signedOrderRight
            await matchOrderTester.matchOrdersAndAssertEffectsAsync(
                signedOrderLeft,
                signedOrderRight,
                takerAddress,
                erc20BalancesByOwner,
                erc721TokenIdsByOwner,
                expectedTransferAmounts,
            );
        });

        it('should transfer the correct amounts when right order is completely filled and left order is partially filled', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(50), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 18),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(2), 18),
            });
            // Match signedOrderLeft with signedOrderRight
            const expectedTransferAmounts = {
                // Left Maker
                amountSoldByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(5), 18),
                amountBoughtByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                feePaidByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 16), // 10%
                // Right Maker
                amountSoldByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                amountBoughtByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(2), 18),
                feePaidByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
                // Taker
                amountReceivedByTaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(3), 18),
                feePaidByTakerLeft: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 16), // 10%
                feePaidByTakerRight: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
            };
            // Match signedOrderLeft with signedOrderRight
            await matchOrderTester.matchOrdersAndAssertEffectsAsync(
                signedOrderLeft,
                signedOrderRight,
                takerAddress,
                erc20BalancesByOwner,
                erc721TokenIdsByOwner,
                expectedTransferAmounts,
            );
        });

        it('should transfer the correct amounts when consecutive calls are used to completely fill the left order', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(50), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 18),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(2), 18),
            });
            // Match orders
            let newERC20BalancesByOwner: ERC20BalancesByOwner;
            let newERC721TokenIdsByOwner: ERC721TokenIdsByOwner;
            const expectedTransferAmounts = {
                // Left Maker
                amountSoldByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(5), 18),
                amountBoughtByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                feePaidByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 16), // 10%
                // Right Maker
                amountSoldByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                amountBoughtByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(2), 18),
                feePaidByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
                // Taker
                amountReceivedByTaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(3), 18),
                feePaidByTakerLeft: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 16), // 10%
                feePaidByTakerRight: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
            };
            // prettier-ignore
            [
                newERC20BalancesByOwner,
                // tslint:disable-next-line:trailing-comma
                newERC721TokenIdsByOwner
            ] = await matchOrderTester.matchOrdersAndAssertEffectsAsync(
                signedOrderLeft,
                signedOrderRight,
                takerAddress,
                erc20BalancesByOwner,
                erc721TokenIdsByOwner,
                expectedTransferAmounts,
            );
            // Construct second right order
            // Note: This order needs makerAssetAmount=90/takerAssetAmount=[anything <= 45] to fully fill the right order.
            //       However, we use 100/50 to ensure a partial fill as we want to go down the "left fill"
            //       branch in the contract twice for this test.
            const signedOrderRight2 = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(50), 18),
            });
            // Match signedOrderLeft with signedOrderRight2
            const leftTakerAssetFilledAmount = signedOrderRight.makerAssetAmount;
            const rightTakerAssetFilledAmount = new BigNumber(0);
            const expectedTransferAmounts2 = {
                // Left Maker
                amountSoldByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(45), 18),
                amountBoughtByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(90), 18),
                feePaidByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(90), 16), // 90% (10% paid earlier)
                // Right Maker
                amountSoldByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(90), 18),
                amountBoughtByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(45), 18),
                feePaidByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(90), 16), // 90%
                // Taker
                amountReceivedByTaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(0), 18),
                feePaidByTakerLeft: Web3Wrapper.toBaseUnitAmount(new BigNumber(90), 16), // 90% (10% paid earlier)
                feePaidByTakerRight: Web3Wrapper.toBaseUnitAmount(new BigNumber(90), 16), // 90%
            };
            await matchOrderTester.matchOrdersAndAssertEffectsAsync(
                signedOrderLeft,
                signedOrderRight2,
                takerAddress,
                newERC20BalancesByOwner,
                newERC721TokenIdsByOwner,
                expectedTransferAmounts2,
                leftTakerAssetFilledAmount,
                rightTakerAssetFilledAmount,
            );
        });

        it('should transfer the correct amounts when consecutive calls are used to completely fill the right order', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(2), 18),
            });

            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(50), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 18),
            });
            // Match orders
            let newERC20BalancesByOwner: ERC20BalancesByOwner;
            let newERC721TokenIdsByOwner: ERC721TokenIdsByOwner;
            const expectedTransferAmounts = {
                // Left Maker
                amountSoldByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                amountBoughtByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(2), 18),
                feePaidByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
                // Right Maker
                amountSoldByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(2), 18),
                amountBoughtByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(4), 18),
                feePaidByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(4), 16), // 4%
                // Taker
                amountReceivedByTaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(6), 18),
                feePaidByTakerLeft: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
                feePaidByTakerRight: Web3Wrapper.toBaseUnitAmount(new BigNumber(4), 16), // 4%
            };
            // prettier-ignore
            [
                newERC20BalancesByOwner,
                // tslint:disable-next-line:trailing-comma
                newERC721TokenIdsByOwner
            ] = await matchOrderTester.matchOrdersAndAssertEffectsAsync(
                signedOrderLeft,
                signedOrderRight,
                takerAddress,
                erc20BalancesByOwner,
                erc721TokenIdsByOwner,
                expectedTransferAmounts,
            );

            // Create second left order
            // Note: This order needs makerAssetAmount=96/takerAssetAmount=48 to fully fill the right order.
            //       However, we use 100/50 to ensure a partial fill as we want to go down the "right fill"
            //       branch in the contract twice for this test.
            const signedOrderLeft2 = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(50), 18),
            });
            // Match signedOrderLeft2 with signedOrderRight
            const leftTakerAssetFilledAmount = new BigNumber(0);
            const takerAmountReceived = newERC20BalancesByOwner[takerAddress][defaultERC20MakerAssetAddress].minus(
                erc20BalancesByOwner[takerAddress][defaultERC20MakerAssetAddress],
            );
            const rightTakerAssetFilledAmount = signedOrderLeft.makerAssetAmount.minus(takerAmountReceived);
            const expectedTransferAmounts2 = {
                // Left Maker
                amountSoldByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(96), 18),
                amountBoughtByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(48), 18),
                feePaidByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(96), 16), // 96%
                // Right Maker
                amountSoldByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(48), 18),
                amountBoughtByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(96), 18),
                feePaidByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(96), 16), // 96%
                // Taker
                amountReceivedByTaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(0), 18),
                feePaidByTakerLeft: Web3Wrapper.toBaseUnitAmount(new BigNumber(96), 16), // 96%
                feePaidByTakerRight: Web3Wrapper.toBaseUnitAmount(new BigNumber(96), 16), // 96%
            };
            await matchOrderTester.matchOrdersAndAssertEffectsAsync(
                signedOrderLeft2,
                signedOrderRight,
                takerAddress,
                newERC20BalancesByOwner,
                newERC721TokenIdsByOwner,
                expectedTransferAmounts2,
                leftTakerAssetFilledAmount,
                rightTakerAssetFilledAmount,
            );
        });

        it('should transfer the correct amounts if fee recipient is the same across both matched orders', async () => {
            const feeRecipientAddress = feeRecipientAddressLeft;
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(5), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                feeRecipientAddress,
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(2), 18),
                feeRecipientAddress,
            });
            // Match orders
            const expectedTransferAmounts = {
                // Left Maker
                amountSoldByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(5), 18),
                amountBoughtByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                feePaidByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
                // Right Maker
                amountSoldByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                amountBoughtByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(2), 18),
                feePaidByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
                // Taker
                amountReceivedByTaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(3), 18),
                feePaidByTakerLeft: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
                feePaidByTakerRight: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
            };
            await matchOrderTester.matchOrdersAndAssertEffectsAsync(
                signedOrderLeft,
                signedOrderRight,
                takerAddress,
                erc20BalancesByOwner,
                erc721TokenIdsByOwner,
                expectedTransferAmounts,
            );
        });

        it('should transfer the correct amounts if taker is also the left order maker', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(5), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(2), 18),
            });
            // Match orders
            takerAddress = signedOrderLeft.makerAddress;
            const expectedTransferAmounts = {
                // Left Maker
                amountSoldByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(5), 18),
                amountBoughtByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                feePaidByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
                // Right Maker
                amountSoldByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                amountBoughtByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(2), 18),
                feePaidByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
                // Taker
                amountReceivedByTaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(3), 18),
                feePaidByTakerLeft: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
                feePaidByTakerRight: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
            };
            await matchOrderTester.matchOrdersAndAssertEffectsAsync(
                signedOrderLeft,
                signedOrderRight,
                takerAddress,
                erc20BalancesByOwner,
                erc721TokenIdsByOwner,
                expectedTransferAmounts,
            );
        });

        it('should transfer the correct amounts if taker is also the right order maker', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(5), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(2), 18),
            });
            // Match orders
            takerAddress = signedOrderRight.makerAddress;
            const expectedTransferAmounts = {
                // Left Maker
                amountSoldByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(5), 18),
                amountBoughtByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                feePaidByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
                // Right Maker
                amountSoldByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                amountBoughtByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(2), 18),
                feePaidByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
                // Taker
                amountReceivedByTaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(3), 18),
                feePaidByTakerLeft: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
                feePaidByTakerRight: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
            };
            await matchOrderTester.matchOrdersAndAssertEffectsAsync(
                signedOrderLeft,
                signedOrderRight,
                takerAddress,
                erc20BalancesByOwner,
                erc721TokenIdsByOwner,
                expectedTransferAmounts,
            );
        });

        it('should transfer the correct amounts if taker is also the left fee recipient', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(5), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(2), 18),
            });
            // Match orders
            takerAddress = feeRecipientAddressLeft;
            const expectedTransferAmounts = {
                // Left Maker
                amountSoldByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(5), 18),
                amountBoughtByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                feePaidByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
                // Right Maker
                amountSoldByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                amountBoughtByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(2), 18),
                feePaidByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
                // Taker
                amountReceivedByTaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(3), 18),
                feePaidByTakerLeft: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
                feePaidByTakerRight: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
            };
            await matchOrderTester.matchOrdersAndAssertEffectsAsync(
                signedOrderLeft,
                signedOrderRight,
                takerAddress,
                erc20BalancesByOwner,
                erc721TokenIdsByOwner,
                expectedTransferAmounts,
            );
        });

        it('should transfer the correct amounts if taker is also the right fee recipient', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(5), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(2), 18),
            });
            // Match orders
            takerAddress = feeRecipientAddressRight;
            const expectedTransferAmounts = {
                // Left Maker
                amountSoldByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(5), 18),
                amountBoughtByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                feePaidByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
                // Right Maker
                amountSoldByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                amountBoughtByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(2), 18),
                feePaidByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
                // Taker
                amountReceivedByTaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(3), 18),
                feePaidByTakerLeft: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
                feePaidByTakerRight: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
            };
            await matchOrderTester.matchOrdersAndAssertEffectsAsync(
                signedOrderLeft,
                signedOrderRight,
                takerAddress,
                erc20BalancesByOwner,
                erc721TokenIdsByOwner,
                expectedTransferAmounts,
            );
        });

        it('should transfer the correct amounts if left maker is the left fee recipient and right maker is the right fee recipient', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(5), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(2), 18),
            });
            // Match orders
            const expectedTransferAmounts = {
                // Left Maker
                amountSoldByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(5), 18),
                amountBoughtByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                feePaidByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
                // Right Maker
                amountSoldByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                amountBoughtByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(2), 18),
                feePaidByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
                // Taker
                amountReceivedByTaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(3), 18),
                feePaidByTakerLeft: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
                feePaidByTakerRight: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
            };
            await matchOrderTester.matchOrdersAndAssertEffectsAsync(
                signedOrderLeft,
                signedOrderRight,
                takerAddress,
                erc20BalancesByOwner,
                erc721TokenIdsByOwner,
                expectedTransferAmounts,
            );
        });

        it('Should throw if left order is not fillable', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(5), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(2), 18),
            });
            // Cancel left order
            await exchangeWrapper.cancelOrderAsync(signedOrderLeft, signedOrderLeft.makerAddress);
            // Match orders
            return expectTransactionFailedAsync(
                exchangeWrapper.matchOrdersAsync(signedOrderLeft, signedOrderRight, takerAddress),
                RevertReason.OrderUnfillable,
            );
        });

        it('Should throw if right order is not fillable', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(5), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(2), 18),
            });
            // Cancel right order
            await exchangeWrapper.cancelOrderAsync(signedOrderRight, signedOrderRight.makerAddress);
            // Match orders
            return expectTransactionFailedAsync(
                exchangeWrapper.matchOrdersAsync(signedOrderLeft, signedOrderRight, takerAddress),
                RevertReason.OrderUnfillable,
            );
        });

        it('should throw if there is not a positive spread', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(5), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 18),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(1), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(200), 18),
            });
            // Match orders
            return expectTransactionFailedAsync(
                exchangeWrapper.matchOrdersAsync(signedOrderLeft, signedOrderRight, takerAddress),
                RevertReason.NegativeSpreadRequired,
            );
        });

        it('should throw if the left maker asset is not equal to the right taker asset ', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(5), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                takerAssetData: assetDataUtils.encodeERC20AssetData(defaultERC20TakerAssetAddress),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(2), 18),
            });
            // Match orders
            return expectTransactionFailedAsync(
                exchangeWrapper.matchOrdersAsync(signedOrderLeft, signedOrderRight, takerAddress),
                // We are assuming assetData fields of the right order are the
                // reverse of the left order, rather than checking equality. This
                // saves a bunch of gas, but as a result if the assetData fields are
                // off then the failure ends up happening at signature validation
                RevertReason.InvalidOrderSignature,
            );
        });

        it('should throw if the right maker asset is not equal to the left taker asset', async () => {
            // Create orders to match
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                takerAssetData: assetDataUtils.encodeERC20AssetData(defaultERC20MakerAssetAddress),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(5), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(2), 18),
            });
            // Match orders
            return expectTransactionFailedAsync(
                exchangeWrapper.matchOrdersAsync(signedOrderLeft, signedOrderRight, takerAddress),
                RevertReason.InvalidOrderSignature,
            );
        });

        it('should transfer correct amounts when left order maker asset is an ERC721 token', async () => {
            // Create orders to match
            const erc721TokenToTransfer = erc721LeftMakerAssetIds[0];
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetData: assetDataUtils.encodeERC721AssetData(defaultERC721AssetAddress, erc721TokenToTransfer),
                makerAssetAmount: new BigNumber(1),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                takerAssetData: assetDataUtils.encodeERC721AssetData(defaultERC721AssetAddress, erc721TokenToTransfer),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                takerAssetAmount: new BigNumber(1),
            });
            // Match orders
            const expectedTransferAmounts = {
                // Left Maker
                amountSoldByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(1), 0),
                amountBoughtByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                feePaidByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
                // Right Maker
                amountSoldByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                amountBoughtByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(1), 0),
                feePaidByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
                // Taker
                amountReceivedByTaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(0), 18),
                feePaidByTakerLeft: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
                feePaidByTakerRight: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 50%
            };
            await matchOrderTester.matchOrdersAndAssertEffectsAsync(
                signedOrderLeft,
                signedOrderRight,
                takerAddress,
                erc20BalancesByOwner,
                erc721TokenIdsByOwner,
                expectedTransferAmounts,
            );
        });

        it('should transfer correct amounts when right order maker asset is an ERC721 token', async () => {
            // Create orders to match
            const erc721TokenToTransfer = erc721RightMakerAssetIds[0];
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                takerAssetData: assetDataUtils.encodeERC721AssetData(defaultERC721AssetAddress, erc721TokenToTransfer),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                takerAssetAmount: new BigNumber(1),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetData: assetDataUtils.encodeERC721AssetData(defaultERC721AssetAddress, erc721TokenToTransfer),
                makerAssetAmount: new BigNumber(1),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(8), 18),
            });
            // Match orders
            const expectedTransferAmounts = {
                // Left Maker
                amountSoldByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
                amountBoughtByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(1), 0),
                feePaidByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
                // Right Maker
                amountSoldByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(1), 0),
                amountBoughtByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(8), 18),
                feePaidByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
                // Taker
                amountReceivedByTaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(2), 18),
                feePaidByTakerLeft: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
                feePaidByTakerRight: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
            };
            await matchOrderTester.matchOrdersAndAssertEffectsAsync(
                signedOrderLeft,
                signedOrderRight,
                takerAddress,
                erc20BalancesByOwner,
                erc721TokenIdsByOwner,
                expectedTransferAmounts,
            );
        });
    });
}); // tslint:disable-line:max-file-line-count
