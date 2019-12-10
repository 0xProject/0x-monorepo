# contract `Exchange`
The 0x Exchange contract.

&nbsp; *Defined in [contracts/exchange/contracts/src/Exchange.sol:32](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/Exchange.sol#L32)*

## Events
### `AssetProxyRegistered`


• `AssetProxyRegistered(bytes4 id, address assetProxy)`

&nbsp; *Defined in [contracts/exchange/contracts/src/interfaces/IAssetProxyDispatcher.sol:25](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/interfaces/IAssetProxyDispatcher.sol#L25)*

***Parameters***

| Name | Type | Indexed |
| ---- | ---- | ------- |
| [`id`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/interfaces/IAssetProxyDispatcher.sol#L26) | `bytes4` | `false` |  |
| [`assetProxy`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/interfaces/IAssetProxyDispatcher.sol#L27) | `address` | `false` |  |

---
### `Cancel`


• `Cancel(address makerAddress, address feeRecipientAddress, bytes makerAssetData, bytes takerAssetData, address senderAddress, bytes32 orderHash)`

&nbsp; *Defined in [contracts/exchange/contracts/src/interfaces/IExchangeCore.sol:47](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/interfaces/IExchangeCore.sol#L47)*

***Parameters***

| Name | Type | Indexed |
| ---- | ---- | ------- |
| [`makerAddress`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/interfaces/IExchangeCore.sol#L48) | `address` | `true` |  |
| [`feeRecipientAddress`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/interfaces/IExchangeCore.sol#L49) | `address` | `true` |  |
| [`makerAssetData`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/interfaces/IExchangeCore.sol#L50) | `bytes` | `false` |  |
| [`senderAddress`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/interfaces/IExchangeCore.sol#L52) | `address` | `false` |  |
| [`orderHash`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/interfaces/IExchangeCore.sol#L53) | `bytes32` | `true` |  |

---
### `CancelUpTo`


• `CancelUpTo(address makerAddress, address orderSenderAddress, uint256 orderEpoch)`

&nbsp; *Defined in [contracts/exchange/contracts/src/interfaces/IExchangeCore.sol:57](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/interfaces/IExchangeCore.sol#L57)*

***Parameters***

| Name | Type | Indexed |
| ---- | ---- | ------- |
| [`makerAddress`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/interfaces/IExchangeCore.sol#L58) | `address` | `true` |  |
| [`orderSenderAddress`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/interfaces/IExchangeCore.sol#L59) | `address` | `true` |  |
| [`orderEpoch`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/interfaces/IExchangeCore.sol#L60) | `uint256` | `false` |  |

---
### `Fill`


• `Fill(address makerAddress, address feeRecipientAddress, bytes makerAssetData, bytes takerAssetData, bytes makerFeeAssetData, bytes takerFeeAssetData, bytes32 orderHash, address takerAddress, address senderAddress, uint256 makerAssetFilledAmount, uint256 takerAssetFilledAmount, uint256 makerFeePaid, uint256 takerFeePaid, uint256 protocolFeePaid)`

&nbsp; *Defined in [contracts/exchange/contracts/src/interfaces/IExchangeCore.sol:29](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/interfaces/IExchangeCore.sol#L29)*

***Parameters***

| Name | Type | Indexed |
| ---- | ---- | ------- |
| [`makerAddress`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/interfaces/IExchangeCore.sol#L30) | `address` | `true` |  |
| [`feeRecipientAddress`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/interfaces/IExchangeCore.sol#L31) | `address` | `true` |  |
| [`makerAssetData`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/interfaces/IExchangeCore.sol#L32) | `bytes` | `false` |  |
| [`makerFeeAssetData`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/interfaces/IExchangeCore.sol#L34) | `bytes` | `false` |  |
| [`takerFeeAssetData`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/interfaces/IExchangeCore.sol#L35) | `bytes` | `false` |  |
| [`orderHash`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/interfaces/IExchangeCore.sol#L36) | `bytes32` | `true` |  |
| [`takerAddress`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/interfaces/IExchangeCore.sol#L37) | `address` | `false` |  |
| [`senderAddress`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/interfaces/IExchangeCore.sol#L38) | `address` | `false` |  |
| [`makerAssetFilledAmount`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/interfaces/IExchangeCore.sol#L39) | `uint256` | `false` |  |
| [`takerAssetFilledAmount`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/interfaces/IExchangeCore.sol#L40) | `uint256` | `false` |  |
| [`makerFeePaid`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/interfaces/IExchangeCore.sol#L41) | `uint256` | `false` |  |
| [`takerFeePaid`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/interfaces/IExchangeCore.sol#L42) | `uint256` | `false` |  |
| [`protocolFeePaid`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/interfaces/IExchangeCore.sol#L43) | `uint256` | `false` |  |

---
### `OwnershipTransferred`
Emitted by Ownable when ownership is transferred.

• `OwnershipTransferred(address previousOwner, address newOwner)`

&nbsp; *Defined in [contracts/utils/contracts/src/interfaces/IOwnable.sol:27](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/utils/contracts/src/interfaces/IOwnable.sol#L27)*

***Parameters***

| Name | Type | Indexed | Description |
| ---- | ---- | ------- | ----------- |
| [`previousOwner`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/utils/contracts/src/interfaces/IOwnable.sol#L27) | `address` | `true` | The previous owner of the contract. |
| [`newOwner`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/utils/contracts/src/interfaces/IOwnable.sol#L27) | `address` | `true` | The new owner of the contract. |

---
### `ProtocolFeeCollectorAddress`


• `ProtocolFeeCollectorAddress(address oldProtocolFeeCollector, address updatedProtocolFeeCollector)`

&nbsp; *Defined in [contracts/exchange/contracts/src/interfaces/IProtocolFees.sol:28](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/interfaces/IProtocolFees.sol#L28)*

***Parameters***

| Name | Type | Indexed |
| ---- | ---- | ------- |
| [`oldProtocolFeeCollector`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/interfaces/IProtocolFees.sol#L28) | `address` | `false` |  |
| [`updatedProtocolFeeCollector`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/interfaces/IProtocolFees.sol#L28) | `address` | `false` |  |

---
### `ProtocolFeeMultiplier`


• `ProtocolFeeMultiplier(uint256 oldProtocolFeeMultiplier, uint256 updatedProtocolFeeMultiplier)`

&nbsp; *Defined in [contracts/exchange/contracts/src/interfaces/IProtocolFees.sol:25](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/interfaces/IProtocolFees.sol#L25)*

***Parameters***

| Name | Type | Indexed |
| ---- | ---- | ------- |
| [`oldProtocolFeeMultiplier`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/interfaces/IProtocolFees.sol#L25) | `uint256` | `false` |  |
| [`updatedProtocolFeeMultiplier`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/interfaces/IProtocolFees.sol#L25) | `uint256` | `false` |  |

---
### `SignatureValidatorApproval`


• `SignatureValidatorApproval(address signerAddress, address validatorAddress, bool isApproved)`

&nbsp; *Defined in [contracts/exchange/contracts/src/interfaces/ISignatureValidator.sol:41](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/interfaces/ISignatureValidator.sol#L41)*

***Parameters***

| Name | Type | Indexed |
| ---- | ---- | ------- |
| [`signerAddress`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/interfaces/ISignatureValidator.sol#L42) | `address` | `true` |  |
| [`validatorAddress`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/interfaces/ISignatureValidator.sol#L43) | `address` | `true` |  |
| [`isApproved`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/interfaces/ISignatureValidator.sol#L44) | `bool` | `false` |  |

---
### `TransactionExecution`


• `TransactionExecution(bytes32 transactionHash)`

&nbsp; *Defined in [contracts/exchange/contracts/src/interfaces/ITransactions.sol:28](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/interfaces/ITransactions.sol#L28)*

***Parameters***

| Name | Type | Indexed |
| ---- | ---- | ------- |
| [`transactionHash`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/interfaces/ITransactions.sol#L28) | `bytes32` | `true` |  |

## Methods
### `constructor`
Mixins are instantiated in the order they are inherited

• `constructor(uint256 chainId)`

&nbsp; *Defined in [contracts/exchange/contracts/src/Exchange.sol:41](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/Exchange.sol#L41)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`chainId`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/Exchange.sol#L41) | `uint256` | Chain ID of the network this contract is deployed on. |

---
### `allowedValidators`
Mapping of signer => validator => approved

• `allowedValidators(address, address): (bool)` *(generated)*

&nbsp; *Defined in [contracts/exchange/contracts/src/MixinSignatureValidator.sol:60](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinSignatureValidator.sol#L60)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`0`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinSignatureValidator.sol#L60) | `address` | Signer address. |
| [`1`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinSignatureValidator.sol#L60) | `address` | Signature validator address. |

***Returns***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`0`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinSignatureValidator.sol#L60) | `bool` | Whether the validator is allowed to validate on behalf of the signer. |

---
### `batchCancelOrders`
Executes multiple calls of cancelOrder.

• `batchCancelOrders(LibOrder.Order[] orders)`

&nbsp; *Defined in [contracts/exchange/contracts/src/MixinWrapperFunctions.sol:285](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinWrapperFunctions.sol#L285)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`orders`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinWrapperFunctions.sol#L285) | `LibOrder.Order[]` | Array of order specifications. |

---
### `batchExecuteTransactions`
Executes a batch of Exchange method calls in the context of signer(s).

• `batchExecuteTransactions(LibZeroExTransaction.ZeroExTransaction[] transactions, bytes[] signatures): (bytes[] returnData)`

&nbsp; *Defined in [contracts/exchange/contracts/src/MixinTransactions.sol:69](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinTransactions.sol#L69)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`transactions`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinTransactions.sol#L70) | `LibZeroExTransaction.ZeroExTransaction[]` | Array of 0x transaction structures. |
| [`signatures`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinTransactions.sol#L71) | `bytes[]` | Array of proofs that transactions have been signed by signer(s). |

***Returns***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`returnData`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinTransactions.sol#L76) | `bytes[]` | Array containing ABI encoded return data for each of the underlying Exchange function calls. |

---
### `batchFillOrders`
Executes multiple calls of fillOrder.

• `batchFillOrders(LibOrder.Order[] orders, uint256[] takerAssetFillAmounts, bytes[] signatures): (LibFillResults.FillResults[] fillResults)`

&nbsp; *Defined in [contracts/exchange/contracts/src/MixinWrapperFunctions.sol:67](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinWrapperFunctions.sol#L67)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`orders`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinWrapperFunctions.sol#L68) | `LibOrder.Order[]` | Array of order specifications. |
| [`takerAssetFillAmounts`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinWrapperFunctions.sol#L69) | `uint256[]` | Array of desired amounts of takerAsset to sell in orders. |
| [`signatures`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinWrapperFunctions.sol#L70) | `bytes[]` | Proofs that orders have been created by makers. |

***Returns***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`fillResults`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinWrapperFunctions.sol#L75) | `LibFillResults.FillResults[]` | Array of amounts filled and fees paid by makers and taker. |

---
### `batchFillOrdersNoThrow`
Executes multiple calls of fillOrder. If any fill reverts, the error is caught and ignored.

• `batchFillOrdersNoThrow(LibOrder.Order[] orders, uint256[] takerAssetFillAmounts, bytes[] signatures): (LibFillResults.FillResults[] fillResults)`

&nbsp; *Defined in [contracts/exchange/contracts/src/MixinWrapperFunctions.sol:121](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinWrapperFunctions.sol#L121)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`orders`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinWrapperFunctions.sol#L122) | `LibOrder.Order[]` | Array of order specifications. |
| [`takerAssetFillAmounts`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinWrapperFunctions.sol#L123) | `uint256[]` | Array of desired amounts of takerAsset to sell in orders. |
| [`signatures`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinWrapperFunctions.sol#L124) | `bytes[]` | Proofs that orders have been created by makers. |

***Returns***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`fillResults`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinWrapperFunctions.sol#L129) | `LibFillResults.FillResults[]` | Array of amounts filled and fees paid by makers and taker. |

---
### `batchFillOrKillOrders`
Executes multiple calls of fillOrKillOrder.

• `batchFillOrKillOrders(LibOrder.Order[] orders, uint256[] takerAssetFillAmounts, bytes[] signatures): (LibFillResults.FillResults[] fillResults)`

&nbsp; *Defined in [contracts/exchange/contracts/src/MixinWrapperFunctions.sol:94](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinWrapperFunctions.sol#L94)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`orders`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinWrapperFunctions.sol#L95) | `LibOrder.Order[]` | Array of order specifications. |
| [`takerAssetFillAmounts`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinWrapperFunctions.sol#L96) | `uint256[]` | Array of desired amounts of takerAsset to sell in orders. |
| [`signatures`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinWrapperFunctions.sol#L97) | `bytes[]` | Proofs that orders have been created by makers. |

***Returns***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`fillResults`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinWrapperFunctions.sol#L102) | `LibFillResults.FillResults[]` | Array of amounts filled and fees paid by makers and taker. |

---
### `batchMatchOrders`
Match complementary orders that have a profitable spread. Each order is filled at their respective price point, and the matcher receives a profit denominated in the left maker asset.

• `batchMatchOrders(LibOrder.Order[] leftOrders, LibOrder.Order[] rightOrders, bytes[] leftSignatures, bytes[] rightSignatures): (LibFillResults.BatchMatchedFillResults batchMatchedFillResults)`

&nbsp; *Defined in [contracts/exchange/contracts/src/MixinMatchOrders.sol:46](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinMatchOrders.sol#L46)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`leftOrders`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinMatchOrders.sol#L47) | `LibOrder.Order[]` | Set of orders with the same maker / taker asset. |
| [`rightOrders`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinMatchOrders.sol#L48) | `LibOrder.Order[]` | Set of orders to match against `leftOrders` |
| [`leftSignatures`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinMatchOrders.sol#L49) | `bytes[]` | Proof that left orders were created by the left makers. |
| [`rightSignatures`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinMatchOrders.sol#L50) | `bytes[]` | Proof that right orders were created by the right makers. |

***Returns***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`batchMatchedFillResults`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinMatchOrders.sol#L55) | `LibFillResults.BatchMatchedFillResults` | Amounts filled and profit generated. |

---
### `batchMatchOrdersWithMaximalFill`
Match complementary orders that have a profitable spread. Each order is maximally filled at their respective price point, and the matcher receives a profit denominated in either the left maker asset, right maker asset, or a combination of both.

• `batchMatchOrdersWithMaximalFill(LibOrder.Order[] leftOrders, LibOrder.Order[] rightOrders, bytes[] leftSignatures, bytes[] rightSignatures): (LibFillResults.BatchMatchedFillResults batchMatchedFillResults)`

&nbsp; *Defined in [contracts/exchange/contracts/src/MixinMatchOrders.sol:75](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinMatchOrders.sol#L75)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`leftOrders`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinMatchOrders.sol#L76) | `LibOrder.Order[]` | Set of orders with the same maker / taker asset. |
| [`rightOrders`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinMatchOrders.sol#L77) | `LibOrder.Order[]` | Set of orders to match against `leftOrders` |
| [`leftSignatures`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinMatchOrders.sol#L78) | `bytes[]` | Proof that left orders were created by the left makers. |
| [`rightSignatures`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinMatchOrders.sol#L79) | `bytes[]` | Proof that right orders were created by the right makers. |

***Returns***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`batchMatchedFillResults`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinMatchOrders.sol#L84) | `LibFillResults.BatchMatchedFillResults` | Amounts filled and profit generated. |

---
### `cancelled`
Mapping of orderHash => cancelled

• `cancelled(bytes32): (bool)` *(generated)*

&nbsp; *Defined in [contracts/exchange/contracts/src/MixinExchangeCore.sol:56](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinExchangeCore.sol#L56)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`0`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinExchangeCore.sol#L56) | `bytes32` | Order hash. |

***Returns***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`0`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinExchangeCore.sol#L56) | `bool` | Whether the order was cancelled. |

---
### `cancelOrder`
After calling, the order can not be filled anymore.

• `cancelOrder(LibOrder.Order order)`

&nbsp; *Defined in [contracts/exchange/contracts/src/MixinExchangeCore.sol:125](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinExchangeCore.sol#L125)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`order`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinExchangeCore.sol#L125) | `LibOrder.Order` | Order struct containing order specifications. |

---
### `cancelOrdersUpTo`
Cancels all orders created by makerAddress with a salt less than or equal to the targetOrderEpoch and senderAddress equal to msg.sender (or null address if msg.sender == makerAddress).

• `cancelOrdersUpTo(uint256 targetOrderEpoch)`

&nbsp; *Defined in [contracts/exchange/contracts/src/MixinExchangeCore.sol:68](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinExchangeCore.sol#L68)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`targetOrderEpoch`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinExchangeCore.sol#L68) | `uint256` | Orders created with a salt less or equal to this value will be cancelled. |

---
### `currentContextAddress`
Address of current transaction signer.

• `currentContextAddress(): (address)` *(generated)*

&nbsp; *Defined in [contracts/exchange/contracts/src/MixinTransactions.sol:47](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinTransactions.sol#L47)*

***Returns***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`0`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinTransactions.sol#L47) | `address` | The address associated with the the current transaction. |

---
### `detachProtocolFeeCollector`
Sets the protocolFeeCollector contract address to 0. Only callable by owner.

• `detachProtocolFeeCollector()`

&nbsp; *Defined in [contracts/exchange/contracts/src/MixinProtocolFees.sol:61](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinProtocolFees.sol#L61)*

---
### `EIP1271_MAGIC_VALUE`
Magic bytes returned by EIP1271 wallets on success.

• `EIP1271_MAGIC_VALUE(): (bytes4)` *(generated)*

&nbsp; *Defined in [contracts/utils/contracts/src/LibEIP1271.sol:26](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/utils/contracts/src/LibEIP1271.sol#L26)*

***Returns***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`0`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/utils/contracts/src/LibEIP1271.sol#L26) | `bytes4` | Magic bytes. |

---
### `EIP712_EXCHANGE_DOMAIN_HASH`
Hash of the EIP712 Domain Separator data

• `EIP712_EXCHANGE_DOMAIN_HASH(): (bytes32)` *(generated)*

&nbsp; *Defined in [contracts/exchange-libs/contracts/src/LibEIP712ExchangeDomain.sol:35](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-libs/contracts/src/LibEIP712ExchangeDomain.sol#L35)*

***Returns***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`0`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-libs/contracts/src/LibEIP712ExchangeDomain.sol#L35) | `bytes32` | Domain hash. |

---
### `executeTransaction`
Executes an Exchange method call in the context of signer.

• `executeTransaction(LibZeroExTransaction.ZeroExTransaction transaction, bytes signature): (bytes)`

&nbsp; *Defined in [contracts/exchange/contracts/src/MixinTransactions.sol:53](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinTransactions.sol#L53)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`transaction`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinTransactions.sol#L54) | `LibZeroExTransaction.ZeroExTransaction` | 0x transaction structure. |
| [`signature`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinTransactions.sol#L55) | `bytes` | Proof that transaction has been signed by signer. |

***Returns***

| Name | Type |
| ---- | ---- |
| [`0`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinTransactions.sol#L60) | `bytes` |  |

---
### `filled`
Mapping of orderHash => amount of takerAsset already bought by maker

• `filled(bytes32): (uint256)` *(generated)*

&nbsp; *Defined in [contracts/exchange/contracts/src/MixinExchangeCore.sol:51](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinExchangeCore.sol#L51)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`0`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinExchangeCore.sol#L51) | `bytes32` | Order hash. |

***Returns***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`0`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinExchangeCore.sol#L51) | `uint256` | The amount of taker asset filled. |

---
### `fillOrder`
Fills the input order.

• `fillOrder(LibOrder.Order order, uint256 takerAssetFillAmount, bytes signature): (LibFillResults.FillResults fillResults)`

&nbsp; *Defined in [contracts/exchange/contracts/src/MixinExchangeCore.sol:105](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinExchangeCore.sol#L105)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`order`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinExchangeCore.sol#L106) | `LibOrder.Order` | Order struct containing order specifications. |
| [`takerAssetFillAmount`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinExchangeCore.sol#L107) | `uint256` | Desired amount of takerAsset to sell. |
| [`signature`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinExchangeCore.sol#L108) | `bytes` | Proof that order has been created by maker. |

***Returns***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`fillResults`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinExchangeCore.sol#L113) | `LibFillResults.FillResults` | Amounts filled and fees paid by maker and taker. |

---
### `fillOrKillOrder`
Fills the input order. Reverts if exact `takerAssetFillAmount` not filled.

• `fillOrKillOrder(LibOrder.Order order, uint256 takerAssetFillAmount, bytes signature): (LibFillResults.FillResults fillResults)`

&nbsp; *Defined in [contracts/exchange/contracts/src/MixinWrapperFunctions.sol:44](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinWrapperFunctions.sol#L44)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`order`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinWrapperFunctions.sol#L45) | `LibOrder.Order` | Order struct containing order specifications. |
| [`takerAssetFillAmount`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinWrapperFunctions.sol#L46) | `uint256` | Desired amount of takerAsset to sell. |
| [`signature`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinWrapperFunctions.sol#L47) | `bytes` | Proof that order has been created by maker. |

***Returns***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`fillResults`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinWrapperFunctions.sol#L52) | `LibFillResults.FillResults` | Amounts filled and fees paid. |

---
### `getAssetProxy`
Gets an asset proxy.

• `getAssetProxy(bytes4 assetProxyId): (address assetProxy)`

&nbsp; *Defined in [contracts/exchange/contracts/src/MixinAssetProxyDispatcher.sol:66](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinAssetProxyDispatcher.sol#L66)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`assetProxyId`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinAssetProxyDispatcher.sol#L66) | `bytes4` | Id of the asset proxy. |

***Returns***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`assetProxy`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinAssetProxyDispatcher.sol#L69) | `address` | The asset proxy address registered to assetProxyId. Returns 0x0 if no proxy is registered. |

---
### `getOrderInfo`
Gets information about an order: status, hash, and amount filled.

• `getOrderInfo(LibOrder.Order order): (LibOrder.OrderInfo orderInfo)`

&nbsp; *Defined in [contracts/exchange/contracts/src/MixinExchangeCore.sol:137](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinExchangeCore.sol#L137)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`order`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinExchangeCore.sol#L137) | `LibOrder.Order` | Order to gather information on. |

***Returns***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`orderInfo`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinExchangeCore.sol#L140) | `LibOrder.OrderInfo` | Information about the order and its state. See LibOrder.OrderInfo for a complete description. |

---
### `isValidHashSignature`
Verifies that a hash has been signed by the given signer.

• `isValidHashSignature(bytes32 hash, address signerAddress, bytes signature): (bool isValid)`

&nbsp; *Defined in [contracts/exchange/contracts/src/MixinSignatureValidator.sol:100](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinSignatureValidator.sol#L100)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`hash`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinSignatureValidator.sol#L101) | `bytes32` | Any 32-byte hash. |
| [`signerAddress`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinSignatureValidator.sol#L102) | `address` | Address that should have signed the given hash. |
| [`signature`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinSignatureValidator.sol#L103) | `bytes` | Proof that the hash has been signed by signer. |

***Returns***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`isValid`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinSignatureValidator.sol#L107) | `bool` | `true` if the signature is valid for the given hash and signer. |

---
### `isValidOrderSignature`
Verifies that a signature for an order is valid.

• `isValidOrderSignature(LibOrder.Order order, bytes signature): (bool isValid)`

&nbsp; *Defined in [contracts/exchange/contracts/src/MixinSignatureValidator.sol:140](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinSignatureValidator.sol#L140)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`order`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinSignatureValidator.sol#L141) | `LibOrder.Order` | The order. |
| [`signature`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinSignatureValidator.sol#L142) | `bytes` | Proof that the order has been signed by signer. |

***Returns***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`isValid`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinSignatureValidator.sol#L146) | `bool` | `true` if the signature is valid for the given order and signer. |

---
### `isValidTransactionSignature`
Verifies that a signature for a transaction is valid.

• `isValidTransactionSignature(LibZeroExTransaction.ZeroExTransaction transaction, bytes signature): (bool isValid)`

&nbsp; *Defined in [contracts/exchange/contracts/src/MixinSignatureValidator.sol:161](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinSignatureValidator.sol#L161)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`transaction`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinSignatureValidator.sol#L162) | `LibZeroExTransaction.ZeroExTransaction` | The transaction. |
| [`signature`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinSignatureValidator.sol#L163) | `bytes` | Proof that the order has been signed by signer. |

***Returns***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`isValid`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinSignatureValidator.sol#L167) | `bool` | `true` if the signature is valid for the given transaction and signer. |

---
### `marketBuyOrdersFillOrKill`
Calls marketBuyOrdersNoThrow then reverts if < makerAssetFillAmount has been bought. NOTE: This function does not enforce that the makerAsset is the same for each order.

• `marketBuyOrdersFillOrKill(LibOrder.Order[] orders, uint256 makerAssetFillAmount, bytes[] signatures): (LibFillResults.FillResults fillResults)`

&nbsp; *Defined in [contracts/exchange/contracts/src/MixinWrapperFunctions.sol:264](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinWrapperFunctions.sol#L264)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`orders`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinWrapperFunctions.sol#L265) | `LibOrder.Order[]` | Array of order specifications. |
| [`makerAssetFillAmount`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinWrapperFunctions.sol#L266) | `uint256` | Minimum amount of makerAsset to buy. |
| [`signatures`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinWrapperFunctions.sol#L267) | `bytes[]` | Proofs that orders have been signed by makers. |

***Returns***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`fillResults`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinWrapperFunctions.sol#L271) | `LibFillResults.FillResults` | Amounts filled and fees paid by makers and taker. |

---
### `marketBuyOrdersNoThrow`
Executes multiple calls of fillOrder until total amount of makerAsset is bought by taker. If any fill reverts, the error is caught and ignored. NOTE: This function does not enforce that the makerAsset is the same for each order.

• `marketBuyOrdersNoThrow(LibOrder.Order[] orders, uint256 makerAssetFillAmount, bytes[] signatures): (LibFillResults.FillResults fillResults)`

&nbsp; *Defined in [contracts/exchange/contracts/src/MixinWrapperFunctions.sol:191](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinWrapperFunctions.sol#L191)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`orders`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinWrapperFunctions.sol#L192) | `LibOrder.Order[]` | Array of order specifications. |
| [`makerAssetFillAmount`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinWrapperFunctions.sol#L193) | `uint256` | Desired amount of makerAsset to buy. |
| [`signatures`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinWrapperFunctions.sol#L194) | `bytes[]` | Proofs that orders have been signed by makers. |

***Returns***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`fillResults`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinWrapperFunctions.sol#L199) | `LibFillResults.FillResults` | Amounts filled and fees paid by makers and taker. |

---
### `marketSellOrdersFillOrKill`
Calls marketSellOrdersNoThrow then reverts if < takerAssetFillAmount has been sold. NOTE: This function does not enforce that the takerAsset is the same for each order.

• `marketSellOrdersFillOrKill(LibOrder.Order[] orders, uint256 takerAssetFillAmount, bytes[] signatures): (LibFillResults.FillResults fillResults)`

&nbsp; *Defined in [contracts/exchange/contracts/src/MixinWrapperFunctions.sol:239](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinWrapperFunctions.sol#L239)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`orders`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinWrapperFunctions.sol#L240) | `LibOrder.Order[]` | Array of order specifications. |
| [`takerAssetFillAmount`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinWrapperFunctions.sol#L241) | `uint256` | Minimum amount of takerAsset to sell. |
| [`signatures`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinWrapperFunctions.sol#L242) | `bytes[]` | Proofs that orders have been signed by makers. |

***Returns***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`fillResults`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinWrapperFunctions.sol#L246) | `LibFillResults.FillResults` | Amounts filled and fees paid by makers and taker. |

---
### `marketSellOrdersNoThrow`
Executes multiple calls of fillOrder until total amount of takerAsset is sold by taker. If any fill reverts, the error is caught and ignored. NOTE: This function does not enforce that the takerAsset is the same for each order.

• `marketSellOrdersNoThrow(LibOrder.Order[] orders, uint256 takerAssetFillAmount, bytes[] signatures): (LibFillResults.FillResults fillResults)`

&nbsp; *Defined in [contracts/exchange/contracts/src/MixinWrapperFunctions.sol:150](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinWrapperFunctions.sol#L150)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`orders`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinWrapperFunctions.sol#L151) | `LibOrder.Order[]` | Array of order specifications. |
| [`takerAssetFillAmount`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinWrapperFunctions.sol#L152) | `uint256` | Desired amount of takerAsset to sell. |
| [`signatures`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinWrapperFunctions.sol#L153) | `bytes[]` | Proofs that orders have been signed by makers. |

***Returns***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`fillResults`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinWrapperFunctions.sol#L158) | `LibFillResults.FillResults` | Amounts filled and fees paid by makers and taker. |

---
### `matchOrders`
Match two complementary orders that have a profitable spread. Each order is filled at their respective price point. However, the calculations are carried out as though the orders are both being filled at the right order's price point. The profit made by the left order goes to the taker (who matched the two orders).

• `matchOrders(LibOrder.Order leftOrder, LibOrder.Order rightOrder, bytes leftSignature, bytes rightSignature): (LibFillResults.MatchedFillResults matchedFillResults)`

&nbsp; *Defined in [contracts/exchange/contracts/src/MixinMatchOrders.sol:104](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinMatchOrders.sol#L104)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`leftOrder`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinMatchOrders.sol#L105) | `LibOrder.Order` | First order to match. |
| [`rightOrder`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinMatchOrders.sol#L106) | `LibOrder.Order` | Second order to match. |
| [`leftSignature`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinMatchOrders.sol#L107) | `bytes` | Proof that order was created by the left maker. |
| [`rightSignature`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinMatchOrders.sol#L108) | `bytes` | Proof that order was created by the right maker. |

***Returns***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`matchedFillResults`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinMatchOrders.sol#L113) | `LibFillResults.MatchedFillResults` | Amounts filled and fees paid by maker and taker of matched orders. |

---
### `matchOrdersWithMaximalFill`
Match two complementary orders that have a profitable spread. Each order is maximally filled at their respective price point, and the matcher receives a profit denominated in either the left maker asset, right maker asset, or a combination of both.

• `matchOrdersWithMaximalFill(LibOrder.Order leftOrder, LibOrder.Order rightOrder, bytes leftSignature, bytes rightSignature): (LibFillResults.MatchedFillResults matchedFillResults)`

&nbsp; *Defined in [contracts/exchange/contracts/src/MixinMatchOrders.sol:133](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinMatchOrders.sol#L133)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`leftOrder`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinMatchOrders.sol#L134) | `LibOrder.Order` | First order to match. |
| [`rightOrder`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinMatchOrders.sol#L135) | `LibOrder.Order` | Second order to match. |
| [`leftSignature`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinMatchOrders.sol#L136) | `bytes` | Proof that order was created by the left maker. |
| [`rightSignature`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinMatchOrders.sol#L137) | `bytes` | Proof that order was created by the right maker. |

***Returns***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`matchedFillResults`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinMatchOrders.sol#L142) | `LibFillResults.MatchedFillResults` | Amounts filled by maker and taker of matched orders. |

---
### `orderEpoch`
@dev Mapping of makerAddress => senderAddress => lowest salt an order can have in order to be fillable Orders with specified senderAddress and with a salt less than their epoch are considered cancelled / @param 0 Address of the order's maker. / @param 1 Address of the order's sender. / @return 0 Minimum valid order epoch.

• `orderEpoch(address, address): (uint256)` *(generated)*

&nbsp; *Defined in [contracts/exchange/contracts/src/MixinExchangeCore.sol:63](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinExchangeCore.sol#L63)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`0`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinExchangeCore.sol#L63) | `address` | Address of the order's maker. |
| [`1`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinExchangeCore.sol#L63) | `address` | Address of the order's sender. |

***Returns***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`0`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinExchangeCore.sol#L63) | `uint256` | Minimum valid order epoch. |

---
### `owner`
The owner of this contract.

• `owner(): (address)` *(generated)*

&nbsp; *Defined in [contracts/utils/contracts/src/Ownable.sol:31](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/utils/contracts/src/Ownable.sol#L31)*

***Returns***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`0`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/utils/contracts/src/Ownable.sol#L31) | `address` | The owner address. |

---
### `preSign`
Approves a hash on-chain. After presigning a hash, the preSign signature type will become valid for that hash and signer.

• `preSign(bytes32 hash)`

&nbsp; *Defined in [contracts/exchange/contracts/src/MixinSignatureValidator.sol:65](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinSignatureValidator.sol#L65)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`hash`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinSignatureValidator.sol#L65) | `bytes32` | Any 32-byte hash. |

---
### `preSigned`
Mapping of hash => signer => signed

• `preSigned(bytes32, address): (bool)` *(generated)*

&nbsp; *Defined in [contracts/exchange/contracts/src/MixinSignatureValidator.sol:54](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinSignatureValidator.sol#L54)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`0`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinSignatureValidator.sol#L54) | `bytes32` | Order hash. |
| [`1`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinSignatureValidator.sol#L54) | `address` | Signer address. |

***Returns***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`0`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinSignatureValidator.sol#L54) | `bool` | Whether the hash is presigned. |

---
### `protocolFeeCollector`
The address of the registered protocolFeeCollector contract -- the owner can update this field.

• `protocolFeeCollector(): (address)` *(generated)*

&nbsp; *Defined in [contracts/exchange/contracts/src/MixinProtocolFees.sol:38](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinProtocolFees.sol#L38)*

***Returns***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`0`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinProtocolFees.sol#L38) | `address` | Contract to forward protocol fees to. |

---
### `protocolFeeMultiplier`
The protocol fee multiplier -- the owner can update this field.

• `protocolFeeMultiplier(): (uint256)` *(generated)*

&nbsp; *Defined in [contracts/exchange/contracts/src/MixinProtocolFees.sol:34](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinProtocolFees.sol#L34)*

***Returns***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`0`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinProtocolFees.sol#L34) | `uint256` | Gas multplier. |

---
### `registerAssetProxy`
Registers an asset proxy to its asset proxy id. Once an asset proxy is registered, it cannot be unregistered.

• `registerAssetProxy(address assetProxy)`

&nbsp; *Defined in [contracts/exchange/contracts/src/MixinAssetProxyDispatcher.sol:41](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinAssetProxyDispatcher.sol#L41)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`assetProxy`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinAssetProxyDispatcher.sol#L41) | `address` | Address of new asset proxy to register. |

---
### `setProtocolFeeCollectorAddress`
Allows the owner to update the protocolFeeCollector address.

• `setProtocolFeeCollectorAddress(address updatedProtocolFeeCollector)`

&nbsp; *Defined in [contracts/exchange/contracts/src/MixinProtocolFees.sol:52](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinProtocolFees.sol#L52)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`updatedProtocolFeeCollector`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinProtocolFees.sol#L52) | `address` | The updated protocolFeeCollector contract address. |

---
### `setProtocolFeeMultiplier`
Allows the owner to update the protocol fee multiplier.

• `setProtocolFeeMultiplier(uint256 updatedProtocolFeeMultiplier)`

&nbsp; *Defined in [contracts/exchange/contracts/src/MixinProtocolFees.sol:42](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinProtocolFees.sol#L42)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`updatedProtocolFeeMultiplier`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinProtocolFees.sol#L42) | `uint256` | The updated protocol fee multiplier. |

---
### `setSignatureValidatorApproval`
Approves/unnapproves a Validator contract to verify signatures on signer's behalf using the `Validator` signature type.

• `setSignatureValidatorApproval(address validatorAddress, bool approval)`

&nbsp; *Defined in [contracts/exchange/contracts/src/MixinSignatureValidator.sol:78](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinSignatureValidator.sol#L78)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`validatorAddress`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinSignatureValidator.sol#L79) | `address` | Address of Validator contract. |
| [`approval`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinSignatureValidator.sol#L80) | `bool` | Approval or disapproval of  Validator contract. |

---
### `simulateDispatchTransferFromCalls`
This function may be used to simulate any amount of transfers As they would occur through the Exchange contract. Note that this function will always revert, even if all transfers are successful. However, it may be used with eth_call or with a try/catch pattern in order to simulate the results of the transfers.

• `simulateDispatchTransferFromCalls(bytes[] assetData, address[] fromAddresses, address[] toAddresses, uint256[] amounts)`

&nbsp; *Defined in [contracts/exchange/contracts/src/MixinTransferSimulator.sol:39](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinTransferSimulator.sol#L39)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`assetData`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinTransferSimulator.sol#L40) | `bytes[]` | Array of asset details, each encoded per the AssetProxy contract specification. |
| [`fromAddresses`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinTransferSimulator.sol#L41) | `address[]` | Array containing the `from` addresses that correspond with each transfer. |
| [`toAddresses`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinTransferSimulator.sol#L42) | `address[]` | Array containing the `to` addresses that correspond with each transfer. |
| [`amounts`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinTransferSimulator.sol#L43) | `uint256[]` | Array containing the amounts that correspond to each transfer. |

---
### `transactionsExecuted`
Mapping of transaction hash => executed This prevents transactions from being executed more than once.

• `transactionsExecuted(bytes32): (bool)` *(generated)*

&nbsp; *Defined in [contracts/exchange/contracts/src/MixinTransactions.sol:43](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinTransactions.sol#L43)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`0`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinTransactions.sol#L43) | `bytes32` | The transaction hash. |

***Returns***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`0`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange/contracts/src/MixinTransactions.sol#L43) | `bool` | Whether the transation was executed. |

---
### `transferOwnership`
Change the owner of this contract.

• `transferOwnership(address newOwner)`

&nbsp; *Defined in [contracts/utils/contracts/src/Ownable.sol:46](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/utils/contracts/src/Ownable.sol#L46)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`newOwner`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/utils/contracts/src/Ownable.sol#L46) | `address` | New owner address. |

# contract `Forwarder`


&nbsp; *Defined in [contracts/exchange-forwarder/contracts/src/Forwarder.sol:28](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-forwarder/contracts/src/Forwarder.sol#L28)*

## Events
### `OwnershipTransferred`
Emitted by Ownable when ownership is transferred.

• `OwnershipTransferred(address previousOwner, address newOwner)`

&nbsp; *Defined in [contracts/utils/contracts/src/interfaces/IOwnable.sol:27](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/utils/contracts/src/interfaces/IOwnable.sol#L27)*

***Parameters***

| Name | Type | Indexed | Description |
| ---- | ---- | ------- | ----------- |
| [`previousOwner`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/utils/contracts/src/interfaces/IOwnable.sol#L27) | `address` | `true` | The previous owner of the contract. |
| [`newOwner`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/utils/contracts/src/interfaces/IOwnable.sol#L27) | `address` | `true` | The new owner of the contract. |

## Methods
### `constructor`


• `constructor(address _exchange, address _weth)`

&nbsp; *Defined in [contracts/exchange-forwarder/contracts/src/Forwarder.sol:33](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-forwarder/contracts/src/Forwarder.sol#L33)*

***Parameters***

| Name | Type |
| ---- | ---- |
| [`_exchange`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-forwarder/contracts/src/Forwarder.sol#L34) | `address` |  |
| [`_weth`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-forwarder/contracts/src/Forwarder.sol#L35) | `address` |  |

---
### `approveMakerAssetProxy`
Approves the respective proxy for a given asset to transfer tokens on the Forwarder contract's behalf. This is necessary because an order fee denominated in the maker asset (i.e. a percentage fee) is sent by the Forwarder contract to the fee recipient. This method needs to be called before forwarding orders of a maker asset that hasn't previously been approved.

• `approveMakerAssetProxy(bytes assetData)`

&nbsp; *Defined in [contracts/exchange-forwarder/contracts/src/MixinAssets.sol:59](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-forwarder/contracts/src/MixinAssets.sol#L59)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`assetData`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-forwarder/contracts/src/MixinAssets.sol#L59) | `bytes` | Byte array encoded for the respective asset proxy. |

---
### `marketBuyOrdersWithEth`
Attempt to buy makerAssetBuyAmount of makerAsset by selling ETH provided with transaction. The Forwarder may *fill* more than makerAssetBuyAmount of the makerAsset so that it can pay takerFees where takerFeeAssetData == makerAssetData (i.e. percentage fees). Any ETH not spent will be refunded to sender.

• `marketBuyOrdersWithEth(LibOrder.Order[] orders, uint256 makerAssetBuyAmount, bytes[] signatures, uint256 feePercentage, payable feeRecipient): (uint256 wethSpentAmount, uint256 makerAssetAcquiredAmount, uint256 ethFeePaid)`

&nbsp; *Defined in [contracts/exchange-forwarder/contracts/src/MixinForwarderCore.sol:127](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-forwarder/contracts/src/MixinForwarderCore.sol#L127)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`orders`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-forwarder/contracts/src/MixinForwarderCore.sol#L128) | `LibOrder.Order[]` | Array of order specifications used containing desired makerAsset and WETH as takerAsset. |
| [`makerAssetBuyAmount`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-forwarder/contracts/src/MixinForwarderCore.sol#L129) | `uint256` | Desired amount of makerAsset to purchase. |
| [`signatures`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-forwarder/contracts/src/MixinForwarderCore.sol#L130) | `bytes[]` | Proofs that orders have been created by makers. |
| [`feePercentage`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-forwarder/contracts/src/MixinForwarderCore.sol#L131) | `uint256` | Percentage of WETH sold that will payed as fee to forwarding contract feeRecipient. |
| [`feeRecipient`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-forwarder/contracts/src/MixinForwarderCore.sol#L132) | `payable` | Address that will receive ETH when orders are filled. |

***Returns***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`wethSpentAmount`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-forwarder/contracts/src/MixinForwarderCore.sol#L137) | `uint256` | Amount of WETH spent on the given set of orders. |
| [`makerAssetAcquiredAmount`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-forwarder/contracts/src/MixinForwarderCore.sol#L138) | `uint256` | Amount of maker asset acquired from the given set of orders. |
| [`ethFeePaid`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-forwarder/contracts/src/MixinForwarderCore.sol#L139) | `uint256` | Amount of ETH spent on the given forwarder fee. |

---
### `marketSellOrdersWithEth`
Purchases as much of orders' makerAssets as possible by selling as much of the ETH value sent as possible, accounting for order and forwarder fees.

• `marketSellOrdersWithEth(LibOrder.Order[] orders, bytes[] signatures, uint256 feePercentage, payable feeRecipient): (uint256 wethSpentAmount, uint256 makerAssetAcquiredAmount, uint256 ethFeePaid)`

&nbsp; *Defined in [contracts/exchange-forwarder/contracts/src/MixinForwarderCore.sol:71](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-forwarder/contracts/src/MixinForwarderCore.sol#L71)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`orders`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-forwarder/contracts/src/MixinForwarderCore.sol#L72) | `LibOrder.Order[]` | Array of order specifications used containing desired makerAsset and WETH as takerAsset. |
| [`signatures`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-forwarder/contracts/src/MixinForwarderCore.sol#L73) | `bytes[]` | Proofs that orders have been created by makers. |
| [`feePercentage`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-forwarder/contracts/src/MixinForwarderCore.sol#L74) | `uint256` | Percentage of WETH sold that will payed as fee to forwarding contract feeRecipient. |
| [`feeRecipient`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-forwarder/contracts/src/MixinForwarderCore.sol#L75) | `payable` | Address that will receive ETH when orders are filled. |

***Returns***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`wethSpentAmount`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-forwarder/contracts/src/MixinForwarderCore.sol#L80) | `uint256` | Amount of WETH spent on the given set of orders. |
| [`makerAssetAcquiredAmount`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-forwarder/contracts/src/MixinForwarderCore.sol#L81) | `uint256` | Amount of maker asset acquired from the given set of orders. |
| [`ethFeePaid`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-forwarder/contracts/src/MixinForwarderCore.sol#L82) | `uint256` | Amount of ETH spent on the given forwarder fee. |

---
### `owner`
The owner of this contract.

• `owner(): (address)` *(generated)*

&nbsp; *Defined in [contracts/utils/contracts/src/Ownable.sol:31](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/utils/contracts/src/Ownable.sol#L31)*

***Returns***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`0`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/utils/contracts/src/Ownable.sol#L31) | `address` | The owner address. |

---
### `transferOwnership`
Change the owner of this contract.

• `transferOwnership(address newOwner)`

&nbsp; *Defined in [contracts/utils/contracts/src/Ownable.sol:46](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/utils/contracts/src/Ownable.sol#L46)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`newOwner`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/utils/contracts/src/Ownable.sol#L46) | `address` | New owner address. |

---
### `withdrawAsset`
Withdraws assets from this contract. It may be used by the owner to withdraw assets that were accidentally sent to this contract.

• `withdrawAsset(bytes assetData, uint256 amount)`

&nbsp; *Defined in [contracts/exchange-forwarder/contracts/src/MixinAssets.sol:43](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-forwarder/contracts/src/MixinAssets.sol#L43)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`assetData`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-forwarder/contracts/src/MixinAssets.sol#L44) | `bytes` | Byte array encoded for the respective asset proxy. |
| [`amount`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-forwarder/contracts/src/MixinAssets.sol#L45) | `uint256` | Amount of the asset to withdraw. |

# interface `IStructs`


&nbsp; *Defined in [contracts/staking/contracts/src/interfaces/IStructs.sol:21](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStructs.sol#L21)*

## Enums
### `IStructs.StakeStatus`
Statuses that stake can exist in. Any stake can be (re)delegated effective at the next epoch Undelegated stake can be withdrawn if it is available in both the current and next epoch

&nbsp; *Defined in [contracts/staking/contracts/src/interfaces/IStructs.sol:65](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStructs.sol#L65)*

***Members***

| Name | Value |
| ---- | ----- |
| [`UNDELEGATED`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStructs.sol#L66) | `0` |  |
| [`DELEGATED`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStructs.sol#L67) | `1` |  |

## Structs
### `IStructs.Pool`
Holds the metadata for a staking pool.

&nbsp; *Defined in [contracts/staking/contracts/src/interfaces/IStructs.sol:89](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStructs.sol#L89)*

***Fields***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`operator`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStructs.sol#L90) | `address` | Operator of the pool. |
| [`operatorShare`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStructs.sol#L91) | `uint32` | Fraction of the total balance owned by the operator, in ppm. |

---
### `IStructs.PoolStats`
Stats for a pool that earned rewards.

&nbsp; *Defined in [contracts/staking/contracts/src/interfaces/IStructs.sol:28](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStructs.sol#L28)*

***Fields***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`feesCollected`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStructs.sol#L29) | `uint256` | Fees collected in ETH by this pool. |
| [`weightedStake`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStructs.sol#L30) | `uint256` | Amount of weighted stake in the pool. |
| [`membersStake`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStructs.sol#L31) | `uint256` | Amount of non-operator stake in the pool. |

---
### `IStructs.StakeInfo`
Info used to describe a status.

&nbsp; *Defined in [contracts/staking/contracts/src/interfaces/IStructs.sol:73](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStructs.sol#L73)*

***Fields***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`status`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStructs.sol#L74) | `IStructs.StakeStatus` | Status of the stake. |
| [`poolId`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStructs.sol#L75) | `bytes32` | Unique Id of pool. This is set when status=DELEGATED. |

---
### `IStructs.StoredBalance`
Encapsulates a balance for the current and next epochs. Note that these balances may be stale if the current epoch is greater than `currentEpoch`.

&nbsp; *Defined in [contracts/staking/contracts/src/interfaces/IStructs.sol:56](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStructs.sol#L56)*

***Fields***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`currentEpoch`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStructs.sol#L57) | `uint64` | The current epoch |
| [`currentEpochBalance`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStructs.sol#L58) | `uint96` | Balance in the current epoch. |
| [`nextEpochBalance`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStructs.sol#L59) | `uint96` | Balance in `currentEpoch+1`. |

# library `LibFillResults`


&nbsp; *Defined in [contracts/exchange-libs/contracts/src/LibFillResults.sol:25](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-libs/contracts/src/LibFillResults.sol#L25)*

## Structs
### `LibFillResults.BatchMatchedFillResults`


&nbsp; *Defined in [contracts/exchange-libs/contracts/src/LibFillResults.sol:30](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-libs/contracts/src/LibFillResults.sol#L30)*

***Fields***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`left`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-libs/contracts/src/LibFillResults.sol#L31) | `LibFillResults.FillResults[]` | Fill results for left orders |
| [`right`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-libs/contracts/src/LibFillResults.sol#L32) | `LibFillResults.FillResults[]` | Fill results for right orders |
| [`profitInLeftMakerAsset`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-libs/contracts/src/LibFillResults.sol#L33) | `uint256` | Profit taken from left makers |
| [`profitInRightMakerAsset`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-libs/contracts/src/LibFillResults.sol#L34) | `uint256` | Profit taken from right makers |

---
### `LibFillResults.FillResults`


&nbsp; *Defined in [contracts/exchange-libs/contracts/src/LibFillResults.sol:37](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-libs/contracts/src/LibFillResults.sol#L37)*

***Fields***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`makerAssetFilledAmount`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-libs/contracts/src/LibFillResults.sol#L38) | `uint256` | Total amount of makerAsset(s) filled. |
| [`takerAssetFilledAmount`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-libs/contracts/src/LibFillResults.sol#L39) | `uint256` | Total amount of takerAsset(s) filled. |
| [`makerFeePaid`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-libs/contracts/src/LibFillResults.sol#L40) | `uint256` | Total amount of fees paid by maker(s) to feeRecipient(s). |
| [`takerFeePaid`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-libs/contracts/src/LibFillResults.sol#L41) | `uint256` | Total amount of fees paid by taker to feeRecipients(s). |
| [`protocolFeePaid`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-libs/contracts/src/LibFillResults.sol#L42) | `uint256` | Total amount of fees paid by taker to the staking contract. |

---
### `LibFillResults.MatchedFillResults`


&nbsp; *Defined in [contracts/exchange-libs/contracts/src/LibFillResults.sol:45](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-libs/contracts/src/LibFillResults.sol#L45)*

***Fields***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`left`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-libs/contracts/src/LibFillResults.sol#L46) | `LibFillResults.FillResults` | Amounts filled and fees paid of left order. |
| [`right`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-libs/contracts/src/LibFillResults.sol#L47) | `LibFillResults.FillResults` | Amounts filled and fees paid of right order. |
| [`profitInLeftMakerAsset`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-libs/contracts/src/LibFillResults.sol#L48) | `uint256` | Profit taken from the left maker |
| [`profitInRightMakerAsset`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-libs/contracts/src/LibFillResults.sol#L49) | `uint256` | Profit taken from the right maker |

# library `LibOrder`


&nbsp; *Defined in [contracts/exchange-libs/contracts/src/LibOrder.sol:23](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-libs/contracts/src/LibOrder.sol#L23)*

## Enums
### `LibOrder.OrderStatus`
A valid order remains fillable until it is expired, fully filled, or cancelled. An order's status is unaffected by external factors, like account balances.

&nbsp; *Defined in [contracts/exchange-libs/contracts/src/LibOrder.sol:52](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-libs/contracts/src/LibOrder.sol#L52)*

***Members***

| Name | Value | Description |
| ---- | ----- | ----------- |
| [`INVALID`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-libs/contracts/src/LibOrder.sol#L53) | `0` | Default value |
| [`INVALID_MAKER_ASSET_AMOUNT`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-libs/contracts/src/LibOrder.sol#L54) | `1` | Order does not have a valid maker asset amount |
| [`INVALID_TAKER_ASSET_AMOUNT`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-libs/contracts/src/LibOrder.sol#L55) | `2` | Order does not have a valid taker asset amount |
| [`FILLABLE`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-libs/contracts/src/LibOrder.sol#L56) | `3` | Order is fillable |
| [`EXPIRED`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-libs/contracts/src/LibOrder.sol#L57) | `4` | Order has already expired |
| [`FULLY_FILLED`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-libs/contracts/src/LibOrder.sol#L58) | `5` | Order is fully filled |
| [`CANCELLED`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-libs/contracts/src/LibOrder.sol#L59) | `6` | Order has been cancelled |

## Structs
### `LibOrder.Order`
Canonical order structure.

&nbsp; *Defined in [contracts/exchange-libs/contracts/src/LibOrder.sol:64](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-libs/contracts/src/LibOrder.sol#L64)*

***Fields***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`makerAddress`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-libs/contracts/src/LibOrder.sol#L65) | `address` | Address that created the order. |
| [`takerAddress`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-libs/contracts/src/LibOrder.sol#L66) | `address` | Address that is allowed to fill the order. If set to 0, any address is allowed to fill the order. |
| [`feeRecipientAddress`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-libs/contracts/src/LibOrder.sol#L67) | `address` | Address that will recieve fees when order is filled. |
| [`senderAddress`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-libs/contracts/src/LibOrder.sol#L68) | `address` | Address that is allowed to call Exchange contract methods that affect this order. If set to 0, any address is allowed to call these methods. |
| [`makerAssetAmount`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-libs/contracts/src/LibOrder.sol#L69) | `uint256` | Amount of makerAsset being offered by maker. Must be greater than 0. |
| [`takerAssetAmount`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-libs/contracts/src/LibOrder.sol#L70) | `uint256` | Amount of takerAsset being bid on by maker. Must be greater than 0. |
| [`makerFee`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-libs/contracts/src/LibOrder.sol#L71) | `uint256` | Fee paid to feeRecipient by maker when order is filled. |
| [`takerFee`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-libs/contracts/src/LibOrder.sol#L72) | `uint256` | Fee paid to feeRecipient by taker when order is filled. |
| [`expirationTimeSeconds`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-libs/contracts/src/LibOrder.sol#L73) | `uint256` | Timestamp in seconds at which order expires. |
| [`salt`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-libs/contracts/src/LibOrder.sol#L74) | `uint256` | Arbitrary number to facilitate uniqueness of the order's hash. |
| [`makerAssetData`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-libs/contracts/src/LibOrder.sol#L75) | `bytes` | Encoded data that can be decoded by a specified proxy contract when transferring makerAsset. The leading bytes4 references the id of the asset proxy. |
| [`takerAssetData`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-libs/contracts/src/LibOrder.sol#L76) | `bytes` | Encoded data that can be decoded by a specified proxy contract when transferring takerAsset. The leading bytes4 references the id of the asset proxy. |
| [`makerFeeAssetData`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-libs/contracts/src/LibOrder.sol#L77) | `bytes` | Encoded data that can be decoded by a specified proxy contract when transferring makerFeeAsset. The leading bytes4 references the id of the asset proxy. |
| [`takerFeeAssetData`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-libs/contracts/src/LibOrder.sol#L78) | `bytes` | Encoded data that can be decoded by a specified proxy contract when transferring takerFeeAsset. The leading bytes4 references the id of the asset proxy. |

---
### `LibOrder.OrderInfo`
Order information returned by `getOrderInfo()`.

&nbsp; *Defined in [contracts/exchange-libs/contracts/src/LibOrder.sol:83](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-libs/contracts/src/LibOrder.sol#L83)*

***Fields***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`orderStatus`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-libs/contracts/src/LibOrder.sol#L84) | `LibOrder.OrderStatus` | Status that describes order's validity and fillability. |
| [`orderHash`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-libs/contracts/src/LibOrder.sol#L85) | `bytes32` | EIP712 typed data hash of the order (see LibOrder.getTypedDataHash). |
| [`orderTakerAssetFilledAmount`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-libs/contracts/src/LibOrder.sol#L86) | `uint256` | Amount of order that has already been filled. |

# library `LibZeroExTransaction`


&nbsp; *Defined in [contracts/exchange-libs/contracts/src/LibZeroExTransaction.sol:24](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-libs/contracts/src/LibZeroExTransaction.sol#L24)*

## Structs
### `LibZeroExTransaction.ZeroExTransaction`


&nbsp; *Defined in [contracts/exchange-libs/contracts/src/LibZeroExTransaction.sol:41](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-libs/contracts/src/LibZeroExTransaction.sol#L41)*

***Fields***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`salt`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-libs/contracts/src/LibZeroExTransaction.sol#L42) | `uint256` | Arbitrary number to ensure uniqueness of transaction hash. |
| [`expirationTimeSeconds`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-libs/contracts/src/LibZeroExTransaction.sol#L43) | `uint256` | Timestamp in seconds at which transaction expires. |
| [`gasPrice`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-libs/contracts/src/LibZeroExTransaction.sol#L44) | `uint256` | gasPrice that transaction is required to be executed with. |
| [`signerAddress`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-libs/contracts/src/LibZeroExTransaction.sol#L45) | `address` | Address of transaction signer. |
| [`data`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/exchange-libs/contracts/src/LibZeroExTransaction.sol#L46) | `bytes` | AbiV2 encoded calldata. |

# contract `Staking`


&nbsp; *Defined in [contracts/staking/contracts/src/Staking.sol:27](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/Staking.sol#L27)*

## Events
### `AuthorizedAddressAdded`


• `AuthorizedAddressAdded(address target, address caller)`

&nbsp; *Defined in [contracts/utils/contracts/src/interfaces/IAuthorizable.sol:28](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/utils/contracts/src/interfaces/IAuthorizable.sol#L28)*

***Parameters***

| Name | Type | Indexed |
| ---- | ---- | ------- |
| [`target`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/utils/contracts/src/interfaces/IAuthorizable.sol#L29) | `address` | `true` |  |
| [`caller`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/utils/contracts/src/interfaces/IAuthorizable.sol#L30) | `address` | `true` |  |

---
### `AuthorizedAddressRemoved`


• `AuthorizedAddressRemoved(address target, address caller)`

&nbsp; *Defined in [contracts/utils/contracts/src/interfaces/IAuthorizable.sol:34](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/utils/contracts/src/interfaces/IAuthorizable.sol#L34)*

***Parameters***

| Name | Type | Indexed |
| ---- | ---- | ------- |
| [`target`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/utils/contracts/src/interfaces/IAuthorizable.sol#L35) | `address` | `true` |  |
| [`caller`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/utils/contracts/src/interfaces/IAuthorizable.sol#L36) | `address` | `true` |  |

---
### `EpochEnded`
Emitted by MixinFinalizer when an epoch has ended.

• `EpochEnded(uint256 epoch, uint256 numPoolsToFinalize, uint256 rewardsAvailable, uint256 totalFeesCollected, uint256 totalWeightedStake)`

&nbsp; *Defined in [contracts/staking/contracts/src/interfaces/IStakingEvents.sol:60](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStakingEvents.sol#L60)*

***Parameters***

| Name | Type | Indexed | Description |
| ---- | ---- | ------- | ----------- |
| [`epoch`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStakingEvents.sol#L61) | `uint256` | `true` | The epoch that ended. |
| [`numPoolsToFinalize`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStakingEvents.sol#L62) | `uint256` | `false` | Number of pools that earned rewards during `epoch` and must be finalized. |
| [`rewardsAvailable`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStakingEvents.sol#L63) | `uint256` | `false` | Rewards available to all pools that earned rewards during `epoch`. |
| [`totalFeesCollected`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStakingEvents.sol#L64) | `uint256` | `false` | Total fees collected across all pools that earned rewards during `epoch`. |
| [`totalWeightedStake`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStakingEvents.sol#L65) | `uint256` | `false` | Total weighted stake across all pools that earned rewards during `epoch`. |

---
### `EpochFinalized`
Emitted by MixinFinalizer when an epoch is fully finalized.

• `EpochFinalized(uint256 epoch, uint256 rewardsPaid, uint256 rewardsRemaining)`

&nbsp; *Defined in [contracts/staking/contracts/src/interfaces/IStakingEvents.sol:72](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStakingEvents.sol#L72)*

***Parameters***

| Name | Type | Indexed | Description |
| ---- | ---- | ------- | ----------- |
| [`epoch`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStakingEvents.sol#L73) | `uint256` | `true` | The epoch being finalized. |
| [`rewardsPaid`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStakingEvents.sol#L74) | `uint256` | `false` | Total amount of rewards paid out. |
| [`rewardsRemaining`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStakingEvents.sol#L75) | `uint256` | `false` | Rewards left over. |

---
### `ExchangeAdded`
Emitted by MixinExchangeManager when an exchange is added.

• `ExchangeAdded(address exchangeAddress)`

&nbsp; *Defined in [contracts/staking/contracts/src/interfaces/IStakingEvents.sol:36](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStakingEvents.sol#L36)*

***Parameters***

| Name | Type | Indexed | Description |
| ---- | ---- | ------- | ----------- |
| [`exchangeAddress`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStakingEvents.sol#L37) | `address` | `false` | Address of new exchange. |

---
### `ExchangeRemoved`
Emitted by MixinExchangeManager when an exchange is removed.

• `ExchangeRemoved(address exchangeAddress)`

&nbsp; *Defined in [contracts/staking/contracts/src/interfaces/IStakingEvents.sol:42](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStakingEvents.sol#L42)*

***Parameters***

| Name | Type | Indexed | Description |
| ---- | ---- | ------- | ----------- |
| [`exchangeAddress`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStakingEvents.sol#L43) | `address` | `false` | Address of removed exchange. |

---
### `MakerStakingPoolSet`
Emitted by MixinStakingPool when a maker sets their pool.

• `MakerStakingPoolSet(address makerAddress, bytes32 poolId)`

&nbsp; *Defined in [contracts/staking/contracts/src/interfaces/IStakingEvents.sol:117](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStakingEvents.sol#L117)*

***Parameters***

| Name | Type | Indexed | Description |
| ---- | ---- | ------- | ----------- |
| [`makerAddress`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStakingEvents.sol#L118) | `address` | `true` | Adress of maker added to pool. |
| [`poolId`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStakingEvents.sol#L119) | `bytes32` | `true` | Unique id of pool. |

---
### `MoveStake`
Emitted by MixinStake when ZRX is unstaked.

• `MoveStake(address staker, uint256 amount, uint8 fromStatus, bytes32 fromPool, uint8 toStatus, bytes32 toPool)`

&nbsp; *Defined in [contracts/staking/contracts/src/interfaces/IStakingEvents.sol:25](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStakingEvents.sol#L25)*

***Parameters***

| Name | Type | Indexed |
| ---- | ---- | ------- |
| [`staker`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStakingEvents.sol#L26) | `address` | `true` | of ZRX. |
| [`amount`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStakingEvents.sol#L27) | `uint256` | `false` | of ZRX unstaked. |
| [`fromStatus`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStakingEvents.sol#L28) | `uint8` | `false` |  |
| [`toStatus`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStakingEvents.sol#L30) | `uint8` | `false` |  |
| [`toPool`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStakingEvents.sol#L31) | `bytes32` | `true` |  |

---
### `OperatorShareDecreased`
Emitted when a staking pool's operator share is decreased.

• `OperatorShareDecreased(bytes32 poolId, uint32 oldOperatorShare, uint32 newOperatorShare)`

&nbsp; *Defined in [contracts/staking/contracts/src/interfaces/IStakingEvents.sol:126](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStakingEvents.sol#L126)*

***Parameters***

| Name | Type | Indexed | Description |
| ---- | ---- | ------- | ----------- |
| [`poolId`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStakingEvents.sol#L127) | `bytes32` | `true` | Unique Id of pool. |
| [`oldOperatorShare`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStakingEvents.sol#L128) | `uint32` | `false` | Previous share of rewards owned by operator. |
| [`newOperatorShare`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStakingEvents.sol#L129) | `uint32` | `false` | Newly decreased share of rewards owned by operator. |

---
### `OwnershipTransferred`
Emitted by Ownable when ownership is transferred.

• `OwnershipTransferred(address previousOwner, address newOwner)`

&nbsp; *Defined in [contracts/utils/contracts/src/interfaces/IOwnable.sol:27](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/utils/contracts/src/interfaces/IOwnable.sol#L27)*

***Parameters***

| Name | Type | Indexed | Description |
| ---- | ---- | ------- | ----------- |
| [`previousOwner`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/utils/contracts/src/interfaces/IOwnable.sol#L27) | `address` | `true` | The previous owner of the contract. |
| [`newOwner`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/utils/contracts/src/interfaces/IOwnable.sol#L27) | `address` | `true` | The new owner of the contract. |

---
### `ParamsSet`
Emitted whenever staking parameters are changed via the `setParams()` function.

• `ParamsSet(uint256 epochDurationInSeconds, uint32 rewardDelegatedStakeWeight, uint256 minimumPoolStake, uint256 cobbDouglasAlphaNumerator, uint256 cobbDouglasAlphaDenominator)`

&nbsp; *Defined in [contracts/staking/contracts/src/interfaces/IStakingEvents.sol:96](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStakingEvents.sol#L96)*

***Parameters***

| Name | Type | Indexed | Description |
| ---- | ---- | ------- | ----------- |
| [`epochDurationInSeconds`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStakingEvents.sol#L97) | `uint256` | `false` | Minimum seconds between epochs. |
| [`rewardDelegatedStakeWeight`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStakingEvents.sol#L98) | `uint32` | `false` | How much delegated stake is weighted vs operator stake, in ppm. |
| [`minimumPoolStake`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStakingEvents.sol#L99) | `uint256` | `false` | Minimum amount of stake required in a pool to collect rewards. |
| [`cobbDouglasAlphaNumerator`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStakingEvents.sol#L100) | `uint256` | `false` | Numerator for cobb douglas alpha factor. |
| [`cobbDouglasAlphaDenominator`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStakingEvents.sol#L101) | `uint256` | `false` | Denominator for cobb douglas alpha factor. |

---
### `RewardsPaid`
Emitted by MixinFinalizer when rewards are paid out to a pool.

• `RewardsPaid(uint256 epoch, bytes32 poolId, uint256 operatorReward, uint256 membersReward)`

&nbsp; *Defined in [contracts/staking/contracts/src/interfaces/IStakingEvents.sol:83](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStakingEvents.sol#L83)*

***Parameters***

| Name | Type | Indexed | Description |
| ---- | ---- | ------- | ----------- |
| [`epoch`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStakingEvents.sol#L84) | `uint256` | `true` | The epoch when the rewards were paid out. |
| [`poolId`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStakingEvents.sol#L85) | `bytes32` | `true` | The pool's ID. |
| [`operatorReward`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStakingEvents.sol#L86) | `uint256` | `false` | Amount of reward paid to pool operator. |
| [`membersReward`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStakingEvents.sol#L87) | `uint256` | `false` | Amount of reward paid to pool members. |

---
### `Stake`
Emitted by MixinStake when ZRX is staked.

• `Stake(address staker, uint256 amount)`

&nbsp; *Defined in [contracts/staking/contracts/src/interfaces/IStakingEvents.sol:9](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStakingEvents.sol#L9)*

***Parameters***

| Name | Type | Indexed | Description |
| ---- | ---- | ------- | ----------- |
| [`staker`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStakingEvents.sol#L10) | `address` | `true` | of ZRX. |
| [`amount`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStakingEvents.sol#L11) | `uint256` | `false` | of ZRX staked. |

---
### `StakingPoolCreated`
Emitted by MixinStakingPool when a new pool is created.

• `StakingPoolCreated(bytes32 poolId, address operator, uint32 operatorShare)`

&nbsp; *Defined in [contracts/staking/contracts/src/interfaces/IStakingEvents.sol:108](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStakingEvents.sol#L108)*

***Parameters***

| Name | Type | Indexed | Description |
| ---- | ---- | ------- | ----------- |
| [`poolId`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStakingEvents.sol#L109) | `bytes32` | `false` | Unique id generated for pool. |
| [`operator`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStakingEvents.sol#L110) | `address` | `false` | The operator (creator) of pool. |
| [`operatorShare`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStakingEvents.sol#L111) | `uint32` | `false` | The share of rewards given to the operator, in ppm. |

---
### `StakingPoolEarnedRewardsInEpoch`
Emitted by MixinExchangeFees when a pool starts earning rewards in an epoch.

• `StakingPoolEarnedRewardsInEpoch(uint256 epoch, bytes32 poolId)`

&nbsp; *Defined in [contracts/staking/contracts/src/interfaces/IStakingEvents.sol:49](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStakingEvents.sol#L49)*

***Parameters***

| Name | Type | Indexed | Description |
| ---- | ---- | ------- | ----------- |
| [`epoch`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStakingEvents.sol#L50) | `uint256` | `true` | The epoch in which the pool earned rewards. |
| [`poolId`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStakingEvents.sol#L51) | `bytes32` | `true` | The ID of the pool. |

---
### `Unstake`
Emitted by MixinStake when ZRX is unstaked.

• `Unstake(address staker, uint256 amount)`

&nbsp; *Defined in [contracts/staking/contracts/src/interfaces/IStakingEvents.sol:17](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStakingEvents.sol#L17)*

***Parameters***

| Name | Type | Indexed | Description |
| ---- | ---- | ------- | ----------- |
| [`staker`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStakingEvents.sol#L18) | `address` | `true` | of ZRX. |
| [`amount`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/interfaces/IStakingEvents.sol#L19) | `uint256` | `false` | of ZRX unstaked. |

## Methods
### `constructor`
Initializes the `owner` address.

• `constructor()`

&nbsp; *Defined in [contracts/utils/contracts/src/Authorizable.sol:48](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/utils/contracts/src/Authorizable.sol#L48)*

---
### `addAuthorizedAddress`
Authorizes an address.

• `addAuthorizedAddress(address target)`

&nbsp; *Defined in [contracts/utils/contracts/src/Authorizable.sol:55](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/utils/contracts/src/Authorizable.sol#L55)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`target`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/utils/contracts/src/Authorizable.sol#L55) | `address` | Address to authorize. |

---
### `addExchangeAddress`
Adds a new exchange address

• `addExchangeAddress(address addr)`

&nbsp; *Defined in [contracts/staking/contracts/src/fees/MixinExchangeManager.sol:43](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/fees/MixinExchangeManager.sol#L43)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`addr`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/fees/MixinExchangeManager.sol#L43) | `address` | Address of exchange contract to add |

---
### `aggregatedStatsByEpoch`
Aggregated stats across all pools that generated fees with sufficient stake to earn rewards. See `_minimumPoolStake` in MixinParams.

• `aggregatedStatsByEpoch(uint256): (struct IStructs.AggregatedStats)` *(generated)*

&nbsp; *Defined in [contracts/staking/contracts/src/immutable/MixinStorage.sol:114](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/immutable/MixinStorage.sol#L114)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`0`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/immutable/MixinStorage.sol#L114) | `uint256` | Epoch number. |

***Returns***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`0`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/immutable/MixinStorage.sol#L114) | `struct IStructs.AggregatedStats` | Reward computation stats. |

---
### `authorities`
Whether an adderss is authorized to call privileged functions.

• `authorities(uint256): (address)` *(generated)*

&nbsp; *Defined in [contracts/utils/contracts/src/Authorizable.sol:45](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/utils/contracts/src/Authorizable.sol#L45)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`0`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/utils/contracts/src/Authorizable.sol#L45) | `uint256` | Index of authorized address. |

***Returns***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`0`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/utils/contracts/src/Authorizable.sol#L45) | `address` | Authorized address. |

---
### `authorized`
Whether an adderss is authorized to call privileged functions.

• `authorized(address): (bool)` *(generated)*

&nbsp; *Defined in [contracts/utils/contracts/src/Authorizable.sol:41](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/utils/contracts/src/Authorizable.sol#L41)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`0`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/utils/contracts/src/Authorizable.sol#L41) | `address` | Address to query. |

***Returns***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`0`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/utils/contracts/src/Authorizable.sol#L41) | `bool` | Whether the address is authorized. |

---
### `cobbDouglasAlphaDenominator`
Denominator for cobb douglas alpha factor.

• `cobbDouglasAlphaDenominator(): (uint32)` *(generated)*

&nbsp; *Defined in [contracts/staking/contracts/src/immutable/MixinStorage.sol:99](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/immutable/MixinStorage.sol#L99)*

***Returns***

| Name | Type |
| ---- | ---- |
| [`0`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/immutable/MixinStorage.sol#L99) | `uint32` |  |

---
### `cobbDouglasAlphaNumerator`
Numerator for cobb douglas alpha factor.

• `cobbDouglasAlphaNumerator(): (uint32)` *(generated)*

&nbsp; *Defined in [contracts/staking/contracts/src/immutable/MixinStorage.sol:96](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/immutable/MixinStorage.sol#L96)*

***Returns***

| Name | Type |
| ---- | ---- |
| [`0`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/immutable/MixinStorage.sol#L96) | `uint32` |  |

---
### `computeRewardBalanceOfDelegator`
Computes the reward balance in ETH of a specific member of a pool.

• `computeRewardBalanceOfDelegator(bytes32 poolId, address member): (uint256 reward)`

&nbsp; *Defined in [contracts/staking/contracts/src/staking_pools/MixinStakingPoolRewards.sol:72](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/staking_pools/MixinStakingPoolRewards.sol#L72)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`poolId`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/staking_pools/MixinStakingPoolRewards.sol#L72) | `bytes32` | Unique id of pool. |
| [`member`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/staking_pools/MixinStakingPoolRewards.sol#L72) | `address` | The member of the pool. |

***Returns***

| Name | Type |
| ---- | ---- |
| [`reward`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/staking_pools/MixinStakingPoolRewards.sol#L75) | `uint256` |  |

---
### `computeRewardBalanceOfOperator`
Computes the reward balance in ETH of the operator of a pool.

• `computeRewardBalanceOfOperator(bytes32 poolId): (uint256 reward)`

&nbsp; *Defined in [contracts/staking/contracts/src/staking_pools/MixinStakingPoolRewards.sol:46](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/staking_pools/MixinStakingPoolRewards.sol#L46)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`poolId`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/staking_pools/MixinStakingPoolRewards.sol#L46) | `bytes32` | Unique id of pool. |

***Returns***

| Name | Type |
| ---- | ---- |
| [`reward`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/staking_pools/MixinStakingPoolRewards.sol#L49) | `uint256` |  |

---
### `createStakingPool`
Create a new staking pool. The sender will be the operator of this pool. Note that an operator must be payable.

• `createStakingPool(uint32 operatorShare, bool addOperatorAsMaker): (bytes32 poolId)`

&nbsp; *Defined in [contracts/staking/contracts/src/staking_pools/MixinStakingPool.sol:49](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/staking_pools/MixinStakingPool.sol#L49)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`operatorShare`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/staking_pools/MixinStakingPool.sol#L49) | `uint32` | Portion of rewards owned by the operator, in ppm. |
| [`addOperatorAsMaker`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/staking_pools/MixinStakingPool.sol#L49) | `bool` | Adds operator to the created pool as a maker for convenience iff true. |

***Returns***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`poolId`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/staking_pools/MixinStakingPool.sol#L51) | `bytes32` | The unique pool id generated for this pool. |

---
### `currentEpoch`
The current epoch.

• `currentEpoch(): (uint256)` *(generated)*

&nbsp; *Defined in [contracts/staking/contracts/src/immutable/MixinStorage.sol:68](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/immutable/MixinStorage.sol#L68)*

***Returns***

| Name | Type |
| ---- | ---- |
| [`0`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/immutable/MixinStorage.sol#L68) | `uint256` |  |

---
### `currentEpochStartTimeInSeconds`
The current epoch start time.

• `currentEpochStartTimeInSeconds(): (uint256)` *(generated)*

&nbsp; *Defined in [contracts/staking/contracts/src/immutable/MixinStorage.sol:71](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/immutable/MixinStorage.sol#L71)*

***Returns***

| Name | Type |
| ---- | ---- |
| [`0`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/immutable/MixinStorage.sol#L71) | `uint256` |  |

---
### `decreaseStakingPoolOperatorShare`
Decreases the operator share for the given pool (i.e. increases pool rewards for members).

• `decreaseStakingPoolOperatorShare(bytes32 poolId, uint32 newOperatorShare)`

&nbsp; *Defined in [contracts/staking/contracts/src/staking_pools/MixinStakingPool.sol:86](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/staking_pools/MixinStakingPool.sol#L86)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`poolId`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/staking_pools/MixinStakingPool.sol#L86) | `bytes32` | Unique Id of pool. |
| [`newOperatorShare`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/staking_pools/MixinStakingPool.sol#L86) | `uint32` | The newly decreased percentage of any rewards owned by the operator. |

---
### `endEpoch`
Begins a new epoch, preparing the prior one for finalization. Throws if not enough time has passed between epochs or if the previous epoch was not fully finalized.

• `endEpoch(): (uint256)`

&nbsp; *Defined in [contracts/staking/contracts/src/sys/MixinFinalizer.sol:39](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/sys/MixinFinalizer.sol#L39)*

***Returns***

| Name | Type |
| ---- | ---- |
| [`0`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/sys/MixinFinalizer.sol#L41) | `uint256` |  |

---
### `epochDurationInSeconds`
Minimum seconds between epochs.

• `epochDurationInSeconds(): (uint256)` *(generated)*

&nbsp; *Defined in [contracts/staking/contracts/src/immutable/MixinStorage.sol:87](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/immutable/MixinStorage.sol#L87)*

***Returns***

| Name | Type |
| ---- | ---- |
| [`0`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/immutable/MixinStorage.sol#L87) | `uint256` |  |

---
### `finalizePool`
Instantly finalizes a single pool that earned rewards in the previous epoch, crediting it rewards for members and withdrawing operator's rewards as WETH. This can be called by internal functions that need to finalize a pool immediately. Does nothing if the pool is already finalized or did not earn rewards in the previous epoch.

• `finalizePool(bytes32 poolId)`

&nbsp; *Defined in [contracts/staking/contracts/src/sys/MixinFinalizer.sol:90](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/sys/MixinFinalizer.sol#L90)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`poolId`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/sys/MixinFinalizer.sol#L90) | `bytes32` | The pool ID to finalize. |

---
### `getAuthorizedAddresses`
Gets all authorized addresses.

• `getAuthorizedAddresses(): (address[])`

&nbsp; *Defined in [contracts/utils/contracts/src/Authorizable.sol:94](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/utils/contracts/src/Authorizable.sol#L94)*

***Returns***

| Name | Type |
| ---- | ---- |
| [`0`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/utils/contracts/src/Authorizable.sol#L97) | `address[]` |  |

---
### `getCurrentEpochEarliestEndTimeInSeconds`
Returns the earliest end time in seconds of this epoch. The next epoch can begin once this time is reached. Epoch period = [startTimeInSeconds..endTimeInSeconds)

• `getCurrentEpochEarliestEndTimeInSeconds(): (uint256)`

&nbsp; *Defined in [contracts/staking/contracts/src/sys/MixinScheduler.sol:38](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/sys/MixinScheduler.sol#L38)*

***Returns***

| Name | Type |
| ---- | ---- |
| [`0`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/sys/MixinScheduler.sol#L41) | `uint256` |  |

---
### `getGlobalStakeByStatus`
Gets global stake for a given status.

• `getGlobalStakeByStatus(IStructs.StakeStatus stakeStatus): (IStructs.StoredBalance balance)`

&nbsp; *Defined in [contracts/staking/contracts/src/stake/MixinStakeBalances.sol:37](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/stake/MixinStakeBalances.sol#L37)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`stakeStatus`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/stake/MixinStakeBalances.sol#L37) | `IStructs.StakeStatus` | UNDELEGATED or DELEGATED |

***Returns***

| Name | Type |
| ---- | ---- |
| [`balance`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/stake/MixinStakeBalances.sol#L40) | `IStructs.StoredBalance` |  |

---
### `getOwnerStakeByStatus`
Gets an owner's stake balances by status.

• `getOwnerStakeByStatus(address staker, IStructs.StakeStatus stakeStatus): (IStructs.StoredBalance balance)`

&nbsp; *Defined in [contracts/staking/contracts/src/stake/MixinStakeBalances.sol:59](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/stake/MixinStakeBalances.sol#L59)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`staker`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/stake/MixinStakeBalances.sol#L60) | `address` | Owner of stake. |
| [`stakeStatus`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/stake/MixinStakeBalances.sol#L61) | `IStructs.StakeStatus` | UNDELEGATED or DELEGATED |

***Returns***

| Name | Type |
| ---- | ---- |
| [`balance`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/stake/MixinStakeBalances.sol#L65) | `IStructs.StoredBalance` |  |

---
### `getParams`
Retrieves all configurable parameter values.

• `getParams(): (uint256 _epochDurationInSeconds, uint32 _rewardDelegatedStakeWeight, uint256 _minimumPoolStake, uint32 _cobbDouglasAlphaNumerator, uint32 _cobbDouglasAlphaDenominator)`

&nbsp; *Defined in [contracts/staking/contracts/src/sys/MixinParams.sol:69](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/sys/MixinParams.sol#L69)*

***Returns***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`_epochDurationInSeconds`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/sys/MixinParams.sol#L73) | `uint256` | Minimum seconds between epochs. |
| [`_rewardDelegatedStakeWeight`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/sys/MixinParams.sol#L74) | `uint32` | How much delegated stake is weighted vs operator stake, in ppm. |
| [`_minimumPoolStake`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/sys/MixinParams.sol#L75) | `uint256` | Minimum amount of stake required in a pool to collect rewards. |
| [`_cobbDouglasAlphaNumerator`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/sys/MixinParams.sol#L76) | `uint32` | Numerator for cobb douglas alpha factor. |
| [`_cobbDouglasAlphaDenominator`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/sys/MixinParams.sol#L77) | `uint32` | Denominator for cobb douglas alpha factor. |

---
### `getStakeDelegatedToPoolByOwner`
Returns the stake delegated to a specific staking pool, by a given staker.

• `getStakeDelegatedToPoolByOwner(address staker, bytes32 poolId): (IStructs.StoredBalance balance)`

&nbsp; *Defined in [contracts/staking/contracts/src/stake/MixinStakeBalances.sol:88](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/stake/MixinStakeBalances.sol#L88)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`staker`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/stake/MixinStakeBalances.sol#L88) | `address` | of stake. |
| [`poolId`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/stake/MixinStakeBalances.sol#L88) | `bytes32` | Unique Id of pool. |

***Returns***

| Name | Type |
| ---- | ---- |
| [`balance`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/stake/MixinStakeBalances.sol#L91) | `IStructs.StoredBalance` |  |

---
### `getStakingPool`
Returns a staking pool

• `getStakingPool(bytes32 poolId): (IStructs.Pool)`

&nbsp; *Defined in [contracts/staking/contracts/src/staking_pools/MixinStakingPool.sol:122](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/staking_pools/MixinStakingPool.sol#L122)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`poolId`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/staking_pools/MixinStakingPool.sol#L122) | `bytes32` | Unique id of pool. |

***Returns***

| Name | Type |
| ---- | ---- |
| [`0`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/staking_pools/MixinStakingPool.sol#L125) | `IStructs.Pool` |  |

---
### `getStakingPoolStatsThisEpoch`
Get stats on a staking pool in this epoch.

• `getStakingPoolStatsThisEpoch(bytes32 poolId): (IStructs.PoolStats)`

&nbsp; *Defined in [contracts/staking/contracts/src/fees/MixinExchangeFees.sol:117](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/fees/MixinExchangeFees.sol#L117)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`poolId`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/fees/MixinExchangeFees.sol#L117) | `bytes32` | Pool Id to query. |

***Returns***

| Name | Type |
| ---- | ---- |
| [`0`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/fees/MixinExchangeFees.sol#L120) | `IStructs.PoolStats` |  |

---
### `getTotalStake`
Returns the total stake for a given staker.

• `getTotalStake(address staker): (uint256)`

&nbsp; *Defined in [contracts/staking/contracts/src/stake/MixinStakeBalances.sol:76](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/stake/MixinStakeBalances.sol#L76)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`staker`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/stake/MixinStakeBalances.sol#L76) | `address` | of stake. |

***Returns***

| Name | Type |
| ---- | ---- |
| [`0`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/stake/MixinStakeBalances.sol#L79) | `uint256` |  |

---
### `getTotalStakeDelegatedToPool`
Returns the total stake delegated to a specific staking pool, across all members.

• `getTotalStakeDelegatedToPool(bytes32 poolId): (IStructs.StoredBalance balance)`

&nbsp; *Defined in [contracts/staking/contracts/src/stake/MixinStakeBalances.sol:101](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/stake/MixinStakeBalances.sol#L101)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`poolId`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/stake/MixinStakeBalances.sol#L101) | `bytes32` | Unique Id of pool. |

***Returns***

| Name | Type |
| ---- | ---- |
| [`balance`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/stake/MixinStakeBalances.sol#L104) | `IStructs.StoredBalance` |  |

---
### `getWethContract`
An overridable way to access the deployed WETH contract. Must be view to allow overrides to access state.

• `getWethContract(): (IEtherToken wethContract)`

&nbsp; *Defined in [contracts/staking/contracts/src/immutable/MixinDeploymentConstants.sol:56](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/immutable/MixinDeploymentConstants.sol#L56)*

***Returns***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`wethContract`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/immutable/MixinDeploymentConstants.sol#L59) | `IEtherToken` | The WETH contract instance. |

---
### `getZrxVault`
An overridable way to access the deployed zrxVault. Must be view to allow overrides to access state.

• `getZrxVault(): (IZrxVault zrxVault)`

&nbsp; *Defined in [contracts/staking/contracts/src/immutable/MixinDeploymentConstants.sol:68](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/immutable/MixinDeploymentConstants.sol#L68)*

***Returns***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`zrxVault`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/immutable/MixinDeploymentConstants.sol#L71) | `IZrxVault` | The zrxVault contract. |

---
### `init`
Initialize storage owned by this contract. This function should not be called directly. The StakingProxy contract will call it in `attachStakingContract()`.

• `init()`

&nbsp; *Defined in [contracts/staking/contracts/src/Staking.sol:37](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/Staking.sol#L37)*

---
### `joinStakingPoolAsMaker`
Allows caller to join a staking pool as a maker.

• `joinStakingPoolAsMaker(bytes32 poolId)`

&nbsp; *Defined in [contracts/staking/contracts/src/staking_pools/MixinStakingPool.sol:109](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/staking_pools/MixinStakingPool.sol#L109)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`poolId`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/staking_pools/MixinStakingPool.sol#L109) | `bytes32` | Unique id of pool. |

---
### `lastPoolId`
tracking Pool Id, a unique identifier for each staking pool.

• `lastPoolId(): (bytes32)` *(generated)*

&nbsp; *Defined in [contracts/staking/contracts/src/immutable/MixinStorage.sol:52](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/immutable/MixinStorage.sol#L52)*

***Returns***

| Name | Type |
| ---- | ---- |
| [`0`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/immutable/MixinStorage.sol#L52) | `bytes32` |  |

---
### `minimumPoolStake`
Minimum amount of stake required in a pool to collect rewards.

• `minimumPoolStake(): (uint256)` *(generated)*

&nbsp; *Defined in [contracts/staking/contracts/src/immutable/MixinStorage.sol:93](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/immutable/MixinStorage.sol#L93)*

***Returns***

| Name | Type |
| ---- | ---- |
| [`0`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/immutable/MixinStorage.sol#L93) | `uint256` |  |

---
### `moveStake`
Moves stake between statuses: 'undelegated' or 'delegated'. Delegated stake can also be moved between pools. This change comes into effect next epoch.

• `moveStake(IStructs.StakeInfo from, IStructs.StakeInfo to, uint256 amount)`

&nbsp; *Defined in [contracts/staking/contracts/src/stake/MixinStake.sol:105](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/stake/MixinStake.sol#L105)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`from`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/stake/MixinStake.sol#L106) | `IStructs.StakeInfo` | Status to move stake out of. |
| [`to`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/stake/MixinStake.sol#L107) | `IStructs.StakeInfo` | Status to move stake into. |
| [`amount`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/stake/MixinStake.sol#L108) | `uint256` | Amount of stake to move. |

---
### `owner`
The owner of this contract.

• `owner(): (address)` *(generated)*

&nbsp; *Defined in [contracts/utils/contracts/src/Ownable.sol:31](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/utils/contracts/src/Ownable.sol#L31)*

***Returns***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`0`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/utils/contracts/src/Ownable.sol#L31) | `address` | The owner address. |

---
### `payProtocolFee`
Pays a protocol fee in ETH or WETH. Only a known 0x exchange can call this method. See (MixinExchangeManager).

• `payProtocolFee(address makerAddress, address payerAddress, uint256 protocolFee)`

&nbsp; *Defined in [contracts/staking/contracts/src/fees/MixinExchangeFees.sol:45](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/fees/MixinExchangeFees.sol#L45)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`makerAddress`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/fees/MixinExchangeFees.sol#L46) | `address` | The address of the order's maker. |
| [`payerAddress`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/fees/MixinExchangeFees.sol#L47) | `address` | The address of the protocol fee payer. |
| [`protocolFee`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/fees/MixinExchangeFees.sol#L48) | `uint256` | The protocol fee amount. This is either passed as ETH or transferred as WETH. |

---
### `poolIdByMaker`
Mapping from Maker Address to pool Id of maker

• `poolIdByMaker(address): (bytes32)` *(generated)*

&nbsp; *Defined in [contracts/staking/contracts/src/immutable/MixinStorage.sol:57](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/immutable/MixinStorage.sol#L57)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`0`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/immutable/MixinStorage.sol#L57) | `address` | Maker address. |

***Returns***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`0`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/immutable/MixinStorage.sol#L57) | `bytes32` | The pool ID. |

---
### `poolStatsByEpoch`
Stats for each pool that generated fees with sufficient stake to earn rewards. See `_minimumPoolStake` in `MixinParams`.

• `poolStatsByEpoch(bytes32, uint256): (struct IStructs.PoolStats)` *(generated)*

&nbsp; *Defined in [contracts/staking/contracts/src/immutable/MixinStorage.sol:108](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/immutable/MixinStorage.sol#L108)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`0`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/immutable/MixinStorage.sol#L108) | `bytes32` | Pool ID. |
| [`1`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/immutable/MixinStorage.sol#L108) | `uint256` | Epoch number. |

***Returns***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`0`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/immutable/MixinStorage.sol#L108) | `struct IStructs.PoolStats` | Pool fee stats. |

---
### `removeAuthorizedAddress`
Removes authorizion of an address.

• `removeAuthorizedAddress(address target)`

&nbsp; *Defined in [contracts/utils/contracts/src/Authorizable.sol:64](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/utils/contracts/src/Authorizable.sol#L64)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`target`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/utils/contracts/src/Authorizable.sol#L64) | `address` | Address to remove authorization from. |

---
### `removeAuthorizedAddressAtIndex`
Removes authorizion of an address.

• `removeAuthorizedAddressAtIndex(address target, uint256 index)`

&nbsp; *Defined in [contracts/utils/contracts/src/Authorizable.sol:82](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/utils/contracts/src/Authorizable.sol#L82)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`target`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/utils/contracts/src/Authorizable.sol#L83) | `address` | Address to remove authorization from. |
| [`index`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/utils/contracts/src/Authorizable.sol#L84) | `uint256` | Index of target in authorities array. |

---
### `removeExchangeAddress`
Removes an existing exchange address

• `removeExchangeAddress(address addr)`

&nbsp; *Defined in [contracts/staking/contracts/src/fees/MixinExchangeManager.sol:59](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/fees/MixinExchangeManager.sol#L59)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`addr`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/fees/MixinExchangeManager.sol#L59) | `address` | Address of exchange contract to remove |

---
### `rewardDelegatedStakeWeight`
How much delegated stake is weighted vs operator stake, in ppm.

• `rewardDelegatedStakeWeight(): (uint32)` *(generated)*

&nbsp; *Defined in [contracts/staking/contracts/src/immutable/MixinStorage.sol:90](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/immutable/MixinStorage.sol#L90)*

***Returns***

| Name | Type |
| ---- | ---- |
| [`0`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/immutable/MixinStorage.sol#L90) | `uint32` |  |

---
### `rewardsByPoolId`
mapping from pool ID to reward balance of members

• `rewardsByPoolId(bytes32): (uint256)` *(generated)*

&nbsp; *Defined in [contracts/staking/contracts/src/immutable/MixinStorage.sol:65](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/immutable/MixinStorage.sol#L65)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`0`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/immutable/MixinStorage.sol#L65) | `bytes32` | Pool ID. |

***Returns***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`0`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/immutable/MixinStorage.sol#L65) | `uint256` | The total reward balance of members in this pool. |

---
### `setParams`
Set all configurable parameters at once.

• `setParams(uint256 _epochDurationInSeconds, uint32 _rewardDelegatedStakeWeight, uint256 _minimumPoolStake, uint32 _cobbDouglasAlphaNumerator, uint32 _cobbDouglasAlphaDenominator)`

&nbsp; *Defined in [contracts/staking/contracts/src/sys/MixinParams.sol:40](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/sys/MixinParams.sol#L40)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`_epochDurationInSeconds`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/sys/MixinParams.sol#L41) | `uint256` | Minimum seconds between epochs. |
| [`_rewardDelegatedStakeWeight`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/sys/MixinParams.sol#L42) | `uint32` | How much delegated stake is weighted vs operator stake, in ppm. |
| [`_minimumPoolStake`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/sys/MixinParams.sol#L43) | `uint256` | Minimum amount of stake required in a pool to collect rewards. |
| [`_cobbDouglasAlphaNumerator`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/sys/MixinParams.sol#L44) | `uint32` | Numerator for cobb douglas alpha factor. |
| [`_cobbDouglasAlphaDenominator`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/sys/MixinParams.sol#L45) | `uint32` | Denominator for cobb douglas alpha factor. |

---
### `stake`
Stake ZRX tokens. Tokens are deposited into the ZRX Vault. Unstake to retrieve the ZRX. Stake is in the 'Active' status.

• `stake(uint256 amount)`

&nbsp; *Defined in [contracts/staking/contracts/src/stake/MixinStake.sol:35](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/stake/MixinStake.sol#L35)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`amount`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/stake/MixinStake.sol#L35) | `uint256` | Amount of ZRX to stake. |

---
### `stakingContract`
address of staking contract

• `stakingContract(): (address)` *(generated)*

&nbsp; *Defined in [contracts/staking/contracts/src/immutable/MixinStorage.sol:35](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/immutable/MixinStorage.sol#L35)*

***Returns***

| Name | Type |
| ---- | ---- |
| [`0`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/immutable/MixinStorage.sol#L35) | `address` |  |

---
### `transferOwnership`
Change the owner of this contract.

• `transferOwnership(address newOwner)`

&nbsp; *Defined in [contracts/utils/contracts/src/Ownable.sol:46](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/utils/contracts/src/Ownable.sol#L46)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`newOwner`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/utils/contracts/src/Ownable.sol#L46) | `address` | New owner address. |

---
### `unstake`
Unstake. Tokens are withdrawn from the ZRX Vault and returned to the staker. Stake must be in the 'undelegated' status in both the current and next epoch in order to be unstaked.

• `unstake(uint256 amount)`

&nbsp; *Defined in [contracts/staking/contracts/src/stake/MixinStake.sol:60](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/stake/MixinStake.sol#L60)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`amount`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/stake/MixinStake.sol#L60) | `uint256` | Amount of ZRX to unstake. |

---
### `validExchanges`
Registered 0x Exchange contracts, capable of paying protocol fees.

• `validExchanges(address): (bool)` *(generated)*

&nbsp; *Defined in [contracts/staking/contracts/src/immutable/MixinStorage.sol:82](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/immutable/MixinStorage.sol#L82)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`0`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/immutable/MixinStorage.sol#L82) | `address` | The address to check. |

***Returns***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`0`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/immutable/MixinStorage.sol#L82) | `bool` | Whether the address is a registered exchange. |

---
### `wethReservedForPoolRewards`
The WETH balance of this contract that is reserved for pool reward payouts.

• `wethReservedForPoolRewards(): (uint256)` *(generated)*

&nbsp; *Defined in [contracts/staking/contracts/src/immutable/MixinStorage.sol:117](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/immutable/MixinStorage.sol#L117)*

***Returns***

| Name | Type |
| ---- | ---- |
| [`0`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/immutable/MixinStorage.sol#L117) | `uint256` |  |

---
### `withdrawDelegatorRewards`
Withdraws the caller's WETH rewards that have accumulated until the last epoch.

• `withdrawDelegatorRewards(bytes32 poolId)`

&nbsp; *Defined in [contracts/staking/contracts/src/staking_pools/MixinStakingPoolRewards.sol:37](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/staking_pools/MixinStakingPoolRewards.sol#L37)*

***Parameters***

| Name | Type | Description |
| ---- | ---- | ----------- |
| [`poolId`](https://github.com/0xProject/0x-monorepo/blob/d1041948b/contracts/staking/contracts/src/staking_pools/MixinStakingPoolRewards.sol#L37) | `bytes32` | Unique id of pool. |
