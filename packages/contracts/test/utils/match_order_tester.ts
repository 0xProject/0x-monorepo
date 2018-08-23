import { assetDataUtils, orderHashUtils } from '@0xproject/order-utils';
import { AssetProxyId, SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import * as chai from 'chai';
import * as _ from 'lodash';

import { TransactionReceiptWithDecodedLogs } from '../../../../node_modules/ethereum-types';

import { chaiSetup } from './chai_setup';
import { ERC20Wrapper } from './erc20_wrapper';
import { ERC721Wrapper } from './erc721_wrapper';
import { ExchangeWrapper } from './exchange_wrapper';
import {
    ERC20BalancesByOwner,
    ERC721TokenIdsByOwner,
    OrderInfo,
    OrderStatus,
    TransferAmountsByMatchOrders as TransferAmounts,
} from './types';

chaiSetup.configure();
const expect = chai.expect;

export class MatchOrderTester {
    private readonly _exchangeWrapper: ExchangeWrapper;
    private readonly _erc20Wrapper: ERC20Wrapper;
    private readonly _erc721Wrapper: ERC721Wrapper;
    private readonly _feeTokenAddress: string;
    /// @dev Calculates expected transfer amounts between order makers, fee recipients, and
    ///      the taker when two orders are matched.
    /// @param signedOrderLeft First matched order.
    /// @param signedOrderRight Second matched order.
    /// @param orderTakerAssetFilledAmountLeft How much left order has been filled, prior to matching orders.
    /// @param orderTakerAssetFilledAmountRight How much the right order has been filled, prior to matching orders.
    /// @return TransferAmounts A struct containing the expected transfer amounts.
    private static async _verifyLogsAsync(
        signedOrderLeft: SignedOrder,
        signedOrderRight: SignedOrder,
        transactionReceipt: TransactionReceiptWithDecodedLogs,
        takerAddress: string,
        expectedTransferAmounts: TransferAmounts,
    ): Promise<void> {
        // Parse logs
        expect(transactionReceipt.logs.length, 'Checking number of logs').to.be.equal(2);
        // First log is for left fill
        const leftLog = (transactionReceipt.logs[0] as any) as {
            args: {
                makerAddress: string;
                takerAddress: string;
                makerAssetFilledAmount: string;
                takerAssetFilledAmount: string;
                makerFeePaid: string;
                takerFeePaid: string;
            };
        };
        expect(leftLog.args.makerAddress, 'Checking logged maker address of left order').to.be.equal(
            signedOrderLeft.makerAddress,
        );
        expect(leftLog.args.takerAddress, 'Checking logged taker address of right order').to.be.equal(takerAddress);
        const amountBoughtByLeftMaker = new BigNumber(leftLog.args.takerAssetFilledAmount);
        const amountSoldByLeftMaker = new BigNumber(leftLog.args.makerAssetFilledAmount);
        const feePaidByLeftMaker = new BigNumber(leftLog.args.makerFeePaid);
        const feePaidByTakerLeft = new BigNumber(leftLog.args.takerFeePaid);
        // Second log is for right fill
        const rightLog = (transactionReceipt.logs[1] as any) as {
            args: {
                makerAddress: string;
                takerAddress: string;
                makerAssetFilledAmount: string;
                takerAssetFilledAmount: string;
                makerFeePaid: string;
                takerFeePaid: string;
            };
        };
        expect(rightLog.args.makerAddress, 'Checking logged maker address of right order').to.be.equal(
            signedOrderRight.makerAddress,
        );
        expect(rightLog.args.takerAddress, 'Checking loggerd taker address of right order').to.be.equal(takerAddress);
        const amountBoughtByRightMaker = new BigNumber(rightLog.args.takerAssetFilledAmount);
        const amountSoldByRightMaker = new BigNumber(rightLog.args.makerAssetFilledAmount);
        const feePaidByRightMaker = new BigNumber(rightLog.args.makerFeePaid);
        const feePaidByTakerRight = new BigNumber(rightLog.args.takerFeePaid);
        // Derive amount received by taker
        const amountReceivedByTaker = amountSoldByLeftMaker.sub(amountBoughtByRightMaker);
        // Verify log values - left order
        expect(
            expectedTransferAmounts.amountBoughtByLeftMaker,
            'Checking logged amount bought by left maker',
        ).to.be.bignumber.equal(amountBoughtByLeftMaker);
        expect(
            expectedTransferAmounts.amountSoldByLeftMaker,
            'Checking logged amount sold by left maker',
        ).to.be.bignumber.equal(amountSoldByLeftMaker);
        expect(
            expectedTransferAmounts.feePaidByLeftMaker,
            'Checking logged fee paid by left maker',
        ).to.be.bignumber.equal(feePaidByLeftMaker);
        expect(
            expectedTransferAmounts.feePaidByTakerLeft,
            'Checking logged fee paid on left order by taker',
        ).to.be.bignumber.equal(feePaidByTakerLeft);
        // Verify log values - right order
        expect(
            expectedTransferAmounts.amountBoughtByRightMaker,
            'Checking logged amount bought by right maker',
        ).to.be.bignumber.equal(amountBoughtByRightMaker);
        expect(
            expectedTransferAmounts.amountSoldByRightMaker,
            'Checking logged amount sold by right maker',
        ).to.be.bignumber.equal(amountSoldByRightMaker);
        expect(
            expectedTransferAmounts.feePaidByRightMaker,
            'Checking logged fee paid by right maker',
        ).to.be.bignumber.equal(feePaidByRightMaker);
        expect(
            expectedTransferAmounts.feePaidByTakerRight,
            'Checking logged fee paid on right order by taker',
        ).to.be.bignumber.equal(feePaidByTakerRight);
        // Verify derived amount received by taker
        expect(
            expectedTransferAmounts.amountReceivedByTaker,
            'Checking logged amount received by taker',
        ).to.be.bignumber.equal(amountReceivedByTaker);
    }
    /// @dev Compares a pair of ERC20 balances and a pair of ERC721 token owners.
    /// @param expectedNewERC20BalancesByOwner Expected ERC20 balances.
    /// @param realERC20BalancesByOwner Actual ERC20 balances.
    /// @param expectedNewERC721TokenIdsByOwner Expected ERC721 token owners.
    /// @param realERC721TokenIdsByOwner Actual ERC20 token owners.
    /// @return True only if ERC20 balances match and ERC721 token owners match.
    private static async _verifyAllKnownBalancesAsync(
        expectedNewERC20BalancesByOwner: ERC20BalancesByOwner,
        realERC20BalancesByOwner: ERC20BalancesByOwner,
        expectedNewERC721TokenIdsByOwner: ERC721TokenIdsByOwner,
        realERC721TokenIdsByOwner: ERC721TokenIdsByOwner,
    ): Promise<void> {
        // ERC20 Balances
        const areERC20BalancesEqual = _.isEqual(expectedNewERC20BalancesByOwner, realERC20BalancesByOwner);
        expect(areERC20BalancesEqual, 'Checking all known ERC20 account balances').to.be.true();
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
        const areERC721TokenIdsEqual = _.isEqual(
            sortedExpectedNewERC721TokenIdsByOwner,
            sortedNewERC721TokenIdsByOwner,
        );
        expect(areERC721TokenIdsEqual, 'Checking all known ERC721 account balances').to.be.true();
    }
    /// @dev Constructs new MatchOrderTester.
    /// @param exchangeWrapper Used to call to the Exchange.
    /// @param erc20Wrapper Used to fetch ERC20 balances.
    /// @param erc721Wrapper Used to fetch ERC721 token owners.
    /// @param feeTokenAddress Address of ERC20 fee token.
    constructor(
        exchangeWrapper: ExchangeWrapper,
        erc20Wrapper: ERC20Wrapper,
        erc721Wrapper: ERC721Wrapper,
        feeTokenAddress: string,
    ) {
        this._exchangeWrapper = exchangeWrapper;
        this._erc20Wrapper = erc20Wrapper;
        this._erc721Wrapper = erc721Wrapper;
        this._feeTokenAddress = feeTokenAddress;
    }
    /// @dev Matches two complementary orders and validates results.
    ///      Validation either succeeds or throws.
    /// @param signedOrderLeft First matched order.
    /// @param signedOrderRight Second matched order.
    /// @param takerAddress Address of taker (the address who matched the two orders)
    /// @param erc20BalancesByOwner Current ERC20 balances.
    /// @param erc721TokenIdsByOwner Current ERC721 token owners.
    /// @param initialTakerAssetFilledAmountLeft Current amount the left order has been filled.
    /// @param initialTakerAssetFilledAmountRight Current amount the right order has been filled.
    /// @return New ERC20 balances & ERC721 token owners.
    public async matchOrdersAndVerifyBalancesAsync(
        signedOrderLeft: SignedOrder,
        signedOrderRight: SignedOrder,
        takerAddress: string,
        erc20BalancesByOwner: ERC20BalancesByOwner,
        erc721TokenIdsByOwner: ERC721TokenIdsByOwner,
        expectedTransferAmounts: TransferAmounts,
        initialTakerAssetFilledAmountLeft?: BigNumber,
        initialTakerAssetFilledAmountRight?: BigNumber,
    ): Promise<[ERC20BalancesByOwner, ERC721TokenIdsByOwner]> {
        // Verify initial order states
        let orderTakerAssetFilledAmountLeft: BigNumber;
        let orderTakerAssetFilledAmountRight: BigNumber;
        [orderTakerAssetFilledAmountLeft, orderTakerAssetFilledAmountRight] = await this._verifyInitialOrderStatesAsync(
            signedOrderLeft,
            signedOrderRight,
            initialTakerAssetFilledAmountLeft,
            initialTakerAssetFilledAmountRight,
        );
        // Match left & right orders
        const transactionReceipt = await this._exchangeWrapper.matchOrdersAsync(
            signedOrderLeft,
            signedOrderRight,
            takerAddress,
        );
        const newERC20BalancesByOwner = await this._erc20Wrapper.getBalancesAsync();
        const newERC721TokenIdsByOwner = await this._erc721Wrapper.getBalancesAsync();
        // Verify logs
        await MatchOrderTester._verifyLogsAsync(
            signedOrderLeft,
            signedOrderRight,
            transactionReceipt,
            takerAddress,
            expectedTransferAmounts,
        );
        // Verify exchange state
        await this._verifyExchangeStateAsync(
            signedOrderLeft,
            signedOrderRight,
            orderTakerAssetFilledAmountLeft,
            orderTakerAssetFilledAmountRight,
            expectedTransferAmounts,
            initialTakerAssetFilledAmountLeft,
            initialTakerAssetFilledAmountRight,
        );
        // Verify balances of makers, taker, and fee recipients
        await this._verifyBalancesAsync(
            signedOrderLeft,
            signedOrderRight,
            erc20BalancesByOwner,
            erc721TokenIdsByOwner,
            newERC20BalancesByOwner,
            newERC721TokenIdsByOwner,
            expectedTransferAmounts,
            takerAddress,
        );
        return [newERC20BalancesByOwner, newERC721TokenIdsByOwner];
    }
    private async _verifyInitialOrderStatesAsync(
        signedOrderLeft: SignedOrder,
        signedOrderRight: SignedOrder,
        initialTakerAssetFilledAmountLeft?: BigNumber,
        initialTakerAssetFilledAmountRight?: BigNumber,
    ): Promise<[BigNumber, BigNumber]> {
        // Verify Left order preconditions
        const orderTakerAssetFilledAmountLeft = await this._exchangeWrapper.getTakerAssetFilledAmountAsync(
            orderHashUtils.getOrderHashHex(signedOrderLeft),
        );
        const expectedOrderFilledAmountLeft = initialTakerAssetFilledAmountLeft
            ? initialTakerAssetFilledAmountLeft
            : new BigNumber(0);
        expect(expectedOrderFilledAmountLeft, 'Checking inital state of left order').to.be.bignumber.equal(
            orderTakerAssetFilledAmountLeft,
        );
        // Verify Right order preconditions
        const orderTakerAssetFilledAmountRight = await this._exchangeWrapper.getTakerAssetFilledAmountAsync(
            orderHashUtils.getOrderHashHex(signedOrderRight),
        );
        const expectedOrderFilledAmountRight = initialTakerAssetFilledAmountRight
            ? initialTakerAssetFilledAmountRight
            : new BigNumber(0);
        expect(expectedOrderFilledAmountRight, 'Checking inital state of right order').to.be.bignumber.equal(
            orderTakerAssetFilledAmountRight,
        );
        return [orderTakerAssetFilledAmountLeft, orderTakerAssetFilledAmountRight];
    }

    /// @dev Calculates expected transfer amounts between order makers, fee recipients, and
    ///      the taker when two orders are matched.
    /// @param signedOrderLeft First matched order.
    /// @param signedOrderRight Second matched order.
    /// @param orderTakerAssetFilledAmountLeft How much left order has been filled, prior to matching orders.
    /// @param orderTakerAssetFilledAmountRight How much the right order has been filled, prior to matching orders.
    /// @return TransferAmounts A struct containing the expected transfer amounts.
    private async _verifyExchangeStateAsync(
        signedOrderLeft: SignedOrder,
        signedOrderRight: SignedOrder,
        orderTakerAssetFilledAmountLeft: BigNumber,
        orderTakerAssetFilledAmountRight: BigNumber,
        expectedTransferAmounts: TransferAmounts,
        initialTakerAssetFilledAmountLeft?: BigNumber,
        initialTakerAssetFilledAmountRight?: BigNumber,
    ): Promise<void> {
        // Verify state for left order: amount bought by left maker
        let amountBoughtByLeftMaker = await this._exchangeWrapper.getTakerAssetFilledAmountAsync(
            orderHashUtils.getOrderHashHex(signedOrderLeft),
        );
        amountBoughtByLeftMaker = amountBoughtByLeftMaker.minus(orderTakerAssetFilledAmountLeft);
        expect(
            expectedTransferAmounts.amountBoughtByLeftMaker,
            'Checking exchange state for left order',
        ).to.be.bignumber.equal(amountBoughtByLeftMaker);
        // Verify state for right order: amount bought by right maker
        let amountBoughtByRightMaker = await this._exchangeWrapper.getTakerAssetFilledAmountAsync(
            orderHashUtils.getOrderHashHex(signedOrderRight),
        );
        amountBoughtByRightMaker = amountBoughtByRightMaker.minus(orderTakerAssetFilledAmountRight);
        expect(
            expectedTransferAmounts.amountBoughtByRightMaker,
            'Checking exchange state for right order',
        ).to.be.bignumber.equal(amountBoughtByRightMaker);
        // Verify left order status
        const maxAmountBoughtByLeftMaker = initialTakerAssetFilledAmountLeft
            ? signedOrderLeft.takerAssetAmount.sub(initialTakerAssetFilledAmountLeft)
            : signedOrderLeft.takerAssetAmount;
        const leftOrderInfo: OrderInfo = await this._exchangeWrapper.getOrderInfoAsync(signedOrderLeft);
        const leftExpectedStatus = expectedTransferAmounts.amountBoughtByLeftMaker.equals(maxAmountBoughtByLeftMaker)
            ? OrderStatus.FULLY_FILLED
            : OrderStatus.FILLABLE;
        expect(leftOrderInfo.orderStatus as OrderStatus, 'Checking exchange status for left order').to.be.equal(
            leftExpectedStatus,
        );
        // Verify right order status
        const maxAmountBoughtByRightMaker = initialTakerAssetFilledAmountRight
            ? signedOrderRight.takerAssetAmount.sub(initialTakerAssetFilledAmountRight)
            : signedOrderRight.takerAssetAmount;
        const rightOrderInfo: OrderInfo = await this._exchangeWrapper.getOrderInfoAsync(signedOrderRight);
        const rightExpectedStatus = expectedTransferAmounts.amountBoughtByRightMaker.equals(maxAmountBoughtByRightMaker)
            ? OrderStatus.FULLY_FILLED
            : OrderStatus.FILLABLE;
        expect(rightOrderInfo.orderStatus as OrderStatus, 'Checking exchange status for right order').to.be.equal(
            rightExpectedStatus,
        );
    }
    private async _verifyBalancesAsync(
        signedOrderLeft: SignedOrder,
        signedOrderRight: SignedOrder,
        initialERC20BalancesByOwner: ERC20BalancesByOwner,
        initialERC721TokenIdsByOwner: ERC721TokenIdsByOwner,
        finalERC20BalancesByOwner: ERC20BalancesByOwner,
        finalERC721TokenIdsByOwner: ERC721TokenIdsByOwner,
        expectedTransferAmounts: TransferAmounts,
        takerAddress: string,
    ): Promise<void> {
        let expectedERC20BalancesByOwner: ERC20BalancesByOwner;
        let expectedERC721TokenIdsByOwner: ERC721TokenIdsByOwner;
        [expectedERC20BalancesByOwner, expectedERC721TokenIdsByOwner] = this._calculateExpectedBalances(
            signedOrderLeft,
            signedOrderRight,
            takerAddress,
            initialERC20BalancesByOwner,
            initialERC721TokenIdsByOwner,
            expectedTransferAmounts,
        );
        // Verify balances of makers, taker, and fee recipients
        await this._verifyMakerTakerAndFeeRecipientBalancesAsync(
            signedOrderLeft,
            signedOrderRight,
            expectedERC20BalancesByOwner,
            finalERC20BalancesByOwner,
            expectedERC721TokenIdsByOwner,
            finalERC721TokenIdsByOwner,
            takerAddress,
        );
        // Verify balances for all known accounts
        await MatchOrderTester._verifyAllKnownBalancesAsync(
            expectedERC20BalancesByOwner,
            finalERC20BalancesByOwner,
            expectedERC721TokenIdsByOwner,
            finalERC721TokenIdsByOwner,
        );
    }
    private async _verifyMakerTakerAndFeeRecipientBalancesAsync(
        signedOrderLeft: SignedOrder,
        signedOrderRight: SignedOrder,
        expectedERC20BalancesByOwner: ERC20BalancesByOwner,
        realERC20BalancesByOwner: ERC20BalancesByOwner,
        expectedERC721TokenIdsByOwner: ERC721TokenIdsByOwner,
        realERC721TokenIdsByOwner: ERC721TokenIdsByOwner,
        takerAddress: string,
    ): Promise<void> {
        // Individual balance comparisons
        const makerAssetProxyIdLeft = assetDataUtils.decodeAssetProxyId(signedOrderLeft.makerAssetData);
        const makerERC20AssetDataLeft =
            makerAssetProxyIdLeft === AssetProxyId.ERC20
                ? assetDataUtils.decodeERC20AssetData(signedOrderLeft.makerAssetData)
                : assetDataUtils.decodeERC721AssetData(signedOrderLeft.makerAssetData);
        const makerAssetAddressLeft = makerERC20AssetDataLeft.tokenAddress;
        const makerAssetProxyIdRight = assetDataUtils.decodeAssetProxyId(signedOrderRight.makerAssetData);
        const makerERC20AssetDataRight =
            makerAssetProxyIdRight === AssetProxyId.ERC20
                ? assetDataUtils.decodeERC20AssetData(signedOrderRight.makerAssetData)
                : assetDataUtils.decodeERC721AssetData(signedOrderRight.makerAssetData);
        const makerAssetAddressRight = makerERC20AssetDataRight.tokenAddress;
        if (makerAssetProxyIdLeft === AssetProxyId.ERC20) {
            expect(
                realERC20BalancesByOwner[signedOrderLeft.makerAddress][makerAssetAddressLeft],
                'Checking left maker egress ERC20 account balance',
            ).to.be.bignumber.equal(expectedERC20BalancesByOwner[signedOrderLeft.makerAddress][makerAssetAddressLeft]);
            expect(
                realERC20BalancesByOwner[signedOrderRight.makerAddress][makerAssetAddressLeft],
                'Checking right maker ingress ERC20 account balance',
            ).to.be.bignumber.equal(expectedERC20BalancesByOwner[signedOrderRight.makerAddress][makerAssetAddressLeft]);
            expect(
                realERC20BalancesByOwner[takerAddress][makerAssetAddressLeft],
                'Checking taker ingress ERC20 account balance',
            ).to.be.bignumber.equal(expectedERC20BalancesByOwner[takerAddress][makerAssetAddressLeft]);
        } else if (makerAssetProxyIdLeft === AssetProxyId.ERC721) {
            expect(
                realERC721TokenIdsByOwner[signedOrderLeft.makerAddress][makerAssetAddressLeft].sort(),
                'Checking left maker egress ERC721 account holdings',
            ).to.be.deep.equal(
                expectedERC721TokenIdsByOwner[signedOrderLeft.makerAddress][makerAssetAddressLeft].sort(),
            );
            expect(
                realERC721TokenIdsByOwner[signedOrderRight.makerAddress][makerAssetAddressLeft].sort(),
                'Checking right maker ERC721 account holdings',
            ).to.be.deep.equal(
                expectedERC721TokenIdsByOwner[signedOrderRight.makerAddress][makerAssetAddressLeft].sort(),
            );
            expect(
                realERC721TokenIdsByOwner[takerAddress][makerAssetAddressLeft].sort(),
                'Checking taker ingress ERC721 account holdings',
            ).to.be.deep.equal(expectedERC721TokenIdsByOwner[takerAddress][makerAssetAddressLeft].sort());
        } else {
            throw new Error(`Unhandled Asset Proxy ID: ${makerAssetProxyIdLeft}`);
        }
        if (makerAssetProxyIdRight === AssetProxyId.ERC20) {
            expect(
                realERC20BalancesByOwner[signedOrderLeft.makerAddress][makerAssetAddressRight],
                'Checking left maker ingress ERC20 account balance',
            ).to.be.bignumber.equal(expectedERC20BalancesByOwner[signedOrderLeft.makerAddress][makerAssetAddressRight]);
            expect(
                realERC20BalancesByOwner[signedOrderRight.makerAddress][makerAssetAddressRight],
                'Checking right maker egress ERC20 account balance',
            ).to.be.bignumber.equal(
                expectedERC20BalancesByOwner[signedOrderRight.makerAddress][makerAssetAddressRight],
            );
        } else if (makerAssetProxyIdRight === AssetProxyId.ERC721) {
            expect(
                realERC721TokenIdsByOwner[signedOrderLeft.makerAddress][makerAssetAddressRight].sort(),
                'Checking left maker ingress ERC721 account holdings',
            ).to.be.deep.equal(
                expectedERC721TokenIdsByOwner[signedOrderLeft.makerAddress][makerAssetAddressRight].sort(),
            );
            expect(
                realERC721TokenIdsByOwner[signedOrderRight.makerAddress][makerAssetAddressRight],
                'Checking right maker agress ERC721 account holdings',
            ).to.be.deep.equal(expectedERC721TokenIdsByOwner[signedOrderRight.makerAddress][makerAssetAddressRight]);
        } else {
            throw new Error(`Unhandled Asset Proxy ID: ${makerAssetProxyIdRight}`);
        }
        // Paid fees
        expect(
            realERC20BalancesByOwner[signedOrderLeft.makerAddress][this._feeTokenAddress],
            'Checking left maker egress ERC20 account fees',
        ).to.be.bignumber.equal(expectedERC20BalancesByOwner[signedOrderLeft.makerAddress][this._feeTokenAddress]);
        expect(
            realERC20BalancesByOwner[signedOrderRight.makerAddress][this._feeTokenAddress],
            'Checking right maker egress ERC20 account fees',
        ).to.be.bignumber.equal(expectedERC20BalancesByOwner[signedOrderRight.makerAddress][this._feeTokenAddress]);
        expect(
            realERC20BalancesByOwner[takerAddress][this._feeTokenAddress],
            'Checking taker egress ERC20 account fees',
        ).to.be.bignumber.equal(expectedERC20BalancesByOwner[takerAddress][this._feeTokenAddress]);
        // Received fees
        expect(
            realERC20BalancesByOwner[signedOrderLeft.feeRecipientAddress][this._feeTokenAddress],
            'Checking left fee recipient ingress ERC20 account fees',
        ).to.be.bignumber.equal(
            expectedERC20BalancesByOwner[signedOrderLeft.feeRecipientAddress][this._feeTokenAddress],
        );
        expect(
            realERC20BalancesByOwner[signedOrderRight.feeRecipientAddress][this._feeTokenAddress],
            'Checking right fee receipient ingress ERC20 account fees',
        ).to.be.bignumber.equal(
            expectedERC20BalancesByOwner[signedOrderRight.feeRecipientAddress][this._feeTokenAddress],
        );
    }
    /// @dev Calculates the expected balances of order makers, fee recipients, and the taker,
    ///      as a result of matching two orders.
    /// @param signedOrderRight First matched order.
    /// @param signedOrderRight Second matched order.
    /// @param takerAddress Address of taker (the address who matched the two orders)
    /// @param erc20BalancesByOwner Current ERC20 balances.
    /// @param erc721TokenIdsByOwner Current ERC721 token owners.
    /// @param expectedTransferAmounts A struct containing the expected transfer amounts.
    /// @return Expected ERC20 balances & ERC721 token owners after orders have been matched.
    private _calculateExpectedBalances(
        signedOrderLeft: SignedOrder,
        signedOrderRight: SignedOrder,
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
        const makerAssetProxyIdLeft = assetDataUtils.decodeAssetProxyId(signedOrderLeft.makerAssetData);
        if (makerAssetProxyIdLeft === AssetProxyId.ERC20) {
            // Decode asset data
            const erc20AssetData = assetDataUtils.decodeERC20AssetData(signedOrderLeft.makerAssetData);
            const makerAssetAddressLeft = erc20AssetData.tokenAddress;
            const takerAssetAddressRight = makerAssetAddressLeft;
            // Left Maker
            expectedNewERC20BalancesByOwner[makerAddressLeft][makerAssetAddressLeft] = expectedNewERC20BalancesByOwner[
                makerAddressLeft
            ][makerAssetAddressLeft].minus(expectedTransferAmounts.amountSoldByLeftMaker);
            // Right Maker
            expectedNewERC20BalancesByOwner[makerAddressRight][
                takerAssetAddressRight
            ] = expectedNewERC20BalancesByOwner[makerAddressRight][takerAssetAddressRight].add(
                expectedTransferAmounts.amountBoughtByRightMaker,
            );
            // Taker
            expectedNewERC20BalancesByOwner[takerAddress][makerAssetAddressLeft] = expectedNewERC20BalancesByOwner[
                takerAddress
            ][makerAssetAddressLeft].add(expectedTransferAmounts.amountReceivedByTaker);
        } else if (makerAssetProxyIdLeft === AssetProxyId.ERC721) {
            // Decode asset data
            const erc721AssetData = assetDataUtils.decodeERC721AssetData(signedOrderLeft.makerAssetData);
            const makerAssetAddressLeft = erc721AssetData.tokenAddress;
            const makerAssetIdLeft = erc721AssetData.tokenId;
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
        const takerAssetProxyIdLeft = assetDataUtils.decodeAssetProxyId(signedOrderLeft.takerAssetData);
        if (takerAssetProxyIdLeft === AssetProxyId.ERC20) {
            // Decode asset data
            const erc20AssetData = assetDataUtils.decodeERC20AssetData(signedOrderLeft.takerAssetData);
            const takerAssetAddressLeft = erc20AssetData.tokenAddress;
            const makerAssetAddressRight = takerAssetAddressLeft;
            // Left Maker
            expectedNewERC20BalancesByOwner[makerAddressLeft][takerAssetAddressLeft] = expectedNewERC20BalancesByOwner[
                makerAddressLeft
            ][takerAssetAddressLeft].add(expectedTransferAmounts.amountBoughtByLeftMaker);
            // Right Maker
            expectedNewERC20BalancesByOwner[makerAddressRight][
                makerAssetAddressRight
            ] = expectedNewERC20BalancesByOwner[makerAddressRight][makerAssetAddressRight].minus(
                expectedTransferAmounts.amountSoldByRightMaker,
            );
        } else if (takerAssetProxyIdLeft === AssetProxyId.ERC721) {
            // Decode asset data
            const erc721AssetData = assetDataUtils.decodeERC721AssetData(signedOrderRight.makerAssetData);
            const makerAssetAddressRight = erc721AssetData.tokenAddress;
            const makerAssetIdRight = erc721AssetData.tokenId;
            const takerAssetAddressLeft = makerAssetAddressRight;
            const takerAssetIdLeft = makerAssetIdRight;
            // Right Maker
            _.remove(expectedNewERC721TokenIdsByOwner[makerAddressRight][makerAssetAddressRight], makerAssetIdRight);
            // Left Maker
            expectedNewERC721TokenIdsByOwner[makerAddressLeft][takerAssetAddressLeft].push(takerAssetIdLeft);
        }
        // Left Maker Fees
        expectedNewERC20BalancesByOwner[makerAddressLeft][this._feeTokenAddress] = expectedNewERC20BalancesByOwner[
            makerAddressLeft
        ][this._feeTokenAddress].minus(expectedTransferAmounts.feePaidByLeftMaker);
        // Right Maker Fees
        expectedNewERC20BalancesByOwner[makerAddressRight][this._feeTokenAddress] = expectedNewERC20BalancesByOwner[
            makerAddressRight
        ][this._feeTokenAddress].minus(expectedTransferAmounts.feePaidByRightMaker);
        // Taker Fees
        expectedNewERC20BalancesByOwner[takerAddress][this._feeTokenAddress] = expectedNewERC20BalancesByOwner[
            takerAddress
        ][this._feeTokenAddress].minus(
            expectedTransferAmounts.feePaidByTakerLeft.add(expectedTransferAmounts.feePaidByTakerRight),
        );
        // Left Fee Recipient Fees
        expectedNewERC20BalancesByOwner[feeRecipientAddressLeft][
            this._feeTokenAddress
        ] = expectedNewERC20BalancesByOwner[feeRecipientAddressLeft][this._feeTokenAddress].add(
            expectedTransferAmounts.feePaidByLeftMaker.add(expectedTransferAmounts.feePaidByTakerLeft),
        );
        // Right Fee Recipient Fees
        expectedNewERC20BalancesByOwner[feeRecipientAddressRight][
            this._feeTokenAddress
        ] = expectedNewERC20BalancesByOwner[feeRecipientAddressRight][this._feeTokenAddress].add(
            expectedTransferAmounts.feePaidByRightMaker.add(expectedTransferAmounts.feePaidByTakerRight),
        );

        return [expectedNewERC20BalancesByOwner, expectedNewERC721TokenIdsByOwner];
    }
} // tslint:disable-line:max-file-line-count
