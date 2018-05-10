import { LogWithDecodedArgs, ZeroEx } from '0x.js';
import { BlockchainLifecycle } from '@0xproject/dev-utils';
import { BigNumber } from '@0xproject/utils';
import * as chai from 'chai';
import ethUtil = require('ethereumjs-util');
import * as _ from 'lodash';

import { DummyERC20TokenContract } from '../../src/contract_wrappers/generated/dummy_e_r_c20_token';
import { DummyERC721TokenContract } from '../../src/contract_wrappers/generated/dummy_e_r_c721_token';
import { ERC20ProxyContract } from '../../src/contract_wrappers/generated/e_r_c20_proxy';
import { ERC721ProxyContract } from '../../src/contract_wrappers/generated/e_r_c721_proxy';
import {
    CancelContractEventArgs,
    ExchangeContract,
    FillContractEventArgs,
} from '../../src/contract_wrappers/generated/exchange';
import { assetProxyUtils } from '../../src/utils/asset_proxy_utils';
import { constants } from '../../src/utils/constants';
import { crypto } from '../../src/utils/crypto';
import { ERC20Wrapper } from '../../src/utils/erc20_wrapper';
import { ERC721Wrapper } from '../../src/utils/erc721_wrapper';
import { ExchangeWrapper } from '../../src/utils/exchange_wrapper';
import { OrderFactory } from '../../src/utils/order_factory';
import { orderUtils } from '../../src/utils/order_utils';
import {
    AssetProxyId,
    ContractName,
    ERC20BalancesByOwner,
    ERC721TokenIdsByOwner,
    ExchangeStatus,
    SignedOrder,
    TransferAmountsByMatchOrders as TransferAmounts,
} from '../../src/utils/types';
import { chaiSetup } from '../utils/chai_setup';
import { deployer } from '../utils/deployer';
import { provider, web3Wrapper } from '../utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

export class MatchOrderTester {
    private _exchangeWrapper: ExchangeWrapper;
    private _erc20Wrapper: ERC20Wrapper;
    private _erc721Wrapper: ERC721Wrapper;

