// tslint:disable: no-namespace
declare namespace Chai {
    interface Assertion {
        revertWith: (expected: string | RevertError) => Promise<void>;
    }
}
