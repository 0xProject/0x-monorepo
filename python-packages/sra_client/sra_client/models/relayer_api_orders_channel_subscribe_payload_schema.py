# coding: utf-8

"""
    Standard Relayer REST API

    # Schemas  The [JSON schemas](http://json-schema.org/) for the API payloads and responses can be found in [@0xproject/json-schemas](https://github.com/0xProject/0x.js/tree/development/packages/json-schemas). Examples of each payload and response can be found in the library's [test suite](https://github.com/0xProject/0x.js/blob/development/packages/json-schemas/test/schema_test.ts#L1).  ```bash npm install @0xproject/json-schemas --save ```  You can easily validate your API's payloads and responses using the [@0xproject/json-schemas](https://github.com/0xProject/0x.js/tree/development/packages/json-schemas) package:  ```js import {SchemaValidator, ValidatorResult, schemas} from '@0xproject/json-schemas';  const {relayerApiTokenPairsResponseSchema} = schemas; const validator = new SchemaValidator();  const tokenPairsResponse = {     ... }; const validatorResult: ValidatorResult = validator.validate(tokenPairsResponse, relayerApiTokenPairsResponseSchema); ```  # Pagination  Requests that return potentially large collections should respond to the **?page** and **?perPage** parameters. For example:  ```bash $ curl https://api.example-relayer.com/v2/asset_pairs?page=3&perPage=20 ```  Page numbering should be 1-indexed, not 0-indexed. If a query provides an unreasonable (ie. too high) `perPage` value, the response can return a validation error as specified in the [errors section](#section/Errors). If the query specifies a `page` that does not exist (ie. there are not enough `records`), the response should just return an empty `records` array.  All endpoints that are paginated should return a `total`, `page`, `perPage` and a `records` value in the top level of the collection. The value of `total` should be the total number of records for a given query, whereas `records` should be an array representing the response to the query for that page. `page` and `perPage`, are the same values that were specified in the request. See the note in [miscellaneous](#section/Misc.) about formatting `snake_case` vs. `lowerCamelCase`.  These requests include the [`/v2/asset_pairs`](#operation/getAssetPairs), [`/v2/orders`](#operation/getOrders), [`/v2/fee_recipients`](#operation/getFeeRecipients) and [`/v2/orderbook`](#operation/getOrderbook) endpoints.  # Network Id  All requests should be able to specify a **?networkId** query param for all supported networks. For example:  ```bash $ curl https://api.example-relayer.com/v2/asset_pairs?networkId=1 ```  If the query param is not provided, it should default to **1** (mainnet).  Networks and their Ids:  | Network Id | Network Name | | ---------- | ------------ | | 1          | Mainnet      | | 42         | Kovan        | | 3          | Ropsten      | | 4          | Rinkeby      |  If a certain network is not supported, the response should **400** as specified in the [error response](#section/Errors) section. For example:  ```json {     \"code\": 100,     \"reason\": \"Validation failed\",     \"validationErrors\": [         {             \"field\": \"networkId\",             \"code\": 1006,             \"reason\": \"Network id 42 is not supported\"         }     ] } ```  # Link Header  A [Link Header](https://tools.ietf.org/html/rfc5988) can be included in a response to provide clients with more context about paging For example:  ```bash Link: <https://api.example-relayer.com/v2/asset_pairs?page=3&perPage=20>; rel=\"next\", <https://api.github.com/user/repos?page=10&perPage=20>; rel=\"last\" ```  This `Link` response header contains one or more Hypermedia link relations.  The possible `rel` values are:  | Name  | Description                                                   | | ----- | ------------------------------------------------------------- | | next  | The link relation for the immediate next page of results.     | | last  | The link relation for the last page of results.               | | first | The link relation for the first page of results.              | | prev  | The link relation for the immediate previous page of results. |  # Rate Limits  Rate limit guidance for clients can be optionally returned in the response headers:  | Header Name           | Description                                                                  | | --------------------- | ---------------------------------------------------------------------------- | | X-RateLimit-Limit     | The maximum number of requests you're permitted to make per hour.            | | X-RateLimit-Remaining | The number of requests remaining in the current rate limit window.           | | X-RateLimit-Reset     | The time at which the current rate limit window resets in UTC epoch seconds. |  For example:  ```bash $ curl -i https://api.example-relayer.com/v2/asset_pairs HTTP/1.1 200 OK Date: Mon, 20 Oct 2017 12:30:06 GMT Status: 200 OK X-RateLimit-Limit: 60 X-RateLimit-Remaining: 56 X-RateLimit-Reset: 1372700873 ```  When a rate limit is exceeded, a status of **429 Too Many Requests** should be returned.  # Errors  Unless the spec defines otherwise, errors to bad requests should respond with HTTP 4xx or status codes.  ## Common error codes  | Code | Reason                                  | | ---- | --------------------------------------- | | 400  | Bad Request – Invalid request format    | | 404  | Not found                               | | 429  | Too many requests - Rate limit exceeded | | 500  | Internal Server Error                   | | 501  | Not Implemented                         |  ## Error reporting format  For all **400** responses, see the [error response schema](https://github.com/0xProject/0x-monorepo/blob/development/packages/json-schemas/schemas/relayer_api_error_response_schema.ts#L1).  ```json {     \"code\": 101,     \"reason\": \"Validation failed\",     \"validationErrors\": [         {             \"field\": \"maker\",             \"code\": 1002,             \"reason\": \"Invalid address\"         }     ] } ```  General error codes:  ```bash 100 - Validation Failed 101 - Malformed JSON 102 - Order submission disabled 103 - Throttled ```  Validation error codes:  ```bash 1000 - Required field 1001 - Incorrect format 1002 - Invalid address 1003 - Address not supported 1004 - Value out of range 1005 - Invalid signature or hash 1006 - Unsupported option ```  # Asset Data Encoding  As we now support multiple [token transfer proxies](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#assetproxy), the identifier of which proxy to use for the token transfer must be encoded, along with the token information. Each proxy in 0x v2 has a unique identifier. If you're using 0x.js there will be helper methods for this [encoding](https://0xproject.com/docs/0x.js#zeroEx-encodeERC20AssetData) and [decoding](https://0xproject.com/docs/0x.js#zeroEx-decodeAssetProxyId).  The identifier for the Proxy uses a similar scheme to [ABI function selectors](https://github.com/ethereum/wiki/wiki/Ethereum-Contract-ABI#function-selector).  ```js // ERC20 Proxy ID  0xf47261b0 bytes4(keccak256('ERC20Token(address)')); // ERC721 Proxy ID 0x02571792 bytes4(keccak256('ERC721Token(address,uint256)')); ```  Asset data is encoded using [ABI encoding](https://solidity.readthedocs.io/en/develop/abi-spec.html).  For example, encoding the ERC20 token contract (address: 0x1dc4c1cefef38a777b15aa20260a54e584b16c48) using the ERC20 Transfer Proxy (id: 0xf47261b0) would be:  ```bash 0xf47261b00000000000000000000000001dc4c1cefef38a777b15aa20260a54e584b16c48 ```  Encoding the ERC721 token contract (address: `0x371b13d97f4bf77d724e78c16b7dc74099f40e84`), token id (id: `99`, which hex encoded is `0x63`) and the ERC721 Transfer Proxy (id: 0x02571792) would be:  ```bash 0x02571792000000000000000000000000371b13d97f4bf77d724e78c16b7dc74099f40e840000000000000000000000000000000000000000000000000000000000000063 ```  For more information see [the Asset Proxy](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#erc20proxy) section of the v2 spec and the [Ethereum ABI Spec](https://solidity.readthedocs.io/en/develop/abi-spec.html).  # Meta Data in Order Responses  In v2 of the standard relayer API we added the `metaData` field. It is meant to provide a standard place for relayers to put optional, custom or non-standard fields that may of interest to the consumer of the API.  A good example of such a field is `remainingTakerAssetAmount`, which is a convenience field that communicates how much of a 0x order is potentially left to be filled. Unlike the other fields in a 0x order, it is not guaranteed to be correct as it is derived from whatever mechanism the implementer (ie. the relayer) is using. While convenient for prototyping and low stakes situations, we recommend validating the value of the field by checking the state of the blockchain yourself, such as by using [Order Watcher](https://0xproject.com/wiki#0x-OrderWatcher).  # Misc.  *   All requests and responses should be of **application/json** content type *   All token amounts are sent in amounts of the smallest level of precision (base units). (e.g if a token has 18 decimal places, selling 1 token would show up as selling `'1000000000000000000'` units by this API). *   All addresses are sent as lower-case (non-checksummed) Ethereum addresses with the `0x` prefix. *   All parameters are to be written in `lowerCamelCase`.   # noqa: E501

    OpenAPI spec version: 2.0.0
    Generated by: https://openapi-generator.tech
"""


