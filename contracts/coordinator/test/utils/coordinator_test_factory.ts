import { ERC20Wrapper } from '@0x/contracts-asset-proxy';
import {
    ExchangeCancelEventArgs,
    ExchangeCancelUpToEventArgs,
    ExchangeEvents,
    ExchangeFillEventArgs,
    ExchangeFunctionName,
} from '@0x/contracts-exchange';
import { expect, filterLogsToArguments, Numberish, TokenBalances, web3Wrapper } from '@0x/contracts-test-utils';
import { assetDataUtils, orderHashUtils } from '@0x/order-utils';
import { SignedOrder, SignedZeroExTransaction } from '@0x/types';
import { BigNumber, RevertError } from '@0x/utils';
import { TransactionReceiptWithDecodedLogs, TxData } from 'ethereum-types';
import * as _ from 'lodash';

import { CoordinatorContract } from '../../src';

export class CoordinatorTestFactory {
    private readonly _addresses: string[];
    private readonly _protocolFee: BigNumber;

    public static verifyEvents<TEventArgs>(
        txReceipt: TransactionReceiptWithDecodedLogs,
        expectedEvents: TEventArgs[],
        eventName: string,
    ): void {
        const logs = filterLogsToArguments<TEventArgs>(txReceipt.logs, eventName);
        expect(logs.length).to.eq(expectedEvents.length);
        logs.forEach((log, index) => {
            expect(log).to.deep.equal(expectedEvents[index]);
        });
    }

    private static _expectedCancelEvent(order: SignedOrder): ExchangeCancelEventArgs {
        return {
            makerAddress: order.makerAddress,
            senderAddress: order.senderAddress,
            feeRecipientAddress: order.feeRecipientAddress,
            makerAssetData: order.makerAssetData,
            takerAssetData: order.takerAssetData,
            orderHash: orderHashUtils.getOrderHashHex(order),
        };
    }

    constructor(
        private readonly _coordinatorContract: CoordinatorContract,
        private readonly _erc20Wrapper: ERC20Wrapper,
        private readonly _makerAddress: string,
        private readonly _takerAddress: string,
        private readonly _feeRecipientAddress: string,
        private readonly _protocolFeeCollectorAddress: string,
        private readonly _makerAssetAddress: string,
        private readonly _takerAssetAddress: string,
        private readonly _makerFeeAssetAddress: string,
        private readonly _takerFeeAssetAddress: string,
        private readonly _wethAddress: string,
        private readonly _gasPrice: BigNumber,
        _protocolFeeMultiplier: BigNumber,
    ) {
        this._addresses = [
            _makerAddress,
            _takerAddress,
            _coordinatorContract.address,
            _feeRecipientAddress,
            _protocolFeeCollectorAddress,
        ];
        this._protocolFee = _gasPrice.times(_protocolFeeMultiplier);
    }

    public async executeFillTransactionTestAsync(
        orders: SignedOrder[],
        transaction: SignedZeroExTransaction,
        txOrigin: string,
        approvalSignatures: string[],
        txData: Partial<TxData>,
        revertError?: RevertError,
    ): Promise<void> {
        const initBalances = await this._getTokenBalancesAsync();
        const tx = this._coordinatorContract.executeTransaction.awaitTransactionSuccessAsync(
            transaction,
            txOrigin,
            transaction.signature,
            approvalSignatures,
            txData,
        );

        if (revertError !== undefined) {
            return expect(tx).to.revertWith(revertError);
        }

        const transactionReceipt = await tx;
        CoordinatorTestFactory.verifyEvents(
            transactionReceipt,
            orders.map(order => this._expectedFillEvent(order)),
            ExchangeEvents.Fill,
        );

        const expectedBalances = this._getExpectedBalances(initBalances, orders, transactionReceipt, txData.value);
        await this._verifyBalancesAsync(expectedBalances);
    }

    public async executeCancelTransactionTestAsync(
        fnName: ExchangeFunctionName,
        orders: SignedOrder[],
        transaction: SignedZeroExTransaction,
        txOrigin: string,
        approvalSignatures: string[],
        txData: Partial<TxData>,
    ): Promise<void> {
        const transactionReceipt = await this._coordinatorContract.executeTransaction.awaitTransactionSuccessAsync(
            transaction,
            txOrigin,
            transaction.signature,
            approvalSignatures,
            txData,
        );

        if (fnName === ExchangeFunctionName.CancelOrdersUpTo) {
            const expectedEvent: ExchangeCancelUpToEventArgs = {
                makerAddress: this._makerAddress,
                orderSenderAddress: this._coordinatorContract.address,
                orderEpoch: new BigNumber(1),
            };
            CoordinatorTestFactory.verifyEvents(transactionReceipt, [expectedEvent], ExchangeEvents.CancelUpTo);
        } else {
            CoordinatorTestFactory.verifyEvents(
                transactionReceipt,
                orders.map(order => CoordinatorTestFactory._expectedCancelEvent(order)),
                ExchangeEvents.Cancel,
            );
        }
    }

    private async _getTokenBalancesAsync(): Promise<TokenBalances> {
        const erc20Balances = await this._erc20Wrapper.getBalancesAsync();
        const ethBalances = _.zipObject(
            this._addresses,
            await Promise.all(this._addresses.map(address => web3Wrapper.getBalanceInWeiAsync(address))),
        );

        return {
            erc20: erc20Balances,
            erc721: {},
            erc1155: {},
            eth: ethBalances,
        };
    }

