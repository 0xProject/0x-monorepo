import * as BigNumber from 'bignumber.js';
import {ZeroEx} from '../../src/0x.js';
import {Token, SignedOrder} from '../../src/types';
import {orderFactory} from '../utils/order_factory';
import {constants} from './constants';

export class FillScenarios {
    private zeroEx: ZeroEx;
    private userAddresses: string[];
    private tokens: Token[];
    private coinbase: string;
    private zrxTokenAddress: string;
    constructor(zeroEx: ZeroEx, userAddresses: string[], tokens: Token[], zrxTokenAddress: string) {
        this.zeroEx = zeroEx;
        this.userAddresses = userAddresses;
        this.tokens = tokens;
        this.coinbase = userAddresses[0];
        this.zrxTokenAddress = zrxTokenAddress;
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
        const prevSenderAccount = await this.zeroEx.getAvailableAccountsAsync();
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
        await this.zeroEx.token.setProxyAllowanceAsync(makerTokenAddress, makerAddress, makerFillableAmount);
        await this.zeroEx.token.transferAsync(takerTokenAddress, this.coinbase, takerAddress, takerFillableAmount);
        await this.zeroEx.token.setProxyAllowanceAsync(takerTokenAddress, takerAddress, takerFillableAmount);

        if (!makerFee.isZero()) {
            await this.zeroEx.token.transferAsync(this.zrxTokenAddress, this.coinbase, makerAddress, makerFee);
            await this.zeroEx.token.setProxyAllowanceAsync(this.zrxTokenAddress, makerAddress, makerFee);
        }
        if (!takerFee.isZero()) {
            await this.zeroEx.token.transferAsync(this.zrxTokenAddress, this.coinbase, takerAddress, takerFee);
            await this.zeroEx.token.setProxyAllowanceAsync(this.zrxTokenAddress, takerAddress, takerFee);
        }

        const signedOrder = await orderFactory.createSignedOrderAsync(this.zeroEx,
            makerAddress, takerAddress, makerFee, takerFee,
            makerFillableAmount, makerTokenAddress, takerFillableAmount, takerTokenAddress,
            feeRecepient, expirationUnixTimestampSec);
        return signedOrder;
    }
}
