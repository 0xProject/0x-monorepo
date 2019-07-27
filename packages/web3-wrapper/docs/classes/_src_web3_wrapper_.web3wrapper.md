> **[Web3Wrapper](../README.md)**

[Globals](../globals.md) / ["src/web3_wrapper"](../modules/_src_web3_wrapper_.md) / [Web3Wrapper](_src_web3_wrapper_.web3wrapper.md) /

# Class: Web3Wrapper

An alternative to the Web3.js library that provides a consistent, clean, promise-based interface.

## Hierarchy

* **Web3Wrapper**

## Index

### Constructors

* [constructor](_src_web3_wrapper_.web3wrapper.md#constructor)

### Properties

* [abiDecoder](_src_web3_wrapper_.web3wrapper.md#abidecoder)
* [isZeroExWeb3Wrapper](_src_web3_wrapper_.web3wrapper.md#iszeroexweb3wrapper)

### Methods

* [awaitTransactionMinedAsync](_src_web3_wrapper_.web3wrapper.md#awaittransactionminedasync)
* [awaitTransactionSuccessAsync](_src_web3_wrapper_.web3wrapper.md#awaittransactionsuccessasync)
* [callAsync](_src_web3_wrapper_.web3wrapper.md#callasync)
* [doesContractExistAtAddressAsync](_src_web3_wrapper_.web3wrapper.md#doescontractexistataddressasync)
* [estimateGasAsync](_src_web3_wrapper_.web3wrapper.md#estimategasasync)
* [getAvailableAddressesAsync](_src_web3_wrapper_.web3wrapper.md#getavailableaddressesasync)
* [getBalanceInWeiAsync](_src_web3_wrapper_.web3wrapper.md#getbalanceinweiasync)
* [getBlockIfExistsAsync](_src_web3_wrapper_.web3wrapper.md#getblockifexistsasync)
* [getBlockNumberAsync](_src_web3_wrapper_.web3wrapper.md#getblocknumberasync)
* [getBlockTimestampAsync](_src_web3_wrapper_.web3wrapper.md#getblocktimestampasync)
* [getBlockWithTransactionDataAsync](_src_web3_wrapper_.web3wrapper.md#getblockwithtransactiondataasync)
* [getContractCodeAsync](_src_web3_wrapper_.web3wrapper.md#getcontractcodeasync)
* [getContractDefaults](_src_web3_wrapper_.web3wrapper.md#getcontractdefaults)
* [getLogsAsync](_src_web3_wrapper_.web3wrapper.md#getlogsasync)
* [getNetworkIdAsync](_src_web3_wrapper_.web3wrapper.md#getnetworkidasync)
* [getNodeTypeAsync](_src_web3_wrapper_.web3wrapper.md#getnodetypeasync)
* [getNodeVersionAsync](_src_web3_wrapper_.web3wrapper.md#getnodeversionasync)
* [getProvider](_src_web3_wrapper_.web3wrapper.md#getprovider)
* [getTransactionByHashAsync](_src_web3_wrapper_.web3wrapper.md#gettransactionbyhashasync)
* [getTransactionReceiptIfExistsAsync](_src_web3_wrapper_.web3wrapper.md#gettransactionreceiptifexistsasync)
* [getTransactionTraceAsync](_src_web3_wrapper_.web3wrapper.md#gettransactiontraceasync)
* [increaseTimeAsync](_src_web3_wrapper_.web3wrapper.md#increasetimeasync)
* [isSenderAddressAvailableAsync](_src_web3_wrapper_.web3wrapper.md#issenderaddressavailableasync)
* [mineBlockAsync](_src_web3_wrapper_.web3wrapper.md#mineblockasync)
* [revertSnapshotAsync](_src_web3_wrapper_.web3wrapper.md#revertsnapshotasync)
* [sendRawPayloadAsync](_src_web3_wrapper_.web3wrapper.md#sendrawpayloadasync)
* [sendTransactionAsync](_src_web3_wrapper_.web3wrapper.md#sendtransactionasync)
* [setHeadAsync](_src_web3_wrapper_.web3wrapper.md#setheadasync)
* [setProvider](_src_web3_wrapper_.web3wrapper.md#setprovider)
* [signMessageAsync](_src_web3_wrapper_.web3wrapper.md#signmessageasync)
* [signTypedDataAsync](_src_web3_wrapper_.web3wrapper.md#signtypeddataasync)
* [takeSnapshotAsync](_src_web3_wrapper_.web3wrapper.md#takesnapshotasync)
* [isAddress](_src_web3_wrapper_.web3wrapper.md#static-isaddress)
* [toBaseUnitAmount](_src_web3_wrapper_.web3wrapper.md#static-tobaseunitamount)
* [toUnitAmount](_src_web3_wrapper_.web3wrapper.md#static-tounitamount)
* [toWei](_src_web3_wrapper_.web3wrapper.md#static-towei)

## Constructors

###  constructor

\+ **new Web3Wrapper**(`supportedProvider`: `SupportedProvider`, `callAndTxnDefaults`: `Partial<CallData>`): *[Web3Wrapper](_src_web3_wrapper_.web3wrapper.md)*

*Defined in [src/web3_wrapper.ts:145](https://github.com/0xProject/0x-monorepo/blob/a9ccc3fad/packages/web3-wrapper/src/web3_wrapper.ts#L145)*

Instantiates a new Web3Wrapper.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`supportedProvider` | `SupportedProvider` | - | - |
`callAndTxnDefaults` | `Partial<CallData>` |  {} | Override Call and Txn Data defaults sent with RPC requests to the backing Ethereum node. |

**Returns:** *[Web3Wrapper](_src_web3_wrapper_.web3wrapper.md)*

An instance of the Web3Wrapper class.

## Properties

###  abiDecoder

• **abiDecoder**: *`AbiDecoder`*

*Defined in [src/web3_wrapper.ts:54](https://github.com/0xProject/0x-monorepo/blob/a9ccc3fad/packages/web3-wrapper/src/web3_wrapper.ts#L54)*

___

###  isZeroExWeb3Wrapper

• **isZeroExWeb3Wrapper**: *boolean* = true

*Defined in [src/web3_wrapper.ts:53](https://github.com/0xProject/0x-monorepo/blob/a9ccc3fad/packages/web3-wrapper/src/web3_wrapper.ts#L53)*

Flag to check if this instance is of type Web3Wrapper

## Methods

###  awaitTransactionMinedAsync

▸ **awaitTransactionMinedAsync**(`txHash`: string, `pollingIntervalMs`: number, `timeoutMs?`: undefined | number): *`Promise<TransactionReceiptWithDecodedLogs>`*

*Defined in [src/web3_wrapper.ts:568](https://github.com/0xProject/0x-monorepo/blob/a9ccc3fad/packages/web3-wrapper/src/web3_wrapper.ts#L568)*

Waits for a transaction to be mined and returns the transaction receipt.
Note that just because a transaction was mined does not mean it was
successful. You need to check the status code of the transaction receipt
to find out if it was successful, or use the helper method
awaitTransactionSuccessAsync.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`txHash` | string | - | Transaction hash |
`pollingIntervalMs` | number | 1000 | How often (in ms) should we check if the transaction is mined. |
`timeoutMs?` | undefined \| number | - | How long (in ms) to poll for transaction mined until aborting. |

**Returns:** *`Promise<TransactionReceiptWithDecodedLogs>`*

Transaction receipt with decoded log args.

___

###  awaitTransactionSuccessAsync

▸ **awaitTransactionSuccessAsync**(`txHash`: string, `pollingIntervalMs`: number, `timeoutMs?`: undefined | number): *`Promise<TransactionReceiptWithDecodedLogs>`*

*Defined in [src/web3_wrapper.ts:643](https://github.com/0xProject/0x-monorepo/blob/a9ccc3fad/packages/web3-wrapper/src/web3_wrapper.ts#L643)*

Waits for a transaction to be mined and returns the transaction receipt.
Unlike awaitTransactionMinedAsync, it will throw if the receipt has a
status that is not equal to 1. A status of 0 or null indicates that the
transaction was mined, but failed. See:
https://github.com/ethereum/wiki/wiki/JavaScript-API#web3ethgettransactionreceipt

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`txHash` | string | - | Transaction hash |
`pollingIntervalMs` | number | 1000 | How often (in ms) should we check if the transaction is mined. |
`timeoutMs?` | undefined \| number | - | How long (in ms) to poll for transaction mined until aborting. |

**Returns:** *`Promise<TransactionReceiptWithDecodedLogs>`*

Transaction receipt with decoded log args.

___

###  callAsync

▸ **callAsync**(`callData`: `CallData`, `defaultBlock?`: `BlockParam`): *`Promise<string>`*

*Defined in [src/web3_wrapper.ts:525](https://github.com/0xProject/0x-monorepo/blob/a9ccc3fad/packages/web3-wrapper/src/web3_wrapper.ts#L525)*

Call a smart contract method at a given block height

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`callData` | `CallData` | Call data |
`defaultBlock?` | `BlockParam` | Block height at which to make the call. Defaults to `latest` |

**Returns:** *`Promise<string>`*

The raw call result

___

###  doesContractExistAtAddressAsync

▸ **doesContractExistAtAddressAsync**(`address`: string): *`Promise<boolean>`*

*Defined in [src/web3_wrapper.ts:273](https://github.com/0xProject/0x-monorepo/blob/a9ccc3fad/packages/web3-wrapper/src/web3_wrapper.ts#L273)*

Check if a contract exists at a given address

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | string | Address to which to check |

**Returns:** *`Promise<boolean>`*

Whether or not contract code was found at the supplied address

___

###  estimateGasAsync

▸ **estimateGasAsync**(`txData`: `Partial<TxData>`): *`Promise<number>`*

*Defined in [src/web3_wrapper.ts:508](https://github.com/0xProject/0x-monorepo/blob/a9ccc3fad/packages/web3-wrapper/src/web3_wrapper.ts#L508)*

Calculate the estimated gas cost for a given transaction

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`txData` | `Partial<TxData>` | Transaction data |

**Returns:** *`Promise<number>`*

Estimated gas cost

___

###  getAvailableAddressesAsync

▸ **getAvailableAddressesAsync**(): *`Promise<string[]>`*

*Defined in [src/web3_wrapper.ts:421](https://github.com/0xProject/0x-monorepo/blob/a9ccc3fad/packages/web3-wrapper/src/web3_wrapper.ts#L421)*

Retrieve the user addresses available through the backing provider

**Returns:** *`Promise<string[]>`*

Available user addresses

___

###  getBalanceInWeiAsync

▸ **getBalanceInWeiAsync**(`owner`: string, `defaultBlock?`: `BlockParam`): *`Promise<BigNumber>`*

*Defined in [src/web3_wrapper.ts:254](https://github.com/0xProject/0x-monorepo/blob/a9ccc3fad/packages/web3-wrapper/src/web3_wrapper.ts#L254)*

Retrieves an accounts Ether balance in wei

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`owner` | string | Account whose balance you wish to check |
`defaultBlock?` | `BlockParam` | The block depth at which to fetch the balance (default=latest) |

**Returns:** *`Promise<BigNumber>`*

Balance in wei

___

###  getBlockIfExistsAsync

▸ **getBlockIfExistsAsync**(`blockParam`: string | `BlockParam`): *`Promise<BlockWithoutTransactionData | undefined>`*

*Defined in [src/web3_wrapper.ts:361](https://github.com/0xProject/0x-monorepo/blob/a9ccc3fad/packages/web3-wrapper/src/web3_wrapper.ts#L361)*

Fetch a specific Ethereum block without transaction data

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`blockParam` | string \| `BlockParam` | The block you wish to fetch (blockHash, blockNumber or blockLiteral) |

**Returns:** *`Promise<BlockWithoutTransactionData | undefined>`*

The requested block without transaction data, or undefined if block was not found
(e.g the node isn't fully synced, there was a block re-org and the requested block was uncles, etc...)

___

###  getBlockNumberAsync

▸ **getBlockNumberAsync**(): *`Promise<number>`*

*Defined in [src/web3_wrapper.ts:347](https://github.com/0xProject/0x-monorepo/blob/a9ccc3fad/packages/web3-wrapper/src/web3_wrapper.ts#L347)*

Fetches the latest block number

**Returns:** *`Promise<number>`*

Block number

___

###  getBlockTimestampAsync

▸ **getBlockTimestampAsync**(`blockParam`: string | `BlockParam`): *`Promise<number>`*

*Defined in [src/web3_wrapper.ts:409](https://github.com/0xProject/0x-monorepo/blob/a9ccc3fad/packages/web3-wrapper/src/web3_wrapper.ts#L409)*

Fetch a block's timestamp

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`blockParam` | string \| `BlockParam` | The block you wish to fetch (blockHash, blockNumber or blockLiteral) |

**Returns:** *`Promise<number>`*

The block's timestamp

___

###  getBlockWithTransactionDataAsync

▸ **getBlockWithTransactionDataAsync**(`blockParam`: string | `BlockParam`): *`Promise<BlockWithTransactionData>`*

*Defined in [src/web3_wrapper.ts:387](https://github.com/0xProject/0x-monorepo/blob/a9ccc3fad/packages/web3-wrapper/src/web3_wrapper.ts#L387)*

Fetch a specific Ethereum block with transaction data

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`blockParam` | string \| `BlockParam` | The block you wish to fetch (blockHash, blockNumber or blockLiteral) |

**Returns:** *`Promise<BlockWithTransactionData>`*

The requested block with transaction data

___

###  getContractCodeAsync

▸ **getContractCodeAsync**(`address`: string, `defaultBlock?`: `BlockParam`): *`Promise<string>`*

*Defined in [src/web3_wrapper.ts:286](https://github.com/0xProject/0x-monorepo/blob/a9ccc3fad/packages/web3-wrapper/src/web3_wrapper.ts#L286)*

Gets the contract code by address

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | string | Address of the contract |
`defaultBlock?` | `BlockParam` | Block height at which to make the call. Defaults to `latest` |

**Returns:** *`Promise<string>`*

Code of the contract

___

###  getContractDefaults

▸ **getContractDefaults**(): *`Partial<CallData>` | undefined*

*Defined in [src/web3_wrapper.ts:164](https://github.com/0xProject/0x-monorepo/blob/a9ccc3fad/packages/web3-wrapper/src/web3_wrapper.ts#L164)*

Get the contract defaults set to the Web3Wrapper instance

**Returns:** *`Partial<CallData>` | undefined*

CallAndTxnData defaults (e.g gas, gasPrice, nonce, etc...)

___

###  getLogsAsync

▸ **getLogsAsync**(`filter`: `FilterObject`): *`Promise<LogEntry[]>`*

*Defined in [src/web3_wrapper.ts:475](https://github.com/0xProject/0x-monorepo/blob/a9ccc3fad/packages/web3-wrapper/src/web3_wrapper.ts#L475)*

Retrieve smart contract logs for a given filter

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`filter` | `FilterObject` | Parameters by which to filter which logs to retrieve |

**Returns:** *`Promise<LogEntry[]>`*

The corresponding log entries

___

###  getNetworkIdAsync

▸ **getNetworkIdAsync**(): *`Promise<number>`*

*Defined in [src/web3_wrapper.ts:207](https://github.com/0xProject/0x-monorepo/blob/a9ccc3fad/packages/web3-wrapper/src/web3_wrapper.ts#L207)*

Fetches the networkId of the backing Ethereum node

**Returns:** *`Promise<number>`*

The network id

___

###  getNodeTypeAsync

▸ **getNodeTypeAsync**(): *`Promise<NodeType>`*

*Defined in [src/web3_wrapper.ts:690](https://github.com/0xProject/0x-monorepo/blob/a9ccc3fad/packages/web3-wrapper/src/web3_wrapper.ts#L690)*

Returns either NodeType.Geth or NodeType.Ganache depending on the type of
the backing Ethereum node. Throws for any other type of node.

**Returns:** *`Promise<NodeType>`*

___

###  getNodeVersionAsync

▸ **getNodeVersionAsync**(): *`Promise<string>`*

*Defined in [src/web3_wrapper.ts:199](https://github.com/0xProject/0x-monorepo/blob/a9ccc3fad/packages/web3-wrapper/src/web3_wrapper.ts#L199)*

Fetch the backing Ethereum node's version string (e.g `MetaMask/v4.2.0`)

**Returns:** *`Promise<string>`*

Ethereum node's version string

___

###  getProvider

▸ **getProvider**(): *`SupportedProvider`*

*Defined in [src/web3_wrapper.ts:171](https://github.com/0xProject/0x-monorepo/blob/a9ccc3fad/packages/web3-wrapper/src/web3_wrapper.ts#L171)*

Retrieve the Web3 provider

**Returns:** *`SupportedProvider`*

Web3 provider instance

___

###  getTransactionByHashAsync

▸ **getTransactionByHashAsync**(`txHash`: string): *`Promise<Transaction>`*

*Defined in [src/web3_wrapper.ts:239](https://github.com/0xProject/0x-monorepo/blob/a9ccc3fad/packages/web3-wrapper/src/web3_wrapper.ts#L239)*

Retrieves the transaction data for a given transaction

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`txHash` | string | Transaction hash |

**Returns:** *`Promise<Transaction>`*

The raw transaction data

___

###  getTransactionReceiptIfExistsAsync

▸ **getTransactionReceiptIfExistsAsync**(`txHash`: string): *`Promise<TransactionReceipt | undefined>`*

*Defined in [src/web3_wrapper.ts:217](https://github.com/0xProject/0x-monorepo/blob/a9ccc3fad/packages/web3-wrapper/src/web3_wrapper.ts#L217)*

Retrieves the transaction receipt for a given transaction hash if found

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`txHash` | string | Transaction hash |

**Returns:** *`Promise<TransactionReceipt | undefined>`*

The transaction receipt, including it's status (0: failed, 1: succeeded). Returns undefined if transaction not found.

___

###  getTransactionTraceAsync

▸ **getTransactionTraceAsync**(`txHash`: string, `traceParams`: `TraceParams`): *`Promise<TransactionTrace>`*

*Defined in [src/web3_wrapper.ts:305](https://github.com/0xProject/0x-monorepo/blob/a9ccc3fad/packages/web3-wrapper/src/web3_wrapper.ts#L305)*

Gets the debug trace of a transaction

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`txHash` | string | Hash of the transactuon to get a trace for |
`traceParams` | `TraceParams` | Config object allowing you to specify if you need memory/storage/stack traces. |

**Returns:** *`Promise<TransactionTrace>`*

Transaction trace

___

###  increaseTimeAsync

▸ **increaseTimeAsync**(`timeDelta`: number): *`Promise<number>`*

*Defined in [src/web3_wrapper.ts:458](https://github.com/0xProject/0x-monorepo/blob/a9ccc3fad/packages/web3-wrapper/src/web3_wrapper.ts#L458)*

Increase the next blocks timestamp on TestRPC/Ganache or Geth local node.
Will throw if provider is neither TestRPC/Ganache or Geth.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`timeDelta` | number | Amount of time to add in seconds  |

**Returns:** *`Promise<number>`*

___

###  isSenderAddressAvailableAsync

▸ **isSenderAddressAvailableAsync**(`senderAddress`: string): *`Promise<boolean>`*

*Defined in [src/web3_wrapper.ts:189](https://github.com/0xProject/0x-monorepo/blob/a9ccc3fad/packages/web3-wrapper/src/web3_wrapper.ts#L189)*

Check whether an address is available through the backing provider. This can be
useful if you want to know whether a user can sign messages or transactions from
a given Ethereum address.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`senderAddress` | string | Address to check availability for |

**Returns:** *`Promise<boolean>`*

Whether the address is available through the provider.

___

###  mineBlockAsync

▸ **mineBlockAsync**(): *`Promise<void>`*

*Defined in [src/web3_wrapper.ts:450](https://github.com/0xProject/0x-monorepo/blob/a9ccc3fad/packages/web3-wrapper/src/web3_wrapper.ts#L450)*

Mine a block on a TestRPC/Ganache local node

**Returns:** *`Promise<void>`*

___

###  revertSnapshotAsync

▸ **revertSnapshotAsync**(`snapshotId`: number): *`Promise<boolean>`*

*Defined in [src/web3_wrapper.ts:442](https://github.com/0xProject/0x-monorepo/blob/a9ccc3fad/packages/web3-wrapper/src/web3_wrapper.ts#L442)*

Revert the blockchain state to a previous snapshot state on TestRPC/Ganache local node

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`snapshotId` | number | snapshot id to revert to |

**Returns:** *`Promise<boolean>`*

Whether the revert was successful

___

###  sendRawPayloadAsync

▸ **sendRawPayloadAsync**<**A**>(`payload`: `Partial<JSONRPCRequestPayload>`): *`Promise<A>`*

*Defined in [src/web3_wrapper.ts:671](https://github.com/0xProject/0x-monorepo/blob/a9ccc3fad/packages/web3-wrapper/src/web3_wrapper.ts#L671)*

Sends a raw Ethereum JSON RPC payload and returns the response's `result` key

**Type parameters:**

▪ **A**

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`payload` | `Partial<JSONRPCRequestPayload>` | A partial JSON RPC payload. No need to include version, id, params (if none needed) |

**Returns:** *`Promise<A>`*

The contents nested under the result key of the response body

___

###  sendTransactionAsync

▸ **sendTransactionAsync**(`txData`: `TxData`): *`Promise<string>`*

*Defined in [src/web3_wrapper.ts:547](https://github.com/0xProject/0x-monorepo/blob/a9ccc3fad/packages/web3-wrapper/src/web3_wrapper.ts#L547)*

Send a transaction

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`txData` | `TxData` | Transaction data |

**Returns:** *`Promise<string>`*

Transaction hash

___

###  setHeadAsync

▸ **setHeadAsync**(`blockNumber`: number): *`Promise<void>`*

*Defined in [src/web3_wrapper.ts:662](https://github.com/0xProject/0x-monorepo/blob/a9ccc3fad/packages/web3-wrapper/src/web3_wrapper.ts#L662)*

Calls the 'debug_setHead' JSON RPC method, which sets the current head of
the local chain by block number. Note, this is a destructive action and
may severely damage your chain. Use with extreme caution. As of now, this
is only supported by Geth. It sill throw if the 'debug_setHead' method is
not supported.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`blockNumber` | number | The block number to reset to.  |

**Returns:** *`Promise<void>`*

___

###  setProvider

▸ **setProvider**(`supportedProvider`: `SupportedProvider`): *void*

*Defined in [src/web3_wrapper.ts:178](https://github.com/0xProject/0x-monorepo/blob/a9ccc3fad/packages/web3-wrapper/src/web3_wrapper.ts#L178)*

Update the used Web3 provider

**Parameters:**

Name | Type |
------ | ------ |
`supportedProvider` | `SupportedProvider` |

**Returns:** *void*

___

###  signMessageAsync

▸ **signMessageAsync**(`address`: string, `message`: string): *`Promise<string>`*

*Defined in [src/web3_wrapper.ts:319](https://github.com/0xProject/0x-monorepo/blob/a9ccc3fad/packages/web3-wrapper/src/web3_wrapper.ts#L319)*

Sign a message with a specific address's private key (`eth_sign`)

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | string | Address of signer |
`message` | string | Message to sign |

**Returns:** *`Promise<string>`*

Signature string (might be VRS or RSV depending on the Signer)

___

###  signTypedDataAsync

▸ **signTypedDataAsync**(`address`: string, `typedData`: any): *`Promise<string>`*

*Defined in [src/web3_wrapper.ts:334](https://github.com/0xProject/0x-monorepo/blob/a9ccc3fad/packages/web3-wrapper/src/web3_wrapper.ts#L334)*

Sign an EIP712 typed data message with a specific address's private key (`eth_signTypedData`)

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | string | Address of signer |
`typedData` | any | Typed data message to sign |

**Returns:** *`Promise<string>`*

Signature string (as RSV)

___

###  takeSnapshotAsync

▸ **takeSnapshotAsync**(): *`Promise<number>`*

*Defined in [src/web3_wrapper.ts:433](https://github.com/0xProject/0x-monorepo/blob/a9ccc3fad/packages/web3-wrapper/src/web3_wrapper.ts#L433)*

Take a snapshot of the blockchain state on a TestRPC/Ganache local node

**Returns:** *`Promise<number>`*

The snapshot id. This can be used to revert to this snapshot

___

### `Static` isAddress

▸ **isAddress**(`address`: string): *boolean*

*Defined in [src/web3_wrapper.ts:65](https://github.com/0xProject/0x-monorepo/blob/a9ccc3fad/packages/web3-wrapper/src/web3_wrapper.ts#L65)*

Check if an address is a valid Ethereum address

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | string | Address to check |

**Returns:** *boolean*

Whether the address is a valid Ethereum address

___

### `Static` toBaseUnitAmount

▸ **toBaseUnitAmount**(`amount`: `BigNumber`, `decimals`: number): *`BigNumber`*

*Defined in [src/web3_wrapper.ts:91](https://github.com/0xProject/0x-monorepo/blob/a9ccc3fad/packages/web3-wrapper/src/web3_wrapper.ts#L91)*

A baseUnit is defined as the smallest denomination of a token. An amount expressed in baseUnits
is the amount expressed in the smallest denomination.
E.g: 1 unit of a token with 18 decimal places is expressed in baseUnits as 1000000000000000000

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`amount` | `BigNumber` | The amount of units that you would like converted to baseUnits. |
`decimals` | number | The number of decimal places the unit amount has. |

**Returns:** *`BigNumber`*

The amount in baseUnits.

___

### `Static` toUnitAmount

▸ **toUnitAmount**(`amount`: `BigNumber`, `decimals`: number): *`BigNumber`*

*Defined in [src/web3_wrapper.ts:76](https://github.com/0xProject/0x-monorepo/blob/a9ccc3fad/packages/web3-wrapper/src/web3_wrapper.ts#L76)*

A unit amount is defined as the amount of a token above the specified decimal places (integer part).
E.g: If a currency has 18 decimal places, 1e18 or one quintillion of the currency is equivalent
to 1 unit.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`amount` | `BigNumber` | The amount in baseUnits that you would like converted to units. |
`decimals` | number | The number of decimal places the unit amount has. |

**Returns:** *`BigNumber`*

The amount in units.

___

### `Static` toWei

▸ **toWei**(`ethAmount`: `BigNumber`): *`BigNumber`*

*Defined in [src/web3_wrapper.ts:107](https://github.com/0xProject/0x-monorepo/blob/a9ccc3fad/packages/web3-wrapper/src/web3_wrapper.ts#L107)*

Convert an Ether amount from ETH to Wei

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`ethAmount` | `BigNumber` | Amount of Ether to convert to wei |

**Returns:** *`BigNumber`*

Amount in wei