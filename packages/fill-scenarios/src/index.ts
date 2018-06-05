import { assetProxyUtils, orderFactory } from '@0xproject/order-utils';
import { OrderWithoutExchangeAddress, SignedOrder, Token } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import { Provider } from 'ethereum-types';
import * as _ from 'lodash';

import { artifacts } from './artifacts';
import { constants } from './constants';
import { DummyERC20TokenContract } from './generated_contract_wrappers/dummy_e_r_c20_token';
import { ERC20TokenContract } from './generated_contract_wrappers/e_r_c20_token';
import { ExchangeContract } from './generated_contract_wrappers/exchange';

const INITIAL_COINBASE_TOKEN_SUPPLY_IN_UNITS = new BigNumber(100);

export class FillScenarios {
    private _web3Wrapper: Web3Wrapper;
    private _userAddresses: string[];
    private _tokens: Token[];
    private _coinbase: string;
    private _zrxTokenAddress: string;
    private _exchangeAddress: string;
    constructor(
        provider: Provider,
        userAddresses: string[],
        tokens: Token[],
        zrxTokenAddress: string,
        exchangeAddress: string,
    ) {
        this._web3Wrapper = new Web3Wrapper(provider);
        this._userAddresses = userAddresses;
        this._tokens = tokens;
        this._coinbase = userAddresses[0];
        this._zrxTokenAddress = zrxTokenAddress;
        this._exchangeAddress = exchangeAddress;
    }
    public async initTokenBalancesAsync(): Promise<void> {
        for (const token of this._tokens) {
            if (token.symbol !== 'ZRX' && token.symbol !== 'WETH') {
                const dummyERC20Token = new DummyERC20TokenContract(
                    artifacts.DummyToken.abi,
                    token.address,
                    this._web3Wrapper.getProvider(),
                    this._web3Wrapper.getContractDefaults(),
                );
                const tokenSupply = Web3Wrapper.toBaseUnitAmount(
                    INITIAL_COINBASE_TOKEN_SUPPLY_IN_UNITS,
                    token.decimals,
                );
                const txHash = await dummyERC20Token.setBalance.sendTransactionAsync(this._coinbase, tokenSupply, {
                    from: this._coinbase,
                });
                await this._web3Wrapper.awaitTransactionSuccessAsync(txHash);
            }
        }
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
            artifacts.Exchange.abi,
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
        const makerERC20ProxyData = assetProxyUtils.decodeERC20ProxyData(makerAssetData);
        const makerTokenAddress = makerERC20ProxyData.tokenAddress;
        const takerERC20ProxyData = assetProxyUtils.decodeERC20ProxyData(takerAssetData);
        const takerTokenAddress = takerERC20ProxyData.tokenAddress;
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
            artifacts.Token.abi,
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
            artifacts.Token.abi,
            tokenAddress,
            this._web3Wrapper.getProvider(),
            this._web3Wrapper.getContractDefaults(),
        );
        const networkId = await this._web3Wrapper.getNetworkIdAsync();
        const networkArtifactsIfExists = artifacts.TokenTransferProxy.networks[networkId];
        if (_.isUndefined(networkArtifactsIfExists)) {
            throw new Error(`Did not find network artifacts for networkId: ${networkId}`);
        }
        const proxyAddress = networkArtifactsIfExists.address;
        const oldMakerAllowance = await tokenInstance.allowance.callAsync(address, proxyAddress);
        const newMakerAllowance = oldMakerAllowance.plus(amount);

        await tokenInstance.approve.sendTransactionAsync(proxyAddress, newMakerAllowance, {
            from: address,
        });
    }
}
