# coding: utf-8


import pprint
import re  # noqa: F401

import six


class RelayerApiOrderSchema(object):
    """
    Attributes:
      openapi_types (dict): The key is attribute name
                            and the value is attribute type.
      attribute_map (dict): The key is attribute name
                            and the value is json key in definition.
    """
    openapi_types = {"order": "OrderSchema", "meta_data": "object"}

    attribute_map = {"order": "order", "meta_data": "metaData"}

    def __init__(self, order=None, meta_data=None):  # noqa: E501
        """RelayerApiOrderSchema - a model defined in OpenAPI"""  # noqa: E501

        self._order = None
        self._meta_data = None
        self.discriminator = None

        self.order = order
        self.meta_data = meta_data

    @property
    def order(self):
        """Gets the order of this RelayerApiOrderSchema.


        :return: The order of this RelayerApiOrderSchema.
        :rtype: OrderSchema
        """
        return self._order

    @order.setter
    def order(self, order):
        """Sets the order of this RelayerApiOrderSchema.


        :param order: The order of this RelayerApiOrderSchema.
        :type: OrderSchema
        """
        if order is None:
            raise ValueError(
                "Invalid value for `order`, must not be `None`"
            )  # noqa: E501

        self._order = order

    @property
    def meta_data(self):
        """Gets the meta_data of this RelayerApiOrderSchema.


        :return: The meta_data of this RelayerApiOrderSchema.
        :rtype: object
        """
        return self._meta_data

    @meta_data.setter
    def meta_data(self, meta_data):
        """Sets the meta_data of this RelayerApiOrderSchema.


        :param meta_data: The meta_data of this RelayerApiOrderSchema.
        :type: object
        """
        if meta_data is None:
            raise ValueError(
                "Invalid value for `meta_data`, must not be `None`"
            )  # noqa: E501

        self._meta_data = meta_data

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
        if not isinstance(other, RelayerApiOrderSchema):
            return False

        return self.__dict__ == other.__dict__

    def __ne__(self, other):
        """Returns true if both objects are not equal"""
        return not self == other
