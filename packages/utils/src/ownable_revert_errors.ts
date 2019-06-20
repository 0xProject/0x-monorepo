import { RevertError } from './revert_error';

export class OnlyOwnerError extends RevertError {
    constructor(sender?: string, owner?: string) {
        super('OnlyOwnerError', 'OnlyOwnerError(address sender, address owner)', {
            sender,
            owner,
        });
    }
}

// Register the OnlyOwnerError type
RevertError.registerType(OnlyOwnerError);