    /// @dev Calculates the expected balances of order makers, fee recipients, and the taker,
    ///      as a result of matching two orders.
    /// @param signedOrderLeft First matched order.
    /// @param signedOrderRight Second matched order.
    /// @param feeTokenAddress Address of ERC20 fee token.
    /// @param takerAddress Address of taker (the address who matched the two orders)
    /// @param erc20BalancesByOwner Current ERC20 balances.
    /// @param erc721TokenIdsByOwner Current ERC721 token owners.
    /// @param expectedTransferAmounts A struct containing the expected transfer amounts.
    /// @return Expected ERC20 balances & ERC721 token owners after orders have been matched.
    private static _calculateExpectedBalances(
        signedOrderLeft: SignedOrder,
        signedOrderRight: SignedOrder,
        feeTokenAddress: string,
        takerAddress: string,
        erc20BalancesByOwner: ERC20BalancesByOwner,
        erc721TokenIdsByOwner: ERC721TokenIdsByOwner,
        expectedTransferAmounts: TransferAmounts,
    ): [ERC20BalancesByOwner, ERC721TokenIdsByOwner] {
        const makerAddressLeft = signedOrderLeft.makerAddress;
        const makerAddressRight = signedOrderRight.makerAddress;
        const feeRecipientAddressLeft = signedOrderLeft.feeRecipientAddress;
        const feeRecipientAddressRight = signedOrderRight.feeRecipientAddress;
        // Operations are performed on copies of the balances
        const expectedNewERC20BalancesByOwner = _.cloneDeep(erc20BalancesByOwner);
        const expectedNewERC721TokenIdsByOwner = _.cloneDeep(erc721TokenIdsByOwner);
        // Left Maker Asset (Right Taker Asset)
        const makerAssetProxyIdLeft = assetProxyUtils.decodeProxyDataId(signedOrderLeft.makerAssetData);
        if (makerAssetProxyIdLeft === AssetProxyId.ERC20) {
            // Decode asset data
            const makerAssetAddressLeft = assetProxyUtils.decodeERC20ProxyData(signedOrderLeft.makerAssetData);
            const takerAssetAddressRight = makerAssetAddressLeft;
            // Left Maker
            expectedNewERC20BalancesByOwner[makerAddressLeft][makerAssetAddressLeft] = expectedNewERC20BalancesByOwner[
                makerAddressLeft
            ][makerAssetAddressLeft].minus(expectedTransferAmounts.amountSoldByLeftMaker);
            // Right Maker
            expectedNewERC20BalancesByOwner[makerAddressRight][
                takerAssetAddressRight
            ] = expectedNewERC20BalancesByOwner[makerAddressRight][takerAssetAddressRight].add(
                expectedTransferAmounts.amountReceivedByRightMaker,
            );
            // Taker
            expectedNewERC20BalancesByOwner[takerAddress][makerAssetAddressLeft] = expectedNewERC20BalancesByOwner[
                takerAddress
            ][makerAssetAddressLeft].add(expectedTransferAmounts.amountReceivedByTaker);
        } else if (makerAssetProxyIdLeft === AssetProxyId.ERC721) {
            // Decode asset data
            let makerAssetAddressLeft;
            let makerAssetIdLeft;
            [makerAssetAddressLeft, makerAssetIdLeft] = assetProxyUtils.decodeERC721ProxyData(
                signedOrderLeft.makerAssetData,
            );
            const takerAssetAddressRight = makerAssetAddressLeft;
            const takerAssetIdRight = makerAssetIdLeft;
            // Left Maker
            _.remove(expectedNewERC721TokenIdsByOwner[makerAddressLeft][makerAssetAddressLeft], makerAssetIdLeft);
            // Right Maker
            expectedNewERC721TokenIdsByOwner[makerAddressRight][takerAssetAddressRight].push(takerAssetIdRight);
            // Taker: Since there is only 1 asset transferred, the taker does not receive any of the left maker asset.
        }
        // Left Taker Asset (Right Maker Asset)
        // Note: This exchange is only between the order makers: the Taker does not receive any of the left taker asset.
        const takerAssetProxyIdLeft = assetProxyUtils.decodeProxyDataId(signedOrderLeft.takerAssetData);
        if (takerAssetProxyIdLeft === AssetProxyId.ERC20) {
            // Decode asset data
            const takerAssetAddressLeft = assetProxyUtils.decodeERC20ProxyData(signedOrderLeft.takerAssetData);
            const makerAssetAddressRight = takerAssetAddressLeft;
            // Left Maker
            expectedNewERC20BalancesByOwner[makerAddressLeft][takerAssetAddressLeft] = expectedNewERC20BalancesByOwner[
                makerAddressLeft
            ][takerAssetAddressLeft].add(expectedTransferAmounts.amountReceivedByLeftMaker);
            // Right Maker
            expectedNewERC20BalancesByOwner[makerAddressRight][
                makerAssetAddressRight
            ] = expectedNewERC20BalancesByOwner[makerAddressRight][makerAssetAddressRight].minus(
                expectedTransferAmounts.amountSoldByRightMaker,
            );
        } else if (takerAssetProxyIdLeft === AssetProxyId.ERC721) {
            // Decode asset data
            let makerAssetAddressRight;
            let makerAssetIdRight;
            [makerAssetAddressRight, makerAssetIdRight] = assetProxyUtils.decodeERC721ProxyData(
                signedOrderRight.makerAssetData,
            );
            const takerAssetAddressLeft = makerAssetAddressRight;
            const takerAssetIdLeft = makerAssetIdRight;
            // Right Maker
            _.remove(expectedNewERC721TokenIdsByOwner[makerAddressRight][makerAssetAddressRight], makerAssetIdRight);
            // Left Maker
            expectedNewERC721TokenIdsByOwner[makerAddressLeft][takerAssetAddressLeft].push(takerAssetIdLeft);
        }
        // Left Maker Fees
        expectedNewERC20BalancesByOwner[makerAddressLeft][feeTokenAddress] = expectedNewERC20BalancesByOwner[
            makerAddressLeft
        ][feeTokenAddress].minus(expectedTransferAmounts.feePaidByLeftMaker);
        // Right Maker Fees
        expectedNewERC20BalancesByOwner[makerAddressRight][feeTokenAddress] = expectedNewERC20BalancesByOwner[
            makerAddressRight
        ][feeTokenAddress].minus(expectedTransferAmounts.feePaidByRightMaker);
        // Taker Fees
        expectedNewERC20BalancesByOwner[takerAddress][feeTokenAddress] = expectedNewERC20BalancesByOwner[takerAddress][
            feeTokenAddress
        ].minus(expectedTransferAmounts.totalFeePaidByTaker);
        // Left Fee Recipient Fees
        expectedNewERC20BalancesByOwner[feeRecipientAddressLeft][feeTokenAddress] = expectedNewERC20BalancesByOwner[
            feeRecipientAddressLeft
        ][feeTokenAddress].add(expectedTransferAmounts.feeReceivedLeft);
        // Right Fee Recipient Fees
        expectedNewERC20BalancesByOwner[feeRecipientAddressRight][feeTokenAddress] = expectedNewERC20BalancesByOwner[
            feeRecipientAddressRight
        ][feeTokenAddress].add(expectedTransferAmounts.feeReceivedRight);

        return [expectedNewERC20BalancesByOwner, expectedNewERC721TokenIdsByOwner];
    }

