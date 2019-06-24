import { ContractWrappers, ContractWrappersError, ForwarderWrapperError, SignedOrder, ZeroExTransaction } from '@0x/contract-wrappers';
import { AbiEncoder, BigNumber, providerUtils } from '@0x/utils';
import { SupportedProvider, Web3Wrapper, ZeroExProvider } from '@0x/web3-wrapper';
import { MethodAbi } from 'ethereum-types';
import * as _ from 'lodash';

import { constants } from '../constants';
import {
    CalldataInfo,
    CoordinatorMarketBuySmartContractParams,
    SmartContractParamsInfo,
    SwapQuote,
    SwapQuoteConsumer,
    SwapQuoteConsumerError,
    SwapQuoteConsumerOpts,
    SwapQuoteExecutionOpts,
    SwapQuoteGetOutputOpts,
} from '../types';
import { affiliateFeeUtils } from '../utils/affiliate_fee_utils';
import { assert } from '../utils/assert';
import { assetDataUtils } from '../utils/asset_data_utils';
import { utils } from '../utils/utils';
import {} from '../';

export class CoordinatorSwapQuoteConsumer implements SwapQuoteConsumer<CoordinatorMarketBuySmartContractParams> {
    public readonly provider: ZeroExProvider;
    public readonly networkId: number;

    private readonly _contractWrappers: ContractWrappers;

    constructor(supportedProvider: SupportedProvider, options: Partial<SwapQuoteConsumerOpts> = {}) {
        const { networkId } = _.merge({}, constants.DEFAULT_SWAP_QUOTER_OPTS, options);
        assert.isNumber('networkId', networkId);

        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        this.provider = provider;
        this.networkId = networkId;
        this._contractWrappers = new ContractWrappers(this.provider, {
            networkId,
        });
    }

    public getCalldataOrThrow(quote: SwapQuote, opts: Partial<SwapQuoteGetOutputOpts>): CalldataInfo {
        assert.isValidCoordinatorSwapQuote('quote', quote, this._getCoordinatorContractAddress());
    }

    public getSmartContractParamsOrThrow(quote: SwapQuote, opts: Partial<SwapQuoteGetOutputOpts>): SmartContractParamsInfo<CoordinatorMarketBuySmartContractParams> {
        assert.isValidCoordinatorSwapQuote('quote', quote, this._getCoordinatorContractAddress());

    }

    public async executeSwapQuoteOrThrowAsync(quote: SwapQuote, opts: Partial<SwapQuoteExecutionOpts>): Promise<string> {
        assert.isValidCoordinatorSwapQuote('quote', quote, this._getCoordinatorContractAddress());
    }

    private _getCoordinatorContractAddress(): string {
        return this._contractWrappers.coordinator.address;
    }

    public async getSignedZeroExTransactionAsync(quote: SwapQuote): ZeroExTransaction {
        
    }
}
