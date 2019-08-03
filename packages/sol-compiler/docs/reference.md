> # Class: Compiler

The Compiler facilitates compiling Solidity smart contracts and saves the results
to artifact files.

## Hierarchy

* **Compiler**

## Index

### Constructors

* [constructor](#constructor)

### Methods

* [compileAsync](#compileasync)
* [getCompilerOutputsAsync](#getcompileroutputsasync)
* [watchAsync](#watchasync)

## Constructors

###  constructor

\+ **new Compiler**(`opts?`: `CompilerOptions`): *[Compiler](#class-compiler)*

*Defined in [compiler.ts:94](https://github.com/0xProject/0x-monorepo/blob/6dd77d5c8/packages/sol-compiler/src/compiler.ts#L94)*

Instantiates a new instance of the Compiler class.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`opts?` | `CompilerOptions` | Optional compiler options |

**Returns:** *[Compiler](#class-compiler)*

An instance of the Compiler class.

## Methods

###  compileAsync

▸ **compileAsync**(): *`Promise<void>`*

*Defined in [compiler.ts:132](https://github.com/0xProject/0x-monorepo/blob/6dd77d5c8/packages/sol-compiler/src/compiler.ts#L132)*

Compiles selected Solidity files found in `contractsDir` and writes JSON artifacts to `artifactsDir`.

**Returns:** *`Promise<void>`*

___

###  getCompilerOutputsAsync

▸ **getCompilerOutputsAsync**(): *`Promise<StandardOutput[]>`*

*Defined in [compiler.ts:145](https://github.com/0xProject/0x-monorepo/blob/6dd77d5c8/packages/sol-compiler/src/compiler.ts#L145)*

Compiles Solidity files specified during instantiation, and returns the
compiler output given by solc.  Return value is an array of outputs:
Solidity modules are batched together by version required, and each
element of the returned array corresponds to a compiler version, and
each element contains the output for all of the modules compiled with
that version.

**Returns:** *`Promise<StandardOutput[]>`*

___

###  watchAsync

▸ **watchAsync**(): *`Promise<void>`*

*Defined in [compiler.ts:149](https://github.com/0xProject/0x-monorepo/blob/6dd77d5c8/packages/sol-compiler/src/compiler.ts#L149)*

**Returns:** *`Promise<void>`*

<hr />

> # Class: CompilationError

## Hierarchy

* `Error`

  * **CompilationError**

## Index

### Constructors

* [constructor](#constructor)

### Properties

* [errorsCount](#errorscount)
* [message](#message)
* [name](#name)
* [stack](#optional-stack)
* [typeName](#typename)
* [Error](#static-error)

## Constructors

###  constructor

\+ **new CompilationError**(`errorsCount`: number): *[CompilationError](#class-compilationerror)*

*Defined in [utils/types.ts:39](https://github.com/0xProject/0x-monorepo/blob/6dd77d5c8/packages/sol-compiler/src/utils/types.ts#L39)*

**Parameters:**

Name | Type |
------ | ------ |
`errorsCount` | number |

**Returns:** *[CompilationError](#class-compilationerror)*

## Properties

###  errorsCount

• **errorsCount**: *number*

*Defined in [utils/types.ts:38](https://github.com/0xProject/0x-monorepo/blob/6dd77d5c8/packages/sol-compiler/src/utils/types.ts#L38)*

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

###  typeName

• **typeName**: *string* = "CompilationError"

*Defined in [utils/types.ts:39](https://github.com/0xProject/0x-monorepo/blob/6dd77d5c8/packages/sol-compiler/src/utils/types.ts#L39)*

___

### `Static` Error

▪ **Error**: *`ErrorConstructor`*

Defined in /Users/rickmorty/Documents/projects/0x/0x-monorepo/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:984

<hr />

> # Enumeration: AbiType

## Index

### Enumeration members

* [Constructor](#constructor)
* [Event](#event)
* [Fallback](#fallback)
* [Function](#function)

## Enumeration members

###  Constructor

• **Constructor**: = "constructor"

*Defined in [utils/types.ts:3](https://github.com/0xProject/0x-monorepo/blob/6dd77d5c8/packages/sol-compiler/src/utils/types.ts#L3)*

___

###  Event

• **Event**: = "event"

*Defined in [utils/types.ts:4](https://github.com/0xProject/0x-monorepo/blob/6dd77d5c8/packages/sol-compiler/src/utils/types.ts#L4)*

___

###  Fallback

• **Fallback**: = "fallback"

*Defined in [utils/types.ts:5](https://github.com/0xProject/0x-monorepo/blob/6dd77d5c8/packages/sol-compiler/src/utils/types.ts#L5)*

___

###  Function

• **Function**: = "function"

*Defined in [utils/types.ts:2](https://github.com/0xProject/0x-monorepo/blob/6dd77d5c8/packages/sol-compiler/src/utils/types.ts#L2)*

<hr />

> # Interface: BinaryPaths

## Hierarchy

* **BinaryPaths**

## Indexable

● \[▪ **key**: *string*\]: string

<hr />

> # Interface: ContractSourceData

## Hierarchy

* **ContractSourceData**

## Indexable

● \[▪ **contractName**: *string*\]: [ContractSpecificSourceData](#class-contractspecificsourcedata)

<hr />

> # Interface: ContractSpecificSourceData

## Hierarchy

* **ContractSpecificSourceData**

## Index

### Properties

* [solcVersionRange](#solcversionrange)
* [sourceHash](#sourcehash)
* [sourceTreeHash](#sourcetreehash)

## Properties

###  solcVersionRange

• **solcVersionRange**: *string*

*Defined in [utils/types.ts:21](https://github.com/0xProject/0x-monorepo/blob/6dd77d5c8/packages/sol-compiler/src/utils/types.ts#L21)*

___

###  sourceHash

• **sourceHash**: *`Buffer`*

*Defined in [utils/types.ts:22](https://github.com/0xProject/0x-monorepo/blob/6dd77d5c8/packages/sol-compiler/src/utils/types.ts#L22)*

___

###  sourceTreeHash

• **sourceTreeHash**: *`Buffer`*

*Defined in [utils/types.ts:23](https://github.com/0xProject/0x-monorepo/blob/6dd77d5c8/packages/sol-compiler/src/utils/types.ts#L23)*

<hr />

> # Interface: SolcErrors

## Hierarchy

* **SolcErrors**

## Indexable

● \[▪ **key**: *string*\]: boolean

<hr />

> # Interface: Token

## Hierarchy

* **Token**

## Index

### Properties

* [address](#optional-address)
* [decimals](#decimals)
* [ipfsHash](#ipfshash)
* [name](#name)
* [swarmHash](#swarmhash)
* [symbol](#symbol)

## Properties

### `Optional` address

• **address**? : *undefined | string*

*Defined in [utils/types.ts:27](https://github.com/0xProject/0x-monorepo/blob/6dd77d5c8/packages/sol-compiler/src/utils/types.ts#L27)*

___

###  decimals

• **decimals**: *number*

*Defined in [utils/types.ts:30](https://github.com/0xProject/0x-monorepo/blob/6dd77d5c8/packages/sol-compiler/src/utils/types.ts#L30)*

___

###  ipfsHash

• **ipfsHash**: *string*

*Defined in [utils/types.ts:31](https://github.com/0xProject/0x-monorepo/blob/6dd77d5c8/packages/sol-compiler/src/utils/types.ts#L31)*

___

###  name

• **name**: *string*

*Defined in [utils/types.ts:28](https://github.com/0xProject/0x-monorepo/blob/6dd77d5c8/packages/sol-compiler/src/utils/types.ts#L28)*

___

###  swarmHash

• **swarmHash**: *string*

*Defined in [utils/types.ts:32](https://github.com/0xProject/0x-monorepo/blob/6dd77d5c8/packages/sol-compiler/src/utils/types.ts#L32)*

___

###  symbol

• **symbol**: *string*

*Defined in [utils/types.ts:29](https://github.com/0xProject/0x-monorepo/blob/6dd77d5c8/packages/sol-compiler/src/utils/types.ts#L29)*

<hr />

* [Globals](globals.md)
* [External Modules]()
  * [cli](modules/_cli_.md)
  * [compiler](modules/_compiler_.md)
  * [compiler.Compiler](#class-compiler)
  * [index](modules/_index_.md)
  * [schemas/compiler_options_schema](modules/_schemas_compiler_options_schema_.md)
  * [utils/compiler](modules/_utils_compiler_.md)
  * [utils/constants](modules/_utils_constants_.md)
  * [utils/encoder](modules/_utils_encoder_.md)
  * [utils/fs_wrapper](modules/_utils_fs_wrapper_.md)
  * [utils/types](modules/_utils_types_.md)
  * [utils/types.AbiType](#class-abitype)
  * [utils/types.CompilationError](#class-compilationerror)
  * [utils/types.BinaryPaths](#class-binarypaths)
  * [utils/types.ContractSourceData](#class-contractsourcedata)
  * [utils/types.ContractSpecificSourceData](#class-contractspecificsourcedata)
  * [utils/types.SolcErrors](#class-solcerrors)
  * [utils/types.Token](#class-token)
  * [utils/utils](modules/_utils_utils_.md)
* [Classes]()
  * [compiler.Compiler](#class-compiler)
  * [utils/types.CompilationError](#class-compilationerror)
* [Enums]()
  * [utils/types.AbiType](#class-abitype)
* [Interfaces]()
  * [utils/types.BinaryPaths](#class-binarypaths)
  * [utils/types.ContractSourceData](#class-contractsourcedata)
  * [utils/types.ContractSpecificSourceData](#class-contractspecificsourcedata)
  * [utils/types.SolcErrors](#class-solcerrors)
  * [utils/types.Token](#class-token)

<hr />

