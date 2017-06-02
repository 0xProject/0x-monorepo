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
    public async createAFillableSignedOrderAsync(makerTokenAddress: string, takerTokenAddress: string,
                                                 makerAddress: string, takerAddress: string,
                                                 fillableAmount: BigNumber.BigNumber,
                                                 expirationUnixTimestampSec?: BigNumber.BigNumber):
                                           Promise<SignedOrder> {
        await this.zeroEx.token.transferAsync(makerTokenAddress, this.coinBase, makerAddress, fillableAmount);
        await this.zeroEx.token.setProxyAllowanceAsync(makerTokenAddress, makerAddress, fillableAmount);
        await this.zeroEx.token.transferAsync(takerTokenAddress, this.coinBase, takerAddress, fillableAmount);
        await this.zeroEx.token.setProxyAllowanceAsync(takerTokenAddress, takerAddress, fillableAmount);

        const transactionSenderAccount = this.zeroEx.getTransactionSenderAccount();
        this.zeroEx.setTransactionSenderAccount(makerAddress);
        const signedOrder = await orderFactory.createSignedOrderAsync(this.zeroEx, makerAddress,
            takerAddress, fillableAmount, makerTokenAddress, fillableAmount, takerTokenAddress,
            expirationUnixTimestampSec);
        this.zeroEx.setTransactionSenderAccount(transactionSenderAccount);
        return signedOrder;
    }
}
