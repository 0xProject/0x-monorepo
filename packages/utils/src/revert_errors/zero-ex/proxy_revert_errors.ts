import { RevertError } from '../../revert_error';

// tslint:disable:max-classes-per-file
export class NotImplementedError extends RevertError {
    constructor(selector?: string) {
        super('NotImplementedError', 'NotImplementedError(bytes4 selector)', {
            selector,
        });
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

export class InvalidDieCallerError extends RevertError {
    constructor(caller?: string, expectedCaller?: string) {
        super('InvalidDieCallerError', 'InvalidDieCallerError(address caller, address expectedCaller)', {
            caller,
            expectedCaller,
        });
    }
}

export class BootstrapCallFailedError extends RevertError {
    constructor(target?: string, resultData?: string) {
        super('BootstrapCallFailedError', 'BootstrapCallFailedError(address target, bytes resultData)', {
            target,
            resultData,
        });
    }
}

const types = [BootstrapCallFailedError, InvalidBootstrapCallerError, InvalidDieCallerError, NotImplementedError];

// Register the types we've defined.
for (const type of types) {
    RevertError.registerType(type);
}
