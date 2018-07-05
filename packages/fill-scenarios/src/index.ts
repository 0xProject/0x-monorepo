import { assetProxyUtils, orderFactory } from '@0xproject/order-utils';
import { OrderWithoutExchangeAddress, SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import { Provider } from 'ethereum-types';
import * as _ from 'lodash';

import { artifacts } from './artifacts';
import { constants } from './constants';
import { ERC20TokenContract } from './generated_contract_wrappers/erc20_token';
import { ExchangeContract } from './generated_contract_wrappers/exchange';

export class FillScenarios {
    private _web3Wrapper: Web3Wrapper;
    private _userAddresses: string[];
    private _coinbase: string;
    private _zrxTokenAddress: string;
    private _exchangeAddress: string;
    private _erc20ProxyAddress: string;
    constructor(
        provider: Provider,
        userAddresses: string[],
        zrxTokenAddress: string,
        exchangeAddress: string,
        erc20ProxyAddress: string,
    ) {
        this._web3Wrapper = new Web3Wrapper(provider);
        this._userAddresses = userAddresses;
        this._coinbase = userAddresses[0];
        this._zrxTokenAddress = zrxTokenAddress;
        this._exchangeAddress = exchangeAddress;
        this._erc20ProxyAddress = erc20ProxyAddress;
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
        feeRecepientAddress: string,
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
            feeRecepientAddress,
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
        const feeRecepientAddress = constants.NULL_ADDRESS;
        return this._createAsymmetricFillableSignedOrderWithFeesAsync(
            makerAssetData,
            takerAssetData,
            makerFee,
            takerFee,
            makerAddress,
            takerAddress,
            makerFillableAmount,
            takerFillableAmount,
            feeRecepientAddress,
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

        await exchangeInstance.fillOrder.sendTransactionAsync(
            orderWithoutExchangeAddress,
            partialFillAmount,
            signedOrder.signature,
            { from: takerAddress },
        );
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
        feeRecepientAddress: string,
        expirationTimeSeconds?: BigNumber,
    ): Promise<SignedOrder> {
        const makerERC20AssetData = assetProxyUtils.decodeERC20AssetData(makerAssetData);
        const makerTokenAddress = makerERC20AssetData.tokenAddress;
        const takerERC20AssetData = assetProxyUtils.decodeERC20AssetData(takerAssetData);
        const takerTokenAddress = takerERC20AssetData.tokenAddress;
        await Promise.all([
            this._increaseERC20BalanceAndAllowanceAsync(makerTokenAddress, makerAddress, makerFillableAmount),
            this._increaseERC20BalanceAndAllowanceAsync(takerTokenAddress, takerAddress, takerFillableAmount),
        ]);
        await Promise.all([
            this._increaseERC20BalanceAndAllowanceAsync(this._zrxTokenAddress, makerAddress, makerFee),
            this._increaseERC20BalanceAndAllowanceAsync(this._zrxTokenAddress, takerAddress, takerFee),
        ]);
        const senderAddress = constants.NULL_ADDRESS;

        const signedOrder = await orderFactory.createSignedOrderAsync(
            this._web3Wrapper.getProvider(),
            makerAddress,
            takerAddress,
            senderAddress,
            makerFee,
            takerFee,
            makerFillableAmount,
            makerAssetData,
            takerFillableAmount,
            takerAssetData,
            this._exchangeAddress,
            feeRecepientAddress,
            expirationTimeSeconds,
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
        const token = new ERC20TokenContract(
            artifacts.ERC20Token.compilerOutput.abi,
            tokenAddress,
            this._web3Wrapper.getProvider(),
            this._web3Wrapper.getContractDefaults(),
        );
        await token.transfer.sendTransactionAsync(address, amount, {
            from: this._coinbase,
        });
    }
    private async _increaseERC20AllowanceAsync(
        tokenAddress: string,
        address: string,
        amount: BigNumber,
    ): Promise<void> {
        const tokenInstance = new ERC20TokenContract(
            artifacts.ERC20Token.compilerOutput.abi,
            tokenAddress,
            this._web3Wrapper.getProvider(),
            this._web3Wrapper.getContractDefaults(),
        );
        const oldMakerAllowance = await tokenInstance.allowance.callAsync(address, this._erc20ProxyAddress);
        const newMakerAllowance = oldMakerAllowance.plus(amount);

        await tokenInstance.approve.sendTransactionAsync(this._erc20ProxyAddress, newMakerAllowance, {
            from: address,
        });
    }
}