    /// @dev Compares a pair of ERC20 balances and a pair of ERC721 token owners.
    /// @param expectedNewERC20BalancesByOwner Expected ERC20 balances.
    /// @param realERC20BalancesByOwner Actual ERC20 balances.
    /// @param expectedNewERC721TokenIdsByOwner Expected ERC721 token owners.
    /// @param realERC721TokenIdsByOwner Actual ERC20 token owners.
    /// @return True only if ERC20 balances match and ERC721 token owners match.
    private static _compareExpectedAndRealBalances(
        expectedNewERC20BalancesByOwner: ERC20BalancesByOwner,
        realERC20BalancesByOwner: ERC20BalancesByOwner,
        expectedNewERC721TokenIdsByOwner: ERC721TokenIdsByOwner,
        realERC721TokenIdsByOwner: ERC721TokenIdsByOwner,
    ) {
        // ERC20 Balances
        const erc20BalancesMatch = _.isEqual(expectedNewERC20BalancesByOwner, realERC20BalancesByOwner);
        if (!erc20BalancesMatch) {
            return false;
        }
        // ERC721 Token Ids
        const sortedExpectedNewERC721TokenIdsByOwner = _.mapValues(
            expectedNewERC721TokenIdsByOwner,
            tokenIdsByOwner => {
                _.mapValues(tokenIdsByOwner, tokenIds => {
                    _.sortBy(tokenIds);
                });
            },
        );
        const sortedNewERC721TokenIdsByOwner = _.mapValues(realERC721TokenIdsByOwner, tokenIdsByOwner => {
            _.mapValues(tokenIdsByOwner, tokenIds => {
                _.sortBy(tokenIds);
            });
        });
        const erc721TokenIdsMatch = _.isEqual(sortedExpectedNewERC721TokenIdsByOwner, sortedNewERC721TokenIdsByOwner);
        return erc721TokenIdsMatch;
    }

    /// @dev Constructs new MatchOrderTester.
    /// @param exchangeWrapper Used to call to the Exchange.
    /// @param erc20Wrapper Used to fetch ERC20 balances.
    /// @param erc721Wrapper Used to fetch ERC721 token owners.
    constructor(exchangeWrapper: ExchangeWrapper, erc20Wrapper: ERC20Wrapper, erc721Wrapper: ERC721Wrapper) {
        this._exchangeWrapper = exchangeWrapper;
        this._erc20Wrapper = erc20Wrapper;
        this._erc721Wrapper = erc721Wrapper;
    }

