# 0x-sra-client

A Python client for interacting with servers conforming to [the Standard Relayer API specification](https://github.com/0xProject/0x-monorepo/tree/development/packages/sra-spec).

Read the [documentation](http://0x-sra-client-py.s3-website-us-east-1.amazonaws.com/)

# Schemas

The [JSON schemas](http://json-schema.org/) for the API payloads and responses can be found in [@0xproject/json-schemas](https://github.com/0xProject/0x-monorepo/tree/development/packages/json-schemas). Examples of each payload and response can be found in the 0x.js library's [test suite](https://github.com/0xProject/0x-monorepo/blob/development/packages/json-schemas/test/schema_test.ts#L1).

```bash
pip install 0x-json-schemas
```

You can easily validate your API's payloads and responses using the [0x-json-schemas](https://github.com/0xProject/0x.js/tree/development/python-packages/json_schemas) package:

```python
from zero_ex.json_schemas import assert_valid
from zero_ex.order_utils import Order

order: Order = {
    'makerAddress': "0x0000000000000000000000000000000000000000",
    'takerAddress': "0x0000000000000000000000000000000000000000",
    'feeRecipientAddress': "0x0000000000000000000000000000000000000000",
    'senderAddress': "0x0000000000000000000000000000000000000000",
    'makerAssetAmount': "1000000000000000000",
    'takerAssetAmount': "1000000000000000000",
    'makerFee': "0",
    'takerFee': "0",
    'expirationTimeSeconds': "12345",
    'salt': "12345",
    'makerAssetData': "0x0000000000000000000000000000000000000000",
    'takerAssetData': "0x0000000000000000000000000000000000000000",
    'exchangeAddress': "0x0000000000000000000000000000000000000000",
}

assert_valid(order, "/orderSchema")
```

# Pagination

Requests that return potentially large collections should respond to the **?page** and **?perPage** parameters. For example:

```bash
$ curl https://api.example-relayer.com/v2/asset_pairs?page=3&perPage=20
```

Page numbering should be 1-indexed, not 0-indexed. If a query provides an unreasonable (ie. too high) `perPage` value, the response can return a validation error as specified in the [errors section](#section/Errors). If the query specifies a `page` that does not exist (ie. there are not enough `records`), the response should just return an empty `records` array.

All endpoints that are paginated should return a `total`, `page`, `perPage` and a `records` value in the top level of the collection. The value of `total` should be the total number of records for a given query, whereas `records` should be an array representing the response to the query for that page. `page` and `perPage`, are the same values that were specified in the request. See the note in [miscellaneous](#section/Misc.) about formatting `snake_case` vs. `lowerCamelCase`.

These requests include the [`/v2/asset_pairs`](#operation/getAssetPairs), [`/v2/orders`](#operation/getOrders), [`/v2/fee_recipients`](#operation/getFeeRecipients) and [`/v2/orderbook`](#operation/getOrderbook) endpoints.

# Network Id

All requests should be able to specify a **?networkId** query param for all supported networks. For example:

```bash
$ curl https://api.example-relayer.com/v2/asset_pairs?networkId=1
```

If the query param is not provided, it should default to **1** (mainnet).

Networks and their Ids:

| Network Id | Network Name |
| ---------- | ------------ |
| 1          | Mainnet      |
| 42         | Kovan        |
| 3          | Ropsten      |
| 4          | Rinkeby      |

If a certain network is not supported, the response should **400** as specified in the [error response](#section/Errors) section. For example:

```json
{
    \"code\": 100,
    \"reason\": \"Validation failed\",
    \"validationErrors\": [
        {
            \"field\": \"networkId\",
            \"code\": 1006,
            \"reason\": \"Network id 42 is not supported\"
        }
    ]
}
```

# Link Header

A [Link Header](https://tools.ietf.org/html/rfc5988) can be included in a response to provide clients with more context about paging
For example:

```bash
Link: <https://api.example-relayer.com/v2/asset_pairs?page=3&perPage=20>; rel=\"next\",
<https://api.github.com/user/repos?page=10&perPage=20>; rel=\"last\"
```

This `Link` response header contains one or more Hypermedia link relations.

The possible `rel` values are:

| Name  | Description                                                   |
| ----- | ------------------------------------------------------------- |
| next  | The link relation for the immediate next page of results.     |
| last  | The link relation for the last page of results.               |
| first | The link relation for the first page of results.              |
| prev  | The link relation for the immediate previous page of results. |

# Rate Limits

Rate limit guidance for clients can be optionally returned in the response headers:

| Header Name           | Description                                                                  |
| --------------------- | ---------------------------------------------------------------------------- |
| X-RateLimit-Limit     | The maximum number of requests you're permitted to make per hour.            |
| X-RateLimit-Remaining | The number of requests remaining in the current rate limit window.           |
| X-RateLimit-Reset     | The time at which the current rate limit window resets in UTC epoch seconds. |

For example:

```bash
$ curl -i https://api.example-relayer.com/v2/asset_pairs
HTTP/1.1 200 OK
Date: Mon, 20 Oct 2017 12:30:06 GMT
Status: 200 OK
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 56
X-RateLimit-Reset: 1372700873
```

When a rate limit is exceeded, a status of **429 Too Many Requests** should be returned.

# Errors

Unless the spec defines otherwise, errors to bad requests should respond with HTTP 4xx or status codes.

## Common error codes

| Code | Reason                                  |
| ---- | --------------------------------------- |
| 400  | Bad Request – Invalid request format    |
| 404  | Not found                               |
| 429  | Too many requests - Rate limit exceeded |
| 500  | Internal Server Error                   |
| 501  | Not Implemented                         |

## Error reporting format

For all **400** responses, see the [error response schema](https://github.com/0xProject/0x-monorepo/blob/development/packages/json-schemas/schemas/relayer_api_error_response_schema.ts#L1).

```json
{
    \"code\": 101,
    \"reason\": \"Validation failed\",
    \"validationErrors\": [
        {
            \"field\": \"maker\",
            \"code\": 1002,
            \"reason\": \"Invalid address\"
        }
    ]
}
```

General error codes:

```bash
100 - Validation Failed
101 - Malformed JSON
102 - Order submission disabled
103 - Throttled
```

Validation error codes:

```bash
1000 - Required field
1001 - Incorrect format
1002 - Invalid address
1003 - Address not supported
1004 - Value out of range
1005 - Invalid signature or hash
1006 - Unsupported option
```

# Asset Data Encoding

As we now support multiple [token transfer proxies](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#assetproxy), the identifier of which proxy to use for the token transfer must be encoded, along with the token information. Each proxy in 0x v2 has a unique identifier. If you're using 0x.js there will be helper methods for this [encoding](https://0xproject.com/docs/0x.js#zeroEx-encodeERC20AssetData) and [decoding](https://0xproject.com/docs/0x.js#zeroEx-decodeAssetProxyId).

The identifier for the Proxy uses a similar scheme to [ABI function selectors](https://github.com/ethereum/wiki/wiki/Ethereum-Contract-ABI#function-selector).

```js
// ERC20 Proxy ID  0xf47261b0
bytes4(keccak256('ERC20Token(address)'));
// ERC721 Proxy ID 0x02571792
bytes4(keccak256('ERC721Token(address,uint256)'));
```

Asset data is encoded using [ABI encoding](https://solidity.readthedocs.io/en/develop/abi-spec.html).

For example, encoding the ERC20 token contract (address: 0x1dc4c1cefef38a777b15aa20260a54e584b16c48) using the ERC20 Transfer Proxy (id: 0xf47261b0) would be:

```bash
0xf47261b00000000000000000000000001dc4c1cefef38a777b15aa20260a54e584b16c48
```

Encoding the ERC721 token contract (address: `0x371b13d97f4bf77d724e78c16b7dc74099f40e84`), token id (id: `99`, which hex encoded is `0x63`) and the ERC721 Transfer Proxy (id: 0x02571792) would be:

```bash
0x02571792000000000000000000000000371b13d97f4bf77d724e78c16b7dc74099f40e840000000000000000000000000000000000000000000000000000000000000063
```

For more information see [the Asset Proxy](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#erc20proxy) section of the v2 spec and the [Ethereum ABI Spec](https://solidity.readthedocs.io/en/develop/abi-spec.html).

# Meta Data in Order Responses

In v2 of the standard relayer API we added the `metaData` field. It is meant to provide a standard place for relayers to put optional, custom or non-standard fields that may of interest to the consumer of the API.

A good example of such a field is `remainingTakerAssetAmount`, which is a convenience field that communicates how much of a 0x order is potentially left to be filled. Unlike the other fields in a 0x order, it is not guaranteed to be correct as it is derived from whatever mechanism the implementer (ie. the relayer) is using. While convenient for prototyping and low stakes situations, we recommend validating the value of the field by checking the state of the blockchain yourself.

# Misc.

-   All requests and responses should be of **application/json** content type
-   All token amounts are sent in amounts of the smallest level of precision (base units). (e.g if a token has 18 decimal places, selling 1 token would show up as selling `'1000000000000000000'` units by this API).
-   All addresses are sent as lower-case (non-checksummed) Ethereum addresses with the `0x` prefix.
-   All parameters are to be written in `lowerCamelCase`.

This Python package is automatically generated by the [OpenAPI Generator](https://openapi-generator.tech) project:

-   API version: 2.0.0
-   Package version: 1.0.0
-   Build package: org.openapitools.codegen.languages.PythonClientCodegen

## Requirements.

Python 2.7 and 3.4+

## Installation & Usage

### pip install

If the python package is hosted on Github, you can install directly from Github

```sh
pip install git+https://github.com/GIT_USER_ID/GIT_REPO_ID.git
```

(you may need to run `pip` with root permission: `sudo pip install git+https://github.com/GIT_USER_ID/GIT_REPO_ID.git`)

Then import the package:

```python
import sra_client
```

### Setuptools

Install via [Setuptools](http://pypi.python.org/pypi/setuptools).

```sh
python setup.py install --user
```

(or `sudo python setup.py install` to install the package for all users)

Then import the package:

```python
import sra_client
```

## Getting Started

Please follow the [installation procedure](#installation--usage) and then run the following:

```python
from __future__ import print_function
import time
import sra_client
from sra_client.rest import ApiException
from pprint import pprint

# create an instance of the API class
api_instance = sra_client.DefaultApi(sra_client.ApiClient(configuration))
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

## Contributing

We welcome improvements and fixes from the wider community! To report bugs within this package, please create an issue in this repository.

Please read our [contribution guidelines](../../CONTRIBUTING.md) before getting started.

### Install Code and Dependencies

Ensure that you have installed Python >=3.6, Docker, and docker-compose. Then:

```bash
pip install -e .[dev]
```

### Test

Tests depend on a running instance of 0x-launch-kit-backend, backed by a Ganache node with the 0x contracts deployed in it. For convenience, a docker-compose file is provided that creates this environment. And a shortcut is provided to interface with that file: `./setup.py start_test_relayer` will start those services. With them running, the tests can be run with `./setup.py test`. When you're done with testing, you can `./setup.py stop_test_relayer`.

### Clean

`./setup.py clean --all`

### Lint

`./setup.py lint`

### Build Documentation

`./setup.py build_sphinx`

### More

See `./setup.py --help-commands` for more info.

## Documentation for API Endpoints

All URIs are relative to _http://localhost_

| Class        | Method                                                          | HTTP request                  | Description |
| ------------ | --------------------------------------------------------------- | ----------------------------- | ----------- |
| _DefaultApi_ | [**get_asset_pairs**](docs/DefaultApi.md#get_asset_pairs)       | **GET** /v2/asset_pairs       |
| _DefaultApi_ | [**get_fee_recipients**](docs/DefaultApi.md#get_fee_recipients) | **GET** /v2/fee_recipients    |
| _DefaultApi_ | [**get_order**](docs/DefaultApi.md#get_order)                   | **GET** /v2/order/{orderHash} |
| _DefaultApi_ | [**get_order_config**](docs/DefaultApi.md#get_order_config)     | **POST** /v2/order_config     |
| _DefaultApi_ | [**get_orderbook**](docs/DefaultApi.md#get_orderbook)           | **GET** /v2/orderbook         |
| _DefaultApi_ | [**get_orders**](docs/DefaultApi.md#get_orders)                 | **GET** /v2/orders            |
| _DefaultApi_ | [**post_order**](docs/DefaultApi.md#post_order)                 | **POST** /v2/order            |

## Documentation For Models

-   [OrderSchema](docs/OrderSchema.md)
-   [PaginatedCollectionSchema](docs/PaginatedCollectionSchema.md)
-   [RelayerApiAssetDataPairsResponseSchema](docs/RelayerApiAssetDataPairsResponseSchema.md)
-   [RelayerApiAssetDataTradeInfoSchema](docs/RelayerApiAssetDataTradeInfoSchema.md)
-   [RelayerApiErrorResponseSchema](docs/RelayerApiErrorResponseSchema.md)
-   [RelayerApiErrorResponseSchemaValidationErrors](docs/RelayerApiErrorResponseSchemaValidationErrors.md)
-   [RelayerApiFeeRecipientsResponseSchema](docs/RelayerApiFeeRecipientsResponseSchema.md)
-   [RelayerApiOrderConfigPayloadSchema](docs/RelayerApiOrderConfigPayloadSchema.md)
-   [RelayerApiOrderConfigResponseSchema](docs/RelayerApiOrderConfigResponseSchema.md)
-   [RelayerApiOrderSchema](docs/RelayerApiOrderSchema.md)
-   [RelayerApiOrderbookResponseSchema](docs/RelayerApiOrderbookResponseSchema.md)
-   [RelayerApiOrdersChannelSubscribePayloadSchema](docs/RelayerApiOrdersChannelSubscribePayloadSchema.md)
-   [RelayerApiOrdersChannelSubscribeSchema](docs/RelayerApiOrdersChannelSubscribeSchema.md)
-   [RelayerApiOrdersChannelUpdateSchema](docs/RelayerApiOrdersChannelUpdateSchema.md)
-   [RelayerApiOrdersResponseSchema](docs/RelayerApiOrdersResponseSchema.md)
-   [SignedOrderSchema](docs/SignedOrderSchema.md)

## Documentation For Authorization

All endpoints do not require authorization.
