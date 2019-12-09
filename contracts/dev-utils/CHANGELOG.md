<!--
changelogUtils.file is auto-generated using the monorepo-scripts package. Don't edit directly.
Edit the package's CHANGELOG.json file only.
-->

CHANGELOG

## v1.0.1 - _December 9, 2019_

    * Dependencies updated

## v1.0.0 - _December 2, 2019_

    * Drastically reduced bundle size by adding .npmignore, only exporting specific artifacts/wrappers/utils (#2330)
    * Add new method getOrderHash() to DevUtils contract (#2321)
    * Add new method getTransactionHash() to DevUtils contract (#2321)
    * Add `encodeStaticCallAssetData` and `decodeStaticCallAssetData` in LibAssetData (#2034)
    * Add `revertIfInvalidAssetData` in LibAssetData (#2034)
    * Use built in selectors instead of hard coded constants (#2055)
    * Compile and export all contracts, artifacts, and wrappers by default (#2055)
    * Add `marketBuy/SellOrdersNoThrow` and `marketBuy/SellOrdersFillOrKill` to `LibTransactionDecoder`. (#2075)
    * `run_mocha` package script runs with `UNLIMITED_CONTRACT_SIZE=true` environment variable. (#2075)

## v0.1.0-beta.4 - _December 2, 2019_

    * Dependencies updated

## v0.1.0-beta.3 - _November 20, 2019_

    * Dependencies updated

## v0.1.0-beta.2 - _November 17, 2019_

    * Drastically reduced bundle size by adding .npmignore, only exporting specific artifacts/wrappers/utils (#2330)
    * Add new method getOrderHash() to DevUtils contract (#2321)
    * Add new method getTransactionHash() to DevUtils contract (#2321)

## v0.1.0-beta.1 - _November 7, 2019_

    * Add `encodeStaticCallAssetData` and `decodeStaticCallAssetData` in LibAssetData (#2034)
    * Add `revertIfInvalidAssetData` in LibAssetData (#2034)

## v0.1.0-beta.0 - _October 3, 2019_

    * Use built in selectors instead of hard coded constants (#2055)
    * Compile and export all contracts, artifacts, and wrappers by default (#2055)
    * Add `marketBuy/SellOrdersNoThrow` and `marketBuy/SellOrdersFillOrKill` to `LibTransactionDecoder`. (#2075)
    * `run_mocha` package script runs with `UNLIMITED_CONTRACT_SIZE=true` environment variable. (#2075)

## v0.0.10 - _September 17, 2019_

    * Dependencies updated

## v0.0.9 - _September 3, 2019_

    * Dependencies updated

## v0.0.8 - _August 22, 2019_

    * Dependencies updated

## v0.0.7 - _August 8, 2019_

    * Dependencies updated

## v0.0.6 - _July 31, 2019_

    * Dependencies updated

## v0.0.5 - _July 31, 2019_

    * Updated calls to <contract wrapper>.deployFrom0xArtifactAsync to include artifact dependencies. (#1995)

## v0.0.5 - _July 24, 2019_

    * Dependencies updated

## v0.0.4 - _July 15, 2019_

    * Dependencies updated

## v0.0.3 - _July 13, 2019_

    * Dependencies updated

## v0.0.2 - _July 13, 2019_

    * Dependencies updated

## v0.0.1 - _Invalid date_

    * Create dev-utils package (#1848)
    * Add `LibAssetData` and `LibTransactionDecoder` contracts (#1848)
    * Refactor `LibAssetData` to only check 0x-specific allowances (#1848)
    * Refactor `LibAssetData` balance/allowance checks to never revert (#1848)
    * Refactor `OrderValidationUtils` to calculate `fillableTakerAssetAmount` (#1848)
    * Add support for StaticCallProxy (#1863)
    * Add `OrderTransferSimulationUtils` contract for simulating order transfers on-chain (#1868)
    * Updated to use the new rich error pattern from @0x/contracts-exchange (#1913)
