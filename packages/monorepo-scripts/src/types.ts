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

export enum SemVerIndex {
    Invalid,
    Patch,
    Minor,
    Major,
}

export interface PackageToVersionChange {
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

export interface LernaPackage {
    location: string;
    package: {
        private?: boolean;
        version: string;
        name: string;
        main?: string;
        scripts?: { [command: string]: string };
        config?: {
            additionalTsTypings?: string[];
        };
    };
}
