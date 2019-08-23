import {
    artifacts as proxyArtifacts,
    ERC1155ProxyWrapper,
    ERC20Wrapper,
    ERC721Wrapper,
} from '@0x/contracts-asset-proxy';
import { artifacts as erc20Artifacts } from '@0x/contracts-erc20';
import { artifacts as erc721Artifacts } from '@0x/contracts-erc721';
import { ReferenceFunctions as LibReferenceFunctions } from '@0x/contracts-exchange-libs';
import {
    expect,
    FillEventArgs,
    filterLogsToArguments,
    LogDecoder,
    OrderStatus,
    orderUtils,
    Web3ProviderEngine,
} from '@0x/contracts-test-utils';
import { orderHashUtils } from '@0x/order-utils';
import { AssetProxyId, FillResults, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { TransactionReceiptWithDecodedLogs, ZeroExProvider } from 'ethereum-types';
import * as _ from 'lodash';

import { artifacts, ExchangeContract } from '../../src';
import { BalanceStore } from '../balance_stores/balance_store';
import { BlockchainBalanceStore } from '../balance_stores/blockchain_balance_store';
import { LocalBalanceStore } from '../balance_stores/local_balance_store';

export class FillOrderWrapper {
    private readonly _exchange: ExchangeContract;
    private readonly _blockchainBalanceStore: BlockchainBalanceStore;
    private readonly _web3Wrapper: Web3Wrapper;

    /**
     * Simulates matching two orders by transferring amounts defined in
     * `transferAmounts` and returns the results.
     * @param orders The orders being matched and their filled states.
     * @param takerAddress Address of taker (the address who matched the two orders)
     * @param tokenBalances Current token balances.
     * @param transferAmounts Amounts to transfer during the simulation.
     * @return The new account balances and fill events that occurred during the match.
     */
    public static simulateFillOrder(
        signedOrder: SignedOrder,
        takerAddress: string,
        opts: { takerAssetFillAmount?: BigNumber } = {},
        initBalanceStore: BalanceStore,
        stakingOpts: {
            gasPrice: BigNumber;
            messageValue: BigNumber;
            protocolFeeMultiplier: BigNumber;
            stakingAddress: string;
            wethAddress: string;
        },
    ): [FillResults, FillEventArgs, BalanceStore] {
        const balanceStore = LocalBalanceStore.create(initBalanceStore);
        const takerAssetFillAmount =
            opts.takerAssetFillAmount !== undefined ? opts.takerAssetFillAmount : signedOrder.takerAssetAmount;
        const fillResults = LibReferenceFunctions.calculateFillResults(
            signedOrder,
            takerAssetFillAmount,
            stakingOpts.protocolFeeMultiplier,
            stakingOpts.gasPrice,
        );
        const fillEvent = FillOrderWrapper.simulateFillEvent(signedOrder, takerAddress, fillResults);
        // Taker -> Maker
        balanceStore.transferAsset(
            takerAddress,
            signedOrder.makerAddress,
            fillResults.takerAssetFilledAmount,
            signedOrder.takerAssetData,
        );
        // Maker -> Taker
        balanceStore.transferAsset(
            signedOrder.makerAddress,
            takerAddress,
            fillResults.makerAssetFilledAmount,
            signedOrder.makerAssetData,
        );
        // Taker -> Fee Recipient
        balanceStore.transferAsset(
            takerAddress,
            signedOrder.feeRecipientAddress,
            fillResults.takerFeePaid,
            signedOrder.takerFeeAssetData,
        );
        // Maker -> Fee Recipient
        balanceStore.transferAsset(
            signedOrder.makerAddress,
            signedOrder.feeRecipientAddress,
            fillResults.makerFeePaid,
            signedOrder.makerFeeAssetData,
        );
        if (stakingOpts.messageValue.isGreaterThanOrEqualTo(fillResults.protocolFeePaid)) {
            // Pay the protocol fee in ETH.
            balanceStore.transferAsset(takerAddress, stakingOpts.stakingAddress, fillResults.protocolFeePaid, '');
        } else {
            // Pay the protocol fee in WETH.
            balanceStore.transferAsset(
                takerAddress,
                stakingOpts.stakingAddress,
                fillResults.protocolFeePaid,
                AssetProxyId.ERC20,
            );
        }
        return [fillResults, fillEvent, balanceStore];
    }

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
     * Constructor.
     * @param exchangeContract Insstance of the deployed exchange contract
     * @param erc20Wrapper The ERC20 Wrapper used to interface with deployed erc20 tokens.
     * @param erc721Wrapper The ERC721 Wrapper used to interface with deployed erc20 tokens.
     * @param erc1155ProxyWrapper The ERC1155 Proxy Wrapper used to interface with deployed erc20 tokens.
     * @param provider Web3 provider to be used by a `Web3Wrapper` instance
     */
    public constructor(
        exchangeContract: ExchangeContract,
        erc20Wrapper: ERC20Wrapper,
        erc721Wrapper: ERC721Wrapper,
        erc1155ProxyWrapper: ERC1155ProxyWrapper,
        provider: Web3ProviderEngine | ZeroExProvider,
    ) {
        this._exchange = exchangeContract;
        this._blockchainBalanceStore = new BlockchainBalanceStore(erc20Wrapper, erc721Wrapper, erc1155ProxyWrapper);
        this._web3Wrapper = new Web3Wrapper(provider);
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
        const initTakerAssetFilledAmount = await this._exchange.filled.callAsync(
            orderHashUtils.getOrderHashHex(signedOrder),
        );
        // Assert init state of exchange
        await this._assertOrderStateAsync(signedOrder, initTakerAssetFilledAmount);
        // Simulate and execute fill then assert outputs
        const [
            simulatedFillResults,
            simulatedFillEvent,
            simulatedFinalBalanceStore,
        ] = FillOrderWrapper.simulateFillOrder(signedOrder, from, opts, this._blockchainBalanceStore);
        const [fillResults, fillEvent] = await this._fillOrderAsync(signedOrder, from, opts);
        // Assert state transition
        expect(simulatedFillResults, 'Fill Results').to.be.deep.equal(fillResults);
        expect(simulatedFillEvent, 'Fill Events').to.be.deep.equal(fillEvent);
        const areBalancesEqual = BalanceStore.isEqual(simulatedFinalBalanceStore, this._blockchainBalanceStore);
        expect(areBalancesEqual, 'Balances After Fill').to.be.true();
        // Assert end state of exchange
        const finalTakerAssetFilledAmount = initTakerAssetFilledAmount.plus(fillResults.takerAssetFilledAmount);
        await this._assertOrderStateAsync(signedOrder, finalTakerAssetFilledAmount);
    }

    /**
     * Fills an order on-chain. As an optimization this function auto-updates the blockchain balance store
     * used by this contract.
     */
    protected async _fillOrderAsync(
        signedOrder: SignedOrder,
        from: string,
        opts: { takerAssetFillAmount?: BigNumber } = {},
    ): Promise<[FillResults, FillEventArgs]> {
        const params = orderUtils.createFill(signedOrder, opts.takerAssetFillAmount);
        const fillResults = await this._exchange.fillOrder.callAsync(
            params.order,
            params.takerAssetFillAmount,
            params.signature,
            { from },
        );
        // @TODO: Replace with `awaitTransactionAsync` once `development` is merged into `3.0` branch
        const txHash = await this._exchange.fillOrder.sendTransactionAsync(
            params.order,
            params.takerAssetFillAmount,
            params.signature,
            { from },
        );
        const logDecoder = new LogDecoder(this._web3Wrapper, {
            ...artifacts,
            ...proxyArtifacts,
            ...erc20Artifacts,
            ...erc721Artifacts,
        });
        const txReceipt = await logDecoder.getTxWithDecodedLogsAsync(txHash);
        const fillEvent = FillOrderWrapper._extractFillEventsfromReceipt(txReceipt)[0];
        await this._blockchainBalanceStore.updateBalancesAsync();
        return [fillResults, fillEvent];
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
}
