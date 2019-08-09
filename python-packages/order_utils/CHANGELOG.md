# Changelog

## 3.0.0 - 2019-08-08

-   Major breaking changes: removal of definitions for Order, OrderInfo, order_to_jsdict, jsdict_to_order, all of which have been moved to contract_wrappers.exchange.types; removal of signature validation; migration from v4 to v5 of Web3.py

## 2.0.0 - 2019-04-30

-   Changed `ERC20AssetData` and `ERC721AssetData` to inherit from `NamedTuple` rather than `TypedDict`.
-   Deprecated methods `encode_erc20_asset_data()` and `encode_erc721_asset_data()`, in favor of new methods `encode_erc20()` and `encode_erc721()`. The old methods return a string, which is less than convenient for building orders using the provided `Order` type, which expects asset data to be `bytes`. The new methods return `bytes`.
-   Expanded documentation.
-   Stopped using deprecated web3.py interface `contract.call()` in favor of `contract.functions.X.call()`. This provides compatibility with the upcoming 5.x release of web3.py, and it also eliminates some runtime warning messages.

## 1.1.1 - 2019-02-26

-   Replaced dependency on web3 with dependency on 0x-web3, to ease coexistence of those two packages.
