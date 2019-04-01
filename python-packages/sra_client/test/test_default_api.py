"""Test the default api client"""
# coding: utf-8


from __future__ import absolute_import

import unittest

import pytest

from sra_client import ApiClient, Configuration
from sra_client.api import DefaultApi


@pytest.mark.skip(reason="Circle CI error launch kit unreachable")
class TestDefaultApi(unittest.TestCase):
    """DefaultApi unit test stubs"""

    def setUp(self):
        config = Configuration()
        config.host = "http://localhost:3000"
        self.api = DefaultApi(ApiClient(config))

    def tearDown(self):
        pass

    # pylint: disable=too-many-locals
    def test_get_asset_pairs(self):
        """Test case for get_asset_pairs

        """
        expected = {
            "records": [
                {
                    "assetDataA": {
                        "assetData": "0xf47261b00000000000000000000000000"
                        "b1ba0af832d7c05fd64161e0db78e85978e8082",
                        "maxAmount": "115792089237316195423570985008687907853"
                        "269984665640564039457584007913129639936",
                        "minAmount": "0",
                        "precision": 18,
                    },
                    "assetDataB": {
                        "assetData": "0xf47261b0000000000000000000000000"
                        "871dd7c2b4b25e1aa18728e9d5f2af4c4e431f5c",
                        "maxAmount": "115792089237316195423570985008687907853"
                        "269984665640564039457584007913129639936",
                        "minAmount": "0",
                        "precision": 18,
                    },
                }
            ]
        }

        actual = self.api.get_asset_pairs()

        acutal_asset_data_a = actual.records[0]["assetDataA"]["assetData"]
        expected_asset_data_a = expected["records"][0]["assetDataA"][
            "assetData"
        ]
        self.assertEqual(acutal_asset_data_a, expected_asset_data_a)
        acutal_max_amount_a = actual.records[0]["assetDataA"]["maxAmount"]
        expected_max_amount_a = expected["records"][0]["assetDataA"][
            "maxAmount"
        ]
        self.assertEqual(acutal_max_amount_a, expected_max_amount_a)
        acutal_min_amount_a = actual.records[0]["assetDataA"]["minAmount"]
        expected_min_amount_a = expected["records"][0]["assetDataA"][
            "minAmount"
        ]
        self.assertEqual(acutal_min_amount_a, expected_min_amount_a)
        acutal_precision_a = actual.records[0]["assetDataA"]["precision"]
        expected_precision_a = expected["records"][0]["assetDataA"][
            "precision"
        ]
        self.assertEqual(acutal_precision_a, expected_precision_a)

        acutal_asset_data_b = actual.records[0]["assetDataB"]["assetData"]
        expected_asset_data_b = expected["records"][0]["assetDataB"][
            "assetData"
        ]
        self.assertEqual(acutal_asset_data_b, expected_asset_data_b)
        acutal_max_amount_b = actual.records[0]["assetDataB"]["maxAmount"]
        expected_max_amount_b = expected["records"][0]["assetDataB"][
            "maxAmount"
        ]
        self.assertEqual(acutal_max_amount_b, expected_max_amount_b)
        acutal_min_amount_b = actual.records[0]["assetDataB"]["minAmount"]
        expected_min_amount_b = expected["records"][0]["assetDataB"][
            "minAmount"
        ]
        self.assertEqual(acutal_min_amount_b, expected_min_amount_b)
        acutal_precision_b = actual.records[0]["assetDataB"]["precision"]
        expected_precision_b = expected["records"][0]["assetDataB"][
            "precision"
        ]
        self.assertEqual(acutal_precision_b, expected_precision_b)


if __name__ == "__main__":
    unittest.main()
