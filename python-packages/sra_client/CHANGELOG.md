# Changelog

## 5.0.0 - TBD

-   Renamed class DefaultApi to RelayerApi, and changed its construction parameters.
-   Updated documentation to include schemas for request payloads and responses, and to demonstrate the RelayerApi.get_order_config() method.
-   Fixed bug with numeric types not being handled properly for asset data trade info and order config methods.

## 4.0.0 - 2019-12-03

-   Migrated from v2 to v3 of the 0x protocol.

## 3.0.0 - 2019-08-08

-   Migrated from v4 to v5 of Web3.py.

## 2.0.0 - 2019-04-30

-   Moved module `sra_client` into `zero_ex` namespace.
-   Fixed regular expression that validates numeric values. Before, validation would fail for all of: maker and taker fees, maker and taker asset amounts, salt, and expiration time.
-   Expanded documentation.

## 1.0.0 - 2018-12-11

-   Initial release.
