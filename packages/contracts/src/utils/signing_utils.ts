import * as ethUtil from 'ethereumjs-util';

import { SignatureType } from './types';

export const signingUtils = {
    signMessage(message: Buffer, privateKey: Buffer, signatureType: SignatureType): Buffer {
        if (signatureType === SignatureType.Ecrecover) {
            const prefixedMessage = ethUtil.hashPersonalMessage(message);
            const ecSignature = ethUtil.ecsign(prefixedMessage, privateKey);
            const signature = Buffer.concat([
                ethUtil.toBuffer(signatureType),
                ethUtil.toBuffer(ecSignature.v),
                ecSignature.r,
                ecSignature.s,
            ]);
            return signature;
        } else if (signatureType === SignatureType.EIP712) {
            const ecSignature = ethUtil.ecsign(message, privateKey);
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
