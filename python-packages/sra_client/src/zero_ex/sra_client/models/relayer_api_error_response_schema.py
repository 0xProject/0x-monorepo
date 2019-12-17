# coding: utf-8


import pprint
import re  # noqa: F401

import six


class RelayerApiErrorResponseSchema(object):
    """
    Attributes:
      openapi_types (dict): The key is attribute name
                            and the value is attribute type.
      attribute_map (dict): The key is attribute name
                            and the value is json key in definition.
    """
    openapi_types = {
        "code": "int",
        "reason": "str",
        "validation_errors": "list[RelayerApiErrorResponseSchemaValidationErrors]",
    }

    attribute_map = {
        "code": "code",
        "reason": "reason",
        "validation_errors": "validationErrors",
    }

    def __init__(
        self, code=None, reason=None, validation_errors=None
    ):  # noqa: E501
        """RelayerApiErrorResponseSchema - a model defined in OpenAPI"""  # noqa: E501

        self._code = None
        self._reason = None
        self._validation_errors = None
        self.discriminator = None

        self.code = code
        self.reason = reason
        if validation_errors is not None:
            self.validation_errors = validation_errors

    @property
    def code(self):
        """Gets the code of this RelayerApiErrorResponseSchema.


        :return: The code of this RelayerApiErrorResponseSchema.
        :rtype: int
        """
        return self._code

    @code.setter
    def code(self, code):
        """Sets the code of this RelayerApiErrorResponseSchema.


        :param code: The code of this RelayerApiErrorResponseSchema.
        :type: int
        """
        if code is None:
            raise ValueError(
                "Invalid value for `code`, must not be `None`"
            )  # noqa: E501
        if code is not None and code > 103:  # noqa: E501
            raise ValueError(
                "Invalid value for `code`, must be a value less than or equal to `103`"
            )  # noqa: E501
        if code is not None and code < 100:  # noqa: E501
            raise ValueError(
                "Invalid value for `code`, must be a value greater than or equal to `100`"
            )  # noqa: E501

        self._code = code

    @property
    def reason(self):
        """Gets the reason of this RelayerApiErrorResponseSchema.


        :return: The reason of this RelayerApiErrorResponseSchema.
        :rtype: str
        """
        return self._reason

    @reason.setter
    def reason(self, reason):
        """Sets the reason of this RelayerApiErrorResponseSchema.


        :param reason: The reason of this RelayerApiErrorResponseSchema.
        :type: str
        """
        if reason is None:
            raise ValueError(
                "Invalid value for `reason`, must not be `None`"
            )  # noqa: E501

        self._reason = reason

    @property
    def validation_errors(self):
        """Gets the validation_errors of this RelayerApiErrorResponseSchema.


        :return: The validation_errors of this RelayerApiErrorResponseSchema.
        :rtype: list[RelayerApiErrorResponseSchemaValidationErrors]
        """
        return self._validation_errors

    @validation_errors.setter
    def validation_errors(self, validation_errors):
        """Sets the validation_errors of this RelayerApiErrorResponseSchema.


        :param validation_errors: The validation_errors of this RelayerApiErrorResponseSchema.
        :type: list[RelayerApiErrorResponseSchemaValidationErrors]
        """

        self._validation_errors = validation_errors

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
        if not isinstance(other, RelayerApiErrorResponseSchema):
            return False

        return self.__dict__ == other.__dict__

    def __ne__(self, other):
        """Returns true if both objects are not equal"""
        return not self == other