    private _getExpectedBalances(
        initBalances: TokenBalances,
        orders: SignedOrder[],
        txReceipt: TransactionReceiptWithDecodedLogs,
        txValue?: Numberish,
    ): TokenBalances {
        const { erc20: erc20Balances, eth: ethBalances } = initBalances;
        let remainingValue = new BigNumber(txValue || 0);
        ethBalances[txReceipt.from] = ethBalances[txReceipt.from].minus(this._gasPrice.times(txReceipt.gasUsed));

        for (const order of orders) {
            const [makerAssetAddress, takerAssetAddress, makerFeeAssetAddress, takerFeeAssetAddress] = [
                order.makerAssetData,
                order.takerAssetData,
                order.makerFeeAssetData,
                order.takerFeeAssetData,
            ].map(assetData => assetDataUtils.decodeERC20AssetData(assetData).tokenAddress);

            erc20Balances[order.makerAddress][makerAssetAddress] = erc20Balances[order.makerAddress][
                makerAssetAddress
            ].minus(order.makerAssetAmount);
            erc20Balances[this._takerAddress][makerAssetAddress] = erc20Balances[this._takerAddress][
                makerAssetAddress
            ].plus(order.makerAssetAmount);
            erc20Balances[order.makerAddress][takerAssetAddress] = erc20Balances[order.makerAddress][
                takerAssetAddress
            ].plus(order.takerAssetAmount);
            erc20Balances[this._takerAddress][takerAssetAddress] = erc20Balances[this._takerAddress][
                takerAssetAddress
            ].minus(order.takerAssetAmount);
            erc20Balances[order.makerAddress][makerFeeAssetAddress] = erc20Balances[order.makerAddress][
                makerFeeAssetAddress
            ].minus(order.makerFee);
            erc20Balances[this._takerAddress][takerFeeAssetAddress] = erc20Balances[this._takerAddress][
                takerFeeAssetAddress
            ].minus(order.takerFee);
            erc20Balances[order.feeRecipientAddress][makerFeeAssetAddress] = erc20Balances[order.feeRecipientAddress][
                makerFeeAssetAddress
            ].plus(order.makerFee);
            erc20Balances[order.feeRecipientAddress][takerFeeAssetAddress] = erc20Balances[order.feeRecipientAddress][
                takerFeeAssetAddress
            ].plus(order.takerFee);

            if (remainingValue.isGreaterThanOrEqualTo(this._protocolFee)) {
                ethBalances[txReceipt.from] = ethBalances[txReceipt.from].minus(this._protocolFee);
                ethBalances[this._protocolFeeCollectorAddress] = ethBalances[this._protocolFeeCollectorAddress].plus(
                    this._protocolFee,
                );
                remainingValue = remainingValue.minus(this._protocolFee);
            } else {
                erc20Balances[this._takerAddress][this._wethAddress] = erc20Balances[this._takerAddress][
                    this._wethAddress
                ].minus(this._protocolFee);
                erc20Balances[this._protocolFeeCollectorAddress][this._wethAddress] = erc20Balances[
                    this._protocolFeeCollectorAddress
                ][this._wethAddress].plus(this._protocolFee);
            }
        }

        return {
            erc20: erc20Balances,
            erc721: {},
            erc1155: {},
            eth: ethBalances,
        };
    }

    private async _verifyBalancesAsync(expectedBalances: TokenBalances): Promise<void> {
        const { erc20: expectedErc20Balances, eth: expectedEthBalances } = expectedBalances;
        const { erc20: actualErc20Balances, eth: actualEthBalances } = await this._getTokenBalancesAsync();
        const ownersByName = {
            maker: this._makerAddress,
            taker: this._takerAddress,
            feeRecipient: this._feeRecipientAddress,
            coordinator: this._coordinatorContract.address,
            protocolFeeCollector: this._protocolFeeCollectorAddress,
        };
        const tokensByName = {
            makerAsset: this._makerAssetAddress,
            takerAsset: this._takerAssetAddress,
            makerFeeAsset: this._makerFeeAssetAddress,
            takerFeeAsset: this._takerFeeAssetAddress,
            weth: this._wethAddress,
        };
        _.forIn(ownersByName, (ownerAddress, ownerName) => {
            expect(actualEthBalances[ownerAddress], `${ownerName} eth balance`).to.bignumber.equal(
                expectedEthBalances[ownerAddress],
            );
            _.forIn(tokensByName, (tokenAddress, tokenName) => {
                expect(
                    actualErc20Balances[ownerAddress][tokenAddress],
                    `${ownerName} ${tokenName} balance`,
                ).to.bignumber.equal(expectedErc20Balances[ownerAddress][tokenAddress]);
            });
        });
    }

    private _expectedFillEvent(order: SignedOrder): ExchangeFillEventArgs {
        return {
            makerAddress: order.makerAddress,
            takerAddress: this._takerAddress,
            senderAddress: order.senderAddress,
            feeRecipientAddress: order.feeRecipientAddress,
            makerAssetData: order.makerAssetData,
            takerAssetData: order.takerAssetData,
            makerFeeAssetData: order.makerFeeAssetData,
            takerFeeAssetData: order.takerFeeAssetData,
            makerAssetFilledAmount: order.makerAssetAmount,
            takerAssetFilledAmount: order.takerAssetAmount,
            makerFeePaid: order.makerFee,
            takerFeePaid: order.takerFee,
            protocolFeePaid: this._protocolFee,
            orderHash: orderHashUtils.getOrderHashHex(order),
        };
    }
}
