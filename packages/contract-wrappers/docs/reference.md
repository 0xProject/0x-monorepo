> # Class: AbstractBalanceAndProxyAllowanceLazyStore

## Hierarchy

* **AbstractBalanceAndProxyAllowanceLazyStore**

## Index

### Methods

* [deleteAll](#abstract-deleteall)
* [deleteBalance](#abstract-deletebalance)
* [deleteProxyAllowance](#abstract-deleteproxyallowance)
* [getBalanceAsync](#abstract-getbalanceasync)
* [getProxyAllowanceAsync](#abstract-getproxyallowanceasync)
* [setBalance](#abstract-setbalance)
* [setProxyAllowance](#abstract-setproxyallowance)

## Methods

### `Abstract` deleteAll

▸ **deleteAll**(): *void*

*Defined in [abstract/abstract_balance_and_proxy_allowance_lazy_store.ts:10](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/abstract/abstract_balance_and_proxy_allowance_lazy_store.ts#L10)*

**Returns:** *void*

___

### `Abstract` deleteBalance

▸ **deleteBalance**(`tokenAddress`: string, `userAddress`: string): *void*

*Defined in [abstract/abstract_balance_and_proxy_allowance_lazy_store.ts:7](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/abstract/abstract_balance_and_proxy_allowance_lazy_store.ts#L7)*

**Parameters:**

Name | Type |
------ | ------ |
`tokenAddress` | string |
`userAddress` | string |

**Returns:** *void*

___

### `Abstract` deleteProxyAllowance

▸ **deleteProxyAllowance**(`tokenAddress`: string, `userAddress`: string): *void*

*Defined in [abstract/abstract_balance_and_proxy_allowance_lazy_store.ts:9](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/abstract/abstract_balance_and_proxy_allowance_lazy_store.ts#L9)*

**Parameters:**

Name | Type |
------ | ------ |
`tokenAddress` | string |
`userAddress` | string |

**Returns:** *void*

___

### `Abstract` getBalanceAsync

▸ **getBalanceAsync**(`tokenAddress`: string, `userAddress`: string): *`Promise<BigNumber>`*

*Defined in [abstract/abstract_balance_and_proxy_allowance_lazy_store.ts:4](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/abstract/abstract_balance_and_proxy_allowance_lazy_store.ts#L4)*

**Parameters:**

Name | Type |
------ | ------ |
`tokenAddress` | string |
`userAddress` | string |

**Returns:** *`Promise<BigNumber>`*

___

### `Abstract` getProxyAllowanceAsync

▸ **getProxyAllowanceAsync**(`tokenAddress`: string, `userAddress`: string): *`Promise<BigNumber>`*

*Defined in [abstract/abstract_balance_and_proxy_allowance_lazy_store.ts:5](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/abstract/abstract_balance_and_proxy_allowance_lazy_store.ts#L5)*

**Parameters:**

Name | Type |
------ | ------ |
`tokenAddress` | string |
`userAddress` | string |

**Returns:** *`Promise<BigNumber>`*

___

### `Abstract` setBalance

▸ **setBalance**(`tokenAddress`: string, `userAddress`: string, `balance`: `BigNumber`): *void*

*Defined in [abstract/abstract_balance_and_proxy_allowance_lazy_store.ts:6](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/abstract/abstract_balance_and_proxy_allowance_lazy_store.ts#L6)*

**Parameters:**

Name | Type |
------ | ------ |
`tokenAddress` | string |
`userAddress` | string |
`balance` | `BigNumber` |

**Returns:** *void*

___

### `Abstract` setProxyAllowance

▸ **setProxyAllowance**(`tokenAddress`: string, `userAddress`: string, `proxyAllowance`: `BigNumber`): *void*

*Defined in [abstract/abstract_balance_and_proxy_allowance_lazy_store.ts:8](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/abstract/abstract_balance_and_proxy_allowance_lazy_store.ts#L8)*

**Parameters:**

Name | Type |
------ | ------ |
`tokenAddress` | string |
`userAddress` | string |
`proxyAllowance` | `BigNumber` |

**Returns:** *void*

<hr />

> # Class: ContractWrappers

The ContractWrappers class contains smart contract wrappers helpful when building on 0x protocol.

## Hierarchy

* **ContractWrappers**

## Index

### Constructors

* [constructor](#constructor)

### Properties

* [coordinator](#coordinator)
* [dutchAuction](#dutchauction)
* [erc20Proxy](#erc20proxy)
* [erc20Token](#erc20token)
* [erc721Proxy](#erc721proxy)
* [erc721Token](#erc721token)
* [etherToken](#ethertoken)
* [exchange](#exchange)
* [forwarder](#forwarder)
* [orderValidator](#ordervalidator)

### Methods

* [getAbiDecoder](#getabidecoder)
* [getProvider](#getprovider)
* [unsubscribeAll](#unsubscribeall)

## Constructors

###  constructor

\+ **new ContractWrappers**(`supportedProvider`: `SupportedProvider`, `config`: [ContractWrappersConfig](#class-contractwrappers)*

*Defined in [contract_wrappers.ts:83](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers.ts#L83)*

Instantiates a new ContractWrappers instance.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`supportedProvider` | `SupportedProvider` | The Provider instance you would like the contract-wrappers library to use for interacting with                      the Ethereum network. |
`config` | [ContractWrappersConfig](#interface-contractwrappersconfig) | The configuration object. Look up the type for the description. |

**Returns:** *[ContractWrappers](#class-contractwrappers)*

An instance of the ContractWrappers class.

## Properties

###  coordinator

• **coordinator**: *[CoordinatorWrapper](#class-coordinatorwrapper)*

*Defined in [contract_wrappers.ts:81](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers.ts#L81)*

An instance of the CoordinatorWrapper class containing methods for interacting with the Coordinator extension contract.

___

###  dutchAuction

• **dutchAuction**: *[DutchAuctionWrapper](#class-dutchauctionwrapper)*

*Defined in [contract_wrappers.ts:76](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers.ts#L76)*

An instance of the DutchAuctionWrapper class containing methods for interacting with any DutchAuction smart contract.

___

###  erc20Proxy

• **erc20Proxy**: *[ERC20ProxyWrapper](#class-erc20proxywrapper)*

*Defined in [contract_wrappers.ts:59](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers.ts#L59)*

An instance of the ERC20ProxyWrapper class containing methods for interacting with the
erc20Proxy smart contract.

___

###  erc20Token

• **erc20Token**: *[ERC20TokenWrapper](#class-erc20tokenwrapper)*

*Defined in [contract_wrappers.ts:45](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers.ts#L45)*

An instance of the ERC20TokenWrapper class containing methods for interacting with any ERC20 token smart contract.

___

###  erc721Proxy

• **erc721Proxy**: *[ERC721ProxyWrapper](#class-erc721proxywrapper)*

*Defined in [contract_wrappers.ts:64](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers.ts#L64)*

An instance of the ERC721ProxyWrapper class containing methods for interacting with the
erc721Proxy smart contract.

___

###  erc721Token

• **erc721Token**: *[ERC721TokenWrapper](#class-erc721tokenwrapper)*

*Defined in [contract_wrappers.ts:49](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers.ts#L49)*

An instance of the ERC721TokenWrapper class containing methods for interacting with any ERC721 token smart contract.

___

###  etherToken

• **etherToken**: *[EtherTokenWrapper](#class-ethertokenwrapper)*

*Defined in [contract_wrappers.ts:54](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers.ts#L54)*

An instance of the EtherTokenWrapper class containing methods for interacting with the
wrapped ETH ERC20 token smart contract.

___

###  exchange

• **exchange**: *[ExchangeWrapper](#class-exchangewrapper)*

*Defined in [contract_wrappers.ts:41](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers.ts#L41)*

An instance of the ExchangeWrapper class containing methods for interacting with the 0x Exchange smart contract.

___

###  forwarder

• **forwarder**: *[ForwarderWrapper](#class-forwarderwrapper)*

*Defined in [contract_wrappers.ts:68](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers.ts#L68)*

An instance of the ForwarderWrapper class containing methods for interacting with any Forwarder smart contract.

___

###  orderValidator

• **orderValidator**: *[OrderValidatorWrapper](#class-ordervalidatorwrapper)*

*Defined in [contract_wrappers.ts:72](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers.ts#L72)*

An instance of the OrderValidatorWrapper class containing methods for interacting with any OrderValidator smart contract.

## Methods

###  getAbiDecoder

▸ **getAbiDecoder**(): *`AbiDecoder`*

*Defined in [contract_wrappers.ts:179](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers.ts#L179)*

Get the abi decoder instance currently used by contract-wrappers

**Returns:** *`AbiDecoder`*

AbiDecoder instance

___

###  getProvider

▸ **getProvider**(): *`SupportedProvider`*

*Defined in [contract_wrappers.ts:172](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers.ts#L172)*

Get the provider instance currently used by contract-wrappers

**Returns:** *`SupportedProvider`*

Web3 provider instance

___

###  unsubscribeAll

▸ **unsubscribeAll**(): *void*

*Defined in [contract_wrappers.ts:162](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers.ts#L162)*

Unsubscribes from all subscriptions for all contracts.

**Returns:** *void*

<hr />

> # Class: CoordinatorWrapper

This class includes all the functionality related to filling or cancelling orders through
the 0x V2 Coordinator extension contract.

## Hierarchy

* **CoordinatorWrapper**

## Index

### Constructors

* [constructor](#constructor)

### Properties

* [abi](#abi)
* [address](#address)
* [exchangeAddress](#exchangeaddress)
* [networkId](#networkid)
* [registryAddress](#registryaddress)

### Methods

* [assertValidCoordinatorApprovalsOrThrowAsync](#assertvalidcoordinatorapprovalsorthrowasync)
* [batchFillOrKillOrdersAsync](#batchfillorkillordersasync)
* [batchFillOrdersAsync](#batchfillordersasync)
* [batchFillOrdersNoThrowAsync](#batchfillordersnothrowasync)
* [batchHardCancelOrdersAsync](#batchhardcancelordersasync)
* [batchSoftCancelOrdersAsync](#batchsoftcancelordersasync)
* [fillOrKillOrderAsync](#fillorkillorderasync)
* [fillOrderAsync](#fillorderasync)
* [fillOrderNoThrowAsync](#fillordernothrowasync)
* [getSignerAddressAsync](#getsigneraddressasync)
* [hardCancelOrderAsync](#hardcancelorderasync)
* [hardCancelOrdersUpToAsync](#hardcancelordersuptoasync)
* [marketBuyOrdersAsync](#marketbuyordersasync)
* [marketBuyOrdersNoThrowAsync](#marketbuyordersnothrowasync)
* [marketSellOrdersAsync](#marketsellordersasync)
* [marketSellOrdersNoThrowAsync](#marketsellordersnothrowasync)
* [softCancelOrderAsync](#softcancelorderasync)

## Constructors

###  constructor

\+ **new CoordinatorWrapper**(`web3Wrapper`: `Web3Wrapper`, `networkId`: number, `address?`: undefined | string, `exchangeAddress?`: undefined | string, `registryAddress?`: undefined | string): *[CoordinatorWrapper](#class-coordinatorwrapper)*

*Defined in [contract_wrappers/coordinator_wrapper.ts:43](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/coordinator_wrapper.ts#L43)*

Instantiate CoordinatorWrapper

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`web3Wrapper` | `Web3Wrapper` | Web3Wrapper instance to use. |
`networkId` | number | Desired networkId. |
`address?` | undefined \| string | The address of the Coordinator contract. If undefined, will default to the known address corresponding to the networkId. |
`exchangeAddress?` | undefined \| string | The address of the Exchange contract. If undefined, will default to the known address corresponding to the networkId. |
`registryAddress?` | undefined \| string | The address of the CoordinatorRegistry contract. If undefined, will default to the known address corresponding to the networkId.  |

**Returns:** *[CoordinatorWrapper](#class-coordinatorwrapper)*

## Properties

###  abi

• **abi**: *`ContractAbi`* =  Coordinator.compilerOutput.abi

*Defined in [contract_wrappers/coordinator_wrapper.ts:33](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/coordinator_wrapper.ts#L33)*

___

###  address

• **address**: *string*

*Defined in [contract_wrappers/coordinator_wrapper.ts:35](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/coordinator_wrapper.ts#L35)*

___

###  exchangeAddress

• **exchangeAddress**: *string*

*Defined in [contract_wrappers/coordinator_wrapper.ts:36](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/coordinator_wrapper.ts#L36)*

___

###  networkId

• **networkId**: *number*

*Defined in [contract_wrappers/coordinator_wrapper.ts:34](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/coordinator_wrapper.ts#L34)*

___

###  registryAddress

• **registryAddress**: *string*

*Defined in [contract_wrappers/coordinator_wrapper.ts:37](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/coordinator_wrapper.ts#L37)*

## Methods

###  assertValidCoordinatorApprovalsOrThrowAsync

▸ **assertValidCoordinatorApprovalsOrThrowAsync**(`transaction`: `ZeroExTransaction`, `txOrigin`: string, `transactionSignature`: string, `approvalExpirationTimeSeconds`: `BigNumber`[], `approvalSignatures`: string[]): *`Promise<void>`*

*Defined in [contract_wrappers/coordinator_wrapper.ts:582](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/coordinator_wrapper.ts#L582)*

Validates that the 0x transaction has been approved by all of the feeRecipients that correspond to each order in the transaction's Exchange calldata.
Throws an error if the transaction approvals are not valid. Will not detect failures that would occur when the transaction is executed on the Exchange contract.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`transaction` | `ZeroExTransaction` | 0x transaction containing salt, signerAddress, and data. |
`txOrigin` | string | Required signer of Ethereum transaction calling this function. |
`transactionSignature` | string | Proof that the transaction has been signed by the signer. |
`approvalExpirationTimeSeconds` | `BigNumber`[] | Array of expiration times in seconds for which each corresponding approval signature expires. |
`approvalSignatures` | string[] | Array of signatures that correspond to the feeRecipients of each order in the transaction's Exchange calldata.  |

**Returns:** *`Promise<void>`*

___

###  batchFillOrKillOrdersAsync

▸ **batchFillOrKillOrdersAsync**(`signedOrders`: `SignedOrder`[], `takerAssetFillAmounts`: `BigNumber`[], `takerAddress`: string, `orderTransactionOpts`: [OrderTransactionOpts](#interface-ordertransactionopts)): *`Promise<string>`*

*Defined in [contract_wrappers/coordinator_wrapper.ts:248](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/coordinator_wrapper.ts#L248)*

Batch version of fillOrKillOrderAsync. Executes multiple fills atomically in a single transaction.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`signedOrders` | `SignedOrder`[] | - | An array of signed orders to fill. |
`takerAssetFillAmounts` | `BigNumber`[] | - | The amounts of the orders (in taker asset baseUnits) that you wish to fill. |
`takerAddress` | string | - | The user Ethereum address who would like to fill these orders. Must be available via the supplied                                Provider provided at instantiation. |
`orderTransactionOpts` | [OrderTransactionOpts](#interface-ordertransactionopts) |  { shouldValidate: true } | Optional arguments this method accepts. |

**Returns:** *`Promise<string>`*

Transaction hash.

___

###  batchFillOrdersAsync

▸ **batchFillOrdersAsync**(`signedOrders`: `SignedOrder`[], `takerAssetFillAmounts`: `BigNumber`[], `takerAddress`: string, `orderTransactionOpts`: [OrderTransactionOpts](#interface-ordertransactionopts)): *`Promise<string>`*

*Defined in [contract_wrappers/coordinator_wrapper.ts:190](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/coordinator_wrapper.ts#L190)*

Batch version of fillOrderAsync. Executes multiple fills atomically in a single transaction.
Under-the-hood, this method uses the `feeRecipientAddress`s of the orders to looks up the coordinator server endpoints
registered in the coordinator registry contract. It requests a signature from each coordinator server before
submitting the orders and signatures as a 0x transaction to the coordinator extension contract, which validates the
signatures and then fills the order through the Exchange contract.
If any `feeRecipientAddress` in the batch is not registered to a coordinator server, the whole batch fails.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`signedOrders` | `SignedOrder`[] | - | An array of signed orders to fill. |
`takerAssetFillAmounts` | `BigNumber`[] | - | The amounts of the orders (in taker asset baseUnits) that you wish to fill. |
`takerAddress` | string | - | The user Ethereum address who would like to fill these orders. Must be available via the supplied                                Provider provided at instantiation. |
`orderTransactionOpts` | [OrderTransactionOpts](#interface-ordertransactionopts) |  { shouldValidate: true } | Optional arguments this method accepts. |

**Returns:** *`Promise<string>`*

Transaction hash.

___

###  batchFillOrdersNoThrowAsync

▸ **batchFillOrdersNoThrowAsync**(`signedOrders`: `SignedOrder`[], `takerAssetFillAmounts`: `BigNumber`[], `takerAddress`: string, `orderTransactionOpts`: [OrderTransactionOpts](#interface-ordertransactionopts)): *`Promise<string>`*

*Defined in [contract_wrappers/coordinator_wrapper.ts:219](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/coordinator_wrapper.ts#L219)*

No throw version of batchFillOrdersAsync

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`signedOrders` | `SignedOrder`[] | - | An array of signed orders to fill. |
`takerAssetFillAmounts` | `BigNumber`[] | - | The amounts of the orders (in taker asset baseUnits) that you wish to fill. |
`takerAddress` | string | - | The user Ethereum address who would like to fill these orders. Must be available via the supplied                                Provider provided at instantiation. |
`orderTransactionOpts` | [OrderTransactionOpts](#interface-ordertransactionopts) |  { shouldValidate: true } | Optional arguments this method accepts. |

**Returns:** *`Promise<string>`*

Transaction hash.

___

###  batchHardCancelOrdersAsync

▸ **batchHardCancelOrdersAsync**(`orders`: `SignedOrder`[], `orderTransactionOpts`: [OrderTransactionOpts](#interface-ordertransactionopts)): *`Promise<string>`*

*Defined in [contract_wrappers/coordinator_wrapper.ts:513](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/coordinator_wrapper.ts#L513)*

Batch version of hardCancelOrderAsync. Cancels orders on-chain by submitting an Ethereum transaction.
Executes multiple cancels atomically in a single transaction.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`orders` | `SignedOrder`[] | - | An array of orders to cancel. |
`orderTransactionOpts` | [OrderTransactionOpts](#interface-ordertransactionopts) |  { shouldValidate: true } | Optional arguments this method accepts. |

**Returns:** *`Promise<string>`*

Transaction hash.

___

###  batchSoftCancelOrdersAsync

▸ **batchSoftCancelOrdersAsync**(`orders`: `SignedOrder`[]): *`Promise<CoordinatorServerCancellationResponse[]>`*

*Defined in [contract_wrappers/coordinator_wrapper.ts:427](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/coordinator_wrapper.ts#L427)*

Batch version of softCancelOrderAsync. Requests multiple soft cancels

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`orders` | `SignedOrder`[] | An array of orders to cancel. |

**Returns:** *`Promise<CoordinatorServerCancellationResponse[]>`*

CoordinatorServerCancellationResponse. See [Cancellation Response](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/coordinator-specification.md#response).

___

###  fillOrKillOrderAsync

▸ **fillOrKillOrderAsync**(`signedOrder`: `SignedOrder`, `takerAssetFillAmount`: `BigNumber`, `takerAddress`: string, `orderTransactionOpts`: [OrderTransactionOpts](#interface-ordertransactionopts)): *`Promise<string>`*

*Defined in [contract_wrappers/coordinator_wrapper.ts:158](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/coordinator_wrapper.ts#L158)*

Attempts to fill a specific amount of an order. If the entire amount specified cannot be filled,
the fill order is abandoned.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`signedOrder` | `SignedOrder` | - | An object that conforms to the SignedOrder interface. |
`takerAssetFillAmount` | `BigNumber` | - | The amount of the order (in taker asset baseUnits) that you wish to fill. |
`takerAddress` | string | - | The user Ethereum address who would like to fill this order. Must be available via the supplied                               Provider provided at instantiation. |
`orderTransactionOpts` | [OrderTransactionOpts](#interface-ordertransactionopts) |  { shouldValidate: true } | Optional arguments this method accepts. |

**Returns:** *`Promise<string>`*

Transaction hash.

___

###  fillOrderAsync

▸ **fillOrderAsync**(`signedOrder`: `SignedOrder`, `takerAssetFillAmount`: `BigNumber`, `takerAddress`: string, `orderTransactionOpts`: [OrderTransactionOpts](#interface-ordertransactionopts)): *`Promise<string>`*

*Defined in [contract_wrappers/coordinator_wrapper.ts:103](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/coordinator_wrapper.ts#L103)*

Fills a signed order with an amount denominated in baseUnits of the taker asset. Under-the-hood, this
method uses the `feeRecipientAddress` of the order to look up the coordinator server endpoint registered in the
coordinator registry contract. It requests a signature from that coordinator server before
submitting the order and signature as a 0x transaction to the coordinator extension contract. The coordinator extension
contract validates signatures and then fills the order via the Exchange contract.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`signedOrder` | `SignedOrder` | - | An object that conforms to the SignedOrder interface. |
`takerAssetFillAmount` | `BigNumber` | - | The amount of the order (in taker asset baseUnits) that you wish to fill. |
`takerAddress` | string | - | The user Ethereum address who would like to fill this order. Must be available via the supplied                                Provider provided at instantiation. |
`orderTransactionOpts` | [OrderTransactionOpts](#interface-ordertransactionopts) |  { shouldValidate: true } | Optional arguments this method accepts. |

**Returns:** *`Promise<string>`*

Transaction hash.

___

###  fillOrderNoThrowAsync

▸ **fillOrderNoThrowAsync**(`signedOrder`: `SignedOrder`, `takerAssetFillAmount`: `BigNumber`, `takerAddress`: string, `orderTransactionOpts`: [OrderTransactionOpts](#interface-ordertransactionopts)): *`Promise<string>`*

*Defined in [contract_wrappers/coordinator_wrapper.ts:130](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/coordinator_wrapper.ts#L130)*

No-throw version of fillOrderAsync. This version will not throw if the fill fails. This allows the caller to save gas at the expense of not knowing the reason the fill failed.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`signedOrder` | `SignedOrder` | - | An object that conforms to the SignedOrder interface. |
`takerAssetFillAmount` | `BigNumber` | - | The amount of the order (in taker asset baseUnits) that you wish to fill. |
`takerAddress` | string | - | The user Ethereum address who would like to fill this order.                               Must be available via the supplied Provider provided at instantiation. |
`orderTransactionOpts` | [OrderTransactionOpts](#interface-ordertransactionopts) |  { shouldValidate: true } | Optional arguments this method accepts. |

**Returns:** *`Promise<string>`*

Transaction hash.

___

###  getSignerAddressAsync

▸ **getSignerAddressAsync**(`hash`: string, `signature`: string): *`Promise<string>`*

*Defined in [contract_wrappers/coordinator_wrapper.ts:614](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/coordinator_wrapper.ts#L614)*

Recovers the address of a signer given a hash and signature.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`hash` | string | Any 32 byte hash. |
`signature` | string | Proof that the hash has been signed by signer. |

**Returns:** *`Promise<string>`*

Signer address.

___

###  hardCancelOrderAsync

▸ **hardCancelOrderAsync**(`order`: `Order` | `SignedOrder`, `orderTransactionOpts`: [OrderTransactionOpts](#interface-ordertransactionopts)): *`Promise<string>`*

*Defined in [contract_wrappers/coordinator_wrapper.ts:481](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/coordinator_wrapper.ts#L481)*

Cancels an order on-chain by submitting an Ethereum transaction.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`order` | `Order` \| `SignedOrder` | - | An object that conforms to the Order or SignedOrder interface. The order you would like to cancel. |
`orderTransactionOpts` | [OrderTransactionOpts](#interface-ordertransactionopts) |  { shouldValidate: true } | Optional arguments this method accepts. |

**Returns:** *`Promise<string>`*

Transaction hash.

___

###  hardCancelOrdersUpToAsync

▸ **hardCancelOrdersUpToAsync**(`targetOrderEpoch`: `BigNumber`, `senderAddress`: string, `orderTransactionOpts`: [OrderTransactionOpts](#interface-ordertransactionopts)): *`Promise<string>`*

*Defined in [contract_wrappers/coordinator_wrapper.ts:548](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/coordinator_wrapper.ts#L548)*

Cancels orders on-chain by submitting an Ethereum transaction.
Cancels all orders created by makerAddress with a salt less than or equal to the targetOrderEpoch
and senderAddress equal to coordinator extension contract address.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`targetOrderEpoch` | `BigNumber` | - | Target order epoch. |
`senderAddress` | string | - | Address that should send the transaction. |
`orderTransactionOpts` | [OrderTransactionOpts](#interface-ordertransactionopts) |  { shouldValidate: true } | Optional arguments this method accepts. |

**Returns:** *`Promise<string>`*

Transaction hash.

___

###  marketBuyOrdersAsync

▸ **marketBuyOrdersAsync**(`signedOrders`: `SignedOrder`[], `makerAssetFillAmount`: `BigNumber`, `takerAddress`: string, `orderTransactionOpts`: [OrderTransactionOpts](#interface-ordertransactionopts)): *`Promise<string>`*

*Defined in [contract_wrappers/coordinator_wrapper.ts:282](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/coordinator_wrapper.ts#L282)*

Synchronously executes multiple calls to fillOrder until total amount of makerAsset is bought by taker.
Under-the-hood, this method uses the `feeRecipientAddress`s of the orders to looks up the coordinator server endpoints
registered in the coordinator registry contract. It requests a signature from each coordinator server before
submitting the orders and signatures as a 0x transaction to the coordinator extension contract, which validates the
signatures and then fills the order through the Exchange contract.
If any `feeRecipientAddress` in the batch is not registered to a coordinator server, the whole batch fails.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`signedOrders` | `SignedOrder`[] | - | An array of signed orders to fill. |
`makerAssetFillAmount` | `BigNumber` | - | Maker asset fill amount. |
`takerAddress` | string | - | The user Ethereum address who would like to fill these orders. Must be available via the supplied                               Provider provided at instantiation. |
`orderTransactionOpts` | [OrderTransactionOpts](#interface-ordertransactionopts) |  { shouldValidate: true } | Optional arguments this method accepts. |

**Returns:** *`Promise<string>`*

Transaction hash.

___

###  marketBuyOrdersNoThrowAsync

▸ **marketBuyOrdersNoThrowAsync**(`signedOrders`: `SignedOrder`[], `makerAssetFillAmount`: `BigNumber`, `takerAddress`: string, `orderTransactionOpts`: [OrderTransactionOpts](#interface-ordertransactionopts)): *`Promise<string>`*

*Defined in [contract_wrappers/coordinator_wrapper.ts:341](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/coordinator_wrapper.ts#L341)*

No throw version of marketBuyOrdersAsync

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`signedOrders` | `SignedOrder`[] | - | An array of signed orders to fill. |
`makerAssetFillAmount` | `BigNumber` | - | Maker asset fill amount. |
`takerAddress` | string | - | The user Ethereum address who would like to fill these orders. Must be available via the supplied                               Provider provided at instantiation. |
`orderTransactionOpts` | [OrderTransactionOpts](#interface-ordertransactionopts) |  { shouldValidate: true } | Optional arguments this method accepts. |

**Returns:** *`Promise<string>`*

Transaction hash.

___

###  marketSellOrdersAsync

▸ **marketSellOrdersAsync**(`signedOrders`: `SignedOrder`[], `takerAssetFillAmount`: `BigNumber`, `takerAddress`: string, `orderTransactionOpts`: [OrderTransactionOpts](#interface-ordertransactionopts)): *`Promise<string>`*

*Defined in [contract_wrappers/coordinator_wrapper.ts:314](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/coordinator_wrapper.ts#L314)*

Synchronously executes multiple calls to fillOrder until total amount of makerAsset is bought by taker.
Under-the-hood, this method uses the `feeRecipientAddress`s of the orders to looks up the coordinator server endpoints
registered in the coordinator registry contract. It requests a signature from each coordinator server before
submitting the orders and signatures as a 0x transaction to the coordinator extension contract, which validates the
signatures and then fills the order through the Exchange contract.
If any `feeRecipientAddress` in the batch is not registered to a coordinator server, the whole batch fails.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`signedOrders` | `SignedOrder`[] | - | An array of signed orders to fill. |
`takerAssetFillAmount` | `BigNumber` | - | Taker asset fill amount. |
`takerAddress` | string | - | The user Ethereum address who would like to fill these orders. Must be available via the supplied                               Provider provided at instantiation. |
`orderTransactionOpts` | [OrderTransactionOpts](#interface-ordertransactionopts) |  { shouldValidate: true } | Optional arguments this method accepts. |

**Returns:** *`Promise<string>`*

Transaction hash.

___

###  marketSellOrdersNoThrowAsync

▸ **marketSellOrdersNoThrowAsync**(`signedOrders`: `SignedOrder`[], `takerAssetFillAmount`: `BigNumber`, `takerAddress`: string, `orderTransactionOpts`: [OrderTransactionOpts](#interface-ordertransactionopts)): *`Promise<string>`*

*Defined in [contract_wrappers/coordinator_wrapper.ts:368](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/coordinator_wrapper.ts#L368)*

No throw version of marketSellOrdersAsync

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`signedOrders` | `SignedOrder`[] | - | An array of signed orders to fill. |
`takerAssetFillAmount` | `BigNumber` | - | Taker asset fill amount. |
`takerAddress` | string | - | The user Ethereum address who would like to fill these orders. Must be available via the supplied                               Provider provided at instantiation. |
`orderTransactionOpts` | [OrderTransactionOpts](#interface-ordertransactionopts) |  { shouldValidate: true } | Optional arguments this method accepts. |

**Returns:** *`Promise<string>`*

Transaction hash.

___

###  softCancelOrderAsync

▸ **softCancelOrderAsync**(`order`: `Order` | `SignedOrder`): *`Promise<CoordinatorServerCancellationResponse>`*

*Defined in [contract_wrappers/coordinator_wrapper.ts:392](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/coordinator_wrapper.ts#L392)*

Soft cancel a given order.
Soft cancels are recorded only on coordinator operator servers and do not involve an Ethereum transaction.
See [soft cancels](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/coordinator-specification.md#soft-cancels).

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`order` | `Order` \| `SignedOrder` | An object that conforms to the Order or SignedOrder interface. The order you would like to cancel. |

**Returns:** *`Promise<CoordinatorServerCancellationResponse>`*

CoordinatorServerCancellationResponse. See [Cancellation Response](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/coordinator-specification.md#response).

<hr />

> # Class: DutchAuctionWrapper

## Hierarchy

* **DutchAuctionWrapper**

## Index

### Constructors

* [constructor](#constructor)

### Properties

* [abi](#abi)
* [address](#address)

### Methods

* [getAuctionDetailsAsync](#getauctiondetailsasync)
* [matchOrdersAsync](#matchordersasync)
* [decodeDutchAuctionData](#static-decodedutchauctiondata)
* [encodeDutchAuctionAssetData](#static-encodedutchauctionassetdata)

## Constructors

###  constructor

\+ **new DutchAuctionWrapper**(`web3Wrapper`: `Web3Wrapper`, `networkId`: number, `address?`: undefined | string): *[DutchAuctionWrapper](#class-dutchauctionwrapper)*

*Defined in [contract_wrappers/dutch_auction_wrapper.ts:49](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/dutch_auction_wrapper.ts#L49)*

Instantiate DutchAuctionWrapper

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`web3Wrapper` | `Web3Wrapper` | Web3Wrapper instance to use. |
`networkId` | number | Desired networkId. |
`address?` | undefined \| string | The address of the Dutch Auction contract. If undefined, will default to the known address corresponding to the networkId.  |

**Returns:** *[DutchAuctionWrapper](#class-dutchauctionwrapper)*

## Properties

###  abi

• **abi**: *`ContractAbi`* =  DutchAuction.compilerOutput.abi

*Defined in [contract_wrappers/dutch_auction_wrapper.ts:18](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/dutch_auction_wrapper.ts#L18)*

___

###  address

• **address**: *string*

*Defined in [contract_wrappers/dutch_auction_wrapper.ts:19](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/dutch_auction_wrapper.ts#L19)*

## Methods

###  getAuctionDetailsAsync

▸ **getAuctionDetailsAsync**(`sellOrder`: `SignedOrder`): *`Promise<DutchAuctionDetails>`*

*Defined in [contract_wrappers/dutch_auction_wrapper.ts:131](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/dutch_auction_wrapper.ts#L131)*

Fetches the Auction Details for the given order

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`sellOrder` | `SignedOrder` | The Seller's order. This order is for the lowest amount (at the end of the auction). |

**Returns:** *`Promise<DutchAuctionDetails>`*

The dutch auction details.

___

###  matchOrdersAsync

▸ **matchOrdersAsync**(`buyOrder`: `SignedOrder`, `sellOrder`: `SignedOrder`, `takerAddress`: string, `orderTransactionOpts`: [OrderTransactionOpts](#interface-ordertransactionopts)): *`Promise<string>`*

*Defined in [contract_wrappers/dutch_auction_wrapper.ts:77](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/dutch_auction_wrapper.ts#L77)*

Matches the buy and sell orders at an amount given the following: the current block time, the auction
start time and the auction begin amount. The sell order is a an order at the lowest amount
at the end of the auction. Excess from the match is transferred to the seller.
Over time the price moves from beginAmount to endAmount given the current block.timestamp.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`buyOrder` | `SignedOrder` | - | The Buyer's order. This order is for the current expected price of the auction. |
`sellOrder` | `SignedOrder` | - | The Seller's order. This order is for the lowest amount (at the end of the auction). |
`takerAddress` | string | - | The user Ethereum address who would like to fill this order. Must be available via the supplied                      Provider provided at instantiation. |
`orderTransactionOpts` | [OrderTransactionOpts](#interface-ordertransactionopts) |  { shouldValidate: true } | - |

**Returns:** *`Promise<string>`*

Transaction hash.

___

### `Static` decodeDutchAuctionData

▸ **decodeDutchAuctionData**(`dutchAuctionData`: string): *`DutchAuctionData`*

*Defined in [contract_wrappers/dutch_auction_wrapper.ts:46](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/dutch_auction_wrapper.ts#L46)*

Dutch auction details are encoded with the asset data for a 0x order. This function decodes a hex
encoded assetData string, containing information both about the asset being traded and the
dutch auction.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`dutchAuctionData` | string | Hex encoded assetData string for the asset being auctioned. |

**Returns:** *`DutchAuctionData`*

An object containing the auction asset, auction begin time and auction begin amount.

___

### `Static` encodeDutchAuctionAssetData

▸ **encodeDutchAuctionAssetData**(`assetData`: string, `beginTimeSeconds`: `BigNumber`, `beginAmount`: `BigNumber`): *string*

*Defined in [contract_wrappers/dutch_auction_wrapper.ts:31](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/dutch_auction_wrapper.ts#L31)*

Dutch auction details are encoded with the asset data for a 0x order. This function produces a hex
encoded assetData string, containing information both about the asset being traded and the
dutch auction; which is usable in the makerAssetData or takerAssetData fields in a 0x order.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`assetData` | string | Hex encoded assetData string for the asset being auctioned. |
`beginTimeSeconds` | `BigNumber` | Begin time of the dutch auction. |
`beginAmount` | `BigNumber` | Starting amount being sold in the dutch auction. |

**Returns:** *string*

The hex encoded assetData string.

<hr />

> # Class: ERC20ProxyWrapper

This class includes the functionality related to interacting with the ERC20Proxy contract.

## Hierarchy

* **ERC20ProxyWrapper**

## Index

### Constructors

* [constructor](#constructor)

### Properties

* [abi](#abi)
* [address](#address)

### Methods

* [getAuthorizedAddressesAsync](#getauthorizedaddressesasync)
* [getProxyIdAsync](#getproxyidasync)
* [isAuthorizedAsync](#isauthorizedasync)

## Constructors

###  constructor

\+ **new ERC20ProxyWrapper**(`web3Wrapper`: `Web3Wrapper`, `networkId`: number, `address?`: undefined | string): *[ERC20ProxyWrapper](#class-erc20proxywrapper)*

*Defined in [contract_wrappers/erc20_proxy_wrapper.ts:18](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/erc20_proxy_wrapper.ts#L18)*

Instantiate ERC20ProxyWrapper

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`web3Wrapper` | `Web3Wrapper` | Web3Wrapper instance to use |
`networkId` | number | Desired networkId |
`address?` | undefined \| string | The address of the ERC20Proxy contract. If undefined, will default to the known address corresponding to the networkId.  |

**Returns:** *[ERC20ProxyWrapper](#class-erc20proxywrapper)*

## Properties

###  abi

• **abi**: *`ContractAbi`* =  ERC20Proxy.compilerOutput.abi

*Defined in [contract_wrappers/erc20_proxy_wrapper.ts:15](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/erc20_proxy_wrapper.ts#L15)*

___

###  address

• **address**: *string*

*Defined in [contract_wrappers/erc20_proxy_wrapper.ts:16](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/erc20_proxy_wrapper.ts#L16)*

## Methods

###  getAuthorizedAddressesAsync

▸ **getAuthorizedAddressesAsync**(): *`Promise<string[]>`*

*Defined in [contract_wrappers/erc20_proxy_wrapper.ts:61](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/erc20_proxy_wrapper.ts#L61)*

Get the list of all Exchange contract addresses authorized by the ERC20Proxy contract.

**Returns:** *`Promise<string[]>`*

The list of authorized addresses.

___

###  getProxyIdAsync

▸ **getProxyIdAsync**(): *`Promise<AssetProxyId>`*

*Defined in [contract_wrappers/erc20_proxy_wrapper.ts:39](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/erc20_proxy_wrapper.ts#L39)*

Get the 4 bytes ID of this asset proxy

**Returns:** *`Promise<AssetProxyId>`*

Proxy id

___

###  isAuthorizedAsync

▸ **isAuthorizedAsync**(`exchangeContractAddress`: string): *`Promise<boolean>`*

*Defined in [contract_wrappers/erc20_proxy_wrapper.ts:51](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/erc20_proxy_wrapper.ts#L51)*

Check if the Exchange contract address is authorized by the ERC20Proxy contract.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`exchangeContractAddress` | string | The hex encoded address of the Exchange contract to call. |

**Returns:** *`Promise<boolean>`*

Whether the exchangeContractAddress is authorized.

<hr />

> # Class: ERC20TokenWrapper

This class includes all the functionality related to interacting with ERC20 token contracts.
All ERC20 method calls are supported, along with some convenience methods for getting/setting allowances
to the 0x ERC20 Proxy smart contract.

## Hierarchy

* **ERC20TokenWrapper**

## Index

### Constructors

* [constructor](#constructor)

### Properties

* [UNLIMITED_ALLOWANCE_IN_BASE_UNITS](#unlimited_allowance_in_base_units)
* [abi](#abi)

### Methods

* [getAllowanceAsync](#getallowanceasync)
* [getBalanceAsync](#getbalanceasync)
* [getLogsAsync](#getlogsasync)
* [getProxyAllowanceAsync](#getproxyallowanceasync)
* [setAllowanceAsync](#setallowanceasync)
* [setProxyAllowanceAsync](#setproxyallowanceasync)
* [setUnlimitedAllowanceAsync](#setunlimitedallowanceasync)
* [setUnlimitedProxyAllowanceAsync](#setunlimitedproxyallowanceasync)
* [subscribe](#subscribe)
* [transferAsync](#transferasync)
* [transferFromAsync](#transferfromasync)
* [unsubscribe](#unsubscribe)
* [unsubscribeAll](#unsubscribeall)

## Constructors

###  constructor

\+ **new ERC20TokenWrapper**(`web3Wrapper`: `Web3Wrapper`, `erc20ProxyWrapper`: [ERC20ProxyWrapper](#class-erc20tokenwrapper)*

*Defined in [contract_wrappers/erc20_token_wrapper.ts:38](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/erc20_token_wrapper.ts#L38)*

Instantiate ERC20TokenWrapper

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`web3Wrapper` | `Web3Wrapper` | Web3Wrapper instance to use |
`erc20ProxyWrapper` | [ERC20ProxyWrapper](#class-erc20proxywrapper) | The ERC20ProxyWrapper instance to use  |
`blockPollingIntervalMs?` | undefined \| number | - |

**Returns:** *[ERC20TokenWrapper](#class-erc20tokenwrapper)*

## Properties

###  UNLIMITED_ALLOWANCE_IN_BASE_UNITS

• **UNLIMITED_ALLOWANCE_IN_BASE_UNITS**: *`BigNumber`* =  constants.UNLIMITED_ALLOWANCE_IN_BASE_UNITS

*Defined in [contract_wrappers/erc20_token_wrapper.ts:33](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/erc20_token_wrapper.ts#L33)*

___

###  abi

• **abi**: *`ContractAbi`* =  ERC20Token.compilerOutput.abi

*Defined in [contract_wrappers/erc20_token_wrapper.ts:32](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/erc20_token_wrapper.ts#L32)*

## Methods

###  getAllowanceAsync

▸ **getAllowanceAsync**(`tokenAddress`: string, `ownerAddress`: string, `spenderAddress`: string, `methodOpts`: [MethodOpts](#interface-methodopts)): *`Promise<BigNumber>`*

*Defined in [contract_wrappers/erc20_token_wrapper.ts:155](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/erc20_token_wrapper.ts#L155)*

Retrieves the owners allowance in baseUnits set to the spender's address.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`tokenAddress` | string | - | The hex encoded contract Ethereum address where the ERC20 token is deployed. |
`ownerAddress` | string | - | The hex encoded user Ethereum address whose allowance to spenderAddress                          you would like to retrieve. |
`spenderAddress` | string | - | The hex encoded user Ethereum address who can spend the allowance you are fetching. |
`methodOpts` | [MethodOpts](#interface-methodopts) |  {} | Optional arguments this method accepts.  |

**Returns:** *`Promise<BigNumber>`*

___

###  getBalanceAsync

▸ **getBalanceAsync**(`tokenAddress`: string, `ownerAddress`: string, `methodOpts`: [MethodOpts](#interface-methodopts)): *`Promise<BigNumber>`*

*Defined in [contract_wrappers/erc20_token_wrapper.ts:61](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/erc20_token_wrapper.ts#L61)*

Retrieves an owner's ERC20 token balance.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`tokenAddress` | string | - | The hex encoded contract Ethereum address where the ERC20 token is deployed. |
`ownerAddress` | string | - | The hex encoded user Ethereum address whose balance you would like to check. |
`methodOpts` | [MethodOpts](#interface-methodopts) |  {} | Optional arguments this method accepts. |

**Returns:** *`Promise<BigNumber>`*

The owner's ERC20 token balance in base units.

___

###  getLogsAsync

▸ **getLogsAsync**<**ArgsType**>(`tokenAddress`: string, `eventName`: `ERC20TokenEvents`, `blockRange`: [BlockRange](#interface-blockrange), `indexFilterValues`: [IndexedFilterValues](#interface-indexedfiltervalues)): *`Promise<Array<LogWithDecodedArgs<ArgsType>>>`*

*Defined in [contract_wrappers/erc20_token_wrapper.ts:409](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/erc20_token_wrapper.ts#L409)*

Gets historical logs without creating a subscription

**Type parameters:**

▪ **ArgsType**: *`ERC20TokenEventArgs`*

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`tokenAddress` | string | An address of the token that emitted the logs. |
`eventName` | `ERC20TokenEvents` | The token contract event you would like to subscribe to. |
`blockRange` | [BlockRange](#interface-blockrange) | Block range to get logs from. |
`indexFilterValues` | [IndexedFilterValues](#interface-indexedfiltervalues) | An object where the keys are indexed args returned by the event and                              the value is the value you are interested in. E.g `{_from: aUserAddressHex}` |

**Returns:** *`Promise<Array<LogWithDecodedArgs<ArgsType>>>`*

Array of logs that match the parameters

___

###  getProxyAllowanceAsync

▸ **getProxyAllowanceAsync**(`tokenAddress`: string, `ownerAddress`: string, `methodOpts`: [MethodOpts](#interface-methodopts)): *`Promise<BigNumber>`*

*Defined in [contract_wrappers/erc20_token_wrapper.ts:188](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/erc20_token_wrapper.ts#L188)*

Retrieves the owner's allowance in baseUnits set to the 0x proxy contract.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`tokenAddress` | string | - | The hex encoded contract Ethereum address where the ERC20 token is deployed. |
`ownerAddress` | string | - | The hex encoded user Ethereum address whose proxy contract allowance we are retrieving. |
`methodOpts` | [MethodOpts](#interface-methodopts) |  {} | Optional arguments this method accepts.  |

**Returns:** *`Promise<BigNumber>`*

___

###  setAllowanceAsync

▸ **setAllowanceAsync**(`tokenAddress`: string, `ownerAddress`: string, `spenderAddress`: string, `amountInBaseUnits`: `BigNumber`, `txOpts`: [TransactionOpts](#interface-transactionopts)): *`Promise<string>`*

*Defined in [contract_wrappers/erc20_token_wrapper.ts:91](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/erc20_token_wrapper.ts#L91)*

Sets the spender's allowance to a specified number of baseUnits on behalf of the owner address.
Equivalent to the ERC20 spec method `approve`.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`tokenAddress` | string | - | The hex encoded contract Ethereum address where the ERC20 token is deployed. |
`ownerAddress` | string | - | The hex encoded user Ethereum address who would like to set an allowance                              for spenderAddress. |
`spenderAddress` | string | - | The hex encoded user Ethereum address who will be able to spend the set allowance. |
`amountInBaseUnits` | `BigNumber` | - | The allowance amount you would like to set. |
`txOpts` | [TransactionOpts](#interface-transactionopts) |  {} | Transaction parameters. |

**Returns:** *`Promise<string>`*

Transaction hash.

___

###  setProxyAllowanceAsync

▸ **setProxyAllowanceAsync**(`tokenAddress`: string, `ownerAddress`: string, `amountInBaseUnits`: `BigNumber`, `txOpts`: [TransactionOpts](#interface-transactionopts)): *`Promise<string>`*

*Defined in [contract_wrappers/erc20_token_wrapper.ts:207](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/erc20_token_wrapper.ts#L207)*

Sets the 0x proxy contract's allowance to a specified number of a tokens' baseUnits on behalf
of an owner address.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`tokenAddress` | string | - | The hex encoded contract Ethereum address where the ERC20 token is deployed. |
`ownerAddress` | string | - | The hex encoded user Ethereum address who is setting an allowance                              for the Proxy contract. |
`amountInBaseUnits` | `BigNumber` | - | The allowance amount specified in baseUnits. |
`txOpts` | [TransactionOpts](#interface-transactionopts) |  {} | Transaction parameters. |

**Returns:** *`Promise<string>`*

Transaction hash.

___

###  setUnlimitedAllowanceAsync

▸ **setUnlimitedAllowanceAsync**(`tokenAddress`: string, `ownerAddress`: string, `spenderAddress`: string, `txOpts`: [TransactionOpts](#interface-transactionopts)): *`Promise<string>`*

*Defined in [contract_wrappers/erc20_token_wrapper.ts:132](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/erc20_token_wrapper.ts#L132)*

Sets the spender's allowance to an unlimited number of baseUnits on behalf of the owner address.
Equivalent to the ERC20 spec method `approve`.
Setting an unlimited allowance will lower the gas cost for filling orders involving tokens that forego updating
allowances set to the max amount (e.g ZRX, WETH)

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`tokenAddress` | string | - | The hex encoded contract Ethereum address where the ERC20 token is deployed. |
`ownerAddress` | string | - | The hex encoded user Ethereum address who would like to set an allowance                              for spenderAddress. |
`spenderAddress` | string | - | The hex encoded user Ethereum address who will be able to spend the set allowance. |
`txOpts` | [TransactionOpts](#interface-transactionopts) |  {} | Transaction parameters. |

**Returns:** *`Promise<string>`*

Transaction hash.

___

###  setUnlimitedProxyAllowanceAsync

▸ **setUnlimitedProxyAllowanceAsync**(`tokenAddress`: string, `ownerAddress`: string, `txOpts`: [TransactionOpts](#interface-transactionopts)): *`Promise<string>`*

*Defined in [contract_wrappers/erc20_token_wrapper.ts:234](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/erc20_token_wrapper.ts#L234)*

Sets the 0x proxy contract's allowance to a unlimited number of a tokens' baseUnits on behalf
of an owner address.
Setting an unlimited allowance will lower the gas cost for filling orders involving tokens that forego updating
allowances set to the max amount (e.g ZRX, WETH)

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`tokenAddress` | string | - | The hex encoded contract Ethereum address where the ERC20 token is deployed. |
`ownerAddress` | string | - | The hex encoded user Ethereum address who is setting an allowance                              for the Proxy contract. |
`txOpts` | [TransactionOpts](#interface-transactionopts) |  {} | Transaction parameters. |

**Returns:** *`Promise<string>`*

Transaction hash.

___

###  subscribe

▸ **subscribe**<**ArgsType**>(`tokenAddress`: string, `eventName`: `ERC20TokenEvents`, `indexFilterValues`: [IndexedFilterValues](#eventcallback)‹*`ArgsType`*›, `isVerbose`: boolean): *string*

*Defined in [contract_wrappers/erc20_token_wrapper.ts:363](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/erc20_token_wrapper.ts#L363)*

Subscribe to an event type emitted by the Token contract.

**Type parameters:**

▪ **ArgsType**: *`ERC20TokenEventArgs`*

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`tokenAddress` | string | - | The hex encoded address where the ERC20 token is deployed. |
`eventName` | `ERC20TokenEvents` | - | The token contract event you would like to subscribe to. |
`indexFilterValues` | [IndexedFilterValues](#interface-indexedfiltervalues) | - | An object where the keys are indexed args returned by the event and                              the value is the value you are interested in. E.g `{maker: aUserAddressHex}` |
`callback` | [EventCallback](#eventcallback)‹*`ArgsType`*› | - | Callback that gets called when a log is added/removed |
`isVerbose` | boolean | false | Enable verbose subscription warnings (e.g recoverable network issues encountered) |

**Returns:** *string*

Subscription token used later to unsubscribe

___

###  transferAsync

▸ **transferAsync**(`tokenAddress`: string, `fromAddress`: string, `toAddress`: string, `amountInBaseUnits`: `BigNumber`, `txOpts`: [TransactionOpts](#interface-transactionopts)): *`Promise<string>`*

*Defined in [contract_wrappers/erc20_token_wrapper.ts:256](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/erc20_token_wrapper.ts#L256)*

Transfers `amountInBaseUnits` ERC20 tokens from `fromAddress` to `toAddress`.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`tokenAddress` | string | - | The hex encoded contract Ethereum address where the ERC20 token is deployed. |
`fromAddress` | string | - | The hex encoded user Ethereum address that will send the funds. |
`toAddress` | string | - | The hex encoded user Ethereum address that will receive the funds. |
`amountInBaseUnits` | `BigNumber` | - | The amount (specified in baseUnits) of the token to transfer. |
`txOpts` | [TransactionOpts](#interface-transactionopts) |  {} | Transaction parameters. |

**Returns:** *`Promise<string>`*

Transaction hash.

___

###  transferFromAsync

▸ **transferFromAsync**(`tokenAddress`: string, `fromAddress`: string, `toAddress`: string, `senderAddress`: string, `amountInBaseUnits`: `BigNumber`, `txOpts`: [TransactionOpts](#interface-transactionopts)): *`Promise<string>`*

*Defined in [contract_wrappers/erc20_token_wrapper.ts:305](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/erc20_token_wrapper.ts#L305)*

Transfers `amountInBaseUnits` ERC20 tokens from `fromAddress` to `toAddress`.
Requires the fromAddress to have sufficient funds and to have approved an allowance of
`amountInBaseUnits` to `senderAddress`.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`tokenAddress` | string | - | The hex encoded contract Ethereum address where the ERC20 token is deployed. |
`fromAddress` | string | - | The hex encoded user Ethereum address whose funds are being sent. |
`toAddress` | string | - | The hex encoded user Ethereum address that will receive the funds. |
`senderAddress` | string | - | The hex encoded user Ethereum address whose initiates the fund transfer. The                              `fromAddress` must have set an allowance to the `senderAddress`                              before this call. |
`amountInBaseUnits` | `BigNumber` | - | The amount (specified in baseUnits) of the token to transfer. |
`txOpts` | [TransactionOpts](#interface-transactionopts) |  {} | Transaction parameters. |

**Returns:** *`Promise<string>`*

Transaction hash.

___

###  unsubscribe

▸ **unsubscribe**(`subscriptionToken`: string): *void*

*Defined in [contract_wrappers/erc20_token_wrapper.ts:390](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/erc20_token_wrapper.ts#L390)*

Cancel a subscription

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`subscriptionToken` | string | Subscription token returned by `subscribe()`  |

**Returns:** *void*

___

###  unsubscribeAll

▸ **unsubscribeAll**(): *void*

*Defined in [contract_wrappers/erc20_token_wrapper.ts:397](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/erc20_token_wrapper.ts#L397)*

Cancels all existing subscriptions

**Returns:** *void*

<hr />

> # Class: ERC721ProxyWrapper

This class includes the functionality related to interacting with the ERC721Proxy contract.

## Hierarchy

* **ERC721ProxyWrapper**

## Index

### Constructors

* [constructor](#constructor)

### Properties

* [abi](#abi)
* [address](#address)

### Methods

* [getAuthorizedAddressesAsync](#getauthorizedaddressesasync)
* [getProxyIdAsync](#getproxyidasync)
* [isAuthorizedAsync](#isauthorizedasync)

## Constructors

###  constructor

\+ **new ERC721ProxyWrapper**(`web3Wrapper`: `Web3Wrapper`, `networkId`: number, `address?`: undefined | string): *[ERC721ProxyWrapper](#class-erc721proxywrapper)*

*Defined in [contract_wrappers/erc721_proxy_wrapper.ts:18](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/erc721_proxy_wrapper.ts#L18)*

Instantiate ERC721ProxyWrapper

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`web3Wrapper` | `Web3Wrapper` | Web3Wrapper instance to use |
`networkId` | number | Desired networkId |
`address?` | undefined \| string | The address of the ERC721Proxy contract. If undefined, will default to the known address corresponding to the networkId.  |

**Returns:** *[ERC721ProxyWrapper](#class-erc721proxywrapper)*

## Properties

###  abi

• **abi**: *`ContractAbi`* =  ERC721Proxy.compilerOutput.abi

*Defined in [contract_wrappers/erc721_proxy_wrapper.ts:15](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/erc721_proxy_wrapper.ts#L15)*

___

###  address

• **address**: *string*

*Defined in [contract_wrappers/erc721_proxy_wrapper.ts:16](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/erc721_proxy_wrapper.ts#L16)*

## Methods

###  getAuthorizedAddressesAsync

▸ **getAuthorizedAddressesAsync**(): *`Promise<string[]>`*

*Defined in [contract_wrappers/erc721_proxy_wrapper.ts:61](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/erc721_proxy_wrapper.ts#L61)*

Get the list of all Exchange contract addresses authorized by the ERC721Proxy contract.

**Returns:** *`Promise<string[]>`*

The list of authorized addresses.

___

###  getProxyIdAsync

▸ **getProxyIdAsync**(): *`Promise<AssetProxyId>`*

*Defined in [contract_wrappers/erc721_proxy_wrapper.ts:39](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/erc721_proxy_wrapper.ts#L39)*

Get the 4 bytes ID of this asset proxy

**Returns:** *`Promise<AssetProxyId>`*

Proxy id

___

###  isAuthorizedAsync

▸ **isAuthorizedAsync**(`exchangeContractAddress`: string): *`Promise<boolean>`*

*Defined in [contract_wrappers/erc721_proxy_wrapper.ts:51](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/erc721_proxy_wrapper.ts#L51)*

Check if the Exchange contract address is authorized by the ERC721Proxy contract.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`exchangeContractAddress` | string | The hex encoded address of the Exchange contract to call. |

**Returns:** *`Promise<boolean>`*

Whether the exchangeContractAddress is authorized.

<hr />

> # Class: ERC721TokenWrapper

This class includes all the functionality related to interacting with ERC721 token contracts.
All ERC721 method calls are supported, along with some convenience methods for getting/setting allowances
to the 0x ERC721 Proxy smart contract.

## Hierarchy

* **ERC721TokenWrapper**

## Index

### Constructors

* [constructor](#constructor)

### Properties

* [abi](#abi)

### Methods

* [getApprovedIfExistsAsync](#getapprovedifexistsasync)
* [getLogsAsync](#getlogsasync)
* [getOwnerOfAsync](#getownerofasync)
* [getTokenCountAsync](#gettokencountasync)
* [isApprovedForAllAsync](#isapprovedforallasync)
* [isProxyApprovedAsync](#isproxyapprovedasync)
* [isProxyApprovedForAllAsync](#isproxyapprovedforallasync)
* [setApprovalAsync](#setapprovalasync)
* [setApprovalForAllAsync](#setapprovalforallasync)
* [setProxyApprovalAsync](#setproxyapprovalasync)
* [setProxyApprovalForAllAsync](#setproxyapprovalforallasync)
* [subscribe](#subscribe)
* [transferFromAsync](#transferfromasync)
* [unsubscribe](#unsubscribe)
* [unsubscribeAll](#unsubscribeall)

## Constructors

###  constructor

\+ **new ERC721TokenWrapper**(`web3Wrapper`: `Web3Wrapper`, `erc721ProxyWrapper`: [ERC721ProxyWrapper](#class-erc721tokenwrapper)*

*Defined in [contract_wrappers/erc721_token_wrapper.ts:37](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/erc721_token_wrapper.ts#L37)*

Instantiate ERC721TokenWrapper

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`web3Wrapper` | `Web3Wrapper` | Web3Wrapper instance to use |
`erc721ProxyWrapper` | [ERC721ProxyWrapper](#class-erc721proxywrapper) | The ERC721ProxyWrapper instance to use  |
`blockPollingIntervalMs?` | undefined \| number | - |

**Returns:** *[ERC721TokenWrapper](#class-erc721tokenwrapper)*

## Properties

###  abi

• **abi**: *`ContractAbi`* =  ERC721Token.compilerOutput.abi

*Defined in [contract_wrappers/erc721_token_wrapper.ts:32](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/erc721_token_wrapper.ts#L32)*

## Methods

###  getApprovedIfExistsAsync

▸ **getApprovedIfExistsAsync**(`tokenAddress`: string, `tokenId`: `BigNumber`, `methodOpts`: [MethodOpts](#interface-methodopts)): *`Promise<string | undefined>`*

*Defined in [contract_wrappers/erc721_token_wrapper.ts:170](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/erc721_token_wrapper.ts#L170)*

Get the approved address for a single NFT. Returns undefined if no approval was set
Throws if `_tokenId` is not a valid NFT

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`tokenAddress` | string | - | The hex encoded contract Ethereum address where the ERC721 token is deployed. |
`tokenId` | `BigNumber` | - | The identifier for an NFT |
`methodOpts` | [MethodOpts](#interface-methodopts) |  {} | Optional arguments this method accepts. |

**Returns:** *`Promise<string | undefined>`*

The approved address for this NFT, or the undefined if there is none

___

###  getLogsAsync

▸ **getLogsAsync**<**ArgsType**>(`tokenAddress`: string, `eventName`: `ERC721TokenEvents`, `blockRange`: [BlockRange](#interface-blockrange), `indexFilterValues`: [IndexedFilterValues](#interface-indexedfiltervalues)): *`Promise<Array<LogWithDecodedArgs<ArgsType>>>`*

*Defined in [contract_wrappers/erc721_token_wrapper.ts:436](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/erc721_token_wrapper.ts#L436)*

Gets historical logs without creating a subscription

**Type parameters:**

▪ **ArgsType**: *`ERC721TokenEventArgs`*

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`tokenAddress` | string | An address of the token that emitted the logs. |
`eventName` | `ERC721TokenEvents` | The token contract event you would like to subscribe to. |
`blockRange` | [BlockRange](#interface-blockrange) | Block range to get logs from. |
`indexFilterValues` | [IndexedFilterValues](#interface-indexedfiltervalues) | An object where the keys are indexed args returned by the event and                              the value is the value you are interested in. E.g `{_from: aUserAddressHex}` |

**Returns:** *`Promise<Array<LogWithDecodedArgs<ArgsType>>>`*

Array of logs that match the parameters

___

###  getOwnerOfAsync

▸ **getOwnerOfAsync**(`tokenAddress`: string, `tokenId`: `BigNumber`, `methodOpts`: [MethodOpts](#interface-methodopts)): *`Promise<string>`*

*Defined in [contract_wrappers/erc721_token_wrapper.ts:88](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/erc721_token_wrapper.ts#L88)*

Find the owner of an NFT
NFTs assigned to zero address are considered invalid, and queries about them do throw.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`tokenAddress` | string | - | The hex encoded contract Ethereum address where the ERC721 token is deployed. |
`tokenId` | `BigNumber` | - | The identifier for an NFT |
`methodOpts` | [MethodOpts](#interface-methodopts) |  {} | Optional arguments this method accepts. |

**Returns:** *`Promise<string>`*

The address of the owner of the NFT

___

###  getTokenCountAsync

▸ **getTokenCountAsync**(`tokenAddress`: string, `ownerAddress`: string, `methodOpts`: [MethodOpts](#interface-methodopts)): *`Promise<BigNumber>`*

*Defined in [contract_wrappers/erc721_token_wrapper.ts:61](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/erc721_token_wrapper.ts#L61)*

Count all NFTs assigned to an owner
NFTs assigned to the zero address are considered invalid, and this function throws for queries about the zero address.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`tokenAddress` | string | - | The hex encoded contract Ethereum address where the ERC721 token is deployed. |
`ownerAddress` | string | - | The hex encoded user Ethereum address whose balance you would like to check. |
`methodOpts` | [MethodOpts](#interface-methodopts) |  {} | Optional arguments this method accepts. |

**Returns:** *`Promise<BigNumber>`*

The number of NFTs owned by `ownerAddress`, possibly zero

___

###  isApprovedForAllAsync

▸ **isApprovedForAllAsync**(`tokenAddress`: string, `ownerAddress`: string, `operatorAddress`: string, `methodOpts`: [MethodOpts](#interface-methodopts)): *`Promise<boolean>`*

*Defined in [contract_wrappers/erc721_token_wrapper.ts:116](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/erc721_token_wrapper.ts#L116)*

Query if an address is an authorized operator for all NFT's of `ownerAddress`

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`tokenAddress` | string | - | The hex encoded contract Ethereum address where the ERC721 token is deployed. |
`ownerAddress` | string | - | The hex encoded user Ethereum address of the token owner. |
`operatorAddress` | string | - | The hex encoded user Ethereum address of the operator you'd like to check if approved. |
`methodOpts` | [MethodOpts](#interface-methodopts) |  {} | Optional arguments this method accepts. |

**Returns:** *`Promise<boolean>`*

True if `operatorAddress` is an approved operator for `ownerAddress`, false otherwise

___

###  isProxyApprovedAsync

▸ **isProxyApprovedAsync**(`tokenAddress`: string, `tokenId`: `BigNumber`, `methodOpts`: [MethodOpts](#interface-methodopts)): *`Promise<boolean>`*

*Defined in [contract_wrappers/erc721_token_wrapper.ts:197](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/erc721_token_wrapper.ts#L197)*

Checks if 0x proxy is approved for a single NFT
Throws if `_tokenId` is not a valid NFT

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`tokenAddress` | string | - | The hex encoded contract Ethereum address where the ERC721 token is deployed. |
`tokenId` | `BigNumber` | - | The identifier for an NFT |
`methodOpts` | [MethodOpts](#interface-methodopts) |  {} | Optional arguments this method accepts. |

**Returns:** *`Promise<boolean>`*

True if 0x proxy is approved

___

###  isProxyApprovedForAllAsync

▸ **isProxyApprovedForAllAsync**(`tokenAddress`: string, `ownerAddress`: string, `methodOpts`: [MethodOpts](#interface-methodopts)): *`Promise<boolean>`*

*Defined in [contract_wrappers/erc721_token_wrapper.ts:148](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/erc721_token_wrapper.ts#L148)*

Query if 0x proxy is an authorized operator for all NFT's of `ownerAddress`

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`tokenAddress` | string | - | The hex encoded contract Ethereum address where the ERC721 token is deployed. |
`ownerAddress` | string | - | The hex encoded user Ethereum address of the token owner. |
`methodOpts` | [MethodOpts](#interface-methodopts) |  {} | Optional arguments this method accepts. |

**Returns:** *`Promise<boolean>`*

True if `operatorAddress` is an approved operator for `ownerAddress`, false otherwise

___

###  setApprovalAsync

▸ **setApprovalAsync**(`tokenAddress`: string, `approvedAddress`: string, `tokenId`: `BigNumber`, `txOpts`: [TransactionOpts](#interface-transactionopts)): *`Promise<string>`*

*Defined in [contract_wrappers/erc721_token_wrapper.ts:280](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/erc721_token_wrapper.ts#L280)*

Set or reaffirm the approved address for an NFT
The zero address indicates there is no approved address. Throws unless `msg.sender` is the current NFT owner,
or an authorized operator of the current owner.
Throws if `_tokenId` is not a valid NFT
Emits the Approval event.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`tokenAddress` | string | - | The hex encoded contract Ethereum address where the ERC721 token is deployed. |
`approvedAddress` | string | - | The hex encoded user Ethereum address you'd like to set approval for. |
`tokenId` | `BigNumber` | - | The identifier for an NFT |
`txOpts` | [TransactionOpts](#interface-transactionopts) |  {} | Transaction parameters. |

**Returns:** *`Promise<string>`*

Transaction hash.

___

###  setApprovalForAllAsync

▸ **setApprovalForAllAsync**(`tokenAddress`: string, `ownerAddress`: string, `operatorAddress`: string, `isApproved`: boolean, `txOpts`: [TransactionOpts](#interface-transactionopts)): *`Promise<string>`*

*Defined in [contract_wrappers/erc721_token_wrapper.ts:218](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/erc721_token_wrapper.ts#L218)*

Enable or disable approval for a third party ("operator") to manage all of `ownerAddress`'s assets.
Throws if `_tokenId` is not a valid NFT
Emits the ApprovalForAll event.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`tokenAddress` | string | - | The hex encoded contract Ethereum address where the ERC721 token is deployed. |
`ownerAddress` | string | - | The hex encoded user Ethereum address of the token owner. |
`operatorAddress` | string | - | The hex encoded user Ethereum address of the operator you'd like to set approval for. |
`isApproved` | boolean | - | The boolean variable to set the approval to. |
`txOpts` | [TransactionOpts](#interface-transactionopts) |  {} | Transaction parameters. |

**Returns:** *`Promise<string>`*

Transaction hash.

___

###  setProxyApprovalAsync

▸ **setProxyApprovalAsync**(`tokenAddress`: string, `tokenId`: `BigNumber`, `txOpts`: [TransactionOpts](#interface-transactionopts)): *`Promise<string>`*

*Defined in [contract_wrappers/erc721_token_wrapper.ts:318](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/erc721_token_wrapper.ts#L318)*

Set or reaffirm 0x proxy as an approved address for an NFT
Throws unless `msg.sender` is the current NFT owner, or an authorized operator of the current owner.
Throws if `_tokenId` is not a valid NFT
Emits the Approval event.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`tokenAddress` | string | - | The hex encoded contract Ethereum address where the ERC721 token is deployed. |
`tokenId` | `BigNumber` | - | The identifier for an NFT |
`txOpts` | [TransactionOpts](#interface-transactionopts) |  {} | Transaction parameters. |

**Returns:** *`Promise<string>`*

Transaction hash.

___

###  setProxyApprovalForAllAsync

▸ **setProxyApprovalForAllAsync**(`tokenAddress`: string, `ownerAddress`: string, `isApproved`: boolean, `txOpts`: [TransactionOpts](#interface-transactionopts)): *`Promise<string>`*

*Defined in [contract_wrappers/erc721_token_wrapper.ts:258](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/erc721_token_wrapper.ts#L258)*

Enable or disable approval for a third party ("operator") to manage all of `ownerAddress`'s assets.
Throws if `_tokenId` is not a valid NFT
Emits the ApprovalForAll event.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`tokenAddress` | string | - | The hex encoded contract Ethereum address where the ERC721 token is deployed. |
`ownerAddress` | string | - | The hex encoded user Ethereum address of the token owner. |
`isApproved` | boolean | - | The boolean variable to set the approval to. |
`txOpts` | [TransactionOpts](#interface-transactionopts) |  {} | Transaction parameters. |

**Returns:** *`Promise<string>`*

Transaction hash.

___

###  subscribe

▸ **subscribe**<**ArgsType**>(`tokenAddress`: string, `eventName`: `ERC721TokenEvents`, `indexFilterValues`: [IndexedFilterValues](#eventcallback)‹*`ArgsType`*›, `isVerbose`: boolean): *string*

*Defined in [contract_wrappers/erc721_token_wrapper.ts:390](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/erc721_token_wrapper.ts#L390)*

Subscribe to an event type emitted by the Token contract.

**Type parameters:**

▪ **ArgsType**: *`ERC721TokenEventArgs`*

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`tokenAddress` | string | - | The hex encoded address where the ERC721 token is deployed. |
`eventName` | `ERC721TokenEvents` | - | The token contract event you would like to subscribe to. |
`indexFilterValues` | [IndexedFilterValues](#interface-indexedfiltervalues) | - | An object where the keys are indexed args returned by the event and                              the value is the value you are interested in. E.g `{maker: aUserAddressHex}` |
`callback` | [EventCallback](#eventcallback)‹*`ArgsType`*› | - | Callback that gets called when a log is added/removed |
`isVerbose` | boolean | false | Enable verbose subscription warnings (e.g recoverable network issues encountered) |

**Returns:** *string*

Subscription token used later to unsubscribe

___

###  transferFromAsync

▸ **transferFromAsync**(`tokenAddress`: string, `receiverAddress`: string, `senderAddress`: string, `tokenId`: `BigNumber`, `txOpts`: [TransactionOpts](#interface-transactionopts)): *`Promise<string>`*

*Defined in [contract_wrappers/erc721_token_wrapper.ts:338](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/erc721_token_wrapper.ts#L338)*

Enable or disable approval for a third party ("operator") to manage all of `ownerAddress`'s assets.
Throws if `_tokenId` is not a valid NFT
Emits the ApprovalForAll event.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`tokenAddress` | string | - | The hex encoded contract Ethereum address where the ERC721 token is deployed. |
`receiverAddress` | string | - | The hex encoded Ethereum address of the user to send the NFT to. |
`senderAddress` | string | - | The hex encoded Ethereum address of the user to send the NFT to. |
`tokenId` | `BigNumber` | - | The identifier for an NFT |
`txOpts` | [TransactionOpts](#interface-transactionopts) |  {} | Transaction parameters. |

**Returns:** *`Promise<string>`*

Transaction hash.

___

###  unsubscribe

▸ **unsubscribe**(`subscriptionToken`: string): *void*

*Defined in [contract_wrappers/erc721_token_wrapper.ts:417](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/erc721_token_wrapper.ts#L417)*

Cancel a subscription

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`subscriptionToken` | string | Subscription token returned by `subscribe()`  |

**Returns:** *void*

___

###  unsubscribeAll

▸ **unsubscribeAll**(): *void*

*Defined in [contract_wrappers/erc721_token_wrapper.ts:424](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/erc721_token_wrapper.ts#L424)*

Cancels all existing subscriptions

**Returns:** *void*

<hr />

> # Class: EtherTokenWrapper

This class includes all the functionality related to interacting with a wrapped Ether ERC20 token contract.
The caller can convert ETH into the equivalent number of wrapped ETH ERC20 tokens and back.

## Hierarchy

* **EtherTokenWrapper**

## Index

### Constructors

* [constructor](#constructor)

### Properties

* [abi](#abi)

### Methods

* [depositAsync](#depositasync)
* [getLogsAsync](#getlogsasync)
* [subscribe](#subscribe)
* [unsubscribe](#unsubscribe)
* [unsubscribeAll](#unsubscribeall)
* [withdrawAsync](#withdrawasync)

## Constructors

###  constructor

\+ **new EtherTokenWrapper**(`web3Wrapper`: `Web3Wrapper`, `erc20TokenWrapper`: [ERC20TokenWrapper](#class-ethertokenwrapper)*

*Defined in [contract_wrappers/ether_token_wrapper.ts:28](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/ether_token_wrapper.ts#L28)*

Instantiate EtherTokenWrapper.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`web3Wrapper` | `Web3Wrapper` | Web3Wrapper instance to use |
`erc20TokenWrapper` | [ERC20TokenWrapper](#class-erc20tokenwrapper) | The ERC20TokenWrapper instance to use  |
`blockPollingIntervalMs?` | undefined \| number | - |

**Returns:** *[EtherTokenWrapper](#class-ethertokenwrapper)*

## Properties

###  abi

• **abi**: *`ContractAbi`* =  WETH9.compilerOutput.abi

*Defined in [contract_wrappers/ether_token_wrapper.ts:21](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/ether_token_wrapper.ts#L21)*

## Methods

###  depositAsync

▸ **depositAsync**(`etherTokenAddress`: string, `amountInWei`: `BigNumber`, `depositor`: string, `txOpts`: [TransactionOpts](#interface-transactionopts)): *`Promise<string>`*

*Defined in [contract_wrappers/ether_token_wrapper.ts:53](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/ether_token_wrapper.ts#L53)*

Deposit ETH into the Wrapped ETH smart contract and issues the equivalent number of wrapped ETH tokens
to the depositor address. These wrapped ETH tokens can be used in 0x trades and are redeemable for 1-to-1
for ETH.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`etherTokenAddress` | string | - | EtherToken address you wish to deposit into. |
`amountInWei` | `BigNumber` | - | Amount of ETH in Wei the caller wishes to deposit. |
`depositor` | string | - | The hex encoded user Ethereum address that would like to make the deposit. |
`txOpts` | [TransactionOpts](#interface-transactionopts) |  {} | Transaction parameters. |

**Returns:** *`Promise<string>`*

Transaction hash.

___

###  getLogsAsync

▸ **getLogsAsync**<**ArgsType**>(`etherTokenAddress`: string, `eventName`: `WETH9Events`, `blockRange`: [BlockRange](#interface-blockrange), `indexFilterValues`: [IndexedFilterValues](#interface-indexedfiltervalues)): *`Promise<Array<LogWithDecodedArgs<ArgsType>>>`*

*Defined in [contract_wrappers/ether_token_wrapper.ts:131](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/ether_token_wrapper.ts#L131)*

Gets historical logs without creating a subscription

**Type parameters:**

▪ **ArgsType**: *`WETH9EventArgs`*

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`etherTokenAddress` | string | An address of the ether token that emitted the logs. |
`eventName` | `WETH9Events` | The ether token contract event you would like to subscribe to. |
`blockRange` | [BlockRange](#interface-blockrange) | Block range to get logs from. |
`indexFilterValues` | [IndexedFilterValues](#interface-indexedfiltervalues) | An object where the keys are indexed args returned by the event and                              the value is the value you are interested in. E.g `{_owner: aUserAddressHex}` |

**Returns:** *`Promise<Array<LogWithDecodedArgs<ArgsType>>>`*

Array of logs that match the parameters

___

###  subscribe

▸ **subscribe**<**ArgsType**>(`etherTokenAddress`: string, `eventName`: `WETH9Events`, `indexFilterValues`: [IndexedFilterValues](#eventcallback)‹*`ArgsType`*›, `isVerbose`: boolean): *string*

*Defined in [contract_wrappers/ether_token_wrapper.ts:161](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/ether_token_wrapper.ts#L161)*

Subscribe to an event type emitted by the Token contract.

**Type parameters:**

▪ **ArgsType**: *`WETH9EventArgs`*

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`etherTokenAddress` | string | - | The hex encoded address where the ether token is deployed. |
`eventName` | `WETH9Events` | - | The ether token contract event you would like to subscribe to. |
`indexFilterValues` | [IndexedFilterValues](#interface-indexedfiltervalues) | - | An object where the keys are indexed args returned by the event and                              the value is the value you are interested in. E.g `{_owner: aUserAddressHex}` |
`callback` | [EventCallback](#eventcallback)‹*`ArgsType`*› | - | Callback that gets called when a log is added/removed |
`isVerbose` | boolean | false | Enable verbose subscription warnings (e.g recoverable network issues encountered) |

**Returns:** *string*

Subscription token used later to unsubscribe

___

###  unsubscribe

▸ **unsubscribe**(`subscriptionToken`: string): *void*

*Defined in [contract_wrappers/ether_token_wrapper.ts:188](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/ether_token_wrapper.ts#L188)*

Cancel a subscription

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`subscriptionToken` | string | Subscription token returned by `subscribe()`  |

**Returns:** *void*

___

###  unsubscribeAll

▸ **unsubscribeAll**(): *void*

*Defined in [contract_wrappers/ether_token_wrapper.ts:195](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/ether_token_wrapper.ts#L195)*

Cancels all existing subscriptions

**Returns:** *void*

___

###  withdrawAsync

▸ **withdrawAsync**(`etherTokenAddress`: string, `amountInWei`: `BigNumber`, `withdrawer`: string, `txOpts`: [TransactionOpts](#interface-transactionopts)): *`Promise<string>`*

*Defined in [contract_wrappers/ether_token_wrapper.ts:89](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/ether_token_wrapper.ts#L89)*

Withdraw ETH to the withdrawer's address from the wrapped ETH smart contract in exchange for the
equivalent number of wrapped ETH tokens.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`etherTokenAddress` | string | - | EtherToken address you wish to withdraw from. |
`amountInWei` | `BigNumber` | - | Amount of ETH in Wei the caller wishes to withdraw. |
`withdrawer` | string | - | The hex encoded user Ethereum address that would like to make the withdrawal. |
`txOpts` | [TransactionOpts](#interface-transactionopts) |  {} | Transaction parameters. |

**Returns:** *`Promise<string>`*

Transaction hash.

<hr />

> # Class: ExchangeWrapper

This class includes all the functionality related to calling methods, sending transactions and subscribing to
events of the 0x V2 Exchange smart contract.

## Hierarchy

* **ExchangeWrapper**

## Index

### Constructors

* [constructor](#constructor)

### Properties

* [abi](#abi)
* [address](#address)
* [zrxTokenAddress](#zrxtokenaddress)

### Methods

* [batchCancelOrdersAsync](#batchcancelordersasync)
* [batchFillOrKillOrdersAsync](#batchfillorkillordersasync)
* [batchFillOrdersAsync](#batchfillordersasync)
* [batchFillOrdersNoThrowAsync](#batchfillordersnothrowasync)
* [cancelOrderAsync](#cancelorderasync)
* [cancelOrdersUpToAsync](#cancelordersuptoasync)
* [executeTransactionAsync](#executetransactionasync)
* [fillOrKillOrderAsync](#fillorkillorderasync)
* [fillOrderAsync](#fillorderasync)
* [fillOrderNoThrowAsync](#fillordernothrowasync)
* [getAssetProxyBySignatureAsync](#getassetproxybysignatureasync)
* [getFilledTakerAssetAmountAsync](#getfilledtakerassetamountasync)
* [getLogsAsync](#getlogsasync)
* [getOrderEpochAsync](#getorderepochasync)
* [getOrderInfoAsync](#getorderinfoasync)
* [getOrdersInfoAsync](#getordersinfoasync)
* [getVersionAsync](#getversionasync)
* [getZRXAssetData](#getzrxassetdata)
* [isAllowedValidatorAsync](#isallowedvalidatorasync)
* [isCancelledAsync](#iscancelledasync)
* [isPreSignedAsync](#ispresignedasync)
* [isTransactionExecutedAsync](#istransactionexecutedasync)
* [isValidSignatureAsync](#isvalidsignatureasync)
* [marketBuyOrdersAsync](#marketbuyordersasync)
* [marketBuyOrdersNoThrowAsync](#marketbuyordersnothrowasync)
* [marketSellOrdersAsync](#marketsellordersasync)
* [marketSellOrdersNoThrowAsync](#marketsellordersnothrowasync)
* [matchOrdersAsync](#matchordersasync)
* [preSignAsync](#presignasync)
* [setSignatureValidatorApprovalAsync](#setsignaturevalidatorapprovalasync)
* [subscribe](#subscribe)
* [transactionEncoderAsync](#transactionencoderasync)
* [unsubscribe](#unsubscribe)
* [unsubscribeAll](#unsubscribeall)
* [validateFillOrderThrowIfInvalidAsync](#validatefillorderthrowifinvalidasync)
* [validateMakerTransferThrowIfInvalidAsync](#validatemakertransferthrowifinvalidasync)
* [validateOrderFillableOrThrowAsync](#validateorderfillableorthrowasync)

## Constructors

###  constructor

\+ **new ExchangeWrapper**(`web3Wrapper`: `Web3Wrapper`, `networkId`: number, `erc20TokenWrapper`: [ERC20TokenWrapper](#class-exchangewrapper)*

*Defined in [contract_wrappers/exchange_wrapper.ts:55](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/exchange_wrapper.ts#L55)*

Instantiate ExchangeWrapper

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`web3Wrapper` | `Web3Wrapper` | Web3Wrapper instance to use. |
`networkId` | number | Desired networkId. |
`erc20TokenWrapper` | [ERC20TokenWrapper](#class-erc20tokenwrapper) | ERC20TokenWrapper instance to use. |
`erc721TokenWrapper` | [ERC721TokenWrapper](#class-erc721tokenwrapper) | ERC721TokenWrapper instance to use. |
`address?` | undefined \| string | The address of the Exchange contract. If undefined, will default to the known address corresponding to the networkId. |
`zrxTokenAddress?` | undefined \| string | The address of the ZRXToken contract. If undefined, will default to the known address corresponding to the networkId. |
`blockPollingIntervalMs?` | undefined \| number | The block polling interval to use for active subscriptions.  |

**Returns:** *[ExchangeWrapper](#class-exchangewrapper)*

## Properties

###  abi

• **abi**: *`ContractAbi`* =  Exchange.compilerOutput.abi

*Defined in [contract_wrappers/exchange_wrapper.ts:48](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/exchange_wrapper.ts#L48)*

___

###  address

• **address**: *string*

*Defined in [contract_wrappers/exchange_wrapper.ts:49](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/exchange_wrapper.ts#L49)*

___

###  zrxTokenAddress

• **zrxTokenAddress**: *string*

*Defined in [contract_wrappers/exchange_wrapper.ts:50](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/exchange_wrapper.ts#L50)*

## Methods

###  batchCancelOrdersAsync

▸ **batchCancelOrdersAsync**(`orders`: `Array<Order | SignedOrder>`, `orderTransactionOpts`: [OrderTransactionOpts](#interface-ordertransactionopts)): *`Promise<string>`*

*Defined in [contract_wrappers/exchange_wrapper.ts:713](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/exchange_wrapper.ts#L713)*

Batch version of cancelOrderAsync. Executes multiple cancels atomically in a single transaction.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`orders` | `Array<Order \| SignedOrder>` | - | An array of orders to cancel. |
`orderTransactionOpts` | [OrderTransactionOpts](#interface-ordertransactionopts) |  { shouldValidate: true } | Optional arguments this method accepts. |

**Returns:** *`Promise<string>`*

Transaction hash.

___

###  batchFillOrKillOrdersAsync

▸ **batchFillOrKillOrdersAsync**(`signedOrders`: `SignedOrder`[], `takerAssetFillAmounts`: `BigNumber`[], `takerAddress`: string, `orderTransactionOpts`: [OrderTransactionOpts](#interface-ordertransactionopts)): *`Promise<string>`*

*Defined in [contract_wrappers/exchange_wrapper.ts:665](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/exchange_wrapper.ts#L665)*

Batch version of fillOrKillOrderAsync. Executes multiple fills atomically in a single transaction.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`signedOrders` | `SignedOrder`[] | - | An array of signed orders to fill. |
`takerAssetFillAmounts` | `BigNumber`[] | - | The amounts of the orders (in taker asset baseUnits) that you wish to fill. |
`takerAddress` | string | - | The user Ethereum address who would like to fill these orders. Must be available via the supplied                                Provider provided at instantiation. |
`orderTransactionOpts` | [OrderTransactionOpts](#interface-ordertransactionopts) |  { shouldValidate: true } | Optional arguments this method accepts. |

**Returns:** *`Promise<string>`*

Transaction hash.

___

###  batchFillOrdersAsync

▸ **batchFillOrdersAsync**(`signedOrders`: `SignedOrder`[], `takerAssetFillAmounts`: `BigNumber`[], `takerAddress`: string, `orderTransactionOpts`: [OrderTransactionOpts](#interface-ordertransactionopts)): *`Promise<string>`*

*Defined in [contract_wrappers/exchange_wrapper.ts:382](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/exchange_wrapper.ts#L382)*

Batch version of fillOrderAsync. Executes multiple fills atomically in a single transaction.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`signedOrders` | `SignedOrder`[] | - | An array of signed orders to fill. |
`takerAssetFillAmounts` | `BigNumber`[] | - | The amounts of the orders (in taker asset baseUnits) that you wish to fill. |
`takerAddress` | string | - | The user Ethereum address who would like to fill these orders. Must be available via the supplied                                Provider provided at instantiation. |
`orderTransactionOpts` | [OrderTransactionOpts](#interface-ordertransactionopts) |  { shouldValidate: true } | Optional arguments this method accepts. |

**Returns:** *`Promise<string>`*

Transaction hash.

___

###  batchFillOrdersNoThrowAsync

▸ **batchFillOrdersNoThrowAsync**(`signedOrders`: `SignedOrder`[], `takerAssetFillAmounts`: `BigNumber`[], `takerAddress`: string, `orderTransactionOpts`: [OrderTransactionOpts](#interface-ordertransactionopts)): *`Promise<string>`*

*Defined in [contract_wrappers/exchange_wrapper.ts:614](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/exchange_wrapper.ts#L614)*

No throw version of batchFillOrdersAsync

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`signedOrders` | `SignedOrder`[] | - | An array of signed orders to fill. |
`takerAssetFillAmounts` | `BigNumber`[] | - | The amounts of the orders (in taker asset baseUnits) that you wish to fill. |
`takerAddress` | string | - | The user Ethereum address who would like to fill these orders. Must be available via the supplied                                Provider provided at instantiation. |
`orderTransactionOpts` | [OrderTransactionOpts](#interface-ordertransactionopts) |  { shouldValidate: true } | Optional arguments this method accepts. |

**Returns:** *`Promise<string>`*

Transaction hash.

___

###  cancelOrderAsync

▸ **cancelOrderAsync**(`order`: `Order` | `SignedOrder`, `orderTransactionOpts`: [OrderTransactionOpts](#interface-ordertransactionopts)): *`Promise<string>`*

*Defined in [contract_wrappers/exchange_wrapper.ts:986](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/exchange_wrapper.ts#L986)*

Cancel a given order.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`order` | `Order` \| `SignedOrder` | - | An object that conforms to the Order or SignedOrder interface. The order you would like to cancel. |
`orderTransactionOpts` | [OrderTransactionOpts](#interface-ordertransactionopts) |  { shouldValidate: true } | Optional arguments this method accepts. |

**Returns:** *`Promise<string>`*

Transaction hash.

___

###  cancelOrdersUpToAsync

▸ **cancelOrdersUpToAsync**(`targetOrderEpoch`: `BigNumber`, `senderAddress`: string, `orderTransactionOpts`: [OrderTransactionOpts](#interface-ordertransactionopts)): *`Promise<string>`*

*Defined in [contract_wrappers/exchange_wrapper.ts:1061](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/exchange_wrapper.ts#L1061)*

Cancels all orders created by makerAddress with a salt less than or equal to the targetOrderEpoch
and senderAddress equal to msg.sender (or null address if msg.sender == makerAddress).

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`targetOrderEpoch` | `BigNumber` | - | Target order epoch. |
`senderAddress` | string | - | Address that should send the transaction. |
`orderTransactionOpts` | [OrderTransactionOpts](#interface-ordertransactionopts) |  { shouldValidate: true } | Optional arguments this method accepts. |

**Returns:** *`Promise<string>`*

Transaction hash.

___

###  executeTransactionAsync

▸ **executeTransactionAsync**(`salt`: `BigNumber`, `signerAddress`: string, `data`: string, `signature`: string, `senderAddress`: string, `orderTransactionOpts`: [OrderTransactionOpts](#interface-ordertransactionopts)): *`Promise<string>`*

*Defined in [contract_wrappers/exchange_wrapper.ts:334](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/exchange_wrapper.ts#L334)*

Executes a 0x transaction. Transaction messages exist for the purpose of calling methods on the Exchange contract
in the context of another address (see [ZEIP18](https://github.com/0xProject/ZEIPs/issues/18)).
This is especially useful for implementing filter contracts.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`salt` | `BigNumber` | - | Salt |
`signerAddress` | string | - | Signer address |
`data` | string | - | Transaction data |
`signature` | string | - | Signature |
`senderAddress` | string | - | Sender address |
`orderTransactionOpts` | [OrderTransactionOpts](#interface-ordertransactionopts) |  { shouldValidate: true } | Optional arguments this method accepts. |

**Returns:** *`Promise<string>`*

Transaction hash.

___

###  fillOrKillOrderAsync

▸ **fillOrKillOrderAsync**(`signedOrder`: `SignedOrder`, `takerAssetFillAmount`: `BigNumber`, `takerAddress`: string, `orderTransactionOpts`: [OrderTransactionOpts](#interface-ordertransactionopts)): *`Promise<string>`*

*Defined in [contract_wrappers/exchange_wrapper.ts:283](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/exchange_wrapper.ts#L283)*

Attempts to fill a specific amount of an order. If the entire amount specified cannot be filled,
the fill order is abandoned.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`signedOrder` | `SignedOrder` | - | An object that conforms to the SignedOrder interface. |
`takerAssetFillAmount` | `BigNumber` | - | The amount of the order (in taker asset baseUnits) that you wish to fill. |
`takerAddress` | string | - | The user Ethereum address who would like to fill this order. Must be available via the supplied                               Provider provided at instantiation. |
`orderTransactionOpts` | [OrderTransactionOpts](#interface-ordertransactionopts) |  { shouldValidate: true } | Optional arguments this method accepts. |

**Returns:** *`Promise<string>`*

Transaction hash.

___

###  fillOrderAsync

▸ **fillOrderAsync**(`signedOrder`: `SignedOrder`, `takerAssetFillAmount`: `BigNumber`, `takerAddress`: string, `orderTransactionOpts`: [OrderTransactionOpts](#interface-ordertransactionopts)): *`Promise<string>`*

*Defined in [contract_wrappers/exchange_wrapper.ts:190](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/exchange_wrapper.ts#L190)*

Fills a signed order with an amount denominated in baseUnits of the taker asset.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`signedOrder` | `SignedOrder` | - | An object that conforms to the SignedOrder interface. |
`takerAssetFillAmount` | `BigNumber` | - | The amount of the order (in taker asset baseUnits) that you wish to fill. |
`takerAddress` | string | - | The user Ethereum address who would like to fill this order. Must be available via the supplied                                Provider provided at instantiation. |
`orderTransactionOpts` | [OrderTransactionOpts](#interface-ordertransactionopts) |  { shouldValidate: true } | Optional arguments this method accepts. |

**Returns:** *`Promise<string>`*

Transaction hash.

___

###  fillOrderNoThrowAsync

▸ **fillOrderNoThrowAsync**(`signedOrder`: `SignedOrder`, `takerAssetFillAmount`: `BigNumber`, `takerAddress`: string, `orderTransactionOpts`: [OrderTransactionOpts](#interface-ordertransactionopts)): *`Promise<string>`*

*Defined in [contract_wrappers/exchange_wrapper.ts:234](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/exchange_wrapper.ts#L234)*

No-throw version of fillOrderAsync. This version will not throw if the fill fails. This allows the caller to save gas at the expense of not knowing the reason the fill failed.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`signedOrder` | `SignedOrder` | - | An object that conforms to the SignedOrder interface. |
`takerAssetFillAmount` | `BigNumber` | - | The amount of the order (in taker asset baseUnits) that you wish to fill. |
`takerAddress` | string | - | The user Ethereum address who would like to fill this order.                               Must be available via the supplied Provider provided at instantiation. |
`orderTransactionOpts` | [OrderTransactionOpts](#interface-ordertransactionopts) |  { shouldValidate: true } | Optional arguments this method accepts. |

**Returns:** *`Promise<string>`*

Transaction hash.

___

###  getAssetProxyBySignatureAsync

▸ **getAssetProxyBySignatureAsync**(`proxyId`: `AssetProxyId`, `methodOpts`: [MethodOpts](#interface-methodopts)): *`Promise<string>`*

*Defined in [contract_wrappers/exchange_wrapper.ts:97](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/exchange_wrapper.ts#L97)*

Retrieve the address of an asset proxy by signature.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`proxyId` | `AssetProxyId` | - | The 4 bytes signature of an asset proxy |
`methodOpts` | [MethodOpts](#interface-methodopts) |  {} | Optional arguments this method accepts. |

**Returns:** *`Promise<string>`*

The address of an asset proxy for a given signature

___

###  getFilledTakerAssetAmountAsync

▸ **getFilledTakerAssetAmountAsync**(`orderHash`: string, `methodOpts`: [MethodOpts](#interface-methodopts)): *`Promise<BigNumber>`*

*Defined in [contract_wrappers/exchange_wrapper.ts:115](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/exchange_wrapper.ts#L115)*

Retrieve the takerAssetAmount of an order that has already been filled.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`orderHash` | string | - | The hex encoded orderHash for which you would like to retrieve the filled takerAssetAmount. |
`methodOpts` | [MethodOpts](#interface-methodopts) |  {} | Optional arguments this method accepts. |

**Returns:** *`Promise<BigNumber>`*

The amount of the order (in taker asset base units) that has already been filled.

___

###  getLogsAsync

▸ **getLogsAsync**<**ArgsType**>(`eventName`: `ExchangeEvents`, `blockRange`: [BlockRange](#interface-blockrange), `indexFilterValues`: [IndexedFilterValues](#interface-indexedfiltervalues)): *`Promise<Array<LogWithDecodedArgs<ArgsType>>>`*

*Defined in [contract_wrappers/exchange_wrapper.ts:1135](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/exchange_wrapper.ts#L1135)*

Gets historical logs without creating a subscription

**Type parameters:**

▪ **ArgsType**: *`ExchangeEventArgs`*

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`eventName` | `ExchangeEvents` | The exchange contract event you would like to subscribe to. |
`blockRange` | [BlockRange](#interface-blockrange) | Block range to get logs from. |
`indexFilterValues` | [IndexedFilterValues](#interface-indexedfiltervalues) | An object where the keys are indexed args returned by the event and                              the value is the value you are interested in. E.g `{_from: aUserAddressHex}` |

**Returns:** *`Promise<Array<LogWithDecodedArgs<ArgsType>>>`*

Array of logs that match the parameters

___

###  getOrderEpochAsync

▸ **getOrderEpochAsync**(`makerAddress`: string, `senderAddress`: string, `methodOpts`: [MethodOpts](#interface-methodopts)): *`Promise<BigNumber>`*

*Defined in [contract_wrappers/exchange_wrapper.ts:146](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/exchange_wrapper.ts#L146)*

Retrieve the set order epoch for a given makerAddress & senderAddress pair.
Orders can be bulk cancelled by setting the order epoch to a value lower then the salt value of orders one wishes to cancel.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`makerAddress` | string | - | Maker address |
`senderAddress` | string | - | Sender address |
`methodOpts` | [MethodOpts](#interface-methodopts) |  {} | Optional arguments this method accepts. |

**Returns:** *`Promise<BigNumber>`*

Order epoch. Defaults to 0.

___

###  getOrderInfoAsync

▸ **getOrderInfoAsync**(`order`: `Order` | `SignedOrder`, `methodOpts`: [MethodOpts](#interface-methodopts)): *`Promise<OrderInfo>`*

*Defined in [contract_wrappers/exchange_wrapper.ts:947](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/exchange_wrapper.ts#L947)*

Get order info

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`order` | `Order` \| `SignedOrder` | - | Order |
`methodOpts` | [MethodOpts](#interface-methodopts) |  {} | Optional arguments this method accepts. |

**Returns:** *`Promise<OrderInfo>`*

Order info

___

###  getOrdersInfoAsync

▸ **getOrdersInfoAsync**(`orders`: `Array<Order | SignedOrder>`, `methodOpts`: [MethodOpts](#interface-methodopts)): *`Promise<OrderInfo[]>`*

*Defined in [contract_wrappers/exchange_wrapper.ts:963](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/exchange_wrapper.ts#L963)*

Get order info for multiple orders

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`orders` | `Array<Order \| SignedOrder>` | - | Orders |
`methodOpts` | [MethodOpts](#interface-methodopts) |  {} | Optional arguments this method accepts. |

**Returns:** *`Promise<OrderInfo[]>`*

Array of Order infos

___

###  getVersionAsync

▸ **getVersionAsync**(`methodOpts`: [MethodOpts](#interface-methodopts)): *`Promise<string>`*

*Defined in [contract_wrappers/exchange_wrapper.ts:132](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/exchange_wrapper.ts#L132)*

Retrieve the exchange contract version

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`methodOpts` | [MethodOpts](#interface-methodopts) |  {} | Optional arguments this method accepts. |

**Returns:** *`Promise<string>`*

Version

___

###  getZRXAssetData

▸ **getZRXAssetData**(): *string*

*Defined in [contract_wrappers/exchange_wrapper.ts:1259](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/exchange_wrapper.ts#L1259)*

Returns the ZRX asset data used by the exchange contract.

**Returns:** *string*

ZRX asset data

___

###  isAllowedValidatorAsync

▸ **isAllowedValidatorAsync**(`signerAddress`: string, `validatorAddress`: string, `methodOpts`: [MethodOpts](#interface-methodopts)): *`Promise<boolean>`*

*Defined in [contract_wrappers/exchange_wrapper.ts:874](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/exchange_wrapper.ts#L874)*

Checks if the validator is allowed by the signer.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`signerAddress` | string | - | Address of a signer |
`validatorAddress` | string | - | Address of a validator |
`methodOpts` | [MethodOpts](#interface-methodopts) |  {} | Optional arguments this method accepts. |

**Returns:** *`Promise<boolean>`*

If the validator is allowed

___

###  isCancelledAsync

▸ **isCancelledAsync**(`orderHash`: string, `methodOpts`: [MethodOpts](#interface-methodopts)): *`Promise<boolean>`*

*Defined in [contract_wrappers/exchange_wrapper.ts:169](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/exchange_wrapper.ts#L169)*

Check if an order has been cancelled. Order cancellations are binary

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`orderHash` | string | - | The hex encoded orderHash for which you would like to retrieve the cancelled takerAmount. |
`methodOpts` | [MethodOpts](#interface-methodopts) |  {} | Optional arguments this method accepts. |

**Returns:** *`Promise<boolean>`*

Whether the order has been cancelled.

___

###  isPreSignedAsync

▸ **isPreSignedAsync**(`hash`: string, `signerAddress`: string, `methodOpts`: [MethodOpts](#interface-methodopts)): *`Promise<boolean>`*

*Defined in [contract_wrappers/exchange_wrapper.ts:903](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/exchange_wrapper.ts#L903)*

Check whether the hash is pre-signed on-chain.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`hash` | string | - | Hash to check if pre-signed |
`signerAddress` | string | - | Address that should have signed the given hash. |
`methodOpts` | [MethodOpts](#interface-methodopts) |  {} | Optional arguments this method accepts. |

**Returns:** *`Promise<boolean>`*

Whether the hash is pre-signed.

___

###  isTransactionExecutedAsync

▸ **isTransactionExecutedAsync**(`transactionHash`: string, `methodOpts`: [MethodOpts](#interface-methodopts)): *`Promise<boolean>`*

*Defined in [contract_wrappers/exchange_wrapper.ts:927](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/exchange_wrapper.ts#L927)*

Checks if transaction is already executed.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`transactionHash` | string | - | Transaction hash to check |
`methodOpts` | [MethodOpts](#interface-methodopts) |  {} | Optional arguments this method accepts. |

**Returns:** *`Promise<boolean>`*

If transaction is already executed.

___

###  isValidSignatureAsync

▸ **isValidSignatureAsync**(`hash`: string, `signerAddress`: string, `signature`: string, `methodOpts`: [MethodOpts](#interface-methodopts)): *`Promise<boolean>`*

*Defined in [contract_wrappers/exchange_wrapper.ts:846](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/exchange_wrapper.ts#L846)*

Checks if the signature is valid.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`hash` | string | - | Hash to pre-sign |
`signerAddress` | string | - | Address that should have signed the given hash. |
`signature` | string | - | Proof that the hash has been signed by signer. |
`methodOpts` | [MethodOpts](#interface-methodopts) |  {} | Optional arguments this method accepts. |

**Returns:** *`Promise<boolean>`*

If the signature is valid

___

###  marketBuyOrdersAsync

▸ **marketBuyOrdersAsync**(`signedOrders`: `SignedOrder`[], `makerAssetFillAmount`: `BigNumber`, `takerAddress`: string, `orderTransactionOpts`: [OrderTransactionOpts](#interface-ordertransactionopts)): *`Promise<string>`*

*Defined in [contract_wrappers/exchange_wrapper.ts:428](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/exchange_wrapper.ts#L428)*

Synchronously executes multiple calls to fillOrder until total amount of makerAsset is bought by taker.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`signedOrders` | `SignedOrder`[] | - | An array of signed orders to fill. |
`makerAssetFillAmount` | `BigNumber` | - | Maker asset fill amount. |
`takerAddress` | string | - | The user Ethereum address who would like to fill these orders. Must be available via the supplied                               Provider provided at instantiation. |
`orderTransactionOpts` | [OrderTransactionOpts](#interface-ordertransactionopts) |  { shouldValidate: true } | Optional arguments this method accepts. |

**Returns:** *`Promise<string>`*

Transaction hash.

___

###  marketBuyOrdersNoThrowAsync

▸ **marketBuyOrdersNoThrowAsync**(`signedOrders`: `SignedOrder`[], `makerAssetFillAmount`: `BigNumber`, `takerAddress`: string, `orderTransactionOpts`: [OrderTransactionOpts](#interface-ordertransactionopts)): *`Promise<string>`*

*Defined in [contract_wrappers/exchange_wrapper.ts:516](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/exchange_wrapper.ts#L516)*

No throw version of marketBuyOrdersAsync

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`signedOrders` | `SignedOrder`[] | - | An array of signed orders to fill. |
`makerAssetFillAmount` | `BigNumber` | - | Maker asset fill amount. |
`takerAddress` | string | - | The user Ethereum address who would like to fill these orders. Must be available via the supplied                               Provider provided at instantiation. |
`orderTransactionOpts` | [OrderTransactionOpts](#interface-ordertransactionopts) |  { shouldValidate: true } | Optional arguments this method accepts. |

**Returns:** *`Promise<string>`*

Transaction hash.

___

###  marketSellOrdersAsync

▸ **marketSellOrdersAsync**(`signedOrders`: `SignedOrder`[], `takerAssetFillAmount`: `BigNumber`, `takerAddress`: string, `orderTransactionOpts`: [OrderTransactionOpts](#interface-ordertransactionopts)): *`Promise<string>`*

*Defined in [contract_wrappers/exchange_wrapper.ts:472](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/exchange_wrapper.ts#L472)*

Synchronously executes multiple calls to fillOrder until total amount of makerAsset is bought by taker.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`signedOrders` | `SignedOrder`[] | - | An array of signed orders to fill. |
`takerAssetFillAmount` | `BigNumber` | - | Taker asset fill amount. |
`takerAddress` | string | - | The user Ethereum address who would like to fill these orders. Must be available via the supplied                               Provider provided at instantiation. |
`orderTransactionOpts` | [OrderTransactionOpts](#interface-ordertransactionopts) |  { shouldValidate: true } | Optional arguments this method accepts. |

**Returns:** *`Promise<string>`*

Transaction hash.

___

###  marketSellOrdersNoThrowAsync

▸ **marketSellOrdersNoThrowAsync**(`signedOrders`: `SignedOrder`[], `takerAssetFillAmount`: `BigNumber`, `takerAddress`: string, `orderTransactionOpts`: [OrderTransactionOpts](#interface-ordertransactionopts)): *`Promise<string>`*

*Defined in [contract_wrappers/exchange_wrapper.ts:565](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/exchange_wrapper.ts#L565)*

No throw version of marketSellOrdersAsync

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`signedOrders` | `SignedOrder`[] | - | An array of signed orders to fill. |
`takerAssetFillAmount` | `BigNumber` | - | Taker asset fill amount. |
`takerAddress` | string | - | The user Ethereum address who would like to fill these orders. Must be available via the supplied                               Provider provided at instantiation. |
`orderTransactionOpts` | [OrderTransactionOpts](#interface-ordertransactionopts) |  { shouldValidate: true } | Optional arguments this method accepts. |

**Returns:** *`Promise<string>`*

Transaction hash.

___

###  matchOrdersAsync

▸ **matchOrdersAsync**(`leftSignedOrder`: `SignedOrder`, `rightSignedOrder`: `SignedOrder`, `takerAddress`: string, `orderTransactionOpts`: [OrderTransactionOpts](#interface-ordertransactionopts)): *`Promise<string>`*

*Defined in [contract_wrappers/exchange_wrapper.ts:752](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/exchange_wrapper.ts#L752)*

Match two complementary orders that have a profitable spread.
Each order is filled at their respective price point. However, the calculations are carried out as though
the orders are both being filled at the right order's price point.
The profit made by the left order goes to the taker (whoever matched the two orders).

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`leftSignedOrder` | `SignedOrder` | - | First order to match. |
`rightSignedOrder` | `SignedOrder` | - | Second order to match. |
`takerAddress` | string | - | The address that sends the transaction and gets the spread. |
`orderTransactionOpts` | [OrderTransactionOpts](#interface-ordertransactionopts) |  { shouldValidate: true } | Optional arguments this method accepts. |

**Returns:** *`Promise<string>`*

Transaction hash.

___

###  preSignAsync

▸ **preSignAsync**(`hash`: string, `signerAddress`: string, `signature`: string, `senderAddress`: string, `orderTransactionOpts`: [OrderTransactionOpts](#interface-ordertransactionopts)): *`Promise<string>`*

*Defined in [contract_wrappers/exchange_wrapper.ts:808](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/exchange_wrapper.ts#L808)*

Approves a hash on-chain using any valid signature type.
After presigning a hash, the preSign signature type will become valid for that hash and signer.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`hash` | string | - | Hash to pre-sign |
`signerAddress` | string | - | Address that should have signed the given hash. |
`signature` | string | - | Proof that the hash has been signed by signer. |
`senderAddress` | string | - | Address that should send the transaction. |
`orderTransactionOpts` | [OrderTransactionOpts](#interface-ordertransactionopts) |  { shouldValidate: true } | Optional arguments this method accepts. |

**Returns:** *`Promise<string>`*

Transaction hash.

___

###  setSignatureValidatorApprovalAsync

▸ **setSignatureValidatorApprovalAsync**(`validatorAddress`: string, `isApproved`: boolean, `senderAddress`: string, `orderTransactionOpts`: [OrderTransactionOpts](#interface-ordertransactionopts)): *`Promise<string>`*

*Defined in [contract_wrappers/exchange_wrapper.ts:1020](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/exchange_wrapper.ts#L1020)*

Sets the signature validator approval

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`validatorAddress` | string | - | Validator contract address. |
`isApproved` | boolean | - | Boolean value to set approval to. |
`senderAddress` | string | - | Sender address. |
`orderTransactionOpts` | [OrderTransactionOpts](#interface-ordertransactionopts) |  { shouldValidate: true } | Optional arguments this method accepts. |

**Returns:** *`Promise<string>`*

Transaction hash.

___

###  subscribe

▸ **subscribe**<**ArgsType**>(`eventName`: `ExchangeEvents`, `indexFilterValues`: [IndexedFilterValues](#eventcallback)‹*`ArgsType`*›, `isVerbose`: boolean): *string*

*Defined in [contract_wrappers/exchange_wrapper.ts:1096](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/exchange_wrapper.ts#L1096)*

Subscribe to an event type emitted by the Exchange contract.

**Type parameters:**

▪ **ArgsType**: *`ExchangeEventArgs`*

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`eventName` | `ExchangeEvents` | - | The exchange contract event you would like to subscribe to. |
`indexFilterValues` | [IndexedFilterValues](#interface-indexedfiltervalues) | - | An object where the keys are indexed args returned by the event and                              the value is the value you are interested in. E.g `{maker: aUserAddressHex}` |
`callback` | [EventCallback](#eventcallback)‹*`ArgsType`*› | - | Callback that gets called when a log is added/removed |
`isVerbose` | boolean | false | Enable verbose subscription warnings (e.g recoverable network issues encountered) |

**Returns:** *string*

Subscription token used later to unsubscribe

___

###  transactionEncoderAsync

▸ **transactionEncoderAsync**(): *`Promise<TransactionEncoder>`*

*Defined in [contract_wrappers/exchange_wrapper.ts:1268](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/exchange_wrapper.ts#L1268)*

Returns a Transaction Encoder. Transaction messages exist for the purpose of calling methods on the Exchange contract
in the context of another address.

**Returns:** *`Promise<TransactionEncoder>`*

TransactionEncoder

___

###  unsubscribe

▸ **unsubscribe**(`subscriptionToken`: string): *void*

*Defined in [contract_wrappers/exchange_wrapper.ts:1118](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/exchange_wrapper.ts#L1118)*

Cancel a subscription

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`subscriptionToken` | string | Subscription token returned by `subscribe()`  |

**Returns:** *void*

___

###  unsubscribeAll

▸ **unsubscribeAll**(): *void*

*Defined in [contract_wrappers/exchange_wrapper.ts:1124](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/exchange_wrapper.ts#L1124)*

Cancels all existing subscriptions

**Returns:** *void*

___

###  validateFillOrderThrowIfInvalidAsync

▸ **validateFillOrderThrowIfInvalidAsync**(`signedOrder`: `SignedOrder`, `fillTakerAssetAmount`: `BigNumber`, `takerAddress`: string): *`Promise<void>`*

*Defined in [contract_wrappers/exchange_wrapper.ts:1231](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/exchange_wrapper.ts#L1231)*

Validate a call to FillOrder and throw if it wouldn't succeed

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`signedOrder` | `SignedOrder` | SignedOrder of interest |
`fillTakerAssetAmount` | `BigNumber` | Amount we'd like to fill the order for |
`takerAddress` | string | The taker of the order  |

**Returns:** *`Promise<void>`*

___

###  validateMakerTransferThrowIfInvalidAsync

▸ **validateMakerTransferThrowIfInvalidAsync**(`signedOrder`: `SignedOrder`, `makerAssetAmount`: `BigNumber`, `takerAddress?`: undefined | string): *`Promise<void>`*

*Defined in [contract_wrappers/exchange_wrapper.ts:1211](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/exchange_wrapper.ts#L1211)*

Validate the transfer from the maker to the taker. This is simulated on-chain
via an eth_call. If this call fails, the asset is currently nontransferable.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`signedOrder` | `SignedOrder` | SignedOrder of interest |
`makerAssetAmount` | `BigNumber` | Amount to transfer from the maker |
`takerAddress?` | undefined \| string | The address to transfer to, defaults to signedOrder.takerAddress  |

**Returns:** *`Promise<void>`*

___

###  validateOrderFillableOrThrowAsync

▸ **validateOrderFillableOrThrowAsync**(`signedOrder`: `SignedOrder`, `opts`: [ValidateOrderFillableOpts](#interface-validateorderfillableopts)): *`Promise<void>`*

*Defined in [contract_wrappers/exchange_wrapper.ts:1153](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/exchange_wrapper.ts#L1153)*

Validate if the supplied order is fillable, and throw if it isn't

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`signedOrder` | `SignedOrder` | - | SignedOrder of interest |
`opts` | [ValidateOrderFillableOpts](#interface-validateorderfillableopts) |  {} | ValidateOrderFillableOpts options (e.g expectedFillTakerTokenAmount. If it isn't supplied, we check if the order is fillable for the remaining amount. To check if the order is fillable for a non-zero amount, set `validateRemainingOrderAmountIsFillable` to false.)  |

**Returns:** *`Promise<void>`*

<hr />

> # Class: ForwarderWrapper

This class includes the functionality related to interacting with the Forwarder contract.

## Hierarchy

* **ForwarderWrapper**

## Index

### Constructors

* [constructor](#constructor)

### Properties

* [abi](#abi)
* [address](#address)
* [etherTokenAddress](#ethertokenaddress)
* [zrxTokenAddress](#zrxtokenaddress)

### Methods

* [marketBuyOrdersWithEthAsync](#marketbuyorderswithethasync)
* [marketSellOrdersWithEthAsync](#marketsellorderswithethasync)

## Constructors

###  constructor

\+ **new ForwarderWrapper**(`web3Wrapper`: `Web3Wrapper`, `networkId`: number, `address?`: undefined | string, `zrxTokenAddress?`: undefined | string, `etherTokenAddress?`: undefined | string): *[ForwarderWrapper](#class-forwarderwrapper)*

*Defined in [contract_wrappers/forwarder_wrapper.ts:29](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/forwarder_wrapper.ts#L29)*

Instantiate ForwarderWrapper

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`web3Wrapper` | `Web3Wrapper` | Web3Wrapper instance to use. |
`networkId` | number | Desired networkId. |
`address?` | undefined \| string | The address of the Exchange contract. If undefined, will default to the known address corresponding to the networkId. |
`zrxTokenAddress?` | undefined \| string | The address of the ZRXToken contract. If undefined, will default to the known address corresponding to the networkId. |
`etherTokenAddress?` | undefined \| string | The address of a WETH (Ether token) contract. If undefined, will default to the known address corresponding to the networkId.  |

**Returns:** *[ForwarderWrapper](#class-forwarderwrapper)*

## Properties

###  abi

• **abi**: *`ContractAbi`* =  Forwarder.compilerOutput.abi

*Defined in [contract_wrappers/forwarder_wrapper.ts:24](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/forwarder_wrapper.ts#L24)*

___

###  address

• **address**: *string*

*Defined in [contract_wrappers/forwarder_wrapper.ts:25](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/forwarder_wrapper.ts#L25)*

___

###  etherTokenAddress

• **etherTokenAddress**: *string*

*Defined in [contract_wrappers/forwarder_wrapper.ts:27](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/forwarder_wrapper.ts#L27)*

___

###  zrxTokenAddress

• **zrxTokenAddress**: *string*

*Defined in [contract_wrappers/forwarder_wrapper.ts:26](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/forwarder_wrapper.ts#L26)*

## Methods

###  marketBuyOrdersWithEthAsync

▸ **marketBuyOrdersWithEthAsync**(`signedOrders`: `SignedOrder`[], `makerAssetFillAmount`: `BigNumber`, `takerAddress`: string, `ethAmount`: `BigNumber`, `signedFeeOrders`: `SignedOrder`[], `feePercentage`: number, `feeRecipientAddress`: string, `orderTransactionOpts`: [OrderTransactionOpts](#interface-ordertransactionopts)): *`Promise<string>`*

*Defined in [contract_wrappers/forwarder_wrapper.ts:168](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/forwarder_wrapper.ts#L168)*

Attempt to purchase makerAssetFillAmount of makerAsset by selling ethAmount provided with transaction.
Any ZRX required to pay fees for primary orders will automatically be purchased by the contract.
Any ETH not spent will be refunded to sender.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`signedOrders` | `SignedOrder`[] | - | An array of objects that conform to the SignedOrder interface. All orders must specify the same makerAsset.                                  All orders must specify WETH as the takerAsset |
`makerAssetFillAmount` | `BigNumber` | - | The amount of the order (in taker asset baseUnits) that you wish to fill. |
`takerAddress` | string | - | The user Ethereum address who would like to fill this order. Must be available via the supplied                                  Provider provided at instantiation. |
`ethAmount` | `BigNumber` | - | The amount of eth to send with the transaction (in wei). |
`signedFeeOrders` | `SignedOrder`[] |  [] | An array of objects that conform to the SignedOrder interface. All orders must specify ZRX as makerAsset and WETH as takerAsset.                                  Used to purchase ZRX for primary order fees. |
`feePercentage` | number | 0 | The percentage of WETH sold that will payed as fee to forwarding contract feeRecipient.                                  Defaults to 0. |
`feeRecipientAddress` | string |  constants.NULL_ADDRESS | The address that will receive ETH when signedFeeOrders are filled. |
`orderTransactionOpts` | [OrderTransactionOpts](#interface-ordertransactionopts) |  { shouldValidate: true } | Transaction parameters. |

**Returns:** *`Promise<string>`*

Transaction hash.

___

###  marketSellOrdersWithEthAsync

▸ **marketSellOrdersWithEthAsync**(`signedOrders`: `SignedOrder`[], `takerAddress`: string, `ethAmount`: `BigNumber`, `signedFeeOrders`: `SignedOrder`[], `feePercentage`: number, `feeRecipientAddress`: string, `orderTransactionOpts`: [OrderTransactionOpts](#interface-ordertransactionopts)): *`Promise<string>`*

*Defined in [contract_wrappers/forwarder_wrapper.ts:82](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/forwarder_wrapper.ts#L82)*

Purchases as much of orders' makerAssets as possible by selling up to 95% of transaction's ETH value.
Any ZRX required to pay fees for primary orders will automatically be purchased by this contract.
5% of ETH value is reserved for paying fees to order feeRecipients (in ZRX) and forwarding contract feeRecipient (in ETH).
Any ETH not spent will be refunded to sender.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`signedOrders` | `SignedOrder`[] | - | An array of objects that conform to the SignedOrder interface. All orders must specify the same makerAsset.                                  All orders must specify WETH as the takerAsset |
`takerAddress` | string | - | The user Ethereum address who would like to fill this order. Must be available via the supplied                                  Provider provided at instantiation. |
`ethAmount` | `BigNumber` | - | The amount of eth to send with the transaction (in wei). |
`signedFeeOrders` | `SignedOrder`[] |  [] | An array of objects that conform to the SignedOrder interface. All orders must specify ZRX as makerAsset and WETH as takerAsset.                                  Used to purchase ZRX for primary order fees. |
`feePercentage` | number | 0 | The percentage of WETH sold that will payed as fee to forwarding contract feeRecipient.                                  Defaults to 0. |
`feeRecipientAddress` | string |  constants.NULL_ADDRESS | The address that will receive ETH when signedFeeOrders are filled. |
`orderTransactionOpts` | [OrderTransactionOpts](#interface-ordertransactionopts) |  { shouldValidate: true } | Transaction parameters. |

**Returns:** *`Promise<string>`*

Transaction hash.

<hr />

> # Class: OrderValidatorWrapper

This class includes the functionality related to interacting with the OrderValidator contract.

## Hierarchy

* **OrderValidatorWrapper**

## Index

### Constructors

* [constructor](#constructor)

### Properties

* [abi](#abi)
* [address](#address)

### Methods

* [getBalanceAndAllowanceAsync](#getbalanceandallowanceasync)
* [getBalancesAndAllowancesAsync](#getbalancesandallowancesasync)
* [getERC721TokenOwnerAsync](#geterc721tokenownerasync)
* [getOrderAndTraderInfoAsync](#getorderandtraderinfoasync)
* [getOrdersAndTradersInfoAsync](#getordersandtradersinfoasync)
* [getTraderInfoAsync](#gettraderinfoasync)
* [getTradersInfoAsync](#gettradersinfoasync)

## Constructors

###  constructor

\+ **new OrderValidatorWrapper**(`web3Wrapper`: `Web3Wrapper`, `networkId`: number, `address?`: undefined | string): *[OrderValidatorWrapper](#class-ordervalidatorwrapper)*

*Defined in [contract_wrappers/order_validator_wrapper.ts:21](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/order_validator_wrapper.ts#L21)*

Instantiate OrderValidatorWrapper

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`web3Wrapper` | `Web3Wrapper` | Web3Wrapper instance to use. |
`networkId` | number | Desired networkId. |
`address?` | undefined \| string | The address of the OrderValidator contract. If undefined, will default to the known address corresponding to the networkId.  |

**Returns:** *[OrderValidatorWrapper](#class-ordervalidatorwrapper)*

## Properties

###  abi

• **abi**: *`ContractAbi`* =  OrderValidator.compilerOutput.abi

*Defined in [contract_wrappers/order_validator_wrapper.ts:18](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/order_validator_wrapper.ts#L18)*

___

###  address

• **address**: *string*

*Defined in [contract_wrappers/order_validator_wrapper.ts:19](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/order_validator_wrapper.ts#L19)*

## Methods

###  getBalanceAndAllowanceAsync

▸ **getBalanceAndAllowanceAsync**(`address`: string, `assetData`: string): *`Promise<BalanceAndAllowance>`*

*Defined in [contract_wrappers/order_validator_wrapper.ts:120](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/order_validator_wrapper.ts#L120)*

Get an object conforming to BalanceAndAllowance containing on-chain balance and allowance for some address and assetData

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | string | An ethereum address |
`assetData` | string | An encoded string that can be decoded by a specified proxy contract |

**Returns:** *`Promise<BalanceAndAllowance>`*

BalanceAndAllowance

___

###  getBalancesAndAllowancesAsync

▸ **getBalancesAndAllowancesAsync**(`address`: string, `assetDatas`: string[]): *`Promise<BalanceAndAllowance[]>`*

*Defined in [contract_wrappers/order_validator_wrapper.ts:139](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/order_validator_wrapper.ts#L139)*

Get an array of objects conforming to BalanceAndAllowance containing on-chain balance and allowance for some address and array of assetDatas

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | string | An ethereum address |
`assetDatas` | string[] | An array of encoded strings that can be decoded by a specified proxy contract |

**Returns:** *`Promise<BalanceAndAllowance[]>`*

BalanceAndAllowance

___

###  getERC721TokenOwnerAsync

▸ **getERC721TokenOwnerAsync**(`tokenAddress`: string, `tokenId`: `BigNumber`): *`Promise<string | undefined>`*

*Defined in [contract_wrappers/order_validator_wrapper.ts:163](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/order_validator_wrapper.ts#L163)*

Get owner address of tokenId by calling `token.ownerOf(tokenId)`, but returns a null owner instead of reverting on an unowned token.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`tokenAddress` | string | An ethereum address |
`tokenId` | `BigNumber` | An ERC721 tokenId |

**Returns:** *`Promise<string | undefined>`*

Owner of tokenId or null address if unowned

___

###  getOrderAndTraderInfoAsync

▸ **getOrderAndTraderInfoAsync**(`order`: `SignedOrder`, `takerAddress`: string): *`Promise<OrderAndTraderInfo>`*

*Defined in [contract_wrappers/order_validator_wrapper.ts:44](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/order_validator_wrapper.ts#L44)*

Get an object conforming to OrderAndTraderInfo containing on-chain information of the provided order and address

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`order` | `SignedOrder` | An object conforming to SignedOrder |
`takerAddress` | string | An ethereum address |

**Returns:** *`Promise<OrderAndTraderInfo>`*

OrderAndTraderInfo

___

###  getOrdersAndTradersInfoAsync

▸ **getOrdersAndTradersInfoAsync**(`orders`: `SignedOrder`[], `takerAddresses`: string[]): *`Promise<OrderAndTraderInfo[]>`*

*Defined in [contract_wrappers/order_validator_wrapper.ts:63](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/order_validator_wrapper.ts#L63)*

Get an array of objects conforming to OrderAndTraderInfo containing on-chain information of the provided orders and addresses

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`orders` | `SignedOrder`[] | An array of objects conforming to SignedOrder |
`takerAddresses` | string[] | An array of ethereum addresses |

**Returns:** *`Promise<OrderAndTraderInfo[]>`*

array of OrderAndTraderInfo

___

###  getTraderInfoAsync

▸ **getTraderInfoAsync**(`order`: `SignedOrder`, `takerAddress`: string): *`Promise<TraderInfo>`*

*Defined in [contract_wrappers/order_validator_wrapper.ts:93](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/order_validator_wrapper.ts#L93)*

Get an object conforming to TraderInfo containing on-chain balance and allowances for maker and taker of order

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`order` | `SignedOrder` | An object conforming to SignedOrder |
`takerAddress` | string | An ethereum address |

**Returns:** *`Promise<TraderInfo>`*

TraderInfo

___

###  getTradersInfoAsync

▸ **getTradersInfoAsync**(`orders`: `SignedOrder`[], `takerAddresses`: string[]): *`Promise<TraderInfo[]>`*

*Defined in [contract_wrappers/order_validator_wrapper.ts:105](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/contract_wrappers/order_validator_wrapper.ts#L105)*

Get an array of objects conforming to TraderInfo containing on-chain balance and allowances for maker and taker of order

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`orders` | `SignedOrder`[] | An array of objects conforming to SignedOrder |
`takerAddresses` | string[] | An array of ethereum addresses |

**Returns:** *`Promise<TraderInfo[]>`*

array of TraderInfo

<hr />

> # Class: AssetBalanceAndProxyAllowanceFetcher

## Hierarchy

* **AssetBalanceAndProxyAllowanceFetcher**

## Implements

* `AbstractBalanceAndProxyAllowanceFetcher`

## Index

### Constructors

* [constructor](#constructor)

### Methods

* [getBalanceAsync](#getbalanceasync)
* [getProxyAllowanceAsync](#getproxyallowanceasync)

## Constructors

###  constructor

\+ **new AssetBalanceAndProxyAllowanceFetcher**(`erc20Token`: [ERC20TokenWrapper](#class-assetbalanceandproxyallowancefetcher)*

*Defined in [fetchers/asset_balance_and_proxy_allowance_fetcher.ts:12](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/fetchers/asset_balance_and_proxy_allowance_fetcher.ts#L12)*

**Parameters:**

Name | Type |
------ | ------ |
`erc20Token` | [ERC20TokenWrapper](#class-erc20tokenwrapper) |
`erc721Token` | [ERC721TokenWrapper](#class-erc721tokenwrapper) |
`stateLayer` | `BlockParamLiteral` |

**Returns:** *[AssetBalanceAndProxyAllowanceFetcher](#class-assetbalanceandproxyallowancefetcher)*

## Methods

###  getBalanceAsync

▸ **getBalanceAsync**(`assetData`: string, `userAddress`: string): *`Promise<BigNumber>`*

*Defined in [fetchers/asset_balance_and_proxy_allowance_fetcher.ts:18](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/fetchers/asset_balance_and_proxy_allowance_fetcher.ts#L18)*

**Parameters:**

Name | Type |
------ | ------ |
`assetData` | string |
`userAddress` | string |

**Returns:** *`Promise<BigNumber>`*

___

###  getProxyAllowanceAsync

▸ **getProxyAllowanceAsync**(`assetData`: string, `userAddress`: string): *`Promise<BigNumber>`*

*Defined in [fetchers/asset_balance_and_proxy_allowance_fetcher.ts:49](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/fetchers/asset_balance_and_proxy_allowance_fetcher.ts#L49)*

**Parameters:**

Name | Type |
------ | ------ |
`assetData` | string |
`userAddress` | string |

**Returns:** *`Promise<BigNumber>`*

<hr />

> # Class: OrderFilledCancelledFetcher

## Hierarchy

* **OrderFilledCancelledFetcher**

## Implements

* `AbstractOrderFilledCancelledFetcher`

## Index

### Constructors

* [constructor](#constructor)

### Methods

* [getFilledTakerAmountAsync](#getfilledtakeramountasync)
* [getZRXAssetData](#getzrxassetdata)
* [isOrderCancelledAsync](#isordercancelledasync)

## Constructors

###  constructor

\+ **new OrderFilledCancelledFetcher**(`exchange`: [ExchangeWrapper](#class-orderfilledcancelledfetcher)*

*Defined in [fetchers/order_filled_cancelled_fetcher.ts:11](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/fetchers/order_filled_cancelled_fetcher.ts#L11)*

**Parameters:**

Name | Type |
------ | ------ |
`exchange` | [ExchangeWrapper](#class-exchangewrapper) |
`stateLayer` | `BlockParamLiteral` |

**Returns:** *[OrderFilledCancelledFetcher](#class-orderfilledcancelledfetcher)*

## Methods

###  getFilledTakerAmountAsync

▸ **getFilledTakerAmountAsync**(`orderHash`: string): *`Promise<BigNumber>`*

*Defined in [fetchers/order_filled_cancelled_fetcher.ts:16](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/fetchers/order_filled_cancelled_fetcher.ts#L16)*

**Parameters:**

Name | Type |
------ | ------ |
`orderHash` | string |

**Returns:** *`Promise<BigNumber>`*

___

###  getZRXAssetData

▸ **getZRXAssetData**(): *string*

*Defined in [fetchers/order_filled_cancelled_fetcher.ts:35](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/fetchers/order_filled_cancelled_fetcher.ts#L35)*

**Returns:** *string*

___

###  isOrderCancelledAsync

▸ **isOrderCancelledAsync**(`signedOrder`: `SignedOrder`): *`Promise<boolean>`*

*Defined in [fetchers/order_filled_cancelled_fetcher.ts:22](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/fetchers/order_filled_cancelled_fetcher.ts#L22)*

**Parameters:**

Name | Type |
------ | ------ |
`signedOrder` | `SignedOrder` |

**Returns:** *`Promise<boolean>`*

<hr />

> # Class: CoordinatorServerError

## Hierarchy

* `Error`

  * **CoordinatorServerError**

## Index

### Constructors

* [constructor](#constructor)

### Properties

* [approvedOrders](#optional-approvedorders)
* [cancellations](#optional-cancellations)
* [errors](#errors)
* [message](#message)
* [name](#name)
* [stack](#optional-stack)
* [Error](#static-error)

## Constructors

###  constructor

\+ **new CoordinatorServerError**(`message`: [CoordinatorServerErrorMsg](#class-coordinatorservererror)*

*Defined in [utils/coordinator_server_types.ts:43](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/utils/coordinator_server_types.ts#L43)*

**Parameters:**

Name | Type |
------ | ------ |
`message` | [CoordinatorServerErrorMsg](#enumeration-coordinatorservererrormsg) |
`approvedOrders` | `SignedOrder`[] |
`cancellations` | [CoordinatorServerCancellationResponse](#interface-coordinatorservercancellationresponse)[] |
`errors` | [CoordinatorServerResponse](#interface-coordinatorserverresponse)[] |

**Returns:** *[CoordinatorServerError](#class-coordinatorservererror)*

## Properties

### `Optional` approvedOrders

• **approvedOrders**? : *`SignedOrder`[]* =  []

*Defined in [utils/coordinator_server_types.ts:41](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/utils/coordinator_server_types.ts#L41)*

___

### `Optional` cancellations

• **cancellations**? : *[CoordinatorServerCancellationResponse](#interface-coordinatorservercancellationresponse)[]* =  []

*Defined in [utils/coordinator_server_types.ts:42](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/utils/coordinator_server_types.ts#L42)*

___

###  errors

• **errors**: *[CoordinatorServerResponse](#interface-coordinatorserverresponse)[]*

*Defined in [utils/coordinator_server_types.ts:43](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/utils/coordinator_server_types.ts#L43)*

___

###  message

• **message**: *[CoordinatorServerErrorMsg](#enumeration-coordinatorservererrormsg)*

*Overrides void*

*Defined in [utils/coordinator_server_types.ts:40](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/utils/coordinator_server_types.ts#L40)*

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

### `Static` Error

▪ **Error**: *`ErrorConstructor`*

Defined in /Users/rickmorty/Documents/projects/0x/0x-monorepo/node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:984

<hr />

> # Class: TransactionEncoder

Transaction Encoder. Transaction messages exist for the purpose of calling methods on the Exchange contract
in the context of another address. For example, UserA can encode and sign a fillOrder transaction and UserB
can submit this to the blockchain. The Exchange context executes as if UserA had directly submitted this transaction.

## Hierarchy

* **TransactionEncoder**

## Index

### Constructors

* [constructor](#constructor)

### Methods

* [batchCancelOrdersTx](#batchcancelorderstx)
* [batchFillOrKillOrdersTx](#batchfillorkillorderstx)
* [batchFillOrdersNoThrowTx](#batchfillordersnothrowtx)
* [batchFillOrdersTx](#batchfillorderstx)
* [cancelOrderTx](#cancelordertx)
* [cancelOrdersUpToTx](#cancelordersuptotx)
* [fillOrKillOrderTx](#fillorkillordertx)
* [fillOrderNoThrowTx](#fillordernothrowtx)
* [fillOrderTx](#fillordertx)
* [getTransactionHashHex](#gettransactionhashhex)
* [marketBuyOrdersNoThrowTx](#marketbuyordersnothrowtx)
* [marketBuyOrdersTx](#marketbuyorderstx)
* [marketSellOrdersNoThrowTx](#marketsellordersnothrowtx)
* [marketSellOrdersTx](#marketsellorderstx)
* [matchOrdersTx](#matchorderstx)
* [preSignTx](#presigntx)
* [setSignatureValidatorApprovalTx](#setsignaturevalidatorapprovaltx)

## Constructors

###  constructor

\+ **new TransactionEncoder**(`exchangeInstance`: `ExchangeContract`): *[TransactionEncoder](#class-transactionencoder)*

*Defined in [utils/transaction_encoder.ts:17](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/utils/transaction_encoder.ts#L17)*

**Parameters:**

Name | Type |
------ | ------ |
`exchangeInstance` | `ExchangeContract` |

**Returns:** *[TransactionEncoder](#class-transactionencoder)*

## Methods

###  batchCancelOrdersTx

▸ **batchCancelOrdersTx**(`signedOrders`: `SignedOrder`[]): *string*

*Defined in [utils/transaction_encoder.ts:149](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/utils/transaction_encoder.ts#L149)*

Encodes a batchCancelOrders transaction.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`signedOrders` | `SignedOrder`[] | An array of orders to cancel. |

**Returns:** *string*

Hex encoded abi of the function call.

___

###  batchFillOrKillOrdersTx

▸ **batchFillOrKillOrdersTx**(`signedOrders`: `SignedOrder`[], `takerAssetFillAmounts`: `BigNumber`[]): *string*

*Defined in [utils/transaction_encoder.ts:112](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/utils/transaction_encoder.ts#L112)*

Encodes a batchFillOrKillOrders transaction.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`signedOrders` | `SignedOrder`[] | An array of signed orders to fill. |
`takerAssetFillAmounts` | `BigNumber`[] | The amounts of the orders (in taker asset baseUnits) that you wish to fill. |

**Returns:** *string*

Hex encoded abi of the function call.

___

###  batchFillOrdersNoThrowTx

▸ **batchFillOrdersNoThrowTx**(`signedOrders`: `SignedOrder`[], `takerAssetFillAmounts`: `BigNumber`[]): *string*

*Defined in [utils/transaction_encoder.ts:131](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/utils/transaction_encoder.ts#L131)*

Encodes a batchFillOrdersNoThrow transaction.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`signedOrders` | `SignedOrder`[] | An array of signed orders to fill. |
`takerAssetFillAmounts` | `BigNumber`[] | The amounts of the orders (in taker asset baseUnits) that you wish to fill. |

**Returns:** *string*

Hex encoded abi of the function call.

___

###  batchFillOrdersTx

▸ **batchFillOrdersTx**(`signedOrders`: `SignedOrder`[], `takerAssetFillAmounts`: `BigNumber`[]): *string*

*Defined in [utils/transaction_encoder.ts:93](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/utils/transaction_encoder.ts#L93)*

Encodes a batchFillOrders transaction.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`signedOrders` | `SignedOrder`[] | An array of signed orders to fill. |
`takerAssetFillAmounts` | `BigNumber`[] | The amounts of the orders (in taker asset baseUnits) that you wish to fill. |

**Returns:** *string*

Hex encoded abi of the function call.

___

###  cancelOrderTx

▸ **cancelOrderTx**(`order`: `Order` | `SignedOrder`): *string*

*Defined in [utils/transaction_encoder.ts:171](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/utils/transaction_encoder.ts#L171)*

Encodes a cancelOrder transaction.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`order` | `Order` \| `SignedOrder` | An object that conforms to the Order or SignedOrder interface. The order you would like to cancel. |

**Returns:** *string*

Hex encoded abi of the function call.

___

###  cancelOrdersUpToTx

▸ **cancelOrdersUpToTx**(`targetOrderEpoch`: `BigNumber`): *string*

*Defined in [utils/transaction_encoder.ts:159](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/utils/transaction_encoder.ts#L159)*

Encodes a cancelOrdersUpTo transaction.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`targetOrderEpoch` | `BigNumber` | Target order epoch. |

**Returns:** *string*

Hex encoded abi of the function call.

___

###  fillOrKillOrderTx

▸ **fillOrKillOrderTx**(`signedOrder`: `SignedOrder`, `takerAssetFillAmount`: `BigNumber`): *string*

*Defined in [utils/transaction_encoder.ts:77](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/utils/transaction_encoder.ts#L77)*

Encodes a fillOrKillOrder transaction.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`signedOrder` | `SignedOrder` | An object that conforms to the SignedOrder interface. |
`takerAssetFillAmount` | `BigNumber` | The amount of the order (in taker asset baseUnits) that you wish to fill. |

**Returns:** *string*

Hex encoded abi of the function call.

___

###  fillOrderNoThrowTx

▸ **fillOrderNoThrowTx**(`signedOrder`: `SignedOrder`, `takerAssetFillAmount`: `BigNumber`): *string*

*Defined in [utils/transaction_encoder.ts:61](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/utils/transaction_encoder.ts#L61)*

Encodes a fillOrderNoThrow transaction.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`signedOrder` | `SignedOrder` | An object that conforms to the SignedOrder interface. |
`takerAssetFillAmount` | `BigNumber` | The amount of the order (in taker asset baseUnits) that you wish to fill. |

**Returns:** *string*

Hex encoded abi of the function call.

___

###  fillOrderTx

▸ **fillOrderTx**(`signedOrder`: `SignedOrder`, `takerAssetFillAmount`: `BigNumber`): *string*

*Defined in [utils/transaction_encoder.ts:45](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/utils/transaction_encoder.ts#L45)*

Encodes a fillOrder transaction.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`signedOrder` | `SignedOrder` | An object that conforms to the SignedOrder interface. |
`takerAssetFillAmount` | `BigNumber` | The amount of the order (in taker asset baseUnits) that you wish to fill. |

**Returns:** *string*

Hex encoded abi of the function call.

___

###  getTransactionHashHex

▸ **getTransactionHashHex**(`data`: string, `salt`: `BigNumber`, `signerAddress`: string): *string*

*Defined in [utils/transaction_encoder.ts:28](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/utils/transaction_encoder.ts#L28)*

Hashes the transaction data for use with the Exchange contract.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`data` | string | The ABI Encoded 0x Exchange method. I.e fillOrder |
`salt` | `BigNumber` | A random value to provide uniqueness and prevent replay attacks. |
`signerAddress` | string | The address which will sign this transaction. |

**Returns:** *string*

The hash of the 0x transaction.

___

###  marketBuyOrdersNoThrowTx

▸ **marketBuyOrdersNoThrowTx**(`signedOrders`: `SignedOrder`[], `makerAssetFillAmount`: `BigNumber`): *string*

*Defined in [utils/transaction_encoder.ts:233](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/utils/transaction_encoder.ts#L233)*

Encodes a maketBuyOrdersNoThrow transaction.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`signedOrders` | `SignedOrder`[] | An array of signed orders to fill. |
`makerAssetFillAmount` | `BigNumber` | Maker asset fill amount. |

**Returns:** *string*

Hex encoded abi of the function call.

___

###  marketBuyOrdersTx

▸ **marketBuyOrdersTx**(`signedOrders`: `SignedOrder`[], `makerAssetFillAmount`: `BigNumber`): *string*

*Defined in [utils/transaction_encoder.ts:216](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/utils/transaction_encoder.ts#L216)*

Encodes a maketBuyOrders transaction.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`signedOrders` | `SignedOrder`[] | An array of signed orders to fill. |
`makerAssetFillAmount` | `BigNumber` | Maker asset fill amount. |

**Returns:** *string*

Hex encoded abi of the function call.

___

###  marketSellOrdersNoThrowTx

▸ **marketSellOrdersNoThrowTx**(`signedOrders`: `SignedOrder`[], `takerAssetFillAmount`: `BigNumber`): *string*

*Defined in [utils/transaction_encoder.ts:199](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/utils/transaction_encoder.ts#L199)*

Encodes a marketSellOrdersNoThrow transaction.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`signedOrders` | `SignedOrder`[] | An array of signed orders to fill. |
`takerAssetFillAmount` | `BigNumber` | Taker asset fill amount. |

**Returns:** *string*

Hex encoded abi of the function call.

___

###  marketSellOrdersTx

▸ **marketSellOrdersTx**(`signedOrders`: `SignedOrder`[], `takerAssetFillAmount`: `BigNumber`): *string*

*Defined in [utils/transaction_encoder.ts:182](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/utils/transaction_encoder.ts#L182)*

Encodes a marketSellOrders transaction.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`signedOrders` | `SignedOrder`[] | An array of signed orders to fill. |
`takerAssetFillAmount` | `BigNumber` | Taker asset fill amount. |

**Returns:** *string*

Hex encoded abi of the function call.

___

###  matchOrdersTx

▸ **matchOrdersTx**(`leftOrder`: `SignedOrder`, `rightOrder`: `SignedOrder`): *string*

*Defined in [utils/transaction_encoder.ts:250](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/utils/transaction_encoder.ts#L250)*

Encodes a matchOrders transaction.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`leftOrder` | `SignedOrder` | First order to match. |
`rightOrder` | `SignedOrder` | Second order to match. |

**Returns:** *string*

Hex encoded abi of the function call.

___

###  preSignTx

▸ **preSignTx**(`hash`: string, `signerAddress`: string, `signature`: string): *string*

*Defined in [utils/transaction_encoder.ts:268](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/utils/transaction_encoder.ts#L268)*

Encodes a preSign transaction.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`hash` | string | Hash to pre-sign |
`signerAddress` | string | Address that should have signed the given hash. |
`signature` | string | Proof that the hash has been signed by signer. |

**Returns:** *string*

Hex encoded abi of the function call.

___

###  setSignatureValidatorApprovalTx

▸ **setSignatureValidatorApprovalTx**(`validatorAddress`: string, `isApproved`: boolean): *string*

*Defined in [utils/transaction_encoder.ts:285](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/utils/transaction_encoder.ts#L285)*

Encodes a setSignatureValidatorApproval transaction.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`validatorAddress` | string | Validator contract address. |
`isApproved` | boolean | Boolean value to set approval to. |

**Returns:** *string*

Hex encoded abi of the function call.

<hr />

> # Enumeration: ContractWrappersError

## Index

### Enumeration members

* [ContractNotDeployedOnNetwork](#contractnotdeployedonnetwork)
* [ERC721NoApproval](#erc721noapproval)
* [ERC721OwnerNotFound](#erc721ownernotfound)
* [InsufficientAllowanceForTransfer](#insufficientallowancefortransfer)
* [InsufficientBalanceForTransfer](#insufficientbalancefortransfer)
* [InsufficientEthBalanceForDeposit](#insufficientethbalancefordeposit)
* [InsufficientWEthBalanceForWithdrawal](#insufficientwethbalanceforwithdrawal)
* [InvalidJump](#invalidjump)
* [OutOfGas](#outofgas)
* [SignatureRequestDenied](#signaturerequestdenied)
* [SubscriptionAlreadyPresent](#subscriptionalreadypresent)
* [SubscriptionNotFound](#subscriptionnotfound)

## Enumeration members

###  ContractNotDeployedOnNetwork

• **ContractNotDeployedOnNetwork**: = "CONTRACT_NOT_DEPLOYED_ON_NETWORK"

*Defined in [types.ts:26](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L26)*

___

###  ERC721NoApproval

• **ERC721NoApproval**: = "ERC_721_NO_APPROVAL"

*Defined in [types.ts:36](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L36)*

___

###  ERC721OwnerNotFound

• **ERC721OwnerNotFound**: = "ERC_721_OWNER_NOT_FOUND"

*Defined in [types.ts:35](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L35)*

___

###  InsufficientAllowanceForTransfer

• **InsufficientAllowanceForTransfer**: = "INSUFFICIENT_ALLOWANCE_FOR_TRANSFER"

*Defined in [types.ts:27](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L27)*

___

###  InsufficientBalanceForTransfer

• **InsufficientBalanceForTransfer**: = "INSUFFICIENT_BALANCE_FOR_TRANSFER"

*Defined in [types.ts:28](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L28)*

___

###  InsufficientEthBalanceForDeposit

• **InsufficientEthBalanceForDeposit**: = "INSUFFICIENT_ETH_BALANCE_FOR_DEPOSIT"

*Defined in [types.ts:29](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L29)*

___

###  InsufficientWEthBalanceForWithdrawal

• **InsufficientWEthBalanceForWithdrawal**: = "INSUFFICIENT_WETH_BALANCE_FOR_WITHDRAWAL"

*Defined in [types.ts:30](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L30)*

___

###  InvalidJump

• **InvalidJump**: = "INVALID_JUMP"

*Defined in [types.ts:31](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L31)*

___

###  OutOfGas

• **OutOfGas**: = "OUT_OF_GAS"

*Defined in [types.ts:32](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L32)*

___

###  SignatureRequestDenied

• **SignatureRequestDenied**: = "SIGNATURE_REQUEST_DENIED"

*Defined in [types.ts:37](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L37)*

___

###  SubscriptionAlreadyPresent

• **SubscriptionAlreadyPresent**: = "SUBSCRIPTION_ALREADY_PRESENT"

*Defined in [types.ts:34](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L34)*

___

###  SubscriptionNotFound

• **SubscriptionNotFound**: = "SUBSCRIPTION_NOT_FOUND"

*Defined in [types.ts:33](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L33)*

<hr />

> # Enumeration: DutchAuctionWrapperError

## Index

### Enumeration members

* [AssetDataMismatch](#assetdatamismatch)

## Enumeration members

###  AssetDataMismatch

• **AssetDataMismatch**: = "ASSET_DATA_MISMATCH"

*Defined in [types.ts:220](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L220)*

<hr />

> # Enumeration: ExchangeWrapperError

## Index

### Enumeration members

* [AssetDataMismatch](#assetdatamismatch)

## Enumeration members

###  AssetDataMismatch

• **AssetDataMismatch**: = "ASSET_DATA_MISMATCH"

*Defined in [types.ts:18](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L18)*

<hr />

> # Enumeration: ForwarderWrapperError

## Index

### Enumeration members

* [CompleteFillFailed](#completefillfailed)

## Enumeration members

###  CompleteFillFailed

• **CompleteFillFailed**: = "COMPLETE_FILL_FAILED"

*Defined in [types.ts:22](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L22)*

<hr />

> # Enumeration: InternalContractWrappersError

## Index

### Enumeration members

* [NoAbiDecoder](#noabidecoder)

## Enumeration members

###  NoAbiDecoder

• **NoAbiDecoder**: = "NO_ABI_DECODER"

*Defined in [types.ts:41](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L41)*

<hr />

> # Enumeration: OrderStatus

## Index

### Enumeration members

* [Cancelled](#cancelled)
* [Expired](#expired)
* [Fillable](#fillable)
* [FullyFilled](#fullyfilled)
* [Invalid](#invalid)
* [InvalidMakerAssetAmount](#invalidmakerassetamount)
* [InvalidTakerAssetAmount](#invalidtakerassetamount)

## Enumeration members

###  Cancelled

• **Cancelled**:

*Defined in [types.ts:195](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L195)*

___

###  Expired

• **Expired**:

*Defined in [types.ts:193](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L193)*

___

###  Fillable

• **Fillable**:

*Defined in [types.ts:192](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L192)*

___

###  FullyFilled

• **FullyFilled**:

*Defined in [types.ts:194](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L194)*

___

###  Invalid

• **Invalid**: = 0

*Defined in [types.ts:189](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L189)*

___

###  InvalidMakerAssetAmount

• **InvalidMakerAssetAmount**:

*Defined in [types.ts:190](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L190)*

___

###  InvalidTakerAssetAmount

• **InvalidTakerAssetAmount**:

*Defined in [types.ts:191](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L191)*

<hr />

> # Enumeration: TradeSide

## Index

### Enumeration members

* [Maker](#maker)
* [Taker](#taker)

## Enumeration members

###  Maker

• **Maker**: = "maker"

*Defined in [types.ts:171](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L171)*

___

###  Taker

• **Taker**: = "taker"

*Defined in [types.ts:172](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L172)*

<hr />

> # Enumeration: TransferType

## Index

### Enumeration members

* [Fee](#fee)
* [Trade](#trade)

## Enumeration members

###  Fee

• **Fee**: = "fee"

*Defined in [types.ts:177](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L177)*

___

###  Trade

• **Trade**: = "trade"

*Defined in [types.ts:176](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L176)*

<hr />

> # Enumeration: CoordinatorServerErrorMsg

## Index

### Enumeration members

* [CancellationFailed](#cancellationfailed)
* [FillFailed](#fillfailed)

## Enumeration members

###  CancellationFailed

• **CancellationFailed**: = "Failed to cancel with some coordinator server(s). See errors for more info. See cancellations for successful cancellations."

*Defined in [utils/coordinator_server_types.ts:59](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/utils/coordinator_server_types.ts#L59)*

___

###  FillFailed

• **FillFailed**: = "Failed to obtain approval signatures from some coordinator server(s). See errors for more info. Current transaction has been abandoned but you may resubmit with only approvedOrders (a new ZeroEx transaction will have to be signed)."

*Defined in [utils/coordinator_server_types.ts:60](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/utils/coordinator_server_types.ts#L60)*

<hr />

> # Interface: BalanceAndAllowance

## Hierarchy

* **BalanceAndAllowance**

## Index

### Properties

* [allowance](#allowance)
* [balance](#balance)

## Properties

###  allowance

• **allowance**: *`BigNumber`*

*Defined in [types.ts:216](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L216)*

___

###  balance

• **balance**: *`BigNumber`*

*Defined in [types.ts:215](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L215)*

<hr />

> # Interface: BlockRange

## Hierarchy

* **BlockRange**

## Index

### Properties

* [fromBlock](#fromblock)
* [toBlock](#toblock)

## Properties

###  fromBlock

• **fromBlock**: *`BlockParam`*

*Defined in [types.ts:97](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L97)*

___

###  toBlock

• **toBlock**: *`BlockParam`*

*Defined in [types.ts:98](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L98)*

<hr />

> # Interface: ContractEvent

## Hierarchy

* **ContractEvent**

## Index

### Properties

* [address](#address)
* [args](#args)
* [blockHash](#blockhash)
* [blockNumber](#blocknumber)
* [event](#event)
* [logIndex](#logindex)
* [transactionHash](#transactionhash)
* [transactionIndex](#transactionindex)
* [type](#type)

## Properties

###  address

• **address**: *string*

*Defined in [types.ts:61](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L61)*

___

###  args

• **args**: *[ContractEventArgs](#contracteventargs)*

*Defined in [types.ts:64](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L64)*

___

###  blockHash

• **blockHash**: *string*

*Defined in [types.ts:59](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L59)*

___

###  blockNumber

• **blockNumber**: *number*

*Defined in [types.ts:60](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L60)*

___

###  event

• **event**: *string*

*Defined in [types.ts:63](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L63)*

___

###  logIndex

• **logIndex**: *number*

*Defined in [types.ts:56](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L56)*

___

###  transactionHash

• **transactionHash**: *string*

*Defined in [types.ts:58](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L58)*

___

###  transactionIndex

• **transactionIndex**: *number*

*Defined in [types.ts:57](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L57)*

___

###  type

• **type**: *string*

*Defined in [types.ts:62](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L62)*

<hr />

> # Interface: ContractWrappersConfig

networkId: The id of the underlying ethereum network your provider is connected to. (1-mainnet, 3-ropsten, 4-rinkeby, 42-kovan, 50-testrpc)
gasPrice: Gas price to use with every transaction
contractAddresses: The address of all contracts to use. Defaults to the known addresses based on networkId.
blockPollingIntervalMs: The interval to use for block polling in event watching methods (defaults to 1000)

## Hierarchy

* **ContractWrappersConfig**

## Index

### Properties

* [blockPollingIntervalMs](#optional-blockpollingintervalms)
* [contractAddresses](#optional-contractaddresses)
* [gasPrice](#optional-gasprice)
* [networkId](#networkid)

## Properties

### `Optional` blockPollingIntervalMs

• **blockPollingIntervalMs**? : *undefined | number*

*Defined in [types.ts:119](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L119)*

___

### `Optional` contractAddresses

• **contractAddresses**? : *`ContractAddresses`*

*Defined in [types.ts:118](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L118)*

___

### `Optional` gasPrice

• **gasPrice**? : *`BigNumber`*

*Defined in [types.ts:117](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L117)*

___

###  networkId

• **networkId**: *number*

*Defined in [types.ts:116](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L116)*

<hr />

> # Interface: CoordinatorTransaction

## Hierarchy

* **CoordinatorTransaction**

## Index

### Properties

* [data](#data)
* [salt](#salt)
* [signerAddress](#signeraddress)

## Properties

###  data

• **data**: *string*

*Defined in [types.ts:228](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L228)*

___

###  salt

• **salt**: *`BigNumber`*

*Defined in [types.ts:226](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L226)*

___

###  signerAddress

• **signerAddress**: *string*

*Defined in [types.ts:227](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L227)*

<hr />

> # Interface: DecodedLogEvent <**ArgsType**>

## Type parameters

▪ **ArgsType**: *`DecodedLogArgs`*

## Hierarchy

* **DecodedLogEvent**

## Index

### Properties

* [isRemoved](#isremoved)
* [log](#log)

## Properties

###  isRemoved

• **isRemoved**: *boolean*

*Defined in [types.ts:46](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L46)*

___

###  log

• **log**: *`LogWithDecodedArgs<ArgsType>`*

*Defined in [types.ts:47](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L47)*

<hr />

> # Interface: IndexedFilterValues

## Hierarchy

* **IndexedFilterValues**

## Indexable

● \[▪ **index**: *string*\]: `ContractEventArg`

<hr />

> # Interface: MethodOpts

defaultBlock: The block up to which to query the blockchain state. Setting this to a historical block number
let's the user query the blockchain's state at an arbitrary point in time. In order for this to work, the
backing  Ethereum node must keep the entire historical state of the chain (e.g setting `--pruning=archive`
flag when  running Parity).

## Hierarchy

* **MethodOpts**

## Index

### Properties

* [defaultBlock](#optional-defaultblock)

## Properties

### `Optional` defaultBlock

• **defaultBlock**? : *`BlockParam`*

*Defined in [types.ts:148](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L148)*

<hr />

> # Interface: OrderAndTraderInfo

## Hierarchy

* **OrderAndTraderInfo**

## Index

### Properties

* [orderInfo](#orderinfo)
* [traderInfo](#traderinfo)

## Properties

###  orderInfo

• **orderInfo**: *[OrderInfo](#interface-orderinfo)*

*Defined in [types.ts:210](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L210)*

___

###  traderInfo

• **traderInfo**: *[TraderInfo](#interface-traderinfo)*

*Defined in [types.ts:211](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L211)*

<hr />

> # Interface: OrderFillRequest

## Hierarchy

* **OrderFillRequest**

## Index

### Properties

* [signedOrder](#signedorder)
* [takerAssetFillAmount](#takerassetfillamount)

## Properties

###  signedOrder

• **signedOrder**: *`SignedOrder`*

*Defined in [types.ts:102](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L102)*

___

###  takerAssetFillAmount

• **takerAssetFillAmount**: *`BigNumber`*

*Defined in [types.ts:103](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L103)*

<hr />

> # Interface: OrderInfo

## Hierarchy

* **OrderInfo**

## Index

### Properties

* [orderHash](#orderhash)
* [orderStatus](#orderstatus)
* [orderTakerAssetFilledAmount](#ordertakerassetfilledamount)

## Properties

###  orderHash

• **orderHash**: *string*

*Defined in [types.ts:184](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L184)*

___

###  orderStatus

• **orderStatus**: *[OrderStatus](#enumeration-orderstatus)*

*Defined in [types.ts:183](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L183)*

___

###  orderTakerAssetFilledAmount

• **orderTakerAssetFilledAmount**: *`BigNumber`*

*Defined in [types.ts:185](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L185)*

<hr />

> # Interface: OrderTransactionOpts

shouldValidate: Flag indicating whether the library should make attempts to validate a transaction before
broadcasting it. For example, order has a valid signature, maker has sufficient funds, etc. Default=true.

## Hierarchy

* [TransactionOpts](#interface-transactionopts)

  * **OrderTransactionOpts**

## Index

### Properties

* [gasLimit](#optional-gaslimit)
* [gasPrice](#optional-gasprice)
* [nonce](#optional-nonce)
* [shouldValidate](#optional-shouldvalidate)

## Properties

### `Optional` gasLimit

• **gasLimit**? : *undefined | number*

*Inherited from [TransactionOpts](#optional-gaslimit)*

*Defined in [types.ts:158](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L158)*

___

### `Optional` gasPrice

• **gasPrice**? : *`BigNumber`*

*Inherited from [TransactionOpts](#optional-gasprice)*

*Defined in [types.ts:157](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L157)*

___

### `Optional` nonce

• **nonce**? : *undefined | number*

*Inherited from [TransactionOpts](#optional-nonce)*

*Defined in [types.ts:159](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L159)*

___

### `Optional` shouldValidate

• **shouldValidate**? : *undefined | false | true*

*Defined in [types.ts:167](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L167)*

<hr />

> # Interface: Token

## Hierarchy

* **Token**

## Index

### Properties

* [address](#address)
* [decimals](#decimals)
* [name](#name)
* [symbol](#symbol)

## Properties

###  address

• **address**: *string*

*Defined in [types.ts:74](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L74)*

___

###  decimals

• **decimals**: *number*

*Defined in [types.ts:76](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L76)*

___

###  name

• **name**: *string*

*Defined in [types.ts:73](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L73)*

___

###  symbol

• **symbol**: *string*

*Defined in [types.ts:75](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L75)*

<hr />

> # Interface: TokenAddressBySymbol

## Hierarchy

* **TokenAddressBySymbol**

## Indexable

● \[▪ **symbol**: *string*\]: string

<hr />

> # Interface: TraderInfo

## Hierarchy

* **TraderInfo**

## Index

### Properties

* [makerAllowance](#makerallowance)
* [makerBalance](#makerbalance)
* [makerZrxAllowance](#makerzrxallowance)
* [makerZrxBalance](#makerzrxbalance)
* [takerAllowance](#takerallowance)
* [takerBalance](#takerbalance)
* [takerZrxAllowance](#takerzrxallowance)
* [takerZrxBalance](#takerzrxbalance)

## Properties

###  makerAllowance

• **makerAllowance**: *`BigNumber`*

*Defined in [types.ts:200](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L200)*

___

###  makerBalance

• **makerBalance**: *`BigNumber`*

*Defined in [types.ts:199](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L199)*

___

###  makerZrxAllowance

• **makerZrxAllowance**: *`BigNumber`*

*Defined in [types.ts:204](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L204)*

___

###  makerZrxBalance

• **makerZrxBalance**: *`BigNumber`*

*Defined in [types.ts:203](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L203)*

___

###  takerAllowance

• **takerAllowance**: *`BigNumber`*

*Defined in [types.ts:202](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L202)*

___

###  takerBalance

• **takerBalance**: *`BigNumber`*

*Defined in [types.ts:201](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L201)*

___

###  takerZrxAllowance

• **takerZrxAllowance**: *`BigNumber`*

*Defined in [types.ts:206](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L206)*

___

###  takerZrxBalance

• **takerZrxBalance**: *`BigNumber`*

*Defined in [types.ts:205](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L205)*

<hr />

> # Interface: TransactionOpts

gasPrice: Gas price in Wei to use for a transaction
gasLimit: The amount of gas to send with a transaction (in Gwei)
nonce: The nonce to use for a transaction. If not specified, it defaults to the next incremented nonce.

## Hierarchy

* **TransactionOpts**

  * [OrderTransactionOpts](#interface-ordertransactionopts)

## Index

### Properties

* [gasLimit](#optional-gaslimit)
* [gasPrice](#optional-gasprice)
* [nonce](#optional-nonce)

## Properties

### `Optional` gasLimit

• **gasLimit**? : *undefined | number*

*Defined in [types.ts:158](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L158)*

___

### `Optional` gasPrice

• **gasPrice**? : *`BigNumber`*

*Defined in [types.ts:157](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L157)*

___

### `Optional` nonce

• **nonce**? : *undefined | number*

*Defined in [types.ts:159](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L159)*

<hr />

> # Interface: TxOpts

## Hierarchy

* **TxOpts**

## Index

### Properties

* [from](#from)
* [gas](#optional-gas)
* [gasPrice](#optional-gasprice)
* [value](#optional-value)

## Properties

###  from

• **from**: *string*

*Defined in [types.ts:80](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L80)*

___

### `Optional` gas

• **gas**? : *undefined | number*

*Defined in [types.ts:81](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L81)*

___

### `Optional` gasPrice

• **gasPrice**? : *`BigNumber`*

*Defined in [types.ts:83](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L83)*

___

### `Optional` value

• **value**? : *`BigNumber`*

*Defined in [types.ts:82](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L82)*

<hr />

> # Interface: ValidateOrderFillableOpts

`expectedFillTakerTokenAmount`: If specified, the validation method will ensure that the supplied order maker has a sufficient
                              allowance/balance to fill this amount of the order's takerTokenAmount.

`validateRemainingOrderAmountIsFillable`: The validation method ensures that the maker has sufficient allowance/balance to fill
                                        the entire remaining order amount. If this option is set to false, the balances
                                        and allowances are calculated to determine the order is fillable for a
                                        non-zero amount (some value less than or equal to the order remaining amount).
                                        We call such orders "partially fillable orders". Default is `true`.

`simulationTakerAddress`: During the maker transfer simulation, tokens are sent from the maker to the `simulationTakerAddress`. This defaults
                          to the `takerAddress` specified in the order. Some tokens prevent transfer to the NULL address so this address can be specified.

## Hierarchy

* **ValidateOrderFillableOpts**

## Index

### Properties

* [expectedFillTakerTokenAmount](#optional-expectedfilltakertokenamount)
* [simulationTakerAddress](#optional-simulationtakeraddress)
* [validateRemainingOrderAmountIsFillable](#optional-validateremainingorderamountisfillable)

## Properties

### `Optional` expectedFillTakerTokenAmount

• **expectedFillTakerTokenAmount**? : *`BigNumber`*

*Defined in [types.ts:136](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L136)*

___

### `Optional` simulationTakerAddress

• **simulationTakerAddress**? : *undefined | string*

*Defined in [types.ts:138](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L138)*

___

### `Optional` validateRemainingOrderAmountIsFillable

• **validateRemainingOrderAmountIsFillable**? : *undefined | false | true*

*Defined in [types.ts:137](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/types.ts#L137)*

<hr />

> # Interface: CoordinatorOutstandingFillSignatures

## Hierarchy

* **CoordinatorOutstandingFillSignatures**

## Index

### Properties

* [approvalSignatures](#approvalsignatures)
* [expirationTimeSeconds](#expirationtimeseconds)
* [orderHash](#orderhash)
* [takerAssetFillAmount](#takerassetfillamount)

## Properties

###  approvalSignatures

• **approvalSignatures**: *string[]*

*Defined in [utils/coordinator_server_types.ts:19](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/utils/coordinator_server_types.ts#L19)*

___

###  expirationTimeSeconds

• **expirationTimeSeconds**: *`BigNumber`*

*Defined in [utils/coordinator_server_types.ts:20](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/utils/coordinator_server_types.ts#L20)*

___

###  orderHash

• **orderHash**: *string*

*Defined in [utils/coordinator_server_types.ts:18](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/utils/coordinator_server_types.ts#L18)*

___

###  takerAssetFillAmount

• **takerAssetFillAmount**: *`BigNumber`*

*Defined in [utils/coordinator_server_types.ts:21](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/utils/coordinator_server_types.ts#L21)*

<hr />

> # Interface: CoordinatorServerApprovalRawResponse

## Hierarchy

* **CoordinatorServerApprovalRawResponse**

## Index

### Properties

* [expirationTimeSeconds](#expirationtimeseconds)
* [signatures](#signatures)

## Properties

###  expirationTimeSeconds

• **expirationTimeSeconds**: *`BigNumber`*

*Defined in [utils/coordinator_server_types.ts:10](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/utils/coordinator_server_types.ts#L10)*

___

###  signatures

• **signatures**: *string[]*

*Defined in [utils/coordinator_server_types.ts:9](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/utils/coordinator_server_types.ts#L9)*

<hr />

> # Interface: CoordinatorServerApprovalResponse

## Hierarchy

* **CoordinatorServerApprovalResponse**

## Index

### Properties

* [expirationTimeSeconds](#expirationtimeseconds)
* [signatures](#signatures)

## Properties

###  expirationTimeSeconds

• **expirationTimeSeconds**: *`BigNumber`[]*

*Defined in [utils/coordinator_server_types.ts:6](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/utils/coordinator_server_types.ts#L6)*

___

###  signatures

• **signatures**: *string[]*

*Defined in [utils/coordinator_server_types.ts:5](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/utils/coordinator_server_types.ts#L5)*

<hr />

> # Interface: CoordinatorServerCancellationResponse

## Hierarchy

* **CoordinatorServerCancellationResponse**

## Index

### Properties

* [cancellationSignatures](#cancellationsignatures)
* [outstandingFillSignatures](#outstandingfillsignatures)

## Properties

###  cancellationSignatures

• **cancellationSignatures**: *string[]*

*Defined in [utils/coordinator_server_types.ts:15](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/utils/coordinator_server_types.ts#L15)*

___

###  outstandingFillSignatures

• **outstandingFillSignatures**: *[CoordinatorOutstandingFillSignatures](#class-coordinatoroutstandingfillsignatures)[]*

*Defined in [utils/coordinator_server_types.ts:14](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/utils/coordinator_server_types.ts#L14)*

<hr />

> # Interface: CoordinatorServerRequest

## Hierarchy

* **CoordinatorServerRequest**

## Index

### Properties

* [signedTransaction](#signedtransaction)
* [txOrigin](#txorigin)

## Properties

###  signedTransaction

• **signedTransaction**: *`SignedZeroExTransaction`*

*Defined in [utils/coordinator_server_types.ts:35](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/utils/coordinator_server_types.ts#L35)*

___

###  txOrigin

• **txOrigin**: *string*

*Defined in [utils/coordinator_server_types.ts:36](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/utils/coordinator_server_types.ts#L36)*

<hr />

> # Interface: CoordinatorServerResponse

## Hierarchy

* **CoordinatorServerResponse**

## Index

### Properties

* [body](#optional-body)
* [coordinatorOperator](#coordinatoroperator)
* [error](#optional-error)
* [isError](#iserror)
* [orders](#optional-orders)
* [request](#request)
* [status](#status)

## Properties

### `Optional` body

• **body**? : *[CoordinatorServerCancellationResponse](#class-coordinatorserverapprovalrawresponse)*

*Defined in [utils/coordinator_server_types.ts:27](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/utils/coordinator_server_types.ts#L27)*

___

###  coordinatorOperator

• **coordinatorOperator**: *string*

*Defined in [utils/coordinator_server_types.ts:30](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/utils/coordinator_server_types.ts#L30)*

___

### `Optional` error

• **error**? : *any*

*Defined in [utils/coordinator_server_types.ts:28](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/utils/coordinator_server_types.ts#L28)*

___

###  isError

• **isError**: *boolean*

*Defined in [utils/coordinator_server_types.ts:25](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/utils/coordinator_server_types.ts#L25)*

___

### `Optional` orders

• **orders**? : *`Array<SignedOrder | Order>`*

*Defined in [utils/coordinator_server_types.ts:31](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/utils/coordinator_server_types.ts#L31)*

___

###  request

• **request**: *[CoordinatorServerRequest](#class-coordinatorserverrequest)*

*Defined in [utils/coordinator_server_types.ts:29](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/utils/coordinator_server_types.ts#L29)*

___

###  status

• **status**: *number*

*Defined in [utils/coordinator_server_types.ts:26](https://github.com/0xProject/0x-monorepo/blob/61e50a1cd/packages/contract-wrappers/src/utils/coordinator_server_types.ts#L26)*

<hr />

* [Globals](globals.md)
* [External Modules]()
  * [abstract/abstract_balance_and_proxy_allowance_lazy_store](modules/_abstract_abstract_balance_and_proxy_allowance_lazy_store_.md)
  * [abstract/abstract_balance_and_proxy_allowance_lazy_store.AbstractBalanceAndProxyAllowanceLazyStore](#class-abstractbalanceandproxyallowancelazystore)
  * [contract_wrappers](modules/_contract_wrappers_.md)
  * [contract_wrappers.ContractWrappers](#class-contractwrappers)
  * [contract_wrappers/coordinator_wrapper](modules/_contract_wrappers_coordinator_wrapper_.md)
  * [contract_wrappers/coordinator_wrapper.CoordinatorWrapper](#class-coordinatorwrapper)
  * [contract_wrappers/dutch_auction_wrapper](modules/_contract_wrappers_dutch_auction_wrapper_.md)
  * [contract_wrappers/dutch_auction_wrapper.DutchAuctionWrapper](#class-dutchauctionwrapper)
  * [contract_wrappers/erc20_proxy_wrapper](modules/_contract_wrappers_erc20_proxy_wrapper_.md)
  * [contract_wrappers/erc20_proxy_wrapper.ERC20ProxyWrapper](#class-erc20proxywrapper)
  * [contract_wrappers/erc20_token_wrapper](modules/_contract_wrappers_erc20_token_wrapper_.md)
  * [contract_wrappers/erc20_token_wrapper.ERC20TokenWrapper](#class-erc20tokenwrapper)
  * [contract_wrappers/erc721_proxy_wrapper](modules/_contract_wrappers_erc721_proxy_wrapper_.md)
  * [contract_wrappers/erc721_proxy_wrapper.ERC721ProxyWrapper](#class-erc721proxywrapper)
  * [contract_wrappers/erc721_token_wrapper](modules/_contract_wrappers_erc721_token_wrapper_.md)
  * [contract_wrappers/erc721_token_wrapper.ERC721TokenWrapper](#class-erc721tokenwrapper)
  * [contract_wrappers/ether_token_wrapper](modules/_contract_wrappers_ether_token_wrapper_.md)
  * [contract_wrappers/ether_token_wrapper.EtherTokenWrapper](#class-ethertokenwrapper)
  * [contract_wrappers/exchange_wrapper](modules/_contract_wrappers_exchange_wrapper_.md)
  * [contract_wrappers/exchange_wrapper.ExchangeWrapper](#class-exchangewrapper)
  * [contract_wrappers/forwarder_wrapper](modules/_contract_wrappers_forwarder_wrapper_.md)
  * [contract_wrappers/forwarder_wrapper.ForwarderWrapper](#class-forwarderwrapper)
  * [contract_wrappers/order_validator_wrapper](modules/_contract_wrappers_order_validator_wrapper_.md)
  * [contract_wrappers/order_validator_wrapper.OrderValidatorWrapper](#class-ordervalidatorwrapper)
  * [fetchers/asset_balance_and_proxy_allowance_fetcher](modules/_fetchers_asset_balance_and_proxy_allowance_fetcher_.md)
  * [fetchers/asset_balance_and_proxy_allowance_fetcher.AssetBalanceAndProxyAllowanceFetcher](#class-assetbalanceandproxyallowancefetcher)
  * [fetchers/order_filled_cancelled_fetcher](modules/_fetchers_order_filled_cancelled_fetcher_.md)
  * [fetchers/order_filled_cancelled_fetcher.OrderFilledCancelledFetcher](#class-orderfilledcancelledfetcher)
  * [index](modules/_index_.md)
  * [schemas/contract_wrappers_config_schema](modules/_schemas_contract_wrappers_config_schema_.md)
  * [schemas/method_opts_schema](modules/_schemas_method_opts_schema_.md)
  * [schemas/order_tx_opts_schema](modules/_schemas_order_tx_opts_schema_.md)
  * [schemas/tx_opts_schema](modules/_schemas_tx_opts_schema_.md)
  * [schemas/validate_order_fillable_opts_schema](modules/_schemas_validate_order_fillable_opts_schema_.md)
  * [types](modules/_types_.md)
  * [types.ContractWrappersError](#class-contractwrapperserror)
  * [types.DutchAuctionWrapperError](#class-dutchauctionwrappererror)
  * [types.ExchangeWrapperError](#class-exchangewrappererror)
  * [types.ForwarderWrapperError](#class-forwarderwrappererror)
  * [types.InternalContractWrappersError](#class-internalcontractwrapperserror)
  * [types.OrderStatus](#class-orderstatus)
  * [types.TradeSide](#class-tradeside)
  * [types.TransferType](#class-transfertype)
  * [types.BalanceAndAllowance](#class-balanceandallowance)
  * [types.BlockRange](#class-blockrange)
  * [types.ContractEvent](#class-contractevent)
  * [types.ContractWrappersConfig](#class-contractwrappersconfig)
  * [types.CoordinatorTransaction](#class-coordinatortransaction)
  * [types.DecodedLogEvent](#class-decodedlogevent)
  * [types.IndexedFilterValues](#class-indexedfiltervalues)
  * [types.MethodOpts](#class-methodopts)
  * [types.OrderAndTraderInfo](#class-orderandtraderinfo)
  * [types.OrderFillRequest](#class-orderfillrequest)
  * [types.OrderInfo](#class-orderinfo)
  * [types.OrderTransactionOpts](#class-ordertransactionopts)
  * [types.Token](#class-token)
  * [types.TokenAddressBySymbol](#class-tokenaddressbysymbol)
  * [types.TraderInfo](#class-traderinfo)
  * [types.TransactionOpts](#class-transactionopts)
  * [types.TxOpts](#class-txopts)
  * [types.ValidateOrderFillableOpts](#class-validateorderfillableopts)
  * [utils/assert](modules/_utils_assert_.md)
  * [utils/calldata_optimization_utils](modules/_utils_calldata_optimization_utils_.md)
  * [utils/constants](modules/_utils_constants_.md)
  * [utils/contract_addresses](modules/_utils_contract_addresses_.md)
  * [utils/coordinator_server_types](modules/_utils_coordinator_server_types_.md)
  * [utils/coordinator_server_types.CoordinatorServerErrorMsg](#class-coordinatorservererrormsg)
  * [utils/coordinator_server_types.CoordinatorServerError](#class-coordinatorservererror)
  * [utils/coordinator_server_types.CoordinatorOutstandingFillSignatures](#class-coordinatoroutstandingfillsignatures)
  * [utils/coordinator_server_types.CoordinatorServerApprovalRawResponse](#class-coordinatorserverapprovalrawresponse)
  * [utils/coordinator_server_types.CoordinatorServerApprovalResponse](#class-coordinatorserverapprovalresponse)
  * [utils/coordinator_server_types.CoordinatorServerCancellationResponse](#class-coordinatorservercancellationresponse)
  * [utils/coordinator_server_types.CoordinatorServerRequest](#class-coordinatorserverrequest)
  * [utils/coordinator_server_types.CoordinatorServerResponse](#class-coordinatorserverresponse)
  * [utils/decorators](modules/_utils_decorators_.md)
  * [utils/filter_utils](modules/_utils_filter_utils_.md)
  * [utils/transaction_encoder](modules/_utils_transaction_encoder_.md)
  * [utils/transaction_encoder.TransactionEncoder](#class-transactionencoder)
  * [utils/utils](modules/_utils_utils_.md)
* [Classes]()
  * [abstract/abstract_balance_and_proxy_allowance_lazy_store.AbstractBalanceAndProxyAllowanceLazyStore](#class-abstractbalanceandproxyallowancelazystore)
  * [contract_wrappers.ContractWrappers](#class-contractwrappers)
  * [contract_wrappers/coordinator_wrapper.CoordinatorWrapper](#class-coordinatorwrapper)
  * [contract_wrappers/dutch_auction_wrapper.DutchAuctionWrapper](#class-dutchauctionwrapper)
  * [contract_wrappers/erc20_proxy_wrapper.ERC20ProxyWrapper](#class-erc20proxywrapper)
  * [contract_wrappers/erc20_token_wrapper.ERC20TokenWrapper](#class-erc20tokenwrapper)
  * [contract_wrappers/erc721_proxy_wrapper.ERC721ProxyWrapper](#class-erc721proxywrapper)
  * [contract_wrappers/erc721_token_wrapper.ERC721TokenWrapper](#class-erc721tokenwrapper)
  * [contract_wrappers/ether_token_wrapper.EtherTokenWrapper](#class-ethertokenwrapper)
  * [contract_wrappers/exchange_wrapper.ExchangeWrapper](#class-exchangewrapper)
  * [contract_wrappers/forwarder_wrapper.ForwarderWrapper](#class-forwarderwrapper)
  * [contract_wrappers/order_validator_wrapper.OrderValidatorWrapper](#class-ordervalidatorwrapper)
  * [fetchers/asset_balance_and_proxy_allowance_fetcher.AssetBalanceAndProxyAllowanceFetcher](#class-assetbalanceandproxyallowancefetcher)
  * [fetchers/order_filled_cancelled_fetcher.OrderFilledCancelledFetcher](#class-orderfilledcancelledfetcher)
  * [utils/coordinator_server_types.CoordinatorServerError](#class-coordinatorservererror)
  * [utils/transaction_encoder.TransactionEncoder](#class-transactionencoder)
* [Enums]()
  * [types.ContractWrappersError](#class-contractwrapperserror)
  * [types.DutchAuctionWrapperError](#class-dutchauctionwrappererror)
  * [types.ExchangeWrapperError](#class-exchangewrappererror)
  * [types.ForwarderWrapperError](#class-forwarderwrappererror)
  * [types.InternalContractWrappersError](#class-internalcontractwrapperserror)
  * [types.OrderStatus](#class-orderstatus)
  * [types.TradeSide](#class-tradeside)
  * [types.TransferType](#class-transfertype)
  * [utils/coordinator_server_types.CoordinatorServerErrorMsg](#class-coordinatorservererrormsg)
* [Interfaces]()
  * [types.BalanceAndAllowance](#class-balanceandallowance)
  * [types.BlockRange](#class-blockrange)
  * [types.ContractEvent](#class-contractevent)
  * [types.ContractWrappersConfig](#class-contractwrappersconfig)
  * [types.CoordinatorTransaction](#class-coordinatortransaction)
  * [types.DecodedLogEvent](#class-decodedlogevent)
  * [types.IndexedFilterValues](#class-indexedfiltervalues)
  * [types.MethodOpts](#class-methodopts)
  * [types.OrderAndTraderInfo](#class-orderandtraderinfo)
  * [types.OrderFillRequest](#class-orderfillrequest)
  * [types.OrderInfo](#class-orderinfo)
  * [types.OrderTransactionOpts](#class-ordertransactionopts)
  * [types.Token](#class-token)
  * [types.TokenAddressBySymbol](#class-tokenaddressbysymbol)
  * [types.TraderInfo](#class-traderinfo)
  * [types.TransactionOpts](#class-transactionopts)
  * [types.TxOpts](#class-txopts)
  * [types.ValidateOrderFillableOpts](#class-validateorderfillableopts)
  * [utils/coordinator_server_types.CoordinatorOutstandingFillSignatures](#class-coordinatoroutstandingfillsignatures)
  * [utils/coordinator_server_types.CoordinatorServerApprovalRawResponse](#class-coordinatorserverapprovalrawresponse)
  * [utils/coordinator_server_types.CoordinatorServerApprovalResponse](#class-coordinatorserverapprovalresponse)
  * [utils/coordinator_server_types.CoordinatorServerCancellationResponse](#class-coordinatorservercancellationresponse)
  * [utils/coordinator_server_types.CoordinatorServerRequest](#class-coordinatorserverrequest)
  * [utils/coordinator_server_types.CoordinatorServerResponse](#class-coordinatorserverresponse)

<hr />

