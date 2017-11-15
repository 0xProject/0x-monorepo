declare module 'dirty-chai';

// es6-promisify declarations
declare function promisify(original: any, settings?: any): ((...arg: any[]) => Promise<any>);
declare module 'es6-promisify' {
    export = promisify;
}
