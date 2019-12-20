# coding: utf-8


import pprint
import re  # noqa: F401

import six


class PaginatedCollectionSchema(object):
    """
    Attributes:
      openapi_types (dict): The key is attribute name
                            and the value is attribute type.
      attribute_map (dict): The key is attribute name
                            and the value is json key in definition.
    """
    openapi_types = {"total": "float", "per_page": "float", "page": "float"}

    attribute_map = {"total": "total", "per_page": "perPage", "page": "page"}

    def __init__(self, total=None, per_page=None, page=None):  # noqa: E501
        """PaginatedCollectionSchema - a model defined in OpenAPI"""  # noqa: E501

        self._total = None
        self._per_page = None
        self._page = None
        self.discriminator = None

        self.total = total
        self.per_page = per_page
        self.page = page

    @property
    def total(self):
        """Gets the total of this PaginatedCollectionSchema.  # noqa: E501


        :return: The total of this PaginatedCollectionSchema.  # noqa: E501
        :rtype: float
        """
        return self._total

    @total.setter
    def total(self, total):
        """Sets the total of this PaginatedCollectionSchema.


        :param total: The total of this PaginatedCollectionSchema.  # noqa: E501
        :type: float
        """
        if total is None:
            raise ValueError(
                "Invalid value for `total`, must not be `None`"
            )  # noqa: E501

        self._total = total

    @property
    def per_page(self):
        """Gets the per_page of this PaginatedCollectionSchema.  # noqa: E501


        :return: The per_page of this PaginatedCollectionSchema.  # noqa: E501
        :rtype: float
        """
        return self._per_page

    @per_page.setter
    def per_page(self, per_page):
        """Sets the per_page of this PaginatedCollectionSchema.


        :param per_page: The per_page of this PaginatedCollectionSchema.  # noqa: E501
        :type: float
        """
        if per_page is None:
            raise ValueError(
                "Invalid value for `per_page`, must not be `None`"
            )  # noqa: E501

        self._per_page = per_page

    @property
    def page(self):
        """Gets the page of this PaginatedCollectionSchema.  # noqa: E501


        :return: The page of this PaginatedCollectionSchema.  # noqa: E501
        :rtype: float
        """
        return self._page

    @page.setter
    def page(self, page):
        """Sets the page of this PaginatedCollectionSchema.


        :param page: The page of this PaginatedCollectionSchema.  # noqa: E501
        :type: float
        """
        if page is None:
            raise ValueError(
                "Invalid value for `page`, must not be `None`"
            )  # noqa: E501

        self._page = page

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
        if not isinstance(other, PaginatedCollectionSchema):
            return False

        return self.__dict__ == other.__dict__

    def __ne__(self, other):
        """Returns true if both objects are not equal"""
        return not self == other
