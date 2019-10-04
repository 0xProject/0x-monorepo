> # Class: WSClient

This class includes all the functionality related to interacting with a Mesh JSON RPC
websocket endpoint.

## Hierarchy

* **WSClient**

## Index

### Constructors

* [constructor](#constructor)

### Methods

* [addOrdersAsync](#addordersasync)
* [destroy](#destroy)
* [getOrdersAsync](#getordersasync)
* [getStatsAsync](#getstatsasync)
* [onClose](#onclose)
* [onReconnected](#onreconnected)
* [subscribeToOrdersAsync](#subscribetoordersasync)
* [unsubscribeAsync](#unsubscribeasync)

## Constructors

###  constructor

\+ **new WSClient**(`url`: string, `wsOpts?`: [WSOpts](#interface-wsopts)): *[WSClient](#class-wsclient)*

*Defined in [ws_client.ts:71](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/ws_client.ts#L71)*

Instantiates a new WSClient instance

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`url` | string | WS server endpoint |
`wsOpts?` | [WSOpts](#interface-wsopts) | WebSocket options |

**Returns:** *[WSClient](#class-wsclient)*

An instance of WSClient

## Methods

###  addOrdersAsync

▸ **addOrdersAsync**(`signedOrders`: `SignedOrder`[]): *`Promise<ValidationResults>`*

*Defined in [ws_client.ts:96](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/ws_client.ts#L96)*

Adds an array of 0x signed orders to the Mesh node.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`signedOrders` | `SignedOrder`[] | signedOrders to add |

**Returns:** *`Promise<ValidationResults>`*

validation results

___

###  destroy

▸ **destroy**(): *void*

*Defined in [ws_client.ts:213](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/ws_client.ts#L213)*

destroy unsubscribes all active subscriptions, closes the websocket connection
and stops the internal heartbeat connection liveness check.

**Returns:** *void*

___

###  getOrdersAsync

▸ **getOrdersAsync**(`perPage`: number): *`Promise<OrderInfo[]>`*

*Defined in [ws_client.ts:125](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/ws_client.ts#L125)*

Get all 0x signed orders currently stored in the Mesh node

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`perPage` | number | 200 | number of signedOrders to fetch per paginated request |

**Returns:** *`Promise<OrderInfo[]>`*

all orders, their hash and their fillableTakerAssetAmount

___

###  getStatsAsync

▸ **getStatsAsync**(): *`Promise<GetStatsResponse>`*

*Defined in [ws_client.ts:116](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/ws_client.ts#L116)*

**Returns:** *`Promise<GetStatsResponse>`*

___

###  onClose

▸ **onClose**(`cb`: function): *void*

*Defined in [ws_client.ts:195](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/ws_client.ts#L195)*

Get notified when the underlying WS connection closes normally. If it closes with an
error, WSClient automatically attempts to re-connect without emitting a `close` event.

**Parameters:**

▪ **cb**: *function*

callback to call when WS connection closes

▸ (): *void*

**Returns:** *void*

___

###  onReconnected

▸ **onReconnected**(`cb`: function): *void*

*Defined in [ws_client.ts:204](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/ws_client.ts#L204)*

Get notified when a connection to the underlying WS connection is re-established

**Parameters:**

▪ **cb**: *function*

callback to call with the error when it occurs

▸ (): *void*

**Returns:** *void*

___

###  subscribeToOrdersAsync

▸ **subscribeToOrdersAsync**(`cb`: function): *`Promise<string>`*

*Defined in [ws_client.ts:156](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/ws_client.ts#L156)*

Subscribe to the 'orders' topic and receive order events from Mesh. This method returns a
subscriptionId that can be used to `unsubscribe()` from this subscription.

**Parameters:**

▪ **cb**: *function*

callback function where you'd like to get notified about order events

▸ (`orderEvents`: [OrderEvent](#interface-orderevent)[]): *void*

**Parameters:**

Name | Type |
------ | ------ |
`orderEvents` | [OrderEvent](#interface-orderevent)[] |

**Returns:** *`Promise<string>`*

subscriptionId

___

###  unsubscribeAsync

▸ **unsubscribeAsync**(`subscriptionId`: string): *`Promise<void>`*

*Defined in [ws_client.ts:185](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/ws_client.ts#L185)*

Unsubscribe from a subscription

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`subscriptionId` | string | identifier of the subscription to cancel  |

**Returns:** *`Promise<void>`*

<hr />

> # Enumeration: OrderEventKind

## Index

### Enumeration members

* [Added](#added)
* [Cancelled](#cancelled)
* [Expired](#expired)
* [FillabilityIncreased](#fillabilityincreased)
* [Filled](#filled)
* [FullyFilled](#fullyfilled)
* [Invalid](#invalid)
* [Unfunded](#unfunded)

## Enumeration members

###  Added

• **Added**: = "ADDED"

*Defined in [types.ts:55](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L55)*

___

###  Cancelled

• **Cancelled**: = "CANCELLED"

*Defined in [types.ts:58](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L58)*

___

###  Expired

• **Expired**: = "EXPIRED"

*Defined in [types.ts:59](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L59)*

___

###  FillabilityIncreased

• **FillabilityIncreased**: = "FILLABILITY_INCREASED"

*Defined in [types.ts:61](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L61)*

___

###  Filled

• **Filled**: = "FILLED"

*Defined in [types.ts:56](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L56)*

___

###  FullyFilled

• **FullyFilled**: = "FULLY_FILLED"

*Defined in [types.ts:57](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L57)*

___

###  Invalid

• **Invalid**: = "INVALID"

*Defined in [types.ts:54](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L54)*

___

###  Unfunded

• **Unfunded**: = "UNFUNDED"

*Defined in [types.ts:60](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L60)*

<hr />

> # Enumeration: RejectedCode

## Index

### Enumeration members

* [InternalError](#internalerror)
* [MaxOrderSizeExceeded](#maxordersizeexceeded)
* [NetworkRequestFailed](#networkrequestfailed)
* [OrderAlreadyStored](#orderalreadystored)
* [OrderCancelled](#ordercancelled)
* [OrderExpired](#orderexpired)
* [OrderForIncorrectNetwork](#orderforincorrectnetwork)
* [OrderFullyFilled](#orderfullyfilled)
* [OrderHasInvalidMakerAssetAmount](#orderhasinvalidmakerassetamount)
* [OrderHasInvalidMakerAssetData](#orderhasinvalidmakerassetdata)
* [OrderHasInvalidSignature](#orderhasinvalidsignature)
* [OrderHasInvalidTakerAssetAmount](#orderhasinvalidtakerassetamount)
* [OrderHasInvalidTakerAssetData](#orderhasinvalidtakerassetdata)
* [OrderUnfunded](#orderunfunded)

## Enumeration members

###  InternalError

• **InternalError**: = "InternalError"

*Defined in [types.ts:123](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L123)*

___

###  MaxOrderSizeExceeded

• **MaxOrderSizeExceeded**: = "MaxOrderSizeExceeded"

*Defined in [types.ts:124](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L124)*

___

###  NetworkRequestFailed

• **NetworkRequestFailed**: = "NetworkRequestFailed"

*Defined in [types.ts:127](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L127)*

___

###  OrderAlreadyStored

• **OrderAlreadyStored**: = "OrderAlreadyStored"

*Defined in [types.ts:125](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L125)*

___

###  OrderCancelled

• **OrderCancelled**: = "OrderCancelled"

*Defined in [types.ts:132](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L132)*

___

###  OrderExpired

• **OrderExpired**: = "OrderExpired"

*Defined in [types.ts:130](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L130)*

___

###  OrderForIncorrectNetwork

• **OrderForIncorrectNetwork**: = "OrderForIncorrectNetwork"

*Defined in [types.ts:126](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L126)*

___

###  OrderFullyFilled

• **OrderFullyFilled**: = "OrderFullyFilled"

*Defined in [types.ts:131](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L131)*

___

###  OrderHasInvalidMakerAssetAmount

• **OrderHasInvalidMakerAssetAmount**: = "OrderHasInvalidMakerAssetAmount"

*Defined in [types.ts:128](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L128)*

___

###  OrderHasInvalidMakerAssetData

• **OrderHasInvalidMakerAssetData**: = "OrderHasInvalidMakerAssetData"

*Defined in [types.ts:134](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L134)*

___

###  OrderHasInvalidSignature

• **OrderHasInvalidSignature**: = "OrderHasInvalidSignature"

*Defined in [types.ts:136](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L136)*

___

###  OrderHasInvalidTakerAssetAmount

• **OrderHasInvalidTakerAssetAmount**: = "OrderHasInvalidTakerAssetAmount"

*Defined in [types.ts:129](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L129)*

___

###  OrderHasInvalidTakerAssetData

• **OrderHasInvalidTakerAssetData**: = "OrderHasInvalidTakerAssetData"

*Defined in [types.ts:135](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L135)*

___

###  OrderUnfunded

• **OrderUnfunded**: = "OrderUnfunded"

*Defined in [types.ts:133](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L133)*

<hr />

> # Enumeration: RejectedKind

## Index

### Enumeration members

* [MeshError](#mesherror)
* [MeshValidation](#meshvalidation)
* [ZeroexValidation](#zeroexvalidation)

## Enumeration members

###  MeshError

• **MeshError**: = "MESH_ERROR"

*Defined in [types.ts:118](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L118)*

___

###  MeshValidation

• **MeshValidation**: = "MESH_VALIDATION"

*Defined in [types.ts:119](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L119)*

___

###  ZeroexValidation

• **ZeroexValidation**: = "ZEROEX_VALIDATION"

*Defined in [types.ts:117](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L117)*

<hr />

> # Interface: AcceptedOrderInfo

## Hierarchy

* **AcceptedOrderInfo**

## Index

### Properties

* [fillableTakerAssetAmount](#fillabletakerassetamount)
* [isNew](#isnew)
* [orderHash](#orderhash)
* [signedOrder](#signedorder)

## Properties

###  fillableTakerAssetAmount

• **fillableTakerAssetAmount**: *`BigNumber`*

*Defined in [types.ts:100](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L100)*

___

###  isNew

• **isNew**: *boolean*

*Defined in [types.ts:101](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L101)*

___

###  orderHash

• **orderHash**: *string*

*Defined in [types.ts:98](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L98)*

___

###  signedOrder

• **signedOrder**: *`SignedOrder`*

*Defined in [types.ts:99](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L99)*

<hr />

> # Interface: ClientConfig

WebSocketClient configs
Source: https://github.com/theturtle32/WebSocket-Node/blob/master/docs/WebSocketClient.md#client-config-options

## Hierarchy

* **ClientConfig**

## Index

### Properties

* [assembleFragments](#optional-assemblefragments)
* [closeTimeout](#optional-closetimeout)
* [fragmentOutgoingMessages](#optional-fragmentoutgoingmessages)
* [fragmentationThreshold](#optional-fragmentationthreshold)
* [maxReceivedFrameSize](#optional-maxreceivedframesize)
* [maxReceivedMessageSize](#optional-maxreceivedmessagesize)
* [tlsOptions](#optional-tlsoptions)
* [webSocketVersion](#optional-websocketversion)

## Properties

### `Optional` assembleFragments

• **assembleFragments**? : *undefined | false | true*

*Defined in [types.ts:14](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L14)*

___

### `Optional` closeTimeout

• **closeTimeout**? : *undefined | number*

*Defined in [types.ts:15](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L15)*

___

### `Optional` fragmentOutgoingMessages

• **fragmentOutgoingMessages**? : *undefined | false | true*

*Defined in [types.ts:12](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L12)*

___

### `Optional` fragmentationThreshold

• **fragmentationThreshold**? : *undefined | number*

*Defined in [types.ts:13](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L13)*

___

### `Optional` maxReceivedFrameSize

• **maxReceivedFrameSize**? : *undefined | number*

*Defined in [types.ts:10](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L10)*

___

### `Optional` maxReceivedMessageSize

• **maxReceivedMessageSize**? : *undefined | number*

*Defined in [types.ts:11](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L11)*

___

### `Optional` tlsOptions

• **tlsOptions**? : *any*

*Defined in [types.ts:16](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L16)*

___

### `Optional` webSocketVersion

• **webSocketVersion**? : *undefined | number*

*Defined in [types.ts:9](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L9)*

<hr />

> # Interface: GetOrdersResponse

## Hierarchy

* **GetOrdersResponse**

## Index

### Properties

* [ordersInfos](#ordersinfos)
* [snapshotID](#snapshotid)

## Properties

###  ordersInfos

• **ordersInfos**: *[RawAcceptedOrderInfo](#interface-rawacceptedorderinfo)[]*

*Defined in [types.ts:170](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L170)*

___

###  snapshotID

• **snapshotID**: *string*

*Defined in [types.ts:169](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L169)*

<hr />

> # Interface: GetStatsResponse

## Hierarchy

* **GetStatsResponse**

## Index

### Properties

* [EthereumNetworkID](#ethereumnetworkid)
* [LatestBlock](#latestblock)
* [NumOrders](#numorders)
* [NumPeers](#numpeers)
* [PeerID](#peerid)
* [PubSubTopic](#pubsubtopic)
* [Rendezvous](#rendezvous)
* [Version](#version)

## Properties

###  EthereumNetworkID

• **EthereumNetworkID**: *number*

*Defined in [types.ts:188](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L188)*

___

###  LatestBlock

• **LatestBlock**: *[LatestBlock](#interface-latestblock)*

*Defined in [types.ts:189](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L189)*

___

###  NumOrders

• **NumOrders**: *number*

*Defined in [types.ts:191](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L191)*

___

###  NumPeers

• **NumPeers**: *number*

*Defined in [types.ts:190](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L190)*

___

###  PeerID

• **PeerID**: *string*

*Defined in [types.ts:187](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L187)*

___

###  PubSubTopic

• **PubSubTopic**: *string*

*Defined in [types.ts:185](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L185)*

___

###  Rendezvous

• **Rendezvous**: *string*

*Defined in [types.ts:186](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L186)*

___

###  Version

• **Version**: *string*

*Defined in [types.ts:184](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L184)*

<hr />

> # Interface: HeartbeatEventPayload

## Hierarchy

* **HeartbeatEventPayload**

## Index

### Properties

* [result](#result)
* [subscription](#subscription)

## Properties

###  result

• **result**: *string*

*Defined in [types.ts:71](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L71)*

___

###  subscription

• **subscription**: *string*

*Defined in [types.ts:70](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L70)*

<hr />

> # Interface: LatestBlock

## Hierarchy

* **LatestBlock**

## Index

### Properties

* [hash](#hash)
* [number](#number)

## Properties

###  hash

• **hash**: *string*

*Defined in [types.ts:180](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L180)*

___

###  number

• **number**: *number*

*Defined in [types.ts:179](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L179)*

<hr />

> # Interface: OrderEvent

## Hierarchy

* **OrderEvent**

## Index

### Properties

* [fillableTakerAssetAmount](#fillabletakerassetamount)
* [kind](#kind)
* [orderHash](#orderhash)
* [signedOrder](#signedorder)
* [txHashes](#txhashes)

## Properties

###  fillableTakerAssetAmount

• **fillableTakerAssetAmount**: *`BigNumber`*

*Defined in [types.ts:86](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L86)*

___

###  kind

• **kind**: *[OrderEventKind](#enumeration-ordereventkind)*

*Defined in [types.ts:85](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L85)*

___

###  orderHash

• **orderHash**: *string*

*Defined in [types.ts:83](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L83)*

___

###  signedOrder

• **signedOrder**: *`SignedOrder`*

*Defined in [types.ts:84](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L84)*

___

###  txHashes

• **txHashes**: *string[]*

*Defined in [types.ts:87](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L87)*

<hr />

> # Interface: OrderEventPayload

## Hierarchy

* **OrderEventPayload**

## Index

### Properties

* [result](#result)
* [subscription](#subscription)

## Properties

###  result

• **result**: *[RawOrderEvent](#interface-raworderevent)[]*

*Defined in [types.ts:66](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L66)*

___

###  subscription

• **subscription**: *string*

*Defined in [types.ts:65](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L65)*

<hr />

> # Interface: OrderInfo

## Hierarchy

* **OrderInfo**

## Index

### Properties

* [fillableTakerAssetAmount](#fillabletakerassetamount)
* [orderHash](#orderhash)
* [signedOrder](#signedorder)

## Properties

###  fillableTakerAssetAmount

• **fillableTakerAssetAmount**: *`BigNumber`*

*Defined in [types.ts:113](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L113)*

___

###  orderHash

• **orderHash**: *string*

*Defined in [types.ts:111](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L111)*

___

###  signedOrder

• **signedOrder**: *`SignedOrder`*

*Defined in [types.ts:112](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L112)*

<hr />

> # Interface: RawAcceptedOrderInfo

## Hierarchy

* **RawAcceptedOrderInfo**

## Index

### Properties

* [fillableTakerAssetAmount](#fillabletakerassetamount)
* [isNew](#isnew)
* [orderHash](#orderhash)
* [signedOrder](#signedorder)

## Properties

###  fillableTakerAssetAmount

• **fillableTakerAssetAmount**: *string*

*Defined in [types.ts:93](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L93)*

___

###  isNew

• **isNew**: *boolean*

*Defined in [types.ts:94](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L94)*

___

###  orderHash

• **orderHash**: *string*

*Defined in [types.ts:91](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L91)*

___

###  signedOrder

• **signedOrder**: *[StringifiedSignedOrder](#interface-stringifiedsignedorder)*

*Defined in [types.ts:92](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L92)*

<hr />

> # Interface: RawOrderEvent

## Hierarchy

* **RawOrderEvent**

## Index

### Properties

* [fillableTakerAssetAmount](#fillabletakerassetamount)
* [kind](#kind)
* [orderHash](#orderhash)
* [signedOrder](#signedorder)
* [txHashes](#txhashes)

## Properties

###  fillableTakerAssetAmount

• **fillableTakerAssetAmount**: *string*

*Defined in [types.ts:78](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L78)*

___

###  kind

• **kind**: *[OrderEventKind](#enumeration-ordereventkind)*

*Defined in [types.ts:77](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L77)*

___

###  orderHash

• **orderHash**: *string*

*Defined in [types.ts:75](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L75)*

___

###  signedOrder

• **signedOrder**: *[StringifiedSignedOrder](#interface-stringifiedsignedorder)*

*Defined in [types.ts:76](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L76)*

___

###  txHashes

• **txHashes**: *string[]*

*Defined in [types.ts:79](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L79)*

<hr />

> # Interface: RawOrderInfo

## Hierarchy

* **RawOrderInfo**

## Index

### Properties

* [fillableTakerAssetAmount](#fillabletakerassetamount)
* [orderHash](#orderhash)
* [signedOrder](#signedorder)

## Properties

###  fillableTakerAssetAmount

• **fillableTakerAssetAmount**: *string*

*Defined in [types.ts:107](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L107)*

___

###  orderHash

• **orderHash**: *string*

*Defined in [types.ts:105](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L105)*

___

###  signedOrder

• **signedOrder**: *[StringifiedSignedOrder](#interface-stringifiedsignedorder)*

*Defined in [types.ts:106](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L106)*

<hr />

> # Interface: RawRejectedOrderInfo

## Hierarchy

* **RawRejectedOrderInfo**

## Index

### Properties

* [kind](#kind)
* [orderHash](#orderhash)
* [signedOrder](#signedorder)
* [status](#status)

## Properties

###  kind

• **kind**: *[RejectedKind](#enumeration-rejectedkind)*

*Defined in [types.ts:147](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L147)*

___

###  orderHash

• **orderHash**: *string*

*Defined in [types.ts:145](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L145)*

___

###  signedOrder

• **signedOrder**: *[StringifiedSignedOrder](#interface-stringifiedsignedorder)*

*Defined in [types.ts:146](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L146)*

___

###  status

• **status**: *[RejectedStatus](#interface-rejectedstatus)*

*Defined in [types.ts:148](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L148)*

<hr />

> # Interface: RawValidationResults

## Hierarchy

* **RawValidationResults**

## Index

### Properties

* [accepted](#accepted)
* [rejected](#rejected)

## Properties

###  accepted

• **accepted**: *[RawAcceptedOrderInfo](#interface-rawacceptedorderinfo)[]*

*Defined in [types.ts:159](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L159)*

___

###  rejected

• **rejected**: *[RawRejectedOrderInfo](#interface-rawrejectedorderinfo)[]*

*Defined in [types.ts:160](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L160)*

<hr />

> # Interface: RejectedOrderInfo

## Hierarchy

* **RejectedOrderInfo**

## Index

### Properties

* [kind](#kind)
* [orderHash](#orderhash)
* [signedOrder](#signedorder)
* [status](#status)

## Properties

###  kind

• **kind**: *[RejectedKind](#enumeration-rejectedkind)*

*Defined in [types.ts:154](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L154)*

___

###  orderHash

• **orderHash**: *string*

*Defined in [types.ts:152](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L152)*

___

###  signedOrder

• **signedOrder**: *`SignedOrder`*

*Defined in [types.ts:153](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L153)*

___

###  status

• **status**: *[RejectedStatus](#interface-rejectedstatus)*

*Defined in [types.ts:155](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L155)*

<hr />

> # Interface: RejectedStatus

## Hierarchy

* **RejectedStatus**

## Index

### Properties

* [code](#code)
* [message](#message)

## Properties

###  code

• **code**: *[RejectedCode](#enumeration-rejectedcode)*

*Defined in [types.ts:140](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L140)*

___

###  message

• **message**: *string*

*Defined in [types.ts:141](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L141)*

<hr />

> # Interface: StringifiedSignedOrder

## Hierarchy

* **StringifiedSignedOrder**

## Index

### Properties

* [exchangeAddress](#exchangeaddress)
* [expirationTimeSeconds](#expirationtimeseconds)
* [feeRecipientAddress](#feerecipientaddress)
* [makerAddress](#makeraddress)
* [makerAssetAmount](#makerassetamount)
* [makerAssetData](#makerassetdata)
* [makerFee](#makerfee)
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

*Defined in [types.ts:47](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L47)*

___

###  expirationTimeSeconds

• **expirationTimeSeconds**: *string*

*Defined in [types.ts:49](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L49)*

___

###  feeRecipientAddress

• **feeRecipientAddress**: *string*

*Defined in [types.ts:48](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L48)*

___

###  makerAddress

• **makerAddress**: *string*

*Defined in [types.ts:38](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L38)*

___

###  makerAssetAmount

• **makerAssetAmount**: *string*

*Defined in [types.ts:42](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L42)*

___

###  makerAssetData

• **makerAssetData**: *string*

*Defined in [types.ts:44](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L44)*

___

###  makerFee

• **makerFee**: *string*

*Defined in [types.ts:40](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L40)*

___

###  salt

• **salt**: *string*

*Defined in [types.ts:46](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L46)*

___

###  senderAddress

• **senderAddress**: *string*

*Defined in [types.ts:37](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L37)*

___

###  signature

• **signature**: *string*

*Defined in [types.ts:50](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L50)*

___

###  takerAddress

• **takerAddress**: *string*

*Defined in [types.ts:39](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L39)*

___

###  takerAssetAmount

• **takerAssetAmount**: *string*

*Defined in [types.ts:43](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L43)*

___

###  takerAssetData

• **takerAssetData**: *string*

*Defined in [types.ts:45](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L45)*

___

###  takerFee

• **takerFee**: *string*

*Defined in [types.ts:41](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L41)*

<hr />

> # Interface: ValidationResults

## Hierarchy

* **ValidationResults**

## Index

### Properties

* [accepted](#accepted)
* [rejected](#rejected)

## Properties

###  accepted

• **accepted**: *[AcceptedOrderInfo](#interface-acceptedorderinfo)[]*

*Defined in [types.ts:164](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L164)*

___

###  rejected

• **rejected**: *[RejectedOrderInfo](#interface-rejectedorderinfo)[]*

*Defined in [types.ts:165](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L165)*

<hr />

> # Interface: WSMessage

## Hierarchy

* **WSMessage**

## Index

### Properties

* [type](#type)
* [utf8Data](#utf8data)

## Properties

###  type

• **type**: *string*

*Defined in [types.ts:174](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L174)*

___

###  utf8Data

• **utf8Data**: *string*

*Defined in [types.ts:175](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L175)*

<hr />

> # Interface: WSOpts

timeout: timeout in milliseconds to enforce on every WS request that expects a response
headers: Request headers (e.g., authorization)
protocol: requestOptions should be either null or an object specifying additional configuration options to be
passed to http.request or https.request. This can be used to pass a custom agent to enable WebSocketClient usage
from behind an HTTP or HTTPS proxy server using koichik/node-tunnel or similar.
clientConfig: The client configs documented here: https://github.com/theturtle32/WebSocket-Node/blob/master/docs/WebSocketClient.md
reconnectAfter: time in milliseconds after which to attempt to reconnect to WS server after an error occurred (default: 5000)

## Hierarchy

* **WSOpts**

## Index

### Properties

* [clientConfig](#optional-clientconfig)
* [headers](#optional-headers)
* [protocol](#optional-protocol)
* [reconnectAfter](#optional-reconnectafter)
* [timeout](#optional-timeout)

## Properties

### `Optional` clientConfig

• **clientConfig**? : *[ClientConfig](#interface-clientconfig)*

*Defined in [types.ts:32](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L32)*

___

### `Optional` headers

• **headers**? : *undefined | `__type`*

*Defined in [types.ts:30](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L30)*

___

### `Optional` protocol

• **protocol**? : *undefined | string*

*Defined in [types.ts:31](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L31)*

___

### `Optional` reconnectAfter

• **reconnectAfter**? : *undefined | number*

*Defined in [types.ts:33](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L33)*

___

### `Optional` timeout

• **timeout**? : *undefined | number*

*Defined in [types.ts:29](https://github.com/0xProject/0x-mesh/blob/3c0943a/rpc/clients/typescript/src/types.ts#L29)*

<hr />

