# coding: utf-8
"""
    Standard Relayer REST API

    # Schemas  The [JSON schemas](http://json-schema.org/) for the API payloads and responses can be found in [@0xproject/json-schemas](https://github.com/0xProject/0x.js/tree/development/packages/json-schemas). Examples of each payload and response can be found in the library's [test suite](https://github.com/0xProject/0x.js/blob/development/packages/json-schemas/test/schema_test.ts#L1).  ```bash npm install @0xproject/json-schemas --save ```  You can easily validate your API's payloads and responses using the [@0xproject/json-schemas](https://github.com/0xProject/0x.js/tree/development/packages/json-schemas) package:  ```js import {SchemaValidator, ValidatorResult, schemas} from '@0xproject/json-schemas';  const {relayerApiTokenPairsResponseSchema} = schemas; const validator = new SchemaValidator();  const tokenPairsResponse = {     ... }; const validatorResult: ValidatorResult = validator.validate(tokenPairsResponse, relayerApiTokenPairsResponseSchema); ```  # Pagination  Requests that return potentially large collections should respond to the **?page** and **?perPage** parameters. For example:  ```bash $ curl https://api.example-relayer.com/v2/asset_pairs?page=3&perPage=20 ```  Page numbering should be 1-indexed, not 0-indexed. If a query provides an unreasonable (ie. too high) `perPage` value, the response can return a validation error as specified in the [errors section](#section/Errors). If the query specifies a `page` that does not exist (ie. there are not enough `records`), the response should just return an empty `records` array.  All endpoints that are paginated should return a `total`, `page`, `perPage` and a `records` value in the top level of the collection. The value of `total` should be the total number of records for a given query, whereas `records` should be an array representing the response to the query for that page. `page` and `perPage`, are the same values that were specified in the request. See the note in [miscellaneous](#section/Misc.) about formatting `snake_case` vs. `lowerCamelCase`.  These requests include the [`/v2/asset_pairs`](#operation/getAssetPairs), [`/v2/orders`](#operation/getOrders), [`/v2/fee_recipients`](#operation/getFeeRecipients) and [`/v2/orderbook`](#operation/getOrderbook) endpoints.  # Network Id  All requests should be able to specify a **?networkId** query param for all supported networks. For example:  ```bash $ curl https://api.example-relayer.com/v2/asset_pairs?networkId=1 ```  If the query param is not provided, it should default to **1** (mainnet).  Networks and their Ids:  | Network Id | Network Name | | ---------- | ------------ | | 1          | Mainnet      | | 42         | Kovan        | | 3          | Ropsten      | | 4          | Rinkeby      |  If a certain network is not supported, the response should **400** as specified in the [error response](#section/Errors) section. For example:  ```json {     \"code\": 100,     \"reason\": \"Validation failed\",     \"validationErrors\": [         {             \"field\": \"networkId\",             \"code\": 1006,             \"reason\": \"Network id 42 is not supported\"         }     ] } ```  # Link Header  A [Link Header](https://tools.ietf.org/html/rfc5988) can be included in a response to provide clients with more context about paging For example:  ```bash Link: <https://api.example-relayer.com/v2/asset_pairs?page=3&perPage=20>; rel=\"next\", <https://api.github.com/user/repos?page=10&perPage=20>; rel=\"last\" ```  This `Link` response header contains one or more Hypermedia link relations.  The possible `rel` values are:  | Name  | Description                                                   | | ----- | ------------------------------------------------------------- | | next  | The link relation for the immediate next page of results.     | | last  | The link relation for the last page of results.               | | first | The link relation for the first page of results.              | | prev  | The link relation for the immediate previous page of results. |  # Rate Limits  Rate limit guidance for clients can be optionally returned in the response headers:  | Header Name           | Description                                                                  | | --------------------- | ---------------------------------------------------------------------------- | | X-RateLimit-Limit     | The maximum number of requests you're permitted to make per hour.            | | X-RateLimit-Remaining | The number of requests remaining in the current rate limit window.           | | X-RateLimit-Reset     | The time at which the current rate limit window resets in UTC epoch seconds. |  For example:  ```bash $ curl -i https://api.example-relayer.com/v2/asset_pairs HTTP/1.1 200 OK Date: Mon, 20 Oct 2017 12:30:06 GMT Status: 200 OK X-RateLimit-Limit: 60 X-RateLimit-Remaining: 56 X-RateLimit-Reset: 1372700873 ```  When a rate limit is exceeded, a status of **429 Too Many Requests** should be returned.  # Errors  Unless the spec defines otherwise, errors to bad requests should respond with HTTP 4xx or status codes.  ## Common error codes  | Code | Reason                                  | | ---- | --------------------------------------- | | 400  | Bad Request – Invalid request format    | | 404  | Not found                               | | 429  | Too many requests - Rate limit exceeded | | 500  | Internal Server Error                   | | 501  | Not Implemented                         |  ## Error reporting format  For all **400** responses, see the [error response schema](https://github.com/0xProject/0x-monorepo/blob/development/packages/json-schemas/schemas/relayer_api_error_response_schema.ts#L1).  ```json {     \"code\": 101,     \"reason\": \"Validation failed\",     \"validationErrors\": [         {             \"field\": \"maker\",             \"code\": 1002,             \"reason\": \"Invalid address\"         }     ] } ```  General error codes:  ```bash 100 - Validation Failed 101 - Malformed JSON 102 - Order submission disabled 103 - Throttled ```  Validation error codes:  ```bash 1000 - Required field 1001 - Incorrect format 1002 - Invalid address 1003 - Address not supported 1004 - Value out of range 1005 - Invalid signature or hash 1006 - Unsupported option ```  # Asset Data Encoding  As we now support multiple [token transfer proxies](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#assetproxy), the identifier of which proxy to use for the token transfer must be encoded, along with the token information. Each proxy in 0x v2 has a unique identifier. If you're using 0x.js there will be helper methods for this [encoding](https://0xproject.com/docs/0x.js#zeroEx-encodeERC20AssetData) and [decoding](https://0xproject.com/docs/0x.js#zeroEx-decodeAssetProxyId).  The identifier for the Proxy uses a similar scheme to [ABI function selectors](https://github.com/ethereum/wiki/wiki/Ethereum-Contract-ABI#function-selector).  ```js // ERC20 Proxy ID  0xf47261b0 bytes4(keccak256('ERC20Token(address)')); // ERC721 Proxy ID 0x02571792 bytes4(keccak256('ERC721Token(address,uint256)')); ```  Asset data is encoded using [ABI encoding](https://solidity.readthedocs.io/en/develop/abi-spec.html).  For example, encoding the ERC20 token contract (address: 0x1dc4c1cefef38a777b15aa20260a54e584b16c48) using the ERC20 Transfer Proxy (id: 0xf47261b0) would be:  ```bash 0xf47261b00000000000000000000000001dc4c1cefef38a777b15aa20260a54e584b16c48 ```  Encoding the ERC721 token contract (address: `0x371b13d97f4bf77d724e78c16b7dc74099f40e84`), token id (id: `99`, which hex encoded is `0x63`) and the ERC721 Transfer Proxy (id: 0x02571792) would be:  ```bash 0x02571792000000000000000000000000371b13d97f4bf77d724e78c16b7dc74099f40e840000000000000000000000000000000000000000000000000000000000000063 ```  For more information see [the Asset Proxy](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#erc20proxy) section of the v2 spec and the [Ethereum ABI Spec](https://solidity.readthedocs.io/en/develop/abi-spec.html).  # Meta Data in Order Responses  In v2 of the standard relayer API we added the `metaData` field. It is meant to provide a standard place for relayers to put optional, custom or non-standard fields that may of interest to the consumer of the API.  A good example of such a field is `remainingTakerAssetAmount`, which is a convenience field that communicates how much of a 0x order is potentially left to be filled. Unlike the other fields in a 0x order, it is not guaranteed to be correct as it is derived from whatever mechanism the implementer (ie. the relayer) is using. While convenient for prototyping and low stakes situations, we recommend validating the value of the field by checking the state of the blockchain yourself, such as by using [Order Watcher](https://0xproject.com/wiki#0x-OrderWatcher).  # Misc.  *   All requests and responses should be of **application/json** content type *   All token amounts are sent in amounts of the smallest level of precision (base units). (e.g if a token has 18 decimal places, selling 1 token would show up as selling `'1000000000000000000'` units by this API). *   All addresses are sent as lower-case (non-checksummed) Ethereum addresses with the `0x` prefix. *   All parameters are to be written in `lowerCamelCase`.   # noqa: E501

    OpenAPI spec version: 2.0.0
    Generated by: https://openapi-generator.tech
"""

