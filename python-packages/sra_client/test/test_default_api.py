"""Test the default api client"""
# coding: utf-8


from __future__ import absolute_import

import unittest

import sra_client


class TestDefaultApi(unittest.TestCase):
    """DefaultApi unit test stubs"""

    def setUp(self):
        self.api = sra_client.api.default_api.DefaultApi()  # noqa: E501

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
                        "assetData": "0xf47261b0000000000000000000000000"
                        "d0a1e359811322d97991e03f863a0c30c2cf029c",
                        "maxAmount": "115792089237316195423570985008687907853"
                        "269984665640564039457584007913129639936",
                        "minAmount": "0",
                        "precision": 18,
                    },
                    "assetDataB": {
                        "assetData": "0xf47261b0000000000000000000000000"
                        "2002d3812f58e35f0ea1ffbf80a75a38c32175fa",
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