    /// @dev Matches two complementary orders and validates results.
    ///      Validation either succeeds or throws.
    /// @param signedOrderLeft First matched order.
    /// @param signedOrderRight Second matched order.
    /// @param feeTokenAddress Address of ERC20 fee token.
    /// @param takerAddress Address of taker (the address who matched the two orders)
    /// @param erc20BalancesByOwner Current ERC20 balances.
    /// @param erc721TokenIdsByOwner Current ERC721 token owners.
    /// @param initialTakerAssetFilledAmountLeft Current amount the left order has been filled.
    /// @param initialTakerAssetFilledAmountRight Current amount the right order has been filled.
    /// @return New ERC20 balances & ERC721 token owners.
    public async matchOrdersAndVerifyBalancesAsync(
        signedOrderLeft: SignedOrder,
        signedOrderRight: SignedOrder,
        feeTokenAddress: string,
        takerAddress: string,
        erc20BalancesByOwner: ERC20BalancesByOwner,
        erc721TokenIdsByOwner: ERC721TokenIdsByOwner,
        initialTakerAssetFilledAmountLeft?: BigNumber,
        initialTakerAssetFilledAmountRight?: BigNumber,
    ): Promise<[ERC20BalancesByOwner, ERC721TokenIdsByOwner]> {
        // Test setup & verify preconditions
        const makerAddressLeft = signedOrderLeft.makerAddress;
        const makerAddressRight = signedOrderRight.makerAddress;
        const feeRecipientAddressLeft = signedOrderLeft.feeRecipientAddress;
        const feeRecipientAddressRight = signedOrderRight.feeRecipientAddress;
        // Verify Left order preconditions
        const takerAssetFilledAmountBeforeLeft = await this._exchangeWrapper.getTakerAssetFilledAmountAsync(
            orderUtils.getOrderHashHex(signedOrderLeft),
        );
        const expectedLeftOrderFillAmoutBeforeMatch = initialTakerAssetFilledAmountLeft
            ? initialTakerAssetFilledAmountLeft
            : new BigNumber(0);
        expect(takerAssetFilledAmountBeforeLeft).to.be.bignumber.equal(expectedLeftOrderFillAmoutBeforeMatch);
        // Verify Right order preconditions
        const takerAssetFilledAmountBeforeRight = await this._exchangeWrapper.getTakerAssetFilledAmountAsync(
            orderUtils.getOrderHashHex(signedOrderRight),
        );
        const expectedRightOrderFillAmoutBeforeMatch = initialTakerAssetFilledAmountRight
            ? initialTakerAssetFilledAmountRight
            : new BigNumber(0);
        expect(takerAssetFilledAmountBeforeRight).to.be.bignumber.equal(expectedRightOrderFillAmoutBeforeMatch);
        // Match left & right orders
        await this._exchangeWrapper.matchOrdersAsync(signedOrderLeft, signedOrderRight, takerAddress);
        const newERC20BalancesByOwner = await this._erc20Wrapper.getBalancesAsync();
        const newERC721TokenIdsByOwner = await this._erc721Wrapper.getBalancesAsync();
        // Calculate expected balance changes
        const expectedTransferAmounts = await this._calculateExpectedTransferAmountsAsync(
            signedOrderLeft,
            signedOrderRight,
            expectedLeftOrderFillAmoutBeforeMatch,
            expectedRightOrderFillAmoutBeforeMatch,
        );
        let expectedERC20BalancesByOwner: ERC20BalancesByOwner;
        let expectedERC721TokenIdsByOwner: ERC721TokenIdsByOwner;
        [expectedERC20BalancesByOwner, expectedERC721TokenIdsByOwner] = MatchOrderTester._calculateExpectedBalances(
            signedOrderLeft,
            signedOrderRight,
            feeTokenAddress,
            takerAddress,
            erc20BalancesByOwner,
            erc721TokenIdsByOwner,
            expectedTransferAmounts,
        );
        // Assert our expected balances are equal to the actual balances
        const expectedBalancesMatchRealBalances = MatchOrderTester._compareExpectedAndRealBalances(
            expectedERC20BalancesByOwner,
            newERC20BalancesByOwner,
            expectedERC721TokenIdsByOwner,
            newERC721TokenIdsByOwner,
        );
        expect(expectedBalancesMatchRealBalances).to.be.true();
        return [newERC20BalancesByOwner, newERC721TokenIdsByOwner];
    }

