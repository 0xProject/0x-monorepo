import { DevUtilsContract } from '@0x/contracts-dev-utils';
import { ReferenceFunctions as LibReferenceFunctions } from '@0x/contracts-exchange-libs';
import {
    constants,
    expect,
    FillEventArgs,
    filterLogsToArguments,
    OrderStatus,
    orderUtils,
} from '@0x/contracts-test-utils';
import { orderHashUtils } from '@0x/order-utils';
import { FillResults, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { TransactionReceiptWithDecodedLogs } from 'ethereum-types';
import * as _ from 'lodash';

import {
    BalanceStore,
    BlockchainBalanceStore,
    ExchangeContract,
    LocalBalanceStore,
    TokenContractsByName,
    TokenIds,
    TokenOwnersByName,
} from '../../src';

export class FillOrderWrapper {
    private readonly _blockchainBalanceStore: BlockchainBalanceStore;

    /**
     *  Simulates the event emitted by the exchange contract when an order is filled.
     */
    public static simulateFillEvent(order: SignedOrder, takerAddress: string, fillResults: FillResults): FillEventArgs {
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
     * Extract the exchanges `Fill` event from a transaction receipt.
     */
    private static _extractFillEventsfromReceipt(receipt: TransactionReceiptWithDecodedLogs): FillEventArgs[] {
        const events = filterLogsToArguments<FillEventArgs>(receipt.logs, 'Fill');
        const fieldsOfInterest = [
            'orderHash',
            'makerAddress',
            'takerAddress',
            'makerAssetFilledAmount',
            'takerAssetFilledAmount',
            'makerFeePaid',
            'takerFeePaid',
        ];
        return events.map(event => _.pick(event, fieldsOfInterest)) as FillEventArgs[];
    }

    /**
     * Locally simulates filling an order.
     * @param txReceipt Transaction receipt from the actual fill, needed to update eth balance
     * @param signedOrder The order being filled.
     * @param takerAddress Address of taker (the address who matched the two orders)
     * @param opts Optionally specifies the amount to fill.
     * @param initBalanceStore Account balances prior to the fill.
     * @return The expected account balances, fill results, and fill events.
     */
    public async simulateFillOrderAsync(
        txReceipt: TransactionReceiptWithDecodedLogs,
        signedOrder: SignedOrder,
        takerAddress: string,
        initBalanceStore: BalanceStore,
        opts: { takerAssetFillAmount?: BigNumber } = {},
    ): Promise<[FillResults, FillEventArgs, BalanceStore]> {
        const balanceStore = LocalBalanceStore.create(this._devUtils, initBalanceStore);
        const takerAssetFillAmount =
            opts.takerAssetFillAmount !== undefined ? opts.takerAssetFillAmount : signedOrder.takerAssetAmount;
        // TODO(jalextowle): Change this if the integration tests take protocol fees into account.
        const fillResults = LibReferenceFunctions.calculateFillResults(
            signedOrder,
            takerAssetFillAmount,
            constants.ZERO_AMOUNT,
            constants.ZERO_AMOUNT,
        );
        const fillEvent = FillOrderWrapper.simulateFillEvent(signedOrder, takerAddress, fillResults);
        // Taker -> Maker
        await balanceStore.transferAssetAsync(
            takerAddress,
            signedOrder.makerAddress,
            fillResults.takerAssetFilledAmount,
            signedOrder.takerAssetData,
        );
        // Maker -> Taker
        await balanceStore.transferAssetAsync(
            signedOrder.makerAddress,
            takerAddress,
            fillResults.makerAssetFilledAmount,
            signedOrder.makerAssetData,
        );
        // Taker -> Fee Recipient
        await balanceStore.transferAssetAsync(
            takerAddress,
            signedOrder.feeRecipientAddress,
            fillResults.takerFeePaid,
            signedOrder.takerFeeAssetData,
        );
        // Maker -> Fee Recipient
        await balanceStore.transferAssetAsync(
            signedOrder.makerAddress,
            signedOrder.feeRecipientAddress,
            fillResults.makerFeePaid,
            signedOrder.makerFeeAssetData,
        );
        balanceStore.burnGas(txReceipt.from, constants.DEFAULT_GAS_PRICE * txReceipt.gasUsed);
        return [fillResults, fillEvent, balanceStore];
    }

    /**
     * Constructor.
     * @param exchangeContract Instance of the deployed exchange contract.
     * @param tokenOwnersByName The addresses of token owners to assert the balances of.
     * @param tokenContractsByName The contracts of tokens to assert the balances of.
     * @param tokenIds The tokenIds of ERC721 and ERC1155 assets to assert the balances of.
     */
    public constructor(
        private readonly _exchange: ExchangeContract,
        private readonly _devUtils: DevUtilsContract,
        tokenOwnersByName: TokenOwnersByName,
        tokenContractsByName: Partial<TokenContractsByName>,
        tokenIds: Partial<TokenIds>,
    ) {
        this._blockchainBalanceStore = new BlockchainBalanceStore(tokenOwnersByName, tokenContractsByName, tokenIds);
    }

    /**
     * Returns the balance store used by this wrapper.
     */
    public getBlockchainBalanceStore(): BlockchainBalanceStore {
        return this._blockchainBalanceStore;
    }

    /**
     * Fills an order and asserts the effects. This includes
     * 1. The order info (via `getOrderInfo`)
     * 2. The fill results returned by making an `eth_call` to `exchange.fillOrder`
     * 3. The events emitted by the exchange when the order is filled.
     * 4. The balance changes as a result of filling the order.
     */
    public async fillOrderAndAssertEffectsAsync(
        signedOrder: SignedOrder,
        from: string,
        opts: { takerAssetFillAmount?: BigNumber } = {},
    ): Promise<void> {
        // Get init state
        await this._blockchainBalanceStore.updateBalancesAsync();
        const initTakerAssetFilledAmount = await this._exchange
            .filled(orderHashUtils.getOrderHashHex(signedOrder))
            .callAsync();
        // Assert init state of exchange
        await this._assertOrderStateAsync(signedOrder, initTakerAssetFilledAmount);
        // Simulate and execute fill then assert outputs
        const [fillResults, fillEvent, txReceipt] = await this._fillOrderAsync(signedOrder, from, opts);
        const [
            simulatedFillResults,
            simulatedFillEvent,
            simulatedFinalBalanceStore,
        ] = await this.simulateFillOrderAsync(txReceipt, signedOrder, from, this._blockchainBalanceStore, opts);
        // Assert state transition
        expect(simulatedFillResults, 'Fill Results').to.be.deep.equal(fillResults);
        expect(simulatedFillEvent, 'Fill Events').to.be.deep.equal(fillEvent);

        await this._blockchainBalanceStore.updateBalancesAsync();
        this._blockchainBalanceStore.assertEquals(simulatedFinalBalanceStore);

        // Assert end state of exchange
        const finalTakerAssetFilledAmount = initTakerAssetFilledAmount.plus(fillResults.takerAssetFilledAmount);
        await this._assertOrderStateAsync(signedOrder, finalTakerAssetFilledAmount);
    }

    /**
     * Fills an order on-chain.
     */
    protected async _fillOrderAsync(
        signedOrder: SignedOrder,
        from: string,
        opts: { takerAssetFillAmount?: BigNumber } = {},
    ): Promise<[FillResults, FillEventArgs, TransactionReceiptWithDecodedLogs]> {
        const params = orderUtils.createFill(signedOrder, opts.takerAssetFillAmount);
        const fillResults = await this._exchange
            .fillOrder(params.order, params.takerAssetFillAmount, params.signature)
            .callAsync({ from });
        const txReceipt = await this._exchange
            .fillOrder(params.order, params.takerAssetFillAmount, params.signature)
            .awaitTransactionSuccessAsync({ from });
        const fillEvent = FillOrderWrapper._extractFillEventsfromReceipt(txReceipt)[0];
        return [fillResults, fillEvent, txReceipt];
    }

    /**
     * Asserts that the provided order's fill amount and order status
     * are the expected values.
     * @param order The order to verify for a correct state.
     * @param expectedFilledAmount The amount that the order should have been filled.
     */
    private async _assertOrderStateAsync(
        order: SignedOrder,
        expectedFilledAmount: BigNumber = new BigNumber(0),
    ): Promise<void> {
        const orderInfo = await this._exchange.getOrderInfo(order).callAsync();
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
}
