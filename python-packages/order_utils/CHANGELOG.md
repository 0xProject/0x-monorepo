# Changelog

## 4.0.0 - 2019-12-03

-   Upgraded to protocol version 3.
-   `is_valid_signature()` now returns just a boolean. (Formerly, it returned a tuple consisting of the boolean and a reason string.)
-   Allow `sign_hash()` to be called with EITHER a Web3.py `BaseProvider` OR an already-instantiated `Web3` client object.
-   Migrated to new version of `0x-contract-addresses`.

## 3.0.1 - 2019-08-09

-   Fixed dependencies: changed `deprecated` from being an extras_require["dev"] dependency to being an install_requires dependency, since it's required not just for doc generation but also just to import the package.

## 3.0.0 - 2019-08-08

-   Major breaking changes: removal of definitions for Order, OrderInfo, order_to_jsdict, jsdict_to_order, all of which have been moved to contract_wrappers.exchange.types; removal of signature validation; migration from v4 to v5 of Web3.py

## 2.0.0 - 2019-04-30

-   Changed `ERC20AssetData` and `ERC721AssetData` to inherit from `NamedTuple` rather than `TypedDict`.
-   Deprecated methods `encode_erc20_asset_data()` and `encode_erc721_asset_data()`, in favor of new methods `encode_erc20()` and `encode_erc721()`. The old methods return a string, which is less than convenient for building orders using the provided `Order` type, which expects asset data to be `bytes`. The new methods return `bytes`.
-   Expanded documentation.
-   Stopped using deprecated web3.py interface `contract.call()` in favor of `contract.functions.X.call()`. This provides compatibility with the upcoming 5.x release of web3.py, and it also eliminates some runtime warning messages.

## 1.1.1 - 2019-02-26

-   Replaced dependency on web3 with dependency on 0x-web3, to ease coexistence of those two packages.
