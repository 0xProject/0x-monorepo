<!--
changelogUtils.file is auto-generated using the monorepo-scripts package. Don't edit directly.
Edit the package's CHANGELOG.json file only.
-->

CHANGELOG

## v6.0.2 - _February 6, 2020_

    * Dependencies updated

## v6.0.1 - _February 4, 2020_

    * Dependencies updated

## v6.0.0 - _January 22, 2020_

    * Update Forwarder deployment (#2432)

## v5.1.0 - _January 6, 2020_

    * Added DydxBridge Contract to ContractAddresses (#2401)
    * Changed docker image command to overwrite any existing snapshot when unzipping the image downloaded from S3. (#2420)

## v5.0.2 - _December 17, 2019_

    * Dependencies updated

## v5.0.1 - _December 9, 2019_

    * Dependencies updated

## v5.0.0 - _December 2, 2019_

    * Deploy Forwarder after Exchange is configured as Staking Proxy is queried (#2368)
    * Subsequent contract addresses after the Forwarder are now modified (#2368)
    * Update Exchange, DevUtils, Coordinator, and Forwarder addresses on all networks (#2349)
    * Update StakingProxy, Staking, and ZrxVault addresses on mainnet (#2349)
    * Add UniswapBridge and Eth2DaiBridge addresses to schema, add mainnet addresses (#2349)
    * Deploy Forwarder AFTER staking is hooked up (#2350)
    * Migrations script no longer deploys DutchAuction since it is not yet upgraded for V3 of the protocol (#2324)
    * Added `Staking` and `ERC20BridgeProxy` contracts (#2323)
    * Update all contract deployments to pass the actual chain ID (rather than the network ID) via the newly modified @0x/utils/provider_utils (#2270)
    * All references to network ID have been removed, and references to chain ID have been introduced instead (#2313)
    * Update Coordinator and Exchange deployments to pass `chainId` (#1742)

## v4.4.0-beta.4 - _December 2, 2019_

    * Deploy Forwarder after Exchange is configured as Staking Proxy is queried (#2368)
    * Subsequent contract addresses after the Forwarder are now modified (#2368)

## v4.4.0-beta.3 - _November 20, 2019_

    * Update Exchange, DevUtils, Coordinator, and Forwarder addresses on all networks (#2349)
    * Update StakingProxy, Staking, and ZrxVault addresses on mainnet (#2349)
    * Add UniswapBridge and Eth2DaiBridge addresses to schema, add mainnet addresses (#2349)
    * Deploy Forwarder AFTER staking is hooked up (#2350)

## v4.4.0-beta.2 - _November 17, 2019_

    * Migrations script no longer deploys DutchAuction since it is not yet upgraded for V3 of the protocol (#2324)
    * Added `Staking` and `ERC20BridgeProxy` contracts (#2323)

## v4.4.0-beta.1 - _November 7, 2019_

    * Update all contract deployments to pass the actual chain ID (rather than the network ID) via the newly modified @0x/utils/provider_utils (#2270)
    * All references to network ID have been removed, and references to chain ID have been introduced instead (#2313)

## v4.4.0-beta.0 - _October 3, 2019_

    * Update Coordinator and Exchange deployments to pass `chainId` (#1742)

## v4.3.2 - _September 17, 2019_

    * Removed dependency on @0x/order-utils (#2096)

## v4.3.1 - _September 3, 2019_

    * Dependencies updated

## v4.3.0 - _August 22, 2019_

    * Added DevUtils to migration script (#2060)

## v4.2.0 - _August 8, 2019_

    * Added StaticCallAssetProxy and ERC1155AssetProxy (#2021)

## v4.1.11 - _July 31, 2019_

    * Updated calls to <contract wrapper>.deploy0xArtifactAsync to include log decode dependencies. (#1995)

## v4.1.10 - _July 24, 2019_

    * Dependencies updated

## v4.1.9 - _July 15, 2019_

    * Dependencies updated

## v4.1.8 - _July 13, 2019_

    * Dependencies updated

## v4.1.7 - _July 13, 2019_

    * Dependencies updated

## v4.1.6 - _May 24, 2019_

    * Dependencies updated

## v4.1.5 - _May 15, 2019_

    * Dependencies updated

## v4.1.4 - _May 14, 2019_

    * Add --pk flag to accept private key when migrating (#1811)

## v4.1.2 - _May 10, 2019_

    * Dependencies updated

## v4.1.1 - _April 11, 2019_

    * Dependencies updated

## v4.1.0 - _March 21, 2019_

    * Add deployment of `Coordinator` and `CoordinatorRegistry` contracts to migration script (#1689)
    * Added `startProviderEngine` to `providerUtils`. Preventing excess block polling (#1695)

## v4.0.4 - _March 20, 2019_

    * Dependencies updated

## v4.0.3 - _March 1, 2019_

    * Dependencies updated

## v4.0.2 - _February 27, 2019_

    * Dependencies updated

## v4.0.1 - _February 26, 2019_

    * Dependencies updated

## v4.0.0 - _February 25, 2019_

    * Replace Provider param interface with Web3ProviderEngine (#1627)

## v3.0.4 - _February 9, 2019_

    * Dependencies updated

## v3.0.3 - _February 7, 2019_

    * Dependencies updated

## v3.0.2 - _February 7, 2019_

    * Dependencies updated

## v3.0.1 - _February 6, 2019_

    * Dependencies updated

## v3.0.0 - _February 5, 2019_

    * Upgrade the bignumber.js to v8.0.2 (#1517)
    * Removed `owner` in Migrations (#1533)
    * `txDefaults` parameter now requires the `from` field (#1533)
    * Convert `from` to lower case when passed in via cli (#1533)

## v2.4.0 - _January 15, 2019_

    * Added migrations for `MultiAssetProxy` contract (#1503)

## v2.3.1 - _January 11, 2019_

    * Dependencies updated

## v2.3.0 - _January 9, 2019_

    * Added migrations for Dutch Auction contract (#1465)

## v2.2.2 - _December 13, 2018_

    * Dependencies updated

## v2.2.1 - _December 11, 2018_

    * Dependencies updated

## v2.2.0 - _November 28, 2018_

    * Add CLI `0x-migrate` for running the 0x migrations in a language-agnostic way (#1324)
    * Deploy testnet Exchange arfitact. Previously mainnet Exchange artifact was deployed. (#1309)
    * Fund the Forwarder with ZRX for fees. (#1309)

## v2.1.0 - _November 21, 2018_

    * Export all type declarations used by the public interface, as well as the `ContractAddresses` mapping (#1301)

## v2.0.4 - _November 14, 2018_

    * Dependencies updated

## v2.0.3 - _November 13, 2018_

    * Dependencies updated

## v2.0.2 - _November 12, 2018_

    * Dependencies updated

## v2.0.1 - _November 9, 2018_

    * Dependencies updated

## v2.0.0 - _October 18, 2018_

    * Contract artifacts have been moved to the new @0xproject/contract-artifacts package. v1 migrations have been removed. `runMigrationsAsync` returns the addresses of the contracts that were deployed. (#1105)

## v1.0.14 - _October 4, 2018_

    * Dependencies updated

## v1.0.13 - _September 28, 2018_

    * Dependencies updated

## v1.0.12 - _September 25, 2018_

    * Dependencies updated

## v1.0.11 - _September 25, 2018_

    * Dependencies updated

## v1.0.10 - _September 21, 2018_

    * Dependencies updated

## v1.0.9 - _September 19, 2018_

    * Dependencies updated

## v1.0.8 - _September 18, 2018_

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

    * Added migrations for 0x Protocol v2

## v0.0.10 - _July 18, 2018_

    * Dependencies updated

## v0.0.9 - _July 9, 2018_

    * Dependencies updated

## v0.0.8 - _June 19, 2018_

    * Dependencies updated

## v0.0.7 - _May 22, 2018_

    * Use AssetProxyOwner instead of MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddress (#675)

## v0.0.6 - _May 22, 2018_

    * Dependencies updated

## v0.0.5 - _May 4, 2018_

    * Dependencies updated

## v0.0.4 - _May 4, 2018_

    * Dependencies updated

## v0.0.3 - _April 18, 2018_

    * Dependencies updated
