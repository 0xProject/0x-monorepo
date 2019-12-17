# coding: utf-8


import pprint
import re  # noqa: F401

import six


class RelayerApiAssetDataPairsResponseSchema(object):
    """
    Attributes:
      openapi_types (dict): The key is attribute name
                            and the value is attribute type.
      attribute_map (dict): The key is attribute name
                            and the value is json key in definition.
    """
    openapi_types = {"records": "list[object]"}

    attribute_map = {"records": "records"}

    def __init__(self, records=None):  # noqa: E501
        """RelayerApiAssetDataPairsResponseSchema - a model defined in OpenAPI"""  # noqa: E501

        self._records = None
        self.discriminator = None

        self.records = records

    @property
    def records(self):
        """Gets the records of this RelayerApiAssetDataPairsResponseSchema.

        :return: The records of this RelayerApiAssetDataPairsResponseSchema.
        :rtype: list[object]
        """
        return self._records

    @records.setter
    def records(self, records):
        """Sets the records of this RelayerApiAssetDataPairsResponseSchema.

        :param records: The records of this RelayerApiAssetDataPairsResponseSchema.
        :type: list[object]
        """
        if records is None:
            raise ValueError(
                "Invalid value for `records`, must not be `None`"
            )  # noqa: E501

        self._records = records

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
        if not isinstance(other, RelayerApiAssetDataPairsResponseSchema):
            return False

        return self.__dict__ == other.__dict__

    def __ne__(self, other):
        """Returns true if both objects are not equal"""
        return not self == other
