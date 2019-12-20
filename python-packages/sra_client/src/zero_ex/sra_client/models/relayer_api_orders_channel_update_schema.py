# coding: utf-8


import pprint
import re  # noqa: F401

import six


class RelayerApiOrdersChannelUpdateSchema(object):
    """
    Attributes:
      openapi_types (dict): The key is attribute name
                            and the value is attribute type.
      attribute_map (dict): The key is attribute name
                            and the value is json key in definition.
    """
    openapi_types = {
        "type": "str",
        "channel": "str",
        "request_id": "str",
        "payload": "list[RelayerApiOrderSchema]",
    }

    attribute_map = {
        "type": "type",
        "channel": "channel",
        "request_id": "requestId",
        "payload": "payload",
    }

    def __init__(
        self, type=None, channel=None, request_id=None, payload=None
    ):  # noqa: E501
        """RelayerApiOrdersChannelUpdateSchema - a model defined in OpenAPI"""  # noqa: E501

        self._type = None
        self._channel = None
        self._request_id = None
        self._payload = None
        self.discriminator = None

        self.type = type
        self.channel = channel
        self.request_id = request_id
        if payload is not None:
            self.payload = payload

    @property
    def type(self):
        """Gets the type of this RelayerApiOrdersChannelUpdateSchema.


        :return: The type of this RelayerApiOrdersChannelUpdateSchema.
        :rtype: str
        """
        return self._type

    @type.setter
    def type(self, type):
        """Sets the type of this RelayerApiOrdersChannelUpdateSchema.


        :param type: The type of this RelayerApiOrdersChannelUpdateSchema.
        :type: str
        """
        if type is None:
            raise ValueError(
                "Invalid value for `type`, must not be `None`"
            )  # noqa: E501
        allowed_values = ["update"]  # noqa: E501
        if type not in allowed_values:
            raise ValueError(
                "Invalid value for `type` ({0}), must be one of {1}".format(  # noqa: E501
                    type, allowed_values
                )
            )

        self._type = type

    @property
    def channel(self):
        """Gets the channel of this RelayerApiOrdersChannelUpdateSchema.


        :return: The channel of this RelayerApiOrdersChannelUpdateSchema.
        :rtype: str
        """
        return self._channel

    @channel.setter
    def channel(self, channel):
        """Sets the channel of this RelayerApiOrdersChannelUpdateSchema.


        :param channel: The channel of this RelayerApiOrdersChannelUpdateSchema.
        :type: str
        """
        if channel is None:
            raise ValueError(
                "Invalid value for `channel`, must not be `None`"
            )  # noqa: E501
        allowed_values = ["orders"]  # noqa: E501
        if channel not in allowed_values:
            raise ValueError(
                "Invalid value for `channel` ({0}), must be one of {1}".format(  # noqa: E501
                    channel, allowed_values
                )
            )

        self._channel = channel

    @property
    def request_id(self):
        """Gets the request_id of this RelayerApiOrdersChannelUpdateSchema.


        :return: The request_id of this RelayerApiOrdersChannelUpdateSchema.
        :rtype: str
        """
        return self._request_id

    @request_id.setter
    def request_id(self, request_id):
        """Sets the request_id of this RelayerApiOrdersChannelUpdateSchema.


        :param request_id: The request_id of this RelayerApiOrdersChannelUpdateSchema.
        :type: str
        """
        if request_id is None:
            raise ValueError(
                "Invalid value for `request_id`, must not be `None`"
            )  # noqa: E501

        self._request_id = request_id

    @property
    def payload(self):
        """Gets the payload of this RelayerApiOrdersChannelUpdateSchema.


        :return: The payload of this RelayerApiOrdersChannelUpdateSchema.
        :rtype: list[RelayerApiOrderSchema]
        """
        return self._payload

    @payload.setter
    def payload(self, payload):
        """Sets the payload of this RelayerApiOrdersChannelUpdateSchema.


        :param payload: The payload of this RelayerApiOrdersChannelUpdateSchema.
        :type: list[RelayerApiOrderSchema]
        """

        self._payload = payload

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
        if not isinstance(other, RelayerApiOrdersChannelUpdateSchema):
            return False

        return self.__dict__ == other.__dict__

    def __ne__(self, other):
        """Returns true if both objects are not equal"""
        return not self == other
