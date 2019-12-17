# coding: utf-8


import pprint
import re  # noqa: F401

import six


class RelayerApiOrderConfigResponseSchema(object):
    """
    Attributes:
      openapi_types (dict): The key is attribute name
                            and the value is attribute type.
      attribute_map (dict): The key is attribute name
                            and the value is json key in definition.
    """
    openapi_types = {
        "maker_fee": "str",
        "taker_fee": "str",
        "fee_recipient_address": "str",
        "sender_address": "str",
    }

    attribute_map = {
        "maker_fee": "makerFee",
        "taker_fee": "takerFee",
        "fee_recipient_address": "feeRecipientAddress",
        "sender_address": "senderAddress",
    }

    def __init__(
        self,
        maker_fee=None,
        taker_fee=None,
        fee_recipient_address=None,
        sender_address=None,
    ):  # noqa: E501
        """RelayerApiOrderConfigResponseSchema - a model defined in OpenAPI"""  # noqa: E501

        self._maker_fee = None
        self._taker_fee = None
        self._fee_recipient_address = None
        self._sender_address = None
        self.discriminator = None

        self.maker_fee = maker_fee
        self.taker_fee = taker_fee
        self.fee_recipient_address = fee_recipient_address
        self.sender_address = sender_address

    @property
    def maker_fee(self):
        """Gets the maker_fee of this RelayerApiOrderConfigResponseSchema.


        :return: The maker_fee of this RelayerApiOrderConfigResponseSchema.
        :rtype: str
        """
        return self._maker_fee

    @maker_fee.setter
    def maker_fee(self, maker_fee):
        """Sets the maker_fee of this RelayerApiOrderConfigResponseSchema.


        :param maker_fee: The maker_fee of this RelayerApiOrderConfigResponseSchema.
        :type: str
        """
        if maker_fee is None:
            raise ValueError(
                "Invalid value for `maker_fee`, must not be `None`"
            )  # noqa: E501
        if maker_fee is not None and not re.search(
            r"^\d+$", maker_fee
        ):  # noqa: E501
            raise ValueError(
                r"Invalid value for `maker_fee`, must be a follow pattern or equal to `/^\d+$/`"
            )  # noqa: E501

        self._maker_fee = maker_fee

    @property
    def taker_fee(self):
        """Gets the taker_fee of this RelayerApiOrderConfigResponseSchema.


        :return: The taker_fee of this RelayerApiOrderConfigResponseSchema.
        :rtype: str
        """
        return self._taker_fee

    @taker_fee.setter
    def taker_fee(self, taker_fee):
        """Sets the taker_fee of this RelayerApiOrderConfigResponseSchema.


        :param taker_fee: The taker_fee of this RelayerApiOrderConfigResponseSchema.
        :type: str
        """
        if taker_fee is None:
            raise ValueError(
                "Invalid value for `taker_fee`, must not be `None`"
            )  # noqa: E501
        if taker_fee is not None and not re.search(
            r"^\d+$", taker_fee
        ):  # noqa: E501
            raise ValueError(
                r"Invalid value for `taker_fee`, must be a follow pattern or equal to `/^\d+$/`"
            )  # noqa: E501

        self._taker_fee = taker_fee

    @property
    def fee_recipient_address(self):
        """Gets the fee_recipient_address of this RelayerApiOrderConfigResponseSchema.


        :return: The fee_recipient_address of this RelayerApiOrderConfigResponseSchema.
        :rtype: str
        """
        return self._fee_recipient_address

    @fee_recipient_address.setter
    def fee_recipient_address(self, fee_recipient_address):
        """Sets the fee_recipient_address of this RelayerApiOrderConfigResponseSchema.


        :param fee_recipient_address: The fee_recipient_address of this RelayerApiOrderConfigResponseSchema.
        :type: str
        """
        if fee_recipient_address is None:
            raise ValueError(
                "Invalid value for `fee_recipient_address`, must not be `None`"
            )  # noqa: E501
        if fee_recipient_address is not None and not re.search(
            r"^0x[0-9a-f]{40}$", fee_recipient_address
        ):  # noqa: E501
            raise ValueError(
                r"Invalid value for `fee_recipient_address`, must be a follow pattern or equal to `/^0x[0-9a-f]{40}$/`"
            )  # noqa: E501

        self._fee_recipient_address = fee_recipient_address

    @property
    def sender_address(self):
        """Gets the sender_address of this RelayerApiOrderConfigResponseSchema.


        :return: The sender_address of this RelayerApiOrderConfigResponseSchema.
        :rtype: str
        """
        return self._sender_address

    @sender_address.setter
    def sender_address(self, sender_address):
        """Sets the sender_address of this RelayerApiOrderConfigResponseSchema.


        :param sender_address: The sender_address of this RelayerApiOrderConfigResponseSchema.
        :type: str
        """
        if sender_address is None:
            raise ValueError(
                "Invalid value for `sender_address`, must not be `None`"
            )  # noqa: E501
        if sender_address is not None and not re.search(
            r"^0x[0-9a-f]{40}$", sender_address
        ):  # noqa: E501
            raise ValueError(
                r"Invalid value for `sender_address`, must be a follow pattern or equal to `/^0x[0-9a-f]{40}$/`"
            )  # noqa: E501

        self._sender_address = sender_address

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
        if not isinstance(other, RelayerApiOrderConfigResponseSchema):
            return False

        return self.__dict__ == other.__dict__

    def __ne__(self, other):
        """Returns true if both objects are not equal"""
        return not self == other
