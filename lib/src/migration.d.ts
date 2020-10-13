import { SupportedProvider } from '@0x/subproviders';
import { TxData } from 'ethereum-types';
import { IZeroExContract, ZeroExContract } from './wrappers';
/**
 * Addresses of minimum features for a deployment of the Exchange Proxy.
 */
export interface BootstrapFeatures {
    registry: string;
    ownable: string;
}
/**
 * Deploy the minimum features of the Exchange Proxy.
 */
export declare function deployBootstrapFeaturesAsync(provider: SupportedProvider, txDefaults: Partial<TxData>, features?: Partial<BootstrapFeatures>): Promise<BootstrapFeatures>;
/**
 * Migrate an instance of the Exchange proxy with minimum viable features.
 */
export declare function initialMigrateAsync(owner: string, provider: SupportedProvider, txDefaults: Partial<TxData>, features?: Partial<BootstrapFeatures>): Promise<ZeroExContract>;
/**
 * Addresses of features for a full deployment of the Exchange Proxy.
 */
export interface FullFeatures extends BootstrapFeatures {
    tokenSpender: string;
    transformERC20: string;
    signatureValidator: string;
    metaTransactions: string;
}
/**
 * Extra configuration options for a full migration of the Exchange Proxy.
 */
export interface FullMigrationOpts {
    transformerDeployer: string;
}
/**
 * Deploy all the features for a full Exchange Proxy.
 */
export declare function deployFullFeaturesAsync(provider: SupportedProvider, txDefaults: Partial<TxData>, zeroExAddress: string, features?: Partial<FullFeatures>): Promise<FullFeatures>;
/**
 * Deploy a fully featured instance of the Exchange Proxy.
 */
export declare function fullMigrateAsync(owner: string, provider: SupportedProvider, txDefaults: Partial<TxData>, features?: Partial<FullFeatures>, opts?: Partial<FullMigrationOpts>): Promise<IZeroExContract>;
//# sourceMappingURL=migration.d.ts.map