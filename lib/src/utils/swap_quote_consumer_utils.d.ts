import { ContractAddresses } from '@0x/contract-addresses';
import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { SupportedProvider } from '@0x/web3-wrapper';
import { Provider } from 'ethereum-types';
import { ExtensionContractType, GetExtensionContractTypeOpts, SwapQuote, SwapQuoteExecutionOpts } from '../types';
export declare const swapQuoteConsumerUtils: {
    getTakerAddressOrThrowAsync(provider: SupportedProvider, opts: Partial<SwapQuoteExecutionOpts>): Promise<string>;
    getTakerAddressAsync(provider: SupportedProvider, opts: Partial<SwapQuoteExecutionOpts>): Promise<string | undefined>;
    getEthAndWethBalanceAsync(provider: SupportedProvider, contractAddresses: ContractAddresses, takerAddress: string): Promise<[BigNumber, BigNumber]>;
    isValidForwarderSwapQuote(swapQuote: SwapQuote, wethAssetData: string): boolean;
    isValidForwarderSignedOrders(orders: SignedOrder[], wethAssetData: string): boolean;
    isValidForwarderSignedOrder(order: SignedOrder, wethAssetData: string): boolean;
    getExtensionContractTypeForSwapQuoteAsync(quote: SwapQuote, contractAddresses: ContractAddresses, provider: Provider, opts: Partial<GetExtensionContractTypeOpts>): Promise<ExtensionContractType>;
};
//# sourceMappingURL=swap_quote_consumer_utils.d.ts.map