import * as ethUtil from 'ethereumjs-util';

import { SignatureType } from './types';

export const signingUtils = {
    signMessage(message: Buffer, secretKey: Buffer, signatureType: SignatureType): Buffer {
        if (signatureType === SignatureType.Ecrecover) {
            const prefixedMessage = ethUtil.hashPersonalMessage(message);
            const ecSignature = ethUtil.ecsign(prefixedMessage, secretKey);
            const signature = Buffer.concat([
                ethUtil.toBuffer(signatureType),
                ethUtil.toBuffer(ecSignature.v),
                ecSignature.r,
                ecSignature.s,
            ]);
            return signature;
        } else if (signatureType === SignatureType.EIP712) {
            const ecSignature = ethUtil.ecsign(message, secretKey);
            const signature = Buffer.concat([
                ethUtil.toBuffer(signatureType),
                ethUtil.toBuffer(ecSignature.v),
                ecSignature.r,
                ecSignature.s,
            ]);
            return signature;
        } else {
            throw new Error(`${signatureType} is not a valid signature type`);
        }
    },
};
