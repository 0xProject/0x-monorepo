import { ContractWrappers, SupportedProvider, ZeroExProvider } from '@0x/contract-wrappers';
import { providerUtils } from '@0x/utils';
import * as _ from 'lodash';

import { constants } from '../constants';
import { SwapQuote, SwapQuoteUtilsOpts } from '../types';
import { assert } from '../utils/assert';

export class SwapQuoteUtils {
    public readonly provider: ZeroExProvider;
    public readonly networkId: number;

    private readonly _contractWrappers: ContractWrappers;

    constructor(supportedProvider: SupportedProvider, options: Partial<SwapQuoteUtilsOpts> = {}) {
        const { networkId } = _.merge({}, constants.DEFAULT_SWAP_QUOTE_UTILS_OPTS, options);
        assert.isNumber('networkId', networkId);

        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        this.provider = provider;
        this.networkId = networkId;
        this._contractWrappers = new ContractWrappers(this.provider, {
            networkId,
        });
    }

    public async isTakerAddressAllowanceEnoughForBestAndWorstQuoteInfoAsync(
        swapQuote: SwapQuote,
        takerAddress: string,
    ): Promise<[boolean, boolean]> {
        const orderValidatorWrapper = this._contractWrappers.orderValidator;
        const balanceAndAllowance = await orderValidatorWrapper.getBalanceAndAllowanceAsync(
            takerAddress,
            swapQuote.takerAssetData,
        );
        return [
            balanceAndAllowance.allowance.isGreaterThanOrEqualTo(swapQuote.bestCaseQuoteInfo.totalTakerTokenAmount),
            balanceAndAllowance.allowance.isGreaterThanOrEqualTo(swapQuote.worstCaseQuoteInfo.totalTakerTokenAmount),
        ];
    }
}
