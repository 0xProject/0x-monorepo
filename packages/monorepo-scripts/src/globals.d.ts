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

declare module 'promisify-child-process';
declare module '@lerna/batch-packages';
