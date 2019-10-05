# Class: HttpClient

This class includes all the functionality related to interacting with a set of HTTP endpoints
that implement the standard relayer API v2


##   Constructors



\+ **new HttpClient**(`url`: string): *[HttpClient](#class-httpclient)*

*Defined in [connect/src/http_client.ts:44](https://github.com/0xProject/0x-monorepo/blob/9fe6c196a/packages/connect/src/http_client.ts#L44)*

Instantiates a new HttpClient instance

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`url` | string | The relayer API base HTTP url you would like to interact with |

**Returns:** *[HttpClient](#class-httpclient)*

An instance of HttpClient

## Methods

###  getAssetPairsAsync

▸ **getAssetPairsAsync**(`requestOpts?`: `RequestOpts` & `AssetPairsRequestOpts` & `PagedRequestOpts`): *`Promise<AssetPairsResponse>`*

*Defined in [connect/src/http_client.ts:59](https://github.com/0xProject/0x-monorepo/blob/9fe6c196a/packages/connect/src/http_client.ts#L59)*

Retrieve assetData pair info from the API

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`requestOpts?` | `RequestOpts` & `AssetPairsRequestOpts` & `PagedRequestOpts` | Options specifying assetData information to retrieve, page information, and network id. |

**Returns:** *`Promise<AssetPairsResponse>`*

The resulting AssetPairsResponse that match the request

___

###  getFeeRecipientsAsync

▸ **getFeeRecipientsAsync**(`requestOpts?`: `RequestOpts` & `PagedRequestOpts`): *`Promise<FeeRecipientsResponse>`*

*Defined in [connect/src/http_client.ts:160](https://github.com/0xProject/0x-monorepo/blob/9fe6c196a/packages/connect/src/http_client.ts#L160)*

Retrieve the list of fee recipient addresses used by the relayer.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`requestOpts?` | `RequestOpts` & `PagedRequestOpts` | Options specifying page information, and network id. |

**Returns:** *`Promise<FeeRecipientsResponse>`*

The resulting FeeRecipientsResponse

___

###  getOrderAsync

▸ **getOrderAsync**(`orderHash`: string, `requestOpts?`: [RequestOpts](#interface-requestopts)): *`Promise<APIOrder>`*

*Defined in [connect/src/http_client.ts:99](https://github.com/0xProject/0x-monorepo/blob/9fe6c196a/packages/connect/src/http_client.ts#L99)*

Retrieve a specific order from the API

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`orderHash` | string | An orderHash generated from the desired order |
`requestOpts?` | [RequestOpts](#interface-requestopts) | - |

**Returns:** *`Promise<APIOrder>`*

The APIOrder that matches the supplied orderHash

___

###  getOrderConfigAsync

▸ **getOrderConfigAsync**(`request`: `OrderConfigRequest`, `requestOpts?`: [RequestOpts](#interface-requestopts)): *`Promise<OrderConfigResponse>`*

*Defined in [connect/src/http_client.ts:139](https://github.com/0xProject/0x-monorepo/blob/9fe6c196a/packages/connect/src/http_client.ts#L139)*

Retrieve fee information from the API

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`request` | `OrderConfigRequest` | A OrderConfigRequest instance describing the specific fees to retrieve |
`requestOpts?` | [RequestOpts](#interface-requestopts) | Options specifying network id. |

**Returns:** *`Promise<OrderConfigResponse>`*

The resulting OrderConfigResponse that matches the request

___

###  getOrderbookAsync

▸ **getOrderbookAsync**(`request`: `OrderbookRequest`, `requestOpts?`: `RequestOpts` & `PagedRequestOpts`): *`Promise<OrderbookResponse>`*

*Defined in [connect/src/http_client.ts:117](https://github.com/0xProject/0x-monorepo/blob/9fe6c196a/packages/connect/src/http_client.ts#L117)*

Retrieve an orderbook from the API

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`request` | `OrderbookRequest` | An OrderbookRequest instance describing the specific orderbook to retrieve |
`requestOpts?` | `RequestOpts` & `PagedRequestOpts` | Options specifying page information, and network id. |

**Returns:** *`Promise<OrderbookResponse>`*

The resulting OrderbookResponse that matches the request

___

###  getOrdersAsync

▸ **getOrdersAsync**(`requestOpts?`: `RequestOpts` & `OrdersRequestOpts` & `PagedRequestOpts`): *`Promise<OrdersResponse>`*

*Defined in [connect/src/http_client.ts:79](https://github.com/0xProject/0x-monorepo/blob/9fe6c196a/packages/connect/src/http_client.ts#L79)*

Retrieve orders from the API

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`requestOpts?` | `RequestOpts` & `OrdersRequestOpts` & `PagedRequestOpts` | Options specifying orders to retrieve and page information, page information, and network id. |

**Returns:** *`Promise<OrdersResponse>`*

The resulting OrdersResponse that match the request

___

###  submitOrderAsync

▸ **submitOrderAsync**(`signedOrder`: `SignedOrder`, `requestOpts?`: [RequestOpts](#interface-requestopts)): *`Promise<void>`*

*Defined in [connect/src/http_client.ts:177](https://github.com/0xProject/0x-monorepo/blob/9fe6c196a/packages/connect/src/http_client.ts#L177)*

Submit a signed order to the API

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`signedOrder` | `SignedOrder` | A SignedOrder instance to submit |
`requestOpts?` | [RequestOpts](#interface-requestopts) | Options specifying network id.  |

**Returns:** *`Promise<void>`*

<hr />

































# Interface: APIOrder


##   Properties

###  metaData

• **metaData**: *object*

*Defined in [types/src/index.ts:408](https://github.com/0xProject/0x-monorepo/blob/9fe6c196a/packages/types/src/index.ts#L408)*

___

###  order

• **order**: *[SignedOrder](#class-signedorder)*

*Defined in [types/src/index.ts:407](https://github.com/0xProject/0x-monorepo/blob/9fe6c196a/packages/types/src/index.ts#L407)*

<hr />

















































 









































# Interface: PagedRequestOpts


##   Properties

### `Optional` page

• **page**? : *undefined | number*

*Defined in [types/src/index.ts:491](https://github.com/0xProject/0x-monorepo/blob/9fe6c196a/packages/types/src/index.ts#L491)*

___

### `Optional` perPage

• **perPage**? : *undefined | number*

*Defined in [types/src/index.ts:492](https://github.com/0xProject/0x-monorepo/blob/9fe6c196a/packages/types/src/index.ts#L492)*

<hr />

# Interface: PaginatedCollection <**T**>

## Type parameters

▪ **T**


##   Properties

###  page

• **page**: *number*

*Defined in [types/src/index.ts:459](https://github.com/0xProject/0x-monorepo/blob/9fe6c196a/packages/types/src/index.ts#L459)*

___

###  perPage

• **perPage**: *number*

*Defined in [types/src/index.ts:460](https://github.com/0xProject/0x-monorepo/blob/9fe6c196a/packages/types/src/index.ts#L460)*

___

###  records

• **records**: *`T`[]*

*Defined in [types/src/index.ts:461](https://github.com/0xProject/0x-monorepo/blob/9fe6c196a/packages/types/src/index.ts#L461)*

___

###  total

• **total**: *number*

*Defined in [types/src/index.ts:458](https://github.com/0xProject/0x-monorepo/blob/9fe6c196a/packages/types/src/index.ts#L458)*

<hr />





# Interface: RequestOpts


##   Properties

### `Optional` networkId

• **networkId**? : *undefined | number*

*Defined in [types/src/index.ts:487](https://github.com/0xProject/0x-monorepo/blob/9fe6c196a/packages/types/src/index.ts#L487)*

<hr />

# Interface: SignedOrder


##   Properties

###  chainId

• **chainId**: *number*

*Inherited from [Order](#interface-order).[chainId](#chainid)*

*Defined in [types/src/index.ts:14](https://github.com/0xProject/0x-monorepo/blob/9fe6c196a/packages/types/src/index.ts#L14)*

___

###  exchangeAddress

• **exchangeAddress**: *string*

*Inherited from [Order](#interface-order).[exchangeAddress](#exchangeaddress)*

*Defined in [types/src/index.ts:15](https://github.com/0xProject/0x-monorepo/blob/9fe6c196a/packages/types/src/index.ts#L15)*

___

###  expirationTimeSeconds

• **expirationTimeSeconds**: *`BigNumber`*

*Inherited from [Order](#interface-order).[expirationTimeSeconds](#expirationtimeseconds)*

*Defined in [types/src/index.ts:24](https://github.com/0xProject/0x-monorepo/blob/9fe6c196a/packages/types/src/index.ts#L24)*

___

###  feeRecipientAddress

• **feeRecipientAddress**: *string*

*Inherited from [Order](#interface-order).[feeRecipientAddress](#feerecipientaddress)*

*Defined in [types/src/index.ts:18](https://github.com/0xProject/0x-monorepo/blob/9fe6c196a/packages/types/src/index.ts#L18)*

___

###  makerAddress

• **makerAddress**: *string*

*Inherited from [Order](#interface-order).[makerAddress](#makeraddress)*

*Defined in [types/src/index.ts:16](https://github.com/0xProject/0x-monorepo/blob/9fe6c196a/packages/types/src/index.ts#L16)*

___

###  makerAssetAmount

• **makerAssetAmount**: *`BigNumber`*

*Inherited from [Order](#interface-order).[makerAssetAmount](#makerassetamount)*

*Defined in [types/src/index.ts:20](https://github.com/0xProject/0x-monorepo/blob/9fe6c196a/packages/types/src/index.ts#L20)*

___

###  makerAssetData

• **makerAssetData**: *string*

*Inherited from [Order](#interface-order).[makerAssetData](#makerassetdata)*

*Defined in [types/src/index.ts:26](https://github.com/0xProject/0x-monorepo/blob/9fe6c196a/packages/types/src/index.ts#L26)*

___

###  makerFee

• **makerFee**: *`BigNumber`*

*Inherited from [Order](#interface-order).[makerFee](#makerfee)*

*Defined in [types/src/index.ts:22](https://github.com/0xProject/0x-monorepo/blob/9fe6c196a/packages/types/src/index.ts#L22)*

___

###  makerFeeAssetData

• **makerFeeAssetData**: *string*

*Inherited from [Order](#interface-order).[makerFeeAssetData](#makerfeeassetdata)*

*Defined in [types/src/index.ts:28](https://github.com/0xProject/0x-monorepo/blob/9fe6c196a/packages/types/src/index.ts#L28)*

___

###  salt

• **salt**: *`BigNumber`*

*Inherited from [Order](#interface-order).[salt](#salt)*

*Defined in [types/src/index.ts:25](https://github.com/0xProject/0x-monorepo/blob/9fe6c196a/packages/types/src/index.ts#L25)*

___

###  senderAddress

• **senderAddress**: *string*

*Inherited from [Order](#interface-order).[senderAddress](#senderaddress)*

*Defined in [types/src/index.ts:19](https://github.com/0xProject/0x-monorepo/blob/9fe6c196a/packages/types/src/index.ts#L19)*

___

###  signature

• **signature**: *string*

*Defined in [types/src/index.ts:33](https://github.com/0xProject/0x-monorepo/blob/9fe6c196a/packages/types/src/index.ts#L33)*

___

###  takerAddress

• **takerAddress**: *string*

*Inherited from [Order](#interface-order).[takerAddress](#takeraddress)*

*Defined in [types/src/index.ts:17](https://github.com/0xProject/0x-monorepo/blob/9fe6c196a/packages/types/src/index.ts#L17)*

___

###  takerAssetAmount

• **takerAssetAmount**: *`BigNumber`*

*Inherited from [Order](#interface-order).[takerAssetAmount](#takerassetamount)*

*Defined in [types/src/index.ts:21](https://github.com/0xProject/0x-monorepo/blob/9fe6c196a/packages/types/src/index.ts#L21)*

___

###  takerAssetData

• **takerAssetData**: *string*

*Inherited from [Order](#interface-order).[takerAssetData](#takerassetdata)*

*Defined in [types/src/index.ts:27](https://github.com/0xProject/0x-monorepo/blob/9fe6c196a/packages/types/src/index.ts#L27)*

___

###  takerFee

• **takerFee**: *`BigNumber`*

*Inherited from [Order](#interface-order).[takerFee](#takerfee)*

*Defined in [types/src/index.ts:23](https://github.com/0xProject/0x-monorepo/blob/9fe6c196a/packages/types/src/index.ts#L23)*

___

###  takerFeeAssetData

• **takerFeeAssetData**: *string*

*Inherited from [Order](#interface-order).[takerFeeAssetData](#takerfeeassetdata)*

*Defined in [types/src/index.ts:29](https://github.com/0xProject/0x-monorepo/blob/9fe6c196a/packages/types/src/index.ts#L29)*

<hr />

















































<hr /> 




##  Object literals

### `Const` ordersChannelFactory

#### ▪ **ordersChannelFactory**: *object*

*Defined in [connect/src/orders_channel_factory.ts:7](https://github.com/0xProject/0x-monorepo/blob/9fe6c196a/packages/connect/src/orders_channel_factory.ts#L7)*

####  createWebSocketOrdersChannelAsync

▸ **createWebSocketOrdersChannelAsync**(`url`: string, `handler`: [OrdersChannelHandler](#interface-orderschannelhandler)): *`Promise<OrdersChannel>`*

*Defined in [connect/src/orders_channel_factory.ts:15](https://github.com/0xProject/0x-monorepo/blob/9fe6c196a/packages/connect/src/orders_channel_factory.ts#L15)*

Instantiates a new WebSocketOrdersChannel instance

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`url` | string | The relayer API base WS url you would like to interact with |
`handler` | [OrdersChannelHandler](#interface-orderschannelhandler) | An OrdersChannelHandler instance that responds to various                               channel updates |

**Returns:** *`Promise<OrdersChannel>`*

An OrdersChannel Promise

<hr />



<hr /> 




##  Type aliases





###  AssetPairsResponse

Ƭ **AssetPairsResponse**: *[PaginatedCollection](#interface-paginatedcollection)‹*[AssetPairsItem](#interface-assetpairsitem)*›*

*Defined in [types/src/index.ts:416](https://github.com/0xProject/0x-monorepo/blob/9fe6c196a/packages/types/src/index.ts#L416)*

___







###  FeeRecipientsResponse

Ƭ **FeeRecipientsResponse**: *[PaginatedCollection](#interface-paginatedcollection)‹*string*›*

*Defined in [types/src/index.ts:484](https://github.com/0xProject/0x-monorepo/blob/9fe6c196a/packages/types/src/index.ts#L484)*

___





###  OrdersResponse

Ƭ **OrdersResponse**: *[PaginatedCollection](#interface-paginatedcollection)‹*[APIOrder](#interface-apiorder)*›*

*Defined in [types/src/index.ts:404](https://github.com/0xProject/0x-monorepo/blob/9fe6c196a/packages/types/src/index.ts#L404)*

___



