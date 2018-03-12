declare module 'async-child-process';
declare module 'publish-release';

// semver-sort declarations
declare module 'semver-sort' {
    const desc: (versions: string[]) => string[];
}

declare module '*.json' {
    const value: any;
    export default value;
}
