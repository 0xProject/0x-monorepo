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
    public async createAFillableSignedOrderAsync(takerAddress: string, fillableAmount: BigNumber.BigNumber,
                                                 expirationUnixTimestampSec?: BigNumber.BigNumber):
                                           Promise<SignedOrder> {
        const [makerAddress] = this.userAddresses;
        const [makerToken, takerToken] = this.tokens;
        await this.zeroEx.token.setProxyAllowanceAsync(makerToken.address, makerAddress, fillableAmount);
        await this.zeroEx.token.transferAsync(takerToken.address, makerAddress, takerAddress, fillableAmount);
        await this.zeroEx.token.setProxyAllowanceAsync(takerToken.address, takerAddress, fillableAmount);

        const signedOrder = await orderFactory.createSignedOrderAsync(this.zeroEx, makerAddress,
            takerAddress, fillableAmount, makerToken.address, fillableAmount, takerToken.address,
            expirationUnixTimestampSec);
        return signedOrder;
    }
}
