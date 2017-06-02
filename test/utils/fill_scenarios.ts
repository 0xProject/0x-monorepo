import * as BigNumber from 'bignumber.js';
import {ZeroEx} from '../../src/0x.js';
import {Token, SignedOrder} from '../../src/types';
import {orderFactory} from '../utils/order_factory';

export class FillScenarios {
    private zeroEx: ZeroEx;
    private userAddresses: string[];
    private tokens: Token[];
    constructor(zeroEx: ZeroEx, userAddresses: string[], tokens: Token[]) {
        this.zeroEx = zeroEx;
        this.userAddresses = userAddresses;
        this.tokens = tokens;
    }
    public async createAFillableSignedOrderAsync(makerTokenAddress: string, takerTokenAddress: string,
                                                 takerAddress: string, fillableAmount: BigNumber.BigNumber,
                                                 expirationUnixTimestampSec?: BigNumber.BigNumber):
                                           Promise<SignedOrder> {
        const [makerAddress] = this.userAddresses;
        await this.zeroEx.token.setProxyAllowanceAsync(makerTokenAddress, makerAddress, fillableAmount);
        await this.zeroEx.token.transferAsync(takerTokenAddress, makerAddress, takerAddress, fillableAmount);
        await this.zeroEx.token.setProxyAllowanceAsync(takerTokenAddress, takerAddress, fillableAmount);

        const signedOrder = await orderFactory.createSignedOrderAsync(this.zeroEx, makerAddress,
            takerAddress, fillableAmount, makerTokenAddress, fillableAmount, takerTokenAddress,
            expirationUnixTimestampSec);
        return signedOrder;
    }
    public async createPartiallyFilledSignedOrderAsync(makerTokenAddress: string, takerTokenAddress: string,
                                                       takerAddress: string, fillableAmount: BigNumber.BigNumber,
                                                       partialFillAmount: BigNumber.BigNumber) {
        const prevSenderAccount = await this.zeroEx.getTransactionSenderAccountAsync();
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
        this.zeroEx.setTransactionSenderAccount(prevSenderAccount);
        return signedOrder;
    }
}
