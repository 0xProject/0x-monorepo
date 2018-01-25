import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';

import { SignedOrder, Token, ZeroEx } from '../../src';
import { artifacts } from '../../src/artifacts';
import { DummyTokenContract } from '../../src/contract_wrappers/generated/dummy_token';
import { orderFactory } from '../utils/order_factory';

import { constants } from './constants';

const INITIAL_COINBASE_TOKEN_SUPPLY_IN_UNITS = new BigNumber(100);

export class FillScenarios {
    private _zeroEx: ZeroEx;
    private _userAddresses: string[];
    private _tokens: Token[];
    private _coinbase: string;
    private _zrxTokenAddress: string;
    private _exchangeContractAddress: string;
    constructor(
        zeroEx: ZeroEx,
        userAddresses: string[],
        tokens: Token[],
        zrxTokenAddress: string,
        exchangeContractAddress: string,
    ) {
        this._zeroEx = zeroEx;
        this._userAddresses = userAddresses;
        this._tokens = tokens;
        this._coinbase = userAddresses[0];
        this._zrxTokenAddress = zrxTokenAddress;
        this._exchangeContractAddress = exchangeContractAddress;
    }
    public async initTokenBalancesAsync() {
        const web3Wrapper = (this._zeroEx as any)._web3Wrapper as Web3Wrapper;
        for (const token of this._tokens) {
            if (token.symbol !== 'ZRX' && token.symbol !== 'WETH') {
                const contractInstance = web3Wrapper.getContractInstance(
                    artifacts.DummyTokenArtifact.abi,
                    token.address,
                );
                const defaults = {};
                const dummyToken = new DummyTokenContract(contractInstance, defaults);
                const tokenSupply = ZeroEx.toBaseUnitAmount(INITIAL_COINBASE_TOKEN_SUPPLY_IN_UNITS, token.decimals);
                const txHash = await dummyToken.setBalance.sendTransactionAsync(this._coinbase, tokenSupply, {
                    from: this._coinbase,
                });
                await this._zeroEx.awaitTransactionMinedAsync(txHash);
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
    ) {
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
        await this._zeroEx.exchange.fillOrderAsync(
            signedOrder,
            partialFillAmount,
            shouldThrowOnInsufficientBalanceOrAllowance,
            takerAddress,
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
            this._zeroEx,
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
        if (amount.isZero() || address === ZeroEx.NULL_ADDRESS) {
            return; // noop
        }
        await Promise.all([
            this._increaseBalanceAsync(tokenAddress, address, amount),
            this._increaseAllowanceAsync(tokenAddress, address, amount),
        ]);
    }
    private async _increaseBalanceAsync(tokenAddress: string, address: string, amount: BigNumber): Promise<void> {
        await this._zeroEx.token.transferAsync(tokenAddress, this._coinbase, address, amount);
    }
    private async _increaseAllowanceAsync(tokenAddress: string, address: string, amount: BigNumber): Promise<void> {
        const oldMakerAllowance = await this._zeroEx.token.getProxyAllowanceAsync(tokenAddress, address);
        const newMakerAllowance = oldMakerAllowance.plus(amount);
        await this._zeroEx.token.setProxyAllowanceAsync(tokenAddress, address, newMakerAllowance);
    }
}
