export class Deferred<T> {
    public promise: Promise<T>;
    public reject: (reason: any) => void;
    public resolve: (value: T) => void;
    constructor() {
        // Hack(recmo): Define reject and resolve here so TS does not complain
        //              about them not being defined in the constructor. The
        //              promise we create will overwrite them.
        this.reject = () => {
            throw new Error('Unimplemented reject.');
        };
        this.resolve = () => {
            throw new Error('Unimplemented resolve.');
        };
        this.promise = new Promise((resolve, reject) => {
            this.reject = reject;
            this.resolve = resolve;
        });
    }
}
