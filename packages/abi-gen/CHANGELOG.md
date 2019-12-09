<!--
changelogUtils.file is auto-generated using the monorepo-scripts package. Don't edit directly.
Edit the package's CHANGELOG.json file only.
-->

CHANGELOG

## v5.0.1 - _December 9, 2019_

    * Dependencies updated

## v5.0.0 - _December 2, 2019_

    * Refactored TS wrapper templates to result in a more succint interface. See https://github.com/0xProject/0x-monorepo/pull/2325 for details. (#2284)
    * Python: Corrected return types and values for call() interface to generated method wrappers.  (Fixes #2298) (#2345)
    * Python: Stopped generating send_transaction() interface for constant (view/pure) methods (#2345)
    * Python: Added a build_transaction() interface to contract method classes (#2345)
    * Python: Removed `validator` argument to contract method classes for methods that don't have any inputs (#2345)
    * Python: Changed the names of generated tuples to use the `internalType` field in the ABI, if it's present, resulting in human readable struct names rather than hashes of component field names. (#2345)
    * Moved shared logic into `BaseContract` helpers to reduce size. (#2343)
    * Re-enable gas estimation when `gas` is not provided. (#2343)
    * In Python wrappers, accept string arguments to bytes parameters (#2284)
    * In Python wrappers, support module-local, Web3.py-compatible middleware (#2284)
    * In Python wrappers, allow contracts to be instantiated with EITHER a Web3.py BaseProvider OR a Web3 client object (#2284)
    * In Python wrappers, fix bug with casting some bytes objects using bytes.fromhex() (#2284)
    * Add `getSelector` method to all functions (#2224)
    * Command-line argument network-id has changed to chain-id (#2313)
    * Fix templates not being included in published tarball (#2315)

## v4.4.0-beta.4 - _December 2, 2019_

    * Dependencies updated

## v4.4.0-beta.3 - _November 20, 2019_

    * Dependencies updated

## v4.4.0-beta.2 - _November 17, 2019_

    * Refactored TS wrapper templates to result in a more succint interface. See https://github.com/0xProject/0x-monorepo/pull/2325 for details. (#2284)
    * Python: Corrected return types and values for call() interface to generated method wrappers.  (Fixes #2298) (#2345)
    * Python: Stopped generating send_transaction() interface for constant (view/pure) methods (#2345)
    * Python: Added a build_transaction() interface to contract method classes (#2345)
    * Python: Removed `validator` argument to contract method classes for methods that don't have any inputs (#2345)
    * Python: Changed the names of generated tuples to use the `internalType` field in the ABI, if it's present, resulting in human readable struct names rather than hashes of component field names. (#2345)
    * Moved shared logic into `BaseContract` helpers to reduce size. (#2343)
    * Re-enable gas estimation when `gas` is not provided. (#2343)

## v4.4.0-beta.1 - _November 7, 2019_

    * In Python wrappers, accept string arguments to bytes parameters (#2284)
    * In Python wrappers, support module-local, Web3.py-compatible middleware (#2284)
    * In Python wrappers, allow contracts to be instantiated with EITHER a Web3.py BaseProvider OR a Web3 client object (#2284)
    * In Python wrappers, fix bug with casting some bytes objects using bytes.fromhex() (#2284)
    * Add `getSelector` method to all functions (#2224)
    * Command-line argument network-id has changed to chain-id (#2313)
    * Fix templates not being included in published tarball (#2315)

## v4.3.0-beta.0 - _October 3, 2019_

    * Dependencies updated

## v4.2.1 - _September 17, 2019_

    * Redirect to `evmExecAsync` to use local EVM instead of eth_call for pure functions (#2108)

## v4.2.0 - _September 3, 2019_

    * Provide a default set of templates for code generation, used when --template and --partials are left unspecified (#2082)

## v4.1.1 - _August 22, 2019_

    * Dependencies updated

## v4.1.0 - _August 8, 2019_

    * Updated expected typescript output for cli tests to include `getABIDecodedTransactionData` and `getABIDecodedReturnData` (#2018)
    * Added tests for`getABIDecodedTransactionData` and `getABIDecodedReturnData` in contract wrappers. (#2018)

## v4.0.0 - _Invalid date_

    * whitespace changes to generated Python code (#1996)
    * move Python Validator base class from generated code to common package (#1996)
    * Changed fundamental thing-to-be-wrapped from the contract to the contract method.  That is, now there is a base contract method wrapper class rather than a base contract wrapper class, and individual contract methods are represented by named classes inheriting from that base, and the different operations on a method are now represented by a nested-object dot notation, ie, WrappedContract.ContractMethod.call() and WrappedContract.ContractMethod.send_transaction(). (#1996)
    * added gas estimation functionality to contract methods (#1996)
    * Python: fixed bug with methods returning multiple values (#1996)
    * Python: fixed bug with methods returning arrays of structs (#1996)
    * Python: fixed bug with methods that return a struct that contains another struct where the inner struct was not otherwise directly referenced by any method (#1996)
    * Python: fixed bug with tuples sometimes being used before they were declared (#1996)
    * Python: fixed bug with supporting overloaded methods (#1996)

## v3.1.2 - _July 31, 2019_

    * Dependencies updated

## v3.1.1 - _July 24, 2019_

    * Python method parameters are now in snake case (#1919)
    * Python wrappers now support tuples in method parameters (#1919)
    * document Python method's bytes params as requiring UTF-8 (#1919)
    * generate Python output into a contract-named folder, not a file (eg exchange/__init__.py rather than exchange.py) leaving space for user-defined additions to the same module, such as for custom types, as used by the Exchange wrapper's manually-written type aliases in the contract_wrappers.exchange.types Python module (#1919)
    * support for customizable parameter validation for Python wrappers (#1919)
    * wrap Python docstrings better, for pydocstyle compliance (#1919)
    * lots of fixes to satisfy linters of generated Python code (#1919)

## v2.1.1 - _July 13, 2019_

    * Dependencies updated

## v2.1.0 - _July 13, 2019_

    * Initial support for Python (#1878)

## v2.0.11 - _Invalid date_

    * Watch template files for changes (#1875)

## v2.0.10 - _May 10, 2019_

    * Dependencies updated

## v2.0.9 - _April 11, 2019_

    * Dependencies updated

## v2.0.8 - _March 21, 2019_

    * Dependencies updated

## v2.0.7 - _March 20, 2019_

    * Dependencies updated

## v2.0.6 - _March 1, 2019_

    * Dependencies updated

## v2.0.5 - _February 26, 2019_

    * Dependencies updated

## v2.0.4 - _February 25, 2019_

    * Dependencies updated

## v2.0.3 - _February 9, 2019_

    * Dependencies updated

## v2.0.2 - _February 7, 2019_

    * Dependencies updated

## v2.0.1 - _February 6, 2019_

    * Dependencies updated

## v2.0.0 - _February 5, 2019_

    * Upgrade the bignumber.js to v8.0.2 (#1517)

## v1.0.22 - _January 15, 2019_

    * Dependencies updated

## v1.0.21 - _January 11, 2019_

    * Dependencies updated

## v1.0.20 - _January 9, 2019_

    * Dependencies updated

## v1.0.19 - _December 13, 2018_

    * Dependencies updated

## v1.0.18 - _December 11, 2018_

    * Dependencies updated

## v1.0.17 - _November 21, 2018_

    * Dependencies updated

## v1.0.16 - _November 14, 2018_

    * Dependencies updated

## v1.0.15 - _November 9, 2018_

    * Dependencies updated

## v1.0.14 - _October 18, 2018_

    * Dependencies updated

## v1.0.13 - _October 4, 2018_

    * Dependencies updated

## v1.0.12 - _September 28, 2018_

    * Dependencies updated

## v1.0.11 - _September 25, 2018_

    * Dependencies updated

## v1.0.10 - _September 25, 2018_

    * Dependencies updated

## v1.0.9 - _September 21, 2018_

    * Dependencies updated

## v1.0.8 - _September 5, 2018_

    * Dependencies updated

## v1.0.7 - _August 27, 2018_

    * Dependencies updated

## v1.0.6 - _August 24, 2018_

    * Dependencies updated

## v1.0.5 - _August 14, 2018_

    * Dependencies updated

## v1.0.4 - _July 26, 2018_

    * Dependencies updated

## v1.0.3 - _July 26, 2018_

    * Dependencies updated

## v1.0.2 - _July 26, 2018_

    * Dependencies updated

## v1.0.1 - _July 23, 2018_

    * Fix the abi-gen entry point in package.json (#901)

## v1.0.0 - _July 19, 2018_

    * Convert e_r_c to erc in generated file names (#822)
    * Remove the output directory before writing to it (#822)
    * skip generation of wrappers that are already up to date (#788)

## v0.3.4 - _July 18, 2018_

    * Dependencies updated

## v0.3.3 - _July 9, 2018_

    * Dependencies updated

## v0.3.2 - _June 19, 2018_

    * Dependencies updated

## v0.3.1 - _May 31, 2018_

    * Incorrect publish that was unpublished

## v0.3.0 - _May 22, 2018_

    * Properly export the executable binary (#588)

## v0.2.13 - _May 4, 2018_

    * Dependencies updated

## v0.2.12 - _May 4, 2018_

    * Dependencies updated

## v0.2.11 - _April 18, 2018_

    * Dependencies updated

## v0.2.10 - _April 11, 2018_

    * Dependencies updated

## v0.2.9 - _April 2, 2018_

    * Dependencies updated

## v0.2.8 - _April 2, 2018_

    * Dependencies updated

## v0.2.5 - _March 17, 2018_

    * Consolidate all `console.log` calls into `logUtils` in the `@0xproject/utils` package (#452)

## v0.2.4 - _March 3, 2018_

    * Add a `backend` parameter that allows you to specify the Ethereum library you use in your templates (`web3` or `ethers`). Ethers auto-converts small ints to numbers whereas Web3 doesn't. Defaults to `web3` (#413)
    * Add support for [tuple types](https://solidity.readthedocs.io/en/develop/abi-spec.html#handling-tuple-types) (#413)
    * Add `hasReturnValue` to context data (#413)

## v0.2.1 - _February 8, 2018_

    * Fix publishing issue where .npmignore was not properly excluding undesired content (#389)

## v0.2.0 - _February 6, 2018_

    * Added CLI options for explicit specifying location of partials and main template (#346)
    * Added CLI option to specify networkId, adding support for the JSON artifact format found in @0xproject/contracts (#388)

## v0.1.0 - _January 10, 2018_

    * Fixed array typings with union types (#295)
    * Add event ABIs to context data passed to templates (#302)
    * Add constructor ABIs to context data passed to templates (#304)