    /// @dev Calculates expected transfer amounts between order makers, fee recipients, and
    ///      the taker when two orders are matched.
    /// @param signedOrderLeft First matched order.
    /// @param signedOrderRight Second matched order.
    /// @param expectedLeftOrderFillAmoutBeforeMatch How much we expect the left order has been filled, prior to matching orders.
    /// @param expectedRightOrderFillAmoutBeforeMatch How much we expect the right order has been filled, prior to matching orders.
    /// @return TransferAmounts A struct containing the expected transfer amounts.
    private async _calculateExpectedTransferAmountsAsync(
        signedOrderLeft: SignedOrder,
        signedOrderRight: SignedOrder,
        expectedLeftOrderFillAmoutBeforeMatch: BigNumber,
        expectedRightOrderFillAmoutBeforeMatch: BigNumber,
    ): Promise<TransferAmounts> {
        let amountBoughtByLeftMaker = await this._exchangeWrapper.getTakerAssetFilledAmountAsync(
            orderUtils.getOrderHashHex(signedOrderLeft),
        );
        amountBoughtByLeftMaker = amountBoughtByLeftMaker.minus(expectedLeftOrderFillAmoutBeforeMatch);
        const amountSoldByLeftMaker = amountBoughtByLeftMaker
            .times(signedOrderLeft.makerAssetAmount)
            .dividedToIntegerBy(signedOrderLeft.takerAssetAmount);
        const amountReceivedByRightMaker = amountBoughtByLeftMaker
            .times(signedOrderRight.takerAssetAmount)
            .dividedToIntegerBy(signedOrderRight.makerAssetAmount);
        const amountReceivedByTaker = amountSoldByLeftMaker.minus(amountReceivedByRightMaker);
        let amountBoughtByRightMaker = await this._exchangeWrapper.getTakerAssetFilledAmountAsync(
            orderUtils.getOrderHashHex(signedOrderRight),
        );
        amountBoughtByRightMaker = amountBoughtByRightMaker.minus(expectedRightOrderFillAmoutBeforeMatch);
        const amountSoldByRightMaker = amountBoughtByRightMaker
            .times(signedOrderRight.makerAssetAmount)
            .dividedToIntegerBy(signedOrderRight.takerAssetAmount);
        const amountReceivedByLeftMaker = amountSoldByRightMaker;
        const feePaidByLeftMaker = signedOrderLeft.makerFee
            .times(amountSoldByLeftMaker)
            .dividedToIntegerBy(signedOrderLeft.makerAssetAmount);
        const feePaidByRightMaker = signedOrderRight.makerFee
            .times(amountSoldByRightMaker)
            .dividedToIntegerBy(signedOrderRight.makerAssetAmount);
        const feePaidByTakerLeft = signedOrderLeft.takerFee
            .times(amountSoldByLeftMaker)
            .dividedToIntegerBy(signedOrderLeft.makerAssetAmount);
        const feePaidByTakerRight = signedOrderRight.takerFee
            .times(amountSoldByRightMaker)
            .dividedToIntegerBy(signedOrderRight.makerAssetAmount);
        const totalFeePaidByTaker = feePaidByTakerLeft.add(feePaidByTakerRight);
        const feeReceivedLeft = feePaidByLeftMaker.add(feePaidByTakerLeft);
        const feeReceivedRight = feePaidByRightMaker.add(feePaidByTakerRight);
        // Return values
        const expectedTransferAmounts = {
            // Left Maker
            amountBoughtByLeftMaker,
            amountSoldByLeftMaker,
            amountReceivedByLeftMaker,
            feePaidByLeftMaker,
            // Right Maker
            amountBoughtByRightMaker,
            amountSoldByRightMaker,
            amountReceivedByRightMaker,
            feePaidByRightMaker,
            // Taker
            amountReceivedByTaker,
            feePaidByTakerLeft,
            feePaidByTakerRight,
            totalFeePaidByTaker,
            // Fee Recipients
            feeReceivedLeft,
            feeReceivedRight,
        };
        return expectedTransferAmounts;
    }
}
