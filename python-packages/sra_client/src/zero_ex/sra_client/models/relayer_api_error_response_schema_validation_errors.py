# coding: utf-8


import pprint
import re  # noqa: F401

import six


class RelayerApiErrorResponseSchemaValidationErrors(object):
    """
    Attributes:
      openapi_types (dict): The key is attribute name
                            and the value is attribute type.
      attribute_map (dict): The key is attribute name
                            and the value is json key in definition.
    """
    openapi_types = {"field": "str", "code": "int", "reason": "str"}

    attribute_map = {"field": "field", "code": "code", "reason": "reason"}

    def __init__(self, field=None, code=None, reason=None):  # noqa: E501
        """RelayerApiErrorResponseSchemaValidationErrors - a model defined in OpenAPI"""  # noqa: E501

        self._field = None
        self._code = None
        self._reason = None
        self.discriminator = None

        self.field = field
        self.code = code
        self.reason = reason

    @property
    def field(self):
        """Gets the field of this RelayerApiErrorResponseSchemaValidationErrors.


        :return: The field of this RelayerApiErrorResponseSchemaValidationErrors.
        :rtype: str
        """
        return self._field

    @field.setter
    def field(self, field):
        """Sets the field of this RelayerApiErrorResponseSchemaValidationErrors.


        :param field: The field of this RelayerApiErrorResponseSchemaValidationErrors.
        :type: str
        """
        if field is None:
            raise ValueError(
                "Invalid value for `field`, must not be `None`"
            )  # noqa: E501

        self._field = field

    @property
    def code(self):
        """Gets the code of this RelayerApiErrorResponseSchemaValidationErrors.


        :return: The code of this RelayerApiErrorResponseSchemaValidationErrors.
        :rtype: int
        """
        return self._code

    @code.setter
    def code(self, code):
        """Sets the code of this RelayerApiErrorResponseSchemaValidationErrors.


        :param code: The code of this RelayerApiErrorResponseSchemaValidationErrors.
        :type: int
        """
        if code is None:
            raise ValueError(
                "Invalid value for `code`, must not be `None`"
            )  # noqa: E501
        if code is not None and code > 1006:  # noqa: E501
            raise ValueError(
                "Invalid value for `code`, must be a value less than or equal to `1006`"
            )  # noqa: E501
        if code is not None and code < 1000:  # noqa: E501
            raise ValueError(
                "Invalid value for `code`, must be a value greater than or equal to `1000`"
            )  # noqa: E501

        self._code = code

    @property
    def reason(self):
        """Gets the reason of this RelayerApiErrorResponseSchemaValidationErrors.


        :return: The reason of this RelayerApiErrorResponseSchemaValidationErrors.
        :rtype: str
        """
        return self._reason

    @reason.setter
    def reason(self, reason):
        """Sets the reason of this RelayerApiErrorResponseSchemaValidationErrors.


        :param reason: The reason of this RelayerApiErrorResponseSchemaValidationErrors.
        :type: str
        """
        if reason is None:
            raise ValueError(
                "Invalid value for `reason`, must not be `None`"
            )  # noqa: E501

        self._reason = reason

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
            other, RelayerApiErrorResponseSchemaValidationErrors
        ):
            return False

        return self.__dict__ == other.__dict__

    def __ne__(self, other):
        """Returns true if both objects are not equal"""
        return not self == other
