# coding: utf-8

"""
    Standard Relayer REST API

    # Schemas  The [JSON schemas](http://json-schema.org/) for the API payloads and responses can be found in [@0xproject/json-schemas](https://github.com/0xProject/0x.js/tree/development/packages/json-schemas). Examples of each payload and response can be found in the library's [test suite](https://github.com/0xProject/0x.js/blob/development/packages/json-schemas/test/schema_test.ts#L1).  ```bash npm install @0xproject/json-schemas --save ```  You can easily validate your API's payloads and responses using the [@0xproject/json-schemas](https://github.com/0xProject/0x.js/tree/development/packages/json-schemas) package:  ```js import {SchemaValidator, ValidatorResult, schemas} from '@0xproject/json-schemas';  const {relayerApiTokenPairsResponseSchema} = schemas; const validator = new SchemaValidator();  const tokenPairsResponse = {     ... }; const validatorResult: ValidatorResult = validator.validate(tokenPairsResponse, relayerApiTokenPairsResponseSchema); ```  # Pagination  Requests that return potentially large collections should respond to the **?page** and **?perPage** parameters. For example:  ```bash $ curl https://api.example-relayer.com/v2/asset_pairs?page=3&perPage=20 ```  Page numbering should be 1-indexed, not 0-indexed. If a query provides an unreasonable (ie. too high) `perPage` value, the response can return a validation error as specified in the [errors section](#section/Errors). If the query specifies a `page` that does not exist (ie. there are not enough `records`), the response should just return an empty `records` array.  All endpoints that are paginated should return a `total`, `page`, `perPage` and a `records` value in the top level of the collection. The value of `total` should be the total number of records for a given query, whereas `records` should be an array representing the response to the query for that page. `page` and `perPage`, are the same values that were specified in the request. See the note in [miscellaneous](#section/Misc.) about formatting `snake_case` vs. `lowerCamelCase`.  These requests include the [`/v2/asset_pairs`](#operation/getAssetPairs), [`/v2/orders`](#operation/getOrders), [`/v2/fee_recipients`](#operation/getFeeRecipients) and [`/v2/orderbook`](#operation/getOrderbook) endpoints.  # Network Id  All requests should be able to specify a **?networkId** query param for all supported networks. For example:  ```bash $ curl https://api.example-relayer.com/v2/asset_pairs?networkId=1 ```  If the query param is not provided, it should default to **1** (mainnet).  Networks and their Ids:  | Network Id | Network Name | | ---------- | ------------ | | 1          | Mainnet      | | 42         | Kovan        | | 3          | Ropsten      | | 4          | Rinkeby      |  If a certain network is not supported, the response should **400** as specified in the [error response](#section/Errors) section. For example:  ```json {     \"code\": 100,     \"reason\": \"Validation failed\",     \"validationErrors\": [         {             \"field\": \"networkId\",             \"code\": 1006,             \"reason\": \"Network id 42 is not supported\"         }     ] } ```  # Link Header  A [Link Header](https://tools.ietf.org/html/rfc5988) can be included in a response to provide clients with more context about paging For example:  ```bash Link: <https://api.example-relayer.com/v2/asset_pairs?page=3&perPage=20>; rel=\"next\", <https://api.github.com/user/repos?page=10&perPage=20>; rel=\"last\" ```  This `Link` response header contains one or more Hypermedia link relations.  The possible `rel` values are:  | Name  | Description                                                   | | ----- | ------------------------------------------------------------- | | next  | The link relation for the immediate next page of results.     | | last  | The link relation for the last page of results.               | | first | The link relation for the first page of results.              | | prev  | The link relation for the immediate previous page of results. |  # Rate Limits  Rate limit guidance for clients can be optionally returned in the response headers:  | Header Name           | Description                                                                  | | --------------------- | ---------------------------------------------------------------------------- | | X-RateLimit-Limit     | The maximum number of requests you're permitted to make per hour.            | | X-RateLimit-Remaining | The number of requests remaining in the current rate limit window.           | | X-RateLimit-Reset     | The time at which the current rate limit window resets in UTC epoch seconds. |  For example:  ```bash $ curl -i https://api.example-relayer.com/v2/asset_pairs HTTP/1.1 200 OK Date: Mon, 20 Oct 2017 12:30:06 GMT Status: 200 OK X-RateLimit-Limit: 60 X-RateLimit-Remaining: 56 X-RateLimit-Reset: 1372700873 ```  When a rate limit is exceeded, a status of **429 Too Many Requests** should be returned.  # Errors  Unless the spec defines otherwise, errors to bad requests should respond with HTTP 4xx or status codes.  ## Common error codes  | Code | Reason                                  | | ---- | --------------------------------------- | | 400  | Bad Request – Invalid request format    | | 404  | Not found                               | | 429  | Too many requests - Rate limit exceeded | | 500  | Internal Server Error                   | | 501  | Not Implemented                         |  ## Error reporting format  For all **400** responses, see the [error response schema](https://github.com/0xProject/0x-monorepo/blob/development/packages/json-schemas/schemas/relayer_api_error_response_schema.ts#L1).  ```json {     \"code\": 101,     \"reason\": \"Validation failed\",     \"validationErrors\": [         {             \"field\": \"maker\",             \"code\": 1002,             \"reason\": \"Invalid address\"         }     ] } ```  General error codes:  ```bash 100 - Validation Failed 101 - Malformed JSON 102 - Order submission disabled 103 - Throttled ```  Validation error codes:  ```bash 1000 - Required field 1001 - Incorrect format 1002 - Invalid address 1003 - Address not supported 1004 - Value out of range 1005 - Invalid signature or hash 1006 - Unsupported option ```  # Asset Data Encoding  As we now support multiple [token transfer proxies](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#assetproxy), the identifier of which proxy to use for the token transfer must be encoded, along with the token information. Each proxy in 0x v2 has a unique identifier. If you're using 0x.js there will be helper methods for this [encoding](https://0xproject.com/docs/0x.js#zeroEx-encodeERC20AssetData) and [decoding](https://0xproject.com/docs/0x.js#zeroEx-decodeAssetProxyId).  The identifier for the Proxy uses a similar scheme to [ABI function selectors](https://github.com/ethereum/wiki/wiki/Ethereum-Contract-ABI#function-selector).  ```js // ERC20 Proxy ID  0xf47261b0 bytes4(keccak256('ERC20Token(address)')); // ERC721 Proxy ID 0x02571792 bytes4(keccak256('ERC721Token(address,uint256)')); ```  Asset data is encoded using [ABI encoding](https://solidity.readthedocs.io/en/develop/abi-spec.html).  For example, encoding the ERC20 token contract (address: 0x1dc4c1cefef38a777b15aa20260a54e584b16c48) using the ERC20 Transfer Proxy (id: 0xf47261b0) would be:  ```bash 0xf47261b00000000000000000000000001dc4c1cefef38a777b15aa20260a54e584b16c48 ```  Encoding the ERC721 token contract (address: `0x371b13d97f4bf77d724e78c16b7dc74099f40e84`), token id (id: `99`, which hex encoded is `0x63`) and the ERC721 Transfer Proxy (id: 0x02571792) would be:  ```bash 0x02571792000000000000000000000000371b13d97f4bf77d724e78c16b7dc74099f40e840000000000000000000000000000000000000000000000000000000000000063 ```  For more information see [the Asset Proxy](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#erc20proxy) section of the v2 spec and the [Ethereum ABI Spec](https://solidity.readthedocs.io/en/develop/abi-spec.html).  # Meta Data in Order Responses  In v2 of the standard relayer API we added the `metaData` field. It is meant to provide a standard place for relayers to put optional, custom or non-standard fields that may of interest to the consumer of the API.  A good example of such a field is `remainingTakerAssetAmount`, which is a convenience field that communicates how much of a 0x order is potentially left to be filled. Unlike the other fields in a 0x order, it is not guaranteed to be correct as it is derived from whatever mechanism the implementer (ie. the relayer) is using. While convenient for prototyping and low stakes situations, we recommend validating the value of the field by checking the state of the blockchain yourself, such as by using [Order Watcher](https://0xproject.com/wiki#0x-OrderWatcher).  # Misc.  *   All requests and responses should be of **application/json** content type *   All token amounts are sent in amounts of the smallest level of precision (base units). (e.g if a token has 18 decimal places, selling 1 token would show up as selling `'1000000000000000000'` units by this API). *   All addresses are sent as lower-case (non-checksummed) Ethereum addresses with the `0x` prefix. *   All parameters are to be written in `lowerCamelCase`.   # noqa: E501

    OpenAPI spec version: 2.0.0
    Generated by: https://openapi-generator.tech
"""


