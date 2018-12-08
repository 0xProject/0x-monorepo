# coding: utf-8

"""
    Standard Relayer REST API

    # Schemas  The [JSON schemas](http://json-schema.org/) for the API payloads and responses can be found in [@0xproject/json-schemas](https://github.com/0xProject/0x.js/tree/development/packages/json-schemas). Examples of each payload and response can be found in the library's [test suite](https://github.com/0xProject/0x.js/blob/development/packages/json-schemas/test/schema_test.ts#L1).  ```bash npm install @0xproject/json-schemas --save ```  You can easily validate your API's payloads and responses using the [@0xproject/json-schemas](https://github.com/0xProject/0x.js/tree/development/packages/json-schemas) package:  ```js import {SchemaValidator, ValidatorResult, schemas} from '@0xproject/json-schemas';  const {relayerApiTokenPairsResponseSchema} = schemas; const validator = new SchemaValidator();  const tokenPairsResponse = {     ... }; const validatorResult: ValidatorResult = validator.validate(tokenPairsResponse, relayerApiTokenPairsResponseSchema); ```  # Pagination  Requests that return potentially large collections should respond to the **?page** and **?perPage** parameters. For example:  ```bash $ curl https://api.example-relayer.com/v2/asset_pairs?page=3&perPage=20 ```  Page numbering should be 1-indexed, not 0-indexed. If a query provides an unreasonable (ie. too high) `perPage` value, the response can return a validation error as specified in the [errors section](#section/Errors). If the query specifies a `page` that does not exist (ie. there are not enough `records`), the response should just return an empty `records` array.  All endpoints that are paginated should return a `total`, `page`, `perPage` and a `records` value in the top level of the collection. The value of `total` should be the total number of records for a given query, whereas `records` should be an array representing the response to the query for that page. `page` and `perPage`, are the same values that were specified in the request. See the note in [miscellaneous](#section/Misc.) about formatting `snake_case` vs. `lowerCamelCase`.  These requests include the [`/v2/asset_pairs`](#operation/getAssetPairs), [`/v2/orders`](#operation/getOrders), [`/v2/fee_recipients`](#operation/getFeeRecipients) and [`/v2/orderbook`](#operation/getOrderbook) endpoints.  # Network Id  All requests should be able to specify a **?networkId** query param for all supported networks. For example:  ```bash $ curl https://api.example-relayer.com/v2/asset_pairs?networkId=1 ```  If the query param is not provided, it should default to **1** (mainnet).  Networks and their Ids:  | Network Id | Network Name | | ---------- | ------------ | | 1          | Mainnet      | | 42         | Kovan        | | 3          | Ropsten      | | 4          | Rinkeby      |  If a certain network is not supported, the response should **400** as specified in the [error response](#section/Errors) section. For example:  ```json {     \"code\": 100,     \"reason\": \"Validation failed\",     \"validationErrors\": [         {             \"field\": \"networkId\",             \"code\": 1006,             \"reason\": \"Network id 42 is not supported\"         }     ] } ```  # Link Header  A [Link Header](https://tools.ietf.org/html/rfc5988) can be included in a response to provide clients with more context about paging For example:  ```bash Link: <https://api.example-relayer.com/v2/asset_pairs?page=3&perPage=20>; rel=\"next\", <https://api.github.com/user/repos?page=10&perPage=20>; rel=\"last\" ```  This `Link` response header contains one or more Hypermedia link relations.  The possible `rel` values are:  | Name  | Description                                                   | | ----- | ------------------------------------------------------------- | | next  | The link relation for the immediate next page of results.     | | last  | The link relation for the last page of results.               | | first | The link relation for the first page of results.              | | prev  | The link relation for the immediate previous page of results. |  # Rate Limits  Rate limit guidance for clients can be optionally returned in the response headers:  | Header Name           | Description                                                                  | | --------------------- | ---------------------------------------------------------------------------- | | X-RateLimit-Limit     | The maximum number of requests you're permitted to make per hour.            | | X-RateLimit-Remaining | The number of requests remaining in the current rate limit window.           | | X-RateLimit-Reset     | The time at which the current rate limit window resets in UTC epoch seconds. |  For example:  ```bash $ curl -i https://api.example-relayer.com/v2/asset_pairs HTTP/1.1 200 OK Date: Mon, 20 Oct 2017 12:30:06 GMT Status: 200 OK X-RateLimit-Limit: 60 X-RateLimit-Remaining: 56 X-RateLimit-Reset: 1372700873 ```  When a rate limit is exceeded, a status of **429 Too Many Requests** should be returned.  # Errors  Unless the spec defines otherwise, errors to bad requests should respond with HTTP 4xx or status codes.  ## Common error codes  | Code | Reason                                  | | ---- | --------------------------------------- | | 400  | Bad Request – Invalid request format    | | 404  | Not found                               | | 429  | Too many requests - Rate limit exceeded | | 500  | Internal Server Error                   | | 501  | Not Implemented                         |  ## Error reporting format  For all **400** responses, see the [error response schema](https://github.com/0xProject/0x-monorepo/blob/development/packages/json-schemas/schemas/relayer_api_error_response_schema.ts#L1).  ```json {     \"code\": 101,     \"reason\": \"Validation failed\",     \"validationErrors\": [         {             \"field\": \"maker\",             \"code\": 1002,             \"reason\": \"Invalid address\"         }     ] } ```  General error codes:  ```bash 100 - Validation Failed 101 - Malformed JSON 102 - Order submission disabled 103 - Throttled ```  Validation error codes:  ```bash 1000 - Required field 1001 - Incorrect format 1002 - Invalid address 1003 - Address not supported 1004 - Value out of range 1005 - Invalid signature or hash 1006 - Unsupported option ```  # Asset Data Encoding  As we now support multiple [token transfer proxies](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#assetproxy), the identifier of which proxy to use for the token transfer must be encoded, along with the token information. Each proxy in 0x v2 has a unique identifier. If you're using 0x.js there will be helper methods for this [encoding](https://0xproject.com/docs/0x.js#zeroEx-encodeERC20AssetData) and [decoding](https://0xproject.com/docs/0x.js#zeroEx-decodeAssetProxyId).  The identifier for the Proxy uses a similar scheme to [ABI function selectors](https://github.com/ethereum/wiki/wiki/Ethereum-Contract-ABI#function-selector).  ```js // ERC20 Proxy ID  0xf47261b0 bytes4(keccak256('ERC20Token(address)')); // ERC721 Proxy ID 0x02571792 bytes4(keccak256('ERC721Token(address,uint256)')); ```  Asset data is encoded using [ABI encoding](https://solidity.readthedocs.io/en/develop/abi-spec.html).  For example, encoding the ERC20 token contract (address: 0x1dc4c1cefef38a777b15aa20260a54e584b16c48) using the ERC20 Transfer Proxy (id: 0xf47261b0) would be:  ```bash 0xf47261b00000000000000000000000001dc4c1cefef38a777b15aa20260a54e584b16c48 ```  Encoding the ERC721 token contract (address: `0x371b13d97f4bf77d724e78c16b7dc74099f40e84`), token id (id: `99`, which hex encoded is `0x63`) and the ERC721 Transfer Proxy (id: 0x02571792) would be:  ```bash 0x02571792000000000000000000000000371b13d97f4bf77d724e78c16b7dc74099f40e840000000000000000000000000000000000000000000000000000000000000063 ```  For more information see [the Asset Proxy](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#erc20proxy) section of the v2 spec and the [Ethereum ABI Spec](https://solidity.readthedocs.io/en/develop/abi-spec.html).  # Meta Data in Order Responses  In v2 of the standard relayer API we added the `metaData` field. It is meant to provide a standard place for relayers to put optional, custom or non-standard fields that may of interest to the consumer of the API.  A good example of such a field is `remainingTakerAssetAmount`, which is a convenience field that communicates how much of a 0x order is potentially left to be filled. Unlike the other fields in a 0x order, it is not guaranteed to be correct as it is derived from whatever mechanism the implementer (ie. the relayer) is using. While convenient for prototyping and low stakes situations, we recommend validating the value of the field by checking the state of the blockchain yourself, such as by using [Order Watcher](https://0xproject.com/wiki#0x-OrderWatcher).  # Misc.  *   All requests and responses should be of **application/json** content type *   All token amounts are sent in amounts of the smallest level of precision (base units). (e.g if a token has 18 decimal places, selling 1 token would show up as selling `'1000000000000000000'` units by this API). *   All addresses are sent as lower-case (non-checksummed) Ethereum addresses with the `0x` prefix. *   All parameters are to be written in `lowerCamelCase`.   # noqa: E501

    OpenAPI spec version: 2.0.0
    Generated by: https://openapi-generator.tech
"""


