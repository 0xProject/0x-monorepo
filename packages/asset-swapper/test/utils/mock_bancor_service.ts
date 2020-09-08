import { BigNumber } from '@0x/utils';

import { SupportedProvider } from '../../src';
import { BancorService } from '../../src/utils/market_operation_utils/bancor_service';
import { BancorFillData, Quote } from '../../src/utils/market_operation_utils/types';

export interface Handlers {
    getQuotesAsync: (fromToken: string, toToken: string, amount: BigNumber[]) => Promise<Array<Quote<BancorFillData>>>;
}

export class MockBancorService extends BancorService {
    // Bancor recommends setting this value to 2% under the expected return amount
    public minReturnAmountBufferPercentage = 0.98;

    constructor(provider: SupportedProvider, public handlers: Partial<Handlers>) {
        super(provider);
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
