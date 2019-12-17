# coding: utf-8


import pprint
import re  # noqa: F401

import six


class RelayerApiOrderbookResponseSchema(object):
    """
    Attributes:
      openapi_types (dict): The key is attribute name
                            and the value is attribute type.
      attribute_map (dict): The key is attribute name
                            and the value is json key in definition.
    """
    openapi_types = {
        "bids": "RelayerApiOrdersResponseSchema",
        "asks": "RelayerApiOrdersResponseSchema",
    }

    attribute_map = {"bids": "bids", "asks": "asks"}

    def __init__(self, bids=None, asks=None):  # noqa: E501
        """RelayerApiOrderbookResponseSchema - a model defined in OpenAPI"""  # noqa: E501

        self._bids = None
        self._asks = None
        self.discriminator = None

        self.bids = bids
        self.asks = asks

    @property
    def bids(self):
        """Gets the bids of this RelayerApiOrderbookResponseSchema.


        :return: The bids of this RelayerApiOrderbookResponseSchema.
        :rtype: RelayerApiOrdersResponseSchema
        """
        return self._bids

    @bids.setter
    def bids(self, bids):
        """Sets the bids of this RelayerApiOrderbookResponseSchema.


        :param bids: The bids of this RelayerApiOrderbookResponseSchema.
        :type: RelayerApiOrdersResponseSchema
        """
        if bids is None:
            raise ValueError(
                "Invalid value for `bids`, must not be `None`"
            )  # noqa: E501

        self._bids = bids

    @property
    def asks(self):
        """Gets the asks of this RelayerApiOrderbookResponseSchema.


        :return: The asks of this RelayerApiOrderbookResponseSchema.
        :rtype: RelayerApiOrdersResponseSchema
        """
        return self._asks

    @asks.setter
    def asks(self, asks):
        """Sets the asks of this RelayerApiOrderbookResponseSchema.


        :param asks: The asks of this RelayerApiOrderbookResponseSchema.
        :type: RelayerApiOrdersResponseSchema
        """
        if asks is None:
            raise ValueError(
                "Invalid value for `asks`, must not be `None`"
            )  # noqa: E501

        self._asks = asks

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
        if not isinstance(other, RelayerApiOrderbookResponseSchema):
            return False

        return self.__dict__ == other.__dict__

    def __ne__(self, other):
        """Returns true if both objects are not equal"""
        return not self == other
