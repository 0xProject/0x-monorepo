> # Class: CoverageSubprovider

This class implements the [web3-provider-engine](https://github.com/MetaMask/provider-engine) subprovider interface.
It's used to compute your code coverage while running solidity tests.

## Hierarchy

* `TraceInfoSubprovider`

  * **CoverageSubprovider**

## Index

### Constructors

* [constructor](#constructor)

### Methods

* [emitPayloadAsync](#emitpayloadasync)
* [handleRequest](#handlerequest)
* [setEngine](#setengine)
* [start](#start)
* [stop](#stop)
* [writeCoverageAsync](#writecoverageasync)

## Constructors

###  constructor

\+ **new CoverageSubprovider**(`artifactAdapter`: `AbstractArtifactAdapter`, `defaultFromAddress`: string, `partialConfig`: [CoverageSubproviderPartialConfig](#class-coveragesubprovider)*

*Overrides void*

*Defined in [coverage_subprovider.ts:44](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/sol-coverage/src/coverage_subprovider.ts#L44)*

Instantiates a CoverageSubprovider instance

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`artifactAdapter` | `AbstractArtifactAdapter` | - | Adapter for used artifacts format (0x, truffle, giveth, etc.) |
`defaultFromAddress` | string | - | default from address to use when sending transactions |
`partialConfig` | [CoverageSubproviderPartialConfig](#coveragesubproviderpartialconfig) |  {} | Partial configuration object  |

**Returns:** *[CoverageSubprovider](#class-coveragesubprovider)*

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

###  writeCoverageAsync

▸ **writeCoverageAsync**(): *`Promise<void>`*

*Defined in [coverage_subprovider.ts:78](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/sol-coverage/src/coverage_subprovider.ts#L78)*

Write the test coverage results to a file in Istanbul format.

**Returns:** *`Promise<void>`*

<hr />

> # Interface: CoverageSubproviderConfig

This type defines the schema of the config object that could be passed to CoverageSubprovider
isVerbose: If true - will log any unknown transactions. Defaults to true.
ignoreFilesGlobs: The list of globs matching the file names of the files we want to ignore coverage for. Defaults to [].

## Hierarchy

* **CoverageSubproviderConfig**

## Index

### Properties

* [ignoreFilesGlobs](#ignorefilesglobs)
* [isVerbose](#isverbose)

## Properties

###  ignoreFilesGlobs

• **ignoreFilesGlobs**: *string[]*

*Defined in [coverage_subprovider.ts:28](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/sol-coverage/src/coverage_subprovider.ts#L28)*

___

###  isVerbose

• **isVerbose**: *boolean*

*Defined in [coverage_subprovider.ts:27](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/sol-coverage/src/coverage_subprovider.ts#L27)*

<hr />

* [Globals](globals.md)
* [External Modules]()
  * [coverage_subprovider](modules/_coverage_subprovider_.md)
  * [coverage_subprovider.CoverageSubprovider](#class-coveragesubprovider)
  * [coverage_subprovider.CoverageSubproviderConfig](#class-coveragesubproviderconfig)
  * [index](modules/_index_.md)
* [Classes]()
  * [coverage_subprovider.CoverageSubprovider](#class-coveragesubprovider)
* [Interfaces]()
  * [coverage_subprovider.CoverageSubproviderConfig](#class-coveragesubproviderconfig)

<hr />

