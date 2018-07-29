export interface UpdatedPackage {
    name: string;
    version: string;
    private: boolean;
}

export interface Change {
    note: string;
    pr?: number;
}

export type Changelog = VersionChangelog[];

export interface VersionChangelog {
    timestamp?: number;
    version: string;
    changes: Change[];
}

export interface PackageToNextVersion {
    [name: string]: string;
}

export interface PackageRegistryJson {
    versions: {
        [version: string]: any;
    };
    time: {
        [version: string]: string;
    };
}

export interface GitTagsByPackageName {
    [packageName: string]: string[];
}

export interface PackageJSON {
    private?: boolean;
    version: string;
    name: string;
    main?: string;
    scripts?: { [command: string]: string };
    config?: {
        additionalTsTypings?: string[];
    };
}

export interface Package {
    location: string;
    packageJson: PackageJSON;
}

export interface ExportPathToExportedItems {
    [pkgName: string]: string[];
}
