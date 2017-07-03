import * as BigNumber from 'bignumber.js';
import {ZeroEx, Token, SignedOrder} from '../../src';
import {orderFactory} from '../utils/order_factory';
import {constants} from './constants';

export class FillScenarios {
    private zeroEx: ZeroEx;
    private userAddresses: string[];
    private tokens: Token[];
    private coinbase: string;
    private zrxTokenAddress: string;
    private exchangeContractAddress: string;
    constructor(zeroEx: ZeroEx, userAddresses: string[],
                tokens: Token[], zrxTokenAddress: string, exchangeContractAddress: string) {
        this.zeroEx = zeroEx;
        this.userAddresses = userAddresses;
        this.tokens = tokens;
        this.coinbase = userAddresses[0];
        this.zrxTokenAddress = zrxTokenAddress;
        this.exchangeContractAddress = exchangeContractAddress;
    }
    public async createFillableSignedOrderAsync(makerTokenAddress: string, takerTokenAddress: string,
                                                makerAddress: string, takerAddress: string,
                                                fillableAmount: BigNumber.BigNumber,
                                                expirationUnixTimestampSec?: BigNumber.BigNumber):
                                           Promise<SignedOrder> {
        return this.createAsymmetricFillableSignedOrderAsync(
            makerTokenAddress, takerTokenAddress, makerAddress, takerAddress,
            fillableAmount, fillableAmount, expirationUnixTimestampSec,
        );
    }
    public async createFillableSignedOrderWithFeesAsync(
        makerTokenAddress: string, takerTokenAddress: string,
        makerFee: BigNumber.BigNumber, takerFee: BigNumber.BigNumber,
        makerAddress: string, takerAddress: string,
        fillableAmount: BigNumber.BigNumber,
        feeRecepient: string, expirationUnixTimestampSec?: BigNumber.BigNumber,
    ): Promise<SignedOrder> {
        return this.createAsymmetricFillableSignedOrderWithFeesAsync(
            makerTokenAddress, takerTokenAddress, makerFee, takerFee, makerAddress, takerAddress,
            fillableAmount, fillableAmount, feeRecepient, expirationUnixTimestampSec,
        );
    }
    public async createAsymmetricFillableSignedOrderAsync(
        makerTokenAddress: string, takerTokenAddress: string, makerAddress: string, takerAddress: string,
        makerFillableAmount: BigNumber.BigNumber, takerFillableAmount: BigNumber.BigNumber,
        expirationUnixTimestampSec?: BigNumber.BigNumber): Promise<SignedOrder> {
        const makerFee = new BigNumber(0);
        const takerFee = new BigNumber(0);
        const feeRecepient = constants.NULL_ADDRESS;
        return this.createAsymmetricFillableSignedOrderWithFeesAsync(
            makerTokenAddress, takerTokenAddress, makerFee, takerFee, makerAddress, takerAddress,
            makerFillableAmount, takerFillableAmount, feeRecepient, expirationUnixTimestampSec,
        );
    }
    public async createPartiallyFilledSignedOrderAsync(makerTokenAddress: string, takerTokenAddress: string,
                                                       takerAddress: string, fillableAmount: BigNumber.BigNumber,
                                                       partialFillAmount: BigNumber.BigNumber) {
        const [makerAddress] = this.userAddresses;
        const signedOrder = await this.createAsymmetricFillableSignedOrderAsync(
            makerTokenAddress, takerTokenAddress, makerAddress, takerAddress,
            fillableAmount, fillableAmount,
        );
        const shouldCheckTransfer = false;
        await this.zeroEx.exchange.fillOrderAsync(signedOrder, partialFillAmount, shouldCheckTransfer, takerAddress);
        return signedOrder;
    }
    private async createAsymmetricFillableSignedOrderWithFeesAsync(
        makerTokenAddress: string, takerTokenAddress: string,
        makerFee: BigNumber.BigNumber, takerFee: BigNumber.BigNumber,
        makerAddress: string, takerAddress: string,
        makerFillableAmount: BigNumber.BigNumber, takerFillableAmount: BigNumber.BigNumber,
        feeRecepient: string, expirationUnixTimestampSec?: BigNumber.BigNumber): Promise<SignedOrder> {
        await this.zeroEx.token.transferAsync(makerTokenAddress, this.coinbase, makerAddress, makerFillableAmount);
        const oldMakerAllowance = await this.zeroEx.token.getProxyAllowanceAsync(makerTokenAddress, makerAddress);
        const newMakerAllowance = oldMakerAllowance.plus(makerFillableAmount);
        await this.zeroEx.token.setProxyAllowanceAsync(
            makerTokenAddress, makerAddress, newMakerAllowance,
        );
        await this.zeroEx.token.transferAsync(takerTokenAddress, this.coinbase, takerAddress, takerFillableAmount);
        const oldTakerAllowance = await this.zeroEx.token.getProxyAllowanceAsync(takerTokenAddress, takerAddress);
        const newTakerAllowance = oldTakerAllowance.plus(takerFillableAmount);
        await this.zeroEx.token.setProxyAllowanceAsync(
            takerTokenAddress, takerAddress, newTakerAllowance,
        );

        if (!makerFee.isZero()) {
            await this.zeroEx.token.transferAsync(this.zrxTokenAddress, this.coinbase, makerAddress, makerFee);
            const oldMakerFeeAllowance =
                await this.zeroEx.token.getProxyAllowanceAsync(this.zrxTokenAddress, makerAddress);
            const newMakerFeeAllowance = oldMakerFeeAllowance.plus(makerFee);
            await this.zeroEx.token.setProxyAllowanceAsync(
                this.zrxTokenAddress, makerAddress, newMakerFeeAllowance,
            );
        }
        if (!takerFee.isZero()) {
            await this.zeroEx.token.transferAsync(this.zrxTokenAddress, this.coinbase, takerAddress, takerFee);
            const oldTakerFeeAllowance =
                await this.zeroEx.token.getProxyAllowanceAsync(this.zrxTokenAddress, takerAddress);
            const newTakerFeeAllowance = oldTakerFeeAllowance.plus(takerFee);
            await this.zeroEx.token.setProxyAllowanceAsync(
                this.zrxTokenAddress, takerAddress, newTakerFeeAllowance,
            );
        }

        const signedOrder = await orderFactory.createSignedOrderAsync(this.zeroEx,
            makerAddress, takerAddress, makerFee, takerFee,
            makerFillableAmount, makerTokenAddress, takerFillableAmount, takerTokenAddress,
            this.exchangeContractAddress, feeRecepient, expirationUnixTimestampSec);
        return signedOrder;
    }
}
