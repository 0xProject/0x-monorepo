import { ContractWrappers, ContractWrappersError, ForwarderWrapperError, SignedOrder } from '@0x/contract-wrappers';
import { AbiEncoder, abiUtils, BigNumber, providerUtils } from '@0x/utils';
import { SupportedProvider, Web3Wrapper, ZeroExProvider } from '@0x/web3-wrapper';
import { MethodAbi } from 'ethereum-types';
import * as _ from 'lodash';

import { constants } from '../constants';
import {
    AssetSwapQuoterError,
    CalldataInformation,
    SmartContractParams,
    SwapQuote,
    SwapQuoteConsumer,
    SwapQuoteConsumerOpts,
    SwapQuoteExecutionOpts,
    SwapQuoteGetOutputOpts,
    SwapQuoteInfo,
} from '../types';
import { assert } from '../utils/assert';
import { utils } from '../utils/utils';

import { assetDataUtils } from '../utils/asset_data_utils';

export class ExchangeSwapQuoteConsumer implements SwapQuoteConsumer {

    public readonly provider: ZeroExProvider;
    public readonly networkId: number;

    private readonly _contractWrappers: ContractWrappers;

    constructor(
        supportedProvider: SupportedProvider,
        options: Partial<SwapQuoteConsumerOpts> = {},
    ) {
        const { networkId } = _.merge(
            {},
            constants.DEFAULT_ASSET_SWAP_QUOTER_OPTS,
            options,
        );
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        assert.isNumber('networkId', networkId);
        this.provider = provider;
        this.networkId = networkId;
        this._contractWrappers = new ContractWrappers(this.provider, {
            networkId,
        });
    }

    public getCalldataOrThrow = (quote: SwapQuote, opts: Partial<SwapQuoteGetOutputOpts>): CalldataInformation => {

    }
    
    public getSmartContractParamsOrThrow = (quote: SwapQuote, opts: Partial<SwapQuoteGetOutputOpts>): SmartContractParams => {

    }

    public executeSwapQuoteOrThrowAsync = async (quote: SwapQuote, opts: Partial<SwapQuoteExecutionOpts>): Promise<string> => {

    };
}