from __future__ import absolute_import

import re  # noqa: F401

# python 2 and python 3 compatibility library
import six

from sra_client.api_client import ApiClient


class DefaultApi(object):
    """NOTE: This class is auto generated by OpenAPI Generator
    Ref: https://openapi-generator.tech

    Do not edit the class manually.
    """

    def __init__(self, api_client=None):
        if api_client is None:
            api_client = ApiClient()
        self.api_client = api_client

    def get_asset_pairs(self, **kwargs):  # noqa: E501
        """get_asset_pairs  # noqa: E501

        Retrieves a list of available asset pairs and the information required to trade them (in any order). Setting only `assetDataA` or `assetDataB` returns pairs filtered by that asset only.  # noqa: E501
        This method makes a synchronous HTTP request by default. To make an
        asynchronous HTTP request, please pass async_req=True
        >>> thread = api.get_asset_pairs(async_req=True)
        >>> result = thread.get()

        :param async_req bool
        :param str asset_data_a: The assetData value for the first asset in the pair.
        :param str asset_data_b: The assetData value for the second asset in the pair.
        :param float network_id: The id of the Ethereum network
        :param float page: The number of the page to request in the collection.
        :param float per_page: The number of records to return per page.
        :return: RelayerApiAssetDataPairsResponseSchema
                 If the method is called asynchronously,
                 returns the request thread.
        """
        kwargs["_return_http_data_only"] = True
        if kwargs.get("async_req"):
            return self.get_asset_pairs_with_http_info(**kwargs)  # noqa: E501
        else:
            (data) = self.get_asset_pairs_with_http_info(
                **kwargs
            )  # noqa: E501
            return data

    def get_asset_pairs_with_http_info(self, **kwargs):  # noqa: E501
        """get_asset_pairs  # noqa: E501

        Retrieves a list of available asset pairs and the information required to trade them (in any order). Setting only `assetDataA` or `assetDataB` returns pairs filtered by that asset only.  # noqa: E501
        This method makes a synchronous HTTP request by default. To make an
        asynchronous HTTP request, please pass async_req=True
        >>> thread = api.get_asset_pairs_with_http_info(async_req=True)
        >>> result = thread.get()

        :param async_req bool
        :param str asset_data_a: The assetData value for the first asset in the pair.
        :param str asset_data_b: The assetData value for the second asset in the pair.
        :param float network_id: The id of the Ethereum network
        :param float page: The number of the page to request in the collection.
        :param float per_page: The number of records to return per page.
        :return: RelayerApiAssetDataPairsResponseSchema
                 If the method is called asynchronously,
                 returns the request thread.
        """

        local_var_params = locals()

        all_params = [
            "asset_data_a",
            "asset_data_b",
            "network_id",
            "page",
            "per_page",
        ]  # noqa: E501
        all_params.append("async_req")
        all_params.append("_return_http_data_only")
        all_params.append("_preload_content")
        all_params.append("_request_timeout")

        for key, val in six.iteritems(local_var_params["kwargs"]):
            if key not in all_params:
                raise TypeError(
                    "Got an unexpected keyword argument '%s'"
                    " to method get_asset_pairs" % key
                )
            local_var_params[key] = val
        del local_var_params["kwargs"]

        collection_formats = {}

        path_params = {}

        query_params = []
        if "asset_data_a" in local_var_params:
            query_params.append(
                ("assetDataA", local_var_params["asset_data_a"])
            )  # noqa: E501
        if "asset_data_b" in local_var_params:
            query_params.append(
                ("assetDataB", local_var_params["asset_data_b"])
            )  # noqa: E501
        if "network_id" in local_var_params:
            query_params.append(
                ("networkId", local_var_params["network_id"])
            )  # noqa: E501
        if "page" in local_var_params:
            query_params.append(
                ("page", local_var_params["page"])
            )  # noqa: E501
        if "per_page" in local_var_params:
            query_params.append(
                ("perPage", local_var_params["per_page"])
            )  # noqa: E501

        header_params = {}

        form_params = []
        local_var_files = {}

        body_params = None
        # HTTP header `Accept`
        header_params["Accept"] = self.api_client.select_header_accept(
            ["application/json"]
        )  # noqa: E501

        # Authentication setting
        auth_settings = []  # noqa: E501

        return self.api_client.call_api(
            "/v2/asset_pairs",
            "GET",
            path_params,
            query_params,
            header_params,
            body=body_params,
            post_params=form_params,
            files=local_var_files,
            response_type="RelayerApiAssetDataPairsResponseSchema",  # noqa: E501
            auth_settings=auth_settings,
            async_req=local_var_params.get("async_req"),
            _return_http_data_only=local_var_params.get(
                "_return_http_data_only"
            ),  # noqa: E501
            _preload_content=local_var_params.get("_preload_content", True),
            _request_timeout=local_var_params.get("_request_timeout"),
            collection_formats=collection_formats,
        )

    def get_fee_recipients(self, **kwargs):  # noqa: E501
        """get_fee_recipients  # noqa: E501

        Retrieves a collection of all fee recipient addresses for a relayer. This endpoint should be [paginated](#section/Pagination).  # noqa: E501
        This method makes a synchronous HTTP request by default. To make an
        asynchronous HTTP request, please pass async_req=True
        >>> thread = api.get_fee_recipients(async_req=True)
        >>> result = thread.get()

        :param async_req bool
        :param float network_id: The id of the Ethereum network
        :param float page: The number of the page to request in the collection.
        :param float per_page: The number of records to return per page.
        :return: RelayerApiFeeRecipientsResponseSchema
                 If the method is called asynchronously,
                 returns the request thread.
        """
        kwargs["_return_http_data_only"] = True
        if kwargs.get("async_req"):
            return self.get_fee_recipients_with_http_info(
                **kwargs
            )  # noqa: E501
        else:
            (data) = self.get_fee_recipients_with_http_info(
                **kwargs
            )  # noqa: E501
            return data

    def get_fee_recipients_with_http_info(self, **kwargs):  # noqa: E501
        """get_fee_recipients  # noqa: E501

        Retrieves a collection of all fee recipient addresses for a relayer. This endpoint should be [paginated](#section/Pagination).  # noqa: E501
        This method makes a synchronous HTTP request by default. To make an
        asynchronous HTTP request, please pass async_req=True
        >>> thread = api.get_fee_recipients_with_http_info(async_req=True)
        >>> result = thread.get()

        :param async_req bool
        :param float network_id: The id of the Ethereum network
        :param float page: The number of the page to request in the collection.
        :param float per_page: The number of records to return per page.
        :return: RelayerApiFeeRecipientsResponseSchema
                 If the method is called asynchronously,
                 returns the request thread.
        """

        local_var_params = locals()

        all_params = ["network_id", "page", "per_page"]  # noqa: E501
        all_params.append("async_req")
        all_params.append("_return_http_data_only")
        all_params.append("_preload_content")
        all_params.append("_request_timeout")

        for key, val in six.iteritems(local_var_params["kwargs"]):
            if key not in all_params:
                raise TypeError(
                    "Got an unexpected keyword argument '%s'"
                    " to method get_fee_recipients" % key
                )
            local_var_params[key] = val
        del local_var_params["kwargs"]

        collection_formats = {}

        path_params = {}

        query_params = []
        if "network_id" in local_var_params:
            query_params.append(
                ("networkId", local_var_params["network_id"])
            )  # noqa: E501
        if "page" in local_var_params:
            query_params.append(
                ("page", local_var_params["page"])
            )  # noqa: E501
        if "per_page" in local_var_params:
            query_params.append(
                ("perPage", local_var_params["per_page"])
            )  # noqa: E501

        header_params = {}

        form_params = []
        local_var_files = {}

        body_params = None
        # HTTP header `Accept`
        header_params["Accept"] = self.api_client.select_header_accept(
            ["application/json"]
        )  # noqa: E501

        # Authentication setting
        auth_settings = []  # noqa: E501

        return self.api_client.call_api(
            "/v2/fee_recipients",
            "GET",
            path_params,
            query_params,
            header_params,
            body=body_params,
            post_params=form_params,
            files=local_var_files,
            response_type="RelayerApiFeeRecipientsResponseSchema",  # noqa: E501
            auth_settings=auth_settings,
            async_req=local_var_params.get("async_req"),
            _return_http_data_only=local_var_params.get(
                "_return_http_data_only"
            ),  # noqa: E501
            _preload_content=local_var_params.get("_preload_content", True),
            _request_timeout=local_var_params.get("_request_timeout"),
            collection_formats=collection_formats,
        )

    def get_order(self, order_hash, **kwargs):  # noqa: E501
        """get_order  # noqa: E501

        Retrieves the 0x order with meta info that is associated with the hash.  # noqa: E501
        This method makes a synchronous HTTP request by default. To make an
        asynchronous HTTP request, please pass async_req=True
        >>> thread = api.get_order(order_hash, async_req=True)
        >>> result = thread.get()

        :param async_req bool
        :param str order_hash: The hash of the desired 0x order. (required)
        :param float network_id: The id of the Ethereum network
        :return: RelayerApiOrderSchema
                 If the method is called asynchronously,
                 returns the request thread.
        """
        kwargs["_return_http_data_only"] = True
        if kwargs.get("async_req"):
            return self.get_order_with_http_info(
                order_hash, **kwargs
            )  # noqa: E501
        else:
            (data) = self.get_order_with_http_info(
                order_hash, **kwargs
            )  # noqa: E501
            return data

    def get_order_with_http_info(self, order_hash, **kwargs):  # noqa: E501
        """get_order  # noqa: E501

        Retrieves the 0x order with meta info that is associated with the hash.  # noqa: E501
        This method makes a synchronous HTTP request by default. To make an
        asynchronous HTTP request, please pass async_req=True
        >>> thread = api.get_order_with_http_info(order_hash, async_req=True)
        >>> result = thread.get()

        :param async_req bool
        :param str order_hash: The hash of the desired 0x order. (required)
        :param float network_id: The id of the Ethereum network
        :return: RelayerApiOrderSchema
                 If the method is called asynchronously,
                 returns the request thread.
        """

        local_var_params = locals()

        all_params = ["order_hash", "network_id"]  # noqa: E501
        all_params.append("async_req")
        all_params.append("_return_http_data_only")
        all_params.append("_preload_content")
        all_params.append("_request_timeout")

        for key, val in six.iteritems(local_var_params["kwargs"]):
            if key not in all_params:
                raise TypeError(
                    "Got an unexpected keyword argument '%s'"
                    " to method get_order" % key
                )
            local_var_params[key] = val
        del local_var_params["kwargs"]
        # verify the required parameter 'order_hash' is set
        if (
            "order_hash" not in local_var_params
            or local_var_params["order_hash"] is None
        ):
            raise ValueError(
                "Missing the required parameter `order_hash` when calling `get_order`"
            )  # noqa: E501

        collection_formats = {}

        path_params = {}
        if "order_hash" in local_var_params:
            path_params["orderHash"] = local_var_params[
                "order_hash"
            ]  # noqa: E501

        query_params = []
        if "network_id" in local_var_params:
            query_params.append(
                ("networkId", local_var_params["network_id"])
            )  # noqa: E501

        header_params = {}

        form_params = []
        local_var_files = {}

        body_params = None
        # HTTP header `Accept`
        header_params["Accept"] = self.api_client.select_header_accept(
            ["application/json"]
        )  # noqa: E501

        # Authentication setting
        auth_settings = []  # noqa: E501

        return self.api_client.call_api(
            "/v2/order/{orderHash}",
            "GET",
            path_params,
            query_params,
            header_params,
            body=body_params,
            post_params=form_params,
            files=local_var_files,
            response_type="RelayerApiOrderSchema",  # noqa: E501
            auth_settings=auth_settings,
            async_req=local_var_params.get("async_req"),
            _return_http_data_only=local_var_params.get(
                "_return_http_data_only"
            ),  # noqa: E501
            _preload_content=local_var_params.get("_preload_content", True),
            _request_timeout=local_var_params.get("_request_timeout"),
            collection_formats=collection_formats,
        )

    def get_order_config(self, **kwargs):  # noqa: E501
        """get_order_config  # noqa: E501

        Relayers have full discretion over the orders that they are willing to host on their orderbooks (e.g what fees they charge, etc...). In order for traders to discover their requirements programmatically, they can send an incomplete order to this endpoint and receive the missing fields, specifc to that order. This gives relayers a large amount of flexibility to tailor fees to unique traders, trading pairs and volume amounts. Submit a partial order and receive information required to complete the order: `senderAddress`, `feeRecipientAddress`, `makerFee`, `takerFee`.   # noqa: E501
        This method makes a synchronous HTTP request by default. To make an
        asynchronous HTTP request, please pass async_req=True
        >>> thread = api.get_order_config(async_req=True)
        >>> result = thread.get()

        :param async_req bool
        :param float network_id: The id of the Ethereum network
        :param RelayerApiOrderConfigPayloadSchema relayer_api_order_config_payload_schema: The fields of a 0x order the relayer may want to decide what configuration to send back.
        :return: RelayerApiOrderConfigResponseSchema
                 If the method is called asynchronously,
                 returns the request thread.
        """
        kwargs["_return_http_data_only"] = True
        if kwargs.get("async_req"):
            return self.get_order_config_with_http_info(**kwargs)  # noqa: E501
        else:
            (data) = self.get_order_config_with_http_info(
                **kwargs
            )  # noqa: E501
            return data

    def get_order_config_with_http_info(self, **kwargs):  # noqa: E501
        """get_order_config  # noqa: E501

        Relayers have full discretion over the orders that they are willing to host on their orderbooks (e.g what fees they charge, etc...). In order for traders to discover their requirements programmatically, they can send an incomplete order to this endpoint and receive the missing fields, specifc to that order. This gives relayers a large amount of flexibility to tailor fees to unique traders, trading pairs and volume amounts. Submit a partial order and receive information required to complete the order: `senderAddress`, `feeRecipientAddress`, `makerFee`, `takerFee`.   # noqa: E501
        This method makes a synchronous HTTP request by default. To make an
        asynchronous HTTP request, please pass async_req=True
        >>> thread = api.get_order_config_with_http_info(async_req=True)
        >>> result = thread.get()

        :param async_req bool
        :param float network_id: The id of the Ethereum network
        :param RelayerApiOrderConfigPayloadSchema relayer_api_order_config_payload_schema: The fields of a 0x order the relayer may want to decide what configuration to send back.
        :return: RelayerApiOrderConfigResponseSchema
                 If the method is called asynchronously,
                 returns the request thread.
        """

        local_var_params = locals()

        all_params = [
            "network_id",
            "relayer_api_order_config_payload_schema",
        ]  # noqa: E501
        all_params.append("async_req")
        all_params.append("_return_http_data_only")
        all_params.append("_preload_content")
        all_params.append("_request_timeout")

        for key, val in six.iteritems(local_var_params["kwargs"]):
            if key not in all_params:
                raise TypeError(
                    "Got an unexpected keyword argument '%s'"
                    " to method get_order_config" % key
                )
            local_var_params[key] = val
        del local_var_params["kwargs"]

        collection_formats = {}

        path_params = {}

        query_params = []
        if "network_id" in local_var_params:
            query_params.append(
                ("networkId", local_var_params["network_id"])
            )  # noqa: E501

        header_params = {}

        form_params = []
        local_var_files = {}

        body_params = None
        if "relayer_api_order_config_payload_schema" in local_var_params:
            body_params = local_var_params[
                "relayer_api_order_config_payload_schema"
            ]
        # HTTP header `Accept`
        header_params["Accept"] = self.api_client.select_header_accept(
            ["application/json"]
        )  # noqa: E501

        # HTTP header `Content-Type`
        header_params[
            "Content-Type"
        ] = self.api_client.select_header_content_type(  # noqa: E501
            ["application/json"]
        )  # noqa: E501

        # Authentication setting
        auth_settings = []  # noqa: E501

        return self.api_client.call_api(
            "/v2/order_config",
            "POST",
            path_params,
            query_params,
            header_params,
            body=body_params,
            post_params=form_params,
            files=local_var_files,
            response_type="RelayerApiOrderConfigResponseSchema",  # noqa: E501
            auth_settings=auth_settings,
            async_req=local_var_params.get("async_req"),
            _return_http_data_only=local_var_params.get(
                "_return_http_data_only"
            ),  # noqa: E501
            _preload_content=local_var_params.get("_preload_content", True),
            _request_timeout=local_var_params.get("_request_timeout"),
            collection_formats=collection_formats,
        )

    def get_orderbook(
        self, base_asset_data, quote_asset_data, **kwargs
    ):  # noqa: E501
        """get_orderbook  # noqa: E501

        Retrieves the orderbook for a given asset pair. This endpoint should be [paginated](#section/Pagination). Bids will be sorted in descending order by price, and asks will be sorted in ascending order by price. Within the price sorted orders, the orders are further sorted by _taker fee price_ which is defined as the **takerFee** divided by **takerTokenAmount**. After _taker fee price_, orders are to be sorted by expiration in ascending order. The way pagination works for this endpoint is that the **page** and **perPage** query params apply to both `bids` and `asks` collections, and if `page` * `perPage` > `total` for a certain collection, the `records` for that collection should just be empty.   # noqa: E501
        This method makes a synchronous HTTP request by default. To make an
        asynchronous HTTP request, please pass async_req=True
        >>> thread = api.get_orderbook(base_asset_data, quote_asset_data, async_req=True)
        >>> result = thread.get()

        :param async_req bool
        :param str base_asset_data: assetData (makerAssetData or takerAssetData) designated as the base currency in the [currency pair calculation](https://en.wikipedia.org/wiki/Currency_pair) of price. (required)
        :param str quote_asset_data: assetData (makerAssetData or takerAssetData) designated as the quote currency in the currency pair calculation of price (required). (required)
        :param float network_id: The id of the Ethereum network
        :param float page: The number of the page to request in the collection.
        :param float per_page: The number of records to return per page.
        :return: RelayerApiOrderbookResponseSchema
                 If the method is called asynchronously,
                 returns the request thread.
        """
        kwargs["_return_http_data_only"] = True
        if kwargs.get("async_req"):
            return self.get_orderbook_with_http_info(
                base_asset_data, quote_asset_data, **kwargs
            )  # noqa: E501
        else:
            (data) = self.get_orderbook_with_http_info(
                base_asset_data, quote_asset_data, **kwargs
            )  # noqa: E501
            return data

    def get_orderbook_with_http_info(
        self, base_asset_data, quote_asset_data, **kwargs
    ):  # noqa: E501
        """get_orderbook  # noqa: E501

        Retrieves the orderbook for a given asset pair. This endpoint should be [paginated](#section/Pagination). Bids will be sorted in descending order by price, and asks will be sorted in ascending order by price. Within the price sorted orders, the orders are further sorted by _taker fee price_ which is defined as the **takerFee** divided by **takerTokenAmount**. After _taker fee price_, orders are to be sorted by expiration in ascending order. The way pagination works for this endpoint is that the **page** and **perPage** query params apply to both `bids` and `asks` collections, and if `page` * `perPage` > `total` for a certain collection, the `records` for that collection should just be empty.   # noqa: E501
        This method makes a synchronous HTTP request by default. To make an
        asynchronous HTTP request, please pass async_req=True
        >>> thread = api.get_orderbook_with_http_info(base_asset_data, quote_asset_data, async_req=True)
        >>> result = thread.get()

        :param async_req bool
        :param str base_asset_data: assetData (makerAssetData or takerAssetData) designated as the base currency in the [currency pair calculation](https://en.wikipedia.org/wiki/Currency_pair) of price. (required)
        :param str quote_asset_data: assetData (makerAssetData or takerAssetData) designated as the quote currency in the currency pair calculation of price (required). (required)
        :param float network_id: The id of the Ethereum network
        :param float page: The number of the page to request in the collection.
        :param float per_page: The number of records to return per page.
        :return: RelayerApiOrderbookResponseSchema
                 If the method is called asynchronously,
                 returns the request thread.
        """

        local_var_params = locals()

        all_params = [
            "base_asset_data",
            "quote_asset_data",
            "network_id",
            "page",
            "per_page",
        ]  # noqa: E501
        all_params.append("async_req")
        all_params.append("_return_http_data_only")
        all_params.append("_preload_content")
        all_params.append("_request_timeout")

        for key, val in six.iteritems(local_var_params["kwargs"]):
            if key not in all_params:
                raise TypeError(
                    "Got an unexpected keyword argument '%s'"
                    " to method get_orderbook" % key
                )
            local_var_params[key] = val
        del local_var_params["kwargs"]
        # verify the required parameter 'base_asset_data' is set
        if (
            "base_asset_data" not in local_var_params
            or local_var_params["base_asset_data"] is None
        ):
            raise ValueError(
                "Missing the required parameter `base_asset_data` when calling `get_orderbook`"
            )  # noqa: E501
        # verify the required parameter 'quote_asset_data' is set
        if (
            "quote_asset_data" not in local_var_params
            or local_var_params["quote_asset_data"] is None
        ):
            raise ValueError(
                "Missing the required parameter `quote_asset_data` when calling `get_orderbook`"
            )  # noqa: E501

        collection_formats = {}

        path_params = {}

        query_params = []
        if "base_asset_data" in local_var_params:
            query_params.append(
                ("baseAssetData", local_var_params["base_asset_data"])
            )  # noqa: E501
        if "quote_asset_data" in local_var_params:
            query_params.append(
                ("quoteAssetData", local_var_params["quote_asset_data"])
            )  # noqa: E501
        if "network_id" in local_var_params:
            query_params.append(
                ("networkId", local_var_params["network_id"])
            )  # noqa: E501
        if "page" in local_var_params:
            query_params.append(
                ("page", local_var_params["page"])
            )  # noqa: E501
        if "per_page" in local_var_params:
            query_params.append(
                ("perPage", local_var_params["per_page"])
            )  # noqa: E501

        header_params = {}

        form_params = []
        local_var_files = {}

        body_params = None
        # HTTP header `Accept`
        header_params["Accept"] = self.api_client.select_header_accept(
            ["application/json"]
        )  # noqa: E501

        # Authentication setting
        auth_settings = []  # noqa: E501

        return self.api_client.call_api(
            "/v2/orderbook",
            "GET",
            path_params,
            query_params,
            header_params,
            body=body_params,
            post_params=form_params,
            files=local_var_files,
            response_type="RelayerApiOrderbookResponseSchema",  # noqa: E501
            auth_settings=auth_settings,
            async_req=local_var_params.get("async_req"),
            _return_http_data_only=local_var_params.get(
                "_return_http_data_only"
            ),  # noqa: E501
            _preload_content=local_var_params.get("_preload_content", True),
            _request_timeout=local_var_params.get("_request_timeout"),
            collection_formats=collection_formats,
        )

    def get_orders(self, **kwargs):  # noqa: E501
        """get_orders  # noqa: E501

        Retrieves a list of orders given query parameters. This endpoint should be [paginated](#section/Pagination). For querying an entire orderbook snapshot, the [orderbook endpoint](#operation/getOrderbook) is recommended. If both makerAssetData and takerAssetData are specified, returned orders will be sorted by price determined by (takerTokenAmount/makerTokenAmount) in ascending order. By default, orders returned by this endpoint are unsorted.  # noqa: E501
        This method makes a synchronous HTTP request by default. To make an
        asynchronous HTTP request, please pass async_req=True
        >>> thread = api.get_orders(async_req=True)
        >>> result = thread.get()

        :param async_req bool
        :param str maker_asset_proxy_id: The maker [asset proxy id](https://0xproject.com/docs/0x.js#types-AssetProxyId) (example: \"0xf47261b0\" for ERC20, \"0x02571792\" for ERC721).
        :param str taker_asset_proxy_id: The taker asset [asset proxy id](https://0xproject.com/docs/0x.js#types-AssetProxyId) (example: \"0xf47261b0\" for ERC20, \"0x02571792\" for ERC721).
        :param str maker_asset_address: The contract address for the maker asset.
        :param str taker_asset_address: The contract address for the taker asset.
        :param str exchange_address: Same as exchangeAddress in the [0x Protocol v2 Specification](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#order-message-format)
        :param str sender_address: Same as senderAddress in the [0x Protocol v2 Specification](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#order-message-format)
        :param str maker_asset_data: Same as makerAssetData in the [0x Protocol v2 Specification](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#order-message-format)
        :param str taker_asset_data: Same as takerAssetData in the [0x Protocol v2 Specification](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#order-message-format)
        :param str trader_asset_data: Same as traderAssetData in the [0x Protocol v2 Specification](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#order-message-format)
        :param str maker_address: Same as makerAddress in the [0x Protocol v2 Specification](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#order-message-format)
        :param str taker_address: Same as takerAddress in the [0x Protocol v2 Specification](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#order-message-format)
        :param str trader_address: Same as traderAddress in the [0x Protocol v2 Specification](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#order-message-format)
        :param str fee_recipient_address: Same as feeRecipientAddress in the [0x Protocol v2 Specification](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#order-message-format)
        :param float network_id: The id of the Ethereum network
        :param float page: The number of the page to request in the collection.
        :param float per_page: The number of records to return per page.
        :return: RelayerApiOrdersResponseSchema
                 If the method is called asynchronously,
                 returns the request thread.
        """
        kwargs["_return_http_data_only"] = True
        if kwargs.get("async_req"):
            return self.get_orders_with_http_info(**kwargs)  # noqa: E501
        else:
            (data) = self.get_orders_with_http_info(**kwargs)  # noqa: E501
            return data

    def get_orders_with_http_info(self, **kwargs):  # noqa: E501
        """get_orders  # noqa: E501

        Retrieves a list of orders given query parameters. This endpoint should be [paginated](#section/Pagination). For querying an entire orderbook snapshot, the [orderbook endpoint](#operation/getOrderbook) is recommended. If both makerAssetData and takerAssetData are specified, returned orders will be sorted by price determined by (takerTokenAmount/makerTokenAmount) in ascending order. By default, orders returned by this endpoint are unsorted.  # noqa: E501
        This method makes a synchronous HTTP request by default. To make an
        asynchronous HTTP request, please pass async_req=True
        >>> thread = api.get_orders_with_http_info(async_req=True)
        >>> result = thread.get()

        :param async_req bool
        :param str maker_asset_proxy_id: The maker [asset proxy id](https://0xproject.com/docs/0x.js#types-AssetProxyId) (example: \"0xf47261b0\" for ERC20, \"0x02571792\" for ERC721).
        :param str taker_asset_proxy_id: The taker asset [asset proxy id](https://0xproject.com/docs/0x.js#types-AssetProxyId) (example: \"0xf47261b0\" for ERC20, \"0x02571792\" for ERC721).
        :param str maker_asset_address: The contract address for the maker asset.
        :param str taker_asset_address: The contract address for the taker asset.
        :param str exchange_address: Same as exchangeAddress in the [0x Protocol v2 Specification](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#order-message-format)
        :param str sender_address: Same as senderAddress in the [0x Protocol v2 Specification](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#order-message-format)
        :param str maker_asset_data: Same as makerAssetData in the [0x Protocol v2 Specification](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#order-message-format)
        :param str taker_asset_data: Same as takerAssetData in the [0x Protocol v2 Specification](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#order-message-format)
        :param str trader_asset_data: Same as traderAssetData in the [0x Protocol v2 Specification](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#order-message-format)
        :param str maker_address: Same as makerAddress in the [0x Protocol v2 Specification](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#order-message-format)
        :param str taker_address: Same as takerAddress in the [0x Protocol v2 Specification](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#order-message-format)
        :param str trader_address: Same as traderAddress in the [0x Protocol v2 Specification](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#order-message-format)
        :param str fee_recipient_address: Same as feeRecipientAddress in the [0x Protocol v2 Specification](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#order-message-format)
        :param float network_id: The id of the Ethereum network
        :param float page: The number of the page to request in the collection.
        :param float per_page: The number of records to return per page.
        :return: RelayerApiOrdersResponseSchema
                 If the method is called asynchronously,
                 returns the request thread.
        """

        local_var_params = locals()

        all_params = [
            "maker_asset_proxy_id",
            "taker_asset_proxy_id",
            "maker_asset_address",
            "taker_asset_address",
            "exchange_address",
            "sender_address",
            "maker_asset_data",
            "taker_asset_data",
            "trader_asset_data",
            "maker_address",
            "taker_address",
            "trader_address",
            "fee_recipient_address",
            "network_id",
            "page",
            "per_page",
        ]  # noqa: E501
        all_params.append("async_req")
        all_params.append("_return_http_data_only")
        all_params.append("_preload_content")
        all_params.append("_request_timeout")

        for key, val in six.iteritems(local_var_params["kwargs"]):
            if key not in all_params:
                raise TypeError(
                    "Got an unexpected keyword argument '%s'"
                    " to method get_orders" % key
                )
            local_var_params[key] = val
        del local_var_params["kwargs"]

        collection_formats = {}

        path_params = {}

        query_params = []
        if "maker_asset_proxy_id" in local_var_params:
            query_params.append(
                ("makerAssetProxyId", local_var_params["maker_asset_proxy_id"])
            )  # noqa: E501
        if "taker_asset_proxy_id" in local_var_params:
            query_params.append(
                ("takerAssetProxyId", local_var_params["taker_asset_proxy_id"])
            )  # noqa: E501
        if "maker_asset_address" in local_var_params:
            query_params.append(
                ("makerAssetAddress", local_var_params["maker_asset_address"])
            )  # noqa: E501
        if "taker_asset_address" in local_var_params:
            query_params.append(
                ("takerAssetAddress", local_var_params["taker_asset_address"])
            )  # noqa: E501
        if "exchange_address" in local_var_params:
            query_params.append(
                ("exchangeAddress", local_var_params["exchange_address"])
            )  # noqa: E501
        if "sender_address" in local_var_params:
            query_params.append(
                ("senderAddress", local_var_params["sender_address"])
            )  # noqa: E501
        if "maker_asset_data" in local_var_params:
            query_params.append(
                ("makerAssetData", local_var_params["maker_asset_data"])
            )  # noqa: E501
        if "taker_asset_data" in local_var_params:
            query_params.append(
                ("takerAssetData", local_var_params["taker_asset_data"])
            )  # noqa: E501
        if "trader_asset_data" in local_var_params:
            query_params.append(
                ("traderAssetData", local_var_params["trader_asset_data"])
            )  # noqa: E501
        if "maker_address" in local_var_params:
            query_params.append(
                ("makerAddress", local_var_params["maker_address"])
            )  # noqa: E501
        if "taker_address" in local_var_params:
            query_params.append(
                ("takerAddress", local_var_params["taker_address"])
            )  # noqa: E501
        if "trader_address" in local_var_params:
            query_params.append(
                ("traderAddress", local_var_params["trader_address"])
            )  # noqa: E501
        if "fee_recipient_address" in local_var_params:
            query_params.append(
                (
                    "feeRecipientAddress",
                    local_var_params["fee_recipient_address"],
                )
            )  # noqa: E501
        if "network_id" in local_var_params:
            query_params.append(
                ("networkId", local_var_params["network_id"])
            )  # noqa: E501
        if "page" in local_var_params:
            query_params.append(
                ("page", local_var_params["page"])
            )  # noqa: E501
        if "per_page" in local_var_params:
            query_params.append(
                ("perPage", local_var_params["per_page"])
            )  # noqa: E501

        header_params = {}

        form_params = []
        local_var_files = {}

        body_params = None
        # HTTP header `Accept`
        header_params["Accept"] = self.api_client.select_header_accept(
            ["application/json"]
        )  # noqa: E501

        # Authentication setting
        auth_settings = []  # noqa: E501

        return self.api_client.call_api(
            "/v2/orders",
            "GET",
            path_params,
            query_params,
            header_params,
            body=body_params,
            post_params=form_params,
            files=local_var_files,
            response_type="RelayerApiOrdersResponseSchema",  # noqa: E501
            auth_settings=auth_settings,
            async_req=local_var_params.get("async_req"),
            _return_http_data_only=local_var_params.get(
                "_return_http_data_only"
            ),  # noqa: E501
            _preload_content=local_var_params.get("_preload_content", True),
            _request_timeout=local_var_params.get("_request_timeout"),
            collection_formats=collection_formats,
        )

    def post_order(self, **kwargs):  # noqa: E501
        """post_order  # noqa: E501

        Submit a signed order to the relayer.  # noqa: E501
        This method makes a synchronous HTTP request by default. To make an
        asynchronous HTTP request, please pass async_req=True
        >>> thread = api.post_order(async_req=True)
        >>> result = thread.get()

        :param async_req bool
        :param float network_id: The id of the Ethereum network
        :param SignedOrderSchema signed_order_schema: A valid signed 0x order based on the schema.
        :return: None
                 If the method is called asynchronously,
                 returns the request thread.
        """
        kwargs["_return_http_data_only"] = True
        if kwargs.get("async_req"):
            return self.post_order_with_http_info(**kwargs)  # noqa: E501
        else:
            (data) = self.post_order_with_http_info(**kwargs)  # noqa: E501
            return data

    def post_order_with_http_info(self, **kwargs):  # noqa: E501
        """post_order  # noqa: E501

        Submit a signed order to the relayer.  # noqa: E501
        This method makes a synchronous HTTP request by default. To make an
        asynchronous HTTP request, please pass async_req=True
        >>> thread = api.post_order_with_http_info(async_req=True)
        >>> result = thread.get()

        :param async_req bool
        :param float network_id: The id of the Ethereum network
        :param SignedOrderSchema signed_order_schema: A valid signed 0x order based on the schema.
        :return: None
                 If the method is called asynchronously,
                 returns the request thread.
        """

        local_var_params = locals()

        all_params = ["network_id", "signed_order_schema"]  # noqa: E501
        all_params.append("async_req")
        all_params.append("_return_http_data_only")
        all_params.append("_preload_content")
        all_params.append("_request_timeout")

        for key, val in six.iteritems(local_var_params["kwargs"]):
            if key not in all_params:
                raise TypeError(
                    "Got an unexpected keyword argument '%s'"
                    " to method post_order" % key
                )
            local_var_params[key] = val
        del local_var_params["kwargs"]

        collection_formats = {}

        path_params = {}

        query_params = []
        if "network_id" in local_var_params:
            query_params.append(
                ("networkId", local_var_params["network_id"])
            )  # noqa: E501

        header_params = {}

        form_params = []
        local_var_files = {}

        body_params = None
        if "signed_order_schema" in local_var_params:
            body_params = local_var_params["signed_order_schema"]
        # HTTP header `Accept`
        header_params["Accept"] = self.api_client.select_header_accept(
            ["application/json"]
        )  # noqa: E501

        # HTTP header `Content-Type`
        header_params[
            "Content-Type"
        ] = self.api_client.select_header_content_type(  # noqa: E501
            ["application/json"]
        )  # noqa: E501

        # Authentication setting
        auth_settings = []  # noqa: E501

        return self.api_client.call_api(
            "/v2/order",
            "POST",
            path_params,
            query_params,
            header_params,
            body=body_params,
            post_params=form_params,
            files=local_var_files,
            response_type=None,  # noqa: E501
            auth_settings=auth_settings,
            async_req=local_var_params.get("async_req"),
            _return_http_data_only=local_var_params.get(
                "_return_http_data_only"
            ),  # noqa: E501
            _preload_content=local_var_params.get("_preload_content", True),
            _request_timeout=local_var_params.get("_request_timeout"),
            collection_formats=collection_formats,
        )
