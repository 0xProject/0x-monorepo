<!--
changelogUtils.file is auto-generated using the monorepo-scripts package. Don't edit directly.
Edit the package's CHANGELOG.json file only.
-->

CHANGELOG

## v2.4.0-beta.4 - _December 2, 2019_

    * Dependencies updated

## v2.4.0-beta.3 - _November 20, 2019_

    * Dependencies updated

## v2.4.0-beta.2 - _November 17, 2019_

    * Dependencies updated

## v2.4.0-beta.1 - _November 7, 2019_

    * Dependencies updated

## v2.4.0-beta.0 - _October 3, 2019_

    * `revertWith` mocha extensions now accept Promise-like objects instead of just Promises (#2031)
    * Add `shouldAllowUnlimitedContractSize` to `Web3Config`. (#2075)
    * Add `UNLIMITED_CONTRACT_SIZE` to `EnvVars`. (#2075)
    * Add `total_accounts` option to `Web3Config`. (#2109)
    * Add `chaiSetup` function with `RevertError` testing support (#1761)
    * Refactor out `Error` coercion code into the `utils` package (#1819)

## v2.3.3 - _September 17, 2019_

    * Dependencies updated

## v2.3.2 - _September 3, 2019_

    * Dependencies updated

## v2.3.1 - _August 22, 2019_

    * Dependencies updated

## v2.3.0 - _August 8, 2019_

    * Move `tokenUtils` here from `@0x/contract-wrappers` (#2037)

## v2.2.6 - _July 31, 2019_

    * Dependencies updated

## v2.2.5 - _July 24, 2019_

    * Dependencies updated

## v2.2.4 - _July 13, 2019_

    * Dependencies updated

## v2.2.3 - _May 24, 2019_

    * Dependencies updated

## v2.2.2 - _May 10, 2019_

    * Dependencies updated

## v2.2.1 - _April 11, 2019_

    * Dependencies updated

## v2.2.0 - _March 21, 2019_

    * Added `startProviderEngine` to `providerUtils`. Preventing excess block polling (#1695)

## v2.1.4 - _March 20, 2019_

    * Dependencies updated

## v2.1.3 - _March 1, 2019_

    * Dependencies updated

## v2.1.2 - _February 26, 2019_

    * Dependencies updated

## v2.1.1 - _February 25, 2019_

    * Dependencies updated

## v2.1.0 - _February 9, 2019_

    * Allow using the Web3Factory in-process Ganache provider with existing DB snapshot (#1602)

## v2.0.2 - _February 7, 2019_

    * Dependencies updated

## v2.0.1 - _February 6, 2019_

    * Dependencies updated

## v2.0.0 - _February 5, 2019_

    * Upgrade the bignumber.js to v8.0.2 (#1517)

## v1.0.24 - _January 15, 2019_

    * Dependencies updated

## v1.0.23 - _January 11, 2019_

    * Dependencies updated

## v1.0.22 - _January 9, 2019_

    * Dependencies updated

## v1.0.21 - _December 13, 2018_

    * Dependencies updated

## v1.0.20 - _December 11, 2018_

    * Dependencies updated

## v1.0.19 - _November 28, 2018_

    * Dependencies updated

## v1.0.18 - _November 21, 2018_

    * Dependencies updated

## v1.0.17 - _November 14, 2018_

    * Dependencies updated

## v1.0.16 - _November 13, 2018_

    * Dependencies updated

## v1.0.15 - _November 12, 2018_

    * Dependencies updated

## v1.0.14 - _November 9, 2018_

    * Dependencies updated

## v1.0.13 - _October 18, 2018_

    * Make web3-provider-engine types a 'dependency' so it's available to users of the library (#1105)

## v1.0.12 - _October 4, 2018_

    * Dependencies updated

## v1.0.11 - _September 28, 2018_

    * Dependencies updated

## v1.0.10 - _September 25, 2018_

    * Dependencies updated

## v1.0.9 - _September 25, 2018_

    * Dependencies updated

## v1.0.8 - _September 21, 2018_

    * Dependencies updated

## v1.0.7 - _September 5, 2018_

    * Dependencies updated

## v1.0.6 - _August 27, 2018_

    * Dependencies updated

## v1.0.5 - _August 24, 2018_

    * Dependencies updated

## v1.0.4 - _August 14, 2018_

    * Dependencies updated

## v1.0.3 - _July 26, 2018_

    * Dependencies updated

## v1.0.2 - _July 26, 2018_

    * Dependencies updated

## v1.0.1 - _July 23, 2018_

    * Dependencies updated

## v1.0.0 - _July 19, 2018_

    * Dependencies updated

## v0.4.6 - _July 18, 2018_

    * Dependencies updated

## v0.4.5 - _July 9, 2018_

    * Dependencies updated

## v0.4.4 - _June 19, 2018_

    * Dependencies updated

## v0.4.3 - _May 22, 2018_

    * Add optional parameter shouldUseFakeGasEstimate to Web3Config (#622)
    * Add SolidityProfiler to EnvVars (#675)

## v0.4.2 - _May 22, 2018_

    * Pass SolCompilerArtifactAdapter to CoverageSubprovider (#589)
    * Move callbackErrorReporter over from 0x.js (#579)

## v0.4.1 - _May 4, 2018_

    * Dependencies updated

## v0.4.0 - _May 4, 2018_

    * Update web3 provider engine to 14.0.4 (#555)

## v0.3.6 - _April 18, 2018_

    * Allow an rpcURL to be set in Web3Config (for testnet RPC endpoints) (#524)

## v0.3.5 - _April 11, 2018_

    * Dependencies updated

## v0.3.4 - _April 2, 2018_

    * Dependencies updated

## v0.3.3 - _April 2, 2018_

    * Dependencies updated

## v0.3.1 - _March 17, 2018_

    * Reduce npm package size by adding an `.npmignore` file.
    * Move `@0xproject/web3-wrapper` to dependencies from devDependencies.

## v0.3.0 - _March 17, 2018_

    * Add coverage subprovider if SOLIDITY_COVERAGE env variable is true (#426)
    * Refactor `BlockchainLifecycle` to work with in-process ganache (#426)
    * Remove `RPC` class and move it's logic to `Web3Wrapper` (#426)

## v0.2.0 - _February 15, 2018_

    * Remove subproviders (#392)

## v0.0.12 - _February 8, 2018_

    * Fix publishing issue where .npmignore was not properly excluding undesired content (#389)

## v0.0.11 - _February 6, 2018_

    * Updated `types-ethereumjs-util` dev dependency (#352)
