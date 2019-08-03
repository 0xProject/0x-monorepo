> # Class: RevertTraceSubprovider

This class implements the [web3-provider-engine](https://github.com/MetaMask/provider-engine) subprovider interface.
It is used to report call stack traces whenever a revert occurs.

## Hierarchy

* `TraceCollectionSubprovider`

  * **RevertTraceSubprovider**

## Index

### Constructors

* [constructor](#constructor)

### Methods

* [emitPayloadAsync](#emitpayloadasync)
* [handleRequest](#handlerequest)
* [setEngine](#setengine)
* [start](#start)
* [stop](#stop)

## Constructors

###  constructor

\+ **new RevertTraceSubprovider**(`artifactAdapter`: `AbstractArtifactAdapter`, `defaultFromAddress`: string, `isVerbose`: boolean): *[RevertTraceSubprovider](#class-reverttracesubprovider)*

*Overrides void*

*Defined in [revert_trace_subprovider.ts:27](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/sol-trace/src/revert_trace_subprovider.ts#L27)*

Instantiates a RevertTraceSubprovider instance

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`artifactAdapter` | `AbstractArtifactAdapter` | - | Adapter for used artifacts format (0x, truffle, giveth, etc.) |
`defaultFromAddress` | string | - | default from address to use when sending transactions |
`isVerbose` | boolean | true | If true, we will log any unknown transactions. Otherwise we will ignore them  |

**Returns:** *[RevertTraceSubprovider](#class-reverttracesubprovider)*

## Methods

###  emitPayloadAsync

▸ **emitPayloadAsync**(`payload`: `Partial<JSONRPCRequestPayloadWithMethod>`): *`Promise<JSONRPCResponsePayload>`*

*Inherited from void*

Defined in /Users/rickmorty/Documents/projects/0x/0x-monorepo/packages/subproviders/lib/src/subproviders/subprovider.d.ts:25

Emits a JSON RPC payload that will then be handled by the ProviderEngine instance
this subprovider is a part of. The payload will cascade down the subprovider middleware
stack until finding the responsible entity for handling the request.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`payload` | `Partial<JSONRPCRequestPayloadWithMethod>` | JSON RPC payload |

**Returns:** *`Promise<JSONRPCResponsePayload>`*

JSON RPC response payload

___

###  handleRequest

▸ **handleRequest**(`payload`: `JSONRPCRequestPayload`, `next`: `NextCallback`, `_end`: `ErrorCallback`): *`Promise<void>`*

*Inherited from void*

*Overrides void*

Defined in /Users/rickmorty/Documents/projects/0x/0x-monorepo/packages/sol-tracing-utils/lib/src/trace_collection_subprovider.d.ts:42

This method conforms to the web3-provider-engine interface.
It is called internally by the ProviderEngine when it is this subproviders
turn to handle a JSON RPC request.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`payload` | `JSONRPCRequestPayload` | JSON RPC payload |
`next` | `NextCallback` | Callback to call if this subprovider decides not to handle the request |
`_end` | `ErrorCallback` | Callback to call if subprovider handled the request and wants to pass back the request.  |

**Returns:** *`Promise<void>`*

___

###  setEngine

▸ **setEngine**(`engine`: `Web3ProviderEngine`): *void*

*Inherited from void*

*Overrides void*

Defined in /Users/rickmorty/Documents/projects/0x/0x-monorepo/packages/sol-tracing-utils/lib/src/trace_collection_subprovider.d.ts:49

Set's the subprovider's engine to the ProviderEngine it is added to.
This is only called within the ProviderEngine source code, do not call
directly.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`engine` | `Web3ProviderEngine` | The ProviderEngine this subprovider is added to  |

**Returns:** *void*

___

###  start

▸ **start**(): *void*

*Inherited from void*

Defined in /Users/rickmorty/Documents/projects/0x/0x-monorepo/packages/sol-tracing-utils/lib/src/trace_collection_subprovider.d.ts:29

Starts trace collection

**Returns:** *void*

___

###  stop

▸ **stop**(): *void*

*Inherited from void*

Defined in /Users/rickmorty/Documents/projects/0x/0x-monorepo/packages/sol-tracing-utils/lib/src/trace_collection_subprovider.d.ts:33

Stops trace collection

**Returns:** *void*

<hr />

* [Globals](globals.md)
* [External Modules]()
  * [index](modules/_index_.md)
  * [revert_trace_subprovider](modules/_revert_trace_subprovider_.md)
  * [revert_trace_subprovider.RevertTraceSubprovider](#class-reverttracesubprovider)
* [Classes]()
  * [revert_trace_subprovider.RevertTraceSubprovider](#class-reverttracesubprovider)

<hr />

