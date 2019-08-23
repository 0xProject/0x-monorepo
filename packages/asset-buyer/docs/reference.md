> # Class: AssetBuyer

## Hierarchy

* **AssetBuyer**

## Index

### Constructors

* [constructor](#constructor)

### Properties

* [expiryBufferSeconds](#expirybufferseconds)
* [networkId](#networkid)
* [orderProvider](#orderprovider)
* [orderRefreshIntervalMs](#orderrefreshintervalms)
* [provider](#provider)

### Methods

* [executeBuyQuoteAsync](#executebuyquoteasync)
* [getAvailableAssetDatasAsync](#getavailableassetdatasasync)
* [getBuyQuoteAsync](#getbuyquoteasync)
* [getBuyQuoteForERC20TokenAddressAsync](#getbuyquoteforerc20tokenaddressasync)
* [getLiquidityForAssetDataAsync](#getliquidityforassetdataasync)
* [getOrdersAndFillableAmountsAsync](#getordersandfillableamountsasync)
* [getAssetBuyerForProvidedOrders](#static-getassetbuyerforprovidedorders)
* [getAssetBuyerForStandardRelayerAPIUrl](#static-getassetbuyerforstandardrelayerapiurl)

## Constructors

###  constructor

\+ **new AssetBuyer**(`supportedProvider`: `SupportedProvider`, `orderProvider`: [OrderProvider](#class-assetbuyer)*

*Defined in [asset_buyer.ts:84](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/asset_buyer.ts#L84)*

Instantiates a new AssetBuyer instance

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`supportedProvider` | `SupportedProvider` | - | The Provider instance you would like to use for interacting with the Ethereum network. |
`orderProvider` | [OrderProvider](#interface-orderprovider) | - | An object that conforms to OrderProvider, see type for definition. |
`options` | `Partial<AssetBuyerOpts>` |  {} | Initialization options for the AssetBuyer. See type definition for details.  |

**Returns:** *[AssetBuyer](#class-assetbuyer)*

An instance of AssetBuyer

## Properties

###  expiryBufferSeconds

• **expiryBufferSeconds**: *number*

*Defined in [asset_buyer.ts:41](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/asset_buyer.ts#L41)*

___

###  networkId

• **networkId**: *number*

*Defined in [asset_buyer.ts:39](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/asset_buyer.ts#L39)*

___

###  orderProvider

• **orderProvider**: *[OrderProvider](#interface-orderprovider)*

*Defined in [asset_buyer.ts:38](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/asset_buyer.ts#L38)*

___

###  orderRefreshIntervalMs

• **orderRefreshIntervalMs**: *number*

*Defined in [asset_buyer.ts:40](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/asset_buyer.ts#L40)*

___

###  provider

• **provider**: *`ZeroExProvider`*

*Defined in [asset_buyer.ts:37](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/asset_buyer.ts#L37)*

## Methods

###  executeBuyQuoteAsync

▸ **executeBuyQuoteAsync**(`buyQuote`: [BuyQuote](#interface-buyquote), `options`: `Partial<BuyQuoteExecutionOpts>`): *`Promise<string>`*

*Defined in [asset_buyer.ts:227](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/asset_buyer.ts#L227)*

Given a BuyQuote and desired rate, attempt to execute the buy.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`buyQuote` | [BuyQuote](#interface-buyquote) | - | An object that conforms to BuyQuote. See type definition for more information. |
`options` | `Partial<BuyQuoteExecutionOpts>` |  {} | Options for the execution of the BuyQuote. See type definition for more information.  |

**Returns:** *`Promise<string>`*

A promise of the txHash.

___

###  getAvailableAssetDatasAsync

▸ **getAvailableAssetDatasAsync**(): *`Promise<string[]>`*

*Defined in [asset_buyer.ts:297](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/asset_buyer.ts#L297)*

Get the asset data of all assets that are purchaseable with ether token (wETH) in the order provider passed in at init.

**Returns:** *`Promise<string[]>`*

An array of asset data strings that can be purchased using wETH.

___

###  getBuyQuoteAsync

▸ **getBuyQuoteAsync**(`assetData`: string, `assetBuyAmount`: `BigNumber`, `options`: `Partial<BuyQuoteRequestOpts>`): *`Promise<BuyQuote>`*

*Defined in [asset_buyer.ts:126](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/asset_buyer.ts#L126)*

Get a `BuyQuote` containing all information relevant to fulfilling a buy given a desired assetData.
You can then pass the `BuyQuote` to `executeBuyQuoteAsync` to execute the buy.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`assetData` | string | - | The assetData of the desired asset to buy (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md). |
`assetBuyAmount` | `BigNumber` | - | The amount of asset to buy. |
`options` | `Partial<BuyQuoteRequestOpts>` |  {} | Options for the request. See type definition for more information.  |

**Returns:** *`Promise<BuyQuote>`*

An object that conforms to BuyQuote that satisfies the request. See type definition for more information.

___

###  getBuyQuoteForERC20TokenAddressAsync

▸ **getBuyQuoteForERC20TokenAddressAsync**(`tokenAddress`: string, `assetBuyAmount`: `BigNumber`, `options`: `Partial<BuyQuoteRequestOpts>`): *`Promise<BuyQuote>`*

*Defined in [asset_buyer.ts:174](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/asset_buyer.ts#L174)*

Get a `BuyQuote` containing all information relevant to fulfilling a buy given a desired ERC20 token address.
You can then pass the `BuyQuote` to `executeBuyQuoteAsync` to execute the buy.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`tokenAddress` | string | - | The ERC20 token address. |
`assetBuyAmount` | `BigNumber` | - | The amount of asset to buy. |
`options` | `Partial<BuyQuoteRequestOpts>` |  {} | Options for the request. See type definition for more information.  |

**Returns:** *`Promise<BuyQuote>`*

An object that conforms to BuyQuote that satisfies the request. See type definition for more information.

___

###  getLiquidityForAssetDataAsync

▸ **getLiquidityForAssetDataAsync**(`assetData`: string, `options`: `Partial<LiquidityRequestOpts>`): *`Promise<LiquidityForAssetData>`*

*Defined in [asset_buyer.ts:193](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/asset_buyer.ts#L193)*

Returns information about available liquidity for an asset
Does not factor in slippage or fees

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`assetData` | string | - | The assetData of the desired asset to buy (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md). |
`options` | `Partial<LiquidityRequestOpts>` |  {} | Options for the request. See type definition for more information.  |

**Returns:** *`Promise<LiquidityForAssetData>`*

An object that conforms to LiquidityForAssetData that satisfies the request. See type definition for more information.

___

###  getOrdersAndFillableAmountsAsync

▸ **getOrdersAndFillableAmountsAsync**(`assetData`: string, `shouldForceOrderRefresh`: boolean): *`Promise<OrdersAndFillableAmounts>`*

*Defined in [asset_buyer.ts:306](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/asset_buyer.ts#L306)*

Grab orders from the map, if there is a miss or it is time to refresh, fetch and process the orders

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`assetData` | string | The assetData of the desired asset to buy (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md). |
`shouldForceOrderRefresh` | boolean | If set to true, new orders and state will be fetched instead of waiting for the next orderRefreshIntervalMs.  |

**Returns:** *`Promise<OrdersAndFillableAmounts>`*

___

### `Static` getAssetBuyerForProvidedOrders

▸ **getAssetBuyerForProvidedOrders**(`supportedProvider`: `SupportedProvider`, `orders`: `SignedOrder`[], `options`: `Partial<AssetBuyerOpts>`): *[AssetBuyer](#class-assetbuyer)*

*Defined in [asset_buyer.ts:54](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/asset_buyer.ts#L54)*

Instantiates a new AssetBuyer instance given existing liquidity in the form of orders and feeOrders.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`supportedProvider` | `SupportedProvider` | - | The Provider instance you would like to use for interacting with the Ethereum network. |
`orders` | `SignedOrder`[] | - | A non-empty array of objects that conform to SignedOrder. All orders must have the same makerAssetData and takerAssetData (WETH). |
`options` | `Partial<AssetBuyerOpts>` |  {} | Initialization options for the AssetBuyer. See type definition for details.  |

**Returns:** *[AssetBuyer](#class-assetbuyer)*

An instance of AssetBuyer

___

### `Static` getAssetBuyerForStandardRelayerAPIUrl

▸ **getAssetBuyerForStandardRelayerAPIUrl**(`supportedProvider`: `SupportedProvider`, `sraApiUrl`: string, `options`: `Partial<AssetBuyerOpts>`): *[AssetBuyer](#class-assetbuyer)*

*Defined in [asset_buyer.ts:73](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/asset_buyer.ts#L73)*

Instantiates a new AssetBuyer instance given a [Standard Relayer API](https://github.com/0xProject/standard-relayer-api) endpoint

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`supportedProvider` | `SupportedProvider` | - | The Provider instance you would like to use for interacting with the Ethereum network. |
`sraApiUrl` | string | - | The standard relayer API base HTTP url you would like to source orders from. |
`options` | `Partial<AssetBuyerOpts>` |  {} | Initialization options for the AssetBuyer. See type definition for details.  |

**Returns:** *[AssetBuyer](#class-assetbuyer)*

An instance of AssetBuyer

<hr />

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

*Defined in [errors.ts:12](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/errors.ts#L12)*

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`amountAvailableToFill` | `BigNumber` | The amount availabe to fill (in base units) factoring in slippage  |

**Returns:** *[InsufficientAssetLiquidityError](#class-insufficientassetliquidityerror)*

## Properties

###  amountAvailableToFill

• **amountAvailableToFill**: *`BigNumber`*

*Defined in [errors.ts:12](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/errors.ts#L12)*

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
* [getOrdersAsync](#getordersasync)

## Constructors

###  constructor

\+ **new BasicOrderProvider**(`orders`: `SignedOrder`[]): *[BasicOrderProvider](#class-basicorderprovider)*

*Defined in [order_providers/basic_order_provider.ts:9](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/order_providers/basic_order_provider.ts#L9)*

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

*Defined in [order_providers/basic_order_provider.ts:9](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/order_providers/basic_order_provider.ts#L9)*

## Methods

###  getAvailableMakerAssetDatasAsync

▸ **getAvailableMakerAssetDatasAsync**(`takerAssetData`: string): *`Promise<string[]>`*

*Defined in [order_providers/basic_order_provider.ts:37](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/order_providers/basic_order_provider.ts#L37)*

Given a taker asset data string, return all availabled paired maker asset data strings.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`takerAssetData` | string | A string representing the taker asset data. |

**Returns:** *`Promise<string[]>`*

An array of asset data strings that can be purchased using takerAssetData.

___

###  getOrdersAsync

▸ **getOrdersAsync**(`orderProviderRequest`: [OrderProviderRequest](#interface-orderproviderrequest)): *`Promise<OrderProviderResponse>`*

*Defined in [order_providers/basic_order_provider.ts:24](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/order_providers/basic_order_provider.ts#L24)*

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
* [getOrdersAsync](#getordersasync)

## Constructors

###  constructor

\+ **new StandardRelayerAPIOrderProvider**(`apiUrl`: string, `networkId`: number): *[StandardRelayerAPIOrderProvider](#class-standardrelayerapiorderprovider)*

*Defined in [order_providers/standard_relayer_api_order_provider.ts:48](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/order_providers/standard_relayer_api_order_provider.ts#L48)*

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

*Defined in [order_providers/standard_relayer_api_order_provider.ts:17](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/order_providers/standard_relayer_api_order_provider.ts#L17)*

___

###  networkId

• **networkId**: *number*

*Defined in [order_providers/standard_relayer_api_order_provider.ts:18](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/order_providers/standard_relayer_api_order_provider.ts#L18)*

## Methods

###  getAvailableMakerAssetDatasAsync

▸ **getAvailableMakerAssetDatasAsync**(`takerAssetData`: string): *`Promise<string[]>`*

*Defined in [order_providers/standard_relayer_api_order_provider.ts:91](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/order_providers/standard_relayer_api_order_provider.ts#L91)*

Given a taker asset data string, return all availabled paired maker asset data strings.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`takerAssetData` | string | A string representing the taker asset data. |

**Returns:** *`Promise<string[]>`*

An array of asset data strings that can be purchased using takerAssetData.

___

###  getOrdersAsync

▸ **getOrdersAsync**(`orderProviderRequest`: [OrderProviderRequest](#interface-orderproviderrequest)): *`Promise<OrderProviderResponse>`*

*Defined in [order_providers/standard_relayer_api_order_provider.ts:67](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/order_providers/standard_relayer_api_order_provider.ts#L67)*

Given an object that conforms to OrderProviderRequest, return the corresponding OrderProviderResponse that satisfies the request.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`orderProviderRequest` | [OrderProviderRequest](#interface-orderproviderrequest) | An instance of OrderProviderRequest. See type for more information. |

**Returns:** *`Promise<OrderProviderResponse>`*

An instance of OrderProviderResponse. See type for more information.

<hr />

> # Enumeration: AssetBuyerError

Possible error messages thrown by an AssetBuyer instance or associated static methods.

## Index

### Enumeration members

* [AssetUnavailable](#assetunavailable)
* [InsufficientAssetLiquidity](#insufficientassetliquidity)
* [InsufficientZrxLiquidity](#insufficientzrxliquidity)
* [InvalidOrderProviderResponse](#invalidorderproviderresponse)
* [NoAddressAvailable](#noaddressavailable)
* [NoEtherTokenContractFound](#noethertokencontractfound)
* [NoZrxTokenContractFound](#nozrxtokencontractfound)
* [SignatureRequestDenied](#signaturerequestdenied)
* [StandardRelayerApiError](#standardrelayerapierror)
* [TransactionValueTooLow](#transactionvaluetoolow)

## Enumeration members

###  AssetUnavailable

• **AssetUnavailable**: = "ASSET_UNAVAILABLE"

*Defined in [types.ts:122](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/types.ts#L122)*

___

###  InsufficientAssetLiquidity

• **InsufficientAssetLiquidity**: = "INSUFFICIENT_ASSET_LIQUIDITY"

*Defined in [types.ts:118](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/types.ts#L118)*

___

###  InsufficientZrxLiquidity

• **InsufficientZrxLiquidity**: = "INSUFFICIENT_ZRX_LIQUIDITY"

*Defined in [types.ts:119](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/types.ts#L119)*

___

###  InvalidOrderProviderResponse

• **InvalidOrderProviderResponse**: = "INVALID_ORDER_PROVIDER_RESPONSE"

*Defined in [types.ts:121](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/types.ts#L121)*

___

###  NoAddressAvailable

• **NoAddressAvailable**: = "NO_ADDRESS_AVAILABLE"

*Defined in [types.ts:120](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/types.ts#L120)*

___

###  NoEtherTokenContractFound

• **NoEtherTokenContractFound**: = "NO_ETHER_TOKEN_CONTRACT_FOUND"

*Defined in [types.ts:115](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/types.ts#L115)*

___

###  NoZrxTokenContractFound

• **NoZrxTokenContractFound**: = "NO_ZRX_TOKEN_CONTRACT_FOUND"

*Defined in [types.ts:116](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/types.ts#L116)*

___

###  SignatureRequestDenied

• **SignatureRequestDenied**: = "SIGNATURE_REQUEST_DENIED"

*Defined in [types.ts:123](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/types.ts#L123)*

___

###  StandardRelayerApiError

• **StandardRelayerApiError**: = "STANDARD_RELAYER_API_ERROR"

*Defined in [types.ts:117](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/types.ts#L117)*

___

###  TransactionValueTooLow

• **TransactionValueTooLow**: = "TRANSACTION_VALUE_TOO_LOW"

*Defined in [types.ts:124](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/types.ts#L124)*

<hr />

> # Interface: AssetBuyerOpts

networkId: The ethereum network id. Defaults to 1 (mainnet).
orderRefreshIntervalMs: The interval in ms that getBuyQuoteAsync should trigger an refresh of orders and order states. Defaults to 10000ms (10s).
expiryBufferSeconds: The number of seconds to add when calculating whether an order is expired or not. Defaults to 300s (5m).

## Hierarchy

* **AssetBuyerOpts**

## Index

### Properties

* [expiryBufferSeconds](#expirybufferseconds)
* [networkId](#networkid)
* [orderRefreshIntervalMs](#orderrefreshintervalms)

## Properties

###  expiryBufferSeconds

• **expiryBufferSeconds**: *number*

*Defined in [types.ts:108](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/types.ts#L108)*

___

###  networkId

• **networkId**: *number*

*Defined in [types.ts:106](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/types.ts#L106)*

___

###  orderRefreshIntervalMs

• **orderRefreshIntervalMs**: *number*

*Defined in [types.ts:107](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/types.ts#L107)*

<hr />

> # Interface: BuyQuote

assetData: String that represents a specific asset (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
assetBuyAmount: The amount of asset to buy.
orders: An array of objects conforming to SignedOrder. These orders can be used to cover the requested assetBuyAmount plus slippage.
feeOrders: An array of objects conforming to SignedOrder. These orders can be used to cover the fees for the orders param above.
feePercentage: Optional affiliate fee percentage used to calculate the eth amounts above.
bestCaseQuoteInfo: Info about the best case price for the asset.
worstCaseQuoteInfo: Info about the worst case price for the asset.

## Hierarchy

* **BuyQuote**

## Index

### Properties

* [assetBuyAmount](#assetbuyamount)
* [assetData](#assetdata)
* [bestCaseQuoteInfo](#bestcasequoteinfo)
* [feeOrders](#feeorders)
* [feePercentage](#optional-feepercentage)
* [orders](#orders)
* [worstCaseQuoteInfo](#worstcasequoteinfo)

## Properties

###  assetBuyAmount

• **assetBuyAmount**: *`BigNumber`*

*Defined in [types.ts:48](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/types.ts#L48)*

___

###  assetData

• **assetData**: *string*

*Defined in [types.ts:47](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/types.ts#L47)*

___

###  bestCaseQuoteInfo

• **bestCaseQuoteInfo**: *[BuyQuoteInfo](#interface-buyquoteinfo)*

*Defined in [types.ts:52](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/types.ts#L52)*

___

###  feeOrders

• **feeOrders**: *`SignedOrder`[]*

*Defined in [types.ts:50](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/types.ts#L50)*

___

### `Optional` feePercentage

• **feePercentage**? : *undefined | number*

*Defined in [types.ts:51](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/types.ts#L51)*

___

###  orders

• **orders**: *`SignedOrder`[]*

*Defined in [types.ts:49](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/types.ts#L49)*

___

###  worstCaseQuoteInfo

• **worstCaseQuoteInfo**: *[BuyQuoteInfo](#interface-buyquoteinfo)*

*Defined in [types.ts:53](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/types.ts#L53)*

<hr />

> # Interface: BuyQuoteExecutionOpts

ethAmount: The desired amount of eth to spend. Defaults to buyQuote.worstCaseQuoteInfo.totalEthAmount.
takerAddress: The address to perform the buy. Defaults to the first available address from the provider.
gasLimit: The amount of gas to send with a transaction (in Gwei). Defaults to an eth_estimateGas rpc call.
gasPrice: Gas price in Wei to use for a transaction
feeRecipient: The address where affiliate fees are sent. Defaults to null address (0x000...000).

## Hierarchy

* **BuyQuoteExecutionOpts**

## Index

### Properties

* [ethAmount](#optional-ethamount)
* [feeRecipient](#feerecipient)
* [gasLimit](#optional-gaslimit)
* [gasPrice](#optional-gasprice)
* [takerAddress](#optional-takeraddress)

## Properties

### `Optional` ethAmount

• **ethAmount**? : *`BigNumber`*

*Defined in [types.ts:93](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/types.ts#L93)*

___

###  feeRecipient

• **feeRecipient**: *string*

*Defined in [types.ts:97](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/types.ts#L97)*

___

### `Optional` gasLimit

• **gasLimit**? : *undefined | number*

*Defined in [types.ts:95](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/types.ts#L95)*

___

### `Optional` gasPrice

• **gasPrice**? : *`BigNumber`*

*Defined in [types.ts:96](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/types.ts#L96)*

___

### `Optional` takerAddress

• **takerAddress**? : *undefined | string*

*Defined in [types.ts:94](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/types.ts#L94)*

<hr />

> # Interface: BuyQuoteInfo

assetEthAmount: The amount of eth required to pay for the requested asset.
feeEthAmount: The amount of eth required to pay the affiliate fee.
totalEthAmount: The total amount of eth required to complete the buy (filling orders, feeOrders, and paying affiliate fee).

## Hierarchy

* **BuyQuoteInfo**

## Index

### Properties

* [assetEthAmount](#assetethamount)
* [feeEthAmount](#feeethamount)
* [totalEthAmount](#totalethamount)

## Properties

###  assetEthAmount

• **assetEthAmount**: *`BigNumber`*

*Defined in [types.ts:62](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/types.ts#L62)*

___

###  feeEthAmount

• **feeEthAmount**: *`BigNumber`*

*Defined in [types.ts:63](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/types.ts#L63)*

___

###  totalEthAmount

• **totalEthAmount**: *`BigNumber`*

*Defined in [types.ts:64](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/types.ts#L64)*

<hr />

> # Interface: BuyQuoteRequestOpts

feePercentage: The affiliate fee percentage. Defaults to 0.
shouldForceOrderRefresh: If set to true, new orders and state will be fetched instead of waiting for the next orderRefreshIntervalMs. Defaults to false.
slippagePercentage: The percentage buffer to add to account for slippage. Affects max ETH price estimates. Defaults to 0.2 (20%).

## Hierarchy

* **BuyQuoteRequestOpts**

## Index

### Properties

* [feePercentage](#feepercentage)
* [shouldForceOrderRefresh](#shouldforceorderrefresh)
* [slippagePercentage](#slippagepercentage)

## Properties

###  feePercentage

• **feePercentage**: *number*

*Defined in [types.ts:73](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/types.ts#L73)*

___

###  shouldForceOrderRefresh

• **shouldForceOrderRefresh**: *boolean*

*Defined in [types.ts:74](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/types.ts#L74)*

___

###  slippagePercentage

• **slippagePercentage**: *number*

*Defined in [types.ts:75](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/types.ts#L75)*

<hr />

> # Interface: LiquidityForAssetData

Represents available liquidity for a given assetData

## Hierarchy

* **LiquidityForAssetData**

## Index

### Properties

* [ethValueAvailableInWei](#ethvalueavailableinwei)
* [tokensAvailableInBaseUnits](#tokensavailableinbaseunits)

## Properties

###  ethValueAvailableInWei

• **ethValueAvailableInWei**: *`BigNumber`*

*Defined in [types.ts:141](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/types.ts#L141)*

___

###  tokensAvailableInBaseUnits

• **tokensAvailableInBaseUnits**: *`BigNumber`*

*Defined in [types.ts:140](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/types.ts#L140)*

<hr />

> # Interface: OrderProvider

gerOrdersAsync: Given an OrderProviderRequest, get an OrderProviderResponse.
getAvailableMakerAssetDatasAsync: Given a taker asset data string, return all availabled paired maker asset data strings.

## Hierarchy

* **OrderProvider**

## Implemented by

* [BasicOrderProvider](#class-basicorderprovider)
* [StandardRelayerAPIOrderProvider](#class-standardrelayerapiorderprovider)

## Index

### Properties

* [getAvailableMakerAssetDatasAsync](#getavailablemakerassetdatasasync)
* [getOrdersAsync](#getordersasync)

## Properties

###  getAvailableMakerAssetDatasAsync

• **getAvailableMakerAssetDatasAsync**: *function*

*Defined in [types.ts:34](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/types.ts#L34)*

#### Type declaration:

▸ (`takerAssetData`: string): *`Promise<string[]>`*

**Parameters:**

Name | Type |
------ | ------ |
`takerAssetData` | string |

___

###  getOrdersAsync

• **getOrdersAsync**: *function*

*Defined in [types.ts:33](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/types.ts#L33)*

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
* [takerAssetData](#takerassetdata)

## Properties

###  makerAssetData

• **makerAssetData**: *string*

*Defined in [types.ts:10](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/types.ts#L10)*

___

###  takerAssetData

• **takerAssetData**: *string*

*Defined in [types.ts:11](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/types.ts#L11)*

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

*Defined in [types.ts:18](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/types.ts#L18)*

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

*Defined in [types.ts:132](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/types.ts#L132)*

___

###  remainingFillableMakerAssetAmounts

• **remainingFillableMakerAssetAmounts**: *`BigNumber`[]*

*Defined in [types.ts:133](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/types.ts#L133)*

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

*Defined in [types.ts:26](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/asset-buyer/src/types.ts#L26)*

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

* [Globals](globals.md)
* [External Modules]()
  * [asset_buyer](modules/_asset_buyer_.md)
  * [asset_buyer.AssetBuyer](#class-assetbuyer)
  * [constants](modules/_constants_.md)
  * [errors](modules/_errors_.md)
  * [errors.InsufficientAssetLiquidityError](#class-insufficientassetliquidityerror)
  * [index](modules/_index_.md)
  * [order_providers/basic_order_provider](modules/_order_providers_basic_order_provider_.md)
  * [order_providers/basic_order_provider.BasicOrderProvider](#class-basicorderprovider)
  * [order_providers/standard_relayer_api_order_provider](modules/_order_providers_standard_relayer_api_order_provider_.md)
  * [order_providers/standard_relayer_api_order_provider.StandardRelayerAPIOrderProvider](#class-standardrelayerapiorderprovider)
  * [types](modules/_types_.md)
  * [types.AssetBuyerError](#class-assetbuyererror)
  * [types.AssetBuyerOpts](#class-assetbuyeropts)
  * [types.BuyQuote](#class-buyquote)
  * [types.BuyQuoteExecutionOpts](#class-buyquoteexecutionopts)
  * [types.BuyQuoteInfo](#class-buyquoteinfo)
  * [types.BuyQuoteRequestOpts](#class-buyquoterequestopts)
  * [types.LiquidityForAssetData](#class-liquidityforassetdata)
  * [types.OrderProvider](#class-orderprovider)
  * [types.OrderProviderRequest](#class-orderproviderrequest)
  * [types.OrderProviderResponse](#class-orderproviderresponse)
  * [types.OrdersAndFillableAmounts](#class-ordersandfillableamounts)
  * [types.SignedOrderWithRemainingFillableMakerAssetAmount](#class-signedorderwithremainingfillablemakerassetamount)
  * [utils/assert](modules/_utils_assert_.md)
  * [utils/asset_data_utils](modules/_utils_asset_data_utils_.md)
  * [utils/buy_quote_calculator](modules/_utils_buy_quote_calculator_.md)
  * [utils/calculate_liquidity](modules/_utils_calculate_liquidity_.md)
  * [utils/order_provider_response_processor](modules/_utils_order_provider_response_processor_.md)
* [Classes]()
  * [asset_buyer.AssetBuyer](#class-assetbuyer)
  * [errors.InsufficientAssetLiquidityError](#class-insufficientassetliquidityerror)
  * [order_providers/basic_order_provider.BasicOrderProvider](#class-basicorderprovider)
  * [order_providers/standard_relayer_api_order_provider.StandardRelayerAPIOrderProvider](#class-standardrelayerapiorderprovider)
* [Enums]()
  * [types.AssetBuyerError](#class-assetbuyererror)
* [Interfaces]()
  * [types.AssetBuyerOpts](#class-assetbuyeropts)
  * [types.BuyQuote](#class-buyquote)
  * [types.BuyQuoteExecutionOpts](#class-buyquoteexecutionopts)
  * [types.BuyQuoteInfo](#class-buyquoteinfo)
  * [types.BuyQuoteRequestOpts](#class-buyquoterequestopts)
  * [types.LiquidityForAssetData](#class-liquidityforassetdata)
  * [types.OrderProvider](#class-orderprovider)
  * [types.OrderProviderRequest](#class-orderproviderrequest)
  * [types.OrderProviderResponse](#class-orderproviderresponse)
  * [types.OrdersAndFillableAmounts](#class-ordersandfillableamounts)
  * [types.SignedOrderWithRemainingFillableMakerAssetAmount](#class-signedorderwithremainingfillablemakerassetamount)

<hr />

