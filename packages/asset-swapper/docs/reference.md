> # Class: InsufficientAssetLiquidityError

Error class representing insufficient asset liquidity

## Hierarchy

* `Error`

  * **InsufficientAssetLiquidityError**

## Index

### Constructors

* [constructor](#constructor)

### Properties

* [amountAvailableToFill](#amountavailabletofill)
* [message](#message)
* [name](#name)
* [stack](#optional-stack)
* [Error](#static-error)

## Constructors

###  constructor

\+ **new InsufficientAssetLiquidityError**(`amountAvailableToFill`: `BigNumber`): *[InsufficientAssetLiquidityError](#class-insufficientassetliquidityerror)*

*Defined in [errors.ts:12](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/errors.ts#L12)*

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`amountAvailableToFill` | `BigNumber` | The amount availabe to fill (in base units) factoring in slippage  |

**Returns:** *[InsufficientAssetLiquidityError](#class-insufficientassetliquidityerror)*

## Properties

###  amountAvailableToFill

• **amountAvailableToFill**: *`BigNumber`*

*Defined in [errors.ts:12](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/errors.ts#L12)*

The amount availabe to fill (in base units) factoring in slippage.

___

###  message

• **message**: *string*

*Inherited from void*

Defined in /Users/rickmorty/Documents/projects/0x/0x-monorepo/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:974

___

###  name

• **name**: *string*

*Inherited from void*

Defined in /Users/rickmorty/Documents/projects/0x/0x-monorepo/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:973

___

### `Optional` stack

• **stack**? : *undefined | string*

*Inherited from void*

*Overrides void*

Defined in /Users/rickmorty/Documents/projects/0x/0x-monorepo/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:975

___

### `Static` Error

▪ **Error**: *`ErrorConstructor`*

Defined in /Users/rickmorty/Documents/projects/0x/0x-monorepo/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:984

<hr />

> # Class: BasicOrderProvider

## Hierarchy

* **BasicOrderProvider**

## Implements

* [OrderProvider](#interface-orderprovider)

## Index

### Constructors

* [constructor](#constructor)

### Properties

* [orders](#orders)

### Methods

* [getAvailableMakerAssetDatasAsync](#getavailablemakerassetdatasasync)
* [getAvailableTakerAssetDatasAsync](#getavailabletakerassetdatasasync)
* [getOrdersAsync](#getordersasync)

## Constructors

###  constructor

\+ **new BasicOrderProvider**(`orders`: `SignedOrder`[]): *[BasicOrderProvider](#class-basicorderprovider)*

*Defined in [order_providers/basic_order_provider.ts:9](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/order_providers/basic_order_provider.ts#L9)*

Instantiates a new BasicOrderProvider instance

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`orders` | `SignedOrder`[] | An array of objects that conform to SignedOrder to fetch from. |

**Returns:** *[BasicOrderProvider](#class-basicorderprovider)*

An instance of BasicOrderProvider

## Properties

###  orders

• **orders**: *`SignedOrder`[]*

*Defined in [order_providers/basic_order_provider.ts:9](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/order_providers/basic_order_provider.ts#L9)*

## Methods

###  getAvailableMakerAssetDatasAsync

▸ **getAvailableMakerAssetDatasAsync**(`takerAssetData`: string): *`Promise<string[]>`*

*Defined in [order_providers/basic_order_provider.ts:37](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/order_providers/basic_order_provider.ts#L37)*

Given a taker asset data string, return all availabled paired maker asset data strings.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`takerAssetData` | string | A string representing the taker asset data. |

**Returns:** *`Promise<string[]>`*

An array of asset data strings that can be purchased using takerAssetData.

___

###  getAvailableTakerAssetDatasAsync

▸ **getAvailableTakerAssetDatasAsync**(`makerAssetData`: string): *`Promise<string[]>`*

*Defined in [order_providers/basic_order_provider.ts:46](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/order_providers/basic_order_provider.ts#L46)*

Given a maker asset data string, return all availabled paired taker asset data strings.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`makerAssetData` | string | A string representing the maker asset data. |

**Returns:** *`Promise<string[]>`*

An array of asset data strings that can be used to purchased makerAssetData.

___

###  getOrdersAsync

▸ **getOrdersAsync**(`orderProviderRequest`: [OrderProviderRequest](#interface-orderproviderrequest)): *`Promise<OrderProviderResponse>`*

*Defined in [order_providers/basic_order_provider.ts:24](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/order_providers/basic_order_provider.ts#L24)*

Given an object that conforms to OrderFetcherRequest, return the corresponding OrderProviderResponse that satisfies the request.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`orderProviderRequest` | [OrderProviderRequest](#interface-orderproviderrequest) | An instance of OrderFetcherRequest. See type for more information. |

**Returns:** *`Promise<OrderProviderResponse>`*

An instance of OrderProviderResponse. See type for more information.

<hr />

> # Class: StandardRelayerAPIOrderProvider

## Hierarchy

* **StandardRelayerAPIOrderProvider**

## Implements

* [OrderProvider](#interface-orderprovider)

## Index

### Constructors

* [constructor](#constructor)

### Properties

* [apiUrl](#apiurl)
* [networkId](#networkid)

### Methods

* [getAvailableMakerAssetDatasAsync](#getavailablemakerassetdatasasync)
* [getAvailableTakerAssetDatasAsync](#getavailabletakerassetdatasasync)
* [getOrdersAsync](#getordersasync)

## Constructors

###  constructor

\+ **new StandardRelayerAPIOrderProvider**(`apiUrl`: string, `networkId`: number): *[StandardRelayerAPIOrderProvider](#class-standardrelayerapiorderprovider)*

*Defined in [order_providers/standard_relayer_api_order_provider.ts:49](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/order_providers/standard_relayer_api_order_provider.ts#L49)*

Instantiates a new StandardRelayerAPIOrderProvider instance

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`apiUrl` | string | The standard relayer API base HTTP url you would like to source orders from. |
`networkId` | number | The ethereum network id. |

**Returns:** *[StandardRelayerAPIOrderProvider](#class-standardrelayerapiorderprovider)*

An instance of StandardRelayerAPIOrderProvider

## Properties

###  apiUrl

• **apiUrl**: *string*

*Defined in [order_providers/standard_relayer_api_order_provider.ts:18](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/order_providers/standard_relayer_api_order_provider.ts#L18)*

___

###  networkId

• **networkId**: *number*

*Defined in [order_providers/standard_relayer_api_order_provider.ts:19](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/order_providers/standard_relayer_api_order_provider.ts#L19)*

## Methods

###  getAvailableMakerAssetDatasAsync

▸ **getAvailableMakerAssetDatasAsync**(`takerAssetData`: string): *`Promise<string[]>`*

*Defined in [order_providers/standard_relayer_api_order_provider.ts:92](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/order_providers/standard_relayer_api_order_provider.ts#L92)*

Given a taker asset data string, return all available paired maker asset data strings.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`takerAssetData` | string | A string representing the taker asset data. |

**Returns:** *`Promise<string[]>`*

An array of asset data strings that can be purchased using takerAssetData.

___

###  getAvailableTakerAssetDatasAsync

▸ **getAvailableTakerAssetDatasAsync**(`makerAssetData`: string): *`Promise<string[]>`*

*Defined in [order_providers/standard_relayer_api_order_provider.ts:120](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/order_providers/standard_relayer_api_order_provider.ts#L120)*

Given a maker asset data string, return all availabled paired taker asset data strings.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`makerAssetData` | string | A string representing the maker asset data. |

**Returns:** *`Promise<string[]>`*

An array of asset data strings that can be used to purchased makerAssetData.

___

###  getOrdersAsync

▸ **getOrdersAsync**(`orderProviderRequest`: [OrderProviderRequest](#interface-orderproviderrequest)): *`Promise<OrderProviderResponse>`*

*Defined in [order_providers/standard_relayer_api_order_provider.ts:68](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/order_providers/standard_relayer_api_order_provider.ts#L68)*

Given an object that conforms to OrderProviderRequest, return the corresponding OrderProviderResponse that satisfies the request.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`orderProviderRequest` | [OrderProviderRequest](#interface-orderproviderrequest) | An instance of OrderProviderRequest. See type for more information. |

**Returns:** *`Promise<OrderProviderResponse>`*

An instance of OrderProviderResponse. See type for more information.

<hr />

> # Class: ExchangeSwapQuoteConsumer

## Hierarchy

* **ExchangeSwapQuoteConsumer**

## Implements

* [SwapQuoteConsumerBase](#exchangesmartcontractparams)*›

## Index

### Constructors

* [constructor](#constructor)

### Properties

* [networkId](#networkid)
* [provider](#provider)

### Methods

* [executeSwapQuoteOrThrowAsync](#executeswapquoteorthrowasync)
* [getCalldataOrThrowAsync](#getcalldataorthrowasync)
* [getSmartContractParamsOrThrowAsync](#getsmartcontractparamsorthrowasync)

## Constructors

###  constructor

\+ **new ExchangeSwapQuoteConsumer**(`supportedProvider`: `SupportedProvider`, `options`: `Partial<SwapQuoteConsumerOpts>`): *[ExchangeSwapQuoteConsumer](#class-exchangeswapquoteconsumer)*

*Defined in [quote_consumers/exchange_swap_quote_consumer.ts:28](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/quote_consumers/exchange_swap_quote_consumer.ts#L28)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`supportedProvider` | `SupportedProvider` | - |
`options` | `Partial<SwapQuoteConsumerOpts>` |  {} |

**Returns:** *[ExchangeSwapQuoteConsumer](#class-exchangeswapquoteconsumer)*

## Properties

###  networkId

• **networkId**: *number*

*Defined in [quote_consumers/exchange_swap_quote_consumer.ts:26](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/quote_consumers/exchange_swap_quote_consumer.ts#L26)*

___

###  provider

• **provider**: *`ZeroExProvider`*

*Defined in [quote_consumers/exchange_swap_quote_consumer.ts:25](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/quote_consumers/exchange_swap_quote_consumer.ts#L25)*

## Methods

###  executeSwapQuoteOrThrowAsync

▸ **executeSwapQuoteOrThrowAsync**(`quote`: [SwapQuote](#swapquote), `opts`: `Partial<SwapQuoteExecutionOptsBase>`): *`Promise<string>`*

*Implementation of [SwapQuoteConsumerBase](#interface-swapquoteconsumerbase)*

*Defined in [quote_consumers/exchange_swap_quote_consumer.ts:121](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/quote_consumers/exchange_swap_quote_consumer.ts#L121)*

**Parameters:**

Name | Type |
------ | ------ |
`quote` | [SwapQuote](#swapquote) |
`opts` | `Partial<SwapQuoteExecutionOptsBase>` |

**Returns:** *`Promise<string>`*

___

###  getCalldataOrThrowAsync

▸ **getCalldataOrThrowAsync**(`quote`: [SwapQuote](#swapquote), `opts`: `Partial<SwapQuoteGetOutputOptsBase>`): *`Promise<CalldataInfo>`*

*Implementation of [SwapQuoteConsumerBase](#interface-swapquoteconsumerbase)*

*Defined in [quote_consumers/exchange_swap_quote_consumer.ts:42](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/quote_consumers/exchange_swap_quote_consumer.ts#L42)*

**Parameters:**

Name | Type |
------ | ------ |
`quote` | [SwapQuote](#swapquote) |
`opts` | `Partial<SwapQuoteGetOutputOptsBase>` |

**Returns:** *`Promise<CalldataInfo>`*

___

###  getSmartContractParamsOrThrowAsync

▸ **getSmartContractParamsOrThrowAsync**(`quote`: [SwapQuote](#swapquote), `_opts`: `Partial<SwapQuoteGetOutputOptsBase>`): *`Promise<SmartContractParamsInfo<ExchangeSmartContractParams>>`*

*Implementation of [SwapQuoteConsumerBase](#interface-swapquoteconsumerbase)*

*Defined in [quote_consumers/exchange_swap_quote_consumer.ts:70](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/quote_consumers/exchange_swap_quote_consumer.ts#L70)*

**Parameters:**

Name | Type |
------ | ------ |
`quote` | [SwapQuote](#swapquote) |
`_opts` | `Partial<SwapQuoteGetOutputOptsBase>` |

**Returns:** *`Promise<SmartContractParamsInfo<ExchangeSmartContractParams>>`*

<hr />

> # Class: ForwarderSwapQuoteConsumer

## Hierarchy

* **ForwarderSwapQuoteConsumer**

## Implements

* [SwapQuoteConsumerBase](#forwardersmartcontractparams)*›

## Index

### Constructors

* [constructor](#constructor)

### Properties

* [networkId](#networkid)
* [provider](#provider)

### Methods

* [executeSwapQuoteOrThrowAsync](#executeswapquoteorthrowasync)
* [getCalldataOrThrowAsync](#getcalldataorthrowasync)
* [getSmartContractParamsOrThrowAsync](#getsmartcontractparamsorthrowasync)

## Constructors

###  constructor

\+ **new ForwarderSwapQuoteConsumer**(`supportedProvider`: `SupportedProvider`, `options`: `Partial<SwapQuoteConsumerOpts>`): *[ForwarderSwapQuoteConsumer](#class-forwarderswapquoteconsumer)*

*Defined in [quote_consumers/forwarder_swap_quote_consumer.ts:31](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/quote_consumers/forwarder_swap_quote_consumer.ts#L31)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`supportedProvider` | `SupportedProvider` | - |
`options` | `Partial<SwapQuoteConsumerOpts>` |  {} |

**Returns:** *[ForwarderSwapQuoteConsumer](#class-forwarderswapquoteconsumer)*

## Properties

###  networkId

• **networkId**: *number*

*Defined in [quote_consumers/forwarder_swap_quote_consumer.ts:29](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/quote_consumers/forwarder_swap_quote_consumer.ts#L29)*

___

###  provider

• **provider**: *`ZeroExProvider`*

*Defined in [quote_consumers/forwarder_swap_quote_consumer.ts:28](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/quote_consumers/forwarder_swap_quote_consumer.ts#L28)*

## Methods

###  executeSwapQuoteOrThrowAsync

▸ **executeSwapQuoteOrThrowAsync**(`quote`: [SwapQuote](#swapquote), `opts`: `Partial<ForwarderSwapQuoteExecutionOpts>`): *`Promise<string>`*

*Implementation of [SwapQuoteConsumerBase](#interface-swapquoteconsumerbase)*

*Defined in [quote_consumers/forwarder_swap_quote_consumer.ts:163](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/quote_consumers/forwarder_swap_quote_consumer.ts#L163)*

Given a SwapQuote and desired rate (in Eth), attempt to execute the swap.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`quote` | [SwapQuote](#swapquote) | An object that conforms to SwapQuote. See type definition for more information. |
`opts` | `Partial<ForwarderSwapQuoteExecutionOpts>` | Options for getting CalldataInfo. See type definition for more information.  |

**Returns:** *`Promise<string>`*

___

###  getCalldataOrThrowAsync

▸ **getCalldataOrThrowAsync**(`quote`: [SwapQuote](#swapquote), `opts`: `Partial<ForwarderSwapQuoteGetOutputOpts>`): *`Promise<CalldataInfo>`*

*Implementation of [SwapQuoteConsumerBase](#interface-swapquoteconsumerbase)*

*Defined in [quote_consumers/forwarder_swap_quote_consumer.ts:50](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/quote_consumers/forwarder_swap_quote_consumer.ts#L50)*

Given a SwapQuote, returns 'CalldataInfo' for a forwarder extension call. See type definition of CalldataInfo for more information.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`quote` | [SwapQuote](#swapquote) | An object that conforms to SwapQuote. See type definition for more information. |
`opts` | `Partial<ForwarderSwapQuoteGetOutputOpts>` | Options for getting CalldataInfo. See type definition for more information.  |

**Returns:** *`Promise<CalldataInfo>`*

___

###  getSmartContractParamsOrThrowAsync

▸ **getSmartContractParamsOrThrowAsync**(`quote`: [SwapQuote](#swapquote), `opts`: `Partial<ForwarderSwapQuoteGetOutputOpts>`): *`Promise<SmartContractParamsInfo<ForwarderSmartContractParams>>`*

*Implementation of [SwapQuoteConsumerBase](#interface-swapquoteconsumerbase)*

*Defined in [quote_consumers/forwarder_swap_quote_consumer.ts:82](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/quote_consumers/forwarder_swap_quote_consumer.ts#L82)*

Given a SwapQuote, returns 'SmartContractParamsInfo' for a forwarder extension call. See type definition of CalldataInfo for more information.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`quote` | [SwapQuote](#swapquote) | An object that conforms to SwapQuote. See type definition for more information. |
`opts` | `Partial<ForwarderSwapQuoteGetOutputOpts>` | Options for getting SmartContractParams. See type definition for more information.  |

**Returns:** *`Promise<SmartContractParamsInfo<ForwarderSmartContractParams>>`*

<hr />

> # Class: SwapQuoteConsumer

## Hierarchy

* **SwapQuoteConsumer**

## Implements

* [SwapQuoteConsumerBase](#smartcontractparams)*›

## Index

### Constructors

* [constructor](#constructor)

### Properties

* [networkId](#networkid)
* [provider](#provider)

### Methods

* [executeSwapQuoteOrThrowAsync](#executeswapquoteorthrowasync)
* [getCalldataOrThrowAsync](#getcalldataorthrowasync)
* [getSmartContractParamsOrThrowAsync](#getsmartcontractparamsorthrowasync)

## Constructors

###  constructor

\+ **new SwapQuoteConsumer**(`supportedProvider`: `SupportedProvider`, `options`: `Partial<SwapQuoteConsumerOpts>`): *[SwapQuoteConsumer](#class-swapquoteconsumer)*

*Defined in [quote_consumers/swap_quote_consumer.ts:30](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/quote_consumers/swap_quote_consumer.ts#L30)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`supportedProvider` | `SupportedProvider` | - |
`options` | `Partial<SwapQuoteConsumerOpts>` |  {} |

**Returns:** *[SwapQuoteConsumer](#class-swapquoteconsumer)*

## Properties

###  networkId

• **networkId**: *number*

*Defined in [quote_consumers/swap_quote_consumer.ts:26](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/quote_consumers/swap_quote_consumer.ts#L26)*

___

###  provider

• **provider**: *`ZeroExProvider`*

*Defined in [quote_consumers/swap_quote_consumer.ts:25](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/quote_consumers/swap_quote_consumer.ts#L25)*

## Methods

###  executeSwapQuoteOrThrowAsync

▸ **executeSwapQuoteOrThrowAsync**(`quote`: [SwapQuote](#swapquote), `opts`: `Partial<SwapQuoteExecutionOpts>`): *`Promise<string>`*

*Implementation of [SwapQuoteConsumerBase](#interface-swapquoteconsumerbase)*

*Defined in [quote_consumers/swap_quote_consumer.ts:80](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/quote_consumers/swap_quote_consumer.ts#L80)*

Given a SwapQuote and desired rate (in takerAsset), attempt to execute the swap.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`quote` | [SwapQuote](#swapquote) | An object that conforms to SwapQuote. See type definition for more information. |
`opts` | `Partial<SwapQuoteExecutionOpts>` | Options for getting CalldataInfo. See type definition for more information.  |

**Returns:** *`Promise<string>`*

___

###  getCalldataOrThrowAsync

▸ **getCalldataOrThrowAsync**(`quote`: [SwapQuote](#swapquote), `opts`: `Partial<SwapQuoteGetOutputOpts>`): *`Promise<CalldataInfo>`*

*Implementation of [SwapQuoteConsumerBase](#interface-swapquoteconsumerbase)*

*Defined in [quote_consumers/swap_quote_consumer.ts:52](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/quote_consumers/swap_quote_consumer.ts#L52)*

Given a SwapQuote, returns 'CalldataInfo' for a 0x exchange call. See type definition of CalldataInfo for more information.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`quote` | [SwapQuote](#swapquote) | An object that conforms to SwapQuote. See type definition for more information. |
`opts` | `Partial<SwapQuoteGetOutputOpts>` | Options for getting SmartContractParams. See type definition for more information.  |

**Returns:** *`Promise<CalldataInfo>`*

___

###  getSmartContractParamsOrThrowAsync

▸ **getSmartContractParamsOrThrowAsync**(`quote`: [SwapQuote](#swapquote), `opts`: `Partial<SwapQuoteGetOutputOpts>`): *`Promise<SmartContractParamsInfo<SmartContractParams>>`*

*Implementation of [SwapQuoteConsumerBase](#interface-swapquoteconsumerbase)*

*Defined in [quote_consumers/swap_quote_consumer.ts:66](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/quote_consumers/swap_quote_consumer.ts#L66)*

Given a SwapQuote, returns 'SmartContractParamsInfo' for a 0x exchange call. See type definition of SmartContractParamsInfo for more information.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`quote` | [SwapQuote](#swapquote) | An object that conforms to SwapQuote. See type definition for more information. |
`opts` | `Partial<SwapQuoteGetOutputOpts>` | Options for getting SmartContractParams. See type definition for more information.  |

**Returns:** *`Promise<SmartContractParamsInfo<SmartContractParams>>`*

<hr />

> # Class: SwapQuoter

## Hierarchy

* **SwapQuoter**

## Index

### Constructors

* [constructor](#constructor)

### Properties

* [expiryBufferMs](#expirybufferms)
* [networkId](#networkid)
* [orderProvider](#orderprovider)
* [orderRefreshIntervalMs](#orderrefreshintervalms)
* [provider](#provider)

### Methods

* [getAvailableMakerAssetDatasAsync](#getavailablemakerassetdatasasync)
* [getAvailableTakerAssetDatasAsync](#getavailabletakerassetdatasasync)
* [getLiquidityForMakerTakerAssetDataPairAsync](#getliquidityformakertakerassetdatapairasync)
* [getMarketBuySwapQuoteAsync](#getmarketbuyswapquoteasync)
* [getMarketBuySwapQuoteForAssetDataAsync](#getmarketbuyswapquoteforassetdataasync)
* [getMarketSellSwapQuoteAsync](#getmarketsellswapquoteasync)
* [getMarketSellSwapQuoteForAssetDataAsync](#getmarketsellswapquoteforassetdataasync)
* [getOrdersAndFillableAmountsAsync](#getordersandfillableamountsasync)
* [isTakerAddressAllowanceEnoughForBestAndWorstQuoteInfoAsync](#istakeraddressallowanceenoughforbestandworstquoteinfoasync)
* [isTakerMakerAssetDataPairAvailableAsync](#istakermakerassetdatapairavailableasync)
* [getSwapQuoterForProvidedOrders](#static-getswapquoterforprovidedorders)
* [getSwapQuoterForStandardRelayerAPIUrl](#static-getswapquoterforstandardrelayerapiurl)

## Constructors

###  constructor

\+ **new SwapQuoter**(`supportedProvider`: `SupportedProvider`, `orderProvider`: [OrderProvider](#class-swapquoter)*

*Defined in [swap_quoter.ts:93](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/swap_quoter.ts#L93)*

Instantiates a new SwapQuoter instance

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`supportedProvider` | `SupportedProvider` | - | The Provider instance you would like to use for interacting with the Ethereum network. |
`orderProvider` | [OrderProvider](#interface-orderprovider) | - | An object that conforms to OrderProvider, see type for definition. |
`options` | `Partial<SwapQuoterOpts>` |  {} | Initialization options for the SwapQuoter. See type definition for details.  |

**Returns:** *[SwapQuoter](#class-swapquoter)*

An instance of SwapQuoter

## Properties

###  expiryBufferMs

• **expiryBufferMs**: *number*

*Defined in [swap_quoter.ts:41](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/swap_quoter.ts#L41)*

___

###  networkId

• **networkId**: *number*

*Defined in [swap_quoter.ts:39](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/swap_quoter.ts#L39)*

___

###  orderProvider

• **orderProvider**: *[OrderProvider](#interface-orderprovider)*

*Defined in [swap_quoter.ts:38](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/swap_quoter.ts#L38)*

___

###  orderRefreshIntervalMs

• **orderRefreshIntervalMs**: *number*

*Defined in [swap_quoter.ts:40](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/swap_quoter.ts#L40)*

___

###  provider

• **provider**: *`ZeroExProvider`*

*Defined in [swap_quoter.ts:37](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/swap_quoter.ts#L37)*

## Methods

###  getAvailableMakerAssetDatasAsync

▸ **getAvailableMakerAssetDatasAsync**(`takerAssetData`: string): *`Promise<string[]>`*

*Defined in [swap_quoter.ts:291](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/swap_quoter.ts#L291)*

Get the asset data of all assets that are purchaseable with takerAssetData in the order provider passed in at init.

**Parameters:**

Name | Type |
------ | ------ |
`takerAssetData` | string |

**Returns:** *`Promise<string[]>`*

An array of asset data strings that are purchaseable with takerAssetData.

___

###  getAvailableTakerAssetDatasAsync

▸ **getAvailableTakerAssetDatasAsync**(`makerAssetData`: string): *`Promise<string[]>`*

*Defined in [swap_quoter.ts:280](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/swap_quoter.ts#L280)*

Get the asset data of all assets that can be used to purchase makerAssetData in the order provider passed in at init.

**Parameters:**

Name | Type |
------ | ------ |
`makerAssetData` | string |

**Returns:** *`Promise<string[]>`*

An array of asset data strings that can purchase makerAssetData.

___

###  getLiquidityForMakerTakerAssetDataPairAsync

▸ **getLiquidityForMakerTakerAssetDataPairAsync**(`makerAssetData`: string, `takerAssetData`: string, `options`: `Partial<LiquidityRequestOpts>`): *`Promise<LiquidityForAssetData>`*

*Defined in [swap_quoter.ts:246](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/swap_quoter.ts#L246)*

Returns information about available liquidity for an asset
Does not factor in slippage or fees

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`makerAssetData` | string | - | The makerAssetData of the desired asset to swap for (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md). |
`takerAssetData` | string | - | The takerAssetData of the asset to swap makerAssetData for (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md). |
`options` | `Partial<LiquidityRequestOpts>` |  {} | Options for the request. See type definition for more information.  |

**Returns:** *`Promise<LiquidityForAssetData>`*

An object that conforms to LiquidityForAssetData that satisfies the request. See type definition for more information.

___

###  getMarketBuySwapQuoteAsync

▸ **getMarketBuySwapQuoteAsync**(`makerTokenAddress`: string, `takerTokenAddress`: string, `makerAssetBuyAmount`: `BigNumber`, `options`: `Partial<SwapQuoteRequestOpts>`): *`Promise<SwapQuote>`*

*Defined in [swap_quoter.ts:187](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/swap_quoter.ts#L187)*

Get a `SwapQuote` containing all information relevant to fulfilling a swap between a desired ERC20 token address and ERC20 owned by a provided address.
You can then pass the `SwapQuote` to a `SwapQuoteConsumer` to execute a buy, or process SwapQuote for on-chain consumption.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`makerTokenAddress` | string | - | The address of the maker asset |
`takerTokenAddress` | string | - | The address of the taker asset |
`makerAssetBuyAmount` | `BigNumber` | - | The amount of maker asset to swap for. |
`options` | `Partial<SwapQuoteRequestOpts>` |  {} | Options for the request. See type definition for more information.  |

**Returns:** *`Promise<SwapQuote>`*

An object that conforms to SwapQuote that satisfies the request. See type definition for more information.

___

###  getMarketBuySwapQuoteForAssetDataAsync

▸ **getMarketBuySwapQuoteForAssetDataAsync**(`makerAssetData`: string, `takerAssetData`: string, `makerAssetBuyAmount`: `BigNumber`, `options`: `Partial<SwapQuoteRequestOpts>`): *`Promise<MarketBuySwapQuote>`*

*Defined in [swap_quoter.ts:162](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/swap_quoter.ts#L162)*

Get a `SwapQuote` containing all information relevant to fulfilling a swap between a desired ERC20 token address and ERC20 owned by a provided address.
You can then pass the `SwapQuote` to a `SwapQuoteConsumer` to execute a buy, or process SwapQuote for on-chain consumption.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`makerAssetData` | string | - | The makerAssetData of the desired asset to swap for (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md). |
`takerAssetData` | string | - | The takerAssetData of the asset to swap makerAssetData for (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md). |
`makerAssetBuyAmount` | `BigNumber` | - | The amount of maker asset to swap for. |
`options` | `Partial<SwapQuoteRequestOpts>` |  {} | Options for the request. See type definition for more information.  |

**Returns:** *`Promise<MarketBuySwapQuote>`*

An object that conforms to SwapQuote that satisfies the request. See type definition for more information.

___

###  getMarketSellSwapQuoteAsync

▸ **getMarketSellSwapQuoteAsync**(`makerTokenAddress`: string, `takerTokenAddress`: string, `takerAssetSellAmount`: `BigNumber`, `options`: `Partial<SwapQuoteRequestOpts>`): *`Promise<SwapQuote>`*

*Defined in [swap_quoter.ts:217](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/swap_quoter.ts#L217)*

Get a `SwapQuote` containing all information relevant to fulfilling a swap between a desired ERC20 token address and ERC20 owned by a provided address.
You can then pass the `SwapQuote` to a `SwapQuoteConsumer` to execute a buy, or process SwapQuote for on-chain consumption.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`makerTokenAddress` | string | - | The address of the maker asset |
`takerTokenAddress` | string | - | The address of the taker asset |
`takerAssetSellAmount` | `BigNumber` | - | The amount of taker asset to sell. |
`options` | `Partial<SwapQuoteRequestOpts>` |  {} | Options for the request. See type definition for more information.  |

**Returns:** *`Promise<SwapQuote>`*

An object that conforms to SwapQuote that satisfies the request. See type definition for more information.

___

###  getMarketSellSwapQuoteForAssetDataAsync

▸ **getMarketSellSwapQuoteForAssetDataAsync**(`makerAssetData`: string, `takerAssetData`: string, `takerAssetSellAmount`: `BigNumber`, `options`: `Partial<SwapQuoteRequestOpts>`): *`Promise<MarketSellSwapQuote>`*

*Defined in [swap_quoter.ts:136](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/swap_quoter.ts#L136)*

Get a `SwapQuote` containing all information relevant to fulfilling a swap between a desired ERC20 token address and ERC20 owned by a provided address.
You can then pass the `SwapQuote` to a `SwapQuoteConsumer` to execute a buy, or process SwapQuote for on-chain consumption.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`makerAssetData` | string | - | The makerAssetData of the desired asset to swap for (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md). |
`takerAssetData` | string | - | The takerAssetData of the asset to swap makerAssetData for (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md). |
`takerAssetSellAmount` | `BigNumber` | - | The amount of taker asset to swap for. |
`options` | `Partial<SwapQuoteRequestOpts>` |  {} | Options for the request. See type definition for more information.  |

**Returns:** *`Promise<MarketSellSwapQuote>`*

An object that conforms to SwapQuote that satisfies the request. See type definition for more information.

___

###  getOrdersAndFillableAmountsAsync

▸ **getOrdersAndFillableAmountsAsync**(`makerAssetData`: string, `takerAssetData`: string, `shouldForceOrderRefresh`: boolean): *`Promise<OrdersAndFillableAmounts>`*

*Defined in [swap_quoter.ts:320](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/swap_quoter.ts#L320)*

Grab orders from the map, if there is a miss or it is time to refresh, fetch and process the orders

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`makerAssetData` | string | The makerAssetData of the desired asset to swap for (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md). |
`takerAssetData` | string | The takerAssetData of the asset to swap makerAssetData for (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md). |
`shouldForceOrderRefresh` | boolean | If set to true, new orders and state will be fetched instead of waiting for the next orderRefreshIntervalMs.  |

**Returns:** *`Promise<OrdersAndFillableAmounts>`*

___

###  isTakerAddressAllowanceEnoughForBestAndWorstQuoteInfoAsync

▸ **isTakerAddressAllowanceEnoughForBestAndWorstQuoteInfoAsync**(`swapQuote`: [SwapQuote](#swapquote), `takerAddress`: string): *`Promise<[boolean, boolean]>`*

*Defined in [swap_quoter.ts:381](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/swap_quoter.ts#L381)*

Util function to check if takerAddress's allowance is enough for 0x exchange contracts to conduct the swap specified by the swapQuote.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`swapQuote` | [SwapQuote](#swapquote) | The swapQuote in question to check enough allowance enabled for 0x exchange contracts to conduct the swap. |
`takerAddress` | string | The address of the taker of the provided swapQuote  |

**Returns:** *`Promise<[boolean, boolean]>`*

___

###  isTakerMakerAssetDataPairAvailableAsync

▸ **isTakerMakerAssetDataPairAvailableAsync**(`makerAssetData`: string, `takerAssetData`: string): *`Promise<boolean>`*

*Defined in [swap_quoter.ts:302](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/swap_quoter.ts#L302)*

Validates the taker + maker asset pair is available from the order provider provided to `SwapQuote`.

**Parameters:**

Name | Type |
------ | ------ |
`makerAssetData` | string |
`takerAssetData` | string |

**Returns:** *`Promise<boolean>`*

A boolean on if the taker, maker pair exists

___

### `Static` getSwapQuoterForProvidedOrders

▸ **getSwapQuoterForProvidedOrders**(`supportedProvider`: `SupportedProvider`, `orders`: `SignedOrder`[], `options`: `Partial<SwapQuoterOpts>`): *[SwapQuoter](#class-swapquoter)*

*Defined in [swap_quoter.ts:54](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/swap_quoter.ts#L54)*

Instantiates a new SwapQuoter instance given existing liquidity in the form of orders and feeOrders.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`supportedProvider` | `SupportedProvider` | - | The Provider instance you would like to use for interacting with the Ethereum network. |
`orders` | `SignedOrder`[] | - | A non-empty array of objects that conform to SignedOrder. All orders must have the same makerAssetData and takerAssetData. |
`options` | `Partial<SwapQuoterOpts>` |  {} | Initialization options for the SwapQuoter. See type definition for details.  |

**Returns:** *[SwapQuoter](#class-swapquoter)*

An instance of SwapQuoter

___

### `Static` getSwapQuoterForStandardRelayerAPIUrl

▸ **getSwapQuoterForStandardRelayerAPIUrl**(`supportedProvider`: `SupportedProvider`, `sraApiUrl`: string, `options`: `Partial<SwapQuoterOpts>`): *[SwapQuoter](#class-swapquoter)*

*Defined in [swap_quoter.ts:74](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/swap_quoter.ts#L74)*

Instantiates a new SwapQuoter instance given a [Standard Relayer API](https://github.com/0xProject/standard-relayer-api) endpoint

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`supportedProvider` | `SupportedProvider` | - | The Provider instance you would like to use for interacting with the Ethereum network. |
`sraApiUrl` | string | - | The standard relayer API base HTTP url you would like to source orders from. |
`options` | `Partial<SwapQuoterOpts>` |  {} | Initialization options for the SwapQuoter. See type definition for details.  |

**Returns:** *[SwapQuoter](#class-swapquoter)*

An instance of SwapQuoter

<hr />

> # Enumeration: ConsumerType

Represents the varying smart contracts that can consume a valid swap quote

## Index

### Enumeration members

* [Exchange](#exchange)
* [Forwarder](#forwarder)

## Enumeration members

###  Exchange

• **Exchange**:

*Defined in [types.ts:102](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L102)*

___

###  Forwarder

• **Forwarder**:

*Defined in [types.ts:101](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L101)*

<hr />

> # Enumeration: SwapQuoteConsumerError

Possible error messages thrown by an SwapQuoterConsumer instance or associated static methods.

## Index

### Enumeration members

* [InvalidForwarderSwapQuote](#invalidforwarderswapquote)
* [InvalidMarketSellOrMarketBuySwapQuote](#invalidmarketsellormarketbuyswapquote)
* [NoAddressAvailable](#noaddressavailable)
* [SignatureRequestDenied](#signaturerequestdenied)
* [TransactionValueTooLow](#transactionvaluetoolow)

## Enumeration members

###  InvalidForwarderSwapQuote

• **InvalidForwarderSwapQuote**: = "INVALID_FORWARDER_SWAP_QUOTE_PROVIDED"

*Defined in [types.ts:304](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L304)*

___

###  InvalidMarketSellOrMarketBuySwapQuote

• **InvalidMarketSellOrMarketBuySwapQuote**: = "INVALID_MARKET_BUY_SELL_SWAP_QUOTE"

*Defined in [types.ts:303](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L303)*

___

###  NoAddressAvailable

• **NoAddressAvailable**: = "NO_ADDRESS_AVAILABLE"

*Defined in [types.ts:305](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L305)*

___

###  SignatureRequestDenied

• **SignatureRequestDenied**: = "SIGNATURE_REQUEST_DENIED"

*Defined in [types.ts:306](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L306)*

___

###  TransactionValueTooLow

• **TransactionValueTooLow**: = "TRANSACTION_VALUE_TOO_LOW"

*Defined in [types.ts:307](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L307)*

<hr />

> # Enumeration: SwapQuoterError

Possible error messages thrown by an SwapQuoter instance or associated static methods.

## Index

### Enumeration members

* [AssetUnavailable](#assetunavailable)
* [InsufficientAssetLiquidity](#insufficientassetliquidity)
* [InsufficientZrxLiquidity](#insufficientzrxliquidity)
* [InvalidOrderProviderResponse](#invalidorderproviderresponse)
* [NoEtherTokenContractFound](#noethertokencontractfound)
* [NoZrxTokenContractFound](#nozrxtokencontractfound)
* [StandardRelayerApiError](#standardrelayerapierror)

## Enumeration members

###  AssetUnavailable

• **AssetUnavailable**: = "ASSET_UNAVAILABLE"

*Defined in [types.ts:320](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L320)*

___

###  InsufficientAssetLiquidity

• **InsufficientAssetLiquidity**: = "INSUFFICIENT_ASSET_LIQUIDITY"

*Defined in [types.ts:317](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L317)*

___

###  InsufficientZrxLiquidity

• **InsufficientZrxLiquidity**: = "INSUFFICIENT_ZRX_LIQUIDITY"

*Defined in [types.ts:318](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L318)*

___

###  InvalidOrderProviderResponse

• **InvalidOrderProviderResponse**: = "INVALID_ORDER_PROVIDER_RESPONSE"

*Defined in [types.ts:319](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L319)*

___

###  NoEtherTokenContractFound

• **NoEtherTokenContractFound**: = "NO_ETHER_TOKEN_CONTRACT_FOUND"

*Defined in [types.ts:314](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L314)*

___

###  NoZrxTokenContractFound

• **NoZrxTokenContractFound**: = "NO_ZRX_TOKEN_CONTRACT_FOUND"

*Defined in [types.ts:315](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L315)*

___

###  StandardRelayerApiError

• **StandardRelayerApiError**: = "STANDARD_RELAYER_API_ERROR"

*Defined in [types.ts:316](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L316)*

<hr />

> # Interface: CalldataInfo

Represents the metadata to call a smart contract with calldata.
calldataHexString: The hexstring of the calldata.
methodAbi: The ABI of the smart contract method to call.
toAddress: The contract address to call.
ethAmount: If provided, the eth amount in wei to send with the smart contract call.

## Hierarchy

* **CalldataInfo**

## Index

### Properties

* [calldataHexString](#calldatahexstring)
* [ethAmount](#optional-ethamount)
* [methodAbi](#methodabi)
* [toAddress](#toaddress)

## Properties

###  calldataHexString

• **calldataHexString**: *string*

*Defined in [types.ts:50](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L50)*

___

### `Optional` ethAmount

• **ethAmount**? : *`BigNumber`*

*Defined in [types.ts:53](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L53)*

___

###  methodAbi

• **methodAbi**: *`MethodAbi`*

*Defined in [types.ts:51](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L51)*

___

###  toAddress

• **toAddress**: *string*

*Defined in [types.ts:52](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L52)*

<hr />

> # Interface: ExchangeMarketBuySmartContractParams

makerAssetFillAmount: The amount of makerAsset to swap for.
type: String specifiying which market operation will be performed with the provided parameters. (In this case a market buy operation)

## Hierarchy

* [SmartContractParamsBase](#interface-smartcontractparamsbase)

  * **ExchangeMarketBuySmartContractParams**

  * [ForwarderMarketBuySmartContractParams](#interface-forwardermarketbuysmartcontractparams)

## Index

### Properties

* [makerAssetFillAmount](#makerassetfillamount)
* [orders](#orders)
* [signatures](#signatures)
* [type](#type)

## Properties

###  makerAssetFillAmount

• **makerAssetFillAmount**: *`BigNumber`*

*Defined in [types.ts:84](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L84)*

___

###  orders

• **orders**: *`SignedOrder`[]*

*Inherited from [SmartContractParamsBase](#orders)*

*Defined in [types.ts:75](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L75)*

___

###  signatures

• **signatures**: *string[]*

*Inherited from [SmartContractParamsBase](#signatures)*

*Defined in [types.ts:76](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L76)*

___

###  type

• **type**: *`Buy`*

*Defined in [types.ts:85](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L85)*

<hr />

> # Interface: ExchangeMarketSellSmartContractParams

takerAssetFillAmount: The amount of takerAsset swapped for makerAsset.
type: String specifiying which market operation will be performed with the provided parameters. (In this case a market sell operation)

## Hierarchy

* [SmartContractParamsBase](#interface-smartcontractparamsbase)

  * **ExchangeMarketSellSmartContractParams**

## Index

### Properties

* [orders](#orders)
* [signatures](#signatures)
* [takerAssetFillAmount](#takerassetfillamount)
* [type](#type)

## Properties

###  orders

• **orders**: *`SignedOrder`[]*

*Inherited from [SmartContractParamsBase](#orders)*

*Defined in [types.ts:75](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L75)*

___

###  signatures

• **signatures**: *string[]*

*Inherited from [SmartContractParamsBase](#signatures)*

*Defined in [types.ts:76](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L76)*

___

###  takerAssetFillAmount

• **takerAssetFillAmount**: *`BigNumber`*

*Defined in [types.ts:93](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L93)*

___

###  type

• **type**: *`Sell`*

*Defined in [types.ts:94](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L94)*

<hr />

> # Interface: ForwarderMarketBuySmartContractParams

## Hierarchy

  * [ExchangeMarketBuySmartContractParams](#interface-exchangemarketbuysmartcontractparams)

* [ForwarderSmartContractParamsBase](#interface-forwardersmartcontractparamsbase)

  * **ForwarderMarketBuySmartContractParams**

## Index

### Properties

* [feeOrders](#feeorders)
* [feePercentage](#feepercentage)
* [feeRecipient](#feerecipient)
* [feeSignatures](#feesignatures)
* [makerAssetFillAmount](#makerassetfillamount)
* [orders](#orders)
* [signatures](#signatures)
* [type](#type)

## Properties

###  feeOrders

• **feeOrders**: *`SignedOrder`[]*

*Inherited from [ForwarderSmartContractParamsBase](#feeorders)*

*Defined in [types.ts:117](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L117)*

___

###  feePercentage

• **feePercentage**: *`BigNumber`*

*Inherited from [ForwarderSmartContractParamsBase](#feepercentage)*

*Defined in [types.ts:119](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L119)*

___

###  feeRecipient

• **feeRecipient**: *string*

*Inherited from [ForwarderSmartContractParamsBase](#feerecipient)*

*Defined in [types.ts:120](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L120)*

___

###  feeSignatures

• **feeSignatures**: *string[]*

*Inherited from [ForwarderSmartContractParamsBase](#feesignatures)*

*Defined in [types.ts:118](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L118)*

___

###  makerAssetFillAmount

• **makerAssetFillAmount**: *`BigNumber`*

*Inherited from [ExchangeMarketBuySmartContractParams](#makerassetfillamount)*

*Defined in [types.ts:84](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L84)*

___

###  orders

• **orders**: *`SignedOrder`[]*

*Inherited from [SmartContractParamsBase](#orders)*

*Defined in [types.ts:75](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L75)*

___

###  signatures

• **signatures**: *string[]*

*Inherited from [SmartContractParamsBase](#signatures)*

*Defined in [types.ts:76](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L76)*

___

###  type

• **type**: *`Buy`*

*Inherited from [ExchangeMarketBuySmartContractParams](#type)*

*Defined in [types.ts:85](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L85)*

<hr />

> # Interface: ForwarderMarketSellSmartContractParams

## Hierarchy

* object

* [ForwarderSmartContractParamsBase](#interface-forwardersmartcontractparamsbase)

  * **ForwarderMarketSellSmartContractParams**

## Index

### Properties

* [feeOrders](#feeorders)
* [feePercentage](#feepercentage)
* [feeRecipient](#feerecipient)
* [feeSignatures](#feesignatures)

## Properties

###  feeOrders

• **feeOrders**: *`SignedOrder`[]*

*Inherited from [ForwarderSmartContractParamsBase](#feeorders)*

*Defined in [types.ts:117](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L117)*

___

###  feePercentage

• **feePercentage**: *`BigNumber`*

*Inherited from [ForwarderSmartContractParamsBase](#feepercentage)*

*Defined in [types.ts:119](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L119)*

___

###  feeRecipient

• **feeRecipient**: *string*

*Inherited from [ForwarderSmartContractParamsBase](#feerecipient)*

*Defined in [types.ts:120](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L120)*

___

###  feeSignatures

• **feeSignatures**: *string[]*

*Inherited from [ForwarderSmartContractParamsBase](#feesignatures)*

*Defined in [types.ts:118](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L118)*

<hr />

> # Interface: ForwarderSmartContractParamsBase

feeOrders: An array of objects conforming to SignedOrder. These orders can be used to cover the fees for the orders param above.
feeSignatures: An array of signatures that attest that the maker of the orders in fact made the orders.
feePercentage: Optional affiliate fee percentage used to calculate the eth amount paid to fee recipient.
feeRecipient: The address where affiliate fees are sent. Defaults to null address (0x000...000).

## Hierarchy

* **ForwarderSmartContractParamsBase**

  * [ForwarderMarketBuySmartContractParams](#interface-forwardermarketbuysmartcontractparams)

  * [ForwarderMarketSellSmartContractParams](#interface-forwardermarketsellsmartcontractparams)

## Index

### Properties

* [feeOrders](#feeorders)
* [feePercentage](#feepercentage)
* [feeRecipient](#feerecipient)
* [feeSignatures](#feesignatures)

## Properties

###  feeOrders

• **feeOrders**: *`SignedOrder`[]*

*Defined in [types.ts:117](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L117)*

___

###  feePercentage

• **feePercentage**: *`BigNumber`*

*Defined in [types.ts:119](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L119)*

___

###  feeRecipient

• **feeRecipient**: *string*

*Defined in [types.ts:120](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L120)*

___

###  feeSignatures

• **feeSignatures**: *string[]*

*Defined in [types.ts:118](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L118)*

<hr />

> # Interface: ForwarderSwapQuoteExecutionOpts

## Hierarchy

  * [ForwarderSwapQuoteGetOutputOpts](#interface-forwarderswapquotegetoutputopts)

  * [SwapQuoteExecutionOptsBase](#interface-swapquoteexecutionoptsbase)

  * **ForwarderSwapQuoteExecutionOpts**

  * [SwapQuoteExecutionOpts](#interface-swapquoteexecutionopts)

## Index

### Properties

* [ethAmount](#optional-ethamount)
* [feePercentage](#feepercentage)
* [feeRecipient](#feerecipient)
* [gasLimit](#optional-gaslimit)
* [gasPrice](#optional-gasprice)
* [takerAddress](#optional-takeraddress)

## Properties

### `Optional` ethAmount

• **ethAmount**? : *`BigNumber`*

*Inherited from [ForwarderSwapQuoteGetOutputOpts](#optional-ethamount)*

*Defined in [types.ts:192](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L192)*

___

###  feePercentage

• **feePercentage**: *number*

*Inherited from [ForwarderSwapQuoteGetOutputOpts](#feepercentage)*

*Defined in [types.ts:190](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L190)*

___

###  feeRecipient

• **feeRecipient**: *string*

*Inherited from [ForwarderSwapQuoteGetOutputOpts](#feerecipient)*

*Defined in [types.ts:191](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L191)*

___

### `Optional` gasLimit

• **gasLimit**? : *undefined | number*

*Inherited from [SwapQuoteExecutionOptsBase](#optional-gaslimit)*

*Defined in [types.ts:180](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L180)*

___

### `Optional` gasPrice

• **gasPrice**? : *`BigNumber`*

*Inherited from [SwapQuoteExecutionOptsBase](#optional-gasprice)*

*Defined in [types.ts:181](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L181)*

___

### `Optional` takerAddress

• **takerAddress**? : *undefined | string*

*Inherited from [SwapQuoteExecutionOptsBase](#optional-takeraddress)*

*Defined in [types.ts:179](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L179)*

<hr />

> # Interface: ForwarderSwapQuoteGetOutputOpts

feePercentage: percentage (up to 5%) of the taker asset paid to feeRecipient
feeRecipient: address of the receiver of the feePercentage of taker asset
ethAmount: The amount of eth (in Wei) sent to the forwarder contract.

## Hierarchy

* [SwapQuoteGetOutputOptsBase](#interface-swapquotegetoutputoptsbase)

  * **ForwarderSwapQuoteGetOutputOpts**

  * [SwapQuoteGetOutputOpts](#interface-swapquotegetoutputopts)

  * [ForwarderSwapQuoteExecutionOpts](#interface-forwarderswapquoteexecutionopts)

## Index

### Properties

* [ethAmount](#optional-ethamount)
* [feePercentage](#feepercentage)
* [feeRecipient](#feerecipient)

## Properties

### `Optional` ethAmount

• **ethAmount**? : *`BigNumber`*

*Defined in [types.ts:192](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L192)*

___

###  feePercentage

• **feePercentage**: *number*

*Defined in [types.ts:190](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L190)*

___

###  feeRecipient

• **feeRecipient**: *string*

*Defined in [types.ts:191](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L191)*

<hr />

> # Interface: LiquidityForAssetData

Represents available liquidity for a given assetData

## Hierarchy

* **LiquidityForAssetData**

## Index

### Properties

* [makerTokensAvailableInBaseUnits](#makertokensavailableinbaseunits)
* [takerTokensAvailableInBaseUnits](#takertokensavailableinbaseunits)

## Properties

###  makerTokensAvailableInBaseUnits

• **makerTokensAvailableInBaseUnits**: *`BigNumber`*

*Defined in [types.ts:336](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L336)*

___

###  takerTokensAvailableInBaseUnits

• **takerTokensAvailableInBaseUnits**: *`BigNumber`*

*Defined in [types.ts:337](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L337)*

<hr />

> # Interface: MarketBuySwapQuote

makerAssetFillAmount: The amount of makerAsset bought with takerAsset.
type: Specified MarketOperation the SwapQuote is provided for

## Hierarchy

* [SwapQuoteBase](#interface-swapquotebase)

  * **MarketBuySwapQuote**

  * [MarketBuySwapQuoteWithAffiliateFee](#interface-marketbuyswapquotewithaffiliatefee)

## Index

### Properties

* [bestCaseQuoteInfo](#bestcasequoteinfo)
* [feeOrders](#feeorders)
* [makerAssetData](#makerassetdata)
* [makerAssetFillAmount](#makerassetfillamount)
* [orders](#orders)
* [takerAssetData](#takerassetdata)
* [type](#type)
* [worstCaseQuoteInfo](#worstcasequoteinfo)

## Properties

###  bestCaseQuoteInfo

• **bestCaseQuoteInfo**: *[SwapQuoteInfo](#interface-swapquoteinfo)*

*Inherited from [SwapQuoteBase](#bestcasequoteinfo)*

*Defined in [types.ts:226](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L226)*

___

###  feeOrders

• **feeOrders**: *`SignedOrder`[]*

*Inherited from [SwapQuoteBase](#feeorders)*

*Defined in [types.ts:225](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L225)*

___

###  makerAssetData

• **makerAssetData**: *string*

*Inherited from [SwapQuoteBase](#makerassetdata)*

*Defined in [types.ts:223](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L223)*

___

###  makerAssetFillAmount

• **makerAssetFillAmount**: *`BigNumber`*

*Defined in [types.ts:244](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L244)*

___

###  orders

• **orders**: *`SignedOrder`[]*

*Inherited from [SwapQuoteBase](#orders)*

*Defined in [types.ts:224](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L224)*

___

###  takerAssetData

• **takerAssetData**: *string*

*Inherited from [SwapQuoteBase](#takerassetdata)*

*Defined in [types.ts:222](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L222)*

___

###  type

• **type**: *`Buy`*

*Defined in [types.ts:245](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L245)*

___

###  worstCaseQuoteInfo

• **worstCaseQuoteInfo**: *[SwapQuoteInfo](#interface-swapquoteinfo)*

*Inherited from [SwapQuoteBase](#worstcasequoteinfo)*

*Defined in [types.ts:227](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L227)*

<hr />

> # Interface: MarketBuySwapQuoteWithAffiliateFee

## Hierarchy

* [SwapQuoteWithAffiliateFeeBase](#interface-swapquotewithaffiliatefeebase)

  * [MarketBuySwapQuote](#interface-marketbuyswapquote)

  * **MarketBuySwapQuoteWithAffiliateFee**

## Index

### Properties

* [bestCaseQuoteInfo](#bestcasequoteinfo)
* [feeOrders](#feeorders)
* [feePercentage](#feepercentage)
* [makerAssetData](#makerassetdata)
* [makerAssetFillAmount](#makerassetfillamount)
* [orders](#orders)
* [takerAssetData](#takerassetdata)
* [type](#type)
* [worstCaseQuoteInfo](#worstcasequoteinfo)

## Properties

###  bestCaseQuoteInfo

• **bestCaseQuoteInfo**: *[SwapQuoteInfo](#interface-swapquoteinfo)*

*Inherited from [SwapQuoteBase](#bestcasequoteinfo)*

*Defined in [types.ts:226](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L226)*

___

###  feeOrders

• **feeOrders**: *`SignedOrder`[]*

*Inherited from [SwapQuoteBase](#feeorders)*

*Defined in [types.ts:225](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L225)*

___

###  feePercentage

• **feePercentage**: *number*

*Inherited from [SwapQuoteWithAffiliateFeeBase](#feepercentage)*

*Defined in [types.ts:249](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L249)*

___

###  makerAssetData

• **makerAssetData**: *string*

*Inherited from [SwapQuoteBase](#makerassetdata)*

*Defined in [types.ts:223](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L223)*

___

###  makerAssetFillAmount

• **makerAssetFillAmount**: *`BigNumber`*

*Inherited from [MarketBuySwapQuote](#makerassetfillamount)*

*Defined in [types.ts:244](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L244)*

___

###  orders

• **orders**: *`SignedOrder`[]*

*Inherited from [SwapQuoteBase](#orders)*

*Defined in [types.ts:224](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L224)*

___

###  takerAssetData

• **takerAssetData**: *string*

*Inherited from [SwapQuoteBase](#takerassetdata)*

*Defined in [types.ts:222](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L222)*

___

###  type

• **type**: *`Buy`*

*Inherited from [MarketBuySwapQuote](#type)*

*Defined in [types.ts:245](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L245)*

___

###  worstCaseQuoteInfo

• **worstCaseQuoteInfo**: *[SwapQuoteInfo](#interface-swapquoteinfo)*

*Inherited from [SwapQuoteBase](#worstcasequoteinfo)*

*Defined in [types.ts:227](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L227)*

<hr />

> # Interface: MarketSellSwapQuote

takerAssetFillAmount: The amount of takerAsset sold for makerAsset.
type: Specified MarketOperation the SwapQuote is provided for

## Hierarchy

* [SwapQuoteBase](#interface-swapquotebase)

  * **MarketSellSwapQuote**

  * [MarketSellSwapQuoteWithAffiliateFee](#interface-marketsellswapquotewithaffiliatefee)

## Index

### Properties

* [bestCaseQuoteInfo](#bestcasequoteinfo)
* [feeOrders](#feeorders)
* [makerAssetData](#makerassetdata)
* [orders](#orders)
* [takerAssetData](#takerassetdata)
* [takerAssetFillAmount](#takerassetfillamount)
* [type](#type)
* [worstCaseQuoteInfo](#worstcasequoteinfo)

## Properties

###  bestCaseQuoteInfo

• **bestCaseQuoteInfo**: *[SwapQuoteInfo](#interface-swapquoteinfo)*

*Inherited from [SwapQuoteBase](#bestcasequoteinfo)*

*Defined in [types.ts:226](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L226)*

___

###  feeOrders

• **feeOrders**: *`SignedOrder`[]*

*Inherited from [SwapQuoteBase](#feeorders)*

*Defined in [types.ts:225](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L225)*

___

###  makerAssetData

• **makerAssetData**: *string*

*Inherited from [SwapQuoteBase](#makerassetdata)*

*Defined in [types.ts:223](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L223)*

___

###  orders

• **orders**: *`SignedOrder`[]*

*Inherited from [SwapQuoteBase](#orders)*

*Defined in [types.ts:224](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L224)*

___

###  takerAssetData

• **takerAssetData**: *string*

*Inherited from [SwapQuoteBase](#takerassetdata)*

*Defined in [types.ts:222](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L222)*

___

###  takerAssetFillAmount

• **takerAssetFillAmount**: *`BigNumber`*

*Defined in [types.ts:235](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L235)*

___

###  type

• **type**: *`Sell`*

*Defined in [types.ts:236](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L236)*

___

###  worstCaseQuoteInfo

• **worstCaseQuoteInfo**: *[SwapQuoteInfo](#interface-swapquoteinfo)*

*Inherited from [SwapQuoteBase](#worstcasequoteinfo)*

*Defined in [types.ts:227](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L227)*

<hr />

> # Interface: MarketSellSwapQuoteWithAffiliateFee

## Hierarchy

* [SwapQuoteWithAffiliateFeeBase](#interface-swapquotewithaffiliatefeebase)

  * [MarketSellSwapQuote](#interface-marketsellswapquote)

  * **MarketSellSwapQuoteWithAffiliateFee**

## Index

### Properties

* [bestCaseQuoteInfo](#bestcasequoteinfo)
* [feeOrders](#feeorders)
* [feePercentage](#feepercentage)
* [makerAssetData](#makerassetdata)
* [orders](#orders)
* [takerAssetData](#takerassetdata)
* [takerAssetFillAmount](#takerassetfillamount)
* [type](#type)
* [worstCaseQuoteInfo](#worstcasequoteinfo)

## Properties

###  bestCaseQuoteInfo

• **bestCaseQuoteInfo**: *[SwapQuoteInfo](#interface-swapquoteinfo)*

*Inherited from [SwapQuoteBase](#bestcasequoteinfo)*

*Defined in [types.ts:226](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L226)*

___

###  feeOrders

• **feeOrders**: *`SignedOrder`[]*

*Inherited from [SwapQuoteBase](#feeorders)*

*Defined in [types.ts:225](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L225)*

___

###  feePercentage

• **feePercentage**: *number*

*Inherited from [SwapQuoteWithAffiliateFeeBase](#feepercentage)*

*Defined in [types.ts:249](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L249)*

___

###  makerAssetData

• **makerAssetData**: *string*

*Inherited from [SwapQuoteBase](#makerassetdata)*

*Defined in [types.ts:223](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L223)*

___

###  orders

• **orders**: *`SignedOrder`[]*

*Inherited from [SwapQuoteBase](#orders)*

*Defined in [types.ts:224](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L224)*

___

###  takerAssetData

• **takerAssetData**: *string*

*Inherited from [SwapQuoteBase](#takerassetdata)*

*Defined in [types.ts:222](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L222)*

___

###  takerAssetFillAmount

• **takerAssetFillAmount**: *`BigNumber`*

*Inherited from [MarketSellSwapQuote](#takerassetfillamount)*

*Defined in [types.ts:235](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L235)*

___

###  type

• **type**: *`Sell`*

*Inherited from [MarketSellSwapQuote](#type)*

*Defined in [types.ts:236](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L236)*

___

###  worstCaseQuoteInfo

• **worstCaseQuoteInfo**: *[SwapQuoteInfo](#interface-swapquoteinfo)*

*Inherited from [SwapQuoteBase](#worstcasequoteinfo)*

*Defined in [types.ts:227](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L227)*

<hr />

> # Interface: OrderProvider

gerOrdersAsync: Given an OrderProviderRequest, get an OrderProviderResponse.
getAvailableMakerAssetDatasAsync: Given a taker asset data string, return all availabled paired maker asset data strings.
getAvailableTakerAssetDatasAsync: Given a maker asset data string, return all availabled paired taker asset data strings.

## Hierarchy

* **OrderProvider**

## Implemented by

* [BasicOrderProvider](#class-basicorderprovider)
* [StandardRelayerAPIOrderProvider](#class-standardrelayerapiorderprovider)

## Index

### Properties

* [getAvailableMakerAssetDatasAsync](#getavailablemakerassetdatasasync)
* [getAvailableTakerAssetDatasAsync](#getavailabletakerassetdatasasync)
* [getOrdersAsync](#getordersasync)

## Properties

###  getAvailableMakerAssetDatasAsync

• **getAvailableMakerAssetDatasAsync**: *function*

*Defined in [types.ts:38](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L38)*

#### Type declaration:

▸ (`takerAssetData`: string): *`Promise<string[]>`*

**Parameters:**

Name | Type |
------ | ------ |
`takerAssetData` | string |

___

###  getAvailableTakerAssetDatasAsync

• **getAvailableTakerAssetDatasAsync**: *function*

*Defined in [types.ts:39](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L39)*

#### Type declaration:

▸ (`makerAssetData`: string): *`Promise<string[]>`*

**Parameters:**

Name | Type |
------ | ------ |
`makerAssetData` | string |

___

###  getOrdersAsync

• **getOrdersAsync**: *function*

*Defined in [types.ts:37](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L37)*

#### Type declaration:

▸ (`orderProviderRequest`: [OrderProviderRequest](#interface-orderproviderrequest)): *`Promise<OrderProviderResponse>`*

**Parameters:**

Name | Type |
------ | ------ |
`orderProviderRequest` | [OrderProviderRequest](#interface-orderproviderrequest) |

<hr />

> # Interface: OrderProviderRequest

makerAssetData: The assetData representing the desired makerAsset.
takerAssetData: The assetData representing the desired takerAsset.
networkId: The networkId that the desired orders should be for.

## Hierarchy

* **OrderProviderRequest**

## Index

### Properties

* [makerAssetData](#makerassetdata)
* [networkId](#networkid)
* [takerAssetData](#takerassetdata)

## Properties

###  makerAssetData

• **makerAssetData**: *string*

*Defined in [types.ts:11](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L11)*

___

###  networkId

• **networkId**: *number*

*Defined in [types.ts:13](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L13)*

___

###  takerAssetData

• **takerAssetData**: *string*

*Defined in [types.ts:12](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L12)*

<hr />

> # Interface: OrderProviderResponse

orders: An array of orders with optional remaining fillable makerAsset amounts. See type for more info.

## Hierarchy

* **OrderProviderResponse**

## Index

### Properties

* [orders](#orders)

## Properties

###  orders

• **orders**: *[SignedOrderWithRemainingFillableMakerAssetAmount](#interface-signedorderwithremainingfillablemakerassetamount)[]*

*Defined in [types.ts:20](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L20)*

<hr />

> # Interface: OrdersAndFillableAmounts

orders: An array of signed orders
remainingFillableMakerAssetAmounts: A list of fillable amounts for the signed orders. The index of an item in the array associates the amount with the corresponding order.

## Hierarchy

* **OrdersAndFillableAmounts**

## Index

### Properties

* [orders](#orders)
* [remainingFillableMakerAssetAmounts](#remainingfillablemakerassetamounts)

## Properties

###  orders

• **orders**: *`SignedOrder`[]*

*Defined in [types.ts:328](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L328)*

___

###  remainingFillableMakerAssetAmounts

• **remainingFillableMakerAssetAmounts**: *`BigNumber`[]*

*Defined in [types.ts:329](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L329)*

<hr />

> # Interface: SignedOrderWithRemainingFillableMakerAssetAmount

A normal SignedOrder with one extra optional property `remainingFillableMakerAssetAmount`
remainingFillableMakerAssetAmount: The amount of the makerAsset that is available to be filled

## Hierarchy

* `SignedOrder`

  * **SignedOrderWithRemainingFillableMakerAssetAmount**

## Index

### Properties

* [exchangeAddress](#exchangeaddress)
* [expirationTimeSeconds](#expirationtimeseconds)
* [feeRecipientAddress](#feerecipientaddress)
* [makerAddress](#makeraddress)
* [makerAssetAmount](#makerassetamount)
* [makerAssetData](#makerassetdata)
* [makerFee](#makerfee)
* [remainingFillableMakerAssetAmount](#optional-remainingfillablemakerassetamount)
* [salt](#salt)
* [senderAddress](#senderaddress)
* [signature](#signature)
* [takerAddress](#takeraddress)
* [takerAssetAmount](#takerassetamount)
* [takerAssetData](#takerassetdata)
* [takerFee](#takerfee)

## Properties

###  exchangeAddress

• **exchangeAddress**: *string*

*Inherited from void*

Defined in /Users/rickmorty/Documents/projects/0x/0x-monorepo/packages/types/lib/index.d.ts:14

___

###  expirationTimeSeconds

• **expirationTimeSeconds**: *`BigNumber`*

*Inherited from void*

Defined in /Users/rickmorty/Documents/projects/0x/0x-monorepo/packages/types/lib/index.d.ts:16

___

###  feeRecipientAddress

• **feeRecipientAddress**: *string*

*Inherited from void*

Defined in /Users/rickmorty/Documents/projects/0x/0x-monorepo/packages/types/lib/index.d.ts:15

___

###  makerAddress

• **makerAddress**: *string*

*Inherited from void*

Defined in /Users/rickmorty/Documents/projects/0x/0x-monorepo/packages/types/lib/index.d.ts:5

___

###  makerAssetAmount

• **makerAssetAmount**: *`BigNumber`*

*Inherited from void*

Defined in /Users/rickmorty/Documents/projects/0x/0x-monorepo/packages/types/lib/index.d.ts:9

___

###  makerAssetData

• **makerAssetData**: *string*

*Inherited from void*

Defined in /Users/rickmorty/Documents/projects/0x/0x-monorepo/packages/types/lib/index.d.ts:11

___

###  makerFee

• **makerFee**: *`BigNumber`*

*Inherited from void*

Defined in /Users/rickmorty/Documents/projects/0x/0x-monorepo/packages/types/lib/index.d.ts:7

___

### `Optional` remainingFillableMakerAssetAmount

• **remainingFillableMakerAssetAmount**? : *`BigNumber`*

*Defined in [types.ts:28](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L28)*

___

###  salt

• **salt**: *`BigNumber`*

*Inherited from void*

Defined in /Users/rickmorty/Documents/projects/0x/0x-monorepo/packages/types/lib/index.d.ts:13

___

###  senderAddress

• **senderAddress**: *string*

*Inherited from void*

Defined in /Users/rickmorty/Documents/projects/0x/0x-monorepo/packages/types/lib/index.d.ts:4

___

###  signature

• **signature**: *string*

*Inherited from void*

Defined in /Users/rickmorty/Documents/projects/0x/0x-monorepo/packages/types/lib/index.d.ts:33

___

###  takerAddress

• **takerAddress**: *string*

*Inherited from void*

Defined in /Users/rickmorty/Documents/projects/0x/0x-monorepo/packages/types/lib/index.d.ts:6

___

###  takerAssetAmount

• **takerAssetAmount**: *`BigNumber`*

*Inherited from void*

Defined in /Users/rickmorty/Documents/projects/0x/0x-monorepo/packages/types/lib/index.d.ts:10

___

###  takerAssetData

• **takerAssetData**: *string*

*Inherited from void*

Defined in /Users/rickmorty/Documents/projects/0x/0x-monorepo/packages/types/lib/index.d.ts:12

___

###  takerFee

• **takerFee**: *`BigNumber`*

*Inherited from void*

Defined in /Users/rickmorty/Documents/projects/0x/0x-monorepo/packages/types/lib/index.d.ts:8

<hr />

> # Interface: SmartContractParamsBase

orders: An array of objects conforming to SignedOrder. These orders can be used to cover the requested assetBuyAmount plus slippage.
signatures: An array of signatures that attest that the maker of the orders in fact made the orders.

## Hierarchy

* **SmartContractParamsBase**

  * [ExchangeMarketBuySmartContractParams](#interface-exchangemarketbuysmartcontractparams)

  * [ExchangeMarketSellSmartContractParams](#interface-exchangemarketsellsmartcontractparams)

## Index

### Properties

* [orders](#orders)
* [signatures](#signatures)

## Properties

###  orders

• **orders**: *`SignedOrder`[]*

*Defined in [types.ts:75](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L75)*

___

###  signatures

• **signatures**: *string[]*

*Defined in [types.ts:76](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L76)*

<hr />

> # Interface: SmartContractParamsInfo <**T**>

Represents the metadata to call a smart contract with parameters.
params: The metadata object containing all the input parameters of a smart contract call.
toAddress: The contract address to call.
ethAmount: If provided, the eth amount in wei to send with the smart contract call.
methodAbi: The ABI of the smart contract method to call with params.

## Type parameters

▪ **T**

## Hierarchy

* **SmartContractParamsInfo**

## Index

### Properties

* [ethAmount](#optional-ethamount)
* [methodAbi](#methodabi)
* [params](#params)
* [toAddress](#toaddress)

## Properties

### `Optional` ethAmount

• **ethAmount**? : *`BigNumber`*

*Defined in [types.ts:66](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L66)*

___

###  methodAbi

• **methodAbi**: *`MethodAbi`*

*Defined in [types.ts:67](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L67)*

___

###  params

• **params**: *`T`*

*Defined in [types.ts:64](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L64)*

___

###  toAddress

• **toAddress**: *string*

*Defined in [types.ts:65](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L65)*

<hr />

> # Interface: SwapQuoteBase

takerAssetData: String that represents a specific taker asset (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
makerAssetData: String that represents a specific maker asset (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
orders: An array of objects conforming to SignedOrder. These orders can be used to cover the requested assetBuyAmount plus slippage.
feeOrders: An array of objects conforming to SignedOrder. These orders can be used to cover the fees for the orders param above.
bestCaseQuoteInfo: Info about the best case price for the asset.
worstCaseQuoteInfo: Info about the worst case price for the asset.

## Hierarchy

* **SwapQuoteBase**

  * [MarketSellSwapQuote](#interface-marketsellswapquote)

  * [MarketBuySwapQuote](#interface-marketbuyswapquote)

## Index

### Properties

* [bestCaseQuoteInfo](#bestcasequoteinfo)
* [feeOrders](#feeorders)
* [makerAssetData](#makerassetdata)
* [orders](#orders)
* [takerAssetData](#takerassetdata)
* [worstCaseQuoteInfo](#worstcasequoteinfo)

## Properties

###  bestCaseQuoteInfo

• **bestCaseQuoteInfo**: *[SwapQuoteInfo](#interface-swapquoteinfo)*

*Defined in [types.ts:226](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L226)*

___

###  feeOrders

• **feeOrders**: *`SignedOrder`[]*

*Defined in [types.ts:225](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L225)*

___

###  makerAssetData

• **makerAssetData**: *string*

*Defined in [types.ts:223](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L223)*

___

###  orders

• **orders**: *`SignedOrder`[]*

*Defined in [types.ts:224](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L224)*

___

###  takerAssetData

• **takerAssetData**: *string*

*Defined in [types.ts:222](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L222)*

___

###  worstCaseQuoteInfo

• **worstCaseQuoteInfo**: *[SwapQuoteInfo](#interface-swapquoteinfo)*

*Defined in [types.ts:227](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L227)*

<hr />

> # Interface: SwapQuoteConsumerBase <**T**>

Interface that varying SwapQuoteConsumers adhere to (exchange consumer, router consumer, forwarder consumer, coordinator consumer)
getCalldataOrThrow: Get CalldataInfo to swap for tokens with provided SwapQuote. Throws if invalid SwapQuote is provided.
getSmartContractParamsOrThrow: Get SmartContractParamsInfo to swap for tokens with provided SwapQuote. Throws if invalid SwapQuote is provided.
executeSwapQuoteOrThrowAsync: Executes a web3 transaction to swap for tokens with provided SwapQuote. Throws if invalid SwapQuote is provided.

## Type parameters

▪ **T**

## Hierarchy

* **SwapQuoteConsumerBase**

## Implemented by

* [ExchangeSwapQuoteConsumer](#class-exchangeswapquoteconsumer)
* [ForwarderSwapQuoteConsumer](#class-forwarderswapquoteconsumer)
* [SwapQuoteConsumer](#class-swapquoteconsumer)

## Index

### Methods

* [executeSwapQuoteOrThrowAsync](#executeswapquoteorthrowasync)
* [getCalldataOrThrowAsync](#getcalldataorthrowasync)
* [getSmartContractParamsOrThrowAsync](#getsmartcontractparamsorthrowasync)

## Methods

###  executeSwapQuoteOrThrowAsync

▸ **executeSwapQuoteOrThrowAsync**(`quote`: [SwapQuote](#swapquote), `opts`: `Partial<SwapQuoteExecutionOptsBase>`): *`Promise<string>`*

*Defined in [types.ts:158](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L158)*

**Parameters:**

Name | Type |
------ | ------ |
`quote` | [SwapQuote](#swapquote) |
`opts` | `Partial<SwapQuoteExecutionOptsBase>` |

**Returns:** *`Promise<string>`*

___

###  getCalldataOrThrowAsync

▸ **getCalldataOrThrowAsync**(`quote`: [SwapQuote](#swapquote), `opts`: `Partial<SwapQuoteGetOutputOptsBase>`): *`Promise<CalldataInfo>`*

*Defined in [types.ts:153](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L153)*

**Parameters:**

Name | Type |
------ | ------ |
`quote` | [SwapQuote](#swapquote) |
`opts` | `Partial<SwapQuoteGetOutputOptsBase>` |

**Returns:** *`Promise<CalldataInfo>`*

___

###  getSmartContractParamsOrThrowAsync

▸ **getSmartContractParamsOrThrowAsync**(`quote`: [SwapQuote](#swapquote), `opts`: `Partial<SwapQuoteGetOutputOptsBase>`): *`Promise<SmartContractParamsInfo<T>>`*

*Defined in [types.ts:154](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L154)*

**Parameters:**

Name | Type |
------ | ------ |
`quote` | [SwapQuote](#swapquote) |
`opts` | `Partial<SwapQuoteGetOutputOptsBase>` |

**Returns:** *`Promise<SmartContractParamsInfo<T>>`*

<hr />

> # Interface: SwapQuoteConsumerOpts

networkId: The networkId that the desired orders should be for.

## Hierarchy

* **SwapQuoteConsumerOpts**

## Index

### Properties

* [networkId](#networkid)

## Properties

###  networkId

• **networkId**: *number*

*Defined in [types.ts:165](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L165)*

<hr />

> # Interface: SwapQuoteExecutionOpts

Represents the options for executing a swap quote with SwapQuoteConsumer

## Hierarchy

  * [SwapQuoteGetOutputOpts](#interface-swapquotegetoutputopts)

  * [ForwarderSwapQuoteExecutionOpts](#interface-forwarderswapquoteexecutionopts)

  * **SwapQuoteExecutionOpts**

## Index

### Properties

* [ethAmount](#optional-ethamount)
* [feePercentage](#feepercentage)
* [feeRecipient](#feerecipient)
* [gasLimit](#optional-gaslimit)
* [gasPrice](#optional-gasprice)
* [takerAddress](#optional-takeraddress)
* [useConsumerType](#optional-useconsumertype)

## Properties

### `Optional` ethAmount

• **ethAmount**? : *`BigNumber`*

*Inherited from [ForwarderSwapQuoteGetOutputOpts](#optional-ethamount)*

*Overrides [ForwarderSwapQuoteGetOutputOpts](#optional-ethamount)*

*Defined in [types.ts:192](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L192)*

___

###  feePercentage

• **feePercentage**: *number*

*Inherited from [ForwarderSwapQuoteGetOutputOpts](#feepercentage)*

*Overrides [ForwarderSwapQuoteGetOutputOpts](#feepercentage)*

*Defined in [types.ts:190](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L190)*

___

###  feeRecipient

• **feeRecipient**: *string*

*Inherited from [ForwarderSwapQuoteGetOutputOpts](#feerecipient)*

*Overrides [ForwarderSwapQuoteGetOutputOpts](#feerecipient)*

*Defined in [types.ts:191](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L191)*

___

### `Optional` gasLimit

• **gasLimit**? : *undefined | number*

*Inherited from [SwapQuoteExecutionOptsBase](#optional-gaslimit)*

*Defined in [types.ts:180](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L180)*

___

### `Optional` gasPrice

• **gasPrice**? : *`BigNumber`*

*Inherited from [SwapQuoteExecutionOptsBase](#optional-gasprice)*

*Defined in [types.ts:181](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L181)*

___

### `Optional` takerAddress

• **takerAddress**? : *undefined | string*

*Inherited from [SwapQuoteGetOutputOpts](#optional-takeraddress)*

*Overrides [SwapQuoteExecutionOptsBase](#optional-takeraddress)*

*Defined in [types.ts:202](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L202)*

___

### `Optional` useConsumerType

• **useConsumerType**? : *[ConsumerType](#enumeration-consumertype)*

*Inherited from [SwapQuoteGetOutputOpts](#optional-useconsumertype)*

*Defined in [types.ts:203](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L203)*

<hr />

> # Interface: SwapQuoteExecutionOptsBase

takerAddress: The address to perform the buy. Defaults to the first available address from the provider.
gasLimit: The amount of gas to send with a transaction (in Gwei). Defaults to an eth_estimateGas rpc call.
gasPrice: Gas price in Wei to use for a transaction

## Hierarchy

* [SwapQuoteGetOutputOptsBase](#interface-swapquotegetoutputoptsbase)

  * **SwapQuoteExecutionOptsBase**

  * [ForwarderSwapQuoteExecutionOpts](#interface-forwarderswapquoteexecutionopts)

## Index

### Properties

* [gasLimit](#optional-gaslimit)
* [gasPrice](#optional-gasprice)
* [takerAddress](#optional-takeraddress)

## Properties

### `Optional` gasLimit

• **gasLimit**? : *undefined | number*

*Defined in [types.ts:180](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L180)*

___

### `Optional` gasPrice

• **gasPrice**? : *`BigNumber`*

*Defined in [types.ts:181](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L181)*

___

### `Optional` takerAddress

• **takerAddress**? : *undefined | string*

*Defined in [types.ts:179](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L179)*

<hr />

> # Interface: SwapQuoteGetOutputOpts

takerAddress: The address to perform the buy. Defaults to the first available address from the provider.
useConsumerType: If provided, defaults the SwapQuoteConsumer to create output consumed by ConsumerType.

## Hierarchy

  * [ForwarderSwapQuoteGetOutputOpts](#interface-forwarderswapquotegetoutputopts)

  * **SwapQuoteGetOutputOpts**

  * [SwapQuoteExecutionOpts](#interface-swapquoteexecutionopts)

## Index

### Properties

* [ethAmount](#optional-ethamount)
* [feePercentage](#feepercentage)
* [feeRecipient](#feerecipient)
* [takerAddress](#optional-takeraddress)
* [useConsumerType](#optional-useconsumertype)

## Properties

### `Optional` ethAmount

• **ethAmount**? : *`BigNumber`*

*Inherited from [ForwarderSwapQuoteGetOutputOpts](#optional-ethamount)*

*Defined in [types.ts:192](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L192)*

___

###  feePercentage

• **feePercentage**: *number*

*Inherited from [ForwarderSwapQuoteGetOutputOpts](#feepercentage)*

*Defined in [types.ts:190](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L190)*

___

###  feeRecipient

• **feeRecipient**: *string*

*Inherited from [ForwarderSwapQuoteGetOutputOpts](#feerecipient)*

*Defined in [types.ts:191](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L191)*

___

### `Optional` takerAddress

• **takerAddress**? : *undefined | string*

*Defined in [types.ts:202](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L202)*

___

### `Optional` useConsumerType

• **useConsumerType**? : *[ConsumerType](#enumeration-consumertype)*

*Defined in [types.ts:203](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L203)*

<hr />

> # Interface: SwapQuoteGetOutputOptsBase

Represents the options provided to a generic SwapQuoteConsumer

## Hierarchy

* **SwapQuoteGetOutputOptsBase**

  * [SwapQuoteExecutionOptsBase](#interface-swapquoteexecutionoptsbase)

  * [ForwarderSwapQuoteGetOutputOpts](#interface-forwarderswapquotegetoutputopts)

<hr />

> # Interface: SwapQuoteInfo

feeTakerTokenAmount: The amount of takerToken required any fee concerned with completing the swap.
takerTokenAmount: The amount of takerToken required to conduct the swap.
totalTakerTokenAmount: The total amount of takerToken required to complete the swap (filling orders, feeOrders, and paying affiliate fee)
makerTokenAmount: The amount of makerToken that will be acquired through the swap.

## Hierarchy

* **SwapQuoteInfo**

## Index

### Properties

* [feeTakerTokenAmount](#feetakertokenamount)
* [makerTokenAmount](#makertokenamount)
* [takerTokenAmount](#takertokenamount)
* [totalTakerTokenAmount](#totaltakertokenamount)

## Properties

###  feeTakerTokenAmount

• **feeTakerTokenAmount**: *`BigNumber`*

*Defined in [types.ts:265](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L265)*

___

###  makerTokenAmount

• **makerTokenAmount**: *`BigNumber`*

*Defined in [types.ts:268](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L268)*

___

###  takerTokenAmount

• **takerTokenAmount**: *`BigNumber`*

*Defined in [types.ts:267](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L267)*

___

###  totalTakerTokenAmount

• **totalTakerTokenAmount**: *`BigNumber`*

*Defined in [types.ts:266](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L266)*

<hr />

> # Interface: SwapQuoteRequestOpts

shouldForceOrderRefresh: If set to true, new orders and state will be fetched instead of waiting for the next orderRefreshIntervalMs. Defaults to false.
shouldDisableRequestingFeeOrders: If set to true, requesting a swapQuote will not perform any computation or requests for fees.
slippagePercentage: The percentage buffer to add to account for slippage. Affects max ETH price estimates. Defaults to 0.2 (20%).

## Hierarchy

* **SwapQuoteRequestOpts**

## Index

### Properties

* [shouldDisableRequestingFeeOrders](#shoulddisablerequestingfeeorders)
* [shouldForceOrderRefresh](#shouldforceorderrefresh)
* [slippagePercentage](#slippagepercentage)

## Properties

###  shouldDisableRequestingFeeOrders

• **shouldDisableRequestingFeeOrders**: *boolean*

*Defined in [types.ts:278](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L278)*

___

###  shouldForceOrderRefresh

• **shouldForceOrderRefresh**: *boolean*

*Defined in [types.ts:277](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L277)*

___

###  slippagePercentage

• **slippagePercentage**: *number*

*Defined in [types.ts:279](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L279)*

<hr />

> # Interface: SwapQuoterOpts

networkId: The ethereum network id. Defaults to 1 (mainnet).
orderRefreshIntervalMs: The interval in ms that getBuyQuoteAsync should trigger an refresh of orders and order states. Defaults to 10000ms (10s).
expiryBufferMs: The number of seconds to add when calculating whether an order is expired or not. Defaults to 300s (5m).

## Hierarchy

* **SwapQuoterOpts**

## Index

### Properties

* [expiryBufferMs](#expirybufferms)
* [networkId](#networkid)
* [orderRefreshIntervalMs](#orderrefreshintervalms)

## Properties

###  expiryBufferMs

• **expiryBufferMs**: *number*

*Defined in [types.ts:296](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L296)*

___

###  networkId

• **networkId**: *number*

*Defined in [types.ts:294](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L294)*

___

###  orderRefreshIntervalMs

• **orderRefreshIntervalMs**: *number*

*Defined in [types.ts:295](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L295)*

<hr />

> # Interface: SwapQuoteWithAffiliateFeeBase

## Hierarchy

* **SwapQuoteWithAffiliateFeeBase**

  * [MarketSellSwapQuoteWithAffiliateFee](#interface-marketsellswapquotewithaffiliatefee)

  * [MarketBuySwapQuoteWithAffiliateFee](#interface-marketbuyswapquotewithaffiliatefee)

## Index

### Properties

* [feePercentage](#feepercentage)

## Properties

###  feePercentage

• **feePercentage**: *number*

*Defined in [types.ts:249](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-swapper/src/types.ts#L249)*

<hr />

* [Globals](globals.md)
* [External Modules]()
  * [constants](modules/_constants_.md)
  * [errors](modules/_errors_.md)
  * [errors.InsufficientAssetLiquidityError](#class-insufficientassetliquidityerror)
  * [index](modules/_index_.md)
  * [order_providers/basic_order_provider](modules/_order_providers_basic_order_provider_.md)
  * [order_providers/basic_order_provider.BasicOrderProvider](#class-basicorderprovider)
  * [order_providers/standard_relayer_api_order_provider](modules/_order_providers_standard_relayer_api_order_provider_.md)
  * [order_providers/standard_relayer_api_order_provider.StandardRelayerAPIOrderProvider](#class-standardrelayerapiorderprovider)
  * [quote_consumers/exchange_swap_quote_consumer](modules/_quote_consumers_exchange_swap_quote_consumer_.md)
  * [quote_consumers/exchange_swap_quote_consumer.ExchangeSwapQuoteConsumer](#class-exchangeswapquoteconsumer)
  * [quote_consumers/forwarder_swap_quote_consumer](modules/_quote_consumers_forwarder_swap_quote_consumer_.md)
  * [quote_consumers/forwarder_swap_quote_consumer.ForwarderSwapQuoteConsumer](#class-forwarderswapquoteconsumer)
  * [quote_consumers/swap_quote_consumer](modules/_quote_consumers_swap_quote_consumer_.md)
  * [quote_consumers/swap_quote_consumer.SwapQuoteConsumer](#class-swapquoteconsumer)
  * [swap_quoter](modules/_swap_quoter_.md)
  * [swap_quoter.SwapQuoter](#class-swapquoter)
  * [types](modules/_types_.md)
  * [types.ConsumerType](#class-consumertype)
  * [types.SwapQuoteConsumerError](#class-swapquoteconsumererror)
  * [types.SwapQuoterError](#class-swapquotererror)
  * [types.CalldataInfo](#class-calldatainfo)
  * [types.ExchangeMarketBuySmartContractParams](#class-exchangemarketbuysmartcontractparams)
  * [types.ExchangeMarketSellSmartContractParams](#class-exchangemarketsellsmartcontractparams)
  * [types.ForwarderMarketBuySmartContractParams](#class-forwardermarketbuysmartcontractparams)
  * [types.ForwarderMarketSellSmartContractParams](#class-forwardermarketsellsmartcontractparams)
  * [types.ForwarderSmartContractParamsBase](#class-forwardersmartcontractparamsbase)
  * [types.ForwarderSwapQuoteExecutionOpts](#class-forwarderswapquoteexecutionopts)
  * [types.ForwarderSwapQuoteGetOutputOpts](#class-forwarderswapquotegetoutputopts)
  * [types.LiquidityForAssetData](#class-liquidityforassetdata)
  * [types.MarketBuySwapQuote](#class-marketbuyswapquote)
  * [types.MarketBuySwapQuoteWithAffiliateFee](#class-marketbuyswapquotewithaffiliatefee)
  * [types.MarketSellSwapQuote](#class-marketsellswapquote)
  * [types.MarketSellSwapQuoteWithAffiliateFee](#class-marketsellswapquotewithaffiliatefee)
  * [types.OrderProvider](#class-orderprovider)
  * [types.OrderProviderRequest](#class-orderproviderrequest)
  * [types.OrderProviderResponse](#class-orderproviderresponse)
  * [types.OrdersAndFillableAmounts](#class-ordersandfillableamounts)
  * [types.SignedOrderWithRemainingFillableMakerAssetAmount](#class-signedorderwithremainingfillablemakerassetamount)
  * [types.SmartContractParamsBase](#class-smartcontractparamsbase)
  * [types.SmartContractParamsInfo](#class-smartcontractparamsinfo)
  * [types.SwapQuoteBase](#class-swapquotebase)
  * [types.SwapQuoteConsumerBase](#class-swapquoteconsumerbase)
  * [types.SwapQuoteConsumerOpts](#class-swapquoteconsumeropts)
  * [types.SwapQuoteExecutionOpts](#class-swapquoteexecutionopts)
  * [types.SwapQuoteExecutionOptsBase](#class-swapquoteexecutionoptsbase)
  * [types.SwapQuoteGetOutputOpts](#class-swapquotegetoutputopts)
  * [types.SwapQuoteGetOutputOptsBase](#class-swapquotegetoutputoptsbase)
  * [types.SwapQuoteInfo](#class-swapquoteinfo)
  * [types.SwapQuoteRequestOpts](#class-swapquoterequestopts)
  * [types.SwapQuoteWithAffiliateFeeBase](#class-swapquotewithaffiliatefeebase)
  * [types.SwapQuoterOpts](#class-swapquoteropts)
  * [utils/affiliate_fee_utils](modules/_utils_affiliate_fee_utils_.md)
  * [utils/assert](modules/_utils_assert_.md)
  * [utils/asset_data_utils](modules/_utils_asset_data_utils_.md)
  * [utils/calculate_liquidity](modules/_utils_calculate_liquidity_.md)
  * [utils/order_provider_response_processor](modules/_utils_order_provider_response_processor_.md)
  * [utils/swap_quote_calculator](modules/_utils_swap_quote_calculator_.md)
  * [utils/swap_quote_consumer_utils](modules/_utils_swap_quote_consumer_utils_.md)
  * [utils/utils](modules/_utils_utils_.md)
* [Classes]()
  * [errors.InsufficientAssetLiquidityError](#class-insufficientassetliquidityerror)
  * [order_providers/basic_order_provider.BasicOrderProvider](#class-basicorderprovider)
  * [order_providers/standard_relayer_api_order_provider.StandardRelayerAPIOrderProvider](#class-standardrelayerapiorderprovider)
  * [quote_consumers/exchange_swap_quote_consumer.ExchangeSwapQuoteConsumer](#class-exchangeswapquoteconsumer)
  * [quote_consumers/forwarder_swap_quote_consumer.ForwarderSwapQuoteConsumer](#class-forwarderswapquoteconsumer)
  * [quote_consumers/swap_quote_consumer.SwapQuoteConsumer](#class-swapquoteconsumer)
  * [swap_quoter.SwapQuoter](#class-swapquoter)
* [Enums]()
  * [types.ConsumerType](#class-consumertype)
  * [types.SwapQuoteConsumerError](#class-swapquoteconsumererror)
  * [types.SwapQuoterError](#class-swapquotererror)
* [Interfaces]()
  * [types.CalldataInfo](#class-calldatainfo)
  * [types.ExchangeMarketBuySmartContractParams](#class-exchangemarketbuysmartcontractparams)
  * [types.ExchangeMarketSellSmartContractParams](#class-exchangemarketsellsmartcontractparams)
  * [types.ForwarderMarketBuySmartContractParams](#class-forwardermarketbuysmartcontractparams)
  * [types.ForwarderMarketSellSmartContractParams](#class-forwardermarketsellsmartcontractparams)
  * [types.ForwarderSmartContractParamsBase](#class-forwardersmartcontractparamsbase)
  * [types.ForwarderSwapQuoteExecutionOpts](#class-forwarderswapquoteexecutionopts)
  * [types.ForwarderSwapQuoteGetOutputOpts](#class-forwarderswapquotegetoutputopts)
  * [types.LiquidityForAssetData](#class-liquidityforassetdata)
  * [types.MarketBuySwapQuote](#class-marketbuyswapquote)
  * [types.MarketBuySwapQuoteWithAffiliateFee](#class-marketbuyswapquotewithaffiliatefee)
  * [types.MarketSellSwapQuote](#class-marketsellswapquote)
  * [types.MarketSellSwapQuoteWithAffiliateFee](#class-marketsellswapquotewithaffiliatefee)
  * [types.OrderProvider](#class-orderprovider)
  * [types.OrderProviderRequest](#class-orderproviderrequest)
  * [types.OrderProviderResponse](#class-orderproviderresponse)
  * [types.OrdersAndFillableAmounts](#class-ordersandfillableamounts)
  * [types.SignedOrderWithRemainingFillableMakerAssetAmount](#class-signedorderwithremainingfillablemakerassetamount)
  * [types.SmartContractParamsBase](#class-smartcontractparamsbase)
  * [types.SmartContractParamsInfo](#class-smartcontractparamsinfo)
  * [types.SwapQuoteBase](#class-swapquotebase)
  * [types.SwapQuoteConsumerBase](#class-swapquoteconsumerbase)
  * [types.SwapQuoteConsumerOpts](#class-swapquoteconsumeropts)
  * [types.SwapQuoteExecutionOpts](#class-swapquoteexecutionopts)
  * [types.SwapQuoteExecutionOptsBase](#class-swapquoteexecutionoptsbase)
  * [types.SwapQuoteGetOutputOpts](#class-swapquotegetoutputopts)
  * [types.SwapQuoteGetOutputOptsBase](#class-swapquotegetoutputoptsbase)
  * [types.SwapQuoteInfo](#class-swapquoteinfo)
  * [types.SwapQuoteRequestOpts](#class-swapquoterequestopts)
  * [types.SwapQuoteWithAffiliateFeeBase](#class-swapquotewithaffiliatefeebase)
  * [types.SwapQuoterOpts](#class-swapquoteropts)

<hr />

