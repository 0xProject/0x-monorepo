# coding: utf-8


import pprint
import re  # noqa: F401

import six


class SignedOrderSchema(object):
    """
    Attributes:
      openapi_types (dict): The key is attribute name
                            and the value is attribute type.
      attribute_map (dict): The key is attribute name
                            and the value is json key in definition.
    """
    openapi_types = {"signature": "str"}

    attribute_map = {"signature": "signature"}

    def __init__(self, signature=None):  # noqa: E501
        """SignedOrderSchema - a model defined in OpenAPI"""  # noqa: E501

        self._signature = None
        self.discriminator = None

        self.signature = signature

    @property
    def signature(self):
        """Gets the signature of this SignedOrderSchema.


        :return: The signature of this SignedOrderSchema.
        :rtype: str
        """
        return self._signature

    @signature.setter
    def signature(self, signature):
        """Sets the signature of this SignedOrderSchema.


        :param signature: The signature of this SignedOrderSchema.
        :type: str
        """
        if signature is None:
            raise ValueError(
                "Invalid value for `signature`, must not be `None`"
            )  # noqa: E501
        if signature is not None and not re.search(
            r"^0x(([0-9a-f][0-9a-f])+)?$", signature
        ):  # noqa: E501
            raise ValueError(
                r"Invalid value for `signature`, must be a follow pattern or equal to `/^0x(([0-9a-f][0-9a-f])+)?$/`"
            )  # noqa: E501

        self._signature = signature

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
        if not isinstance(other, SignedOrderSchema):
            return False

        return self.__dict__ == other.__dict__

    def __ne__(self, other):
        """Returns true if both objects are not equal"""
        return not self == other
