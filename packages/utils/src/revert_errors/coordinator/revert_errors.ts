import { BigNumber } from '../../configured_bignumber';
import { RevertError } from '../../revert_error';

// tslint:disable:max-classes-per-file

export enum SignatureErrorCodes {
    InvalidLength,
    Unsupported,
    Illegal,
    Invalid,
}

export class SignatureError extends RevertError {
    constructor(errorCode?: SignatureErrorCodes, hash?: string, signature?: string) {
        super('SignatureError', 'SignatureError(uint8 errorCode, bytes32 hash, bytes signature)', {
            errorCode,
            hash,
            signature,
        });
    }
}

export class InvalidOriginError extends RevertError {
    constructor(expectedOrigin?: string) {
        super('InvalidOriginError', 'InvalidOriginError(address expectedOrigin)', { expectedOrigin });
    }
}

export class ApprovalExpiredError extends RevertError {
    constructor(transactionHash?: string, approvalExpirationTime?: BigNumber | number | string) {
        super('ApprovalExpiredError', 'ApprovalExpiredError(bytes32 transactionHash, uint256 approvalExpirationTime)', {
            transactionHash,
            approvalExpirationTime,
        });
    }
}

export class InvalidApprovalSignatureError extends RevertError {
    constructor(transactionHash?: string, approverAddress?: string) {
        super(
            'InvalidApprovalSignatureError',
            'InvalidApprovalSignatureError(bytes32 transactionHash, address approverAddress)',
            { transactionHash, approverAddress },
        );
    }
}

const types = [SignatureError, InvalidOriginError, ApprovalExpiredError, InvalidApprovalSignatureError];

// Register the types we've defined.
for (const type of types) {
    RevertError.registerType(type);
}
