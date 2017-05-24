import * as ethUtil from 'ethereumjs-util';

/**
 * Elliptic Curve signature
 */
export interface ECSignature {
    v: number;
    r: string;
    s: string;
}

export type ETHAddress = string;

export class ZeroEx {
    /**
     * Checks if the signature is valid
     */
    public static isValidSignature(data: string, signature: ECSignature, signer: ETHAddress): boolean {
        const dataBuff = ethUtil.toBuffer(data);
        const msgHashBuff = ethUtil.hashPersonalMessage(dataBuff);
        try {
            const pubKey = ethUtil.ecrecover(msgHashBuff,
                signature.v,
                ethUtil.toBuffer(signature.r),
                ethUtil.toBuffer(signature.s));
            const retrievedAddress = ethUtil.bufferToHex(ethUtil.pubToAddress(pubKey));
            return retrievedAddress === signer;
        } catch (err) {
            return false;
        }
    }
}
