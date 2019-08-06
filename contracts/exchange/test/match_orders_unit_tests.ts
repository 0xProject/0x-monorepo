import {
    artifacts as assetProxyArtifacts,
    ERC1155ProxyContract,
    ERC1155ProxyWrapper,
    ERC20ProxyContract,
    ERC20Wrapper,
    ERC721ProxyContract,
    ERC721Wrapper,
    MultiAssetProxyContract,
} from '@0x/contracts-asset-proxy';
import { ERC1155Contract as ERC1155TokenContract, Erc1155Wrapper as ERC1155Wrapper } from '@0x/contracts-erc1155';
import { DummyERC20TokenContract } from '@0x/contracts-erc20';
import { DummyERC721TokenContract } from '@0x/contracts-erc721';
import { ReferenceFunctions as ExchangeLibsReferenceFunctions } from '@0x/contracts-exchange-libs';
import {
    blockchainTests,
    chaiSetup,
    constants,
    describe,
    OrderFactory,
    orderUtils,
    provider,
    txDefaults,
    web3Wrapper,
} from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { assetDataUtils, ExchangeRevertErrors, orderHashUtils } from '@0x/order-utils';
import { OrderWithoutDomain, OrderStatus, SignedOrder } from '@0x/types';
import { BigNumber, providerUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as chai from 'chai';
import * as _ from 'lodash';

import {
    artifacts,
    constants as exchangeConstants,
    ExchangeContract,
    ExchangeWrapper,
    ReentrantERC20TokenContract,
    ReferenceFunctions,
    TestMatchOrdersContract,
} from '../src';
import { calculateCompleteFillBoth, calculateCompleteRightFill } from '../src/reference_functions';

import { MatchOrderTester, TokenBalances } from './utils/match_order_tester';

// Reduce the number of tokens to deploy to speed up tests, since we don't need
// so many.
constants.NUM_DUMMY_ERC721_TO_DEPLOY = 1;
constants.NUM_DUMMY_ERC1155_CONTRACTS_TO_DEPLOY = 1;

/**
 * Tests the _calculateCompleteFillBoth function with the provided inputs by making a call
 * to the provided matchOrders contract's externalCalculateCompleteFillBoth function with the
 * provided inputs and asserting that the resultant struct is correct.
 * @param matchOrders The TestMatchOrders contract object that should be used to make the call to
 *                    the smart contract.
 * @param leftMakerAssetAmountRemaining The left maker asset remaining field for the function call.
 * @param leftTakerAssetAmountRemaining The left taker asset remaining field for the function call.
 * @param rightMakerAssetAmountRemaining The right maker asset remaining field for the function call.
 * @param rightTakerAssetAmountRemaining The right taker asset remaining field for the function call.
 */
async function testCalculateCompleteFillBothAsync(
    matchOrders: TestMatchOrdersContract,
    args: BigNumber[],
): Promise<void> {
    // Ensure that the correct number of arguments were provided.
    expect(args.length).to.be.eq(4);

    // Get the expected matched fill results from calling the reference function.
    const expectedMatchedFillResults = calculateCompleteFillBoth(
        args[0],
        args[1],
        args[2],
        args[3],
    );

    // Get the resultant matched fill results from the call to _calculateCompleteFillBoth.
    const actualMatchedFillResults = await matchOrders.externalCalculateCompleteFillBoth.callAsync(
        args[0],
        args[1],
        args[2],
        args[3],
    );

    expect(actualMatchedFillResults).to.be.deep.eq(expectedMatchedFillResults);
}

/**
 * Tests the _calculateCompleteRightFill function with the provided inputs by making a call
 * to the provided matchOrders contract's externalCalculateCompleteRightFill function with the
 * provided inputs and asserting that the resultant struct is correct.
 * @param matchOrders The TestMatchOrders contract object that should be used to make the call to
 *                    the smart contract.
 */
async function testCalculateCompleteRightFillAsync(
    matchOrders: TestMatchOrdersContract,
    leftOrder: OrderWithoutDomain,
    args: BigNumber[],
): Promise<void> {
    // Ensure that the correct number of arguments were provided.
    expect(args.length).to.be.eq(2);

    // Get the expected matched fill results from calling the reference function.
    const expectedMatchedFillResults = calculateCompleteRightFill(
        leftOrder,
        args[0],
        args[1],
    );

    // Get the resultant matched fill results from the call to _calculateCompleteRightFill.
    const actualMatchedFillResults = await matchOrders.publicCalculateCompleteRightFill.callAsync(
        leftOrder,
        args[0],
        args[1],
    );

    expect(actualMatchedFillResults).to.be.deep.eq(expectedMatchedFillResults);
}

chaiSetup.configure();
const expect = chai.expect;

blockchainTests.resets.only('MatchOrders Tests', ({ web3Wrapper, txDefaults }) => {
    let chainId: number;
    let makerAddressLeft: string;
    let makerAddressRight: string;
    let owner: string;
    let takerAddress: string;
    let feeRecipientAddressLeft: string;
    let feeRecipientAddressRight: string;

    let erc20Tokens: DummyERC20TokenContract[];
    let erc721Token: DummyERC721TokenContract;
    let erc1155Token: ERC1155TokenContract;
    let reentrantErc20Token: ReentrantERC20TokenContract;
    let exchange: ExchangeContract;
    let erc20Proxy: ERC20ProxyContract;
    let erc721Proxy: ERC721ProxyContract;
    let erc1155Proxy: ERC1155ProxyContract;
    let erc1155ProxyWrapper: ERC1155ProxyWrapper;

    let exchangeWrapper: ExchangeWrapper;
    let erc20Wrapper: ERC20Wrapper;
    let erc721Wrapper: ERC721Wrapper;
    let erc1155Wrapper: ERC1155Wrapper;
    let orderFactoryLeft: OrderFactory;
    let orderFactoryRight: OrderFactory;

    let tokenBalances: TokenBalances;

    let defaultERC20MakerAssetAddress: string;
    let defaultERC20TakerAssetAddress: string;
    let defaultERC721AssetAddress: string;
    let defaultERC1155AssetAddress: string;
    let defaultFeeTokenAddress: string;

    let matchOrders: TestMatchOrdersContract;

    before(async () => {
        // Get the chain ID.
        chainId = await providerUtils.getChainIdAsync(provider);
        // Create accounts
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        const usedAddresses = ([
            owner,
            makerAddressLeft,
            makerAddressRight,
            takerAddress,
            feeRecipientAddressLeft,
            feeRecipientAddressRight,
        ] = accounts);
        const addressesWithBalances = usedAddresses.slice(1);
        // Create wrappers
        erc20Wrapper = new ERC20Wrapper(provider, addressesWithBalances, owner);
        erc721Wrapper = new ERC721Wrapper(provider, addressesWithBalances, owner);
        erc1155ProxyWrapper = new ERC1155ProxyWrapper(provider, addressesWithBalances, owner);
        // Deploy ERC20 token & ERC20 proxy
        const numDummyErc20ToDeploy = 4;
        erc20Tokens = await erc20Wrapper.deployDummyTokensAsync(numDummyErc20ToDeploy, constants.DUMMY_TOKEN_DECIMALS);
        erc20Proxy = await erc20Wrapper.deployProxyAsync();
        await erc20Wrapper.setBalancesAndAllowancesAsync();
        // Deploy ERC721 token and proxy
        [erc721Token] = await erc721Wrapper.deployDummyTokensAsync();
        erc721Proxy = await erc721Wrapper.deployProxyAsync();
        await erc721Wrapper.setBalancesAndAllowancesAsync();
        // Deploy ERC1155 token and proxy
        [erc1155Wrapper] = await erc1155ProxyWrapper.deployDummyContractsAsync();
        erc1155Token = erc1155Wrapper.getContract();
        erc1155Proxy = await erc1155ProxyWrapper.deployProxyAsync();
        await erc1155ProxyWrapper.setBalancesAndAllowancesAsync();
        // Deploy MultiAssetProxy.
        const multiAssetProxyContract = await MultiAssetProxyContract.deployFrom0xArtifactAsync(
            assetProxyArtifacts.MultiAssetProxy,
            provider,
            txDefaults,
        );
        // Depoy exchange
        exchange = await ExchangeContract.deployFrom0xArtifactAsync(
            artifacts.Exchange,
            provider,
            txDefaults,
            new BigNumber(chainId),
        );
        exchangeWrapper = new ExchangeWrapper(exchange, provider);
        await exchangeWrapper.registerAssetProxyAsync(erc20Proxy.address, owner);
        await exchangeWrapper.registerAssetProxyAsync(erc721Proxy.address, owner);
        await exchangeWrapper.registerAssetProxyAsync(erc1155Proxy.address, owner);
        await exchangeWrapper.registerAssetProxyAsync(multiAssetProxyContract.address, owner);
        // Authorize proxies.
        await erc20Proxy.addAuthorizedAddress.awaitTransactionSuccessAsync(
            exchange.address,
            { from: owner },
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
        await erc721Proxy.addAuthorizedAddress.awaitTransactionSuccessAsync(
            exchange.address,
            { from: owner },
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
        await erc1155Proxy.addAuthorizedAddress.awaitTransactionSuccessAsync(
            exchange.address,
            { from: owner },
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
        await multiAssetProxyContract.addAuthorizedAddress.awaitTransactionSuccessAsync(
            exchange.address,
            { from: owner },
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
        await erc20Proxy.addAuthorizedAddress.awaitTransactionSuccessAsync(
            multiAssetProxyContract.address,
            { from: owner },
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
        await erc721Proxy.addAuthorizedAddress.awaitTransactionSuccessAsync(
            multiAssetProxyContract.address,
            { from: owner },
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
        await erc1155Proxy.addAuthorizedAddress.awaitTransactionSuccessAsync(
            multiAssetProxyContract.address,
            { from: owner },
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
        await multiAssetProxyContract.registerAssetProxy.awaitTransactionSuccessAsync(
            erc20Proxy.address,
            { from: owner },
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
        await multiAssetProxyContract.registerAssetProxy.awaitTransactionSuccessAsync(
            erc721Proxy.address,
            { from: owner },
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
        await multiAssetProxyContract.registerAssetProxy.awaitTransactionSuccessAsync(
            erc1155Proxy.address,
            { from: owner },
            constants.AWAIT_TRANSACTION_MINED_MS,
        );

        reentrantErc20Token = await ReentrantERC20TokenContract.deployFrom0xArtifactAsync(
            artifacts.ReentrantERC20Token,
            provider,
            txDefaults,
            exchange.address,
        );

        // Set default addresses
        defaultERC20MakerAssetAddress = erc20Tokens[0].address;
        defaultERC20TakerAssetAddress = erc20Tokens[1].address;
        defaultFeeTokenAddress = erc20Tokens[2].address;
        defaultERC721AssetAddress = erc721Token.address;
        defaultERC1155AssetAddress = erc1155Token.address;
        const domain = {
            verifyingContractAddress: exchange.address,
            chainId,
        };
        // Create default order parameters
        const defaultOrderParamsLeft = {
            ...constants.STATIC_ORDER_PARAMS,
            makerAddress: makerAddressLeft,
            makerAssetData: assetDataUtils.encodeERC20AssetData(defaultERC20MakerAssetAddress),
            takerAssetData: assetDataUtils.encodeERC20AssetData(defaultERC20TakerAssetAddress),
            makerFeeAssetData: assetDataUtils.encodeERC20AssetData(defaultFeeTokenAddress),
            takerFeeAssetData: assetDataUtils.encodeERC20AssetData(defaultFeeTokenAddress),
            feeRecipientAddress: feeRecipientAddressLeft,
            domain,
        };
        const defaultOrderParamsRight = {
            ...constants.STATIC_ORDER_PARAMS,
            makerAddress: makerAddressRight,
            makerAssetData: assetDataUtils.encodeERC20AssetData(defaultERC20TakerAssetAddress),
            takerAssetData: assetDataUtils.encodeERC20AssetData(defaultERC20MakerAssetAddress),
            makerFeeAssetData: assetDataUtils.encodeERC20AssetData(defaultFeeTokenAddress),
            takerFeeAssetData: assetDataUtils.encodeERC20AssetData(defaultFeeTokenAddress),
            feeRecipientAddress: feeRecipientAddressRight,
            domain,
        };
        const privateKeyLeft = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(makerAddressLeft)];
        orderFactoryLeft = new OrderFactory(privateKeyLeft, defaultOrderParamsLeft);
        const privateKeyRight = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(makerAddressRight)];
        orderFactoryRight = new OrderFactory(privateKeyRight, defaultOrderParamsRight);

        // Deploy the TestMatchOrders contract
        matchOrders = await TestMatchOrdersContract.deployFrom0xArtifactAsync(
            artifacts.TestMatchOrders,
            provider,
            txDefaults,
        );
    });

    describe('_assertValidMatch', () => {
        it('should revert if the prices of the left order is less than the price of the right order', async () => {
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(49, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(100, 18),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(100, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(50, 18),
            });
            const orderHashHexLeft = orderHashUtils.getOrderHashHex(signedOrderLeft);
            const orderHashHexRight = orderHashUtils.getOrderHashHex(signedOrderRight);
            const expectedError = new ExchangeRevertErrors.NegativeSpreadError(orderHashHexLeft, orderHashHexRight);
            const tx = matchOrders.publicAssertValidMatch.callAsync(signedOrderLeft, signedOrderRight);
            expect(tx).to.revertWith(expectedError);
        });

        it('should revert if the prices of the left and right orders are equal', async () => {
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(49, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(100, 18),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(100, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(50, 18),
            });
            const orderHashHexLeft = orderHashUtils.getOrderHashHex(signedOrderLeft);
            const orderHashHexRight = orderHashUtils.getOrderHashHex(signedOrderRight);
            const expectedError = new ExchangeRevertErrors.NegativeSpreadError(orderHashHexLeft, orderHashHexRight);
            const tx = matchOrders.publicAssertValidMatch.callAsync(signedOrderLeft, signedOrderRight);
            expect(tx).to.revertWith(expectedError);
        });

        it('should succeed if the price of the left order is higher than the price of the right', async () => {
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(50, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(100, 18),
            });
            const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(100, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(49, 18),
            });
            await matchOrders.publicAssertValidMatch.callAsync(signedOrderLeft, signedOrderRight)
        });
    });

    describe('_calculateMatchedFillResults', () => {
        // FIXME - Test case 2 and verify that it is correctly hitting case 1 and 3.
        // FIXME - Test the profit calculations for all three cases
    });

    describe('_calculateCompleteFillBoth', () => {
        it('should assign everything to zero if all inputs are zero', async () => {
            await testCalculateCompleteFillBothAsync(
                matchOrders,
                [0, 0, 0, 0].map(value => new BigNumber(value)),
            );
        });

        it('should correctly update the fillResults with nonzero input', async () => {
            await testCalculateCompleteFillBothAsync(
                matchOrders,
                [17, 98, 75, 13].map(value => new BigNumber(value)),
            );
        });

        it('should correctly update the fillResults with nonzero input', async () => {
            await testCalculateCompleteFillBothAsync(
                matchOrders,
                [
                    5,
                    10,
                    10,
                    5,
                ].map(value => new BigNumber(value)),
            );
        });

        it('should correctly update the fillResults with nonzero input', async () => {
            await testCalculateCompleteFillBothAsync(
                matchOrders,
                [
                    Web3Wrapper.toBaseUnitAmount(5, 18),
                    Web3Wrapper.toBaseUnitAmount(10, 18),
                    Web3Wrapper.toBaseUnitAmount(10, 18),
                    Web3Wrapper.toBaseUnitAmount(5, 18),
                ].map(value => new BigNumber(value)),
            );
        });

        it('should correctly update the fillResults with nonzero input', async () => {
            await testCalculateCompleteFillBothAsync(
                matchOrders,
                [
                    Web3Wrapper.toBaseUnitAmount(5, 18),
                    Web3Wrapper.toBaseUnitAmount(10, 18),
                    Web3Wrapper.toBaseUnitAmount(10, 18),
                    Web3Wrapper.toBaseUnitAmount(2, 18),
                ].map(value => new BigNumber(value)),
            );
        });
    });

    describe('_calculateCompleteRightFill', () => {
        /**
         * NOTE(jalextowle): These test cases actually cover all code branches of _calculateCompleteRightFill (in
         * fact any one of these test cases provide 100% coverage), but they do not verify that _safeGetPartialAmountCeil
         * and _safeGetPartialAmountFloor revert appropriately. Keeping in the spirit of unit testing, these functions
         * are unit tested to ensure that they exhibit the correct behavior in a more isolated setting.
         */

        it('should correctly calculate the complete right fill', async () => {
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAddress: makerAddressLeft,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(17, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(98, 0),
                feeRecipientAddress: feeRecipientAddressLeft,
            });
            await testCalculateCompleteRightFillAsync(
                matchOrders,
                signedOrderLeft,
                [
                    Web3Wrapper.toBaseUnitAmount(75, 0),
                    Web3Wrapper.toBaseUnitAmount(13, 0),
                ],
            );
        });

        it('should correctly calculate the complete right fill', async () => {
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAddress: makerAddressLeft,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(12, 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(97, 0),
                feeRecipientAddress: feeRecipientAddressLeft,
            });
            await testCalculateCompleteRightFillAsync(
                matchOrders,
                signedOrderLeft,
                [
                    Web3Wrapper.toBaseUnitAmount(89, 0),
                    Web3Wrapper.toBaseUnitAmount(1, 0),
                ],
            );
        });

        it('should correctly calculate the complete right fill', async () => {
            const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
                makerAddress: makerAddressLeft,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(50, 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(100, 18),
                feeRecipientAddress: feeRecipientAddressLeft,
            });
            await testCalculateCompleteRightFillAsync(
                matchOrders,
                signedOrderLeft,
                [
                    Web3Wrapper.toBaseUnitAmount(10, 18),
                    Web3Wrapper.toBaseUnitAmount(2, 18),
                ],
            );
        });
    });

    describe('_settleMatchedOrders', () => {
        // FIXME -
    });
});
// tslint:disable-line:max-file-line-count
