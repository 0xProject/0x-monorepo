export interface UpdatedPackage {
    name: string;
    version: string;
    private: boolean;
}

export interface Changes {
    note: string;
    pr?: number;
}

export interface Changelog {
    timestamp?: number;
    version: string;
    changes: Changes[];
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
