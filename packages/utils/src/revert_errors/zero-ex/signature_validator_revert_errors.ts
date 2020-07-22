import { RevertError } from '../../revert_error';

// tslint:disable:max-classes-per-file

export enum SignatureValidationErrorCodes {
    AlwaysInvalid = 0,
    InvalidLength = 1,
    Unsupported = 2,
    Illegal = 3,
    WrongSigner = 4,
}

export class SignatureValidationError extends RevertError {
    constructor(code?: SignatureValidationErrorCodes, hash?: string, signerAddress?: string, signature?: string) {
        super(
            'SignatureValidationError',
            'SignatureValidationError(uint8 code, bytes32 hash, address signerAddress, bytes signature)',
            {
                code,
                hash,
                signerAddress,
                signature,
            },
        );
    }
}

const types = [SignatureValidationError];

// Register the types we've defined.
for (const type of types) {
    RevertError.registerType(type);
}
