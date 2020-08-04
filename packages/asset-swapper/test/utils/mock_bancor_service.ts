import { BigNumber } from '@0x/utils';

import { BancorService } from '../../src/utils/market_operation_utils/bancor_service';
import { BancorQuoteData } from '../../src/utils/market_operation_utils/types';

export interface Handlers {
    getQuoteAsync: (fromToken: string, toToken: string, amount: BigNumber) => Promise<BancorQuoteData>;
}

export class MockBancorService extends BancorService {
    // Bancor recommends setting this value to 2% under the expected return amount
    public minReturnAmountBufferPercentage = 0.98;

    constructor(public handlers: Partial<Handlers>) {
        super('');
    }

    public async getQuoteAsync(fromToken: string, toToken: string, amount: BigNumber): Promise<BancorQuoteData> {
        return this.handlers.getQuoteAsync
            ? this.handlers.getQuoteAsync(fromToken, toToken, amount)
            : super.getQuoteAsync(fromToken, toToken, amount);
    }
}
