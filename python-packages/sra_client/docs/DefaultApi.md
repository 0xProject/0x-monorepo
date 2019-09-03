# sra_client.DefaultApi

All URIs are relative to _http://localhost_

| Method                                                     | HTTP request                  | Description |
| ---------------------------------------------------------- | ----------------------------- | ----------- |
| [**get_asset_pairs**](DefaultApi.md#get_asset_pairs)       | **GET** /v2/asset_pairs       |
| [**get_fee_recipients**](DefaultApi.md#get_fee_recipients) | **GET** /v2/fee_recipients    |
| [**get_order**](DefaultApi.md#get_order)                   | **GET** /v2/order/{orderHash} |
| [**get_order_config**](DefaultApi.md#get_order_config)     | **POST** /v2/order_config     |
| [**get_orderbook**](DefaultApi.md#get_orderbook)           | **GET** /v2/orderbook         |
| [**get_orders**](DefaultApi.md#get_orders)                 | **GET** /v2/orders            |
| [**post_order**](DefaultApi.md#post_order)                 | **POST** /v2/order            |

# **get_asset_pairs**

> RelayerApiAssetDataPairsResponseSchema get_asset_pairs(asset_data_a=asset_data_a, asset_data_b=asset_data_b, network_id=network_id, page=page, per_page=per_page)

Retrieves a list of available asset pairs and the information required to trade them (in any order). Setting only `assetDataA` or `assetDataB` returns pairs filtered by that asset only.

### Example

```python
from __future__ import print_function
import time
import sra_client
from sra_client.rest import ApiException
from pprint import pprint

# create an instance of the API class
api_instance = sra_client.DefaultApi()
asset_data_a = 0xf47261b04c32345ced77393b3530b1eed0f346429d # str | The assetData value for the first asset in the pair. (optional)
asset_data_b = 0x0257179264389b814a946f3e92105513705ca6b990 # str | The assetData value for the second asset in the pair. (optional)
network_id = 42 # float | The id of the Ethereum network (optional) (default to 1)
page = 3 # float | The number of the page to request in the collection. (optional) (default to 1)
per_page = 10 # float | The number of records to return per page. (optional) (default to 100)

try:
    api_response = api_instance.get_asset_pairs(asset_data_a=asset_data_a, asset_data_b=asset_data_b, network_id=network_id, page=page, per_page=per_page)
    pprint(api_response)
except ApiException as e:
    print("Exception when calling DefaultApi->get_asset_pairs: %s\n" % e)
```

### Parameters

| Name             | Type      | Description                                           | Notes                      |
| ---------------- | --------- | ----------------------------------------------------- | -------------------------- |
| **asset_data_a** | **str**   | The assetData value for the first asset in the pair.  | [optional]                 |
| **asset_data_b** | **str**   | The assetData value for the second asset in the pair. | [optional]                 |
| **network_id**   | **float** | The id of the Ethereum network                        | [optional][default to 1]   |
| **page**         | **float** | The number of the page to request in the collection.  | [optional][default to 1]   |
| **per_page**     | **float** | The number of records to return per page.             | [optional][default to 100] |

### Return type

[**RelayerApiAssetDataPairsResponseSchema**](RelayerApiAssetDataPairsResponseSchema.md)

### Authorization

No authorization required

### HTTP request headers

-   **Content-Type**: Not defined
-   **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_fee_recipients**

> RelayerApiFeeRecipientsResponseSchema get_fee_recipients(network_id=network_id, page=page, per_page=per_page)

Retrieves a collection of all fee recipient addresses for a relayer. This endpoint should be [paginated](#section/Pagination).

### Example

```python
from __future__ import print_function
import time
import sra_client
from sra_client.rest import ApiException
from pprint import pprint

# create an instance of the API class
api_instance = sra_client.DefaultApi()
network_id = 42 # float | The id of the Ethereum network (optional) (default to 1)
page = 3 # float | The number of the page to request in the collection. (optional) (default to 1)
per_page = 10 # float | The number of records to return per page. (optional) (default to 100)

try:
    api_response = api_instance.get_fee_recipients(network_id=network_id, page=page, per_page=per_page)
    pprint(api_response)
except ApiException as e:
    print("Exception when calling DefaultApi->get_fee_recipients: %s\n" % e)
```

### Parameters

| Name           | Type      | Description                                          | Notes                      |
| -------------- | --------- | ---------------------------------------------------- | -------------------------- |
| **network_id** | **float** | The id of the Ethereum network                       | [optional][default to 1]   |
| **page**       | **float** | The number of the page to request in the collection. | [optional][default to 1]   |
| **per_page**   | **float** | The number of records to return per page.            | [optional][default to 100] |

### Return type

[**RelayerApiFeeRecipientsResponseSchema**](RelayerApiFeeRecipientsResponseSchema.md)

### Authorization

No authorization required

### HTTP request headers

-   **Content-Type**: Not defined
-   **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_order**

> RelayerApiOrderSchema get_order(order_hash, network_id=network_id)

Retrieves the 0x order with meta info that is associated with the hash.

### Example

```python
from __future__ import print_function
import time
import sra_client
from sra_client.rest import ApiException
from pprint import pprint

# create an instance of the API class
api_instance = sra_client.DefaultApi()
order_hash = 0xd4b103c42d2512eef3fee775e097f044291615d25f5d71e0ac70dbd49d223591 # str | The hash of the desired 0x order.
network_id = 42 # float | The id of the Ethereum network (optional) (default to 1)

try:
    api_response = api_instance.get_order(order_hash, network_id=network_id)
    pprint(api_response)
except ApiException as e:
    print("Exception when calling DefaultApi->get_order: %s\n" % e)
```

### Parameters

| Name           | Type      | Description                       | Notes                    |
| -------------- | --------- | --------------------------------- | ------------------------ |
| **order_hash** | **str**   | The hash of the desired 0x order. |
| **network_id** | **float** | The id of the Ethereum network    | [optional][default to 1] |

### Return type

[**RelayerApiOrderSchema**](RelayerApiOrderSchema.md)

### Authorization

No authorization required

### HTTP request headers

-   **Content-Type**: Not defined
-   **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_order_config**

> RelayerApiOrderConfigResponseSchema get_order_config(network_id=network_id, relayer_api_order_config_payload_schema=relayer_api_order_config_payload_schema)

Relayers have full discretion over the orders that they are willing to host on their orderbooks (e.g what fees they charge, etc...). In order for traders to discover their requirements programmatically, they can send an incomplete order to this endpoint and receive the missing fields, specifc to that order. This gives relayers a large amount of flexibility to tailor fees to unique traders, trading pairs and volume amounts. Submit a partial order and receive information required to complete the order: `senderAddress`, `feeRecipientAddress`, `makerFee`, `takerFee`.

### Example

```python
from __future__ import print_function
import time
import sra_client
from sra_client.rest import ApiException
from pprint import pprint

# create an instance of the API class
api_instance = sra_client.DefaultApi()
network_id = 42 # float | The id of the Ethereum network (optional) (default to 1)
relayer_api_order_config_payload_schema = {"makerAddress":"0x9e56625509c2f60af937f23b7b532600390e8c8b","takerAddress":"0xa2b31dacf30a9c50ca473337c01d8a201ae33e32","makerAssetAmount":"10000000000000000","takerAssetAmount":"1","makerAssetData":"0xf47261b0000000000000000000000000e41d2489571d322189246dafa5ebde1f4699f498","takerAssetData":"0x02571792000000000000000000000000371b13d97f4bf77d724e78c16b7dc74099f40e840000000000000000000000000000000000000000000000000000000000000063","exchangeAddress":"0x12459c951127e0c374ff9105dda097662a027093","expirationTimeSeconds":"1532560590"} # RelayerApiOrderConfigPayloadSchema | The fields of a 0x order the relayer may want to decide what configuration to send back. (optional)

try:
    api_response = api_instance.get_order_config(network_id=network_id, relayer_api_order_config_payload_schema=relayer_api_order_config_payload_schema)
    pprint(api_response)
except ApiException as e:
    print("Exception when calling DefaultApi->get_order_config: %s\n" % e)
```

### Parameters

| Name                                        | Type                                                                            | Description                                                                              | Notes                    |
| ------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------ |
| **network_id**                              | **float**                                                                       | The id of the Ethereum network                                                           | [optional][default to 1] |
| **relayer_api_order_config_payload_schema** | [**RelayerApiOrderConfigPayloadSchema**](RelayerApiOrderConfigPayloadSchema.md) | The fields of a 0x order the relayer may want to decide what configuration to send back. | [optional]               |

### Return type

[**RelayerApiOrderConfigResponseSchema**](RelayerApiOrderConfigResponseSchema.md)

### Authorization

No authorization required

### HTTP request headers

-   **Content-Type**: application/json
-   **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_orderbook**

> RelayerApiOrderbookResponseSchema get_orderbook(base_asset_data, quote_asset_data, network_id=network_id, page=page, per_page=per_page)

Retrieves the orderbook for a given asset pair. This endpoint should be [paginated](#section/Pagination). Bids will be sorted in descending order by price, and asks will be sorted in ascending order by price. Within the price sorted orders, the orders are further sorted by _taker fee price_ which is defined as the **takerFee** divided by **takerTokenAmount**. After _taker fee price_, orders are to be sorted by expiration in ascending order. The way pagination works for this endpoint is that the **page** and **perPage** query params apply to both `bids` and `asks` collections, and if `page` \* `perPage` > `total` for a certain collection, the `records` for that collection should just be empty.

### Example

```python
from __future__ import print_function
import time
import sra_client
from sra_client.rest import ApiException
from pprint import pprint

# create an instance of the API class
api_instance = sra_client.DefaultApi()
base_asset_data = 0xf47261b04c32345ced77393b3530b1eed0f346429d # str | assetData (makerAssetData or takerAssetData) designated as the base currency in the [currency pair calculation](https://en.wikipedia.org/wiki/Currency_pair) of price.
quote_asset_data = 0xf47261b04c32345ced77393b3530b1eed0f346429d # str | assetData (makerAssetData or takerAssetData) designated as the quote currency in the currency pair calculation of price (required).
network_id = 42 # float | The id of the Ethereum network (optional) (default to 1)
page = 3 # float | The number of the page to request in the collection. (optional) (default to 1)
per_page = 10 # float | The number of records to return per page. (optional) (default to 100)

try:
    api_response = api_instance.get_orderbook(base_asset_data, quote_asset_data, network_id=network_id, page=page, per_page=per_page)
    pprint(api_response)
except ApiException as e:
    print("Exception when calling DefaultApi->get_orderbook: %s\n" % e)
```

### Parameters

| Name                 | Type      | Description                                                                                                                                                            | Notes                      |
| -------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| **base_asset_data**  | **str**   | assetData (makerAssetData or takerAssetData) designated as the base currency in the [currency pair calculation](https://en.wikipedia.org/wiki/Currency_pair) of price. |
| **quote_asset_data** | **str**   | assetData (makerAssetData or takerAssetData) designated as the quote currency in the currency pair calculation of price (required).                                    |
| **network_id**       | **float** | The id of the Ethereum network                                                                                                                                         | [optional][default to 1]   |
| **page**             | **float** | The number of the page to request in the collection.                                                                                                                   | [optional][default to 1]   |
| **per_page**         | **float** | The number of records to return per page.                                                                                                                              | [optional][default to 100] |

### Return type

[**RelayerApiOrderbookResponseSchema**](RelayerApiOrderbookResponseSchema.md)

### Authorization

No authorization required

### HTTP request headers

-   **Content-Type**: Not defined
-   **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_orders**

> RelayerApiOrdersResponseSchema get_orders(maker_asset_proxy_id=maker_asset_proxy_id, taker_asset_proxy_id=taker_asset_proxy_id, maker_asset_address=maker_asset_address, taker_asset_address=taker_asset_address, exchange_address=exchange_address, sender_address=sender_address, maker_asset_data=maker_asset_data, taker_asset_data=taker_asset_data, trader_asset_data=trader_asset_data, maker_address=maker_address, taker_address=taker_address, trader_address=trader_address, fee_recipient_address=fee_recipient_address, network_id=network_id, page=page, per_page=per_page)

Retrieves a list of orders given query parameters. This endpoint should be [paginated](#section/Pagination). For querying an entire orderbook snapshot, the [orderbook endpoint](#operation/getOrderbook) is recommended. If both makerAssetData and takerAssetData are specified, returned orders will be sorted by price determined by (takerTokenAmount/makerTokenAmount) in ascending order. By default, orders returned by this endpoint are unsorted.

### Example

```python
from __future__ import print_function
import time
import sra_client
from sra_client.rest import ApiException
from pprint import pprint

# create an instance of the API class
api_instance = sra_client.DefaultApi()
maker_asset_proxy_id = 0xf47261b0 # str | The maker [asset proxy id](https://0x.org/docs/tools/0x.js#types-AssetProxyId) (example: \"0xf47261b0\" for ERC20, \"0x02571792\" for ERC721). (optional)
taker_asset_proxy_id = 0x02571792 # str | The taker asset [asset proxy id](https://0x.org/docs/tools/0x.js#types-AssetProxyId) (example: \"0xf47261b0\" for ERC20, \"0x02571792\" for ERC721). (optional)
maker_asset_address = 0xe41d2489571d322189246dafa5ebde1f4699f498 # str | The contract address for the maker asset. (optional)
taker_asset_address = 0xe41d2489571d322189246dafa5ebde1f4699f498 # str | The contract address for the taker asset. (optional)
exchange_address = 0xe41d2489571d322189246dafa5ebde1f4699f498 # str | Same as exchangeAddress in the [0x Protocol v2 Specification](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#order-message-format) (optional)
sender_address = 0xe41d2489571d322189246dafa5ebde1f4699f498 # str | Same as senderAddress in the [0x Protocol v2 Specification](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#order-message-format) (optional)
maker_asset_data = 0xe41d2489571d322189246dafa5ebde1f4699f498 # str | Same as makerAssetData in the [0x Protocol v2 Specification](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#order-message-format) (optional)
taker_asset_data = 0xe41d2489571d322189246dafa5ebde1f4699f498 # str | Same as takerAssetData in the [0x Protocol v2 Specification](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#order-message-format) (optional)
trader_asset_data = 0xe41d2489571d322189246dafa5ebde1f4699f498 # str | Same as traderAssetData in the [0x Protocol v2 Specification](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#order-message-format) (optional)
maker_address = 0xe41d2489571d322189246dafa5ebde1f4699f498 # str | Same as makerAddress in the [0x Protocol v2 Specification](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#order-message-format) (optional)
taker_address = 0xe41d2489571d322189246dafa5ebde1f4699f498 # str | Same as takerAddress in the [0x Protocol v2 Specification](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#order-message-format) (optional)
trader_address = 0xe41d2489571d322189246dafa5ebde1f4699f498 # str | Same as traderAddress in the [0x Protocol v2 Specification](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#order-message-format) (optional)
fee_recipient_address = 0xe41d2489571d322189246dafa5ebde1f4699f498 # str | Same as feeRecipientAddress in the [0x Protocol v2 Specification](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#order-message-format) (optional)
network_id = 42 # float | The id of the Ethereum network (optional) (default to 1)
page = 3 # float | The number of the page to request in the collection. (optional) (default to 1)
per_page = 10 # float | The number of records to return per page. (optional) (default to 100)

try:
    api_response = api_instance.get_orders(maker_asset_proxy_id=maker_asset_proxy_id, taker_asset_proxy_id=taker_asset_proxy_id, maker_asset_address=maker_asset_address, taker_asset_address=taker_asset_address, exchange_address=exchange_address, sender_address=sender_address, maker_asset_data=maker_asset_data, taker_asset_data=taker_asset_data, trader_asset_data=trader_asset_data, maker_address=maker_address, taker_address=taker_address, trader_address=trader_address, fee_recipient_address=fee_recipient_address, network_id=network_id, page=page, per_page=per_page)
    pprint(api_response)
except ApiException as e:
    print("Exception when calling DefaultApi->get_orders: %s\n" % e)
```

### Parameters

| Name                      | Type      | Description                                                                                                                                                                       | Notes                      |
| ------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| **maker_asset_proxy_id**  | **str**   | The maker [asset proxy id](https://0x.org/docs/tools/0x.js#types-AssetProxyId) (example: \&quot;0xf47261b0\&quot; for ERC20, \&quot;0x02571792\&quot; for ERC721).                | [optional]                 |
| **taker_asset_proxy_id**  | **str**   | The taker asset [asset proxy id](https://0x.org/docs/tools/0x.js#types-AssetProxyId) (example: \&quot;0xf47261b0\&quot; for ERC20, \&quot;0x02571792\&quot; for ERC721).          | [optional]                 |
| **maker_asset_address**   | **str**   | The contract address for the maker asset.                                                                                                                                         | [optional]                 |
| **taker_asset_address**   | **str**   | The contract address for the taker asset.                                                                                                                                         | [optional]                 |
| **exchange_address**      | **str**   | Same as exchangeAddress in the [0x Protocol v2 Specification](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#order-message-format)     | [optional]                 |
| **sender_address**        | **str**   | Same as senderAddress in the [0x Protocol v2 Specification](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#order-message-format)       | [optional]                 |
| **maker_asset_data**      | **str**   | Same as makerAssetData in the [0x Protocol v2 Specification](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#order-message-format)      | [optional]                 |
| **taker_asset_data**      | **str**   | Same as takerAssetData in the [0x Protocol v2 Specification](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#order-message-format)      | [optional]                 |
| **trader_asset_data**     | **str**   | Same as traderAssetData in the [0x Protocol v2 Specification](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#order-message-format)     | [optional]                 |
| **maker_address**         | **str**   | Same as makerAddress in the [0x Protocol v2 Specification](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#order-message-format)        | [optional]                 |
| **taker_address**         | **str**   | Same as takerAddress in the [0x Protocol v2 Specification](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#order-message-format)        | [optional]                 |
| **trader_address**        | **str**   | Same as traderAddress in the [0x Protocol v2 Specification](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#order-message-format)       | [optional]                 |
| **fee_recipient_address** | **str**   | Same as feeRecipientAddress in the [0x Protocol v2 Specification](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#order-message-format) | [optional]                 |
| **network_id**            | **float** | The id of the Ethereum network                                                                                                                                                    | [optional][default to 1]   |
| **page**                  | **float** | The number of the page to request in the collection.                                                                                                                              | [optional][default to 1]   |
| **per_page**              | **float** | The number of records to return per page.                                                                                                                                         | [optional][default to 100] |

### Return type

[**RelayerApiOrdersResponseSchema**](RelayerApiOrdersResponseSchema.md)

### Authorization

No authorization required

### HTTP request headers

-   **Content-Type**: Not defined
-   **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **post_order**

> post_order(network_id=network_id, signed_order_schema=signed_order_schema)

Submit a signed order to the relayer.

### Example

```python
from __future__ import print_function
import time
import sra_client
from sra_client.rest import ApiException
from pprint import pprint

# create an instance of the API class
api_instance = sra_client.DefaultApi()
network_id = 42 # float | The id of the Ethereum network (optional) (default to 1)
signed_order_schema = {"makerAddress":"0x9e56625509c2f60af937f23b7b532600390e8c8b","takerAddress":"0xa2b31dacf30a9c50ca473337c01d8a201ae33e32","feeRecipientAddress":"0xb046140686d052fff581f63f8136cce132e857da","senderAddress":"0xa2b31dacf30a9c50ca473337c01d8a201ae33e32","makerAssetAmount":"10000000000000000","takerAssetAmount":"20000000000000000","makerFee":"100000000000000","takerFee":"200000000000000","expirationTimeSeconds":"1532560590","salt":"1532559225","makerAssetData":"0xf47261b0000000000000000000000000e41d2489571d322189246dafa5ebde1f4699f498","takerAssetData":"0x02571792000000000000000000000000371b13d97f4bf77d724e78c16b7dc74099f40e840000000000000000000000000000000000000000000000000000000000000063","exchangeAddress":"0x12459c951127e0c374ff9105dda097662a027093","signature":"0x012761a3ed31b43c8780e905a260a35faefcc527be7516aa11c0256729b5b351bc33"} # SignedOrderSchema | A valid signed 0x order based on the schema. (optional)

try:
    api_instance.post_order(network_id=network_id, signed_order_schema=signed_order_schema)
except ApiException as e:
    print("Exception when calling DefaultApi->post_order: %s\n" % e)
```

### Parameters

| Name                    | Type                                          | Description                                  | Notes                    |
| ----------------------- | --------------------------------------------- | -------------------------------------------- | ------------------------ |
| **network_id**          | **float**                                     | The id of the Ethereum network               | [optional][default to 1] |
| **signed_order_schema** | [**SignedOrderSchema**](SignedOrderSchema.md) | A valid signed 0x order based on the schema. | [optional]               |

### Return type

void (empty response body)

### Authorization

No authorization required

### HTTP request headers

-   **Content-Type**: application/json
-   **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)
