declare module 'async-child-process';
declare module 'publish-release';
declare module 'semver-diff';

// semver-sort declarations
declare module 'semver-sort' {
    const desc: (versions: string[]) => string[];
}

declare interface LernaPackage {
    location: string;
    package: {
        private?: boolean;
        version: string;
        name: string;
        main?: string;
        config?: {
            additionalTsTypings?: string[];
        };
    };
}
declare function lernaGetPackages(path: string): LernaPackage[];
// lerna-get-packages declarations
declare module 'lerna-get-packages' {
    export = lernaGetPackages;
}

declare module 'promisify-child-process';