from __future__ import absolute_import

import io
import json
import logging
import re
import ssl

import certifi

# python 2 and python 3 compatibility library
import six
from six.moves.urllib.parse import urlencode

try:
    import urllib3
except ImportError:
    raise ImportError("OpenAPI Python client requires urllib3.")


logger = logging.getLogger(__name__)


class RESTResponse(io.IOBase):
    def __init__(self, resp):
        self.urllib3_response = resp
        self.status = resp.status
        self.reason = resp.reason
        self.data = resp.data

    def getheaders(self):
        """Returns a dictionary of the response headers."""
        return self.urllib3_response.getheaders()

    def getheader(self, name, default=None):
        """Returns a given response header."""
        return self.urllib3_response.getheader(name, default)


class RESTClientObject(object):
    def __init__(self, configuration, pools_size=4, maxsize=None):
        # urllib3.PoolManager will pass all kw parameters to connectionpool
        # https://github.com/shazow/urllib3/blob/f9409436f83aeb79fbaf090181cd81b784f1b8ce/urllib3/poolmanager.py#L75  # noqa: E501
        # https://github.com/shazow/urllib3/blob/f9409436f83aeb79fbaf090181cd81b784f1b8ce/urllib3/connectionpool.py#L680  # noqa: E501
        # maxsize is the number of requests to host that are allowed in parallel  # noqa: E501
        # Custom SSL certificates and client certificates: http://urllib3.readthedocs.io/en/latest/advanced-usage.html  # noqa: E501

        # cert_reqs
        if configuration.verify_ssl:
            cert_reqs = ssl.CERT_REQUIRED
        else:
            cert_reqs = ssl.CERT_NONE

        # ca_certs
        if configuration.ssl_ca_cert:
            ca_certs = configuration.ssl_ca_cert
        else:
            # if not set certificate file, use Mozilla's root certificates.
            ca_certs = certifi.where()

        addition_pool_args = {}
        if configuration.assert_hostname is not None:
            addition_pool_args[
                "assert_hostname"
            ] = configuration.assert_hostname  # noqa: E501

        if maxsize is None:
            if configuration.connection_pool_maxsize is not None:
                maxsize = configuration.connection_pool_maxsize
            else:
                maxsize = 4

        # https pool manager
        if configuration.proxy:
            self.pool_manager = urllib3.ProxyManager(
                num_pools=pools_size,
                maxsize=maxsize,
                cert_reqs=cert_reqs,
                ca_certs=ca_certs,
                cert_file=configuration.cert_file,
                key_file=configuration.key_file,
                proxy_url=configuration.proxy,
                **addition_pool_args
            )
        else:
            self.pool_manager = urllib3.PoolManager(
                num_pools=pools_size,
                maxsize=maxsize,
                cert_reqs=cert_reqs,
                ca_certs=ca_certs,
                cert_file=configuration.cert_file,
                key_file=configuration.key_file,
                **addition_pool_args
            )

    def request(
        self,
        method,
        url,
        query_params=None,
        headers=None,
        body=None,
        post_params=None,
        _preload_content=True,
        _request_timeout=None,
    ):
        """Perform requests.

        :param method: http request method
        :param url: http request url
        :param query_params: query parameters in the url
        :param headers: http request headers
        :param body: request json body, for `application/json`
        :param post_params: request post parameters,
                            `application/x-www-form-urlencoded`
                            and `multipart/form-data`
        :param _preload_content: if False, the urllib3.HTTPResponse object will
                                 be returned without reading/decoding response
                                 data. Default is True.
        :param _request_timeout: timeout setting for this request. If one
                                 number provided, it will be total request
                                 timeout. It can also be a pair (tuple) of
                                 (connection, read) timeouts.
        """
        method = method.upper()
        assert method in [
            "GET",
            "HEAD",
            "DELETE",
            "POST",
            "PUT",
            "PATCH",
            "OPTIONS",
        ]

        if post_params and body:
            raise ValueError(
                "body parameter cannot be used with post_params parameter."
            )

        post_params = post_params or {}
        headers = headers or {}

        timeout = None
        if _request_timeout:
            if isinstance(
                _request_timeout, (int,) if six.PY3 else (int, long)
            ):  # noqa: E501,F821
                timeout = urllib3.Timeout(total=_request_timeout)
            elif (
                isinstance(_request_timeout, tuple)
                and len(_request_timeout) == 2
            ):
                timeout = urllib3.Timeout(
                    connect=_request_timeout[0], read=_request_timeout[1]
                )

        if "Content-Type" not in headers:
            headers["Content-Type"] = "application/json"

        try:
            # For `POST`, `PUT`, `PATCH`, `OPTIONS`, `DELETE`
            if method in ["POST", "PUT", "PATCH", "OPTIONS", "DELETE"]:
                if query_params:
                    url += "?" + urlencode(query_params)
                if re.search("json", headers["Content-Type"], re.IGNORECASE):
                    request_body = None
                    if body is not None:
                        request_body = json.dumps(body)
                    r = self.pool_manager.request(
                        method,
                        url,
                        body=request_body,
                        preload_content=_preload_content,
                        timeout=timeout,
                        headers=headers,
                    )
                elif (
                    headers["Content-Type"]
                    == "application/x-www-form-urlencoded"
                ):  # noqa: E501
                    r = self.pool_manager.request(
                        method,
                        url,
                        fields=post_params,
                        encode_multipart=False,
                        preload_content=_preload_content,
                        timeout=timeout,
                        headers=headers,
                    )
                elif headers["Content-Type"] == "multipart/form-data":
                    # must del headers['Content-Type'], or the correct
                    # Content-Type which generated by urllib3 will be
                    # overwritten.
                    del headers["Content-Type"]
                    r = self.pool_manager.request(
                        method,
                        url,
                        fields=post_params,
                        encode_multipart=True,
                        preload_content=_preload_content,
                        timeout=timeout,
                        headers=headers,
                    )
                # Pass a `string` parameter directly in the body to support
                # other content types than Json when `body` argument is
                # provided in serialized form
                elif isinstance(body, str):
                    request_body = body
                    r = self.pool_manager.request(
                        method,
                        url,
                        body=request_body,
                        preload_content=_preload_content,
                        timeout=timeout,
                        headers=headers,
                    )
                else:
                    # Cannot generate the request from given parameters
                    msg = """Cannot prepare a request message for provided
                             arguments. Please check that your arguments match
                             declared content type."""
                    raise ApiException(status=0, reason=msg)
            # For `GET`, `HEAD`
            else:
                r = self.pool_manager.request(
                    method,
                    url,
                    fields=query_params,
                    preload_content=_preload_content,
                    timeout=timeout,
                    headers=headers,
                )
        except urllib3.exceptions.SSLError as e:
            msg = "{0}\n{1}".format(type(e).__name__, str(e))
            raise ApiException(status=0, reason=msg)

        if _preload_content:
            r = RESTResponse(r)

            # In the python 3, the response.data is bytes.
            # we need to decode it to string.
            if six.PY3:
                r.data = r.data.decode("utf8")

            # log response body
            logger.debug("response body: %s", r.data)

        if not 200 <= r.status <= 299:
            raise ApiException(http_resp=r)

        return r

    def GET(
        self,
        url,
        headers=None,
        query_params=None,
        _preload_content=True,
        _request_timeout=None,
    ):
        return self.request(
            "GET",
            url,
            headers=headers,
            _preload_content=_preload_content,
            _request_timeout=_request_timeout,
            query_params=query_params,
        )

    def HEAD(
        self,
        url,
        headers=None,
        query_params=None,
        _preload_content=True,
        _request_timeout=None,
    ):
        return self.request(
            "HEAD",
            url,
            headers=headers,
            _preload_content=_preload_content,
            _request_timeout=_request_timeout,
            query_params=query_params,
        )

    def OPTIONS(
        self,
        url,
        headers=None,
        query_params=None,
        post_params=None,
        body=None,
        _preload_content=True,
        _request_timeout=None,
    ):
        return self.request(
            "OPTIONS",
            url,
            headers=headers,
            query_params=query_params,
            post_params=post_params,
            _preload_content=_preload_content,
            _request_timeout=_request_timeout,
            body=body,
        )

    def DELETE(
        self,
        url,
        headers=None,
        query_params=None,
        body=None,
        _preload_content=True,
        _request_timeout=None,
    ):
        return self.request(
            "DELETE",
            url,
            headers=headers,
            query_params=query_params,
            _preload_content=_preload_content,
            _request_timeout=_request_timeout,
            body=body,
        )

    def POST(
        self,
        url,
        headers=None,
        query_params=None,
        post_params=None,
        body=None,
        _preload_content=True,
        _request_timeout=None,
    ):
        return self.request(
            "POST",
            url,
            headers=headers,
            query_params=query_params,
            post_params=post_params,
            _preload_content=_preload_content,
            _request_timeout=_request_timeout,
            body=body,
        )

    def PUT(
        self,
        url,
        headers=None,
        query_params=None,
        post_params=None,
        body=None,
        _preload_content=True,
        _request_timeout=None,
    ):
        return self.request(
            "PUT",
            url,
            headers=headers,
            query_params=query_params,
            post_params=post_params,
            _preload_content=_preload_content,
            _request_timeout=_request_timeout,
            body=body,
        )

    def PATCH(
        self,
        url,
        headers=None,
        query_params=None,
        post_params=None,
        body=None,
        _preload_content=True,
        _request_timeout=None,
    ):
        return self.request(
            "PATCH",
            url,
            headers=headers,
            query_params=query_params,
            post_params=post_params,
            _preload_content=_preload_content,
            _request_timeout=_request_timeout,
            body=body,
        )


class ApiException(Exception):
    def __init__(self, status=None, reason=None, http_resp=None):
        if http_resp:
            self.status = http_resp.status
            self.reason = http_resp.reason
            self.body = http_resp.data
            self.headers = http_resp.getheaders()
        else:
            self.status = status
            self.reason = reason
            self.body = None
            self.headers = None

    def __str__(self):
        """Custom error messages for exception"""
        error_message = "({0})\n" "Reason: {1}\n".format(
            self.status, self.reason
        )
        if self.headers:
            error_message += "HTTP response headers: {0}\n".format(
                self.headers
            )

        if self.body:
            error_message += "HTTP response body: {0}\n".format(self.body)

        return error_message
