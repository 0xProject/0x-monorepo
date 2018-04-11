declare module 'async-child-process';
declare module 'publish-release';
declare module 'es6-promisify';
declare module 'semver-diff';

declare module 'prompt' {
    const start: () => void;
    const get: (promptMessages: string[], callback: (err: Error, result: string) => void) => void;
}

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
        scripts?: { [command: string]: string };
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
