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
