import { formatters, orderFactory } from '@0xproject/order-utils';
import { Provider, SignedOrder, Token } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as _ from 'lodash';

import { artifacts } from './artifacts';
import { constants } from './constants';
import { DummyTokenContract } from './generated_contract_wrappers/dummy_token';
import { ExchangeContract } from './generated_contract_wrappers/exchange';
import { TokenContract } from './generated_contract_wrappers/token';

const INITIAL_COINBASE_TOKEN_SUPPLY_IN_UNITS = new BigNumber(100);

export class FillScenarios {
    private _web3Wrapper: Web3Wrapper;
    private _userAddresses: string[];
    private _tokens: Token[];
    private _coinbase: string;
    private _zrxTokenAddress: string;
    private _exchangeContractAddress: string;
    constructor(
        provider: Provider,
        userAddresses: string[],
        tokens: Token[],
        zrxTokenAddress: string,
        exchangeContractAddress: string,
    ) {
        this._web3Wrapper = new Web3Wrapper(provider);
        this._userAddresses = userAddresses;
        this._tokens = tokens;
        this._coinbase = userAddresses[0];
        this._zrxTokenAddress = zrxTokenAddress;
        this._exchangeContractAddress = exchangeContractAddress;
    }
    public async initTokenBalancesAsync(): Promise<void> {
        for (const token of this._tokens) {
            if (token.symbol !== 'ZRX' && token.symbol !== 'WETH') {
                const dummyToken = new DummyTokenContract(
                    artifacts.DummyToken.abi,
                    token.address,
                    this._web3Wrapper.getProvider(),
                    this._web3Wrapper.getContractDefaults(),
                );
                const tokenSupply = Web3Wrapper.toBaseUnitAmount(
                    INITIAL_COINBASE_TOKEN_SUPPLY_IN_UNITS,
                    token.decimals,
                );
                const txHash = await dummyToken.setBalance.sendTransactionAsync(this._coinbase, tokenSupply, {
                    from: this._coinbase,
                });
                await this._web3Wrapper.awaitTransactionMinedAsync(txHash);
            }
        }
    }
    public async createFillableSignedOrderAsync(
        makerTokenAddress: string,
        takerTokenAddress: string,
        makerAddress: string,
        takerAddress: string,
        fillableAmount: BigNumber,
        expirationUnixTimestampSec?: BigNumber,
    ): Promise<SignedOrder> {
        return this.createAsymmetricFillableSignedOrderAsync(
            makerTokenAddress,
            takerTokenAddress,
            makerAddress,
            takerAddress,
            fillableAmount,
            fillableAmount,
            expirationUnixTimestampSec,
        );
    }
    public async createFillableSignedOrderWithFeesAsync(
        makerTokenAddress: string,
        takerTokenAddress: string,
        makerFee: BigNumber,
        takerFee: BigNumber,
        makerAddress: string,
        takerAddress: string,
        fillableAmount: BigNumber,
        feeRecepient: string,
        expirationUnixTimestampSec?: BigNumber,
    ): Promise<SignedOrder> {
        return this._createAsymmetricFillableSignedOrderWithFeesAsync(
            makerTokenAddress,
            takerTokenAddress,
            makerFee,
            takerFee,
            makerAddress,
            takerAddress,
            fillableAmount,
            fillableAmount,
            feeRecepient,
            expirationUnixTimestampSec,
        );
    }
    public async createAsymmetricFillableSignedOrderAsync(
        makerTokenAddress: string,
        takerTokenAddress: string,
        makerAddress: string,
        takerAddress: string,
        makerFillableAmount: BigNumber,
        takerFillableAmount: BigNumber,
        expirationUnixTimestampSec?: BigNumber,
    ): Promise<SignedOrder> {
        const makerFee = new BigNumber(0);
        const takerFee = new BigNumber(0);
        const feeRecepient = constants.NULL_ADDRESS;
        return this._createAsymmetricFillableSignedOrderWithFeesAsync(
            makerTokenAddress,
            takerTokenAddress,
            makerFee,
            takerFee,
            makerAddress,
            takerAddress,
            makerFillableAmount,
            takerFillableAmount,
            feeRecepient,
            expirationUnixTimestampSec,
        );
    }
    public async createPartiallyFilledSignedOrderAsync(
        makerTokenAddress: string,
        takerTokenAddress: string,
        takerAddress: string,
        fillableAmount: BigNumber,
        partialFillAmount: BigNumber,
    ): Promise<SignedOrder> {
        const [makerAddress] = this._userAddresses;
        const signedOrder = await this.createAsymmetricFillableSignedOrderAsync(
            makerTokenAddress,
            takerTokenAddress,
            makerAddress,
            takerAddress,
            fillableAmount,
            fillableAmount,
        );
        const shouldThrowOnInsufficientBalanceOrAllowance = false;
        const exchangeInstance = new ExchangeContract(
            artifacts.Exchange.abi,
            signedOrder.exchangeContractAddress,
            this._web3Wrapper.getProvider(),
            this._web3Wrapper.getContractDefaults(),
        );

        const [orderAddresses, orderValues] = formatters.getOrderAddressesAndValues(signedOrder);

        await exchangeInstance.fillOrder.sendTransactionAsync(
            orderAddresses,
            orderValues,
            partialFillAmount,
            shouldThrowOnInsufficientBalanceOrAllowance,
            signedOrder.ecSignature.v,
            signedOrder.ecSignature.r,
            signedOrder.ecSignature.s,
            { from: takerAddress },
        );
        return signedOrder;
    }
    private async _createAsymmetricFillableSignedOrderWithFeesAsync(
        makerTokenAddress: string,
        takerTokenAddress: string,
        makerFee: BigNumber,
        takerFee: BigNumber,
        makerAddress: string,
        takerAddress: string,
        makerFillableAmount: BigNumber,
        takerFillableAmount: BigNumber,
        feeRecepient: string,
        expirationUnixTimestampSec?: BigNumber,
    ): Promise<SignedOrder> {
        await Promise.all([
            this._increaseBalanceAndAllowanceAsync(makerTokenAddress, makerAddress, makerFillableAmount),
            this._increaseBalanceAndAllowanceAsync(takerTokenAddress, takerAddress, takerFillableAmount),
        ]);
        await Promise.all([
            this._increaseBalanceAndAllowanceAsync(this._zrxTokenAddress, makerAddress, makerFee),
            this._increaseBalanceAndAllowanceAsync(this._zrxTokenAddress, takerAddress, takerFee),
        ]);

        const signedOrder = await orderFactory.createSignedOrderAsync(
            this._web3Wrapper.getProvider(),
            makerAddress,
            takerAddress,
            makerFee,
            takerFee,
            makerFillableAmount,
            makerTokenAddress,
            takerFillableAmount,
            takerTokenAddress,
            this._exchangeContractAddress,
            feeRecepient,
            expirationUnixTimestampSec,
        );
        return signedOrder;
    }
    private async _increaseBalanceAndAllowanceAsync(
        tokenAddress: string,
        address: string,
        amount: BigNumber,
    ): Promise<void> {
        if (amount.isZero() || address === constants.NULL_ADDRESS) {
            return; // noop
        }
        await Promise.all([
            this._increaseBalanceAsync(tokenAddress, address, amount),
            this._increaseAllowanceAsync(tokenAddress, address, amount),
        ]);
    }
    private async _increaseBalanceAsync(tokenAddress: string, address: string, amount: BigNumber): Promise<void> {
        const token = new TokenContract(
            artifacts.Token.abi,
            tokenAddress,
            this._web3Wrapper.getProvider(),
            this._web3Wrapper.getContractDefaults(),
        );
        await token.transfer.sendTransactionAsync(address, amount, {
            from: this._coinbase,
        });
    }
    private async _increaseAllowanceAsync(tokenAddress: string, address: string, amount: BigNumber): Promise<void> {
        const tokenInstance = new TokenContract(
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
