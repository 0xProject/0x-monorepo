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

export interface DocGenConfigs {
    DOC_JSON_VERSION: string;
    EXTERNAL_TYPE_TO_LINK: { [externalType: string]: string };
    EXTERNAL_EXPORT_TO_LINK: { [externalExport: string]: string };
    CLASSES_WITH_HIDDEN_CONSTRUCTORS: string[];
    IGNORED_EXCESSIVE_TYPES: string[];
    TYPES_ONLY_LIBRARIES: string[];
}

export interface ExportPathToExportedItems {
    [pkgName: string]: string[];
}

export interface ExportInfo {
    exportPathToExportedItems: ExportPathToExportedItems;
    exportPathOrder: string[];
}

export interface ExportNameToTypedocNames {
    [exportName: string]: string[];
}
