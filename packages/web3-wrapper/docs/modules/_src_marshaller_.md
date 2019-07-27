> **[Web3Wrapper](../README.md)**

[Globals](../globals.md) / ["src/marshaller"](_src_marshaller_.md) /

# External module: "src/marshaller"

## Index

### Object literals

* [marshaller](_src_marshaller_.md#const-marshaller)

## Object literals

### `Const` marshaller

### ▪ **marshaller**: *object*

*Defined in [src/marshaller.ts:33](https://github.com/0xProject/0x-monorepo/blob/a9ccc3fad/packages/web3-wrapper/src/marshaller.ts#L33)*

Utils to convert ethereum structures from user-space format to RPC format. (marshall/unmarshall)

###  _marshalCallTxDataBase

▸ **_marshalCallTxDataBase**(`callTxDataBase`: `Partial<CallTxDataBase>`): *`Partial<CallTxDataBaseRPC>`*

*Defined in [src/marshaller.ts:208](https://github.com/0xProject/0x-monorepo/blob/a9ccc3fad/packages/web3-wrapper/src/marshaller.ts#L208)*

**Parameters:**

Name | Type |
------ | ------ |
`callTxDataBase` | `Partial<CallTxDataBase>` |

**Returns:** *`Partial<CallTxDataBaseRPC>`*

###  marshalAddress

▸ **marshalAddress**(`address`: string): *string*

*Defined in [src/marshaller.ts:176](https://github.com/0xProject/0x-monorepo/blob/a9ccc3fad/packages/web3-wrapper/src/marshaller.ts#L176)*

Marshall address

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | string | address to marshall |

**Returns:** *string*

marshalled address

###  marshalBlockParam

▸ **marshalBlockParam**(`blockParam`: `BlockParam` | string | number | undefined): *string | undefined*

*Defined in [src/marshaller.ts:187](https://github.com/0xProject/0x-monorepo/blob/a9ccc3fad/packages/web3-wrapper/src/marshaller.ts#L187)*

Marshall block param

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`blockParam` | `BlockParam` \| string \| number \| undefined | block param to marshall |

**Returns:** *string | undefined*

marshalled block param

###  marshalCallData

▸ **marshalCallData**(`callData`: `Partial<CallData>`): *`Partial<CallDataRPC>`*

*Defined in [src/marshaller.ts:159](https://github.com/0xProject/0x-monorepo/blob/a9ccc3fad/packages/web3-wrapper/src/marshaller.ts#L159)*

Marshall call data

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`callData` | `Partial<CallData>` | call data to marshall |

**Returns:** *`Partial<CallDataRPC>`*

marshalled call data

###  marshalTxData

▸ **marshalTxData**(`txData`: `Partial<TxData>`): *`Partial<TxDataRPC>`*

*Defined in [src/marshaller.ts:133](https://github.com/0xProject/0x-monorepo/blob/a9ccc3fad/packages/web3-wrapper/src/marshaller.ts#L133)*

Marshall transaction data

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`txData` | `Partial<TxData>` | transaction data to marshall |

**Returns:** *`Partial<TxDataRPC>`*

marshalled transaction data

###  unmarshalIntoBlockWithTransactionData

▸ **unmarshalIntoBlockWithTransactionData**(`blockWithHexValues`: [BlockWithTransactionDataRPC](../interfaces/_src_types_.blockwithtransactiondatarpc.md)): *`BlockWithTransactionData`*

*Defined in [src/marshaller.ts:59](https://github.com/0xProject/0x-monorepo/blob/a9ccc3fad/packages/web3-wrapper/src/marshaller.ts#L59)*

Unmarshall block with transaction data

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`blockWithHexValues` | [BlockWithTransactionDataRPC](../interfaces/_src_types_.blockwithtransactiondatarpc.md) | block to unmarshall |

**Returns:** *`BlockWithTransactionData`*

unmarshalled block with transaction data

###  unmarshalIntoBlockWithoutTransactionData

▸ **unmarshalIntoBlockWithoutTransactionData**(`blockWithHexValues`: [BlockWithoutTransactionDataRPC](../interfaces/_src_types_.blockwithouttransactiondatarpc.md)): *`BlockWithoutTransactionData`*

*Defined in [src/marshaller.ts:39](https://github.com/0xProject/0x-monorepo/blob/a9ccc3fad/packages/web3-wrapper/src/marshaller.ts#L39)*

Unmarshall block without transaction data

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`blockWithHexValues` | [BlockWithoutTransactionDataRPC](../interfaces/_src_types_.blockwithouttransactiondatarpc.md) | block to unmarshall |

**Returns:** *`BlockWithoutTransactionData`*

unmarshalled block without transaction data

###  unmarshalLog

▸ **unmarshalLog**(`rawLog`: `RawLogEntry`): *`LogEntry`*

*Defined in [src/marshaller.ts:199](https://github.com/0xProject/0x-monorepo/blob/a9ccc3fad/packages/web3-wrapper/src/marshaller.ts#L199)*

Unmarshall log

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`rawLog` | `RawLogEntry` | log to unmarshall |

**Returns:** *`LogEntry`*

unmarshalled log

###  unmarshalTransaction

▸ **unmarshalTransaction**(`txRpc`: [TransactionRPC](../interfaces/_src_types_.transactionrpc.md)): *`Transaction`*

*Defined in [src/marshaller.ts:82](https://github.com/0xProject/0x-monorepo/blob/a9ccc3fad/packages/web3-wrapper/src/marshaller.ts#L82)*

Unmarshall transaction

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`txRpc` | [TransactionRPC](../interfaces/_src_types_.transactionrpc.md) | transaction to unmarshall |

**Returns:** *`Transaction`*

unmarshalled transaction

###  unmarshalTransactionReceipt

▸ **unmarshalTransactionReceipt**(`txReceiptRpc`: [TransactionReceiptRPC](../interfaces/_src_types_.transactionreceiptrpc.md)): *`TransactionReceipt`*

*Defined in [src/marshaller.ts:99](https://github.com/0xProject/0x-monorepo/blob/a9ccc3fad/packages/web3-wrapper/src/marshaller.ts#L99)*

Unmarshall transaction receipt

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`txReceiptRpc` | [TransactionReceiptRPC](../interfaces/_src_types_.transactionreceiptrpc.md) | transaction receipt to unmarshall |

**Returns:** *`TransactionReceipt`*

unmarshalled transaction receipt

###  unmarshalTxData

▸ **unmarshalTxData**(`txDataRpc`: [TxDataRPC](../interfaces/_src_types_.txdatarpc.md)): *`TxData`*

*Defined in [src/marshaller.ts:115](https://github.com/0xProject/0x-monorepo/blob/a9ccc3fad/packages/web3-wrapper/src/marshaller.ts#L115)*

Unmarshall transaction data

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`txDataRpc` | [TxDataRPC](../interfaces/_src_types_.txdatarpc.md) | transaction data to unmarshall |

**Returns:** *`TxData`*

unmarshalled transaction data