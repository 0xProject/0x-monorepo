import { RevertError } from '../../revert_error';

// tslint:disable:max-classes-per-file
export class NotImplementedError extends RevertError {
    constructor(selector?: string) {
        super('NotImplementedError', 'NotImplementedError(bytes4 selector)', {
            selector,
        });
    }
}

export class AlreadyBootstrappedError extends RevertError {
    constructor() {
        super('AlreadyBootstrappedError', 'AlreadyBootstrappedError()', {});
    }
}

export class InvalidBootstrapCallerError extends RevertError {
    constructor(caller?: string, expectedCaller?: string) {
        super('InvalidBootstrapCallerError', 'InvalidBootstrapCallerError(address caller, address expectedCaller)', {
            caller,
            expectedCaller,
        });
    }
}

const types = [AlreadyBootstrappedError, InvalidBootstrapCallerError, NotImplementedError];

// Register the types we've defined.
for (const type of types) {
    RevertError.registerType(type);
}
