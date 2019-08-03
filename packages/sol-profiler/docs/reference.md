> # Class: ProfilerSubprovider

This class implements the [web3-provider-engine](https://github.com/MetaMask/provider-engine) subprovider interface.
ProfilerSubprovider is used to profile Solidity code while running tests.

## Hierarchy

* `TraceInfoSubprovider`

  * **ProfilerSubprovider**

## Index

### Constructors

* [constructor](#constructor)

### Methods

* [emitPayloadAsync](#emitpayloadasync)
* [handleRequest](#handlerequest)
* [setEngine](#setengine)
* [start](#start)
* [stop](#stop)
* [writeProfilerOutputAsync](#writeprofileroutputasync)

## Constructors

###  constructor

\+ **new ProfilerSubprovider**(`artifactAdapter`: `AbstractArtifactAdapter`, `defaultFromAddress`: string, `isVerbose`: boolean): *[ProfilerSubprovider](#class-profilersubprovider)*

*Overrides void*

*Defined in [profiler_subprovider.ts:30](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/sol-profiler/src/profiler_subprovider.ts#L30)*

Instantiates a ProfilerSubprovider instance

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`artifactAdapter` | `AbstractArtifactAdapter` | - | Adapter for used artifacts format (0x, truffle, giveth, etc.) |
`defaultFromAddress` | string | - | default from address to use when sending transactions |
`isVerbose` | boolean | true | If true, we will log any unknown transactions. Otherwise we will ignore them  |

**Returns:** *[ProfilerSubprovider](#class-profilersubprovider)*

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

___

###  writeProfilerOutputAsync

▸ **writeProfilerOutputAsync**(): *`Promise<void>`*

*Defined in [profiler_subprovider.ts:104](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/sol-profiler/src/profiler_subprovider.ts#L104)*

Write the test profiler results to a file in Istanbul format.

**Returns:** *`Promise<void>`*

<hr />

* [Globals](globals.md)
* [External Modules]()
  * [cost_utils](modules/_cost_utils_.md)
  * [index](modules/_index_.md)
  * [profiler_subprovider](modules/_profiler_subprovider_.md)
  * [profiler_subprovider.ProfilerSubprovider](#class-profilersubprovider)
* [Classes]()
  * [profiler_subprovider.ProfilerSubprovider](#class-profilersubprovider)

<hr />

