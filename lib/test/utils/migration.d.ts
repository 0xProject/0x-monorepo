import { SupportedProvider } from '@0x/subproviders';
import { TxData } from 'ethereum-types';
import { OwnableContract, SimpleFunctionRegistryContract, TokenSpenderContract, TransformERC20Contract, ZeroExContract } from '../wrappers';
export interface BootstrapFeatures {
    registry: SimpleFunctionRegistryContract;
    ownable: OwnableContract;
}
export declare function deployBootstrapFeaturesAsync(provider: SupportedProvider, txDefaults: Partial<TxData>, features?: Partial<BootstrapFeatures>): Promise<BootstrapFeatures>;
export declare function initialMigrateAsync(owner: string, provider: SupportedProvider, txDefaults: Partial<TxData>, features?: Partial<BootstrapFeatures>): Promise<ZeroExContract>;
export interface FullFeatures extends BootstrapFeatures {
    tokenSpender: TokenSpenderContract;
    transformERC20: TransformERC20Contract;
}
export interface FullMigrationOpts {
    transformerDeployer: string;
}
export declare function deployFullFeaturesAsync(provider: SupportedProvider, txDefaults: Partial<TxData>, features?: Partial<FullFeatures>): Promise<FullFeatures>;
export declare function fullMigrateAsync(owner: string, provider: SupportedProvider, txDefaults: Partial<TxData>, features?: Partial<FullFeatures>, opts?: Partial<FullMigrationOpts>): Promise<ZeroExContract>;
export declare function toFeatureAdddresses<T extends BootstrapFeatures | FullFeatures | (BootstrapFeatures & FullFeatures)>(features: T): {
    [name in keyof T]: string;
};
//# sourceMappingURL=migration.d.ts.map