from __future__ import absolute_import

import datetime
import json
import mimetypes
from multiprocessing.pool import ThreadPool
import os
import re
import tempfile

# python 2 and python 3 compatibility library
import six
from six.moves.urllib.parse import quote

from sra_client.configuration import Configuration
import sra_client.models
from sra_client import rest


class ApiClient(object):
    """Generic API client for OpenAPI client library builds.

    OpenAPI generic API client. This client handles the client-
    server communication, and is invariant across implementations. Specifics of
    the methods and models for each application are generated from the OpenAPI
    templates.

    NOTE: This class is auto generated by OpenAPI Generator.
    Ref: https://openapi-generator.tech
    Do not edit the class manually.

    :param configuration: .Configuration object for this client
    :param header_name: a header to pass when making calls to the API.
    :param header_value: a header value to pass when making calls to
        the API.
    :param cookie: a cookie to include in the header when making calls
        to the API
    :param pool_threads: The number of threads to use for async requests
        to the API. More threads means more concurrent API requests.
    """

    PRIMITIVE_TYPES = (float, bool, bytes, six.text_type) + six.integer_types
    NATIVE_TYPES_MAPPING = {
        "int": int,
        "long": int if six.PY3 else long,  # noqa: F821
        "float": float,
        "str": str,
        "bool": bool,
        "date": datetime.date,
        "datetime": datetime.datetime,
        "object": object,
    }
    _pool = None

    def __init__(
        self,
        configuration=None,
        header_name=None,
        header_value=None,
        cookie=None,
        pool_threads=None,
    ):
        if configuration is None:
            configuration = Configuration()
        self.configuration = configuration
        self.pool_threads = pool_threads

        self.rest_client = rest.RESTClientObject(configuration)
        self.default_headers = {}
        if header_name is not None:
            self.default_headers[header_name] = header_value
        self.cookie = cookie
        # Set default User-Agent.
        self.user_agent = "OpenAPI-Generator/1.0.0/python"

    def __del__(self):
        if self._pool:
            self._pool.close()
            self._pool.join()
            self._pool = None

    @property
    def pool(self):
        """Create thread pool on first request
         avoids instantiating unused threadpool for blocking clients.
        """
        if self._pool is None:
            self._pool = ThreadPool(self.pool_threads)
        return self._pool

    @property
    def user_agent(self):
        """User agent for this API client"""
        return self.default_headers["User-Agent"]

    @user_agent.setter
    def user_agent(self, value):
        self.default_headers["User-Agent"] = value

    def set_default_header(self, header_name, header_value):
        self.default_headers[header_name] = header_value

    def __call_api(
        self,
        resource_path,
        method,
        path_params=None,
        query_params=None,
        header_params=None,
        body=None,
        post_params=None,
        files=None,
        response_type=None,
        auth_settings=None,
        _return_http_data_only=None,
        collection_formats=None,
        _preload_content=True,
        _request_timeout=None,
    ):

        config = self.configuration

        # header parameters
        header_params = header_params or {}
        header_params.update(self.default_headers)
        if self.cookie:
            header_params["Cookie"] = self.cookie
        if header_params:
            header_params = self.sanitize_for_serialization(header_params)
            header_params = dict(
                self.parameters_to_tuples(header_params, collection_formats)
            )

        # path parameters
        if path_params:
            path_params = self.sanitize_for_serialization(path_params)
            path_params = self.parameters_to_tuples(
                path_params, collection_formats
            )
            for k, v in path_params:
                # specified safe chars, encode everything
                resource_path = resource_path.replace(
                    "{%s}" % k,
                    quote(str(v), safe=config.safe_chars_for_path_param),
                )

        # query parameters
        if query_params:
            query_params = self.sanitize_for_serialization(query_params)
            query_params = self.parameters_to_tuples(
                query_params, collection_formats
            )

        # post parameters
        if post_params or files:
            post_params = self.prepare_post_parameters(post_params, files)
            post_params = self.sanitize_for_serialization(post_params)
            post_params = self.parameters_to_tuples(
                post_params, collection_formats
            )

        # auth setting
        self.update_params_for_auth(header_params, query_params, auth_settings)

        # body
        if body:
            body = self.sanitize_for_serialization(body)

        # request url
        url = self.configuration.host + resource_path

        # perform request and return response
        response_data = self.request(
            method,
            url,
            query_params=query_params,
            headers=header_params,
            post_params=post_params,
            body=body,
            _preload_content=_preload_content,
            _request_timeout=_request_timeout,
        )

        self.last_response = response_data

        return_data = response_data
        if _preload_content:
            # deserialize response data
            if response_type:
                return_data = self.deserialize(response_data, response_type)
            else:
                return_data = None

        if _return_http_data_only:
            return return_data
        else:
            return (
                return_data,
                response_data.status,
                response_data.getheaders(),
            )

    def sanitize_for_serialization(self, obj):
        """Builds a JSON POST object.

        If obj is None, return None.
        If obj is str, int, long, float, bool, return directly.
        If obj is datetime.datetime, datetime.date
            convert to string in iso8601 format.
        If obj is list, sanitize each element in the list.
        If obj is dict, return the dict.
        If obj is OpenAPI model, return the properties dict.

        :param obj: The data to serialize.
        :return: The serialized form of data.
        """
        if obj is None:
            return None
        elif isinstance(obj, self.PRIMITIVE_TYPES):
            return obj
        elif isinstance(obj, list):
            return [
                self.sanitize_for_serialization(sub_obj) for sub_obj in obj
            ]
        elif isinstance(obj, tuple):
            return tuple(
                self.sanitize_for_serialization(sub_obj) for sub_obj in obj
            )
        elif isinstance(obj, (datetime.datetime, datetime.date)):
            return obj.isoformat()

        if isinstance(obj, dict):
            obj_dict = obj
        else:
            # Convert model obj to dict except
            # attributes `openapi_types`, `attribute_map`
            # and attributes which value is not None.
            # Convert attribute name to json key in
            # model definition for request.
            obj_dict = {
                obj.attribute_map[attr]: getattr(obj, attr)
                for attr, _ in six.iteritems(obj.openapi_types)
                if getattr(obj, attr) is not None
            }

        return {
            key: self.sanitize_for_serialization(val)
            for key, val in six.iteritems(obj_dict)
        }

    def deserialize(self, response, response_type):
        """Deserializes response into an object.

        :param response: RESTResponse object to be deserialized.
        :param response_type: class literal for
            deserialized object, or string of class name.

        :return: deserialized object.
        """
        # handle file downloading
        # save response body into a tmp file and return the instance
        if response_type == "file":
            return self.__deserialize_file(response)

        # fetch data from response object
        try:
            data = json.loads(response.data)
        except ValueError:
            data = response.data

        return self.__deserialize(data, response_type)

    def __deserialize(self, data, klass):
        """Deserializes dict, list, str into an object.

        :param data: dict, list or str.
        :param klass: class literal, or string of class name.

        :return: object.
        """
        if data is None:
            return None

        if type(klass) == str:
            if klass.startswith("list["):
                sub_kls = re.match(r"list\[(.*)\]", klass).group(1)
                return [
                    self.__deserialize(sub_data, sub_kls) for sub_data in data
                ]

            if klass.startswith("dict("):
                sub_kls = re.match(r"dict\(([^,]*), (.*)\)", klass).group(2)
                return {
                    k: self.__deserialize(v, sub_kls)
                    for k, v in six.iteritems(data)
                }

            # convert str to class
            if klass in self.NATIVE_TYPES_MAPPING:
                klass = self.NATIVE_TYPES_MAPPING[klass]
            else:
                klass = getattr(sra_client.models, klass)

        if klass in self.PRIMITIVE_TYPES:
            return self.__deserialize_primitive(data, klass)
        elif klass == object:
            return self.__deserialize_object(data)
        elif klass == datetime.date:
            return self.__deserialize_date(data)
        elif klass == datetime.datetime:
            return self.__deserialize_datatime(data)
        else:
            return self.__deserialize_model(data, klass)

    def call_api(
        self,
        resource_path,
        method,
        path_params=None,
        query_params=None,
        header_params=None,
        body=None,
        post_params=None,
        files=None,
        response_type=None,
        auth_settings=None,
        async_req=None,
        _return_http_data_only=None,
        collection_formats=None,
        _preload_content=True,
        _request_timeout=None,
    ):
        """Makes the HTTP request (synchronous) and returns deserialized data.

        To make an async_req request, set the async_req parameter.

        :param resource_path: Path to method endpoint.
        :param method: Method to call.
        :param path_params: Path parameters in the url.
        :param query_params: Query parameters in the url.
        :param header_params: Header parameters to be
            placed in the request header.
        :param body: Request body.
        :param post_params dict: Request post form parameters,
            for `application/x-www-form-urlencoded`, `multipart/form-data`.
        :param auth_settings list: Auth Settings names for the request.
        :param response: Response data type.
        :param files dict: key -> filename, value -> filepath,
            for `multipart/form-data`.
        :param async_req bool: execute request asynchronously
        :param _return_http_data_only: response data without head status code
                                       and headers
        :param collection_formats: dict of collection formats for path, query,
            header, and post parameters.
        :param _preload_content: if False, the urllib3.HTTPResponse object will
                                 be returned without reading/decoding response
                                 data. Default is True.
        :param _request_timeout: timeout setting for this request. If one
                                 number provided, it will be total request
                                 timeout. It can also be a pair (tuple) of
                                 (connection, read) timeouts.
        :return:
            If async_req parameter is True,
            the request will be called asynchronously.
            The method will return the request thread.
            If parameter async_req is False or missing,
            then the method will return the response directly.
        """
        if not async_req:
            return self.__call_api(
                resource_path,
                method,
                path_params,
                query_params,
                header_params,
                body,
                post_params,
                files,
                response_type,
                auth_settings,
                _return_http_data_only,
                collection_formats,
                _preload_content,
                _request_timeout,
            )
        else:
            thread = self.pool.apply_async(
                self.__call_api,
                (
                    resource_path,
                    method,
                    path_params,
                    query_params,
                    header_params,
                    body,
                    post_params,
                    files,
                    response_type,
                    auth_settings,
                    _return_http_data_only,
                    collection_formats,
                    _preload_content,
                    _request_timeout,
                ),
            )
        return thread

    def request(
        self,
        method,
        url,
        query_params=None,
        headers=None,
        post_params=None,
        body=None,
        _preload_content=True,
        _request_timeout=None,
    ):
        """Makes the HTTP request using RESTClient."""
        if method == "GET":
            return self.rest_client.GET(
                url,
                query_params=query_params,
                _preload_content=_preload_content,
                _request_timeout=_request_timeout,
                headers=headers,
            )
        elif method == "HEAD":
            return self.rest_client.HEAD(
                url,
                query_params=query_params,
                _preload_content=_preload_content,
                _request_timeout=_request_timeout,
                headers=headers,
            )
        elif method == "OPTIONS":
            return self.rest_client.OPTIONS(
                url,
                query_params=query_params,
                headers=headers,
                post_params=post_params,
                _preload_content=_preload_content,
                _request_timeout=_request_timeout,
                body=body,
            )
        elif method == "POST":
            return self.rest_client.POST(
                url,
                query_params=query_params,
                headers=headers,
                post_params=post_params,
                _preload_content=_preload_content,
                _request_timeout=_request_timeout,
                body=body,
            )
        elif method == "PUT":
            return self.rest_client.PUT(
                url,
                query_params=query_params,
                headers=headers,
                post_params=post_params,
                _preload_content=_preload_content,
                _request_timeout=_request_timeout,
                body=body,
            )
        elif method == "PATCH":
            return self.rest_client.PATCH(
                url,
                query_params=query_params,
                headers=headers,
                post_params=post_params,
                _preload_content=_preload_content,
                _request_timeout=_request_timeout,
                body=body,
            )
        elif method == "DELETE":
            return self.rest_client.DELETE(
                url,
                query_params=query_params,
                headers=headers,
                _preload_content=_preload_content,
                _request_timeout=_request_timeout,
                body=body,
            )
        else:
            raise ValueError(
                "http method must be `GET`, `HEAD`, `OPTIONS`,"
                " `POST`, `PATCH`, `PUT` or `DELETE`."
            )

    def parameters_to_tuples(self, params, collection_formats):
        """Get parameters as list of tuples, formatting collections.

        :param params: Parameters as dict or list of two-tuples
        :param dict collection_formats: Parameter collection formats
        :return: Parameters as list of tuples, collections formatted
        """
        new_params = []
        if collection_formats is None:
            collection_formats = {}
        for k, v in (
            six.iteritems(params) if isinstance(params, dict) else params
        ):  # noqa: E501
            if k in collection_formats:
                collection_format = collection_formats[k]
                if collection_format == "multi":
                    new_params.extend((k, value) for value in v)
                else:
                    if collection_format == "ssv":
                        delimiter = " "
                    elif collection_format == "tsv":
                        delimiter = "\t"
                    elif collection_format == "pipes":
                        delimiter = "|"
                    else:  # csv is the default
                        delimiter = ","
                    new_params.append(
                        (k, delimiter.join(str(value) for value in v))
                    )
            else:
                new_params.append((k, v))
        return new_params

    def prepare_post_parameters(self, post_params=None, files=None):
        """Builds form parameters.

        :param post_params: Normal form parameters.
        :param files: File parameters.
        :return: Form parameters with files.
        """
        params = []

        if post_params:
            params = post_params

        if files:
            for k, v in six.iteritems(files):
                if not v:
                    continue
                file_names = v if type(v) is list else [v]
                for n in file_names:
                    with open(n, "rb") as f:
                        filename = os.path.basename(f.name)
                        filedata = f.read()
                        mimetype = (
                            mimetypes.guess_type(filename)[0]
                            or "application/octet-stream"
                        )
                        params.append(
                            tuple([k, tuple([filename, filedata, mimetype])])
                        )

        return params

    def select_header_accept(self, accepts):
        """Returns `Accept` based on an array of accepts provided.

        :param accepts: List of headers.
        :return: Accept (e.g. application/json).
        """
        if not accepts:
            return

        accepts = [x.lower() for x in accepts]

        if "application/json" in accepts:
            return "application/json"
        else:
            return ", ".join(accepts)

    def select_header_content_type(self, content_types):
        """Returns `Content-Type` based on an array of content_types provided.

        :param content_types: List of content-types.
        :return: Content-Type (e.g. application/json).
        """
        if not content_types:
            return "application/json"

        content_types = [x.lower() for x in content_types]

        if "application/json" in content_types or "*/*" in content_types:
            return "application/json"
        else:
            return content_types[0]

    def update_params_for_auth(self, headers, querys, auth_settings):
        """Updates header and query params based on authentication setting.

        :param headers: Header parameters dict to be updated.
        :param querys: Query parameters tuple list to be updated.
        :param auth_settings: Authentication setting identifiers list.
        """
        if not auth_settings:
            return

        for auth in auth_settings:
            auth_setting = self.configuration.auth_settings().get(auth)
            if auth_setting:
                if not auth_setting["value"]:
                    continue
                elif auth_setting["in"] == "header":
                    headers[auth_setting["key"]] = auth_setting["value"]
                elif auth_setting["in"] == "query":
                    querys.append((auth_setting["key"], auth_setting["value"]))
                else:
                    raise ValueError(
                        "Authentication token must be in `query` or `header`"
                    )

    def __deserialize_file(self, response):
        """Deserializes body to file

        Saves response body into a file in a temporary folder,
        using the filename from the `Content-Disposition` header if provided.

        :param response:  RESTResponse.
        :return: file path.
        """
        fd, path = tempfile.mkstemp(dir=self.configuration.temp_folder_path)
        os.close(fd)
        os.remove(path)

        content_disposition = response.getheader("Content-Disposition")
        if content_disposition:
            filename = re.search(
                r'filename=[\'"]?([^\'"\s]+)[\'"]?', content_disposition
            ).group(1)
            path = os.path.join(os.path.dirname(path), filename)

        with open(path, "wb") as f:
            f.write(response.data)

        return path

    def __deserialize_primitive(self, data, klass):
        """Deserializes string to primitive type.

        :param data: str.
        :param klass: class literal.

        :return: int, long, float, str, bool.
        """
        try:
            return klass(data)
        except UnicodeEncodeError:
            return six.text_type(data)
        except TypeError:
            return data

    def __deserialize_object(self, value):
        """Return an original value.

        :return: object.
        """
        return value

    def __deserialize_date(self, string):
        """Deserializes string to date.

        :param string: str.
        :return: date.
        """
        try:
            from dateutil.parser import parse

            return parse(string).date()
        except ImportError:
            return string
        except ValueError:
            raise rest.ApiException(
                status=0,
                reason="Failed to parse `{0}` as date object".format(string),
            )

    def __deserialize_datatime(self, string):
        """Deserializes string to datetime.

        The string should be in iso8601 datetime format.

        :param string: str.
        :return: datetime.
        """
        try:
            from dateutil.parser import parse

            return parse(string)
        except ImportError:
            return string
        except ValueError:
            raise rest.ApiException(
                status=0,
                reason=(
                    "Failed to parse `{0}` as datetime object".format(string)
                ),
            )

    def __deserialize_model(self, data, klass):
        """Deserializes list or dict to model.

        :param data: dict, list.
        :param klass: class literal.
        :return: model object.
        """

        if not klass.openapi_types and not hasattr(
            klass, "get_real_child_model"
        ):
            return data

        kwargs = {}
        if klass.openapi_types is not None:
            for attr, attr_type in six.iteritems(klass.openapi_types):
                if (
                    data is not None
                    and klass.attribute_map[attr] in data
                    and isinstance(data, (list, dict))
                ):
                    value = data[klass.attribute_map[attr]]
                    kwargs[attr] = self.__deserialize(value, attr_type)

        instance = klass(**kwargs)

        if hasattr(instance, "get_real_child_model"):
            klass_name = instance.get_real_child_model(data)
            if klass_name:
                instance = self.__deserialize(data, klass_name)
        return instance
