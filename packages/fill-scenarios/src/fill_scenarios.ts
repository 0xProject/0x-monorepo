import { DummyERC20TokenContract, DummyERC721TokenContract, ExchangeContract } from '@0xproject/abi-gen-wrappers';
import * as artifacts from '@0xproject/contract-artifacts';
import { assetDataUtils } from '@0xproject/order-utils';
import { orderFactory } from '@0xproject/order-utils/lib/src/order_factory';
import { AssetProxyId, ERC721AssetData, OrderWithoutExchangeAddress, SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import { Provider } from 'ethereum-types';
import * as _ from 'lodash';

import { constants } from './constants';

export class FillScenarios {
    private readonly _web3Wrapper: Web3Wrapper;
    private readonly _userAddresses: string[];
    private readonly _coinbase: string;
    private readonly _zrxTokenAddress: string;
    private readonly _exchangeAddress: string;
    private readonly _erc20ProxyAddress: string;
    private readonly _erc721ProxyAddress: string;
    constructor(
        provider: Provider,
        userAddresses: string[],
        zrxTokenAddress: string,
        exchangeAddress: string,
        erc20ProxyAddress: string,
        erc721ProxyAddress: string,
    ) {
        this._web3Wrapper = new Web3Wrapper(provider);
        this._userAddresses = userAddresses;
        this._coinbase = userAddresses[0];
        this._zrxTokenAddress = zrxTokenAddress;
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
        makerFee: BigNumber,
        takerFee: BigNumber,
        makerAddress: string,
        takerAddress: string,
        fillableAmount: BigNumber,
        feeRecipientAddress: string,
        expirationTimeSeconds?: BigNumber,
    ): Promise<SignedOrder> {
        return this._createAsymmetricFillableSignedOrderWithFeesAsync(
            makerAssetData,
            takerAssetData,
            makerFee,
            takerFee,
            makerAddress,
            takerAddress,
            fillableAmount,
            fillableAmount,
            feeRecipientAddress,
            expirationTimeSeconds,
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
        const makerFee = new BigNumber(0);
        const takerFee = new BigNumber(0);
        const feeRecipientAddress = constants.NULL_ADDRESS;
        return this._createAsymmetricFillableSignedOrderWithFeesAsync(
            makerAssetData,
            takerAssetData,
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
            artifacts.Exchange.compilerOutput.abi,
            signedOrder.exchangeAddress,
            this._web3Wrapper.getProvider(),
            this._web3Wrapper.getContractDefaults(),
        );

        const orderWithoutExchangeAddress = _.omit(signedOrder, [
            'signature',
            'exchangeAddress',
        ]) as OrderWithoutExchangeAddress;

        const txHash = await exchangeInstance.fillOrder.sendTransactionAsync(
            orderWithoutExchangeAddress,
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
        makerFee: BigNumber,
        takerFee: BigNumber,
        makerAddress: string,
        takerAddress: string,
        makerFillableAmount: BigNumber,
        takerFillableAmount: BigNumber,
        feeRecipientAddress: string,
        expirationTimeSeconds?: BigNumber,
    ): Promise<SignedOrder> {
        const decodedMakerAssetData = assetDataUtils.decodeAssetDataOrThrow(makerAssetData);
        if (decodedMakerAssetData.assetProxyId === AssetProxyId.ERC20) {
            await this._increaseERC20BalanceAndAllowanceAsync(
                decodedMakerAssetData.tokenAddress,
                makerAddress,
                makerFillableAmount,
            );
        } else {
            if (!makerFillableAmount.equals(1)) {
                throw new Error(`ERC721 makerFillableAmount should be equal 1. Found: ${makerFillableAmount}`);
            }
            await this._increaseERC721BalanceAndAllowanceAsync(
                decodedMakerAssetData.tokenAddress,
                makerAddress,
                // tslint:disable-next-line:no-unnecessary-type-assertion
                (decodedMakerAssetData as ERC721AssetData).tokenId,
            );
        }
        const decodedTakerAssetData = assetDataUtils.decodeAssetDataOrThrow(takerAssetData);
        if (decodedTakerAssetData.assetProxyId === AssetProxyId.ERC20) {
            const takerTokenAddress = decodedTakerAssetData.tokenAddress;
            await this._increaseERC20BalanceAndAllowanceAsync(takerTokenAddress, takerAddress, takerFillableAmount);
        } else {
            if (!takerFillableAmount.equals(1)) {
                throw new Error(`ERC721 takerFillableAmount should be equal 1. Found: ${takerFillableAmount}`);
            }
            await this._increaseERC721BalanceAndAllowanceAsync(
                decodedTakerAssetData.tokenAddress,
                takerAddress,
                // tslint:disable-next-line:no-unnecessary-type-assertion
                (decodedMakerAssetData as ERC721AssetData).tokenId,
            );
        }
        // Fees
        await Promise.all([
            this._increaseERC20BalanceAndAllowanceAsync(this._zrxTokenAddress, makerAddress, makerFee),
            this._increaseERC20BalanceAndAllowanceAsync(this._zrxTokenAddress, takerAddress, takerFee),
        ]);
        const senderAddress = constants.NULL_ADDRESS;

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
                senderAddress,
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
            artifacts.DummyERC721Token.compilerOutput.abi,
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
            artifacts.DummyERC721Token.compilerOutput.abi,
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
