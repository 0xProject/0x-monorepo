<!--
changelogUtils.file is auto-generated using the monorepo-scripts package. Don't edit directly.
Edit the package's CHANGELOG.json file only.
-->

CHANGELOG

## v2.0.2 - _September 5, 2018_

    * Dependencies updated

## v2.0.1 - _August 27, 2018_

    * Dependencies updated

## v2.0.0 - _August 24, 2018_

    * Export types:  `BlockParam`, `TxData`, `Provider`, `TransactionReceipt`, `Transaction`, `TraceParams`, `TransactionTrace``, BlockWithoutTransactionDat`a, `LogEntry`, `FilterObject`, `CallData`, `TransactionReceiptWithDecodedLogs`, `BlockWithTransactionData``, LogTopi`c, `JSONRPCRequestPayload`, `TransactionReceiptStatus`, `DecodedLogArgs`, `StructLog`, `JSONRPCErrorCallback``, BlockParamLitera`l, `ContractEventArg`, `DecodedLogEntry`, `LogEntryEvent`, `OpCode`, `TxDataPayable`, `JSONRPCResponsePayload``, RawLogEntr`y, `DecodedLogEntryEvent`, `LogWithDecodedArgs`, `AbiDefinition`, `RawLog`, `FunctionAbi`, `EventAbi`, `EventParameter``, MethodAb`i, `ConstructorAbi`, `FallbackAbi`, `DataItem`, `ConstructorStateMutability` and `StateMutability` (#924)
    * Stop exporting types: `CallTxDataBaseRPC` and `AbstractBlockRPC` (#924)
    * Export `AbiDecoder` class (#924)

## v1.2.0 - _August 14, 2018_

    * Export marshaller to convert between RPC and user-space data formats (#938)
    * Export RPC types (#938)

## v1.1.2 - _July 26, 2018_

    * Dependencies updated

## v1.1.1 - _July 26, 2018_

    * Dependencies updated

## v1.1.0 - _July 26, 2018_

    * Add `getTransactionByHashAsync` method (#847)

## v1.0.1 - _July 23, 2018_

    * Dependencies updated

## v1.0.0 - _July 20, 2018_

    * Stop exporting `marshaller` utility file. (#902)
    * Export `marshaller` utility file. (#829)
    * Add `getNodeTypeAsync` method (#812)
    * Stop exporting uniqueVersionIds object (#897)

## v0.7.3 - _July 18, 2018_

    * Dependencies updated

## v0.7.2 - _July 9, 2018_

    * Dependencies updated

## v0.7.1 - _June 19, 2018_

    * Dependencies updated

## v0.7.0 - _June 4, 2018_

    * Add `web3Wrapper.getContractCodeAsync` (#675)
    * Add `web3Wrapper.getTransactionTraceAsync` (#675)
    * Add `web3Wrapper.getBlockWithTransactionDataAsync` (#675)
    * Add exported uniqueVersionIds object (#622)
    * Update increaseTimeAsync to work with Geth (#622)
    * Make callAsync throw if raw call result is 0x (null) (#622)
    * Add new setHeadAsync method (#622)
    * Improve performance of awaitTransactionMinedAsync by immediately checking if the transaction was already mined instead of waiting for the first interval. (#688)

## v0.6.4 - _May 22, 2018_

    * Dependencies updated

## v0.6.3 - _May 5, 2018_

    * Dependencies updated

## v0.6.2 - _May 4, 2018_

    * Dependencies updated

## v0.6.1 - _April 18, 2018_

    * Dependencies updated

## v0.6.0 - _April 11, 2018_

    * Make `isAddress` and `toWei` static (#501)
    * Add static methods `toUnitAmount` and `toBaseUnitAmount` (#501)

## v0.5.0 - _April 2, 2018_

    * Add `web3Wrapper.awaitTransactionMinedAsync` (#485)
    * Add a public field `abiDecoder: AbiDecoder` which allows you to add your ABIs that are later used to decode logs (#485)
    * Export enum `Web3WrapperErrors` with a single value so far: `TransactionMiningTimeout` (#485)

## v0.4.0 - _April 2, 2018_

    * Rename `signTransactionAsync` to `signMessageAsync` for clarity (#465)

## v0.3.0 - _March 17, 2018_

    * Add `web3Wrapper.takeSnapshotAsync`, `web3Wrapper.revertSnapshotAsync`, `web3Wrapper.mineBlockAsync`, `web3Wrapper.increaseTimeAsync` (#426)
    * Add `web3Wrapper.isZeroExWeb3Wrapper` for runtime instanceOf checks (#426)
    * Add a `getProvider` method (#444)

## v0.2.0 - _March 3, 2018_

    * Ensure all returned user addresses are lowercase (#373)
    * Add `web3Wrapper.callAsync` (#413)
    * Make `web3Wrapper.estimateGas` accept whole `txData` instead of `data` (#413)
    * Remove `web3Wrapper.getContractInstance` (#413)

## v0.1.12 - _February 8, 2018_

    * Fix publishing issue where .npmignore was not properly excluding undesired content (#389)
