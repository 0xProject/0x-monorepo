declare module '*.json' {
    const json: any;
    /* tslint:disable */
    export default json;
    /* tslint:enable */
}

declare module 'chai' {
    global {
        export namespace Chai {
            export interface Assertion {
                revertWith: (expected: string | RevertError) => Promise<void>;
            }
        }
    }
}
