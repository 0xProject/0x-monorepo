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

        const transactionSenderAccount = await this.zeroEx.getTransactionSenderAccountIfExistsAsync();
        this.zeroEx.setTransactionSenderAccount(makerAddress);
        const signedOrder = await orderFactory.createSignedOrderAsync(this.zeroEx, makerAddress,
            takerAddress, fillableAmount, makerTokenAddress, fillableAmount, takerTokenAddress,
            expirationUnixTimestampSec);
        this.zeroEx.setTransactionSenderAccount(transactionSenderAccount as string);
        return signedOrder;
    }
    public async createPartiallyFilledSignedOrderAsync(makerTokenAddress: string, takerTokenAddress: string,
                                                       takerAddress: string, fillableAmount: BigNumber.BigNumber,
                                                       partialFillAmount: BigNumber.BigNumber) {
        const prevSenderAccount = await this.zeroEx.getTransactionSenderAccountIfExistsAsync();
        const [makerAddress] = this.userAddresses;
        await this.zeroEx.token.setProxyAllowanceAsync(makerTokenAddress, makerAddress, fillableAmount);
        await this.zeroEx.token.transferAsync(takerTokenAddress, makerAddress, takerAddress, fillableAmount);
        await this.zeroEx.token.setProxyAllowanceAsync(takerTokenAddress, takerAddress, fillableAmount);

        const signedOrder = await orderFactory.createSignedOrderAsync(this.zeroEx, makerAddress,
         takerAddress, fillableAmount, makerTokenAddress, fillableAmount, takerTokenAddress);

        this.zeroEx.setTransactionSenderAccount(takerAddress);
        const shouldCheckTransfer = false;
        await this.zeroEx.exchange.fillOrderAsync(signedOrder, partialFillAmount, shouldCheckTransfer);

        // Re-set sender account so as to avoid introducing side-effects
        this.zeroEx.setTransactionSenderAccount(prevSenderAccount as string);
        return signedOrder;
    }
}
