import { BigNumber } from '@0x/utils';
import { SDK } from '@bancor/sdk';

import { BancorService } from '../../src/utils/market_operation_utils/bancor_service';
import { BancorFillData, Quote } from '../../src/utils/market_operation_utils/types';

export interface Handlers {
    getQuotesAsync: (fromToken: string, toToken: string, amount: BigNumber[]) => Promise<Array<Quote<BancorFillData>>>;
}

export class MockBancorService extends BancorService {
    // Bancor recommends setting this value to 2% under the expected return amount
    public minReturnAmountBufferPercentage = 0.98;

    public static async createMockAsync(handlers: Partial<Handlers>): Promise<MockBancorService> {
        const sdk = new SDK();
        return new MockBancorService(sdk, handlers);
    }

    constructor(sdk: SDK, public handlers: Partial<Handlers>) {
        super(sdk);
    }

    public async getQuotesAsync(
        fromToken: string,
        toToken: string,
        amounts: BigNumber[],
    ): Promise<Array<Quote<BancorFillData>>> {
        return this.handlers.getQuotesAsync
            ? this.handlers.getQuotesAsync(fromToken, toToken, amounts)
            : super.getQuotesAsync(fromToken, toToken, amounts);
    }
}
