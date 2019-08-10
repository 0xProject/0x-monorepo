
import { FillResults, formatters, OrderInfo, orderUtils, Web3ProviderEngine } from '@0x/contracts-test-utils';
import { SignedOrder, SignedZeroExTransaction } from '@0x/types';
import { AbiEncoder, BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { MethodAbi, TransactionReceiptWithDecodedLogs, ZeroExProvider } from 'ethereum-types';
import * as _ from 'lodash';

import { ExchangeContract } from '../../src';

import { AbiDecodedFillOrderData } from '../utils/types';

import { ERC1155ProxyWrapper, ERC20Wrapper, ERC721Wrapper } from '@0x/contracts-asset-proxy';
import {
    BatchMatchedFillResults,
    chaiSetup,
    ERC1155HoldingsByOwner,
    FillResults,
    OrderStatus,
} from '@0x/contracts-test-utils';
import { assetDataUtils, orderHashUtils } from '@0x/order-utils';
import { AssetProxyId, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import { LogWithDecodedArgs, TransactionReceiptWithDecodedLogs } from 'ethereum-types';
import * as _ from 'lodash';

import { ExchangeWrapper } from './exchange_wrapper';
import { TokenBalances } from './balances';

import { assertInitialOrderStatesAsync } from '../utils/assertion_utils';

import { getTokenBalancesAsync, transferAsset } from '../utils/balances';

chaiSetup.configure();
const expect = chai.expect;

export interface FillTransferAmounts {
    // Maker
    amountSoldMaker: BigNumber;
    amountBoughtMaker: BigNumber;
    feePaidByMaker: BigNumber;

    // Taker
    amountSoldByTaker: BigNumber;
    amountBoughtByTaker: BigNumber;
    feePaidByTaker: BigNumber;
}

export interface TransactionReceiptOrError {
    txReceipt?: TransactionReceiptWithDecodedLogs;
    error?: any;
}

interface FillEffects {
    results: FillResults;
    events: FillEventArgs[];
    balances: TokenBalances;
}

export interface FillEffectsOrError {
    effects?: FillEffects;
    error?: any;
}

export interface FillEventArgs {
    orderHash: string;
    makerAddress: string;
    takerAddress: string;
    makerAssetFilledAmount: BigNumber;
    takerAssetFilledAmount: BigNumber;
    makerFeePaid: BigNumber;
    takerFeePaid: BigNumber;
}

export interface InitialFillState {
    balances?: TokenBalances,
    takerAssetFilledAmount?: BigNumber,
}

export class FillOrderAssertionWrapper {
    private readonly _exchange: ExchangeContract;
    private readonly _erc20Wrapper: ERC20Wrapper;
    private readonly _erc721Wrapper: ERC721Wrapper;
    private readonly _erc1155ProxyWrapper: ERC1155ProxyWrapper;
    // tslint:disable no-unused-variable
    private readonly _web3Wrapper: Web3Wrapper;
    constructor(
        exchangeContract: ExchangeContract,
        erc20Wrapper: ERC20Wrapper,
        erc721Wrapper: ERC721Wrapper,
        erc1155ProxyWrapper: ERC1155ProxyWrapper,
        provider: Web3ProviderEngine | ZeroExProvider,
    ) {
        this._exchange = exchangeContract;
        this._erc20Wrapper = erc20Wrapper;
        this._erc721Wrapper = erc721Wrapper;
        this._erc1155ProxyWrapper = erc1155ProxyWrapper;
        this._web3Wrapper = new Web3Wrapper(provider);
    }

    public async fillOrderAndAssertEffectsAsync(
        signedOrder: SignedOrder,
        from: string,
        opts: { takerAssetFillAmount?: BigNumber } = {},
        expectedFillResults: Partial<FillResults> = {},
        initState: InitialFillState = {}
    ): Promise<FillEffects> {
        // Parse initial state
        const initBalances = initState.balances
            ? initState.balances
            : await this.getBalancesAsync();
        const initTakerAssetFilledAmount = initState.takerAssetFilledAmount
            ? initState.takerAssetFilledAmount
            : new BigNumber(0);
        // Assert begin state
        await this._assertOrderStateAsync(signedOrder, initTakerAssetFilledAmount);
        // Simulate & execute fill
        const simulatedFillEffects = this.simulateFillOrder(signedOrder,
            from,
            initBalances,
            expectedFillResults
        );
        const fillEffects = await this._fillOrderAsync(signedOrder, from, opts);
        // Assert end state
        expect(simulatedFillEffects).to.be.deep.equal(fillEffects);
        const finalTakerAssetFilledAmount = initTakerAssetFilledAmount.plus(fillEffects.results.takerAssetFilledAmount);
        await this._assertOrderStateAsync(signedOrder, finalTakerAssetFilledAmount);
        return fillEffects;
    }

    private async _fillOrderAsync(
        signedOrder: SignedOrder,
        from: string,
        opts: { takerAssetFillAmount?: BigNumber } = {}
    ): Promise<FillEffects> {
        const params = orderUtils.createFill(signedOrder, opts.takerAssetFillAmount);
        const fillResults = await this._exchange.fillOrder.callAsync(
            params.order,
            params.takerAssetFillAmount,
            params.signature,
            { from },
        );
        const txReceipt = await this._exchange.fillOrder.awaitTransactionSuccessAsync(
            params.order,
            params.takerAssetFillAmount,
            params.signature,
            { from },
        );
        const fillEffects: FillEffects = {
            results: fillResults,
            events: this.extractFillEventsfromReceipt(txReceipt),
            balances: await this.getBalancesAsync()
        }
        return fillEffects;
    }

    /**
     * Asserts that the provided order's fill amount and order status
     * are the expected values.
     * @param order The order to verify for a correct state.
     * @param expectedFilledAmount The amount that the order should
     *                             have been filled.
     * @param side The side that the provided order should be matched on.
     * @param exchangeWrapper The ExchangeWrapper instance.
     */
    private async _assertOrderStateAsync(
        order: SignedOrder,
        expectedFilledAmount: BigNumber = new BigNumber(0),
    ): Promise<void> {
        const orderInfo = await this._exchange.getOrderInfo.callAsync(order);
        // Check filled amount of order.
        const actualFilledAmount = orderInfo.orderTakerAssetFilledAmount;
        expect(actualFilledAmount, 'order filled amount').to.be.bignumber.equal(expectedFilledAmount);
        // Check status of order.
        const expectedStatus = expectedFilledAmount.isGreaterThanOrEqualTo(order.takerAssetAmount)
            ? OrderStatus.FullyFilled
            : OrderStatus.Fillable;
        const actualStatus = orderInfo.orderStatus;
        expect(actualStatus, 'order status').to.equal(expectedStatus);
    }

    /**
     * Fetch the current token balances of all known accounts.
     */
    public async getBalancesAsync(): Promise<TokenBalances> {
        return getTokenBalancesAsync(this._erc20Wrapper, this._erc721Wrapper, this._erc1155ProxyWrapper);
    }

    
    /**
     * Simulates matching two orders by transferring amounts defined in
     * `transferAmounts` and returns the results.
     * @param orders The orders being matched and their filled states.
     * @param takerAddress Address of taker (the address who matched the two orders)
     * @param tokenBalances Current token balances.
     * @param transferAmounts Amounts to transfer during the simulation.
     * @return The new account balances and fill events that occurred during the match.
     */
    public simulateFillOrder(
        signedOrder: SignedOrder,
        takerAddress: string,
        tokenBalances: TokenBalances,
        partialFillResults: Partial<FillResults>,
    ): FillEffects {
        // prettier-ignore
        const finalTokenBalances = _.cloneDeep(tokenBalances);
        const fillResults = FillOrderAssertionWrapper._createFillResultsFromPartial(partialFillResults);
        // Maker -> Taker
        transferAsset(
            signedOrder.makerAddress,
            takerAddress,
            fillResults.takerAssetFilledAmount,
            signedOrder.makerAssetData,
            finalTokenBalances,
        );
        // Maker -> Fee Recipient
        transferAsset(
            signedOrder.makerAddress,
            signedOrder.feeRecipientAddress,
            fillResults.makerFeePaid,
            signedOrder.makerFeeAssetData,
            finalTokenBalances,
        );
        // Taker -> Maker
        transferAsset(
            signedOrder.makerAddress,
            signedOrder.feeRecipientAddress,
            fillResults.takerAssetFilledAmount,
            signedOrder.makerFeeAssetData,
            finalTokenBalances,
        );
        // Taker -> Fee Recipient
        transferAsset(
            signedOrder.makerAddress,
            signedOrder.feeRecipientAddress,
            fillResults.takerFeePaid,
            signedOrder.makerFeeAssetData,
            finalTokenBalances,
        );
        return {
            results: fillResults,
            events: [this.simulateFillEvent(signedOrder, takerAddress, fillResults)],
            balances: finalTokenBalances,
        }
    }

    /**
     *  Create a pair of `Fill` events for a simulated `matchOrder()`.
     */
    public simulateFillEvent(
        order: SignedOrder,
        takerAddress: string,
        fillResults: FillResults,
    ): FillEventArgs {
        // prettier-ignore
        return {
            orderHash: orderHashUtils.getOrderHashHex(order),
            makerAddress: order.makerAddress,
            takerAddress,
            makerAssetFilledAmount: fillResults.makerAssetFilledAmount,
            takerAssetFilledAmount: fillResults.takerAssetFilledAmount,
            makerFeePaid: fillResults.makerFeePaid,
            takerFeePaid: fillResults.takerFeePaid,
        };
    }
    
    /**
     * Extract `Fill` events from a transaction receipt.
     */
    private extractFillEventsfromReceipt(receipt: TransactionReceiptWithDecodedLogs): FillEventArgs[] {
        interface RawFillEventArgs {
            orderHash: string;
            makerAddress: string;
            takerAddress: string;
            makerAssetFilledAmount: string;
            takerAssetFilledAmount: string;
            makerFeePaid: string;
            takerFeePaid: string;
        }
        const actualFills = (_.filter(receipt.logs, ['event', 'Fill']) as any) as Array<
            LogWithDecodedArgs<RawFillEventArgs>
        >;
        // Convert RawFillEventArgs to FillEventArgs.
        return actualFills.map(fill => ({
            orderHash: fill.args.orderHash,
            makerAddress: fill.args.makerAddress,
            takerAddress: fill.args.takerAddress,
            makerAssetFilledAmount: new BigNumber(fill.args.makerAssetFilledAmount),
            takerAssetFilledAmount: new BigNumber(fill.args.takerAssetFilledAmount),
            makerFeePaid: new BigNumber(fill.args.makerFeePaid),
            takerFeePaid: new BigNumber(fill.args.takerFeePaid),
        }));
    }    
    
    private static _createFillResultsFromPartial(partialFillResults: Partial<FillResults>): FillResults {
        return {
            makerAssetFilledAmount: partialFillResults.makerAssetFilledAmount !== undefined ? partialFillResults.makerAssetFilledAmount : new BigNumber(0),
            takerAssetFilledAmount: partialFillResults.takerAssetFilledAmount !== undefined ? partialFillResults.takerAssetFilledAmount : new BigNumber(0),
            makerFeePaid: partialFillResults.makerFeePaid !== undefined ? partialFillResults.makerFeePaid : new BigNumber(0),
            takerFeePaid: partialFillResults.takerFeePaid !== undefined ? partialFillResults.takerFeePaid : new BigNumber(0),
        }
    }
}