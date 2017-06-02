import * as BigNumber from 'bignumber.js';
import {ZeroEx} from '../../src/0x.js';
import {Token, SignedOrder} from '../../src/types';
import {orderFactory} from '../utils/order_factory';

export class FillScenarios {
    private zeroEx: ZeroEx;
    private userAddresses: string[];
    private tokens: Token[];
    private coinBase: string;
    constructor(zeroEx: ZeroEx, userAddresses: string[], tokens: Token[]) {
        this.zeroEx = zeroEx;
        this.userAddresses = userAddresses;
        this.tokens = tokens;
        this.coinBase = userAddresses[0];
    }
    public async createFillableSignedOrderAsync(makerTokenAddress: string, takerTokenAddress: string,
                                                makerAddress: string, takerAddress: string,
                                                fillableAmount: BigNumber.BigNumber,
                                                expirationUnixTimestampSec?: BigNumber.BigNumber):
                                           Promise<SignedOrder> {
        return this.createAsymetricFillableSignedOrderAsync(
            makerTokenAddress, takerTokenAddress, makerAddress, takerAddress,
            fillableAmount, fillableAmount, expirationUnixTimestampSec,
        );
    }
    public async createAsymetricFillableSignedOrderAsync(
        makerTokenAddress: string, takerTokenAddress: string, makerAddress: string, takerAddress: string,
        makerFillableAmount: BigNumber.BigNumber, takerFillableAmount: BigNumber.BigNumber,
        expirationUnixTimestampSec?: BigNumber.BigNumber): Promise<SignedOrder> {
        await this.zeroEx.token.transferAsync(makerTokenAddress, this.coinBase, makerAddress, makerFillableAmount);
        await this.zeroEx.token.setProxyAllowanceAsync(makerTokenAddress, makerAddress, makerFillableAmount);
        await this.zeroEx.token.transferAsync(takerTokenAddress, this.coinBase, takerAddress, takerFillableAmount);
        await this.zeroEx.token.setProxyAllowanceAsync(takerTokenAddress, takerAddress, takerFillableAmount);

        const transactionSenderAccount = await this.zeroEx.getTransactionSenderAccountIfExistsAsync();
        this.zeroEx.setTransactionSenderAccount(makerAddress);
        const signedOrder = await orderFactory.createSignedOrderAsync(this.zeroEx, makerAddress,
            takerAddress, makerFillableAmount, makerTokenAddress, takerFillableAmount, takerTokenAddress,
            expirationUnixTimestampSec);
        this.zeroEx.setTransactionSenderAccount(transactionSenderAccount as string);
        return signedOrder;
    }
}