import pprint
import re  # noqa: F401

import six


class RelayerApiOrdersChannelSubscribePayloadSchema(object):
    """NOTE: This class is auto generated by OpenAPI Generator.
    Ref: https://openapi-generator.tech

    Do not edit the class manually.
    """

    """
    Attributes:
      openapi_types (dict): The key is attribute name
                            and the value is attribute type.
      attribute_map (dict): The key is attribute name
                            and the value is json key in definition.
    """
    openapi_types = {
        "maker_asset_proxy_id": "str",
        "taker_asset_proxy_id": "str",
        "network_id": "float",
        "maker_asset_address": "str",
        "taker_asset_address": "str",
        "maker_asset_data": "str",
        "taker_asset_data": "str",
        "trader_asset_data": "str",
    }

    attribute_map = {
        "maker_asset_proxy_id": "makerAssetProxyId",
        "taker_asset_proxy_id": "takerAssetProxyId",
        "network_id": "networkId",
        "maker_asset_address": "makerAssetAddress",
        "taker_asset_address": "takerAssetAddress",
        "maker_asset_data": "makerAssetData",
        "taker_asset_data": "takerAssetData",
        "trader_asset_data": "traderAssetData",
    }

    def __init__(
        self,
        maker_asset_proxy_id=None,
        taker_asset_proxy_id=None,
        network_id=None,
        maker_asset_address=None,
        taker_asset_address=None,
        maker_asset_data=None,
        taker_asset_data=None,
        trader_asset_data=None,
    ):  # noqa: E501
        """RelayerApiOrdersChannelSubscribePayloadSchema - a model defined in OpenAPI"""  # noqa: E501

        self._maker_asset_proxy_id = None
        self._taker_asset_proxy_id = None
        self._network_id = None
        self._maker_asset_address = None
        self._taker_asset_address = None
        self._maker_asset_data = None
        self._taker_asset_data = None
        self._trader_asset_data = None
        self.discriminator = None

        if maker_asset_proxy_id is not None:
            self.maker_asset_proxy_id = maker_asset_proxy_id
        if taker_asset_proxy_id is not None:
            self.taker_asset_proxy_id = taker_asset_proxy_id
        if network_id is not None:
            self.network_id = network_id
        if maker_asset_address is not None:
            self.maker_asset_address = maker_asset_address
        if taker_asset_address is not None:
            self.taker_asset_address = taker_asset_address
        if maker_asset_data is not None:
            self.maker_asset_data = maker_asset_data
        if taker_asset_data is not None:
            self.taker_asset_data = taker_asset_data
        if trader_asset_data is not None:
            self.trader_asset_data = trader_asset_data

    @property
    def maker_asset_proxy_id(self):
        """Gets the maker_asset_proxy_id of this RelayerApiOrdersChannelSubscribePayloadSchema.  # noqa: E501


        :return: The maker_asset_proxy_id of this RelayerApiOrdersChannelSubscribePayloadSchema.  # noqa: E501
        :rtype: str
        """
        return self._maker_asset_proxy_id

    @maker_asset_proxy_id.setter
    def maker_asset_proxy_id(self, maker_asset_proxy_id):
        """Sets the maker_asset_proxy_id of this RelayerApiOrdersChannelSubscribePayloadSchema.


        :param maker_asset_proxy_id: The maker_asset_proxy_id of this RelayerApiOrdersChannelSubscribePayloadSchema.  # noqa: E501
        :type: str
        """
        if maker_asset_proxy_id is not None and not re.search(
            r"^0x(([0-9a-f][0-9a-f])+)?$", maker_asset_proxy_id
        ):  # noqa: E501
            raise ValueError(
                r"Invalid value for `maker_asset_proxy_id`, must be a follow pattern or equal to `/^0x(([0-9a-f][0-9a-f])+)?$/`"
            )  # noqa: E501

        self._maker_asset_proxy_id = maker_asset_proxy_id

    @property
    def taker_asset_proxy_id(self):
        """Gets the taker_asset_proxy_id of this RelayerApiOrdersChannelSubscribePayloadSchema.  # noqa: E501


        :return: The taker_asset_proxy_id of this RelayerApiOrdersChannelSubscribePayloadSchema.  # noqa: E501
        :rtype: str
        """
        return self._taker_asset_proxy_id

    @taker_asset_proxy_id.setter
    def taker_asset_proxy_id(self, taker_asset_proxy_id):
        """Sets the taker_asset_proxy_id of this RelayerApiOrdersChannelSubscribePayloadSchema.


        :param taker_asset_proxy_id: The taker_asset_proxy_id of this RelayerApiOrdersChannelSubscribePayloadSchema.  # noqa: E501
        :type: str
        """
        if taker_asset_proxy_id is not None and not re.search(
            r"^0x(([0-9a-f][0-9a-f])+)?$", taker_asset_proxy_id
        ):  # noqa: E501
            raise ValueError(
                r"Invalid value for `taker_asset_proxy_id`, must be a follow pattern or equal to `/^0x(([0-9a-f][0-9a-f])+)?$/`"
            )  # noqa: E501

        self._taker_asset_proxy_id = taker_asset_proxy_id

    @property
    def network_id(self):
        """Gets the network_id of this RelayerApiOrdersChannelSubscribePayloadSchema.  # noqa: E501


        :return: The network_id of this RelayerApiOrdersChannelSubscribePayloadSchema.  # noqa: E501
        :rtype: float
        """
        return self._network_id

    @network_id.setter
    def network_id(self, network_id):
        """Sets the network_id of this RelayerApiOrdersChannelSubscribePayloadSchema.


        :param network_id: The network_id of this RelayerApiOrdersChannelSubscribePayloadSchema.  # noqa: E501
        :type: float
        """

        self._network_id = network_id

    @property
    def maker_asset_address(self):
        """Gets the maker_asset_address of this RelayerApiOrdersChannelSubscribePayloadSchema.  # noqa: E501


        :return: The maker_asset_address of this RelayerApiOrdersChannelSubscribePayloadSchema.  # noqa: E501
        :rtype: str
        """
        return self._maker_asset_address

    @maker_asset_address.setter
    def maker_asset_address(self, maker_asset_address):
        """Sets the maker_asset_address of this RelayerApiOrdersChannelSubscribePayloadSchema.


        :param maker_asset_address: The maker_asset_address of this RelayerApiOrdersChannelSubscribePayloadSchema.  # noqa: E501
        :type: str
        """
        if maker_asset_address is not None and not re.search(
            r"^0x[0-9a-f]{40}$", maker_asset_address
        ):  # noqa: E501
            raise ValueError(
                r"Invalid value for `maker_asset_address`, must be a follow pattern or equal to `/^0x[0-9a-f]{40}$/`"
            )  # noqa: E501

        self._maker_asset_address = maker_asset_address

    @property
    def taker_asset_address(self):
        """Gets the taker_asset_address of this RelayerApiOrdersChannelSubscribePayloadSchema.  # noqa: E501


        :return: The taker_asset_address of this RelayerApiOrdersChannelSubscribePayloadSchema.  # noqa: E501
        :rtype: str
        """
        return self._taker_asset_address

    @taker_asset_address.setter
    def taker_asset_address(self, taker_asset_address):
        """Sets the taker_asset_address of this RelayerApiOrdersChannelSubscribePayloadSchema.


        :param taker_asset_address: The taker_asset_address of this RelayerApiOrdersChannelSubscribePayloadSchema.  # noqa: E501
        :type: str
        """
        if taker_asset_address is not None and not re.search(
            r"^0x[0-9a-f]{40}$", taker_asset_address
        ):  # noqa: E501
            raise ValueError(
                r"Invalid value for `taker_asset_address`, must be a follow pattern or equal to `/^0x[0-9a-f]{40}$/`"
            )  # noqa: E501

        self._taker_asset_address = taker_asset_address

    @property
    def maker_asset_data(self):
        """Gets the maker_asset_data of this RelayerApiOrdersChannelSubscribePayloadSchema.  # noqa: E501


        :return: The maker_asset_data of this RelayerApiOrdersChannelSubscribePayloadSchema.  # noqa: E501
        :rtype: str
        """
        return self._maker_asset_data

    @maker_asset_data.setter
    def maker_asset_data(self, maker_asset_data):
        """Sets the maker_asset_data of this RelayerApiOrdersChannelSubscribePayloadSchema.


        :param maker_asset_data: The maker_asset_data of this RelayerApiOrdersChannelSubscribePayloadSchema.  # noqa: E501
        :type: str
        """
        if maker_asset_data is not None and not re.search(
            r"^0x(([0-9a-f][0-9a-f])+)?$", maker_asset_data
        ):  # noqa: E501
            raise ValueError(
                r"Invalid value for `maker_asset_data`, must be a follow pattern or equal to `/^0x(([0-9a-f][0-9a-f])+)?$/`"
            )  # noqa: E501

        self._maker_asset_data = maker_asset_data

    @property
    def taker_asset_data(self):
        """Gets the taker_asset_data of this RelayerApiOrdersChannelSubscribePayloadSchema.  # noqa: E501


        :return: The taker_asset_data of this RelayerApiOrdersChannelSubscribePayloadSchema.  # noqa: E501
        :rtype: str
        """
        return self._taker_asset_data

    @taker_asset_data.setter
    def taker_asset_data(self, taker_asset_data):
        """Sets the taker_asset_data of this RelayerApiOrdersChannelSubscribePayloadSchema.


        :param taker_asset_data: The taker_asset_data of this RelayerApiOrdersChannelSubscribePayloadSchema.  # noqa: E501
        :type: str
        """
        if taker_asset_data is not None and not re.search(
            r"^0x(([0-9a-f][0-9a-f])+)?$", taker_asset_data
        ):  # noqa: E501
            raise ValueError(
                r"Invalid value for `taker_asset_data`, must be a follow pattern or equal to `/^0x(([0-9a-f][0-9a-f])+)?$/`"
            )  # noqa: E501

        self._taker_asset_data = taker_asset_data

    @property
    def trader_asset_data(self):
        """Gets the trader_asset_data of this RelayerApiOrdersChannelSubscribePayloadSchema.  # noqa: E501


        :return: The trader_asset_data of this RelayerApiOrdersChannelSubscribePayloadSchema.  # noqa: E501
        :rtype: str
        """
        return self._trader_asset_data

    @trader_asset_data.setter
    def trader_asset_data(self, trader_asset_data):
        """Sets the trader_asset_data of this RelayerApiOrdersChannelSubscribePayloadSchema.


        :param trader_asset_data: The trader_asset_data of this RelayerApiOrdersChannelSubscribePayloadSchema.  # noqa: E501
        :type: str
        """
        if trader_asset_data is not None and not re.search(
            r"^0x(([0-9a-f][0-9a-f])+)?$", trader_asset_data
        ):  # noqa: E501
            raise ValueError(
                r"Invalid value for `trader_asset_data`, must be a follow pattern or equal to `/^0x(([0-9a-f][0-9a-f])+)?$/`"
            )  # noqa: E501

        self._trader_asset_data = trader_asset_data

    def to_dict(self):
        """Returns the model properties as a dict"""
        result = {}

        for attr, _ in six.iteritems(self.openapi_types):
            value = getattr(self, attr)
            if isinstance(value, list):
                result[attr] = list(
                    map(
                        lambda x: x.to_dict() if hasattr(x, "to_dict") else x,
                        value,
                    )
                )
            elif hasattr(value, "to_dict"):
                result[attr] = value.to_dict()
            elif isinstance(value, dict):
                result[attr] = dict(
                    map(
                        lambda item: (item[0], item[1].to_dict())
                        if hasattr(item[1], "to_dict")
                        else item,
                        value.items(),
                    )
                )
            else:
                result[attr] = value

        return result

    def to_str(self):
        """Returns the string representation of the model"""
        return pprint.pformat(self.to_dict())

    def __repr__(self):
        """For `print` and `pprint`"""
        return self.to_str()

    def __eq__(self, other):
        """Returns true if both objects are equal"""
        if not isinstance(
            other, RelayerApiOrdersChannelSubscribePayloadSchema
        ):
            return False

        return self.__dict__ == other.__dict__

    def __ne__(self, other):
        """Returns true if both objects are not equal"""
        return not self == other
