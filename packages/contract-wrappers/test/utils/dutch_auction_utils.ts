import { DummyERC20TokenContract } from '@0x/abi-gen-wrappers';
import * as artifacts from '@0x/contract-artifacts';
import { assetDataUtils } from '@0x/order-utils';
import { orderFactory } from '@0x/order-utils/lib/src/order_factory';
import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';

import { DutchAuctionWrapper } from '../../src/contract_wrappers/dutch_auction_wrapper';

import { constants } from './constants';

export class DutchAuctionUtils {
    private readonly _web3Wrapper: Web3Wrapper;
    private readonly _coinbase: string;
    private readonly _exchangeAddress: string;
    private readonly _erc20ProxyAddress: string;

    constructor(web3Wrapper: Web3Wrapper, coinbase: string, exchangeAddress: string, erc20ProxyAddress: string) {
        this._web3Wrapper = web3Wrapper;
        this._coinbase = coinbase;
        this._exchangeAddress = exchangeAddress;
        this._erc20ProxyAddress = erc20ProxyAddress;
    }
    public async createSignedSellOrderAsync(
        auctionBeginTimeSections: BigNumber,
        acutionEndTimeSeconds: BigNumber,
        auctionBeginTakerAssetAmount: BigNumber,
        auctionEndTakerAssetAmount: BigNumber,
        makerAssetAmount: BigNumber,
        makerAssetData: string,
        takerAssetData: string,
        makerAddress: string,
        takerAddress: string,
        senderAddress?: string,
        makerFee?: BigNumber,
        takerFee?: BigNumber,
        feeRecipientAddress?: string,
    ): Promise<SignedOrder> {
        // Notes on sell order:
        // - The `takerAssetAmount` is set to the `auctionEndTakerAssetAmount`, which is the lowest amount the
        //   the seller can expect to receive
        // - The `makerAssetData` is overloaded to include the auction begin time and begin taker asset amount
        const makerAssetDataWithAuctionDetails = DutchAuctionWrapper.encodeDutchAuctionAssetData(
            makerAssetData,
            auctionBeginTimeSections,
            auctionBeginTakerAssetAmount,
        );
        const signedOrder = await orderFactory.createSignedOrderAsync(
            this._web3Wrapper.getProvider(),
            makerAddress,
            makerAssetAmount,
            makerAssetDataWithAuctionDetails,
            auctionEndTakerAssetAmount,
            takerAssetData,
            this._exchangeAddress,
            {
                takerAddress,
                senderAddress,
                makerFee,
                takerFee,
                feeRecipientAddress,
                expirationTimeSeconds: acutionEndTimeSeconds,
            },
        );
        const erc20AssetData = assetDataUtils.decodeERC20AssetData(makerAssetData);
        await this._increaseERC20BalanceAndAllowanceAsync(erc20AssetData.tokenAddress, makerAddress, makerAssetAmount);
        return signedOrder;
    }
    public async createSignedBuyOrderAsync(
        sellOrder: SignedOrder,
        buyerAddress: string,
        senderAddress?: string,
        makerFee?: BigNumber,
        takerFee?: BigNumber,
        feeRecipientAddress?: string,
        expirationTimeSeconds?: BigNumber,
    ): Promise<SignedOrder> {
        const dutchAuctionData = DutchAuctionWrapper.decodeDutchAuctionData(sellOrder.makerAssetData);
        // Notes on buy order:
        // - The `makerAssetAmount` is set to `dutchAuctionData.beginAmount`, which is
        //   the highest amount the buyer would have to pay out at any point during the auction.
        // - The `takerAssetAmount` is set to the seller's `makerAssetAmount`, as the buyer
        //   receives the entire amount being sold by the seller.
        // - The `makerAssetData`/`takerAssetData` are reversed from the sell order
        const signedOrder = await orderFactory.createSignedOrderAsync(
            this._web3Wrapper.getProvider(),
            buyerAddress,
            dutchAuctionData.beginAmount,
            sellOrder.takerAssetData,
            sellOrder.makerAssetAmount,
            sellOrder.makerAssetData,
            sellOrder.exchangeAddress,
            {
                senderAddress,
                makerFee,
                takerFee,
                feeRecipientAddress,
                expirationTimeSeconds,
            },
        );
        const buyerERC20AssetData = assetDataUtils.decodeERC20AssetData(sellOrder.takerAssetData);
        await this._increaseERC20BalanceAndAllowanceAsync(
            buyerERC20AssetData.tokenAddress,
            buyerAddress,
            dutchAuctionData.beginAmount,
        );
        return signedOrder;
    }
    private async _increaseERC20BalanceAndAllowanceAsync(
        tokenAddress: string,
        address: string,
        amount: BigNumber,
    ): Promise<void> {
        if (amount.isZero() || address === constants.NULL_ADDRESS) {
            return; // noop
        }
        await Promise.all([
            this._increaseERC20BalanceAsync(tokenAddress, address, amount),
            this._increaseERC20AllowanceAsync(tokenAddress, address, amount),
        ]);
    }
    private async _increaseERC20BalanceAsync(tokenAddress: string, address: string, amount: BigNumber): Promise<void> {
        const erc20Token = new DummyERC20TokenContract(
            artifacts.DummyERC20Token.compilerOutput.abi,
            artifacts.DummyERC20Token.compilerOutput.evm.deployedBytecode.object,
            tokenAddress,
            this._web3Wrapper.getProvider(),
            this._web3Wrapper.getContractDefaults(),
        );
        const txHash = await erc20Token.transfer.sendTransactionAsync(address, amount, {
            from: this._coinbase,
        });
        await this._web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
    }
    private async _increaseERC20AllowanceAsync(
        tokenAddress: string,
        address: string,
        amount: BigNumber,
    ): Promise<void> {
        const erc20Token = new DummyERC20TokenContract(
            artifacts.DummyERC20Token.compilerOutput.abi,
            artifacts.DummyERC20Token.compilerOutput.evm.deployedBytecode.object,
            tokenAddress,
            this._web3Wrapper.getProvider(),
            this._web3Wrapper.getContractDefaults(),
        );
        const oldMakerAllowance = await erc20Token.allowance.callAsync(address, this._erc20ProxyAddress);
        const newMakerAllowance = oldMakerAllowance.plus(amount);
        const txHash = await erc20Token.approve.sendTransactionAsync(this._erc20ProxyAddress, newMakerAllowance, {
            from: address,
        });
        await this._web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
    }
}
