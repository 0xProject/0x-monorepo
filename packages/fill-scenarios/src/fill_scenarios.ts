import { DummyERC20TokenContract, DummyERC721TokenContract, ExchangeContract } from '@0x/abi-gen-wrappers';
import { assetDataUtils } from '@0x/order-utils';
import { orderFactory } from '@0x/order-utils/lib/src/order_factory';
import { OrderWithoutDomain, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { SupportedProvider } from 'ethereum-types';
import * as _ from 'lodash';

import { constants } from './constants';

export class FillScenarios {
    private readonly _web3Wrapper: Web3Wrapper;
    private readonly _userAddresses: string[];
    private readonly _coinbase: string;
    private readonly _exchangeAddress: string;
    private readonly _erc20ProxyAddress: string;
    private readonly _erc721ProxyAddress: string;
    constructor(
        supportedProvider: SupportedProvider,
        userAddresses: string[],
        exchangeAddress: string,
        erc20ProxyAddress: string,
        erc721ProxyAddress: string,
    ) {
        this._web3Wrapper = new Web3Wrapper(supportedProvider);
        this._userAddresses = userAddresses;
        this._coinbase = userAddresses[0];
        this._exchangeAddress = exchangeAddress;
        this._erc20ProxyAddress = erc20ProxyAddress;
        this._erc721ProxyAddress = erc721ProxyAddress;
    }
    public async createFillableSignedOrderAsync(
        makerAssetData: string,
        takerAssetData: string,
        makerAddress: string,
        takerAddress: string,
        fillableAmount: BigNumber,
        expirationTimeSeconds?: BigNumber,
    ): Promise<SignedOrder> {
        return this.createAsymmetricFillableSignedOrderAsync(
            makerAssetData,
            takerAssetData,
            makerAddress,
            takerAddress,
            fillableAmount,
            fillableAmount,
            expirationTimeSeconds,
        );
    }
    public async createFillableSignedOrderWithFeesAsync(
        makerAssetData: string,
        takerAssetData: string,
        makerFeeAssetData: string,
        takerFeeAssetData: string,
        makerFee: BigNumber,
        takerFee: BigNumber,
        makerAddress: string,
        takerAddress: string,
        fillableAmount: BigNumber,
        feeRecipientAddress: string,
        expirationTimeSeconds?: BigNumber,
        senderAddress?: string,
    ): Promise<SignedOrder> {
        return this._createAsymmetricFillableSignedOrderWithFeesAsync(
            makerAssetData,
            takerAssetData,
            makerFeeAssetData,
            takerFeeAssetData,
            makerFee,
            takerFee,
            makerAddress,
            takerAddress,
            fillableAmount,
            fillableAmount,
            feeRecipientAddress,
            expirationTimeSeconds,
            senderAddress,
        );
    }
    public async createAsymmetricFillableSignedOrderAsync(
        makerAssetData: string,
        takerAssetData: string,
        makerAddress: string,
        takerAddress: string,
        makerFillableAmount: BigNumber,
        takerFillableAmount: BigNumber,
        expirationTimeSeconds?: BigNumber,
    ): Promise<SignedOrder> {
        const makerFeeAssetData = constants.NULL_BYTES;
        const takerFeeAssetData = constants.NULL_BYTES;
        const makerFee = new BigNumber(0);
        const takerFee = new BigNumber(0);
        const feeRecipientAddress = constants.NULL_ADDRESS;
        return this._createAsymmetricFillableSignedOrderWithFeesAsync(
            makerAssetData,
            takerAssetData,
            makerFeeAssetData,
            takerFeeAssetData,
            makerFee,
            takerFee,
            makerAddress,
            takerAddress,
            makerFillableAmount,
            takerFillableAmount,
            feeRecipientAddress,
            expirationTimeSeconds,
        );
    }
    public async createPartiallyFilledSignedOrderAsync(
        makerAssetData: string,
        takerAssetData: string,
        takerAddress: string,
        fillableAmount: BigNumber,
        partialFillAmount: BigNumber,
    ): Promise<SignedOrder> {
        const [makerAddress] = this._userAddresses;
        const signedOrder = await this.createAsymmetricFillableSignedOrderAsync(
            makerAssetData,
            takerAssetData,
            makerAddress,
            takerAddress,
            fillableAmount,
            fillableAmount,
        );
        const exchangeInstance = new ExchangeContract(
            signedOrder.domain.verifyingContract,
            this._web3Wrapper.getProvider(),
            this._web3Wrapper.getContractDefaults(),
        );

        const orderWithoutDomain = _.omit(signedOrder, ['signature', 'domain']) as OrderWithoutDomain;

        const txHash = await exchangeInstance.fillOrder.sendTransactionAsync(
            orderWithoutDomain,
            partialFillAmount,
            signedOrder.signature,
            { from: takerAddress },
        );
        await this._web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
        return signedOrder;
    }
    private async _createAsymmetricFillableSignedOrderWithFeesAsync(
        makerAssetData: string,
        takerAssetData: string,
        makerFeeAssetData: string,
        takerFeeAssetData: string,
        makerFee: BigNumber,
        takerFee: BigNumber,
        makerAddress: string,
        takerAddress: string,
        makerFillableAmount: BigNumber,
        takerFillableAmount: BigNumber,
        feeRecipientAddress: string,
        expirationTimeSeconds?: BigNumber,
        senderAddress?: string,
    ): Promise<SignedOrder> {
        await this._increaseBalanceAndAllowanceWithAssetDataAsync(makerAssetData, makerAddress, makerFillableAmount);
        await this._increaseBalanceAndAllowanceWithAssetDataAsync(takerAssetData, takerAddress, takerFillableAmount);
        // Fees
        await Promise.all([
            this._increaseERC20BalanceAndAllowanceAsync(makerFeeAssetData, makerAddress, makerFee),
            this._increaseERC20BalanceAndAllowanceAsync(takerFeeAssetData, takerAddress, takerFee),
        ]);
        const _senderAddress = senderAddress ? senderAddress : constants.NULL_ADDRESS;

        const signedOrder = await orderFactory.createSignedOrderAsync(
            this._web3Wrapper.getProvider(),
            makerAddress,
            makerFillableAmount,
            makerAssetData,
            takerFillableAmount,
            takerAssetData,
            this._exchangeAddress,
            {
                takerAddress,
                senderAddress: _senderAddress,
                makerFeeAssetData,
                takerFeeAssetData,
                makerFee,
                takerFee,
                feeRecipientAddress,
                expirationTimeSeconds,
            },
        );
        return signedOrder;
    }
    private async _increaseERC721BalanceAndAllowanceAsync(
        tokenAddress: string,
        address: string,
        tokenId: BigNumber,
    ): Promise<void> {
        await this._increaseERC721BalanceAsync(tokenAddress, address, tokenId);
        await this._increaseERC721AllowanceAsync(tokenAddress, address, tokenId);
    }
    private async _increaseERC721AllowanceAsync(
        tokenAddress: string,
        address: string,
        tokenId: BigNumber,
    ): Promise<void> {
        const erc721Token = new DummyERC721TokenContract(
            tokenAddress,
            this._web3Wrapper.getProvider(),
            this._web3Wrapper.getContractDefaults(),
        );
        const txHash = await erc721Token.approve.sendTransactionAsync(this._erc721ProxyAddress, tokenId, {
            from: address,
        });
        await this._web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
    }
    private async _increaseERC721BalanceAsync(
        tokenAddress: string,
        address: string,
        tokenId: BigNumber,
    ): Promise<void> {
        const erc721Token = new DummyERC721TokenContract(
            tokenAddress,
            this._web3Wrapper.getProvider(),
            this._web3Wrapper.getContractDefaults(),
        );
        try {
            const currentOwner = await erc721Token.ownerOf.callAsync(tokenId);
            if (currentOwner !== address) {
                throw new Error(`Token ${tokenAddress}:${tokenId} is already owner by ${currentOwner}`);
            }
        } catch (err) {
            const txHash = await erc721Token.mint.sendTransactionAsync(address, tokenId, { from: this._coinbase });
            await this._web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
        }
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
    private async _increaseBalanceAndAllowanceWithAssetDataAsync(
        assetData: string,
        userAddress: string,
        amount: BigNumber,
    ): Promise<void> {
        const decodedAssetData = assetDataUtils.decodeAssetDataOrThrow(assetData);
        if (assetDataUtils.isERC20AssetData(decodedAssetData)) {
            await this._increaseERC20BalanceAndAllowanceAsync(decodedAssetData.tokenAddress, userAddress, amount);
        } else if (assetDataUtils.isERC721AssetData(decodedAssetData)) {
            await this._increaseERC721BalanceAndAllowanceAsync(
                decodedAssetData.tokenAddress,
                userAddress,
                decodedAssetData.tokenId,
            );
        } else if (assetDataUtils.isMultiAssetData(decodedAssetData)) {
            for (const [index, nestedAssetDataElement] of decodedAssetData.nestedAssetData.entries()) {
                const amountsElement = decodedAssetData.amounts[index];
                const totalAmount = amount.times(amountsElement);
                await this._increaseBalanceAndAllowanceWithAssetDataAsync(
                    nestedAssetDataElement,
                    userAddress,
                    totalAmount,
                );
            }
        }
    }
}
