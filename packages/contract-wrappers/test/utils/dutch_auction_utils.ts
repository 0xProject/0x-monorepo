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
        auctionBeginAmount: BigNumber,
        auctionEndAmount: BigNumber,
        acutionEndTime: BigNumber,
        makerAssetData: string,
        takerAssetData: string,
        makerAddress: string,
        takerAddress: string,
        takerFillableAmount: BigNumber,
        senderAddress?: string,
        makerFee?: BigNumber,
        takerFee?: BigNumber,
        feeRecipientAddress?: string,
    ): Promise<SignedOrder> {
        const makerAssetAmount = auctionEndAmount;
        const makerAssetDataWithAuctionDetails = DutchAuctionWrapper.encodeDutchAuctionAssetData(
            makerAssetData,
            auctionBeginTimeSections,
            auctionBeginAmount,
        );
        const signedOrder = await orderFactory.createSignedOrderAsync(
            this._web3Wrapper.getProvider(),
            makerAddress,
            makerAssetAmount,
            makerAssetDataWithAuctionDetails,
            takerFillableAmount,
            takerAssetData,
            this._exchangeAddress,
            {
                takerAddress,
                senderAddress,
                makerFee,
                takerFee,
                feeRecipientAddress,
                expirationTimeSeconds: acutionEndTime,
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
    ): Promise<SignedOrder> {
        const dutchAuctionData = DutchAuctionWrapper.decodeDutchAuctionData(sellOrder.makerAssetData);
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
                expirationTimeSeconds: sellOrder.expirationTimeSeconds,
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
