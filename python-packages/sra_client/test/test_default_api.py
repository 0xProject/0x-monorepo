# coding: utf-8


from __future__ import absolute_import

import unittest

import sra_client
from sra_client.api.default_api import DefaultApi  # noqa: E501
from sra_client.models.relayer_api_asset_data_pairs_response_schema import (
    RelayerApiAssetDataPairsResponseSchema
)
from sra_client.rest import ApiException


class TestDefaultApi(unittest.TestCase):
    """DefaultApi unit test stubs"""

    def setUp(self):
        self.api = sra_client.api.default_api.DefaultApi()  # noqa: E501

    def tearDown(self):
        pass

    def test_get_asset_pairs(self):
        """Test case for get_asset_pairs

        """
        expected = RelayerApiAssetDataPairsResponseSchema([])
        actual = self.api.get_asset_pairs()
        self.assertEqual(actual, expected)


if __name__ == "__main__":
    unittest.main()
