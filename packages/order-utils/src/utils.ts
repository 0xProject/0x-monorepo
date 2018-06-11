import { BigNumber } from '@0xproject/utils';

export const utils = {
    getSignatureTypeIndexIfExists(signature: string): number {
        // tslint:disable-next-line:custom-no-magic-numbers
        const signatureTypeHex = signature.slice(-2);
        const base = 16;
        const signatureTypeInt = parseInt(signatureTypeHex, base);
        return signatureTypeInt;
    },
    getCurrentUnixTimestampSec(): BigNumber {
        const milisecondsInSecond = 1000;
        return new BigNumber(Date.now() / milisecondsInSecond).round();
    },
};
