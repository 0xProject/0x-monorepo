# coding: utf-8


import pprint
import re  # noqa: F401

import six


class OrderSchema(object):
    """
    Attributes:
      openapi_types (dict): The key is attribute name
                            and the value is attribute type.
      attribute_map (dict): The key is attribute name
                            and the value is json key in definition.
    """
    openapi_types = {}

    attribute_map = {
        "maker_address": "makerAddress",
        "taker_address": "takerAddress",
        "maker_fee": "makerFee",
        "taker_fee": "takerFee",
        "sender_address": "senderAddress",
        "maker_asset_amount": "makerAssetAmount",
        "taker_asset_amount": "takerAssetAmount",
        "maker_asset_data": "makerAssetData",
        "taker_asset_data": "takerAssetData",
        "salt": "salt",
        "exchange_address": "exchangeAddress",
        "fee_recipient_address": "feeRecipientAddress",
        "expiration_time_seconds": "expirationTimeSeconds",
    }

    def __init__(
        self,
        maker_address=None,
        taker_address=None,
        maker_fee=None,
        taker_fee=None,
        sender_address=None,
        maker_asset_amount=None,
        taker_asset_amount=None,
        maker_asset_data=None,
        taker_asset_data=None,
        salt=None,
        exchange_address=None,
        fee_recipient_address=None,
        expiration_time_seconds=None,
    ):  # noqa: E501
        """OrderSchema - a model defined in OpenAPI"""  # noqa: E501

        self._maker_address = None
        self._taker_address = None
        self._maker_fee = None
        self._taker_fee = None
        self._sender_address = None
        self._maker_asset_amount = None
        self._taker_asset_amount = None
        self._maker_asset_data = None
        self._taker_asset_data = None
        self._salt = None
        self._exchange_address = None
        self._fee_recipient_address = None
        self._expiration_time_seconds = None
        self.discriminator = None

        self.maker_address = maker_address
        self.taker_address = taker_address
        self.maker_fee = maker_fee
        self.taker_fee = taker_fee
        self.sender_address = sender_address
        self.maker_asset_amount = maker_asset_amount
        self.taker_asset_amount = taker_asset_amount
        self.maker_asset_data = maker_asset_data
        self.taker_asset_data = taker_asset_data
        self.salt = salt
        self.exchange_address = exchange_address
        self.fee_recipient_address = fee_recipient_address
        self.expiration_time_seconds = expiration_time_seconds

    @property
    def maker_address(self):
        """Gets the maker_address of this OrderSchema.  # noqa: E501


        :return: The maker_address of this OrderSchema.  # noqa: E501
        :rtype: str
        """
        return self._maker_address

    @maker_address.setter
    def maker_address(self, maker_address):
        """Sets the maker_address of this OrderSchema.


        :param maker_address: The maker_address of this OrderSchema.  # noqa: E501
        :type: str
        """
        if maker_address is None:
            raise ValueError(
                "Invalid value for `maker_address`, must not be `None`"
            )  # noqa: E501
        if maker_address is not None and not re.search(
            r"^0x[0-9a-f]{40}$", maker_address
        ):  # noqa: E501
            raise ValueError(
                r"Invalid value for `maker_address`, must be a follow pattern or equal to `/^0x[0-9a-f]{40}$/`"
            )  # noqa: E501

        self._maker_address = maker_address

    @property
    def taker_address(self):
        """Gets the taker_address of this OrderSchema.  # noqa: E501


        :return: The taker_address of this OrderSchema.  # noqa: E501
        :rtype: str
        """
        return self._taker_address

    @taker_address.setter
    def taker_address(self, taker_address):
        """Sets the taker_address of this OrderSchema.


        :param taker_address: The taker_address of this OrderSchema.  # noqa: E501
        :type: str
        """
        if taker_address is None:
            raise ValueError(
                "Invalid value for `taker_address`, must not be `None`"
            )  # noqa: E501
        if taker_address is not None and not re.search(
            r"^0x[0-9a-f]{40}$", taker_address
        ):  # noqa: E501
            raise ValueError(
                r"Invalid value for `taker_address`, must be a follow pattern or equal to `/^0x[0-9a-f]{40}$/`"
            )  # noqa: E501

        self._taker_address = taker_address

    @property
    def maker_fee(self):
        """Gets the maker_fee of this OrderSchema.  # noqa: E501


        :return: The maker_fee of this OrderSchema.  # noqa: E501
        :rtype: str
        """
        return self._maker_fee

    @maker_fee.setter
    def maker_fee(self, maker_fee):
        """Sets the maker_fee of this OrderSchema.


        :param maker_fee: The maker_fee of this OrderSchema.  # noqa: E501
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
        """Gets the taker_fee of this OrderSchema.  # noqa: E501


        :return: The taker_fee of this OrderSchema.  # noqa: E501
        :rtype: str
        """
        return self._taker_fee

    @taker_fee.setter
    def taker_fee(self, taker_fee):
        """Sets the taker_fee of this OrderSchema.


        :param taker_fee: The taker_fee of this OrderSchema.  # noqa: E501
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
    def sender_address(self):
        """Gets the sender_address of this OrderSchema.  # noqa: E501


        :return: The sender_address of this OrderSchema.  # noqa: E501
        :rtype: str
        """
        return self._sender_address

    @sender_address.setter
    def sender_address(self, sender_address):
        """Sets the sender_address of this OrderSchema.


        :param sender_address: The sender_address of this OrderSchema.  # noqa: E501
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

    @property
    def maker_asset_amount(self):
        """Gets the maker_asset_amount of this OrderSchema.  # noqa: E501


        :return: The maker_asset_amount of this OrderSchema.  # noqa: E501
        :rtype: str
        """
        return self._maker_asset_amount

    @maker_asset_amount.setter
    def maker_asset_amount(self, maker_asset_amount):
        """Sets the maker_asset_amount of this OrderSchema.


        :param maker_asset_amount: The maker_asset_amount of this OrderSchema.  # noqa: E501
        :type: str
        """
        if maker_asset_amount is None:
            raise ValueError(
                "Invalid value for `maker_asset_amount`, must not be `None`"
            )  # noqa: E501
        if maker_asset_amount is not None and not re.search(
            r"^\d+$", maker_asset_amount
        ):  # noqa: E501
            raise ValueError(
                r"Invalid value for `maker_asset_amount`, must be a follow pattern or equal to `/^\d+$/`"
            )  # noqa: E501

        self._maker_asset_amount = maker_asset_amount

    @property
    def taker_asset_amount(self):
        """Gets the taker_asset_amount of this OrderSchema.  # noqa: E501


        :return: The taker_asset_amount of this OrderSchema.  # noqa: E501
        :rtype: str
        """
        return self._taker_asset_amount

    @taker_asset_amount.setter
    def taker_asset_amount(self, taker_asset_amount):
        """Sets the taker_asset_amount of this OrderSchema.


        :param taker_asset_amount: The taker_asset_amount of this OrderSchema.  # noqa: E501
        :type: str
        """
        if taker_asset_amount is None:
            raise ValueError(
                "Invalid value for `taker_asset_amount`, must not be `None`"
            )  # noqa: E501
        if taker_asset_amount is not None and not re.search(
            r"^\d+$", taker_asset_amount
        ):  # noqa: E501
            raise ValueError(
                r"Invalid value for `taker_asset_amount`, must be a follow pattern or equal to `/^\d+$/`"
            )  # noqa: E501

        self._taker_asset_amount = taker_asset_amount

    @property
    def maker_asset_data(self):
        """Gets the maker_asset_data of this OrderSchema.  # noqa: E501


        :return: The maker_asset_data of this OrderSchema.  # noqa: E501
        :rtype: str
        """
        return self._maker_asset_data

    @maker_asset_data.setter
    def maker_asset_data(self, maker_asset_data):
        """Sets the maker_asset_data of this OrderSchema.


        :param maker_asset_data: The maker_asset_data of this OrderSchema.  # noqa: E501
        :type: str
        """
        if maker_asset_data is None:
            raise ValueError(
                "Invalid value for `maker_asset_data`, must not be `None`"
            )  # noqa: E501
        if maker_asset_data is not None and not re.search(
            r"^0x(([0-9a-f][0-9a-f])+)?$", maker_asset_data
        ):  # noqa: E501
            raise ValueError(
                r"Invalid value for `maker_asset_data`, must be a follow pattern or equal to `/^0x(([0-9a-f][0-9a-f])+)?$/`"
            )  # noqa: E501

        self._maker_asset_data = maker_asset_data

    @property
    def taker_asset_data(self):
        """Gets the taker_asset_data of this OrderSchema.  # noqa: E501


        :return: The taker_asset_data of this OrderSchema.  # noqa: E501
        :rtype: str
        """
        return self._taker_asset_data

    @taker_asset_data.setter
    def taker_asset_data(self, taker_asset_data):
        """Sets the taker_asset_data of this OrderSchema.


        :param taker_asset_data: The taker_asset_data of this OrderSchema.  # noqa: E501
        :type: str
        """
        if taker_asset_data is None:
            raise ValueError(
                "Invalid value for `taker_asset_data`, must not be `None`"
            )  # noqa: E501
        if taker_asset_data is not None and not re.search(
            r"^0x(([0-9a-f][0-9a-f])+)?$", taker_asset_data
        ):  # noqa: E501
            raise ValueError(
                r"Invalid value for `taker_asset_data`, must be a follow pattern or equal to `/^0x(([0-9a-f][0-9a-f])+)?$/`"
            )  # noqa: E501

        self._taker_asset_data = taker_asset_data

    @property
    def salt(self):
        """Gets the salt of this OrderSchema.  # noqa: E501


        :return: The salt of this OrderSchema.  # noqa: E501
        :rtype: str
        """
        return self._salt

    @salt.setter
    def salt(self, salt):
        """Sets the salt of this OrderSchema.


        :param salt: The salt of this OrderSchema.  # noqa: E501
        :type: str
        """
        if salt is None:
            raise ValueError(
                "Invalid value for `salt`, must not be `None`"
            )  # noqa: E501
        if salt is not None and not re.search(r"^\d+$", salt):  # noqa: E501
            raise ValueError(
                r"Invalid value for `salt`, must be a follow pattern or equal to `/^\d+$/`"
            )  # noqa: E501

        self._salt = salt

    @property
    def exchange_address(self):
        """Gets the exchange_address of this OrderSchema.  # noqa: E501


        :return: The exchange_address of this OrderSchema.  # noqa: E501
        :rtype: str
        """
        return self._exchange_address

    @exchange_address.setter
    def exchange_address(self, exchange_address):
        """Sets the exchange_address of this OrderSchema.


        :param exchange_address: The exchange_address of this OrderSchema.  # noqa: E501
        :type: str
        """
        if exchange_address is None:
            raise ValueError(
                "Invalid value for `exchange_address`, must not be `None`"
            )  # noqa: E501
        if exchange_address is not None and not re.search(
            r"^0x[0-9a-f]{40}$", exchange_address
        ):  # noqa: E501
            raise ValueError(
                r"Invalid value for `exchange_address`, must be a follow pattern or equal to `/^0x[0-9a-f]{40}$/`"
            )  # noqa: E501

        self._exchange_address = exchange_address

    @property
    def fee_recipient_address(self):
        """Gets the fee_recipient_address of this OrderSchema.  # noqa: E501


        :return: The fee_recipient_address of this OrderSchema.  # noqa: E501
        :rtype: str
        """
        return self._fee_recipient_address

    @fee_recipient_address.setter
    def fee_recipient_address(self, fee_recipient_address):
        """Sets the fee_recipient_address of this OrderSchema.


        :param fee_recipient_address: The fee_recipient_address of this OrderSchema.  # noqa: E501
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
    def expiration_time_seconds(self):
        """Gets the expiration_time_seconds of this OrderSchema.  # noqa: E501


        :return: The expiration_time_seconds of this OrderSchema.  # noqa: E501
        :rtype: str
        """
        return self._expiration_time_seconds

    @expiration_time_seconds.setter
    def expiration_time_seconds(self, expiration_time_seconds):
        """Sets the expiration_time_seconds of this OrderSchema.


        :param expiration_time_seconds: The expiration_time_seconds of this OrderSchema.  # noqa: E501
        :type: str
        """
        if expiration_time_seconds is None:
            raise ValueError(
                "Invalid value for `expiration_time_seconds`, must not be `None`"
            )  # noqa: E501
        if expiration_time_seconds is not None and not re.search(
            r"^\d+$", expiration_time_seconds
        ):  # noqa: E501
            raise ValueError(
                r"Invalid value for `expiration_time_seconds`, must be a follow pattern or equal to `/^\d+$/`"
            )  # noqa: E501

        self._expiration_time_seconds = expiration_time_seconds

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
        if not isinstance(other, OrderSchema):
            return False

        return self.__dict__ == other.__dict__

    def __ne__(self, other):
        """Returns true if both objects are not equal"""
        return not self == other
